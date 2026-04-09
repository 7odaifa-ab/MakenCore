/**
 * Optimized Binary Quran Data for npm Deployment
 * Uses Buffer for efficient storage and lazy loading
 */

export interface QuranVerseBinary {
    surah: number;
    ayah: number;
    page: number;
    lineStart: number;
    lineEnd: number;
    linesCount: number;
    isSurahEnd: boolean;
    isPageEnd: boolean;
    thematicBreakType: number; // 0=NONE, 1=QUARTER, 2=HIZB, 3=JUZ, 4=SAJDAH
    thematicBreak: boolean;
}

import * as CanonicalData from './CanonicalQuranData';

export class QuranDataBinary {
    private static instance: QuranDataBinary;
    private data: {
        forwardIndex: Map<string, number>;
        reverseIndex: Map<string, number>;
        forwardCumulative: Float32Array;
        reverseCumulative: Float32Array;
        verses: QuranVerseBinary[];
        surahNames: string[];
        surahInfo: [string, number][];
    } | null = null;

    private constructor() {}

    public static getInstance(): QuranDataBinary {
        if (!QuranDataBinary.instance) {
            QuranDataBinary.instance = new QuranDataBinary();
        }
        return QuranDataBinary.instance;
    }

    public isLoaded(): boolean {
        return this.data !== null;
    }

    public loadData(): void {
        if (this.data) return;

        // Lazy load binary data
        this.data = this.createOptimizedData();
    }

    private createOptimizedData() {
        const {
            SURAH_NAMES,
            SURAH_INFO,
            RAW_CUMULATIVE_ARRAY_FORWARD,
            INDEX_MAP_FORWARD,
            REVERSE_INDEX_FORWARD,
            RAW_CUMULATIVE_ARRAY_REVERSE,
            INDEX_MAP_REVERSE,
            REVERSE_INDEX_REVERSE
        } = CanonicalData;

        const forwardIndex = new Map(Object.entries(INDEX_MAP_FORWARD).map(([k, v]) => [k, v as number]));
        const reverseIndex = new Map(Object.entries(INDEX_MAP_REVERSE).map(([k, v]) => [k, v as number]));

        // Convert verse data to compact binary format
        const verses: QuranVerseBinary[] = REVERSE_INDEX_FORWARD.map((v: any) => ({
            surah: v.surah,
            ayah: v.ayah,
            page: v.page,
            lineStart: v.line_start,
            lineEnd: v.line_end,
            linesCount: v.lines_count,
            isSurahEnd: v.is_end,
            isPageEnd: v.is_page_end,
            thematicBreakType: this.encodeThematicType(v.thematic_break_type),
            thematicBreak: v.thematic_break
        }));

        return {
            forwardIndex,
            reverseIndex,
            forwardCumulative: RAW_CUMULATIVE_ARRAY_FORWARD as Float32Array,
            reverseCumulative: RAW_CUMULATIVE_ARRAY_REVERSE as Float32Array,
            verses,
            surahNames: SURAH_NAMES as string[],
            surahInfo: SURAH_INFO as [string, number][]
        };
    }

    private encodeThematicType(type: string): number {
        const types: Record<string, number> = {
            'NONE': 0,
            'QUARTER': 1,
            'HIZB': 2,
            'JUZ': 3,
            'SAJDAH': 4
        };
        return types[type] || 0;
    }

    public getSurahNames(): string[] {
        this.loadData();
        return this.data!.surahNames;
    }

    public getSurahInfo(): [string, number][] {
        this.loadData();
        return this.data!.surahInfo;
    }

    public getForwardCumulative(): Float32Array {
        this.loadData();
        return this.data!.forwardCumulative;
    }

    public getReverseCumulative(): Float32Array {
        this.loadData();
        return this.data!.reverseCumulative;
    }

    public getForwardIndex(): Map<string, number> {
        this.loadData();
        return this.data!.forwardIndex;
    }

    public getReverseIndex(): Map<string, number> {
        this.loadData();
        return this.data!.reverseIndex;
    }

    public getVerses(): QuranVerseBinary[] {
        this.loadData();
        return this.data!.verses;
    }

    // Memory usage optimization
    public unload(): void {
        this.data = null;
    }

    public getMemoryUsage(): number {
        if (!this.data) return 0;
        
        let size = 0;
        // Estimate memory usage
        size += this.data.forwardCumulative.byteLength;
        size += this.data.reverseCumulative.byteLength;
        size += this.data.verses.length * 32; // ~32 bytes per verse
        size += this.data.surahNames.length * 20; // avg string length
        size += this.data.surahInfo.length * 24;
        
        return size;
    }
}
