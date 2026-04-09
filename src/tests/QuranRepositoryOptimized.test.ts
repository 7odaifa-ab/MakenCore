import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QuranRepositoryOptimized } from '../core/QuranRepositoryOptimized';

describe('QuranRepositoryOptimized', () => {
    let repo: QuranRepositoryOptimized;

    beforeEach(() => {
        repo = QuranRepositoryOptimized.getInstance();
    });

    afterEach(() => {
        repo.unloadData();
    });

    describe('Lazy Loading', () => {
        it('should load data lazily on first access', () => {
            const metricsBefore = repo.getMetrics();
            expect(metricsBefore.isLoaded).toBe(false);
            expect(metricsBefore.memoryUsage).toBe(0);

            // Trigger data load
            repo.getSurahName(1);

            const metricsAfter = repo.getMetrics();
            expect(metricsAfter.memoryUsage).toBeGreaterThan(0);
            expect(metricsAfter.isLoaded).toBe(true);
        });

        it('should not reload data multiple times', () => {
            repo.getSurahName(1);
            const metricsFirst = repo.getMetrics();

            repo.getSurahName(2);
            const metricsSecond = repo.getMetrics();

            expect(metricsFirst.memoryUsage).toBe(metricsSecond.memoryUsage);
        });
    });

    describe('Basic Operations', () => {
        it('should get surah names correctly', () => {
            expect(repo.getSurahName(1)).toBe('الفَاتِحة');
            expect(repo.getSurahName(2)).toBe('البَقَرَة');
            expect(repo.getSurahName(114)).toBe('النَّاس');
        });

        it('should get ayah counts correctly', () => {
            expect(repo.getAyahCount(1)).toBe(7);
            expect(repo.getAyahCount(2)).toBe(286);
            expect(repo.getAyahCount(114)).toBe(6);
        });

        it('should handle invalid surah numbers', () => {
            expect(repo.getSurahName(0)).toBe('Surah 0');
            expect(repo.getSurahName(115)).toBe('Surah 115');
            expect(repo.getAyahCount(0)).toBe(0);
        });
    });

    describe('Location Operations', () => {
        it('should convert between locations and indices', () => {
            const index = repo.getIndexFromLocation(1, 1, false);
            expect(index).toBe(0);

            const location = repo.getLocationFromIndex(index, repo.getDirectionData(false).index_map);
            expect(location.surah).toBe(1);
            expect(location.ayah).toBe(1);
        });

        it('should calculate lines between locations', () => {
            const lines = repo.getLinesBetween(
                { surah: 1, ayah: 1 },
                { surah: 1, ayah: 7 },
                false
            );
            expect(lines).toBeGreaterThan(0);
        });

        it('should move location forward', () => {
            const newLocation = repo.moveLocation(
                { surah: 1, ayah: 1 },
                5, // 5 lines
                false
            );
            expect(newLocation.surah).toBeGreaterThanOrEqual(1);
            expect(newLocation.ayah).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Performance', () => {
        it('should have reasonable memory usage', () => {
            repo.getSurahName(1); // Trigger load
            const metrics = repo.getMetrics();
            
            // Should be less than 10MB for optimized binary format
            expect(metrics.memoryUsage).toBeLessThan(10 * 1024 * 1024);
        });

        it('should handle bulk operations efficiently', () => {
            const startTime = Date.now();
            
            // Test bulk lookups
            for (let i = 1; i <= 114; i++) {
                repo.getSurahName(i);
                repo.getAyahCount(i);
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete within 100ms for 114 operations
            expect(duration).toBeLessThan(100);
        });
    });

    describe('Data Integrity', () => {
        it('should maintain data consistency across directions', () => {
            const forwardData = repo.getDirectionData(false);
            const reverseData = repo.getDirectionData(true);

            expect(forwardData.cumulative_array.length).toBe(reverseData.cumulative_array.length);
            expect(forwardData.index_map.size).toBe(reverseData.index_map.size);
        });

        it('should handle edge cases correctly', () => {
            // Test first and last ayahs
            expect(repo.getIndexFromLocation(1, 1, false)).toBe(0);
            expect(repo.getIndexFromLocation(114, 6, false)).toBe(6235);
        });
    });

    describe('Memory Management', () => {
        it('should unload data properly', () => {
            repo.getSurahName(1); // Load data
            expect(repo.getMetrics().memoryUsage).toBeGreaterThan(0);

            repo.unloadData();
            expect(repo.getMetrics().memoryUsage).toBe(0);
        });
    });
});
