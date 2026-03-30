import * as fs from 'fs';
import * as path from 'path';

interface HafsVerse {
    id: number;
    jozz: number;
    sora: number;
    sora_name_en: string;
    sora_name_ar: string;
    page: number;
    line_start: number;
    line_end: number;
    aya_no: number;
    aya_text: string;
    aya_text_emlaey: string;
}

export function generateHafsCanonicalDataset(jsonPath: string, outputPath: string) {
    if (!fs.existsSync(jsonPath)) {
        throw new Error(`Hafs JSON file not found at ${jsonPath}`);
    }

    const rawData: HafsVerse[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Sort array by ID to ensure correct sequential order
    rawData.sort((a, b) => a.id - b.id);

    // Pass 1: Count ayahs per line (for handling shared lines appropriately)
    const lineAyahCounts = new Map<string, number>();
    for (const verse of rawData) {
        for (let l = verse.line_start; l <= verse.line_end; l++) {
            const key = `${verse.page}:${l}`;
            lineAyahCounts.set(key, (lineAyahCounts.get(key) || 0) + 1);
        }
    }

    const canonicalData: any[] = [];
    const surahNames: string[] = [];
    const surahInfo: [string, number][] = [];

    let currentSurah = -1;
    let surahAyahCount = 0;

    for (let i = 0; i < rawData.length; i++) {
        const verse = rawData[i];
        
        // Detect Surah Boundaries
        if (verse.sora !== currentSurah) {
            if (currentSurah !== -1) {
                surahInfo.push([surahNames[currentSurah - 1], surahAyahCount]);
            }
            currentSurah = verse.sora;
            surahNames[currentSurah - 1] = verse.sora_name_ar;
            surahAyahCount = 0;
        }
        surahAyahCount++;

        const isSurahEnd = (i === rawData.length - 1) || (rawData[i + 1].sora !== verse.sora);
        const isPageEnd = (i === rawData.length - 1) || (rawData[i + 1].page !== verse.page);
        
        // Detect Thematic Break: ۞ for Rub, ۩ for Sajdah
        const hasThematicMark = verse.aya_text.includes('۞') || verse.aya_text.includes('۩');
        
        // Calculate lines weight, handling shared lines proportionally
        let linesCount = 0;
        for (let l = verse.line_start; l <= verse.line_end; l++) {
            const key = `${verse.page}:${l}`;
            linesCount += 1.0 / (lineAyahCounts.get(key) || 1);
        }
        // Round to 4 decimal places to avoid floating point anomalies
        linesCount = Number(linesCount.toFixed(4));

        canonicalData.push({
            surah: verse.sora,
            ayah: verse.aya_no,
            page: verse.page,
            lineStart: verse.line_start,
            lineEnd: verse.line_end,
            lines: linesCount,
            isSurahEnd,
            isPageEnd,
            thematicBreak: hasThematicMark
        });
    }
    
    // Push last surah info
    surahInfo.push([surahNames[currentSurah - 1], surahAyahCount]);

    // Build Forward and Reverse arrays for the Engine
    const fwdIdxMap: Record<string, number> = {};
    const fwdCumArray: number[] = [];
    const fwdLocations: any[] = [];
    let cumulativeProgress = 0;

    canonicalData.forEach((ayah, idx) => {
        cumulativeProgress += ayah.lines;
        fwdCumArray.push(parseFloat(cumulativeProgress.toFixed(4)));
        fwdIdxMap[`${ayah.surah}:${ayah.ayah}`] = idx;
        fwdLocations.push({
            surah: ayah.surah,
            ayah: ayah.ayah,
            page: ayah.page,
            is_end: ayah.isSurahEnd,
            is_page_end: ayah.isPageEnd,
            thematic_break: ayah.thematicBreak
        });
    });

    // Reverse Data (114 -> 1)
    const revSortData = [...canonicalData].sort((a, b) => {
        if (a.surah !== b.surah) return b.surah - a.surah;
        return a.ayah - b.ayah;
    });

    const revIdxMap: Record<string, number> = {};
    const revCumArray: number[] = [];
    const revLocations: any[] = [];
    let revCumulativeProgress = 0;

    revSortData.forEach((ayah, idx) => {
        revCumulativeProgress += ayah.lines;
        revCumArray.push(parseFloat(revCumulativeProgress.toFixed(4)));
        revIdxMap[`${ayah.surah}:${ayah.ayah}`] = idx;
        revLocations.push({
            surah: ayah.surah,
            ayah: ayah.ayah,
            page: ayah.page,
            is_end: ayah.isSurahEnd,
            is_page_end: ayah.isPageEnd,
            thematic_break: ayah.thematicBreak
        });
    });

    const tsContent = `/**
 * Canonical Mushaf Dataset (Hafs v18) - Ground Truth
 * Generated automatically. DO NOT EDIT.
 */

export const SURAH_NAMES: readonly string[] = ${JSON.stringify(surahNames, null, 2)};

export const SURAH_INFO: readonly [string, number][] = ${JSON.stringify(surahInfo, null, 2)};

// ================= FORWARD DATA =================
export const RAW_CUMULATIVE_ARRAY_FORWARD = new Float32Array(${JSON.stringify(fwdCumArray)});
export const INDEX_MAP_FORWARD: Record<string, number> = ${JSON.stringify(fwdIdxMap)};
export const REVERSE_INDEX_FORWARD = ${JSON.stringify(fwdLocations)};

// ================= REVERSE DATA =================
export const RAW_CUMULATIVE_ARRAY_REVERSE = new Float32Array(${JSON.stringify(revCumArray)});
export const INDEX_MAP_REVERSE: Record<string, number> = ${JSON.stringify(revIdxMap)};
export const REVERSE_INDEX_REVERSE = ${JSON.stringify(revLocations)};
`;

    fs.writeFileSync(outputPath, tsContent, 'utf8');
    console.log(`✅ Dataset generated from Hafs JSON: ${outputPath}`);
}

export function generateCanonicalDataset(sourcePath: string, outputPath: string) {
    return generateHafsCanonicalDataset(sourcePath, outputPath);
}

if (require.main === module) {
    const jsonFile = path.resolve(__dirname, '../../../../src/data/hafs/data/hafsData_v18.json');
    const outTs = path.resolve(__dirname, '../../../../src/data/CanonicalQuranData.ts');
    generateHafsCanonicalDataset(jsonFile, outTs);
}
