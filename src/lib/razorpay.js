import Razorpay from 'razorpay';
import crypto from 'crypto';

export function cleanRazorpayKey(key) {
  if (!key || typeof key !== 'string') return 'rzp_test_Tai3sx6h51NmJP';
  const trimmed = key.trim();
  const match = trimmed.match(/rzp_(?:test|live)_[a-zA-Z0-9]{14}/);
  return match ? match[0] : trimmed;
}

export function cleanRazorpaySecret(secret) {
  if (!secret || typeof secret !== 'string') return 'Nk05dSzLWbzKzVikmjEp6bXQ';
  const trimmed = secret.trim();
  if (trimmed.length === 48 && trimmed.slice(0, 24) === trimmed.slice(24)) {
    return trimmed.slice(0, 24);
  }
  return trimmed;
}

const rawKeyId =
  process.env.RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  // 'rzp_live_TZUoFoXCMkJNkx'; // Live mode
  'rzp_test_Tai3sx6h51NmJP'; // Test mode

const rawKeySecret =
  process.env.RAZORPAY_KEY_SECRET ||
  // 'g5BmMZv0ain1nbICVUemJiWj'; // Live mode
  'Nk05dSzLWbzKzVikmjEp6bXQ'; // Test mode

export const RAZORPAY_KEY_ID = cleanRazorpayKey(rawKeyId);
export const RAZORPAY_KEY_SECRET = cleanRazorpaySecret(rawKeySecret);

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(amount, currency = 'INR', receipt = '', notes = {}) {
  const options = {
    amount: Math.round(Number(amount) * 100), // Razorpay expects amount in paise
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    throw err;
  }
}

/**
 * Verify Razorpay payment signature (HMAC SHA256)
 */
export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const secret = RAZORPAY_KEY_SECRET || cleanRazorpaySecret(process.env.RAZORPAY_KEY_SECRET);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(body, signature, secret) {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;
  const cleanedWebhookSecret = cleanRazorpaySecret(webhookSecret);
  const expectedSignature = crypto
    .createHmac('sha256', cleanedWebhookSecret)
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
 * Fetch order details from Razorpay
 */
export async function fetchOrder(orderId) {
  return await razorpay.orders.fetch(orderId);
}

/**
 * Fetch payments for a Razorpay order
 */
export async function fetchOrderPayments(orderId) {
  return await razorpay.orders.fetchPayments(orderId);
}

/**
 * Initiate refund
 */
export async function createRefund(paymentId, amount, notes = {}) {
  return await razorpay.payments.refund(paymentId, {
    amount: Math.round(Number(amount) * 100),
    notes,
  });
}
