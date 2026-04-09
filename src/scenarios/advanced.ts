import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createAdvancedScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 6,
            isReverse: true,
            maxAyahPerDay: 12,
            sequentialSurahMode: true,
            strictSequentialMode: false,
            consolidationDayInterval: 7
        })
        .planByDailyAmount({
            from: { surah: 66, ayah: 1 },
            to: { surah: 55, ayah: 78 },
            dailyLines: 14
        })
        .addMinorReview(7, WindowMode.GRADUAL)
        .addMajorReview(15 * 10, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
