import { describe, expect, it } from 'vitest';
import { TrackManager, ManagerConfig } from '../../../core/TrackManager';
import { QuranRepository } from '../../../core/QuranRepository';
import { LoadBalancerService } from '../../../domain/planning/services/LoadBalancerService';
import { DailyLoadWeights, TrackDefinition, TrackType } from '../../../domain/planning/entities/PlanConfig';
import { ITrack } from '../../../tracks/BaseTrack';
import { PlanContext } from '../../../core/PlanContext';
import { StepResult, TrackState } from '../../../core/types';

function createStaticTrack(
    id: number,
    name: string,
    type: string,
    initialDailyLines: number,
    fixedLinesProcessed = 3
): ITrack {
    const state: TrackState = {
        currentIdx: 0,
        history: [],
        isCompleted: false,
        extraData: {}
    };

    return {
        id,
        name,
        type,
        state,
        config: {
            dailyLines: initialDailyLines
        },
        calculateNextStep(_context: PlanContext): StepResult | null {
            if (this.config.dailyLines <= 0) {
                return null;
            }

            return {
                start: { surah: 2, ayah: 1, is_end: false },
                end: { surah: 2, ayah: 2, is_end: false },
                startIdx: 0,
                endIdx: 1,
                linesProcessed: fixedLinesProcessed
            };
        },
        commitStep(step: StepResult, currentDate: Date): void {
            this.state.currentIdx = step.endIdx;
            this.state.history.push({
                date: currentDate.toISOString(),
                startIdx: step.startIdx,
                endIdx: step.endIdx
            });
        }
    } as ITrack & { config: { dailyLines: number } };
}

describe('Epic 3 - Multi-track and Load Balancing', () => {
    it('balances allowances deterministically in normal days', () => {
        const balancer = new LoadBalancerService();
        const tracks: TrackDefinition[] = [
            { id: 1, name: 'Hifz', type: TrackType.MEMORIZATION, dailyTargetLines: 15 },
            { id: 2, name: 'Near Review', type: TrackType.NEAR_REVIEW, dailyTargetLines: 45 },
            { id: 3, name: 'Far Review', type: TrackType.FAR_REVIEW, dailyTargetLines: 75 }
        ];

        const normalWeights: DailyLoadWeights = {
            memorizationWeight: 2.0,
            nearReviewWeight: 1.0,
            farReviewWeight: 0.5,
            maxDailyLoad: 100
        };

        const allowances = balancer.calculateDailyAllowance(tracks, normalWeights, false);
        const hifzAllow = allowances.find(a => a.trackId === 1)!.allowedLines;
        const nearAllow = allowances.find(a => a.trackId === 2)!.allowedLines;
        const farAllow = allowances.find(a => a.trackId === 3)!.allowedLines;

        expect(hifzAllow).toBe(15);
        expect(nearAllow).toBe(45);
        expect(farAllow).toBe(50);
    });

    it('suppresses memorization on catch-up day in allowance calculation', () => {
        const balancer = new LoadBalancerService();
        const tracks: TrackDefinition[] = [
            { id: 1, name: 'Hifz', type: TrackType.MEMORIZATION, dailyTargetLines: 15 },
            { id: 2, name: 'Near Review', type: TrackType.NEAR_REVIEW, dailyTargetLines: 45 },
            { id: 3, name: 'Far Review', type: TrackType.FAR_REVIEW, dailyTargetLines: 75 }
        ];

        const normalWeights: DailyLoadWeights = {
            memorizationWeight: 2.0,
            nearReviewWeight: 1.0,
            farReviewWeight: 0.5,
            maxDailyLoad: 100
        };

        const allowances = balancer.calculateDailyAllowance(tracks, normalWeights, true);
        const hifzAllowCatchUp = allowances.find(a => a.trackId === 1)!.allowedLines;
        const nearAllowCatchUp = allowances.find(a => a.trackId === 2)!.allowedLines;
        const farAllowCatchUp = allowances.find(a => a.trackId === 3)!.allowedLines;

        expect(hifzAllowCatchUp).toBe(0);
        expect(nearAllowCatchUp).toBe(45);
        expect(farAllowCatchUp).toBe(75);
    });

    it('marks configured holidays as off-days with no events', () => {
        const managerConfig: ManagerConfig = {
            startDate: '2026-03-30',
            daysPerWeek: 7,
            limitDays: 1,
            isReverse: false,
            holidays: ['2026-03-30']
        };

        const manager = new TrackManager(managerConfig, QuranRepository.getInstance());
        manager.addTrack(createStaticTrack(1, 'Hifz', 'linear', 5));

        const plan = manager.generatePlan();
        expect(plan).toHaveLength(1);
        expect(plan[0].is_off).toBe(true);
        expect(plan[0].events).toHaveLength(0);
    });

    it('suppresses memorization events on catch-up day during scheduling', () => {
        const managerConfig: ManagerConfig = {
            startDate: '2026-03-30',
            daysPerWeek: 7,
            limitDays: 1,
            isReverse: false,
            catchUpDayOfWeek: 1
        };

        const manager = new TrackManager(managerConfig, QuranRepository.getInstance());
        manager.addTrack(createStaticTrack(1, 'Hifz', 'linear', 10));
        manager.addTrack(createStaticTrack(2, 'Near Review', 'window', 10));

        manager.setLoadBalancing(
            {
                memorizationWeight: 2,
                nearReviewWeight: 1,
                farReviewWeight: 1,
                maxDailyLoad: 100
            },
            [
                { id: 1, name: 'Hifz', type: TrackType.MEMORIZATION, dailyTargetLines: 10 },
                { id: 2, name: 'Near Review', type: TrackType.NEAR_REVIEW, dailyTargetLines: 10 }
            ]
        );

        const plan = manager.generatePlan();
        expect(plan).toHaveLength(1);

        const dayEvents = plan[0].events;
        expect(dayEvents.some(e => e.trackId === 1)).toBe(false);
        expect(dayEvents.some(e => e.trackId === 2)).toBe(true);
    });
});
