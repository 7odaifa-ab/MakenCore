# Planning Engine Compliance Audit

## Scope
This audit maps the current codebase status against:
- `doc/requirment.md`
- `doc/planning-engine-prd.md`

Status legend:
- `PASS`: implemented and verified
- `PARTIAL`: implemented but incomplete/needs hardening
- `FAIL`: not implemented yet

---

## 1) Dataset Contract & Canonical Reference

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Canonical Mushaf dataset with page-aware references | requirement + PRD §7.1, §12 | PASS | `src/infrastructure/dataset/generators/dataset-generator.ts`, `src/data/CanonicalQuranData.ts` | Implemented as deterministic canonical artifact generated from Hafs v18 with boundary metadata and directional indices. |
| Per-ayah `lineStart`, `lineEnd`, `linesCount`, `isPageEnd`, `isSurahEnd` | PRD §7.1 | PASS | Generator emits canonical and legacy-compatible fields; contract aligned in `src/domain/mushaf/entities/QuranAyahReference.ts` | No critical gap for Phase 1. |
| Thematic metadata (`QUARTER/HIZB/JUZ/NONE`) | requirement + PRD §7.1 | PASS | Thematic extraction is now sourced from `QuranData.Juz`, `QuranData.HizbQaurter`, and `QuranData.Sajda` in `src/data/quran-data.js` (with matching metadata reference in `src/data/quran-data.xml`); emitted as `thematicBreakType` / `thematic_break_type` | No critical gap for Phase 1 thematic boundaries. |
| Forward/reverse index generation + cumulative arrays | PRD §7.1, §12.2 | PASS | `INDEX_MAP_FORWARD/REVERSE`, `RAW_CUMULATIVE_ARRAY_*`, `REVERSE_INDEX_*` in `src/data/CanonicalQuranData.ts` | None critical. |

---

## 2) Rule Pipeline (Stopping Logic)

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Pipeline structure (`advanceByLines -> snapToAyahBoundary -> surah/page/thematic/balance`) | requirement + PRD §7.3, §10 | PASS | `RuleEngine` + handlers implemented with explicit order and metadata trace; terminal stop enforced for surah end; `BalanceCorrectionRule` implemented | Covered by expanded Vitest matrix (`src/tests/domain/planning/rule-engine.test.ts`). |
| Ayah integrity (never cut ayah) | requirement + PRD §7.3 | PASS | `AyahIntegrityRule` path validated in rule-engine suite (forward + reverse interactions via pipeline checks) | Core invariant currently satisfied for covered scenarios. |
| Surah snap threshold behavior | requirement + PRD §7.3 | PASS | `SurahSnapRule` validated in forward + reverse scenarios and strict-threshold non-snap behavior (`rule-engine.test.ts`) | Threshold behavior covered for key edge paths. |
| Page alignment threshold behavior | requirement + PRD §7.3 | PASS | `PageAlignmentRule` with cross-surah page-boundary scanning; isolated page-alignment test coverage in Vitest | Core threshold/page-end snap behavior verified. |
| Thematic halting preference | requirement + PRD §7.3 | PASS | `ThematicHaltingRule` integrated in pipeline with traceable metadata and thematic reason assertions | Thematic stop preference currently active and tested in pipeline flow. |

---

## 3) Multi-Track Scheduling & Balancing

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Multi-track deterministic scheduling | requirement + PRD §7.5 | PASS | `TrackManager` scheduling validated in `epic3-multi-track.test.ts` for deterministic event ordering, multi-day flow, and reverse-direction scheduling | Deterministic execution order is now enforced and tested. |
| Load balancing by configurable weights | PRD §7.6 | PASS | `LoadBalancerService` deterministic allowance tests (normal and catch-up modes) in Epic 3 Vitest suite | Config-driven weight balancing is active and verified. |
| Catch-up/off-day behavior | PRD §7.7 | PASS | Epic 3 integration tests now cover holiday off-days, catch-up memorization suppression, and holiday-over-catchup overlap policy at schedule output level | Core catch-up/off-day scheduling behavior is implemented and tested. |

---

## 4) Validation & QA

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Dataset validation automated checks | requirement §4 + PRD §12.3, §14 | PASS | `src/tests/domain/mushaf/dataset-validation.test.ts` now validates continuity, page markers, typed thematic integrity, weighted page-line bounds, and forward/reverse symmetry | Remaining enhancements are optional hardening (additional edge assertions), not core-gap blockers. |
| Rule-level tests and directional symmetry tests | PRD §14 | PASS | `rule-engine`, `dataset-validation`, and `epic3-multi-track` suites run under Vitest with expanded edge and reverse-direction checks | Current matrix verifies directional and threshold behavior for Phase 2/3 scope. |
| Structured test framework migration | PRD §14.3 | PARTIAL | `vitest` installed and active in `package.json`; `planErrors`, planning rule, dataset validation, and Epic 3 multi-track suites migrated to Vitest and passing | Migration progressed significantly; any remaining non-Vitest checks should be consolidated into Vitest/CI flow. |

---

