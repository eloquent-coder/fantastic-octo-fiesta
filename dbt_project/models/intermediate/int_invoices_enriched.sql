with invoices as (
    select * from {{ ref('stg_invoices') }}
),

customers as (
    select * from {{ ref('stg_customers') }}
)

select
    i.invoice_id,
    c.customer_id,
    c.customer_name,
    c.customer_email,
    c.country,
    c.customer_since,
    i.invoice_date,
    i.due_date,
    i.total_amount,
    i.status
from invoices as i
inner join customers as c
    on i.customer_email = c.customer_email
