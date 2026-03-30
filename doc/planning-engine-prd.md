> [!CAUTION]
> **تنبيه:** تم إيقاف الملاحم (Epic Development Stop) في هذا الملف. نعتمد حالياً على بيانات تقريبية ($Lines / 15$) وهي **غير كافية** لضمان دقة "محاذاة الصفحات" و"الوقوف الموضوعي". لا يجب الاستمرار إلا في حال توفر Dataset قطعية.

# PRD — Next Generation Quran Planning Engine


## 1. Document Purpose

This PRD defines the target product and technical direction for the next generation planning engine in the `MakenCore` project.

It is based on:

- `doc/requirment.md`
- `doc/epic.md`
- analysis of the current codebase under `src/`

This document is intended to align product, backend, data, and QA work around a single implementation roadmap.

---

## 2. Executive Summary

The current project already contains a strong standalone TypeScript Quran planning engine with:

- line-based movement using cumulative arrays
- support for forward and reverse planning directions
- multi-track scheduling for memorization and review
- constraint-based track coordination
- Excel export
- manual automated test coverage for core engine invariants

However, the current engine is still a core simulation library, not yet the full production planning engine described in the requirements.

The new engine should evolve this codebase from a generic track simulator into a domain-accurate Quran planning platform that supports:

- Madinah Mushaf spatial dataset as a first-class reference model
- exact page and line semantics
- stopping-rule pipeline with ayah integrity and snapping behaviors
- richer track orchestration and workload balancing
- configurable planning presets and catch-up days
- production-grade validation and test suites
- API-ready architecture for later NestJS/Prisma integration
- dynamic printable export output

---

## 3. Current Project Analysis

### 3.1 Current Technical Stack

The current repository is a TypeScript project, not yet a NestJS + Prisma application.

Current stack:

- TypeScript
- `ts-node`
- `exceljs`
- local static Quran dataset in `src/data/QuranStaticData.ts`

Current entry point:

- `src/main.ts`

### 3.2 Current Architecture

The existing engine already uses good architectural patterns:

- `PlanBuilder` as fluent composition API
- `TrackManager` as day-by-day simulation engine
- `QuranRepository` as Quran data access layer
- `BaseTrack` + strategies as extensible movement model
- `ConstraintManager` + `WallConstraint` for inter-track safety
- `PlanExporter` for current export pipeline

### 3.3 Current Capabilities Already Present

The current codebase already supports:

- line-based daily planning using cumulative arrays
- two directions:
  - forward: Fatiha → Nas
  - reverse: Nas → Fatiha
- three track families:
  - linear memorization
  - window review
  - looping review
- execution ordering by track priority
- barrier constraints between tracks
- optional completion stop condition
- O(1) range queries by prefix sums
- O(log n) movement using exponential search
- Excel export of generated plan rows
- manual test script for engine errors and selected fixes

### 3.4 Current Gaps Against New Requirements

The current engine does **not yet** fully support the new target state.

Main gaps:

- dataset is optimized for cumulative movement, but not modeled explicitly as a rich Mushaf reference entity per ayah
- no explicit `pageNumber`, `lineStart`, `lineEnd`, `linesCount`, `thematicBreak`, `isPageEnd`, `isSurahEnd` contract exposed as a domain layer
- no dedicated stopping-rule pipeline such as:
  - advance by lines
  - snap to ayah boundary
  - surah snap
  - page alignment
  - thematic halting
  - balance correction
- no first-class load balancer to adjust review load relative to new memorization weight
- no configurable off-days or catch-up day behavior in plan generation
- no dynamic track metadata/config model suitable for persistence in SaaS product
- no PDF export pipeline yet
- no NestJS modules, Prisma schema, database persistence, or APIs
- no strict dataset validation framework for page totals, thematic boundaries, and Mushaf consistency
- current tests are manual script-style tests, not a full structured QA suite

---

## 4. Product Vision

Build a production-ready Quran planning engine that generates pedagogically correct, line-accurate, multi-track daily plans based on the Madinah Mushaf structure.

The engine must be able to serve as the planning core for a future SaaS system used by teachers to:

- create personalized plans
- control memorization and multiple review tracks
- respect student capacity
- project completion dates automatically
- export practical printable schedules
- later sync plans with students through share codes and plan management features

