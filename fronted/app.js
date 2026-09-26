// ==========================================================================
// StockSense IMS - Frontend Application Logic
// ==========================================================================

const API_BASE = "";

// Global In-Memory State
let currentUser = null;
let cachedCategories = [];
let cachedWarehouses = [];
let cachedLocations = [];
let cachedProducts = [];

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  setupNavigation();
  setupFilters();
  setupFormSubmissions();
  setupMobileDrawer();
});

// --------------------------------------------------------------------------
// AUTHENTICATION & SESSION
// --------------------------------------------------------------------------
function initAuth() {
  const savedUser = localStorage.getItem("stocksense_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      displayApp();
      return;
    } catch (e) {
      localStorage.removeItem("stocksense_user");
    }
  }
  displayAuth();
}

function displayAuth() {
  document.getElementById("authContainer").classList.remove("hidden");
  document.getElementById("appContainer").classList.add("hidden");
}

function displayApp() {
  document.getElementById("authContainer").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");

  // Update profile in sidebar
  if (currentUser) {
    document.getElementById("currentUserName").textContent = currentUser.name;
    document.getElementById("currentUserRole").textContent = 
      currentUser.role === "inventory_manager" ? "Inventory Manager" : "Warehouse Staff";
    
    const initials = currentUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("userAvatar").textContent = initials || "SS";
  }

  // Initial Data Bootstrap
  loadCommonData().then(() => {
    switchView("dashboard");
  });
}

function fillLogin(email, pwd) {
  document.getElementById("loginEmail").value = email;
  document.getElementById("loginPassword").value = pwd;
}

// Auth Tabs
document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));

    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    if (target === "login") document.getElementById("loginForm").classList.add("active");
    if (target === "register") document.getElementById("registerForm").classList.add("active");
    if (target === "forgot") document.getElementById("forgotForm").classList.add("active");
  });
});

document.getElementById("forgotLink").addEventListener("click", () => {
  document.querySelector('.auth-tab[data-tab="forgot"]').click();
});

// Login Form Submit
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    currentUser = data.user;
    localStorage.setItem("stocksense_user", JSON.stringify(currentUser));
    showToast(`Welcome back, ${currentUser.name}!`, "success");
    displayApp();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Register Form Submit
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const role = document.getElementById("regRole").value;
  const password = document.getElementById("regPassword").value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    currentUser = data.user;
    localStorage.setItem("stocksense_user", JSON.stringify(currentUser));
    showToast("Account created successfully!", "success");
    displayApp();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// OTP Password Reset Flow
document.getElementById("sendOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("otpEmail").value.trim();
  if (!email) {
    showToast("Please enter your email", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate OTP");

    document.getElementById("otpStep1").classList.add("hidden");
    document.getElementById("otpStep2").classList.remove("hidden");

    // Display generated OTP for demo convenience
    if (data.otp) {
      document.getElementById("otpAlertBanner").textContent = 
        `OTP Verification Code generated: ${data.otp} (Valid for 15 mins)`;
      document.getElementById("otpInput").value = data.otp;
    }
    showToast(data.message, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("otpEmail").value.trim();
  const otp_code = document.getElementById("otpInput").value.trim();
  const new_password = document.getElementById("newPassword").value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp_code, new_password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password reset failed");

    showToast("Password updated! Please sign in with your new password.", "success");
    document.querySelector('.auth-tab[data-tab="login"]').click();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("stocksense_user");
  currentUser = null;
  displayAuth();
  showToast("You have been signed out.", "info");
});

// --------------------------------------------------------------------------
// NAVIGATION & VIEWS
// --------------------------------------------------------------------------
function setupNavigation() {
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const view = item.getAttribute("data-view");
      if (view) switchView(view);
    });
  });
}

function switchView(viewName) {
  // Update nav active state
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewName);
  });

  // Switch view containers
  document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active"));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.add("active");

  // Update Breadcrumb
  const titles = {
    dashboard: "Dashboard Overview",
    products: "Products & Stock Availability",
    categories: "Product Categories",
    receipts: "Receipts (Incoming Goods)",
    deliveries: "Delivery Orders (Outgoing)",
    transfers: "Internal Stock Transfers",
    adjustments: "Inventory Adjustments",
    ledger: "Move History (Stock Ledger)",
    settings: "Warehouses & Locations"
  };
  document.getElementById("pageTitle").textContent = titles[viewName] || "Dashboard";

  // Close mobile sidebar if open
  document.getElementById("sidebar").classList.remove("open");

  // Load view-specific data
  if (viewName === "dashboard") loadDashboard();
  if (viewName === "products") loadProducts();
  if (viewName === "categories") loadCategories();
  if (viewName === "receipts") loadReceipts();
  if (viewName === "deliveries") loadDeliveries();
  if (viewName === "transfers") loadTransfers();
  if (viewName === "adjustments") loadAdjustments();
  if (viewName === "ledger") loadLedger();
  if (viewName === "settings") { loadWarehouses(); loadLocations(); }
}

