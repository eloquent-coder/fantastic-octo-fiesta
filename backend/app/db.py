import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import duckdb
from fastapi import FastAPI, Request

DUCKDB_PATH = os.environ.get("DUCKDB_PATH", "./invoice_ledger.duckdb")
MART_TABLE = "main_marts.mart_invoice_ledger"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.db = duckdb.connect(DUCKDB_PATH, read_only=True)
    try:
        yield
    finally:
        app.state.db.close()


def get_db(request: Request) -> duckdb.DuckDBPyConnection:
    return request.app.state.db
