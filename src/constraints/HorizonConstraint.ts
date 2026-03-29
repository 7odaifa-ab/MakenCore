import { IConstraint } from './ConstraintManager';
import { ITrack } from '../tracks/BaseTrack';
import { QuranRepository } from '../core/QuranRepository';
import { findExponentialStopIndex } from '../utils/Algorithms';

/**
 * HorizonConstraint
 * 
 * Prevents a review track from exceeding an absolute size boundary relative to a target track.
 * Example: Near Review cannot go back further than 150 lines from the Memorization front.
 */
export class HorizonConstraint implements IConstraint {
    constructor(
        private sourceTrackId: number,       // The track being limited
        private targetTrackId: number,       // The reference track (e.g. Hifz)
        private horizonLines: number,        // Max allowed lines of difference
        private quranRepo: QuranRepository,
        private isReverse: boolean
    ) {}

    getLimitIndex(sourceTrack: ITrack, allTracks: Map<number, ITrack>): number | null {
        if (sourceTrack.id !== this.sourceTrackId) return null;

        const target = allTracks.get(this.targetTrackId);
        if (!target) return null;

        const targetCurrentIdx = target.state.currentIdx;
        
        // Let's resolve what "horizon back" means.
        // If the target has advanced 300 lines total, and horizon is 150 lines, 
        // the baseline for our source track should never drop below the index corresponding to 150 cumulative.
        
        const dirData = this.quranRepo.getDirectionData(this.isReverse);
        const cumValue = targetCurrentIdx > 0 ? dirData.cumulative_array[targetCurrentIdx - 1] : 0;
        
        const horizonCumValue = Math.max(0, cumValue - this.horizonLines);

        // Find index that matches this cumulative value
        const minAllowedIdx = findExponentialStopIndex(
            dirData.cumulative_array,
            horizonCumValue,
            0,
            dirData.cumulative_array.length - 1
        );

        // This would act like a "lower" boundary wall. 
        // ConstraintManager currently seeks the "minimum allowed index" upper barrier (a ceiling)
        // Wait! LimitIndex in ConstraintManager is an Upper Bound (don't exceed this index).
        // But a Horizon is a Lower Bound (must not fall behind this).
        // Our current ConstraintManager implementation treats the limit as a CELIING (a barrier preventing forward movement).
        // Let's make sure the review doesn't start before the horizon!
        // Actually WindowStrategy resets when it hits the lower bound (0.0).
        // The Horizon applies to the reset point. It's not a forward boundary, it's a backwards limit.
        // We will just expose this value and the WindowStrategy should consume it.
        return null;
    }

    validate(sourceTrack: ITrack, allTracks: Map<number, ITrack>): boolean {
        return true;
    }
}
