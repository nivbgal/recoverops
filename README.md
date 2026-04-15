# RecoverOps

RecoverOps is an AI finance agent for ecommerce brands and startups. It finds recoverable money hidden in invoices, vendor statements, credits, refunds, and billing portals, then turns each opportunity into a claim packet the team can approve and send.

The first promise is simple:

> Connect your bills. Recover money you are already owed.

## Why This Exists

Most small finance teams do not have time to audit every vendor charge. They leak money through duplicate SaaS seats, shipping fee errors, missed credits, late refunds, ad platform billing anomalies, and poorly tracked vendor promises.

RecoverOps starts with one high-value workflow:

1. Ingest invoice and vendor data
2. Detect likely recoveries
3. Explain the evidence
4. Draft the dispute or refund request
5. Track dollars found, claimed, and recovered

## Competition Thesis

RecoverOps is built for Perplexity's Billion Dollar Build: a narrow, demoable wedge with direct ROI and a credible path toward an autonomous finance operations platform.

It is designed to show a judge or pilot customer value in under a minute:

- dollars found
- evidence gathered
- claim drafted
- next action tracked

## Initial Customer

Best-fit early customers:

- Shopify and DTC brands with shipping, ad, SaaS, and contractor spend
- Seed to Series B startups with fragmented vendor billing
- Agencies managing many subscriptions and client pass-through expenses

Primary buyer:

- Founder
- COO
- Head of Finance
- Finance Ops lead

## Current Demo

This version is a Next.js app with a typed recovery engine, sample findings, a dashboard, a claim packet workflow, and a JSON recovery API.

It includes:

- recovery KPI dashboard
- prioritized leak queue
- CSV upload and sample spend export
- column detection, validation, and manual mapping for messy exports
- browser-based recovery detectors
- evidence-backed recovery packet
- dispute email draft
- saved notes and claim status in the browser
- lightweight status workflow

## Local Development

```bash
npm install
npm run dev
```

Build and typecheck:

```bash
npm run typecheck
npm run build
```

## Next Build Priorities

1. Add vendor-specific templates for Shopify, Stripe, FedEx/UPS, and SaaS exports
2. Add SQLite or Postgres persistence for shared pilot workspaces
3. Add Perplexity Computer workflow notes for vendor policy research and claim filing
4. Add email export/send integration
5. Run pilots with 10 to 20 ecommerce/startup operators