---

## 5. Product Goals

### 5.1 Primary Goals

- generate daily plans using exact Mushaf line logic instead of ayah-count approximations
- preserve ayah integrity and avoid ugly stopping points
- support multi-track plans in a single daily schedule
- support both ascending and descending memorization paths
- keep daily workload pedagogically balanced
- provide stable and testable domain rules
- prepare the project for API and persistence integration

### 5.2 Non-Goals For The First Delivery

The first delivery of the new engine should **not** try to complete the entire SaaS product.

Out of scope for the first milestone:

- student portal
- authentication and permissions
- collaborative real-time editing
- plan analytics dashboards
- full folder/share-code management implementation

These may be designed now but implemented later.

---

## 6. Users And Core Use Cases

### 6.1 Primary Users

- Quran teachers
- supervisors of Quran circles
- operations/admin teams who prepare standard planning templates

### 6.2 Core Use Cases

- create a memorization plan starting from a specific ayah with a daily line capacity
- generate a reverse-direction plan from the end of the Quran
- attach near review and far review tracks to the same plan
- enable a weekly catch-up day where no new memorization is assigned
- create a review-only plan
- export an operational printable schedule for teacher usage
- estimate completion date automatically from capacity and working-day pattern

---

## 7. Functional Requirements

### 7.1 Dataset And Reference Layer

The engine must use a domain-rich Mushaf reference dataset.

Minimum target reference shape per ayah:

```ts
interface QuranAyahReference {
  ayahId: number
  surahNumber: number
  ayahNumber: number
  pageNumber: number
  lineStart: number
  lineEnd: number
  linesCount: number
  isPageEnd: boolean
  isSurahEnd: boolean
  thematicBreak?: 'QUARTER' | 'HIZB' | 'JUZ' | 'NONE'
}
```

Required dataset capabilities:

- deterministic lookup by `surahNumber + ayahNumber`
- directional index generation for forward and reverse traversal
- cumulative line arrays for fast movement
- page boundary awareness
- surah boundary awareness
- thematic stopping hints
- header and basmalah padding normalization where required to reflect true Mushaf page load

### 7.2 Planning Inputs

The engine must accept at minimum:

- plan start date
- working days or off-days
- optional plan limit by date or day count
- direction (`forward` or `reverse`)
- one or more planning tracks
- optional weekly catch-up day
- optional preset template

Track-level input examples:

- memorization start location
- memorization optional end location
- daily amount in lines / pages / quarter units
- near review configuration
- far review configuration
- stabilization track enabled/disabled
- review-only plan mode

### 7.3 Stopping Rule Pipeline

The memorization engine must implement a formal stopping pipeline.

Target logical flow:

1. `advanceByLines`
2. `snapToAyahBoundary`
3. `applySurahSnap`
4. `applyPageAlignment`
5. `applyThematicHalting`
6. `applyBalanceCorrection`

Behavioral requirements:

- ayah must never be cut mid-way
- if remaining amount to end of surah is at or below threshold, merge it into today’s lesson
- if remaining amount to end of page is small, align to page end
- if a thematic break is nearby and does not distort load unacceptably, prefer it
- final result must stay within configured tolerance band

### 7.4 Directional Routing

The engine must support:

- ascending planning
- descending planning

Directional rules must be symmetric where possible, with explicit reversed snapping semantics when planning backward.

### 7.5 Multi-Track Scheduling

The engine must support daily plans composed from multiple concurrent tracks:

- new memorization
- near review
- far review
- stabilization / consolidation
- catch-up-only day behavior

Requirements:

- tracks must not conflict spatially or logically
- review cannot exceed what has been memorized
- track execution order must be deterministic
- each track must expose enough metadata to render/export independently

### 7.6 Workload Balancing

The engine must introduce a load-balancing layer.

Example rules:

- memorization lines have higher effort weight than review lines
- when memorization load increases, secondary review may shrink automatically
- balance logic must be configurable, not hardcoded into track movement logic

Suggested weight model:

- 1 memorization line = weight 3
- 1 near review line = weight 1.5
- 1 far review line = weight 1

These exact values should be configurable.

### 7.7 Catch-Up And Off-Day Logic

The schedule engine must support:

- weekly non-working days
- manual holiday dates
- dedicated catch-up day where memorization pauses and review expands or consolidates