function setupMobileDrawer() {
  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
}

// --------------------------------------------------------------------------
// COMMON DATA BOOTSTRAP
// --------------------------------------------------------------------------
async function loadCommonData() {
  try {
    const [catsRes, whsRes, locsRes, prodsRes] = await Promise.all([
      fetch(`${API_BASE}/api/categories`),
      fetch(`${API_BASE}/api/warehouses`),
      fetch(`${API_BASE}/api/locations`),
      fetch(`${API_BASE}/api/products`)
    ]);

    cachedCategories = await catsRes.json();
    cachedWarehouses = await whsRes.json();
    cachedLocations = await locsRes.json();
    cachedProducts = await prodsRes.json();

    populateDropdowns();
  } catch (err) {
    console.error("Failed to load initial metadata", err);
  }
}

function populateDropdowns() {
  // Filter Dropdowns
  const whFilter = document.getElementById("filterWarehouse");
  if (whFilter) {
    whFilter.innerHTML = '<option value="">All Warehouses</option>' +
      cachedWarehouses.map(w => `<option value="${w.id}">${w.name} (${w.code})</option>`).join("");
  }

  const catFilter = document.getElementById("filterCategory");
  const prodCatFilter = document.getElementById("prodCategoryFilter");
  const prodCatSelect = document.getElementById("prodCatSelect");

  const catOptions = cachedCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  if (catFilter) catFilter.innerHTML = '<option value="">All Categories</option>' + catOptions;
  if (prodCatFilter) prodCatFilter.innerHTML = '<option value="">All Categories</option>' + catOptions;
  if (prodCatSelect) prodCatSelect.innerHTML = catOptions;

  // Locations Dropdowns
  const locOptions = cachedLocations.map(l => 
    `<option value="${l.id}">${l.warehouse_code} / ${l.name} (${l.code})</option>`
  ).join("");

  const prodInitLoc = document.getElementById("prodInitLoc");
  const recLocation = document.getElementById("recLocation");
  const delSourceLoc = document.getElementById("delSourceLocation");
  const transSourceLoc = document.getElementById("transSourceLoc");
  const transDestLoc = document.getElementById("transDestLoc");
  const adjLocation = document.getElementById("adjLocationSelect");
  const locWhSelect = document.getElementById("locWhSelect");

  if (prodInitLoc) prodInitLoc.innerHTML = '<option value="">Select Staging Location</option>' + locOptions;
  if (recLocation) recLocation.innerHTML = locOptions;
  if (delSourceLoc) delSourceLoc.innerHTML = locOptions;
  if (transSourceLoc) transSourceLoc.innerHTML = locOptions;
  if (transDestLoc) transDestLoc.innerHTML = locOptions;
  if (adjLocation) adjLocation.innerHTML = locOptions;

  // Warehouse select for new location modal
  if (locWhSelect) {
    locWhSelect.innerHTML = cachedWarehouses.map(w => `<option value="${w.id}">${w.name} (${w.code})</option>`).join("");
  }

  // Product select for adjustment
  const adjProdSelect = document.getElementById("adjProductSelect");
  if (adjProdSelect) {
    adjProdSelect.innerHTML = cachedProducts.map(p => 
      `<option value="${p.id}">${p.sku} - ${p.name} (${p.uom})</option>`
    ).join("");
  }
}

