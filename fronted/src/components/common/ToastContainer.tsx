import React, { useEffect, useState } from 'react';
import { toastService, ToastMessage } from '../../services/toastService';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastService.subscribe((list) => {
      setToasts(list);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-slate-200 bg-white/95';
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 bg-white/95 shadow-emerald-100/30';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-amber-500/40 bg-white/95 shadow-amber-100/30';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (toast.type === 'alert') {
          borderClass = 'border-rose-500/40 bg-white/95 shadow-rose-100/30';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderClass} shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0`}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              <h5 className="text-sm font-semibold text-slate-800 tracking-tight">{toast.title}</h5>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => toastService.remove(toast.id)}
              className="text-slate-500 hover:text-slate-800 transition-colors p-1 -mr-1 -mt-1 rounded-md"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
