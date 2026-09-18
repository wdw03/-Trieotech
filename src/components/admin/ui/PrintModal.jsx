'use client';
import React from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import {
  Printer,
  X,
  Download,
  FileText,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Package,
} from 'lucide-react';
import {
  normalizeInvoiceOrder,
  generateInvoiceHTML,
  generateBulkInvoiceHTML,
} from '../../../lib/invoice.js';

export const PrintModal = () => {
  const { printDocument, setPrintDocument, showToast } = useAdmin();

  if (!printDocument) return null;

  const { type, data } = printDocument;
  const isBulk = Array.isArray(data);
  const orderList = isBulk ? data : [data];

  // Executes print using isolated window or hidden iframe
  const handlePrint = () => {
    if (type === 'shipping_label') {
      const orderIdsParam = orderList.map((o) => o.id || o.order_number).join(',');
      const url = `/admin/shipments/label?orderIds=${encodeURIComponent(orderIdsParam)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast(`Opening official Shiprocket shipping label for ${orderList.length} order(s)!`);
      return;
    }

    if (type === 'invoice') {
      const html = isBulk
        ? generateBulkInvoiceHTML(orderList, { autoPrint: true })
        : generateInvoiceHTML(orderList[0], { autoPrint: true });

      // Try opening dedicated print window
      try {
        const printWindow = window.open('', '_blank', 'width=960,height=900');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          showToast(`Opening print dialog for GST Tax Invoice...`);
          return;
        }
      } catch (err) {
        console.error('Failed to open window, trying iframe fallback:', err);
      }

      // Fallback: hidden iframe for popup blockers
      let iframe = document.getElementById('triotech-print-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'triotech-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);
      }
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 500);
      showToast(`Triggering printer for invoice...`);
      return;
    }

    // Default window print for packing slip
    window.print();
    showToast(`Print command sent for ${type.replace('_', ' ')}!`);
  };

  // Downloads standalone HTML invoice file
  const handleDownload = () => {
    if (type === 'invoice') {
      const firstOrder = orderList[0];
      const inv = normalizeInvoiceOrder(firstOrder);
      const safeNumber = inv.orderNumber || 'order';

      const html = isBulk
        ? generateBulkInvoiceHTML(orderList)
        : generateInvoiceHTML(firstOrder);

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Tax-Invoice-${safeNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      showToast(`Downloaded Tax Invoice as file!`);
      return;
    }

    showToast(`Downloaded ${type.replace('_', ' ')}.`);
  };

  // Opens standalone clean preview in a new tab
  const handleOpenInNewTab = () => {
    if (type === 'invoice') {
      const html = isBulk
        ? generateBulkInvoiceHTML(orderList)
        : generateInvoiceHTML(orderList[0]);

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      showToast(`Opened standalone invoice in new tab!`);
    }
  };

  return (
    <>
      {/* Scoped CSS for print fidelity */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body {
              background: #ffffff !important;
              color: #0f172a !important;
            }
            body > * {
              display: none !important;
            }
            #printable-invoice-modal-root {
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              z-index: 999999 !important;
            }
            #printable-invoice-modal-root .no-print {
              display: none !important;
            }
            #printable-invoice-modal-root .print-area {
              padding: 0 !important;
              background: #ffffff !important;
              gap: 0 !important;
            }
            #printable-invoice-modal-root .invoice-sheet-container {
              box-shadow: none !important;
              border: 1.5px solid #d4af37 !important;
              border-radius: 0 !important;
              margin: 0 0 20px 0 !important;
              padding: 16px !important;
              page-break-after: always !important;
              break-after: page !important;
              background: #ffffff !important;
            }
            #printable-invoice-modal-root .invoice-sheet-container:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `,
        }}
      />

      <div
        id="printable-invoice-modal-root"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm overflow-y-auto"
        style={{ colorScheme: 'dark' }}
      >
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
          {/* Modal Header Toolbar (Hidden during print) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white capitalize text-sm sm:text-base flex items-center gap-2">
                  <span>{type.replace('_', ' ')} Preview</span>
                  {isBulk ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {orderList.length} Orders
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      #{orderList[0]?.order_number || orderList[0]?.id}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Ready to print on A4 sheet for shipment packets or save as PDF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {type === 'invoice' && (
                <>
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Open standalone clean invoice in a new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">New Tab</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Download invoice HTML file"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </>
              )}

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white shadow-lg flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={() => setPrintDocument(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Container */}
          <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/70 flex flex-col gap-6 print-area">
            {orderList.map((rawOrder, idx) => {
              const inv = normalizeInvoiceOrder(rawOrder);

              // 1. SHIPPING LABEL
              if (type === 'shipping_label') {
                const directPdfUrl =
                  rawOrder.shipment?.labelUrl ||
                  rawOrder.labelUrl ||
                  `/admin/shipments/label?orderId=${encodeURIComponent(inv.rawId)}`;

                return (
                  <div
                    key={inv.rawId || idx}
                    className="invoice-sheet-container bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto w-full font-sans text-xs shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/logo.png"
                          alt="Trio Enterprises"
                          className="w-8 h-8 object-contain"
                        />
                        <div>
                          <h4 className="font-black text-sm tracking-tight text-slate-900">
                            TRIO ENTERPRISES
                          </h4>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">
                            Official Logistics Consignment
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-bold uppercase rounded-lg">
                          {inv.courierPartner}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] font-bold uppercase">
                          Consignment AWB
                        </span>
                        <span className="font-mono font-black text-sm text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {inv.trackingNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>Order Reference:</span>
                        <span className="font-bold text-slate-900">{inv.orderNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>Destination:</span>
                        <span className="font-medium">
                          {inv.customerName} ({[inv.city, inv.state].filter(Boolean).join(', ')})
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a
                        href={directPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Open Official Shiprocket Label (PDF)</span>
                      </a>
                      <p className="text-[10px] text-slate-400 text-center mt-2">
                        Renders official thermal 4x6 / A4 barcode label generated directly from Shiprocket servers.
                      </p>
                    </div>
                  </div>
                );
              }

              // 2. PACKING SLIP
              if (type === 'packing_slip') {
                return (
                  <div
                    key={inv.rawId || idx}
                    className="invoice-sheet-container bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg max-w-3xl mx-auto w-full font-sans text-xs"
                  >
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">PACKING SLIP</h2>
                        <p className="text-xs text-slate-500 font-medium">Trio Enterprises Ecart</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-indigo-700">{inv.orderNumber}</p>
                        <p className="text-xs text-slate-500">Date: {inv.invoiceDate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-500 uppercase text-[10px]">
                          Customer Information
                        </p>
                        <p className="font-bold text-slate-800 text-sm mt-1">{inv.customerName}</p>
                        <p className="text-slate-600">{inv.customerEmail}</p>
                        <p className="text-slate-600">{inv.customerPhone}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500 uppercase text-[10px]">
                          Delivery Address
                        </p>
                        <p className="text-slate-700 mt-1">{inv.addressLine}</p>
                        <p className="text-slate-700 font-semibold">
                          {[inv.city, inv.state].filter(Boolean).join(', ')}{' '}
                          {inv.pincode ? `- ${inv.pincode}` : ''}
                        </p>
                        <p className="text-indigo-600 font-semibold mt-1">
                          Courier: {inv.courierPartner} ({inv.trackingNumber})
                        </p>
                      </div>
                    </div>

                    <table className="w-full text-left mb-5">
                      <thead>
                        <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] bg-slate-100">
                          <th className="py-2 text-center w-12">Checked</th>
                          <th className="py-2 px-2">Item Description</th>
                          <th className="py-2 px-2">Color / Variant</th>
                          <th className="py-2 px-2">Size</th>
                          <th className="py-2 px-2 text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inv.items.map((item, i) => (
                          <tr key={i} className="text-slate-800">
                            <td className="py-2.5 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-2 font-medium">{item.name}</td>
                            <td className="py-2.5 px-2 text-slate-600">{item.color || 'Standard'}</td>
                            <td className="py-2.5 px-2 text-slate-600">{item.size || 'Standard'}</td>
                            <td className="py-2.5 px-2 text-right font-bold text-sm">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t border-slate-200 pt-4 flex justify-between text-xs text-slate-500">
                      <p>
                        Total Items Packed:{' '}
                        <strong className="text-slate-800">
                          {inv.items.reduce((a, b) => a + b.quantity, 0)}
                        </strong>
                      </p>
                      <p>Packer Signature: _______________________</p>
                    </div>
                  </div>
                );
              }

              // 3. OFFICIAL GST TAX INVOICE (Default for shipping packets)
              return (
                <div
                  key={inv.rawId || idx}
                  className="invoice-sheet-container bg-white text-slate-900 p-6 sm:p-9 rounded-2xl shadow-xl border border-[#d4af37] max-w-3xl mx-auto w-full font-sans text-xs"
                >
                  {/* Header: Supplier & Tax Invoice Meta */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 mb-4 border-b-2 border-[#d4af37]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/logo.png"
                          alt="Trio Enterprises Logo"
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                        <div>
                          <h1 className="text-xl font-black text-[#7f1d1d] tracking-wide leading-none">
                            TRIO ENTERPRISES
                          </h1>
                          <p className="text-[9.5px] font-extrabold text-[#b45309] uppercase tracking-wider mt-0.5">
                            Ethnic Craft Guild & Devotional Essentials
                          </p>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed pt-1">
                        <p>
                          <strong className="text-slate-900">Attn: Kashyap ji</strong>
                        </p>
                        <p>UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad</p>
                        <p>Near R.B.A COLLEGE, Faridabad, Haryana - 121001, India</p>
                        <p>
                          📞 <strong>+91 7065120322</strong> | ✉️{' '}
                          <strong>care@trioenterprises.com</strong>
                        </p>
                        <div className="mt-1">
                          <span className="inline-block bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold text-[10px] border border-amber-300">
                            GSTIN: 24AAACT1234F1Z8 • State: Haryana (06)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className="inline-block bg-[#7f1d1d] text-white px-3 py-1 rounded font-black text-sm tracking-wider uppercase mb-2">
                        TAX INVOICE
                      </div>
                      <div className="text-[11px] text-slate-700 space-y-0.5">
                        <div>
                          <span className="text-slate-500">Invoice No:</span>{' '}
                          <span className="font-mono font-black text-[#7f1d1d] text-xs">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Order Ref:</span>{' '}
                          <span className="font-mono font-bold text-slate-900">
                            {inv.orderNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Invoice Date:</span>{' '}
                          <strong>{inv.invoiceDate}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Order Time:</span>{' '}
                          <span>{inv.invoiceTime}</span>
                        </div>
                        <div className="pt-1">
                          <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border border-emerald-300">
                            ● {inv.orderStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Courier & AWB Bar */}
                  <div className="bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 mb-4 flex flex-wrap justify-between items-center text-[11px] gap-2">
                    <div>
                      <span className="text-slate-500 font-semibold">Logistics Partner:</span>{' '}
                      <strong className="text-slate-900">{inv.courierPartner}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">AWB / Tracking:</span>{' '}
                      <span className="font-mono font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {inv.trackingNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold">Supply State:</span>{' '}
                      <strong className="text-slate-900">{inv.state || 'Haryana'}</strong>
                    </div>
                  </div>

                  {/* Two-Column Address Box: Billed To & Shipped To */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden p-3.5 text-[11px]">
                    <div className="sm:border-r sm:border-stone-200 sm:pr-3.5 space-y-1">
                      <div className="text-[10px] font-black text-[#7f1d1d] uppercase tracking-wider">
                        Billed To (Customer Details)
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{inv.customerName}</div>
                      <div className="text-slate-600 leading-snug">
                        {inv.addressLine && <p>{inv.addressLine}</p>}
                        <p>
                          {[inv.city, inv.state].filter(Boolean).join(', ')}
                          {inv.pincode ? ` - ${inv.pincode}` : ''}
                        </p>
                        <p>{inv.country}</p>
                        <p className="mt-1">
                          📞 <strong>Phone:</strong> {inv.customerPhone}
                        </p>
                        <p>
                          ✉️ <strong>Email:</strong> {inv.customerEmail}
                        </p>
                      </div>
                    </div>

                    <div className="sm:pl-1 space-y-1">
                      <div className="text-[10px] font-black text-[#7f1d1d] uppercase tracking-wider">
                        Shipped To (Delivery Destination)
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{inv.customerName}</div>
                      <div className="text-slate-600 leading-snug">
                        {inv.addressLine && <p>{inv.addressLine}</p>}
                        <p>
                          {[inv.city, inv.state].filter(Boolean).join(', ')}
                          {inv.pincode ? ` - ${inv.pincode}` : ''}
                        </p>
                        <p>{inv.country}</p>
                        <p className="mt-1">
                          📞 <strong>Phone:</strong> {inv.customerPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Payment Mode Notice Banner for Packers */}
                  {inv.isCod ? (
                    <div className="bg-rose-50 border-2 border-dashed border-rose-500 rounded-lg px-3.5 py-2.5 mb-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">
                          ⚠️ CASH ON DELIVERY (COD)
                        </span>
                        <span className="text-rose-900 font-bold text-[11px] hidden sm:inline">
                          Collect exact cash from recipient on parcel delivery
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-800 text-[11px] font-semibold mr-1.5">
                          Collect:
                        </span>
                        <strong className="text-rose-700 text-base font-black">
                          ₹{inv.codCollectable.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-400 rounded-lg px-3.5 py-2 mb-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">
                          ✓ PREPAID ONLINE ORDER
                        </span>
                        <span className="text-emerald-900 font-semibold text-[11px] hidden sm:inline">
                          Payment captured online. <strong>DO NOT COLLECT CASH.</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-800 text-[11px] font-semibold mr-1.5">
                          Paid:
                        </span>
                        <strong className="text-emerald-700 text-sm font-black">
                          ₹{inv.total.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Items Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#7f1d1d] text-white text-[10px] uppercase tracking-wide">
                          <th className="py-2 px-2.5 text-center w-8">#</th>
                          <th className="py-2 px-2.5">Item Description & Specifications</th>
                          <th className="py-2 px-2 text-center w-14">HSN</th>
                          <th className="py-2 px-2 text-center w-12">Qty</th>
                          <th className="py-2 px-2.5 text-right w-20">Unit Price</th>
                          <th className="py-2 px-2.5 text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {inv.items.map((item) => (
                          <tr key={item.index} className="text-slate-800">
                            <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">
                              {item.index}
                            </td>
                            <td className="py-2 px-2.5">
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                SKU:{' '}
                                <span className="font-mono font-semibold text-slate-700">
                                  {item.sku}
                                </span>
                                {item.color && ` • Shade: ${item.color}`}
                                {item.size && ` • Size: ${item.size}`}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-600">
                              {item.hsn}
                            </td>
                            <td className="py-2 px-2 text-center font-black text-slate-900 text-xs">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-2.5 text-right text-slate-700">
                              ₹{item.price.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold text-[#7f1d1d]">
                              ₹{item.lineTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Calculation & Signature Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4 items-start">
                    {/* Left Notes & Declarations */}
                    <div className="sm:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-600">
                      <div>
                        <strong>Payment Method:</strong> {inv.paymentMethodLabel}
                      </div>
                      <div>
                        <strong>Payment Status:</strong>{' '}
                        <span
                          className={`font-black ${inv.isCod ? 'text-rose-600' : 'text-emerald-700'}`}
                        >
                          {inv.paymentStatusLabel}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-slate-300 pt-1.5 text-slate-500 text-[10px]">
                        <strong>Invoice Amount in Words:</strong>
                        <div className="font-bold italic text-slate-900 text-[11px] mt-0.5">
                          {inv.amountInWords}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400">
                        * All rates inclusive of applicable Goods & Services Tax (GST 18% under HSN 6304).
                      </p>
                    </div>

                    {/* Right Totals Breakdown */}
                    <div className="sm:col-span-5 space-y-1 text-[11px] text-slate-700">
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500">Items Subtotal:</span>
                        <span className="font-bold text-slate-900">
                          ₹{inv.subtotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {inv.discount > 0 && (
                        <div className="flex justify-between py-0.5 text-emerald-700">
                          <span>
                            Discount {inv.couponCode ? `(${inv.couponCode})` : ''}:
                          </span>
                          <span className="font-bold">
                            -₹{inv.discount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500">Shipping Charges:</span>
                        <span className="font-bold">
                          {inv.shipping === 0 ? (
                            <span className="text-emerald-700 font-black uppercase text-[10px]">
                              FREE
                            </span>
                          ) : (
                            `₹${inv.shipping.toLocaleString('en-IN')}`
                          )}
                        </span>
                      </div>
                      {inv.platformFee > 0 && (
                        <div className="flex justify-between py-0.5">
                          <span className="text-slate-500">Handling Fee:</span>
                          <span className="font-bold text-slate-900">
                            ₹{inv.platformFee.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between py-0.5 text-slate-400 text-[10px]">
                        <span>Included GST (18%):</span>
                        <span>₹{inv.tax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="border-y-2 border-[#7f1d1d] py-1.5 flex justify-between items-center text-sm font-black text-slate-900 mt-1">
                        <span>Grand Total:</span>
                        <span className="text-base text-[#7f1d1d]">
                          ₹{inv.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Signatory Section */}
                  <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row justify-between items-end gap-3 text-[10px] text-slate-500">
                    <div className="space-y-0.5">
                      <strong className="text-slate-700">Terms & Return Conditions:</strong>
                      <p>
                        • Returns & exchanges accepted within 10 days of delivery for defective or transit-damaged items.
                      </p>
                      <p>
                        • Handcrafted Indian ethnic goods may have subtle artisan variations that celebrate authentic craftwork.
                      </p>
                      <p>
                        • This is an authentic, electronically generated commercial tax invoice and does not require a physical signature.
                      </p>
                    </div>

                    <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="inline-block text-center border-t border-slate-600 pt-1 w-40">
                        <p className="font-black text-[#7f1d1d] uppercase text-[9.5px]">
                          For TRIO ENTERPRISES
                        </p>
                        <p className="text-[8.5px] italic text-slate-400 py-1">
                          [Digitally Authorized Seal]
                        </p>
                        <p className="font-bold text-slate-700 text-[9px]">
                          Authorized Signatory
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
