// src/main.ts
/**
 * MakenCore Quran Planning Engine - Main Entry Point
 * ==================================================
 * 
 * This file demonstrates the full capabilities of the planning engine
 * with pedagogical constraints for human-optimized Quran memorization.
 * 
 * ## OUTPUT FORMAT EXPLANATION:
 * 
 * يوم 1 | 2026-02-01                    → Day number and date
 *    حفظ جديد: التَّحريم (1) ⬅️ (6)    → New memorization: Surah (start) ➡️ (end)
 *    مراجعة صغرى: ...                   → Minor review (last 5 lessons)
 *    مراجعة كبرى: ...                   → Major review (20-page cycle)
 * 
 * Track Icons:
 * - حفظ جديد (Hifz)       → Green: New memorization
 * - مراجعة صغرى (Minor)   → Blue: Review last 5 lessons
 * - مراجعة كبرى (Major)   → Orange: Cycle through memorized portions
 * 
 * Special Markers:
 * -  → Major review track reset (completed a full cycle)
 * 
 * ## AVAILABLE MODES & CONFIGURATIONS:
 * 
 * ### 1. DIRECTION MODES:
 * - isReverse: true   → Start from Surah 66 backwards (for finishing Quran)
 * - isReverse: false  → Start from Surah 1 forwards (for beginning Quran)
 * 
 * ### 2. PEDAGOGICAL CONSTRAINTS:
 * 
 * maxAyahPerDay: 5-20 (default: 10)
 *   → Hard cap on daily memorization to prevent cognitive overload
 *   → Example: 10 = never exceed 10 ayahs/day (except small overages to complete surah)
 * 
 * sequentialSurahMode: true/false (default: true)
 *   → true: Complete current surah before starting next (≤5 ayahs remaining = complete)
 *   → false: Can stop mid-surah and jump to next
 * 
 * strictSequentialMode: true/false (default: false) [NEW]
 *   → true: NEVER change surah until 100% complete (even if maxAyah exceeded)
 *   → false: Allows small overages (≤5 ayahs) to complete surah
 *   → Use case: Students who get confused by surah switching
 * 
 * consolidationDayInterval: 0-30 (default: 6)
 *   → Every N days = "consolidation day" (no new hifz, only review)
 *   → 0 = disabled (no consolidation days)
 *   → 6 = every 6th day is review-only (spaced repetition)
 *   → Recommended: 5-7 days
 * 
 * ### 3. TRACK CONFIGURATIONS:
 * 
 * addHifz(linesPerDay, startLocation)
 *   → Main memorization track
 *   → linesPerDay: 5-20 lines (affects calculation base)
 *   → startLocation: {surah, ayah}
 * 
 * addMinorReview(lessonCount, WindowMode)
 *   → Reviews last N lessons
 *   → lessonCount: 3-7 lessons (default: 5)
 *   → WindowMode.GRADUAL: Builds up gradually
 *   → WindowMode.FIXED: Always shows N lessons
 * 
 * addMajorReview(linesPerDay, startLocation)
 *   → Long-term review cycling
 *   → linesPerDay: 15*20 = 300 lines = ~20 pages
 *   → Cycles through entire memorized portion
 * 
 * ### 4. COMMAND-LINE FLAGS:
 * 
 * npm start              → Default: Console + Excel export
 * npm start --json      → JSON API output only
 * npm start --excel     → Excel export only
 * npm start --help      → Show help
 * 
 * ### 5. PRESET CONFIGURATIONS:
 * 
 * // Conservative (beginners, elderly, busy professionals)
 * { maxAyahPerDay: 5, sequentialSurahMode: true, consolidationDayInterval: 5 }
 * 
 * // Standard (most students) - DEFAULT
 * { maxAyahPerDay: 10, sequentialSurahMode: true, consolidationDayInterval: 6 }
 * 
 * // Intensive (experienced memorizers)
 * { maxAyahPerDay: 15, sequentialSurahMode: false, consolidationDayInterval: 0 }
 * 
 * // Completion Mode (finishing remaining Quran)
 * { maxAyahPerDay: 20, sequentialSurahMode: true, consolidationDayInterval: 7 }
 * 
 * ### 6. RULE PIPELINE (Order of Execution):
 * 
 * Priority 5:   AyahIntegrityRule       → Never split ayahs
 * Priority 18:  SurahCompletionRule     → Complete surah if ≤5 remaining
 * Priority 20:  SurahSnapRule           → Snap to surah end if nearby
 * Priority 30:  PageAlignmentRule       → Snap to page boundaries
 * Priority 40:  ThematicHaltingRule     → Snap to hizb/juz (only for surahs >50 ayahs)
 * Priority 50:  BalanceCorrectionRule   → Adjust to target line count
 * Priority 55:  MaxAyahRule             → HARD CAP (runs LAST)
 * 
 * ## STEP FLAGS (Internal):
 * - 'memorization'  → New Hifz step (subject to MaxAyahRule)
 * - 'review'        → Review step (skips MaxAyahRule)
 * - 'completed'     → Track reached end
 * - 'reset'         → Major review track reset
 * 
 * For full documentation, see:
 * - doc/planning-engine/pedagogical-rules-guide.md
 * - doc/planning-engine/planning-engine-api-contracts.md
 */

import { PlanBuilder } from './builders/PlanBuilder';
import { WindowMode } from './core/constants';
import { PlanExporter } from './utils/PlanExporter';
import { MakenEngine, CreatePlanPreviewRequestDTO } from './index';