### 7.8 Export Requirements

The product must support a new export layer.

Required target output:

- printable table view
- dynamic columns depending on active tracks
- plan metadata header
- visible highlighting for off-days and catch-up days
- teacher evaluation cells
- no row splitting for one day across pages when exporting PDF

Phase 1 may keep Excel as an intermediate export.
Phase 2 should add PDF generation.

---

## 8. Proposed Target Architecture

### 8.1 Recommended High-Level Modules

```text
PlanningApplication
├── PlanDefinition Layer
├── MushafReference Layer
├── Planning Engine Layer
│   ├── Movement Engine
│   ├── Rule Pipeline
│   ├── Constraint Engine
│   ├── Load Balancer
│   └── Schedule Simulator
├── Export Layer
└── Validation & QA Layer
```

### 8.2 Recommended Internal Structure

Suggested future structure inside `src/`:

```text
src/
├── app/
│   ├── plan-definition/
│   ├── presets/
│   └── use-cases/
├── domain/
│   ├── mushaf/
│   ├── planning/
│   ├── tracks/
│   ├── rules/
│   ├── constraints/
│   └── balancing/
├── infrastructure/
│   ├── dataset/
│   ├── exporters/
│   ├── persistence/
│   └── adapters/
├── interfaces/
│   ├── cli/
│   ├── api/
│   └── dto/
└── tests/
```

### 8.3 Evolve Existing Components Instead Of Replacing Them

The current architecture is strong and should be evolved rather than discarded.

Recommended mapping:

- keep `QuranRepository`, but split it into:
  - `MushafReferenceRepository`
  - `DirectionalIndexService`
  - `LineMetricsService`
- keep `TrackManager`, but evolve it into:
  - `ScheduleSimulator`
- keep `BaseTrack` and strategies, but add a dedicated rule pipeline before finalizing each step
- keep `ConstraintManager`, but expand with domain constraints beyond only `WallConstraint`
- replace `PlanExporter` with export adapters:
  - `ExcelPlanExporter`
  - `PdfPlanExporter`

---

## 9. Proposed Domain Model

### 9.1 Core Planning Entities

#### PlanDefinition

Defines the static input configuration of a plan.

Fields:

- id
- name
- startDate
- direction
- workingDays
- holidayDates
- catchUpDay
- presetId
- stopPolicy
- createdBy

#### PlanTrackDefinition

Defines a configured track inside a plan.

Fields:

- id
- planId
- type
- status
- amountUnit
- amountValue
- startLocation
- endLocation
- sourceTrackId
- priority
- balancingWeight
- configJson

#### PlanDay

Represents one generated planning day.

Fields:

- dayNumber
- gregorianDate
- hijriDate
- isOffDay
- isCatchUpDay
- totalLoadScore
- events[]

#### PlanEvent

Represents one track event within a day.

Fields:

- trackId
- trackType
- eventType
- startLocation
- endLocation
- linesCount
- pageStart
- pageEnd
- metadata

### 9.2 Rule Result / Step Result Enrichment

The current `StepResult` is too small for the target engine.

It should evolve to include:

- raw start/end index
- final start/end location
- lines processed
- pages touched
- rules applied
- snap reason
- balance adjustments
- warnings

Example:

```ts
interface PlannedStepResult {
  startIdx: number
  endIdx: number
  linesProcessed: number
  start: LocationObj
  end: LocationObj
  pageStart: number
  pageEnd: number
  appliedRules: string[]
  snapReason?: string
  warnings?: string[]
  flags?: string[]
}
```

---

## 10. Rule Engine Design

### 10.1 Recommendation

Use a rule pipeline built on a `Chain of Responsibility` or `Pipeline` pattern.

Suggested interfaces:

```ts
interface PlanningRuleContext {
  direction: 'FORWARD' | 'REVERSE'
  targetLines: number
  tolerance: { min: number; max: number }
  trackType: string
  currentIdx: number
}

interface PlanningRuleCandidate {
  startIdx: number
  endIdx: number
  linesProcessed: number
  appliedRules: string[]
}

interface PlanningRule {
  apply(candidate: PlanningRuleCandidate, context: PlanningRuleContext): PlanningRuleCandidate
}
```

### 10.2 Initial Rule Set

