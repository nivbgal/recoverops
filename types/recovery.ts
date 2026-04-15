export type RecoveryCategory = "Shipping" | "SaaS" | "Ads" | "Contract";

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
