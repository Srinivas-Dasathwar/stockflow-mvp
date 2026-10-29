import React, { useState, useEffect } from 'react';
import { api, getAuthToken, clearAuth, getCachedUser, getCachedOrg, saveSession } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import ProductFormModal from './components/ProductFormModal';
import StockAdjustModal from './components/StockAdjustModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState(getCachedUser());
  const [org, setOrg] = useState(getCachedOrg());
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [productFormState, setProductFormState] = useState({ isOpen: false, product: null });
  const [adjustStockState, setAdjustStockState] = useState({ isOpen: false, product: null });
  const [deleteProductState, setDeleteProductState] = useState({ isOpen: false, product: null });

  const showToast = (toastObj) => {
    setToast(toastObj);
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Verify auth token on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
        setOrg(res.org);
        saveSession(res.user, res.org, token);
      } catch (err) {
        clearAuth();
        setUser(null);
        setOrg(null);
      } finally {
        setAuthChecking(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setOrg(null);
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been logged out of your session.',
    });
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await api.seedDemoProducts();
      showToast({
        type: 'success',
        title: 'Demo Data Loaded',
        message: res.message || 'Sample products loaded into your catalog.',
      });
      triggerRefresh();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Seed Error',
        message: err.message || 'Failed to seed sample items.',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveProduct = async (productData) => {
    if (productFormState.product && productFormState.product.id) {
      await api.updateProduct(productFormState.product.id, productData);
      showToast({
        type: 'success',
        title: 'Product Updated',
        message: `"${productData.name}" has been updated.`,
      });
    } else {
      await api.createProduct(productData);
      showToast({
        type: 'success',
        title: 'Product Created',
        message: `"${productData.name}" added to inventory.`,
      });
    }
    triggerRefresh();
  };

  const handleDeleteProduct = async (productId) => {
    await api.deleteProduct(productId);
    showToast({
      type: 'success',
      title: 'Product Deleted',
      message: 'Item has been removed from inventory.',
    });
    triggerRefresh();
  };

  const handleAdjustStock = async (productId, { delta, note }) => {
    const res = await api.adjustStock(productId, { delta, note });
    showToast({
      type: 'success',
      title: 'Stock Updated',
      message: res.message,
    });
    triggerRefresh();
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-600 mt-4">Initializing StockFlow session...</span>
      </div>
    );
  }

  if (!user || !org) {
    return (
      <>
        <AuthPage
          onAuthSuccess={(u, o) => {
            setUser(u);
            setOrg(o);
            setActiveTab('dashboard');
          }}
          showToast={showToast}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar org={org} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSeedDemo={handleSeedDemo}
          seeding={seeding}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              onNavigate={setActiveTab}
              onOpenAddProduct={() => setProductFormState({ isOpen: true, product: null })}
              onOpenAdjustStock={(p) => setAdjustStockState({ isOpen: true, product: p })}
              showToast={showToast}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPage
              key={refreshKey}
              onOpenAddProduct={() => setProductFormState({ isOpen: true, product: null })}
              onOpenEditProduct={(p) => setProductFormState({ isOpen: true, product: p })}
              onOpenDeleteProduct={(p) => setDeleteProductState({ isOpen: true, product: p })}
              onOpenAdjustStock={(p) => setAdjustStockState({ isOpen: true, product: p })}
              onSeedDemo={handleSeedDemo}
              seeding={seeding}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              key={refreshKey}
              onSettingsUpdated={(updatedOrg) => setOrg(updatedOrg)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Product Form Modal (Add / Edit) */}
      {productFormState.isOpen && (
        <ProductFormModal
          product={productFormState.product}
          defaultOrgThreshold={org?.default_low_stock_threshold ?? 5}
          onClose={() => setProductFormState({ isOpen: false, product: null })}
          onSave={handleSaveProduct}
        />
      )}

      {/* Adjust Stock Modal */}
      {adjustStockState.isOpen && (
        <StockAdjustModal
          product={adjustStockState.product}
          onClose={() => setAdjustStockState({ isOpen: false, product: null })}
          onAdjustSuccess={handleAdjustStock}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductState.isOpen && (
        <ConfirmDeleteModal
          product={deleteProductState.product}
          onClose={() => setDeleteProductState({ isOpen: false, product: null })}
          onConfirm={handleDeleteProduct}
        />
      )}

      {/* Notification Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
