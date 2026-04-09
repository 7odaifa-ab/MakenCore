import * as ExcelJS from 'exceljs';
import { PlanDay, LocationObj, PlanEvent } from '../../../core/types';
import { QuranRepository } from '../../../core/QuranRepository';
import { TrackId } from '../../../core/constants'; 

export interface ExportOptions {
    fileName?: string;
    includeTeacherReview?: boolean;
}

export class ExcelExportAdapter {
    private quranRepo: QuranRepository;

    constructor() {
        this.quranRepo = QuranRepository.getInstance();
    }

    private formatLocation(loc: LocationObj): string {
        const name = this.quranRepo.getSurahName(loc.surah);
        return `${name} (${loc.ayah})`;
    }

    public async generateBuffer(plan: PlanDay[], options?: ExportOptions): Promise<Buffer> {
        const workbook = this.createWorkbook(plan, options);
        return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    }

    public async export(plan: PlanDay[], options?: ExportOptions): Promise<void> {
        const workbook = this.createWorkbook(plan, options);
        const file = options?.fileName || 'QuranPlan.xlsx';
        await workbook.xlsx.writeFile(file);
    }

    private createWorkbook(plan: PlanDay[], options?: ExportOptions): ExcelJS.Workbook {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Quran Planning Engine';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('الخطة الدراسية', {
            views: [{ rightToLeft: true }]
        });

        // Dynamic Columns based on present tracks in the plan
        const allTrackIds = new Set<string | number>();
        for (const day of plan) {
            for (const event of day.events) {
                allTrackIds.add(event.trackId);
            }
        }

        const columns = [
            { header: 'اليوم', key: 'dayNum', width: 8 },
            { header: 'التاريخ', key: 'date', width: 15 },
            { header: 'اليوم', key: 'dayName', width: 10 }
        ];

        // Track Name mapping
        const trackNames: Record<string | number, string> = {
            [TrackId.HIFZ]: 'الحفظ الجديد',
            [TrackId.MINOR_REVIEW]: 'مراجعة صغرى',
            [TrackId.MAJOR_REVIEW]: 'مراجعة كبرى'
        };

        const activeTrackOrder = Array.from(allTrackIds).sort();
        for (const trackId of activeTrackOrder) {
            columns.push({
                header: trackNames[trackId] || trackId.toString(),
                key: trackId.toString(),
                width: 35
            });
        }

        if (options?.includeTeacherReview) {
            columns.push({ header: 'ملاحظات المعلم', key: 'teacherReview', width: 30 });
            columns.push({ header: 'الدرجة', key: 'grade', width: 10 });
        }

        worksheet.columns = columns;

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E86C1' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 30;

        const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        for (const day of plan) {
            const rowData: Record<string, any> = {
                dayNum: day.dayNum,
                date: day.date.toISOString().split('T')[0],
                dayName: daysAr[day.date.getDay()]
            };

            for (const trackId of activeTrackOrder) {
                const event = day.events.find(e => e.trackId === trackId);
                const stringTrackId = trackId.toString();
                if (event) {
                    const status = event.data.is_reset ? ' 🔄' : '';
                    rowData[stringTrackId] = `${this.formatLocation(event.data.start)} ⬅️ ${this.formatLocation(event.data.end)}${status}`;
                } else {
                    rowData[stringTrackId] = '';
                }
            }

            if (options?.includeTeacherReview) {
                rowData.teacherReview = '';
                rowData.grade = '';
            }

            const row = worksheet.addRow(rowData);
            row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

            // Grouping color shade
            if (day.dayNum % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F4' } };
            }
            // Warning resets
            for (const trackId of activeTrackOrder) {
                const stringTrackId = trackId.toString();
                if (rowData[stringTrackId] && rowData[stringTrackId].includes('🔄')) {
                    const colIndex = columns.findIndex(c => c.key === stringTrackId) + 1;
                    const cell = row.getCell(colIndex);
                    cell.font = { color: { argb: 'FFC0392B' }, bold: true };
                }
            }
        }

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        return workbook;
    }
}
