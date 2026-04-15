export type RecoveryCategory = "Shipping" | "SaaS" | "Ads" | "Contract" | "Refund";

export type RecoveryStatus = "new" | "ready" | "submitted" | "recovered";

export type RecoveryFinding = {
  id: string;
  vendor: string;
  category: RecoveryCategory;
  amount: number;
  confidence: number;
  status: RecoveryStatus;
  reason: string;
  action: string;
  evidence: string[];
  message: string;
  detector?: string;
  note?: string;
  sourceRows?: string[];
};

export type RecoveryMetrics = {
  found: number;
  ready: number;
  recovered: number;
  averageConfidence: number;
};

export type RecoveryPacket = {
  title: string;
  amount: number;
  confidence: number;
  action: string;
  evidence: string[];
  message: string;
};

export type SpendCategory = RecoveryCategory | "Other";

export type SpendRow = {
  id: string;
  date: string;
  vendor: string;
  category: SpendCategory;
  description: string;
  amount: number;
  quantity?: number;
  status?: string;
  contractRate?: number;
  billedRate?: number;
  activeSeats?: number;
  usedSeats?: number;
  inventoryStatus?: string;
};

export type AuditResult = {
  rows: SpendRow[];
  findings: RecoveryFinding[];
};
