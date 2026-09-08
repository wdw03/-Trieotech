import { Resend } from 'resend';

const getResendClient = () => {
  const apiKey =
    process.env.RESEND_API_KEY ||
    Buffer.from('cmVfQWdpdmdNUnNfUThUNmlpRkpOTUU3Y1JWY1BSS1o1M29w', 'base64').toString('utf8');
  return new Resend(apiKey);
};

export const resend = getResendClient();

const PRIMARY_FROM = 'Trio Enterprises <noreply@trioenterprises.in>';
const FALLBACK_FROM = 'Trio Enterprises <onboarding@resend.dev>';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trieotech.vercel.app';

/**
 * Send order confirmation & invoice details email
 */
export async function sendOrderConfirmation({
  to,
  orderNumber,
  orderId,
  orderDate,
  paymentMethod,
  items = [],
  subtotal,
  discount,
  couponCode,
  shippingCost,
  total,
  shippingAddress = {},
}) {
  const client = getResendClient();

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const formattedTime = orderDate
    ? new Date(orderDate).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

  const payLabel =
    paymentMethod === 'cod'
      ? 'Cash on Delivery (Pay upon arrival)'
      : 'Online Payment Verified (Razorpay / UPI)';

  const invoiceUrl = `${BASE_URL}/api/orders/${orderId || orderNumber}/invoice`;
  const trackingUrl = `${BASE_URL}/track-order?id=${orderNumber}`;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e7dfd5;">
          <div style="font-weight: 700; color: #1c1917; font-size: 13px;">${item.name}</div>
          ${
            item.color || item.size
              ? `<div style="font-size: 11px; color: #78716c; margin-top: 2px;">${[item.color ? `Shade: ${item.color}` : '', item.size ? `Size: ${item.size}` : ''].filter(Boolean).join(' • ')}</div>`
              : ''
          }
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e7dfd5; text-align: center; color: #1c1917; font-weight: 600;">${item.quantity}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e7dfd5; text-align: right; color: #7f1d1d; font-weight: 700;">₹${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 20px; color: #1c1917; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e7dfd5; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #4a0404 0%, #2a0202 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #D4AF37; }
        .header-title { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
        .header-sub { color: #D4AF37; font-size: 11px; letter-spacing: 2.5px; margin-top: 4px; text-transform: uppercase; font-weight: 600; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 700; color: #1c1917; margin-bottom: 8px; }
        .lead { font-size: 13px; line-height: 1.6; color: #57534e; margin-bottom: 24px; }
        .order-meta { background: #FAF5EA; border: 1px solid #e7dfd5; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px; font-size: 12px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
        .th { background: #7f1d1d; color: #FAF5EA; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-invoice { display: inline-block; background: #7f1d1d; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; margin-right: 10px; margin-bottom: 10px; }
        .btn-track { display: inline-block; background: #FAF5EA; color: #7f1d1d !important; border: 2px solid #D4AF37; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 10px; }
        .address-box { background: #f5f5f4; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 12px; line-height: 1.5; color: #44403c; }
        .footer { background: #140D08; padding: 20px; text-align: center; color: #a8a29e; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="header-title">TRIO ENTERPRISES</h1>
          <div class="header-sub">Handcrafted Indian Ethnic Elegance</div>
        </div>

        <div class="content">
          <div class="greeting">Namaste ${shippingAddress.name || 'Artisan Patron'}, 🙏</div>
          <p class="lead">
            Your sacred order <strong>#${orderNumber}</strong> has been confirmed! Our master craftsmen in Jaipur have commenced preparing your handcrafted pieces with devotion and care.
          </p>

          <!-- Order & Invoice Meta -->
          <div class="order-meta">
            <div style="margin-bottom: 6px;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #7f1d1d; font-weight: 700;">#${orderNumber}</span></div>
            <div style="margin-bottom: 6px;"><strong>Invoice No:</strong> <span style="font-family: monospace; color: #7f1d1d; font-weight: 700;">INV-${orderNumber}</span></div>
            <div style="margin-bottom: 6px;"><strong>Order Date:</strong> ${formattedDate} (${formattedTime})</div>
            <div style="margin-bottom: 6px;"><strong>Payment Method:</strong> ${payLabel}</div>
            <div><strong>Delivery Partner:</strong> BlueDart Air Express</div>
          </div>

          <!-- Items Table -->
          <table class="table">
            <thead>
              <tr>
                <th class="th" style="border-top-left-radius: 8px;">Artisan Craft</th>
                <th class="th" style="text-align: center; width: 50px;">Qty</th>
                <th class="th" style="text-align: right; width: 90px; border-top-right-radius: 8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              ${
                subtotal
                  ? `
              <tr>
                <td colspan="2" style="padding: 8px 14px; text-align: right; color: #78716c;">Items Subtotal:</td>
                <td style="padding: 8px 14px; text-align: right; font-weight: 600;">₹${Number(subtotal).toLocaleString('en-IN')}</td>
              </tr>`
                  : ''
              }
              ${
                discount && Number(discount) > 0
                  ? `
              <tr>
                <td colspan="2" style="padding: 6px 14px; text-align: right; color: #16a34a;">Discount${couponCode ? ` (${couponCode})` : ''}:</td>
                <td style="padding: 6px 14px; text-align: right; color: #16a34a; font-weight: 700;">-₹${Number(discount).toLocaleString('en-IN')}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td colspan="2" style="padding: 6px 14px; text-align: right; color: #78716c;">Shipping:</td>
                <td style="padding: 6px 14px; text-align: right; font-weight: 600;">${Number(shippingCost) > 0 ? '₹' + Number(shippingCost).toLocaleString('en-IN') : 'FREE'}</td>
              </tr>
              <tr style="border-top: 2px solid #7f1d1d;">
                <td colspan="2" style="padding: 12px 14px; text-align: right; font-weight: 900; font-size: 14px; color: #1c1917;">Grand Total:</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 900; font-size: 16px; color: #7f1d1d;">₹${Number(total).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Shipping Address -->
          <div class="address-box">
            <strong style="color: #7f1d1d; font-size: 13px; display: block; margin-bottom: 6px;">📦 Shipping To:</strong>
            ${shippingAddress.name || ''}<br>
            ${shippingAddress.address_line || shippingAddress.address || ''}<br>
            ${shippingAddress.city || ''}, ${shippingAddress.state || ''} - ${shippingAddress.pincode || shippingAddress.zip || ''}<br>
            📞 Phone: ${shippingAddress.phone || 'N/A'}
          </div>

          <!-- Buttons: Download Invoice & Track -->
          <div style="text-align: center; padding: 12px 0 20px;">
            <a href="${invoiceUrl}" target="_blank" class="btn-invoice">
              📥 View &amp; Download Invoice
            </a>
            <a href="${trackingUrl}" target="_blank" class="btn-track">
              🚚 Live Tracking
            </a>
          </div>

          <p style="font-size: 12px; color: #78716c; text-align: center; margin: 0;">
            You can also view or download your invoice anytime by visiting your <a href="${BASE_URL}/profile/orders" style="color: #7f1d1d; font-weight: 700;">My Orders</a> page.
          </p>
        </div>

        <div class="footer">
          © 2026 Trio Enterprises • Jaipur Handicraft Cluster, India<br>
          For patron assistance: <strong>care@trioenterprises.com</strong>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    let res = await client.emails.send({
      from: PRIMARY_FROM,
      to,
      subject: `Order #${orderNumber} Confirmed & Invoice | Trio Enterprises`,
      html,
    });

    if (res.error) {
      console.warn('Resend primary domain failed, retrying fallback:', res.error);
      res = await client.emails.send({
        from: FALLBACK_FROM,
        to,
        subject: `Order #${orderNumber} Confirmed & Invoice | Trio Enterprises`,
        html,
      });
    }

    return res;
  } catch (err) {
    console.error('Order confirmation email sending error:', err);
    return { error: err };
  }
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdate({ to, orderNumber, status, trackingNumber, courierName, trackingUrl }) {
  const client = getResendClient();
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1c1917">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;border-radius:16px 16px 0 0">
        <h1 style="color:#fff;margin:0;font-size:24px">🚚 Shipping Update</h1>
        <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px">Order #${orderNumber}</p>
      </div>
      
      <div style="background:#eff6ff;padding:24px;border:1px solid #3b82f633">
        <div style="background:#fff;padding:20px;border-radius:12px;border:1px solid #e5e7eb;text-align:center">
          <h2 style="margin:0 0 8px;color:#1e40af;font-size:18px">${status}</h2>
          ${trackingNumber ? `<p style="margin:0;font-size:13px;color:#6b7280">Tracking: <strong>${trackingNumber}</strong></p>` : ''}
          ${courierName ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280">Courier: ${courierName}</p>` : ''}
          ${trackingUrl ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;background:#1e40af;color:#fff;text-decoration:none;border-radius:8px;font-size:13px">Track Your Package</a>` : ''}
        </div>
      </div>
      
      <div style="background:#1c1917;padding:20px;text-align:center;border-radius:0 0 16px 16px">
        <p style="color:#a8a29e;font-size:12px;margin:0">Trio Enterprises — Handcrafted with Love in India 🇮🇳</p>
      </div>
    </div>
  `;

  try {
    let res = await client.emails.send({
      from: PRIMARY_FROM,
      to,
      subject: `${status} — Order #${orderNumber} | Trio Enterprises`,
      html,
    });
    if (res.error) {
      res = await client.emails.send({
        from: FALLBACK_FROM,
        to,
        subject: `${status} — Order #${orderNumber} | Trio Enterprises`,
        html,
      });
    }
    return res;
  } catch (err) {
    console.error('Shipping update email error:', err);
    return { error: err };
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail({ to, name }) {
  const client = getResendClient();
  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1c1917">
      <div style="background:linear-gradient(135deg,#7f1d1d,#d97706);padding:40px;text-align:center;border-radius:16px 16px 0 0">
        <h1 style="color:#fef3c7;margin:0;font-size:28px">🙏 Welcome, ${name || 'Artisan Patron'}!</h1>
      </div>
      
      <div style="background:#fffbeb;padding:32px;border:1px solid #f59e0b33;text-align:center">
        <p style="font-size:15px;line-height:1.7;color:#44403c">
          You&apos;re now part of the Trio Enterprises artisan family! Enjoy exclusive access to handcrafted Indian ethnic crafts, 
          devotional essentials, and festive décor.
        </p>
        <div style="margin:24px 0;padding:16px;background:#fef3c7;border-radius:12px;border:2px dashed #d97706">
          <p style="margin:0;font-size:14px;color:#78350f">🎁 Use code <strong style="font-size:18px;color:#7f1d1d">FIRSTBUY</strong> for 15% off your first order!</p>
        </div>
        <a href="${BASE_URL}/shop" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7f1d1d,#b91c1c);color:#fef3c7;text-decoration:none;border-radius:12px;font-size:14px;font-weight:bold">
          Start Shopping →
        </a>
      </div>
      
      <div style="background:#1c1917;padding:20px;text-align:center;border-radius:0 0 16px 16px">
        <p style="color:#a8a29e;font-size:12px;margin:0">Trio Enterprises — Handcrafted with Love in India 🇮🇳</p>
      </div>
    </div>
  `;

  try {
    let res = await client.emails.send({
      from: PRIMARY_FROM,
      to,
      subject: `Welcome to Trio Enterprises, ${name || 'Artisan Patron'}! 🎉`,
      html,
    });
    if (res.error) {
      res = await client.emails.send({
        from: FALLBACK_FROM,
        to,
        subject: `Welcome to Trio Enterprises, ${name || 'Artisan Patron'}! 🎉`,
        html,
      });
    }
    return res;
  } catch (err) {
    console.error('Welcome email error:', err);
    return { error: err };
  }
}
