import {
  User,
  Warehouse,
  Category,
  Product,
  ReceiptOrder,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  StockLedgerEntry,
  SystemNotification,
  DashboardMetrics,
  StockStatus,
  UserRole,
  UserActivity
} from '../types/inventory';

const STORAGE_KEYS = {
  USERS: 'stocksense_users',
  CURRENT_USER: 'stocksense_current_user',
  WAREHOUSES: 'stocksense_warehouses',
  CATEGORIES: 'stocksense_categories',
  PRODUCTS: 'stocksense_products',
  RECEIPTS: 'stocksense_receipts',
  DELIVERIES: 'stocksense_deliveries',
  TRANSFERS: 'stocksense_transfers',
  ADJUSTMENTS: 'stocksense_adjustments',
  LEDGER: 'stocksense_ledger',
  NOTIFICATIONS: 'stocksense_notifications',
  OTP_STORE: 'stocksense_otp_store',
  ACTIVITY: 'stocksense_user_activity'
};

// Seed Users
const SEED_USERS: User[] = [
  {
    id: 'usr-0',
    name: 'Ava Moreno',
    email: 'admin@stocksense.io',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    department: 'Platform Administration',
    phone: '+1 (555) 000-0001',
    lastLogin: '2026-09-26T08:00:00Z',
    isActive: true,
    createdAt: '2026-01-05T10:00:00Z'
  },
  {
    id: 'usr-1',
    name: 'Sarah Jenkins',
    email: 'manager@stocksense.io',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    department: 'Global Inventory Operations',
    phone: '+1 (555) 234-8901',
    lastLogin: '2026-09-25T19:30:00Z',
    isActive: true,
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'staff@stocksense.io',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    department: 'Warehouse Inbound & Fulfillment',
    phone: '+1 (555) 432-1098',
    lastLogin: '2026-09-25T18:45:00Z',
    isActive: true,
    createdAt: '2026-02-14T10:00:00Z'
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'elena@stocksense.io',
    role: 'staff',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    warehouseId: 'wh-2',
    warehouseName: 'North Regional Depot B',
    department: 'Bin Logistics & Quality Control',
    phone: '+1 (555) 876-5432',
    lastLogin: '2026-09-24T14:15:00Z',
    isActive: true,
    createdAt: '2026-03-02T10:00:00Z'
  }
];

// Seed Warehouses
const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    code: 'HUB-ATL-01',
    name: 'Central Logistics Hub A',
    location: 'Atlanta, GA',
    address: '4200 Logistics Parkway, Atlanta, GA 30336',
    totalCapacity: 50000,
    usedCapacity: 34200,
    managerName: 'Sarah Jenkins',
    contactPhone: '+1 (404) 555-0199',
    activeBins: ['A-101', 'A-102', 'A-201', 'B-105', 'B-204', 'C-301', 'C-302', 'D-401']
  },
  {
    id: 'wh-2',
    code: 'DEP-CHI-02',
    name: 'North Regional Depot B',
    location: 'Chicago, IL',
    address: '8800 O\'Hare Cargo Way, Chicago, IL 60666',
    totalCapacity: 35000,
    usedCapacity: 21800,
    managerName: 'David Sterling',
    contactPhone: '+1 (312) 555-0144',
    activeBins: ['N-11', 'N-12', 'N-21', 'R-04', 'R-08', 'S-15', 'T-20']
  },
  {
    id: 'wh-3',
    code: 'SEA-WST-03',
    name: 'Pacific Freight Center C',
    location: 'Seattle, WA',
    address: '1500 Harbor Terminal 18, Seattle, WA 98134',
    totalCapacity: 40000,
    usedCapacity: 14500,
    managerName: 'Mei-Ling Zhou',
    contactPhone: '+1 (206) 555-0182',
    activeBins: ['P-01', 'P-02', 'Q-10', 'Q-25', 'W-03']
  }
];

// Seed Categories
const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Industrial Electronics', code: 'ELEC', description: 'Microcontrollers, sensors, power modules and controllers', productCount: 4 },
  { id: 'cat-2', name: 'Automated Pneumatics', code: 'PNEU', description: 'Valves, cylinders, hoses and pressure actuators', productCount: 3 },
  { id: 'cat-3', name: 'Precision Fasteners', code: 'FAST', description: 'Aerospace grade bolts, nuts, washers and dowels', productCount: 2 },
  { id: 'cat-4', name: 'Heavy Machinery Spares', code: 'HMEP', description: 'Bearings, hydraulic pumps, seals and gearboxes', productCount: 2 },
  { id: 'cat-5', name: 'Thermal & Optics', code: 'THRM', description: 'Infrared cameras, optical lenses and heatsinks', productCount: 1 }
];

