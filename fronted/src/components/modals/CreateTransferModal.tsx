import React, { useState } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import {
  ArrowRightLeft,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export const CreateTransferModal: React.FC<CreateTransferModalProps> = ({
  isOpen,
  onClose,
  defaultProductId
}) => {
  const warehouses = inventoryStore.getWarehouses();
  const products = inventoryStore.getProducts();

  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [sourceBin, setSourceBin] = useState('A-101');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(
    warehouses[1]?.id || warehouses[0]?.id || 'wh-2'
  );
  const [destinationBin, setDestinationBin] = useState('N-21');
  const [notes, setNotes] = useState('');
  const [validateImmediately, setValidateImmediately] = useState(true);

  const srcWarehouse = warehouses.find(w => w.id === sourceWarehouseId);
  const dstWarehouse = warehouses.find(w => w.id === destinationWarehouseId);

  const availableProducts = products.filter(p => p.warehouseId === sourceWarehouseId);
  const fallbackProduct = availableProducts[0] || products[0];

  const [items, setItems] = useState([
    {
      productId: defaultProductId || fallbackProduct?.id || '',
      quantity: 5
    }
  ]);

  if (!isOpen) return null;

  const handleProductChange = (index: number, prodId: string) => {
    const newItems = [...items];
    newItems[index].productId = prodId;
    setItems(newItems);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, qty);
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: fallbackProduct?.id || products[0]?.id || '',
        quantity: 2
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && item.quantity > prod.currentStock) {
        toastService.alert(
          'Insufficient Stock to Transfer',
          `Cannot transfer ${item.quantity} units for ${prod.sku}. Only ${prod.currentStock} units exist.`
        );
        return;
      }
    }

    try {
      const transfer = inventoryStore.createTransfer({
        sourceWarehouseId,
        sourceBin,
        destinationWarehouseId,
        destinationBin,
        items,
        notes: notes || 'Internal inventory replenishment transfer.'
      });

      if (validateImmediately) {
        inventoryStore.validateTransfer(transfer.id);
        toastService.success(
          'Transfer Completed!',
          `Transferred ${items.reduce((a, b) => a + b.quantity, 0)} units to ${dstWarehouse?.name} (${destinationBin}). Ledger updated.`
        );
      } else {
        toastService.info(
          'Transfer Staged',
          `Transfer ${transfer.referenceNo} scheduled for fulfillment.`
        );
      }

      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to execute transfer.';
      toastService.alert('Transfer Error', errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col card-3d">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Internal Stock Transfer</h3>
              <p className="text-xs text-slate-500">Source Location ➔ Destination Location ➔ Balance Realigned</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Origin and Destination Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-xl bg-white/70 border border-slate-200">
            {/* Origin */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                1. Source (Origin)
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Source Warehouse</label>
                <select
                  value={sourceWarehouseId}
                  onChange={(e) => {
                    setSourceWarehouseId(e.target.value);
                    const wh = warehouses.find(w => w.id === e.target.value);
                    if (wh && wh.activeBins.length > 0) setSourceBin(wh.activeBins[0]);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Source Bin / Rack</label>
                <select
                  value={sourceBin}
                  onChange={(e) => setSourceBin(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  {srcWarehouse?.activeBins.map(bin => (
                    <option key={bin} value={bin}>Bin {bin}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                2. Destination (Target)
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Target Warehouse</label>
                <select
                  value={destinationWarehouseId}
                  onChange={(e) => {
                    setDestinationWarehouseId(e.target.value);
                    const wh = warehouses.find(w => w.id === e.target.value);
                    if (wh && wh.activeBins.length > 0) setDestinationBin(wh.activeBins[0]);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Target Bin / Rack</label>
                <select
                  value={destinationBin}
                  onChange={(e) => setDestinationBin(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  {dstWarehouse?.activeBins.map(bin => (
                    <option key={bin} value={bin}>Bin {bin}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Items To Transfer
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const prod = products.find(p => p.id === item.productId);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] text-slate-500 mb-0.5">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} · {p.name} (Available: {p.currentStock} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] text-slate-500 mb-0.5">Move Qty</label>
                      <input
                        type="number"
                        min="1"
                        max={prod ? prod.currentStock : 999}
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 text-right font-mono"
                      />
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 mt-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Transfer Note / Justification</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Relocating overflow inventory to regional pick zone"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Validation Checkbox */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="validateTransferImmediately"
              checked={validateImmediately}
              onChange={(e) => setValidateImmediately(e.target.checked)}
              className="mt-1 rounded bg-white border-slate-200 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="validateTransferImmediately" className="text-xs text-slate-600 cursor-pointer">
              <span className="font-semibold text-indigo-400 block">Immediate Transfer Validation</span>
              Directly debit source warehouse location, credit destination warehouse location, and log move to the Stock Ledger.
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{validateImmediately ? 'Validate & Execute Transfer' : 'Stage Pending Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
