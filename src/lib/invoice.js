/**
 * Trio Enterprises - Official GST Tax Invoice Generator
 * Generates print-perfect, authentic commercial tax invoices for shipping packets and customer records.
 */

// Helper to convert number to Indian Currency Words (e.g., 1499 -> "One Thousand Four Hundred Ninety Nine Rupees Only")
export function numberToWordsIndian(num) {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.round(Number(num) || 0);
  if (n === 0) return 'Zero Rupees Only';

  const inWords = (val) => {
    let str = '';
    if (val >= 10000000) {
      str += inWords(Math.floor(val / 10000000)) + 'Crore ';
      val %= 10000000;
    }
    if (val >= 100000) {
      str += inWords(Math.floor(val / 100000)) + 'Lakh ';
      val %= 100000;
    }
    if (val >= 1000) {
      str += inWords(Math.floor(val / 1000)) + 'Thousand ';
      val %= 1000;
    }
    if (val >= 100) {
      str += inWords(Math.floor(val / 100)) + 'Hundred ';
      val %= 100;
    }
    if (val > 0) {
      if (val < 20) str += a[val];
      else str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
    }
    return str;
  };

  return inWords(n).trim() + ' Rupees Only';
}

// Normalizes order data across Supabase schema and Admin state shapes
export function normalizeInvoiceOrder(order = {}) {
  const rawItems = order.order_items || order.items || [];
  const rawAddress = order.shipping_address || order.customer?.address || {};

  const orderNumber = order.order_number || order.id || 'ORD-0000';
  const rawDate = order.created_at || order.date || order.order_date;
  const orderDateObj = rawDate ? new Date(rawDate) : new Date();

  const invoiceDate = orderDateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const invoiceTime = orderDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isCod = String(order.payment_method || order.paymentMethod || '').toLowerCase() === 'cod';
  const paymentMethodLabel = isCod
    ? 'Cash on Delivery (COD)'
    : (order.payment_method === 'razorpay' || order.paymentMethod === 'razorpay'
        ? 'Online Payment (Razorpay / UPI / Cards)'
        : (order.payment_method || order.paymentMethod || 'Prepaid Online'));

  const paymentStatusLabel = order.payment_status === 'paid' || order.paymentStatus === 'paid'
    ? 'PAID (Captured Online)'
    : (isCod ? 'DUE ON DELIVERY (COD)' : (order.payment_status || order.paymentStatus || 'Pending'));

  const customerName = rawAddress.name || rawAddress.firstName
    ? `${rawAddress.firstName || ''} ${rawAddress.lastName || ''}`.trim() || rawAddress.name
    : (order.customer?.name || order.customer_name || 'Valued Patron');

  const customerPhone = rawAddress.phone || order.customer?.phone || order.customer_phone || 'N/A';
  const customerEmail = rawAddress.email || order.customer?.email || order.customer_email || 'N/A';

  const addressLine = rawAddress.address_line || rawAddress.address || rawAddress.street || '';
  const city = rawAddress.city || '';
  const state = rawAddress.state || '';
  const pincode = rawAddress.pincode || rawAddress.zip || '';
  const country = rawAddress.country || 'India';

  const courierPartner = order.shippingPartner || order.shipment?.courier_name || order.shipment?.courierName || 'Shiprocket Express';
  const trackingNumber = order.trackingNumber || order.shipment?.awb_number || order.shipment?.awb || 'Live Assigned on Dispatch';

  const items = rawItems.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const lineTotal = Number(item.total || (price * qty));
    return {
      index: idx + 1,
      name: item.name || item.product_name || 'Handcrafted Ethnic Item',
      sku: item.sku || (item.product_id ? `TRIO-${item.product_id}` : `TRIO-CRFT-${idx + 1}`),
      hsn: item.hsn || '6304',
      color: item.color || item.selectedColor || '',
      size: item.size || item.selectedSize || '',
      quantity: qty,
      price,
      lineTotal,
      image: item.image || item.product_image || '',
    };
  });

  const subtotal = Number(order.subtotal ?? order.itemSubtotal ?? items.reduce((acc, i) => acc + i.lineTotal, 0));
  const discount = Number(order.discount ?? 0);
  const couponCode = order.coupon_code || order.coupon || '';
  const shipping = Number(order.shipping_cost ?? order.shipping ?? order.customerShippingCharge ?? 0);
  const platformFee = Number(order.platform_fee ?? order.platformFee ?? 0);
  const total = Number(order.total ?? order.grandTotal ?? Math.max(0, subtotal - discount + shipping + platformFee));
  const tax = Number(order.tax ?? Math.round((total * 18) / 118)); // 18% GST embedded
  const codCollectable = isCod ? total : 0;

  return {
    rawId: order.id || orderNumber,
    orderNumber,
    invoiceNumber: `INV-${String(orderNumber).replace(/^ORD-?/i, '')}`,
    invoiceDate,
    invoiceTime,
    orderStatus: order.status || 'Confirmed',
    customerName,
    customerPhone,
    customerEmail,
    addressLine,
    city,
    state,
    pincode,
    country,
    courierPartner,
    trackingNumber,
    isCod,
    paymentMethodLabel,
    paymentStatusLabel,
    codCollectable,
    items,
    subtotal,
    discount,
    couponCode,
    shipping,
    platformFee,
    tax,
    total,
    amountInWords: numberToWordsIndian(total),
  };
}

