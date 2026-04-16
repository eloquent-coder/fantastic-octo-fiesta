# Invoice Ledger - Walking Skeleton

## Project Overview
A self-contained walking skeleton of an "Invoice Ledger" feature demonstrating clean architecture, idempotency, and zero hidden side effects. This is a technical assessment.

## Tech Stack
- **Data Layer**: dbt-duckdb (DuckDB as local warehouse)
- **Backend**: FastAPI + Pydantic (strict data contracts, versioned API)
- **Frontend**: React + TypeScript (strict type safety mirroring backend contracts)
- **Orchestration**: Docker Compose (fully self-contained)

## Architecture Principles (NON-NEGOTIABLE)
These are the evaluator's explicit criteria. Every decision must trace back to one of these:

1. **Three-layer dbt structure** — Staging (clean/rename only, NO business logic), Intermediate (joins, deduplication, business rules), Marts (query-ready, stable output contract)
2. **Rigid backend contract** — Pydantic models define the API contract. The FastAPI endpoint is versioned (`/api/v1/`). The backend reads from the mart — it never transforms data.
3. **Frontend mirrors backend** — TypeScript types must map 1:1 to the Pydantic response schema. The React layer is pure presentation — no business logic, no data reshaping.
4. **Separation of concerns** — Logic lives in the RIGHT layer. dbt owns transformations. FastAPI owns the contract. React owns presentation.
5. **Idempotency** — dbt models use `ref()` and are table/view materializations (re-runnable). API is read-only GET (naturally idempotent). No hidden side effects anywhere.
6. **Code for the next engineer** — Every boundary decision should be obvious from the code structure. Prefer clarity over cleverness.

## Folder Structure
```
noah-assessment/
├── CLAUDE.md
├── README.md
├── docker-compose.yml
├── dbt_project/             # dbt project root
│   ├── dbt_project.yml
│   ├── profiles.yml         # Checked in for portability (overridden via DBT_PROFILES_DIR in Docker)
│   ├── seeds/               # Raw mock CSV data — dbt's built-in seeding mechanism
│   ├── models/
│   │   ├── staging/         # 1:1 source cleaning only
│   │   │   └── _schema.yml  # Source definitions + schema tests
│   │   ├── intermediate/    # Business logic, joins, deduplication
│   │   │   └── _schema.yml
│   │   └── marts/           # Stable query-ready output
│   │       └── _schema.yml  # Contract tests (not_null, unique, accepted_values)
│   └── tests/               # Custom singular data tests
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py          # FastAPI app + versioned router mount
│   │   ├── api/v1/
│   │   │   └── invoices.py  # GET /api/v1/invoices endpoint
│   │   ├── models/
│   │   │   └── invoice.py   # Pydantic schemas (THE contract)
│   │   └── db.py            # DuckDB read-only connection to mart
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── index.html           # Vite entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── types/           # TypeScript interfaces mirroring Pydantic models
│       ├── api/             # API client (fetch from /api/v1/)
│       └── components/      # Invoice list presentation components
└── scripts/
    └── entrypoint.sh        # Docker entrypoint: runs dbt seed + dbt build, then starts API
```

## Code Style & Conventions
- Python: snake_case, type hints everywhere, Pydantic `model_validator` over ad-hoc validation
- TypeScript: strict mode, interfaces over types for API contracts, no `any`
- dbt: one model per file, descriptive model names (`stg_invoices`, `int_invoices_enriched`, `mart_invoice_ledger`)
- SQL: lowercase keywords, CTEs over subqueries, explicit column lists (no `SELECT *`)
- All environment config via environment variables, never hardcoded

## What NOT To Do
- Do NOT put business logic in staging models — staging only cleans and renames
- Do NOT reshape or compute data in the backend — it reads the mart as-is
- Do NOT put business logic or data transformations in React components
- Do NOT use ORMs — DuckDB is read directly for simplicity
- Do NOT over-engineer — this is a walking skeleton, not a production system
- Do NOT add auth, caching, or pagination unless the core flow works first

## Development Workflow
1. Generate mock data (seed CSVs)
2. Build dbt models bottom-up: staging -> intermediate -> marts
3. Run `dbt build` to validate the pipeline
4. Build FastAPI endpoint reading from the mart
5. Build React component consuming the endpoint
6. Wire everything with Docker Compose
7. Write README explaining architectural decisions

## Testing Strategy
- dbt: schema tests (not_null, unique, accepted_values) + a custom data test
- Backend: test that Pydantic model validates against actual mart output
- Frontend: type-check is the test (strict TS compilation)
