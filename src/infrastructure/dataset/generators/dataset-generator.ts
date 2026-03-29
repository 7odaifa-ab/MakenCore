import * as fs from 'fs';
import * as path from 'path';
import { QuranAyahReference } from '../../../domain/mushaf/entities/QuranAyahReference';

interface RawRow {
    surahName: string;
    surah: number;
    ayah: number;
    lines: number;
}

export function generateCanonicalDataset(csvPath: string, outputPath: string) {
    if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found at ${csvPath}`);
    }

    const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
    // skip header
    lines.shift();

    const rawData: RawRow[] = lines.map(line => {
        const parts = line.split(',');
        return {
            surahName: parts[0].trim(),
            surah: parseInt(parts[1]),
            ayah: parseInt(parts[2]),
            lines: parseFloat(parts[3])
        };
    });

    const canonicalData: QuranAyahReference[] = [];
    let cumulativeLines = 0;
    let currentPage = 1;

    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        cumulativeLines += row.lines;
        
        // Approximate page number (15 lines per Madinah Mushaf page)
        // With fractions, it's safer to compute using cumulative lines
        const expectedPage = Math.max(1, Math.ceil(cumulativeLines / 15));
        
        let isPageEnd = false;
        if (i < rawData.length - 1) {
            const nextCumulative = cumulativeLines + rawData[i + 1].lines;
            if (expectedPage < Math.ceil(nextCumulative / 15)) {
                isPageEnd = true;
            }
        } else {
            isPageEnd = true; // Last ayah
        }

        const isSurahEnd = i === rawData.length - 1 || rawData[i+1].surah !== row.surah;
        
        canonicalData.push({
            surah: row.surah,
            ayah: row.ayah,
            lines: row.lines,
            page: expectedPage,
            isSurahEnd,
            isPageEnd,
            thematicBreak: false // Can be expanded with a proper Rub/Hizb dataset in future
        });
        
        currentPage = expectedPage;
    }

    // Now build forward and reverse directions
    // Forward
    const fwdIdxMap: Record<string, number> = {};
    const fwdCumArray: number[] = [];
    const fwdLocations: any[] = [];
    let curCum = 0;
    
    canonicalData.forEach((ayah, idx) => {
        curCum += ayah.lines;
        const curCumRounded = parseFloat(curCum.toFixed(6));
        fwdCumArray.push(curCumRounded);
        fwdIdxMap[`${ayah.surah}:${ayah.ayah}`] = idx;
        fwdLocations.push({
            surah: ayah.surah,
            ayah: ayah.ayah,
            is_end: ayah.isSurahEnd,
            page: ayah.page,
            is_page_end: ayah.isPageEnd
        });
    });

    // Reverse
    const revData = [...canonicalData].reverse();
    const revIdxMap: Record<string, number> = {};
    const revCumArray: number[] = [];
    const revLocations: any[] = [];
    curCum = 0;

    // To properly map verse order, in reverse direction we actually go from An-Nas (114) to Al-Fatihah (1)
    // and within each surah, usually we go backwards across surahs, but forward within a review? 
    // Wait! The Python script sorts by `[surah_order, ayah_num]` ascending/descending depending on what we want.
    // The Python script says:
    // df_rev = df.sort_values(by=['surah_order', 'ayah_num'], ascending=[False, True])
    // So surah goes 114 -> 1, but ayah within surah goes 1 -> end! (ascending ayah).
    
    // Let's sort manually to match Python behavior
    const revSortData = [...canonicalData].sort((a, b) => {
        if (a.surah !== b.surah) return b.surah - a.surah; // Descending surahs
        return a.ayah - b.ayah; // Ascending ayahs
    });

    revSortData.forEach((ayah, idx) => {
        curCum += ayah.lines;
        const curCumRounded = parseFloat(curCum.toFixed(6));
        revCumArray.push(curCumRounded);
        revIdxMap[`${ayah.surah}:${ayah.ayah}`] = idx;
        revLocations.push({
            surah: ayah.surah,
            ayah: ayah.ayah,
            is_end: ayah.isSurahEnd,
            page: ayah.page,
            is_page_end: ayah.isPageEnd
        });
    });

    // Surah stats
    const surahNames: string[] = [];
    const surahInfo: [string, number][] = [];
    
    // Group by surah
    let curSurah = -1;
    let sName = '';
    let aCount = 0;
    canonicalData.forEach(ayah => {
        if (ayah.surah !== curSurah) {
            if (curSurah !== -1) {
                surahInfo.push([sName, aCount]);
                surahNames.push(sName);
            }
            curSurah = ayah.surah;
            const rawRow = rawData.find(r => r.surah === ayah.surah);
            sName = rawRow ? rawRow.surahName : `Surah ${ayah.surah}`;
            aCount = 0;
        }
        aCount = Math.max(aCount, ayah.ayah);
    });
    if (curSurah !== -1) {
        surahInfo.push([sName, aCount]);
        surahNames.push(sName);
    }

    const outputObj = {
        surah_names: surahNames,
        surah_info: surahInfo,
        forward: {
            cumulative_lines: fwdCumArray,
            index_map: fwdIdxMap,
            locations: fwdLocations
        },
        reverse: {
            cumulative_lines: revCumArray,
            index_map: revIdxMap,
            locations: revLocations
        }
    };

    // We can write it as JSON or TS
    const tsContent = `/**
 * Canonical Mushaf Dataset generated automatically.
 * DO NOT EDIT MANUALLY.
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

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, tsContent, 'utf8');
    console.log(`Successfully generated dataset at ${outputPath}`);
    
    // Return for validation string
    return outputObj;
}

if (require.main === module) {
    const csvFile = path.resolve(__dirname, '../../../../src/data/قاعدة بيانات - من الفاتحة.csv');
    const outTs = path.resolve(__dirname, '../../../../src/data/CanonicalQuranData.ts');
    generateCanonicalDataset(csvFile, outTs);
}
