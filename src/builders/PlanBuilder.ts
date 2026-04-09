// src/builders/PlanBuilder.ts
import { TrackManager } from '../core/TrackManager';
import {
    PlanMode,
    ScheduleConfig,
    LocationConfig,
    TrackRequest,
    CompletionByDurationConfig,
    CompletionByDailyAmountConfig
} from './PlanTypes';
import { HifzSystem } from './HifzSystem';
import { QuranRepository } from '../core/QuranRepository';
import { WindowMode, TrackId } from '../core/constants';
import { PlanError, PlanErrorCode, Severity } from '../errors';

/**
 * PlanBuilder
 * * Fluent API for building complex plans.
 * * REFACTORED: Injects QuranRepository into TrackManager.
 */
export class PlanBuilder {
    private requests: TrackRequest[] = [];
    private scheduleConfig: ScheduleConfig | null = null;
    private currentMode: PlanMode = 'NONE';
    private stopOnCompletion: boolean = false;

    private getScheduleOrThrow(): ScheduleConfig {
        if (!this.scheduleConfig) {
            throw new PlanError(
                PlanErrorCode.MISSING_SCHEDULE,
                Severity.ERROR,
                'يجب استدعاء setSchedule() قبل تحديد وضع الخطة.'
            );
        }

        return this.scheduleConfig;
    }

    private getStudyDaysWithinDuration(durationDays: number, daysPerWeek: number): number {
        if (durationDays <= 0) {
            throw new PlanError(
                PlanErrorCode.INVALID_INPUT,
                Severity.ERROR,
                'مدة الخطة يجب أن تكون أكبر من صفر.',
                { durationDays }
            );
        }

        if (daysPerWeek <= 0 || daysPerWeek > 7) {
            throw new PlanError(
                PlanErrorCode.INVALID_INPUT,
                Severity.ERROR,
                'عدد أيام الدراسة في الأسبوع يجب أن يكون بين 1 و 7.',
                { daysPerWeek }
            );
        }

        return Math.max(1, Math.ceil((durationDays * daysPerWeek) / 7));
    }

    private replaceFirstHifzRequest(amountLines: number, startLocation: LocationConfig, endLocation: LocationConfig): void {
        const hifzIndex = this.requests.findIndex((req) => req.type === 'HIFZ');

        if (hifzIndex >= 0) {
            this.requests[hifzIndex] = {
                type: 'HIFZ',
                params: { amountLines, startLocation, endLocation }
            };
            return;
        }

        this.requests.push({
            type: 'HIFZ',
            params: { amountLines, startLocation, endLocation }
        });
    }

    public planByDuration(config: CompletionByDurationConfig): PlanBuilder {
        const schedule = this.getScheduleOrThrow();
        const repo = QuranRepository.getInstance();
        const totalLines = repo.getLinesBetween(config.from, config.to, schedule.isReverse ?? false);
        const studyDays = this.getStudyDaysWithinDuration(config.durationDays, schedule.daysPerWeek);
        const derivedDailyLines = Math.max(1, Math.ceil(totalLines / studyDays));

        this.scheduleConfig = {
            ...schedule,
            limitDays: config.durationDays
        };

        this.replaceFirstHifzRequest(derivedDailyLines, config.from, config.to);
        this.currentMode = 'HIFZ_ECOSYSTEM';
        return this;
    }

    public planByDailyAmount(config: CompletionByDailyAmountConfig): PlanBuilder {
        const schedule = this.getScheduleOrThrow();
        const repo = QuranRepository.getInstance();

        if (config.dailyLines <= 0) {
            throw new PlanError(
                PlanErrorCode.INVALID_INPUT,
                Severity.ERROR,
                'الكمية اليومية يجب أن تكون أكبر من صفر.',
                { dailyLines: config.dailyLines }
            );
        }

        const totalLines = repo.getLinesBetween(config.from, config.to, schedule.isReverse ?? false);
        const studyDaysNeeded = Math.max(1, Math.ceil(totalLines / config.dailyLines));
        const calendarDaysNeeded = Math.max(1, Math.ceil((studyDaysNeeded * 7) / schedule.daysPerWeek));

        this.scheduleConfig = {
            ...schedule,
            limitDays: calendarDaysNeeded
        };

        this.replaceFirstHifzRequest(config.dailyLines, config.from, config.to);
        this.currentMode = 'HIFZ_ECOSYSTEM';
        return this;
    }

