import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

export class PageAlignmentRule implements PlanningRule {
    /**
     * ⚠️ WARNING: Page alignment is currently based on computed approximations ($Lines/15$).
     * Standard Mushaf page boundaries are NOT yet integrated. Accuracy is low.
     */
    name = 'PageAlignmentRule';

    priority = 30;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        const repo = context.repository;
        const currentEnd = candidate.proposedEnd;

        // Skip if already at page end
        if (currentEnd.is_page_end) {
            return { approvedEnd: currentEnd };
        }

        const currentIndex = repo.getIndexFromLocation(currentEnd.surah, currentEnd.ayah, candidate.isReverse);
        const dirMap = repo.getDirectionData(candidate.isReverse);

        // Look ahead for the nearest page end
        let distanceLines = 0;
        let foundPageEndIndex = -1;
        
        // Scan up to X items ahead. A page is ~15 lines so scanning 50 ayahs is plenty safe
        const maxScan = Math.min(dirMap.cumulative_array.length - 1, currentIndex + 50);
        
        for (let i = currentIndex + 1; i <= maxScan; i++) {
            const tempLoc = repo.getLocationFromIndex(i, dirMap.index_map);
            distanceLines = tempLoc.surah === currentEnd.surah ? 
                repo.getLinesBetween(currentEnd, tempLoc, candidate.isReverse) : 
                999; // Don't bridge across surahs just for a page snap? Actually, pages boundary can cross surahs. But SurahSnapRule ran before this, so if we're this close, we should've snapped to the surah end.
                
            if (distanceLines > context.snapThresholdLines) {
                break; // Too far forward
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
