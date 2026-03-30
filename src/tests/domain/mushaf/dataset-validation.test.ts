import {
    INDEX_MAP_FORWARD,
    INDEX_MAP_REVERSE,
    REVERSE_INDEX_FORWARD,
    REVERSE_INDEX_REVERSE,
} from '../../../data/CanonicalQuranData';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

async function runTests() {
    console.log("Starting Dataset Validation Tests...");
    const fw = REVERSE_INDEX_FORWARD;
    const rev = REVERSE_INDEX_REVERSE;

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
            assert(fw[INDEX_MAP_FORWARD[`${prevSurah}:${prevAyah}`]].is_end === true, `is_end missing for surah end at ${prevSurah}:${prevAyah}`);
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
    const mapRevIdx = INDEX_MAP_REVERSE[`${midPointFwd.surah}:${midPointFwd.ayah}`];
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
