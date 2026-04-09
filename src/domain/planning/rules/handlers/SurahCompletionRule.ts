import { PlanningRule, RuleCandidate, RuleContext, RuleResult } from '../RuleInterface';

/**
 * SurahCompletionRule
 * 
 * Enforces contextual learning by completing current surah
 * before moving to the next one. This preserves thematic coherence
 * and improves retention through contextual memory.
 * 
 * When enabled, the rule snaps to surah end if:
 * 1. We're in the middle of a surah
 * 2. The remaining ayahs are within reasonable threshold
 */
export class SurahCompletionRule implements PlanningRule {
    name = 'SurahCompletionRule';
    priority = 18; // Between MaxAyah (15) and SurahSnap (20)

    apply(candidate: RuleCandidate, context: RuleContext): RuleResult {
        // Skip for review tracks
        if (candidate.flags?.includes('review')) {
            return { approvedEnd: candidate.proposedEnd };
        }

        // Skip if sequential mode not enabled
        if (!context.sequentialSurahMode) {
            return { approvedEnd: candidate.proposedEnd };
        }

        const repo = context.repository;
        const currentEnd = candidate.proposedEnd;

        // Check if we've crossed into a new surah
        if (currentEnd.surah !== candidate.start.surah) {
            // 🚫 STRICT MODE: Block ANY surah change until 100% complete
            if (context.strictSequentialMode) {
                const prevSurahAyahCount = repo.getAyahCount(candidate.start.surah);
                // Return to end of previous surah (forces completion on next day)
                const forcedEnd = repo.getLocationFromIndex(
                    repo.getIndexFromLocation(candidate.start.surah, prevSurahAyahCount, candidate.isReverse),
                    repo.getDirectionData(candidate.isReverse).index_map
                );
                return {
                    approvedEnd: forcedEnd,
                    metadata: {
                        appliedRule: this.name,
                        reason: `STRICT MODE: Cannot start Surah ${currentEnd.surah} until Surah ${candidate.start.surah} is 100% complete`,
                        adjustmentLines: repo.getLinesBetween(currentEnd, forcedEnd, candidate.isReverse)
                    }
                };
            }
            // We crossed surah boundary - this is allowed if we completed the previous
            return { approvedEnd: currentEnd };
        }

        // We're still in same surah - check if we should complete it
        const ayahCount = repo.getAyahCount(currentEnd.surah);
        
        // If already at surah end, no action needed
        if (currentEnd.ayah >= ayahCount) {
            return { approvedEnd: currentEnd };
        }

        // Calculate remaining ayahs to surah end
        const remainingAyahs = ayahCount - currentEnd.ayah;
        
        // If small amount remaining (<= 5 ayahs), snap to complete the surah
        // This is a reasonable threshold for "completing" vs "stopping mid-surah"
        if (remainingAyahs <= 5) {
            const newEnd = { 
                surah: currentEnd.surah, 
                ayah: ayahCount, 
                is_end: true 
            };

            const newEndLoc = repo.getLocationFromIndex(
                repo.getIndexFromLocation(newEnd.surah, newEnd.ayah, candidate.isReverse),
                repo.getDirectionData(candidate.isReverse).index_map
            );

            return {
                approvedEnd: newEndLoc,
                metadata: {
                    appliedRule: this.name,
                    reason: `Completed Surah ${currentEnd.surah} (${remainingAyahs} remaining ayahs)`,
                    adjustmentLines: repo.getLinesBetween(currentEnd, newEndLoc, candidate.isReverse)
                }
            };
        }

        return { approvedEnd: currentEnd };
    }
}
