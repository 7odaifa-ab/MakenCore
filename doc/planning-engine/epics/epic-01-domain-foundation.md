# Epic 01 — Domain Foundation and Canonical Mushaf Dataset

## Goal
Create the canonical Quran reference layer needed by the new planning engine.

This epic turns the current line-based engine into a domain-accurate engine by introducing a normalized Mushaf reference dataset, validation rules, and repository services that can support exact page/line planning.

## Why this epic matters
The planning engine cannot reliably implement snapping, page alignment, or thematic stopping without a validated source of truth for ayah-level spatial data.

## Scope

### Included
- canonical `QuranAyahReference` model
- dataset import pipeline
- forward and reverse directional indexing
- cumulative line arrays
- page and surah boundary flags
- thematic break markers
- dataset validation suite
- repository refactor around canonical mushaf data

### Excluded
- scheduling UI
- PDF export
- Prisma persistence of plans
- user/account management

## Backend Tasks

### 1. Define canonical dataset contract
- design `QuranAyahReference`
- define directional index payloads
- define page boundary and thematic metadata

### 2. Build dataset import pipeline
- import from a trusted Mushaf source
- normalize raw source rows into canonical references
- generate forward and reverse lookup maps
- generate cumulative line arrays

### 3. Validate dataset integrity
- validate ayah continuity per surah
- validate page totals and page end markers
- validate surah end markers
- validate thematic boundary placements
- validate symmetry across forward and reverse directions

### 4. Refactor Quran repository
- split responsibilities into reference lookup and directional traversal
- expose fast lookup methods for:
  - ayah by location
  - location by index
  - lines between two locations
  - page metadata lookup

### 5. Add fixture and snapshot tests
- test sample surah sequences
- test page boundary outputs
- test directional mapping consistency

## Acceptance Criteria
- Dataset can be generated deterministically from source data
- All locations are valid and gap-free
- Forward and reverse indices resolve correctly
- Tests prove consistency of page and surah metadata

## Deliverables
- dataset generator script
- canonical JSON/TS artifact
- repository refactor
- dataset validation tests
- documentation for dataset source and generation steps
