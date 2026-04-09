# Project Status and QA Coverage

## Purpose

This document summarizes the current state of the `MakenCore` Quran planning engine, what has already been implemented, what has been validated, what remains open, and where public contributors can help next.

It is intended as a publish-ready status reference for developers, reviewers, and community contributors reading the repository.

---

## Current Project State

The engine has reached a strong and practical stage in terms of:

- multi-track memorization and review planning
- an explicit pedagogical rule pipeline
- two official builder-level planning modes
- runnable QA scenarios
- Excel export support
- scenario-level automated validation

The most accurate current assessment is:

- the engine is **ready for practical use and further development**
- the engine is **well validated within the currently defined scope**
- there are currently **no obvious critical flaws** in the primary tested flows
- however, it should not be described as **mathematically or product-wise complete for every future case**

---

## What Has Been Completed

### 1. Core planning engine foundation

The engine now supports:

- new memorization `Hifz`
- near review `Minor Review`
- major review `Major Review`
- stop-on-completion behavior
- reset behavior for looping review tracks
- consolidation days

### 2. Pedagogical rule pipeline

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

This order is intentional and meaningful. Final planning boundaries should be interpreted in the context of the whole ordered pipeline rather than as isolated single-rule outcomes.

### 3. Two official planning modes in `PlanBuilder`

Two official builder-level planning modes were added:

- `planByDuration(...)`
  - the teacher defines the Quran range and duration
  - the engine derives the required daily memorization load

- `planByDailyAmount(...)`
  - the teacher defines the Quran range and daily workload
  - the engine derives the duration needed for completion

### 4. Runnable reference scenarios

The repository now includes a focused scenario set covering both common and sensitive flows:

- `beginner`
- `intermediate`
- `advanced`
- `review-only`
- `completion-before-limit`
- `consolidation-audit`
- `rule-pipeline-stress`
- `daily-amount-audit`
- `review-only-reset-stress`

### 5. Practical human-review outputs

The project supports:

- terminal preview output
- Excel export
- clear runnable commands in `package.json`

### 6. Comprehensive scenario validator

A standalone validator was added and can be run with:

```bash
npm run validate:scenarios
```

This validator executes all reference scenarios, applies scenario-specific assertions, and prints a clear `PASS/FAIL` report.

---

## What Has Been Tested

### Scenario-level validation

The current validation layer checks, among other things:

- memorization exists where memorization is expected
- memorization is absent in `review-only` plans
- review events exist in review-driven plans
- reset behavior appears where looping review is expected
- no `Hifz` event appears on consolidation days
- review activity still exists on consolidation days
- plans can stop because of completion before exhausting the configured duration
- `planByDuration(...)` works as expected
- `planByDailyAmount(...)` works as expected
- invalid builder-mode inputs are rejected

### Existing unit and integration coverage

The repository also contains useful tests for:

- builder and input errors
- rule engine behavior
- facade integration
- Quran dataset validation
- selected regression cases

### Current validation result

After running the scenario validator, the current result is:

```text
Summary: 9/9 scenarios passed.
```

This means all currently defined reference scenarios passed their intended validation checks.

---

## What Is Now Clear

The project has moved beyond the stage of being merely a promising concept.

It is now better described as:

- structurally sound in the tested scope
- backed by runnable reference scenarios
- supported by repeatable validation
- suitable for public release as a library that others can build on

Still, scientific honesty matters:

- current success does not mean no future edge case can ever appear
- current success does mean that the **main engine flows are clean, convincing, and well tested**

---

## What Is Still Transitional

### 1. `review-only` still relies on a workaround

The current `review-only` scenario uses two `Major Review` loops instead of having a first-class review-only near-review track.

### 2. Derived planning calculations are still approximate at builder stage

Derived values such as:

- study days
- calendar days

are currently based on strong practical approximations from `daysPerWeek`, but not yet on a full detailed calendar simulation at builder stage.

### 3. Student personalization is still limited

The engine does not yet expose richer student profiles such as:

- beginner child
- busy working adult
- fast memorizer
- weak retention student
- review intensity by learner level

---

## What Can Still Be Improved

### 1. Richer pedagogical presets

Examples include:

- beginner
- intermediate
- advanced
- review only
- busy adult
- child learner
- intensive plan
- conservative plan

### 2. Better whole-day load modeling

A major future improvement would be to evaluate:

- not only each track individually
- but also the total daily cognitive and workload burden on the learner

### 3. Better termination metadata

Useful future outputs would include:

- whether the plan ended because of completion
- whether it ended because of `limitDays`
- memorization-day counts
- review-only day counts
- reset counts

### 4. Richer validator output or JSON reporting

The validator can later be extended to produce:

- structured `JSON` reports
- richer QA metrics
- automatic scenario comparisons

### 5. Broader future edge-case coverage

Examples include:

- very long horizon plans
- broader forward-direction coverage
- `catchUpDayOfWeek` specific tests
- `endDate` driven scenarios
- more complex wall and boundary cases

---

## What Public Contributors Should Understand

If you are reading this repository as an external contributor, the project should currently be understood as:

- not an untested prototype
- not a frozen final system either
- but a **strong extensible base** for further pedagogical and technical development

The highest-value next contributions are likely to be:

- richer pedagogical modeling
- stronger validation and measurement
- additional presets
- API or UI layers on top of the engine
- better derived estimation accuracy
- broader edge-case coverage

---

## Final Notes

### Note 1

The most important achievement in this stage is not only adding features, but turning prior discussion into a repeatable validation framework through:

- clear scenarios
- a clear validator
- repeatable checks

### Note 2

It is important not to overclaim. The professional wording at this stage is:

- the engine is strong
- the engine is clean in the tested scope
- the engine is ready for public release and community development
- the engine still has legitimate room for future improvement

### Note 3

Real pedagogical planning systems mature in two broad stages:

- structural correctness and rule integrity
- deeper personalization and pedagogical intelligence

This project has completed the first stage strongly and has started entering the second.

---

## Summary

The current state of `MakenCore` is:

- a strong and organized planning engine
- backed by an ordered pedagogical rule pipeline
- supported by official planning modes
- supported by reference scenarios and practical validation
- supported by a comprehensive scenario validator that currently passes all defined scenarios
- ready for public release as a community-improvable project
- still open to meaningful future refinement
