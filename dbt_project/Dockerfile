FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir dbt-duckdb==1.9.4

COPY dbt_project/dbt_project.yml dbt_project/profiles.yml ./
COPY dbt_project/seeds/ ./seeds/
COPY dbt_project/models/ ./models/
COPY dbt_project/tests/ ./tests/

RUN mkdir -p /app/data

CMD ["sh", "-c", "if [ -f /app/data/invoice_ledger.duckdb ]; then echo 'Mart already built at /app/data/invoice_ledger.duckdb. Skipping dbt build. Run \"docker compose down -v\" to force a rebuild.'; else dbt build; fi"]
