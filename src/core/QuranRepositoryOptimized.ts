import { LocationObj } from './types';
import { QuranDataBinary, QuranVerseBinary } from '../data/QuranDataBinary';
import { findExponentialStopIndex } from '../utils/Algorithms';
import { PlanError, PlanErrorCode, Severity } from '../errors';

/**
 * Optimized QuranRepository for npm deployment
 * Uses lazy loading and binary data format for better performance
 */
export class QuranRepositoryOptimized {
    private static instance: QuranRepositoryOptimized;
    private binaryData: QuranDataBinary;

    private constructor() {
        this.binaryData = QuranDataBinary.getInstance();
    }

    public static getInstance(): QuranRepositoryOptimized {
        if (!QuranRepositoryOptimized.instance) {
            QuranRepositoryOptimized.instance = new QuranRepositoryOptimized();
        }
        return QuranRepositoryOptimized.instance;
    }

    /**
     * Lazy loads data only when needed
     */
    private ensureDataLoaded() {
        this.binaryData.loadData();
    }

    /**
     * Gets dataset for specified direction.
     * @complexity O(1)
     */
    public getDirectionData(isReverse: boolean) {
        this.ensureDataLoaded();
        
        return {
            index_map: isReverse ? this.binaryData.getReverseIndex() : this.binaryData.getForwardIndex(),
            cumulative_array: isReverse ? this.binaryData.getReverseCumulative() : this.binaryData.getForwardCumulative(),
            reverse_index: this.binaryData.getVerses()
        };
    }

    /**
     * Gets Arabic surah name.
     * @complexity O(1)
     */
    public getSurahName(surahNum: number): string {
        this.ensureDataLoaded();
        const names = this.binaryData.getSurahNames();
        return names[surahNum - 1] || `Surah ${surahNum}`;
    }

    /**
     * Gets total ayah count for a surah.
     * @complexity O(1)
     */
    public getAyahCount(surahNum: number): number {
        this.ensureDataLoaded();
        const info = this.binaryData.getSurahInfo();
        const surahInfo = info[surahNum - 1];
        return surahInfo ? surahInfo[1] : 0;
    }

    /**
     * Converts location (Surah:Ayah) to cumulative array index.
     * @complexity O(1) - hash table lookup
     */
    public getIndexFromLocation(surah: number, ayah: number, isReverse: boolean): number {
        this.ensureDataLoaded();
        const map = isReverse ? this.binaryData.getReverseIndex() : this.binaryData.getForwardIndex();
        const key = `${surah}:${ayah}`;

        const index = map.get(key);
        if (index === undefined) {
            throw new PlanError(
                PlanErrorCode.INVALID_LOCATION,
                Severity.ERROR,
                `Invalid location: Surah ${surah}, Ayah ${ayah}`,
                { surah, ayah }
            );
        }

        return index;
    }

    /**
     * Reverse lookup: Index -> Location.
     * @complexity O(1) - direct array access
     */
    public getLocationFromIndex(index: number, map: Map<string, number>): LocationObj {
        this.ensureDataLoaded();
        const verses = this.binaryData.getVerses();
        
        const loc = verses[index];
        if (!loc) {
            return { surah: 1, ayah: 1, is_end: false };
        }

        return { 
            surah: loc.surah, 
            ayah: loc.ayah, 
            is_end: loc.isSurahEnd,
            page: loc.page,
            is_page_end: loc.isPageEnd,
            thematic_break: loc.thematicBreak,
            thematic_break_type: this.decodeThematicType(loc.thematicBreakType) as 'QUARTER' | 'HIZB' | 'JUZ' | 'SAJDAH' | 'NONE'
        };
    }

    private decodeThematicType(type: number): string {
        const types: Record<number, string> = {
            0: 'NONE',
            1: 'QUARTER',
            2: 'HIZB',
            3: 'JUZ',
            4: 'SAJDAH'
        };
        return types[type] || 'NONE';
    }

    /**
     * Move Location Forward
     * @complexity O(log k) - exponential search
     */
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

    /**
     * Calculate lines between two locations
     * @complexity O(1) - prefix sum calculation
     */
    public getLinesBetween(
        from: { surah: number, ayah: number },
        to: { surah: number, ayah: number },
        direction: boolean | 'auto' = 'auto'
    ): number {
        let isReverse: boolean;

        if (direction === 'auto') {
            const fwdMap = this.binaryData.getForwardIndex();
            const idxFrom = fwdMap.get(`${from.surah}:${from.ayah}`) ?? -1;
            const idxTo = fwdMap.get(`${to.surah}:${to.ayah}`) ?? -1;
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

    /**
     * Memory management for npm deployment
     */
    public getMemoryUsage(): number {
        return this.binaryData.getMemoryUsage();
    }

    public unloadData(): void {
        this.binaryData.unload();
    }

    /**
     * Performance metrics
     */
    public getMetrics() {
        return {
            memoryUsage: this.getMemoryUsage(),
            versesCount: this.binaryData.isLoaded() ? this.binaryData.getVerses().length : 0,
            surahCount: this.binaryData.isLoaded() ? this.binaryData.getSurahNames().length : 0,
            isLoaded: this.binaryData.isLoaded()
        };
    }
}
