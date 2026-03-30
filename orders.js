import { dbPush, dbRemove, dbListen, dbUpdate } from "./firebase.js";
import { showToast, confirmDelete } from "./utils.js";
import { vegetablesData } from "./vegetables.js";
import { customersData } from "./customers.js";

const ORDERS_PATH = "orders";
export let ordersData = {};

// ── Listen to realtime updates ────────────────────────────────────────────────
export function initOrders() {
  dbListen(ORDERS_PATH, (data) => {
    ordersData = data || {};
    renderOrders(ordersData);
    updateOrdersStat(Object.keys(ordersData).length);
    updateRevenueStat(calcTotalRevenue(ordersData));
    renderDashboardRecent(ordersData);
  });
}

// ── Render orders table ───────────────────────────────────────────────────────
function renderOrders(data) {
  const tbody = document.getElementById("orders-table-body");
  const entries = Object.entries(data || {}).sort((a, b) => b[1].createdAt - a[1].createdAt);

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">Dalabo ma jiraan weli</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(([id, order], idx) => {
    const itemsText = (order.items || []).map(i => `${escHtml(i.vegName)} ×${i.qty}`).join(", ");
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
    const paid = parseFloat(order.paid || 0);
    const remaining = parseFloat(order.total || 0) - paid;
    const isPaidFull = remaining <= 0.01;
    const statusBadge = isPaidFull 
      ? '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">La bixiyay</span>'
      : '<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">Qayb</span>';
    return `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-3 text-gray-400 text-xs font-mono">#${String(entries.length - idx).padStart(3,"0")}</td>
      <td class="px-6 py-3">
        <div class="font-medium text-gray-800">${escHtml(order.customerName)}</div>
      </td>
      <td class="px-6 py-3 text-gray-600 max-w-xs">
        <div class="text-xs leading-relaxed">${itemsText}</div>
      </td>
      <td class="px-6 py-3">
        <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-bold">$${parseFloat(order.total).toFixed(2)}</span>
      </td>
      <td class="px-6 py-3">
        <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">$${paid.toFixed(2)}</span>
      </td>
      <td class="px-6 py-3">
        ${isPaidFull 
          ? '<span class="text-green-600 text-xs font-semibold">$0.00</span>'
          : `<span class="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">$${remaining.toFixed(2)}</span>`}
      </td>
      <td class="px-6 py-3 text-gray-400 text-xs">${dateStr}</td>
      <td class="px-6 py-3">
        <div class="flex items-center gap-2">
          ${!isPaidFull ? `<button onclick="openPaymentModal('${id}')" class="text-green-500 hover:text-green-700 p-1.5 rounded-lg hover:bg-green-50 transition" title="Ku dar Lacag">
            <i class="fa-solid fa-dollar-sign text-xs"></i>
          </button>` : ''}
          <button onclick="deleteOrder('${id}')" class="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition" title="Tirtir">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

// ── Dashboard recent orders (top 5) ──────────────────────────────────────────
function renderDashboardRecent(data) {
  const tbody = document.getElementById("dashboard-recent-orders");
  const entries = Object.entries(data || {}).sort((a, b) => b[1].createdAt - a[1].createdAt).slice(0, 5);

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Dalabo ma jiraan weli</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(([, order]) => {
    const itemsText = (order.items || []).map(i => `${escHtml(i.vegName)} ×${i.qty}`).join(", ");
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short" }) : "—";
    return `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-3 font-medium text-gray-800">${escHtml(order.customerName)}</td>
      <td class="px-6 py-3 text-gray-500 text-xs">${itemsText}</td>
      <td class="px-6 py-3"><span class="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">$${parseFloat(order.total).toFixed(2)}</span></td>
      <td class="px-6 py-3 text-gray-400 text-xs">${dateStr}</td>
    </tr>`;
  }).join("");
}

// ── Order Items management ────────────────────────────────────────────────────
let orderItemCount = 0;

export function openOrderModal() {
  document.getElementById("order-modal").classList.remove("hidden");
  document.getElementById("order-form").reset();
  orderItemCount = 0;
  document.getElementById("order-items-container").innerHTML = "";
  document.getElementById("order-total-display").textContent = "$0.00";
  document.getElementById("order-initial-payment").value = "";
  document.getElementById("order-payment-preview").classList.add("hidden");
  addOrderItem();
}

export function closeOrderModal() {
  document.getElementById("order-modal").classList.add("hidden");
}

export function addOrderItem() {
  const container = document.getElementById("order-items-container");
  const idx = orderItemCount++;
  const vegOptions = Object.entries(vegetablesData).map(([id, v]) =>
    `<option value="${id}" data-price="${v.price}">${escHtml(v.name)} — $${parseFloat(v.price).toFixed(2)}/kg</option>`
  ).join("");

  const row = document.createElement("div");
  row.className = "order-item flex items-center gap-2 bg-gray-50 rounded-xl p-2";
  row.id = `order-item-${idx}`;
  row.innerHTML = `
    <select class="item-veg flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" onchange="calcOrderTotal()">
      <option value="">Select vegetable...</option>
      ${vegOptions}
    </select>
    <input type="number" min="0.1" step="0.1" value="1" class="item-qty w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" placeholder="Qty" oninput="calcOrderTotal()" />
    <span class="item-subtotal text-xs font-semibold text-green-600 w-14 text-right">$0.00</span>
    <button type="button" onclick="removeOrderItem(${idx})" class="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;
  container.appendChild(row);
  calcOrderTotal();
}

