import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { Warehouse, Product, User } from '../../types/inventory';
import {
  Building2,
  MapPin,
  Phone,
  User as UserIcon,
  Plus,
  Box,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';

interface WarehouseViewProps {
  currentUser: User | null;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currentUser }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryStore.getWarehouses());
  const [products, setProducts] = useState<Product[]>(inventoryStore.getProducts());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New warehouse form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [totalCapacity, setTotalCapacity] = useState<number>(30000);
  const [managerName, setManagerName] = useState('Sarah Jenkins');
  const [contactPhone, setContactPhone] = useState('+1 (555) 019-2831');
  const [activeBinsStr, setActiveBinsStr] = useState('A-1, A-2, B-1, B-2, C-1');

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  useEffect(() => {
    const refresh = () => {
      setWarehouses(inventoryStore.getWarehouses());
      setProducts(inventoryStore.getProducts());
    };
    return inventoryStore.subscribe(refresh);
  }, []);

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toastService.alert('Missing Field', 'Please provide a warehouse code and facility name.');
      return;
    }

    const bins = activeBinsStr.split(',').map(b => b.trim()).filter(Boolean);

    try {
      inventoryStore.createWarehouse({
        code,
        name,
        location,
        address,
        totalCapacity,
        managerName,
        contactPhone,
        activeBins: bins.length > 0 ? bins : ['A-101', 'B-101']
      });

      toastService.success('Warehouse Added', `Provisioned facility ${name} (${code})`);
      setIsModalOpen(false);
      setCode('');
      setName('');
      setLocation('');
      setAddress('');
    } catch (err: unknown) {
      toastService.alert('Error', err instanceof Error ? err.message : 'Failed to add warehouse');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel card-3d">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
            Physical Infrastructure & Storage Bins
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Distribution Centers & Warehouses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical facility footprints, pallet racking zones, and storage slotting
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Distribution Hub</span>
          </button>
        )}
      </div>

      {/* 3D WAREHOUSE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map(wh => {
          const whProducts = products.filter(p => p.warehouseId === wh.id);
          const totalUnitsStored = whProducts.reduce((sum, p) => sum + p.currentStock, 0);
          const totalValuation = whProducts.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
          const capacityUsed = Math.min(100, Math.round((totalUnitsStored / wh.totalCapacity) * 100));

          return (
            <div
              key={wh.id}
              className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                      {wh.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-snug">
                      {wh.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>{wh.location}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-4 truncate">
                  {wh.address}
                </div>

                {/* Capacity Meter */}
                <div className="p-3 rounded-xl bg-white/70 border border-slate-200 space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Volumetric Utilization:</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {totalUnitsStored.toLocaleString()} / {wh.totalCapacity.toLocaleString()} units
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        capacityUsed > 85 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${capacityUsed}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>{capacityUsed}% filled</span>
                    <span>{(wh.totalCapacity - totalUnitsStored).toLocaleString()} available</span>
                  </div>
                </div>

                {/* Bin Racks Grid */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Active Rack Bins ({wh.activeBins.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {wh.activeBins.map(bin => {
                      const prodsInBin = whProducts.filter(p => p.binLocation === bin);
                      return (
                        <span
                          key={bin}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-[11px] font-mono text-slate-600"
                          title={`${prodsInBin.length} product(s) in Bin ${bin}`}
                        >
                          Bin {bin}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Warehouse Details Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500 flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-600" />
                    <span>{wh.managerName}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">{wh.contactPhone}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                    ${totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    {whProducts.length} SKUs cataloged
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD WAREHOUSE MODAL (Manager Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden card-3d">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">Provision Distribution Hub</h3>
                  <p className="text-xs text-slate-500">Configure new warehouse facility and physical bin slots</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WH-BOS-04"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Northeast Regional Hub D"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Boston, MA"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Volumetric Capacity</label>
                  <input
                    type="number"
                    min="1000"
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 20000)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 500 Logan Freight Terminal Way"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Active Storage Bins (Comma separated)
                </label>
                <input
                  type="text"
                  value={activeBinsStr}
                  onChange={(e) => setActiveBinsStr(e.target.value)}
                  placeholder="e.g. A-101, A-102, B-201, C-301"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Provision Facility</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
