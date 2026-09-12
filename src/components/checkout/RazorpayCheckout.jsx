'use client';
import React, { useEffect, useRef } from 'react';

/**
 * Loads Razorpay Checkout SDK script with Promise
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) return resolve(true);
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      // Fallback timeout in case event listener missed
      setTimeout(() => {
        resolve(!!window.Razorpay);
      }, 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function cleanRazorpayKey(key) {
  if (!key || typeof key !== 'string') return 'rzp_test_Tai3sx6h51NmJP';
  const trimmed = key.trim();
  const match = trimmed.match(/rzp_(?:test|live)_[a-zA-Z0-9]{14}/);
  return match ? match[0] : trimmed;
}

/**
 * Razorpay Checkout Component
 * Reliably loads the Razorpay SDK, opens payment modal once,
 * and handles payment completion / failure / dismissal gracefully.
 */
export default function RazorpayCheckout({
  razorpayOrderId,
  amount,
  currency = 'INR',
  orderId,
  orderNumber,
  keyId,
  orderData,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onFailure,
  onDismiss,
}) {
  // Store latest callbacks in refs so changing closures don't trigger unmount / re-runs
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onFailureRef.current = onFailure;
    onDismissRef.current = onDismiss;
  }, [onSuccess, onFailure, onDismiss]);

  // Flag to avoid firing onDismiss when modal closes automatically upon payment success or failure
  const isPaymentHandledRef = useRef(false);
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    if (!razorpayOrderId || hasOpenedRef.current) return;

    loadRazorpayScript().then((loaded) => {
      if (isCancelled || hasOpenedRef.current) return;

      if (!loaded || !window.Razorpay) {
        onFailureRef.current?.({ error: 'Failed to load Razorpay SDK. Please check your internet connection.' });
        return;
      }

      hasOpenedRef.current = true;

      // Clean phone number for Razorpay prefill
      const cleanPhone = (userPhone || '').replace(/\D/g, '').slice(-10);

      // Clean active key (Sanitize against accidental duplicate paste)
      const rawKey = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Tai3sx6h51NmJP';
      const activeKey = cleanRazorpayKey(rawKey);

      const options = {
        key: activeKey,
        amount: Math.round(Number(amount) * 100), // paise
        currency: currency || 'INR',
        name: 'Trio Enterprises',
        description: `Order #${orderNumber || ''}`,
        order_id: razorpayOrderId,
        image: '/logo.png',
        prefill: {
          name: userName || 'Valued Customer',
          email: userEmail || '',
          contact: cleanPhone || '',
        },
        notes: {
          order_number: orderNumber,
          order_id: orderId || '',
        },
        theme: {
          color: '#4a0404',
          backdrop_color: 'rgba(0,0,0,0.7)',
        },
        modal: {
          ondismiss: () => {
            // Only trigger onDismiss if payment was NOT completed or failed
            if (!isPaymentHandledRef.current) {
              onDismissRef.current?.();
            }
          },
        },
        handler: async (response) => {
          // Payment successful on Razorpay — mark handled so ondismiss doesn't cancel flow
          isPaymentHandledRef.current = true;

          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
                orderData,
              }),
            });

            const result = await verifyRes.json();

            if (verifyRes.ok && result.success) {
              onSuccessRef.current?.(result);
            } else {
              onFailureRef.current?.({ error: result.error || 'Payment signature verification failed' });
            }
          } catch (err) {
            console.error('Verification network error:', err);
            onFailureRef.current?.({ error: 'Payment verification failed due to network error.' });
          }
        },
      };

      try {
        const rzp = new window.Razorpay(options);

        rzp.on('payment.failed', (response) => {
          console.error('Razorpay payment failed callback:', response);
          isPaymentHandledRef.current = true;
          onFailureRef.current?.({
            error: response.error?.description || response.error?.reason || 'Payment failed. Please try again.',
            code: response.error?.code,
            reason: response.error?.reason,
          });
        });

        rzp.open();
      } catch (err) {
        console.error('Error opening Razorpay modal:', err);
        onFailureRef.current?.({ error: 'Could not open payment window: ' + (err.message || 'Unknown error') });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    razorpayOrderId,
    amount,
    currency,
    orderId,
    orderNumber,
    keyId,
    orderData,
    userEmail,
    userName,
    userPhone,
  ]);

  return null;
}
