import type { AuditResult, RecoveryFinding, RecoveryStatus, SpendRow } from "@/types/recovery";

type Detector = (rows: SpendRow[]) => RecoveryFinding[];
type DraftFinding = Omit<RecoveryFinding, "status"> & {
  status?: RecoveryStatus;
};

const detectors: Detector[] = [
  detectDuplicateCharges,
  detectInactiveSeats,
  detectShippingRateMismatch,
  detectMissedRefunds,
  detectAdSpendAfterStockout
];

export function runSpendAudit(rows: SpendRow[]): AuditResult {
  const findings = detectors.flatMap((detector) => detector(rows));
  return {
    rows,
    findings: findings.sort((a, b) => b.amount * b.confidence - a.amount * a.confidence)
  };
}

function detectDuplicateCharges(rows: SpendRow[]): RecoveryFinding[] {
  const grouped = new Map<string, SpendRow[]>();
  for (const row of rows) {
    const key = [
      row.vendor.toLowerCase(),
      row.category,
      row.description.toLowerCase(),
      row.amount.toFixed(2)
    ].join("|");
    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .filter((group) => group.length > 1 && group[0].amount > 0)
    .map((group) => {
      const row = group[0];
      const extraCharges = group.length - 1;
      return makeFinding({
        id: `dup-${row.id}`,
        vendor: row.vendor,
        category: row.category === "Other" ? "Contract" : row.category,
        amount: row.amount * extraCharges,
        confidence: 92,
        detector: "Duplicate charge",
        reason: `${group.length} matching charges were found for the same vendor, amount, and description.`,
        action: "Request duplicate charge reversal",
        evidence: group.map((item) => `${item.date}: ${item.description} for ${currency(item.amount)}`),
        message: `Hi ${row.vendor} team,\n\nWe found ${group.length} matching charges for ${row.description}. Please review the duplicate billing and issue a credit for ${currency(row.amount * extraCharges)} or confirm why each charge is valid.\n\nThanks,\nRecoverOps`,
        sourceRows: group.map((item) => item.id)
      });
    });
}

function detectInactiveSeats(rows: SpendRow[]): RecoveryFinding[] {
  return rows
    .filter(
      (row) =>
        row.category === "SaaS" &&
        row.activeSeats !== undefined &&
        row.usedSeats !== undefined &&
        row.activeSeats > row.usedSeats &&
        row.activeSeats > 0 &&
        row.amount > 0
    )
    .map((row) => {
      const inactiveSeats = row.activeSeats! - row.usedSeats!;
      const recoverable = Math.round(row.amount * (inactiveSeats / row.activeSeats!));
      return makeFinding({
        id: `seat-${row.id}`,
        vendor: row.vendor,
        category: "SaaS",
        amount: recoverable,
        confidence: 88,
        detector: "Inactive SaaS seats",
        reason: `${inactiveSeats} of ${row.activeSeats} paid seats appear unused.`,
        action: "Request seat true-down or renewal credit",
        evidence: [
          `${row.activeSeats} paid seats in export.`,
          `${row.usedSeats} used seats reported.`,
          `${inactiveSeats} seats are likely recoverable or removable.`
        ],
        message: `Hi ${row.vendor} team,\n\nWe identified ${inactiveSeats} inactive paid seats on the current plan. Please confirm whether a true-down, renewal credit, or immediate seat reduction is available for an estimated ${currency(recoverable)} in avoidable spend.\n\nThanks,\nRecoverOps`,
        sourceRows: [row.id]
      });
    });
}

function detectShippingRateMismatch(rows: SpendRow[]): RecoveryFinding[] {
  return rows
    .filter(
      (row) =>
        row.category === "Shipping" &&
        row.contractRate !== undefined &&
        row.billedRate !== undefined &&
        row.quantity !== undefined &&
        row.billedRate > row.contractRate
    )
    .map((row) => {
      const overage = Math.round((row.billedRate! - row.contractRate!) * row.quantity!);
      return makeFinding({
        id: `ship-${row.id}`,
        vendor: row.vendor,
        category: "Shipping",
        amount: overage,
        confidence: 93,
        detector: "Shipping rate mismatch",
        reason: `Billed rate exceeds contract rate across ${row.quantity} billable units.`,
        action: "Submit rate correction claim",
        evidence: [
          `Contract rate: ${currency(row.contractRate!)}.`,
          `Billed rate: ${currency(row.billedRate!)}.`,
          `Quantity: ${row.quantity}.`
        ],
        message: `Hi ${row.vendor} team,\n\nWe found a rate mismatch on ${row.description}. The billed rate was ${currency(row.billedRate!)} versus the contracted ${currency(row.contractRate!)} across ${row.quantity} units. Please issue a credit for ${currency(overage)} or provide the applicable rate exception.\n\nThanks,\nRecoverOps`,
        sourceRows: [row.id]
      });
    });
}

function detectMissedRefunds(rows: SpendRow[]): RecoveryFinding[] {
  return rows
    .filter((row) => {
      const haystack = `${row.status ?? ""} ${row.description}`.toLowerCase();
      return row.amount > 0 && /credit_due|refund_due|pending credit|unapplied credit|refund owed/.test(haystack);
    })
    .map((row) =>
      makeFinding({
        id: `refund-${row.id}`,
        vendor: row.vendor,
        category: "Refund",
        amount: row.amount,
        confidence: 86,
        detector: "Missed refund or credit",
        reason: "The export marks this charge as a pending refund, credit due, or unapplied credit.",
        action: "Request refund status and credit application",
        evidence: [
          `Status: ${row.status || "not supplied"}.`,
          `Description: ${row.description}.`,
          `Open amount: ${currency(row.amount)}.`
        ],
        message: `Hi ${row.vendor} team,\n\nOur records show an unresolved refund or credit for ${row.description}. Please confirm the status and apply the ${currency(row.amount)} credit or refund to the account.\n\nThanks,\nRecoverOps`,
        sourceRows: [row.id]
      })
    );
}

function detectAdSpendAfterStockout(rows: SpendRow[]): RecoveryFinding[] {
  return rows
    .filter(
      (row) =>
        row.category === "Ads" &&
        row.inventoryStatus?.toLowerCase().replace(/[\s_-]/g, "") === "outofstock" &&
        row.amount > 0
    )
    .map((row) =>
      makeFinding({
        id: `stockout-${row.id}`,
        vendor: row.vendor,
        category: "Ads",
        amount: row.amount,
        confidence: 81,
        detector: "Ad spend after stockout",
        reason: "Spend continued while the promoted inventory was out of stock.",
        action: "Escalate ad billing review",
        evidence: [
          `Inventory status: ${row.inventoryStatus}.`,
          `Campaign or SKU: ${row.description}.`,
          `Spend during stockout: ${currency(row.amount)}.`
        ],
        message: `Hi ${row.vendor} billing team,\n\nWe are requesting review of ad spend that continued while inventory was marked out of stock for ${row.description}. Please review whether a platform credit or billing adjustment is available for ${currency(row.amount)}.\n\nThanks,\nRecoverOps`,
        sourceRows: [row.id]
      })
    );
}

function makeFinding(finding: DraftFinding): RecoveryFinding {
  return {
    status: "new",
    ...finding,
    amount: Math.max(0, Math.round(finding.amount))
  };
}

function currency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}
