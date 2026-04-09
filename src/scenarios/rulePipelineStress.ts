import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createRulePipelineStressScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            isReverse: true,
            maxAyahPerDay: 4,
            sequentialSurahMode: true,
            strictSequentialMode: false,
            consolidationDayInterval: 5
        })
        .planByDuration({
            from: { surah: 66, ayah: 1 },
            to: { surah: 60, ayah: 13 },
            durationDays: 28
        })
        .addMinorReview(4, WindowMode.GRADUAL)
        .addMajorReview(15 * 6, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
