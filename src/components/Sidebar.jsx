import React from 'react';
import { LayoutDashboard, Boxes, Settings, Sparkles, ShieldCheck } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, onSeedDemo, seeding }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Boxes },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 p-4">
      <div className="space-y-6">
        {/* Navigation list */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 block">
            Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Demo Seed Card */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900">Demo Quick-Start</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
            Populate sample products with varying stock levels to preview low-stock alerts.
          </p>
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="w-full py-1.5 px-3 bg-white hover:bg-indigo-50/80 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{seeding ? 'Seeding...' : 'Load Sample Data'}</span>
          </button>
        </div>
      </div>

      {/* Tenant isolation badge */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tenant Scoped & Isolated</span>
        </div>
      </div>
    </aside>
  );
}
