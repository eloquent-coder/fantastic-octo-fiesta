with invoices as (
    select * from {{ ref('int_invoices_enriched') }}
),

line_totals as (
    select * from {{ ref('int_invoice_line_totals') }}
),

payments as (
    select * from {{ ref('int_invoice_payments') }}
)

select
    i.invoice_id,
    i.customer_id,
    i.customer_name,
    i.customer_email,
    i.country,
    i.customer_since,
    i.invoice_date,
    i.due_date,
    i.status,
    i.total_amount,
    coalesce(lt.line_item_count, 0) as line_item_count,
    coalesce(lt.line_items_total, cast(0 as decimal(12, 2))) as line_items_total,
    coalesce(p.payment_count, 0) as payment_count,
    coalesce(p.amount_paid, cast(0 as decimal(12, 2))) as amount_paid,
    p.last_payment_date,
    i.total_amount - coalesce(p.amount_paid, cast(0 as decimal(12, 2))) as balance_due
from invoices as i
left join line_totals as lt
    on i.invoice_id = lt.invoice_id
left join payments as p
    on i.invoice_id = p.invoice_id
