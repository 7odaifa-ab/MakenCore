import { LocationObj } from '../../../core/types';
import { ReferenceRepository } from '../../mushaf/repositories/ReferenceRepository';

export interface RuleMetadata {
    appliedRule: string;
    reason: string;
    adjustmentLines: number; // Positive if lines were added, negative if removed
}

export interface RuleCandidate {
    start: LocationObj;
    proposedEnd: LocationObj;
    targetLines: number;    // The original requested line count
    isReverse: boolean;     // Direction of memorization
    flags?: string[];       // Optional flags like 'review' to identify track type
}

export interface RuleResult {
    approvedEnd: LocationObj;
    metadata?: RuleMetadata;
    warnings?: string[];
}

export interface RuleContext {
    repository: ReferenceRepository;
    trackId: string | number;
    // Any future config (like snap thresholds) can go here
    snapThresholdLines: number;
    // Pedagogical constraints
    maxAyahPerDay?: number;
    sequentialSurahMode?: boolean;
    strictSequentialMode?: boolean; // If true, never allow surah jumps until 100% complete
}

export interface PlanningRule {
    readonly name: string;
    readonly priority: number; // Determines explicit rule ordering
    
    /**
     * Applies the rule to the candidate location.
     * Returns a new RuleResult, possibly adjusting the approvedEnd.
     */
    apply(candidate: RuleCandidate, context: RuleContext): RuleResult;
}
