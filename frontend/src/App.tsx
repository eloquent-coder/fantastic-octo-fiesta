import { useEffect, useMemo, useState } from "react";

import { fetchInvoices } from "./api/invoices";
import { InvoiceFilters } from "./components/InvoiceFilters";
import { InvoiceList } from "./components/InvoiceList";
import { Pagination } from "./components/Pagination";
import type { Invoice } from "./types/invoice";
import {
  applyFilters,
  applySort,
  DEFAULT_FILTERS,
  paginate,
  totalPages as computeTotalPages,
  type InvoiceFilters as InvoiceFiltersState,
  type InvoiceSort,
} from "./utils/invoiceView";

const PAGE_SIZE = 10;

const DEFAULT_SORT: InvoiceSort = { column: "invoice_id", direction: "asc" };

export function App() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<InvoiceFiltersState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<InvoiceSort>(DEFAULT_SORT);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchInvoices()
      .then(setInvoices)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  useEffect(() => {
    setPage(0);
  }, [filters, sort]);

  const filtered = useMemo(
    () => applyFilters(invoices ?? [], filters),
    [invoices, filters],
  );
  const sorted = useMemo(() => applySort(filtered, sort), [filtered, sort]);
  const pageCount = computeTotalPages(sorted.length, PAGE_SIZE);
  const safePage = Math.min(page, pageCount - 1);
  const visible = paginate(sorted, safePage, PAGE_SIZE);

  return (
    <main>
      <header className="app-header">
        <h1>Invoice Ledger</h1>
        <p className="subtitle">Outstanding and recent customer invoices</p>
      </header>
      {error !== null && <p className="error">Error: {error}</p>}
      {error === null && invoices === null && <p className="loading">Loading…</p>}
      {error === null && invoices !== null && (
        <>
          <InvoiceFilters filters={filters} onChange={setFilters} />
          <InvoiceList invoices={visible} sort={sort} onSortChange={setSort} />
          <p className="summary">
            Showing {visible.length} of {sorted.length} invoices
            {sorted.length !== invoices.length && ` (filtered from ${invoices.length})`}
          </p>
          <Pagination page={safePage} totalPages={pageCount} onChange={setPage} />
        </>
      )}
    </main>
  );
}
