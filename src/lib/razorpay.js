import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(amount, currency = 'INR', receipt = '', notes = {}) {
  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes,
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verify Razorpay payment signature (HMAC SHA256)
 */
export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const crypto = require('crypto');
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(body, signature, secret) {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret || process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Fetch payment details from Razorpay
 */
export async function fetchPayment(paymentId) {
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Initiate refund
 */
export async function createRefund(paymentId, amount, notes = {}) {
  return await razorpay.payments.refund(paymentId, {
    amount: Math.round(amount * 100),
    notes,
  });
}
