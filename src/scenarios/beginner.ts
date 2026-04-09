import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createBeginnerScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            isReverse: true,
            maxAyahPerDay: 5,
            sequentialSurahMode: true,
            strictSequentialMode: true,
            consolidationDayInterval: 5
        })
        .planByDuration({
            from: { surah: 66, ayah: 1 },
            to: { surah: 58, ayah: 8 },
            durationDays: 30
        })
        .addMinorReview(3, WindowMode.GRADUAL)
        .addMajorReview(15 * 5, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
