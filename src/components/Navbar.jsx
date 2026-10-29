import React from 'react';
import { Package, Building2, LogOut, User } from 'lucide-react';

export default function Navbar({ org, user, onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">StockFlow</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  MVP v0.1
                </span>
              </div>
            </div>
          </div>

          {/* Org context & User Profile */}
          <div className="flex items-center gap-4">
            {/* Organization Badge */}
            {org && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 transition-colors">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-[140px] truncate" title={org.name}>
                  {org.name}
                </span>
              </div>
            )}

            {/* User Pill */}
            {user && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center border border-indigo-200">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-slate-800 leading-none">{user.email}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Owner / Admin</div>
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
