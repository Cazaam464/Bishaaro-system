import { dbPush, dbUpdate, dbRemove, dbListen } from "./firebase.js";
import { showToast, confirmDelete } from "./utils.js";

const VEG_PATH = "vegetables";
export let vegetablesData = {};

// ── Listen to realtime updates ────────────────────────────────────────────────
export function initVegetables() {
  dbListen(VEG_PATH, (data) => {
    vegetablesData = data || {};
    renderVegetables(vegetablesData);
    updateVegStat(Object.keys(vegetablesData).length);
  });
}

// ── Render table ──────────────────────────────────────────────────────────────
function renderVegetables(data) {
  const tbody = document.getElementById("veg-table-body");
  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">Khudrad lama darin weli</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(([id, veg]) => `
    <tr class="hover:bg-gray-50 transition">
      <td class="px-6 py-3">
        ${veg.image
          ? `<img src="${veg.image}" alt="${escHtml(veg.name)}" class="w-12 h-12 rounded-lg object-cover border border-gray-100" onerror="this.src='https://placehold.co/48x48/e2e8f0/94a3b8?text=🥬'" />`
          : `<div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-2xl">🥬</div>`}
      </td>
      <td class="px-6 py-3 font-medium text-gray-800">${escHtml(veg.name)}</td>
      <td class="px-6 py-3">
        <span class="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold">$${parseFloat(veg.price).toFixed(2)}/kg</span>
      </td>
      <td class="px-6 py-3">
        <div class="flex items-center gap-2">
          <button onclick="openVegModal('${id}')" class="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition" title="Wax ka bedel">
            <i class="fa-solid fa-pen text-xs"></i>
          </button>
          <button onclick="deleteVeg('${id}','${escHtml(veg.name)}')" class="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition" title="Tirtir">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ── Filter vegetables by search input ────────────────────────────────────────
export function filterVegetables() {
  const q = document.getElementById("veg-search").value.toLowerCase();
  const filtered = Object.fromEntries(
    Object.entries(vegetablesData).filter(([, v]) => v.name.toLowerCase().includes(q))
  );
  renderVegetables(filtered);
}

// ── Modal open/close ──────────────────────────────────────────────────────────
export function openVegModal(id = null) {
  document.getElementById("veg-modal").classList.remove("hidden");
  document.getElementById("veg-form").reset();
  document.getElementById("veg-image-preview").classList.add("hidden");
  document.getElementById("veg-id").value = "";

  if (id && vegetablesData[id]) {
    const veg = vegetablesData[id];
    document.getElementById("veg-modal-title").textContent = "Wax ka bedel Khudrad";
    document.getElementById("veg-id").value = id;
    document.getElementById("veg-name").value = veg.name;
    document.getElementById("veg-price").value = veg.price;
    document.getElementById("veg-image-url").value = veg.image || "";
    if (veg.image) {
      const prev = document.getElementById("veg-image-preview");
      prev.src = veg.image;
      prev.classList.remove("hidden");
    }
  } else {
    document.getElementById("veg-modal-title").textContent = "Ku dar Khudrad";
  }
}

export function closeVegModal() {
  document.getElementById("veg-modal").classList.add("hidden");
}

// ── Preview image from file input ─────────────────────────────────────────────
export function previewVegImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const prev = document.getElementById("veg-image-preview");
    prev.src = e.target.result;
    prev.classList.remove("hidden");
    document.getElementById("veg-image-url").value = "";
  };
  reader.readAsDataURL(file);
}

// ── Submit form ───────────────────────────────────────────────────────────────
export async function submitVeg(event) {
  event.preventDefault();
  const id       = document.getElementById("veg-id").value;
  const name     = document.getElementById("veg-name").value.trim();
  const price    = parseFloat(document.getElementById("veg-price").value);
  const imageUrl = document.getElementById("veg-image-url").value.trim();
  const fileInput = document.getElementById("veg-image-file");
  const preview   = document.getElementById("veg-image-preview");

  let image = imageUrl;
  if (!image && preview && !preview.classList.contains("hidden")) {
    image = preview.src;
  }

  const payload = { name, price, image, updatedAt: Date.now() };

  try {
    if (id) {
      await dbUpdate(`${VEG_PATH}/${id}`, payload);
      showToast("Khudradda si guul leh ayaa loo cusboonaysiiyay!", "success");
    } else {
      payload.createdAt = Date.now();
      await dbPush(VEG_PATH, payload);
      showToast("Khudradda si guul leh ayaa loo daray!", "success");
    }
    closeVegModal();
  } catch (err) {
    console.error("submitVeg error:", err.code, err.message);
    if (err.code === "PERMISSION_DENIED") {
      showToast("Oggolaansho la gaabsaday! Hagaaji Firebase Database Rules.", "error");
    } else {
      showToast("Khalad: ma la keydin karin khudradda — " + err.message, "error");
    }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
export function deleteVeg(id, name) {
  confirmDelete(`Delete "${name}"?`, async () => {
    try {
      await dbRemove(`${VEG_PATH}/${id}`);
      showToast("Khudradda waa la tirtray.", "info");
    } catch (err) {
      console.error("deleteVeg error:", err.code, err.message);
      showToast("Khalad tirtirka: " + err.message, "error");
    }
  });
}

// ── Stat update callback (set externally) ─────────────────────────────────────
let _statCb = () => {};
export function onVegStatUpdate(cb) { _statCb = cb; }
function updateVegStat(count) { _statCb(count); }

// ── Helper ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
