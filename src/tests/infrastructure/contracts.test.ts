import { describe, it, expect } from 'vitest';
import { GeneratePreviewRequestDTO, GeneratePreviewResponseDTO, ExportRequestDTO } from '../../infrastructure/api/contracts';

describe('API Contracts Validation', () => {
    it('validates GeneratePreviewRequestDTO shape', () => {
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

        expect(payload.tracks).toBeDefined();
        expect(payload.tracks[0].type).toBe('HIFZ');
        expect(payload.tracks[0].start?.surah).toBe(1);
    });

    it('validates ExportRequestDTO shape', () => {
        const exportPayload: ExportRequestDTO = {
            planId: 'some-uuid-1234',
            format: 'excel',
            includeTeachersNotes: true
        };

        expect(exportPayload.planId).toBe('some-uuid-1234');
        expect(exportPayload.format).toBe('excel');
        expect(exportPayload.includeTeachersNotes).toBe(true);
    });

    it('validates GeneratePreviewResponseDTO shape', () => {
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

        expect(response.success).toBe(true);
        expect(response.data.plan.length).toBe(1);
        expect(response.data.plan[0].events[0].appliedRules).toBeDefined();
        expect(response.data.plan[0].events[0].appliedRules?.includes('PageAlignmentRule')).toBe(true);
    });
});
