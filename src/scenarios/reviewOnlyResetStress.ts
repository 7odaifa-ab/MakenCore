import { PlanBuilder } from '../builders/PlanBuilder';
import { TrackManager } from '../core/TrackManager';

export function createReviewOnlyResetStressScenario(): TrackManager {
    return new PlanBuilder()
        .setSchedule({
            startDate: '2026-02-01',
            daysPerWeek: 5,
            limitDays: 40,
            isReverse: true,
            consolidationDayInterval: 5
        })
        .addMajorReview(15 * 4, { surah: 114, ayah: 1 }, { surah: 72, ayah: 1 })
        .addMajorReview(15, { surah: 114, ayah: 1 }, { surah: 80, ayah: 1 })
        .build();
}
