with source as (
    select * from {{ ref('raw_invoices') }}
),

cleaned as (
    select
        invoice_id,
        trim(customer_name) as customer_name,
        lower(trim(customer_email)) as customer_email,
        coalesce(
            try_strptime(invoice_date, '%Y-%m-%d'),
            try_strptime(invoice_date, '%m/%d/%Y')
        )::date as invoice_date,
        coalesce(
            try_strptime(due_date, '%Y-%m-%d'),
            try_strptime(due_date, '%m/%d/%Y')
        )::date as due_date,
        cast(
            replace(replace(total_amount, '$', ''), ',', '')
            as decimal(12, 2)
        ) as total_amount,
        lower(trim(status)) as status
    from source
)

select * from cleaned
