from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

InvoiceStatus = Literal["draft", "sent", "overdue"]


class Invoice(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    invoice_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    country: str
    customer_since: date

    invoice_date: date
    due_date: date
    status: InvoiceStatus

    total_amount: Decimal
    line_item_count: int
    line_items_total: Decimal
    payment_count: int
    amount_paid: Decimal
    last_payment_date: date | None
    balance_due: Decimal
