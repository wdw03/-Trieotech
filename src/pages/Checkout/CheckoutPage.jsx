import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
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
  Wallet
} from 'lucide-react';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, originalSubtotal, productSavings, couponDiscount, shipping, total, appliedCoupon, clearCart } = useCart();
  const { user, addAddress, addOrder } = useAuth();
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1); // 1: Address | 2: Delivery | 3: Payment | 4: Review

  // Address Selection & Form State
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.[0]?.id || 'new');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(user?.addresses?.length === 0);
  const [newAddressForm, setNewAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    zip: '302001',
    country: 'India',
    isDefault: true
  });

  // Delivery Method State
  const [deliveryMethod, setDeliveryMethod] = useState('express'); // 'express' | 'standard'

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod' | 'netbanking'
  const [upiId, setUpiId] = useState('user@okaxis');
  const [cardDetails, setCardDetails] = useState({
    number: '4532 •••• •••• 8921',
    name: user?.name || 'Radhika Singhania',
    expiry: '08/29',
    cvv: '•••'
  });

  // If cart is empty, redirect
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const activeShippingAddress = selectedAddressId !== 'new' && user?.addresses
    ? user.addresses.find(a => a.id === selectedAddressId)
    : newAddressForm;

  // Step Navigators
  const handleNextToDelivery = (e) => {
    e.preventDefault();
    if (selectedAddressId === 'new') {
      if (!newAddressForm.name || !newAddressForm.phone || !newAddressForm.address || !newAddressForm.zip) {
        addToast('Please fill all required address fields', 'error');
        return;
      }
      if (user) {
        const added = addAddress(newAddressForm);
        setSelectedAddressId(added.id);
      }
    }
    setCurrentStep(2);
  };

  const handleNextToPayment = () => {
    setCurrentStep(3);
  };

  const handleNextToReview = () => {
    setCurrentStep(4);
  };

  const handlePlaceOrder = () => {
    const orderId = `TRIO-${Math.floor(10000 + Math.random() * 90000)}`;
    const trackingNumber = `BLUEDART-EXP-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newOrder = {
      id: orderId,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: "Processing",
      trackingNumber,
      carrier: "BlueDart Express Courier",
      items: cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size
      })),
      subtotal,
      discount: couponDiscount,
      shipping,
      tax: 0,
      total,
      shippingAddress: activeShippingAddress,
      paymentMethod: paymentMethod === 'upi' ? 'UPI (Google Pay / PhonePe)' :
        paymentMethod === 'card' ? 'Credit / Debit Card' :
        paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Net Banking',
      estimatedDelivery: new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      deliveredDate: null,
      timeline: [
        {
          status: "Order Placed",
          date: `${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
          completed: true,
          details: "Order placed and confirmed in artisan system."
        },
        {
          status: "Artisan Quality Checked",
          date: "Pending",
          completed: false,
          details: "Craftsmanship & zarkan stone integrity verification."
        },
        {
          status: "Packed in Eco-Friendly Box",
          date: "Pending",
          completed: false,
          details: "Reinforced corner protection and sacred seals."
        },
        {
          status: "Handed over to BlueDart",
          date: "Pending",
          completed: false,
          details: `Tracking ID: ${trackingNumber}`
        },
        {
          status: "Out for Delivery",
          date: "Pending",
          completed: false,
          details: "Express courier doorstep delivery."
        },
        {
          status: "Delivered with Love",
          date: "Pending",
          completed: false,
          details: "Doorstep delivery with recipient signature."
        }
      ]
    };

    addOrder(newOrder);
    clearCart();
    addToast('Order placed successfully!', 'success');
    navigate(`/order-success/${orderId}`);
  };

  const steps = [
    { num: 1, label: 'Delivery Address', icon: MapPin },
    { num: 2, label: 'Delivery Method', icon: Truck },
    { num: 3, label: 'Payment Options', icon: CreditCard },
    { num: 4, label: 'Review & Confirm', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="Secure Checkout | Trio Ecart" />

      <Breadcrumb items={[{ name: 'Cart', url: '/cart' }, { name: 'Checkout', url: '/checkout' }]} />

      {/* Checkout Progress Stepper */}
      <div className="ethnic-card p-4 sm:p-6 rounded-3xl">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-700 text-white shadow-emerald-950/30'
                        : isCurrent
                        ? 'bg-maroon-700 text-white shadow-maroon-md ring-4 ring-gold-500/30'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold ${
                      isCurrent
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
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      currentStep > idx + 1 ? 'bg-emerald-600' : 'bg-stone-200 dark:bg-stone-800'
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
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedAddressId === addr.id
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
                          <p className="text-[11px] text-stone-500 font-medium">Phone: {addr.phone}</p>
                        </div>
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId('new');
                        setIsAddingNewAddress(true);
                      }}
                      className={`p-4 rounded-2xl border-2 border-dashed border-gold-500/40 flex items-center justify-center gap-2 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:bg-gold-500/10 transition-colors ${
                        selectedAddressId === 'new' ? 'bg-gold-500/10 border-gold-500' : ''
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
                      <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400">PIN Code *</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="302001"
                        value={newAddressForm.zip}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, zip: e.target.value })}
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
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    deliveryMethod === 'express'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30'
                      : 'border-gold-500/20'
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
                          BlueDart Air Express Insured Courier
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">Delivered within 3-4 business days with real-time SMS tracking.</p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </label>

                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    deliveryMethod === 'standard'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30'
                      : 'border-gold-500/20'
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
                      <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                        Standard Surface Shipping
                      </span>
                      <p className="text-[11px] text-stone-500">Delivered within 5-7 business days.</p>
                    </div>
                  </div>
                  <span className="font-bold text-xs text-stone-500">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
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
                  <p className="text-xs text-stone-500">All transactions are encrypted with 256-bit SSL security.</p>
                </div>
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="space-y-3">
                {/* UPI */}
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${
                    paymentMethod === 'upi'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30'
                      : 'border-gold-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="accent-maroon-700"
                      />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                          UPI (Google Pay, PhonePe, Paytm, BHIM)
                        </span>
                        <p className="text-[11px] text-stone-500">Instant approval with zero transaction surcharge.</p>
                      </div>
                    </div>
                    <QrCode className="w-5 h-5 text-gold-600" />
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="pt-2 pl-7 space-y-2">
                      <input
                        type="text"
                        placeholder="Enter UPI VPA (e.g. mobile@upi or name@okaxis)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full max-w-sm px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-gold-500/30 text-xs outline-none"
                      />
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        ✓ Fast verification enabled
                      </p>
                    </div>
                  )}
                </label>

                {/* Credit / Debit Card */}
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${
                    paymentMethod === 'card'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30'
                      : 'border-gold-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-maroon-700"
                      />
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                          Credit / Debit Card (Visa, RuPay, Mastercard)
                        </span>
                        <p className="text-[11px] text-stone-500">Supports all major Indian banks and corporate cards.</p>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-gold-600" />
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="pt-2 pl-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-gold-500/30 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Name on Card"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-gold-500/30 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-gold-500/30 text-xs"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-gold-500/30 text-xs"
                      />
                    </div>
                  )}
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-maroon-700 bg-maroon-50/50 dark:bg-maroon-950/30'
                      : 'border-gold-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-maroon-700"
                    />
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100">
                        Cash on Delivery (COD)
                      </span>
                      <p className="text-[11px] text-stone-500">Pay in cash or UPI QR directly to the delivery executive.</p>
                    </div>
                  </div>
                  <Wallet className="w-5 h-5 text-gold-600" />
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
                <p className="text-xs font-bold text-stone-800 dark:text-ivory-100">{activeShippingAddress.name}</p>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {activeShippingAddress.address}, {activeShippingAddress.city}, {activeShippingAddress.state} - {activeShippingAddress.zip}
                </p>
                <p className="text-[11px] text-stone-500">Contact: {activeShippingAddress.phone}</p>
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
                  {paymentMethod === 'upi' ? `UPI (${upiId})` : paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
                </p>
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
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <span className="font-semibold text-stone-900 dark:text-ivory-100 truncate">{item.name} (x{item.quantity})</span>
                      </div>
                      <span className="font-serif font-bold text-maroon-800 dark:text-gold-400 shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
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
                  className="w-full sm:flex-1 btn-gold py-3.5 px-8 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-gold-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Place Order (₹{total.toLocaleString('en-IN')})</span>
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
                <span className="font-semibold text-stone-900 dark:text-ivory-100">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {productSavings > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Product Savings</span>
                  <span>-₹{productSavings.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-sm font-serif font-black text-stone-900 dark:text-ivory-100 pt-2 border-t border-gold-500/20">
                <span>Total Due</span>
                <span className="text-lg text-maroon-800 dark:text-gold-400">₹{total.toLocaleString('en-IN')}</span>
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
    </div>
  );
};

export default CheckoutPage;
