import { initVegetables, openVegModal, closeVegModal, submitVeg, previewVegImage, filterVegetables, deleteVeg, onVegStatUpdate } from "./vegetables.js";
import { initCustomers, openCustModal, closeCustModal, submitCust, filterCustomers, deleteCust, onCustStatUpdate } from "./customers.js";
import { initOrders, openOrderModal, closeOrderModal, submitOrder, addOrderItem, removeOrderItem, calcOrderTotal, updateOrderPaymentPreview, deleteOrder, openPaymentModal, closePaymentModal, previewPaymentRemaining, submitPayment, onOrderStatUpdate, onRevenueStatUpdate } from "./orders.js";
import { showToast, confirmDelete, closeDeleteModal, switchTab, toggleSidebar, closeSidebar } from "./utils.js";
import { dbGet } from "./firebase.js";

// ── Expose globals to HTML inline handlers ────────────────────────────────────
window.openVegModal       = openVegModal;
window.closeVegModal      = closeVegModal;
window.submitVeg          = submitVeg;
window.previewVegImage    = previewVegImage;
window.filterVegetables   = filterVegetables;
window.deleteVeg          = deleteVeg;

window.openCustModal      = openCustModal;
window.closeCustModal     = closeCustModal;
window.submitCust         = submitCust;
window.filterCustomers    = filterCustomers;
window.deleteCust         = deleteCust;

window.openOrderModal     = openOrderModal;
window.closeOrderModal    = closeOrderModal;
window.submitOrder        = submitOrder;
window.addOrderItem       = addOrderItem;
window.removeOrderItem    = removeOrderItem;
window.calcOrderTotal     = calcOrderTotal;
window.updateOrderPaymentPreview = updateOrderPaymentPreview;
window.deleteOrder        = deleteOrder;

window.openPaymentModal   = openPaymentModal;
window.closePaymentModal  = closePaymentModal;
window.previewPaymentRemaining = previewPaymentRemaining;
window.submitPayment      = submitPayment;

window.switchTab          = switchTab;
window.toggleSidebar      = toggleSidebar;
window.closeSidebar       = closeSidebar;
window.closeDeleteModal   = closeDeleteModal;
window.showToast          = showToast;

// ── Dashboard stat update handlers ───────────────────────────────────────────
onVegStatUpdate((count) => {
  const el = document.getElementById("stat-vegetables");
  if (el) el.textContent = count;
});

onCustStatUpdate((count) => {
  const el = document.getElementById("stat-customers");
  if (el) el.textContent = count;
});

onOrderStatUpdate((count) => {
  const el = document.getElementById("stat-orders");
  if (el) el.textContent = count;
});

onRevenueStatUpdate((rev) => {
  const el = document.getElementById("stat-revenue");
  if (el) el.textContent = `$${parseFloat(rev).toFixed(2)}`;
});

// ── Firebase connection test ──────────────────────────────────────────────────
async function testFirebaseConnection() {
  try {
    await dbGet(".info/connected");
    showToast("Nidaamka Bishaaro waa la xidday!", "success");
  } catch (err) {
    console.error("Firebase connection test failed:", err);
    if (err.code === "PERMISSION_DENIED") {
      showToast("Firebase Rules Khalad: Fur Firebase Console → Realtime Database → Rules → ku dar .read iyo .write oo true", "error");
    } else {
      showToast("Firebase lama gaari karo. Hubi databaseURL ee firebase.js", "error");
    }
  }
}

// ── Boot all modules ──────────────────────────────────────────────────────────
function init() {
  initVegetables();
  initCustomers();
  initOrders();
  testFirebaseConnection();
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
