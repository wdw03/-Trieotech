'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Plus,
  Building,
  Phone,
  User,
  Sparkles,
  QrCode,
  Wallet,
  Loader2
} from 'lucide-react';
import RazorpayCheckout from './RazorpayCheckout';

export default function CheckoutClient() {
  const router = useRouter();
  const { cartItems, subtotal, originalSubtotal, productSavings, couponDiscount, shipping, total, appliedCoupon, clearCart, itemCount = 0 } = useCart();
  const { user, loading, addAddress, addOrder } = useAuth();
  const { addToast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Address | 2: Delivery | 3: Payment | 4: Review
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [razorpayData, setRazorpayData] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.[0]?.id || 'new');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(user?.addresses?.length === 0);
  const [newAddressForm, setNewAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '+91 ',
    address: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    zip: '302001',
    country: 'India',
    isDefault: true
  });

  // Sync address form and selected address when user profile loads
  useEffect(() => {
    if (user) {
      setNewAddressForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone && prev.phone !== '+91 ' ? prev.phone : (user.phone || '+91 '),
      }));
      if (user.addresses?.length > 0 && (selectedAddressId === 'new' || !selectedAddressId) && !isAddingNewAddress) {
        setSelectedAddressId(user.addresses[0].id);
      }
    }
  }, [user]);

  // Delivery Method State
  const [deliveryMethod, setDeliveryMethod] = useState('express'); // 'express' | 'standard'

  // Payment Method State — Razorpay handles UPI/Card/NetBanking UI
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'

  // Shiprocket Dynamic Shipping Rates State
  const [shippingRates, setShippingRates] = useState(null);
  const [isLoadingShippingRates, setIsLoadingShippingRates] = useState(false);

  // COD Availability State (Unavailable by default)
  const [isCodAvailable, setIsCodAvailable] = useState(false);
  const [isCheckingCod, setIsCheckingCod] = useState(false);
  const [codStatusMessage, setCodStatusMessage] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  // Crash recovery & reconciliation:
  // If user paid on Razorpay and page crashed/closed, detect pending transaction on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pendingRaw = localStorage.getItem('trio_pending_checkout');
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      const isRecent = pending.createdAt && (Date.now() - pending.createdAt) < 2 * 3600 * 1000;

      if (isRecent && (pending.orderId || pending.razorpayOrderId)) {
        setIsReconciling(true);
        fetch('/api/payments/reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: pending.orderId,
            razorpayOrderId: pending.razorpayOrderId,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.status === 'confirmed') {
              localStorage.removeItem('trio_pending_checkout');
              clearCart();
              addToast('Payment verified! Redirecting to your confirmed order...', 'success');
              router.push(`/order-success/${data.orderNumber || data.orderId}`);
            } else if (data.status === 'payment_failed') {
              localStorage.removeItem('trio_pending_checkout');
            }
          })
          .catch((err) => {
            console.warn('Reconciliation check notice:', err);
          })
          .finally(() => {
            setIsReconciling(false);
          });
      } else {
        localStorage.removeItem('trio_pending_checkout');
      }
    } catch (_) {
      localStorage.removeItem('trio_pending_checkout');
    }
  }, [router, clearCart, addToast]);

  // If cart is empty, redirect (unless currently reconciling or having pending checkout)
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('trio_pending_checkout')) {
      return;
    }
    if (cartItems.length === 0 && !isReconciling) {
      router.push('/cart');
    }
  }, [cartItems, router, isReconciling]);

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      addToast('Please login to your account to complete checkout', 'info');
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
    }
  }, [user, loading, router, addToast]);

  const matchedAddress =
    selectedAddressId && selectedAddressId !== 'new' && Array.isArray(user?.addresses)
      ? user.addresses.find((a) => a && a.id === selectedAddressId)
      : null;

  const activeShippingAddress =
    matchedAddress ||
    (Array.isArray(user?.addresses) && user.addresses[0]) ||
    newAddressForm ||
    {};

  const activePincode =
    activeShippingAddress?.zip ||
    activeShippingAddress?.pincode ||
    newAddressForm?.zip ||
    '';

  // Check Shiprocket dynamic rates & COD availability whenever shipping pincode changes
  useEffect(() => {
    let isCancelled = false;
    const cleanPin = String(activePincode).trim().replace(/\D/g, '');

    if (!cleanPin || cleanPin.length !== 6) {
      setIsCodAvailable(false);
      setCodStatusMessage('Please enter a valid 6-digit delivery pincode');
      setShippingRates(null);
      if (paymentMethod === 'cod') {
        setPaymentMethod('razorpay');
      }
      return;
    }

    setIsCheckingCod(true);
    setIsLoadingShippingRates(true);

    fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems.map((item) => ({
          productId: item.productId || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        pincode: cleanPin,
        deliveryMethod,
        cod: paymentMethod === 'cod',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setShippingRates(data);
          const codOk = data.isCodAvailable !== false;
          setIsCodAvailable(codOk);
          setCodStatusMessage(
            codOk
              ? `Cash on Delivery available via ${data.courierName || data.standardCourier || 'Shiprocket Logistics'}`
              : `Cash on Delivery is unavailable for PIN ${cleanPin}. Prepaid is fully supported.`
          );
          if (!codOk && paymentMethod === 'cod') {
            setPaymentMethod('razorpay');
          }
        }
      })
      .catch((err) => {
        console.warn('Shipping rate fetch error:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCheckingCod(false);
          setIsLoadingShippingRates(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activePincode, paymentMethod, cartItems, deliveryMethod]);

  const standardCost = typeof shippingRates?.standardRate === 'number' ? shippingRates.standardRate : shipping;
  const expressCost = typeof shippingRates?.expressRate === 'number' ? shippingRates.expressRate : Math.round(standardCost + (itemCount * 40));
  const effectiveShippingCost = deliveryMethod === 'express' ? expressCost : standardCost;
  const finalTotal = Math.max(0, subtotal - couponDiscount + effectiveShippingCost);

  // Step Navigators
  const handleNextToDelivery = async (e) => {
    e?.preventDefault?.();
    if (selectedAddressId === 'new') {
      if (!newAddressForm.name || !newAddressForm.phone || !newAddressForm.address || !newAddressForm.zip) {
        addToast('Please fill all required address fields', 'error');
        return;
      }
      if (user && addAddress) {
        try {
          const added = await addAddress(newAddressForm);
          if (added && added.id) {
            setSelectedAddressId(added.id);
            setIsAddingNewAddress(false);
          }
        } catch (err) {
          console.error('Failed to save address:', err);
        }
      }
    }
    setCurrentStep(2);
  };

  const handleNextToPayment = () => {
    setCurrentStep(3);
  };

  const handleNextToReview = () => {
    if (paymentMethod === 'cod' && !isCodAvailable) {
      addToast(`Cash on Delivery is unavailable for PIN ${activePincode || 'this address'}. Please select UPI or Card.`, 'error');
      return;
    }
    setCurrentStep(4);
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;

    if (!user) {
      addToast('Please login to place your order', 'error');
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }

    if (paymentMethod === 'cod' && !isCodAvailable) {
      addToast(`Cash on Delivery is not available for PIN ${activePincode || 'this address'}. Please choose UPI or Card.`, 'error');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const isCod = paymentMethod === 'cod';

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          addressId: selectedAddressId !== 'new' ? selectedAddressId : undefined,
          shippingAddress: {
            ...activeShippingAddress,
            name: activeShippingAddress?.name || newAddressForm?.name || user?.name || 'Valued Customer',
            phone: activeShippingAddress?.phone || newAddressForm?.phone || user?.phone || '',
            address: activeShippingAddress?.address || activeShippingAddress?.address_line || newAddressForm?.address || '',
            city: activeShippingAddress?.city || newAddressForm?.city || '',
            state: activeShippingAddress?.state || newAddressForm?.state || '',
            zip: activeShippingAddress?.zip || activeShippingAddress?.pincode || newAddressForm?.zip || '',
            email: user?.email || '',
          },
          deliveryMethod,
          paymentMethod: isCod ? 'cod' : 'razorpay',
          couponCode: appliedCoupon?.code,
          items: cartItems,
          shippingCost: effectiveShippingCost,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        addToast(data.error || 'Failed to initialize order. Please try again.', 'error');
        setIsPlacingOrder(false);
        return;
      }

      // COD Flow
      if (isCod) {
        const orderId = data.orderNumber || data.orderId;
        const trackingNumber = data.awbNumber || `BLUEDART-EXP-${Math.floor(10000000 + Math.random() * 90000000)}`;

        const newOrder = {
          id: orderId,
          dbId: data.orderId,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          status: "Confirmed",
          trackingNumber,
          carrier: data.courierName || shippingRates?.standardCourier || "Shiprocket Express Courier",
          items: cartItems.map(item => ({
            productId: item.productId || item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            color: item.color,
            size: item.size
          })),
          subtotal,
          discount: couponDiscount,
          shipping: effectiveShippingCost,
          tax: 0,
          total: finalTotal,
          shippingAddress: activeShippingAddress,
          paymentMethod: 'Cash on Delivery (COD)',
          estimatedDelivery: new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
        };

        if (user && addOrder) {
          addOrder(newOrder);
        }
        clearCart();
        addToast('Order placed successfully with Cash on Delivery!', 'success');
        router.push(`/order-success/${orderId}`);
        return;
      }

      // Online Razorpay Flow
      // Store pending checkout in localStorage so that if browser crashes or mobile kills the page after payment,
      // the app will auto-reconcile and complete the order immediately upon returning!
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'trio_pending_checkout',
          JSON.stringify({
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            razorpayOrderId: data.razorpayOrderId,
            amount: data.amount,
            createdAt: Date.now(),
          })
        );
      }

      setRazorpayData({
        orderId: data.orderId,
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency || 'INR',
        orderNumber: data.orderNumber,
        keyId: data.keyId,
        orderData: data.orderData,
        userEmail: user?.email || activeShippingAddress?.email || '',
        userName: user?.name || activeShippingAddress?.name || newAddressForm?.name || 'Valued Customer',
        userPhone: user?.phone || activeShippingAddress?.phone || newAddressForm?.phone || '',
      });
    } catch (err) {
      console.error('Order placement error:', err);
      addToast('An unexpected error occurred. Please try again.', 'error');
      setIsPlacingOrder(false);
    }
  };

  const steps = [
    { num: 1, label: 'Delivery Address', icon: MapPin },
    { num: 2, label: 'Delivery Method', icon: Truck },
    { num: 3, label: 'Payment Options', icon: CreditCard },
    { num: 4, label: 'Review & Confirm', icon: CheckCircle2 }
  ];

  if (!isMounted || loading || !user || isReconciling) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold-600" />
        <p className="font-serif text-stone-700 dark:text-ivory-100 text-sm font-semibold">
          {isReconciling ? 'Verifying your payment status with gateway...' : 'Verifying your account session...'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">

      <Breadcrumb items={[{ name: 'Cart', url: '/cart' }, { name: 'Checkout', url: '/checkout' }]} />

      {/* Checkout Progress Stepper */}
      <div className="ethnic-card p-3.5 sm:p-6 rounded-3xl w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full min-w-0">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center gap-1 text-center min-w-0 shrink-0">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${isCompleted
                        ? 'bg-emerald-700 text-white shadow-emerald-950/30'
                        : isCurrent
                          ? 'bg-maroon-700 text-white shadow-maroon-md ring-2 sm:ring-4 ring-gold-500/30'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                      }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <span
                    className={`text-[9px] sm:text-xs font-bold max-w-[65px] sm:max-w-none truncate ${isCurrent
                        ? 'text-maroon-800 dark:text-gold-400'
                        : isCompleted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-stone-400'
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 sm:mx-4 min-w-[12px] transition-colors ${currentStep > idx + 1 ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'
                      }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Multi-Step Interactive Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* STEP 1: Shipping Address */}
          {currentStep === 1 && (
            <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
                <div className="space-y-0.5">
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
                    Step 1: Choose Delivery Address
                  </h2>
                  <p className="text-xs text-stone-500">Select where your handcrafted parcel should arrive.</p>
                </div>
                <MapPin className="w-5 h-5 text-gold-600" />
              </div>

              {/* Saved Address Cards */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    Saved Addresses in Your Account:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {user.addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${selectedAddressId === addr.id
                            ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30 shadow-xs'
                            : 'border-gold-500/20 hover:border-gold-500/50'
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900 dark:text-ivory-100">{addr.name}</span>
                            <input
                              type="radio"
                              name="shippingAddress"
                              checked={selectedAddressId === addr.id}
                              onChange={() => {
                                setSelectedAddressId(addr.id);
                                setIsAddingNewAddress(false);
                              }}
                              className="accent-maroon-700"
                            />
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            {addr.address}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                          <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5 whitespace-nowrap pt-0.5">
                            <Phone className="w-3 h-3 text-gold-600 shrink-0" />
                            <span>{addr.phone}</span>
                          </p>
                        </div>
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId('new');
                        setIsAddingNewAddress(true);
                      }}
                      className={`p-4 rounded-2xl border-2 border-dashed border-gold-500/40 flex items-center justify-center gap-2 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:bg-gold-500/10 transition-colors ${selectedAddressId === 'new' ? 'bg-gold-500/10 border-gold-500' : ''
                        }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Delivery Address</span>
                    </button>
                  </div>
                </div>
              )}

              {/* New Address Input Form */}
              {(selectedAddressId === 'new' || !user?.addresses?.length) && (
                <form onSubmit={handleNextToDelivery} className="space-y-4 pt-2">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    Enter New Shipping Details:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Radhika Singhania"
                        value={newAddressForm.name}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">Mobile Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98234 56789"
                        value={newAddressForm.phone}
                        onFocus={() => {
                          if (!newAddressForm.phone || newAddressForm.phone.trim() === '') {
                            setNewAddressForm(prev => ({ ...prev, phone: '+91 ' }));
                          }
                        }}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">Door / Flat No, Building, Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 402, Royal Palms Residency, MG Road"
                      value={newAddressForm.address}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">City / District *</label>
                      <input
                        type="text"
                        required
                        placeholder="Jaipur"
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="Rajasthan"
                        value={newAddressForm.state}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">PIN Code *</label>
                        {isCheckingCod && (
                          <span className="text-[10px] text-maroon-700 dark:text-gold-400 font-medium flex items-center gap-1 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking PIN...
                          </span>
                        )}
                        {!isCheckingCod && newAddressForm.zip && String(newAddressForm.zip).replace(/\D/g, '').length === 6 && (
                          <span className={`text-[10px] font-bold ${isCodAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {isCodAvailable ? '✓ COD Available' : '✓ Prepaid Delivery'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="302001"
                        value={newAddressForm.zip}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, zip: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Proceed to Delivery Method</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {selectedAddressId !== 'new' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNextToDelivery}
                    className="w-full sm:w-auto btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>Use Selected Address &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Delivery Method */}
          {currentStep === 2 && (
            <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
                <div className="space-y-0.5">
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
                    Step 2: Choose Shipping Speed
                  </h2>
                  <p className="text-xs text-stone-500">Reliable logistics partners: BlueDart &amp; Delhivery Air Express.</p>
                </div>
                <Truck className="w-5 h-5 text-gold-600" />
              </div>

              <div className="space-y-3">
                {isLoadingShippingRates && (
                  <div className="p-3 rounded-xl bg-gold-50/60 dark:bg-gold-950/20 border border-gold-500/30 flex items-center gap-2 text-xs text-gold-800 dark:text-gold-300 font-semibold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-gold-600" />
                    <span>Checking live courier rates from Shiprocket for PIN {activePincode}...</span>
                  </div>
                )}

                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${deliveryMethod === 'express'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30 shadow-xs'
                      : 'border-gold-500/20 hover:border-gold-500/40'
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'express'}
                      onChange={() => setDeliveryMethod('express')}
                      className="accent-maroon-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                          {shippingRates?.expressCourier || 'BlueDart Air Express'}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Fastest Air
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Estimated delivery: {shippingRates?.expressEtd || '2-3 business days'} (Live via Shiprocket)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs sm:text-sm text-maroon-800 dark:text-gold-400">
                      ₹{expressCost}
                    </span>
                    {itemCount > 1 && (
                      <span className="block text-[10px] text-stone-400 font-normal">
                        ({itemCount} units)
                      </span>
                    )}
                  </div>
                </label>

                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${deliveryMethod === 'standard'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30 shadow-xs'
                      : 'border-gold-500/20 hover:border-gold-500/40'
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'standard'}
                      onChange={() => setDeliveryMethod('standard')}
                      className="accent-maroon-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                          {shippingRates?.standardCourier || 'Standard Surface Delivery'}
                        </span>
                        <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold px-2 py-0.5 rounded-full">
                          Economical
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Estimated delivery: {shippingRates?.standardEtd || '5-7 business days'} (Live via Shiprocket)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                      ₹{standardCost}
                    </span>
                    {itemCount > 1 && (
                      <span className="block text-[10px] text-stone-400 font-normal">
                        ({itemCount} units)
                      </span>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
                >
                  Back to Address
                </button>
                <button
                  type="button"
                  onClick={handleNextToPayment}
                  className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Options */}
          {currentStep === 3 && (
            <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
                <div className="space-y-0.5">
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
                    Step 3: Select Payment Method
                  </h2>
                  <p className="text-xs text-stone-500">All transactions are encrypted with 256-bit SSL security via Razorpay.</p>
                </div>
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-3">
                {/* Online Payment (Razorpay — handles UPI, Card, NetBanking, Wallet) */}
                <label
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'razorpay'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30 shadow-xs'
                      : 'border-gold-500/20 hover:border-gold-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-maroon-700 w-4 h-4"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                            Pay Online (UPI / Card / NetBanking)
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            ✓ Recommended • Instant
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1">Google Pay, PhonePe, Paytm, BHIM UPI, all Debit/Credit Cards, NetBanking & Wallets.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <QrCode className="w-4 h-4 text-gold-600" />
                      <CreditCard className="w-4 h-4 text-gold-600" />
                    </div>
                  </div>

                  {paymentMethod === 'razorpay' && (
                    <div className="mt-3 pt-3 pl-7 border-t border-gold-500/15 space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Visa', 'Mastercard', 'RuPay'].map((name) => (
                          <span key={name} className="text-[10px] bg-ivory-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-lg font-medium border border-gold-500/15">
                            {name}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Secured by Razorpay • RBI compliant • Zero surcharge
                      </p>
                    </div>
                  )}
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-2.5 ${!isCodAvailable
                      ? 'opacity-65 bg-stone-100/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 cursor-not-allowed'
                      : paymentMethod === 'cod'
                        ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30 cursor-pointer shadow-xs'
                        : 'border-gold-500/20 cursor-pointer hover:border-gold-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        disabled={!isCodAvailable}
                        checked={paymentMethod === 'cod'}
                        onChange={() => {
                          if (isCodAvailable) {
                            setPaymentMethod('cod');
                          }
                        }}
                        className="accent-maroon-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed w-4 h-4"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                            Cash on Delivery (COD)
                          </span>
                          {isCheckingCod ? (
                            <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking PIN...
                            </span>
                          ) : isCodAvailable ? (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                              ✓ Available for PIN {activePincode}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                              ✕ Unavailable for PIN {activePincode || 'this address'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {isCodAvailable
                            ? 'Pay in cash or UPI QR directly to the delivery executive upon arrival.'
                            : 'COD is currently unavailable for this pincode. Please pay online.'}
                        </p>
                      </div>
                    </div>
                    <Wallet className={`w-5 h-5 shrink-0 ${isCodAvailable ? 'text-gold-600' : 'text-stone-400'}`} />
                  </div>

                  {!isCodAvailable && (
                    <div className="pt-2 pl-7 border-t border-stone-200 dark:border-stone-800 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                      <span>⚠️ Only prepaid orders (UPI / Card) are serviceable at PIN <strong>{activePincode || 'your location'}</strong>.</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
                >
                  Back to Shipping
                </button>
                <button
                  type="button"
                  onClick={handleNextToReview}
                  className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <span>Review Final Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Place Order */}
          {currentStep === 4 && (
            <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
                <div className="space-y-0.5">
                  <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
                    Step 4: Final Order Review
                  </h2>
                  <p className="text-xs text-stone-500">Please review your parcel details before confirming.</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>

              {/* Delivery Address Review */}
              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-stone-900 dark:text-ivory-100">
                  <span className="flex items-center gap-1.5 text-maroon-700 dark:text-gold-400">
                    <MapPin className="w-3.5 h-3.5" /> Delivering to:
                  </span>
                  <button onClick={() => setCurrentStep(1)} className="text-gold-700 underline text-[11px]">
                    Change
                  </button>
                </div>
                <p className="text-xs font-bold text-stone-800 dark:text-ivory-100">
                  {activeShippingAddress?.name || newAddressForm?.name || user?.name || 'Valued Customer'}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {[
                    activeShippingAddress?.address || activeShippingAddress?.address_line || newAddressForm?.address,
                    activeShippingAddress?.city || newAddressForm?.city,
                    activeShippingAddress?.state || newAddressForm?.state,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  {activeShippingAddress?.zip || activeShippingAddress?.pincode || newAddressForm?.zip
                    ? ` - ${activeShippingAddress?.zip || activeShippingAddress?.pincode || newAddressForm?.zip}`
                    : ''}
                </p>
                <p className="text-[11px] text-stone-500">
                  Contact: {activeShippingAddress?.phone || newAddressForm?.phone || user?.phone || 'N/A'}
                </p>
              </div>

              {/* Payment Review */}
              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-stone-900 dark:text-ivory-100">
                  <span className="flex items-center gap-1.5 text-maroon-700 dark:text-gold-400">
                    <CreditCard className="w-3.5 h-3.5" /> Payment Method:
                  </span>
                  <button onClick={() => setCurrentStep(3)} className="text-gold-700 underline text-[11px]">
                    Change
                  </button>
                </div>
                <p className="text-xs font-bold text-stone-800 dark:text-ivory-100 uppercase">
                  {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment — UPI / Card / NetBanking (Razorpay)'}
                </p>
              </div>

              {/* Shipping Option Review */}
              <div className="p-4 rounded-2xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-stone-900 dark:text-ivory-100">
                  <span className="flex items-center gap-1.5 text-maroon-700 dark:text-gold-400">
                    <Truck className="w-3.5 h-3.5" /> Shipping Option:
                  </span>
                  <button onClick={() => setCurrentStep(2)} className="text-gold-700 underline text-[11px]">
                    Change
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <p className="font-bold text-stone-800 dark:text-ivory-100">
                    {deliveryMethod === 'express' ? 'Air Express Delivery (2-3 days)' : 'Standard Surface Delivery (4-7 days)'}
                    <span className="font-normal text-stone-500 text-[11px] ml-1.5">
                      ({itemCount} {itemCount === 1 ? 'item' : 'items'} × {deliveryMethod === 'express' ? '₹110' : '₹70'})
                    </span>
                  </p>
                  <span className="font-bold text-maroon-800 dark:text-gold-400">₹{effectiveShippingCost}</span>
                </div>
              </div>

              {/* Items List Snapshot */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Order Items ({cartItems.length}):
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map(item => (
                    <div key={item.cartItemId} className="flex items-center justify-between text-xs p-2 rounded-xl bg-ivory-50 dark:bg-stone-900/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={item?.image || '/placeholder.png'} alt={item?.name || 'Product'} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <span className="font-semibold text-stone-900 dark:text-ivory-100 truncate">{item?.name || 'Artisan Product'} (x{item?.quantity || 1})</span>
                      </div>
                      <span className="font-serif font-bold text-maroon-800 dark:text-gold-400 shrink-0">
                        ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Confirm Button */}
              <div className="pt-4 border-t border-gold-500/20 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full sm:flex-1 btn-gold py-3.5 px-8 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-gold-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Securing Order with Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{paymentMethod === 'cod' ? 'Confirm COD Order' : 'Proceed to Payment'} (₹{finalTotal?.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Order Summary Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="ethnic-card p-6 rounded-3xl space-y-4 sticky top-28">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-ivory-100 pb-2 border-b border-gold-500/20">
              Cart Summary
            </h3>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900 dark:text-ivory-100">₹{subtotal?.toLocaleString('en-IN')}</span>
              </div>
              {productSavings > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Product Savings</span>
                  <span>-₹{productSavings?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <div className="flex flex-col">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    {appliedCoupon?.applicableProductNames?.length > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Applied to {appliedCoupon.applicableProductNames.length} eligible item(s)
                      </span>
                    )}
                  </div>
                  <span>-₹{couponDiscount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              {appliedCoupon && couponDiscount === 0 && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                  Coupon <strong>{appliedCoupon.code}</strong> is not eligible for the items in this order.
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span>Shipping Fee {itemCount > 0 ? `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : ''}</span>
                  <span className="text-[10px] text-stone-400">
                    {deliveryMethod === 'express'
                      ? (shippingRates?.expressCourier || 'Air Express')
                      : (shippingRates?.standardCourier || 'Surface Shipping')}
                    {itemCount > 1 && (
                      <span className="text-gold-700 dark:text-gold-400 font-medium">
                        {' '}• ₹{deliveryMethod === 'express' ? 110 : 70} × {itemCount} units
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-semibold text-stone-900 dark:text-ivory-100 flex items-center gap-1.5">
                  {isLoadingShippingRates ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-600" />
                  ) : (
                    `₹${effectiveShippingCost}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm font-serif font-black text-stone-900 dark:text-ivory-100 pt-2 border-t border-gold-500/20">
                <span>Total Due</span>
                <span className="text-lg text-maroon-800 dark:text-gold-400">₹{finalTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-stone-500 space-y-1.5">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
                Guaranteed genuine artisan handicrafts
              </p>
              <p className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-gold-600" />
                Dispatched with tracking in 24 hours
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Razorpay Modal Trigger Component */}
      {razorpayData && (
        <RazorpayCheckout
          {...razorpayData}
          onSuccess={(result) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('trio_pending_checkout');
            }
            const orderId = result.orderNumber || razorpayData.orderNumber || result.orderId;
            const trackingNumber = result.awbNumber || `BLUEDART-EXP-${Math.floor(10000000 + Math.random() * 90000000)}`;
            if (user && addOrder) {
              addOrder({
                id: orderId,
                dbId: result.orderId || razorpayData.orderId,
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
                status: "Confirmed",
                trackingNumber,
                carrier: result.courierName || "Shiprocket Express Courier",
                items: cartItems,
                total: razorpayData.amount,
                shippingAddress: activeShippingAddress,
                paymentMethod: 'Razorpay Online Payment',
              });
            }
            clearCart();
            setIsPlacingOrder(false);
            setRazorpayData(null);
            addToast('Payment verified successfully! Your order is placed.', 'success');
            router.push(`/order-success/${orderId}`);
          }}
          onFailure={(err) => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('trio_pending_checkout');
            }
            setIsPlacingOrder(false);
            setRazorpayData(null);
            addToast(err?.error || 'Payment failed or cancelled. Please try again.', 'error');
          }}
          onDismiss={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('trio_pending_checkout');
            }
            setIsPlacingOrder(false);
            setRazorpayData(null);
            addToast('Payment window closed.', 'info');
          }}
        />
      )}
    </div>
  );
};


