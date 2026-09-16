'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  UserCheck,
  UserX,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Loader2,
  X,
  Crown,
  Sliders,
  Sparkles,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';

export const UserRoles = () => {
  const {
    usersList,
    isLoadingUsers,
    fetchUsers,
    assignRole,
    removeRole,
    adminUser,
    isSuperAdmin,
    showToast
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleTab, setSelectedRoleTab] = useState('ALL'); // 'ALL' | 'SUPER_ADMIN' | 'SEO_MANAGER' | 'CUSTOMER'
  const [modalOpen, setModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);
  const [newRole, setNewRole] = useState('seo_manager');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleOpenAssignModal = (user) => {
    setSelectedUser(user);
    const curr = (user.role || '').toLowerCase();
    if (curr.includes('super') || user.email === 'trioenterprises10@gmail.com') {
      setNewRole('super_admin');
    } else if (curr.includes('seo') || curr.includes('cms')) {
      setNewRole('seo_manager');
    } else {
      setNewRole('seo_manager');
    }
    setModalOpen(true);
  };

  const handleConfirmRoleAssign = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const res = await assignRole(selectedUser.id, selectedUser.email, newRole);
      if (res.success) {
        setModalOpen(false);
        setSelectedUser(null);
        await fetchUsers(searchQuery);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenRemoveModal = (user) => {
    setUserToRemove(user);
    setRemoveModalOpen(true);
  };

  const handleConfirmRoleRemoval = async () => {
    if (!userToRemove) return;
    setIsUpdating(true);
    try {
      const res = await removeRole(userToRemove.id, userToRemove.email);
      if (res.success) {
        setRemoveModalOpen(false);
        setUserToRemove(null);
        await fetchUsers(searchQuery);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format role information cleanly
  const getRoleBadge = (user) => {
    const rawRole = (user.role || '').toLowerCase();
    const isMaster = user.email === 'trioenterprises10@gmail.com';
    const isSuper = rawRole.includes('super') || isMaster;
    const isSeo = rawRole.includes('seo') || rawRole.includes('cms');

    if (isSuper) {
      return {
        key: 'super_admin',
        title: 'Super Admin',
        subtitle: 'Full Dashboard Access & Role Management',
        badgeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
        cardBg: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
        dotColor: 'bg-amber-400',
        icon: Crown,
        pillText: '👑 Super Admin',
        allowedText: 'Orders, Inventory, Products, CMS, Roles, Settings'
      };
    }
    if (isSeo) {
      return {
        key: 'seo_manager',
        title: 'SEO & CMS Manager',
        subtitle: 'Content & Storefront CMS Access Only',
        badgeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
        cardBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200',
        dotColor: 'bg-indigo-400',
        icon: Sliders,
        pillText: '🎨 SEO / CMS Manager',
        allowedText: 'Home Banners, Reels, Blogs, Inquiries, Static Pages'
      };
    }
    return {
      key: 'customer',
      title: 'Customer (Normal User)',
      subtitle: 'Storefront Shopping Only (No Admin Access)',
      badgeBg: 'bg-slate-800/80 border-slate-700 text-slate-400',
      cardBg: 'bg-slate-800/40 border-slate-700/60 text-slate-400',
      dotColor: 'bg-slate-500',
      icon: Users,
      pillText: '👤 Customer / User',
      allowedText: 'Storefront Customer Only'
    };
  };

  // Role summary counts
  const roleCounts = useMemo(() => {
    let superCount = 0;
    let seoCount = 0;
    let custCount = 0;

    usersList.forEach((u) => {
      const info = getRoleBadge(u);
      if (info.key === 'super_admin') superCount++;
      else if (info.key === 'seo_manager') seoCount++;
      else custCount++;
    });

    return {
      all: usersList.length,
      super: superCount,
      seo: seoCount,
      cust: custCount
    };
  }, [usersList]);

  // Filter users by selected tab
  const filteredUsers = useMemo(() => {
    if (selectedRoleTab === 'ALL') return usersList;
    return usersList.filter((u) => {
      const info = getRoleBadge(u);
      if (selectedRoleTab === 'SUPER_ADMIN') return info.key === 'super_admin';
      if (selectedRoleTab === 'SEO_MANAGER') return info.key === 'seo_manager';
      if (selectedRoleTab === 'CUSTOMER') return info.key === 'customer';
      return true;
    });
  }, [usersList, selectedRoleTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Crown className="w-6 h-6 text-amber-400" />
              <span>User Roles &amp; Staff Permissions</span>
            </h1>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Super Admin Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Assign or remove administrative roles. Check exactly which users have <strong className="text-amber-300">Super Admin</strong>, <strong className="text-indigo-300">SEO/CMS Manager</strong>, or <strong className="text-slate-300">Customer</strong> access.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchUsers(searchQuery)}
          disabled={isLoadingUsers}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400/50 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <Loader2 className={`w-3.5 h-3.5 text-amber-400 ${isLoadingUsers ? 'animate-spin' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Super Admin Card */}
        <div
          onClick={() => setSelectedRoleTab('SUPER_ADMIN')}
          className={`p-4 rounded-2xl bg-[#130E0A] border transition-all cursor-pointer relative overflow-hidden shadow-lg hover:border-amber-500/60 ${
            selectedRoleTab === 'SUPER_ADMIN' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <span className="text-xs font-black bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full">
              {roleCounts.super} Users
            </span>
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Super Admin</span>
            <span className="text-[10px] text-amber-400 font-normal">(Full Control)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Unrestricted access: Orders, Inventory, Products, CMS, Settings &amp; assigning/removing staff roles.
          </p>
        </div>

        {/* SEO Manager Card */}
        <div
          onClick={() => setSelectedRoleTab('SEO_MANAGER')}
          className={`p-4 rounded-2xl bg-[#0F1420] border transition-all cursor-pointer relative overflow-hidden shadow-lg hover:border-indigo-500/60 ${
            selectedRoleTab === 'SEO_MANAGER' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-indigo-500/30'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full">
              {roleCounts.seo} Users
            </span>
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>SEO &amp; CMS Manager</span>
            <span className="text-[10px] text-indigo-400 font-normal">(Content Only)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Restricted solely to Home Slides, Reels, Blogs, Inquiries, and Pages. All financial and order data is hidden.
          </p>
        </div>

        {/* Standard Customer / User Card */}
        <div
          onClick={() => setSelectedRoleTab('CUSTOMER')}
          className={`p-4 rounded-2xl bg-[#14171F] border transition-all cursor-pointer relative overflow-hidden shadow-lg hover:border-slate-600 ${
            selectedRoleTab === 'CUSTOMER' ? 'border-slate-500 ring-2 ring-slate-500/20' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-black bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
              {roleCounts.cust} Users
            </span>
          </div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Customer (Users)</span>
            <span className="text-[10px] text-slate-400 font-normal">(Storefront Only)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Standard shoppers. Zero admin panel access. You can promote any customer to Super Admin or SEO Manager.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedRoleTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedRoleTab === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Users ({roleCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleTab('SUPER_ADMIN')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedRoleTab === 'SUPER_ADMIN'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Super Admins ({roleCounts.super})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleTab('SEO_MANAGER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedRoleTab === 'SEO_MANAGER'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-md'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Sliders className="w-3 h-3 text-indigo-400" />
            <span>SEO Managers ({roleCounts.seo})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleTab('CUSTOMER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedRoleTab === 'CUSTOMER'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3 h-3 text-slate-400" />
            <span>Customers ({roleCounts.cust})</span>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder:text-slate-500 text-xs outline-none focus:border-amber-400 transition-colors shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Users List Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F1420]/80 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {selectedRoleTab === 'ALL' ? 'All Registered Users' : `${selectedRoleTab.replace('_', ' ')} Accounts`} ({filteredUsers.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            Current active roles are clearly marked on each user
          </span>
        </div>

        {isLoadingUsers ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Fetching live user roles and credentials...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No users found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No registered user accounts match the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleBadge(user);
              const RoleIcon = roleInfo.icon;
              const isMaster = user.email === 'trioenterprises10@gmail.com';
              const hasStaffRole = roleInfo.key === 'super_admin' || roleInfo.key === 'seo_manager';

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  {/* User Identity & Prominent Role Badge */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Avatar Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border shadow-inner ${
                        roleInfo.key === 'super_admin'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : roleInfo.key === 'seo_manager'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {roleInfo.key === 'super_admin' ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : roleInfo.key === 'seo_manager' ? (
                        <Sliders className="w-5 h-5 text-indigo-400" />
                      ) : (
                        (user.full_name || user.email || 'U').slice(0, 2).toUpperCase()
                      )}
                    </div>

                    {/* Details & Role */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {user.full_name || 'Registered Patron'}
                        </span>

                        {/* BIG PROMINENT ACTIVE ROLE BADGE */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-extrabold shadow-sm ${roleInfo.badgeBg}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${roleInfo.dotColor} animate-pulse`}></span>
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>Active Role: {roleInfo.title}</span>
                        </div>

                        {isMaster && (
                          <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Master Owner
                          </span>
                        )}
                      </div>

                      {/* Email, Phone, and Permissions Scope */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {user.email}
                        </span>
                        {user.phone && <span>• {user.phone}</span>}
                        <span className="text-[11px] text-slate-500">
                          • Permissions: <span className="text-slate-300">{roleInfo.allowedText}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Assign / Edit Role & Remove Role */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                    {/* Assign or Change Role Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(user)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        hasStaffRole
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:border-amber-500/40'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-400/80 font-black'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 ${hasStaffRole ? 'text-amber-400' : 'text-slate-950'}`} />
                      <span>{hasStaffRole ? 'Change Role' : '+ Assign Staff Role'}</span>
                    </button>

                    {/* Remove Role Button (Only for staff users, protected for master) */}
                    {hasStaffRole && !isMaster && (
                      <button
                        type="button"
                        onClick={() => handleOpenRemoveModal(user)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Revoke staff permissions and revert to Customer"
                      >
                        <UserX className="w-4 h-4 text-rose-400" />
                        <span>Remove Role</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. Role Assignment / Change Modal */}
      {modalOpen && selectedUser && (() => {
        const currentInfo = getRoleBadge(selectedUser);
        const CurrentIcon = currentInfo.icon;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-[#140D08] border-2 border-amber-500/40 p-6 sm:p-7 shadow-2xl space-y-5 text-left relative">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">Assign or Modify User Role</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update administrative privileges for <strong className="text-white">{selectedUser.email}</strong>.
                </p>
              </div>

              {/* CURRENT ACTIVE ROLE PROMINENT DISPLAY */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Currently Active Role on Account:</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${currentInfo.badgeBg}`}>
                      <CurrentIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{currentInfo.title}</span>
                      <span className="text-[11px] text-slate-400 block">{currentInfo.subtitle}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${currentInfo.badgeBg}`}>
                    Active
                  </span>
                </div>
              </div>

              {/* Role Options Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-amber-300 block uppercase tracking-wider">
                  Select New Role to Assign:
                </label>

                {/* Option 1: Super Admin */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    newRole === 'super_admin'
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleOption"
                    value="super_admin"
                    checked={newRole === 'super_admin'}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-300">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Super Admin (Full Access)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Grants unrestricted access across all features: Orders, Shipping, Products, CMS, Settings, and permission to assign or remove roles from others.
                    </p>
                  </div>
                </label>

                {/* Option 2: SEO Manager */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    newRole === 'seo_manager'
                      ? 'bg-indigo-500/15 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleOption"
                    value="seo_manager"
                    checked={newRole === 'seo_manager'}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="mt-1 accent-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-indigo-300">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <span>SEO &amp; CMS Manager (Content &amp; CMS Only)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Restricts sidebar exclusively to Home &amp; Banners, Instagram Reels, Blogs, Contact Inquiries, and Static Pages. Orders and financials remain completely hidden.
                    </p>
                  </div>
                </label>

                {/* Option 3: Customer (Remove Role) */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    newRole === 'customer'
                      ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleOption"
                    value="customer"
                    checked={newRole === 'customer'}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="mt-1 accent-rose-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-300">
                      <UserX className="w-4 h-4 text-rose-400" />
                      <span>Remove Role (Revert to Customer)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Revokes administrative dashboard access. User can only shop and view orders on the storefront.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleAssign}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Role...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Role Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Remove Role Confirmation Modal */}
      {removeModalOpen && userToRemove && (() => {
        const currentInfo = getRoleBadge(userToRemove);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl bg-[#170E10] border-2 border-rose-500/40 p-6 sm:p-7 shadow-2xl space-y-4 text-left relative">
              <div className="flex items-center gap-3 border-b border-rose-500/20 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Revoke Staff Privileges</h3>
                  <p className="text-xs text-rose-300">{userToRemove.email}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Role to be revoked:</span>
                <span className="text-xs font-bold text-white block">{currentInfo.title}</span>
                <p className="text-[11px] text-rose-300 leading-relaxed mt-1">
                  ⚠️ This user will immediately lose access to the Admin Dashboard and revert to a standard Customer account.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={() => setRemoveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleRemoval}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking Role...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Yes, Remove Role</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
