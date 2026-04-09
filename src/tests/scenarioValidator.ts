import { PlanBuilder } from '../builders/PlanBuilder';
import { TrackId } from '../core/constants';
import { QuranRepository } from '../core/QuranRepository';
import { PlanDay, PlanEvent } from '../core/types';
import { scenarios, ScenarioDefinition } from '../scenarios';

class ValidationFailure extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationFailure';
    }
}

function assertCondition(condition: unknown, message: string): void {
    if (!condition) {
        throw new ValidationFailure(message);
    }
}

function getEventsByTrack(plan: PlanDay[], trackId: number): PlanEvent[] {
    return plan.flatMap(day => day.events.filter(event => event.trackId === trackId));
}

function getMemorizationEvents(plan: PlanDay[]): PlanEvent[] {
    return getEventsByTrack(plan, TrackId.HIFZ);
}

function getReviewEvents(plan: PlanDay[]): PlanEvent[] {
    return plan.flatMap(day => day.events.filter(event => event.trackId !== TrackId.HIFZ));
}

function countAyahs(event: PlanEvent, isReverse: boolean): number {
    const repo = QuranRepository.getInstance();
    const startIdx = repo.getIndexFromLocation(event.data.start.surah, event.data.start.ayah, isReverse);
    const endIdx = repo.getIndexFromLocation(event.data.end.surah, event.data.end.ayah, isReverse);
    return Math.abs(endIdx - startIdx) + 1;
}

function hasResetEvent(plan: PlanDay[]): boolean {
    return plan.some(day => day.events.some(event => event.data.is_reset));
}

function getHifzCompletionState(scenario: ScenarioDefinition): boolean {
    const manager = scenario.create();
    manager.generatePlan();
    const track = manager.getTrack(TrackId.HIFZ);
    return !!track?.state.isCompleted;
}

type ValidationResult = {
    scenarioKey: string;
    passed: boolean;
    checks: string[];
    errors: string[];
};

function validateBaseScenario(scenario: ScenarioDefinition): { plan: PlanDay[]; checks: string[] } {
    const manager = scenario.create();
    const plan = manager.generatePlan();
    const checks: string[] = [];

    assertCondition(plan.length > 0, 'Plan must generate at least one day.');
    checks.push(`generated ${plan.length} days`);

    assertCondition(plan.every(day => Array.isArray(day.events)), 'Every generated day must contain an events array.');
    checks.push('every day exposes events array');

    return { plan, checks };
}

