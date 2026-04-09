import { TrackManager } from '../core/TrackManager';
import { createAdvancedScenario } from './advanced';
import { createBeginnerScenario } from './beginner';
import { createIntermediateScenario } from './intermediate';
import { createReviewOnlyFiveAjzaScenario } from './reviewOnlyFiveAjza';

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
