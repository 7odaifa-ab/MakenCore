import { TrackManager } from '../core/TrackManager';
import { createAdvancedScenario } from './advanced';
import { createBeginnerScenario } from './beginner';
import { createCompletionBeforeLimitScenario } from './completionBeforeLimit';
import { createConsolidationAuditScenario } from './consolidationAudit';
import { createDailyAmountAuditScenario } from './dailyAmountAudit';
import { createIntermediateScenario } from './intermediate';
import { createReviewOnlyFiveAjzaScenario } from './reviewOnlyFiveAjza';
import { createReviewOnlyResetStressScenario } from './reviewOnlyResetStress';
import { createRulePipelineStressScenario } from './rulePipelineStress';

export interface ScenarioDefinition {
    key: string;
    title: string;
    description: string;
    notes?: string[];
    create: () => TrackManager;
}

export const scenarios: ScenarioDefinition[] = [
    {
        key: 'beginner',
        title: 'Beginner',
        description: 'Duration-driven beginner plan: derive daily load from a fixed 30-day target with strict surah continuity.',
        create: createBeginnerScenario
    },
    {
        key: 'intermediate',
        title: 'Intermediate',
        description: 'Duration-driven intermediate plan: derive daily load from a fixed 90-day target with balanced review.',
        create: createIntermediateScenario
    },
    {
        key: 'advanced',
        title: 'Advanced',
        description: 'Daily-amount-driven advanced plan: derive required days from a stronger fixed daily workload.',
        create: createAdvancedScenario
    },
    {
        key: 'completion-before-limit',
        title: 'Completion Before Limit',
        description: 'Verifies that stopWhenCompleted ends the plan before the configured duration is exhausted when the target range is small.',
        notes: [
            'Use this to confirm that generated days stop because Hifz completes, not only because limitDays is reached.'
        ],
        create: createCompletionBeforeLimitScenario
    },
    {
        key: 'consolidation-audit',
        title: 'Consolidation Audit',
        description: 'Verifies that every consolidation cycle produces review-only days with no new memorization.',
        notes: [
            'Use this to inspect consolidation-day spacing and ensure memorization disappears on those days.'
        ],
        create: createConsolidationAuditScenario
    },
    {
        key: 'rule-pipeline-stress',
        title: 'Rule Pipeline Stress',
        description: 'Stress-tests interactions between max ayah preference, surah completion, and other ordered rules.',
        notes: [
            'Use this when evaluating whether final boundaries make sense in the context of the full rule order.'
        ],
        create: createRulePipelineStressScenario
    },
    {
        key: 'daily-amount-audit',
        title: 'Daily Amount Audit',
        description: 'Verifies the official daily-amount planning mode and inspects the derived required duration.',
        notes: [
            'Use this to confirm that a fixed daily workload produces a plausible completion horizon.'
        ],
        create: createDailyAmountAuditScenario
    },
    {
        key: 'review-only-reset-stress',
        title: 'Review-Only Reset Stress',
        description: 'Stress-tests reset behavior in review-only mode using two independent major review loops.',
        notes: [
            'Use this to inspect reset cadence and ensure no new memorization appears in pure review mode.'
        ],
        create: createReviewOnlyResetStressScenario
    },
    {
        key: 'review-only',
        title: 'Review Only - Five Ajza',
        description: 'Two rolling review tracks for a student paused from new memorization after five ajza.',
        notes: [
            'This scenario uses two major review tracks because minor review currently depends on Hifz history.',
            'Use it to stress-test review-only behavior until a dedicated review-only near-review track is added.'
        ],
        create: createReviewOnlyFiveAjzaScenario
    }
];

export function getScenarioByKey(key: string): ScenarioDefinition | undefined {
    return scenarios.find((scenario) => scenario.key === key);
}
