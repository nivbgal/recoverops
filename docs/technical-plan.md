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
- `lib/csv.ts`: browser CSV parsing, header aliasing, manual column mapping, and validation
- `lib/detectors.ts`: rule-based recovery detector engine
- `lib/persistence.ts`: browser workspace persistence
- `lib/recovery-engine.ts`: ranking, metrics, and claim packet generation
- `components/recovery-dashboard.tsx`: interactive demo workflow
- `app/api/recovery/route.ts`: JSON endpoint for findings and metrics

## Next Engineering Steps

1. Add vendor-specific templates for Shopify, Stripe, FedEx/UPS, and SaaS exports
2. Move persistence to SQLite or Postgres when pilot collaboration needs it
3. Add Perplexity-assisted policy research per finding
4. Add human approval and email sending
5. Add browser-agent assisted vendor portal workflows
