import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { Warehouse3DViewport } from '../spatial/Warehouse3DViewport';
import {
  User,
  ReceiptOrder,
  DeliveryOrder,
  InternalTransfer,
  Product,
  Warehouse,
  StockLedgerEntry
} from '../../types/inventory';
import {
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  Orbit
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WarehouseDashboardProps {
  currentUser: User | null;
  onNavigate: (tab: string) => void;
  onOpenReceiptModal: () => void;
  onOpenDeliveryModal: () => void;
  onOpenTransferModal: () => void;
  onOpenAdjustmentModal: (productId?: string) => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({
  currentUser,
  onNavigate,
  onOpenReceiptModal,
  onOpenDeliveryModal,
  onOpenTransferModal,
  onOpenAdjustmentModal
}) => {
  const [receipts, setReceipts] = useState<ReceiptOrder[]>(inventoryStore.getReceipts());
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(inventoryStore.getDeliveries());
  const [transfers, setTransfers] = useState<InternalTransfer[]>(inventoryStore.getTransfers());
  const [products, setProducts] = useState<Product[]>(inventoryStore.getProducts());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryStore.getWarehouses());
  const [ledger, setLedger] = useState<StockLedgerEntry[]>(inventoryStore.getLedger());
  const [show3DFloor, setShow3DFloor] = useState<boolean>(true);

  useEffect(() => {
    const refreshData = () => {
      setReceipts(inventoryStore.getReceipts());
      setDeliveries(inventoryStore.getDeliveries());
      setTransfers(inventoryStore.getTransfers());
      setProducts(inventoryStore.getProducts());
      setWarehouses(inventoryStore.getWarehouses());
      setLedger(inventoryStore.getLedger());
    };

    return inventoryStore.subscribe(refreshData);
  }, []);

  const myWarehouseId = currentUser?.warehouseId || 'wh-1';
  const myWarehouseProducts = products.filter(p => p.warehouseId === myWarehouseId);

  const pendingReceipts = receipts.filter(
    r => r.destinationWarehouseId === myWarehouseId && r.status !== 'validated'
  );
  const pendingDeliveries = deliveries.filter(
    d => d.sourceWarehouseId === myWarehouseId && d.status !== 'dispatched'
  );
  const pendingTransfers = transfers.filter(
    t => (t.sourceWarehouseId === myWarehouseId || t.destinationWarehouseId === myWarehouseId) && t.status !== 'completed'
  );

  const lowStockInWarehouse = myWarehouseProducts.filter(
    p => p.status === 'low_stock' || p.status === 'out_of_stock'
  );

  const handleQuickValidateReceipt = (receiptId: string) => {
    try {
      inventoryStore.validateReceipt(receiptId);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      toastService.success(
        'Inbound Dock Receipt Validated',
        'Stock levels increased in target bin rack. Transaction logged.'
      );
    } catch (err: unknown) {
      toastService.alert('Validation Error', err instanceof Error ? err.message : 'Error validating');
    }
  };

  const handleQuickValidateDelivery = (delId: string) => {
    try {
      inventoryStore.validateDelivery(delId);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      toastService.success(
        'Outbound Order Dispatched',
        'Stock decreased from pick bins. Shipment handoff confirmed.'
      );
    } catch (err: unknown) {
      toastService.alert('Dispatch Error', err instanceof Error ? err.message : 'Error dispatching');
    }
  };

  const handleQuickValidateTransfer = (transferId: string) => {
    try {
      inventoryStore.validateTransfer(transferId);
      toastService.success(
        'Bin Transfer Completed',
        'Physical bin location reallocated. Ledger updated.'
      );
    } catch (err: unknown) {
      toastService.alert('Transfer Error', err instanceof Error ? err.message : 'Error transferring');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden card-3d border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Warehouse Floor Operations Deck
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Shift Operations: {currentUser?.warehouseName || 'Central Logistics Hub'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Operator: <span className="text-slate-700 font-semibold">{currentUser?.name}</span> · Assigned Station: Dock Intake & Bin Fulfillment
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenReceiptModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Receive Dock Shipment</span>
            </button>
            <button
              onClick={onOpenTransferModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Bin Relocation</span>
            </button>
            <button
              onClick={() => onOpenAdjustmentModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Physical Count</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Awaiting Intake</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{pendingReceipts.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Supplier shipments waiting at dock</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Orders To Pick/Pack</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{pendingDeliveries.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Customer orders ready for staging</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel card-3d border border-slate-200">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Bin Moves</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">{pendingTransfers.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Internal warehouse slot shifts</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel card-3d border border-amber-500/20">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Urgent Low Stock</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">{lowStockInWarehouse.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Bins needing replenishment</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Interactive 3D Floor Layout & Bin Inspection
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-mono">
              MeshIO 3D
            </span>
          </div>
          <button
            onClick={() => setShow3DFloor(!show3DFloor)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-600"
          >
            {show3DFloor ? 'Collapse 3D Floor' : 'Expand 3D Floor Model'}
          </button>
        </div>

        {show3DFloor && (
          <div className="rounded-2xl overflow-hidden card-3d">
            <Warehouse3DViewport
              products={products}
              warehouse={warehouses.find(w => w.id === myWarehouseId) || warehouses[0]}
              onOpenReceipt={onOpenReceiptModal}
              onOpenDelivery={onOpenDeliveryModal}
              onOpenTransfer={onOpenTransferModal}
              onOpenAdjustment={onOpenAdjustmentModal}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Dock Intake & Receiving Queue
                </h3>
              </div>
              <button
                onClick={() => onNavigate('staff_receipts')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All Intake
              </button>
            </div>

            {pendingReceipts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-600">
                All dock inbound shipments received & validated.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReceipts.map(rec => (
                  <div key={rec.id} className="p-3.5 rounded-xl bg-white/80 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">{rec.referenceNo}</span>
                        <span className="text-[10px] text-slate-500">· {rec.supplierName}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-400">
                        Pending Dock QA
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      {rec.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700">{it.productName} ({it.sku})</span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            +{it.expectedQty} units ➔ Bin {rec.destinationBin}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                      <span className="text-[10px] text-slate-600">
                        Arrived: {new Date(rec.dateCreated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleQuickValidateReceipt(rec.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Inspect & Accept Stock</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Outbound Delivery Orders (Pick & Pack)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('staff_deliveries')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Pick Queue
              </button>
            </div>

            {pendingDeliveries.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-600">
                No orders pending fulfillment. All shipments dispatched.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDeliveries.map(del => (
                  <div key={del.id} className="p-3.5 rounded-xl bg-white/80 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">{del.referenceNo}</span>
                        <span className="text-[10px] text-slate-500">· {del.customerName}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-sky-400 capitalize">
                        {del.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      {del.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700">{it.productName}</span>
                          <span className="font-mono font-bold text-sky-600 tabular-nums">
                            {it.orderedQty} units (Pick list)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                      <span className="text-[10px] text-slate-600 truncate max-w-[180px]">
                        Ship to: {del.destinationAddress}
                      </span>
                      <button
                        onClick={() => handleQuickValidateDelivery(del.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatch & Deduct Stock</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Internal Transfers</h3>
            </div>
            <button
              onClick={() => onNavigate('staff_transfers')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              All Transfers
            </button>
          </div>

          {pendingTransfers.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-600">
              No internal bin or warehouse transfers in progress.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTransfers.map(trf => (
                <div key={trf.id} className="p-3 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{trf.referenceNo}</span>
                      <span className="text-[11px] text-slate-500">
                        {trf.items[0]?.productName} ({trf.items[0]?.quantity} units)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {trf.sourceWarehouseName} [{trf.sourceBin}] ➔ {trf.destinationWarehouseName} [{trf.destinationBin}]
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickValidateTransfer(trf.id)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shrink-0"
                  >
                    Confirm Move
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-2xl glass-panel card-3d border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Movement Log</h3>
            </div>
            <button
              onClick={() => onNavigate('staff_history')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Full History
            </button>
          </div>

          <div className="space-y-2">
            {ledger.slice(0, 4).map(entry => (
              <div key={entry.id} className="p-2.5 rounded-lg bg-white/60 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="capitalize text-slate-600">{entry.movementType}</span>
                    <span className="text-slate-600 font-mono">· {entry.referenceNo}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {entry.sku} · {entry.locationBin}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold ${
                    entry.qtyChange > 0 ? 'text-emerald-400' : entry.qtyChange < 0 ? 'text-rose-400' : 'text-slate-600'
                  }`}>
                    {entry.qtyChange > 0 ? `+${entry.qtyChange}` : entry.qtyChange}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono">
                    Bal: {entry.resultingQty}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
