import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Trio Enterprises <onboarding@resend.dev>';

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation({ to, orderNumber, items, total, shippingAddress }) {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.name}</strong>
          ${item.color ? `<br><small style="color:#6b7280">Color: ${item.color}</small>` : ''}
          ${item.size ? `<br><small style="color:#6b7280">Size: ${item.size}</small>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align:center">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align:right">₹${Number(item.price).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1c1917">
      <div style="background:linear-gradient(135deg,#7f1d1d,#b91c1c);padding:32px;text-align:center;border-radius:16px 16px 0 0">
        <h1 style="color:#fef3c7;margin:0;font-size:24px">🙏 Order Confirmed!</h1>
        <p style="color:#fde68a;margin:8px 0 0;font-size:14px">Order #${orderNumber}</p>
      </div>
      
      <div style="background:#fffbeb;padding:24px;border:1px solid #f59e0b33">
        <p style="margin:0 0 16px;font-size:14px">Namaste! Your artisan order has been confirmed. Our craftsmen are preparing your items with love and care.</p>
        
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#fef3c7">
              <th style="padding:10px;text-align:left">Item</th>
              <th style="padding:10px;text-align:center">Qty</th>
              <th style="padding:10px;text-align:right">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px;font-weight:bold;text-align:right">Total:</td>
              <td style="padding:12px;font-weight:bold;text-align:right;color:#7f1d1d">₹${Number(total).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top:20px;padding:16px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
          <h3 style="margin:0 0 8px;font-size:14px;color:#7f1d1d">📦 Shipping Address</h3>
          <p style="margin:0;font-size:13px;color:#44403c">
            ${shippingAddress.name}<br>
            ${shippingAddress.address || shippingAddress.address_line}<br>
            ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode || shippingAddress.zip}<br>
            📞 ${shippingAddress.phone}
          </p>
        </div>
      </div>
      
      <div style="background:#1c1917;padding:20px;text-align:center;border-radius:0 0 16px 16px">
        <p style="color:#a8a29e;font-size:12px;margin:0">Trio Enterprises — Handcrafted with Love in India 🇮🇳</p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Order Confirmed! #${orderNumber} — Trio Enterprises`,
    html,
  });
}

/**
 * Send shipping update email
 */
export async function sendShippingUpdate({ to, orderNumber, status, trackingNumber, courierName, trackingUrl }) {
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

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${status} — Order #${orderNumber} | Trio Enterprises`,
    html,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail({ to, name }) {
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
        <a href="https://trioenterprises.com/shop" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7f1d1d,#b91c1c);color:#fef3c7;text-decoration:none;border-radius:12px;font-size:14px;font-weight:bold">
          Start Shopping →
        </a>
      </div>
      
      <div style="background:#1c1917;padding:20px;text-align:center;border-radius:0 0 16px 16px">
        <p style="color:#a8a29e;font-size:12px;margin:0">Trio Enterprises — Handcrafted with Love in India 🇮🇳</p>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Welcome to Trio Enterprises, ${name || 'Artisan Patron'}! 🎉`,
    html,
  });
}
