import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../api';

export default function DashboardPage({ onNavigate, onOpenAddProduct, onOpenAdjustStock, showToast }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setSummary(res.summary);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to load dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500">Loading inventory metrics...</span>
        </div>
      </div>
    );
  }

  const {
    totalProducts = 0,
    totalQuantity = 0,
    totalSellingValue = 0,
    lowStockCount = 0,
    defaultThreshold = 5,
    lowStockProducts = [],
    organizationName = '',
  } = summary || {};

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock overview for <span className="font-semibold text-slate-700">{organizationName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            Catalog List
          </button>
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalProducts}</div>
          <span className="text-xs text-slate-400 mt-1 block">Active SKU catalog entries</span>
        </div>

        {/* Total Units in Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Units on Hand</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalQuantity}</div>
          <span className="text-xs text-slate-400 mt-1 block">Aggregate inventory units</span>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className={`p-2 rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockCount}
            </div>
            {lowStockCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Action Needed
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Items at or below threshold</span>
        </div>

        {/* Total Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Value</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalSellingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Retail catalog valuation</span>
        </div>
      </div>

      {/* Low Stock Items Section (FR-6) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Low Stock Items</h2>
            <span className="text-xs text-slate-400 font-normal">
              (Quantity &le; Low Stock Threshold or Org Default: {defaultThreshold})
            </span>
          </div>
          {lowStockProducts.length > 0 && (
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage in catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">All Stock Levels Healthy!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No products are currently at or below their low-stock thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Quantity on Hand</th>
                  <th className="px-6 py-3.5">Threshold</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Quick Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockProducts.map((item) => {
                  const isOutOfStock = item.quantity_on_hand === 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          {item.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-base ${
                            isOutOfStock ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {item.quantity_on_hand}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">units</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {item.effective_threshold} units
                        {!item.low_stock_threshold && (
                          <span className="text-[10px] text-slate-400 block font-normal">(Org default)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Low Stock Alert
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onOpenAdjustStock(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
