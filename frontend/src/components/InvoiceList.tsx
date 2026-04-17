import type { Invoice } from "../types/invoice";

interface Props {
  invoices: Invoice[];
}

export function InvoiceList({ invoices }: Props) {
  if (invoices.length === 0) {
    return <p>No invoices.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Country</th>
          <th>Status</th>
          <th>Invoice Date</th>
          <th>Due Date</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Balance</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.invoice_id} data-status={invoice.status}>
            <td>{invoice.invoice_id}</td>
            <td>{invoice.customer_name}</td>
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
