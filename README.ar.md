# MakenCore — محرك التخطيط القرآني

**MakenCore** هو محرك تخطيط (Scheduling Engine) مستقل، مكتوب بلغة TypeScript، مصمم لتوليد جداول حفظ ومراجعة القرآن الكريم بشكل قطعي ودقيق. المحرك مصمم ليتم استيراده كمكتبة NPM في المنصات البرمجية (مثل NestJS) لتوفير منطق الأعمال الخاص بالتخطيط بشكل معزول.

![MakenCore](https://img.shields.io/badge/Status-Production%20Ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## القدرات الجوهرية (Core Capabilities)
- **التخطيط القطعي:** موازنة الأحمال بين المسارات المتعددة (حفظ، مراجعة صغرى، مراجعة كبرى) وتوليد الأحداث بناءً على القواعد البرمجية.
- **التحقق من البيانات المرجعية:** يعتمد على نظام الفهرسة التراكمية (prefix-sum) بسرعة $O(1)$ باستخدام رواية حفص (الإصدار 18) لضمان دقة الصفحات والفواصل الموضوعية.
- **سلسلة القواعد (Rule Pipeline):** معمارية تضمن سلامة الآيات (Ayah Integrity)، والانجذاب لنهاية السورة، ومحاذاة الصفحات، والوقف الموضوعي.
- **التشغيل عديم الحالة (Stateless):** مدخلات JSON متمثلة في (`CreatePlanPreviewRequestDTO`) ومخرجات JSON متمثلة في (`CreatePlanPreviewResponseDTO`).

## 📖 التوثيق الإرشادي
- **[دليل المستخدم (User Guide)](./USER_GUIDE.md):** تفاصيل منطق الحفظ، مسارات المراجعة، وأيام الاستدراك.
- **[وثيقة المتطلبات الفنية (PRD)](./doc/planning-engine/planning-engine-prd.md):** القواعد الرياضية والمعمارية الهندسية.
- **[عقود الربط البرمجي (API contracts)](./src/infrastructure/api/contracts.ts):** مرجع الـ DTO لعمليات الدمج.

---

## 📦 التثبيت والاستخدام

يُصدر **MakenCore** فئة واحدة أساسية وهي `MakenEngine` بجانب الـ DTOs والأنواع (Types) اللازمة للاستخدام في تطبيقك.

### للدمج عبر API (NestJS, Express, إلخ)
الواجهة الأساسية للتفاعل مع المحرك هي فئة `MakenEngine`.

```typescript
import { 
    MakenEngine, 
    CreatePlanPreviewRequestDTO 
} from 'maken-core';

// 1. بناء طلب الـ DTO
const payload: CreatePlanPreviewRequestDTO = {
    name: "مكثف رمضان",
    direction: "FORWARD", // أو 'REVERSE' للحفظ التنازلي
    daysPerWeek: 5,
    tracks: [
        {
            type: "HIFZ",
            priority: 1,
            amountUnit: "LINES",
            amountValue: 15,
            start: { surah: 1, ayah: 1 }
        }
    ],
    startDate: "2026-03-30"
};

// 2. تنفيذ منطق التخطيط
const result = MakenEngine.generatePlan(payload);

if (result.success) {
    const planDays = result.data.plan;
    console.log(`الخطة تمتد لـ ${result.data.totalDays} يوماً`);
    // قم بتمرير `planDays` إلى خدمة Prisma لحفظها في قاعدة البيانات!
}
```

---

## 🗃️ حدود التطبيق (Application Boundaries)

تم تصميم MakenCore ليفصل بين منطق التخطيط وبين العرض وقواعد البيانات.

### 1. العرض والتصدير
توليد ملفات PDF أو Excel بشكل رسمي هو **خارج نطاق** هذا المحرك لتجنب تضخم حجم الحزمة. يقوم المحرك بإرجاع بيانات JSON خام (`PlanDay[]`). تطبيقك (NestJS أو React) هو المسؤول عن تمرير هذه البيانات إلى مكتبات مثل `pdfkit` أو `exceljs`.

### 2. الحفظ في قاعدة البيانات
يجب على تطبيقك حفظ مخرجات MakenCore. تتوفر مصفوفة [استراتيجية الربط مع Prisma](doc/planning-engine/planning-engine-prisma-schema-draft.md) في مجلد التوثيق لمساعدتك على ربط الأحداث بقاعدة PostgreSQL فوراً.

---

## 🧪 الاختبارات

المحرك مدعوم بمجموعة اختبارات قطعية باستخدام Vitest لتغطية تراجع القواعد، موازنة الأحمال، والتحقق من صحة البيانات.

```bash
npm install
npm run test:vitest
```

**إجمالي الاختبارات الآلية:** 37/37 (ناجحة بنسبة 100%).
