# API Contracts — Quran Planning Engine

## Purpose
Define backend-facing request and response contracts for the planning engine.

These contracts are intended for a future NestJS service layer.

---

## 0. Pedagogical Configuration API (NEW)

### Purpose
Pedagogical constraints optimize plans for **retention and consistency** rather than just completion speed. These constraints work in harmony with existing rules.

### Configuration Schema
```json
{
  "pedagogical": {
    "maxAyahPerDay": 10,           // Hard cap on daily memorization (default: 10)
    "sequentialSurahMode": true,    // Complete surah before jumping (default: true)
    "consolidationDayInterval": 6   // Every N days = review only (default: 6)
  }
}
```

### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxAyahPerDay` | number | 10 | Maximum new ayahs per day. Prevents cognitive overload. Range: 5-20 |
| `sequentialSurahMode` | boolean | true | If true, completes current surah before starting next (≤5 remaining ayahs) |
| `consolidationDayInterval` | number | 6 | Every Nth day has **no new memorization** - only review tracks run |

### Rule Pipeline & Flags

The engine uses a **rule pipeline** to process each step. Rules run in priority order and can modify step boundaries.

#### Current Rule Order (by priority)
```
1. AyahIntegrityRule     (priority 5)  - Never split ayahs
2. SurahCompletionRule   (priority 18) - Complete surah if ≤5 ayahs remain
3. SurahSnapRule         (priority 20) - Snap to surah end if within threshold
4. PageAlignmentRule     (priority 30) - Snap to page boundaries
5. ThematicHaltingRule   (priority 40) - Snap to thematic breaks (hizb/juz)
6. BalanceCorrectionRule (priority 50) - Adjust to target line count
7. MaxAyahRule           (priority 55) - **Hard cap** (runs LAST)
```

#### Step Flags
Tracks mark steps with flags for rule pipeline awareness:
- `flags: ['memorization']` - New Hifz steps (subject to MaxAyahRule)
- `flags: ['review']` - Review steps (skip MaxAyahRule, preserve lesson boundaries)
- `flags: ['completed']` - Track reached end
- `flags: ['reset']` - Major review track reset to beginning

### Example: Full Configuration
```json
{
  "name": "Gold Standard Plan",
  "startDate": "2026-03-01",
  "direction": "REVERSE",
  "daysPerWeek": 5,
  "catchUpDay": 6,
  "pedagogical": {
    "maxAyahPerDay": 8,             // Conservative: 8 ayahs/day max
    "sequentialSurahMode": true,     // Complete each surah fully
    "consolidationDayInterval": 5    // Every 5th day: review only
  },
  "tracks": [
    {
      "type": "HIFZ",
      "priority": 1,
      "amountUnit": "LINES",
      "amountValue": 7.5,
      "start": { "surah": 66, "ayah": 1 },
      "end": { "surah": 1, "ayah": 1 }
    },
    {
      "type": "MINOR_REVIEW",
      "priority": 2,
      "amountUnit": "LESSONS",
      "amountValue": 5,
      "config": { "mode": "GRADUAL" }
    },
    {
      "type": "MAJOR_REVIEW",
      "priority": 3,
      "amountUnit": "LINES",
      "amountValue": 20
    }
  ]
}
```

---

## 1. Create Plan Preview

### Endpoint
`POST /api/plans/preview`

### Request
```json
{
  "name": "Ramadan Plan",
  "startDate": "2026-03-01",
  "direction": "FORWARD",
  "daysPerWeek": 5,
  "catchUpDay": 6,
  "pedagogical": {
    "maxAyahPerDay": 10,
    "sequentialSurahMode": true,
    "consolidationDayInterval": 6
  },
  "tracks": [
    {
      "type": "HIFZ",
      "priority": 1,
      "amountUnit": "LINES",
      "amountValue": 7.5,
      "start": { "surah": 1, "ayah": 1 },
      "end": { "surah": 2, "ayah": 286 }
    },
    {
      "type": "MINOR_REVIEW",
      "priority": 2,
      "amountUnit": "LESSONS",
      "amountValue": 5,
      "config": {
        "mode": "GRADUAL"
      }
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "estimatedCompletionDate": "2026-06-18",
    "totalDays": 110,
    "plan": [
      {
        "dayNumber": 1,
        "date": "2026-03-01",
        "dayType": "WORKING",
        "totalLoad": 12.5,
        "events": [
          {
            "trackType": "HIFZ",
            "eventType": "MEMORIZATION",
            "start": { "surah": 1, "ayah": 1 },
            "end": { "surah": 1, "ayah": 7 },
            "linesCount": 7.5,
            "appliedRules": ["AyahIntegrityRule", "PageAlignmentRule"]
          }
        ]
      }
    ]
  }
}
```

---

## 2. Generate Final Plan

### Endpoint
`POST /api/plans`

### Request
Same shape as preview, but with optional persistence fields.

### Response
```json
{
  "success": true,
  "data": {
    "planId": "plan_xxx",
    "status": "DRAFT",
    "shareCode": null
  }
}
```

---

## 3. Estimate Completion Date

### Endpoint
`POST /api/plans/estimate`

### Request
```json
{
  "startDate": "2026-03-01",
  "daysPerWeek": 5,
  "direction": "FORWARD",
  "tracks": []
}
```

