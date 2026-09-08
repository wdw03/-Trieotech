/**
 * Generate an HTML invoice for an order
 */
export function generateInvoiceHTML(order) {
  const items = order.order_items || [];
  const address = order.shipping_address || {};

  const itemsRows = items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.name}${item.color ? ` (${item.color})` : ''}${item.size ? ` — ${item.size}` : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(item.price).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1c1917; font-size: 13px; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    @media print { .invoice { padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice">
    <!-- Header -->
    <table style="width:100%;margin-bottom:32px">
      <tr>
        <td>
          <h1 style="font-size:24px;color:#7f1d1d;margin-bottom:4px">TRIO ENTERPRISES</h1>
          <p style="font-size:11px;color:#78716c">Handcrafted Indian Ethnic Elegance</p>
          <p style="font-size:11px;color:#78716c;margin-top:8px">Jaipur, Rajasthan, India</p>
          <p style="font-size:11px;color:#78716c">Email: trioent19@gmail.com</p>
        </td>
        <td style="text-align:right">
          <h2 style="font-size:28px;color:#7f1d1d;letter-spacing:2px">INVOICE</h2>
          <p style="font-size:12px;margin-top:8px"><strong>Invoice No:</strong> INV-${order.order_number}</p>
          <p style="font-size:12px"><strong>Date:</strong> ${invoiceDate}</p>
          <p style="font-size:12px"><strong>Order:</strong> #${order.order_number}</p>
        </td>
      </tr>
    </table>

    <!-- Billing / Shipping -->
    <table style="width:100%;margin-bottom:24px;background:#fef3c7;border-radius:8px;padding:16px">
      <tr>
        <td style="vertical-align:top;width:50%;padding:8px">
          <h3 style="font-size:13px;color:#7f1d1d;margin-bottom:8px">BILL TO</h3>
          <p>${address.name || ''}</p>
          <p>${address.address_line || address.address || ''}</p>
          <p>${address.city || ''}, ${address.state || ''} - ${address.pincode || address.zip || ''}</p>
          <p>Phone: ${address.phone || ''}</p>
        </td>
        <td style="vertical-align:top;width:50%;padding:8px">
          <h3 style="font-size:13px;color:#7f1d1d;margin-bottom:8px">SHIP TO</h3>
          <p>${address.name || ''}</p>
          <p>${address.address_line || address.address || ''}</p>
          <p>${address.city || ''}, ${address.state || ''} - ${address.pincode || address.zip || ''}</p>
          <p>Phone: ${address.phone || ''}</p>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="background:#7f1d1d;color:#fef3c7">
          <th style="padding:10px 12px;text-align:center;width:40px">#</th>
          <th style="padding:10px 12px;text-align:left">Item Description</th>
          <th style="padding:10px 12px;text-align:center;width:60px">Qty</th>
          <th style="padding:10px 12px;text-align:right;width:100px">Unit Price</th>
          <th style="padding:10px 12px;text-align:right;width:100px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <table style="width:100%;margin-bottom:32px">
      <tr>
        <td style="width:60%"></td>
        <td>
          <table style="width:100%">
            <tr>
              <td style="padding:6px 12px;text-align:right">Subtotal:</td>
              <td style="padding:6px 12px;text-align:right">₹${Number(order.subtotal).toLocaleString('en-IN')}</td>
            </tr>
            ${Number(order.discount) > 0 ? `
            <tr>
              <td style="padding:6px 12px;text-align:right;color:#16a34a">Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}:</td>
              <td style="padding:6px 12px;text-align:right;color:#16a34a">-₹${Number(order.discount).toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 12px;text-align:right">Shipping:</td>
              <td style="padding:6px 12px;text-align:right">${Number(order.shipping_cost) > 0 ? '₹' + Number(order.shipping_cost).toLocaleString('en-IN') : 'FREE'}</td>
            </tr>
            <tr style="border-top:2px solid #7f1d1d">
              <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:16px">Total:</td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;font-size:16px;color:#7f1d1d">₹${Number(order.total).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Payment Info -->
    <div style="padding:16px;background:#f5f5f4;border-radius:8px;margin-bottom:24px">
      <p><strong>Payment Method:</strong> ${order.payment_method === 'razorpay' ? 'Online (Razorpay)' : order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}</p>
      <p><strong>Payment Status:</strong> ${order.status === 'confirmed' || order.status === 'delivered' ? 'Paid' : 'Pending'}</p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #e5e7eb">
      <p style="font-size:12px;color:#78716c">Thank you for your purchase from Trio Enterprises!</p>
      <p style="font-size:11px;color:#a8a29e;margin-top:4px">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>
  `;
}
