import React, { useState, useEffect, useCallback } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { User, UserActivity, UserRole } from '../../types/inventory';
import {
  Users, ShieldCheck, UserCog, Search, CheckCircle2, XCircle,
  Lock, Trash2, Eye, Activity, Clock, Mail, Building2,
  Ban, RotateCcw, ArrowLeft, User as UserIcon, TrendingUp
} from 'lucide-react';

interface AdminViewProps {
  currentUser: User | null;
}

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  staff: 'bg-amber-100 text-amber-700 border-amber-200'
};

export const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(() => inventoryStore.getUsers());
  const [activity, setActivity] = useState<UserActivity[]>(() => inventoryStore.getUserActivity());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const refresh = useCallback(() => {
    setUsers(inventoryStore.getUsers());
    setActivity(inventoryStore.getUserActivity());
  }, []);

  useEffect(() => {
    const unsub = inventoryStore.subscribe(refresh);
    return unsub;
  }, [refresh]);

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-2xl glass-panel text-center max-w-md mx-auto my-12 border border-slate-200">
        <Lock className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Administrator Access Required</h3>
        <p className="text-xs text-slate-500 mt-1">
          User account management, activation controls, and activity auditing are restricted to Platform Administrators.
        </p>
      </div>
    );
  }

  const activeCount = users.filter(u => u.isActive !== false).length;
  const inactiveCount = users.length - activeCount;
  const admins = users.filter(u => u.role === 'admin').length;

  const filtered = users.filter(u => {
    const matchesQuery =
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.role.includes(query.toLowerCase());
    const isActive = u.isActive !== false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);
    return matchesQuery && matchesStatus;
  });

  const handleToggleStatus = (user: User) => {
    const isActive = user.isActive !== false;
    const res = inventoryStore.setUserActive(user.id, !isActive);
    if (res.success) {
      refresh();
      if (selectedUser?.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, isActive: !isActive } : null);
      }
      if (isActive) {
        toastService.alert('Account Deactivated', `${user.name} can no longer sign in.`);
      } else {
        toastService.success('Account Activated', `${user.name} can sign in again.`);
      }
    } else {
      toastService.alert('Action Blocked', res.error || 'Unable to change account status.');
    }
  };

  const handleDelete = (user: User) => {
    if (!confirm(`Permanently remove ${user.name} (${user.email})? This cannot be undone.`)) return;
    const res = inventoryStore.deleteUser(user.id);
    if (res.success) {
      refresh();
      if (selectedUser?.id === user.id) setSelectedUser(null);
      toastService.alert('User Removed', `${user.name} has been deleted from the system.`);
    } else {
      toastService.alert('Action Blocked', res.error || 'Unable to remove user.');
    }
  };

  const handleRoleChange = (user: User, role: UserRole) => {
    const res = inventoryStore.updateUser(user.id, { role });
    if (res.success) {
      refresh();
      if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, role } : null);
      toastService.success('Role Updated', `${user.name} is now ${role}.`);
    } else {
      toastService.alert('Action Blocked', res.error || 'Unable to update role.');
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  /* ======================= DETAIL: USER PROFILE + ACTIVITY ======================= */
  if (selectedUser) {
    const userActivity = activity.filter(a => a.userId === selectedUser.id);
    const liveUser = users.find(u => u.id === selectedUser.id) || selectedUser;
    const isActive = liveUser.isActive !== false;

    return (
      <div className="space-y-6 max-w-4xl pb-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedUser(null); refresh(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Users
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative">
              <img src={liveUser.avatar} alt={liveUser.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg" />
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-800">{liveUser.name}</h2>
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${roleBadge[liveUser.role]}`}>
                  {liveUser.role}
                </span>
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {isActive ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{liveUser.email}</span>
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{liveUser.warehouseName || '—'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleStatus(liveUser)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-600 border border-rose-200'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isActive ? <><Ban className="w-4 h-4" /> Deactivate</> : <><RotateCcw className="w-4 h-4" /> Activate</>}
              </button>
              <button
                onClick={() => handleDelete(liveUser)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Department', value: liveUser.department || '—' },
              { label: 'Phone', value: liveUser.phone || '—' },
              { label: 'Member Since', value: formatTime(liveUser.createdAt) },
              { label: 'Last Login', value: formatTime(liveUser.lastLogin) }
            ].map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/70 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{m.label}</div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Role selector */}
          <div className="pt-3 border-t border-slate-200 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserCog className="w-4 h-4 text-indigo-500" /> Assign Role
            </span>
            <div className="flex gap-1.5">
              {(['admin', 'manager', 'staff'] as UserRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(liveUser, r)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    liveUser.role === r
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 space-y-4">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Profile Activity Timeline</span>
            <span className="ml-auto text-[10px] text-slate-500 normal-case tracking-normal">{userActivity.length} events</span>
          </div>

          {userActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No recorded activity yet for this account.
            </div>
          ) : (
            <div className="space-y-2">
              {userActivity.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-slate-200">
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    a.action.includes('Blocked') || a.action.includes('Deactivated')
                      ? 'bg-rose-50 text-rose-500'
                      : a.action.includes('Activated') || a.action.includes('Signed In') || a.action.includes('Created')
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-indigo-50 text-indigo-500'
                  }`}>
                    {a.action.includes('Signed In') ? <CheckCircle2 className="w-4 h-4" /> :
                     a.action.includes('Signed Out') ? <ArrowLeft className="w-4 h-4" /> :
                     a.action.includes('Deactivated') || a.action.includes('Blocked') ? <XCircle className="w-4 h-4" /> :
                     <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{a.action}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatTime(a.timestamp)}
                      </span>
                    </div>
                    {a.detail && <div className="text-[11px] text-slate-500 mt-0.5">{a.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ======================= LIST: USER MANAGEMENT ======================= */
  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Header */}
      <div className="p-5 rounded-2xl glass-panel card-3d">
        <div className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-0.5">
          Platform Administration
        </div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Users, Access & Activity Control
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Activate or deactivate accounts, assign roles, and audit profile activity across the organization
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total Users', value: users.length, cls: 'bg-indigo-50 border-indigo-100 text-indigo-500' },
          { icon: CheckCircle2, label: 'Active', value: activeCount, cls: 'bg-emerald-50 border-emerald-100 text-emerald-500' },
          { icon: Ban, label: 'Deactivated', value: inactiveCount, cls: 'bg-rose-50 border-rose-100 text-rose-500' },
          { icon: ShieldCheck, label: 'Administrators', value: admins, cls: 'bg-purple-50 border-purple-100 text-purple-500' }
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl glass-panel card-3d border border-slate-200 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.cls}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-800 leading-none">{s.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === f
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl glass-panel border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">User</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Role</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Warehouse</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Last Login</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Status</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isActive = u.isActive !== false;
                return (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-white/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative shrink-0">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase ${roleBadge[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.warehouseName || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">{formatTime(u.lastLogin)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 data-live-dot' : 'bg-rose-500'}`} />
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                          title="View profile activity"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={u.id === currentUser?.id}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isActive
                              ? 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                          title={u.id === currentUser?.id ? 'Cannot change own status' : undefined}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <UserIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No users match your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Activity Feed */}
      <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 space-y-4">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Recent System Activity</span>
          <span className="ml-auto text-[10px] text-slate-500 normal-case tracking-normal">live audit feed</span>
        </div>
        {activity.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No activity recorded yet. Sign-ins, status changes, and role updates will appear here.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {activity.slice(0, 40).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/70 border border-slate-200">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                  a.action.includes('Blocked') || a.action.includes('Deactivated') || a.action.includes('Removed')
                    ? 'bg-rose-50 text-rose-500'
                    : a.action.includes('Activated') || a.action.includes('Signed In') || a.action.includes('Created')
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-indigo-50 text-indigo-500'
                }`}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-800">{a.userName}</span>
                  <span className="text-xs text-slate-500"> — {a.action}</span>
                  {a.detail && <span className="block text-[10px] text-slate-400 truncate">{a.detail}</span>}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{formatTime(a.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
