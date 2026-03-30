import { GeneratePreviewRequestDTO, GeneratePreviewResponseDTO, ExportRequestDTO } from '../../infrastructure/api/contracts';

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTests() {
    console.log("Running Epic 4 tests: API Contracts Validation...");

    // Test 1: GeneratePreviewRequestDTO structure
    const payload: GeneratePreviewRequestDTO = {
        name: 'Ramadan Plan',
        direction: 'FORWARD',
        daysPerWeek: 5,
        catchUpDay: 6,
        tracks: [
            {
                type: 'HIFZ',
                priority: 1,
                amountUnit: 'LINES',
                amountValue: 15,
                start: { surah: 1, ayah: 1 },
                end: { surah: 2, ayah: 286 }
            }
        ],
        startDate: '2026-03-30'
    };

    assert(payload.tracks !== undefined, "Expected tracks property");
    assert(payload.tracks[0].type === 'HIFZ', "Expected type to be HIFZ");
    assert(payload.tracks[0].start?.surah === 1, "Expected start surah 1");
    console.log("✓ GeneratePreviewRequestDTO shape valid");

    // Test 2: ExportRequestDTO structure
    const exportPayload: ExportRequestDTO = {
        planId: 'some-uuid-1234',
        format: 'excel',
        includeTeachersNotes: true
    };

    assert(exportPayload.planId === 'some-uuid-1234', "Expected planId");
    assert(exportPayload.format === 'excel', "Expected format excel");
    assert(exportPayload.includeTeachersNotes === true, "Expected includeTeachersNotes true");
    console.log("✓ ExportRequestDTO shape valid");

    // Test 3: GeneratePreviewResponseDTO shape
    const response: GeneratePreviewResponseDTO = {
        success: true,
        data: {
            estimatedCompletionDate: '2026-04-30',
            totalDays: 1,
            plan: [
                {
                    dayNumber: 1,
                    date: '2026-03-30',
                    dayType: 'WORKING',
                    totalLoad: 15,
                    events: [
                        {
                            trackType: 'HIFZ',
                            eventType: 'MEMORIZATION',
                            start: { surah: 1, ayah: 1 },
                            end: { surah: 1, ayah: 7 },
                            linesCount: 15,
                            appliedRules: ['AyahIntegrityRule', 'PageAlignmentRule']
                        }
                    ]
                }
            ]
        }
    };

    assert(response.success === true, "Expected success=true");
    assert(response.data.plan.length === 1, "Expected 1 plan day");
    assert(response.data.plan[0].events[0].appliedRules !== undefined, "Expected appliedRules");
    assert(response.data.plan[0].events[0].appliedRules?.includes('PageAlignmentRule') === true, "Expected PageAlignmentRule in appliedRules");
    console.log("✓ GeneratePreviewResponseDTO shape valid");

    console.log("✓ All Epic 4 API Contract tests passed!");
}

if (require.main === module) {
    runTests().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
