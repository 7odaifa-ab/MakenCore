export enum TrackType {
    MEMORIZATION = 'MEMORIZATION',
    NEAR_REVIEW = 'NEAR_REVIEW',
    FAR_REVIEW = 'FAR_REVIEW'
}

export enum PlanDirection {
    FORWARD = 'FORWARD',   // Fatiha to Nas
    REVERSE = 'REVERSE'    // Nas to Fatiha
}

export interface DailyLoadWeights {
    memorizationWeight: number; // e.g., 2.0
    nearReviewWeight: number;   // e.g., 1.0
    farReviewWeight: number;    // e.g., 0.5
    maxDailyLoad: number;       // e.g., 10 "units" of effort
}

export interface TrackDefinition {
    id: number;
    name: string;
    type: TrackType;
    dailyTargetLines: number;
    // For review dependencies, indicating which track it follows
    dependsOnTrackId?: number; 
    // Specific horizon: near review might be last 10 pages (~150 lines)
    reviewHorizonLines?: number;
}

export interface PlanDefinition {
    id: string;
    studentId: string;
    startDate: Date;
    direction: PlanDirection;
    
    // Day Configuration
    daysPerWeek: number;
    catchUpDaysPerWeek: number; // e.g., 1 specific day just for review/catch-up
    catchUpDayOfWeek?: number;  // 0=Sun, 1=Mon, ..., 6=Sat
    holidays: Date[];           // Custom off days
    
    tracks: TrackDefinition[];
    loadWeights?: DailyLoadWeights;
}
