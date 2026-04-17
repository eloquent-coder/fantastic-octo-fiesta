import { DEFAULT_FILTERS, type InvoiceFilters as InvoiceFiltersState } from "../utils/invoiceView";
import { INVOICE_STATUSES, type InvoiceStatus } from "../types/invoice";

interface Props {
  filters: InvoiceFiltersState;
  onChange: (filters: InvoiceFiltersState) => void;
}

export function InvoiceFilters({ filters, onChange }: Props) {
  const update = <K extends keyof InvoiceFiltersState>(key: K, value: InvoiceFiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="filters" aria-label="Invoice filters">
      <label>
        Invoice #
        <input
          type="text"
          value={filters.invoiceId}
          onChange={(e) => update("invoiceId", e.target.value)}
          placeholder="e.g. INV-001"
        />
      </label>
      <label>
        Customer name
        <input
          type="text"
          value={filters.customerName}
          onChange={(e) => update("customerName", e.target.value)}
        />
      </label>
      <label>
        Status
        <select
          value={filters.status}
          onChange={(e) => update("status", e.target.value as InvoiceStatus | "all")}
        >
          <option value="all">All</option>
          {INVOICE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        Invoice date from
        <input
          type="date"
          value={filters.invoiceDateFrom}
          onChange={(e) => update("invoiceDateFrom", e.target.value)}
        />
      </label>
      <label>
        Invoice date to
        <input
          type="date"
          value={filters.invoiceDateTo}
          onChange={(e) => update("invoiceDateTo", e.target.value)}
        />
      </label>
      <label>
        Due date from
        <input
          type="date"
          value={filters.dueDateFrom}
          onChange={(e) => update("dueDateFrom", e.target.value)}
        />
      </label>
      <label>
        Due date to
        <input
          type="date"
          value={filters.dueDateTo}
          onChange={(e) => update("dueDateTo", e.target.value)}
        />
      </label>
      <button type="button" className="reset" onClick={() => onChange(DEFAULT_FILTERS)}>
        Reset
      </button>
    </section>
  );
}
