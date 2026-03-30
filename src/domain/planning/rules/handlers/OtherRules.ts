import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

export class ThematicHaltingRule implements PlanningRule {
    name = 'ThematicHaltingRule';
    priority = 40;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        const repo = context.repository;
        const currentEnd = candidate.proposedEnd;
        const currentIndex = repo.getIndexFromLocation(currentEnd.surah, currentEnd.ayah, candidate.isReverse);
        const dirMap = repo.getDirectionData(candidate.isReverse);

        let foundThematicIndex = -1;
        let distanceLines = 0;

        const maxScan = Math.min(dirMap.cumulative_array.length - 1, currentIndex + 60);

        for (let i = currentIndex + 1; i <= maxScan; i++) {
            const tempLoc = repo.getLocationFromIndex(i, dirMap.index_map);
            distanceLines = repo.getLinesBetween(currentEnd, tempLoc, candidate.isReverse);

            if (distanceLines > context.snapThresholdLines) {
                break;
            }

            if (tempLoc.thematic_break && tempLoc.thematic_break_type && tempLoc.thematic_break_type !== 'NONE') {
                foundThematicIndex = i;
                break;
            }
        }

        if (foundThematicIndex !== -1) {
            const snappedLoc = repo.getLocationFromIndex(foundThematicIndex, dirMap.index_map);
            return {
                approvedEnd: snappedLoc,
                metadata: {
                    appliedRule: this.name,
                    reason: `Snapped to thematic boundary (${snappedLoc.thematic_break_type})`,
                    adjustmentLines: distanceLines
                }
            };
        }

        return { approvedEnd: candidate.proposedEnd };
    }
}

export class BalanceCorrectionRule implements PlanningRule {
    name = 'BalanceCorrectionRule';
    priority = 50;

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        // If the resulting track has built up a huge positive or negative balance
        // we could correct it here. For now, passthrough.
        // E.g., if expected cumulative lines is far from actual cumulative completed.
        return { approvedEnd: candidate.proposedEnd };
    }
}
