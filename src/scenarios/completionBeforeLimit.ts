import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createCompletionBeforeLimitScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            isReverse: true,
            maxAyahPerDay: 6,
            sequentialSurahMode: true,
            strictSequentialMode: true,
            consolidationDayInterval: 5
        })
        .planByDuration({
            from: { surah: 66, ayah: 1 },
            to: { surah: 64, ayah: 18 },
            durationDays: 45
        })
        .addMinorReview(3, WindowMode.GRADUAL)
        .addMajorReview(15 * 4, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
