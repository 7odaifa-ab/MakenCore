/**
 * -------------------------------------------------------------
 * MakenCore - Quran Planning Engine
 * Core Engine Entry Point for NPM Consuming Applications
 * ------------------------------------------------------------- 
 */

// 1. Export Pure Domain Utilities & Entities
export { QuranRepository } from './core/QuranRepository';
export { TrackManager } from './core/TrackManager';
export { PlanBuilder } from './builders/PlanBuilder';

// 2. Export Types & Enums
export * from './core/types';
export { TrackId, WindowMode } from './core/constants';
export * from './errors';

// 3. Export API Application Boundary (DTO Contracts)
export * from './infrastructure/api/contracts';

// 4. Export Primary Execution Facade
export { EngineFacade as MakenEngine } from './infrastructure/api/EngineFacade';
