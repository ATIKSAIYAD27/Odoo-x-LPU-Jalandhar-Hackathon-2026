import { Product, Warehouse } from '../types/inventory';

export interface BinSlot {
  bin: string;
  product: Product | null;
  aisle: number;
  bay: number;
  tier: number;
  x: number;
  y: number;
  z: number;
  fill: number;
}

export interface WarehouseLayout {
  slots: BinSlot[];
  aisles: number;
  bays: number;
  tiers: number;
  aisleSpacing: number;
  baySpacing: number;
  tierHeight: number;
  floorSize: number;
  occupancy: number;
}

export function buildWarehouseLayout(warehouse: Warehouse, products: Product[]): WarehouseLayout {
  const whProducts = products.filter(p => p.warehouseId === warehouse.id);

  const bins: string[] = [];
  warehouse.activeBins.forEach(bin => {
    if (bin && !bins.includes(bin)) bins.push(bin);
  });
  whProducts.forEach(p => {
    if (p.binLocation && !bins.includes(p.binLocation)) bins.push(p.binLocation);
  });
  if (bins.length === 0) bins.push('A-101');

  const assigned = new Set<string>();
  const packed: { bin: string; product: Product | null }[] = [];

  bins.forEach(bin => {
    const match = whProducts.find(p => p.binLocation === bin && !assigned.has(p.id));
    if (match) assigned.add(match.id);
    packed.push({ bin, product: match || null });
  });

  whProducts.forEach(p => {
    if (!assigned.has(p.id)) {
      packed.push({ bin: p.binLocation || `BIN-${packed.length + 1}`, product: p });
      assigned.add(p.id);
    }
  });

  const count = Math.max(packed.length, 4);
  const aisles = warehouse.totalCapacity >= 45000 ? 3 : 2;
  const tiers = count > 10 ? 3 : 2;
  const bays = Math.max(3, Math.ceil(count / (aisles * tiers)));

  const aisleSpacing = 13;
  const baySpacing = 6.2;
  const tierHeight = 3.8;
  const aisleOrigin = -((aisles - 1) * aisleSpacing) / 2;
  const bayOrigin = -((bays - 1) * baySpacing) / 2;

  const slots: BinSlot[] = packed.map((item, i) => {
    const aisle = Math.min(aisles - 1, Math.floor(i / (bays * tiers)));
    const rem = i % (bays * tiers);
    const bay = rem % bays;
    const tier = Math.floor(rem / bays);
    const fill = item.product
      ? Math.max(0.08, Math.min(1, item.product.currentStock / Math.max(item.product.maxCapacity, 1)))
      : 0;
    return {
      bin: item.bin,
      product: item.product,
      aisle,
      bay,
      tier,
      x: aisleOrigin + aisle * aisleSpacing,
      y: 1.05 + tier * tierHeight,
      z: bayOrigin + bay * baySpacing,
      fill: item.product?.status === 'out_of_stock' ? 0 : fill
    };
  });

  const occupied = slots.filter(s => s.product && s.product.currentStock > 0).length;
  const spanZ = Math.max(28, bays * baySpacing + 10);
  const spanX = Math.max(32, aisles * aisleSpacing + 16);

  return {
    slots,
    aisles,
    bays,
    tiers,
    aisleSpacing,
    baySpacing,
    tierHeight,
    floorSize: Math.max(spanX, spanZ),
    occupancy: packed.length ? occupied / packed.length : 0
  };
}

export function stockColor(product: Product | null, mode: 'shaded' | 'wireframe' | 'heatmap'): { color: string; emissive: string; intensity: number } {
  if (!product || product.status === 'out_of_stock' || product.currentStock <= 0) {
    return { color: '#94a3b8', emissive: '#334155', intensity: 0.12 };
  }
  if (mode === 'heatmap') {
    const ratio = product.currentStock / Math.max(product.maxCapacity, 1);
    if (ratio > 0.8) return { color: '#ef4444', emissive: '#7f1d1d', intensity: 0.35 };
    if (ratio > 0.45) return { color: '#f59e0b', emissive: '#78350f', intensity: 0.28 };
    return { color: '#10b981', emissive: '#064e3b', intensity: 0.22 };
  }
  if (product.status === 'low_stock') {
    return { color: '#f59e0b', emissive: '#78350f', intensity: 0.32 };
  }
  return { color: '#10b981', emissive: '#064e3b', intensity: 0.18 };
}
