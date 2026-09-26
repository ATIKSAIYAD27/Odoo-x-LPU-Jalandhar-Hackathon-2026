export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  warehouseId?: string;
  warehouseName?: string;
  phone?: string;
  department: string;
  lastLogin?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  detail?: string;
  timestamp: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  address: string;
  totalCapacity: number;
  usedCapacity: number;
  managerName: string;
  contactPhone: string;
  activeBins: string[];
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  productCount: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouseId: string;
  warehouseName: string;
  binLocation: string;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  reorderLevel: number;
  safetyStock: number;
  maxCapacity: number;
  unit: string; // e.g. 'pcs', 'units', 'kg', 'boxes'
  barcode: string;
  status: StockStatus;
  updatedAt: string;
}

export type MovementType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';

export interface ReceiptItem {
  productId: string;
  sku: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  unitCost: number;
}

export interface ReceiptOrder {
  id: string;
  referenceNo: string;
  supplierName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  destinationBin: string;
  items: ReceiptItem[];
  status: 'pending' | 'in_progress' | 'validated' | 'cancelled';
  dateCreated: string;
  validatedAt?: string;
  validatedBy?: string;
  notes?: string;
}

export interface DeliveryItem {
  productId: string;
  sku: string;
  productName: string;
  orderedQty: number;
  pickedQty: number;
  packedQty: number;
  unitPrice: number;
}

export interface DeliveryOrder {
  id: string;
  referenceNo: string;
  customerName: string;
  destinationAddress: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  items: DeliveryItem[];
  status: 'pending' | 'picking' | 'packed' | 'dispatched' | 'cancelled';
  dateCreated: string;
  validatedAt?: string;
  validatedBy?: string;
  notes?: string;
}

export interface TransferItem {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
}

export interface InternalTransfer {
  id: string;
  referenceNo: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  sourceBin: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  destinationBin: string;
  items: TransferItem[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  dateCreated: string;
  validatedAt?: string;
  validatedBy?: string;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  referenceNo: string;
  warehouseId: string;
  warehouseName: string;
  binLocation: string;
  productId: string;
  sku: string;
  productName: string;
  systemQty: number;
  countedQty: number;
  differenceQty: number;
  reason: 'Cycle Count Variance' | 'Damaged Goods' | 'Theft/Loss' | 'Expired Stock' | 'Found Inventory';
  status: 'pending' | 'validated' | 'rejected';
  dateCreated: string;
  validatedAt?: string;
  validatedBy?: string;
  notes?: string;
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  referenceNo: string;
  movementType: MovementType;
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  locationBin: string;
  qtyChange: number; // positive for receipt, negative for delivery, etc.
  previousQty: number;
  resultingQty: number;
  unitCost: number;
  totalValuationChange: number;
  operatorName: string;
  operatorRole: UserRole;
  notes?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
  todaysReceiptsCount: number;
  todaysDeliveriesCount: number;
  totalStockUnits: number;
}
