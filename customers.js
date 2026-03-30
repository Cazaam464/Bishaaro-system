import { dbPush, dbUpdate, dbRemove, dbListen } from "./firebase.js";
import { showToast, confirmDelete } from "./utils.js";

const CUST_PATH = "customers";
export let customersData = {};

// ── Listen to realtime updates ────────────────────────────────────────────────
export function initCustomers() {
  dbListen(CUST_PATH, (data) => {
    customersData = data || {};
    renderCustomers(customersData);
    updateCustStat(Object.keys(customersData).length);
    populateCustomerDropdown();
  });
}

// ── Render table ──────────────────────────────────────────────────────────────
function renderCustomers(data) {
  const tbody = document.getElementById("cust-table-body");
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Macaamiil lama diiwaangelinin weli</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(([id, cust]) => `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">
            ${escHtml(cust.name.charAt(0))}
          </div>
          <span class="font-medium text-gray-800">${escHtml(cust.name)}</span>
        </div>
      </td>
      <td class="px-6 py-3 text-gray-600">
        <a href="tel:${escHtml(cust.phone)}" class="hover:text-blue-600 flex items-center gap-1">
          <i class="fa-solid fa-phone text-xs text-gray-400"></i> ${escHtml(cust.phone)}
        </a>
      </td>
      <td class="px-6 py-3 text-gray-500 max-w-xs truncate">${escHtml(cust.address)}</td>
      <td class="px-6 py-3">
        <div class="flex items-center gap-2">
          <button onclick="openCustModal('${id}')" class="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition" title="Wax ka bedel">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
          <button onclick="deleteCust('${id}','${escHtml(cust.name)}')" class="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition" title="Tirtir">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ── Filter customers by search ────────────────────────────────────────────────
export function filterCustomers() {
  const q = document.getElementById("cust-search").value.toLowerCase();
  const filtered = Object.fromEntries(
    Object.entries(customersData).filter(([, c]) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    )
  );
  renderCustomers(filtered);
}

// ── Populate order customer dropdown ─────────────────────────────────────────
export function populateCustomerDropdown() {
  const sel = document.getElementById("order-customer");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">Select a customer...</option>` +
    Object.entries(customersData).map(([id, c]) =>
      `<option value="${id}" ${id === current ? "selected" : ""}>${escHtml(c.name)} — ${escHtml(c.phone)}</option>`
    ).join("");
}

// ── Modal open/close ──────────────────────────────────────────────────────────
export function openCustModal(id = null) {
  document.getElementById("cust-modal").classList.remove("hidden");
  document.getElementById("cust-form").reset();
  document.getElementById("cust-id").value = "";

  if (id && customersData[id]) {
    const cust = customersData[id];
    document.getElementById("cust-modal-title").textContent = "Wax ka bedel Macmiil";
    document.getElementById("cust-id").value = id;
    document.getElementById("cust-name").value = cust.name;
    document.getElementById("cust-phone").value = cust.phone;
    document.getElementById("cust-address").value = cust.address;
  } else {
    document.getElementById("cust-modal-title").textContent = "Ku dar Macmiil";
  }
}

export function closeCustModal() {
  document.getElementById("cust-modal").classList.add("hidden");
}

// ── Submit form ───────────────────────────────────────────────────────────────
export async function submitCust(event) {
  event.preventDefault();
  const id      = document.getElementById("cust-id").value;
  const name    = document.getElementById("cust-name").value.trim();
  const phone   = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  const payload = { name, phone, address, updatedAt: Date.now() };

  try {
    if (id) {
      await dbUpdate(`customers/${id}`, payload);
      showToast("Macmiilka si guul leh ayaa loo cusboonaysiiyay!", "success");
    } else {
      payload.createdAt = Date.now();
      await dbPush("customers", payload);
      showToast("Macmiilka si guul leh ayaa loo diiwaangeliyay!", "success");
    }
    closeCustModal();
  } catch (err) {
    console.error("submitCust error:", err.code, err.message);
    if (err.code === "PERMISSION_DENIED") {
      showToast("Oggolaansho la gaabsaday! Hagaaji Firebase Database Rules.", "error");
    } else {
      showToast("Khalad: ma la keydin karin macmiilka — " + err.message, "error");
    }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
export function deleteCust(id, name) {
  confirmDelete(`Delete customer "${name}"?`, async () => {
    try {
      await dbRemove(`customers/${id}`);
      showToast("Macmiilka waa la tirtray.", "info");
    } catch (err) {
      console.error("deleteCust error:", err.code, err.message);
      showToast("Khalad tirtirka: " + err.message, "error");
    }
  });
}

// ── Stat update callback ──────────────────────────────────────────────────────
let _statCb = () => {};
export function onCustStatUpdate(cb) { _statCb = cb; }
function updateCustStat(count) { _statCb(count); }

// ── Helper ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
