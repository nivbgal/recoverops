import type { RecoveryFinding } from "@/types/recovery";

const storageKey = "recoverops.audit.v1";

type SavedAudit = {
  findings: RecoveryFinding[];
  savedAt: string;
};

export function loadSavedAudit(): RecoveryFinding[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SavedAudit;
    return Array.isArray(parsed.findings) ? parsed.findings : null;
  } catch {
    return null;
  }
}

export function saveAudit(findings: RecoveryFinding[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      findings,
      savedAt: new Date().toISOString()
    })
  );
}

export function clearSavedAudit() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
}
