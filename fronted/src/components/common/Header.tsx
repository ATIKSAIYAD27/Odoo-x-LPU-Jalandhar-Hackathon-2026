import React, { useState, useEffect } from 'react';
import { User, SystemNotification, UserRole } from '../../types/inventory';
import { inventoryStore } from '../../services/inventoryStore';
import {
  Bell,
  Box,
  ChevronDown,
  Plus,
  ArrowRightLeft,
  Truck,
  PackageCheck,
  SlidersHorizontal,
  LogOut,
  UserCheck,
  Check,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onOpenQuickModal: (type: 'receipt' | 'delivery' | 'transfer' | 'adjustment') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  onOpenQuickModal
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    const updateNotifs = () => {
      setNotifications(inventoryStore.getNotifications());
    };
    updateNotifs();
    return inventoryStore.subscribe(updateNotifs);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRoleToggle = (targetRole: UserRole) => {
    inventoryStore.switchDemoRole(targetRole);
    if (targetRole === 'admin') {
      onNavigate('admin_users');
    } else if (targetRole === 'manager') {
      onNavigate('manager_dashboard');
    } else {
      onNavigate('staff_dashboard');
    }
    setShowProfileMenu(false);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isManager = isAdmin || currentUser?.role === 'manager';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark with 3D icon */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(isAdmin ? 'admin_users' : isManager ? 'manager_dashboard' : 'staff_dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-white/80 rounded-[10px] flex items-center justify-center">
                <Box className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-800 group-hover:text-indigo-700 transition-colors">
                StockSense
              </span>
              <span className="text-[11px] font-mono text-indigo-400 block -mt-1 tracking-wider uppercase">
                {isAdmin ? 'Admin Console' : isManager ? 'Manager Console' : 'Warehouse Crew'}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('spatial_studio')}
            className={`flex items-center gap-1.5 transition-colors hover:text-slate-800 ${
              activeTab === 'spatial_studio' ? 'text-cyan-400 font-bold' : 'text-slate-600'
            }`}
          >
            <span>3D Studio</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-mono">MeshIO</span>
          </button>

          {isManager ? (
            <>
              <button
                onClick={() => onNavigate('manager_dashboard')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'manager_dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('products')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'products' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => onNavigate('operations')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'operations' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Operations
              </button>
              <button
                onClick={() => onNavigate('ledger')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'ledger' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Stock Ledger
              </button>
              <button
                onClick={() => onNavigate('warehouses')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'warehouses' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Warehouses
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'analytics' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Analytics
              </button>
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin_users')}
                  className={`transition-colors hover:text-slate-800 ${
                    activeTab === 'admin_users' ? 'text-purple-500 font-semibold' : 'text-purple-500/80'
                  }`}
                >
                  Users & Access
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('staff_dashboard')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'staff_dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Warehouse Ops
              </button>
              <button
                onClick={() => onNavigate('staff_receipts')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'staff_receipts' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Receive Goods
              </button>
              <button
                onClick={() => onNavigate('staff_deliveries')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'staff_deliveries' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Pick & Pack
              </button>
              <button
                onClick={() => onNavigate('staff_transfers')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'staff_transfers' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Internal Moves
              </button>
              <button
                onClick={() => onNavigate('staff_counting')}
                className={`transition-colors hover:text-slate-800 ${
                  activeTab === 'staff_counting' ? 'text-indigo-400 font-semibold' : 'text-slate-600'
                }`}
              >
                Stock Counting
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Quick 1-Click Role Switcher for seamless evaluation */}
          <div className="hidden sm:flex items-center p-1 bg-white/90 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => handleRoleToggle('admin')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                isAdmin
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              onClick={() => handleRoleToggle('manager')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                currentUser?.role === 'manager'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-700'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Manager
            </button>
            <button
              onClick={() => handleRoleToggle('staff')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                currentUser?.role === 'staff'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Staff
            </button>
          </div>

          {/* Quick Operations Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-600/20 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Action</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl glass-dropdown p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-semibold text-slate-600 px-3 py-1.5 uppercase tracking-wider">
                  Core Inventory Moves
                </div>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickModal('receipt');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                  <PackageCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-800">Receive Goods (Inbound)</div>
                    <div className="text-[10px] text-slate-600">Supplier ➔ Stock Increases</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickModal('delivery');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                  <Truck className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="font-semibold text-slate-800">Dispatch Delivery (Outbound)</div>
                    <div className="text-[10px] text-slate-600">Order ➔ Stock Decreases</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickModal('transfer');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                  <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-slate-800">Internal Move (Bin/Hub)</div>
                    <div className="text-[10px] text-slate-600">Source ➔ Destination Transfer</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickModal('adjustment');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-800">Stock Count & Adjust</div>
                    <div className="text-[10px] text-slate-600">Physical vs System Variance</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl glass-dropdown p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-800">Alerts & Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => inventoryStore.markAllNotificationsAsRead()}
                      className="text-[11px] text-indigo-400 hover:text-indigo-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 mt-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-600">No active alerts</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => inventoryStore.markNotificationAsRead(notif.id)}
                        className={`py-2.5 px-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors ${
                          !notif.isRead ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold ${
                              notif.type === 'alert'
                                ? 'text-rose-400'
                                : notif.type === 'warning'
                                ? 'text-amber-400'
                                : 'text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile / Account Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 ring-1 ring-slate-300">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'}
                  alt={currentUser?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-600 capitalize">{currentUser?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl glass-dropdown p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-200 mb-1">
                  <div className="text-xs font-semibold text-slate-800">{currentUser?.name}</div>
                  <div className="text-[11px] text-slate-600">{currentUser?.email}</div>
                  <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{currentUser?.warehouseName}</div>
                </div>

                <div className="py-1">
                  <div className="text-[11px] font-semibold text-slate-600 px-3 py-1 uppercase tracking-wider">
                    Switch Active Persona
                  </div>
                  <button
                    onClick={() => handleRoleToggle('admin')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span>Platform Admin (Ava Moreno)</span>
                    {currentUser?.role === 'admin' && <Check className="w-3.5 h-3.5 text-purple-500" />}
                  </button>
                  <button
                    onClick={() => handleRoleToggle('manager')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span>Inventory Manager (Sarah Jenkins)</span>
                    {currentUser?.role === 'manager' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                  <button
                    onClick={() => handleRoleToggle('staff')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <span>Warehouse Staff (Marcus Vance)</span>
                    {currentUser?.role === 'staff' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                </div>

                <div className="border-t border-slate-200 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      inventoryStore.logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    <span>Switch / Log in Account</span>
                  </button>
<button
                    onClick={() => {
                      setShowProfileMenu(false);
                      inventoryStore.logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
