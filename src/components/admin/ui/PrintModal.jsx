'use client';
import React from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { Printer, X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { calculateOrderTotal } from '../../../data/admin/orders.js';

export const PrintModal = () => {
  const { printDocument, setPrintDocument, showToast } = useAdmin();

  if (!printDocument) return null;

  const { type, data } = printDocument;
  const isBulk = Array.isArray(data);
  const orderList = isBulk ? data : [data];

  const handlePrint = () => {
    if (type === 'shipping_label') {
      const orderIdsParam = orderList.map((o) => o.id || o.order_number).join(',');
      const url = `/admin/shipments/label?orderIds=${encodeURIComponent(orderIdsParam)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      showToast(`Opening official Shiprocket shipping label for ${orderList.length} order(s)!`);
      return;
    }
    window.print();
    showToast(`Print command sent for ${type.replace('_', ' ')}!`);
  };

  const handleDownload = () => {
    showToast(`Downloaded ${type.replace('_', ' ')} as PDF.`);
  };

  return (
    <div
      className="admin-portal dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print"
      style={{ colorScheme: 'dark' }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white capitalize text-base">
                {type.replace('_', ' ')} Preview {isBulk ? `(${orderList.length} Orders)` : `- ${orderList[0]?.id}`}
              </h3>
              <p className="text-xs text-slate-400">Ready to print or download as PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="btn-secondary py-1.5 px-3 text-xs">
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button onClick={handlePrint} className="btn-primary py-1.5 px-3.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              Print Now
            </button>
            <button
              onClick={() => setPrintDocument(null)}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="p-6 overflow-y-auto bg-slate-950 flex flex-col gap-8 print-area">
          {orderList.map((order, idx) => {
            const { subtotal, tax, shipping, discount, total } = calculateOrderTotal(order);

            if (type === 'shipping_label') {
              const directPdfUrl = order.shipment?.labelUrl || order.labelUrl || `/admin/shipments/label?orderId=${encodeURIComponent(order.id)}`;
              return (
                <div
                  key={order.id}
                  className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto w-full font-sans text-xs shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <img src="/logo.png" alt="Trio Enterprises" className="w-8 h-8 object-contain" />
                      <div>
                        <h4 className="font-black text-sm tracking-tight text-slate-900">TRIO ENTERPRISES</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Official Logistics Consignment</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-indigo-700 text-white px-2.5 py-1 text-[11px] font-bold uppercase rounded-lg">
                        {order.shippingPartner || order.shipment?.courierName || 'Shiprocket'} Express
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-bold uppercase">Consignment AWB</span>
                      <span className="font-mono font-black text-sm text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {order.trackingNumber || order.shipment?.awb || 'Live Assigned on Print'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Order Reference:</span>
                      <span className="font-bold text-slate-900">{order.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span>Destination:</span>
                      <span className="font-medium">{order.customer?.name} ({order.customer?.address?.city}, {order.customer?.address?.state})</span>
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

            if (type === 'packing_slip') {
              return (
                <div key={order.id} className="bg-white text-slate-900 p-8 rounded-xl shadow-lg max-w-3xl mx-auto w-full font-sans text-sm">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">PACKING SLIP</h2>
                      <p className="text-xs text-slate-500 font-medium">Trio Ecart Enterprise</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base text-indigo-700">{order.id}</p>
                      <p className="text-xs text-slate-500">Date: {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-500 uppercase">Customer Information</p>
                      <p className="font-bold text-slate-800 text-sm mt-1">{order.customer.name}</p>
                      <p className="text-slate-600">{order.customer.email}</p>
                      <p className="text-slate-600">{order.customer.phone}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-500 uppercase">Delivery Address</p>
                      <p className="text-slate-700 mt-1">{order.customer.address.street}</p>
                      <p className="text-slate-700 font-semibold">{order.customer.address.city}, {order.customer.address.state} - {order.customer.address.pincode}</p>
                      <p className="text-indigo-600 font-semibold mt-1">Courier: {order.shippingPartner} ({order.trackingNumber})</p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs mb-6">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[11px]">
                        <th className="py-2 text-center w-12">Checked</th>
                        <th className="py-2">Item Description</th>
                        <th className="py-2">Color / Variant</th>
                        <th className="py-2">Size</th>
                        <th className="py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.items.map((item, i) => (
                        <tr key={i} className="text-slate-800">
                          <td className="py-2.5 text-center">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                          </td>
                          <td className="py-2.5 font-medium">{item.name}</td>
                          <td className="py-2.5 text-slate-600">{item.selectedColor}</td>
                          <td className="py-2.5 text-slate-600">{item.selectedSize}</td>
                          <td className="py-2.5 text-right font-bold text-sm">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-slate-200 pt-4 flex justify-between text-xs text-slate-500">
                    <p>Total Items Packed: <strong className="text-slate-800">{order.items.reduce((a, b) => a + b.quantity, 0)}</strong></p>
                    <p>Packer Signature: _______________________</p>
                  </div>
                </div>
              );
            }

            // Default: TAX INVOICE
            return (
              <div key={order.id} className="bg-white text-slate-900 p-8 rounded-xl shadow-lg max-w-3xl mx-auto w-full font-sans text-sm">
                <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <img src="/logo.png" alt="Trio Enterprises" className="w-9 h-9 object-contain" />
                      <div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                          TRIO <span className="text-amber-600">ENTERPRISES</span>
                        </span>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ethnic Craft Guild</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">GSTIN: 24AAACT1234F1Z8 • Attn: Kashyap ji</p>
                    <p className="text-xs text-slate-500">UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad, Near R.B.A COLLEGE, 121001</p>
                    <p className="text-xs text-slate-500">care@trioenterprises.com | +91 7065120322</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-800 tracking-wide uppercase">TAX INVOICE</h2>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">Invoice #: INV-{order.id.replace('ORD-', '')}</p>
                    <p className="text-xs text-slate-500">Order Ref: {order.id}</p>
                    <p className="text-xs text-slate-500">Invoice Date: {new Date(order.date).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500">Payment: <span className="font-semibold text-emerald-700">{order.paymentMethod} ({order.paymentStatus})</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">Billed & Shipped To:</p>
                    <p className="font-bold text-slate-900 text-sm">{order.customer.name}</p>
                    <p className="text-slate-600 mt-1">{order.customer.address.street}</p>
                    <p className="text-slate-600 font-semibold">{order.customer.address.city}, {order.customer.address.state} - {order.customer.address.pincode}</p>
                    <p className="text-slate-600 mt-1">Phone: {order.customer.phone}</p>
                    <p className="text-slate-600">Email: {order.customer.email}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">Shipping Information:</p>
                      <p className="text-slate-700">Courier Partner: <strong className="text-slate-900">{order.shippingPartner}</strong></p>
                      <p className="text-slate-700">AWB Tracking: <strong className="font-mono text-indigo-700">{order.trackingNumber}</strong></p>
                      <p className="text-slate-700">Estimated Delivery: {order.estimatedDelivery}</p>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Handcrafted Quality Guaranteed
                    </div>
                  </div>
                </div>

                <table className="w-full text-left text-xs mb-6">
                  <thead>
                    <tr className="border-y border-slate-300 text-slate-600 uppercase text-[11px] bg-slate-100">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3">Variant / Size</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item, i) => (
                      <tr key={i} className="text-slate-800">
                        <td className="py-3 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 font-medium">
                          {item.name}
                          <div className="text-[10px] text-slate-500">{item.category}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.selectedColor} • {item.selectedSize}
                        </td>
                        <td className="py-3 px-3 text-right">₹{item.price}</td>
                        <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-semibold">₹{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Breakdown */}
                <div className="flex justify-end mb-6">
                  <div className="w-64 space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>Item Subtotal:</span>
                      <span className="font-semibold">₹{subtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount Applied:</span>
                        <span>-₹{discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax (GST 18%):</span>
                      <span>₹{tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping Charges:</span>
                      <span>{shipping === 0 ? <strong className="text-emerald-600 uppercase text-[10px]">Free</strong> : `₹${shipping}`}</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-bold text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-indigo-900 font-extrabold">₹{total}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-500 flex justify-between items-end">
                  <div>
                    <p className="font-bold text-slate-700">Terms & Conditions:</p>
                    <p>• Returns accepted within 10 days of delivery for defective items.</p>
                    <p>• Handcrafted items may have minor charming artisan variations.</p>
                    <p>• This is a computer generated invoice and does not require physical signature.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">For TRIO ECART</p>
                    <div className="h-10"></div>
                    <p className="border-t border-slate-400 pt-1">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
