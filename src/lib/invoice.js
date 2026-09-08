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
        <td style="padding:12px 14px;border-bottom:1px solid #e7dfd5;text-align:center;color:#78716c">${i + 1}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #e7dfd5">
          <div style="display:flex;align-items:center;gap:12px">
            ${
              item.image
                ? `<img src="${item.image}" alt="${item.name}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid #D4AF37" />`
                : ''
            }
            <div>
              <strong style="color:#1c1917;font-size:13px;display:block">${item.name}</strong>
              ${
                item.color || item.size
                  ? `<span style="font-size:11px;color:#78716c;margin-top:2px;display:block">${[item.color ? `Shade: ${item.color}` : '', item.size ? `Size: ${item.size}` : ''].filter(Boolean).join(' • ')}</span>`
                  : ''
              }
            </div>
          </div>
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #e7dfd5;text-align:center;font-weight:600;color:#1c1917">${item.quantity}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #e7dfd5;text-align:right;color:#44403c">₹${Number(item.price).toLocaleString('en-IN')}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #e7dfd5;text-align:right;font-weight:700;color:#7f1d1d">₹${(Number(item.price) * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const orderDateObj = order.created_at ? new Date(order.created_at) : new Date();
  const invoiceDate = orderDateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const invoiceTime = orderDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const paymentLabel =
    order.payment_method === 'razorpay'
      ? 'Online Payment (Razorpay / UPI / NetBanking)'
      : order.payment_method === 'cod'
      ? 'Cash on Delivery (COD)'
      : (order.payment_method || 'Standard');

  const paymentStatus =
    order.status === 'confirmed' || order.status === 'processing' || order.status === 'delivered'
      ? (order.payment_method === 'cod' ? 'Pending on Delivery' : 'PAID (Captured)')
      : 'Pending';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${order.order_number} | Trio Enterprises</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; font-size: 13px; background: #faf8f5; }
    .page-wrapper { max-width: 850px; margin: 30px auto; padding: 0 16px 40px; }
    .action-toolbar { background: #ffffff; border: 1px solid #e7dfd5; border-radius: 16px; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .action-btn { background: #7f1d1d; color: #ffffff; border: none; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: background 0.2s; }
    .action-btn:hover { background: #991b1b; }
    .action-btn-secondary { background: #f5f0eb; color: #44403c; border: 1px solid #d4af37; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
    .invoice-card { background: #ffffff; border-radius: 20px; border: 2px solid #e7dfd5; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border-bottom: 2px solid #d4af37; padding-bottom: 24px; }
    .badge-status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #dcfce7; color: #166534; }
    @media print {
      body { background: #ffffff; font-size: 12px; }
      .page-wrapper { max-width: 100%; margin: 0; padding: 0; }
      .action-toolbar { display: none !important; }
      .invoice-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    
    <!-- Action Toolbar (Hidden during Print / PDF) -->
    <div class="action-toolbar">
      <div>
        <strong style="color:#7f1d1d;font-size:14px">Official Tax Invoice</strong>
        <span style="color:#78716c;font-size:12px;margin-left:8px">#${order.order_number}</span>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="window.print()" class="action-btn">
          🖨️ Print / Save as PDF
        </button>
        <a href="?download=true" class="action-btn-secondary">
          📥 Download HTML
        </a>
      </div>
    </div>

    <!-- Printable Invoice Container -->
    <div class="invoice-card">
      
      <!-- Brand & Invoice Header -->
      <table class="header-table">
        <tr>
          <td style="vertical-align:top">
            <h1 style="font-size:24px;color:#7f1d1d;font-weight:900;letter-spacing:1px;margin-bottom:4px">TRIO ENTERPRISES</h1>
            <p style="font-size:12px;font-weight:700;color:#d4af37;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Authentic Indian Ethnic Handicrafts</p>
            <p style="font-size:11px;color:#57534e;line-height:1.5">
              Jaipur Handicraft Cluster &amp; Surat Textile Hub<br>
              Rajasthan - 302001, India<br>
              Email: care@trioenterprises.com | Web: trioenterprises.com
            </p>
          </td>
          <td style="vertical-align:top;text-align:right">
            <h2 style="font-size:26px;color:#7f1d1d;letter-spacing:2px;margin-bottom:6px">TAX INVOICE</h2>
            <p style="font-size:13px;color:#1c1917;margin-bottom:3px"><strong>Invoice No:</strong> <span style="font-family:monospace;font-weight:700;color:#7f1d1d">INV-${order.order_number}</span></p>
            <p style="font-size:12px;color:#44403c;margin-bottom:3px"><strong>Order Date:</strong> ${invoiceDate}</p>
            <p style="font-size:12px;color:#78716c;margin-bottom:6px"><strong>Order Time:</strong> ${invoiceTime}</p>
            <div>
              <span class="badge-status">${order.status === 'confirmed' ? 'Order Confirmed' : order.status}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Billing and Shipping Addresses -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#FAF5EA;border:1px solid #e7dfd5;border-radius:14px;overflow:hidden">
        <tr>
          <td style="vertical-align:top;width:50%;padding:20px;border-right:1px solid #e7dfd5">
            <h3 style="font-size:12px;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Billed To</h3>
            <p style="font-size:14px;font-weight:700;color:#1c1917;margin-bottom:4px">${address.name || 'Artisan Patron'}</p>
            <p style="font-size:12px;color:#57534e;line-height:1.5">
              ${address.address_line || address.address || ''}<br>
              ${address.city || ''}, ${address.state || ''} - ${address.pincode || address.zip || ''}<br>
              ${address.country || 'India'}<br>
              📞 <strong>Phone:</strong> ${address.phone || 'N/A'}
            </p>
          </td>
          <td style="vertical-align:top;width:50%;padding:20px">
            <h3 style="font-size:12px;color:#7f1d1d;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Shipped To</h3>
            <p style="font-size:14px;font-weight:700;color:#1c1917;margin-bottom:4px">${address.name || 'Artisan Patron'}</p>
            <p style="font-size:12px;color:#57534e;line-height:1.5">
              ${address.address_line || address.address || ''}<br>
              ${address.city || ''}, ${address.state || ''} - ${address.pincode || address.zip || ''}<br>
              ${address.country || 'India'}<br>
              📞 <strong>Phone:</strong> ${address.phone || 'N/A'}
            </p>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="background:#7f1d1d;color:#FAF5EA;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">
            <th style="padding:12px 14px;text-align:center;width:40px;border-top-left-radius:10px">#</th>
            <th style="padding:12px 14px;text-align:left">Handcrafted Craft Description</th>
            <th style="padding:12px 14px;text-align:center;width:60px">Qty</th>
            <th style="padding:12px 14px;text-align:right;width:110px">Unit Price</th>
            <th style="padding:12px 14px;text-align:right;width:120px;border-top-right-radius:10px">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Financial Calculation & Payment Summary -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:30px">
        <tr>
          <td style="vertical-align:top;width:55%;padding-right:24px">
            <div style="background:#f5f5f4;border:1px solid #e7e5e4;border-radius:12px;padding:16px;font-size:12px;color:#44403c">
              <p style="margin-bottom:6px"><strong>Payment Method:</strong> ${paymentLabel}</p>
              <p style="margin-bottom:6px"><strong>Payment Status:</strong> ${paymentStatus}</p>
              <p style="margin-bottom:6px"><strong>Delivery Partner:</strong> BlueDart Air Express</p>
              <p style="color:#78716c;font-size:11px;margin-top:8px">All prices are inclusive of applicable GST. Thank you for supporting generational Indian karigars!</p>
            </div>
          </td>
          <td style="vertical-align:top;width:45%">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr>
                <td style="padding:7px 12px;text-align:right;color:#57534e">Items Subtotal:</td>
                <td style="padding:7px 12px;text-align:right;font-weight:600;color:#1c1917">₹${Number(order.subtotal).toLocaleString('en-IN')}</td>
              </tr>
              ${
                Number(order.discount) > 0
                  ? `
              <tr>
                <td style="padding:7px 12px;text-align:right;color:#16a34a">Festive Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}:</td>
                <td style="padding:7px 12px;text-align:right;font-weight:700;color:#16a34a">-₹${Number(order.discount).toLocaleString('en-IN')}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding:7px 12px;text-align:right;color:#57534e">Express Shipping:</td>
                <td style="padding:7px 12px;text-align:right;font-weight:600;color:#1c1917">${Number(order.shipping_cost) > 0 ? '₹' + Number(order.shipping_cost).toLocaleString('en-IN') : '<span style="color:#16a34a;font-weight:700">FREE</span>'}</td>
              </tr>
              <tr style="border-top:2px solid #7f1d1d">
                <td style="padding:12px;text-align:right;font-weight:900;font-size:16px;color:#1c1917">Grand Total:</td>
                <td style="padding:12px;text-align:right;font-weight:900;font-size:18px;color:#7f1d1d">₹${Number(order.total).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer & Tax Disclaimers -->
      <div style="border-top:1px solid #e7dfd5;padding-top:20px;text-align:center;color:#78716c;font-size:11px;line-height:1.6">
        <p><strong>Trio Enterprises</strong> • Handcrafted with love in Jaipur, India 🇮🇳</p>
        <p>This is an electronically generated authentic commercial invoice. For any inquiries, write to <strong>care@trioenterprises.com</strong> or call <strong>+91 98765 43210</strong>.</p>
      </div>

    </div>
  </div>
</body>
</html>
  `;
}
