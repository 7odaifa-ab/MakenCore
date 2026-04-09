# MakenCore — Quran Planning Engine

**MakenCore** is a standalone, purely typed, deterministic TypeScript scheduling engine for Quran memorization and review tracking. It is designed to be imported as an NPM library into parent SaaS platforms (such as a NestJS backend) to provide isolated domain logic.

![MakenCore](https://img.shields.io/badge/Status-Production%20Ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## Core Capabilities
- **Deterministic scheduling** for Hifz, Minor Review, and Major Review tracks.
- **Canonical Quran range calculations** using directional prefix-sum indexing.
- **Rule-based pedagogical adjustment** for ayah integrity, surah continuity, page alignment, thematic halting, and consolidation.
- **Builder-level planning modes** for planning by duration or by daily amount.
- **Library-friendly output** for integration into backend or frontend systems.

---

## Planning Modes

MakenCore supports two official hifz planning modes at the builder level.

### 1. Plan By Duration

Use this when you know the Quran range and the total number of days available.

You provide:
- `from`
- `to`
- `durationDays`
- `daysPerWeek`

The engine derives:
- daily hifz amount in `lines`
- plan `limitDays`

```typescript
const manager = new PlanBuilder()
  .setSchedule({
    startDate: '2026-02-01',
    daysPerWeek: 5,
    isReverse: true,
    maxAyahPerDay: 5,
    sequentialSurahMode: true,
    strictSequentialMode: true,
    consolidationDayInterval: 5
  })
  .planByDuration({
    from: { surah: 66, ayah: 1 },
    to: { surah: 58, ayah: 8 },
    durationDays: 30
  })
  .addMinorReview(3, WindowMode.GRADUAL)
  .addMajorReview(15 * 5, { surah: 114, ayah: 1 })
  .stopWhenCompleted()
  .build();
```

### 2. Plan By Daily Amount

Use this when you know the Quran range and the daily workload you want to maintain.

You provide:
- `from`
- `to`
- `dailyLines`
- `daysPerWeek`

The engine derives:
- required study days
- calendar `limitDays`

```typescript
const manager = new PlanBuilder()
  .setSchedule({
    startDate: '2026-02-01',
    daysPerWeek: 6,
    isReverse: true,
    maxAyahPerDay: 12,
    sequentialSurahMode: true,
    strictSequentialMode: false,
    consolidationDayInterval: 7
  })
  .planByDailyAmount({
    from: { surah: 66, ayah: 1 },
    to: { surah: 55, ayah: 78 },
    dailyLines: 14
  })
  .addMinorReview(7, WindowMode.GRADUAL)
  .addMajorReview(15 * 10, { surah: 114, ayah: 1 })
  .stopWhenCompleted()
  .build();
```

---

## Installation

```bash
npm install maken-core
```

---

## Usage

**MakenCore** exports a single Facade `MakenEngine` along with strict Data Transfer Objects (DTOs) and Domain Types for your application to consume.

### For API Integrations (NestJS, Express, etc.)
The primary boundary for consumer applications is the `MakenEngine` class.

```typescript
import { 
    MakenEngine, 
    CreatePlanPreviewRequestDTO 
} from 'maken-core';

// 1. Build the DTO Request
const payload: CreatePlanPreviewRequestDTO = {
    name: "Ramadan Intensive",
    direction: "FORWARD", // or 'REVERSE'
    daysPerWeek: 5,
    tracks: [
        {
            type: "HIFZ",
            priority: 1,
            amountUnit: "LINES",
            amountValue: 15,
            start: { surah: 1, ayah: 1 }
        }
    ],
    startDate: "2026-03-30"
};

// 2. Execute the Domain logic
const result = MakenEngine.generatePlan(payload);

if (result.success) {
    const planDays = result.data.plan;
    console.log(`Plan spans ${result.data.totalDays} days`);
    // Pass `planDays` to your Prisma service to save them to PostgreSQL!
}
```

### Builder Usage

If you want direct control over tracks and planning behavior, use `PlanBuilder`:

```typescript
import { PlanBuilder, WindowMode } from 'maken-core';

const builder = new PlanBuilder();
const manager = builder
    .setSchedule({ 
        startDate: "2026-03-30", 
        daysPerWeek: 5, 
        isReverse: false,
        // Pedagogical constraints for retention-optimized planning
        maxAyahPerDay: 10,
        sequentialSurahMode: true,
        consolidationDayInterval: 6
    })
    .planByDailyAmount({
        from: { surah: 2, ayah: 1 },
        to: { surah: 2, ayah: 286 },
        dailyLines: 15
    })
    .addMinorReview(5, WindowMode.GRADUAL)
    .stopWhenCompleted()
    .build();

const days = manager.generatePlan();
```

---

## Returned Output

The engine returns generated plan days that your parent application can persist, transform, or export.

Typical outputs include:

- daily plan entries
- memorization and review events
- estimated completion information through higher-level integrations

Typical event categories include:

- `MEMORIZATION`
- `REVIEW`
- `CATCH_UP`
- `BREAK`

---

## Notes for Library Consumers

- The scenario launcher and Excel scripts in this repository are intended primarily for internal QA and manual verification.
- For production integrations, consume the generated plan data and perform persistence/export in your host application.
- For full technical details, planning phases, and QA workflows, see the `/doc` folder.

---

## Documentation

Additional documentation is available in the `/doc` folder:

| Document | Purpose |
|----------|---------|
| [API Contracts](doc/planning-engine/planning-engine-api-contracts.md) | API and TypeScript integration contracts |
| [Planning Modes & Phases](doc/planning-engine/planning-modes-and-phases.md) | Internal planning modes, implementation phases, and milestones |
| [Pedagogical Rules Guide](doc/planning-engine/pedagogical-rules-guide.md) | Rule behavior and pedagogical configuration |
| [PRD](doc/planning-engine/planning-engine-prd.md) | Product and architecture details |

---

## Testing

```bash
npm install
npm run test:vitest
```

**Total automated tests:** 37/37 (100% Passing).
