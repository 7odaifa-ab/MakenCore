import { describe, expect, it } from 'vitest';
import { MakenEngine, CreatePlanPreviewRequestDTO } from '../index';

describe('Surah At-Tahrim Plan Generation', () => {
    it('creates a plan starting from Surah At-Tahrim (66)', () => {
        const payload: CreatePlanPreviewRequestDTO = {
            name: 'Plan from Surah At-Tahrim',
            direction: 'FORWARD',
            daysPerWeek: 5,
            tracks: [
                {
                    type: 'HIFZ',
                    priority: 1,
                    amountUnit: 'LINES',
                    amountValue: 10, // 10 lines per day
                    start: { surah: 66, ayah: 1 }, // Start from Surah At-Tahrim
                    end: { surah: 67, ayah: 30 } // End at Surah Al-Mulk
                }
            ],
            startDate: '2026-04-08'
        };

        const result = MakenEngine.generatePlan(payload);

        expect(result.success).toBe(true);
        expect(result.data.plan.length).toBeGreaterThan(0);
        
        // Verify the plan starts with Surah At-Tahrim
        const firstDay = result.data.plan[0];
        expect(firstDay.dayType).toBe('WORKING');
        expect(firstDay.events.length).toBeGreaterThan(0);
        expect(firstDay.events[0].trackType).toBe('HIFZ');
        expect(firstDay.events[0].eventType).toBe('MEMORIZATION');
        expect(firstDay.events[0].start.surah).toBe(66); // Surah At-Tahrim
        expect(firstDay.events[0].start.ayah).toBeGreaterThanOrEqual(1);

        // Log the plan details for verification
        console.log(`Generated ${result.data.totalDays} days plan`);
        console.log(`Estimated completion: ${result.data.estimatedCompletionDate}`);
        console.log(`First day starts at Surah ${firstDay.events[0].start.surah}, Ayah ${firstDay.events[0].start.ayah}`);
        
        // Show first few days of the plan
        result.data.plan.slice(0, 3).forEach((day, index) => {
            console.log(`Day ${index + 1} (${day.date}):`);
            day.events.forEach(event => {
                console.log(`  - Surah ${event.start.surah}:${event.start.ayah} to ${event.end.surah}:${event.end.ayah} (${event.linesCount} lines)`);
            });
        });
    });

    it('creates a reverse plan ending at Surah At-Tahrim', () => {
        const payload: CreatePlanPreviewRequestDTO = {
            name: 'Reverse Plan ending at Surah At-Tahrim',
            direction: 'REVERSE',
            daysPerWeek: 7,
            tracks: [
                {
                    type: 'HIFZ',
                    priority: 1,
                    amountUnit: 'LINES',
                    amountValue: 15,
                    start: { surah: 67, ayah: 1 }, // Start from Surah Al-Mulk
                    end: { surah: 66, ayah: 1 } // End at Surah At-Tahrim
                }
            ],
            startDate: '2026-04-08'
        };

        const result = MakenEngine.generatePlan(payload);

        expect(result.success).toBe(true);
        expect(result.data.plan.length).toBeGreaterThan(0);

         console.log("REVERSE PLAN TRACE:");
         result.data.plan.forEach((day, i) => {
              console.log("Day " + (i+1) + ": " + JSON.stringify(day.events.map(e => e.start.surah + ":" + e.start.ayah + "->" + e.end.surah + ":" + e.end.ayah)));
         });

        // For reverse planning, the last day should end at Surah At-Tahrim
        const lastDay = result.data.plan[result.data.plan.length - 1];
        if (lastDay.events.length > 0) {
            console.log("LAST DAY EVENTS:", JSON.stringify(lastDay.events, null, 2));
            const lastEvent = lastDay.events[lastDay.events.length - 1];
            expect(lastEvent.end.surah).toBeLessThanOrEqual(66); // Should reach or pass Surah At-Tahrim
        }

        console.log(`Reverse plan: ${result.data.totalDays} days`);
        console.log(`Estimated completion: ${result.data.estimatedCompletionDate}`);
    });
});
