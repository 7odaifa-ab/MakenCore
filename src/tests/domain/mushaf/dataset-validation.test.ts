import * as path from 'path';
import { generateCanonicalDataset } from '../../../infrastructure/dataset/generators/dataset-generator';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function runTests() {
    console.log("Starting Dataset Validation Tests...");
    const csvPath = path.resolve(__dirname, '../../../../src/data/قاعدة بيانات - من الفاتحة.csv');
    const outTs = path.join(__dirname, 'dummy-out.ts'); // just for memory, but generates real data
    
    // This executes the pipeline
    const dataset = generateCanonicalDataset(csvPath, outTs);

    const fw = dataset.forward.locations;
    const rev = dataset.reverse.locations;

    // 1. Validate ayah continuity
    console.log("Validating Ayah continuity per Surah...");
    let prevSurah = 1;
    let prevAyah = 0;
    for (let loc of fw) {
        if (loc.surah === prevSurah) {
            assert(loc.ayah === prevAyah + 1, `Gap in surah ${loc.surah}: expected ayah ${prevAyah + 1}, got ${loc.ayah}`);
        } else {
            assert(loc.surah === prevSurah + 1, `Gap in surahs: expected ${prevSurah + 1}, got ${loc.surah}`);
            assert(loc.ayah === 1, `Surah ${loc.surah} does not start at ayah 1 (got ${loc.ayah})`);
            assert(fw[dataset.forward.index_map[`${prevSurah}:${prevAyah}`]].is_end === true, `is_end missing for surah end at ${prevSurah}:${prevAyah}`);
        }
        prevSurah = loc.surah;
        prevAyah = loc.ayah;
    }
    console.log("✓ Continuity checks passed.");

    // 2. Validate page totals and end markers
    console.log("Validating total Pages and Markers...");
    let maxPage = 0;
    let computedEndingFlags = 0;
    for (let loc of fw) {
        if (loc.page > maxPage) maxPage = loc.page;
        if (loc.is_page_end) computedEndingFlags++;
    }
    assert(maxPage >= 604 && maxPage <= 610, `Expected around 604 pages, got ${maxPage}`);
    assert(computedEndingFlags === maxPage, `Expected ${maxPage} page end flags, got ${computedEndingFlags}`);
    console.log("✓ Page validation passed.");

    // 3. Validate symmetry across forward and reverse directions
    console.log("Validating symmetry across forward and reverse directions...");
    assert(fw.length === rev.length, `Length mismatch: fwd=${fw.length}, rev=${rev.length}`);
    
    // Check lengths and items
    // (Notice: we sorted the reverse array by surah DESC and ayah ASC)
    const midPointFwd = fw[3000];
    const mapRevIdx = dataset.reverse.index_map[`${midPointFwd.surah}:${midPointFwd.ayah}`];
    const midPointRev = rev[mapRevIdx];
    
    assert(midPointFwd.surah === midPointRev.surah && midPointFwd.ayah === midPointRev.ayah, 'Symmetry lookup failed');
    console.log("✓ Symmetry validation passed.");
    
    console.log("All Dataset Validation tests passed! ✨");
}

if (require.main === module) {
    runTests().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
