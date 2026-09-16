'use client';
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { adminApi } from '../../../services/adminApi.js';
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Search,
  Eye,
  RefreshCw,
  Check,
  Trash2,
  X,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Inbox,
  Filter,
  CheckCircle2
} from 'lucide-react';

export const ContactInquiries = () => {
  const { showToast } = useAdmin();
  const isPageLoading = usePageLoading(400);

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | unread | read | replied
  const [viewingMessage, setViewingMessage] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getContactMessages();
      if (res && Array.isArray(res.messages)) {
        setInquiries(res.messages);
      }
    } catch (err) {
      console.warn('Failed to load inquiries:', err);
      showToast('Could not refresh inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminApi.updateContactMessage(id, { status: newStatus });
      setInquiries((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      if (viewingMessage && viewingMessage.id === id) {
        setViewingMessage((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(`Inquiry marked as ${newStatus}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer inquiry?')) return;
    try {
      await adminApi.deleteContactMessage(id);
      setInquiries((prev) => prev.filter((m) => m.id !== id));
      if (viewingMessage && viewingMessage.id === id) {
        setViewingMessage(null);
      }
      showToast('Inquiry deleted successfully');
    } catch (err) {
      showToast('Failed to delete inquiry', 'error');
    }
  };

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
      showToast('Reply saved and inquiry marked as Replied!');
    } catch (err) {
      showToast('Failed to save reply', 'error');
    }
  };

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
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            Customer Inquiries &amp; Messages
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live customer questions, custom bridal patch requests, and bulk orders received from the storefront
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchInquiries}
            disabled={loading}
            className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-2 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Messages</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="admin-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono">Total Received</p>
            <p className="text-xl font-black text-white mt-0.5">{inquiries.length}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
            <Inbox className="w-4 h-4" />
          </div>
        </div>

        <div className="admin-card p-4 flex items-center justify-between border-amber-500/30 bg-amber-500/5">
          <div>
            <p className="text-[11px] text-amber-400 uppercase font-mono font-bold">Unread / New</p>
            <p className="text-xl font-black text-amber-300 mt-0.5">{unreadCount}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="admin-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-mono">Reviewed</p>
            <p className="text-xl font-black text-sky-400 mt-0.5">
              {inquiries.filter((m) => m.status === 'read').length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="admin-card p-4 flex items-center justify-between border-emerald-500/30 bg-emerald-500/5">
          <div>
            <p className="text-[11px] text-emerald-400 uppercase font-mono font-bold">Replied</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {inquiries.filter((m) => m.status === 'replied').length}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card p-5 space-y-4">
        {/* Filters & Search */}
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
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, query, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input pl-8 pr-3 py-1.5 w-full text-xs"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Date &amp; Time</th>
                <th className="p-3">Customer Name &amp; Contact</th>
                <th className="p-3">Inquiry Topic</th>
                <th className="p-3">Message Excerpt</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    {loading ? 'Fetching inquiries from database...' : 'No inquiries found matching your selection.'}
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
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <a href={`mailto:${inq.email}`} className="hover:underline text-indigo-400">
                          {inq.email}
                        </a>
                      </div>
                      {inq.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <a
                            href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline text-emerald-400 font-bold"
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
                    <td className="p-3 max-w-[260px] truncate text-slate-400">
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
                          title="View Full Message &amp; Respond"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {inq.phone && (
                          <a
                            href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Namaste ' + inq.name + ', this is Trio Enterprises regarding your inquiry: ' + (inq.subject || ''))}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Reply on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

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
                          onClick={() => handleDelete(inq.id)}
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

      {/* VIEW & REPLY MODAL */}
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
                    Submitted {new Date(viewingMessage.created_at).toLocaleString('en-IN')}
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
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">WhatsApp / Phone</span>
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
                <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Inquiry Subject</span>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold inline-block border border-slate-700">
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
                <label className="font-bold text-slate-300 block">Log Admin Response or Notes:</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type reply details or notes sent to customer via WhatsApp/Email..."
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
    </div>
  );
};
export default ContactInquiries;
