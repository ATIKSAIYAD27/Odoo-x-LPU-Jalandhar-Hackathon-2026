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
  const item = (tab: string) =>
    `w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
      activeTab === tab ? 'bg-white/12 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
    }`;

  return (
    <aside
      className={`relative flex flex-col bg-slate-950 text-slate-300 transition-all duration-300 z-30 shrink-0 ${
        collapsed ? 'w-[72px]' : 'w-[248px]'
      }`}
    >
      {/* Role Pill Banner */}
      <div className="p-3 border-b border-white/10">
        <div
          className={`flex items-center gap-2 p-2 rounded-lg ${
            isAdmin
              ? 'bg-violet-500/15 text-violet-200'
              : isManager
              ? 'bg-indigo-500/15 text-indigo-200'
              : 'bg-amber-500/15 text-amber-200'
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
              <div className="text-[10px] text-slate-400 truncate">
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
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2.5 mb-2">
                  Management Center
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('spatial_studio')}
                  className={item('spatial_studio')}
                  title="3D warehouse twin"
                >
                  <Orbit className="w-4 h-4 shrink-0 text-cyan-400" />
                  {!collapsed && (
                    <span className="flex items-center gap-1.5">
                      <span>3D Warehouse Twin</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-cyan-400/15 text-cyan-300 rounded">LIVE</span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate('manager_dashboard')}
                  className={item('manager_dashboard')}
                  title="Manager Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Overview Dashboard</span>}
                </button>

                <button
                  onClick={() => onNavigate('products')}
                  className={item('products')}
                  title="Product Catalog & Rules"
                >
                  <Boxes className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Products & SKUs</span>}
                </button>
              </div>
            </div>

            <div>
              {!collapsed && (
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2.5 mb-2">
                  Operations
                </div>
              )}
              <div className="space-y-1">
                <button onClick={() => onNavigate('operations')} className={item('operations')} title="All Operations">
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Receipts & Deliveries</span>}
                </button>
                <button onClick={() => onNavigate('ledger')} className={item('ledger')} title="Complete Stock Ledger">
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Stock Ledger</span>}
                </button>
              </div>
            </div>

            <div>
              {!collapsed && (
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2.5 mb-2">
                  Facilities
                </div>
              )}
              <div className="space-y-1">
                <button onClick={() => onNavigate('warehouses')} className={item('warehouses')} title="Warehouses">
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Warehouses</span>}
                </button>
                <button onClick={() => onNavigate('analytics')} className={item('analytics')} title="Analytics">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Analytics</span>}
                </button>
                <button onClick={() => onNavigate('settings')} className={item('settings')} title="Profile & settings">
                  <Settings className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Profile & Settings</span>}
                </button>
              </div>
            </div>

            {isAdmin && (
              <div>
                {!collapsed && (
                  <div className="text-[10px] font-semibold text-violet-300 uppercase tracking-widest px-2.5 mb-2">
                    Administration
                  </div>
                )}
                <button onClick={() => onNavigate('admin_users')} className={item('admin_users')} title="Users & Access">
                  <Users className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Users & Access</span>}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              {!collapsed && (
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2.5 mb-2">
                  Floor operations
                </div>
              )}
              <div className="space-y-1">
                <button onClick={() => onNavigate('spatial_studio')} className={item('spatial_studio')} title="3D floor">
                  <Orbit className="w-4 h-4 shrink-0 text-cyan-400" />
                  {!collapsed && <span>3D Floor Model</span>}
                </button>
                <button onClick={() => onNavigate('staff_dashboard')} className={item('staff_dashboard')} title="Staff dashboard">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Staff Dashboard</span>}
                </button>
                <button onClick={() => onNavigate('staff_receipts')} className={item('staff_receipts')} title="Receive goods">
                  <ArrowDownToLine className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Receive Goods</span>}
                </button>
                <button onClick={() => onNavigate('staff_deliveries')} className={item('staff_deliveries')} title="Pick & pack">
                  <ArrowUpFromLine className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Pick & Pack</span>}
                </button>
                <button onClick={() => onNavigate('staff_transfers')} className={item('staff_transfers')} title="Internal transfers">
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Internal Transfers</span>}
                </button>
                <button onClick={() => onNavigate('staff_counting')} className={item('staff_counting')} title="Stock counting">
                  <SlidersHorizontal className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Stock Counting</span>}
                </button>
                <button onClick={() => onNavigate('staff_history')} className={item('staff_history')} title="Move history">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>Move History</span>}
                </button>
              </div>
            </div>

            {!collapsed && (
              <div className="p-3 rounded-lg bg-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  Staff scope
                </div>
                <p className="text-[10px] leading-tight">
                  Floor operations only. Catalog configuration is locked.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Live inventory</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
