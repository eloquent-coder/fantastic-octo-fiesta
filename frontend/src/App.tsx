import { useEffect, useState } from "react";

import { fetchInvoices } from "./api/invoices";
import { InvoiceList } from "./components/InvoiceList";
import type { Invoice } from "./types/invoice";

export function App() {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices()
      .then(setInvoices)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <main>
      <h1>Invoice Ledger</h1>
      {error !== null && <p className="error">Error: {error}</p>}
      {error === null && invoices === null && <p>Loading…</p>}
      {error === null && invoices !== null && <InvoiceList invoices={invoices} />}
    </main>
  );
}
