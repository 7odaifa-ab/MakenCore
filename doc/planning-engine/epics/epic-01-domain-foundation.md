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
- [x] design `QuranAyahReference`
- [x] define directional index payloads
- [x] define page boundary and thematic metadata

### 2. Build dataset import pipeline
- [x] import from a trusted Mushaf source
- [x] normalize raw source rows into canonical references
- [x] generate forward and reverse lookup maps
- [x] generate cumulative line arrays

### 3. Validate dataset integrity
- [x] validate ayah continuity per surah
- [x] validate page totals and page end markers
- [x] validate surah end markers
- [x] validate thematic boundary placements
- [x] validate symmetry across forward and reverse directions

### 4. Refactor Quran repository
- [x] split responsibilities into reference lookup and directional traversal
- [x] expose fast lookup methods for:
  - [x] ayah by location
  - [x] location by index
  - [x] lines between two locations
  - [x] page metadata lookup

### 5. Add fixture and snapshot tests
- [x] test sample surah sequences
- [x] test page boundary outputs
- [x] test directional mapping consistency

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
