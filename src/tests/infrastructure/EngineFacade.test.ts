import { describe, expect, it } from 'vitest';
import { MakenEngine, CreatePlanPreviewRequestDTO, EstimateCompletionRequestDTO } from '../../../src/index';

describe('EngineFacade integration tests', () => {
    it('generates a plan correctly from DTO', () => {
        const payload: CreatePlanPreviewRequestDTO = {
            name: 'Ramadan Hifz',
            direction: 'FORWARD',
            daysPerWeek: 5,
            tracks: [
                {
                    type: 'HIFZ',
                    priority: 1,
                    amountUnit: 'LINES',
                    amountValue: 15, // Approx 1 page
                    start: { surah: 78, ayah: 1 },
                    end: { surah: 78, ayah: 40 }
                }
            ],
            startDate: '2026-03-30'
        };

        const result = MakenEngine.generatePlan(payload);

        expect(result.success).toBe(true);
        expect(result.data.plan.length).toBeGreaterThan(0);
        
        // Assert the generated day payload structure
        const firstDay = result.data.plan[0];
        expect(firstDay.dayType).toBe('WORKING');
        expect(firstDay.events.length).toBeGreaterThan(0);
        expect(firstDay.events[0].trackType).toBe('HIFZ');
        expect(firstDay.events[0].eventType).toBe('MEMORIZATION');
        expect(firstDay.events[0].start.surah).toBe(78);
    });

    it('estimates timeline without full plan generation', () => {
        const payload: EstimateCompletionRequestDTO = {
            direction: 'FORWARD',
            daysPerWeek: 5,
            tracks: [
                {
                    type: 'HIFZ',
                    priority: 1,
                    amountUnit: 'LINES',
                    amountValue: 15,
                    start: { surah: 78, ayah: 1 },
                    end: { surah: 80, ayah: 42 }
                }
            ],
            startDate: '2026-03-30'
        };

        const result = MakenEngine.estimateTimeline(payload);

        expect(result.success).toBe(true);
        expect(result.data.estimatedDays).toBeGreaterThan(0);
        expect(result.data.estimatedCompletionDate).not.toBe('N/A');
    });

    it('runs dataset validation checks successfully', () => {
        const result = MakenEngine.validateDataset();

        expect(result.success).toBe(true);
        expect(result.data.valid).toBe(true);
        expect(result.data.checks.length).toBeGreaterThan(0);
        
        const symmetryCheck = result.data.checks.find(c => c.name === 'Index symmetry');
        expect(symmetryCheck).toBeDefined();
        expect(symmetryCheck?.passed).toBe(true);
    });
});
