import React, { useState, useEffect, useRef } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { DashboardMetrics, Product, Warehouse, Category } from '../../types/inventory';
import { Warehouse3DViewport } from '../spatial/Warehouse3DViewport';
import {
  Boxes,
  AlertTriangle,
  AlertOctagon,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Package,
  Filter,
  Search,
  Plus,
  Building,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Orbit,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ManagerDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenReceiptModal: (productId?: string) => void;
  onOpenDeliveryModal: (productId?: string) => void;
  onOpenProductModal: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigate,
  onOpenReceiptModal,
  onOpenDeliveryModal,
  onOpenProductModal
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(inventoryStore.getMetrics());
  const [products, setProducts] = useState<Product[]>(inventoryStore.getProducts());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryStore.getWarehouses());
  const [categories, setCategories] = useState<Category[]>(inventoryStore.getCategories());

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<'spatial3d' | 'analytics'>('spatial3d');
  const [active3DWarehouseId, setActive3DWarehouseId] = useState<string>('wh-1');

  useEffect(() => {
    const refreshData = () => {
      setMetrics(inventoryStore.getMetrics());
      setProducts(inventoryStore.getProducts());
      setWarehouses(inventoryStore.getWarehouses());
      setCategories(inventoryStore.getCategories());
    };

    return inventoryStore.subscribe(refreshData);
  }, []);

  const filteredProducts = products.filter(p => {
    if (selectedWarehouse !== 'all' && p.warehouseId !== selectedWarehouse) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.binLocation.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const lowStockItems = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock');

  const lineChartData = {
    labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
    datasets: [
      {
        label: 'Inbound Receipts (Units)',
        data: [45, 60, 80, 110, 95, 140, 160],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.35
      },
      {
        label: 'Outbound Deliveries (Units)',
        data: [35, 48, 70, 85, 120, 105, 130],
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  const categoryNames = categories.map(c => c.name);
  const categoryValuations = categories.map(cat => {
    return products
      .filter(p => p.category === cat.name)
      .reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0);
  });

  const doughnutData = {
    labels: categoryNames,
    datasets: [
      {
        data: categoryValuations,
        backgroundColor: [
          '#6366F1',
          '#38BDF8',
          '#10B981',
          '#F59E0B',
          '#EC4899'
        ],
        borderWidth: 0
      }
    ]
  };

  const warehouseBarData = {
    labels: warehouses.map(w => w.code),
    datasets: [
      {
        label: 'Used Capacity (Units)',
        data: warehouses.map(w => {
          return products
            .filter(p => p.warehouseId === w.id)
            .reduce((sum, p) => sum + p.currentStock, 0) + 1200;
        }),
        backgroundColor: '#6366F1',
        borderRadius: 6
      },
      {
        label: 'Available Free Capacity',
        data: warehouses.map(w => Math.max(0, w.totalCapacity - 3200)),
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#64748b',
          font: { family: 'Plus Jakarta Sans', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleFont: { family: 'Plus Jakarta Sans', size: 12 },
        bodyFont: { family: 'JetBrains Mono', size: 12 },
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' }
      },
      y: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' }
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel relative overflow-hidden card-3d">
        <div className="relative z-10">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Enterprise Telemetry
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory Executive Command
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time synchronization across {warehouses.length} regional distribution centers. Automated ledger tracking with dynamic reorder alerting.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onOpenProductModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Product</span>
          </button>
          <button
            onClick={() => onNavigate('operations')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <span>Operations Hub</span>
          </button>
        </div>

        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total SKUs</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{metrics.totalProducts}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {metrics.totalStockUnits.toLocaleString()} total units
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'low_stock' ? 'all' : 'low_stock')}
          className={`p-4 rounded-2xl glass-panel card-3d border cursor-pointer transition-all ${
            selectedStatus === 'low_stock' ? 'border-amber-500/80 ring-1 ring-amber-500' : 'border-amber-500/20'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">{metrics.lowStockCount}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5 font-medium">Under reorder rule</div>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatus(selectedStatus === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`p-4 rounded-2xl glass-panel card-3d border cursor-pointer transition-all ${
            selectedStatus === 'out_of_stock' ? 'border-rose-500/80 ring-1 ring-rose-500' : 'border-rose-500/20'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Out of Stock</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">{metrics.outOfStockCount}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5 font-medium">Critical action needed</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('operations')}
          className="p-4 rounded-2xl glass-panel card-3d border border-emerald-500/20 cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Inbound</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">{metrics.pendingReceipts}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Pending intake</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('operations')}
          className="p-4 rounded-2xl glass-panel card-3d border border-sky-500/20 cursor-pointer"
        >
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Outbound</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-sky-400 font-mono tabular-nums">{metrics.pendingDeliveries}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Pending dispatch</div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('operations')}
          className="p-4 rounded-2xl glass-panel card-3d border border-indigo-500/20 cursor-pointer"
        >
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Transfers</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-indigo-600 font-mono tabular-nums">{metrics.pendingTransfers}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inter-facility shift</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl meshio-glass border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/80 border border-slate-200">
            <button
              onClick={() => setActiveViewMode('spatial3d')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'spatial3d'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 text-cyan-300" />
              <span>MeshIO 3D Spatial Twin</span>
            </button>
            <button
              onClick={() => setActiveViewMode('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeViewMode === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Velocity Charts & Analytics</span>
            </button>
          </div>

          {activeViewMode === 'spatial3d' && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Warehouse Model:</span>
              <select
                value={active3DWarehouseId}
                onChange={(e) => setActive3DWarehouseId(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-indigo-700 focus:outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('spatial_studio')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5"
          >
            <span>Open Dedicated 3D Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {activeViewMode === 'spatial3d' ? (
        <div className="rounded-2xl overflow-hidden card-3d">
          <Warehouse3DViewport
            products={products}
            warehouse={warehouses.find(w => w.id === active3DWarehouseId) || warehouses[0]}
            onOpenReceipt={onOpenReceiptModal}
            onOpenDelivery={onOpenDeliveryModal}
            onOpenTransfer={(id) => onNavigate('operations')}
            onOpenAdjustment={(id) => onNavigate('operations')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 p-5 rounded-2xl glass-panel card-3d flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Stock Movement & Velocity (30-Day Trend)</h3>
                <p className="text-xs text-slate-500">Inbound Receipts vs Outbound Deliveries across all distribution centers</p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
              >
                <span>Full Analytics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-64 w-full">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-panel card-3d flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Category Valuation</h3>
                <p className="text-xs text-slate-500">Total capital distribution</p>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400">
                ${metrics.totalInventoryValue.toLocaleString()}
              </div>
            </div>
            <div className="h-56 w-full flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#64748b', boxWidth: 10, font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel card-3d border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Priority Replenishment & Reorder Watch
                </h3>
                <p className="text-xs text-slate-500">
                  Products currently at or below minimum safety thresholds requiring immediate supplier PO
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenReceiptModal()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Create Inbound Batch</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">SKU & Item Name</th>
                  <th className="py-2.5 px-3">Warehouse / Bin</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-right">Reorder Level</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lowStockItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-mono text-indigo-600">{item.sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{item.warehouseName}</div>
                      <div className="text-[10px] text-slate-600 font-mono">Bin {item.binLocation}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.status === 'out_of_stock' ? (
                        <span className="text-xs font-semibold text-rose-400">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-400">
                          Low Stock
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenReceiptModal(item.id)}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 border border-emerald-200 rounded-md font-semibold text-[11px] transition-colors"
                      >
                        + Reorder Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-5 rounded-2xl glass-panel card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Stock Inventory Ledger</h3>
            <p className="text-xs text-slate-500">Filtered real-time stock balances across all locations</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or name..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Product / SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Warehouse / Bin</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3 text-right">Total Valuation</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-600">
                    No products matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const val = prod.currentStock * prod.unitPrice;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] font-mono text-indigo-600">{prod.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{prod.category}</td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700">{prod.warehouseName}</div>
                        <div className="text-[10px] font-mono text-slate-500">Slot {prod.binLocation}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        ${prod.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {prod.currentStock} {prod.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400 tabular-nums">
                        ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {prod.status === 'in_stock' && (
                          <span className="text-xs font-semibold text-emerald-400">
                            In Stock
                          </span>
                        )}
                        {prod.status === 'low_stock' && (
                          <span className="text-xs font-semibold text-amber-400">
                            Low Stock
                          </span>
                        )}
                        {prod.status === 'out_of_stock' && (
                          <span className="text-xs font-semibold text-rose-400">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenReceiptModal(prod.id)}
                            title="Receive more stock"
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-400 border border-emerald-200"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenDeliveryModal(prod.id)}
                            title="Dispatch delivery order"
                            className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-400 border border-sky-200"
                          >
                            <ArrowUpFromLine className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
