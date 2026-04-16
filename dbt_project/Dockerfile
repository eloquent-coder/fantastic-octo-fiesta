FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir dbt-duckdb==1.9.1

COPY dbt_project/dbt_project.yml dbt_project/profiles.yml ./
COPY dbt_project/seeds/ ./seeds/
COPY dbt_project/models/ ./models/
COPY dbt_project/tests/ ./tests/
COPY dbt_project/macros/ ./macros/

RUN mkdir -p /app/data

CMD ["sh", "-c", "dbt seed --profiles-dir /app && dbt build --profiles-dir /app"]
