import React, { useState, useEffect } from 'react';
import { Warehouse3DViewport } from './Warehouse3DViewport';
import { inventoryStore } from '../../services/inventoryStore';
import { Product, Warehouse, User } from '../../types/inventory';
import {
  Boxes,
  Building2,
  Layers,
  Sparkles,
  Maximize2,
  Compass,
  Cpu,
  Shield,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  Flame,
  Zap,
  Info
} from 'lucide-react';

interface SpatialStudioViewProps {
  currentUser: User | null;
  onOpenReceipt: (productId: string) => void;
  onOpenDelivery: (productId: string) => void;
  onOpenTransfer: (productId: string) => void;
  onOpenAdjustment: (productId: string) => void;
}

export const SpatialStudioView: React.FC<SpatialStudioViewProps> = ({
  currentUser,
  onOpenReceipt,
  onOpenDelivery,
  onOpenTransfer,
  onOpenAdjustment
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryStore.getWarehouses());
  const [products, setProducts] = useState<Product[]>(inventoryStore.getProducts());
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    currentUser?.warehouseId || warehouses[0]?.id || 'wh-1'
  );

  useEffect(() => {
    const refresh = () => {
      setWarehouses(inventoryStore.getWarehouses());
      setProducts(inventoryStore.getProducts());
    };
    return inventoryStore.subscribe(refresh);
  }, []);

  const activeWarehouse = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const whProducts = products.filter(p => p.warehouseId === activeWarehouse?.id);

  const optimalCount = whProducts.filter(p => p.status === 'in_stock').length;
  const lowStockCount = whProducts.filter(p => p.status === 'low_stock').length;
  const outOfStockCount = whProducts.filter(p => p.status === 'out_of_stock').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Meshio 3D Editor Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl meshio-glass card-3d border border-indigo-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 border border-indigo-200 text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-widest">
              MeshIO · 3D Spatial Editor
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-500 font-mono">Digital Twin Engine v3.8</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Spatial Warehouse Digital Twin</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono border border-emerald-200">
              LIVE 3D
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Interactive real-time 3D simulation of pallet racks, autonomous AGVs, storage slotting, and physical bin capacities.
          </p>
        </div>

        {/* Warehouse Model Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 rounded-xl meshio-hud">
            <Building2 className="w-4 h-4 text-indigo-400 ml-1.5" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none pr-3 cursor-pointer"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id} className="bg-white text-slate-800">
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CORE INTERACTIVE 3D VIEWPORT CONTAINER */}
      <div className="relative">
        {activeWarehouse && (
          <Warehouse3DViewport
            products={products}
            warehouse={activeWarehouse}
            onOpenReceipt={onOpenReceipt}
            onOpenDelivery={onOpenDelivery}
            onOpenTransfer={onOpenTransfer}
            onOpenAdjustment={onOpenAdjustment}
          />
        )}
      </div>

      {/* MESHIO 3D SCENE TELEMETRY & LAYER CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Layer 1: Slotting Status Distribution */}
        <div className="p-4 rounded-2xl meshio-glass border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>3D Bin Mesh Status</span>
            </span>
            <span className="font-mono text-indigo-400">{whProducts.length} Meshes</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-200">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>Optimal Stock PBR</span>
              </span>
              <span className="font-bold text-emerald-400">{optimalCount} Bins</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-200">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-sm shadow-amber-500/50" />
                <span>Low Stock Attention</span>
              </span>
              <span className="font-bold text-amber-400">{lowStockCount} Bins</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-slate-200">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-sm shadow-rose-500/50" />
                <span>Depleted / Empty Wireframe</span>
              </span>
              <span className="font-bold text-rose-400">{outOfStockCount} Bins</span>
            </div>
          </div>
        </div>

        {/* Layer 2: 3D Robot & AGV Autonomous Telemetry */}
        <div className="p-4 rounded-2xl meshio-glass border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>AGV Robot Subsystem</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-mono">
              ONLINE
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white/60 border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Unit ID:</span>
                <span className="text-slate-800 font-bold">AGV-NAV-01</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Floor Path:</span>
                <span className="text-cyan-400">Main Central Guide Way</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Payload State:</span>
                <span className="text-emerald-400">Standard Pallet Loaded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 3: Spatial Instructions */}
        <div className="p-4 rounded-2xl meshio-glass border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Navigation Controls</span>
            </span>
            <span className="text-[10px] font-mono text-slate-600">WebGL 2.0</span>
          </div>

          <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-800">Left Drag</span>
              <span>360° Spherical Orbit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-800">Right Drag</span>
              <span>Spatial Planar Pan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-800">Scroll</span>
              <span>Focal Zoom</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-800">Click Bin</span>
              <span>Inspect SKU & Trigger Actions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
