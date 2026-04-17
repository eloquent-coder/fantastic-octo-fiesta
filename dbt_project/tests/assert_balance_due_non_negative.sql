{#
    Audit: balance_due must never be negative (no overpayments allowed).
    A row here means payments exceed the invoice total.
#}
select
    invoice_id,
    total_amount,
    amount_paid,
    balance_due
from {{ ref('mart_invoice_ledger') }}
where balance_due < 0
