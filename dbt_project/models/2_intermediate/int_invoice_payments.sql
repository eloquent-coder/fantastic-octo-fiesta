with payments as (
    select * from {{ ref('stg_payments') }}
)

select
    invoice_id,
    count(*) as payment_count,
    sum(amount) as amount_paid,
    max(payment_date) as last_payment_date
from payments
group by invoice_id
