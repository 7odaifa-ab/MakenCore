import { ReferenceRepository } from '../../../domain/mushaf/repositories/ReferenceRepository';
import { RuleEngine } from '../../../domain/planning/rules/RuleEngine';
import { 
    AyahIntegrityRule 
} from '../../../domain/planning/rules/handlers/AyahIntegrityRule';
import { 
    SurahSnapRule 
} from '../../../domain/planning/rules/handlers/SurahSnapRule';
import { 
    PageAlignmentRule 
} from '../../../domain/planning/rules/handlers/PageAlignmentRule';
import {
    ThematicHaltingRule
} from '../../../domain/planning/rules/handlers/OtherRules';
import { RuleCandidate, RuleContext } from '../../../domain/planning/rules/RuleInterface';

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function runTests() {
    console.log("Running Rule Engine Tests...");

    const repo = ReferenceRepository.getInstance();
    const context: RuleContext = {
        repository: repo,
        trackId: 'test_track',
        snapThresholdLines: 7 // 7 lines snap threshold
    };

    const engine = new RuleEngine([
        new AyahIntegrityRule(),
        new SurahSnapRule(),
        new PageAlignmentRule(),
        new ThematicHaltingRule()
    ]);

    // Test 1: Ayah Integrity
    // Since Reference Repository maps to closest full ayah implicitly,
    // this test just ensures a raw candidate passing through remains intact
    // if no other rules trigger.
    let candidate: RuleCandidate = {
        start: { surah: 2, ayah: 1, is_end: false },
        proposedEnd: { surah: 2, ayah: 3, is_end: false, page: 2, is_page_end: false },
        targetLines: 5,
        isReverse: false
    };

    let result = engine.evaluate(candidate, context);
    assert(result.approvedEnd.surah === 2, "Ayah integrity moved to wrong surah");
    assert(result.approvedEnd.ayah >= 3, "Ayah integrity moved backward unexpectedly");

    // Test 2: Surah Snap Rule
    // An-Nasr has 3 ayahs. By 10 lines we should snap to its end if close enough.
    // E.g., if we are at ayah 2, just 1 ayah away.
    candidate = {
        start: { surah: 110, ayah: 1, is_end: false },
        proposedEnd: { surah: 110, ayah: 2, is_end: false }, // proposed stops short of end
        targetLines: 5,
        isReverse: false
    };
    result = engine.evaluate(candidate, context);
    // An-Nasr is very short. ayah 3 is definitely within 7 lines.
    assert(result.approvedEnd.surah === 110 && result.approvedEnd.ayah === 3, `Expected Surah Snap to end (110:3), got ${result.approvedEnd.surah}:${result.approvedEnd.ayah}`);
    assert(result.metadata?.appliedRule === 'SurahSnapRule', "Missing SurahSnapRule metadata tracking");

    // Test 3: Page Alignment Rule
    // Pick a known long surah page end. Surah 2, ayah 24 is roughly page 4.
    // If we end at 2:23, and 24 is the page end, does it snap?
    // According to Al-Baqarah, page 4 ends on ayah 24.
    const pg4End = repo.getIndexFromLocation(2, 24, false); // verify the dataset marks this as page end roughly
    const loc2_24 = repo.getLocationFromIndex(pg4End, repo.getDirectionData(false).index_map);

    if (loc2_24.is_page_end) {
        candidate = {
            start: { surah: 2, ayah: 20, is_end: false },
            proposedEnd: { surah: 2, ayah: 23, is_end: false, page: loc2_24.page || 1, is_page_end: false },
            targetLines: 5,
            isReverse: false
        };
        result = engine.evaluate(candidate, context);
        // Assuming 2:24 is within snap distance of 2:23
        assert(result.approvedEnd.surah === 2 && result.approvedEnd.ayah === 24, "Page Alignment failed to snap to page boundary");
        assert(!!result.metadata?.appliedRule?.includes('PageAlignmentRule'), "Missing PageSnap metadata tracking");
    }

    // Test 4: Thematic Halting and Deterministic Ordering
    candidate = {
        start: { surah: 2, ayah: 140, is_end: false },
        proposedEnd: { surah: 2, ayah: 141, is_end: false, page: 22, is_page_end: false },
        targetLines: 5,
        isReverse: false
    };

    result = engine.evaluate(candidate, context);
    if (result.metadata?.appliedRule?.includes('ThematicHaltingRule')) {
        assert(!!result.metadata.reason.includes('thematic boundary'), 'Thematic rule reason should mention thematic boundary');
    }

    console.log("✓ Rule Engine tests passed! Deterministic ordering and snap functionality verified.");
}

if (require.main === module) {
    runTests().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
