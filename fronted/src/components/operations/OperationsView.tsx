import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import {
  ReceiptOrder,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  User
} from '../../types/inventory';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Package,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OperationsViewProps {
  currentUser: User | null;
  defaultSubTab?: 'receipts' | 'deliveries' | 'transfers' | 'adjustments';
  onOpenReceiptModal: () => void;
  onOpenDeliveryModal: () => void;
  onOpenTransferModal: () => void;
  onOpenAdjustmentModal: () => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  currentUser,
  defaultSubTab = 'receipts',
  onOpenReceiptModal,
  onOpenDeliveryModal,
  onOpenTransferModal,
  onOpenAdjustmentModal
}) => {
  const [subTab, setSubTab] = useState<'receipts' | 'deliveries' | 'transfers' | 'adjustments'>(defaultSubTab);

  const [receipts, setReceipts] = useState<ReceiptOrder[]>(inventoryStore.getReceipts());
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(inventoryStore.getDeliveries());
  const [transfers, setTransfers] = useState<InternalTransfer[]>(inventoryStore.getTransfers());
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(inventoryStore.getAdjustments());
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSubTab(defaultSubTab);
  }, [defaultSubTab]);

  useEffect(() => {
    const refresh = () => {
      setReceipts(inventoryStore.getReceipts());
      setDeliveries(inventoryStore.getDeliveries());
      setTransfers(inventoryStore.getTransfers());
      setAdjustments(inventoryStore.getAdjustments());
    };
    return inventoryStore.subscribe(refresh);
  }, []);

  const handleValidateReceipt = (id: string) => {
    try {
      inventoryStore.validateReceipt(id);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      toastService.success('Receipt Validated', 'Stock levels increased automatically and committed to Ledger.');
    } catch (err: unknown) {
      toastService.alert('Error', err instanceof Error ? err.message : 'Validation failed.');
    }
  };

  const handleValidateDelivery = (id: string) => {
    try {
      inventoryStore.validateDelivery(id);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      toastService.success('Delivery Validated', 'Stock deducted automatically and shipment dispatched.');
    } catch (err: unknown) {
      toastService.alert('Error', err instanceof Error ? err.message : 'Dispatch failed.');
    }
  };

  const handlePickPackStep = (id: string, step: 'picking' | 'packed') => {
    try {
      inventoryStore.updateDeliveryPickPack(id, step);
      toastService.info('Order Updated', `Delivery order moved to ${step.toUpperCase()} status.`);
    } catch (err: unknown) {
      toastService.alert('Error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleValidateTransfer = (id: string) => {
    try {
      inventoryStore.validateTransfer(id);
      toastService.success('Transfer Validated', 'Internal bin movement executed and recorded in Ledger.');
    } catch (err: unknown) {
      toastService.alert('Error', err instanceof Error ? err.message : 'Transfer failed.');
    }
  };

  const handleValidateAdjustment = (id: string) => {
    try {
      inventoryStore.validateAdjustment(id);
      toastService.success('Adjustment Validated', 'Physical count reconciled with system stock.');
    } catch (err: unknown) {
      toastService.alert('Error', err instanceof Error ? err.message : 'Adjustment failed.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel card-3d">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
            Core Movement Processing Center
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory Operations & Validations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated double-entry stock transactions with immediate balance alignment
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'receipts' && (
            <button
              onClick={onOpenReceiptModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Inbound Receipt</span>
            </button>
          )}
          {subTab === 'deliveries' && (
            <button
              onClick={onOpenDeliveryModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Outbound Delivery</span>
            </button>
          )}
          {subTab === 'transfers' && (
            <button
              onClick={onOpenTransferModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Internal Move</span>
            </button>
          )}
          {subTab === 'adjustments' && (
            <button
              onClick={onOpenAdjustmentModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Stock Count</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSubTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            subTab === 'receipts'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Inbound Receipts ({receipts.length})</span>
        </button>

        <button
          onClick={() => setSubTab('deliveries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            subTab === 'deliveries'
              ? 'border-sky-500 text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          <span>Outbound Deliveries ({deliveries.length})</span>
        </button>

        <button
          onClick={() => setSubTab('transfers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            subTab === 'transfers'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Internal Transfers ({transfers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('adjustments')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            subTab === 'adjustments'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Stock Adjustments ({adjustments.length})</span>
        </button>
      </div>

      {subTab === 'receipts' && (
        <div className="p-4 rounded-2xl glass-panel border border-slate-200 overflow-hidden card-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-3">Supplier / Vendor</th>
                  <th className="py-3 px-3">Target Location</th>
                  <th className="py-3 px-3">Line Items</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Validation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipts.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">{rec.referenceNo}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{rec.supplierName}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700">{rec.destinationWarehouseName}</div>
                      <div className="text-[10px] font-mono text-slate-600">Bin: {rec.destinationBin}</div>
                    </td>
                    <td className="py-3 px-3">
                      {rec.items.map((it, idx) => (
                        <div key={idx} className="text-slate-600">
                          {it.productName} ({it.sku}) · <span className="font-mono font-bold text-emerald-400">+{it.expectedQty}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(rec.dateCreated).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {rec.status === 'validated' ? (
                        <span className="text-xs font-semibold text-emerald-400">
                          Validated
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-400">
                          Pending Intake
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {rec.status !== 'validated' ? (
                        <button
                          onClick={() => handleValidateReceipt(rec.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Validate Receipt ➔ Stock +
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-600 font-mono">
                          Verified by {rec.validatedBy}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'deliveries' && (
        <div className="p-4 rounded-2xl glass-panel border border-slate-200 overflow-hidden card-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-3">Customer / Consignee</th>
                  <th className="py-3 px-3">Origin Warehouse</th>
                  <th className="py-3 px-3">Items To Dispatch</th>
                  <th className="py-3 px-3 text-center">Stage Progress</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deliveries.map(del => (
                  <tr key={del.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-sky-400">{del.referenceNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{del.customerName}</div>
                      <div className="text-[10px] text-slate-600 truncate max-w-xs">{del.destinationAddress}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{del.sourceWarehouseName}</td>
                    <td className="py-3 px-3">
                      {del.items.map((it, idx) => (
                        <div key={idx} className="text-slate-600">
                          {it.productName} · <span className="font-mono font-bold text-sky-400">-{it.orderedQty}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {del.status !== 'dispatched' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handlePickPackStep(del.id, 'picking')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              del.status === 'picking' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Picking
                          </button>
                          <button
                            onClick={() => handlePickPackStep(del.id, 'packed')}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              del.status === 'packed' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Packed
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Completed</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {del.status === 'dispatched' ? (
                        <span className="text-xs font-semibold text-emerald-400">
                          Dispatched
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-sky-400 capitalize">
                          {del.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {del.status !== 'dispatched' ? (
                        <button
                          onClick={() => handleValidateDelivery(del.id)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Dispatch Order ➔ Stock -
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-600 font-mono">
                          Dispatched by {del.validatedBy}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'transfers' && (
        <div className="p-4 rounded-2xl glass-panel border border-slate-200 overflow-hidden card-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-3">Source Location</th>
                  <th className="py-3 px-3">Destination Location</th>
                  <th className="py-3 px-3">Items Shifted</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Transfer Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transfers.map(trf => (
                  <tr key={trf.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-600">{trf.referenceNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{trf.sourceWarehouseName}</div>
                      <div className="text-[10px] font-mono text-slate-500">Slot {trf.sourceBin}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-emerald-400">{trf.destinationWarehouseName}</div>
                      <div className="text-[10px] font-mono text-slate-500">Slot {trf.destinationBin}</div>
                    </td>
                    <td className="py-3 px-3">
                      {trf.items.map((it, idx) => (
                        <div key={idx} className="text-slate-600">
                          {it.productName} · <span className="font-mono font-bold text-slate-900">{it.quantity} units</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {trf.status === 'completed' ? (
                        <span className="text-xs font-semibold text-emerald-400">
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-indigo-600">
                          In Transit
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {trf.status !== 'completed' ? (
                        <button
                          onClick={() => handleValidateTransfer(trf.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Complete Transfer ➔ Balance
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-600 font-mono">
                          Relocated by {trf.validatedBy}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'adjustments' && (
        <div className="p-4 rounded-2xl glass-panel border border-slate-200 overflow-hidden card-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Reference #</th>
                  <th className="py-3 px-3">Product (SKU)</th>
                  <th className="py-3 px-3">Warehouse / Bin</th>
                  <th className="py-3 px-3 text-right">System Qty</th>
                  <th className="py-3 px-3 text-right">Physical Count</th>
                  <th className="py-3 px-3 text-right">Variance</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {adjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-100 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{adj.referenceNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{adj.productName}</div>
                      <div className="text-[10px] font-mono text-indigo-600">{adj.sku}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700">{adj.warehouseName}</div>
                      <div className="text-[10px] font-mono text-slate-600">Bin: {adj.binLocation}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">{adj.systemQty}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">{adj.countedQty}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      <span className={adj.differenceQty > 0 ? 'text-emerald-400' : adj.differenceQty < 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {adj.differenceQty > 0 ? `+${adj.differenceQty}` : adj.differenceQty}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{adj.reason}</td>
                    <td className="py-3 px-3 text-right">
                      {adj.status !== 'validated' ? (
                        <button
                          onClick={() => handleValidateAdjustment(adj.id)}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                        >
                          Validate & Reconcile
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-600 font-mono">
                          Reconciled by {adj.validatedBy}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
