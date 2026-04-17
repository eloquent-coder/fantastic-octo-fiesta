export type InvoiceStatus = "draft" | "sent" | "overdue";

export interface Invoice {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  country: string;
  customer_since: string;

  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;

  total_amount: string;
  line_item_count: number;
  line_items_total: string;
  payment_count: number;
  amount_paid: string;
  last_payment_date: string | null;
  balance_due: string;
}
