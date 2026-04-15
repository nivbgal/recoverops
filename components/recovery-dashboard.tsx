"use client";

import { useEffect, useMemo, useState } from "react";
import {
  analyzeSpendCsv,
  csvColumnLabels,
  requiredCsvColumns
} from "@/lib/csv";
import { runSpendAudit } from "@/lib/detectors";
import { clearSavedAudit, loadSavedAudit, saveAudit } from "@/lib/persistence";
import {
  deriveRecoveryMetrics,
  formatClaimPacket,
  rankFindings
} from "@/lib/recovery-engine";
import type { RecoveryCategory, RecoveryFinding, RecoveryStatus } from "@/types/recovery";
import type { ChangeEvent } from "react";
import type { ColumnMapping, CsvParseResult } from "@/lib/csv";

type RecoveryDashboardProps = {
  initialFindings: RecoveryFinding[];
};

const categories: Array<RecoveryCategory | "all"> = ["all", "Shipping", "SaaS", "Ads", "Contract", "Refund"];

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
  const [rowsScanned, setRowsScanned] = useState(0);
  const [importMessage, setImportMessage] = useState("Sample audit loaded. Upload CSV to run a real audit.");
  const [csvReport, setCsvReport] = useState<CsvParseResult | null>(null);
  const [pendingCsv, setPendingCsv] = useState<{ text: string; label: string } | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  const metrics = useMemo(() => deriveRecoveryMetrics(findings), [findings]);
  const visibleFindings = useMemo(
    () => (category === "all" ? findings : findings.filter((finding) => finding.category === category)),
    [category, findings]
  );
  const selected = findings.find((finding) => finding.id === selectedId) ?? visibleFindings[0] ?? findings[0];

  useEffect(() => {
    const saved = loadSavedAudit();
    if (!saved?.length) return;
    const ranked = rankFindings(saved);
    setFindings(ranked);
    setSelectedId(ranked[0].id);
    setImportMessage("Restored saved audit from this browser.");
  }, []);

  useEffect(() => {
    saveAudit(findings);
  }, [findings]);

  function updateStatus(status: RecoveryStatus) {
    if (!selected) return;
    setFindings((current) => current.map((finding) => (finding.id === selected.id ? { ...finding, status } : finding)));
  }

  function updateNote(note: string) {
    if (!selected) return;
    setFindings((current) => current.map((finding) => (finding.id === selected.id ? { ...finding, note } : finding)));
  }

  async function copyPacket() {
    if (!selected) return;
    await navigator.clipboard.writeText(formatClaimPacket(selected));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  function downloadPacket() {
    if (!selected) return;
    downloadText(
      `${safeFileName(selected.vendor)}-claim-packet.md`,
      [
        "# RecoverOps Claim Packet",
        "",
        `Total recoverable in workspace: ${money.format(metrics.found)}`,
        `Ready to claim: ${money.format(metrics.ready)}`,
        `Recovered: ${money.format(metrics.recovered)}`,
        "",
        formatClaimPacket(selected)
      ].join("\n")
    );
  }

  async function loadSampleAudit() {
    const response = await fetch("/sample-spend-export.csv");
    const text = await response.text();
    runCsvAudit(text, "sample-spend-export.csv");
  }

  async function uploadCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    runCsvAudit(await file.text(), file.name);
    event.target.value = "";
  }

  function runCsvAudit(csvText: string, label: string) {
    const parsed = analyzeSpendCsv(csvText);
    setCsvReport(parsed);
    setColumnMapping({});

    if (parsed.missingRequired.length > 0) {
      setPendingCsv({ text: csvText, label });
      setImportMessage(`Map ${parsed.missingRequired.length} required column(s) before running ${label}.`);
      return;
    }

    setPendingCsv(null);
    completeAudit(parsed, label);
  }

  function applyColumnMapping() {
    if (!pendingCsv) return;
    const parsed = analyzeSpendCsv(pendingCsv.text, columnMapping);
    setCsvReport(parsed);

    if (parsed.missingRequired.length > 0) {
      setImportMessage("Some required columns are still unmapped.");
      return;
    }

    setPendingCsv(null);
    completeAudit(parsed, pendingCsv.label);
  }

  function completeAudit(parsed: CsvParseResult, label: string) {
    const result = runSpendAudit(parsed.rows);
    const nextFindings = result.findings.length > 0 ? rankFindings(result.findings) : rankFindings(initialFindings);

    setRowsScanned(parsed.rows.length);
    setFindings(nextFindings);
    setSelectedId(nextFindings[0]?.id ?? "");
    setCategory("all");
    setImportMessage(
      result.findings.length > 0
        ? `Audited ${parsed.rows.length} rows from ${label}. Found ${result.findings.length} recoveries.`
        : `Audited ${parsed.rows.length} rows from ${label}. No recoveries matched current rules.`
    );
  }

  function clearWorkspace() {
    clearSavedAudit();
    const ranked = rankFindings(initialFindings);
    setFindings(ranked);
    setSelectedId(ranked[0]?.id ?? "");
    setRowsScanned(0);
    setCategory("all");
    setCsvReport(null);
    setPendingCsv(null);
    setColumnMapping({});
    setImportMessage("Workspace reset to sample findings.");
  }

  function selectCategory(nextCategory: RecoveryCategory | "all") {
    setCategory(nextCategory);
    const nextVisible = nextCategory === "all" ? findings : findings.filter((finding) => finding.category === nextCategory);
    if (!nextVisible.some((finding) => finding.id === selectedId) && nextVisible[0]) {
      setSelectedId(nextVisible[0].id);
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">RecoverOps</p>
          <h1>Upload spend exports, find recoverable vendor leakage, and generate claims.</h1>
        </div>
        <div className="topbar-actions" aria-label="Primary actions">
          <label className="button primary">
            Upload CSV
            <input accept=".csv,text/csv" className="file-input" type="file" onChange={uploadCsv} />
          </label>
          <button className="button secondary" type="button" onClick={loadSampleAudit}>Run sample audit</button>
          <a className="button secondary" href="/sample-spend-export.csv" download>Download sample CSV</a>
        </div>
      </header>

      <main className="app-shell">
        <section className="import-panel" aria-label="Audit import controls">
          <div>
            <p className="eyebrow">Pilot workflow</p>
            <h2>CSV audit workspace</h2>
            <p>{importMessage}</p>
          </div>
          <div className="import-actions">
            <button className="button secondary" type="button" onClick={downloadPacket}>Download packet</button>
            <button className="button secondary" type="button" onClick={copyPacket}>{copied ? "Copied" : "Copy packet"}</button>
            <button className="button secondary" type="button" onClick={clearWorkspace}>Reset</button>
          </div>
        </section>

        {csvReport ? (
          <section className="validation-panel" aria-label="CSV validation">
            <div className="validation-summary">
              <div>
                <p className="eyebrow">CSV validation</p>
                <h2>{csvReport.headers.length} columns detected</h2>
                <p>{csvReport.rows.length} valid rows. {csvReport.issues.length} validation message{csvReport.issues.length === 1 ? "" : "s"}.</p>
              </div>
              <div className="detected-columns">
                {csvReport.headers.slice(0, 10).map((header) => <span className="tag" key={header}>{header}</span>)}
              </div>
            </div>

            {pendingCsv ? (
              <div className="mapping-grid">
                {requiredCsvColumns.map((column) => (
                  <label className="mapping-field" key={column}>
                    <span>{csvColumnLabels[column]}</span>
                    <select
                      value={columnMapping[column] ?? ""}
                      onChange={(event) => setColumnMapping((current) => ({ ...current, [column]: event.target.value || undefined }))}
                    >
                      <option value="">Auto-detect</option>
                      {csvReport.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                    </select>
                  </label>
                ))}
                <button className="button primary" type="button" onClick={applyColumnMapping}>Apply mapping</button>
              </div>
            ) : null}

            {csvReport.issues.length > 0 ? (
              <ul className="validation-list">
                {csvReport.issues.slice(0, 6).map((issue) => (
                  <li className={issue.level} key={`${issue.row}-${issue.message}`}>Row {issue.row}: {issue.message}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section className="summary-grid" aria-label="Recovery metrics">
          <Metric label="Rows scanned" value={`${rowsScanned || "sample"}`} helper="CSV lines normalized" />
          <Metric label="Findings" value={`${findings.length}`} helper="Ranked recovery opportunities" />
          <Metric label="Recoverable found" value={money.format(metrics.found)} helper="Across current audit" />
          <Metric label="Ready to claim" value={money.format(metrics.ready)} helper="Evidence packet prepared" />
        </section>

        <section className="workspace">
          <aside className="queue-panel" aria-label="Recovery queue">
            <div className="panel-heading">
              <div><p className="eyebrow">Priority queue</p><h2>Leak findings</h2></div>
              <select aria-label="Filter by category" value={category} onChange={(event) => selectCategory(event.target.value as RecoveryCategory | "all")}>
                {categories.map((item) => <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>)}
              </select>
            </div>
            <div className="finding-list">
              {visibleFindings.map((finding) => (
                <button className={`finding-card${finding.id === selected.id ? " active" : ""}`} key={finding.id} type="button" onClick={() => setSelectedId(finding.id)}>
                  <div className="finding-topline"><span className="tag">{finding.category}</span><span className="amount">{money.format(finding.amount)}</span></div>
                  <strong>{finding.vendor}</strong>
                  <p>{finding.reason}</p>
                  <span className="queue-meta">{finding.status}{finding.note ? " - note saved" : ""}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="detail-panel" aria-live="polite">
            <div className="detail-header">
              <div><p className="eyebrow">{selected.category}</p><h2>{selected.vendor}</h2><p className="detail-subtitle">{selected.reason}</p></div>
              <span className="status-pill">{selected.status}</span>
            </div>
            <div className="packet-grid">
              <Packet label="Recoverable amount" value={money.format(selected.amount)} />
              <Packet label="Confidence" value={`${selected.confidence}%`} />
              <Packet label="Detector" value={selected.detector ?? selected.action} />
            </div>
            <div className="two-column">
              <article className="section-block"><h3>Evidence</h3><ul className="evidence-list">{selected.evidence.map((item) => <li key={item}>{item}</li>)}</ul></article>
              <article className="section-block"><h3>Claim draft</h3><textarea aria-label="Claim draft" readOnly rows={9} value={selected.message} /></article>
            </div>
            <article className="section-block note-block"><h3>Operator note</h3><textarea aria-label="Operator note" placeholder="Add claim context, vendor replies, or next steps." rows={4} value={selected.note ?? ""} onChange={(event) => updateNote(event.target.value)} /></article>
            <div className="action-row">
              <button className="button secondary" type="button" onClick={() => updateStatus("ready")}>Mark ready</button>
              <button className="button secondary" type="button" onClick={() => updateStatus("submitted")}>Mark submitted</button>
              <button className="button primary" type="button" onClick={() => updateStatus("recovered")}>Mark recovered</button>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <article className="metric"><span className="metric-label">{label}</span><strong>{value}</strong><small>{helper}</small></article>;
}

function Packet({ label, value }: { label: string; value: string }) {
  return <article className="packet-block"><span className="block-label">{label}</span><strong>{value}</strong></article>;
}

function downloadText(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(href);
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "recoverops";
}