/**
 * Renders the HTML content for a single invoice sheet
 */
export function renderInvoiceSheetHTML(inv) {
  const itemsRows = inv.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 9px 10px; text-align: center; color: #64748b; font-size: 11px;">${item.index}</td>
        <td style="padding: 9px 10px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 12px; line-height: 1.35;">${item.name}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            SKU: <span style="font-family: monospace; font-weight: 600; color: #334155;">${item.sku}</span>
            ${item.color ? ` • Shade: <strong style="color: #475569;">${item.color}</strong>` : ''}
            ${item.size ? ` • Size: <strong style="color: #475569;">${item.size}</strong>` : ''}
          </div>
        </td>
        <td style="padding: 9px 10px; text-align: center; font-family: monospace; font-size: 11px; color: #475569;">${item.hsn}</td>
        <td style="padding: 9px 10px; text-align: center; font-weight: 700; color: #0f172a; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 9px 10px; text-align: right; color: #334155; font-size: 12px;">₹${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 9px 10px; text-align: right; font-weight: 800; color: #7f1d1d; font-size: 12px;">₹${item.lineTotal.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div class="invoice-sheet">

      <!-- Header: Supplier & Tax Invoice Meta -->
      <table style="width: 100%; border-collapse: collapse; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 2px solid #d4af37;">
        <tr>
          <td style="vertical-align: top; width: 58%;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
              <img src="/logo.png" alt="Trio Enterprises Logo" style="width: 44px; height: 44px; object-fit: contain; border-radius: 8px;" />
              <div>
                <h1 style="font-size: 20px; font-weight: 900; color: #7f1d1d; letter-spacing: 0.5px; line-height: 1.1;">TRIO ENTERPRISES</h1>
                <p style="font-size: 10px; font-weight: 800; color: #d4af37; text-transform: uppercase; letter-spacing: 1px;">Ethnic Craft Guild &amp; Devotional Essentials</p>
              </div>
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.45;">
              <strong style="color: #0f172a;">Attn: Kashyap ji</strong><br>
              UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad<br>
              Near R.B.A COLLEGE, Faridabad, Haryana - 121001, India<br>
              📞 <strong>+91 7065120322</strong> | ✉️ <strong>care@trioenterprises.com</strong><br>
              <span style="display: inline-block; margin-top: 3px; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-weight: 800; font-size: 10px; border: 1px solid #fde68a;">
                GSTIN: 24AAACT1234F1Z8 • State: Haryana (06)
              </span>
            </div>
          </td>
          <td style="vertical-align: top; width: 42%; text-align: right;">
            <div style="display: inline-block; background: #7f1d1d; color: #ffffff; padding: 4px 14px; border-radius: 6px; font-size: 14px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">
              TAX INVOICE
            </div>
            <div style="font-size: 11px; color: #334155; line-height: 1.5;">
              <div><strong>Invoice No:</strong> <span style="font-family: monospace; font-weight: 800; color: #7f1d1d; font-size: 13px;">${inv.invoiceNumber}</span></div>
              <div><strong>Order Ref:</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${inv.orderNumber}</span></div>
              <div><strong>Invoice Date:</strong> ${inv.invoiceDate}</div>
              <div><strong>Order Time:</strong> ${inv.invoiceTime}</div>
              <div style="margin-top: 4px;">
                <span style="display: inline-block; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid #bbf7d0;">
                  ● ${inv.orderStatus}
                </span>
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Dispatch Courier & AWB Bar -->
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
        <div>
          <span style="color: #64748b; font-weight: 600;">Logistics Partner:</span>
          <strong style="color: #0f172a; margin-left: 4px;">${inv.courierPartner}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">AWB / Tracking No:</span>
          <span style="font-family: monospace; font-weight: 800; color: #1d4ed8; margin-left: 4px;">${inv.trackingNumber}</span>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Supply State:</span>
          <strong style="color: #0f172a; margin-left: 4px;">${inv.state || 'Haryana'}</strong>
        </div>
      </div>

      <!-- Two-Column Address Box: Billed To & Shipped To -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="vertical-align: top; width: 50%; padding: 14px 16px; border-right: 1px solid #e7e5e4;">
            <div style="font-size: 10px; font-weight: 800; color: #7f1d1d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">
              Billed To (Customer Details)
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              ${inv.customerName}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.45;">
              ${inv.addressLine ? inv.addressLine + '<br>' : ''}
              ${[inv.city, inv.state].filter(Boolean).join(', ')}${inv.pincode ? ' - ' + inv.pincode : ''}<br>
              ${inv.country}<br>
              📞 <strong>Phone:</strong> ${inv.customerPhone}<br>
              ✉️ <strong>Email:</strong> ${inv.customerEmail}
            </div>
          </td>
          <td style="vertical-align: top; width: 50%; padding: 14px 16px;">
            <div style="font-size: 10px; font-weight: 800; color: #7f1d1d; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">
              Shipped To (Delivery Destination)
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
              ${inv.customerName}
            </div>
            <div style="font-size: 11px; color: #475569; line-height: 1.45;">
              ${inv.addressLine ? inv.addressLine + '<br>' : ''}
              ${[inv.city, inv.state].filter(Boolean).join(', ')}${inv.pincode ? ' - ' + inv.pincode : ''}<br>
              ${inv.country}<br>
              📞 <strong>Phone:</strong> ${inv.customerPhone}
            </div>
          </td>
        </tr>
      </table>

      <!-- Prominent Payment Mode Notice Banner for Shipping Packets -->
      ${
        inv.isCod
          ? `
        <div style="background: #fff1f2; border: 2px dashed #e11d48; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="display: inline-block; background: #e11d48; color: #ffffff; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
              ⚠️ CASH ON DELIVERY (COD)
            </span>
            <span style="font-size: 11px; color: #9f1239; margin-left: 8px; font-weight: 600;">Collect exact cash from recipient on parcel delivery</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #881337; font-weight: 700;">Collect Amount:</span>
            <strong style="font-size: 16px; color: #be123c; margin-left: 4px;">₹${inv.codCollectable.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      `
          : `
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 8px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="display: inline-block; background: #16a34a; color: #ffffff; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
              ✓ PREPAID ONLINE ORDER
            </span>
            <span style="font-size: 11px; color: #166534; margin-left: 8px; font-weight: 600;">Payment captured online. <strong>DO NOT COLLECT CASH.</strong></span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; color: #14532d; font-weight: 700;">Paid Amount:</span>
            <strong style="font-size: 15px; color: #15803d; margin-left: 4px;">₹${inv.total.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      `
      }

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #7f1d1d; color: #ffffff; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 8px 10px; text-align: center; width: 35px;">#</th>
            <th style="padding: 8px 10px; text-align: left;">Item Description &amp; Specifications</th>
            <th style="padding: 8px 10px; text-align: center; width: 65px;">HSN</th>
            <th style="padding: 8px 10px; text-align: center; width: 45px;">Qty</th>
            <th style="padding: 8px 10px; text-align: right; width: 95px;">Unit Price</th>
            <th style="padding: 8px 10px; text-align: right; width: 105px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Financial Calculation & Signature Section -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <!-- Left Notes & Declarations -->
          <td style="vertical-align: top; width: 55%; padding-right: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; font-size: 11px; color: #334155; line-height: 1.5;">
              <div style="margin-bottom: 4px;">
                <strong>Payment Method:</strong> ${inv.paymentMethodLabel}
              </div>
              <div style="margin-bottom: 4px;">
                <strong>Payment Status:</strong>
                <span style="font-weight: 800; color: ${inv.isCod ? '#e11d48' : '#16a34a'};">${inv.paymentStatusLabel}</span>
              </div>
              <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px; color: #64748b; font-size: 10px;">
                <strong>Invoice Amount in Words:</strong><br>
                <em style="color: #0f172a; font-weight: 700; font-size: 11px;">${inv.amountInWords}</em>
              </div>
              <div style="color: #64748b; font-size: 9.5px; margin-top: 6px;">
                * All rates inclusive of applicable Goods &amp; Services Tax (GST 18% under HSN 6304).
              </div>
            </div>
          </td>

          <!-- Right Calculation Box -->
          <td style="vertical-align: top; width: 45%;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">
              <tr>
                <td style="padding: 5px 8px; text-align: right; color: #64748b;">Items Subtotal:</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #0f172a; width: 100px;">₹${inv.subtotal.toLocaleString('en-IN')}</td>
              </tr>
              ${
                inv.discount > 0
                  ? `
                <tr>
                  <td style="padding: 5px 8px; text-align: right; color: #16a34a;">Discount ${inv.couponCode ? `(${inv.couponCode})` : ''}:</td>
                  <td style="padding: 5px 8px; text-align: right; font-weight: 800; color: #16a34a;">-₹${inv.discount.toLocaleString('en-IN')}</td>
                </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding: 5px 8px; text-align: right; color: #64748b;">Shipping / Delivery:</td>
                <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #0f172a;">
                  ${inv.shipping === 0 ? '<span style="color: #16a34a; font-weight: 800;">FREE</span>' : `₹${inv.shipping.toLocaleString('en-IN')}`}
                </td>
              </tr>
              ${
                inv.platformFee > 0
                  ? `
                <tr>
                  <td style="padding: 5px 8px; text-align: right; color: #64748b;">Handling Fee:</td>
                  <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #0f172a;">₹${inv.platformFee.toLocaleString('en-IN')}</td>
                </tr>
              `
                  : ''
              }
              <tr>
                <td style="padding: 5px 8px; text-align: right; color: #94a3b8; font-size: 10.5px;">Included GST (18%):</td>
                <td style="padding: 5px 8px; text-align: right; color: #64748b; font-size: 10.5px;">₹${inv.tax.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 2px solid #7f1d1d; border-bottom: 2px solid #7f1d1d;">
                <td style="padding: 9px 8px; text-align: right; font-weight: 900; font-size: 13px; color: #0f172a;">Total Invoice Value:</td>
                <td style="padding: 9px 8px; text-align: right; font-weight: 900; font-size: 16px; color: #7f1d1d;">₹${inv.total.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Terms & Signatory Section -->
      <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 6px;">
        <tr>
          <td style="vertical-align: bottom; width: 62%; font-size: 9.5px; color: #64748b; line-height: 1.45;">
            <strong style="color: #334155; font-size: 10px;">Terms &amp; Return Conditions:</strong><br>
            • Returns &amp; exchanges accepted within 10 days of delivery for defective or transit-damaged items.<br>
            • Handcrafted Indian ethnic goods may have subtle artisan variations that celebrate authentic craftwork.<br>
            • This is an authentic, electronically generated commercial tax invoice and does not require a physical signature.
          </td>
          <td style="vertical-align: bottom; width: 38%; text-align: right;">
            <div style="display: inline-block; text-align: center; border-top: 1px solid #334155; padding-top: 6px; width: 170px;">
              <span style="font-size: 10px; font-weight: 900; color: #7f1d1d; text-transform: uppercase;">For TRIO ENTERPRISES</span>
              <div style="height: 28px; display: flex; align-items: center; justify-content: center; font-style: italic; color: #94a3b8; font-size: 9.5px;">
                [Digitally Authorized Seal]
              </div>
              <span style="font-size: 9.5px; font-weight: 700; color: #334155;">Authorized Signatory</span>
            </div>
          </td>
        </tr>
      </table>

    </div>
  `;
}

/**
 * Shared CSS styles for screen and print
 */
const INVOICE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #f8fafc;
    font-size: 12px;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
  }
  .page-container {
    max-width: 820px;
    margin: 24px auto;
    padding: 0 16px 40px;
  }
  .action-toolbar {
    background: #0f172a;
    color: #ffffff;
    border-radius: 14px;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  .btn-print {
    background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
    color: #ffffff;
    border: 1px solid #d4af37;
    padding: 9px 20px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(127,29,29,0.3);
  }
  .btn-print:hover {
    background: #b91c1c;
  }
  .btn-close {
    background: #1e293b;
    color: #cbd5e1;
    border: 1px solid #334155;
    padding: 9px 16px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .invoice-sheet {
    background: #ffffff;
    border: 1.5px solid #d4af37;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    margin-bottom: 28px;
  }
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-size: 11.5px !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .action-toolbar {
      display: none !important;
    }
    .page-container {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .invoice-sheet {
      border: 1.5px solid #d4af37 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      padding: 16px !important;
      margin-bottom: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
    }
    .invoice-sheet:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }
`;

/**
 * Generate full, print-perfect standalone HTML document for a single Tax Invoice
 */
export function generateInvoiceHTML(order, options = {}) {
  const inv = normalizeInvoiceOrder(order);
  const autoPrint = options.autoPrint ?? false;
  const sheetHtml = renderInvoiceSheetHTML(inv);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${inv.orderNumber} | Trio Enterprises</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    ${INVOICE_STYLES}
  </style>
</head>
<body>

  <div class="page-container">

    <!-- Screen-Only Action Toolbar -->
    <div class="action-toolbar">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: #7f1d1d; border: 1px solid #d4af37; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">GST Tax Invoice</span>
        <span style="font-weight: 700; font-size: 13px;">#${inv.orderNumber}</span>
        <span style="color: #94a3b8; font-size: 11px;">• Print on A4 paper for packet shipment</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button onclick="window.print()" class="btn-print">
          🖨️ Print Invoice (A4 / Packet)
        </button>
        <button onclick="window.close()" class="btn-close">
          Close
        </button>
      </div>
    </div>

    ${sheetHtml}

  </div>

  ${
    autoPrint
      ? `<script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => { window.print(); }, 350);
    });
  </script>`
      : ''
  }

</body>
</html>`;
}

