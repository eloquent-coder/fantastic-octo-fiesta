with line_items as (
    select * from {{ ref('stg_invoice_line_items') }}
)

select
    invoice_id,
    count(*) as line_item_count,
    sum(line_total) as line_items_total
from line_items
group by invoice_id
