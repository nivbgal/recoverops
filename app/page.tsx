import { RecoveryDashboard } from "@/components/recovery-dashboard";
import { sampleFindings } from "@/data/sample-findings";

export default function Home() {
  return <RecoveryDashboard initialFindings={sampleFindings} />;
}
