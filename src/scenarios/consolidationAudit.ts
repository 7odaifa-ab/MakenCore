import { PlanBuilder } from '../builders/PlanBuilder';
import { WindowMode } from '../core/constants';
import { TrackManager } from '../core/TrackManager';

export function createConsolidationAuditScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            isReverse: true,
            maxAyahPerDay: 5,
            sequentialSurahMode: true,
            strictSequentialMode: true,
            consolidationDayInterval: 4
        })
        .planByDuration({
            from: { surah: 66, ayah: 1 },
            to: { surah: 61, ayah: 14 },
            durationDays: 24
        })
        .addMinorReview(2, WindowMode.GRADUAL)
        .addMajorReview(15 * 5, { surah: 114, ayah: 1 })
        .stopWhenCompleted()
        .build();
}
