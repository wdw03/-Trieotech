'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { createClient } from '../lib/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const supabase = createClient();

  // ── Fetch profile + addresses from Supabase ──
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profError) throw profError;
      setProfile(prof);

      const { data: addrs } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      setAddresses(addrs || []);

      return prof;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, [supabase]);

  // ── Fetch user orders from Supabase ──
  const fetchOrders = useCallback(async (userId) => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          payments (*),
          shipments (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (orders || []).map((o) => ({
        ...o,
        id: o.order_number || o.id,
        dbId: o.id,
        date: new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        items: (o.order_items || []).map((item) => ({
          productId: item.product_id,
          name: item.name,
          image: item.image,
          price: Number(item.price),
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        })),
        trackingNumber: o.shipments?.[0]?.awb_number || `BLUEDART-${(o.order_number || o.id).slice(-6)}`,
        carrier: o.shipments?.[0]?.courier_name || 'BlueDart Express',
        total: Number(o.total),
      }));

      setUserOrders(normalized);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setUserOrders([]);
    }
  }, [supabase]);

  // ── Initialize auth state ──
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
          await fetchProfile(authUser.id);
          await fetchOrders(authUser.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          await fetchOrders(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setAddresses([]);
          setUserOrders([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, fetchOrders]);

  // ── Login ──
  const login = async (email, password) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        addToast(error.message || 'Login failed', 'error');
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
        await fetchOrders(data.user.id);
      }

      addToast('Welcome back to Trio Ecart!', 'success');
      return { success: true };
    } catch (err) {
      addToast('Something went wrong', 'error');
      return { success: false, error: err.message };
    }
  };

  // ── Send Signup OTP (Direct to Email) ──
  const sendSignupOtp = async (email, name) => {
    try {
      const res = await fetch('/api/auth/send-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.error || 'Failed to send OTP email', 'error');
        return { success: false, error: data.error };
      }
      addToast('Verification code sent to ' + email, 'info');
      return {
        success: true,
        verificationToken: data.verificationToken,
        expiresAt: data.expiresAt,
      };
    } catch (err) {
      addToast('Failed to send verification code', 'error');
      return { success: false, error: err.message };
    }
  };

  // ── Verify Signup OTP & Auto-Login ──
  const verifySignupOtp = async ({ email, otp, verificationToken, expiresAt, name, phone, password }) => {
    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          verificationToken,
          expiresAt,
          name,
          phone,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.error || 'Invalid OTP code', 'error');
        return { success: false, error: data.error };
      }

      // Automatically sign in with the newly verified credentials
      if (password) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });
            if (!signInError && signInData?.user) {
              setUser(signInData.user);
              await fetchProfile(signInData.user.id);
              await fetchOrders(signInData.user.id);
              break;
            } else if (signInError) {
              console.warn(`Auto sign-in attempt ${attempt + 1}:`, signInError.message);
            }
          } catch (e) {
            console.warn(`Auto sign-in attempt ${attempt + 1} err:`, e);
          }
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      addToast('Account verified! Welcome to Trio Enterprises.', 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message || 'Verification failed', 'error');
      return { success: false, error: err.message };
    }
  };

  // Legacy register wrapper for backward compatibility
  const register = async (formData) => {
    return await sendSignupOtp(formData.email, formData.name);
  };

  // ── Resend Signup OTP ──
  const resendSignupOtp = async (email, name) => {
    return await sendSignupOtp(email, name);
  };

  // ── Logout ──
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAddresses([]);
    setUserOrders([]);
    addToast('Logged out successfully', 'info');
  };

  // ── Send Password Reset OTP ──
  const sendResetOtp = async (email) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const res = await fetch('/api/auth/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.error || 'Failed to send reset code', 'error');
        return { success: false, error: data.error };
      }
      addToast('Password reset code sent to your email', 'info');
      return {
        success: true,
        verificationToken: data.verificationToken,
        expiresAt: data.expiresAt,
      };
    } catch (err) {
      addToast('Failed to send reset code', 'error');
      return { success: false, error: err.message };
    }
  };

  // ── Verify Reset OTP & Auto-Login with New Password ──
  const verifyResetOtp = async ({ email, otp, verificationToken, expiresAt, newPassword }) => {
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (newPassword || '').trim();

      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: (otp || '').trim(),
          verificationToken,
          expiresAt,
          newPassword: cleanPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.error || 'Invalid or expired OTP', 'error');
        return { success: false, error: data.error };
      }

      // Automatically sign in with the newly set password
      if (cleanPassword) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });
            if (!signInError && signInData?.user) {
              setUser(signInData.user);
              await fetchProfile(signInData.user.id);
              await fetchOrders(signInData.user.id);
              break;
            }
          } catch (e) {
            console.warn('Reset auto sign-in notice:', e);
          }
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      addToast('Password reset successfully! Welcome back.', 'success');
      return { success: true };
    } catch (err) {
      addToast(err.message || 'Verification failed', 'error');
      return { success: false, error: err.message };
    }
  };

  // ── Legacy Forgot Password ──
  const resetPassword = async (email) => {
    return await sendResetOtp(email);
  };

  // ── Add Address ──
  const addAddress = async (addressData) => {
    if (!user) return null;

    try {
      // If setting as default, unset all others first
      if (addressData.isDefault || addresses.length === 0) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data: newAddr, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: addressData.name,
          phone: addressData.phone,
          address_line: addressData.address || addressData.address_line,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.zip || addressData.pincode,
          country: addressData.country || 'India',
          is_default: addressData.isDefault || addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh addresses
      await fetchProfile(user.id);
      addToast('New delivery address added', 'success');
      return newAddr;
    } catch (err) {
      console.error('Error adding address:', err);
      addToast('Failed to add address', 'error');
      return null;
    }
  };

  // ── Delete Address ──
  const deleteAddress = async (addressId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      addToast('Address removed', 'info');
    } catch (err) {
      console.error('Error deleting address:', err);
      addToast('Failed to remove address', 'error');
    }
  };

  // ── Update Profile ──
  const updateProfile = async (updatedData) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedData.name || updatedData.full_name || profile?.full_name,
          phone: updatedData.phone || profile?.phone,
          avatar_url: updatedData.avatar || updatedData.avatar_url || profile?.avatar_url,
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      addToast('Profile updated successfully!', 'success');
      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      addToast('Failed to update profile', 'error');
      return { success: false };
    }
  };

  // ── Add Order (called after payment verification) ──
  const addOrder = (order) => {
    setUserOrders((prev) => [order, ...prev]);
  };

  // ── Refresh Orders ──
  const refreshOrders = async () => {
    if (user) await fetchOrders(user.id);
  };

  // ── Computed user object for backward compatibility ──
  const compatUser = user
    ? {
        id: user.id,
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Artisan Patron',
        email: user.email,
        phone: profile?.phone || user.user_metadata?.phone || '',
        avatar: profile?.avatar_url || user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
        role: profile?.role || user.user_metadata?.role || (user.email === 'trioent19@gmail.com' ? 'admin' : 'customer'),
        addresses: addresses.map((a) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          address: a.address_line,
          city: a.city,
          state: a.state,
          zip: a.pincode,
          country: a.country,
          isDefault: a.is_default,
        })),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: compatUser,
        authUser: user,
        profile,
        addresses,
        isAuthenticated: !!user,
        loading,
        userOrders,
        login,
        register,
        sendSignupOtp,
        verifySignupOtp,
        resendSignupOtp,
        logout,
        resetPassword,
        sendResetOtp,
        verifyResetOtp,
        addAddress,
        deleteAddress,
        updateProfile,
        addOrder,
        refreshOrders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
