# API Contracts — Quran Planning Engine

## Purpose
Define backend-facing request and response contracts for the planning engine.

These contracts are intended for a future NestJS service layer.

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

---

## Validation Rules

- `startDate` must be ISO date format
- `daysPerWeek` must be 1-7
- track amounts must be positive
- location coordinates must be valid Quran references
- review tracks must not exceed the planned memorization horizon
- export format must be one of supported values

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
