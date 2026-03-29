# Backend Development Roadmap — Quran Planning Engine

## Objective
Provide the implementation sequence needed to start backend development for the new planning engine.

---

## Phase 1 — Canonical Data Foundation

### Outcomes
- Mushaf dataset contract finalized
- data import and normalization pipeline created
- validation suite passes
- directional lookup services available

### Tasks
- define canonical ayah reference model
- build dataset generator script
- generate forward/reverse indices
- add page and thematic metadata
- add integrity validation tests

---

## Phase 2 — Core Rule Engine

### Outcomes
- raw movement transformed by planning rules
- ayah integrity preserved
- surah/page/thematic snapping active
- step metadata enriched

### Tasks
- create rule abstractions
- implement rule handlers
- connect rule pipeline to simulator
- update step result contract
- add rule unit tests

---

## Phase 3 — Multi-Track Scheduling

### Outcomes
- mixed-track plans can be simulated safely
- balancing logic controls workload
- off-days and catch-up days are supported

### Tasks
- formalize plan and track definitions
- implement load balancer
- extend constraints
- add catch-up/holiday support
- add mixed-track integration tests

---

## Phase 4 — Export and Contract Layer

### Outcomes
- Excel and PDF export adapters available
- API contracts documented
- Prisma schema draft ready for implementation

### Tasks
- refactor exporter into adapters
- define DTOs for preview/generate/export flows
- draft Prisma schema
- document service boundaries

---

## Phase 5 — SaaS Readiness

### Outcomes
- engine can be embedded in NestJS
- persistence layer can store plan definitions
- future UI/API work can proceed safely

### Tasks
- define repository interfaces
- implement persistence mappers
- prepare plan sharing and folder model
- add integration test strategy

---

## Suggested Execution Order

1. Domain foundation
2. Rule engine
3. Multi-track scheduling
4. Export and contracts
5. Persistence integration

---

## Definition of Done for Backend Start

- canonical dataset exists
- the planning engine has a rule pipeline
- multi-track plans are deterministic
- API contract is stable
- Prisma schema draft is approved
