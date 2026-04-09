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
                    daysPerWeek: 5,          // \u0627\u0644\u0623\u062d\u062f - \u0627\u0644\u062e\u0645\u064a\u0633
                    limitDays: 30,            // 0 = \u0627\u0633\u062a\u0645\u0631 \u062d\u062a\u0649 \u0627\u0644\u062a\u0648\u0642\u0641 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a
                    isReverse: true
                })
                // \ud83c\udfaf \u0633\u064a\u0646\u0627\u0631\u064a\u0648: \u062d\u0641\u0638 \u0633\u0648\u0631\u0629 \u0627\u0644\u0628\u0642\u0631\u0629 \u0645\u0639 \u0645\u0631\u0627\u062c\u0639\u0629
                .addHifz(
                    10,                        // lines per day
                    { surah: 66, ayah: 1 }     // from Surah At-Tahrim
                )
                .addMinorReview(5, WindowMode.GRADUAL)            // \u0645\u0631\u0627\u062c\u0639\u0629 5 \u062f\u0631\u0648\u0633 (\u0635\u063a\u0631\u0649)
                .addMajorReview(15 * 20, { surah: 67, ayah: 1 })           // \u0645\u0631\u0627\u062c\u0639\u0629 20 \u0648\u062c\u0647 (\u0643\u0628\u0631\u0649)
                .stopWhenCompleted()          // \ud83d\udeab \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u062a\u0648\u0642\u0641 \u0627\u0644\u0630\u0643\u064a
                .build();

            // 2. \u0627\u0644\u062a\u0648\u0644\u064a\u062f (Simulation Phase)
            console.time("\u23f1\ufe0f  \u0632\u0645\u0646 \u0627\u0644\u062a\u0648\u0644\u064a\u062f");
            const plan = manager.generatePlan();
            console.timeEnd("\u23f1\ufe0f  \u0632\u0645\u0646 \u0627\u0644\u062a\u0648\u0644\u064a\u062f");

            console.log(`\u2705 \u062a\u0645 \u062a\u0648\u0644\u064a\u062f ${plan.length} \u064a\u0648\u0645 (\u062a\u0648\u0642\u0641\u062a \u0627\u0644\u062e\u0637\u0629 \u0639\u0646\u062f \u0627\u0643\u062a\u0645\u0627\u0644 \u0627\u0644\u0647\u062f\u0641).\n`);

            // 3. \u0627\u0644\u062a\u0635\u062f\u064a\u0631 \u0648\u0627\u0644\u0639\u0631\u0636 (Exporter handles dynamic events now)
            const exporter = new PlanExporter();

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