# MVP Specification

## Goal

Ship a working demo that makes one thing obvious:

> RecoverOps finds real money and gives the operator a ready-to-send recovery action.

## In Scope

- recovery dashboard
- CSV upload for invoice/vendor findings
- sample CSV audit
- claim packet view
- evidence and policy references
- dispute/refund email draft
- claim status tracker
- basic interaction with local sample data
- JSON endpoint for recovery metrics and findings
- browser persistence for status and notes
- downloadable claim packet

## Out of Scope For First Commit

- authentication
- real bank connections
- OCR
- accounting system sync
- autonomous vendor portal submission
- paid billing
- full AI model integration

## Core Workflow

1. Operator opens dashboard
2. RecoverOps shows dollars found, claimed, and recovered
3. Operator uploads a CSV or runs the sample audit
4. RecoverOps parses rows and runs rule detectors
5. Operator selects a finding from the prioritized queue
6. RecoverOps displays evidence, confidence, recommended action, and draft email
7. Operator marks the claim as ready, submitted, or recovered
8. Operator downloads a claim packet

## Recovery Finding Model

Each finding should include:

- vendor
- category
- recoverable amount
- confidence
- status
- reason
- evidence list
- recommended action
- draft message
- due date or urgency

## Future Technical Architecture

The first production version should become a single web app with:

- Next.js app shell
- typed recovery engine module
- upload parser for CSV/PDF exports
- SQLite or Postgres persistence
- background tasks for claim follow-up
- Perplexity-powered vendor policy research
- email and browser-agent assisted filing

## Acceptance Criteria

- A user can understand the product in 30 seconds
- A user can select a finding and see why it matters
- A recovery packet can be copied or acted on
- Dashboard metrics update when claim status changes
- CSV sample generates multiple detector-backed findings
- Statuses and notes survive browser refresh
- The demo works through `npm run dev`
