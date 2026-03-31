# MakenCore — Quran Planning Engine

**MakenCore** is a standalone, purely typed, deterministic TypeScript scheduling engine for Quran memorization and review tracking. It is designed to be imported as an NPM library into parent SaaS platforms (such as a NestJS backend) to provide isolated domain logic.

![MakenCore](https://img.shields.io/badge/Status-Production%20Ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## Core Capabilities
- **Deterministic Scheduling:** Multi-track (Hifz, Minor Review, Major Review) load balancing and rule-driven event generation.
- **Canonical Dataset Validation:** Leverages an $O(1)$ directional prefix-sum indexing system using the ground-truth Hafs v18 script for mathematically sound page and thematic bounds.
- **Rule Pipeline:** `RuleEngine` architecture enforces `AyahIntegrity`, `SurahSnap` to `<7 lines`, `PageAlignment`, and `ThematicHalting`.
- **Stateless Operation:** Pure JSON-in (`CreatePlanPreviewRequestDTO`), JSON-out (`CreatePlanPreviewResponseDTO`).

---

## 📦 Installation & Usage

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

### Advanced: Direct Domain Access
If you are building custom workflows, you can bypass the Facade and use the domain builders directly:

```typescript
import { PlanBuilder, WindowMode } from 'maken-core';

const builder = new PlanBuilder();
const manager = builder
    .setSchedule({ startDate: "2026-03-30", daysPerWeek: 5, isReverse: false })
    .addHifz(15, { surah: 2, ayah: 1 })
    .addMinorReview(5, WindowMode.GRADUAL)
    .stopWhenCompleted()
    .build();

const days = manager.generatePlan();
```

---

## 🗃️ Application Boundaries (Phase 5)

MakenCore has deliberately offloaded presentation and database concerns to the parent application.

### 1. Presentation & Exports
PDF and formal Excel generation are **out of scope** for this engine to prevent package bloat. MakenCore returns pure JSON `PlanDay[]` arrays. The NestJS server or React frontend is responsible for passing this data into `pdfkit` or `exceljs`. 

*(Note: basic Excel scripts are maintained as `devDependencies` for internal QA and debugging).*

### 2. Database Persistence
Your backend should persist MakenCore's output. A complete [Prisma Schema Strategy Matrix](doc/planning-engine-prisma-schema-draft.md) is included in the documentation folder to help you instantly map MakenCore's events to PostgreSQL.

---

## 🧪 Testing

The engine is backed by a deterministic test suite utilizing Vitest for rule regression, multi-track load balancing, dataset validation, and Facade DTO assertions.

```bash
npm install
npm run test:vitest
```

**Total automated tests:** 37/37 (100% Passing).
