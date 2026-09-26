import React, { useState } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { StockAdjustment } from '../../types/inventory';
import {
  SlidersHorizontal,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Equal
} from 'lucide-react';

interface CreateAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export const CreateAdjustmentModal: React.FC<CreateAdjustmentModalProps> = ({
  isOpen,
  onClose,
  defaultProductId
}) => {
  const warehouses = inventoryStore.getWarehouses();
  const products = inventoryStore.getProducts();

  const [selectedProductId, setSelectedProductId] = useState(defaultProductId || products[0]?.id || '');
  const product = products.find(p => p.id === selectedProductId) || products[0];

  const [countedQty, setCountedQty] = useState(product ? product.currentStock : 0);
  const [reason, setReason] = useState<StockAdjustment['reason']>('Cycle Count Variance');
  const [notes, setNotes] = useState('');
  const [validateImmediately, setValidateImmediately] = useState(true);

  if (!isOpen) return null;

  const systemQty = product ? product.currentStock : 0;
  const difference = countedQty - systemQty;
  const valuationImpact = difference * (product ? product.costPrice : 0);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = products.find(prod => prod.id === prodId);
    if (p) {
      setCountedQty(p.currentStock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!product) return;

    try {
      const adjustment = inventoryStore.createAdjustment({
        warehouseId: product.warehouseId,
        binLocation: product.binLocation,
        productId: product.id,
        countedQty,
        reason,
        notes: notes || `Physical inventory audit (${reason}). Difference: ${difference > 0 ? '+' : ''}${difference} units.`
      });

      if (validateImmediately) {
        inventoryStore.validateAdjustment(adjustment.id);
        toastService.success(
          'Inventory Count Validated!',
          `System quantity for ${product.sku} adjusted to ${countedQty} units. Difference of ${difference > 0 ? '+' : ''}${difference} logged to ledger.`
        );
      } else {
        toastService.info(
          'Adjustment Count Recorded',
          `Adjustment ${adjustment.referenceNo} is pending supervisor validation.`
        );
      }

      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Adjustment failed.';
      toastService.alert('Error', errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden card-3d">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Stock Counting & Adjustment</h3>
              <p className="text-xs text-slate-500">System Qty ➔ Physical Count ➔ Variance Calculated</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.name} ({p.warehouseName} · Bin {p.binLocation})
                </option>
              ))}
            </select>
          </div>

          {/* Variance Calculation Card */}
          <div className="p-4 rounded-xl bg-white/80 border border-slate-200 grid grid-cols-3 gap-2 text-center">
            {/* System Qty */}
            <div className="p-2 rounded-lg bg-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">System Stock</div>
              <div className="text-lg font-mono font-bold text-slate-700 mt-0.5">
                {systemQty} <span className="text-xs font-normal text-slate-500">{product?.unit}</span>
              </div>
            </div>

            {/* Physical Count */}
            <div className="p-2 rounded-lg bg-slate-100 border border-indigo-200">
              <div className="text-[10px] text-indigo-600 font-semibold">Physical Count</div>
              <input
                type="number"
                min="0"
                value={countedQty}
                onChange={(e) => setCountedQty(parseInt(e.target.value) || 0)}
                className="w-full text-center bg-transparent font-mono text-lg font-bold text-slate-900 focus:outline-none"
              />
            </div>

            {/* Difference */}
            <div className={`p-2 rounded-lg ${
              difference === 0
                ? 'bg-slate-100'
                : difference > 0
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-rose-50 border border-rose-200'
            }`}>
              <div className="text-[10px] text-slate-500 font-medium">Variance</div>
              <div className={`text-lg font-mono font-bold mt-0.5 ${
                difference === 0 ? 'text-slate-500' : difference > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {difference > 0 ? `+${difference}` : difference}
              </div>
            </div>
          </div>

          {/* Reason & Valuation impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Adjustment Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as StockAdjustment['reason'])}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="Cycle Count Variance">Cycle Count Variance</option>
                <option value="Damaged Goods">Damaged Goods</option>
                <option value="Theft/Loss">Theft/Loss</option>
                <option value="Expired Stock">Expired Stock</option>
                <option value="Found Inventory">Found Inventory</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Valuation Impact</label>
              <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
                <span>Value Delta:</span>
                <span className={valuationImpact < 0 ? 'text-rose-600 font-bold' : valuationImpact > 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                  {valuationImpact < 0 ? `-$${Math.abs(valuationImpact).toFixed(2)}` : `+$${valuationImpact.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Audit Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reconciled during monthly cycle count in Rack A"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Validation Checkbox */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="validateAdjustmentImmediately"
              checked={validateImmediately}
              onChange={(e) => setValidateImmediately(e.target.checked)}
              className="mt-1 rounded bg-white border-slate-200 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="validateAdjustmentImmediately" className="text-xs text-slate-600 cursor-pointer">
              <span className="font-semibold text-amber-400 block">Immediate Adjustment Validation</span>
              Directly overwrite system quantity to match physical count ({countedQty} {product?.unit}) and write an audit record to the Stock Ledger.
            </label>
          </div>

          {/* Actions */}
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
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-amber-600/25 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{validateImmediately ? 'Validate & Reconcile Stock' : 'Record Pending Count'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