// Seed Products
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prd-101',
    sku: 'SN-EL-901',
    name: 'Cortex-M7 Industrial Edge Controller',
    category: 'Industrial Electronics',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    binLocation: 'A-101',
    unitPrice: 285.00,
    costPrice: 195.00,
    currentStock: 48,
    reorderLevel: 25,
    safetyStock: 15,
    maxCapacity: 150,
    unit: 'pcs',
    barcode: '840129300101',
    status: 'in_stock',
    updatedAt: '2026-09-25T14:20:00Z'
  },
  {
    id: 'prd-102',
    sku: 'SN-EL-904',
    name: 'Precision Pressure Transducer 0-10 Bar',
    category: 'Industrial Electronics',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    binLocation: 'A-201',
    unitPrice: 145.50,
    costPrice: 88.00,
    currentStock: 8,
    reorderLevel: 20,
    safetyStock: 10,
    maxCapacity: 120,
    unit: 'pcs',
    barcode: '840129300102',
    status: 'low_stock',
    updatedAt: '2026-09-25T11:15:00Z'
  },
  {
    id: 'prd-103',
    sku: 'SN-PN-420',
    name: 'Pneumatic Rodless Cylinder 40mm Stroke',
    category: 'Automated Pneumatics',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    binLocation: 'B-105',
    unitPrice: 380.00,
    costPrice: 260.00,
    currentStock: 0,
    reorderLevel: 15,
    safetyStock: 5,
    maxCapacity: 80,
    unit: 'units',
    barcode: '840129300103',
    status: 'out_of_stock',
    updatedAt: '2026-09-24T16:40:00Z'
  },
  {
    id: 'prd-104',
    sku: 'SN-PN-512',
    name: 'Electromagnetic 5/2-Way Solenoid Valve',
    category: 'Automated Pneumatics',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    binLocation: 'B-204',
    unitPrice: 72.00,
    costPrice: 42.00,
    currentStock: 115,
    reorderLevel: 30,
    safetyStock: 20,
    maxCapacity: 250,
    unit: 'pcs',
    barcode: '840129300104',
    status: 'in_stock',
    updatedAt: '2026-09-25T09:30:00Z'
  },
  {
    id: 'prd-105',
    sku: 'SN-FA-108',
    name: 'Titanium M8x50mm High-Tensile Bolts (Box of 100)',
    category: 'Precision Fasteners',
    warehouseId: 'wh-2',
    warehouseName: 'North Regional Depot B',
    binLocation: 'N-11',
    unitPrice: 190.00,
    costPrice: 120.00,
    currentStock: 14,
    reorderLevel: 25,
    safetyStock: 12,
    maxCapacity: 100,
    unit: 'boxes',
    barcode: '840129300105',
    status: 'low_stock',
    updatedAt: '2026-09-25T08:10:00Z'
  },
  {
    id: 'prd-106',
    sku: 'SN-HM-772',
    name: 'Self-Aligning Double Row Spherical Bearing',
    category: 'Heavy Machinery Spares',
    warehouseId: 'wh-2',
    warehouseName: 'North Regional Depot B',
    binLocation: 'R-04',
    unitPrice: 540.00,
    costPrice: 375.00,
    currentStock: 32,
    reorderLevel: 10,
    safetyStock: 6,
    maxCapacity: 60,
    unit: 'units',
    barcode: '840129300106',
    status: 'in_stock',
    updatedAt: '2026-09-24T13:00:00Z'
  },
  {
    id: 'prd-107',
    sku: 'SN-TH-330',
    name: 'Thermal Imaging Pyrometer 1200°C Sensor',
    category: 'Thermal & Optics',
    warehouseId: 'wh-3',
    warehouseName: 'Pacific Freight Center C',
    binLocation: 'P-01',
    unitPrice: 890.00,
    costPrice: 620.00,
    currentStock: 19,
    reorderLevel: 8,
    safetyStock: 4,
    maxCapacity: 50,
    unit: 'units',
    barcode: '840129300107',
    status: 'in_stock',
    updatedAt: '2026-09-25T15:50:00Z'
  },
  {
    id: 'prd-108',
    sku: 'SN-EL-815',
    name: 'Optical Incremental Rotary Encoder 2048 PPR',
    category: 'Industrial Electronics',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    binLocation: 'C-301',
    unitPrice: 165.00,
    costPrice: 105.00,
    currentStock: 74,
    reorderLevel: 20,
    safetyStock: 10,
    maxCapacity: 150,
    unit: 'pcs',
    barcode: '840129300108',
    status: 'in_stock',
    updatedAt: '2026-09-25T16:10:00Z'
  }
];

// Seed Receipts
const SEED_RECEIPTS: ReceiptOrder[] = [
  {
    id: 'rec-001',
    referenceNo: 'REC-2026-0081',
    supplierName: 'OmniSilicon Semiconductor Ltd',
    destinationWarehouseId: 'wh-1',
    destinationWarehouseName: 'Central Logistics Hub A',
    destinationBin: 'A-101',
    items: [
      {
        productId: 'prd-101',
        sku: 'SN-EL-901',
        productName: 'Cortex-M7 Industrial Edge Controller',
        expectedQty: 30,
        receivedQty: 30,
        unitCost: 195.00
      }
    ],
    status: 'pending',
    dateCreated: '2026-09-25T08:00:00Z',
    notes: 'Urgent production shipment via air priority freight. Verified pallet seal.'
  },
  {
    id: 'rec-002',
    referenceNo: 'REC-2026-0082',
    supplierName: 'HydraTech Dynamics Corp',
    destinationWarehouseId: 'wh-1',
    destinationWarehouseName: 'Central Logistics Hub A',
    destinationBin: 'B-105',
    items: [
      {
        productId: 'prd-103',
        sku: 'SN-PN-420',
        productName: 'Pneumatic Rodless Cylinder 40mm Stroke',
        expectedQty: 25,
        receivedQty: 0,
        unitCost: 260.00
      }
    ],
    status: 'pending',
    dateCreated: '2026-09-25T09:15:00Z',
    notes: 'Out-of-stock replenishment batch. Ready for intake verification.'
  },
  {
    id: 'rec-003',
    referenceNo: 'REC-2026-0079',
    supplierName: 'AeroFastener Systems LLC',
    destinationWarehouseId: 'wh-2',
    destinationWarehouseName: 'North Regional Depot B',
    destinationBin: 'N-11',
    items: [
      {
        productId: 'prd-105',
        sku: 'SN-FA-108',
        productName: 'Titanium M8x50mm High-Tensile Bolts (Box of 100)',
        expectedQty: 40,
        receivedQty: 40,
        unitCost: 120.00
      }
    ],
    status: 'validated',
    dateCreated: '2026-09-24T10:00:00Z',
    validatedAt: '2026-09-24T14:30:00Z',
    validatedBy: 'Marcus Vance',
    notes: 'Inspected for ISO thread compliance. Passed intake quality QA.'
  }
];

