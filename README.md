# Invoice Ledger

A self-contained walking skeleton demonstrating clean separation across a data pipeline, an API contract, and a presentation layer. Raw CSVs land in DuckDB via dbt, a FastAPI endpoint reads a query-ready mart, and a React + TypeScript frontend consumes the contract unchanged.

The guiding principle: **each layer owns its own concerns and nothing leaks across the boundaries.** dbt transforms, FastAPI exposes, React renders.

## Stack

| Layer      | Tech                                              | Role                                          |
| ---------- | ------------------------------------------------- | --------------------------------------------- |
| Data       | dbt-duckdb (DuckDB as local warehouse)            | Staging → intermediate → mart                 |
| Backend    | FastAPI + Pydantic                                | Versioned, read-only API over the mart        |
| Frontend   | React 19 + TypeScript (strict) + Vite             | Pure presentation, types mirror Pydantic 1:1  |
| Orchestration | Docker Compose                                 | One command, fully self-contained             |

## Quick start

```bash
docker compose up
```

Then:
- **UI**: http://localhost:5173
- **API**: http://localhost:8000/api/v1/invoices
- **API docs** (Swagger): http://localhost:8000/docs

Safe to run `docker compose up` repeatedly — the dbt container skips the build if the mart already exists. To force a fresh dbt run, wipe the volume first: `docker compose down -v`.

## Architecture

```
┌────────────────────┐
│  seeds/*.csv       │  raw_customers, raw_invoices,
│  (intentionally    │  raw_invoice_line_items, raw_payments
│   messy)           │
└─────────┬──────────┘
          │
          ▼  (dbt-duckdb container, runs once)
┌────────────────────┐
│  staging/          │  clean + cast only (no business logic)
│  stg_customers, stg_invoices, stg_invoice_line_items, stg_payments
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  intermediate/     │  joins + aggregations
│  int_invoices_enriched, int_invoice_line_totals, int_invoice_payments
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  marts/            │  stable query contract
│  mart_invoice_ledger   ◄──── THE API reads this as-is
└─────────┬──────────┘
          │
          ▼  (read-only DuckDB connection, FastAPI container)
┌────────────────────┐
│  GET /api/v1/invoices  →  list[Invoice]  (Pydantic)
└─────────┬──────────┘
          │
          ▼  (Vite dev proxy, frontend container)
┌────────────────────┐
│  React InvoiceList  ←  interface Invoice  (mirrors Pydantic 1:1)
└────────────────────┘
```

## Project structure

```
.
├── dbt_project/
│   ├── seeds/                      Raw mock CSVs (4 files, intentionally dirty)
│   ├── models/
│   │   ├── staging/                1:1 cleanup of sources
│   │   ├── intermediate/           Joins, aggregations, canonical customer resolution
│   │   └── marts/                  mart_invoice_ledger — the API's read target
│   ├── tests/                      Singular audit tests (header==sum of lines, balance>=0)
│   └── dbt_project.yml             Per-layer materialization + schema config
├── backend/
│   ├── app/
│   │   ├── models/invoice.py       Pydantic Invoice — THE contract
│   │   ├── api/v1/invoices.py      GET /api/v1/invoices
│   │   ├── db.py                   Read-only DuckDB via FastAPI lifespan
│   │   └── main.py                 App + versioned router + CORS
│   └── tests/test_contract.py      Field sets match mart exactly (catches drift)
├── frontend/
│   └── src/
│       ├── types/invoice.ts        TS interface mirroring Pydantic (strict TS == the test)
│       ├── api/invoices.ts         Typed fetch
│       ├── components/InvoiceList.tsx  Pure presentation
│       └── App.tsx                 Loading / error / success tri-state
├── docker-compose.yml              3 services: dbt (one-shot), backend, frontend
└── CLAUDE.md                       Architectural principles (non-negotiable)
```

## Local development (without Docker)

### dbt layer

```bash
cd dbt_project
python -m venv .venv && source .venv/Scripts/activate
pip install dbt-duckdb==1.9.4
export DBT_PROFILES_DIR=.
dbt build                    # runs seeds + models + tests
```

The DuckDB file writes to `./invoice_ledger.duckdb` by default. Inspect the mart:

```bash
python -m duckdb ./invoice_ledger.duckdb
# > SELECT * FROM main_marts.mart_invoice_ledger LIMIT 5;
```

Browse the DAG interactively: `dbt docs generate && dbt docs serve`.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
export DUCKDB_PATH=../dbt_project/invoice_ledger.duckdb

python -m pytest tests/ -v           # contract tests
uvicorn app.main:app --reload        # run API → http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                          # http://127.0.0.1:5173

npx tsc --noEmit                     # the test: strict TS type-check
```

## Key design decisions

- **Why three dbt layers?** Staging is a flat mirror of raw sources (easy to audit — "is this cleaned version explainable from that raw row?"). Intermediate owns the "judgment" calls (e.g., resolving canonical customer). Marts are the stable contract. A change in logic touches exactly one layer.
- **Why join customers on email, not on fuzzy names?** `customer_email` is already clean in the source data and is a true natural key. Fuzzy name matching ("acme corp" → "Acme Corporation") is fragile. The `relationships` test on `stg_invoices.customer_email` guarantees every invoice resolves.
- **Why is `total_amount` on the invoice header AND line items sum to it?** Enables [tests/assert_line_items_match_invoice_total.sql](dbt_project/tests/assert_line_items_match_invoice_total.sql) — a real audit test that would catch source-data drift. The seed CSVs were designed around this invariant.
- **Why Pydantic `frozen=True` + `extra="forbid"` + `Literal` on status?** Immutable responses, unknown fields rejected, status enum enforced at the API boundary — same invariants the dbt `accepted_values` test enforces at the data layer. Symmetric contract, both ends.
- **Why are decimals serialized as strings over the wire?** Pydantic's `Decimal` → JSON string (default v2 behavior) preserves precision. Currency values never lose cents to float rounding. The TS side treats them as strings and displays directly.
- **Why schema-drift test?** [backend/tests/test_contract.py](backend/tests/test_contract.py) asserts `set(mart_columns) == set(pydantic_fields)` exactly. If the mart gains a column OR Pydantic gains/drops one, the test surfaces it loudly.
- **Why is the dbt container idempotent on re-run?** DuckDB doesn't allow writer + reader concurrency. Once the backend holds a read-only connection, dbt can't re-acquire a write lock. The container's `CMD` checks if the mart file exists and skips — `docker compose up` is now safe to run any number of times.

## Testing each layer

| Layer    | Command                                                            | What it checks                                                |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| dbt      | `dbt test` (from `dbt_project/`)                                   | PK uniqueness, FK relationships, `accepted_values`, audits    |
| Backend  | `pytest tests/` (from `backend/`)                                  | Every mart row validates; field sets match exactly            |
| Frontend | `npx tsc --noEmit` (from `frontend/`)                              | Strict TS compilation — the contract is enforced at build time |
| End-to-end | `curl http://127.0.0.1:5173/api/v1/invoices`                     | Full chain: DuckDB → FastAPI → Vite proxy → JSON response      |

## What is deliberately **not** here

- No auth, no caching, no pagination — the core three-layer story is the focus
- No ORM — DuckDB is read directly; adding SQLAlchemy would obscure the "backend just reads the mart" discipline
- No runtime JSON validation on the frontend — the Pydantic server + strict TS contract make it redundant at this scale
- No production build for the frontend — `npm run dev` in a container is sufficient for a walking skeleton
