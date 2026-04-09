# Pedagogical Rules Guide — Quran Planning Engine

## Overview

The Quran Planning Engine now includes **pedagogical constraints** designed to optimize plans for **retention and consistency** rather than just completion speed. These constraints ensure the generated plans are human-readable, sustainable, and aligned with effective memorization practices.

---

## Core Pedagogical Constraints

### 1. MaxAyahPerDay — Cognitive Load Management

**Purpose:** Prevents cognitive overload by limiting daily memorization chunks.

**Default:** 10 ayahs  
**Range:** 5-20 ayahs  
**Rule Priority:** 55 (runs LAST in the pipeline)

**Behavior:**
- Hard caps daily new memorization at the specified limit
- Truncates lessons that would exceed the limit
- **Exception:** SurahCompletionRule can override for small overages (≤5 ayahs to complete a surah)

**Example:**
```typescript
// 10 ayah limit - will truncate
66:1 → 66:12 = 12 ayahs → truncated to 66:10 (10 ayahs)

// Small overage to complete surah - allowed
58:12 → 58:22 = 11 ayahs → ALLOWED (only 5 ayahs remaining in surah)
```

**Presets:**
| Preset | Value | Use Case |
|--------|-------|----------|
| Conservative | 5 | Beginners, elderly, busy professionals |
| Standard | 10 | Most students (default) |
| Intensive | 15 | Experienced memorizers |
| Completion | 20 | Finishing remaining Quran |

---

### 2. SequentialSurahMode — Context Preservation

**Purpose:** Completes the current surah before starting a new one, preventing disruptive context switching.

**Default:** true  
**Threshold:** ≤5 remaining ayahs to trigger completion

**Behavior:**
- If remaining ayahs in current surah ≤5, extend lesson to complete it
- Prevents "surah hopping" which disrupts memorization flow
- Maintains thematic coherence

**Example:**
```typescript
// sequentialSurahMode = true
Day 20: 58:1 → 58:6 (6 ayahs)
Day 21: 58:7 → 58:11 (5 ayahs) - continues surah
Day 22: 58:12 → 58:22 (11 ayahs) - completes surah (overage allowed)
Day 23: 57:1 → 57:7 (7 ayahs) - now starts next surah
```

---

### 3. ConsolidationDayInterval — Spaced Repetition

**Purpose:** Creates dedicated review-only days every N days to consolidate learning without new material.

**Default:** 6 (every 6th day is review-only)  
**Disable:** Set to 0

**Behavior:**
- On consolidation days, HIFZ track is suppressed
- Only MINOR_REVIEW and MAJOR_REVIEW tracks run
- Allows the brain to strengthen neural pathways without new input
- Prevents burnout

**Example Output:**
```
Day 6:  (consolidation day)
   📘 مراجعة صغرى: ...
   📙 مراجعة كبرى: ...
   (no حفظ جديد)

Day 7:
   📗 حفظ جديد: ... ← resumes
   📘 مراجعة صغرى: ...
   📙 مراجعة كبرى: ...
```

---

## Rule Pipeline & Priority System

Rules run in strict priority order. Each rule can modify step boundaries.

```
Priority 5:   AyahIntegrityRule       - Never split ayahs (foundation)
Priority 18:  SurahCompletionRule     - Complete surah if ≤5 ayahs remain
Priority 20:  SurahSnapRule           - Snap to surah end if within threshold
Priority 30:  PageAlignmentRule       - Snap to page boundaries
Priority 40:  ThematicHaltingRule     - Snap to hizb/juz breaks
Priority 50:  BalanceCorrectionRule   - Adjust to target line count
Priority 55:  MaxAyahRule             - **Hard cap** (runs LAST)
```

**Why MaxAyahRule runs last:**
It acts as a **safety valve** that can truncate any overextensions made by earlier rules, except for small surah-completion overages (≤5 ayahs).

---

## Step Flags System

Tracks use flags to communicate their nature to the rule pipeline:

| Flag | Applied By | Effect on Rules |
|------|------------|-----------------|
| `memorization` | LinearStrategy | Subject to MaxAyahRule |
| `review` | WindowStrategy, LoopingStrategy | **Skips** MaxAyahRule (preserves lesson boundaries) |
| `completed` | All strategies | Track reached its end |
| `reset` | LoopingStrategy | Major review track reset to beginning |

**Example:**
```typescript
// Minor review track - preserves boundaries
flags: ['review'] → MaxAyahRule skipped

// New hifz track - subject to limits
flags: ['memorization'] → MaxAyahRule enforced
```

---

## API Configuration

### Programmatic (TypeScript)

