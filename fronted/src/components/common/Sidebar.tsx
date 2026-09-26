import React from 'react';
import { User } from '../../types/inventory';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  ClipboardList,
  Building2,
  BarChart3,
  Settings,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Orbit,
  Users
} from 'lucide-react';

interface SidebarProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  collapsed,
  onToggleCollapse
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isManager = isAdmin || currentUser?.role === 'manager';

  return (
    <aside
      className={`relative flex flex-col bg-white/95 border-r border-slate-200 transition-all duration-300 z-30 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Role Pill Banner */}
      <div className="p-3 border-b border-slate-200">
        <div
          className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
            isAdmin
              ? 'bg-purple-50 border border-purple-200 text-purple-600'
              : isManager
              ? 'bg-indigo-50 border border-indigo-200 text-indigo-600'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}
        >
          {isAdmin ? (
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          ) : isManager ? (
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          ) : (
            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider leading-tight">
                {isAdmin ? 'Platform Admin' : isManager ? 'Inventory Manager' : 'Warehouse Staff'}
              </div>
              <div className="text-[10px] text-slate-600 truncate">
                {currentUser?.warehouseName || 'Global Operations'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {isManager ? (
          /* ======================== MANAGER NAVIGATION ======================== */
          <>
            <div>
              {!collapsed && (
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2.5 mb-2">
                  Management Center
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('spatial_studio')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'spatial_studio'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-slate-800 shadow-md shadow-indigo-600/30'
                      : 'text-indigo-600 hover:text-slate-800 hover:bg-slate-100 border border-indigo-200'
                  }`}
                  title="MeshIO 3D Spatial Studio"
                >
                  <Orbit className="w-4 h-4 shrink-0 text-cyan-400" />
                  {!collapsed && (
                    <span className="flex items-center gap-1.5 font-bold">
                      <span>3D Spatial Studio</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-cyan-400/20 text-cyan-700 rounded font-mono">3D</span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('manager_dashboard')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'manager_dashboard'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Manager Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Overview Dashboard</span>}
                </button>

                <button
                  onClick={() => onNavigate('products')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'products'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Product Catalog & Rules"
                >
                  <Boxes className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Product Catalog & SKUs</span>}
                </button>
              </div>
            </div>

            <div>
              {!collapsed && (
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2.5 mb-2">
                  Stock Operations
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('operations')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'operations'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="All Operations"
                >
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Operations Hub</span>}
                </button>

                <button
                  onClick={() => onNavigate('ledger')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'ledger'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Complete Stock Ledger"
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Complete Stock Ledger</span>}
                </button>
              </div>
            </div>

            <div>
              {!collapsed && (
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2.5 mb-2">
                  Facilities & Reports
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('warehouses')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'warehouses'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Warehouses & Bin Racks"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Warehouses & Locations</span>}
                </button>

                <button
                  onClick={() => onNavigate('analytics')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Movement & Valuation Analytics"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Analytics & Valuation</span>}
                </button>

                <button
                  onClick={() => onNavigate('settings')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="System & Reorder Settings"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Settings & Rules</span>}
                </button>
              </div>
            </div>

            {isAdmin && (
              <div>
                {!collapsed && (
                  <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest px-2.5 mb-2">
                    Administration
                  </div>
                )}
                <div className="space-y-1">
                  <button
                    onClick={() => onNavigate('admin_users')}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'admin_users'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-purple-600 hover:text-slate-800 hover:bg-slate-100 border border-purple-200'
                    }`}
                    title="Users, Access & Activity Control"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex items-center gap-1.5 font-bold">
                        <span>Users & Access</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-purple-400/20 text-purple-700 rounded font-mono">ADMIN</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ======================== WAREHOUSE STAFF NAVIGATION ======================== */
          <>
            <div>
              {!collapsed && (
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2.5 mb-2">
                  Floor Operations
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('spatial_studio')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'spatial_studio'
                      ? 'bg-gradient-to-r from-amber-600 to-cyan-600 text-slate-800 shadow-md shadow-amber-600/30'
                      : 'text-amber-600 hover:text-slate-800 hover:bg-slate-100 border border-amber-200'
                  }`}
                  title="MeshIO 3D Spatial Studio"
                >
                  <Orbit className="w-4 h-4 shrink-0 text-cyan-400" />
                  {!collapsed && (
                    <span className="flex items-center gap-1.5 font-bold">
                      <span>3D Floor Model</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-600 rounded font-mono">3D</span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('staff_dashboard')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'staff_dashboard'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Staff Operational Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Staff Dashboard</span>}
                </button>

                <button
                  onClick={() => onNavigate('staff_receipts')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'staff_receipts'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Receive Inbound Goods"
                >
                  <ArrowDownToLine className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Receive Goods</span>}
                </button>

                <button
                  onClick={() => onNavigate('staff_deliveries')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'staff_deliveries'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Pick & Pack Delivery Orders"
                >
                  <ArrowUpFromLine className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Pick & Pack Orders</span>}
                </button>

                <button
                  onClick={() => onNavigate('staff_transfers')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'staff_transfers'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Perform Internal Transfers"
                >
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Internal Bin Moves</span>}
                </button>

                <button
                  onClick={() => onNavigate('staff_counting')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'staff_counting'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Physical Stock Counting"
                >
                  <SlidersHorizontal className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Stock Counting</span>}
                </button>

                <button
                  onClick={() => onNavigate('staff_history')}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'staff_history'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Recent Move History"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Move History</span>}
                </button>
              </div>
            </div>

            {/* Warehouse Staff Restrictions Notice */}
            {!collapsed && (
              <div className="p-3 rounded-xl bg-white/60 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  Role Restrictions Active
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                  Staff access is scoped to floor operations. Configuration & deletion locked.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ERP REST v2.4</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
