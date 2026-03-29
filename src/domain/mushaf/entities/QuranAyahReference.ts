/**
 * Canonical model for a single Ayah in the Mushaf.
 */
export interface QuranAyahReference {
    surah: number;
    ayah: number;
    lines: number;
    page: number;
    isSurahEnd: boolean;
    isPageEnd: boolean;
    thematicBreak: boolean; // Rub, Hizb, Juz or thematic stop
}

/**
 * Payload for a directional index element.
 */
export interface DirectionalIndexElement {
    surah: number;
    ayah: number;
    is_end: boolean;
    page: number;
    is_page_end: boolean;
}

/**
 * Directional Index Data
 */
export interface DirectionalIndex {
    cumulative_lines: Float32Array;
    index_map: Record<string, number>;
    locations: readonly DirectionalIndexElement[];
}

/**
 * Contract for a canonical dataset payload.
 */
export interface CanonicalMushafDataset {
    surah_info: readonly [string, number][]; // [surah name, ayah count]
    surah_names: readonly string[];
    forward: DirectionalIndex;
    reverse: DirectionalIndex;
}
