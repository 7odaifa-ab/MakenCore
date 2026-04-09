# Planning Modes & Phases

## Purpose

This document tracks the current implementation state of the planning engine, the official planning modes now available in the builder, the scenario strategy used for QA, and the next milestones required to mature the engine further.

---

## Current Rule Pipeline

The engine currently applies rules in the following order:

```text
AyahIntegrityRule
SurahCompletionRule
SurahSnapRule
PageAlignmentRule
ThematicHaltingRule
BalanceCorrectionRule
MaxAyahRule
```

## Important Interpretation

Rule order is intentional.

This means a later rule is not always allowed to fully override a previous pedagogical or structural correction if the engine design expects earlier rules to preserve a stronger invariant.

Examples of stronger invariants include:

- ayah integrity
- surah completion near the end of a surah
- page or thematic stopping improvements

As a result, `maxAyahPerDay` should be interpreted in context of the rule pipeline, not as a naive standalone metric during QA.

---

## Official Planning Modes

The engine now exposes two official planning modes in `PlanBuilder`.

### 1. `planByDuration(...)`

Use this when the teacher knows:

- the Quran range to cover
- the total duration available
- the working days per week

The engine derives:

- a daily hifz amount in `lines`
- a matching `limitDays`

### Input Shape

```typescript
.planByDuration({
  from: { surah: 66, ayah: 1 },
  to: { surah: 58, ayah: 8 },
  durationDays: 30
})
```

### Output Behavior

The builder computes:

- total lines between `from` and `to`
- approximate study days from `durationDays` and `daysPerWeek`
- derived daily lines required to finish in time

---

### 2. `planByDailyAmount(...)`

Use this when the teacher knows:

- the Quran range to cover
- the desired daily workload
- the working days per week

The engine derives:

- study days needed
- calendar days required
- a matching `limitDays`

### Input Shape

```typescript
.planByDailyAmount({
  from: { surah: 66, ayah: 1 },
  to: { surah: 55, ayah: 78 },
  dailyLines: 14
})
```

### Output Behavior

The builder computes:

- total lines between `from` and `to`
- study days required at the given `dailyLines`
- approximate calendar days based on `daysPerWeek`

---

## Scenario Strategy

The repository scenarios are currently being used as QA presets, not as the final product UX.

### Current Scenario Types

- `beginner`
  - uses `planByDuration(...)`
  - fixed 30-day target
  - strict sequential behavior
  - frequent consolidation

- `intermediate`
  - uses `planByDuration(...)`
  - fixed 90-day target
  - balanced daily load

- `advanced`
  - uses `planByDailyAmount(...)`
  - fixed stronger daily amount
  - engine computes required days automatically

- `review-only`
  - review without new memorization
  - implemented using two major review loops
  - temporary workaround

---

## QA Milestones Already Completed

### Phase 1: Scenario Launcher

Completed work:

- replace the old single-purpose `main.ts`
- add scenario selection by key
- add scenario listing
- add run-all mode
- keep console preview available for manual inspection

### Phase 2: Reliable Windows CLI Scripts

Completed work:

- add explicit scripts in `package.json`
- avoid unreliable argument forwarding through `npm start -- ...`
- add dedicated Excel export commands for each scenario

### Phase 3: Exporter Support for Multiple Review Tracks

Completed work:

- improve console labeling for multiple major review tracks
- improve Excel export naming and formatting
- preserve Arabic labels correctly in generated files

### Phase 4: Official Builder Planning Modes

Completed work:

- add `planByDuration(...)`
- add `planByDailyAmount(...)`
- compute target range size using `QuranRepository.getLinesBetween(...)`
- refactor scenarios to use official builder-level planning modes

---

## What Is Official vs What Is Still Transitional

### Official Now

- builder-level duration planning
- builder-level daily-amount planning
- scenario launcher commands
- Excel QA export scripts
- multi-track review export support

### Transitional / Temporary

- `review-only` uses two major review tracks instead of a true dedicated near-review-only track
- derived day calculations are approximate and based on `daysPerWeek`, not full calendar simulation at builder stage
- scenario targets are currently QA-oriented presets, not yet a complete teacher-facing preset catalog

---

## Expected Outputs During QA

### Console Output

A successful run should show:

- scenario header
- scenario description
- rule order
- generation time
- daily plan preview

### Excel Output

When Excel is enabled, a file should appear in the project root.

Examples:

- `QuranPlan_beginner_2026-04-09.xlsx`
- `QuranPlan_advanced_2026-04-09.xlsx`
- `QuranPlan_review-only_2026-04-09.xlsx`

---

## Next Milestones

### 1. Surface Derived Planning Metadata

Recommended additions:

- derived daily lines
- derived study days
- derived calendar days
- completion-vs-limit reason

### 2. Add a Scenario Validator

Recommended QA outputs:

- number of memorization days
- number of review-only days
- reset counts
- total generated days
- whether termination happened because of completion or because of `limitDays`

### 3. Add a First-Class Review-Only Near Review Track

Current limitation:

- minor review depends on hifz history

Target improvement:

- support review-only plans without relying on a workaround using two major review tracks

### 4. Improve Duration Accuracy

Current behavior:

- builder derives days from `durationDays` and `daysPerWeek`

Future improvement:

- align derived-day logic more closely with actual generated calendar behavior
- include consolidation cadence and non-working day effects more explicitly in the estimate

---

## Design Notes

The official planning modes intentionally live in `PlanBuilder` rather than in scenario files.

This keeps:

- the planning logic reusable
- the scenarios thin
- future API integration easier

In other words:

- scenarios should describe use cases
- builder modes should encode planning semantics
