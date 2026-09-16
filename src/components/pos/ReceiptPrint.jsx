import React from "react";
import { money } from "../../lib/utils";

export default function ReceiptPrint({
  sale,
  shopName = "HBMS Honda Bike Shop",
}) {
  if (!sale) return null;

  return (
    <div className="receipt-print">
      <div className="receipt-brand">{shopName}</div>
      <div className="receipt-muted">Sales Receipt</div>

      <div className="receipt-line" />

      <div>
        Invoice: <b>{sale.id}</b>
      </div>
      <div>Date: {sale.date}</div>
      <div>Customer: {sale.customer}</div>

      <div className="receipt-line" />

      {sale.lineItems?.map((i, n) => (
        <div className="receipt-item" key={n}>
          <span>
            {i.name} × {i.qty}
          </span>
          <b>{money(i.price * i.qty)}</b>
        </div>
      ))}

      <div className="receipt-line" />

      <div className="receipt-item">
        <span>Subtotal</span>
        <b>{money(sale.subtotal ?? sale.total)}</b>
      </div>

      {(sale.discountAmount || 0) > 0 && (
        <div className="receipt-item">
          <span>Discount</span>
          <b>− {money(sale.discountAmount)}</b>
        </div>
      )}

      <div className="receipt-total">
        <span>Total</span>
        <b>{money(sale.total)}</b>
      </div>

      <div className="receipt-item">
        <span>Paid</span>
        <b>{money(sale.paid)}</b>
      </div>

      <div className="receipt-item">
        <span>Due</span>
        <b>{money(sale.due)}</b>
      </div>

      <div className="receipt-item">
        <span>Method</span>
        <b>{sale.method}</b>
      </div>

      <div className="receipt-line" />

      <div className="receipt-muted">Thank you for visiting.</div>
    </div>
  );
}