/**
 * Main Entry Point
 * Orchestrates the planning process using the refactored architecture.
 * Supports command-line flags for different output modes.
 */
async function main() {
    const args = process.argv.slice(2);
    const isJsonMode = args.includes('--json');
    const isExcelMode = args.includes('--excel');
    const isHelpMode = args.includes('--help') || args.includes('-h');

    if (isHelpMode) {
        console.log(`
MakenCore Quran Planning Engine - Usage:

npm start              - Default: Console + Excel export
npm run start:json    - JSON output only (API format)
npm run start:excel   - Excel export only
npm start --help      - Show this help

Flags:
--json                Output pure JSON (API format)
--excel               Export to Excel file
--help                Show help message
        `);
        return;
    }

    console.log("\nMakenCore Quran Planning Engine - Refactored Edition\n");

    try {
        console.log("Setting up plan...");

        if (isJsonMode) {
            // JSON API Mode - Use MakenEngine for pure JSON output
            const jsonRequest: CreatePlanPreviewRequestDTO = {
                name: "Sample JSON Plan",
                direction: "FORWARD",
                daysPerWeek: 5,
                tracks: [
                    {
                        type: "HIFZ",
                        priority: 1,
                        amountUnit: "LINES",
                        amountValue: 15,
                        start: { surah: 1, ayah: 1 }
                    },
                    {
                        type: "MINOR_REVIEW",
                        priority: 2,
                        amountUnit: "LINES",
                        amountValue: 5,
                        start: { surah: 114, ayah: 1 }
                    }
                ],
                startDate: "2026-03-30"
            };

            console.log("=== PURE JSON OUTPUT ===");
            const result = MakenEngine.generatePlan(jsonRequest);
            console.log(JSON.stringify(result, null, 2));

            if (result.success) {
                console.log(`\nPlan Summary:`);
                console.log(`- Total Days: ${result.data.totalDays}`);
                console.log(`- Completion: ${result.data.estimatedCompletionDate}`);
                console.log(`- Plan Events: ${result.data.plan.length} days`);
            }
        } else {
            // Default Mode - Use PlanBuilder for Excel + Console output
            const builder = new PlanBuilder();

            // 🔧 CURRENT CONFIGURATION (Standard Mode):
            // - Direction: Reverse (starting from Surah 66 backwards)
            // - Days: Sun-Thu (5 days/week), 30-day limit
            // 
            // 📊 PEDAGOGICAL CONSTRAINTS:
            // maxAyahPerDay: 10 → Never exceed 10 ayahs/day (small overages allowed to complete surah)
            // sequentialSurahMode: true → Complete surah before jumping (≤5 remaining ayahs)
            // strictSequentialMode: false → Allow small overages (use true for 100% strict)
            // consolidationDayInterval: 6 → Every 6th day = review only (Days 6,12,18,24,30)
            //
            // 🎯 ALTERNATIVE MODES you can try:
            //
            // // 1. Conservative (Beginners/Elderly)
            // { maxAyahPerDay: 5, sequentialSurahMode: true, consolidationDayInterval: 5 }
            //
            // // 2. Intensive (Experienced)
            // { maxAyahPerDay: 15, sequentialSurahMode: false, consolidationDayInterval: 0 }
            //
            // // 3. Strict Sequential (Students who get confused)
            // { maxAyahPerDay: 10, sequentialSurahMode: true, strictSequentialMode: true, consolidationDayInterval: 6 }
            //
            // // 4. Completion Mode (Finishing Quran)
            // { maxAyahPerDay: 20, sequentialSurahMode: true, consolidationDayInterval: 7 }
            const manager = builder
                .setSchedule({
                    startDate: "2026-02-01",
                    daysPerWeek: 5,          // Sun-Thu
                    limitDays: 30,            // 0 = unlimited
                    isReverse: true,
                    // Pedagogical constraints for human-optimized planning
                    maxAyahPerDay: 10,        // Hard cap: never exceed 10 ayahs/day
                    sequentialSurahMode: true, // Complete surah before jumping (≤5 ayahs)
                    strictSequentialMode: false, // Allow small overages to complete surah
                    consolidationDayInterval: 6  // Every 6th day = review only (no hifz)
                })
                // Scenario: Memorization with review
                .addHifz(
                    10,                        // lines per day
                    { surah: 66, ayah: 1 }     // from Surah At-Tahrim
                )
                .addMinorReview(5, WindowMode.GRADUAL)            // 5 lessons minor review
                .addMajorReview(15 * 20, { surah: 114, ayah: 1 })           // 20 pages major review (from end for reverse planning)
                .stopWhenCompleted()          // Stop when hifz track completes
                .build();

            // 2. Generation (Simulation Phase)
            console.time("Generation Time");
            const plan = manager.generatePlan();
            console.timeEnd("Generation Time");

            console.log(`Generated ${plan.length} days (plan stopped at goal completion).\n`);

            // 3. Export and display (Exporter handles dynamic events now)
            const exporter = new PlanExporter();

            // a) Console display for quick verification
            if (!isExcelMode) {
                exporter.printToConsole(plan);
            }

            // b) Export Excel file
            const fileName = `QuranPlan_Refactored_${new Date().toISOString().split('T')[0]}.xlsx`;
            console.log(`Saving Excel file: ${fileName}...`);

            await exporter.exportToExcel(plan, fileName);

            console.log("Operation completed successfully. System is working perfectly!");
        }

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

// Run the program
main().catch(console.error);