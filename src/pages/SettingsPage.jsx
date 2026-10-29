import React, { useState, useEffect } from 'react';
import { Sliders, Building2, ShieldCheck, Save, CheckCircle, Info } from 'lucide-react';
import { api } from '../api';

export default function SettingsPage({ onSettingsUpdated, showToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [threshold, setThreshold] = useState(5);
  const [createdAt, setCreatedAt] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.getSettings();
        if (res.organization) {
          setOrgName(res.organization.name || '');
          setThreshold(res.organization.default_low_stock_threshold ?? 5);
          setCreatedAt(res.organization.created_at || '');
        }
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Error',
          message: err.message || 'Failed to load organization settings',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) {
      showToast({
        type: 'error',
        title: 'Validation',
        message: 'Organization name cannot be empty',
      });
      return;
    }

    const parsedThreshold = parseInt(threshold, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      showToast({
        type: 'error',
        title: 'Validation',
        message: 'Threshold must be a non-negative integer',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateSettings({
        name: orgName.trim(),
        default_low_stock_threshold: parsedThreshold,
      });

      showToast({
        type: 'success',
        title: 'Saved',
        message: 'Organization settings updated successfully.',
      });

      if (onSettingsUpdated) {
        onSettingsUpdated(res.organization);
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to update settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default inventory thresholds and tenant workspace properties
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Settings Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventory Parameters</h2>
              <p className="text-xs text-slate-500">Global defaults applied to products in this tenant</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Org Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Your store or business name</span>
            </div>

            {/* Default Low Stock Threshold (FR-7) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Low Stock Threshold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default unit limit before items trigger a "Low Stock" alert
              </span>
            </div>
          </div>

          {/* Explanation Alert */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Threshold Inheritance Rule:</strong> When creating or editing an individual product, you can optionally override this threshold. If an individual product's threshold is left blank or empty, this global setting (<strong>{threshold} units</strong>) will automatically be used.
            </div>
          </div>

          {/* Tenant Isolation Info */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <strong>Multi-Tenant Workspace:</strong> All products, stock quantities, and audit logs are strictly scoped to your Organization ID. Other tenants cannot view or modify your data.
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Tenant created on: {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