export function removeOrderItem(idx) {
  const el = document.getElementById(`order-item-${idx}`);
  if (el) el.remove();
  const remaining = document.querySelectorAll(".order-item");
  if (remaining.length === 0) addOrderItem();
  calcOrderTotal();
}

export function calcOrderTotal() {
  let total = 0;
  document.querySelectorAll(".order-item").forEach(row => {
    const sel = row.querySelector(".item-veg");
    const qty = parseFloat(row.querySelector(".item-qty").value) || 0;
    const opt = sel.options[sel.selectedIndex];
    const price = opt ? parseFloat(opt.dataset.price || 0) : 0;
    const sub = price * qty;
    row.querySelector(".item-subtotal").textContent = `$${sub.toFixed(2)}`;
    total += sub;
  });
  document.getElementById("order-total-display").textContent = `$${total.toFixed(2)}`;
  updateOrderPaymentPreview();
}

export function updateOrderPaymentPreview() {
  const total = parseFloat(document.getElementById("order-total-display").textContent.replace("$", "")) || 0;
  const payment = parseFloat(document.getElementById("order-initial-payment").value) || 0;
  const remaining = total - payment;
  const preview = document.getElementById("order-payment-preview");
  const remainingEl = document.getElementById("order-remaining-preview");
  
  if (payment > 0 && total > 0) {
    preview.classList.remove("hidden");
    remainingEl.textContent = `$${Math.max(0, remaining).toFixed(2)}`;
    if (remaining <= 0) {
      remainingEl.className = "font-semibold text-green-600";
    } else {
      remainingEl.className = "font-semibold text-orange-600";
    }
  } else {
    preview.classList.add("hidden");
  }
}