// Seed Deliveries
const SEED_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'del-001',
    referenceNo: 'DEL-2026-0120',
    customerName: 'Apex Robotics Manufacturing GmbH',
    destinationAddress: 'Industrial Zone 4, Building C, Duluth, GA',
    sourceWarehouseId: 'wh-1',
    sourceWarehouseName: 'Central Logistics Hub A',
    items: [
      {
        productId: 'prd-101',
        sku: 'SN-EL-901',
        productName: 'Cortex-M7 Industrial Edge Controller',
        orderedQty: 12,
        pickedQty: 12,
        packedQty: 0,
        unitPrice: 285.00
      },
      {
        productId: 'prd-104',
        sku: 'SN-PN-512',
        productName: 'Electromagnetic 5/2-Way Solenoid Valve',
        orderedQty: 15,
        pickedQty: 15,
        packedQty: 15,
        unitPrice: 72.00
      }
    ],
    status: 'picking',
    dateCreated: '2026-09-25T07:30:00Z',
    notes: 'Requires antistatic bubble packaging. Freight courier arriving 16:00.'
  },
  {
    id: 'del-002',
    referenceNo: 'DEL-2026-0121',
    customerName: 'Stellar Aerospace Propulsion',
    destinationAddress: 'Aviation Way 109, Marietta, GA',
    sourceWarehouseId: 'wh-1',
    sourceWarehouseName: 'Central Logistics Hub A',
    items: [
      {
        productId: 'prd-108',
        sku: 'SN-EL-815',
        productName: 'Optical Incremental Rotary Encoder 2048 PPR',
        orderedQty: 8,
        pickedQty: 0,
        packedQty: 0,
        unitPrice: 165.00
      }
    ],
    status: 'pending',
    dateCreated: '2026-09-25T10:00:00Z',
    notes: 'Standard dispatch. Validate with bill of lading.'
  },
  {
    id: 'del-003',
    referenceNo: 'DEL-2026-0118',
    customerName: 'Cascade Marine Engineering',
    destinationAddress: 'Terminal 91, Pier 2, Seattle, WA',
    sourceWarehouseId: 'wh-3',
    sourceWarehouseName: 'Pacific Freight Center C',
    items: [
      {
        productId: 'prd-107',
        sku: 'SN-TH-330',
        productName: 'Thermal Imaging Pyrometer 1200°C Sensor',
        orderedQty: 4,
        pickedQty: 4,
        packedQty: 4,
        unitPrice: 890.00
      }
    ],
    status: 'dispatched',
    dateCreated: '2026-09-24T11:00:00Z',
    validatedAt: '2026-09-24T16:15:00Z',
    validatedBy: 'Sarah Jenkins',
    notes: 'Customer signed delivery receipt on manifest #7712.'
  }
];

// Seed Transfers
const SEED_TRANSFERS: InternalTransfer[] = [
  {
    id: 'trf-001',
    referenceNo: 'TRF-2026-0045',
    sourceWarehouseId: 'wh-1',
    sourceWarehouseName: 'Central Logistics Hub A',
    sourceBin: 'A-201',
    destinationWarehouseId: 'wh-2',
    destinationWarehouseName: 'North Regional Depot B',
    destinationBin: 'N-21',
    items: [
      {
        productId: 'prd-102',
        sku: 'SN-EL-904',
        productName: 'Precision Pressure Transducer 0-10 Bar',
        quantity: 5
      }
    ],
    status: 'pending',
    dateCreated: '2026-09-25T11:45:00Z',
    notes: 'Rebalancing inventory to meet Chicago assembly line demand.'
  },
  {
    id: 'trf-002',
    referenceNo: 'TRF-2026-0043',
    sourceWarehouseId: 'wh-1',
    sourceWarehouseName: 'Central Logistics Hub A',
    sourceBin: 'B-204',
    destinationWarehouseId: 'wh-1',
    destinationWarehouseName: 'Central Logistics Hub A',
    destinationBin: 'C-302',
    items: [
      {
        productId: 'prd-104',
        sku: 'SN-PN-512',
        productName: 'Electromagnetic 5/2-Way Solenoid Valve',
        quantity: 20
      }
    ],
    status: 'completed',
    dateCreated: '2026-09-24T15:20:00Z',
    validatedAt: '2026-09-24T16:45:00Z',
    validatedBy: 'Marcus Vance',
    notes: 'Internal bin relocation from overflow zone B to pick-ready rack C.'
  }
];

// Seed Adjustments
const SEED_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-001',
    referenceNo: 'ADJ-2026-0019',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    binLocation: 'A-201',
    productId: 'prd-102',
    sku: 'SN-EL-904',
    productName: 'Precision Pressure Transducer 0-10 Bar',
    systemQty: 10,
    countedQty: 8,
    differenceQty: -2,
    reason: 'Damaged Goods',
    status: 'validated',
    dateCreated: '2026-09-25T11:10:00Z',
    validatedAt: '2026-09-25T11:15:00Z',
    validatedBy: 'Sarah Jenkins',
    notes: 'Two units suffered casing micro-cracks during internal transport. Disposed per QA standard.'
  }
];

// Seed Stock Ledger Entries
const SEED_LEDGER: StockLedgerEntry[] = [
  {
    id: 'led-001',
    timestamp: '2026-09-24T14:30:00Z',
    referenceNo: 'REC-2026-0079',
    movementType: 'receipt',
    productId: 'prd-105',
    sku: 'SN-FA-108',
    productName: 'Titanium M8x50mm High-Tensile Bolts (Box of 100)',
    warehouseId: 'wh-2',
    warehouseName: 'North Regional Depot B',
    locationBin: 'N-11',
    qtyChange: 40,
    previousQty: 0,
    resultingQty: 40,
    unitCost: 120.00,
    totalValuationChange: 4800.00,
    operatorName: 'Marcus Vance',
    operatorRole: 'staff',
    notes: 'Supplier AeroFastener Systems delivery validated.'
  },
  {
    id: 'led-002',
    timestamp: '2026-09-24T16:15:00Z',
    referenceNo: 'DEL-2026-0118',
    movementType: 'delivery',
    productId: 'prd-107',
    sku: 'SN-TH-330',
    productName: 'Thermal Imaging Pyrometer 1200°C Sensor',
    warehouseId: 'wh-3',
    warehouseName: 'Pacific Freight Center C',
    locationBin: 'P-01',
    qtyChange: -4,
    previousQty: 23,
    resultingQty: 19,
    unitCost: 620.00,
    totalValuationChange: -2480.00,
    operatorName: 'Sarah Jenkins',
    operatorRole: 'manager',
    notes: 'Outbound dispatch to Cascade Marine Engineering.'
  },
  {
    id: 'led-003',
    timestamp: '2026-09-24T16:45:00Z',
    referenceNo: 'TRF-2026-0043',
    movementType: 'transfer',
    productId: 'prd-104',
    sku: 'SN-PN-512',
    productName: 'Electromagnetic 5/2-Way Solenoid Valve',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    locationBin: 'B-204 -> C-302',
    qtyChange: 0,
    previousQty: 115,
    resultingQty: 115,
    unitCost: 42.00,
    totalValuationChange: 0.00,
    operatorName: 'Marcus Vance',
    operatorRole: 'staff',
    notes: 'Bin relocation of 20 units to active pick zone.'
  },
  {
    id: 'led-004',
    timestamp: '2026-09-25T11:15:00Z',
    referenceNo: 'ADJ-2026-0019',
    movementType: 'adjustment',
    productId: 'prd-102',
    sku: 'SN-EL-904',
    productName: 'Precision Pressure Transducer 0-10 Bar',
    warehouseId: 'wh-1',
    warehouseName: 'Central Logistics Hub A',
    locationBin: 'A-201',
    qtyChange: -2,
    previousQty: 10,
    resultingQty: 8,
    unitCost: 88.00,
    totalValuationChange: -176.00,
    operatorName: 'Sarah Jenkins',
    operatorRole: 'manager',
    notes: 'Cycle count variance adjustment due to transit damage.'
  }
];

