with source as (
    select * from {{ ref('raw_payments') }}
),

cleaned as (
    select
        payment_id,
        invoice_id,
        cast(amount as decimal(12, 2)) as amount,
        cast(payment_date as date) as payment_date,
        lower(trim(payment_method)) as payment_method
    from source
)

select * from cleaned