// --------------------------------------------------------------------------
// DASHBOARD LOGIC & DYNAMIC FILTERS
// --------------------------------------------------------------------------
async function loadDashboard() {
  try {
    // 1. Fetch KPIs
    const kpiRes = await fetch(`${API_BASE}/api/dashboard/kpis`);
    const kpiData = await kpiRes.json();

    document.getElementById("kpiTotalProducts").textContent = kpiData.total_products;
    document.getElementById("kpiTotalUnits").textContent = `${kpiData.total_units_in_stock.toLocaleString()} units total`;
    document.getElementById("kpiLowStock").textContent = kpiData.low_stock_count;
    document.getElementById("kpiPendingReceipts").textContent = kpiData.pending_receipts;
    document.getElementById("kpiPendingDeliveries").textContent = kpiData.pending_deliveries;
    document.getElementById("kpiInternalTransfers").textContent = kpiData.internal_transfers_scheduled;

    // Badges
    document.getElementById("productCountBadge").textContent = kpiData.total_products;
    document.getElementById("receiptBadge").textContent = kpiData.pending_receipts;
    document.getElementById("deliveryBadge").textContent = kpiData.pending_deliveries;

    // Low stock warning banner
    const banner = document.getElementById("lowStockAlertBanner");
    if (kpiData.low_stock_count > 0) {
      banner.classList.remove("hidden");
      const lowNames = kpiData.low_stock_items.slice(0, 3).map(i => `${i.name} (${i.current_stock}/${i.min_stock} ${i.uom})`).join(", ");
      document.getElementById("lowStockAlertText").textContent = 
        `${kpiData.low_stock_count} item(s) below reorder threshold: ${lowNames}${kpiData.low_stock_count > 3 ? '...' : ''}`;
    } else {
      banner.classList.add("hidden");
    }

    // 2. Fetch Operations Feed with dynamic filters
    loadDashboardOperations();
  } catch (err) {
    console.error("Dashboard load failed", err);
  }
}

async function loadDashboardOperations() {
  const docType = document.getElementById("filterDocType").value;
  const status = document.getElementById("filterStatus").value;
  const whId = document.getElementById("filterWarehouse").value;
  const catId = document.getElementById("filterCategory").value;
  const search = document.getElementById("filterSearch").value.trim();

  const params = new URLSearchParams();
  if (docType) params.append("doc_type", docType);
  if (status) params.append("status", status);
  if (whId) params.append("warehouse_id", whId);
  if (catId) params.append("category_id", catId);
  if (search) params.append("search", search);

  const tbody = document.getElementById("dashboardOpsBody");
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Filtering operational flow...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/dashboard/operations?${params.toString()}`);
    const ops = await res.json();

    if (ops.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No operations matching the selected filters.</td></tr>';
      return;
    }

    tbody.innerHTML = ops.map(op => {
      const typeBadge = getTypeBadge(op.type);
      const statusBadge = getStatusBadge(op.status);

      const itemsSummary = (op.items || []).map(i => 
        `<strong>${i.product_name}</strong>: ${i.quantity > 0 ? '+' : ''}${i.quantity} ${i.uom}`
      ).join("<br>");

      const partnerDetail = op.partner_name || op.notes || "—";
      const route = op.type === "RECEIPT" ? `&rarr; ${op.dest_location_name || 'Dest'}` :
                    op.type === "DELIVERY" ? `${op.source_location_name || 'Source'} &rarr; Client` :
                    op.type === "INTERNAL" ? `${op.source_location_name} &rarr; ${op.dest_location_name}` :
                    `At ${op.source_location_name || 'Loc'}`;

      let actionBtn = "";
      if (op.status !== "Done" && op.status !== "Canceled") {
        if (op.type === "RECEIPT") {
          actionBtn = `<button class="btn btn-xs btn-success" onclick="validateReceipt(${op.id})">Validate & Inward</button>`;
        } else if (op.type === "DELIVERY") {
          actionBtn = `<button class="btn btn-xs btn-primary" onclick="validateDelivery(${op.id})">Validate & Ship</button>`;
        } else if (op.type === "INTERNAL") {
          actionBtn = `<button class="btn btn-xs btn-primary" onclick="validateTransfer(${op.id})">Execute Transfer</button>`;
        }
      }

      return `
        <tr>
          <td><span class="code-badge">${op.ref_number}</span></td>
          <td>${typeBadge}</td>
          <td>${partnerDetail}</td>
          <td><span class="text-muted">${route}</span></td>
          <td><small>${itemsSummary || '—'}</small></td>
          <td>${statusBadge}</td>
          <td><small>${op.created_at.slice(0, 16)}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose py-4">Error loading operations: ${err.message}</td></tr>`;
  }
}

function setupFilters() {
  ["filterDocType", "filterStatus", "filterWarehouse", "filterCategory"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", loadDashboardOperations);
  });

  const searchInput = document.getElementById("filterSearch");
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener("input", () => {
      clearTimeout(timeout);
      timeout = setTimeout(loadDashboardOperations, 300);
    });
  }

  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("filterDocType").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterWarehouse").value = "";
    document.getElementById("filterCategory").value = "";
    document.getElementById("filterSearch").value = "";
    loadDashboardOperations();
  });
}

