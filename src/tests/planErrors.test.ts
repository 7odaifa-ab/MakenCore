import { describe, expect, it, vi } from 'vitest';
import { PlanBuilder } from '../builders/PlanBuilder';
import { PlanError, PlanErrorCode, Severity } from '../errors';
import { QuranRepository } from '../core/QuranRepository';
import { WindowMode } from '../core/constants';

function expectPlanError(
    expectedCode: PlanErrorCode,
    expectedSeverity: Severity,
    fn: () => void
): void {
    try {
        fn();
        throw new Error(`Expected PlanError(${expectedCode}) but nothing was thrown.`);
    } catch (e: any) {
        expect(e).toBeInstanceOf(PlanError);
        expect(e.code).toBe(expectedCode);
        expect(e.severity).toBe(expectedSeverity);
    }
}

describe('PlanError Infrastructure', () => {
    it('PlanError instanceof Error', () => {
        const err = new PlanError(PlanErrorCode.MISSING_SCHEDULE, Severity.ERROR, 'test');
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(PlanError);
        expect(err.name).toBe('PlanError');
    });

    it('PlanError carries code, severity, message, context', () => {
        const ctx = { startIdx: 10, endIdx: 5 };
        const err = new PlanError(PlanErrorCode.START_AFTER_END, Severity.ERROR, 'msg', ctx);
        expect(err.code).toBe(PlanErrorCode.START_AFTER_END);
        expect(err.severity).toBe(Severity.ERROR);
        expect(err.message).toBe('msg');
        expect(err.context).toBe(ctx);
    });

    it('PlanError.warn() does not throw (structured log only)', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        PlanError.warn(PlanErrorCode.INVALID_LOCATION, 'موقع غير صالح: سورة 0 آية 0', { surah: 0, ayah: 0 });
        expect(warnSpy).toHaveBeenCalled();
        const firstArg = String(warnSpy.mock.calls[0][0] ?? '');
        expect(firstArg).toContain('INVALID_LOCATION');
        warnSpy.mockRestore();
    });
});

describe('Builder Errors', () => {
    it('MISSING_SCHEDULE — build() without setSchedule()', () => {
        expectPlanError(PlanErrorCode.MISSING_SCHEDULE, Severity.ERROR, () => {
            new PlanBuilder().addHifz(7.5, { surah: 1, ayah: 1 }).build();
        });
    });

    it('MODE_MIXING — addHifz() on WERD mode', () => {
        const builder = new PlanBuilder() as any;
        builder.currentMode = 'WERD_ECOSYSTEM';
        expectPlanError(PlanErrorCode.MODE_MIXING, Severity.ERROR, () => {
            builder.addHifz(7.5, { surah: 1, ayah: 1 });
        });
    });

    it('START_AFTER_END — memorization start after end', () => {
        expectPlanError(PlanErrorCode.START_AFTER_END, Severity.ERROR, () => {
            new PlanBuilder()
                .setSchedule({ startDate: '2026-01-01', daysPerWeek: 5, limitDays: 5, isReverse: false })
                .addHifz(7.5, { surah: 5, ayah: 1 }, { surah: 1, ayah: 1 })
                .build();
        });
    });

    it('MAJOR_REVIEW_AHEAD — major review starts ahead of hifz', () => {
        expectPlanError(PlanErrorCode.MAJOR_REVIEW_AHEAD, Severity.ERROR, () => {
            new PlanBuilder()
                .setSchedule({ startDate: '2026-01-01', daysPerWeek: 5, limitDays: 5, isReverse: false })
                .addHifz(7.5, { surah: 1, ayah: 1 })
                .addMajorReview(100, { surah: 50, ayah: 1 })
                .build();
        });
    });
});

describe('Data Errors', () => {
    it('INVALID_LOCATION — invalid surah', () => {
        const repo = QuranRepository.getInstance();
        expectPlanError(PlanErrorCode.INVALID_LOCATION, Severity.ERROR, () => {
            repo.getIndexFromLocation(999, 1, false);
        });
    });

    it('INVALID_LOCATION — invalid ayah in valid surah', () => {
        const repo = QuranRepository.getInstance();
        expectPlanError(PlanErrorCode.INVALID_LOCATION, Severity.ERROR, () => {
            repo.getIndexFromLocation(1, 9999, false);
        });
    });

    it('INVALID_LOCATION keeps surah+ayah in error context', () => {
        const repo = QuranRepository.getInstance();
        try {
            repo.getIndexFromLocation(200, 5, false);
            throw new Error('Expected PlanError');
        } catch (e: any) {
            expect(e).toBeInstanceOf(PlanError);
            expect(e.context['surah']).toBe(200);
            expect(e.context['ayah']).toBe(5);
        }
    });
});

describe('Regression Fixes', () => {
    it('currentIdx <= globalMax after LinearTrack completion', () => {
        const repo = QuranRepository.getInstance();
        const dirData = repo.getDirectionData(false);
        const globalMax = dirData.cumulative_array.length - 1;

        const manager = new PlanBuilder()
            .setSchedule({ startDate: '2026-01-01', daysPerWeek: 7, limitDays: 100, isReverse: false })
            .addHifz(9999, { surah: 114, ayah: 1 })
            .stopWhenCompleted()
            .build();

        manager.generatePlan();
        const hifzTrack = manager.getTrack(1);

        expect(hifzTrack).toBeDefined();
        expect(hifzTrack!.state.isCompleted).toBe(true);
        expect(hifzTrack!.state.currentIdx).toBeLessThanOrEqual(globalMax);
    });

    it('WindowStrategy sees Hifz history with deterministic execution order', () => {
        const manager = new PlanBuilder()
            .setSchedule({ startDate: '2026-01-01', daysPerWeek: 5, limitDays: 5, isReverse: false })
            .addHifz(7.5, { surah: 1, ayah: 1 })
            .addMinorReview(3, WindowMode.GRADUAL)
            .build();

        const plan = manager.generatePlan();
        expect(plan.length).toBe(5);

        const day1MinorEvents = plan[0].events.filter(e => e.trackId === 2);
        expect(day1MinorEvents.length).toBe(0);

        const day2MinorEvents = plan[1].events.filter(e => e.trackId === 2);
        expect(day2MinorEvents.length).toBe(1);
    });
});
