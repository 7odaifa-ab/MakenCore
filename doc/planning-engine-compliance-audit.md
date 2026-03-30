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
| Pipeline structure (`advanceByLines -> snapToAyahBoundary -> surah/page/thematic/balance`) | requirement + PRD §7.3, §10 | PARTIAL | `src/domain/planning/rules/RuleEngine.ts` and handlers under `src/domain/planning/rules/handlers/`; deterministic order exposed via `getRuleNamesInOrder()`; terminal stop enforced when surah end is reached | Pipeline hardening progressed, but full PRD invariants and balance-rule maturity are not fully complete yet. |
| Ayah integrity (never cut ayah) | requirement + PRD §7.3 | PARTIAL | Rule handlers and tests exist in planning domain tests | Needs complete invariant suite proving all direction/edge cases. |
| Surah snap threshold behavior | requirement + PRD §7.3 | PARTIAL | `src/domain/planning/rules/handlers/SurahSnapRule.ts`; validated by `src/tests/domain/planning/rule-engine.test.ts` (Vitest) | Core behavior verified, but threshold policy remains minimally configurable and needs broader matrix coverage. |
| Page alignment threshold behavior | requirement + PRD §7.3 | PARTIAL | `src/domain/planning/rules/handlers/PageAlignmentRule.ts` now computes distance consistently and supports cross-surah page-boundary scanning; validated by `src/tests/domain/planning/rule-engine.test.ts` (Vitest) | Canonical semantics still need expanded reverse-direction and edge-threshold coverage. |
| Thematic halting preference | requirement + PRD §7.3 | PARTIAL | Thematic marker info exists in dataset | No robust typed thematic stopping rule layer at full PRD level yet. |

---

## 3) Multi-Track Scheduling & Balancing

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Multi-track deterministic scheduling | requirement + PRD §7.5 | PARTIAL | `src/core/TrackManager.ts` plus `src/tests/domain/planning/epic3-multi-track.test.ts` (Vitest) now verify deterministic allowance behavior and track-event outcomes | Core deterministic behavior is verified for covered paths; broader mixed-track scenario matrix is still pending. |
| Load balancing by configurable weights | PRD §7.6 | PARTIAL | `src/domain/planning/services/LoadBalancerService.ts` | Present, but needs wider policy/config integration and full scenario coverage. |
| Catch-up/off-day behavior | PRD §7.7 | PARTIAL | Catch-up suppression in `LoadBalancerService` and integration checks in `epic3-multi-track.test.ts` now cover holiday off-days (`is_off` with empty events) and catch-up-day memorization suppression at scheduling output level | Additional coverage still needed for multi-day windows, reverse-direction schedules, and holiday/catch-up overlap policies. |

---

## 4) Validation & QA

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Dataset validation automated checks | requirement §4 + PRD §12.3, §14 | PASS | `src/tests/domain/mushaf/dataset-validation.test.ts` now validates continuity, page markers, typed thematic integrity, weighted page-line bounds, and forward/reverse symmetry | Remaining enhancements are optional hardening (additional edge assertions), not core-gap blockers. |
| Rule-level tests and directional symmetry tests | PRD §14 | PARTIAL | `rule-engine`, `dataset-validation`, and `epic3-multi-track` suites run under Vitest and currently pass together (14/14 tests) | Still needs broader edge-case matrix for all threshold combinations and reverse scenarios. |
| Structured test framework migration | PRD §14.3 | PARTIAL | `vitest` installed and active in `package.json`; `planErrors`, planning rule, dataset validation, and Epic 3 multi-track suites migrated to Vitest and passing | Migration progressed significantly; any remaining non-Vitest checks should be consolidated into Vitest/CI flow. |

---

## 5) API/Persistence/Export Readiness

| Requirement | Source | Status | Evidence | Gap |
| --- | --- | --- | --- | --- |
| API contracts for preview/generate/estimate/export/dataset validate | PRD §13 + API contracts doc | PASS | `src/infrastructure/api/contracts.ts` aligned to documented contract, with backward-compatible aliases and passing `src/tests/infrastructure/contracts.test.ts` | NestJS endpoint wiring remains integration work, not DTO definition gap. |
| Prisma-oriented persistence model draft | PRD §13 + Prisma draft doc | PASS (Draft) | `doc/planning-engine-prisma-schema-draft.md` | Draft exists; implementation not started. |
| Export layer modernization (Excel + PDF adapters) | PRD §7.8, §15 | PARTIAL | Existing export capability present in repo | Not fully refactored into final adapter architecture with complete PDF flow guarantees. |

---

## Overall Verdict

Current code **does not yet fully meet all requirements** in `doc/requirment.md` and `doc/planning-engine-prd.md`.

Implementation appears to be at:
- **Phase 1 (Canonical Data Foundation):** complete for current scope (canonical contract, thematic boundaries, deterministic validation)
- **Phase 2+ (Rules, scheduling maturity, exports, API/persistence integration):** partially complete

---

## Priority Next Steps (P0 -> P2)

1. **Expand rule hardening coverage**
   - Keep current deterministic rule-order + terminal-surah behavior.
   - Add reverse-direction and threshold-edge matrix tests for surah/page/thematic rules.

2. **Continue Vitest migration**
   - Consolidate migrated suites under a stable CI/local command path.
   - Remove transitional/manual test execution paths once CI coverage is accepted.

3. **Export-layer modernization**
   - Continue refactor toward adapter-based Excel/PDF export architecture and verify contract compatibility.

---

## 8) Latest Verified Execution Snapshot

- `npm run test:vitest -- src/tests/planErrors.test.ts src/tests/domain/planning/epic3-multi-track.test.ts src/tests/domain/planning/rule-engine.test.ts src/tests/domain/mushaf/dataset-validation.test.ts` → PASS (26/26 tests)

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

### Phase 4 — Export Layer (Partial)

**Objective**
- Deliver a stable adapter-based export boundary supporting operational Excel and printable PDF output.

**Completion Criteria**
- Export is refactored into clear adapters (Excel and PDF responsibilities separated).
- Dynamic columns render correctly based on active tracks.
- Off-day/catch-up visual states are preserved in exported artifacts.
- PDF row integrity is guaranteed (single day not split unexpectedly).

**Work Items**
- Complete adapter refactor of the current export flow.
- Implement/finish PDF adapter with printable layout constraints.
- Add export-focused tests (structure checks and snapshot-style verification where appropriate).
- Verify contract compatibility with `src/infrastructure/api/contracts.ts` export DTO shape.

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

1. Finish Phase 2 rule hardening and full rule test matrix.
2. Complete Phase 3 scheduling integration (balancing + catch-up/off-day).
3. Finalize Phase 4 export adapter architecture and PDF readiness.
4. Execute Phase 5 boundary preparation for API/persistence embedding.

This sequence preserves dependency order and minimizes rework risk across planning, export, and integration layers.
