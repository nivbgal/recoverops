import type { SpendCategory, SpendRow } from "@/types/recovery";

type CsvRecord = Record<string, string>;

export type CsvColumn =
  | "date"
  | "vendor"
  | "category"
  | "description"
  | "amount"
  | "quantity"
  | "status"
  | "contractRate"
  | "billedRate"
  | "activeSeats"
  | "usedSeats"
  | "inventoryStatus";

export type ColumnMapping = Partial<Record<CsvColumn, string>>;

export type CsvValidationIssue = {
  row: number;
  level: "error" | "warning";
  message: string;
};

export type CsvParseResult = {
  headers: string[];
  rows: SpendRow[];
  issues: CsvValidationIssue[];
  missingRequired: CsvColumn[];
};

export const requiredCsvColumns: CsvColumn[] = ["vendor", "category", "description", "amount"];

export const csvColumnLabels: Record<CsvColumn, string> = {
  date: "Date",
  vendor: "Vendor",
  category: "Category",
  description: "Description",
  amount: "Amount",
  quantity: "Quantity",
  status: "Status",
  contractRate: "Contract rate",
  billedRate: "Billed rate",
  activeSeats: "Active seats",
  usedSeats: "Used seats",
  inventoryStatus: "Inventory status"
};

const columnAliases: Record<CsvColumn, string[]> = {
  date: ["date", "transactionDate", "invoiceDate"],
  vendor: ["vendor", "merchant", "supplier"],
  category: ["category", "type"],
  description: ["description", "memo", "details"],
  amount: ["amount", "charge", "billedAmount"],
  quantity: ["quantity", "units", "shipments"],
  status: ["status", "state"],
  contractRate: ["contractRate", "expectedRate"],
  billedRate: ["billedRate", "actualRate"],
  activeSeats: ["activeSeats", "paidSeats"],
  usedSeats: ["usedSeats", "activeUsers"],
  inventoryStatus: ["inventoryStatus", "inventory"]
};

const categoryMap: Record<string, SpendCategory> = {
  ads: "Ads",
  advertising: "Ads",
  contract: "Contract",
  contracts: "Contract",
  refund: "Refund",
  refunds: "Refund",
  saas: "SaaS",
  shipping: "Shipping"
};

export function parseSpendCsv(csvText: string): SpendRow[] {
  return analyzeSpendCsv(csvText).rows;
}

export function analyzeSpendCsv(csvText: string, mapping: ColumnMapping = {}): CsvParseResult {
  const table = splitCsv(csvText.trim());
  const [headerRow, ...dataRows] = table;
  if (!headerRow || dataRows.length === 0) {
    return {
      headers: [],
      rows: [],
      issues: [{ row: 1, level: "error", message: "CSV must include a header row and at least one data row." }],
      missingRequired: [...requiredCsvColumns]
    };
  }

  const headers = headerRow.map((header) => header.trim()).filter(Boolean);
  const missingRequired = requiredCsvColumns.filter((column) => resolveHeaderIndex(column, headers, mapping) < 0);
  const issues: CsvValidationIssue[] = [];

  if (missingRequired.length > 0) {
    issues.push({
      row: 1,
      level: "error",
      message: `Missing required columns: ${missingRequired.map((column) => csvColumnLabels[column]).join(", ")}.`
    });
  }

  const rows = dataRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((dataRow, index) => normalizeRow(buildRecord(headers, dataRow, mapping), index, index + 2, issues))
    .filter((row): row is SpendRow => row !== null);

  if (rows.length > 0 && rows.every((row) => !row.date)) {
    issues.push({
      row: 1,
      level: "warning",
      message: "No date column was detected. Detectors will still run, but time-window checks are limited."
    });
  }

  return {
    headers,
    rows,
    issues,
    missingRequired
  };
}

function normalizeRow(
  record: CsvRecord,
  index: number,
  rowNumber: number,
  issues: CsvValidationIssue[]
): SpendRow | null {
  const vendor = read(record, "vendor");
  const date = read(record, "date");
  const rawCategory = read(record, "category").toLowerCase();
  const category = categoryMap[rawCategory] ?? "Other";
  const description = read(record, "description");
  const amount = toNumber(read(record, "amount"));

  if (!vendor) {
    issues.push({ row: rowNumber, level: "error", message: "Missing vendor." });
  }
  if (!description) {
    issues.push({ row: rowNumber, level: "error", message: "Missing description." });
  }
  if (!Number.isFinite(amount)) {
    issues.push({ row: rowNumber, level: "error", message: "Amount must be a valid number." });
  }
  if (rawCategory && category === "Other") {
    issues.push({
      row: rowNumber,
      level: "warning",
      message: `Category '${rawCategory}' was normalized to Other.`
    });
  }

  if (!vendor || !description || !Number.isFinite(amount)) return null;

  return {
    id: read(record, "id") || `row-${index + 1}`,
    date,
    vendor,
    category,
    description,
    amount,
    quantity: toOptionalNumber(read(record, "quantity")),
    status: read(record, "status"),
    contractRate: toOptionalNumber(read(record, "contractRate")),
    billedRate: toOptionalNumber(read(record, "billedRate")),
    activeSeats: toOptionalNumber(read(record, "activeSeats")),
    usedSeats: toOptionalNumber(read(record, "usedSeats")),
    inventoryStatus: read(record, "inventoryStatus")
  };
}

function buildRecord(headers: string[], row: string[], mapping: ColumnMapping): CsvRecord {
  const record = headers.reduce<CsvRecord>((current, header, index) => {
    current[normalizeHeader(header)] = row[index]?.trim() ?? "";
    return current;
  }, {});

  for (const column of Object.keys(columnAliases) as CsvColumn[]) {
    const headerIndex = resolveHeaderIndex(column, headers, mapping);
    if (headerIndex >= 0) {
      record[column] = row[headerIndex]?.trim() ?? "";
    }
  }

  return record;
}

function resolveHeaderIndex(column: CsvColumn, headers: string[], mapping: ColumnMapping) {
  const mappedHeader = mapping[column];
  if (mappedHeader) {
    const mappedIndex = headers.findIndex((header) => header === mappedHeader);
    if (mappedIndex >= 0) return mappedIndex;
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  return columnAliases[column]
    .map(normalizeHeader)
    .map((alias) => normalizedHeaders.indexOf(alias))
    .find((index) => index >= 0) ?? -1;
}

function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeHeader(header: string) {
  return header.trim().replace(/[\s_-]+(.)/g, (_, char: string) => char.toUpperCase());
}

function read(record: CsvRecord, key: CsvColumn | "id") {
  return record[normalizeHeader(key)] ?? "";
}

function toNumber(value: string) {
  if (!value.trim()) return Number.NaN;
  return Number(value.replace(/[$,]/g, ""));
}

function toOptionalNumber(value: string) {
  if (!value) return undefined;
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
