with source as (
    select * from {{ ref('raw_invoice_line_items') }}
),

cleaned as (
    select
        line_item_id,
        invoice_id,
        nullif(trim(description), '') as description,
        cast(quantity as integer) as quantity,
        cast(unit_price as decimal(12, 2)) as unit_price,
        cast(line_total as decimal(12, 2)) as line_total
    from source
)

select * from cleaned
