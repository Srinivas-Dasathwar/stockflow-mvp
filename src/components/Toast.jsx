import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-in shadow-xl rounded-xl overflow-hidden">
      <div
        className={`flex items-start gap-3 p-4 border text-sm font-medium ${
          isError
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : isSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {!isError && !isSuccess && <Info className="w-5 h-5 text-indigo-600" />}
        </div>
        <div className="flex-1 pr-2">
          {toast.title && <div className="font-semibold text-xs uppercase tracking-wider mb-0.5">{toast.title}</div>}
          <div className="text-slate-700 leading-snug">{toast.message}</div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