### Response
```json
{
  "success": true,
  "data": {
    "estimatedCompletionDate": "2026-06-18",
    "estimatedDays": 110
  }
}
```

---

## 4. Export Plan

### Endpoint
`GET /api/plans/:id/export?format=excel`

or

`GET /api/plans/:id/export?format=pdf`

### Response
- binary file stream
- appropriate content type

Expected content types:

- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/pdf`

---

## 5. Validate Dataset

### Endpoint
`POST /api/dataset/validate`

### Response
```json
{
  "success": true,
  "data": {
    "valid": true,
    "checks": [
      { "name": "ayah_continuity", "passed": true },
      { "name": "page_totals", "passed": true },
      { "name": "thematic_boundaries", "passed": true }
    ]
  }
}
```

---

## Shared DTO Rules

### PlanDirection
- `FORWARD`
- `REVERSE`

### TrackType
- `HIFZ`
- `MINOR_REVIEW`
- `MAJOR_REVIEW`
- `STABILIZATION`
- `CUSTOM`

### DayType
- `WORKING`
- `OFF`
- `CATCH_UP`

### EventType
- `MEMORIZATION`
- `REVIEW`
- `BREAK`
- `CATCH_UP`

### PedagogicalConstraints (NEW)
```typescript
interface PedagogicalConstraints {
  maxAyahPerDay: number;           // 5-20, default: 10
  sequentialSurahMode: boolean;      // default: true
  consolidationDayInterval: number; // 0=disabled, default: 6
}
```

### Event Metadata (appliedRules)
Events now include `appliedRules` array showing which rules affected the step:
```json
{
  "appliedRules": [
    "AyahIntegrityRule",
    "SurahCompletionRule",
    "MaxAyahRule"
  ]
}
```

### Step Flags (Internal)
Used by strategies to mark step types:
- `memorization` - New Hifz step (subject to MaxAyahRule)
- `review` - Review step (skips MaxAyahRule)
- `completed` - Track reached end
- `reset` - Major review track reset

---

## Validation Rules

- `startDate` must be ISO date format
- `daysPerWeek` must be 1-7
- track amounts must be positive
- location coordinates must be valid Quran references
- review tracks must not exceed the planned memorization horizon
- export format must be one of supported values

---

## 6. Programmatic API (TypeScript/NPM)

For direct library usage without HTTP API:

### Installation
```bash
npm install @maken/core
```

### Quick Start
```typescript
import { PlanBuilder, WindowMode, QuranRepository } from '@maken/core';

const builder = new PlanBuilder();

const manager = builder
  .setSchedule({
    startDate: "2026-02-01",
    daysPerWeek: 5,
    limitDays: 10,
    isReverse: true,
    // Pedagogical constraints
    maxAyahPerDay: 10,
    sequentialSurahMode: true,
    consolidationDayInterval: 6
  })
  .addHifz(10, { surah: 66, ayah: 1 })
  .addMinorReview(5, WindowMode.GRADUAL)
  .addMajorReview(15 * 20, { surah: 67, ayah: 1 })
  .stopWhenCompleted()
  .build();

const plan = manager.generatePlan();
```

### ScheduleConfig Interface
```typescript
interface ScheduleConfig {
  startDate: string;           // ISO date (YYYY-MM-DD)
  daysPerWeek: number;         // 1-7
  limitDays?: number;          // Max days to generate
  isReverse?: boolean;         // true=from end, false=from start
  
  // Pedagogical Constraints (NEW)
  maxAyahPerDay?: number;      // Default: 10, Range: 5-20
  sequentialSurahMode?: boolean; // Default: true
  consolidationDayInterval?: number; // Default: 6, 0=disabled
}
```

### Preset Configurations
```typescript
// Conservative (beginners, elderly)
const conservative = {
  maxAyahPerDay: 5,
  sequentialSurahMode: true,
  consolidationDayInterval: 5
};

// Standard (most students)
const standard = {
  maxAyahPerDay: 10,
  sequentialSurahMode: true,
  consolidationDayInterval: 6
};

// Intensive (experienced memorizers)
const intensive = {
  maxAyahPerDay: 15,
  sequentialSurahMode: false,
  consolidationDayInterval: 0  // No consolidation days
};

// Hifdh completion (finishing remaining Quran)
const completionMode = {
  maxAyahPerDay: 20,
  sequentialSurahMode: true,
  consolidationDayInterval: 7
};
```

### Rule-Level Control (Advanced)
For fine-grained control, you can configure individual rules:

```typescript
import { RuleEngine, MaxAyahRule, SurahCompletionRule } from '@maken/core';

// Custom rule engine with modified priorities
const engine = new RuleEngine([
  new AyahIntegrityRule(),
  new SurahCompletionRule({ maxRemainingAyahs: 3 }), // Stricter: only 3 ayahs to complete
  new SurahSnapRule(),
  new PageAlignmentRule(),
  new ThematicHaltingRule(),
  new BalanceCorrectionRule(),
  new MaxAyahRule({ maxAyah: 8 })  // Override default 10
]);
```

---

## Notes for NestJS Integration

Recommended controller split:

- `PlansController`
- `ExportsController`
- `DatasetController`

Recommended service split:

- `PlanPreviewService`
- `PlanGenerationService`
- `PlanExportService`
- `DatasetValidationService`
