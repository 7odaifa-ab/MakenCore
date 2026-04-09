import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

export class PageAlignmentRule implements PlanningRule {
    /**
     * NOW USING: Canonical Mushaf Dataset (Hafs v18) with authentic page boundaries.
     * Page alignment now uses real Madinah Mushaf coordinates for production accuracy.
     */
    name = 'PageAlignmentRule';

    priority = 30;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        // Skip for review tracks - preserve full lesson boundaries
        if (candidate.flags?.includes('review')) {
            return { approvedEnd: candidate.proposedEnd };
        }

        const repo = context.repository;
        const currentEnd = candidate.proposedEnd;

        // Skip if already at page end
        if (currentEnd.is_page_end) {
            return { approvedEnd: currentEnd };
        }

        const currentIndex = repo.getIndexFromLocation(currentEnd.surah, currentEnd.ayah, candidate.isReverse);
        const dirMap = repo.getDirectionData(candidate.isReverse);

        // Look forward in traversal direction for the nearest page end
        let distanceLines = 0;
        let foundPageEndIndex = -1;
        
        // Scan a bounded horizon for deterministic performance.
        const maxScan = Math.min(dirMap.cumulative_array.length - 1, currentIndex + 50);
        
        for (let i = currentIndex + 1; i <= maxScan; i++) {
            const tempLoc = repo.getLocationFromIndex(i, dirMap.index_map);
            distanceLines = repo.getLinesBetween(currentEnd, tempLoc, candidate.isReverse);
                
            if (distanceLines > context.snapThresholdLines) {
                break;
            }

            if (tempLoc.is_page_end) {
                foundPageEndIndex = i;
                break;
            }
        }

        if (foundPageEndIndex !== -1) {
            const snappedLoc = repo.getLocationFromIndex(foundPageEndIndex, dirMap.index_map);
            return {
                approvedEnd: snappedLoc,
                metadata: {
                    appliedRule: this.name,
                    reason: `Snapped to end of page ${snappedLoc.page}`,
                    adjustmentLines: distanceLines
                }
            };
        }

        return { approvedEnd: currentEnd };
    }
}
