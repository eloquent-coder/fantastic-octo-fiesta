with source as (
    select * from {{ ref('raw_customers') }}
),

cleaned as (
    select
        customer_id,
        trim(customer_name) as customer_name,
        lower(trim(customer_email)) as customer_email,
        upper(trim(country)) as country,
        cast(customer_since as date) as customer_since
    from source
)

select * from cleaned