    public setSchedule(config: ScheduleConfig): PlanBuilder {
        this.scheduleConfig = config;
        return this;
    }

    public addHifz(amountLines: number, startLocation: LocationConfig, endLocation?: LocationConfig): PlanBuilder {
        // ... (Logic unchanged)
        if (this.currentMode === 'WERD_ECOSYSTEM') throw new PlanError(
            PlanErrorCode.MODE_MIXING,
            Severity.ERROR,
            'لا يمكن الخلط بين أنظمة HIFZ و WERD في نفس الخطة.'
        );
        this.currentMode = 'HIFZ_ECOSYSTEM';
        this.requests.push({ type: 'HIFZ', params: { amountLines, startLocation, endLocation } });
        return this;
    }

    public addMinorReview(
        lessonCount: number,
        mode: WindowMode = WindowMode.GRADUAL  // ← اختياري، default = سلوك قديم
    ): PlanBuilder {
        if (this.currentMode === 'NONE') this.currentMode = 'HIFZ_ECOSYSTEM';
        this.requests.push({
            type: 'MINOR_REVIEW',
            params: { lessonCount, mode }  // ← mode محفوظ في الـ request
        });
        return this;
    }


    public addMajorReview(amountLines: number, startLocation?: LocationConfig, endLocation?: LocationConfig): PlanBuilder {
        // ... (Logic unchanged)
        if (this.currentMode === 'NONE') this.currentMode = 'HIFZ_ECOSYSTEM';
        this.requests.push({ type: 'MAJOR_REVIEW', params: { amountLines, startLocation, endLocation } });
        return this;
    }

    public stopWhenCompleted(): PlanBuilder {
        this.stopOnCompletion = true;
        return this;
    }

    public build(): TrackManager {
        if (!this.scheduleConfig) {
            throw new PlanError(
                PlanErrorCode.MISSING_SCHEDULE,
                Severity.ERROR,
                'يجب استدعاء setSchedule() قبل build().'
            );
        }

        // 🚀 DI Injection Point
        // The Builder is the "Composition Root" here (or close to it).
        const repository = QuranRepository.getInstance();

        const manager = new TrackManager({
            startDate: this.scheduleConfig.startDate,
            daysPerWeek: this.scheduleConfig.daysPerWeek,
            limitDays: this.scheduleConfig.limitDays || 0,
            endDate: this.scheduleConfig.endDate,
            isReverse: this.scheduleConfig.isReverse || false,
            // Pedagogical constraints
            maxAyahPerDay: this.scheduleConfig.maxAyahPerDay,
            sequentialSurahMode: this.scheduleConfig.sequentialSurahMode,
            strictSequentialMode: this.scheduleConfig.strictSequentialMode,
            consolidationDayInterval: this.scheduleConfig.consolidationDayInterval
        }, repository); // Passing the dependency

        const context = { isReverse: this.scheduleConfig.isReverse || false };

        const priorityMap: Record<string, number> = {
            'HIFZ': 1,
            'MINOR_REVIEW': 2,
            'MAJOR_REVIEW': 3
        };
        this.requests.sort((a, b) => priorityMap[a.type] - priorityMap[b.type]);

        let majorReviewCounter = TrackId.MAJOR_REVIEW;

        this.requests.forEach(req => {
            switch (req.type) {
                case 'HIFZ':
                    HifzSystem.createHifzTrack(
                        manager,
                        context,
                        req.params.amountLines,
                        req.params.startLocation,
                        req.params.endLocation
                    );
                    break;
                case 'MINOR_REVIEW':
                    HifzSystem.createMinorReview(
                        manager,
                        req.params.lessonCount,
                        req.params.mode
                    );
                    break;
                case 'MAJOR_REVIEW':
                    HifzSystem.createMajorReview(
                        manager,
                        context,
                        req.params.amountLines,
                        majorReviewCounter++,
                        req.params.startLocation,
                        req.params.endLocation
                    );
                    break;
            }
        });

        if (this.currentMode === 'HIFZ_ECOSYSTEM' && this.stopOnCompletion) {
            manager.setStopCondition(HifzSystem.getCompletionCondition());
        }

        return manager;
    }
}