```typescript
import { PlanBuilder, WindowMode } from '@maken/core';

const manager = new PlanBuilder()
  .setSchedule({
    startDate: "2026-02-01",
    daysPerWeek: 5,
    isReverse: true,
    
    // Pedagogical constraints
    maxAyahPerDay: 10,
    sequentialSurahMode: true,
    consolidationDayInterval: 6
  })
  .addHifz(10, { surah: 66, ayah: 1 })
  .addMinorReview(5, WindowMode.GRADUAL)
  .addMajorReview(15 * 20, { surah: 67, ayah: 1 })
  .build();
```

### HTTP API

```json
{
  "name": "My Plan",
  "startDate": "2026-02-01",
  "daysPerWeek": 5,
  "pedagogical": {
    "maxAyahPerDay": 10,
    "sequentialSurahMode": true,
    "consolidationDayInterval": 6
  },
  "tracks": [...]
}
```

---

## Preset Configurations

### Conservative (Beginners)
```typescript
{
  maxAyahPerDay: 5,
  sequentialSurahMode: true,
  consolidationDayInterval: 5
}
// Slow, steady progress with frequent consolidation days
```

### Standard (Most Students)
```typescript
{
  maxAyahPerDay: 10,
  sequentialSurahMode: true,
  consolidationDayInterval: 6
}
// Balanced approach (default)
```

### Intensive (Experienced)
```typescript
{
  maxAyahPerDay: 15,
  sequentialSurahMode: false,
  consolidationDayInterval: 0
}
// Faster pace, no mandatory consolidation
```

### Completion Mode
```typescript
{
  maxAyahPerDay: 20,
  sequentialSurahMode: true,
  consolidationDayInterval: 7
}
// For students finishing remaining Quran
```

---

## Rule-Level Control (Advanced)

For fine-grained control, create a custom RuleEngine:

```typescript
import { 
  RuleEngine, 
  MaxAyahRule, 
  SurahCompletionRule,
  AyahIntegrityRule,
  SurahSnapRule,
  PageAlignmentRule,
  ThematicHaltingRule,
  BalanceCorrectionRule
} from '@maken/core';

const engine = new RuleEngine([
  new AyahIntegrityRule(),
  new SurahCompletionRule({ maxRemainingAyahs: 3 }), // Stricter: only 3 ayahs
  new SurahSnapRule(),
  new PageAlignmentRule(),
  new ThematicHaltingRule(),
  new BalanceCorrectionRule(),
  new MaxAyahRule({ maxAyah: 8 })  // Override default
]);
```

---

## Pedagogical Harmony

These constraints work **together**, not in isolation:

1. **MaxAyahRule** sets the baseline limit
2. **SurahCompletionRule** allows small overages to finish surahs
3. **SequentialSurahMode** prevents context switching
4. **Consolidation days** provide spaced repetition without new input

**Example Day 22:**
```
Input: 58:12 → target 10 ayahs → would end at 58:21
SurahCompletionRule: "Only 1 ayah remaining (58:22)" → extend to 58:22
MaxAyahRule: "11 ayahs > 10 limit" → BUT ≤5 to complete, so ALLOWED
Result: 58:12 → 58:22 (11 ayahs) ✓
```

This is **intentional** — completing a surah is more important than strict adherence to the 10-ayah limit.

---

## Validation & Error Handling

- `maxAyahPerDay` must be 5-20 (enforced)
- `consolidationDayInterval` 0 = disabled, otherwise positive integer
- Invalid values fall back to defaults with console warning

---

## Migration from Legacy Mode

Previous versions used only line-based calculation. To maintain backward compatibility:

```typescript
// Legacy mode (line-based only)
const legacy = new PlanBuilder()
  .setSchedule({
    // Don't set pedagogical constraints
    // Falls back to pure line-based planning
  })
  .addHifz(10, location);

// Pedagogical mode (recommended)
const modern = new PlanBuilder()
  .setSchedule({
    maxAyahPerDay: 10,
    sequentialSurahMode: true,
    consolidationDayInterval: 6
  })
  .addHifz(10, location);
```

---

## Future Enhancements

Planned additions to the pedagogical system:

1. **Difficulty-Aware Splitting** — Longer ayahs count as more "cognitive units"
2. **Performance Tracking** — Adaptive difficulty based on student history
3. **Makki/Madani Weighting** — Different difficulty profiles for Meccan/Medinan surahs
4. **Student Age Profiles** — Presets for children vs adults vs elderly

---

## Summary

| Constraint | Default | Range | Purpose |
|------------|---------|-------|---------|
| maxAyahPerDay | 10 | 5-20 | Prevent cognitive overload |
| sequentialSurahMode | true | boolean | Prevent context switching |
| consolidationDayInterval | 6 | 0+ | Spaced repetition days |

These features transform the engine from "optimized for completion" to **"optimized for retention and consistency"** — achieving a Gold Standard Quran Planner.
