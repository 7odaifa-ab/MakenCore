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
        const repo = context.repository;
        const dirData = repo.getDirectionData(candidate.isReverse);

        const minAllowed = Math.max(0, candidate.targetLines - context.snapThresholdLines);
        const maxAllowed = candidate.targetLines + context.snapThresholdLines;

        let approvedEnd = candidate.proposedEnd;
        let lines = repo.getLinesBetween(candidate.start, approvedEnd, candidate.isReverse);

        if (approvedEnd.is_end || approvedEnd.is_page_end || approvedEnd.thematic_break) {
            return { approvedEnd };
        }

        if (lines >= minAllowed && lines <= maxAllowed) {
            return { approvedEnd };
        }

        const startIdx = repo.getIndexFromLocation(candidate.start.surah, candidate.start.ayah, candidate.isReverse);
        let endIdx = repo.getIndexFromLocation(approvedEnd.surah, approvedEnd.ayah, candidate.isReverse);

        const stepDirection = lines > maxAllowed ? -1 : 1;
        const maxIterations = 30;

        for (let i = 0; i < maxIterations; i++) {
            const nextIdx = endIdx + stepDirection;
            if (nextIdx < 0 || nextIdx >= dirData.cumulative_array.length || nextIdx === startIdx) {
                break;
            }

            const nextLoc = repo.getLocationFromIndex(nextIdx, dirData.index_map);
            const nextLines = repo.getLinesBetween(candidate.start, nextLoc, candidate.isReverse);

            if (Math.abs(nextLines - candidate.targetLines) > Math.abs(lines - candidate.targetLines)) {
                break;
            }

            endIdx = nextIdx;
            approvedEnd = nextLoc;
            lines = nextLines;

            if (lines >= minAllowed && lines <= maxAllowed) {
                break;
            }
        }

        const originalLines = repo.getLinesBetween(candidate.start, candidate.proposedEnd, candidate.isReverse);
        const adjustment = Number((lines - originalLines).toFixed(2));

        if (
            approvedEnd.surah !== candidate.proposedEnd.surah ||
            approvedEnd.ayah !== candidate.proposedEnd.ayah
        ) {
            return {
                approvedEnd,
                metadata: {
                    appliedRule: this.name,
                    reason: `Adjusted to keep lines near target (${candidate.targetLines}) within threshold`,
                    adjustmentLines: adjustment
                }
            };
        }

        return { approvedEnd };
    }
}
