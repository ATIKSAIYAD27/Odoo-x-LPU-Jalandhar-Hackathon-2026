import React, { useState } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { User } from '../../types/inventory';
import {
  Settings,
  Shield,
  RotateCcw,
  Bell,
  Building,
  CheckCircle2,
  Lock,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: User | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  const [companyName, setCompanyName] = useState('StockSense Global Logistics Inc.');
  const [defaultCurrency, setDefaultCurrency] = useState('USD ($)');
  const [safetyBufferPercent, setSafetyBufferPercent] = useState('15');
  const [autoEmailAlerts, setAutoEmailAlerts] = useState(true);
  const [enableDoubleValidation, setEnableDoubleValidation] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toastService.success('Configuration Saved', 'System rules and operational parameters updated.');
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all inventory records, receipts, deliveries, and ledger entries back to the factory demonstration state?')) {
      inventoryStore.resetToDefaults();
      toastService.info('System Reset Complete', 'Inventory database restored to clean factory seed state.');
    }
  };

  if (!isManager) {
    return (
      <div className="p-8 rounded-2xl glass-panel text-center max-w-md mx-auto my-12 border border-slate-200">
        <Lock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Manager Permissions Required</h3>
        <p className="text-xs text-slate-500 mt-1">
          Global system configuration and enterprise reorder parameters are restricted to Inventory Managers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel card-3d">
        <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
          System Administration
        </div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Enterprise Settings & Reorder Governance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure ERP threshold triggers, audit validation rules, and demonstration data
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company & Regional */}
        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 space-y-4">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Organization Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Legal Entity</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Default Base Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="USD ($)">USD - US Dollar ($)</option>
                <option value="EUR (€)">EUR - Euro (€)</option>
                <option value="GBP (£)">GBP - British Pound (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Safety Stock & Alerts */}
        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 space-y-4">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Automated Reorder Thresholds & Triggers</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Default Safety Stock Buffer Percentage (%)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={safetyBufferPercent}
                onChange={(e) => setSafetyBufferPercent(e.target.value)}
                className="w-full max-w-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                When stock falls below this safety margin, StockSense flags urgent replenishment alerts on the floor console.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEmailAlerts}
                  onChange={(e) => setAutoEmailAlerts(e.target.checked)}
                  className="rounded bg-white border-slate-200 text-indigo-500 focus:ring-indigo-500"
                />
                <span>Automatically dispatch notification toasts when out-of-stock events occur</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableDoubleValidation}
                  onChange={(e) => setEnableDoubleValidation(e.target.checked)}
                  className="rounded bg-white border-slate-200 text-indigo-500 focus:ring-indigo-500"
                />
                <span>Require physical count verification before closing cycle audit adjustments</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save System Preferences</span>
          </button>
        </div>
      </form>

      {/* Database Reset Section */}
      <div className="p-5 rounded-2xl glass-panel card-3d border border-rose-500/20 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-rose-400" />
              <span>Reset Demonstration Database</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Restore all initial SKUs, warehouses, categories, sample receipts, deliveries, and stock ledger entries.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Factory Seed Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
