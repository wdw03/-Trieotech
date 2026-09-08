'use client';
import React, { useEffect, useCallback } from 'react';

/**
 * Razorpay Checkout Component
 * Loads the Razorpay script and opens payment modal
 */
export default function RazorpayCheckout({
  razorpayOrderId,
  amount,
  currency = 'INR',
  orderId,
  orderNumber,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onFailure,
  onDismiss,
}) {
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const openPayment = useCallback(() => {
    if (!window.Razorpay) {
      console.error('Razorpay SDK not loaded');
      onFailure?.({ error: 'Payment SDK not loaded. Please refresh.' });
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TZUoFoXCMkJNkx',
      amount: Math.round(amount * 100), // paise
      currency,
      name: 'Trio Enterprises',
      description: `Order ${orderNumber}`,
      order_id: razorpayOrderId,
      image: '/logo.png',
      prefill: {
        name: userName || '',
        email: userEmail || '',
        contact: userPhone || '',
      },
      notes: {
        order_number: orderNumber,
        order_id: orderId,
      },
      theme: {
        color: '#7f1d1d',
        backdrop_color: 'rgba(0,0,0,0.6)',
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
        },
      },
      handler: async (response) => {
        // Payment successful — verify on server
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
          const verifyRes = await fetch(`${apiBase}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            }),
          });

          const result = await verifyRes.json();

          if (verifyRes.ok && result.success) {
            onSuccess?.(result);
          } else {
            onFailure?.({ error: result.error || 'Payment verification failed' });
          }
        } catch (err) {
          onFailure?.({ error: 'Payment verification error' });
        }
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      onFailure?.({
        error: response.error?.description || 'Payment failed',
        code: response.error?.code,
        reason: response.error?.reason,
      });
    });

    rzp.open();
  }, [razorpayOrderId, amount, currency, orderId, orderNumber, userEmail, userName, userPhone, onSuccess, onFailure, onDismiss]);

  // Auto-open on mount
  useEffect(() => {
    if (razorpayOrderId) {
      // Small delay to ensure Razorpay script is loaded
      const timer = setTimeout(() => {
        openPayment();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [razorpayOrderId, openPayment]);

  return null; // This component renders nothing — it only manages the Razorpay modal
}
