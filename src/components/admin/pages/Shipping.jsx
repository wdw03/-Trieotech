'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { adminApi } from '../../../services/adminApi.js';
import { ProductImage } from '../ui/ProductImage.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { ShippingTableSkeleton, MetricCardSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  Truck,
  Package,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileText,
  UploadCloud,
  Check,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';

const SHIPPING_TABS = [
  'All',
  'Ready to Ship',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Failed Delivery',
  'RTO'
];

export const Shipping = () => {
  const { orders, setPrintDocument, updateOrderStatus, showToast, refreshOrders } = useAdmin();
  const isPageLoading = usePageLoading(450);

  // Main View Switcher: 'shipments' | 'cod_pincodes'
  const [mainView, setMainView] = useState('shipments');

  // SHIPMENTS STATE
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('All');
  const [selectedShipments, setSelectedShipments] = useState([]);
  const [timelineOrder, setTimelineOrder] = useState(null);

  // COD PINCODES STATE
  const [codPincodes, setCodPincodes] = useState([]);
  const [codEnabledGlobally, setCodEnabledGlobally] = useState(false);
  const [isLoadingCod, setIsLoadingCod] = useState(false);
  const [codSearch, setCodSearch] = useState('');

  // Modals for COD
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPin, setCopiedPin] = useState(null);

  // Single Add Form
  const [singleForm, setSingleForm] = useState({
    pincode: '',
    city: '',
    state: '',
    notes: ''
  });

  // Bulk Add Form
  const [bulkText, setBulkText] = useState('');
  const [bulkCity, setBulkCity] = useState('');
  const [bulkState, setBulkState] = useState('');

  // Load COD Pincodes from Backend
  const fetchCodPincodes = async () => {
    setIsLoadingCod(true);
    try {
      const res = await adminApi.getCodPincodes();
      if (res && res.success) {
        setCodPincodes(res.pincodes || []);
        setCodEnabledGlobally(!!res.cod_enabled_globally);
      }
    } catch (err) {
      console.error('Failed to load COD pincodes:', err);
    } finally {
      setIsLoadingCod(false);
    }
  };

  useEffect(() => {
    fetchCodPincodes();
  }, []);

  // Map orders into shipment cards
  const shipments = useMemo(() => {
    return orders.map((o) => {
      let shippingStage = 'Ready to Ship';
      if (o.status === 'Packed') shippingStage = 'Packed';
      if (o.status === 'Shipped') shippingStage = 'Shipped';
      if (o.status === 'Out for Delivery') shippingStage = 'Out for Delivery';
      if (o.status === 'Delivered') shippingStage = 'Delivered';
      if (o.status === 'Cancelled') shippingStage = 'Failed Delivery';
      if (o.status === 'Returned' || o.status === 'Return Requested') shippingStage = 'RTO';

      return {
        ...o,
        shippingStage,
        carrierService: o.shippingPartner === 'BlueDart' ? 'Apex Air Priority' : 'Standard Surface Express',
        weight: o.items.length > 2 ? '1.2 kg' : '450 g',
        attempts: o.status === 'Delivered' ? 1 : (o.status === 'Cancelled' ? 3 : 0),
        estimatedDelivery: o.status === 'Delivered' ? 'Completed' : 'Sep 06, 2026'
      };
    });
  }, [orders]);

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (activeTab !== 'All' && s.shippingStage !== activeTab) return false;
      if (selectedCourier !== 'All' && s.shippingPartner !== selectedCourier) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          s.id.toLowerCase().includes(q) ||
          s.customer.name.toLowerCase().includes(q) ||
          s.trackingNumber?.toLowerCase().includes(q) ||
          s.customer.address.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shipments, activeTab, selectedCourier, searchTerm]);

  // Filter COD Pincodes
  const filteredCodPincodes = useMemo(() => {
    if (!codSearch.trim()) return codPincodes;
    const q = codSearch.trim().toLowerCase();
    return codPincodes.filter((item) => {
      const pin = typeof item === 'string' ? item : item.pincode;
      const city = typeof item === 'object' ? item.city || '' : '';
      const state = typeof item === 'object' ? item.state || '' : '';
      const notes = typeof item === 'object' ? item.notes || '' : '';
      return (
        pin.toLowerCase().includes(q) ||
        city.toLowerCase().includes(q) ||
        state.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q)
      );
    });
  }, [codPincodes, codSearch]);

  const [shipmentActionLoading, setShipmentActionLoading] = useState(false);

  const handlePrintShiprocketLabel = async (s) => {
    setShipmentActionLoading(true);
    showToast('Generating official Shiprocket label with AWB...');
    try {
      const res = await adminApi.getShiprocketLabel(s.id);
      if (res && res.labelUrl) {
        window.open(res.labelUrl, '_blank', 'noopener,noreferrer');
        showToast(`Official Shiprocket label opened! (AWB: ${res.awbNumbers?.[0] || res.awb || s.trackingNumber || ''})`);
      } else {
        showToast(res?.error || 'Could not generate official label from Shiprocket.');
      }
    } catch (err) {
      showToast(`Shiprocket label error: ${err.message}`);
    } finally {
      setShipmentActionLoading(false);
    }
  };

  const handleAssignAWB = async (orderId) => {
    setShipmentActionLoading(true);
    showToast('Assigning AWB from Shiprocket...');
    try {
      const res = await adminApi.assignAWB(orderId);
      if (res && res.success) {
        showToast(`AWB ${res.awbNumber || ''} assigned successfully!`);
        if (refreshOrders) await refreshOrders();
      } else {
        showToast(res?.error || 'Failed to assign AWB');
      }
    } catch (err) {
      showToast(err.message || 'AWB assignment failed');
    } finally {
      setShipmentActionLoading(false);
    }
  };

  const handleRequestPickup = async (orderId) => {
    setShipmentActionLoading(true);
    showToast('Scheduling courier pickup...');
    try {
      const res = await adminApi.requestPickup(orderId);
      if (res && res.success) {
        showToast(res.alreadyScheduled ? 'Pickup already scheduled' : 'Courier pickup scheduled!');
        if (refreshOrders) await refreshOrders();
      } else {
        showToast(res?.error || 'Failed to schedule pickup');
      }
    } catch (err) {
      showToast(err.message || 'Pickup request failed');
    } finally {
      setShipmentActionLoading(false);
    }
  };

  const handleBulkPrintLabels = async () => {
    if (!selectedShipments.length) {
      showToast('Please select at least one shipment to print labels');
      return;
    }
    setShipmentActionLoading(true);
    showToast(`Generating official Shiprocket labels for ${selectedShipments.length} orders...`);
    try {
      const res = await adminApi.getShiprocketLabel({ orderIds: selectedShipments });
      if (res && res.labelUrl) {
        window.open(res.labelUrl, '_blank', 'noopener,noreferrer');
        showToast(`Official Shiprocket labels for ${selectedShipments.length} orders opened!`);
      } else {
        showToast(res?.error || 'Failed to generate bulk official Shiprocket labels');
      }
    } catch (err) {
      showToast(`Bulk label error: ${err.message}`);
    } finally {
      setShipmentActionLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedShipments(filteredShipments.map((s) => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedShipments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // COD: Single Add
  const handleAddSinglePincode = async (e) => {
    e.preventDefault();
    const cleanPin = singleForm.pincode.trim().replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
      showToast('Please enter a valid 6-digit Indian PIN code', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.addCodPincodes({
        pincode: cleanPin,
        city: singleForm.city.trim(),
        state: singleForm.state.trim(),
        notes: singleForm.notes.trim()
      });

      if (res && res.success) {
        setCodPincodes(res.pincodes || []);
        showToast(`PIN ${cleanPin} enabled for Cash on Delivery!`, 'success');
        setIsSingleAddOpen(false);
        setSingleForm({ pincode: '', city: '', state: '', notes: '' });
      } else {
        showToast(res.error || 'Failed to add PIN code', 'error');
      }
    } catch (err) {
      showToast('Failed to add PIN code: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // COD: Bulk Add
  const parsedBulkPincodes = useMemo(() => {
    if (!bulkText.trim()) return [];
    const matches = bulkText.match(/\b\d{6}\b/g);
    if (!matches) return [];
    return Array.from(new Set(matches));
  }, [bulkText]);

  const handleAddBulkPincodes = async (e) => {
    e.preventDefault();
    if (parsedBulkPincodes.length === 0) {
      showToast('No valid 6-digit PIN codes found in the text', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const entries = parsedBulkPincodes.map((pin) => ({
        pincode: pin,
        city: bulkCity.trim(),
        state: bulkState.trim(),
        notes: 'Bulk Imported'
      }));

      const res = await adminApi.addCodPincodes({ pincodes: entries });
      if (res && res.success) {
        setCodPincodes(res.pincodes || []);
        showToast(`Successfully added ${parsedBulkPincodes.length} COD serviceable PINs!`, 'success');
        setIsBulkAddOpen(false);
        setBulkText('');
        setBulkCity('');
        setBulkState('');
      } else {
        showToast(res.error || 'Failed to import PIN codes', 'error');
      }
    } catch (err) {
      showToast('Failed to import PIN codes: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // COD: Delete Pincode
  const handleDeletePincode = async (pin) => {
    if (!window.confirm(`Are you sure you want to remove PIN ${pin} from COD serviceability? COD will become unavailable at this PIN.`)) {
      return;
    }

    try {
      const res = await adminApi.deleteCodPincode(pin);
      if (res && res.success) {
        setCodPincodes(res.pincodes || []);
        showToast(`PIN ${pin} removed. COD is now unavailable there.`, 'info');
      } else {
        showToast(res.error || 'Failed to delete PIN code', 'error');
      }
    } catch (err) {
      showToast('Error removing PIN: ' + err.message, 'error');
    }
  };

  // Copy Pincode helper
  const handleCopyPin = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      
      {/* Top Header & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Shipping & Logistics Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage carrier consignments, BlueDart/Delhivery AWBs, and Cash on Delivery (COD) pincode availability.
          </p>
        </div>

        {/* Primary View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMainView('shipments')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mainView === 'shipments'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Shipments & AWBs</span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded-full font-extrabold">
              {shipments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('cod_pincodes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mainView === 'cod_pincodes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>COD Available Pincodes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              codPincodes.length > 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {codPincodes.length} Active
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: COD PINCODE MANAGER */}
      {/* ========================================================================= */}
      {mainView === 'cod_pincodes' && (
        <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* Status & Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* Card 1: Active COD Pincodes */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">COD Serviceable PINs</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{codPincodes.length}</span>
                  <span className="text-xs text-slate-400 font-medium">Locations Active</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {codPincodes.length > 0
                    ? `${codPincodes.length} verified PIN codes eligible for COD`
                    : 'Zero COD PINs configured'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Default Storefront Policy */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default COD Status</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                    RESTRICTED / DISABLED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  All unlisted PINs are strictly disabled. Users must pay via UPI / Card.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Quick Action Buttons */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Add Serviceable Areas</span>
                <button
                  onClick={fetchCodPincodes}
                  disabled={isLoadingCod}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Refresh List"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCod ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSingleAddOpen(true)}
                  className="flex-1 btn-primary py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add PIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkAddOpen(true)}
                  className="flex-1 btn-secondary py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Bulk Import</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PIN code, city, state, or hub..."
                value={codSearch}
                onChange={(e) => setCodSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
              <span>Showing <strong>{filteredCodPincodes.length}</strong> of <strong>{codPincodes.length}</strong> allowed PINs</span>
            </div>
          </div>

          {/* COD Pincodes Table */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="overflow-x-auto flex-1 scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="table-thead sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="table-th">PIN Code</th>
                    <th className="table-th">Serviceable City / Area</th>
                    <th className="table-th">State</th>
                    <th className="table-th">COD Status</th>
                    <th className="table-th">Hub / Notes</th>
                    <th className="table-th">Added Date</th>
                    <th className="table-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoadingCod ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                        <p>Loading COD Serviceable Pincodes...</p>
                      </td>
                    </tr>
                  ) : filteredCodPincodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200 text-sm">
                              {codSearch ? 'No Matching PIN Codes' : 'COD is Disabled Everywhere (0 Allowed PINs)'}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {codSearch
                                ? 'No active pincodes match your search term. Try another query.'
                                : 'All customer checkout addresses currently show Cash on Delivery as Unavailable/Disabled by default. Click "+ Add Serviceable PIN" or "Bulk Import" to enable specific Indian PIN codes.'}
                            </p>
                          </div>
                          {!codSearch && (
                            <div className="pt-2 flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsSingleAddOpen(true)}
                                className="btn-primary py-2 px-4 text-xs font-bold"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Serviceable PIN
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsBulkAddOpen(true)}
                                className="btn-secondary py-2 px-4 text-xs font-bold"
                              >
                                <UploadCloud className="w-3.5 h-3.5" /> Bulk Import
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCodPincodes.map((item, idx) => {
                      const pin = typeof item === 'string' ? item : item.pincode;
                      const city = typeof item === 'object' ? item.city || '—' : '—';
                      const state = typeof item === 'object' ? item.state || '—' : '—';
                      const notes = typeof item === 'object' ? item.notes || '—' : '—';
                      const addedAt = typeof item === 'object' && item.added_at
                        ? new Date(item.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Active';

                      return (
                        <tr key={pin + idx} className="table-tr hover:bg-slate-800/40">
                          <td className="table-td font-mono font-bold text-indigo-400">
                            <div className="flex items-center gap-1.5">
                              <span>{pin}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPin(pin)}
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                                title="Copy PIN"
                              >
                                {copiedPin === pin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="table-td font-semibold text-slate-200">
                            {city}
                          </td>
                          <td className="table-td text-slate-300">
                            {state}
                          </td>
                          <td className="table-td">
                            <span className="badge badge-emerald">
                              ✓ COD Active
                            </span>
                          </td>
                          <td className="table-td text-slate-400 text-[11px]">
                            {notes}
                          </td>
                          <td className="table-td text-slate-400 text-[11px]">
                            {addedAt}
                          </td>
                          <td className="table-td text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePincode(pin)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete / Disable COD for this PIN"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between items-center shrink-0 bg-slate-950">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Customer addresses outside this list will automatically show COD as disabled.
              </span>
              <span className="text-[11px] text-slate-500">Live Supabase Sync</span>
            </div>
          </div>

          {/* MODAL: SINGLE ADD PINCODE */}
          {isSingleAddOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">Add Serviceable COD PIN Code</h3>
                    <p className="text-xs text-slate-400">Enable Cash on Delivery for a specific delivery pincode.</p>
                  </div>
                  <button onClick={() => setIsSingleAddOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddSinglePincode} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      PIN Code <span className="text-rose-500">*</span> (6 Digits)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 302001"
                      value={singleForm.pincode}
                      onChange={(e) => setSingleForm({ ...singleForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / Area</label>
                      <input
                        type="text"
                        placeholder="e.g. Jaipur"
                        value={singleForm.city}
                        onChange={(e) => setSingleForm({ ...singleForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Rajasthan"
                        value={singleForm.state}
                        onChange={(e) => setSingleForm({ ...singleForm, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Hub Notes / Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Primary Artisan Hub"
                      value={singleForm.notes}
                      onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300">
                    Once added, customers entering this PIN during checkout will see COD active and selectable!
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSingleAddOpen(false)}
                      className="btn-secondary py-2 px-4 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                    >
                      {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Save & Enable COD</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: BULK IMPORT PINCODES */}
          {isBulkAddOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-scaleIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">Bulk Import COD Pincodes</h3>
                    <p className="text-xs text-slate-400">Paste multiple 6-digit Indian PIN codes separated by comma or new line.</p>
                  </div>
                  <button onClick={() => setIsBulkAddOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddBulkPincodes} className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-300 font-semibold">
                        PIN Codes List <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-indigo-400">
                        {parsedBulkPincodes.length} valid PINs detected
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      required
                      placeholder="Paste PIN codes here, e.g.:&#10;302001, 302002, 302003, 110001, 400001&#10;or one PIN per line..."
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Default City (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Metro Hubs"
                        value={bulkCity}
                        onChange={(e) => setBulkCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Default State (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. India"
                        value={bulkState}
                        onChange={(e) => setBulkState(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {parsedBulkPincodes.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300">
                      ✓ Ready to enable COD for {parsedBulkPincodes.length} locations. Duplicates will be merged automatically.
                    </div>
                  )}

                  <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkAddOpen(false)}
                      className="btn-secondary py-2 px-4 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || parsedBulkPincodes.length === 0}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>Import {parsedBulkPincodes.length} Pincodes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SHIPMENTS & AWB CONSIGNMENTS (EXISTING) */}
      {/* ========================================================================= */}
      {mainView === 'shipments' && (
        <>
          {/* Top Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {isPageLoading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ready to Dispatch</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-amber-400">
                      {shipments.filter(s => s.shippingStage === 'Ready to Ship').length}
                    </span>
                    <span className="text-xs text-slate-400">Orders</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Transit</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-indigo-400">
                      {shipments.filter(s => ['Shipped', 'Out for Delivery'].includes(s.shippingStage)).length}
                    </span>
                    <span className="text-xs text-slate-400">Parcels</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivered</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">
                      {shipments.filter(s => s.shippingStage === 'Delivered').length}
                    </span>
                    <span className="text-xs text-slate-400">Delivered</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">COD Policy</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">
                      {codPincodes.length} PINs Whitelisted
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMainView('cod_pincodes')}
                    className="text-[10px] text-indigo-400 hover:underline font-semibold mt-0.5 block"
                  >
                    Manage COD PINs →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Action and Filter Header */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search AWB, Order ID, customer, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Courier Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">Courier:</span>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Partners</option>
                  <option value="BlueDart">BlueDart Express</option>
                  <option value="Delhivery">Delhivery Surface</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedShipments.length > 0 && (
                <button
                  onClick={handleBulkPrintLabels}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 animate-fadeIn"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Labels ({selectedShipments.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* SHIPPING STAGE TABS */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none shrink-0 border-b border-slate-800">
            {SHIPPING_TABS.map((tab) => {
              const count = tab === 'All'
                ? shipments.length
                : shipments.filter((s) => s.shippingStage === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeTab === tab
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SHIPMENT TABLE */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="overflow-x-auto flex-1 scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="table-thead sticky top-0 z-10 bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="table-th w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedShipments.length === filteredShipments.length && filteredShipments.length > 0}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="table-th">AWB Number</th>
                    <th className="table-th">Order & Customer</th>
                    <th className="table-th">Destination PIN</th>
                    <th className="table-th">Courier Partner</th>
                    <th className="table-th">Delivery Date</th>
                    <th className="table-th text-center">Attempts</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isPageLoading ? (
                    <ShippingTableSkeleton rows={7} />
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No active consignments matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((s) => {
                      const isSelected = selectedShipments.includes(s.id);
                      return (
                        <tr key={s.id} className={`table-tr ${isSelected ? 'bg-indigo-950/20' : ''}`}>
                          <td className="table-td text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(s.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="table-td font-mono font-bold text-indigo-400">
                            {s.trackingNumber}
                          </td>
                          <td className="table-td">
                            <span className="font-semibold text-slate-200 block">{s.id}</span>
                            <span className="text-[11px] text-slate-400">{s.customer.name}</span>
                          </td>
                          <td className="table-td">
                            <div className="flex items-center gap-1.5 text-xs text-slate-200">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{s.customer.address.city}, {s.customer.address.state}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{s.customer.address.pincode}</span>
                          </td>
                          <td className="table-td">
                            <span className="font-medium text-xs text-slate-200">{s.shippingPartner}</span>
                            <span className="text-[10px] text-slate-500 block">Air Express</span>
                          </td>
                          <td className="table-td">
                            <div className="flex items-center gap-1 text-xs text-slate-300">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              <span>{s.estimatedDelivery}</span>
                            </div>
                          </td>
                          <td className="table-td text-center font-bold text-slate-300">
                            {s.attempts} / 3
                          </td>
                          <td className="table-td">
                            <span className={`
                              badge
                              ${s.shippingStage === 'Ready to Ship' ? 'badge-amber' : ''}
                              ${s.shippingStage === 'Packed' ? 'badge-cyan' : ''}
                              ${s.shippingStage === 'Shipped' ? 'badge-purple' : ''}
                              ${s.shippingStage === 'Out for Delivery' ? 'badge-indigo' : ''}
                              ${s.shippingStage === 'Delivered' ? 'badge-emerald' : ''}
                              ${s.shippingStage === 'Failed Delivery' ? 'badge-rose' : ''}
                              ${s.shippingStage === 'RTO' ? 'badge-slate' : ''}
                            `}>
                              {s.shippingStage}
                            </span>
                          </td>
                          <td className="table-td text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Assign AWB button if missing */}
                              {(!s.trackingNumber || s.trackingNumber.startsWith('SR-')) && (
                                <button
                                  onClick={() => handleAssignAWB(s.id)}
                                  disabled={shipmentActionLoading}
                                  className="btn-secondary py-1 px-2 text-[11px] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                                  title="Assign Courier AWB"
                                >
                                  AWB
                                </button>
                              )}

                              {/* Pickup button if Packed */}
                              {s.status === 'Packed' && (
                                <button
                                  onClick={() => handleRequestPickup(s.id)}
                                  disabled={shipmentActionLoading}
                                  className="btn-secondary py-1 px-2 text-[11px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                                  title="Schedule Courier Pickup"
                                >
                                  Pickup
                                </button>
                              )}

                              <button
                                onClick={() => handlePrintShiprocketLabel(s)}
                                disabled={shipmentActionLoading}
                                className="btn-secondary py-1 px-2.5 text-xs"
                                title="Print Official Shiprocket Shipping Label"
                              >
                                <Printer className="w-3.5 h-3.5" /> Label
                              </button>
                              <button
                                onClick={() => setTimelineOrder(s)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                title="View Tracking Timeline"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between items-center shrink-0 bg-slate-900/90">
              <span>{isPageLoading ? <Skeleton className="h-3.5 w-36 inline-block align-middle" /> : `Showing ${filteredShipments.length} of ${shipments.length} active consignments`}</span>
              <span className="text-[11px] text-slate-500">Real-time carrier AWB tracking</span>
            </div>
          </div>
        </>
      )}

      {/* TRACKING TIMELINE MODAL */}
      {timelineOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Shipment Tracking</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-indigo-400 font-mono">{timelineOrder.trackingNumber || 'Pending AWB'} ({timelineOrder.shippingPartner})</p>
                  {timelineOrder.trackingNumber && !timelineOrder.trackingNumber.startsWith('SR-') && (
                    <a
                      href={`https://shiprocket.co/tracking/${timelineOrder.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 underline"
                    >
                      Track Live <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => setTimelineOrder(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Steps */}
            <div className="space-y-4 text-xs">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">✓</div>
                <div>
                  <p className="font-semibold text-slate-100">Package Picked Up by {timelineOrder.shippingPartner}</p>
                  <p className="text-[11px] text-slate-500">Surat Mother Hub, Gujarat • Sep 02, 04:30 PM</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">✓</div>
                <div>
                  <p className="font-semibold text-slate-100">In Transit - Airport Air Hub</p>
                  <p className="text-[11px] text-slate-500">Ahmedabad Terminal • Sep 02, 11:45 PM</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold shrink-0">📦</div>
                <div>
                  <p className="font-semibold text-slate-100">Arrived at Destination Facility</p>
                  <p className="text-[11px] text-indigo-400 font-medium">{timelineOrder.customer.address.city} Sorting Center • Sep 03, 08:15 AM</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center font-bold shrink-0">⏳</div>
                <div>
                  <p className="font-semibold text-slate-400">Out for Delivery</p>
                  <p className="text-[11px] text-slate-500">Expected by courier agent today</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-400">Recipient: {timelineOrder.customer.name}</span>
              <button
                onClick={() => {
                  handlePrintShiprocketLabel(timelineOrder);
                  setTimelineOrder(null);
                }}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Shiprocket Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
