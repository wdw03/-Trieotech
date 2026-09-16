'use client';
import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const DeleteConfirmModal = ({
  isOpen,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName = "",
  confirmText = "Delete Permanently",
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="admin-portal dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none animate-fadeIn"
      style={{ colorScheme: 'dark' }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scaleIn">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{title}</h3>
              <p className="text-xs text-slate-400">Irreversible administrative action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {message}
        </p>

        {itemName && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold text-rose-300 truncate">
            Target: <span className="text-white">{itemName}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-1.5 px-3.5 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all inline-flex items-center gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
