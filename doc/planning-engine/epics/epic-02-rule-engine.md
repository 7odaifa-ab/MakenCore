# Epic 02 — Rule Engine for Ayah Integrity, Snapping, and Balance

## Goal
Implement the core planning rule pipeline that transforms raw line movement into pedagogically correct Quran lessons.

## Why this epic matters
The current engine moves by lines, but the new product requires a formal rule pipeline to preserve ayah integrity, align with surah/page boundaries, and support thematic stopping.

## Scope

### Included
- rule pipeline architecture
- ayah integrity rule
- surah snap rule
- page alignment rule
- thematic halting rule
- balance correction rule
- enriched step result metadata
- rule trace output for debugging

### Excluded
- export formatting
- plan persistence
- student management
- advanced analytics

## Backend Tasks

### 1. Introduce planning rule abstractions
- define rule interface
- define rule context object
- define rule candidate/result object
- define explicit rule ordering

### 2. Implement rule handlers
- `AyahIntegrityRule`
- `SurahSnapRule`
- `PageAlignmentRule`
- `ThematicHaltingRule`
- `BalanceCorrectionRule`

### 3. Enrich step results
- add rule metadata
- add snap reason
- add page start/end fields
- add warnings list
- add applied rule list

### 4. Integrate rule pipeline with track execution
- run raw track movement first
- pass candidate through rule pipeline
- commit only final approved result

### 5. Add rule-specific tests
- ensure no ayah is split
- ensure end-of-surah snapping works within threshold
- ensure page alignment threshold behavior is deterministic
- ensure thematic stopping prefers valid boundaries

## Acceptance Criteria
- The engine never outputs a partial ayah lesson
- Rule order is explicit and tested
- Each step records why it was adjusted
- Rule outputs are deterministic for the same input

## Deliverables
- rule engine module
- rule implementations
- enriched step result model
- rule tests and fixtures
