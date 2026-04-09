// src/main.ts
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
\u0631\u0648\u0646 Quran Planning Engine - Usage:

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

    console.log("\n\u0631\u0648\u0646 Quran Planning Engine - Refactored Edition\n");

    try {
        console.log("\u2699\ufe0f  \u062c\u0627\u0631\u064d \u0625\u0639\u062f\u0627\u062f \u0627\u0644\u062e\u0637\u0629...");

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

            const manager = builder
                .setSchedule({
                    startDate: "2026-02-01",
                    daysPerWeek: 5,          // Sun-Thu
                    limitDays: 30,            // 0 = unlimited
                    isReverse: true,
                    // Pedagogical constraints for human-optimized planning
                    maxAyahPerDay: 10,        // Hard cap: never exceed 10 ayahs/day
                    sequentialSurahMode: true, // Complete surah before jumping
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

            console.log(`تم توليد ${plan.length} يوم (توقت الخطة عند اكتمال الهدف).\n`);

            // 3. التصدير والعرض (Exporter handles dynamic events now)
            const exporter = new PlanExporter();

            // أ) العرض في الكونسول للتأكد
            // \u0623) \u0627\u0644\u0639\u0631\u0636 \u0641\u064a \u0627\u0644\u0643\u0648\u0646\u0633\u0648\u0644 \u0644\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0633\u0631\u064a\u0639
            if (!isExcelMode) {
                exporter.printToConsole(plan);
            }

            // \u0628) \u062a\u0635\u062f\u064a\u0631 \u0645\u0644\u0641 \u0627\u0644\u0625\u0643\u0633\u0644
            const fileName = `QuranPlan_Refactored_${new Date().toISOString().split('T')[0]}.xlsx`;
            console.log(`\ud83d\udcbe \u062c\u0627\u0631\u064d \u062d\u0641\u0638 \u0645\u0644\u0641 \u0627\u0644\u0625\u0643\u0633\u0644: ${fileName}...`);

            await exporter.exportToExcel(plan, fileName);

            console.log("\ud83c\udf89 \u062a\u0645\u062a \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0628\u0646\u062c\u0627\u062d. \u0627\u0644\u0646\u0638\u0627\u0645 \u064a\u0639\u0645\u0644 \u0628\u0627\u0645\u062a\u064a\u0627\u0632!");
        }

    } catch (error) {
        console.error("\u274c Critical Error:", error);
    }
}

// \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062c
main().catch(console.error);