import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { StockLedgerEntry, MovementType } from '../../types/inventory';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const StockLedgerView: React.FC = () => {
  const [ledger, setLedger] = useState<StockLedgerEntry[]>(inventoryStore.getLedger());
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const refresh = () => {
      setLedger(inventoryStore.getLedger());
    };
    return inventoryStore.subscribe(refresh);
  }, []);

  const filteredLedger = ledger.filter(entry => {
    if (selectedType !== 'all' && entry.movementType !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !entry.referenceNo.toLowerCase().includes(q) &&
        !entry.sku.toLowerCase().includes(q) &&
        !entry.productName.toLowerCase().includes(q) &&
        !entry.warehouseName.toLowerCase().includes(q) &&
        !entry.operatorName.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Reference No',
      'Movement Type',
      'SKU',
      'Product Name',
      'Warehouse',
      'Bin Location',
      'Qty Change',
      'Previous Qty',
      'Resulting Qty',
      'Unit Cost',
      'Total Valuation Impact',
      'Operator',
      'Role',
      'Notes'
    ];

    const rows = filteredLedger.map(e => [
      `"${e.timestamp}"`,
      `"${e.referenceNo}"`,
      `"${e.movementType}"`,
      `"${e.sku}"`,
      `"${e.productName.replace(/"/g, '""')}"`,
      `"${e.warehouseName}"`,
      `"${e.locationBin}"`,
      e.qtyChange,
      e.previousQty,
      e.resultingQty,
      e.unitCost,
      e.totalValuationChange,
      `"${e.operatorName}"`,
      `"${e.operatorRole}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Ledger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel card-3d">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
            Immutable Audit Trail
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Complete Stock Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Every inventory receipt, delivery dispatch, internal transfer, and count adjustment recorded chronologically
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel-light border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, SKU, operator..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Movement Filter:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
          >
            <option value="all">All Movements</option>
            <option value="receipt">Receipts (Inbound +)</option>
            <option value="delivery">Deliveries (Outbound -)</option>
            <option value="transfer">Transfers (Relocation)</option>
            <option value="adjustment">Adjustments (Count +/-)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-200 overflow-hidden card-3d">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Reference #</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Item (SKU)</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-right">Delta (Change)</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3 text-right">Valuation Δ</th>
                <th className="py-3 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-600">
                    No ledger records match the query.
                  </td>
                </tr>
              ) : (
                filteredLedger.map(entry => {
                  return (
                    <tr key={entry.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {entry.referenceNo}
                      </td>
                      <td className="py-3 px-3">
                        {entry.movementType === 'receipt' && (
                          <span className="text-xs font-semibold text-emerald-400">
                            Receipt
                          </span>
                        )}
                        {entry.movementType === 'delivery' && (
                          <span className="text-xs font-semibold text-sky-400">
                            Delivery
                          </span>
                        )}
                        {entry.movementType === 'transfer' && (
                          <span className="text-xs font-semibold text-indigo-600">
                            Transfer
                          </span>
                        )}
                        {entry.movementType === 'adjustment' && (
                          <span className="text-xs font-semibold text-amber-400">
                            Adjustment
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{entry.productName}</div>
                        <div className="text-[10px] font-mono text-indigo-600">{entry.sku}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700">{entry.warehouseName}</div>
                        <div className="text-[10px] font-mono text-slate-500">{entry.locationBin}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-sm">
                        <span className={
                          entry.qtyChange > 0
                            ? 'text-emerald-400'
                            : entry.qtyChange < 0
                            ? 'text-rose-400'
                            : 'text-slate-600'
                        }>
                          {entry.qtyChange > 0 ? `+${entry.qtyChange}` : entry.qtyChange}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 tabular-nums">
                        {entry.resultingQty}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs">
                        <span className={
                          entry.totalValuationChange > 0
                            ? 'text-emerald-400'
                            : entry.totalValuationChange < 0
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }>
                          {entry.totalValuationChange !== 0 ? (
                            entry.totalValuationChange > 0
                              ? `+$${entry.totalValuationChange.toFixed(2)}`
                              : `-$${Math.abs(entry.totalValuationChange).toFixed(2)}`
                          ) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{entry.operatorName}</div>
                        <div className="text-[10px] text-slate-600 capitalize">{entry.operatorRole}</div>
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
