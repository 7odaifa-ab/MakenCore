import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createDailyAmountAuditScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 6,
            isReverse: true,
            maxAyahPerDay: 10,
            sequentialSurahMode: true,
            strictSequentialMode: false,
            consolidationDayInterval: 6
        })
        .planByDailyAmount({
            from: { surah: 66, ayah: 1 },
            to: { surah: 57, ayah: 29 },
            dailyLines: 10
        })
        .addMinorReview(5, WindowMode.GRADUAL)
        .addMajorReview(15 * 8, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
