// src/core/TrackManager.ts
import { ITrack } from '../tracks/BaseTrack';
import { PlanContext } from './PlanContext';
import { ConstraintManager } from '../constraints/ConstraintManager';
import { QuranRepository } from './QuranRepository'; // Type only!
import { DateUtils } from '../utils/DateUtils';
import { PlanDay, PlanEvent } from './types';
import { EventType } from './constants'; // 👈 Import Enum
import { RuleEngine } from '../domain/planning/rules/RuleEngine';
import { RuleContext, RuleCandidate } from '../domain/planning/rules/RuleInterface';
import { AyahIntegrityRule } from '../domain/planning/rules/handlers/AyahIntegrityRule';
import { SurahSnapRule } from '../domain/planning/rules/handlers/SurahSnapRule';
import { PageAlignmentRule } from '../domain/planning/rules/handlers/PageAlignmentRule';
import { ReferenceRepository } from '../domain/mushaf/repositories/ReferenceRepository';
import { LoadBalancerService } from '../domain/planning/services/LoadBalancerService';
import { DailyLoadWeights, TrackDefinition, TrackType } from '../domain/planning/entities/PlanConfig';

export interface ManagerConfig {
    startDate: string;
    endDate?: string;
    daysPerWeek: number;
    limitDays: number;
    isReverse: boolean;
    catchUpDayOfWeek?: number; // Epic 3
    holidays?: string[];       // Epic 3: 'YYYY-MM-DD'
}

export type StopCondition = (tracks: Map<number, ITrack>) => boolean;

/**
 * TrackManager
 * * The core simulation engine.
 * * ⚠️ WARNING: This engine currently operates on APPROXIMATE and INCOMPLETE Quranic data.
 * * Distribution of pages and thematic breaks are technically inaccurate.
 * * DO NOT PROCEED WITH PRODUCTION LOGIC until a verified, ground-truth dataset is provided.
 * * 🚀 REFACTORED:
 * 1. Uses Constructor Injection for QuranRepository (Pure DI).
 * 2. Generates dynamic 'events' array instead of fixed fields.
 */

export class TrackManager {
    private tracks: Map<number, ITrack> = new Map();
    private constraintManager: ConstraintManager;
    private stopCondition: StopCondition | null = null;

    private ruleEngine: RuleEngine;

    // 🚀 DI: Repository is injected, not instantiated
    constructor(
        private config: ManagerConfig,
        private quranRepo: QuranRepository
    ) {
        this.constraintManager = new ConstraintManager();
        this.ruleEngine = new RuleEngine([
            new AyahIntegrityRule(),
            new SurahSnapRule(),
            new PageAlignmentRule()
        ]);
    }

    addTrack(track: ITrack) {
        this.tracks.set(track.id, track);
    }

    hasTrack(id: number): boolean {
        return this.tracks.has(id);
    }

    getTrack(id: number): ITrack | undefined {
        return this.tracks.get(id);
    }

    // Epic 3 Load Balancer configuration
    private loadWeights: DailyLoadWeights | null = null;
    private trackDefs: TrackDefinition[] = [];

    setLoadBalancing(weights: DailyLoadWeights, tracks: TrackDefinition[]) {
        this.loadWeights = weights;
        this.trackDefs = tracks;
    }

    getConstraintManager() {
        return this.constraintManager;
    }

    setStopCondition(condition: StopCondition) {
        this.stopCondition = condition;
    }

