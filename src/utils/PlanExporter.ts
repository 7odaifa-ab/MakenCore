// src/utils/PlanExporter.ts
import * as ExcelJS from 'exceljs';
import { PlanDay, LocationObj, PlanEvent } from '../core/types';
import { QuranRepository } from '../core/QuranRepository';
import { TrackId } from '../core/constants'; // 👈 Enum

/**
 * PlanExporter
 * * Utility for exporting plans to Excel and console.
 * * 🚀 REFACTORED: Adapts to the dynamic 'events' array structure.
 */
export class PlanExporter {
    private quranRepo: QuranRepository;

    constructor() {
        this.quranRepo = QuranRepository.getInstance();
    }

    private formatLocation(loc: LocationObj): string {
        const name = this.quranRepo.getSurahName(loc.surah);
        return `${name} (${loc.ayah})`;
    }
    
    private formatLoc(loc: LocationObj): string {
        return this.formatLocation(loc);
    }

    /**
     * Finds a specific event in the day's event list.
     */
    private findEvent(day: PlanDay, trackId: TrackId): PlanEvent | undefined {
        return day.events.find(e => e.trackId === trackId);
    }

    async exportToExcel(plan: PlanDay[], fileName: string = "QuranPlan.xlsx") {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Quran Planning Engine';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('الخطة الدراسية', {
            views: [{ rightToLeft: true }]
        });

        worksheet.columns = [
            { header: 'اليوم', key: 'dayNum', width: 8 },
            { header: 'التاريخ', key: 'date', width: 15 },
            { header: 'اليوم', key: 'dayName', width: 10 },
            { header: 'الحفظ الجديد', key: 'hifz', width: 35 },
            { header: 'مراجعة صغرى', key: 'minor', width: 35 },
            { header: 'مراجعة كبرى', key: 'major', width: 35 },
        ];

        // Header Styling... (unchanged)
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E86C1' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 30;

        const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        for (const day of plan) {
            const rowData = {
                dayNum: day.dayNum,
                date: day.date.toISOString().split('T')[0],
                dayName: daysAr[day.date.getDay()],
                hifz: '',
                minor: '',
                major: ''
            };

            // 🚀 Dynamic Mapping: Extract events back to columns
            const hifzEvt = this.findEvent(day, TrackId.HIFZ);
            const minorEvt = this.findEvent(day, TrackId.MINOR_REVIEW);
            const majorEvt = this.findEvent(day, TrackId.MAJOR_REVIEW);

            if (hifzEvt) {
                rowData.hifz = `${this.formatLoc(hifzEvt.data.start)} ⬅️ ${this.formatLoc(hifzEvt.data.end)}`;
            }
            if (minorEvt) {
                rowData.minor = `${this.formatLoc(minorEvt.data.start)} ⬅️ ${this.formatLoc(minorEvt.data.end)}`;
            }
            if (majorEvt) {
                const status = majorEvt.data.is_reset ? ' 🔄' : '';
                rowData.major = `${this.formatLoc(majorEvt.data.start)} ⬅️ ${this.formatLoc(majorEvt.data.end)}${status}`;
            }

            const row = worksheet.addRow(rowData);
            row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            
            if (day.dayNum % 2 === 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F4' } };
            }
            if (rowData.major.includes('🔄')) {
                row.getCell('major').font = { color: { argb: 'FFC0392B' }, bold: true };
            }
        }

        // Borders... (unchanged)
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        await workbook.xlsx.writeFile(fileName);
        console.log(`✅ تم تصدير ملف الإكسل بنجاح: ${fileName}`);
    }

    printToConsole(plan: PlanDay[]) {
        console.log("\n");
        console.log("=".repeat(50));
        console.log("   Quran Planning Engine - Daily Plan");
        console.log("=".repeat(50));
        
        const daysAr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        plan.forEach(day => {
            const dayName = daysAr[day.date.getDay()];
            console.log(`\n   Day ${day.dayNum} | ${day.date.toISOString().split('T')[0]} (${dayName})`);
            console.log("   ".repeat(15));
            
            if (day.events.length === 0) {
                console.log("   (Rest day - no tasks)");
            } else {
                day.events.forEach(evt => {
                    let icon = '   ';
                    let trackType = '';
                    
                    if (evt.trackId === TrackId.HIFZ) {
                        icon = '   ';
                        trackType = 'New Memorization';
                    }
                    else if (evt.trackId === TrackId.MINOR_REVIEW) {
                        icon = '   ';
                        trackType = 'Minor Review';
                    }
                    else if (evt.trackId === TrackId.MAJOR_REVIEW) {
                        icon = '   ';
                        trackType = 'Major Review';
                    }

                    const resetStr = evt.data.is_reset ? ' [RESET]' : '';
                    const formattedStart = this.formatLoc(evt.data.start);
                    const formattedEnd = this.formatLoc(evt.data.end);
                    
                    console.log(`   ${icon} ${trackType}: ${formattedStart} -> ${formattedEnd}${resetStr}`);
                });
            }
            console.log("   " + "-".repeat(45));
        });
        
        console.log("\n" + "=".repeat(50));
        console.log("   End of Plan Preview");
        console.log("=".repeat(50));
    }
}