function validateScenario(scenario: ScenarioDefinition): ValidationResult {
    const errors: string[] = [];
    const checks: string[] = [];

    try {
        const { plan, checks: baseChecks } = validateBaseScenario(scenario);
        checks.push(...baseChecks);

        switch (scenario.key) {
            case 'beginner': {
                const memorization = getMemorizationEvents(plan);
                assertCondition(memorization.length > 0, 'Beginner scenario must include memorization.');
                assertCondition(hasResetEvent(plan), 'Beginner scenario should produce at least one major-review reset.');
                checks.push('beginner has memorization');
                checks.push('beginner produces reset event');
                break;
            }
            case 'intermediate': {
                const memorization = getMemorizationEvents(plan);
                assertCondition(memorization.length > 0, 'Intermediate scenario must include memorization.');
                assertCondition(getHifzCompletionState(scenario), 'Intermediate scenario should complete the Hifz track.');
                checks.push('intermediate has memorization');
                checks.push('intermediate completes Hifz');
                break;
            }
            case 'advanced': {
                const memorization = getMemorizationEvents(plan);
                assertCondition(memorization.length > 0, 'Advanced scenario must include memorization.');
                assertCondition(getHifzCompletionState(scenario), 'Advanced scenario should complete the Hifz track.');
                checks.push('advanced daily-amount mode generates memorization');
                checks.push('advanced daily-amount mode completes Hifz');
                break;
            }
            case 'completion-before-limit': {
                assertCondition(plan.length < 45, 'Completion-before-limit should stop before exhausting durationDays=45.');
                assertCondition(getHifzCompletionState(scenario), 'Completion-before-limit should stop because Hifz completed.');
                checks.push('plan stops before configured duration ends');
                checks.push('Hifz completed before limit');
                break;
            }
            case 'consolidation-audit': {
                const consolidationDays = plan.filter(day => day.dayNum % 4 === 0);
                assertCondition(consolidationDays.length > 0, 'Consolidation audit must contain consolidation days.');
                assertCondition(consolidationDays.every(day => day.events.every(event => event.trackId !== TrackId.HIFZ)), 'Every consolidation day must contain no Hifz event.');
                assertCondition(consolidationDays.every(day => day.events.some(event => event.trackId !== TrackId.HIFZ)), 'Every consolidation day should still contain review activity.');
                checks.push('every 4th day has no Hifz event');
                checks.push('consolidation days still contain review');
                break;
            }
            case 'rule-pipeline-stress': {
                const memorization = getMemorizationEvents(plan);
                const overLimit = memorization.some(event => countAyahs(event, true) > 4);
                assertCondition(overLimit, 'Rule pipeline stress should show at least one memorization event exceeding raw maxAyahPerDay due to ordered rules.');
                assertCondition(hasResetEvent(plan), 'Rule pipeline stress should also produce at least one reset event.');
                checks.push('ordered rules produce at least one over-limit memorization boundary');
                checks.push('major review reset still occurs under stress');
                break;
            }
            case 'daily-amount-audit': {
                assertCondition(plan.length > 20, 'Daily-amount audit should derive a non-trivial duration.');
                assertCondition(getHifzCompletionState(scenario), 'Daily-amount audit should complete the Hifz track.');
                checks.push('daily-amount mode derives a substantial timeline');
                checks.push('daily-amount mode completes Hifz');
                break;
            }
            case 'review-only-reset-stress': {
                const memorization = getMemorizationEvents(plan);
                assertCondition(memorization.length === 0, 'Review-only reset stress must not produce memorization events.');
                assertCondition(getReviewEvents(plan).length > 0, 'Review-only reset stress must still produce review events.');
                assertCondition(hasResetEvent(plan), 'Review-only reset stress must produce reset events.');
                checks.push('review-only reset stress has no memorization');
                checks.push('review-only reset stress produces review events');
                checks.push('review-only reset stress produces reset events');
                break;
            }
            case 'review-only': {
                const memorization = getMemorizationEvents(plan);
                assertCondition(memorization.length === 0, 'Review-only scenario must not produce memorization events.');
                assertCondition(getReviewEvents(plan).length > 0, 'Review-only scenario must produce review events.');
                checks.push('review-only has no memorization');
                checks.push('review-only produces review events');
                break;
            }
            default: {
                checks.push('base validation only');
                break;
            }
        }

        return {
            scenarioKey: scenario.key,
            passed: true,
            checks,
            errors: []
        };
    } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
        return {
            scenarioKey: scenario.key,
            passed: false,
            checks,
            errors
        };
    }
}

function validatePlanningModeErrors(): string[] {
    const checks: string[] = [];

    let durationErrorCaught = false;
    try {
        new PlanBuilder()
            .setSchedule({ startDate: '2026-01-01', daysPerWeek: 5, isReverse: true })
            .planByDuration({
                from: { surah: 66, ayah: 1 },
                to: { surah: 65, ayah: 1 },
                durationDays: 0
            });
    } catch {
        durationErrorCaught = true;
    }
    assertCondition(durationErrorCaught, 'planByDuration should reject durationDays <= 0.');
    checks.push('planByDuration rejects zero duration');

    let dailyAmountErrorCaught = false;
    try {
        new PlanBuilder()
            .setSchedule({ startDate: '2026-01-01', daysPerWeek: 5, isReverse: true })
            .planByDailyAmount({
                from: { surah: 66, ayah: 1 },
                to: { surah: 65, ayah: 1 },
                dailyLines: 0
            });
    } catch {
        dailyAmountErrorCaught = true;
    }
    assertCondition(dailyAmountErrorCaught, 'planByDailyAmount should reject dailyLines <= 0.');
    checks.push('planByDailyAmount rejects zero daily lines');

    return checks;
}

function main(): void {
    const results = scenarios.map(validateScenario);
    const planningModeChecks = validatePlanningModeErrors();
    const failed = results.filter(result => !result.passed);

    console.log('\nScenario Validator Report\n');

    for (const result of results) {
        console.log(`${result.passed ? 'PASS' : 'FAIL'}  ${result.scenarioKey}`);
        for (const check of result.checks) {
            console.log(`  - ${check}`);
        }
        for (const error of result.errors) {
            console.log(`  - ERROR: ${error}`);
        }
    }

    console.log('\nPlanning Mode Guard Checks');
    for (const check of planningModeChecks) {
        console.log(`  - ${check}`);
    }

    console.log(`\nSummary: ${results.length - failed.length}/${results.length} scenarios passed.`);

    if (failed.length > 0) {
        process.exitCode = 1;
    }
}

main();