// --------------------------------------------------------------------------
// PRODUCTS VIEW
// --------------------------------------------------------------------------
async function loadProducts() {
  const search = document.getElementById("prodSearchInput").value.trim();
  const catId = document.getElementById("prodCategoryFilter").value;
  const statusFilter = document.getElementById("prodStockFilter").value;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (catId) params.append("category_id", catId);
  if (statusFilter) params.append("status", statusFilter);

  const tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">Loading catalog...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
    const prods = await res.json();
    cachedProducts = prods;

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = prods.map(p => {
      let statusBadge = "";
      if (p.stock_status === "In Stock") {
        statusBadge = '<span class="badge badge-instock">In Stock</span>';
      } else if (p.stock_status === "Low Stock") {
        statusBadge = '<span class="badge badge-lowstock">Low Stock (Alert)</span>';
      } else {
        statusBadge = '<span class="badge badge-outofstock">Out of Stock</span>';
      }

      const locBreakdown = (p.locations || []).map(l => 
        `<span class="loc-pill" title="${l.warehouse_name}">${l.location_name}: <strong>${l.quantity}</strong></span>`
      ).join("") || '<span class="text-muted"><small>None Staged</small></span>';

      return `
        <tr>
          <td><span class="code-badge">${p.sku}</span></td>
          <td>
            <strong>${p.name}</strong>
            ${p.description ? `<br><small class="text-muted">${p.description}</small>` : ''}
          </td>
          <td>${p.category_name || '<span class="text-muted">Uncategorized</span>'}</td>
          <td>${p.uom}</td>
          <td><strong style="font-size: 1.05rem;">${p.total_stock} ${p.uom}</strong></td>
          <td>
            <small>Min: <strong>${p.min_stock}</strong> / Max: <strong>${p.max_stock}</strong></small>
          </td>
          <td>${locBreakdown}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-outline btn-xs" onclick="quickAdjustProduct(${p.id}, '${p.sku}', '${p.name}')">Adjust Stock</button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

let prodSearchTimeout = null;
function debounceProductSearch() {
  clearTimeout(prodSearchTimeout);
  prodSearchTimeout = setTimeout(loadProducts, 300);
}

function filterProducts(stockStatus) {
  switchView("products");
  document.getElementById("prodStockFilter").value = stockStatus;
  loadProducts();
}

// --------------------------------------------------------------------------
// CATEGORIES VIEW
// --------------------------------------------------------------------------
async function loadCategories() {
  const tbody = document.getElementById("categoriesTableBody");
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading categories...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    const cats = await res.json();
    cachedCategories = cats;

    tbody.innerHTML = cats.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.description || '—'}</td>
        <td><span class="badge badge-draft">${c.product_count} Products</span></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

// --------------------------------------------------------------------------
// RECEIPTS (INCOMING GOODS)
// --------------------------------------------------------------------------
async function loadReceipts() {
  const tbody = document.getElementById("receiptsTableBody");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading receipts...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/receipts`);
    const receipts = await res.json();

    if (receipts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No receipts recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = receipts.map(r => {
      const itemsList = (r.items || []).map(i => 
        `<strong>${i.product_name}</strong>: +${i.quantity} ${i.uom}`
      ).join("<br>");

      let actionBtn = "";
      if (r.status !== "Done" && r.status !== "Canceled") {
        actionBtn = `<button class="btn btn-xs btn-success" onclick="validateReceipt(${r.id})">Validate & Inward</button>`;
      }

      return `
        <tr>
          <td><span class="code-badge">${r.ref_number}</span></td>
          <td><strong>${r.partner_name}</strong></td>
          <td>${r.dest_location_name || 'Main Staging'}</td>
          <td><small>${itemsList}</small></td>
          <td>${getStatusBadge(r.status)}</td>
          <td><small>${r.created_at.slice(0, 16)}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

async function validateReceipt(receiptId) {
  try {
    const res = await fetch(`${API_BASE}/api/receipts/${receiptId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: currentUser ? currentUser.name : "Inventory Manager" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to validate receipt");

    showToast(data.message, "success");
    loadReceipts();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Dynamic item rows in Receipt modal
function addReceiptItemRow(productId = "", quantity = 1) {
  const container = document.getElementById("receiptItemsContainer");
  const row = document.createElement("div");
  row.className = "item-row";

  const prodOpts = cachedProducts.map(p => 
    `<option value="${p.id}" ${p.id == productId ? 'selected' : ''}>${p.sku} - ${p.name} (${p.uom})</option>`
  ).join("");

  row.innerHTML = `
    <select class="form-select flex-1 rec-prod-id" required>${prodOpts}</select>
    <input type="number" class="rec-qty" min="0.1" step="any" style="width: 110px;" value="${quantity}" placeholder="Qty" required />
    <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(row);
}

// --------------------------------------------------------------------------
// DELIVERY ORDERS (OUTGOING GOODS)
// --------------------------------------------------------------------------
async function loadDeliveries() {
  const tbody = document.getElementById("deliveriesTableBody");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading deliveries...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/deliveries`);
    const deliveries = await res.json();

    if (deliveries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No delivery orders yet.</td></tr>';
      return;
    }

    tbody.innerHTML = deliveries.map(d => {
      const itemsList = (d.items || []).map(i => 
        `<strong>${i.product_name}</strong>: -${i.quantity} ${i.uom}`
      ).join("<br>");

      let actionBtn = "";
      if (d.status === "Waiting") {
        actionBtn = `<button class="btn btn-xs btn-outline" onclick="updateDeliveryStatus(${d.id}, 'Ready')">Mark Ready (Pick/Pack)</button>`;
      } else if (d.status === "Ready") {
        actionBtn = `<button class="btn btn-xs btn-primary" onclick="validateDelivery(${d.id})">Validate & Ship</button>`;
      }

      return `
        <tr>
          <td><span class="code-badge">${d.ref_number}</span></td>
          <td><strong>${d.partner_name}</strong></td>
          <td>${d.source_location_name || 'Main Staging'}</td>
          <td><small>${itemsList}</small></td>
          <td>${getStatusBadge(d.status)}</td>
          <td><small>${d.created_at.slice(0, 16)}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

async function updateDeliveryStatus(deliveryId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(data.message, "success");
    loadDeliveries();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function validateDelivery(deliveryId) {
  try {
    const res = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: currentUser ? currentUser.name : "Inventory Manager" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to dispatch delivery");

    showToast(data.message, "success");
    loadDeliveries();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function addDeliveryItemRow() {
  const container = document.getElementById("deliveryItemsContainer");
  const row = document.createElement("div");
  row.className = "item-row";

  const prodOpts = cachedProducts.map(p => 
    `<option value="${p.id}">${p.sku} - ${p.name} (${p.uom})</option>`
  ).join("");

  row.innerHTML = `
    <select class="form-select flex-1 del-prod-id" required>${prodOpts}</select>
    <input type="number" class="del-qty" min="0.1" step="any" style="width: 110px;" value="1" placeholder="Qty" required />
    <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(row);
}

// --------------------------------------------------------------------------
// INTERNAL TRANSFERS
// --------------------------------------------------------------------------
async function loadTransfers() {
  const tbody = document.getElementById("transfersTableBody");
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading transfers...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/transfers`);
    const transfers = await res.json();

    if (transfers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No internal transfers scheduled.</td></tr>';
      return;
    }

    tbody.innerHTML = transfers.map(t => {
      const itemsList = (t.items || []).map(i => 
        `<strong>${i.product_name}</strong>: ${i.quantity} ${i.uom}`
      ).join("<br>");

      let actionBtn = "";
      if (t.status !== "Done" && t.status !== "Canceled") {
        actionBtn = `<button class="btn btn-xs btn-primary" onclick="validateTransfer(${t.id})">Execute Transfer</button>`;
      }

      return `
        <tr>
          <td><span class="code-badge">${t.ref_number}</span></td>
          <td>${t.source_location_name}</td>
          <td>${t.dest_location_name}</td>
          <td><small>${itemsList}</small></td>
          <td>${getStatusBadge(t.status)}</td>
          <td><small>${t.created_at.slice(0, 16)}</small></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

async function validateTransfer(transferId) {
  try {
    const res = await fetch(`${API_BASE}/api/transfers/${transferId}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: currentUser ? currentUser.name : "Warehouse Staff" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to execute transfer");

    showToast(data.message, "success");
    loadTransfers();
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function addTransferItemRow() {
  const container = document.getElementById("transferItemsContainer");
  const row = document.createElement("div");
  row.className = "item-row";

  const prodOpts = cachedProducts.map(p => 
    `<option value="${p.id}">${p.sku} - ${p.name} (${p.uom})</option>`
  ).join("");

  row.innerHTML = `
    <select class="form-select flex-1 trans-prod-id" required>${prodOpts}</select>
    <input type="number" class="trans-qty" min="0.1" step="any" style="width: 110px;" value="1" placeholder="Qty" required />
    <button type="button" class="remove-row-btn" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(row);
}

// --------------------------------------------------------------------------
// INVENTORY ADJUSTMENTS
// --------------------------------------------------------------------------
async function loadAdjustments() {
  const tbody = document.getElementById("adjustmentsTableBody");
  tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Loading adjustments...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/adjustments`);
    const adjustments = await res.json();

    if (adjustments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No stock adjustments on record.</td></tr>';
      return;
    }

    tbody.innerHTML = adjustments.map(a => {
      const item = (a.items && a.items[0]) || {};
      const diff = item.quantity || 0;
      const diffClass = diff >= 0 ? "text-emerald" : "text-rose";
      const diffFormatted = diff >= 0 ? `+${diff}` : `${diff}`;

      return `
        <tr>
          <td><span class="code-badge">${a.ref_number}</span></td>
          <td>${a.location_name || '—'}</td>
          <td><strong>${item.product_name || '—'}</strong> (${item.sku || '—'})</td>
          <td>${item.recorded_quantity != null ? item.recorded_quantity : '—'}</td>
          <td><strong>${item.counted_quantity != null ? item.counted_quantity : '—'}</strong></td>
          <td><strong class="${diffClass}">${diffFormatted} ${item.uom || ''}</strong></td>
          <td>${a.notes || 'Physical Count'}</td>
          <td><small>${a.created_at.slice(0, 16)}</small></td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

function quickAdjustProduct(prodId, sku, name) {
  openModal("adjustmentModal");
  const prodSelect = document.getElementById("adjProductSelect");
  if (prodSelect) {
    prodSelect.value = prodId;
    onAdjustmentLocationOrProductChange();
  }
}

function onAdjustmentLocationOrProductChange() {
  const locId = document.getElementById("adjLocationSelect").value;
  const prodId = document.getElementById("adjProductSelect").value;

  if (!locId || !prodId) return;

  const prod = cachedProducts.find(p => p.id == prodId);
  if (!prod) return;

  const locMatch = (prod.locations || []).find(l => {
    const matchLoc = cachedLocations.find(cl => cl.id == locId);
    return matchLoc && l.location_code === matchLoc.code;
  });

  const recorded = locMatch ? locMatch.quantity : 0;
  document.getElementById("adjRecordedQtyDisplay").textContent = `${recorded} ${prod.uom}`;
  document.getElementById("adjRecordedQtyDisplay").dataset.qty = recorded;

  calculateAdjustmentDiff();
}

function calculateAdjustmentDiff() {
  const recorded = parseFloat(document.getElementById("adjRecordedQtyDisplay").dataset.qty || 0);
  const counted = parseFloat(document.getElementById("adjCountedQty").value || 0);
  const diff = counted - recorded;

  const diffEl = document.getElementById("adjDiffDisplay");
  diffEl.textContent = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`;
  diffEl.className = "recon-diff " + (diff > 0 ? "text-emerald" : diff < 0 ? "text-rose" : "text-muted");
}

// --------------------------------------------------------------------------
// MOVE HISTORY (STOCK LEDGER)
// --------------------------------------------------------------------------
async function loadLedger() {
  const search = document.getElementById("ledgerSearchInput").value.trim();
  const typeFilter = document.getElementById("ledgerTypeFilter").value;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (typeFilter) params.append("operation_type", typeFilter);

  const tbody = document.getElementById("ledgerTableBody");
  tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Querying ledger...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/ledger?${params.toString()}`);
    const moves = await res.json();

    if (moves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">No stock movements found.</td></tr>';
      return;
    }

    tbody.innerHTML = moves.map(m => {
      const typeBadge = getTypeBadge(m.operation_type);
      const qtyClass = m.quantity > 0 ? "text-emerald" : m.quantity < 0 ? "text-rose" : "";
      const qtyFormatted = `${m.quantity > 0 ? '+' : ''}${m.quantity} ${m.uom}`;

      return `
        <tr>
          <td><small class="text-muted">${m.timestamp.slice(0, 16)}</small></td>
          <td><span class="code-badge">${m.ref_number}</span></td>
          <td>${typeBadge}</td>
          <td><strong>${m.product_name}</strong> <small class="text-muted">(${m.sku})</small></td>
          <td>${m.source_location_name || '<span class="text-muted">—</span>'}</td>
          <td>${m.dest_location_name || '<span class="text-muted">—</span>'}</td>
          <td><strong class="${qtyClass}">${qtyFormatted}</strong></td>
          <td><strong>${m.balance_after != null ? m.balance_after + ' ' + m.uom : '—'}</strong></td>
          <td><small>${m.user_name || 'System'}</small></td>
          <td><small class="text-muted">${m.notes || '—'}</small></td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

let ledgerSearchTimeout = null;
function debounceLedgerSearch() {
  clearTimeout(ledgerSearchTimeout);
  ledgerSearchTimeout = setTimeout(loadLedger, 300);
}

// --------------------------------------------------------------------------
// SETTINGS (WAREHOUSES & LOCATIONS)
// --------------------------------------------------------------------------
async function loadWarehouses() {
  const tbody = document.getElementById("warehousesTableBody");
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading warehouses...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/warehouses`);
    const whs = await res.json();
    cachedWarehouses = whs;

    tbody.innerHTML = whs.map(w => `
      <tr>
        <td><span class="code-badge">${w.code}</span></td>
        <td><strong>${w.name}</strong></td>
        <td>${w.address || '—'}</td>
        <td><span class="badge badge-draft">${w.location_count} Locations</span></td>
        <td><span class="badge badge-done">Active</span></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

async function loadLocations() {
  const tbody = document.getElementById("locationsTableBody");
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading locations...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/locations`);
    const locs = await res.json();
    cachedLocations = locs;

    tbody.innerHTML = locs.map(l => `
      <tr>
        <td><span class="code-badge">${l.code}</span></td>
        <td><strong>${l.name}</strong></td>
        <td>${l.warehouse_name} (${l.warehouse_code})</td>
        <td><span class="badge badge-draft">${l.type}</span></td>
        <td>${l.items_stored} SKUs</td>
        <td><strong>${l.total_units} units</strong></td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-rose py-4">${err.message}</td></tr>`;
  }
}

// --------------------------------------------------------------------------
// FORM SUBMISSIONS & MODALS
// --------------------------------------------------------------------------
function setupFormSubmissions() {
  // 1. Create Product
  document.getElementById("createProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("prodName").value.trim(),
      sku: document.getElementById("prodSku").value.trim().toUpperCase(),
      category_id: document.getElementById("prodCatSelect").value || null,
      uom: document.getElementById("prodUom").value,
      min_stock: parseFloat(document.getElementById("prodMinStock").value),
      max_stock: parseFloat(document.getElementById("prodMaxStock").value),
      initial_stock: parseFloat(document.getElementById("prodInitQty").value || 0),
      initial_location_id: document.getElementById("prodInitLoc").value || null,
      description: document.getElementById("prodDesc").value.trim(),
      user_name: currentUser ? currentUser.name : "Inventory Manager"
    };

    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Product created successfully!", "success");
      closeModal("newProductModal");
      document.getElementById("createProductForm").reset();
      loadCommonData().then(() => {
        loadProducts();
        loadDashboard();
      });
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 2. Create Receipt
  document.getElementById("createReceiptForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rows = document.querySelectorAll("#receiptItemsContainer .item-row");
    const items = [];
    rows.forEach(r => {
      const pid = r.querySelector(".rec-prod-id").value;
      const qty = parseFloat(r.querySelector(".rec-qty").value);
      if (pid && qty > 0) items.push({ product_id: parseInt(pid), quantity: qty });
    });

    if (items.length === 0) {
      showToast("Please add at least one product with quantity", "error");
      return;
    }

    const payload = {
      supplier: document.getElementById("recSupplier").value.trim(),
      dest_location_id: parseInt(document.getElementById("recLocation").value),
      items: items,
      notes: document.getElementById("recNotes").value.trim(),
      auto_validate: document.getElementById("recAutoValidate").checked,
      user_name: currentUser ? currentUser.name : "Inventory Manager"
    };

    try {
      const res = await fetch(`${API_BASE}/api/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Receipt ${data.ref_number} created!`, "success");
      closeModal("newReceiptModal");
      document.getElementById("createReceiptForm").reset();
      loadReceipts();
      loadDashboard();
      loadCommonData();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 3. Create Delivery Order
  document.getElementById("createDeliveryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rows = document.querySelectorAll("#deliveryItemsContainer .item-row");
    const items = [];
    rows.forEach(r => {
      const pid = r.querySelector(".del-prod-id").value;
      const qty = parseFloat(r.querySelector(".del-qty").value);
      if (pid && qty > 0) items.push({ product_id: parseInt(pid), quantity: qty });
    });

    if (items.length === 0) {
      showToast("Please add at least one item to dispatch", "error");
      return;
    }

    const payload = {
      customer: document.getElementById("delCustomer").value.trim(),
      source_location_id: parseInt(document.getElementById("delSourceLocation").value),
      items: items,
      notes: document.getElementById("delNotes").value.trim(),
      user_name: currentUser ? currentUser.name : "Inventory Manager"
    };

    try {
      const res = await fetch(`${API_BASE}/api/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Delivery Order ${data.ref_number} created!`, "success");
      closeModal("newDeliveryModal");
      document.getElementById("createDeliveryForm").reset();
      loadDeliveries();
      loadDashboard();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 4. Create Transfer
  document.getElementById("createTransferForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rows = document.querySelectorAll("#transferItemsContainer .item-row");
    const items = [];
    rows.forEach(r => {
      const pid = r.querySelector(".trans-prod-id").value;
      const qty = parseFloat(r.querySelector(".trans-qty").value);
      if (pid && qty > 0) items.push({ product_id: parseInt(pid), quantity: qty });
    });

    if (items.length === 0) {
      showToast("Please add at least one item to transfer", "error");
      return;
    }

    const payload = {
      source_location_id: parseInt(document.getElementById("transSourceLoc").value),
      dest_location_id: parseInt(document.getElementById("transDestLoc").value),
      items: items,
      notes: document.getElementById("transNotes").value.trim(),
      auto_validate: document.getElementById("transAutoValidate").checked,
      user_name: currentUser ? currentUser.name : "Warehouse Staff"
    };

    try {
      const res = await fetch(`${API_BASE}/api/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Internal Transfer ${data.ref_number} scheduled!`, "success");
      closeModal("newTransferModal");
      document.getElementById("createTransferForm").reset();
      loadTransfers();
      loadDashboard();
      loadCommonData();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 5. Stock Adjustment Submit
  document.getElementById("createAdjustmentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const locId = parseInt(document.getElementById("adjLocationSelect").value);
    const prodId = parseInt(document.getElementById("adjProductSelect").value);
    const counted = parseFloat(document.getElementById("adjCountedQty").value);
    const reason = document.getElementById("adjReasonCustom").value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: locId,
          product_id: prodId,
          counted_quantity: counted,
          reason: reason,
          user_name: currentUser ? currentUser.name : "Warehouse Staff"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, "success");
      closeModal("adjustmentModal");
      document.getElementById("createAdjustmentForm").reset();
      loadAdjustments();
      loadDashboard();
      loadCommonData();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 6. Create Category
  document.getElementById("createCategoryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("catName").value.trim();
    const description = document.getElementById("catDesc").value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Category created!", "success");
      closeModal("newCategoryModal");
      document.getElementById("createCategoryForm").reset();
      loadCommonData().then(() => loadCategories());
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 7. Create Warehouse
  document.getElementById("createWarehouseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("whCode").value.trim().toUpperCase();
    const name = document.getElementById("whName").value.trim();
    const address = document.getElementById("whAddress").value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, address })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Warehouse registered!", "success");
      closeModal("newWarehouseModal");
      document.getElementById("createWarehouseForm").reset();
      loadCommonData().then(() => {
        loadWarehouses();
        loadLocations();
      });
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // 8. Create Location
  document.getElementById("createLocationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const warehouse_id = parseInt(document.getElementById("locWhSelect").value);
    const code = document.getElementById("locCode").value.trim().toUpperCase();
    const name = document.getElementById("locName").value.trim();
    const type = document.getElementById("locType").value;

    try {
      const res = await fetch(`${API_BASE}/api/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouse_id, code, name, type })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast("Location created!", "success");
      closeModal("newLocationModal");
      document.getElementById("createLocationForm").reset();
      loadCommonData().then(() => loadLocations());
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// --------------------------------------------------------------------------
// MODAL CONTROLLERS & HELPERS
// --------------------------------------------------------------------------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("active");

    // Initialize defaults if empty
    if (id === "newReceiptModal" && document.getElementById("receiptItemsContainer").children.length === 0) {
      addReceiptItemRow();
    }
    if (id === "newDeliveryModal" && document.getElementById("deliveryItemsContainer").children.length === 0) {
      addDeliveryItemRow();
    }
    if (id === "newTransferModal" && document.getElementById("transferItemsContainer").children.length === 0) {
      addTransferItemRow();
    }
    if (id === "adjustmentModal") {
      onAdjustmentLocationOrProductChange();
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

// Close modal on background click
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
    }
  });
});

// Toast notification helper
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Badge Helpers
function getStatusBadge(status) {
  const map = {
    Draft: "badge-draft",
    Waiting: "badge-waiting",
    Ready: "badge-ready",
    Done: "badge-done",
    Canceled: "badge-canceled"
  };
  return `<span class="badge ${map[status] || 'badge-draft'}">${status}</span>`;
}

function getTypeBadge(type) {
  const map = {
    RECEIPT: "badge-receipt",
    DELIVERY: "badge-delivery",
    INTERNAL: "badge-internal",
    ADJUSTMENT: "badge-adjustment"
  };
  const labels = {
    RECEIPT: "Receipt",
    DELIVERY: "Delivery",
    INTERNAL: "Internal",
    ADJUSTMENT: "Adjustment"
  };
  return `<span class="badge ${map[type] || 'badge-draft'}">${labels[type] || type}</span>`;
}
