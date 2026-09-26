/**
 * StockSense - Modern 3D-Style Role-Based Inventory Management System
 * Built with React, Tailwind CSS, Chart.js, and simulated dynamic REST architecture.
 */

import React, { useState, useEffect } from 'react';
import { User, Product } from './types/inventory';
import { inventoryStore } from './services/inventoryStore';

// Common Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';

// Auth Components
import { LoginPage } from './components/auth/LoginPage';

// Modals for Core Flows
import { CreateProductModal } from './components/modals/CreateProductModal';
import { CreateReceiptModal } from './components/modals/CreateReceiptModal';
import { CreateDeliveryModal } from './components/modals/CreateDeliveryModal';
import { CreateTransferModal } from './components/modals/CreateTransferModal';
import { CreateAdjustmentModal } from './components/modals/CreateAdjustmentModal';

// Views
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { WarehouseDashboard } from './components/dashboard/WarehouseDashboard';
import { ProductCatalog } from './components/products/ProductCatalog';
import { OperationsView } from './components/operations/OperationsView';
import { StockLedgerView } from './components/ledger/StockLedgerView';
import { WarehouseView } from './components/warehouses/WarehouseView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { SpatialStudioView } from './components/spatial/SpatialStudioView';
import { AdminView } from './components/admin/AdminView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(inventoryStore.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const user = inventoryStore.getCurrentUser();
    if (user?.role === 'admin') return 'admin_users';
    return user?.role === 'staff' ? 'staff_dashboard' : 'manager_dashboard';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptDefaultProdId, setReceiptDefaultProdId] = useState<string | undefined>(undefined);

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryDefaultProdId, setDeliveryDefaultProdId] = useState<string | undefined>(undefined);

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferDefaultProdId, setTransferDefaultProdId] = useState<string | undefined>(undefined);

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentDefaultProdId, setAdjustmentDefaultProdId] = useState<string | undefined>(undefined);

  // Listen to store updates
  useEffect(() => {
    const unsubscribe = inventoryStore.subscribe(() => {
      const user = inventoryStore.getCurrentUser();
      // Force sign-out if this account was deactivated by an admin
      if (user && user.isActive === false) {
        inventoryStore.logout();
        return;
      }
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Sync tab if user role changes
  useEffect(() => {
    if (currentUser?.role === 'staff') {
      if (activeTab !== 'spatial_studio' && !activeTab.startsWith('staff_')) {
        setActiveTab('staff_dashboard');
      }
    } else if (currentUser?.role === 'manager') {
      if (activeTab.startsWith('staff_') || activeTab === 'admin_users') {
        setActiveTab('manager_dashboard');
      }
    } else if (currentUser?.role === 'admin') {
      if (activeTab.startsWith('staff_')) {
        setActiveTab('admin_users');
      }
    }
  }, [currentUser?.role]);

  // Modal opener helpers
  const handleOpenReceiptModal = (prodId?: string) => {
    setReceiptDefaultProdId(prodId);
    setReceiptModalOpen(true);
  };

  const handleOpenDeliveryModal = (prodId?: string) => {
    setDeliveryDefaultProdId(prodId);
    setDeliveryModalOpen(true);
  };

  const handleOpenTransferModal = (prodId?: string) => {
    setTransferDefaultProdId(prodId);
    setTransferModalOpen(true);
  };

  const handleOpenAdjustmentModal = (prodId?: string) => {
    setAdjustmentDefaultProdId(prodId);
    setAdjustmentModalOpen(true);
  };

  const handleOpenCreateProduct = () => {
    setProductToEdit(null);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setProductModalOpen(true);
  };

  const handleQuickModal = (type: 'receipt' | 'delivery' | 'transfer' | 'adjustment') => {
    if (type === 'receipt') handleOpenReceiptModal();
    if (type === 'delivery') handleOpenDeliveryModal();
    if (type === 'transfer') handleOpenTransferModal();
    if (type === 'adjustment') handleOpenAdjustmentModal();
  };

  return (
    <div className="h-screen bg-[#eef1f6] text-slate-800 flex flex-col font-sans overflow-hidden selection:bg-indigo-200 selection:text-indigo-900">
      {!currentUser ? (
        <LoginPage onAuthSuccess={(user) => {
          if (user.role === 'admin') setActiveTab('admin_users');
          else if (user.role === 'manager') setActiveTab('manager_dashboard');
          else setActiveTab('staff_dashboard');
        }} />
      ) : (
        <>
          <Header
            currentUser={currentUser}
            activeTab={activeTab}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickModal={handleQuickModal}
            onSkuSearch={(q) => {
              setCatalogSearch(q);
              setActiveTab('products');
            }}
          />

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <Sidebar
              currentUser={currentUser}
              activeTab={activeTab}
              onNavigate={(tab) => setActiveTab(tab)}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main className="flex-1 overflow-y-auto">
              <div className="px-4 md:px-7 py-5 lg:px-8 max-w-[1600px] mx-auto w-full">
              {/* ================= DEDICATED 3D SPATIAL STUDIO ================= */}
              {activeTab === 'spatial_studio' && (
                <SpatialStudioView
                  currentUser={currentUser}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenDelivery={handleOpenDeliveryModal}
                  onOpenTransfer={handleOpenTransferModal}
                  onOpenAdjustment={handleOpenAdjustmentModal}
                />
              )}

              {/* ================= MANAGER VIEWS ================= */}
              {activeTab === 'manager_dashboard' && (
                <ManagerDashboard
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenProductModal={handleOpenCreateProduct}
                />
              )}

              {activeTab === 'products' && (
                <ProductCatalog
                  currentUser={currentUser}
                  initialSearch={catalogSearch}
                  onOpenCreateProduct={handleOpenCreateProduct}
                  onOpenEditProduct={handleOpenEditProduct}
                  onOpenReceipt={handleOpenReceiptModal}
                  onOpenDelivery={handleOpenDeliveryModal}
                  onOpenAdjustment={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'operations' && (
                <OperationsView
                  currentUser={currentUser}
                  defaultSubTab="receipts"
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenTransferModal={handleOpenTransferModal}
                  onOpenAdjustmentModal={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'ledger' && <StockLedgerView />}

              {activeTab === 'warehouses' && <WarehouseView currentUser={currentUser} />}

              {activeTab === 'analytics' && <AnalyticsView />}

              {activeTab === 'settings' && <SettingsView currentUser={currentUser} />}

              {/* ================= ADMIN VIEWS ================= */}
              {activeTab === 'admin_users' && <AdminView currentUser={currentUser} />}

              {/* ================= WAREHOUSE STAFF VIEWS ================= */}
              {activeTab === 'staff_dashboard' && (
                <WarehouseDashboard
                  currentUser={currentUser}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenTransferModal={handleOpenTransferModal}
                  onOpenAdjustmentModal={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'staff_receipts' && (
                <OperationsView
                  currentUser={currentUser}
                  defaultSubTab="receipts"
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenTransferModal={handleOpenTransferModal}
                  onOpenAdjustmentModal={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'staff_deliveries' && (
                <OperationsView
                  currentUser={currentUser}
                  defaultSubTab="deliveries"
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenTransferModal={handleOpenTransferModal}
                  onOpenAdjustmentModal={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'staff_transfers' && (
                <OperationsView
                  currentUser={currentUser}
                  defaultSubTab="transfers"
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenTransferModal={handleOpenTransferModal}
                  onOpenAdjustmentModal={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'staff_counting' && (
                <OperationsView
                  currentUser={currentUser}
                  defaultSubTab="adjustments"
                  onOpenReceiptModal={handleOpenReceiptModal}
                  onOpenDeliveryModal={handleOpenDeliveryModal}
                  onOpenTransferModal={handleOpenTransferModal}
                  onOpenAdjustmentModal={handleOpenAdjustmentModal}
                />
              )}

              {activeTab === 'staff_history' && <StockLedgerView />}
              </div>
            </main>
          </div>

          {/* Global Interactive Modals */}
          <CreateProductModal
            isOpen={productModalOpen}
            onClose={() => setProductModalOpen(false)}
            productToEdit={productToEdit}
          />

          <CreateReceiptModal
            isOpen={receiptModalOpen}
            onClose={() => setReceiptModalOpen(false)}
            defaultProductId={receiptDefaultProdId}
          />

          <CreateDeliveryModal
            isOpen={deliveryModalOpen}
            onClose={() => setDeliveryModalOpen(false)}
            defaultProductId={deliveryDefaultProdId}
          />

          <CreateTransferModal
            isOpen={transferModalOpen}
            onClose={() => setTransferModalOpen(false)}
            defaultProductId={transferDefaultProdId}
          />

          <CreateAdjustmentModal
            isOpen={adjustmentModalOpen}
            onClose={() => setAdjustmentModalOpen(false)}
            defaultProductId={adjustmentDefaultProdId}
          />

          {/* Toast Notification Layer */}
          <ToastContainer />
        </>
      )}
    </div>
  );
}
