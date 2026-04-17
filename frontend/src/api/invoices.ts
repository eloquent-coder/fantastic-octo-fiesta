import type { Invoice } from "../types/invoice";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE}/invoices`);
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as Invoice[];
}
