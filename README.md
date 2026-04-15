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

This first version is a dependency-free static app. Open `index.html` in a browser to try the dashboard.

It includes:

- recovery KPI dashboard
- prioritized leak queue
- sample vendor findings
- evidence-backed recovery packet
- dispute email draft
- lightweight status workflow

## Repository Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── docs/
│   ├── strategy.md
│   ├── mvp.md
│   ├── competition-plan.md
│   └── backlog.md
└── README.md
```

## Next Build Priorities

1. Add invoice/CSV upload and parsing
2. Add deterministic recovery scoring engine
3. Add persistent claim state
4. Add Perplexity Computer workflow notes for vendor policy research and claim filing
5. Run pilots with 10 to 20 ecommerce/startup operators
