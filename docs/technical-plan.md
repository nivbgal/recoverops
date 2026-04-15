# Technical Plan

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- CSS without a component framework
- In-memory sample data for the first demo

## Modules

- `data/sample-findings.ts`: realistic recovery findings for the pitch demo
- `types/recovery.ts`: typed recovery domain model
- `lib/recovery-engine.ts`: ranking, metrics, and claim packet generation
- `components/recovery-dashboard.tsx`: interactive demo workflow
- `app/api/recovery/route.ts`: JSON endpoint for findings and metrics

## Next Engineering Steps

1. Add CSV upload for invoice exports
2. Parse vendor rows into a normalized billing model
3. Extend `recovery-engine.ts` with rule-based detectors
4. Add persistence with SQLite or Postgres
5. Add Perplexity-assisted policy research per finding
6. Add human approval and email sending

## First Detector Candidates

- duplicate vendor charge
- inactive SaaS seat
- contract fee mismatch
- missed service credit
- shipping surcharge mismatch
- ad spend after inventory outage