// ── Submit order ──────────────────────────────────────────────────────────────
export async function submitOrder(event) {
  event.preventDefault();
  const customerId = document.getElementById("order-customer").value;
  if (!customerId) { showToast("Fadlan dooro macmiil.", "warning"); return; }

  const items = [];
  let total = 0;
  let valid = true;

  document.querySelectorAll(".order-item").forEach(row => {
    const sel   = row.querySelector(".item-veg");
    const vegId = sel.value;
    const qty   = parseFloat(row.querySelector(".item-qty").value) || 0;
    if (!vegId || qty <= 0) { valid = false; return; }
    const opt   = sel.options[sel.selectedIndex];
    const price = parseFloat(opt.dataset.price || 0);
    const vegName = opt.text.split(" — ")[0];
    const sub = price * qty;
    items.push({ vegId, vegName, qty, price, subtotal: sub });
    total += sub;
  });

  if (!valid || items.length === 0) {
    showToast("Fadlan si sax ah u buuxi dhammaan alaabada dalabka.", "warning");
    return;
  }

  const customer = customersData[customerId];
  const initialPayment = parseFloat(document.getElementById("order-initial-payment").value) || 0;
  const payload = {
    customerId,
    customerName: customer?.name || "Unknown",
    items,
    total: parseFloat(total.toFixed(2)),
    paid: parseFloat(Math.min(initialPayment, total).toFixed(2)),
    payments: initialPayment > 0 ? [{
      amount: parseFloat(Math.min(initialPayment, total).toFixed(2)),
      date: Date.now(),
      note: "Lacag bilowga"
    }] : [],
    createdAt: Date.now()
  };

  try {
    await dbPush(ORDERS_PATH, payload);
    showToast("Dalabka si guul leh ayaa loo diray!", "success");
    closeOrderModal();
  } catch (err) {
    console.error("submitOrder error:", err.code, err.message);
    if (err.code === "PERMISSION_DENIED") {
      showToast("Oggolaansho la gaabsaday! Hagaaji Firebase Database Rules.", "error");
    } else {
      showToast("Khalad: ma la dirayn karin dalabka — " + err.message, "error");
    }
  }
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
export function openPaymentModal(orderId) {
  const order = ordersData[orderId];
  if (!order) return;

  document.getElementById("payment-modal").classList.remove("hidden");
  document.getElementById("payment-form").reset();
  document.getElementById("payment-order-id").value = orderId;
  
  const paid = parseFloat(order.paid || 0);
  const remaining = parseFloat(order.total || 0) - paid;

  document.getElementById("payment-customer-name").textContent = order.customerName || "—";
  document.getElementById("payment-total").textContent = `$${parseFloat(order.total).toFixed(2)}`;
  document.getElementById("payment-paid").textContent = `$${paid.toFixed(2)}`;
  document.getElementById("payment-remaining").textContent = `$${remaining.toFixed(2)}`;
  document.getElementById("payment-new-remaining").textContent = "";

  renderPaymentHistory(order.payments || []);
}

export function closePaymentModal() {
  document.getElementById("payment-modal").classList.add("hidden");
}

export function previewPaymentRemaining() {
  const orderId = document.getElementById("payment-order-id").value;
  const order = ordersData[orderId];
  if (!order) return;

  const paid = parseFloat(order.paid || 0);
  const total = parseFloat(order.total || 0);
  const remaining = total - paid;
  const newPayment = parseFloat(document.getElementById("payment-amount").value) || 0;
  const newRemaining = remaining - newPayment;

  const preview = document.getElementById("payment-new-remaining");
  if (newPayment > 0) {
    if (newRemaining <= 0) {
      preview.textContent = `✓ Dalabka waa la dhamaynayaa (xad-dhaaf: $${Math.abs(newRemaining).toFixed(2)})`;
      preview.className = "mt-1 text-xs text-green-600 font-medium";
    } else {
      preview.textContent = `Haraaga cusub: $${newRemaining.toFixed(2)}`;
      preview.className = "mt-1 text-xs text-orange-600 font-medium";
    }
  } else {
    preview.textContent = "";
  }
}

function renderPaymentHistory(payments) {
  const container = document.getElementById("payment-history-list");
  if (!payments || payments.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-2">Lacag lama bixin weli</p>';
    return;
  }

  container.innerHTML = payments.map(p => {
    const dateStr = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";
    return `
      <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
        <div class="flex-1">
          <div class="text-xs font-semibold text-gray-700">$${parseFloat(p.amount).toFixed(2)}</div>
          <div class="text-xs text-gray-400">${dateStr}</div>
        </div>
        ${p.note ? `<div class="text-xs text-gray-500 italic max-w-[120px] truncate">${escHtml(p.note)}</div>` : ''}
      </div>
    `;
  }).join("");
}

export async function submitPayment(event) {
  event.preventDefault();
  const orderId = document.getElementById("payment-order-id").value;
  const order = ordersData[orderId];
  if (!order) return;

  const amount = parseFloat(document.getElementById("payment-amount").value);
  const note = document.getElementById("payment-note").value.trim();

  if (!amount || amount <= 0) {
    showToast("Fadlan geli xaddi lacag oo sax ah.", "warning");
    return;
  }

  const currentPaid = parseFloat(order.paid || 0);
  const total = parseFloat(order.total || 0);
  const remaining = total - currentPaid;

  if (amount > remaining + 0.01) {
    showToast(`Lacagtu way ka badan tahay haraaga ($${remaining.toFixed(2)}). Xaddiga hoos u dhig.`, "warning");
    return;
  }

  const newPaid = currentPaid + amount;
  const newPayment = {
    amount: parseFloat(amount.toFixed(2)),
    date: Date.now(),
    note: note || "Lacag-bixin"
  };

  const updatedPayments = [...(order.payments || []), newPayment];

  try {
    await dbUpdate(`${ORDERS_PATH}/${orderId}`, {
      paid: parseFloat(newPaid.toFixed(2)),
      payments: updatedPayments
    });
    showToast("Lacagta si guul leh ayaa loo daray!", "success");
    closePaymentModal();
  } catch (err) {
    console.error("submitPayment error:", err.code, err.message);
    if (err.code === "PERMISSION_DENIED") {
      showToast("Oggolaansho la gaabsaday! Hagaaji Firebase Database Rules.", "error");
    } else {
      showToast("Khalad: ma la darin karin lacagta — " + err.message, "error");
    }
  }
}

// ── Delete order ──────────────────────────────────────────────────────────────
export function deleteOrder(id) {
  confirmDelete("Dalabkan ma tirtiraysaa?", async () => {
    try {
      await dbRemove(`${ORDERS_PATH}/${id}`);
      showToast("Dalabka waa la tirtray.", "info");
    } catch (err) {
      console.error("deleteOrder error:", err.code, err.message);
      showToast("Khalad tirtirka: " + err.message, "error");
    }
  });
}

// ── Revenue calc ──────────────────────────────────────────────────────────────
function calcTotalRevenue(data) {
  return Object.values(data || {}).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
}

// ── Stat update callbacks ─────────────────────────────────────────────────────
let _orderStatCb = () => {};
let _revenueStatCb = () => {};
export function onOrderStatUpdate(cb) { _orderStatCb = cb; }
export function onRevenueStatUpdate(cb) { _revenueStatCb = cb; }
function updateOrdersStat(count) { _orderStatCb(count); }
function updateRevenueStat(rev) { _revenueStatCb(rev); }

// ── Helper ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
