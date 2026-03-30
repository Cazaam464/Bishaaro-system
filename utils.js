// ── Toast Notifications ───────────────────────────────────────────────────────

const ICONS = {
  success: { icon: "fa-circle-check",    bg: "bg-green-500" },
  error:   { icon: "fa-circle-xmark",    bg: "bg-red-500"   },
  warning: { icon: "fa-triangle-exclamation", bg: "bg-yellow-500" },
  info:    { icon: "fa-circle-info",     bg: "bg-blue-500"  },
};

export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const cfg = ICONS[type] || ICONS.info;
  const toast = document.createElement("div");
  toast.className = `toast flex items-center gap-3 bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-700 min-w-[280px] max-w-[320px]`;
  toast.innerHTML = `
    <div class="${cfg.bg} text-white rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
      <i class="fa-solid ${cfg.icon} text-sm"></i>
    </div>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-gray-300 hover:text-gray-500 flex-shrink-0">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
let _deleteCb = null;

export function confirmDelete(message, callback) {
  _deleteCb = callback;
  document.getElementById("delete-modal").classList.remove("hidden");
  document.getElementById("delete-confirm-btn").onclick = () => {
    closeDeleteModal();
    if (_deleteCb) _deleteCb();
  };
}

export function closeDeleteModal() {
  document.getElementById("delete-modal").classList.add("hidden");
  _deleteCb = null;
}

// ── Tab Switching ─────────────────────────────────────────────────────────────
const TAB_TITLES = {
  dashboard:  "Xog-guud",
  vegetables: "Khudradda",
  customers:  "Macaamiisha",
  orders:     "Dalabka",
};

export function switchTab(name) {
  // Hide all sections
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  // Remove active from all sidebar links
  document.querySelectorAll(".sidebar-link").forEach(el => el.classList.remove("active"));

  // Activate target
  const section = document.getElementById(`tab-${name}`);
  if (section) {
    section.classList.add("active");
    section.classList.remove("fade-in");
    void section.offsetWidth;
    section.classList.add("fade-in");
  }

  // Activate sidebar link
  document.querySelectorAll(".sidebar-link").forEach(btn => {
    if (btn.getAttribute("onclick")?.includes(`'${name}'`)) {
      btn.classList.add("active");
    }
  });

  // Update page title
  document.getElementById("page-title").textContent = TAB_TITLES[name] || name;

  // Close sidebar on mobile
  closeSidebar();
}

// ── Sidebar Mobile Toggle ─────────────────────────────────────────────────────
export function toggleSidebar() {
  const sidebar  = document.getElementById("sidebar");
  const overlay  = document.getElementById("sidebar-overlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("hidden");
}

export function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  sidebar.classList.remove("open");
  overlay.classList.add("hidden");
}