## 5) API/Persistence Readiness

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| API contracts for preview/generate/estimate/export/dataset validate | PRD §13 + API contracts doc | PASS | `src/infrastructure/api/contracts.ts` aligned to documented contract, with backward-compatible aliases and passing `src/tests/infrastructure/contracts.test.ts` | NestJS endpoint wiring remains integration work, not DTO definition gap. |
| Prisma-oriented persistence model draft | PRD §13 + Prisma draft doc | PASS (Draft) | `doc/planning-engine-prisma-schema-draft.md` | Draft exists; implementation not started. |
| JSON output as the primary data contract | PRD §7.8 | PASS | Engine natively outputs `PlanDay[]` struct | PDF generation is dropped from the Engine's scope (deferred to the consuming app). Excel generation is reduced to a `devDependency` for internal debugging. |

---

## Overall Verdict

Current code **does not yet fully meet all requirements** in `doc/requirment.md` and `doc/planning-engine-prd.md`.

Implementation appears to be at:
- **Phase 1 (Canonical Data Foundation):** complete for current scope (canonical contract, thematic boundaries, deterministic validation)
- **Phase 2 (Core Rule Engine):** complete for current PRD scope in this repository
- **Phase 3 (Advanced Scheduling):** complete for current PRD scope in this repository
- **Phase 4 (API/Data Contracts):** complete (JSON output established as Engine deliverable, presentation formats delegated outside engine)
- **Phase 5 (Application boundary integration):** partially complete (draft)

---

## Priority Next Steps (P0 -> P2)

1. **Application boundary readiness (Phase 5)**
   - Finalize use-case service boundaries mapping the generated JSON data to API endpoints.
   - Draft and finalize the PostgreSQL schema translation via Prisma.

2. **CI hardening**
   - Keep Vitest regression command stable for migrated suites.

---

## 8) Latest Verified Execution Snapshot

- `npm run test:vitest -- src/tests/domain/planning/rule-engine.test.ts src/tests/domain/planning/epic3-multi-track.test.ts src/tests/domain/mushaf/dataset-validation.test.ts src/tests/planErrors.test.ts` → PASS (31/31 tests)

These runs confirm progress in Phase 2 hardening and QA migration while Phases 3–5 remain partially complete.

---

## 6) Phase Continuation Plan (Remaining Phases)

### Phase 2 — Core Rule Engine (In Progress)

**Objective**
- Close all stopping-pipeline compliance gaps so step outputs are fully deterministic, explainable, and symmetric across directions.

**Completion Criteria**
- Rule order is fixed and explicitly tested (`advance -> ayah -> surah -> page -> thematic -> balance`).
- Ayah integrity is guaranteed for forward and reverse movement under all threshold combinations.
- Step output metadata includes rule trace (`appliedRules`, `snapReason`, warnings/flags where relevant).
- Rule-level and integration tests pass for representative edge matrices.

**Work Items**
- Finalize invariants in `src/domain/planning/rules/RuleEngine.ts` and each rule handler.
- Harden `SurahSnapRule` and `PageAlignmentRule` threshold semantics against PRD tolerance requirements.
- Introduce/complete typed thematic halting behavior wired into the pipeline.
- Expand test matrix in `src/tests/domain/planning/` for:
  - near-boundary surah/page cases,
  - reverse-direction parity,
  - tolerance band violations and correction behavior.

---

### Phase 3 — Advanced Scheduling (Partial)

**Objective**
- Make multi-track scheduling fully policy-driven and pedagogically balanced with deterministic outcomes.

**Completion Criteria**
- Balancing configuration is consistently applied to all active track families.
- Catch-up and off-day scheduling is integrated end-to-end (not only load-balancer-local logic).
- Multi-track simulation remains deterministic with documented execution ordering.
- Constraint safety holds (review cannot overtake memorized range, direction-safe barriers).

**Work Items**
- Integrate load-balancing policy with schedule-level orchestration and plan-day generation.
- Complete catch-up day + holiday behavior across simulation and event rendering.
- Expand mixed-track integration tests to include reverse plans and review-only variants.
- Validate interaction between balancing and constraints in dense multi-track scenarios.

---

### Phase 4 — API & Data Contracts (Complete)

**Objective**
- Define the Engine's formal output as raw, unopinionated JSON (`PlanDay[]`).

**Completion Criteria**
- Core engine does not depend on heavy presentation libraries (PDFKit, ExcelJS).
- Excel generation is isolated as a `devDependency` strictly for internal visualization and debugging.
- PDF generation is explicitly delegated to the consumptive application layer (NestJS/Frontend).

**Work Items**
- Remove `pdfkit` dependency from `package.json`.
- Move `exceljs` to `devDependencies`.
- Confirm engine natively resolves structured JSON plans internally without presentation tight-coupling.

---

### Phase 5 — Application Boundary Readiness (Draft/Not Started)

**Objective**
- Make the engine cleanly embeddable in future NestJS + Prisma service boundaries.

**Completion Criteria**
- Use-case level service interfaces are defined for preview/generate/estimate/export/validate flows.
- DTO contracts remain stable and version-safe.
- Persistence mapping strategy is documented against Prisma draft schema.
- Integration test strategy exists for API + persistence boundaries.

**Work Items**
- Add application-layer ports/use-cases around the existing domain engine.
- Define repository interfaces and mapping contracts for plan aggregate persistence.
- Prepare integration guidelines from current TypeScript engine into NestJS modules.
- Add targeted boundary tests for contract serialization and persistence mapping assumptions.

---

## 7) Suggested Delivery Sequence (From Current State)

1. Execute Phase 5 boundary preparation for API/persistence embedding.
2. Formulate integration plan for hooking MakenCore as an NPM module within the NestJS parent SaaS backend.
