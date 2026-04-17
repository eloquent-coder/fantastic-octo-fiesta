from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import invoices
from app.db import lifespan

app = FastAPI(
    title="Invoice Ledger API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(invoices.router, prefix="/api/v1", tags=["invoices"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
