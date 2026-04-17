import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import invoices
from app.db import lifespan

_cors_env = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

app = FastAPI(
    title="Invoice Ledger API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(invoices.router, prefix="/api/v1", tags=["invoices"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
