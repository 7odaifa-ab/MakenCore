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

    // 3. Validate thematic metadata integrity and category coverage
    console.log("Validating thematic metadata integrity...");
    const allowedTypes = new Set(['QUARTER', 'HIZB', 'JUZ', 'SAJDAH', 'NONE']);
    const thematicCounts: Record<string, number> = {
        QUARTER: 0,
        HIZB: 0,
        JUZ: 0,
        SAJDAH: 0,
        NONE: 0
    };

    for (const loc of fw as any[]) {
        const type = loc.thematic_break_type ?? 'NONE';
        assert(allowedTypes.has(type), `Invalid thematic break type: ${type}`);

        thematicCounts[type] = (thematicCounts[type] || 0) + 1;

        if (type === 'NONE') {
            assert(loc.thematic_break === false, `thematic_break should be false when type is NONE at ${loc.surah}:${loc.ayah}`);
        } else {
            assert(loc.thematic_break === true, `thematic_break should be true when type is ${type} at ${loc.surah}:${loc.ayah}`);
        }
    }

    assert(thematicCounts.JUZ > 0, 'Expected at least one JUZ thematic boundary');
    assert(thematicCounts.HIZB > 0, 'Expected at least one HIZB thematic boundary');
    console.log("✓ Thematic metadata validation passed.");

    // 4. Validate page total weighted lines are close to 15
    console.log("Validating weighted line totals per page...");
    const pageLineTotals = new Map<number, number>();
    for (const loc of fw as any[]) {
        const lines = Number(loc.lines_count ?? 0);
        pageLineTotals.set(loc.page, (pageLineTotals.get(loc.page) || 0) + lines);
    }

    let minPageLines = Number.POSITIVE_INFINITY;
    let maxPageLines = Number.NEGATIVE_INFINITY;
    let minPageNumber = -1;
    let maxPageNumber = -1;

    for (const [page, total] of pageLineTotals.entries()) {
        if (total < minPageLines) {
            minPageLines = total;
            minPageNumber = page;
        }
        if (total > maxPageLines) {
            maxPageLines = total;
            maxPageNumber = page;
        }

        assert(total >= 6 && total <= 15.5, `Page ${page} expected weighted lines within canonical bounds, got ${total.toFixed(4)}`);
    }

    assert(minPageLines < 10, `Expected at least one short page (<10 weighted lines), got min=${minPageLines.toFixed(4)} at page ${minPageNumber}`);
    assert(maxPageLines >= 14.5, `Expected at least one full page (~15 weighted lines), got max=${maxPageLines.toFixed(4)} at page ${maxPageNumber}`);

    console.log("✓ Page weighted-lines validation passed.");

    // 5. Validate symmetry across forward and reverse directions
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
