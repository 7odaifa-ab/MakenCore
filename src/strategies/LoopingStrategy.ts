import { IMovementStrategy } from './IMovementStrategy';
import { TrackState, StepResult } from '../core/types';
import { PlanContext } from '../core/PlanContext';
import { findExponentialStopIndex } from '../utils/Algorithms';

/**
 * LoopingStrategy
 * 
 * For Major Review: continuous cycling with barrier awareness.
 * 
 * BEHAVIOR:
 * - Moves forward by fixed amount
 * - Stops at "wall" (constraint from other tracks)
 * - Resets to 0 when hitting end or wall
 */
export class LoopingStrategy implements IMovementStrategy {
    calculateNextStep(
        state: TrackState, 
        context: PlanContext, 
        config: { amount: number, trackId: number }
    ): StepResult | StepResult[] | null {
        let results: StepResult[] = [];
        let currentIdx = state.currentIdx;
        let amountLeft = config.amount;
        let didReset = false;

        const maxIndex = context.cumulativeArray.length - 1;

        // Check for barrier (wall constraint)
        const meTrack = context.allTracks.get(config.trackId);
        let wallIdx = maxIndex;
        
        if (meTrack) {
            const barrier = context.constraintManager.getBarrierIndex(meTrack, context.allTracks);
            if (barrier !== null) {
                wallIdx = barrier;
            }
        }

        let iterations = 0;
        const originalStartIdx = currentIdx;

        // Loop to fulfill the daily amount, slicing over multiple chunks if we hit boundaries
        while (amountLeft >= 5 && iterations < 3) {
            iterations++;
            // Calculate target
            const currentCum = currentIdx > 0 ? context.cumulativeArray[currentIdx - 1] : 0;
            const targetCum = currentCum + amountLeft;

            const effectiveSearchLimit = Math.min(wallIdx, maxIndex);
            if (effectiveSearchLimit <= 0) break; // Nothing to review, pool is empty

            let stopIdx = findExponentialStopIndex(
                context.cumulativeArray,
                targetCum,
                currentIdx,
                effectiveSearchLimit
            );

            // Check if we hit the wall
            let hitWall = false;
            
            if (stopIdx >= wallIdx) {
                stopIdx = wallIdx;
                hitWall = true;
            }
            
            if (stopIdx === maxIndex && wallIdx === maxIndex) {
                hitWall = true;
            }

            // Silence logic: if no movement possible
            if (stopIdx === currentIdx) {
                hitWall = true;
                if (results.length > 0) {
                     break; // we already did some work, just stop.
                }
                // If we haven't done any work today, we must wrap around
            } else {
                const linesProcessed = context.cumulativeArray[stopIdx] - currentCum;
                results.push({
                    startIdx: currentIdx,
                    endIdx: stopIdx,
                    start: context.quranRepo.getLocationFromIndex(currentIdx, context.indexMap),
                    end: context.quranRepo.getLocationFromIndex(stopIdx, context.indexMap),
                    linesProcessed: parseFloat(linesProcessed.toFixed(2)),
                    flags: hitWall ? ['review', 'reset'] : ['review']
                });
                amountLeft -= linesProcessed;
                currentIdx = stopIdx;
            }

            if (hitWall) {
                // Wrap around completely
                currentIdx = 0;
                didReset = true;
                if (wallIdx === 0) break; // Don't infinite loop if memory pool is 0
                if (originalStartIdx === 0 && results.length > 0) break; // Prevent double-looping empty space in one day
            } else {
                break; // Handled the whole amount without hitting the wall
            }
        }

        if (results.length === 0) return null;
        if (results.length === 1) return results[0];
        return results;
    }
}