- `AyahIntegrityRule`
- `SurahSnapRule`
- `PageAlignmentRule`
- `ThematicHaltingRule`
- `BalanceCorrectionRule`

### 10.3 Rule Invariants

- no rule may produce an invalid Quran location
- no rule may violate ayah integrity
- each rule must be deterministic
- rule order must be explicit and testable
- each applied rule should be traceable in output metadata

---

## 11. Constraints And Safety Rules

The current engine already has a useful barrier model. The next engine should generalize it.

Required constraints:

- review track cannot move beyond memorized material
- secondary review cannot exceed the allowed review horizon
- reverse-direction movement must honor equivalent barriers in reverse indexing
- catch-up day must suppress memorization if configured
- optional track dependency constraints must be declarative

Suggested constraint classes:

- `WallConstraint`
- `TrackDependencyConstraint`
- `CompletionBoundaryConstraint`
- `CatchUpDayConstraint`
- `DirectionSafetyConstraint`

---

## 12. Data Strategy

### 12.1 Dataset Recommendation

Adopt a source dataset that includes spatial Mushaf coordinates, then normalize it into the project’s canonical format.

Potential sources already identified by requirements:

- `quran-data-kfgqpc`
- `QUL`
- equivalent Madinah Mushaf coordinate sources

### 12.2 Canonical Dataset Pipeline

Recommended pipeline:

1. import raw source data
2. normalize ayah references
3. compute `linesCount`
4. infer `isPageEnd`
5. infer `isSurahEnd`
6. map thematic breaks
7. apply header/basmalah padding rules
8. generate forward index map
9. generate reverse index map
10. generate cumulative arrays
11. run validation suite
12. publish generated static artifacts

### 12.3 Validation Requirements

Required automated checks:

- no missing ayah ids
- no missing ayah sequence within each surah
- every lookup location is unique
- every page has valid cumulative total after normalization
- surah endings are consistent
- thematic markers only occur at valid boundaries
- forward and reverse generated datasets are symmetric

---

## 13. API And Persistence Readiness

Although this repository is not yet NestJS/Prisma-based, the new engine should be designed so it can be embedded later.

### 13.1 API-Ready Use Cases

Recommended application use cases:

- `CreatePlanDefinition`
- `GeneratePlanPreview`
- `EstimateCompletionDate`
- `ExportPlan`
- `ValidateDataset`

### 13.2 Prisma-Oriented Persistence Model

Recommended future persistence tables:

- `plans`
- `plan_tracks`
- `plan_days`
- `plan_events`
- `plan_presets`
- `mushaf_references`
- `share_codes`
- `plan_folders`

This should be treated as future integration scope, not immediate implementation in this repository.

---

## 14. Testing Strategy

### 14.1 Current Situation

The current project includes a manual TypeScript test runner for core engine errors.

### 14.2 Required Target QA Levels

The new engine needs a layered test strategy:

#### Dataset Validation Tests

- full ayah continuity
- page totals
- surah endings
- thematic boundary validity
- forward/reverse symmetry

#### Rule Tests

- integrity snapping never cuts ayah
- surah snap threshold behavior
- page alignment threshold behavior
- thematic stop preference behavior
- reverse-direction equivalents

#### Constraint Tests

- review cannot overtake memorization
- fallback barrier behavior
- catch-up day suppression works

#### Simulation Tests

- single-track memorization plans
- multi-track balanced plans
- reverse plans
- review-only plans
- plans with holidays and catch-up days

#### Export Tests

- dynamic column rendering
- off-day highlighting
- PDF/Excel row integrity

### 14.3 Tooling Recommendation

Move from manual script-style tests toward a standard test framework.

Recommended:

- `vitest` or `jest` for unit and integration tests
- snapshot tests for dataset pages and export structures

---

## 15. Delivery Phases

### Phase 1 — Domain Foundation

Deliverables:

- canonical Mushaf reference contract
- dataset normalization pipeline
- validation suite for dataset correctness
- richer repository/domain services

Success criteria:

- dataset is deterministic, validated, and direction-ready

### Phase 2 — Core Rule Engine

Deliverables:

- stopping-rule pipeline
- ayah/page/surah/thematic snapping behaviors
- enriched step result metadata

Success criteria:

- memorization steps become domain-correct and explainable