    /**
     * Main simulation loop.
     */
    generatePlan(): PlanDay[] {
        const plan: PlanDay[] = [];
        let currentDate = new Date(this.config.startDate);

        // Use injected repo
        const dirData = this.quranRepo.getDirectionData(this.config.isReverse);
        const endDateObj = this.config.endDate ? new Date(this.config.endDate) : null;

        // Skip to first working day
        while (!DateUtils.isWorkingDay(currentDate, this.config.daysPerWeek)) {
            currentDate = DateUtils.addDays(currentDate, 1);
        }

        let dayCounter = 1;

        while (true) {
            // Stop conditions
            if (this.config.limitDays > 0 && dayCounter > this.config.limitDays) break;
            if (endDateObj && currentDate > endDateObj) break;
            if (dayCounter > 5000) break;

            // Epic 3: Skip calculation and emit empty day if Custom Holiday
            const dateStr = currentDate.toISOString().split('T')[0];
            if (this.config.holidays && this.config.holidays.includes(dateStr)) {
                plan.push({
                    dayNum: dayCounter,
                    date: new Date(currentDate),
                    is_off: true,
                    events: []
                });
                dayCounter++;
                currentDate = DateUtils.addDays(currentDate, 1);
                while (!DateUtils.isWorkingDay(currentDate, this.config.daysPerWeek)) {
                    currentDate = DateUtils.addDays(currentDate, 1);
                }
                continue;
            }

            // Build context (Pass injected repo down to context)
            const dayContext = new PlanContext(
                currentDate,
                this.quranRepo, // 👈 Passing the injected instance
                this.constraintManager,
                this.tracks,
                this.config.isReverse,
                dirData.cumulative_array,
                dirData.index_map
            );

            // 🚀 NEW: Initialize dynamic day structure
            const currentPlanDay: PlanDay = {
                dayNum: dayCounter,
                date: new Date(currentDate),
                is_off: false,
                events: [] // Empty event container
            };

            // Epic 3: Load Balancing Application
            let trackAllowances = new Map<number, number>();
            if (this.loadWeights && this.trackDefs.length > 0) {
                const balancer = new LoadBalancerService();
                const isCatchUp = this.config.catchUpDayOfWeek !== undefined && currentDate.getDay() === this.config.catchUpDayOfWeek;
                const allowances = balancer.calculateDailyAllowance(this.trackDefs, this.loadWeights, isCatchUp);
                allowances.forEach(a => trackAllowances.set(a.trackId, a.allowedLines));
            }

            // Execute tracks in ascending id order — enforces HIFZ(1)→MINOR(2)→MAJOR(3).
            // WindowStrategy depends on Hifz history already being committed before it runs.
            // Sorting here makes that invariant explicit and safe regardless of addTrack() order.
            for (const track of [...this.tracks.values()].sort((a, b) => a.id - b.id)) {
                
                // If there's a dynamic allowance, override the track config temporarily
                const originalLines = (track as any).config.dailyLines;
                if (trackAllowances.has(track.id)) {
                    (track as any).config.dailyLines = trackAllowances.get(track.id);
                }

                const rawStep = track.calculateNextStep(dayContext);

                // Restore
                if (trackAllowances.has(track.id)) {
                    (track as any).config.dailyLines = originalLines;
                }

                if (rawStep) {
                    // Epic 2: Pass candidate through rule pipeline
                    const candidate: RuleCandidate = {
                        start: rawStep.start,
                        proposedEnd: rawStep.end,
                        targetLines: rawStep.linesProcessed,
                        isReverse: this.config.isReverse
                    };

                    const ruleContext: RuleContext = {
                        repository: ReferenceRepository.getInstance(),
                        trackId: track.id,
                        snapThresholdLines: 7 // default threshold
                    };

                    const ruleResult = this.ruleEngine.evaluate(candidate, ruleContext);

                    // Rebuild step with approved end
                    const approvedIdx = this.quranRepo.getIndexFromLocation(ruleResult.approvedEnd.surah, ruleResult.approvedEnd.ayah, this.config.isReverse);
                    const finalLines = this.quranRepo.getLinesBetween(candidate.start, ruleResult.approvedEnd, this.config.isReverse);
                    
                    const step: typeof rawStep = {
                        ...rawStep,
                        end: ruleResult.approvedEnd,
                        endIdx: approvedIdx,
                        linesProcessed: finalLines,
                        appliedRules: ruleResult.metadata ? ruleResult.metadata.appliedRule.split(', ') : [],
                        snapReason: ruleResult.metadata?.reason,
                        warnings: ruleResult.warnings,
                        pageStart: candidate.start.page,
                        pageEnd: ruleResult.approvedEnd.page
                    };

                    track.commitStep(step, currentDate);

                    // 🚀 NEW: Generic Event Creation
                    // Determines event type based on track type/name logic
                    // (Simplification: assuming 'linear' = MEMORIZATION, others = REVIEW)
                    // You can enhance this mapping logic later.
                    let eType = EventType.REVIEW;
                    if (track.type === 'linear') eType = EventType.MEMORIZATION;

                    const event: PlanEvent = {
                        trackId: track.id,
                        trackName: track.name,
                        eventType: eType,
                        data: {
                            start: step.start,
                            end: step.end,
                            lines: step.linesProcessed,
                            is_reset: step.flags?.includes('reset')
                        }
                    };

                    currentPlanDay.events.push(event);
                }
            }

            plan.push(currentPlanDay);

            if (this.stopCondition && this.stopCondition(this.tracks)) {
                break;
            }

            // Advance time
            dayCounter++;
            currentDate = DateUtils.addDays(currentDate, 1);

            while (!DateUtils.isWorkingDay(currentDate, this.config.daysPerWeek)) {
                currentDate = DateUtils.addDays(currentDate, 1);
            }
        }

        return plan;
    }
}