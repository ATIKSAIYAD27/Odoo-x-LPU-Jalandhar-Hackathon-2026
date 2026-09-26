import React, { useState, useEffect } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { Product, Warehouse, Category, User } from '../../types/inventory';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  Barcode,
  Package
} from 'lucide-react';

interface ProductCatalogProps {
  currentUser: User | null;
  initialSearch?: string;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenReceipt: (productId: string) => void;
  onOpenDelivery: (productId: string) => void;
  onOpenAdjustment: (productId: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  currentUser,
  initialSearch = '',
  onOpenCreateProduct,
  onOpenEditProduct,
  onOpenReceipt,
  onOpenDelivery,
  onOpenAdjustment
}) => {
  const [products, setProducts] = useState<Product[]>(inventoryStore.getProducts());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(inventoryStore.getWarehouses());
  const [categories, setCategories] = useState<Category[]>(inventoryStore.getCategories());

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'admin';

  useEffect(() => {
    const refresh = () => {
      setProducts(inventoryStore.getProducts());
      setWarehouses(inventoryStore.getWarehouses());
      setCategories(inventoryStore.getCategories());
    };
    return inventoryStore.subscribe(refresh);
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

  const handleDelete = (id: string, name: string) => {
    if (!isManager) {
      toastService.alert('Permission Denied', 'Warehouse staff cannot delete catalog items.');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete "${name}" from the product catalog?`)) {
      try {
        inventoryStore.deleteProduct(id);
        toastService.info('Product Deleted', `Removed ${name} from active catalog.`);
      } catch (err: unknown) {
        toastService.alert('Delete Failed', err instanceof Error ? err.message : 'Error deleting product');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel card-3d">
        <div>
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-0.5">
            Enterprise SKU Master Catalog
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Product Inventory & Reorder Rules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredProducts.length} registered item(s) across all active warehouses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-white p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="3D Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {isManager && (
            <button
              onClick={onOpenCreateProduct}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl glass-panel-light border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, item title, or bin..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {viewMode === 'table' ? (
        <div className="p-4 rounded-2xl glass-panel border border-slate-200 overflow-hidden card-3d">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">SKU & Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Warehouse / Bin</th>
                  <th className="py-3 px-3 text-right">Cost / Selling</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-right">Reorder Rule</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-600">
                      No products found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] font-mono text-indigo-600 flex items-center gap-2 mt-0.5">
                          <span>{prod.sku}</span>
                          <span className="text-slate-600">· UPC: {prod.barcode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{prod.category}</td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700">{prod.warehouseName}</div>
                        <div className="text-[10px] font-mono text-slate-600">Bin: {prod.binLocation}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                        <div className="text-slate-700">${prod.unitPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-600">Cost: ${prod.costPrice.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {prod.currentStock} {prod.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-500 tabular-nums">
                        <div>Reorder: {prod.reorderLevel}</div>
                        <div className="text-[10px] text-slate-600">Safety: {prod.safetyStock}</div>
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
                            onClick={() => onOpenReceipt(prod.id)}
                            title="Receive inbound stock"
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-400 border border-emerald-200"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenAdjustment(prod.id)}
                            title="Physical count & adjust"
                            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-400 border border-amber-200"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {isManager && (
                            <>
                              <button
                                onClick={() => onOpenEditProduct(prod)}
                                title="Edit product"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(prod.id, prod.name)}
                                title="Delete product"
                                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-400 border border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(prod => {
            const stockPct = Math.min(100, Math.round((prod.currentStock / prod.maxCapacity) * 100));
            return (
              <div
                key={prod.id}
                className="p-5 rounded-2xl glass-panel card-3d border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider">
                        {prod.sku}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug mt-0.5 truncate">
                        {prod.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">{prod.category}</div>
                    </div>
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
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200 text-xs text-slate-600 mb-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Warehouse:</span>
                      <span className="font-semibold text-slate-700">{prod.warehouseName}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-600">Bin Location:</span>
                      <span className="text-indigo-600 font-bold">Rack {prod.binLocation}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Stock Level:</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {prod.currentStock} / {prod.maxCapacity} {prod.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          prod.currentStock <= 0
                            ? 'bg-rose-500 w-0'
                            : prod.currentStock <= prod.reorderLevel
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                      <span>Safety: {prod.safetyStock}</span>
                      <span>Reorder Trigger: {prod.reorderLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                  <div className="font-mono text-xs">
                    <span className="text-slate-600">Price: </span>
                    <span className="text-slate-900 font-bold">${prod.unitPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenReceipt(prod.id)}
                      className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-400 border border-emerald-200"
                      title="Receive Stock"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenDelivery(prod.id)}
                      className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-400 border border-sky-200"
                      title="Dispatch Order"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                    </button>
                    {isManager && (
                      <button
                        onClick={() => onOpenEditProduct(prod)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
