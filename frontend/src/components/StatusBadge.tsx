import type { InvoiceStatus } from "../types/invoice";

interface Props {
  status: InvoiceStatus;
}

export function StatusBadge({ status }: Props) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
