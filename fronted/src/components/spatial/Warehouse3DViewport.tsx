import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Product, Warehouse } from '../../types/inventory';
import { inventoryStore } from '../../services/inventoryStore';
import { buildWarehouseLayout, stockColor } from '../../utils/warehouseLayout';
import {
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  ArrowUpFromLine,
  ArrowRightLeft,
  SlidersHorizontal,
  X,
  Compass,
  Orbit
} from 'lucide-react';

interface Warehouse3DViewportProps {
  products: Product[];
  warehouse: Warehouse;
  onOpenReceipt: (productId: string) => void;
  onOpenDelivery: (productId: string) => void;
  onOpenTransfer: (productId: string) => void;
  onOpenAdjustment: (productId: string) => void;
}

export type ViewportRenderMode = 'shaded' | 'wireframe' | 'heatmap';
export type CameraPreset = 'perspective' | 'top' | 'front' | 'isometric';

function makeLabelTexture(text: string, sub?: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.clearRect(0, 0, 256, 96);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
  ctx.roundRect(8, 12, 240, 72, 12);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 44);
  if (sub) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px JetBrains Mono, monospace';
    ctx.fillText(sub, 128, 68);
  }
  return canvas;
}

export const Warehouse3DViewport: React.FC<Warehouse3DViewportProps> = ({
  products,
  warehouse,
  onOpenReceipt,
  onOpenDelivery,
  onOpenTransfer,
  onOpenAdjustment
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [renderMode, setRenderMode] = useState<ViewportRenderMode>('shaded');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [hoveredBin, setHoveredBin] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [pendingMoves, setPendingMoves] = useState(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const binMeshMap = useRef<Map<THREE.Mesh, Product | { emptyBin: string }>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const selectionOutlineRef = useRef<THREE.LineSegments | null>(null);
  const agvRobotRef = useRef<THREE.Group | null>(null);
  const rackGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 42, theta: Math.PI / 4, phi: Math.PI / 3.4 });
  const targetRef = useRef(new THREE.Vector3(0, 2.4, 0));

  const layout = useMemo(() => buildWarehouseLayout(warehouse, products), [warehouse, products]);

  useEffect(() => {
    const refresh = () => {
      const transfers = inventoryStore.getTransfers().filter(
        t =>
          (t.sourceWarehouseId === warehouse.id || t.destinationWarehouseId === warehouse.id) &&
          t.status !== 'completed' &&
          t.status !== 'cancelled'
      );
      const receipts = inventoryStore.getReceipts().filter(
        r => r.destinationWarehouseId === warehouse.id && r.status !== 'validated' && r.status !== 'cancelled'
      );
      setPendingMoves(transfers.length + receipts.length);
    };
    refresh();
    return inventoryStore.subscribe(refresh);
  }, [warehouse.id]);

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalRef.current;
    cameraRef.current.position.set(
      targetRef.current.x + radius * Math.sin(phi) * Math.sin(theta),
      targetRef.current.y + radius * Math.cos(phi),
      targetRef.current.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cameraRef.current.lookAt(targetRef.current);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e8edf5');
    scene.fog = new THREE.Fog('#e8edf5', 48, 120);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 400);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight('#dbe4f0', 0.95));

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.45);
    keyLight.position.set(22, 38, 16);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 8;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.camera.left = -40;
    keyLight.shadow.camera.right = 40;
    keyLight.shadow.camera.top = 40;
    keyLight.shadow.camera.bottom = -40;
    scene.add(keyLight);

    const fill = new THREE.DirectionalLight('#93c5fd', 0.55);
    fill.position.set(-18, 14, -12);
    scene.add(fill);

    const rackGroup = new THREE.Group();
    rackGroup.name = 'dynamic_racks';
    scene.add(rackGroup);
    rackGroupRef.current = rackGroup;

    const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 2.8, 3.4));
    const outlineMat = new THREE.LineBasicMaterial({ color: '#2563eb' });
    const selectionOutline = new THREE.LineSegments(outlineGeo, outlineMat);
    selectionOutline.visible = false;
    scene.add(selectionOutline);
    selectionOutlineRef.current = selectionOutline;

    const agvGroup = new THREE.Group();
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.42, 2.4),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35, metalness: 0.55 })
    );
    chassis.position.y = 0.32;
    chassis.castShadow = true;
    agvGroup.add(chassis);
    const mast = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.6, 0.22),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.7, roughness: 0.3 })
    );
    mast.position.set(-0.55, 1.15, 0);
    agvGroup.add(mast);
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.08, 0.28),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.4, roughness: 0.4 })
    );
    fork.position.set(0.35, 0.62, 0.35);
    agvGroup.add(fork);
    const fork2 = fork.clone();
    fork2.position.z = -0.35;
    agvGroup.add(fork2);
    scene.add(agvGroup);
    agvRobotRef.current = agvGroup;

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let lastFps = performance.now();
    let frames = 0;
    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      frames++;
      if (time - lastFps >= 1000) {
        setFps(Math.round((frames * 1000) / (time - lastFps)));
        frames = 0;
        lastFps = time;
      }
      if (agvRobotRef.current) {
        const t = time * 0.00045;
        const span = Math.max(8, layout.bays * 2.8);
        agvRobotRef.current.position.set(0, 0, Math.sin(t) * span);
        agvRobotRef.current.rotation.y = Math.cos(t) >= 0 ? 0 : Math.PI;
      }
      if (selectionOutlineRef.current?.visible) {
        const pulse = 1 + Math.sin(time * 0.005) * 0.03;
        selectionOutlineRef.current.scale.setScalar(pulse);
      }
      renderer.render(scene, camera);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [updateCameraPosition, layout.bays]);

  useEffect(() => {
    const scene = sceneRef.current;
    const rackGroup = rackGroupRef.current;
    if (!scene || !rackGroup) return;

    while (rackGroup.children.length) {
      const child = rackGroup.children[0];
      rackGroup.remove(child);
      child.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    binMeshMap.current.clear();

    const floor = layout.floorSize;
    const floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(floor, floor),
      new THREE.MeshStandardMaterial({ color: '#d7dee8', roughness: 0.85, metalness: 0.08 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    rackGroup.add(floorMesh);

    const grid = new THREE.GridHelper(floor, Math.round(floor / 2), '#94a3b8', '#cbd5e1');
    grid.position.y = 0.015;
    rackGroup.add(grid);

    const aisleMat = new THREE.MeshBasicMaterial({ color: '#f8fafc', transparent: true, opacity: 0.7 });
    const aisle = new THREE.Mesh(new THREE.PlaneGeometry(3.2, floor * 0.72), aisleMat);
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.y = 0.03;
    rackGroup.add(aisle);

    const dockMat = new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.55, metalness: 0.2 });
    const dock = new THREE.Mesh(new THREE.BoxGeometry(floor * 0.55, 2.4, 0.5), dockMat);
    dock.position.set(0, 1.2, -floor * 0.38);
    rackGroup.add(dock);
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 2.8, 0.18),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.35 })
    );
    door.position.set(0, 1.5, -floor * 0.38 + 0.2);
    rackGroup.add(door);

    const steel = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.38,
      metalness: 0.72,
      wireframe: renderMode === 'wireframe'
    });
    const shelfMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.5,
      metalness: 0.45,
      wireframe: renderMode === 'wireframe'
    });

    const builtBays = new Set<string>();
    layout.slots.forEach(slot => {
      const bayKey = `${slot.aisle}-${slot.bay}`;
      if (!builtBays.has(bayKey)) {
        builtBays.add(bayKey);
        const postH = layout.tiers * layout.tierHeight + 1.6;
        const postGeo = new THREE.BoxGeometry(0.22, postH, 0.22);
        [-1.55, 1.55].forEach(dx => {
          [-1.7, 1.7].forEach(dz => {
            const post = new THREE.Mesh(postGeo, steel);
            post.position.set(slot.x + dx, postH / 2, slot.z + dz);
            post.castShadow = true;
            rackGroup.add(post);
          });
        });
      }

      const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 3.6), shelfMat);
      shelf.position.set(slot.x, slot.y, slot.z);
      shelf.receiveShadow = true;
      rackGroup.add(shelf);

      const pallet = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.18, 3.0),
        new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.9 })
      );
      pallet.position.set(slot.x, slot.y + 0.16, slot.z);
      pallet.castShadow = true;
      rackGroup.add(pallet);

      const crateH = slot.product && slot.fill > 0 ? 0.35 + 1.85 * slot.fill : 1.4;
      const palette = stockColor(slot.product, renderMode);
      const crateMat = new THREE.MeshStandardMaterial({
        color: palette.color,
        roughness: 0.38,
        metalness: 0.18,
        wireframe: renderMode === 'wireframe' || !slot.product,
        transparent: !slot.product,
        opacity: slot.product ? 1 : 0.28,
        emissive: palette.emissive,
        emissiveIntensity: palette.intensity
      });
      const crate = new THREE.Mesh(new THREE.BoxGeometry(2.45, crateH, 2.7), crateMat);
      crate.position.set(slot.x, slot.y + 0.28 + crateH / 2, slot.z);
      crate.castShadow = Boolean(slot.product);
      crate.userData.bin = slot.bin;
      if (slot.product) binMeshMap.current.set(crate, slot.product);
      else binMeshMap.current.set(crate, { emptyBin: slot.bin });
      rackGroup.add(crate);

      const spriteMap = new THREE.CanvasTexture(makeLabelTexture(slot.bin, slot.product?.sku || 'EMPTY'));
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteMap, transparent: true }));
      sprite.position.set(slot.x, slot.y + crateH + 1.15, slot.z);
      sprite.scale.set(3.2, 1.2, 1);
      rackGroup.add(sprite);
    });

    sphericalRef.current.radius = Math.max(32, layout.floorSize * 0.78);
    updateCameraPosition();
  }, [layout, warehouse, products, renderMode, updateCameraPosition]);

  const handleSetPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    const r = Math.max(32, layout.floorSize * 0.78);
    if (preset === 'perspective') {
      sphericalRef.current = { radius: r, theta: Math.PI / 4.2, phi: Math.PI / 3.2 };
    } else if (preset === 'top') {
      sphericalRef.current = { radius: r + 8, theta: 0.001, phi: 0.02 };
    } else if (preset === 'front') {
      sphericalRef.current = { radius: r - 2, theta: 0, phi: Math.PI / 2.15 };
    } else {
      sphericalRef.current = { radius: r + 2, theta: Math.PI / 4, phi: Math.atan(1 / Math.SQRT2) };
    }
    targetRef.current.set(0, 2.2, 0);
    updateCameraPosition();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMousePos.current.x;
      const deltaY = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
      if (e.buttons === 1) {
        sphericalRef.current.theta -= deltaX * 0.008;
        sphericalRef.current.phi = Math.max(0.06, Math.min(Math.PI / 2 - 0.04, sphericalRef.current.phi - deltaY * 0.008));
      } else if (e.buttons === 2) {
        targetRef.current.x -= deltaX * 0.05;
        targetRef.current.z -= deltaY * 0.05;
      }
      updateCameraPosition();
      return;
    }

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const meshes = Array.from(binMeshMap.current.keys());
    const hit = raycasterRef.current.intersectObjects(meshes, false)[0];
    if (hit) {
      const data = binMeshMap.current.get(hit.object as THREE.Mesh);
      if (data && 'sku' in data) setHoveredBin(data.binLocation);
      else if (data && 'emptyBin' in data) setHoveredBin(data.emptyBin);
    } else {
      setHoveredBin(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    sphericalRef.current.radius = Math.max(14, Math.min(110, sphericalRef.current.radius + e.deltaY * 0.05));
    updateCameraPosition();
  };

  const handleClick = () => {
    if (!cameraRef.current) return;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const hit = raycasterRef.current.intersectObjects(Array.from(binMeshMap.current.keys()), false)[0];
    if (!hit) return;
    const data = binMeshMap.current.get(hit.object as THREE.Mesh);
    if (data && 'sku' in data) {
      setSelectedProduct(data);
      if (selectionOutlineRef.current) {
        selectionOutlineRef.current.position.copy(hit.object.position);
        selectionOutlineRef.current.visible = true;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden border border-slate-200/80 bg-slate-100 transition-all select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[560px] rounded-2xl'
      }`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onContextMenu={e => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none block"
      />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3.5 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-800">{warehouse.name}</span>
              <span className="text-[10px] font-mono text-slate-500">{warehouse.code}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {layout.aisles} aisles · {layout.bays} bays · {layout.tiers} tiers · {layout.slots.length} bins
              {pendingMoves > 0 ? ` · ${pendingMoves} open moves` : ''}
            </div>
          </div>
          {hoveredBin && (
            <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-xs font-mono text-slate-700">
              Bin {hoveredBin}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center p-1 rounded-xl bg-white/90 border border-slate-200">
            {(['shaded', 'wireframe', 'heatmap'] as ViewportRenderMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setRenderMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                  renderMode === mode ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white/90 border border-slate-200 text-slate-600 hover:text-slate-900"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="absolute left-4 top-24 z-20 p-1 rounded-xl bg-white/90 border border-slate-200 flex flex-col gap-1">
        <button
          onClick={() => handleSetPreset('perspective')}
          className={`p-2 rounded-lg ${cameraPreset === 'perspective' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          title="Orbit"
        >
          <Orbit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleSetPreset('top')}
          className={`p-2 rounded-lg ${cameraPreset === 'top' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          title="Plan"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleSetPreset('isometric')}
          className={`p-2 rounded-lg ${cameraPreset === 'isometric' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          title="Isometric"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button onClick={() => handleSetPreset('isometric')} className="p-2 rounded-lg text-slate-500 hover:text-slate-800" title="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-[11px] font-mono text-slate-500 flex items-center gap-3">
        <span className="text-emerald-600">{fps} FPS</span>
        <span>Drag orbit · Scroll zoom</span>
        <span>Fill = stock / capacity</span>
      </div>

      {selectedProduct && (
        <div className="absolute right-4 top-24 w-80 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl p-4 z-30">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                {selectedProduct.sku} · {selectedProduct.binLocation}
              </span>
              <h4 className="text-sm font-semibold text-slate-900 mt-0.5">{selectedProduct.name}</h4>
            </div>
            <button
              onClick={() => {
                setSelectedProduct(null);
                if (selectionOutlineRef.current) selectionOutlineRef.current.visible = false;
              }}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">On hand</div>
              <div className="text-base font-semibold tabular-nums">
                {selectedProduct.currentStock} {selectedProduct.unit}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500">Reorder at</div>
              <div className="text-base font-semibold text-amber-600 tabular-nums">
                {selectedProduct.reorderLevel} {selectedProduct.unit}
              </div>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
            <div
              className={`h-full ${
                selectedProduct.status === 'out_of_stock'
                  ? 'bg-rose-500'
                  : selectedProduct.status === 'low_stock'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (selectedProduct.currentStock / Math.max(selectedProduct.maxCapacity, 1)) * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onOpenReceipt(selectedProduct.id)} className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Receive
            </button>
            <button onClick={() => onOpenDelivery(selectedProduct.id)} className="flex items-center justify-center gap-1.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold">
              <ArrowUpFromLine className="w-3.5 h-3.5" /> Deliver
            </button>
            <button onClick={() => onOpenTransfer(selectedProduct.id)} className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
            </button>
            <button onClick={() => onOpenAdjustment(selectedProduct.id)} className="flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
