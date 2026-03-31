# MakenCore User Guide 📖

This guide explains the core scheduling logic and track types within **MakenCore** for Quran teachers and platform developers.

---

## 1. Core Scheduling Logic

Every plan in MakenCore is built using one or more **Tracks**. Each track has a specific behavior and priority relative to others.

### 📗 Hifz Track (Primary / حفظ جديد)
- **Logic:** Linear Movement.
- **How it works:** It follows the student's primary path (Forward or Reverse). It stops when the student reaches the `endLocation`.
- **Priority:** Always executed first (Priority 1) to establish the "current memorization edge."

### 📘 Minor Review (Moving Window / مراجعة صغرى - تثبيت)
- **Logic:** **Moving Window (نافذة متحركة)**.
- **How it works:** It reviews the most recent $N$ units (lines/pages/lessons) *immediately behind* the Hifz track.
- **Goal:** To ensure high-frequency repetition of recently memorized material (Tathbit).
- **Modes:** 
  - `GRADUAL`: Starts from 0 on Day 1 and grows until it reaches the window size.
  - `FIXED`: Always looks back for exactly the window size from Day 1 (suitable if prior memorization exists).

### 📙 Major Review (Looping Track / مراجعة كبرى)
- **Logic:** **Looping Cycle (دورة مستمرة)**.
- **How it works:** It cycles through everything memorized *behind* the Minor Review zone.
- **Safety Rule:** Uses a `WallConstraint` to ensure it never overlaps with the Minor Review or Hifz tracks. When it hits the "Wall," it resets to the start location and loops again.

---

## 2. Stabilization & Catch-Up Logic

### 🗓️ Weekly Catch-Up Day (يوم استدراك)
MakenCore supports a `catchUpDay` configuration (e.g., Saturday).
- **Behavior:** On this day, the **Hifz Track is frozen** (no new memorization).
- **Consolidation:** The **Review Tracks (Minor & Major) continue to run**.
- **Impact:** This allows students to stabilize their weekly progress without increasing cumulative load.

### 🔄 Directional Planning
- **FORWARD:** Planning from Surah Al-Fatiha toward Surah An-Nas.
- **REVERSE:** Planning from Surah An-Nas toward Surah Al-Fatiha (Juz Amma first).
- *The `RuleEngine` automatically adjusts snapping and page alignment rules to be symmetric in both directions.*

---

## 3. DTO & API Cheat Sheet

To generate a plan using this logic, use the `MakenEngine` (or `EngineFacade`) with the following structure:

```json
{
  "name": "Memorization Plan",
  "startDate": "2026-04-01",
  "direction": "FORWARD",
  "daysPerWeek": 5,
  "catchUpDay": 6,  // Saturday (index 6)
  "tracks": [
    { "type": "HIFZ", "amountValue": 15, "start": { "surah": 2, "ayah": 1 } },
    { "type": "MINOR_REVIEW", "amountValue": 5 }, // 5 pages window
    { "type": "MAJOR_REVIEW", "amountValue": 30 } // 30 lines loop
  ]
}
```

---

## 4. Documentation Hierarchy

To find more detailed technical information, refer to:
- **[Planning PRD](doc/planning-engine/planning-engine-prd.md):** The mathematical rules (Ayah Integrity, Page Snapping).
- **[Technical Architecture](src/tracks/README.md):** Implementation details of tracks and strategies.
- **[API Contracts](src/infrastructure/api/contracts.ts):** Full DTO type definitions.
