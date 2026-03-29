import { DailyLoadWeights, TrackDefinition, TrackType } from '../entities/PlanConfig';

export interface DailyTrackAllowance {
    trackId: number;
    allowedLines: number;
}

export class LoadBalancerService {
    
    /**
     * Calculates the deterministic allowed lines per track for the day,
     * suppressing memorization on catch-up days and reducing review if load exceeds max.
     */
    public calculateDailyAllowance(
        tracks: TrackDefinition[],
        weights: DailyLoadWeights,
        isCatchUpDay: boolean
    ): DailyTrackAllowance[] {
        const allowances: DailyTrackAllowance[] = [];
        let remainingLoad = weights.maxDailyLoad;

        // Sorting tracks by priority. Priorities:
        // 1. Memorization (unless suppressed)
        // 2. Near Review
        // 3. Far Review

        const memTracks = tracks.filter(t => t.type === TrackType.MEMORIZATION);
        const nearRevTracks = tracks.filter(t => t.type === TrackType.NEAR_REVIEW);
        const farRevTracks = tracks.filter(t => t.type === TrackType.FAR_REVIEW);

        // 1. Process Memorization
        if (!isCatchUpDay) {
            for (const t of memTracks) {
                const requestedLoad = t.dailyTargetLines * weights.memorizationWeight;
                const grantedLoad = Math.min(requestedLoad, remainingLoad);
                
                const allowedLines = (grantedLoad / weights.memorizationWeight);
                allowances.push({ trackId: t.id, allowedLines });
                
                remainingLoad -= grantedLoad;
            }
        } else {
            // Suppressed on catch-up days
            for (const t of memTracks) {
                allowances.push({ trackId: t.id, allowedLines: 0 });
            }
        }

        // 2. Process Near Review
        for (const t of nearRevTracks) {
            const requestedLoad = t.dailyTargetLines * weights.nearReviewWeight;
            const grantedLoad = Math.min(requestedLoad, remainingLoad);
            
            const allowedLines = (grantedLoad / weights.nearReviewWeight);
            allowances.push({ trackId: t.id, allowedLines });
            
            remainingLoad -= grantedLoad;
        }

        // 3. Process Far Review
        for (const t of farRevTracks) {
            const requestedLoad = t.dailyTargetLines * weights.farReviewWeight;
            const grantedLoad = Math.min(requestedLoad, remainingLoad);
            
            const allowedLines = (grantedLoad / weights.farReviewWeight);
            allowances.push({ trackId: t.id, allowedLines });
            
            remainingLoad -= grantedLoad;
        }

        return allowances;
    }
}
