import { NextResponse } from "next/server";
import { sampleFindings } from "@/data/sample-findings";
import { deriveRecoveryMetrics, rankFindings } from "@/lib/recovery-engine";

export function GET() {
  const findings = rankFindings(sampleFindings);
  return NextResponse.json({
    metrics: deriveRecoveryMetrics(findings),
    findings
  });
}
