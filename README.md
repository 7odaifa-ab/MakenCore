# MakenCore

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/7odaifa-ab/MakenCore)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Arabic](https://img.shields.io/badge/lang-العربية-green)](./README.ar.md)
[![Zakhm](https://img.shields.io/badge/Made%20by-Zakhm-9cf)](https://zakhm.com)

> Deterministic TypeScript scheduling engine for Quran memorization (Hifz) and review tracking.

MakenCore generates day-by-day study plans that balance **new memorization**, **minor review** (recent material), and **major review** (full-cycle review). Designed as a standalone library for integration into backend systems (NestJS, Express, etc.).

---

## Quick Start

### Installation

```bash
npm install maken-core
```

### Minimal Example

```typescript
import { MakenEngine } from 'maken-core';

const result = MakenEngine.generatePlan({
    name: "30-Day Hifz",
    direction: "FORWARD",
    daysPerWeek: 5,
    tracks: [{
        type: "HIFZ",
        priority: 1,
        amountUnit: "LINES",
        amountValue: 10,
        start: { surah: 1, ayah: 1 }
    }],
    startDate: "2026-04-01"
});

if (result.success) {
    console.log(`Plan: ${result.data.totalDays} days`);
    console.log(result.data.plan); // Array of daily events
}
```

### Builder Pattern (Advanced)

```typescript
import { PlanBuilder, WindowMode } from 'maken-core';

const manager = new PlanBuilder()
    .setSchedule({
        startDate: "2026-04-01",
        daysPerWeek: 6,
        isReverse: false,
        maxAyahPerDay: 8
    })
    .planByDailyAmount({
        from: { surah: 2, ayah: 1 },
        to: { surah: 2, ayah: 286 },
        dailyLines: 12
    })
    .addMinorReview(5, WindowMode.GRADUAL)
    .stopWhenCompleted()
    .build();

const days = manager.generatePlan();
```

---

## Core Capabilities

| Feature | Description |
|---------|-------------|
| **Multi-track scheduling** | Hifz (new), Minor Review (recent), Major Review (full cycle) |
| **Canonical Quran indexing** | Directional prefix-sum calculations for any range |
| **Pedagogical rules** | Ayah integrity, surah continuity, consolidation days |
| **Planning modes** | By duration ("finish in X days") or by daily amount ("Y lines/day") |
| **Library-first design** | Pure TypeScript, no dependencies, deterministic output |

---

## Configuration

### Schedule Options

```typescript
.setSchedule({
    startDate: "2026-04-01",     // ISO date
    daysPerWeek: 5,              // 1-7
    isReverse: false,            // false = Al-Fatiha → An-Nas
    maxAyahPerDay: 10,           // Hard cap (5-20)
    sequentialSurahMode: true,   // Complete surah before next
    strictSequentialMode: false, // Never switch until 100% done
    consolidationDayInterval: 6, // Every Nth day = review only
    surahBoundedMinorReview: false, // Keep review in current surah
    minorReviewPagesCount: 5    // Pages to review (15 lines = 1 page)
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `startDate` | string | required | Plan start date (YYYY-MM-DD) |
| `daysPerWeek` | number | required | Study days per week |
| `isReverse` | boolean | false | Direction: true = An-Nas → Al-Fatiha |
| `maxAyahPerDay` | number | 10 | Daily memorization cap |
| `sequentialSurahMode` | boolean | true | Complete surah before next |
| `strictSequentialMode` | boolean | false | Never change surah until 100% |
| `consolidationDayInterval` | number | 6 | Review-only day interval (0=off) |
| `surahBoundedMinorReview` | boolean | false | Minor review stays in current surah |
| `minorReviewPagesCount` | number | — | Review amount in pages |

---

## Planning Modes

### 1. Plan By Duration

Provide: `from`, `to`, `durationDays`, `daysPerWeek`  
Engine derives: `dailyLines`, `limitDays`

```typescript
const manager = new PlanBuilder()
    .setSchedule({
        startDate: '2026-02-01',
        daysPerWeek: 5,
        isReverse: true,
        maxAyahPerDay: 5
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

Provide: `from`, `to`, `dailyLines`, `daysPerWeek`  
Engine derives: required study days, calendar `limitDays`

```typescript
const manager = new PlanBuilder()
    .setSchedule({
        startDate: '2026-02-01',
        daysPerWeek: 6,
        isReverse: true,
        maxAyahPerDay: 12
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

## Output

The engine returns daily plan entries with event categories:

| Event Type | Description |
|------------|-------------|
| `MEMORIZATION` | New material to memorize |
| `REVIEW` | Scheduled review events |
| `CATCH_UP` | Overflow/adjustment events |
| `BREAK` | Rest/consolidation days |

```typescript
if (result.success) {
    const planDays = result.data.plan;
    // Persist to your database (Prisma, etc.)
}
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [API Contracts](doc/planning-engine/planning-engine-api-contracts.md) | TypeScript integration contracts |
| [Planning Modes & Phases](doc/planning-engine/planning-modes-and-phases.md) | Implementation phases and milestones |
| [Pedagogical Rules Guide](doc/planning-engine/pedagogical-rules-guide.md) | Rule behavior and configuration |
| [PRD](doc/planning-engine/planning-engine-prd.md) | Product and architecture details |

---

## Testing

```bash
npm install
npm run test:vitest
```

**Total automated tests:** 37/37 (100% Passing).

---

## Notes for Library Consumers

- Scenario launchers and Excel scripts in `/src` are for internal QA only
- For production: consume `planDays` and handle persistence in your host application
- Full technical details in the `/doc` folder

---

<div align="center">

## Built with 💜 by Zakhm

<table>
<tr>
<td width="100" align="center">
<img src="https://github.com/user-attachments/assets/9223eb9d-920c-4ae6-8fb5-8ab3883ee105" alt="Zakhm Logo" width="80" height="80" style="border-radius: 12px;">
</td>
<td>

**[Zakhm](https://zakhm.com)** — Empowering Islamic education through technology.

We believe great tools should be accessible to all. Use MakenCore freely, and consider contributing back to help the community grow.

📄 Licensed under [Zakhm Attribution License (ZAL) 1.0](./LICENSE)

</td>
</tr>
</table>

</div>
