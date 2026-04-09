import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createIntermediateScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            isReverse: true,
            maxAyahPerDay: 8,
            sequentialSurahMode: true,
            strictSequentialMode: false,
            consolidationDayInterval: 6
        })
        .planByDuration({
            from: { surah: 66, ayah: 1 },
            to: { surah: 56, ayah: 96 },
            durationDays: 90
        })
        .addMinorReview(5, WindowMode.GRADUAL)
        .addMajorReview(15 * 8, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
