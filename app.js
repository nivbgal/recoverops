const findings = [
  {
    id: "ship-001",
    vendor: "Northstar Freight",
    category: "Shipping",
    amount: 18420,
    confidence: 94,
    status: "ready",
    reason: "Carrier invoices include residential surcharge lines that conflict with the merchant's negotiated B2B rate card.",
    action: "Submit refund claim",
    evidence: [
      "37 invoices contain residential surcharge code RS-18 on commercial addresses.",
      "Contract exhibit B excludes RS-18 for verified commercial destinations.",
      "Comparable February shipment lanes were billed without the surcharge."
    ],
    message: "Hi Northstar team,\n\nWe reviewed recent invoices and found 37 residential surcharge lines applied to verified commercial delivery addresses. Our current rate card excludes RS-18 for these lanes. Please review the attached invoice list and issue a credit for $18,420 or confirm the adjustment timeline.\n\nThanks,\nRecoverOps on behalf of the finance team"
  },
  {
    id: "saas-002",
    vendor: "StackSeat",
    category: "SaaS",
    amount: 7320,
    confidence: 89,
    status: "new",
    reason: "The account is paying for 61 active seats, but only 43 users logged in during the last 60 days.",
    action: "Request seat credit",
    evidence: [
      "18 paid seats show no login activity for 60 days.",
      "Annual plan allows seat true-down credits at renewal.",
      "Three former contractors remain billable in the admin export."
    ],
    message: "Hi StackSeat support,\n\nWe identified 18 inactive seats on the current annual plan, including three former contractors. The account appears eligible for a renewal credit or immediate true-down under the plan terms. Please confirm the available credit and the steps needed to remove the inactive users.\n\nThanks,\nRecoverOps"
  },
  {
    id: "ads-003",
    vendor: "Meta Ads",
    category: "Ads",
    amount: 12175,
    confidence: 82,
    status: "submitted",
    reason: "Campaign spend continued for two paused SKUs after inventory reached zero, with no conversion events for nine days.",
    action: "Escalate billing review",
    evidence: [
      "SKU inventory reached zero on March 19.",
      "Two campaigns spent $12,175 from March 20 to March 29.",
      "No purchase events were attributed during the spend window."
    ],
    message: "Hi billing team,\n\nWe are requesting review of spend on two campaigns that continued after the advertised SKUs reached zero inventory. The campaigns generated no purchase events during the affected period. Please review whether a billing adjustment or platform credit is available for the attached campaign IDs.\n\nThanks,\nRecoverOps"
  },
  {
    id: "contract-004",
    vendor: "BrightBox Fulfillment",
    category: "Contract",
    amount: 22400,
    confidence: 91,
    status: "new",
    reason: "Monthly minimums were charged despite documented outage days that qualify for service-level credits.",
    action: "Claim SLA credit",
    evidence: [
      "Three outage windows exceeded the contract's four-hour SLA threshold.",
      "March minimum commitment was billed in full.",
      "Support tickets confirm affected pick-and-pack operations."
    ],
    message: "Hi BrightBox account team,\n\nWe are requesting SLA credit review for March. Three documented outage windows exceeded the service-level threshold, while the monthly minimum was billed in full. Please review the attached ticket references and confirm the credit amount available under the agreement.\n\nThanks,\nRecoverOps"
  }
];

let selectedId = findings[0].id;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const list = document.getElementById("findingList");
const filter = document.getElementById("categoryFilter");
const metricFound = document.getElementById("metricFound");
const metricReady = document.getElementById("metricReady");
const metricRecovered = document.getElementById("metricRecovered");
const selectedCategory = document.getElementById("selectedCategory");
const selectedTitle = document.getElementById("selectedTitle");
const selectedReason = document.getElementById("selectedReason");
const selectedStatus = document.getElementById("selectedStatus");
const selectedAmount = document.getElementById("selectedAmount");
const selectedConfidence = document.getElementById("selectedConfidence");
const selectedAction = document.getElementById("selectedAction");
const evidenceList = document.getElementById("evidenceList");
const messageDraft = document.getElementById("messageDraft");

function visibleFindings() {
  if (filter.value === "all") return findings;
  return findings.filter((finding) => finding.category === filter.value);
}

function selectedFinding() {
  return findings.find((finding) => finding.id === selectedId) || findings[0];
}

function renderMetrics() {
  const found = findings.reduce((sum, finding) => sum + finding.amount, 0);
  const ready = findings
    .filter((finding) => finding.status === "ready" || finding.status === "submitted")
    .reduce((sum, finding) => sum + finding.amount, 0);
  const recovered = findings
    .filter((finding) => finding.status === "recovered")
    .reduce((sum, finding) => sum + finding.amount, 0);

  metricFound.textContent = money.format(found);
  metricReady.textContent = money.format(ready);
  metricRecovered.textContent = money.format(recovered);
}

function renderList() {
  list.innerHTML = "";
  visibleFindings().forEach((finding) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `finding-card${finding.id === selectedId ? " active" : ""}`;
    card.innerHTML = `
      <div class="finding-topline">
        <span class="tag">${finding.category}</span>
        <span class="amount">${money.format(finding.amount)}</span>
      </div>
      <strong>${finding.vendor}</strong>
      <p>${finding.reason}</p>
    `;
    card.addEventListener("click", () => {
      selectedId = finding.id;
      render();
    });
    list.appendChild(card);
  });
}

function renderDetail() {
  const finding = selectedFinding();
  selectedCategory.textContent = finding.category;
  selectedTitle.textContent = finding.vendor;
  selectedReason.textContent = finding.reason;
  selectedStatus.textContent = finding.status;
  selectedAmount.textContent = money.format(finding.amount);
  selectedConfidence.textContent = `${finding.confidence}%`;
  selectedAction.textContent = finding.action;
  messageDraft.value = finding.message;

  evidenceList.innerHTML = "";
  finding.evidence.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    evidenceList.appendChild(li);
  });
}

function render() {
  renderMetrics();
  renderList();
  renderDetail();
}

filter.addEventListener("change", () => {
  const visible = visibleFindings();
  if (!visible.some((finding) => finding.id === selectedId) && visible[0]) {
    selectedId = visible[0].id;
  }
  render();
});

document.querySelectorAll("[data-status]").forEach((button) => {
  button.addEventListener("click", () => {
    const finding = selectedFinding();
    finding.status = button.dataset.status;
    render();
  });
});

document.getElementById("simulateUpload").addEventListener("click", () => {
  selectedId = findings[0].id;
  filter.value = "all";
  render();
});

document.getElementById("copyPacket").addEventListener("click", async () => {
  const finding = selectedFinding();
  const packet = [
    `Vendor: ${finding.vendor}`,
    `Category: ${finding.category}`,
    `Recoverable amount: ${money.format(finding.amount)}`,
    `Confidence: ${finding.confidence}%`,
    `Recommended action: ${finding.action}`,
    "",
    "Evidence:",
    ...finding.evidence.map((item) => `- ${item}`),
    "",
    "Draft:",
    messageDraft.value
  ].join("\n");

  try {
    await navigator.clipboard.writeText(packet);
    document.getElementById("copyPacket").textContent = "Copied";
    setTimeout(() => {
      document.getElementById("copyPacket").textContent = "Copy claim packet";
    }, 1300);
  } catch {
    messageDraft.value = packet;
  }
});

render();
