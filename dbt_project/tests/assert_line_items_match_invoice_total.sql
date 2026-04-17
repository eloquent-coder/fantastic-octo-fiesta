{#
    Audit: every invoice's line items must sum to the header total_amount.
    A row returned here means the source data drifted from the contract.
#}
select
    invoice_id,
    total_amount,
    line_items_total
from {{ ref('mart_invoice_ledger') }}
where line_items_total != total_amount