### Phase 3 — Advanced Scheduling

Deliverables:

- load balancer
- catch-up day support
- richer track configuration
- improved multi-track coordination

Success criteria:

- plans stay pedagogically balanced and configurable

### Phase 4 — Export Layer

Deliverables:

- refactored Excel exporter
- PDF export pipeline
- dynamic columns and printable formatting rules

Success criteria:

- usable operational schedule can be generated for teachers

### Phase 5 — Application Boundary Readiness

Deliverables:

- use-case APIs
- DTO contracts
- persistence-ready plan definition models
- integration guidelines for NestJS/Prisma service

Success criteria:

- engine can be embedded cleanly in a SaaS backend

---

## 16. Recommended Immediate Engineering Tasks

These are the next concrete tasks the team should execute in this repository.

### P0

- introduce canonical `QuranAyahReference` domain model
- build dataset import + normalization script from a reliable Madinah Mushaf source
- add dataset validation tests
- refactor `QuranRepository` around the new dataset structure

### P1

- implement `PlanningRule` pipeline for memorization track
- enrich `StepResult` to include rule metadata
- replace direct linear stop logic with pipeline-driven stop resolution

### P2

- add schedule support for holidays and weekly catch-up day
- add load scoring and balancing configuration
- formalize dynamic track definitions

### P3

- split exporter into `ExcelPlanExporter`
- implement PDF export adapter
- add export-specific snapshot tests

### P4

- prepare application/service layer APIs for integration into NestJS backend
- define future Prisma schema draft

---

## 17. Risks And Mitigations

### Risk 1 — Dataset Accuracy

If the source Mushaf dataset is incomplete or inconsistent, planning outputs become unreliable.

Mitigation:

- normalize a single canonical source
- enforce validation gates before publishing artifacts

### Risk 2 — Rule Complexity Drift

Multiple snapping rules can conflict and produce unpredictable results.

Mitigation:

- explicit rule ordering
- rule-level tests
- traceable `appliedRules` metadata

### Risk 3 — Overcoupling Scheduling And Export

If export logic is mixed into engine output assumptions, later product changes become expensive.

Mitigation:

- keep planning output semantic and export-agnostic
- use dedicated export adapters

### Risk 4 — Reverse Direction Bugs

Reverse movement can silently diverge from forward rules.

Mitigation:

- maintain symmetric tests for all directional behaviors
- validate both directional index maps from same canonical dataset

---

## 18. Success Metrics

The new planning engine will be considered successful when:

- generated memorization stops never split an ayah
- page and surah snapping operate within configured thresholds
- multi-track plans remain logically consistent
- dataset validation passes 100% deterministically
- plan completion projections are stable for the same inputs
- export output matches active track configuration without manual adjustments
- architecture is reusable inside a future NestJS/Prisma service

---

## 19. Final Recommendation

This project should **not** be rewritten from scratch.

The current repository already contains a valuable engine core with the right foundation:

- track abstraction
- repository abstraction
- line-based planning
- directional datasets
- constraints
- simulation engine

The correct path is to **evolve the current engine into a domain-accurate planning platform**, focusing first on:

- canonical Mushaf data modeling
- stopping-rule pipeline
- richer scheduling semantics
- validation and QA
- export modernization

This gives the team a practical roadmap from today’s engine to the full advanced Quran planning engine described in the requirements.

---

## 20. Appendix — Current To Target Mapping

| Current Component | Current Role | Target Evolution |
| --- | --- | --- |
| `PlanBuilder` | Fluent builder for tracks and schedule | Plan definition composer / use-case input adapter |
| `TrackManager` | Daily simulation loop | Schedule simulator |
| `QuranRepository` | Static lookup + cumulative movement | Canonical mushaf reference repository + directional services |
| `LinearStrategy` | Fixed daily movement | Raw movement seed before rule pipeline finalization |
| `WindowStrategy` | Near-review window logic | Near-review planner with balancing awareness |
| `LoopingStrategy` | Far-review cycling | Review engine with richer constraints |
| `ConstraintManager` | Barrier resolution | General planning constraints engine |
| `PlanExporter` | Console + Excel export | Export adapters for Excel/PDF |
| `planErrors.test.ts` | Manual regression script | Full unit/integration/validation suite |
