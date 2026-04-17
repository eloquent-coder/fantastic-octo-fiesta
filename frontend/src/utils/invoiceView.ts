import type { Invoice, InvoiceStatus } from "../types/invoice";

export interface InvoiceFilters {
  invoiceId: string;
  customerName: string;
  status: InvoiceStatus | "all";
  invoiceDateFrom: string;
  invoiceDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
}

export const DEFAULT_FILTERS: InvoiceFilters = {
  invoiceId: "",
  customerName: "",
  status: "all",
  invoiceDateFrom: "",
  invoiceDateTo: "",
  dueDateFrom: "",
  dueDateTo: "",
};

export type SortableColumn =
  | "invoice_id"
  | "customer_name"
  | "customer_email"
  | "status"
  | "invoice_date"
  | "due_date"
  | "total_amount"
  | "amount_paid"
  | "balance_due";

export type SortDirection = "asc" | "desc";

export interface InvoiceSort {
  column: SortableColumn;
  direction: SortDirection;
}

const NUMERIC_COLUMNS: ReadonlySet<SortableColumn> = new Set([
  "total_amount",
  "amount_paid",
  "balance_due",
]);

export function applyFilters(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
  const invoiceIdNeedle = filters.invoiceId.trim().toLowerCase();
  const customerNeedle = filters.customerName.trim().toLowerCase();

  return invoices.filter((invoice) => {
    if (invoiceIdNeedle && !invoice.invoice_id.toLowerCase().includes(invoiceIdNeedle)) {
      return false;
    }
    if (customerNeedle && !invoice.customer_name.toLowerCase().includes(customerNeedle)) {
      return false;
    }
    if (filters.status !== "all" && invoice.status !== filters.status) {
      return false;
    }
    if (filters.invoiceDateFrom && invoice.invoice_date < filters.invoiceDateFrom) return false;
    if (filters.invoiceDateTo && invoice.invoice_date > filters.invoiceDateTo) return false;
    if (filters.dueDateFrom && invoice.due_date < filters.dueDateFrom) return false;
    if (filters.dueDateTo && invoice.due_date > filters.dueDateTo) return false;

    return true;
  });
}

export function applySort(invoices: Invoice[], sort: InvoiceSort): Invoice[] {
  const column = sort.column;
  const multiplier = sort.direction === "asc" ? 1 : -1;
  const isNumeric = NUMERIC_COLUMNS.has(column);

  return [...invoices].sort((a, b) => {
    const rawA = a[column];
    const rawB = b[column];
    if (isNumeric) {
      return (Number(rawA) - Number(rawB)) * multiplier;
    }
    if (rawA < rawB) return -1 * multiplier;
    if (rawA > rawB) return 1 * multiplier;
    return 0;
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}
