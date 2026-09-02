import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
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
  ShieldCheck,
  Pencil,
  Camera,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const AVATAR_PRESETS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80', label: 'Classic' },
  { id: '2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80', label: 'Artisan' },
  { id: '3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80', label: 'Royal' },
  { id: '4', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80', label: 'Festive' }
];

export const ProfilePage = () => {
  const { user, logout, addAddress, deleteAddress, updateProfile, userOrders } = useAuth();
  const { wishlistCount } = useWishlist();
  const { addToast } = useToast();

  const fileInputRef = useRef(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || ''
  });
  const [phoneError, setPhoneError] = useState('');

  // Add Address State
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

  const openEditModal = () => {
    setEditFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || ''
    });
    setPhoneError('');
    setIsEditModalOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file (JPG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image size should be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditFormData(prev => ({
          ...prev,
          avatar: event.target.result
        }));
        addToast('Photo loaded successfully! Click Save to confirm.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();

    // Validation
    const cleanPhone = editFormData.phone.trim();
    if (!cleanPhone) {
      setPhoneError('Phone number is required');
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setPhoneError('');

    updateProfile({
      name: editFormData.name.trim() || user.name,
      phone: cleanPhone.startsWith('+') ? cleanPhone : `+91 ${cleanPhone.replace(/^91\s*/, '')}`,
      avatar: editFormData.avatar
    });

    setIsEditModalOpen(false);
  };

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

      {/* User Banner Header Card */}
      <div className="ethnic-card p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-ivory-100 via-white to-ivory-100 dark:from-[#1A110B] dark:via-[#140D08] dark:to-[#1A110B]">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row w-full sm:w-auto">
          
          {/* Avatar with Direct Click Overlay */}
          <div className="relative group cursor-pointer shrink-0" onClick={openEditModal} title="Change Profile Photo">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-500/40 shadow-md group-hover:brightness-90 transition-all"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold-500 text-maroon-950 flex items-center justify-center shadow-md border border-white dark:border-stone-900">
              <Pencil className="w-3 h-3" />
            </span>
          </div>

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

        {/* Action Buttons: Edit Profile & Sign Out */}
        <div className="flex items-center gap-2.5 shrink-0 self-center sm:self-auto w-full sm:w-auto justify-center">
          <button
            onClick={openEditModal}
            className="btn-gold py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-gold-sm flex-1 sm:flex-initial"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={logout}
            className="btn-outline-maroon py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 flex-1 sm:flex-initial"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL DIALOG */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#1A110B] rounded-3xl border-2 border-gold-500/40 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gold-500/20">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-widest text-gold-700 dark:text-gold-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Patron Settings
                </span>
                <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-ivory-100">
                  Edit Patron Profile
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-maroon-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
              
              {/* Photo Upload Section */}
              <div className="space-y-3">
                <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs">
                  Profile Photo &amp; Avatar
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={editFormData.avatar || user.avatar}
                      alt="Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-500/50 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-maroon-700 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                      title="Upload New Image"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-outline-maroon py-2 px-4 text-xs font-bold flex items-center gap-1.5 w-full sm:w-auto justify-center"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload From Device</span>
                    </button>
                    <p className="text-[11px] text-stone-400">
                      Supports JPG, PNG, WEBP up to 5MB.
                    </p>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="pt-2">
                  <span className="text-[11px] text-stone-500 block mb-2 font-medium">Or choose a royal craft avatar:</span>
                  <div className="flex items-center gap-2.5">
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, avatar: p.url }))}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                          editFormData.avatar === p.url
                            ? 'border-maroon-700 ring-2 ring-gold-500 scale-105'
                            : 'border-gold-500/20 opacity-70 hover:opacity-100'
                        }`}
                        title={p.label}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                        {editFormData.avatar === p.url && (
                          <div className="absolute inset-0 bg-maroon-900/40 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30 text-xs text-stone-900 dark:text-ivory-100 outline-none focus:border-maroon-700 dark:focus:border-gold-500"
                  />
                  <User className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-500 block text-xs">
                  Registered Email Address (Locked)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 text-xs text-stone-500 cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Mobile Phone Number Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700 dark:text-stone-300 block text-xs">
                  Mobile Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+91 98234 56789"
                    value={editFormData.phone}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, phone: e.target.value });
                      if (phoneError) setPhoneError('');
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-ivory-100 dark:bg-stone-900 border text-xs text-stone-900 dark:text-ivory-100 outline-none ${
                      phoneError
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-gold-500/30 focus:border-maroon-700 dark:focus:border-gold-500'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-gold-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium pt-0.5">
                    <AlertCircle className="w-3 h-3" /> {phoneError}
                  </p>
                )}
                <p className="text-[10px] text-stone-400">
                  Used for order dispatch SMS and BlueDart delivery updates.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-500/20">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 font-bold uppercase tracking-wider shadow-maroon-sm"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
