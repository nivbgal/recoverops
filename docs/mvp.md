# MVP Specification

## Goal

Ship a working demo that makes one thing obvious:

> RecoverOps finds real money and gives the operator a ready-to-send recovery action.

## In Scope

- recovery dashboard
- sample invoice/vendor findings
- claim packet view
- evidence and policy references
- dispute/refund email draft
- claim status tracker
- basic interaction without external dependencies

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
3. Operator selects a finding from the prioritized queue
4. RecoverOps displays evidence, confidence, recommended action, and draft email
5. Operator marks the claim as ready, submitted, or recovered

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
- The demo works by opening `index.html`
