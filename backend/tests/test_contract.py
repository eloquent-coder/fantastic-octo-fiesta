import duckdb
import pytest

from app.db import DUCKDB_PATH, MART_TABLE
from app.models.invoice import Invoice


def _fetch_mart_rows() -> list[dict]:
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    try:
        result = con.execute(f"SELECT * FROM {MART_TABLE}")
        columns = [col[0] for col in result.description]
        return [dict(zip(columns, row)) for row in result.fetchall()]
    finally:
        con.close()


def test_mart_is_not_empty():
    rows = _fetch_mart_rows()
    assert len(rows) > 0, "Mart is empty — run `dbt build` in dbt_project/ first."


def test_every_mart_row_validates_against_pydantic_contract():
    """Any schema drift between dbt mart and API Pydantic model will surface here."""
    rows = _fetch_mart_rows()
    for row in rows:
        Invoice.model_validate(row)


def test_pydantic_fields_match_mart_columns_exactly():
    """Ensures the mart doesn't gain or lose columns without the contract knowing."""
    con = duckdb.connect(DUCKDB_PATH, read_only=True)
    try:
        result = con.execute(f"SELECT * FROM {MART_TABLE} LIMIT 0")
        mart_columns = {col[0] for col in result.description}
    finally:
        con.close()
    pydantic_fields = set(Invoice.model_fields.keys())
    assert mart_columns == pydantic_fields, (
        f"Schema drift. "
        f"In mart but not Pydantic: {mart_columns - pydantic_fields}. "
        f"In Pydantic but not mart: {pydantic_fields - mart_columns}."
    )
