/**
 * StockSense REST API Client
 * Emulates / interacts with Flask / Express REST API endpoints for dynamic inventory data.
 */
import { inventoryStore } from './inventoryStore';
import {
  Product,
  Warehouse,
  Category,
  ReceiptOrder,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  StockLedgerEntry,
  DashboardMetrics,
  User,
  UserRole
} from '../types/inventory';

export const apiClient = {
  // --- AUTH ENDPOINTS ---
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    // Dynamic simulated network delay for realism
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.login(email, password);
  },

  signup: async (data: { name: string; email: string; role: UserRole; warehouseId?: string }): Promise<{ success: boolean; user?: User; error?: string }> => {
    await new Promise(r => setTimeout(r, 250));
    return inventoryStore.signup(data);
  },

  requestPasswordResetOTP: async (email: string): Promise<{ success: boolean; otp?: string; message: string }> => {
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.requestPasswordResetOTP(email);
  },

  verifyOTPAndReset: async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.verifyOTPAndReset(email, otp);
  },

  logout: async (): Promise<void> => {
    inventoryStore.logout();
  },

  // --- METRICS ---
  getMetrics: async (): Promise<DashboardMetrics> => {
    return inventoryStore.getMetrics();
  },

  // --- PRODUCTS ---
  getProducts: async (filters?: { warehouseId?: string; category?: string; status?: string; search?: string }): Promise<Product[]> => {
    let list = inventoryStore.getProducts();
    if (filters?.warehouseId && filters.warehouseId !== 'all') {
      list = list.filter(p => p.warehouseId === filters.warehouseId);
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter(p => p.category === filters.category);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(p => p.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.binLocation.toLowerCase().includes(q));
    }
    return list;
  },

  createProduct: async (productData: Omit<Product, 'id' | 'status' | 'updatedAt'>): Promise<Product> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.createProduct(productData);
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.updateProduct(id, updates);
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.deleteProduct(id);
  },

  // --- WAREHOUSES & CATEGORIES ---
  getWarehouses: async (): Promise<Warehouse[]> => {
    return inventoryStore.getWarehouses();
  },

  createWarehouse: async (wh: Omit<Warehouse, 'id' | 'usedCapacity'>): Promise<Warehouse> => {
    return inventoryStore.createWarehouse(wh);
  },

  getCategories: async (): Promise<Category[]> => {
    return inventoryStore.getCategories();
  },

  createCategory: async (cat: Omit<Category, 'id' | 'productCount'>): Promise<Category> => {
    return inventoryStore.createCategory(cat);
  },

  // --- RECEIPTS (INBOUND GOODS) ---
  getReceipts: async (): Promise<ReceiptOrder[]> => {
    return inventoryStore.getReceipts();
  },

  createReceipt: async (data: {
    supplierName: string;
    destinationWarehouseId: string;
    destinationBin: string;
    items: { productId: string; expectedQty: number; unitCost?: number }[];
    notes?: string;
  }): Promise<ReceiptOrder> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.createReceipt(data);
  },

  validateReceipt: async (receiptId: string): Promise<ReceiptOrder> => {
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.validateReceipt(receiptId);
  },

  // --- DELIVERIES (OUTBOUND ORDERS) ---
  getDeliveries: async (): Promise<DeliveryOrder[]> => {
    return inventoryStore.getDeliveries();
  },

  createDelivery: async (data: {
    customerName: string;
    destinationAddress: string;
    sourceWarehouseId: string;
    items: { productId: string; orderedQty: number }[];
    notes?: string;
  }): Promise<DeliveryOrder> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.createDelivery(data);
  },

  updateDeliveryPickPack: async (deliveryId: string, status: 'pending' | 'picking' | 'packed'): Promise<DeliveryOrder> => {
    await new Promise(r => setTimeout(r, 100));
    return inventoryStore.updateDeliveryPickPack(deliveryId, status);
  },

  validateDelivery: async (deliveryId: string): Promise<DeliveryOrder> => {
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.validateDelivery(deliveryId);
  },

  // --- INTERNAL TRANSFERS ---
  getTransfers: async (): Promise<InternalTransfer[]> => {
    return inventoryStore.getTransfers();
  },

  createTransfer: async (data: {
    sourceWarehouseId: string;
    sourceBin: string;
    destinationWarehouseId: string;
    destinationBin: string;
    items: { productId: string; quantity: number }[];
    notes?: string;
  }): Promise<InternalTransfer> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.createTransfer(data);
  },

  validateTransfer: async (transferId: string): Promise<InternalTransfer> => {
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.validateTransfer(transferId);
  },

  // --- ADJUSTMENTS (PHYSICAL COUNT) ---
  getAdjustments: async (): Promise<StockAdjustment[]> => {
    return inventoryStore.getAdjustments();
  },

  createAdjustment: async (data: {
    warehouseId: string;
    binLocation: string;
    productId: string;
    countedQty: number;
    reason: StockAdjustment['reason'];
    notes?: string;
  }): Promise<StockAdjustment> => {
    await new Promise(r => setTimeout(r, 150));
    return inventoryStore.createAdjustment(data);
  },

  validateAdjustment: async (adjustmentId: string): Promise<StockAdjustment> => {
    await new Promise(r => setTimeout(r, 200));
    return inventoryStore.validateAdjustment(adjustmentId);
  },

  // --- STOCK LEDGER ---
  getLedger: async (filters?: { movementType?: string; search?: string }): Promise<StockLedgerEntry[]> => {
    let ledger = inventoryStore.getLedger();
    if (filters?.movementType && filters.movementType !== 'all') {
      ledger = ledger.filter(l => l.movementType === filters.movementType);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      ledger = ledger.filter(l =>
        l.sku.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q) ||
        l.referenceNo.toLowerCase().includes(q) ||
        l.warehouseName.toLowerCase().includes(q)
      );
    }
    return ledger;
  }
};