/**
 * Generate full, print-perfect standalone HTML document for bulk Tax Invoices (e.g. multi-selection)
 */
export function generateBulkInvoiceHTML(orders = [], options = {}) {
  const autoPrint = options.autoPrint ?? false;
  const sheets = orders.map((order) => {
    const inv = normalizeInvoiceOrder(order);
    return renderInvoiceSheetHTML(inv);
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bulk Tax Invoices (${orders.length} Orders) | Trio Enterprises</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    ${INVOICE_STYLES}
  </style>
</head>
<body>

  <div class="page-container">

    <!-- Screen-Only Action Toolbar -->
    <div class="action-toolbar">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: #7f1d1d; border: 1px solid #d4af37; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">Bulk Tax Invoices</span>
        <span style="font-weight: 700; font-size: 13px;">${orders.length} Packets</span>
        <span style="color: #94a3b8; font-size: 11px;">• Multi-page A4 print (1 invoice per page)</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button onclick="window.print()" class="btn-print">
          🖨️ Print All Invoices (${orders.length})
        </button>
        <button onclick="window.close()" class="btn-close">
          Close
        </button>
      </div>
    </div>

    ${sheets}

  </div>

  ${
    autoPrint
      ? `<script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => { window.print(); }, 350);
    });
  </script>`
      : ''
  }

</body>
</html>`;
}
