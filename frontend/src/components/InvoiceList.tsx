import type { Invoice } from "../types/invoice";
import type { InvoiceSort, SortableColumn } from "../utils/invoiceView";

interface Props {
  invoices: Invoice[];
  sort: InvoiceSort;
  onSortChange: (sort: InvoiceSort) => void;
}

interface Column {
  key: SortableColumn | null;
  label: string;
  numeric?: boolean;
}

const COLUMNS: readonly Column[] = [
  { key: "invoice_id", label: "Invoice" },
  { key: "customer_name", label: "Customer" },
  { key: "customer_email", label: "Email" },
  { key: null, label: "Country" },
  { key: "status", label: "Status" },
  { key: "invoice_date", label: "Invoice Date" },
  { key: "due_date", label: "Due Date" },
  { key: "total_amount", label: "Total", numeric: true },
  { key: "amount_paid", label: "Paid", numeric: true },
  { key: "balance_due", label: "Balance", numeric: true },
];

export function InvoiceList({ invoices, sort, onSortChange }: Props) {
  if (invoices.length === 0) {
    return <p>No invoices match the current filters.</p>;
  }

  const toggleSort = (column: SortableColumn) => {
    if (sort.column === column) {
      onSortChange({ column, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ column, direction: "asc" });
    }
  };

  return (
    <table>
      <thead>
        <tr>
          {COLUMNS.map((col) => {
            if (col.key === null) {
              return <th key={col.label}>{col.label}</th>;
            }
            const isSorted = sort.column === col.key;
            const arrow = isSorted ? (sort.direction === "asc" ? " ↑" : " ↓") : "";
            const columnKey = col.key;
            return (
              <th key={columnKey}>
                <button
                  type="button"
                  className="sort-header"
                  onClick={() => toggleSort(columnKey)}
                  aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                >
                  {col.label}
                  {arrow}
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.invoice_id} data-status={invoice.status}>
            <td>{invoice.invoice_id}</td>
            <td>{invoice.customer_name}</td>
            <td>{invoice.customer_email}</td>
            <td>{invoice.country}</td>
            <td>{invoice.status}</td>
            <td>{invoice.invoice_date}</td>
            <td>{invoice.due_date}</td>
            <td className="numeric">{invoice.total_amount}</td>
            <td className="numeric">{invoice.amount_paid}</td>
            <td className="numeric">{invoice.balance_due}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
