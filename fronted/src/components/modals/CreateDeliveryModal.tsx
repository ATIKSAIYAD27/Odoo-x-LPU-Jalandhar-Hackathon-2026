import React, { useState } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import confetti from 'canvas-confetti';
import {
  Truck,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  isOpen,
  onClose,
  defaultProductId
}) => {
  const warehouses = inventoryStore.getWarehouses();
  const products = inventoryStore.getProducts();

  const [customerName, setCustomerName] = useState('Apex Industrial Manufacturing');
  const [destinationAddress, setDestinationAddress] = useState('7400 Technology Way, Norcross, GA');
  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [notes, setNotes] = useState('');
  const [validateImmediately, setValidateImmediately] = useState(false);

  const availableProducts = products.filter(p => p.warehouseId === sourceWarehouseId && p.currentStock > 0);
  const fallbackProduct = availableProducts[0] || products[0];

  const [items, setItems] = useState([
    {
      productId: defaultProductId || fallbackProduct?.id || '',
      orderedQty: 5
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
    newItems[index].orderedQty = Math.max(1, qty);
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: fallbackProduct?.id || products[0]?.id || '',
        orderedQty: 2
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toastService.alert('Missing Field', 'Please specify customer or client name.');
      return;
    }

    // Verify stock availability
    for (const item of items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && item.orderedQty > prod.currentStock) {
        toastService.alert(
          'Insufficient Stock',
          `Cannot allocate ${item.orderedQty} units for ${prod.sku}. Only ${prod.currentStock} units available in ${prod.warehouseName}.`
        );
        return;
      }
    }

    try {
      const delivery = inventoryStore.createDelivery({
        customerName,
        destinationAddress,
        sourceWarehouseId,
        items,
        notes: notes || 'Standard outbound freight dispatch.'
      });

      if (validateImmediately) {
        inventoryStore.validateDelivery(delivery.id);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        toastService.success(
          'Outbound Order Dispatched!',
          `Stock automatically reduced across ${items.length} product(s). Ledger updated.`
        );
      } else {
        toastService.info(
          'Delivery Order Created',
          `Order ${delivery.referenceNo} is ready for pick & pack on the warehouse floor.`
        );
      }

      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create delivery order.';
      toastService.alert('Delivery Error', errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col card-3d">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Create Delivery Order (Outbound)</h3>
              <p className="text-xs text-slate-500">Customer ➔ Pick & Pack ➔ Stock Decreases Automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Customer & Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Customer / Consignee</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Precision Automation Systems"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dispatching Warehouse</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.location})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Destination Address / Bay</label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="e.g. Dock 4, 1200 Airport Road"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dispatch Notes / PO #</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. PO-8891, Express priority courier"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Order Items To Dispatch
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
                const isOutOfStock = prod ? prod.currentStock <= 0 : false;
                const isInsufficient = prod ? item.orderedQty > prod.currentStock : false;

                return (
                  <div key={idx} className="p-2.5 bg-white/80 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} · {p.name} (Stock: {p.currentStock} {p.unit} in {p.warehouseName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Dispatch Qty</label>
                        <input
                          type="number"
                          min="1"
                          max={prod ? prod.currentStock : 999}
                          value={item.orderedQty}
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

                    {isInsufficient && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Exceeds available stock ({prod?.currentStock} {prod?.unit} available)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Validation */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="validateDeliveryImmediately"
              checked={validateImmediately}
              onChange={(e) => setValidateImmediately(e.target.checked)}
              className="mt-1 rounded bg-white border-slate-200 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="validateDeliveryImmediately" className="text-xs text-slate-600 cursor-pointer">
              <span className="font-semibold text-sky-400 block">Immediate Dispatch & Stock Outflow</span>
              Mark order dispatched immediately, automatically subtract product stock, and write audit entry to the Stock Ledger.
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
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-sky-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{validateImmediately ? 'Validate & Dispatch Stock' : 'Create Delivery (Stage for Pick/Pack)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
