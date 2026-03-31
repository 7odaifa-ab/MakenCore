# Prisma Schema Draft — Quran Planning Engine

## Purpose
Draft the persistence model needed for the next generation planning engine.

This is a starting point for implementation and may evolve as the API and domain rules mature.

---

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum PlanDirection {
  FORWARD
  REVERSE
}

enum PlanStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum TrackType {
  HIFZ
  MINOR_REVIEW
  MAJOR_REVIEW
  STABILIZATION
  CUSTOM
}

enum EventType {
  MEMORIZATION
  REVIEW
  BREAK
  CATCH_UP
}

enum DayType {
  WORKING
  OFF
  CATCH_UP
}

model Plan {
  id              String       @id @default(cuid())
  name            String
  status          PlanStatus   @default(DRAFT)
  direction       PlanDirection
  startDate       DateTime
  endDate         DateTime?
  daysPerWeek     Int
  catchUpDay      Int?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  presetId        String?
  preset          PlanPreset?  @relation(fields: [presetId], references: [id])

  tracks          PlanTrack[]
  days            PlanDay[]

  @@index([status])
  @@index([direction])
}

model PlanPreset {
  id          String      @id @default(cuid())
  name        String      @unique
  description String?
  config      Json
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  plans       Plan[]
}

model PlanTrack {
  id                String      @id @default(cuid())
  planId            String
  plan              Plan        @relation(fields: [planId], references: [id], onDelete: Cascade)
  type              TrackType
  priority          Int
  enabled           Boolean     @default(true)
  sourceTrackId     String?
  amountUnit        String
  amountValue       Decimal     @db.Decimal(10, 2)
  startSurah        Int?
  startAyah         Int?
  endSurah          Int?
  endAyah           Int?
  config            Json?
  balancingWeight   Decimal     @db.Decimal(10, 2) @default(1.0)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  events            PlanEvent[]

  @@index([planId])
  @@index([type])
}

model PlanDay {
  id            String      @id @default(cuid())
  planId        String
  plan          Plan        @relation(fields: [planId], references: [id], onDelete: Cascade)
  dayNumber     Int
  date          DateTime
  hijriDate     String?
  dayType       DayType     @default(WORKING)
  totalLoad     Decimal     @db.Decimal(10, 2) @default(0)
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  events        PlanEvent[]

  @@unique([planId, dayNumber])
  @@unique([planId, date])
  @@index([dayType])
}

model PlanEvent {
  id            String      @id @default(cuid())
  planDayId     String
  planDay       PlanDay     @relation(fields: [planDayId], references: [id], onDelete: Cascade)
  planTrackId   String
  planTrack     PlanTrack   @relation(fields: [planTrackId], references: [id], onDelete: Cascade)
  eventType     EventType
  startSurah    Int
  startAyah     Int
  endSurah      Int
  endAyah       Int
  startPage     Int?
  endPage       Int?
  linesCount    Decimal     @db.Decimal(10, 2)
  appliedRules  Json?
  metadata      Json?
  createdAt     DateTime    @default(now())

  @@index([planDayId])
  @@index([planTrackId])
  @@index([eventType])
}

model MushafReference {
  id            String   @id @default(cuid())
  ayahId        Int      @unique
  surahNumber   Int
  ayahNumber    Int
  pageNumber    Int
  lineStart     Int
  lineEnd       Int
  linesCount    Decimal  @db.Decimal(10, 2)
  isPageEnd     Boolean  @default(false)
  isSurahEnd    Boolean  @default(false)
  thematicBreak String   @default("NONE")
  direction     String   @default("FORWARD")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([surahNumber, ayahNumber])
  @@index([pageNumber])
}

model ShareCode {
  id          String   @id @default(cuid())
  planId      String   @unique
  plan        Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  code        String   @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
}

model PlanFolder {
  id          String   @id @default(cuid())
  name        String
  ownerId     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  plans       Plan[]
}
```

---

## Draft Notes

- `MushafReference` should likely be seeded from the canonical dataset artifact, not hand-authored.
- `amountUnit` should later be normalized into an enum if the product standardizes units.
- `PlanFolder` and `ShareCode` are future SaaS-ready additions and may be deferred if the first backend release is engine-only.
