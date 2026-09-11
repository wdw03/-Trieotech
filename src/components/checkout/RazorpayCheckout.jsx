'use client';
import React, { useEffect, useCallback } from 'react';

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

/**
 * Razorpay Checkout Component
 * Loads the Razorpay script reliably and opens payment modal
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
  const openPayment = useCallback(() => {
    if (!window.Razorpay) {
      console.error('Razorpay SDK not loaded');
      onFailure?.({ error: 'Payment gateway could not be loaded. Please refresh the page.' });
      return;
    }

    // Clean phone number for Razorpay prefill
    const cleanPhone = (userPhone || '').replace(/\D/g, '').slice(-10);

    // Live fallback: 'rzp_live_TZUoFoXCMkJNkx'
    const activeKey = keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Tai3sx6h51NmJP';

    const options = {
      key: activeKey,
      amount: Math.round(Number(amount) * 100), // paise
      currency: currency || 'INR',
      name: 'Trio Enterprises',
      description: `Order #${orderNumber}`,
      order_id: razorpayOrderId,
      image: '/logo.png',
      prefill: {
        name: userName || '',
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
          onDismiss?.();
        },
      },
      handler: async (response) => {
        // Payment successful — verify on same-origin server
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
            onSuccess?.(result);
          } else {
            onFailure?.({ error: result.error || 'Payment signature verification failed' });
          }
        } catch (err) {
          console.error('Verification network error:', err);
          onFailure?.({ error: 'Payment verification failed due to network error.' });
        }
      },
    };

    try {
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed callback:', response);
        onFailure?.({
          error: response.error?.description || response.error?.reason || 'Payment failed',
          code: response.error?.code,
          reason: response.error?.reason,
        });
      });

      rzp.open();
    } catch (err) {
      console.error('Error opening Razorpay modal:', err);
      onFailure?.({ error: 'Could not open payment window: ' + (err.message || 'Unknown error') });
    }
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
    onSuccess,
    onFailure,
    onDismiss,
  ]);

  // Load script and trigger modal
  useEffect(() => {
    let isMounted = true;

    if (razorpayOrderId) {
      loadRazorpayScript().then((loaded) => {
        if (!isMounted) return;
        if (!loaded) {
          onFailure?.({ error: 'Failed to load Razorpay SDK. Please check your internet connection.' });
          return;
        }
        // Small tick to ensure window.Razorpay is ready
        setTimeout(() => {
          if (isMounted) {
            openPayment();
          }
        }, 100);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [razorpayOrderId, openPayment, onFailure]);

  return null;
}
