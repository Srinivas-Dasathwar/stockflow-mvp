import React, { useState } from 'react';
import { Plus, Minus, ArrowRight, Package, X, AlertTriangle } from 'lucide-react';

export default function StockAdjustModal({ product, onClose, onAdjustSuccess }) {
  const [delta, setDelta] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const currentQty = product.quantity_on_hand;
  const newQty = currentQty + Number(delta || 0);
  const isInvalid = newQty < 0 || delta === 0;

  const handleQuickAdd = (amount) => {
    setDelta((prev) => Number(prev || 0) + amount);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (delta === 0) {
      setError('Please enter a non-zero adjustment amount (positive or negative).');
      return;
    }
    if (newQty < 0) {
      setError(`Stock cannot drop below zero. (Current: ${currentQty}, Adjustment: ${delta})`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAdjustSuccess(product.id, {
        delta: Number(delta),
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Adjust Stock Level</h3>
              <p className="text-xs text-slate-500">Quick stock increment or decrement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Info Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900 text-sm line-clamp-1">{product.name}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {product.sku}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Current Stock</span>
              <span className="text-lg font-bold text-slate-800">{currentQty}</span>
            </div>
          </div>

          {/* Quick Delta Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Quick Adjustments
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                className="py-1.5 px-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                className="py-1.5 px-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                className="py-1.5 px-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(25)}
                className="py-1.5 px-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
              >
                +25
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(-1)}
                className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(-5)}
                className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(-10)}
                className="py-1.5 px-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setDelta(0)}
                className="py-1.5 px-2 text-xs font-medium text-slate-500 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Change (+/- Units) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={delta}
                onChange={(e) => {
                  setDelta(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  setError('');
                }}
                placeholder="e.g. +5 or -2"
                className="w-full pl-3 pr-10 py-2.5 text-base font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                Units
              </span>
            </div>
          </div>

          {/* New Stock Preview */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <span className="text-xs font-medium text-slate-600">Projected New Stock:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500">{currentQty}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`text-base font-bold ${
                  newQty < 0
                    ? 'text-rose-600'
                    : newQty === 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {isNaN(newQty) ? '—' : `${newQty} units`}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Stock count audit, Supplier arrival, Defective unit"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInvalid}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
            >
              {loading ? 'Updating...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
