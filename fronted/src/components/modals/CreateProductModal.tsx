import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { Product } from '../../types/inventory';
import {
  Boxes,
  X,
  CheckCircle2,
  Tag,
  Warehouse as WarehouseIcon,
  Barcode
} from 'lucide-react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit
}) => {
  const warehouses = inventoryStore.getWarehouses();
  const categories = inventoryStore.getCategories();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Industrial Electronics');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [binLocation, setBinLocation] = useState('A-101');
  const [unitPrice, setUnitPrice] = useState<number>(150);
  const [costPrice, setCostPrice] = useState<number>(95);
  const [currentStock, setCurrentStock] = useState<number>(20);
  const [reorderLevel, setReorderLevel] = useState<number>(15);
  const [safetyStock, setSafetyStock] = useState<number>(8);
  const [maxCapacity, setMaxCapacity] = useState<number>(100);
  const [unit, setUnit] = useState('pcs');
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setWarehouseId(productToEdit.warehouseId);
      setBinLocation(productToEdit.binLocation);
      setUnitPrice(productToEdit.unitPrice);
      setCostPrice(productToEdit.costPrice);
      setCurrentStock(productToEdit.currentStock);
      setReorderLevel(productToEdit.reorderLevel);
      setSafetyStock(productToEdit.safetyStock);
      setMaxCapacity(productToEdit.maxCapacity);
      setUnit(productToEdit.unit);
      setBarcode(productToEdit.barcode);
    } else {
      // Defaults for new product
      const nextNum = Math.floor(100 + Math.random() * 900);
      setSku(`SN-PR-${nextNum}`);
      setName('');
      setCategory(categories[0]?.name || 'Industrial Electronics');
      setWarehouseId(warehouses[0]?.id || 'wh-1');
      setBinLocation('A-101');
      setUnitPrice(120);
      setCostPrice(75);
      setCurrentStock(30);
      setReorderLevel(15);
      setSafetyStock(8);
      setMaxCapacity(120);
      setUnit('pcs');
      setBarcode(`840129${Date.now().toString().slice(-6)}`);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku.trim() || !name.trim()) {
      toastService.alert('Missing Field', 'Please provide both SKU and Product Name.');
      return;
    }

    const wh = warehouses.find(w => w.id === warehouseId) || warehouses[0];

    try {
      if (productToEdit) {
        inventoryStore.updateProduct(productToEdit.id, {
          sku,
          name,
          category,
          warehouseId: wh.id,
          warehouseName: wh.name,
          binLocation,
          unitPrice,
          costPrice,
          currentStock,
          reorderLevel,
          safetyStock,
          maxCapacity,
          unit,
          barcode
        });
        toastService.success('Product Updated', `Changes to ${sku} were saved successfully.`);
      } else {
        inventoryStore.createProduct({
          sku,
          name,
          category,
          warehouseId: wh.id,
          warehouseName: wh.name,
          binLocation,
          unitPrice,
          costPrice,
          currentStock,
          reorderLevel,
          safetyStock,
          maxCapacity,
          unit,
          barcode
        });
        toastService.success('Product Created', `${name} (${sku}) added to catalog & ledger.`);
      }

      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save product.';
      toastService.alert('Error', errorMsg);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === warehouseId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col card-3d">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {productToEdit ? `Edit Product: ${productToEdit.sku}` : 'Add New Inventory Product'}
              </h3>
              <p className="text-xs text-slate-500">Configure catalog specifications, bin location & reorder rules</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* SKU & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">SKU / Item Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SN-EL-101"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Product Description / Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Optical Incremental Rotary Encoder"
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="units">Units</option>
                <option value="boxes">Boxes</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="pallets">Pallets</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Barcode / UPC</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g. 840129300101"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Warehouse & Bin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/70 border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  const wh = warehouses.find(w => w.id === e.target.value);
                  if (wh && wh.activeBins.length > 0) setBinLocation(wh.activeBins[0]);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bin Location / Shelf Slot</label>
              <select
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
              >
                {selectedWarehouse?.activeBins.map(bin => (
                  <option key={bin} value={bin}>Bin {bin}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Valuation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cost Price (Purchasing, $)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Selling / Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Stock Levels & Reorder Rules */}
          <div className="p-3 rounded-xl bg-white/70 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reorder Rules & Inventory Thresholds
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Current Stock</label>
                <input
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Safety Stock</label>
                <input
                  type="number"
                  min="0"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Max Bin Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 100)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            </div>
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
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
