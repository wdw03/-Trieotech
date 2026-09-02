import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  User,
  MapPin,
  Package,
  Heart,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout, addAddress, deleteAddress, userOrders } = useAuth();
  const { wishlistCount } = useWishlist();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    zip: '302001',
    country: 'India',
    isDefault: false
  });

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (newAddress.name && newAddress.phone && newAddress.address && newAddress.zip) {
      addAddress(newAddress);
      setIsAddingAddress(false);
      setNewAddress({
        name: user?.name || '',
        phone: user?.phone || '',
        address: '',
        city: 'Jaipur',
        state: 'Rajasthan',
        zip: '302001',
        country: 'India',
        isDefault: false
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-ivory-100">Please Sign In</h2>
        <p className="text-xs text-stone-500">Sign in to manage your addresses, orders, and wishlist.</p>
        <Link to="/login" className="btn-primary text-xs font-bold uppercase tracking-wider inline-flex">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO title="My Account | Trio Ecart" />

      <Breadcrumb items={[{ name: 'My Account', url: '/profile' }]} />

      {/* User Banner Header */}
      <div className="ethnic-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-ivory-100 via-white to-ivory-100 dark:from-[#1A110B] dark:via-[#140D08] dark:to-[#1A110B]">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row w-full sm:w-auto">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-500/40 shadow-md shrink-0"
          />
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h1 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
                {user.name}
              </h1>
              <span className="badge-ribbon bg-gold-500/20 text-gold-800 dark:text-gold-300 font-bold border border-gold-500/30 shrink-0">
                Verified Patron
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-stone-600 dark:text-stone-300 justify-center sm:justify-start">
              <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 min-w-0">
                <Mail className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                <span className="truncate">{user.email}</span>
              </span>
              <span className="hidden sm:inline text-stone-300 dark:text-stone-700 select-none">•</span>
              <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 whitespace-nowrap shrink-0">
                <Phone className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                <span className="font-medium tracking-wide whitespace-nowrap">{user.phone}</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-outline-maroon py-2.5 px-5 text-xs font-bold flex items-center gap-2 shrink-0 self-center sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Quick Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/profile/orders"
          className="p-5 rounded-2xl ethnic-card hover:border-gold-500/50 flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">My Orders</span>
            <h3 className="font-serif font-black text-2xl text-maroon-800 dark:text-gold-400">
              {userOrders.length}
            </h3>
            <p className="text-[11px] text-stone-400">View live tracking &amp; invoices</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-maroon-700/10 dark:bg-maroon-950 text-maroon-700 dark:text-gold-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6" />
          </div>
        </Link>

        <Link
          to="/wishlist"
          className="p-5 rounded-2xl ethnic-card hover:border-gold-500/50 flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Saved Wishlist</span>
            <h3 className="font-serif font-black text-2xl text-maroon-800 dark:text-gold-400">
              {wishlistCount}
            </h3>
            <p className="text-[11px] text-stone-400">Explore saved crafts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gold-500/10 dark:bg-stone-800 text-gold-600 dark:text-gold-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6" />
          </div>
        </Link>

        <div className="p-5 rounded-2xl ethnic-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Patron Status</span>
            <h3 className="font-serif font-black text-xl text-stone-900 dark:text-ivory-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-500" /> Artisan Guild Tier
            </h3>
            <p className="text-[11px] text-stone-400">Enjoy 20% festive codes</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Address Book Section */}
      <div className="ethnic-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
          <div>
            <h2 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-ivory-100">
              Saved Delivery Addresses ({user.addresses?.length || 0})
            </h2>
            <p className="text-xs text-stone-500">Manage your shipping destinations for faster checkout.</p>
          </div>
          
          <button
            onClick={() => setIsAddingAddress(!isAddingAddress)}
            className="btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* New Address Form */}
        {isAddingAddress && (
          <form onSubmit={handleAddAddressSubmit} className="p-6 rounded-2xl bg-ivory-100/70 dark:bg-stone-900/70 border border-gold-500/30 space-y-4 animate-fade-in">
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100">
              Add New Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Full Recipient Name"
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs"
              />
              <input
                type="tel"
                required
                placeholder="Mobile Number"
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs"
              />
            </div>

            <input
              type="text"
              required
              placeholder="Door / Flat No, Street, Landmark"
              value={newAddress.address}
              onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs"
              />
              <input
                type="text"
                required
                placeholder="State"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs"
              />
              <input
                type="text"
                required
                maxLength={6}
                placeholder="PIN Code"
                value={newAddress.zip}
                onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider"
              >
                Save Address
              </button>
            </div>
          </form>
        )}

        {/* Address Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses?.map((addr) => (
            <div
              key={addr.id}
              className="p-5 rounded-2xl bg-ivory-50 dark:bg-stone-900/40 border border-gold-500/20 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100">{addr.name}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] bg-gold-500/20 text-gold-800 dark:text-gold-300 font-bold px-2 py-0.5 rounded-full border border-gold-500/40">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {addr.address}, {addr.city}, {addr.state} - {addr.zip}
                </p>
                <p className="text-[11px] text-stone-500 flex items-center gap-1.5 whitespace-nowrap pt-1">
                  <Phone className="w-3 h-3 text-gold-600 shrink-0" />
                  <span>{addr.phone}</span>
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-gold-500/10">
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="text-stone-400 hover:text-maroon-700 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
