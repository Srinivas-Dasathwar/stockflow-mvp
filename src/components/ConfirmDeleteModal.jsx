import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({ product, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(product.id);
      onClose();
    } catch (err) {
      // handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Product</h3>
          <p className="text-sm text-slate-500 mb-4">
            Are you sure you want to delete <span className="font-semibold text-slate-800">"{product.name}"</span>?
            This will permanently remove the item and its SKU <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-700">({product.sku})</code> from your inventory.
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 mb-6">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Currently holds <strong>{product.quantity_on_hand} unit(s)</strong> in stock.</span>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
