import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { mockOrders } from '../data/orders';

const AuthContext = createContext();

const DEFAULT_USER = {
  id: "USR-78219",
  name: "Radhika Singhania",
  email: "radhika.singhania@example.com",
  phone: "+91 98234 56789",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80",
  addresses: [
    {
      id: "ADDR-1",
      name: "Radhika Singhania (Home)",
      phone: "+91 98234 56789",
      address: "Flat 402, Royal Palms Residency, MG Road",
      city: "Jaipur",
      state: "Rajasthan",
      zip: "302001",
      country: "India",
      isDefault: true
    },
    {
      id: "ADDR-2",
      name: "Radhika Singhania (Design Boutique Studio)",
      phone: "+91 98234 56789",
      address: "Studio 14, Johari Bazaar Artisan Square",
      city: "Jaipur",
      state: "Rajasthan",
      zip: "302003",
      country: "India",
      isDefault: false
    }
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('trio_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [userOrders, setUserOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('trio_user_orders');
      return saved ? JSON.parse(saved) : mockOrders;
    } catch {
      return mockOrders;
    }
  });

  const { addToast } = useToast();

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('trio_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('trio_user');
      }
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('trio_user_orders', JSON.stringify(userOrders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [userOrders]);

  const login = (email, password) => {
    const loggedUser = {
      ...DEFAULT_USER,
      email: email || DEFAULT_USER.email
    };
    setUser(loggedUser);
    addToast('Welcome back to Trio Ecart!', 'success');
    return { success: true };
  };

  const register = (formData) => {
    const newUser = {
      id: `USR-${Date.now().toString().slice(-5)}`,
      name: formData.name || 'Artisan Patron',
      email: formData.email,
      phone: formData.phone || '',
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80",
      addresses: []
    };
    setUser(newUser);
    addToast('Welcome to Trio Ecart artisan family!', 'success');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    addToast('Logged out successfully', 'info');
  };

  const addAddress = (addressData) => {
    const newAddr = {
      ...addressData,
      id: `ADDR-${Date.now().toString().slice(-4)}`,
      isDefault: user.addresses.length === 0 ? true : !!addressData.isDefault
    };

    let updatedAddresses = [...user.addresses];
    if (newAddr.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddr);

    setUser(prev => ({
      ...prev,
      addresses: updatedAddresses
    }));

    addToast('New delivery address added', 'success');
    return newAddr;
  };

  const deleteAddress = (addressId) => {
    setUser(prev => ({
      ...prev,
      addresses: prev.addresses.filter(a => a.id !== addressId)
    }));
    addToast('Address removed', 'info');
  };

  const updateProfile = (updatedData) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedData };
      return updated;
    });
    addToast('Profile updated successfully!', 'success');
    return { success: true };
  };

  const addOrder = (order) => {
    setUserOrders(prev => [order, ...prev]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        userOrders,
        login,
        register,
        logout,
        addAddress,
        deleteAddress,
        updateProfile,
        addOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
