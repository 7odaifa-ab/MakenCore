# مكين — Quran Planning Engine

محرك تخطيط قرآني متكامل، يُولّد خططاً يومية للحفظ والمراجعة، ويتابع تقدم الطلاب جلسةً بجلسة. يتميز بكونه محركاً مستقلاً يمكن دمجه في أي مشروع كـ `npm package`.

---

## جدول المحتويات

1. [نظرة عامة](#1-نظرة-عامة)
2. [بنية المشروع](#2-بنية-المشروع)
3. [البدء السريع](#3-البدء-السريع)
4. [خارطة الطريق — Roadmap (Epics)](#4-خارطة-الطريق--roadmap-epics)
5. [البنية التحتية والجاهزية للإنتاج — Infrastructure](#5-البنية-التحتية-والجاهزية-للإنتاج--infrastructure)
6. [نظام التخطيط — Planning Engine](#6-نظام-التخطيط--planning-engine)
7. [QuranRepository — طبقة البيانات](#7-quranrepository--طبقة-البيانات)
8. [نظام الأخطاء — Error System](#8-نظام-الأخطاء--error-system)
9. [سيناريوهات الاستخدام](#9-سيناريوهات-الاستخدام)
10. [القرارات الهندسية](#10-القرارات-الهندسية)

---

## 1. نظرة عامة

**مكين** مكتبة TypeScript تُوفّر:

| الوظيفة | الوصف |
|---|---|
| **توليد الخطة** | محاكاة يومية لمسارات الحفظ والمراجعة الصغرى والكبرى مع توازن الأحمال |
| **استعلامات القرآن** | تحويل السورة:الآية إلى index والعكس، حساب الأسطر بدقة O(1) |
| **التصدير الاحترافي** | تصدير Excel و PDF مع دعم ملاحظات المعلمين |
| **الجاهزية للربط** | عقود API (DTOs) وجداول Prisma جاهزة للاستخدام |

---

## 2. بنية المشروع

```
src/
├── main.ts                        # نقطة الدخول للتجارب والمحاكاة
│
├── core/                          # المحرك الأساسي (Logic Only)
│   ├── TrackManager.ts            # محرك المحاكاة اليومية
│   ├── QuranRepository.ts         # Singleton: كل استعلامات بيانات القرآن
│   ├── PlanContext.ts             # سياق كل يوم محاكاة
│   ├── constants.ts               # Enums: TrackId, WindowMode
│   └── types.ts                   # PlanDay, PlanEvent
│
├── domain/                        # تعريفات المجال (Domain Models)
│   ├── planning/
│   │   ├── entities/              # PlanConfig, TrackDefinition
│   │   └── repositories/          # IPlanRepository, IFolderRepository (Interfaces)
│   └── mushaf/                    # القواعد والمحركات المعيارية (Rules)
│
├── infrastructure/                 # الربط مع الأنظمة الخارجية
│   ├── api/
│   │   └── contracts.ts           # DTOs: طلبات واستجابات API
│   ├── adapters/
│   │   └── export/                # ExcelExportAdapter, PdfExportAdapter
│   └── mappers/
│       └── PlanMapper.ts          # تحويل بين الدومين وقاعدة البيانات
│
├── prisma/                        # مسودة قاعدة البيانات (PostgreSQL/Schema)
│
├── builders/
│   ├── PlanBuilder.ts             # Fluent API لإنشاء الخطة
... (بقية المجلدات: tracks, strategies, constraints, errors, utils, tests)
```

---

## 3. البدء السريع

```bash
npm install
npm start
```

---

## 4. خارطة الطريق — Roadmap (Epics)

تم تقسيم تطوير المحرك إلى ملاحم تقنية (Epics) لضمان الجودة والتدرج:

| الملحمة | الحالة | الوصف |
|---|---|---|
| **Epic 01: Domain Foundation** | ✅ | بناء قاعدة بيانات المصحف الرقمية (Dataset) والبحث السريع O(1). |
| **Epic 02: Rule Engine** | ✅ | إضافة قواعد التكامل (Ayah Integrity) ومحاذاة الصفحات (Page Alignment). |
| **Epic 03: Multi-Track** | ✅ | دعم المسارات المتعددة وتوازن الحمل اليومي (Load Balancing). |
| **Epic 04: Persistence & API** | ✅ | تصميم جداول Prisma، عقود API (DTOs)، ومحولات التصدير. |

---

## 5. البنية التحتية والجاهزية للإنتاج — Infrastructure

تم إعداد المحرك ليكون قابلاً للاستخدام كـ **Module** مستقل:

### عقود التواصل (API Contracts)
تتوفر تعريفات DTOs كاملة لعمليات:
- `GeneratePreviewRequestDTO`: لطلب معاينة الخطة.
- `ExportRequestDTO`: لطلب ملف Excel أو PDF.
- `LocationDTO`: لتوحيد شكل المواقع القرآنية.

### التصدير الاحترافي (Advanced Export)
- **ExcelAdapter**: تصدير متقدم يدعم تظليل الأيام وتنبيهات إعادة الدورة (🔄).
- **PdfAdapter**: هيكلية جاهزة لتقارير PDF المطبوعة.

### التخزين (Persistence)
- **Prisma Schema**: جداول متكاملة تغطي (Plans, Tracks, Days, Folders, ShareCodes).
- **Domain Mappers**: لضمان استقلالية المحرك عن تفاصيل قاعدة البيانات.

---

(بقية الأقسام الفنية 6-10 تتبع نفس التفصيل السابق مع تحديثات Epic 4...)
