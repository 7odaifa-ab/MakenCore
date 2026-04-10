# MakenCore

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/7odaifa-ab/MakenCore)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![English](https://img.shields.io/badge/lang-English-green)](./README.md)
[![Zakhm](https://img.shields.io/badge/بواسطة-Zakhm-9cf)](https://zakhm.com)

> محرك تخطيط قطعي مكتوب بلغة TypeScript لتوليد خطط حفظ ومراجعة القرآن الكريم.

يُنتج MakenCore خططاً يومية توازن بين **الحفظ الجديد**، **المراجعة الصغرى** (المواد الحديثة)، و**المراجعة الكبرى** (مراجعة الدورة الكاملة). مصمم كمكتبة مستقلة للدمج في الأنظمة الخلفية (NestJS, Express, إلخ).

---

## البداية السريعة

### التثبيت

```bash
npm install maken-core
```

### مثال بسيط

```typescript
import { MakenEngine } from 'maken-core';

const result = MakenEngine.generatePlan({
    name: "حفظ 30 يوماً",
    direction: "FORWARD",
    daysPerWeek: 5,
    tracks: [{
        type: "HIFZ",
        priority: 1,
        amountUnit: "LINES",
        amountValue: 10,
        start: { surah: 1, ayah: 1 }
    }],
    startDate: "2026-04-01"
});

if (result.success) {
    console.log(`الخطة: ${result.data.totalDays} يوماً`);
    console.log(result.data.plan); // مصفوفة الأحداث اليومية
}
```

### نمط البناء (متقدم)

```typescript
import { PlanBuilder, WindowMode } from 'maken-core';

const manager = new PlanBuilder()
    .setSchedule({
        startDate: "2026-04-01",
        daysPerWeek: 6,
        isReverse: false,
        maxAyahPerDay: 8
    })
    .planByDailyAmount({
        from: { surah: 2, ayah: 1 },
        to: { surah: 2, ayah: 286 },
        dailyLines: 12
    })
    .addMinorReview(5, WindowMode.GRADUAL)
    .stopWhenCompleted()
    .build();

const days = manager.generatePlan();
```

---

## القدرات الجوهرية

| الميزة | الوصف |
|--------|-------|
| **جدولة متعددة المسارات** | حفظ (جديد)، مراجعة صغرى (حديث)، مراجعة كبرى (دورة كاملة) |
| **فهرسة قرآنية دقيقة** | حسابات التجمع التراكمي (prefix-sum) لأي مدى |
| **قواعد تربوية** | سلامة الآيات، استمرارية السور، أيام التقوية |
| **أوضاع التخطيط** | بالمدة ("أنهِ في X يوماً") أو بالمقدار اليومي ("Y سطر/يوم") |
| **تصميم مكتبة أولاً** | TypeScript نقية، بدون تبعيات، مخرجات قطعية |

---

## الإعدادات

### خيارات الجدولة

```typescript
.setSchedule({
    startDate: "2026-04-01",      // تاريخ ISO
    daysPerWeek: 5,                // 1-7
    isReverse: false,              // false = الفاتحة → الناس
    maxAyahPerDay: 10,             // الحد الأقصى (5-20)
    sequentialSurahMode: true,     // إكمال السورة قبل التالية
    strictSequentialMode: false,   // عدم الانتقال حتى 100% إكمال
    consolidationDayInterval: 6,   // كل N يوم = مراجعة فقط
    surahBoundedMinorReview: false, // المراجعة الصغرى ضمن السورة الحالية
    minorReviewPagesCount: 5       // عدد الصفحات للمراجعة (15 سطر = صفحة)
})
```

| الخيار | النوع | الافتراضي | الوصف |
|--------|-------|-----------|-------|
| `startDate` | string | مطلوب | تاريخ بدء الخطة (YYYY-MM-DD) |
| `daysPerWeek` | number | مطلوب | أيام الدراسة في الأسبوع |
| `isReverse` | boolean | false | الاتجاه: true = الناس → الفاتحة |
| `maxAyahPerDay` | number | 10 | الحد الأقصى للحفظ اليومي |
| `sequentialSurahMode` | boolean | true | إكمال السورة قبل البدء بالتالية |
| `strictSequentialMode` | boolean | false | عدم تغيير السورة حتى 100% إكمال |
| `consolidationDayInterval` | number | 6 | فاصل أيام المراجعة فقط (0=معطل) |
| `surahBoundedMinorReview` | boolean | false | المراجعة الصغرى ضمن السورة الحالية |
| `minorReviewPagesCount` | number | — | مقدار المراجعة بالصفحات |

---

## أوضاع التخطيط

### 1. التخطيط بالمدة

تُقدم: `from`، `to`، `durationDays`، `daysPerWeek`  
المحرك يُنتج: `dailyLines`، `limitDays`

```typescript
const manager = new PlanBuilder()
    .setSchedule({
        startDate: '2026-02-01',
        daysPerWeek: 5,
        isReverse: true,
        maxAyahPerDay: 5
    })
    .planByDuration({
        from: { surah: 66, ayah: 1 },
        to: { surah: 58, ayah: 8 },
        durationDays: 30
    })
    .addMinorReview(3, WindowMode.GRADUAL)
    .addMajorReview(15 * 5, { surah: 114, ayah: 1 })
    .stopWhenCompleted()
    .build();
```

### 2. التخطيط بالمقدار اليومي

تُقدم: `from`، `to`، `dailyLines`، `daysPerWeek`  
المحرك يُنتج: عدد أيام الدراسة المطلوبة، `limitDays`

```typescript
const manager = new PlanBuilder()
    .setSchedule({
        startDate: '2026-02-01',
        daysPerWeek: 6,
        isReverse: true,
        maxAyahPerDay: 12
    })
    .planByDailyAmount({
        from: { surah: 66, ayah: 1 },
        to: { surah: 55, ayah: 78 },
        dailyLines: 14
    })
    .addMinorReview(7, WindowMode.GRADUAL)
    .addMajorReview(15 * 10, { surah: 114, ayah: 1 })
    .stopWhenCompleted()
    .build();
```

---

## المخرجات

يُعيد المحرك إدخالات الخطة اليومية مع تصنيفات الأحداث:

| نوع الحدث | الوصف |
|-----------|-------|
| `MEMORIZATION` | المادة الجديدة للحفظ |
| `REVIEW` | أحداث المراجعة المجدولة |
| `CATCH_UP` | أحداث التجاوز/التعديل |
| `BREAK` | أيام الراحة/التقوية |

```typescript
if (result.success) {
    const planDays = result.data.plan;
    // احفظ في قاعدة البيانات (Prisma, إلخ)
}
```

---

## التوثيق

| المستند | الغرض |
|---------|-------|
| [عقود الربط البرمجي](doc/planning-engine/planning-engine-api-contracts.md) | عقود التكامل مع TypeScript |
| [أوضاع التخطيط والمراحل](doc/planning-engine/planning-modes-and-phases.md) | مراحل التنفيذ والمعالم |
| [دليل القواعد التربوية](doc/planning-engine/pedagogical-rules-guide.md) | سلوك القواعد والإعدادات |
| [وثيقة المتطلبات (PRD)](doc/planning-engine/planning-engine-prd.md) | تفاصيل المنتج والمعمارية |

---

## الاختبارات

```bash
npm install
npm run test:vitest
```

**إجمالي الاختبارات الآلية:** 37/37 (ناجحة بنسبة 100%).

---

## ملاحظات لمستخدمي المكتبة

- مشغلات السيناريوهات وبرامج Excel في `/src` للاختبار الداخلي فقط
- للإنتاج: استخدم `planDays` وقم بالحفظ في تطبيقك المضيف
- التفاصيل التقنية الكاملة في مجلد `/doc`

---

<div align="center">

## صُنع بـ 💜 واسطة Zakhm

<table>
<tr>
<td width="100" align="center">
<img src="https://github.com/user-attachments/assets/9223eb9d-920c-4ae6-8fb5-8ab3883ee105" alt="شعار زخم" width="80" height="80" style="border-radius: 12px;">
</td>
<td>

**[Zakhm](https://zakhm.com)** — نُمكّن التعليم الإسلامي من خلال التقنية.

نؤمن بأن الأدوات الممتازة يجب أن تكون متاحة للجميع. استخدم MakenCore بحرية، وفكّر بالمساهمة لمساعدة المجتمع على النمو.

📄 مرخص بموجب [رخصة Zakhm Attribution (ZAL) 1.0](./LICENSE)

</td>
</tr>
</table>

</div>
