# Epic 04 — Export, API Contracts, and Persistence Readiness

## Goal
Prepare the engine for production use by defining export, API, and persistence boundaries.

## Why this epic matters
The engine must not remain only a simulation script. It needs stable contracts so it can be embedded in a backend service and later exposed through APIs.

## Scope

### Included
- export adapters for Excel and PDF
- API request/response contracts
- Prisma schema draft
- persistence-ready plan models
- share-code and folder-ready schema extensions
- DTO design

### Excluded
- actual authentication implementation
- UI implementation
- full production deployment setup

## Backend Tasks

### 1. Refactor exporters
- split Excel export into a dedicated adapter
- implement PDF export adapter
- support dynamic columns based on active tracks
- preserve day grouping and teacher review fields

### 2. Define service contracts
- generate preview endpoint contract
- generate final plan contract
- estimate completion contract
- export contract
- dataset validation contract

### 3. Draft Prisma schema
- plans
- plan_tracks
- plan_days
- plan_events
- plan_presets
- mushaf_references
- share_codes
- plan_folders

### 4. Prepare repository boundaries
- define persistence repositories
- keep engine pure from database concerns
- define mappers between domain and persistence models

### 5. Add contract tests
- validate request payloads
- validate response shapes
- validate export metadata structure

## Acceptance Criteria
- Export adapters work from a stable plan model
- API contracts are documented and implementable
- Prisma draft covers the needed domain entities
- Engine logic remains independent from persistence concerns

## Deliverables
- exporter adapters
- API contract document
- Prisma schema draft
- repository mapping notes
