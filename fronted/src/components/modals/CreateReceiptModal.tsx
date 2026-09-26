import React, { useState } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import confetti from 'canvas-confetti';
import {
  PackageCheck,
  X,
  Plus,
  Trash2,
  Warehouse as WarehouseIcon,
  CheckCircle2
} from 'lucide-react';

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({
  isOpen,
  onClose,
  defaultProductId
}) => {
  const warehouses = inventoryStore.getWarehouses();
  const products = inventoryStore.getProducts();

  const [supplierName, setSupplierName] = useState('OmniSilicon Semiconductor Ltd');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [destinationBin, setDestinationBin] = useState('A-101');
  const [notes, setNotes] = useState('');
  const [validateImmediately, setValidateImmediately] = useState(true);

  const [items, setItems] = useState([
    {
      productId: defaultProductId || products[0]?.id || '',
      expectedQty: 25,
      unitCost: products[0]?.costPrice || 100
    }
  ]);

  if (!isOpen) return null;

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    const newItems = [...items];
    newItems[index].productId = prodId;
    if (prod) {
      newItems[index].unitCost = prod.costPrice;
    }
    setItems(newItems);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].expectedQty = Math.max(1, qty);
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: products[0]?.id || '',
        expectedQty: 10,
        unitCost: products[0]?.costPrice || 50
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierName.trim()) {
      toastService.alert('Missing Field', 'Please specify the supplier name.');
      return;
    }

    try {
      const receipt = inventoryStore.createReceipt({
        supplierName,
        destinationWarehouseId,
        destinationBin,
        items,
        notes: notes || 'Standard inbound freight verification.'
      });

      if (validateImmediately) {
        inventoryStore.validateReceipt(receipt.id);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        toastService.success(
          'Inbound Goods Received & Validated!',
          `Stock increased automatically across ${items.length} line item(s). Ledger updated.`
        );
      } else {
        toastService.info(
          'Receipt Draft Saved',
          `Order ${receipt.referenceNo} is pending physical dock intake.`
        );
      }

      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process receipt.';
      toastService.alert('Receipt Error', errorMsg);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === destinationWarehouseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col card-3d">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Receive Inbound Goods (Receipt)</h3>
              <p className="text-xs text-slate-500">Supplier ➔ Intake Dock ➔ Stock Increases Automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Supplier & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier / Vendor Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Acme Precision Components"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Destination Warehouse</label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => {
                  setDestinationWarehouseId(e.target.value);
                  const wh = warehouses.find(w => w.id === e.target.value);
                  if (wh && wh.activeBins.length > 0) {
                    setDestinationBin(wh.activeBins[0]);
                  }
                }}
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Storage Bin</label>
              <select
                value={destinationBin}
                onChange={(e) => setDestinationBin(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {selectedWarehouse?.activeBins.map(bin => (
                  <option key={bin} value={bin}>Bin {bin}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Shipment Notes / Reference</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Packing Slip #9941, Passed initial QA"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Product Line Items
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
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Product (SKU)</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.sku} · {p.name} (Current: {p.currentStock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.expectedQty}
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
              ))}
            </div>
          </div>

          {/* Validation Checkbox */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="validateReceiptImmediately"
              checked={validateImmediately}
              onChange={(e) => setValidateImmediately(e.target.checked)}
              className="mt-1 rounded bg-white border-slate-200 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="validateReceiptImmediately" className="text-xs text-slate-600 cursor-pointer">
              <span className="font-semibold text-emerald-400 block">Immediate Receipt Validation & Stock Inflow</span>
              Automatically increment inventory count and commit a transaction entry to the permanent Stock Ledger upon saving.
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
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{validateImmediately ? 'Validate & Ingest Stock' : 'Save Pending Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