// Seed Notifications
const SEED_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Critical Out of Stock',
    message: 'Pneumatic Rodless Cylinder (SN-PN-420) reached 0 units. Inbound shipment REC-2026-0082 pending.',
    type: 'alert',
    timestamp: '2026-09-25T12:00:00Z',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Low Stock Threshold Reached',
    message: 'Precision Pressure Transducer (SN-EL-904) has 8 units left in Hub A (reorder at 20).',
    type: 'warning',
    timestamp: '2026-09-25T11:20:00Z',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'New Inbound Receipt Assigned',
    message: 'Shipment REC-2026-0081 from OmniSilicon is awaiting intake dock inspection.',
    type: 'info',
    timestamp: '2026-09-25T08:05:00Z',
    isRead: true
  }
];

class InventoryStore {
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    } else {
      // Migrate: ensure admin exists and legacy users have isActive/createdAt
      try {
        const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        let changed = false;
        if (!users.some(u => u.role === 'admin')) {
          users.unshift({ ...SEED_USERS[0] });
          changed = true;
        }
        users.forEach(u => {
          if (u.isActive === undefined) { u.isActive = true; changed = true; }
          if (!u.createdAt) { u.createdAt = new Date().toISOString(); changed = true; }
        });
        if (changed) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      } catch { /* ignore corrupt storage */ }
    }
    if (!localStorage.getItem(STORAGE_KEYS.WAREHOUSES)) {
      localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(SEED_WAREHOUSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(SEED_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
      localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(SEED_RECEIPTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DELIVERIES)) {
      localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(SEED_DELIVERIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSFERS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(SEED_TRANSFERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(SEED_ADJUSTMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEDGER)) {
      localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(SEED_LEDGER));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // Default to Inventory Manager for initial demo view
      const mgr = SEED_USERS.find(u => u.role === 'manager') || SEED_USERS[1] || SEED_USERS[0];
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mgr));
    }
  }

  // Subscribe to changes
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- AUTHENTICATION API ---
  public getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : SEED_USERS;
  }

  public switchDemoRole(role: UserRole): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.role === role && u.isActive !== false);
    if (!user) return null;
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    this.saveUser(updatedUser);
    this.setCurrentUser(updatedUser);
    this.logActivity(updatedUser.id, updatedUser.name, 'Signed In', `Persona switch — Role: ${role}`);
    return updatedUser;
  }

  public login(email: string, _pass: string): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      if (user.isActive === false) {
        this.logActivity(user.id, user.name, 'Login Blocked', 'Account is deactivated');
        return { success: false, error: 'Your account has been deactivated. Contact an administrator.' };
      }
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      this.saveUser(updatedUser);
      this.setCurrentUser(updatedUser);
      this.logActivity(user.id, user.name, 'Signed In', `Role: ${user.role}`);
      return { success: true, user: updatedUser };
    }

    // Allow quick login demo by matching keyword
    let matched: User | undefined;
    if (normalizedEmail.includes('admin')) {
      matched = users.find(u => u.role === 'admin') || SEED_USERS[0];
    } else if (normalizedEmail.includes('manager')) {
      matched = users.find(u => u.role === 'manager') || SEED_USERS[1];
    } else if (normalizedEmail.includes('staff')) {
      matched = users.find(u => u.role === 'staff') || SEED_USERS[2];
    }

    if (matched) {
      if (matched.isActive === false) {
        this.logActivity(matched.id, matched.name, 'Login Blocked', 'Account is deactivated');
        return { success: false, error: 'Your account has been deactivated. Contact an administrator.' };
      }
      const updatedUser = { ...matched, lastLogin: new Date().toISOString() };
      this.saveUser(updatedUser);
      this.setCurrentUser(updatedUser);
      this.logActivity(updatedUser.id, updatedUser.name, 'Signed In', `Role: ${updatedUser.role}`);
      return { success: true, user: updatedUser };
    }

    return { success: false, error: 'Invalid credentials. Try admin@, manager@ or staff@stocksense.io (any password).' };
  }

  // --- USER MANAGEMENT API (Admin) ---
  private saveUser(user: User): void {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }

  public updateUser(id: string, patch: Partial<User>): { success: boolean; error?: string } {
    const actor = this.getCurrentUser();
    if (!actor || (actor.role !== 'admin')) {
      return { success: false, error: 'Unauthorized: Only administrators can edit user accounts.' };
    }
    if (id === actor.id && patch.isActive === false) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx < 0) return { success: false, error: 'User not found.' };

    users[idx] = { ...users[idx], ...patch };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.logActivity(actor.id, actor.name, 'Updated User', `Edited ${users[idx].name} (${users[idx].email})`);
    this.notify();
    return { success: true };
  }

  public setUserActive(id: string, isActive: boolean): { success: boolean; error?: string } {
    const actor = this.getCurrentUser();
    if (!actor || (actor.role !== 'admin')) {
      return { success: false, error: 'Unauthorized: Only administrators can change account status.' };
    }
    if (id === actor.id) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx < 0) return { success: false, error: 'User not found.' };

    users[idx] = { ...users[idx], isActive };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.logActivity(actor.id, actor.name, isActive ? 'Activated User' : 'Deactivated User', `${users[idx].name} (${users[idx].email})`);
    this.notify();
    return { success: true };
  }

  public deleteUser(id: string): { success: boolean; error?: string } {
    const actor = this.getCurrentUser();
    if (!actor || actor.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only administrators can remove users.' };
    }
    if (id === actor.id) return { success: false, error: 'You cannot remove your own account.' };
    const users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return { success: false, error: 'User not found.' };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.filter(u => u.id !== id)));
    this.logActivity(actor.id, actor.name, 'Removed User', `${target.name} (${target.email})`);
    this.notify();
    return { success: true };
  }

  // --- USER ACTIVITY API ---
  private logActivity(userId: string, userName: string, action: string, detail?: string): void {
    try {
      const list: UserActivity[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
      list.unshift({
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId, userName, action, detail,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(list.slice(0, 300)));
    } catch { /* ignore */ }
  }

  public getUserActivity(userId?: string): UserActivity[] {
    try {
      const list: UserActivity[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
      return userId ? list.filter(a => a.userId === userId) : list;
    } catch { return []; }
  }

  public signup(params: { name: string; email: string; role: UserRole; warehouseId?: string }): { success: boolean; user?: User; error?: string } {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === params.email.toLowerCase())) {
      return { success: false, error: 'User with this email already exists.' };
    }

    const warehouse = this.getWarehouses().find(w => w.id === params.warehouseId) || this.getWarehouses()[0];

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: params.name,
      email: params.email,
      role: params.role,
      avatar: `https://images.unsplash.com/photo-${1535713875002 + Math.floor(Math.random() * 50)}?auto=format&fit=crop&w=200&q=80`,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      department: params.role === 'admin' ? 'Platform Administration' : params.role === 'manager' ? 'Inventory Management' : 'Warehouse Operations',
      lastLogin: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    this.logActivity(newUser.id, newUser.name, 'Account Created', `Role: ${newUser.role}`);
    return { success: true, user: newUser };
  }

  public logout(): void {
    const user = this.getCurrentUser();
    if (user) this.logActivity(user.id, user.name, 'Signed Out', `Role: ${user.role}`);
    this.setCurrentUser(null);
  }

  public requestPasswordResetOTP(email: string): { success: boolean; otp?: string; message: string } {
    const normalized = email.toLowerCase().trim();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const store = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_STORE) || '{}');
    store[normalized] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    localStorage.setItem(STORAGE_KEYS.OTP_STORE, JSON.stringify(store));
    return {
      success: true,
      otp,
      message: `Verification code generated for ${email}: ${otp}`
    };
  }

  public verifyOTPAndReset(email: string, otp: string): { success: boolean; message: string } {
    const normalized = email.toLowerCase().trim();
    const store = JSON.parse(localStorage.getItem(STORAGE_KEYS.OTP_STORE) || '{}');
    const record = store[normalized];

    if (!record || record.otp !== otp.trim()) {
      return { success: false, message: 'Invalid or expired OTP code. Please retry.' };
    }

    delete store[normalized];
    localStorage.setItem(STORAGE_KEYS.OTP_STORE, JSON.stringify(store));
    return { success: true, message: 'Password reset successful! You may now sign in.' };
  }

  // --- PRODUCTS API ---
  public getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : SEED_PRODUCTS;
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'status' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const status: StockStatus =
      data.currentStock <= 0 ? 'out_of_stock' :
      data.currentStock <= data.reorderLevel ? 'low_stock' : 'in_stock';

    const newProduct: Product = {
      ...data,
      id: `prd-${Date.now()}`,
      status,
      updatedAt: new Date().toISOString()
    };

    products.unshift(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    // Also record initial stock ledger entry if currentStock > 0
    if (newProduct.currentStock > 0) {
      this.createLedgerEntry({
        referenceNo: 'INIT-INV-' + newProduct.sku,
        movementType: 'receipt',
        productId: newProduct.id,
        sku: newProduct.sku,
        productName: newProduct.name,
        warehouseId: newProduct.warehouseId,
        warehouseName: newProduct.warehouseName,
        locationBin: newProduct.binLocation,
        qtyChange: newProduct.currentStock,
        previousQty: 0,
        resultingQty: newProduct.currentStock,
        unitCost: newProduct.costPrice,
        totalValuationChange: newProduct.currentStock * newProduct.costPrice,
        notes: 'Initial inventory creation and bin cataloging.'
      });
    }

    this.checkStockAlerts(newProduct);
    this.notify();
    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = products[index];
    const newStock = data.currentStock !== undefined ? data.currentStock : existing.currentStock;
    const reorder = data.reorderLevel !== undefined ? data.reorderLevel : existing.reorderLevel;

    const status: StockStatus =
      newStock <= 0 ? 'out_of_stock' :
      newStock <= reorder ? 'low_stock' : 'in_stock';

    const updated: Product = {
      ...existing,
      ...data,
      currentStock: newStock,
      status,
      updatedAt: new Date().toISOString()
    };

    products[index] = updated;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.checkStockAlerts(updated);
    this.notify();
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const user = this.getCurrentUser();
    if (user?.role !== 'manager' && user?.role !== 'admin') {
      throw new Error('Unauthorized: Only Inventory Managers can delete catalog products.');
    }

    let products = this.getProducts();
    const target = products.find(p => p.id === id);
    if (!target) return false;

    products = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.notify();
    return true;
  }

  // --- WAREHOUSES & CATEGORIES ---
  public getWarehouses(): Warehouse[] {
    const data = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return data ? JSON.parse(data) : SEED_WAREHOUSES;
  }

  public createWarehouse(data: Omit<Warehouse, 'id' | 'usedCapacity'>): Warehouse {
    const warehouses = this.getWarehouses();
    const newWh: Warehouse = {
      ...data,
      id: `wh-${Date.now()}`,
      usedCapacity: 0
    };
    warehouses.push(newWh);
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
    this.notify();
    return newWh;
  }

  public getCategories(): Category[] {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : SEED_CATEGORIES;
  }

  public createCategory(data: Omit<Category, 'id' | 'productCount'>): Category {
    const categories = this.getCategories();
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      productCount: 0
    };
    categories.push(newCat);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.notify();
    return newCat;
  }

  // --- CORE INVENTORY FLOW: 1. RECEIPT ---
  // Supplier -> Product -> Quantity -> Validate -> Stock INCREASES automatically + Ledger entry
  public getReceipts(): ReceiptOrder[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
    return data ? JSON.parse(data) : SEED_RECEIPTS;
  }

  public createReceipt(data: {
    supplierName: string;
    destinationWarehouseId: string;
    destinationBin: string;
    items: { productId: string; expectedQty: number; unitCost?: number }[];
    notes?: string;
  }): ReceiptOrder {
    const receipts = this.getReceipts();
    const warehouses = this.getWarehouses();
    const wh = warehouses.find(w => w.id === data.destinationWarehouseId) || warehouses[0];
    const products = this.getProducts();

    const receiptItems = data.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        sku: prod ? prod.sku : 'SKU-UNKNOWN',
        productName: prod ? prod.name : 'Unknown Product',
        expectedQty: item.expectedQty,
        receivedQty: item.expectedQty, // default to expected
        unitCost: item.unitCost || (prod ? prod.costPrice : 0)
      };
    });

    const refNum = `REC-2026-${(receipts.length + 83).toString().padStart(4, '0')}`;
    const newReceipt: ReceiptOrder = {
      id: `rec-${Date.now()}`,
      referenceNo: refNum,
      supplierName: data.supplierName,
      destinationWarehouseId: wh.id,
      destinationWarehouseName: wh.name,
      destinationBin: data.destinationBin,
      items: receiptItems,
      status: 'pending',
      dateCreated: new Date().toISOString(),
      notes: data.notes
    };

    receipts.unshift(newReceipt);
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    this.notify();
    return newReceipt;
  }

  public validateReceipt(receiptId: string): ReceiptOrder {
    const receipts = this.getReceipts();
    const index = receipts.findIndex(r => r.id === receiptId);
    if (index === -1) throw new Error('Receipt order not found');

    const receipt = receipts[index];
    if (receipt.status === 'validated') throw new Error('Receipt order already validated');

    const currentUser = this.getCurrentUser();
    const operatorName = currentUser?.name || 'Staff Operator';
    const operatorRole = currentUser?.role || 'staff';

    // Increase stock for each item and record ledger entry
    const products = this.getProducts();

    receipt.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        const prod = products[prodIndex];
        const prevQty = prod.currentStock;
        const addQty = item.receivedQty > 0 ? item.receivedQty : item.expectedQty;
        const newQty = prevQty + addQty;

        prod.currentStock = newQty;
        prod.status = newQty <= 0 ? 'out_of_stock' : (newQty <= prod.reorderLevel ? 'low_stock' : 'in_stock');
        prod.updatedAt = new Date().toISOString();
        if (receipt.destinationBin) {
          prod.binLocation = receipt.destinationBin;
        }

        // Ledger entry
        this.createLedgerEntry({
          referenceNo: receipt.referenceNo,
          movementType: 'receipt',
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          warehouseId: receipt.destinationWarehouseId,
          warehouseName: receipt.destinationWarehouseName,
          locationBin: receipt.destinationBin || prod.binLocation,
          qtyChange: addQty,
          previousQty: prevQty,
          resultingQty: newQty,
          unitCost: item.unitCost || prod.costPrice,
          totalValuationChange: addQty * (item.unitCost || prod.costPrice),
          operatorName,
          operatorRole,
          notes: `Goods received from ${receipt.supplierName} into bin ${receipt.destinationBin || prod.binLocation}.`
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    receipt.status = 'validated';
    receipt.validatedAt = new Date().toISOString();
    receipt.validatedBy = operatorName;
    receipts[index] = receipt;
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));

    this.createNotification({
      title: `Receipt ${receipt.referenceNo} Validated`,
      message: `Stock successfully increased across ${receipt.items.length} product(s) at ${receipt.destinationWarehouseName}.`,
      type: 'success'
    });

    this.notify();
    return receipt;
  }

  // --- CORE INVENTORY FLOW: 2. DELIVERY ---
  // Product -> Quantity -> Validate -> Stock DECREASES automatically + Ledger entry
  public getDeliveries(): DeliveryOrder[] {
    const data = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
    return data ? JSON.parse(data) : SEED_DELIVERIES;
  }

  public createDelivery(data: {
    customerName: string;
    destinationAddress: string;
    sourceWarehouseId: string;
    items: { productId: string; orderedQty: number }[];
    notes?: string;
  }): DeliveryOrder {
    const deliveries = this.getDeliveries();
    const warehouses = this.getWarehouses();
    const wh = warehouses.find(w => w.id === data.sourceWarehouseId) || warehouses[0];
    const products = this.getProducts();

    const deliveryItems = data.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        sku: prod ? prod.sku : 'SKU-UNKNOWN',
        productName: prod ? prod.name : 'Unknown Product',
        orderedQty: item.orderedQty,
        pickedQty: 0,
        packedQty: 0,
        unitPrice: prod ? prod.unitPrice : 0
      };
    });

    const refNum = `DEL-2026-${(deliveries.length + 122).toString().padStart(4, '0')}`;
    const newDelivery: DeliveryOrder = {
      id: `del-${Date.now()}`,
      referenceNo: refNum,
      customerName: data.customerName,
      destinationAddress: data.destinationAddress,
      sourceWarehouseId: wh.id,
      sourceWarehouseName: wh.name,
      items: deliveryItems,
      status: 'pending',
      dateCreated: new Date().toISOString(),
      notes: data.notes
    };

    deliveries.unshift(newDelivery);
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
    this.notify();
    return newDelivery;
  }

  public updateDeliveryPickPack(deliveryId: string, status: 'pending' | 'picking' | 'packed'): DeliveryOrder {
    const deliveries = this.getDeliveries();
    const index = deliveries.findIndex(d => d.id === deliveryId);
    if (index === -1) throw new Error('Delivery not found');

    const delivery = deliveries[index];
    delivery.status = status;

    // update item picked/packed progress
    delivery.items.forEach(item => {
      if (status === 'picking') {
        item.pickedQty = item.orderedQty;
      } else if (status === 'packed') {
        item.pickedQty = item.orderedQty;
        item.packedQty = item.orderedQty;
      }
    });

    deliveries[index] = delivery;
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
    this.notify();
    return delivery;
  }

  public validateDelivery(deliveryId: string): DeliveryOrder {
    const deliveries = this.getDeliveries();
    const index = deliveries.findIndex(d => d.id === deliveryId);
    if (index === -1) throw new Error('Delivery not found');

    const delivery = deliveries[index];
    if (delivery.status === 'dispatched') throw new Error('Delivery already validated & dispatched');

    const currentUser = this.getCurrentUser();
    const operatorName = currentUser?.name || 'Staff Operator';
    const operatorRole = currentUser?.role || 'staff';

    // Decrease stock for each item and record ledger entry
    const products = this.getProducts();

    delivery.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        const prod = products[prodIndex];
        const prevQty = prod.currentStock;
        const decQty = item.orderedQty;
        const newQty = Math.max(0, prevQty - decQty);

        prod.currentStock = newQty;
        prod.status = newQty <= 0 ? 'out_of_stock' : (newQty <= prod.reorderLevel ? 'low_stock' : 'in_stock');
        prod.updatedAt = new Date().toISOString();

        // Ledger entry (qtyChange is negative)
        this.createLedgerEntry({
          referenceNo: delivery.referenceNo,
          movementType: 'delivery',
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          warehouseId: delivery.sourceWarehouseId,
          warehouseName: delivery.sourceWarehouseName,
          locationBin: prod.binLocation,
          qtyChange: -decQty,
          previousQty: prevQty,
          resultingQty: newQty,
          unitCost: prod.costPrice,
          totalValuationChange: -(decQty * prod.costPrice),
          operatorName,
          operatorRole,
          notes: `Outbound dispatch delivered to ${delivery.customerName}.`
        });

        this.checkStockAlerts(prod);
      }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    delivery.status = 'dispatched';
    delivery.validatedAt = new Date().toISOString();
    delivery.validatedBy = operatorName;
    deliveries[index] = delivery;
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));

    this.createNotification({
      title: `Delivery Order ${delivery.referenceNo} Dispatched`,
      message: `Stock automatically decreased and order sent to ${delivery.customerName}.`,
      type: 'info'
    });

    this.notify();
    return delivery;
  }

  // --- CORE INVENTORY FLOW: 3. INTERNAL TRANSFER ---
  // Source Location -> Destination Location -> Quantity -> Validate -> Source decreases, Destination increases
  public getTransfers(): InternalTransfer[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return data ? JSON.parse(data) : SEED_TRANSFERS;
  }

  public createTransfer(data: {
    sourceWarehouseId: string;
    sourceBin: string;
    destinationWarehouseId: string;
    destinationBin: string;
    items: { productId: string; quantity: number }[];
    notes?: string;
  }): InternalTransfer {
    const transfers = this.getTransfers();
    const warehouses = this.getWarehouses();
    const srcWh = warehouses.find(w => w.id === data.sourceWarehouseId) || warehouses[0];
    const dstWh = warehouses.find(w => w.id === data.destinationWarehouseId) || warehouses[0];
    const products = this.getProducts();

    const transferItems = data.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        sku: prod ? prod.sku : 'SKU-UNKNOWN',
        productName: prod ? prod.name : 'Unknown Product',
        quantity: item.quantity
      };
    });

    const refNum = `TRF-2026-${(transfers.length + 46).toString().padStart(4, '0')}`;
    const newTransfer: InternalTransfer = {
      id: `trf-${Date.now()}`,
      referenceNo: refNum,
      sourceWarehouseId: srcWh.id,
      sourceWarehouseName: srcWh.name,
      sourceBin: data.sourceBin,
      destinationWarehouseId: dstWh.id,
      destinationWarehouseName: dstWh.name,
      destinationBin: data.destinationBin,
      items: transferItems,
      status: 'pending',
      dateCreated: new Date().toISOString(),
      notes: data.notes
    };

    transfers.unshift(newTransfer);
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    this.notify();
    return newTransfer;
  }

  public validateTransfer(transferId: string): InternalTransfer {
    const transfers = this.getTransfers();
    const index = transfers.findIndex(t => t.id === transferId);
    if (index === -1) throw new Error('Transfer not found');

    const transfer = transfers[index];
    if (transfer.status === 'completed') throw new Error('Transfer already completed');

    const currentUser = this.getCurrentUser();
    const operatorName = currentUser?.name || 'Staff Operator';
    const operatorRole = currentUser?.role || 'staff';

    const products = this.getProducts();

    transfer.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      if (prodIndex !== -1) {
        const prod = products[prodIndex];
        const prevQty = prod.currentStock;

        // If transfer is inter-warehouse or inter-bin:
        // Update product's active warehouse and bin location if full move, or rebalance
        if (transfer.sourceWarehouseId !== transfer.destinationWarehouseId) {
          prod.warehouseId = transfer.destinationWarehouseId;
          prod.warehouseName = transfer.destinationWarehouseName;
        }
        prod.binLocation = transfer.destinationBin;
        prod.updatedAt = new Date().toISOString();

        // Ledger entry for source -> destination
        this.createLedgerEntry({
          referenceNo: transfer.referenceNo,
          movementType: 'transfer',
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          warehouseId: transfer.destinationWarehouseId,
          warehouseName: transfer.destinationWarehouseName,
          locationBin: `${transfer.sourceBin} ➔ ${transfer.destinationBin}`,
          qtyChange: 0, // Inter-facility shift
          previousQty: prevQty,
          resultingQty: prevQty,
          unitCost: prod.costPrice,
          totalValuationChange: 0,
          operatorName,
          operatorRole,
          notes: `Transferred ${item.quantity} units from ${transfer.sourceWarehouseName} (${transfer.sourceBin}) to ${transfer.destinationWarehouseName} (${transfer.destinationBin}).`
        });
      }
    });

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    transfer.status = 'completed';
    transfer.validatedAt = new Date().toISOString();
    transfer.validatedBy = operatorName;
    transfers[index] = transfer;
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));

    this.createNotification({
      title: `Transfer ${transfer.referenceNo} Completed`,
      message: `Goods successfully transferred to ${transfer.destinationWarehouseName} (${transfer.destinationBin}).`,
      type: 'info'
    });

    this.notify();
    return transfer;
  }

  // --- CORE INVENTORY FLOW: 4. ADJUSTMENT (STOCK COUNTING) ---
  // System Quantity -> Physical Quantity -> Validate -> Difference calculated -> Stock updated -> Ledger entry created
  public getAdjustments(): StockAdjustment[] {
    const data = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return data ? JSON.parse(data) : SEED_ADJUSTMENTS;
  }

  public createAdjustment(data: {
    warehouseId: string;
    binLocation: string;
    productId: string;
    countedQty: number;
    reason: StockAdjustment['reason'];
    notes?: string;
  }): StockAdjustment {
    const adjustments = this.getAdjustments();
    const product = this.getProductById(data.productId);
    if (!product) throw new Error('Product not found for adjustment');

    const warehouses = this.getWarehouses();
    const wh = warehouses.find(w => w.id === data.warehouseId) || warehouses[0];

    const systemQty = product.currentStock;
    const differenceQty = data.countedQty - systemQty;
    const refNum = `ADJ-2026-${(adjustments.length + 20).toString().padStart(4, '0')}`;

    const newAdjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      referenceNo: refNum,
      warehouseId: wh.id,
      warehouseName: wh.name,
      binLocation: data.binLocation || product.binLocation,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      systemQty,
      countedQty: data.countedQty,
      differenceQty,
      reason: data.reason,
      status: 'pending',
      dateCreated: new Date().toISOString(),
      notes: data.notes
    };

    adjustments.unshift(newAdjustment);
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
    this.notify();
    return newAdjustment;
  }

  public validateAdjustment(adjustmentId: string): StockAdjustment {
    const adjustments = this.getAdjustments();
    const index = adjustments.findIndex(a => a.id === adjustmentId);
    if (index === -1) throw new Error('Adjustment not found');

    const adj = adjustments[index];
    if (adj.status === 'validated') throw new Error('Adjustment already validated');

    const currentUser = this.getCurrentUser();
    const operatorName = currentUser?.name || 'Staff Operator';
    const operatorRole = currentUser?.role || 'staff';

    const products = this.getProducts();
    const prodIndex = products.findIndex(p => p.id === adj.productId);
    if (prodIndex !== -1) {
      const prod = products[prodIndex];
      const prevQty = prod.currentStock;
      const newQty = adj.countedQty;

      prod.currentStock = newQty;
      prod.status = newQty <= 0 ? 'out_of_stock' : (newQty <= prod.reorderLevel ? 'low_stock' : 'in_stock');
      prod.updatedAt = new Date().toISOString();

      // Ledger entry
      this.createLedgerEntry({
        referenceNo: adj.referenceNo,
        movementType: 'adjustment',
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        warehouseId: adj.warehouseId,
        warehouseName: adj.warehouseName,
        locationBin: adj.binLocation,
        qtyChange: adj.differenceQty,
        previousQty: prevQty,
        resultingQty: newQty,
        unitCost: prod.costPrice,
        totalValuationChange: adj.differenceQty * prod.costPrice,
        operatorName,
        operatorRole,
        notes: `Physical cycle count adjustment (${adj.reason}): ${adj.differenceQty > 0 ? '+' : ''}${adj.differenceQty} units.`
      });

      this.checkStockAlerts(prod);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    }

    adj.status = 'validated';
    adj.validatedAt = new Date().toISOString();
    adj.validatedBy = operatorName;
    adjustments[index] = adj;
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));

    this.createNotification({
      title: `Stock Adjustment ${adj.referenceNo} Applied`,
      message: `System stock for ${adj.sku} adjusted by ${adj.differenceQty > 0 ? '+' : ''}${adj.differenceQty} to reflect physical count (${adj.countedQty}).`,
      type: adj.differenceQty < 0 ? 'warning' : 'success'
    });

    this.notify();
    return adj;
  }

  // --- LEDGER API ---
  public getLedger(): StockLedgerEntry[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return data ? JSON.parse(data) : SEED_LEDGER;
  }

  private createLedgerEntry(data: Omit<StockLedgerEntry, 'id' | 'timestamp' | 'operatorName' | 'operatorRole'> & { operatorName?: string; operatorRole?: UserRole }): StockLedgerEntry {
    const ledger = this.getLedger();
    const currentUser = this.getCurrentUser();

    const entry: StockLedgerEntry = {
      ...data,
      id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      operatorName: data.operatorName || currentUser?.name || 'System Auto',
      operatorRole: data.operatorRole || currentUser?.role || 'manager'
    };

    ledger.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
    return entry;
  }

  // --- NOTIFICATIONS API ---
  public getNotifications(): SystemNotification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : SEED_NOTIFICATIONS;
  }

  public createNotification(data: Omit<SystemNotification, 'id' | 'timestamp' | 'isRead'>): SystemNotification {
    const notifs = this.getNotifications();
    const newNotif: SystemNotification = {
      ...data,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return newNotif;
  }

  public markNotificationAsRead(id: string): void {
    const notifs = this.getNotifications();
    const n = notifs.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      this.notify();
    }
  }

  public markAllNotificationsAsRead(): void {
    const notifs = this.getNotifications().map(n => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.notify();
  }

  private checkStockAlerts(product: Product) {
    if (product.currentStock <= 0) {
      this.createNotification({
        title: `OUT OF STOCK: ${product.sku}`,
        message: `${product.name} has reached 0 units in ${product.warehouseName}. Reorder immediately!`,
        type: 'alert'
      });
    } else if (product.currentStock <= product.reorderLevel) {
      this.createNotification({
        title: `Low Stock Alert: ${product.sku}`,
        message: `${product.name} count is ${product.currentStock} units (threshold: ${product.reorderLevel}).`,
        type: 'warning'
      });
    }
  }

  // --- DASHBOARD METRICS CALCULATION ---
  public getMetrics(): DashboardMetrics {
    const products = this.getProducts();
    const receipts = this.getReceipts();
    const deliveries = this.getDeliveries();
    const transfers = this.getTransfers();

    const lowStockCount = products.filter(p => p.status === 'low_stock').length;
    const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length;
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.currentStock * p.unitPrice), 0);
    const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);

    const pendingReceipts = receipts.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'picking').length;
    const pendingTransfers = transfers.filter(t => t.status === 'pending' || t.status === 'in_transit').length;

    // Today's receipts & deliveries
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysReceiptsCount = receipts.filter(r => r.dateCreated.startsWith(todayStr)).length;
    const todaysDeliveriesCount = deliveries.filter(d => d.dateCreated.startsWith(todayStr)).length;

    return {
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      todaysReceiptsCount,
      todaysDeliveriesCount,
      totalStockUnits
    };
  }

  // Reset to initial seed state
  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.WAREHOUSES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSFERS);
    localStorage.removeItem(STORAGE_KEYS.ADJUSTMENTS);
    localStorage.removeItem(STORAGE_KEYS.LEDGER);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.OTP_STORE);
    this.init();
    this.notify();
  }
}

export const inventoryStore = new InventoryStore();
