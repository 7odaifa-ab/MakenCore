export interface GeneratePreviewRequestDTO {
    tracks: TrackConfigDTO[];
    startDate: string;
    workingDays: number[];
    maxDaysToSimulate: number;
}

export interface TrackConfigDTO {
    trackType: string;
    startPoint: LocationDTO;
    endPoint?: LocationDTO;
    dailyLines: number;
    priority?: number;
    color?: string;
}

export interface LocationDTO {
    surahId: number;
    ayahId: number;
}

export interface GeneratePreviewResponseDTO {
    planDays: PlanDayDTO[];
    summary: PlanSummaryDTO;
    errors?: string[];
    warnings?: string[];
}

export interface PlanDayDTO {
    dayNum: number;
    date: string;
    events: PlanEventDTO[];
}

export interface PlanEventDTO {
    trackId: string;
    trackName: string;
    start: LocationDTO;
    end: LocationDTO;
    metadata?: any;
}

export interface PlanSummaryDTO {
    totalDays: number;
    tracksSummary: Record<string, TrackSummaryDTO>;
}

export interface TrackSummaryDTO {
    completedLines: number;
    estimatedCompletionDate?: string;
}

export interface FinalizePlanRequestDTO {
    previewId: string; // ID from preview generation
    title: string;
    folderId?: string;
}

export interface FinalizePlanResponseDTO {
    planId: string;
    shareCode?: string;
    success: boolean;
}

export interface EstimateCompletionRequestDTO {
    trackConfig: TrackConfigDTO;
}

export interface EstimateCompletionResponseDTO {
    estimatedDays: number;
    endLocation: LocationDTO;
}

export interface ExportRequestDTO {
    planId: string;
    format: 'excel' | 'pdf';
    includeTeachersNotes?: boolean;
}

export interface DatasetValidationDTO {
    version: string;
    mushafType: string;
}

export interface DatasetValidationResponseDTO {
    isValid: boolean;
    errors: string[];
    surahCount: number;
    totalAyahs: number;
}
