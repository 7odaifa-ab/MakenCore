# Proposed Folder Structure — Planning Engine Backend

## Goal
Provide a backend-ready structure that separates domain logic, application use cases, infrastructure, and interface contracts.

---

## Recommended Structure

```text
src/
├── app/
│   ├── use-cases/
│   │   ├── create-plan-definition.ts
│   │   ├── generate-plan-preview.ts
│   │   ├── generate-final-plan.ts
│   │   ├── estimate-completion-date.ts
│   │   └── export-plan.ts
│   ├── dtos/
│   └── validators/
│
├── domain/
│   ├── mushaf/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── rules/
│   ├── planning/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── services/
│   │   └── policies/
│   ├── tracks/
│   ├── balancing/
│   └── constraints/
│
├── infrastructure/
│   ├── dataset/
│   │   ├── importers/
│   │   ├── generators/
│   │   └── fixtures/
│   ├── persistence/
│   │   ├── prisma/
│   │   ├── repositories/
│   │   └── mappers/
│   ├── exporters/
│   │   ├── excel/
│   │   └── pdf/
│   └── config/
│
├── interfaces/
│   ├── api/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── schemas/
│   └── cli/
│
└── tests/
    ├── unit/
    ├── integration/
    ├── fixtures/
    └── snapshots/
```

---

## Migration Notes

### Keep and evolve
- `core/QuranRepository.ts`
- `core/TrackManager.ts`
- `builders/PlanBuilder.ts`
- `tracks/*`
- `strategies/*`
- `constraints/*`
- `utils/PlanExporter.ts`

### Refactor toward
- domain entities
- use-case services
- infrastructure adapters
- export adapters
- persistence repositories

---

## Notes

- Domain logic should not depend on Prisma directly
- Exporters should not know database details
- API controllers should call use cases only
- Dataset generation should happen in infrastructure, not domain
