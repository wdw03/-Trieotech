'use client';
import React, { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import {
  Settings as SettingsIcon,
  Store,
  Truck,
  DollarSign,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle2
} from 'lucide-react';

export const Settings = () => {
  const { showToast } = useAdmin();

  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Trio Enterprises',
    tagline: 'Ethnic Craft Guild | Handcrafted Patches, Devotional Decor & Copper Wellness',
    supportEmail: 'care@trioenterprises.com',
    supportPhone: '+91 7065120322',
    address: 'UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad, Near R.B.A COLLEGE, 121001 (Attn: Kashyap ji)',
    gstin: '24AAACT1234F1Z8',
    currency: 'INR (₹)',
    taxRate: 18,
    freeShippingThreshold: 999,
    defaultShippingCharge: 49,
    lowStockThreshold: 15,
    returnWindowDays: 10,
    codEnabled: true,
    autoAcceptOrders: true,
    smsAlerts: true,
    emailAlerts: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Store settings saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Store &amp; Fulfillment Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure business identity, GST tax rules, courier integrations and inventory thresholds.
          </p>
        </div>

        <button onClick={handleSave} className="btn-primary py-2 px-4 text-xs font-bold">
          <Save className="w-3.5 h-3.5" /> Save Changes
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Profile */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Store Profile &amp; Tax Identity</h3>
            </div>
            {/* Logo Emblem Pill */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
              <img src="/logo.png" alt="Trio Enterprises Logo" className="w-6 h-6 object-contain" />
              <span className="font-black text-xs text-white">TRIO <span className="text-amber-400">ENTERPRISES</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings_store_name" className="font-semibold text-slate-300 block mb-1">Store Legal Name</label>
              <input
                id="settings_store_name"
                name="store_name"
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label htmlFor="settings_gstin" className="font-semibold text-slate-300 block mb-1">GSTIN Number</label>
              <input
                id="settings_gstin"
                name="gstin"
                type="text"
                value={storeSettings.gstin}
                onChange={(e) => setStoreSettings({ ...storeSettings, gstin: e.target.value })}
                className="admin-input w-full text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings_tagline" className="font-semibold text-slate-300 block mb-1">Store Slogan / Tagline</label>
            <input
              id="settings_tagline"
              name="tagline"
              type="text"
              value={storeSettings.tagline}
              onChange={(e) => setStoreSettings({ ...storeSettings, tagline: e.target.value })}
              className="admin-input w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings_support_email" className="font-semibold text-slate-300 block mb-1">Customer Support Email</label>
              <input
                id="settings_support_email"
                name="support_email"
                type="email"
                value={storeSettings.supportEmail}
                onChange={(e) => setStoreSettings({ ...storeSettings, supportEmail: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label htmlFor="settings_support_phone" className="font-semibold text-slate-300 block mb-1">Customer Support Phone</label>
              <input
                id="settings_support_phone"
                name="support_phone"
                type="text"
                value={storeSettings.supportPhone}
                onChange={(e) => setStoreSettings({ ...storeSettings, supportPhone: e.target.value })}
                className="admin-input w-full text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings_address" className="font-semibold text-slate-300 block mb-1">Registered Warehouse Address</label>
            <input
              id="settings_address"
              name="address"
              type="text"
              value={storeSettings.address}
              onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              className="admin-input w-full text-xs"
            />
          </div>
        </div>

        {/* Shipping & Fulfillment Rules */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Truck className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Shipping Charges & Return Windows</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="settings_free_shipping_threshold" className="font-semibold text-slate-300 block mb-1">Free Shipping on Orders Above (₹)</label>
              <input
                id="settings_free_shipping_threshold"
                name="free_shipping_threshold"
                type="number"
                value={storeSettings.freeShippingThreshold}
                onChange={(e) => setStoreSettings({ ...storeSettings, freeShippingThreshold: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label htmlFor="settings_default_shipping_charge" className="font-semibold text-slate-300 block mb-1">Standard Shipping Charge (₹)</label>
              <input
                id="settings_default_shipping_charge"
                name="default_shipping_charge"
                type="number"
                value={storeSettings.defaultShippingCharge}
                onChange={(e) => setStoreSettings({ ...storeSettings, defaultShippingCharge: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
            </div>

            <div>
              <label htmlFor="settings_return_window_days" className="font-semibold text-slate-300 block mb-1">Customer Return Window (Days)</label>
              <input
                id="settings_return_window_days"
                name="return_window_days"
                type="number"
                value={storeSettings.returnWindowDays}
                onChange={(e) => setStoreSettings({ ...storeSettings, returnWindowDays: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label htmlFor="settings_cod_enabled" className="flex items-center gap-2 cursor-pointer">
              <input
                id="settings_cod_enabled"
                name="cod_enabled"
                type="checkbox"
                checked={storeSettings.codEnabled}
                onChange={(e) => setStoreSettings({ ...storeSettings, codEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
              />
              <span className="font-semibold text-slate-200">Enable Cash on Delivery (COD) for Indian Pincodes</span>
            </label>

            <label htmlFor="settings_auto_accept_orders" className="flex items-center gap-2 cursor-pointer">
              <input
                id="settings_auto_accept_orders"
                name="auto_accept_orders"
                type="checkbox"
                checked={storeSettings.autoAcceptOrders}
                onChange={(e) => setStoreSettings({ ...storeSettings, autoAcceptOrders: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
              />
              <span className="font-semibold text-slate-200">Auto-confirm prepaid UPI / Credit Card orders immediately</span>
            </label>
          </div>
        </div>

        {/* Inventory Alert Thresholds */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Bell className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">Inventory Alerts & Notifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings_low_stock_threshold" className="font-semibold text-slate-300 block mb-1">Low-Stock Alert Threshold (Units)</label>
              <input
                id="settings_low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                value={storeSettings.lowStockThreshold}
                onChange={(e) => setStoreSettings({ ...storeSettings, lowStockThreshold: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Triggers notification badge on sidebar & header</span>
            </div>

            <div>
              <label htmlFor="settings_tax_rate" className="font-semibold text-slate-300 block mb-1">Default GST Rate (%)</label>
              <input
                id="settings_tax_rate"
                name="tax_rate"
                type="number"
                value={storeSettings.taxRate}
                onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: Number(e.target.value) })}
                className="admin-input w-full text-xs"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Applied automatically on tax invoices</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
