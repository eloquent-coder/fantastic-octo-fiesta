import duckdb
from fastapi import APIRouter, Depends

from app.db import MART_TABLE, get_db
from app.models.invoice import Invoice

router = APIRouter()


@router.get("/invoices", response_model=list[Invoice])
def list_invoices(
    db: duckdb.DuckDBPyConnection = Depends(get_db),
) -> list[Invoice]:
    result = db.execute(f"SELECT * FROM {MART_TABLE} ORDER BY invoice_id")
    columns = [col[0] for col in result.description]
    return [Invoice.model_validate(dict(zip(columns, row))) for row in result.fetchall()]
