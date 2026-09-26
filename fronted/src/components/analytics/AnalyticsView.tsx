import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { Product, Warehouse, Category, DashboardMetrics } from '../../types/inventory';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsView: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(inventoryStore.getMetrics());
  const [products, setProducts] = useState<Product[]>(inventoryStore.getProducts());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryStore.getWarehouses());
  const [categories, setCategories] = useState<Category[]>(inventoryStore.getCategories());

  useEffect(() => {
    const refresh = () => {
      setMetrics(inventoryStore.getMetrics());
      setProducts(inventoryStore.getProducts());
      setWarehouses(inventoryStore.getWarehouses());
      setCategories(inventoryStore.getCategories());
    };
    return inventoryStore.subscribe(refresh);
  }, []);

  // Inbound vs Outbound Velocity 6-Month Simulation
  const trendLabels = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Current Cycle'];
  const movementTrendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Inbound Inflow (Units)',
        data: [420, 510, 680, 590, 720, 840],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Outbound Dispatched (Units)',
        data: [380, 460, 610, 550, 690, 780],
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Internal Rebalance Moves',
        data: [80, 110, 140, 95, 160, 190],
        borderColor: '#A855F7',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        borderDash: [5, 5],
        tension: 0.3
      }
    ]
  };

  // Valuation by warehouse
  const whValuationData = {
    labels: warehouses.map(w => w.code),
    datasets: [
      {
        label: 'Inventory Asset Valuation ($)',
        data: warehouses.map(w => {
          return products
            .filter(p => p.warehouseId === w.id)
            .reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
        }),
        backgroundColor: ['#6366F1', '#38BDF8', '#10B981'],
        borderRadius: 8
      }
    ]
  };

  // Category health radar
  const categoryStockRadar = {
    labels: categories.map(c => c.name.split(' ')[0]),
    datasets: [
      {
        label: 'Stock Health Index (%)',
        data: [92, 85, 78, 90, 88],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366F1',
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#fff'
      }
    ]
  };

  const chartTheme = {
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
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' }
      },
      y: {
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.06)' }
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel card-3d">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
            Operational Intelligence & Financial Valuation
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Inventory Analytics & Turnover Metrics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-facility telemetry on turnover velocity, shrinkage variance, and asset distribution
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 p-2 rounded-xl bg-white border border-slate-200">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Reporting Cycle: Q3/Q4 Real-time</span>
        </div>
      </div>

      {/* KPI HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gross Inventory Asset Value</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            ${metrics.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">+14.2%</span> vs last audit cycle
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Inventory Turnover Ratio</span>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1 tabular-nums">
            6.4x <span className="text-xs font-normal text-slate-500">/ year</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Healthy</span> (Tier 1 Benchmark: &gt; 5.0x)
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dock Intake Accuracy</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
            99.4%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Physical count vs manifest variance: &lt; 0.6%
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reorder Fulfillment Rate</span>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-1 tabular-nums">
            94.8%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Safety stock buffer maintained across {products.length - metrics.outOfStockCount} SKUs
          </div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound vs Outbound 6-month Velocity */}
        <div className="p-5 rounded-2xl glass-panel card-3d flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Supply Chain Velocity & Balance</h3>
            <p className="text-xs text-slate-500">Monthly units received from suppliers vs orders fulfilled to clients</p>
          </div>
          <div className="h-72 w-full">
            <Line data={movementTrendData} options={chartTheme} />
          </div>
        </div>

        {/* Valuation by Warehouse */}
        <div className="p-5 rounded-2xl glass-panel card-3d flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Facility Capital Allocation</h3>
            <p className="text-xs text-slate-500">Total dollar valuation of on-hand inventory per regional depot</p>
          </div>
          <div className="h-72 w-full">
            <Bar data={whValuationData} options={chartTheme} />
          </div>
        </div>
      </div>
    </div>
  );
};
