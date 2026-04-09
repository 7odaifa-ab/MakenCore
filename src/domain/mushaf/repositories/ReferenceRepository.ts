import { LocationObj } from '../../../core/types';
import { PlanError, PlanErrorCode, Severity } from '../../../errors';
import {
    SURAH_NAMES,
    SURAH_INFO,
    RAW_CUMULATIVE_ARRAY_FORWARD,
    INDEX_MAP_FORWARD,
    REVERSE_INDEX_FORWARD,
    RAW_CUMULATIVE_ARRAY_REVERSE,
    INDEX_MAP_REVERSE,
    REVERSE_INDEX_REVERSE 
} from '../../../data/CanonicalQuranData';
import { findExponentialStopIndex } from '../../../utils/Algorithms';

export interface DirectionData {
    index_map: Record<string, number>;
    cumulative_array: Float32Array;
    reverse_index: readonly {
        surah: number,
        ayah: number,
        is_end: boolean,
        page?: number,
        is_page_end?: boolean,
        thematic_break_type?: 'QUARTER' | 'HIZB' | 'JUZ' | 'SAJDAH' | 'NONE',
        thematic_break?: boolean
    }[];
}

/**
 * Refactored ReferenceRepository for Canonical Mushaf Lookup.
 * Splits responsibilities for lookup and traversal logic.
 */
export class ReferenceRepository {
    private static instance: ReferenceRepository;

    private data: {
        forward: DirectionData;
        reverse: DirectionData;
        surah_names: readonly string[];
        surah_info: readonly [string, number][];
    };

    private constructor() {
        this.data = {
            surah_names: SURAH_NAMES,
            surah_info: SURAH_INFO,
            forward: {
                index_map: INDEX_MAP_FORWARD,
                cumulative_array: RAW_CUMULATIVE_ARRAY_FORWARD,
                // @ts-ignore
                reverse_index: REVERSE_INDEX_FORWARD
            },
            reverse: {
                index_map: INDEX_MAP_REVERSE,
                cumulative_array: RAW_CUMULATIVE_ARRAY_REVERSE,
                // @ts-ignore
                reverse_index: REVERSE_INDEX_REVERSE
            }
        };
    }

    public static getInstance(): ReferenceRepository {
        if (!ReferenceRepository.instance) {
            ReferenceRepository.instance = new ReferenceRepository();
        }
        return ReferenceRepository.instance;
    }

    public getDirectionData(isReverse: boolean): DirectionData {
        return isReverse ? this.data.reverse : this.data.forward;
    }

    public getSurahName(surahNum: number): string {
        return this.data.surah_names[surahNum - 1] || `Surah ${surahNum}`;
    }

    public getAyahCount(surahNum: number): number {
        const info = this.data.surah_info[surahNum - 1];
        return info ? info[1] : 0;
    }

    public getIndexFromLocation(surah: number, ayah: number, isReverse: boolean): number {
        const map = isReverse ? this.data.reverse.index_map : this.data.forward.index_map;
        const key = `${surah}:${ayah}`;

        if (map[key] === undefined) {
            throw new PlanError(
                PlanErrorCode.INVALID_LOCATION,
                Severity.ERROR,
                `Invalid location: Surah ${surah}, Ayah ${ayah}`,
                { surah, ayah }
            );
        }

        return map[key];
    }

    public getLocationFromIndex(index: number, map: Record<string, number>): LocationObj & {
        page?: number,
        is_page_end?: boolean,
        thematic_break_type?: 'QUARTER' | 'HIZB' | 'JUZ' | 'SAJDAH' | 'NONE',
        thematic_break?: boolean
    } {
        let lookupArray;

        if (map === this.data.forward.index_map) {
            lookupArray = this.data.forward.reverse_index;
        } else if (map === this.data.reverse.index_map) {
            lookupArray = this.data.reverse.reverse_index;
        } else {
            lookupArray = this.data.forward.reverse_index;
        }

        const loc = lookupArray[index];

        if (!loc) {
            return { surah: 1, ayah: 1, is_end: false };
        }

        return {
            surah: loc.surah,
            ayah: loc.ayah,
            is_end: loc.is_end,
            page: loc.page,
            is_page_end: loc.is_page_end,
            thematic_break_type: loc.thematic_break_type,
            thematic_break: loc.thematic_break
        };
    }

    public getLinesBetween(
        from: { surah: number, ayah: number },
        to: { surah: number, ayah: number },
        direction: boolean | 'auto' = 'auto'
    ): number {
        let isReverse: boolean;

        if (direction === 'auto') {
            const fwdMap = this.data.forward.index_map;
            const idxFrom = fwdMap[`${from.surah}:${from.ayah}`] ?? -1;
            const idxTo = fwdMap[`${to.surah}:${to.ayah}`] ?? -1;
            isReverse = idxFrom > idxTo;
        } else {
            isReverse = direction;
        }

        const dirData = this.getDirectionData(isReverse);
        const startIdx = this.getIndexFromLocation(from.surah, from.ayah, isReverse);
        const endIdx = this.getIndexFromLocation(to.surah, to.ayah, isReverse);

        const startCum = startIdx > 0 ? dirData.cumulative_array[startIdx - 1] : 0;
        const endCum = dirData.cumulative_array[endIdx];

        return parseFloat(Math.abs(endCum - startCum).toFixed(2));
    }

    public moveLocation(
        current: { surah: number, ayah: number },
        linesToAdd: number,
        isReverse: boolean = false
    ): { surah: number, ayah: number } {
        const dirData = this.getDirectionData(isReverse);
        const currentIdx = this.getIndexFromLocation(current.surah, current.ayah, isReverse);

        const currentCumValue = currentIdx > 0 ? dirData.cumulative_array[currentIdx - 1] : 0;
        const targetCumValue = currentCumValue + linesToAdd;

        const maxIndex = dirData.cumulative_array.length - 1;

        let newIdx = findExponentialStopIndex(
            dirData.cumulative_array,
            targetCumValue,
            currentIdx,
            maxIndex
        );

        if (newIdx >= maxIndex) {
            newIdx = maxIndex;
        }

        const newLoc = this.getLocationFromIndex(newIdx, dirData.index_map);

        return { surah: newLoc.surah, ayah: newLoc.ayah };
    }

    // 🚀 NEW: Page metadata lookup
    public getPageMetadata(surah: number, ayah: number): { page: number, isPageEnd: boolean } {
        const idx = this.getIndexFromLocation(surah, ayah, false);
        const loc = this.getLocationFromIndex(idx, this.data.forward.index_map);
        return {
            page: loc.page || 1,
            isPageEnd: loc.is_page_end || false
        };
    }
}
