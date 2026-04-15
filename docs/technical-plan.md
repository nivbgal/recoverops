# Technical Plan

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- CSS without a component framework
- Browser CSV parsing and localStorage persistence
- In-memory sample data plus sample CSV for the first demo

## Modules

- `data/sample-findings.ts`: realistic recovery findings for the pitch demo
- `types/recovery.ts`: typed recovery domain model
- `lib/csv.ts`: browser CSV parsing and row normalization
- `lib/detectors.ts`: rule-based recovery detector engine
- `lib/persistence.ts`: browser workspace persistence
- `lib/recovery-engine.ts`: ranking, metrics, and claim packet generation
- `components/recovery-dashboard.tsx`: interactive demo workflow
- `app/api/recovery/route.ts`: JSON endpoint for findings and metrics

## Next Engineering Steps

1. Add column mapping and row-level validation messages
2. Add vendor-specific templates for Shopify, Stripe, FedEx/UPS, and SaaS exports
3. Move persistence to SQLite or Postgres when pilot collaboration needs it
4. Add Perplexity-assisted policy research per finding
5. Add human approval and email sending
6. Add browser-agent assisted vendor portal workflows

## First Detector Candidates

- duplicate vendor charge
- inactive SaaS seat
- contract fee mismatch
- missed service credit
- shipping surcharge mismatch
- ad spend after inventory outage
