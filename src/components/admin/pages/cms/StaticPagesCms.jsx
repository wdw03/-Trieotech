'use client';
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../../hooks/usePageLoading.js';
import { Skeleton } from '../../ui/Skeleton.jsx';
import { adminApi } from '../../../../services/adminApi.js';
import {
  FileText,
  HelpCircle,
  Phone,
  Info,
  Truck,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  X,
  Mail,
  MessageSquare,
  Clock,
  Search,
  Eye,
  RefreshCw,
  Check,
  ExternalLink,
  MessageCircle,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Tag,
  Layers
} from 'lucide-react';

export const StaticPagesCms = () => {
  const { cmsPages, updatePage, showToast } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [activeTab, setActiveTab] = useState('contact'); // default to contact to see inquiries

  // Local state initialized from context
  const [aboutData, setAboutData] = useState(cmsPages.about || {});
  const [contactData, setContactData] = useState(cmsPages.contact || {});
  const [faqs, setFaqs] = useState(cmsPages.faqs || []);

  // Customer Inquiries State
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | unread | read | replied
  const [viewingMessage, setViewingMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Live FAQs State
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('All');
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'Craft & Authenticity',
    sort_order: 0,
    is_visible: true
  });

  const fetchFaqs = async () => {
    setFaqsLoading(true);
    try {
      const res = await adminApi.getFaqs({ all: true });
      if (res && Array.isArray(res.faqs)) {
        setFaqs(res.faqs);
      }
    } catch (err) {
      console.warn('Failed to fetch live FAQs, using fallback:', err);
    } finally {
      setFaqsLoading(false);
    }
  };

  // Fetch inquiries
  const fetchInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const res = await adminApi.getContactMessages();
      if (res && Array.isArray(res.messages)) {
        setInquiries(res.messages);
      }
    } catch (err) {
      console.warn('Failed to load contact messages:', err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchFaqs();
  }, []);

  // Save About Us
  const handleSaveAbout = (e) => {
    e.preventDefault();
    updatePage('about', aboutData);
  };

  // Save Contact Details
  const handleSaveContact = (e) => {
    e.preventDefault();
    updatePage('contact', contactData);
  };

  // Save / Update FAQ
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      showToast?.('Please enter both question and answer', 'error');
      return;
    }

    try {
      if (editingFaqId) {
        await adminApi.updateFaq(editingFaqId, faqForm);
        showToast?.('FAQ updated successfully!', 'success');
      } else {
        await adminApi.createFaq(faqForm);
        showToast?.('New FAQ published!', 'success');
      }
      setFaqForm({
        question: '',
        answer: '',
        category: 'Craft & Authenticity',
        sort_order: 0,
        is_visible: true
      });
      setEditingFaqId(null);
      setShowAddFaq(false);
      fetchFaqs();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      showToast?.('Failed to save FAQ: ' + err.message, 'error');
    }
  };

  // Start editing FAQ
  const handleEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      sort_order: faq.sort_order || 0,
      is_visible: faq.is_visible !== false
    });
    setShowAddFaq(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Cancel edit/add
  const handleCancelFaqForm = () => {
    setShowAddFaq(false);
    setEditingFaqId(null);
    setFaqForm({
      question: '',
      answer: '',
      category: 'Craft & Authenticity',
      sort_order: 0,
      is_visible: true
    });
  };

  // Toggle FAQ visibility
  const handleToggleFaqVisibility = async (faq) => {
    try {
      const nextVisible = !faq.is_visible;
      await adminApi.updateFaq(faq.id, { is_visible: nextVisible });
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_visible: nextVisible } : f));
      showToast?.(nextVisible ? 'FAQ published to storefront' : 'FAQ hidden from storefront', 'success');
    } catch (err) {
      console.error('Failed to toggle FAQ visibility:', err);
      showToast?.('Failed to update visibility', 'error');
    }
  };

  // Delete FAQ
  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this FAQ?')) return;
    try {
      await adminApi.deleteFaq(id);
      setFaqs(prev => prev.filter(f => f.id !== id));
      showToast?.('FAQ deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      showToast?.('Failed to delete FAQ', 'error');
    }
  };

  // Move FAQ sort order
  const handleMoveFaqOrder = async (faq, direction) => {
    const currentOrder = faq.sort_order || 0;
    const newOrder = direction === 'up' ? Math.max(0, currentOrder - 1) : currentOrder + 1;
    try {
      await adminApi.updateFaq(faq.id, { sort_order: newOrder });
      fetchFaqs();
    } catch (err) {
      console.error('Failed to reorder FAQ:', err);
    }
  };

  // Update Inquiry Status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminApi.updateContactMessage(id, { status: newStatus });
      setInquiries((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      if (viewingMessage && viewingMessage.id === id) {
        setViewingMessage((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(`Inquiry marked as ${newStatus}!`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      await adminApi.deleteContactMessage(id);
      setInquiries((prev) => prev.filter((m) => m.id !== id));
      if (viewingMessage && viewingMessage.id === id) {
        setViewingMessage(null);
      }
      showToast('Inquiry deleted');
    } catch (err) {
      showToast('Failed to delete inquiry', 'error');
    }
  };

  // Save Admin Reply
  const handleSaveReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await adminApi.updateContactMessage(id, { admin_reply: replyText.trim(), status: 'replied' });
      setInquiries((prev) =>
        prev.map((m) => (m.id === id ? { ...m, admin_reply: replyText.trim(), status: 'replied' } : m))
      );
      if (viewingMessage && viewingMessage.id === id) {
        setViewingMessage((prev) => ({ ...prev, admin_reply: replyText.trim(), status: 'replied' }));
      }
      setReplyText('');
      showToast('Reply logged and inquiry marked as Replied!');
    } catch (err) {
      showToast('Failed to save reply', 'error');
    }
  };

  // Filter inquiries
  const filteredInquiries = inquiries.filter((m) => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const unreadCount = inquiries.filter((m) => m.status === 'unread').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Static Pages &amp; Contact Inquiries
          </h1>
          <p className="text-xs text-slate-400">
            Manage contact information, customer inquiries inbox, About Us story, and FAQs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Contact Info &amp; Inquiries</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {unreadCount} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About Us Page</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'faqs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQs Manager ({faqs.length})</span>
        </button>
      </div>

      {/* TAB 1: CONTACT INFO & CUSTOMER INQUIRIES */}
      {activeTab === 'contact' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 1. CUSTOMER INQUIRIES INBOX */}
          <div className="admin-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    Customer Inquiries Inbox
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {inquiries.length} Total
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live messages submitted by customers via the storefront Contact Us form
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchInquiries}
                  disabled={inquiriesLoading}
                  className="btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1.5"
                  title="Refresh Inquiries"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${inquiriesLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All Inquiries' },
                  { id: 'unread', label: `Unread (${unreadCount})` },
                  { id: 'read', label: 'Reviewed' },
                  { id: 'replied', label: 'Replied' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                      statusFilter === st.id
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="admin_static_inquiries_search"
                  name="inquiries_search"
                  type="text"
                  placeholder="Search by name, email, query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-input pl-8 pr-3 py-1.5 w-full text-xs"
                />
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Subject / Topic</th>
                    <th className="p-3">Message Preview</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        {inquiriesLoading
                          ? 'Loading customer inquiries...'
                          : 'No inquiries found matching your filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((inq) => (
                      <tr
                        key={inq.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          inq.status === 'unread' ? 'bg-indigo-500/5 font-semibold text-white' : ''
                        }`}
                      >
                        <td className="p-3 whitespace-nowrap text-slate-400 text-[11px]">
                          {new Date(inq.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-100">{inq.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <a href={`mailto:${inq.email}`} className="hover:underline text-indigo-400">
                              {inq.email}
                            </a>
                          </div>
                          {inq.phone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <a
                                href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline text-emerald-400"
                              >
                                {inq.phone}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="p-3 max-w-[160px] truncate text-slate-200">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] border border-slate-700">
                            {inq.subject || 'General'}
                          </span>
                        </td>
                        <td className="p-3 max-w-[240px] truncate text-slate-400">
                          {inq.message}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              inq.status === 'unread'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : inq.status === 'replied'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {inq.status}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingMessage(inq);
                                if (inq.status === 'unread') {
                                  handleUpdateStatus(inq.id, 'read');
                                }
                              }}
                              className="p-1.5 text-indigo-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="View Full Message"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {inq.status === 'unread' ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(inq.id, 'read')}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Mark as Read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(inq.id, 'unread')}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Mark as Unread"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
                              title="Delete Inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. CONTACT DETAILS & WAREHOUSE CONFIGURATION */}
          <form onSubmit={handleSaveContact} className="admin-card p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">Customer Support &amp; Warehouse Settings</h3>
                <p className="text-[11px] text-slate-400">
                  Contact numbers, official email, and warehouse address shown on the storefront Contact Us page
                </p>
              </div>
              <button type="submit" className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save Contact Details
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cms_contact_support_email" className="font-semibold text-slate-300 block mb-1">Support Email</label>
                <input
                  id="cms_contact_support_email"
                  name="support_email"
                  type="email"
                  value={contactData.supportEmail || ''}
                  onChange={(e) => setContactData({ ...contactData, supportEmail: e.target.value })}
                  placeholder="care@trioenterprises.com"
                  className="admin-input w-full text-xs"
                />
              </div>
              <div>
                <label htmlFor="cms_contact_support_phone" className="font-semibold text-slate-300 block mb-1">Support Phone / WhatsApp</label>
                <input
                  id="cms_contact_support_phone"
                  name="support_phone"
                  type="text"
                  value={contactData.supportPhone || ''}
                  onChange={(e) => setContactData({ ...contactData, supportPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="admin-input w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cms_contact_warehouse_address" className="font-semibold text-slate-300 block mb-1">Registered Warehouse &amp; Workshop Address</label>
              <input
                id="cms_contact_warehouse_address"
                name="warehouse_address"
                type="text"
                value={contactData.warehouseAddress || ''}
                onChange={(e) => setContactData({ ...contactData, warehouseAddress: e.target.value })}
                placeholder="Johari Bazaar Craft Quarter, Jaipur 302003, Rajasthan"
                className="admin-input w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cms_contact_business_hours" className="font-semibold text-slate-300 block mb-1">Business Hours</label>
                <input
                  id="cms_contact_business_hours"
                  name="business_hours"
                  type="text"
                  value={contactData.businessHours || ''}
                  onChange={(e) => setContactData({ ...contactData, businessHours: e.target.value })}
                  placeholder="Mon - Sat: 10:00 AM - 7:00 PM IST"
                  className="admin-input w-full text-xs"
                />
              </div>
              <div>
                <label htmlFor="cms_contact_faq_notice" className="font-semibold text-slate-300 block mb-1">Response Guarantee Notice</label>
                <input
                  id="cms_contact_faq_notice"
                  name="faq_notice"
                  type="text"
                  value={contactData.faqNotice || ''}
                  onChange={(e) => setContactData({ ...contactData, faqNotice: e.target.value })}
                  placeholder="Replies guaranteed within 2 to 4 hours"
                  className="admin-input w-full text-xs"
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {/* VIEW INQUIRY MODAL */}
      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Customer Inquiry Details</h3>
                  <p className="text-[11px] text-slate-400">
                    Received on {new Date(viewingMessage.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingMessage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Customer Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Customer Name</span>
                  <span className="font-bold text-white">{viewingMessage.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Email Address</span>
                  <a
                    href={`mailto:${viewingMessage.email}?subject=Reply: ${encodeURIComponent(viewingMessage.subject || 'Inquiry')}`}
                    className="text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    {viewingMessage.email}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Phone / WhatsApp</span>
                  {viewingMessage.phone ? (
                    <a
                      href={`https://wa.me/${viewingMessage.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      {viewingMessage.phone}
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </div>
              </div>

              {/* Inquiry Topic */}
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Inquiry Topic</span>
                <div className="px-3 py-2 rounded-lg bg-slate-800 text-white font-bold inline-block">
                  {viewingMessage.subject || 'General Inquiry'}
                </div>
              </div>

              {/* Full Message */}
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Customer Message</span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {viewingMessage.message}
                </div>
              </div>

              {/* Existing Reply */}
              {viewingMessage.admin_reply && (
                <div>
                  <span className="text-emerald-400 block text-[10px] uppercase font-mono mb-1">Logged Admin Reply</span>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs leading-relaxed">
                    {viewingMessage.admin_reply}
                  </div>
                </div>
              )}

              {/* Reply Box */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label htmlFor="cms_inquiry_reply_text" className="font-bold text-slate-300 block">Log Internal Reply or Notes:</label>
                <textarea
                  id="cms_inquiry_reply_text"
                  name="inquiry_reply_text"
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type reply note or response sent to customer..."
                  className="admin-input w-full text-xs"
                />
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(viewingMessage.id, 'unread')}
                      className="btn-secondary py-1 px-2.5 text-xs text-amber-400"
                    >
                      Mark Unread
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(viewingMessage.id, 'read')}
                      className="btn-secondary py-1 px-2.5 text-xs text-sky-400"
                    >
                      Mark Reviewed
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveReply(viewingMessage.id)}
                    className="btn-primary py-1.5 px-4 text-xs font-bold"
                  >
                    Save Reply Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT US */}
      {activeTab === 'about' && (
        <form onSubmit={handleSaveAbout} className="admin-card p-6 space-y-4 text-xs animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">About Us Brand Story</h3>
            <button type="submit" className="btn-primary py-1.5 px-3.5 text-xs font-bold">
              <Save className="w-3.5 h-3.5" /> Save About Us
            </button>
          </div>

          <div>
            <label htmlFor="cms_about_heading" className="font-semibold text-slate-300 block mb-1">Story Heading</label>
            <input
              id="cms_about_heading"
              name="about_heading"
              type="text"
              value={aboutData.heading || ''}
              onChange={(e) => setAboutData({ ...aboutData, heading: e.target.value })}
              className="admin-input w-full text-xs"
            />
          </div>

          <div>
            <label htmlFor="cms_about_story" className="font-semibold text-slate-300 block mb-1">Our Heritage &amp; Artisanal Story</label>
            <textarea
              id="cms_about_story"
              name="about_story"
              rows={4}
              value={aboutData.story || ''}
              onChange={(e) => setAboutData({ ...aboutData, story: e.target.value })}
              className="admin-input w-full text-xs leading-relaxed"
            />
          </div>

          <div>
            <label htmlFor="cms_about_mission" className="font-semibold text-slate-300 block mb-1">Mission Statement</label>
            <textarea
              id="cms_about_mission"
              name="about_mission"
              rows={3}
              value={aboutData.mission || ''}
              onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
              className="admin-input w-full text-xs leading-relaxed"
            />
          </div>
        </form>
      )}

      {/* TAB 3: FAQS ACCORDION MANAGER */}
      {activeTab === 'faqs' && (
        <div className="space-y-5 animate-fadeIn">
          {/* FAQ Stats & Action Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="admin-card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Questions</span>
                <span className="text-xl font-black text-white font-mono">{faqs.length}</span>
              </div>
            </div>

            <div className="admin-card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Published on Store</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {faqs.filter(f => f.is_visible !== false).length}
                </span>
              </div>
            </div>

            <div className="admin-card p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <EyeOff className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Hidden / Drafts</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {faqs.filter(f => f.is_visible === false).length}
                </span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Add Button Bar */}
          <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="cms_faq_search"
                  name="faq_search"
                  type="text"
                  placeholder="Search FAQ questions or answers..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="admin-input pl-8 pr-3 py-1.5 w-full text-xs"
                />
              </div>

              {/* Category Filter */}
              <select
                id="cms_faq_category_filter"
                name="faq_category_filter"
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
                className="admin-input py-1.5 px-3 text-xs w-auto"
              >
                <option value="All">All Categories</option>
                <option value="Craft & Authenticity">Craft & Authenticity</option>
                <option value="Usage & Care">Usage & Care</option>
                <option value="Shipping & Delivery">Shipping & Delivery</option>
                <option value="Orders & Returns">Orders & Returns</option>
                <option value="Payments">Payments</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={fetchFaqs}
                disabled={faqsLoading}
                className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                title="Refresh FAQs from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${faqsLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showAddFaq && !editingFaqId) {
                    setShowAddFaq(false);
                  } else {
                    setEditingFaqId(null);
                    setFaqForm({
                      question: '',
                      answer: '',
                      category: 'Craft & Authenticity',
                      sort_order: faqs.length + 1,
                      is_visible: true
                    });
                    setShowAddFaq(true);
                  }
                }}
                className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddFaq && !editingFaqId ? 'Close Form' : 'Add New FAQ'}</span>
              </button>
            </div>
          </div>

          {/* Add / Edit FAQ Form */}
          {showAddFaq && (
            <form onSubmit={handleSaveFaq} className="admin-card p-5 space-y-4 text-xs border-indigo-500/40 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  {editingFaqId ? 'Edit FAQ Item' : 'Add New FAQ Question'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelFaqForm}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="cms_faq_question" className="font-semibold text-slate-300 block mb-1">Question Text *</label>
                  <input
                    id="cms_faq_question"
                    name="faq_question"
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    placeholder="e.g. How do I maintain pure copper bottles without tarnishing?"
                    className="admin-input w-full text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cms_faq_category" className="font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    id="cms_faq_category"
                    name="faq_category"
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="admin-input w-full text-xs"
                  >
                    <option value="Craft & Authenticity">Craft & Authenticity</option>
                    <option value="Usage & Care">Usage & Care</option>
                    <option value="Shipping & Delivery">Shipping & Delivery</option>
                    <option value="Orders & Returns">Orders & Returns</option>
                    <option value="Payments">Payments</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cms_faq_answer" className="font-semibold text-slate-300 block mb-1">Detailed Answer *</label>
                <textarea
                  id="cms_faq_answer"
                  name="faq_answer"
                  rows={4}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="Provide a clear, detailed, authoritative answer for customers..."
                  className="admin-input w-full text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-4">
                  <label htmlFor="cms_faq_is_visible" className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      id="cms_faq_is_visible"
                      name="faq_is_visible"
                      type="checkbox"
                      checked={faqForm.is_visible}
                      onChange={(e) => setFaqForm({ ...faqForm, is_visible: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900"
                    />
                    <span className="font-semibold">Publish on Storefront</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <label htmlFor="cms_faq_sort_order">Sort Order:</label>
                    <input
                      id="cms_faq_sort_order"
                      name="faq_sort_order"
                      type="number"
                      value={faqForm.sort_order}
                      onChange={(e) => setFaqForm({ ...faqForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                      className="admin-input w-16 text-center py-0.5 px-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelFaqForm}
                    className="btn-secondary py-1.5 px-3.5 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingFaqId ? 'Update FAQ' : 'Save & Publish FAQ'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* FAQ List Cards */}
          <div className="space-y-3">
            {faqsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="admin-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                  <Skeleton className="h-3 w-5/6 opacity-70" />
                </div>
              ))
            ) : faqs
                .filter(faq => {
                  const matchesCat = faqCategoryFilter === 'All' || faq.category === faqCategoryFilter;
                  const q = faqSearch.toLowerCase().trim();
                  const matchesSearch = !q || 
                    (faq.question && faq.question.toLowerCase().includes(q)) || 
                    (faq.answer && faq.answer.toLowerCase().includes(q));
                  return matchesCat && matchesSearch;
                })
                .length === 0 ? (
              <div className="admin-card p-8 text-center space-y-2 border-dashed border-slate-800">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-xs font-medium">No FAQs match your search criteria.</p>
                <button
                  onClick={() => { setFaqSearch(''); setFaqCategoryFilter('All'); }}
                  className="text-xs text-indigo-400 hover:underline font-bold"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              faqs
                .filter(faq => {
                  const matchesCat = faqCategoryFilter === 'All' || faq.category === faqCategoryFilter;
                  const q = faqSearch.toLowerCase().trim();
                  const matchesSearch = !q || 
                    (faq.question && faq.question.toLowerCase().includes(q)) || 
                    (faq.answer && faq.answer.toLowerCase().includes(q));
                  return matchesCat && matchesSearch;
                })
                .map((faq, index) => {
                  const isVisible = faq.is_visible !== false;
                  return (
                    <div
                      key={faq.id || index}
                      className={`admin-card p-4 space-y-3 text-xs transition-all ${
                        !isVisible ? 'opacity-70 bg-slate-900/30 border-dashed border-slate-800' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="font-mono text-indigo-400 font-black shrink-0 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[11px]">
                            #{faq.sort_order ?? index + 1}
                          </span>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-100 text-xs sm:text-sm">
                                {faq.question}
                              </h4>
                              {faq.category && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                  {faq.category}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                  isVisible
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                              >
                                {isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                                {isVisible ? 'Published' : 'Hidden'}
                              </span>
                            </div>
                            <p className="text-slate-400 leading-relaxed pt-1">
                              {faq.answer}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                          <button
                            type="button"
                            onClick={() => handleMoveFaqOrder(faq, 'up')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Move Higher in Sort Order"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFaqOrder(faq, 'down')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Move Lower in Sort Order"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFaqVisibility(faq)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isVisible
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                : 'text-amber-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={isVisible ? 'Hide FAQ from Storefront' : 'Publish FAQ to Storefront'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditFaq(faq)}
                            className="p-1.5 text-indigo-400 hover:text-white hover:bg-indigo-500/20 rounded-lg transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="Delete FAQ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

