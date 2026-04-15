import type { SpendCategory, SpendRow } from "@/types/recovery";

type CsvRecord = Record<string, string>;

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
  const rows = parseCsv(csvText.trim());
  return rows
    .map(normalizeRow)
    .filter((row) => row.vendor && Number.isFinite(row.amount));
}

function normalizeRow(record: CsvRecord, index: number): SpendRow {
  const vendor = read(record, "vendor", "merchant", "supplier");
  const date = read(record, "date", "transactionDate", "invoiceDate");
  const rawCategory = read(record, "category", "type").toLowerCase();
  const category = categoryMap[rawCategory] ?? "Other";
  const description = read(record, "description", "memo", "details");
  const amount = toNumber(read(record, "amount", "charge", "billedAmount"));

  return {
    id: read(record, "id", "invoiceId", "transactionId") || `row-${index + 1}`,
    date,
    vendor,
    category,
    description,
    amount,
    quantity: toOptionalNumber(read(record, "quantity", "units", "shipments")),
    status: read(record, "status", "state"),
    contractRate: toOptionalNumber(read(record, "contractRate", "expectedRate")),
    billedRate: toOptionalNumber(read(record, "billedRate", "actualRate")),
    activeSeats: toOptionalNumber(read(record, "activeSeats", "paidSeats")),
    usedSeats: toOptionalNumber(read(record, "usedSeats", "activeUsers")),
    inventoryStatus: read(record, "inventoryStatus", "inventory")
  };
}

function parseCsv(text: string): CsvRecord[] {
  const table = splitCsv(text);
  const [headerRow, ...dataRows] = table;
  if (!headerRow || dataRows.length === 0) return [];

  const headers = headerRow.map((header) => normalizeHeader(header));
  return dataRows
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) =>
      headers.reduce<CsvRecord>((record, header, index) => {
        record[header] = row[index]?.trim() ?? "";
        return record;
      }, {})
    );
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

function read(record: CsvRecord, ...keys: string[]) {
  for (const key of keys) {
    const normalized = normalizeHeader(key);
    if (record[normalized]) return record[normalized];
  }
  return "";
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
