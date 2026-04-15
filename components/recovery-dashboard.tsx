"use client";

import { useMemo, useState } from "react";
import {
  deriveRecoveryMetrics,
  formatClaimPacket,
  rankFindings
} from "@/lib/recovery-engine";
import type { RecoveryCategory, RecoveryFinding, RecoveryStatus } from "@/types/recovery";

type RecoveryDashboardProps = {
  initialFindings: RecoveryFinding[];
};

const categories: Array<RecoveryCategory | "all"> = ["all", "Shipping", "SaaS", "Ads", "Contract"];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function RecoveryDashboard({ initialFindings }: RecoveryDashboardProps) {
  const [findings, setFindings] = useState(() => rankFindings(initialFindings));
  const [category, setCategory] = useState<RecoveryCategory | "all">("all");
  const [selectedId, setSelectedId] = useState(findings[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const metrics = useMemo(() => deriveRecoveryMetrics(findings), [findings]);
  const visibleFindings = useMemo(
    () => (category === "all" ? findings : findings.filter((finding) => finding.category === category)),
    [category, findings]
  );
  const selected = findings.find((finding) => finding.id === selectedId) ?? visibleFindings[0] ?? findings[0];

  function updateStatus(status: RecoveryStatus) {
    if (!selected) return;
    setFindings((current) =>
      current.map((finding) => (finding.id === selected.id ? { ...finding, status } : finding))
    );
  }

  async function copyPacket() {
    if (!selected) return;
    await navigator.clipboard.writeText(formatClaimPacket(selected));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  function selectCategory(nextCategory: RecoveryCategory | "all") {
    setCategory(nextCategory);
    const nextVisible =
      nextCategory === "all"
        ? findings
        : findings.filter((finding) => finding.category === nextCategory);
    if (!nextVisible.some((finding) => finding.id === selectedId) && nextVisible[0]) {
      setSelectedId(nextVisible[0].id);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">RecoverOps</p>
          <h1>Find recoverable vendor spend before it becomes margin loss.</h1>
        </div>
        <div className="topbar-actions" aria-label="Primary actions">
          <button className="button secondary" type="button" onClick={() => setSelectedId(findings[0].id)}>
            Analyze sample bills
          </button>
          <button className="button primary" type="button" onClick={copyPacket}>
            {copied ? "Copied" : "Copy claim packet"}
          </button>
        </div>
      </header>

      <main className="app-shell">
        <section className="summary-grid" aria-label="Recovery metrics">
          <Metric label="Recoverable found" value={money.format(metrics.found)} helper="Across current audit" />
          <Metric label="Ready to claim" value={money.format(metrics.ready)} helper="Evidence packet prepared" />
          <Metric label="Recovered" value={money.format(metrics.recovered)} helper="Confirmed or credited" />
          <Metric label="Avg confidence" value={`${metrics.averageConfidence}%`} helper="Across ranked findings" />
        </section>

        <section className="workspace">
          <aside className="queue-panel" aria-label="Recovery queue">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Priority queue</p>
                <h2>Leak findings</h2>
              </div>
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(event) => selectCategory(event.target.value as RecoveryCategory | "all")}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "All categories" : item}
                  </option>
                ))}
              </select>
            </div>
            <div className="finding-list">
              {visibleFindings.map((finding) => (
                <button
                  className={`finding-card${finding.id === selected.id ? " active" : ""}`}
                  key={finding.id}
                  type="button"
                  onClick={() => setSelectedId(finding.id)}
                >
                  <div className="finding-topline">
                    <span className="tag">{finding.category}</span>
                    <span className="amount">{money.format(finding.amount)}</span>
                  </div>
                  <strong>{finding.vendor}</strong>
                  <p>{finding.reason}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="detail-panel" aria-live="polite">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{selected.category}</p>
                <h2>{selected.vendor}</h2>
                <p className="detail-subtitle">{selected.reason}</p>
              </div>
              <span className="status-pill">{selected.status}</span>
            </div>

            <div className="packet-grid">
              <Packet label="Recoverable amount" value={money.format(selected.amount)} />
              <Packet label="Confidence" value={`${selected.confidence}%`} />
              <Packet label="Recommended action" value={selected.action} />
            </div>

            <div className="two-column">
              <article className="section-block">
                <h3>Evidence</h3>
                <ul className="evidence-list">
                  {selected.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="section-block">
                <h3>Claim draft</h3>
                <textarea aria-label="Claim draft" readOnly rows={9} value={selected.message} />
              </article>
            </div>

            <div className="action-row">
              <button className="button secondary" type="button" onClick={() => updateStatus("ready")}>
                Mark ready
              </button>
              <button className="button secondary" type="button" onClick={() => updateStatus("submitted")}>
                Mark submitted
              </button>
              <button className="button primary" type="button" onClick={() => updateStatus("recovered")}>
                Mark recovered
              </button>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <article className="metric">
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function Packet({ label, value }: { label: string; value: string }) {
  return (
    <article className="packet-block">
      <span className="block-label">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
