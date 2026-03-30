import { PlanRecord } from '../../domain/planning/repositories/PlanRepository';
import { PlanDay, PlanEvent } from '../../core/types';
import { EventType } from '../../core/constants';
import { PlanDefinition, TrackDefinition, TrackType, PlanDirection } from '../../domain/planning/entities/PlanConfig';

/**
 * PlanMapper
 * ⚠️ WARNING: Maps plans based on potentially technically incorrect page/line data.
 * Accuracy cannot be guaranteed until the underlying Quranic dataset is finalized.
 */
export class PlanMapper {

    /**
     * Maps a Prisma Plan loaded with all joined tables back to the Domain Record
     */
    public static toDomain(prismaModel: any): PlanRecord {
        const config: PlanDefinition = {
            id: prismaModel.id,
            studentId: prismaModel.userId || 'demo',
            startDate: new Date(prismaModel.startDate),
            direction: PlanDirection.FORWARD,
            daysPerWeek: 5,
            catchUpDaysPerWeek: 0,
            holidays: [],
            tracks: prismaModel.tracks.map((t: any, idx: number) => ({
                id: idx,
                name: t.trackType,
                type: t.trackType as TrackType,
                dailyTargetLines: t.dailyLines
            }))
        };

        const days: PlanDay[] = prismaModel.days.map((d: any) => ({
            dayNum: d.dayNum,
            date: new Date(d.date),
            events: d.events.map((e: any) => ({
                trackId: e.trackId,
                trackName: e.trackName,
                eventType: e.trackId === 1 ? EventType.MEMORIZATION : EventType.REVIEW,
                data: {
                    start: { surah: e.startSurah, ayah: e.startAyah, is_end: false },
                    end: { surah: e.endSurah, ayah: e.endAyah, is_end: true },
                    is_reset: e.isReset
                }
            }))
        }));

        return {
            id: prismaModel.id,
            config,
            days,
            createdAt: new Date(prismaModel.createdAt),
            updatedAt: new Date(prismaModel.updatedAt)
        };
    }

    /**
     * Maps a Domain Record to Prisma Create payloads
     */
    public static toPersistence(domainModel: PlanRecord): any {
        return {
            id: domainModel.id,
            startDate: domainModel.config.startDate,
            tracks: {
                create: (domainModel.config.tracks || []).map((t: any) => ({
                    trackType: t.type || t.trackType,
                    dailyLines: t.dailyTargetLines || t.dailyLines,
                    // mocked start point, as PlanDefinition does not store start points explicitly right now
                    startSurah: 1,
                    startAyah: 1
                }))
            },
            days: {
                create: domainModel.days.map(d => ({
                    dayNum: d.dayNum,
                    date: d.date,
                    events: {
                        create: d.events.map(e => ({
                            trackId: e.trackId,
                            trackName: e.trackName,
                            startSurah: e.data.start.surah,
                            startAyah: e.data.start.ayah,
                            startLine: null,
                            endSurah: e.data.end.surah,
                            endAyah: e.data.end.ayah,
                            endLine: null,
                            isReset: e.data.is_reset || false,
                            metadata: {}
                        }))
                    }
                }))
            }
        };
    }
}
