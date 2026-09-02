import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Package, Truck, ArrowRight, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

export const MyOrdersPage = () => {
  const { userOrders } = useAuth();
  const { addToCart, openCart } = useCart();

  const handleReorder = (order) => {
    order.items.forEach(item => {
      addToCart({ id: item.productId, name: item.name, price: item.price, images: [item.image] }, item.quantity, item.color, item.size);
    });
    openCart();
  };

  if (!userOrders || userOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SEO title="My Orders | Trio Ecart" />
        <Breadcrumb items={[{ name: 'Account', url: '/profile' }, { name: 'My Orders', url: '/profile/orders' }]} />
        <EmptyState
          icon={Package}
          title="No Orders Placed Yet"
          description="You haven't placed any handcrafted orders yet. Discover our latest Zardosi and copper creations."
          actionText="Start Shopping"
          actionUrl="/shop"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="Order History & Invoices | Trio Ecart" />

      <Breadcrumb items={[{ name: 'Account', url: '/profile' }, { name: 'My Orders', url: '/profile/orders' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/20 pb-4">
        <div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
            My Past Orders ({userOrders.length})
          </h1>
          <p className="text-xs text-stone-500">
            View order details, download invoices, and track live shipments.
          </p>
        </div>
      </div>

      {/* Orders List Cards */}
      <div className="space-y-6">
        {userOrders.map((order) => (
          <div
            key={order.id}
            className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-5 border border-gold-500/20 hover:border-gold-500/40 transition-all"
          >
            {/* Top Bar Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gold-500/10 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-serif font-black text-base text-stone-900 dark:text-ivory-100">
                    Order {order.id}
                  </span>
                  <span
                    className={`badge-ribbon ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-stone-500">
                  Placed on {order.date} • {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-stone-500 uppercase font-bold block">Total Amount</span>
                <span className="font-serif font-black text-base text-maroon-800 dark:text-gold-400">
                  ₹{order.total?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Items Row */}
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gold-500/20" />
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-stone-900 dark:text-ivory-100 truncate">{item.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        Qty: {item.quantity} {item.color ? `• Shade: ${item.color}` : ''} {item.size ? `• ${item.size}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="font-serif font-bold text-stone-800 dark:text-stone-200 shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-gold-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-stone-500">
                Tracking ID: <strong className="font-mono text-stone-800 dark:text-stone-200">{order.trackingNumber}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReorder(order)}
                  className="btn-outline-maroon py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Buy Again</span>
                </button>
                <Link
                  to={`/track-order?id=${order.id}`}
                  className="btn-primary py-2 px-5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-maroon-sm"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Track Parcel</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrdersPage;
