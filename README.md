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
- **dbt docs** (data pipeline DAG, column-level lineage, tests): http://localhost:8080

Safe to run `docker compose up` repeatedly — the dbt container skips the build if the mart already exists. To force a fresh dbt run, wipe the volume first: `docker compose down -v`.

## Architecture

```
┌────────────────────┐
│  seeds/*.csv       │  raw_customers, raw_invoices,
│  (intentionally    │  raw_invoice_line_items, raw_payments
│   messy)           │
└─────────┬──────────┘
          │
          ▼  (dbt container — one-shot, idempotent)
┌────────────────────┐
│  1_staging/        │  clean + cast only (no business logic)
│  stg_customers, stg_invoices, stg_invoice_line_items, stg_payments
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  2_intermediate/   │  joins + aggregations
│  int_invoices_enriched, int_invoice_line_totals, int_invoice_payments
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  3_marts/          │  stable query contract (materialized table)
│  mart_invoice_ledger   ◄──── THE API reads this as-is
└─────────┬──────────┘
          │
          ├──────────────►  dbt-docs container → http://localhost:8080
          │                 (DAG, column lineage, test coverage)
          ▼  (read-only DuckDB connection, FastAPI container)
┌────────────────────┐
│  GET /api/v1/invoices  →  list[Invoice]  (Pydantic)
│  Swagger → http://localhost:8000/docs
└─────────┬──────────┘
          │
          ▼  (Vite dev proxy, frontend container)
┌────────────────────┐
│  React InvoiceList  ←  interface Invoice  (mirrors Pydantic 1:1)
│  Filters / sort / pagination are pure UI state (no API changes)
└────────────────────┘
```

## Project structure

```
.
├── dbt_project/
│   ├── seeds/                          Raw mock CSVs (4 files, intentionally dirty)
│   ├── models/
│   │   ├── 1_staging/                  1:1 cleanup of sources (views)
│   │   ├── 2_intermediate/             Joins, aggregations, canonical customer resolution (views)
│   │   └── 3_marts/                    mart_invoice_ledger — the API's read target (table)
│   ├── tests/                          Singular audit tests (header==sum of lines, balance>=0)
│   └── dbt_project.yml                 Per-layer materialization + schema config
├── backend/
│   ├── app/
│   │   ├── models/invoice.py           Pydantic Invoice — THE contract
│   │   ├── api/v1/invoices.py          GET /api/v1/invoices
│   │   ├── db.py                       Read-only DuckDB via FastAPI lifespan
│   │   └── main.py                     App + versioned router + CORS
│   └── tests/test_contract.py          Field sets match mart exactly (catches drift)
├── frontend/
│   └── src/
│       ├── types/invoice.ts            TS interface mirroring Pydantic (strict TS == the test)
│       ├── api/invoices.ts             Typed fetch
│       ├── utils/
│       │   ├── format.ts               Currency + date presentation helpers
│       │   └── invoiceView.ts          Filter / sort / paginate pure functions + view types
│       ├── components/
│       │   ├── InvoiceList.tsx         Table with sortable headers (presentation only)
│       │   ├── InvoiceFilters.tsx      Controlled filter inputs
│       │   ├── Pagination.tsx          Prev/next with page indicator
│       │   └── StatusBadge.tsx         Colored status pill
│       └── App.tsx                     Orchestrates fetch + view state via useMemo chain
├── docker-compose.yml                  4 services: dbt (one-shot), dbt-docs, backend, frontend
├── .env.example                        Deploy-time overrides (CORS_ORIGINS, ALLOWED_HOSTS)
└── CLAUDE.md                           Architectural principles (non-negotiable)
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

Browse the DAG interactively: `dbt docs generate && dbt docs serve` (or use the Dockerized dbt-docs container — already running at http://localhost:8080 when the stack is up).

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
- **Why are filter / sort / pagination client-side?** The API serves the full mart in one response. For 30 rows, client-side view state is trivially fast, keeps the backend as a pure pass-through ("never transforms data"), and avoids baking view concerns into the API contract. If the dataset later grows, migrating these to query params is mechanical. The view-state logic lives in [frontend/src/utils/invoiceView.ts](frontend/src/utils/invoiceView.ts) as pure functions, so components stay purely presentational.

## Testing each layer

| Layer    | Command                                                            | What it checks                                                |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| dbt      | `dbt test` (from `dbt_project/`)                                   | PK uniqueness, FK relationships, `accepted_values`, audits    |
| Backend  | `pytest tests/` (from `backend/`)                                  | Every mart row validates; field sets match exactly            |
| Frontend | `npx tsc --noEmit` (from `frontend/`)                              | Strict TS compilation — the contract is enforced at build time |
| End-to-end | `curl http://127.0.0.1:5173/api/v1/invoices`                     | Full chain: DuckDB → FastAPI → Vite proxy → JSON response      |

## Deploy to a Digital Ocean droplet (Ubuntu)

The walking skeleton runs on any Docker-capable host with one command. The only change from local dev is pointing the allow-lists at the droplet's public origin.

```bash
# 1. Provision a droplet. Easiest: use Digital Ocean's "Docker" Marketplace image
#    (Docker + Compose preinstalled). Otherwise:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 2. Clone
git clone <your-repo-url> invoice-ledger && cd invoice-ledger

# 3. Tell the stack about the droplet's public address via a .env file
cp .env.example .env
# edit .env:
#   CORS_ORIGINS=http://<DROPLET_IP>:5173
#   ALLOWED_HOSTS=<DROPLET_IP>

# 4. Open the firewall
sudo ufw allow OpenSSH
sudo ufw allow 5173/tcp
sudo ufw allow 8000/tcp   # optional: direct API access
sudo ufw allow 8080/tcp   # optional: dbt docs
sudo ufw --force enable

# 5. Run
docker compose up -d
```

Open `http://<DROPLET_IP>:5173` in a browser.

### Caveats for public deployment

- **Vite dev server is not production-grade.** Fine for a demo; for real traffic replace with `npm run build` + an nginx stage in [frontend/Dockerfile](frontend/Dockerfile).
- **No HTTPS.** For a real demo, put Caddy in front (auto-LetsEncrypt) and point a domain at the droplet:
  ```yaml
  # add to docker-compose.yml
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes: [./Caddyfile:/etc/caddy/Caddyfile, caddy-data:/data]
  ```
  ```
  # Caddyfile
  your-domain.com {
    handle /api/* { reverse_proxy backend:8000 }
    handle       { reverse_proxy frontend:5173 }
  }
  ```
  Then set `CORS_ORIGINS=https://your-domain.com` and `ALLOWED_HOSTS=your-domain.com`.
- **DuckDB lives on the droplet's disk** in a named volume. Back it up with `docker volume` commands if it matters.

## What is deliberately **not** here

- **No auth, no caching, no rate limiting** — the core three-layer story is the focus
- **No server-side pagination / filtering / sorting** — view state lives on the client (30-row dataset). The API contract stays minimal: one GET, full payload, no query params.
- **No ORM** — DuckDB is read directly; adding SQLAlchemy would obscure the "backend just reads the mart" discipline
- **No runtime JSON validation on the frontend** — the Pydantic server + strict TS contract make it redundant at this scale
- **No production build for the frontend** — `npm run dev` in a container is sufficient for a walking skeleton
- **No CI** — local `dbt test`, `pytest`, and `tsc --noEmit` cover the same ground; wiring them into GitHub Actions is a mechanical next step
