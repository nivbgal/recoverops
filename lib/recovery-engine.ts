import type { RecoveryFinding, RecoveryMetrics, RecoveryPacket } from "@/types/recovery";

const readyStatuses = new Set(["ready", "submitted"]);

export function deriveRecoveryMetrics(findings: RecoveryFinding[]): RecoveryMetrics {
  const found = findings.reduce((sum, finding) => sum + finding.amount, 0);
  const ready = findings
    .filter((finding) => readyStatuses.has(finding.status))
    .reduce((sum, finding) => sum + finding.amount, 0);
  const recovered = findings
    .filter((finding) => finding.status === "recovered")
    .reduce((sum, finding) => sum + finding.amount, 0);
  const averageConfidence =
    findings.length === 0
      ? 0
      : Math.round(
          findings.reduce((sum, finding) => sum + finding.confidence, 0) / findings.length
        );

  return {
    found,
    ready,
    recovered,
    averageConfidence
  };
}

export function rankFindings(findings: RecoveryFinding[]): RecoveryFinding[] {
  return [...findings].sort((a, b) => {
    const aScore = a.amount * (a.confidence / 100);
    const bScore = b.amount * (b.confidence / 100);
    return bScore - aScore;
  });
}

export function createRecoveryPacket(finding: RecoveryFinding): RecoveryPacket {
  return {
    title: `${finding.vendor} ${finding.category.toLowerCase()} recovery`,
    amount: finding.amount,
    confidence: finding.confidence,
    action: finding.action,
    evidence: finding.evidence,
    message: finding.message
  };
}

export function formatClaimPacket(finding: RecoveryFinding): string {
  const packet = createRecoveryPacket(finding);
  return [
    `Recovery: ${packet.title}`,
    `Recoverable amount: ${currency(packet.amount)}`,
    `Confidence: ${packet.confidence}%`,
    `Recommended action: ${packet.action}`,
    finding.detector ? `Detector: ${finding.detector}` : "",
    finding.note ? `Operator note: ${finding.note}` : "",
    "",
    "Evidence:",
    ...packet.evidence.map((item) => `- ${item}`),
    "",
    "Draft:",
    packet.message
  ].filter(Boolean).join("\n");
}

function currency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}
