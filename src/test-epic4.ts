import { PlanBuilder } from './builders/PlanBuilder';
import { WindowMode, TrackId } from './core/constants';
import { ExcelExportAdapter } from './infrastructure/adapters/export/ExcelExportAdapter';
import { PdfExportAdapter } from './infrastructure/adapters/export/PdfExportAdapter';
import { PlanMapper } from './infrastructure/mappers/PlanMapper';

/**
 * Epic 4 Testing Page (Console-based for now)
 * This script validates the entire pipeline from generation to infrastructure mapping.
 */
async function runEpic4Test() {
    console.log("==========================================");
    console.log("🚀 Maken Engine - Epic 4 Laboratory");
    console.log("==========================================\n");

    try {
        // 1. Generation Phase
        console.log("Step 1: Generating a multi-track plan...");
        const builder = new PlanBuilder();
        const manager = builder
            .setSchedule({
                startDate: "2026-04-01",
                daysPerWeek: 5,
                limitDays: 14, // 2 weeks
                isReverse: false
            })
            .addHifz(15, { surah: 2, ayah: 1 }) // 1 page per day
            .addMinorReview(3, WindowMode.GRADUAL)
            .addMajorReview(300, { surah: 1, ayah: 1 })
            .build();

        const plan = manager.generatePlan();
        console.log(`✅ Plan generated: ${plan.length} days.\n`);

        // 2. Persistence Readiness (Mapping)
        console.log("Step 2: Testing Domain <-> Persistence Mapping...");
        const domainRecord = {
            id: "test-plan-uuid-001",
            config: {
                startDate: new Date("2026-04-01"),
                tracks: [
                    { type: 'HIFZ', dailyTargetLines: 15 },
                    { type: 'MINOR_REVIEW', dailyTargetLines: 45 }
                ]
            },
            days: plan,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const prismaPayload = PlanMapper.toPersistence(domainRecord as any);
        console.log("✅ Prisma Payload created successfully.");
        console.log(`   - Total Days in payload: ${prismaPayload.days.create.length}`);
        console.log(`   - Tracks defined: ${prismaPayload.tracks.create.length}\n`);

        // 3. Export Phase (Excel)
        console.log("Step 3: Testing Professional Excel Export...");
        const excelAdapter = new ExcelExportAdapter();
        const excelFile = "Epic4_Test_Plan.xlsx";
        await excelAdapter.export(plan, { 
            fileName: excelFile,
            includeTeacherReview: true 
        });
        console.log(`✅ Excel file exported: ${excelFile}\n`);

        // 4. PDF Export Scaffolding
        console.log("Step 4: Testing PDF Export Adapter...");
        const pdfAdapter = new PdfExportAdapter();
        const pdfBuffer = await pdfAdapter.generateBuffer(plan, { includeTeacherReview: true });
        console.log(`✅ PDF Buffer generated (${pdfBuffer.length} bytes). Type: ${typeof pdfBuffer}\n`);

        console.log("==========================================");
        console.log("🎉 ALL EPIC 4 INFRASTRUCTURE TESTS PASSED!");
        console.log("==========================================");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

runEpic4Test();
