import type { Invoice } from "../types/invoice";
import { formatCurrency, formatDate } from "../utils/format";
import type { InvoiceSort, SortableColumn } from "../utils/invoiceView";
import { StatusBadge } from "./StatusBadge";

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
    return (
      <div className="empty-state">
        <p>No invoices match the current filters.</p>
      </div>
    );
  }

  const toggleSort = (column: SortableColumn) => {
    if (sort.column === column) {
      onSortChange({ column, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ column, direction: "asc" });
    }
  };

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              if (col.key === null) {
                return (
                  <th key={col.label} className={col.numeric ? "numeric" : undefined}>
                    {col.label}
                  </th>
                );
              }
              const isSorted = sort.column === col.key;
              const arrow = isSorted ? (sort.direction === "asc" ? "↑" : "↓") : "";
              const columnKey = col.key;
              return (
                <th key={columnKey} className={col.numeric ? "numeric" : undefined}>
                  <button
                    type="button"
                    className={`sort-header${isSorted ? " active" : ""}`}
                    onClick={() => toggleSort(columnKey)}
                    aria-sort={
                      isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
                    }
                  >
                    <span>{col.label}</span>
                    {arrow && <span className="sort-arrow">{arrow}</span>}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const hasBalance = Number(invoice.balance_due) > 0;
            return (
              <tr key={invoice.invoice_id} data-status={invoice.status}>
                <td className="mono">{invoice.invoice_id}</td>
                <td>
                  <div className="customer">
                    <span className="customer-name">{invoice.customer_name}</span>
                  </div>
                </td>
                <td className="muted">{invoice.customer_email}</td>
                <td>{invoice.country}</td>
                <td>
                  <StatusBadge status={invoice.status} />
                </td>
                <td>{formatDate(invoice.invoice_date)}</td>
                <td>{formatDate(invoice.due_date)}</td>
                <td className="numeric">{formatCurrency(invoice.total_amount)}</td>
                <td className="numeric">{formatCurrency(invoice.amount_paid)}</td>
                <td className={`numeric ${hasBalance ? "balance-due" : "balance-paid"}`}>
                  {formatCurrency(invoice.balance_due)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
