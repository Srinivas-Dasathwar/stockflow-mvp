import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  PackagePlus, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function ProductsPage({ 
  onOpenAddProduct, 
  onOpenEditProduct, 
  onOpenDeleteProduct, 
  onOpenAdjustStock,
  onSeedDemo,
  seeding,
  showToast 
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        search: search.trim(),
        lowStockOnly: lowStockFilter,
      });
      setProducts(res.products || []);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to fetch products',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, lowStockFilter]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your organization's product catalog and stock levels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or description..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400 shadow-xs"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLowStockFilter(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              !lowStockFilter
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setLowStockFilter(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
              lowStockFilter
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 mt-2">Updating product list...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {search || lowStockFilter ? 'No products match your filters' : 'Your catalog is empty'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {search || lowStockFilter
                ? 'Try clearing your search query or switching to view all items.'
                : 'Get started by creating your first product or load sample demo data with one click.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {search || lowStockFilter ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setLowStockFilter(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenAddProduct}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={onSeedDemo}
                    disabled={seeding}
                    className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                  >
                    Load Sample Items
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Name & Description</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5">Quantity on Hand</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Selling Price</th>
                  <th className="px-6 py-3.5">Cost Price</th>
                  <th className="px-6 py-3.5">Threshold</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((item) => {
                  const isOutOfStock = item.quantity_on_hand === 0;
                  const isLow = Boolean(item.is_low_stock);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Description */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 max-w-xs truncate mt-0.5" title={item.description}>
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          {item.sku}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold text-base ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.quantity_on_hand}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">units</span>
                      </td>

                      {/* Low Stock Indicator */}
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Healthy
                          </span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="px-6 py-4 font-medium text-slate-900">
                        ${Number(item.selling_price || 0).toFixed(2)}
                      </td>

                      {/* Cost Price */}
                      <td className="px-6 py-4 text-slate-500">
                        ${Number(item.cost_price || 0).toFixed(2)}
                      </td>

                      {/* Threshold */}
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {item.effective_threshold} units
                        {!item.low_stock_threshold && (
                          <span className="text-[10px] text-slate-400 block font-normal">(Default)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Adjust stock button (FR-5) */}
                          <button
                            onClick={() => onOpenAdjustStock(item)}
                            title="Adjust Stock (+/- Units)"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200/50"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => onOpenEditProduct(item)}
                            title="Edit Product"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button (FR-4) */}
                          <button
                            onClick={() => onOpenDeleteProduct(item)}
                            title="Delete Product"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
