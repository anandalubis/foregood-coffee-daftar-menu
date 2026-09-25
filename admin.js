// ====== KREDENSIAL SUPABASE PROJECT BARU ======
const SUPABASE_URL = "https://syzwkduoesyqddwidvkh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WoWkRBNXug-pirkKukA9VQ_SyM9JCqE";
// ===============================================

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Navigation & Containers
const loginBox = document.getElementById("loginBox");
const adminHeader = document.getElementById("adminHeader");
const queueSection = document.getElementById("queueSection");
const menuBoard = document.getElementById("menuBoard");
const tabQueue = document.getElementById("tabQueue");
const tabMenu = document.getElementById("tabMenu");
const formLogin = document.getElementById("formLogin");
const modalResetQueue = document.getElementById("modalResetQueue");
const btnConfirmResetQueue = document.getElementById("btnConfirmResetQueue");

// DOM CRUD Menu
const adminMenuList = document.getElementById("adminMenuList");
const modalMenu = document.getElementById("modalMenu");
const formMenu = document.getElementById("formMenu");
const modalMenuTitle = document.getElementById("modalMenuTitle");
const menuIdInput = document.getElementById("menuId");
const menuExistingUrlInput = document.getElementById("menuExistingUrl");
const menuNameInput = document.getElementById("menuName");
const menuKategoriSelect = document.getElementById("menuKategori");
const menuPriceInput = document.getElementById("menuPrice");
const menuDescInput = document.getElementById("menuDesc");
const menuKategoriTrigger = document.getElementById("menuKategoriTrigger");
const menuKategoriTriggerText = document.getElementById(
  "menuKategoriTriggerText",
);
const menuKategoriOptions = document.getElementById("menuKategoriOptions");
const imgPreview = document.getElementById("imgPreview");
const photoPickerOverlay = document.getElementById("photoPickerOverlay");
const photoPickerSheet = document.getElementById("photoPickerSheet");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const txtPhotoBadge = document.getElementById("txtPhotoBadge");
const btnSaveMenu = document.getElementById("btnSaveMenu");

// Tambahkan deklarasi elemen DOM kategori di bagian atas
const categoryBoard = document.getElementById("categoryBoard");
const tabCategory = document.getElementById("tabCategory");
const adminCategoryList = document.getElementById("adminCategoryList");
const modalCategory = document.getElementById("modalCategory");
const formCategory = document.getElementById("formCategory");
const modalCategoryTitle = document.getElementById("modalCategoryTitle");
const categoryIdInput = document.getElementById("categoryId");
const categoryNameInput = document.getElementById("categoryName");
const btnSaveCategory = document.getElementById("btnSaveCategory");
const toastNotification = document.getElementById("toastNotification");
const toastMessage = document.getElementById("toastMessage");
const toastIcon = document.getElementById("toastIcon");
const modalConfirmDelete = document.getElementById("modalConfirmDelete");
const confirmDeleteText = document.getElementById("confirmDeleteText");
const btnExecuteDelete = document.getElementById("btnExecuteDelete");

const tabHistory = document.getElementById("tabHistory");
const historyBoard = document.getElementById("historyBoard");
const historyOrderList = document.getElementById("historyOrderList");
const statTotalRevenue = document.getElementById("statTotalRevenue");
const statTotalOrders = document.getElementById("statTotalOrders");
const historySearchInput = document.getElementById("historySearchInput");

// Elemen Dropdown Profil
const profileTrigger = document.getElementById("profileTrigger");
const profileDropdown = document.getElementById("profileDropdown");

const modalConfirmLogout = document.getElementById("modalConfirmLogout");
const btnExecuteLogout = document.getElementById("btnExecuteLogout");

// Buka Modal Konfirmasi Logout
window.openLogoutModal = function () {
  // Tutup dropdown profil terlebih dahulu agar tampilan bersih
  if (profileDropdown) profileDropdown.classList.remove("show");
  if (profileTrigger) profileTrigger.classList.remove("active");

  if (modalConfirmLogout) modalConfirmLogout.classList.add("show");
};

// Tutup / Batalkan Modal Logout
window.closeLogoutModal = function () {
  if (modalConfirmLogout) modalConfirmLogout.classList.remove("show");
};

// Eksekusi Keluar Akun
window.executeLogout = async function () {
  if (btnExecuteLogout) {
    btnExecuteLogout.disabled = true;
    btnExecuteLogout.textContent = "Keluar...";
  }

  try {
    await supa.auth.signOut();
    closeLogoutModal();
    showToast("Berhasil keluar akun.");

    // Alihkan ke tampilan form login
    if (adminHeader) adminHeader.style.display = "none";
    if (queueSection) queueSection.style.display = "none";
    if (menuBoard) menuBoard.style.display = "none";
    if (categoryBoard) categoryBoard.style.display = "none";
    if (historyBoard) historyBoard.style.display = "none";

    if (loginBox) loginBox.style.display = "flex";
  } catch (err) {
    console.error("Gagal logout:", err);
    showToast("Gagal logout: " + err.message, true);
  } finally {
    if (btnExecuteLogout) {
      btnExecuteLogout.disabled = false;
      btnExecuteLogout.textContent = "Ya, Keluar";
    }
  }
};

// Variabel ID produk yang akan dihapus
let menuToDeleteId = null;

const modalConfirmDeleteMenu = document.getElementById(
  "modalConfirmDeleteMenu",
);
const confirmDeleteMenuText = document.getElementById("confirmDeleteMenuText");
const btnExecuteDeleteMenu = document.getElementById("btnExecuteDeleteMenu");

// Buka Modal Konfirmasi Hapus Produk
window.promptDeleteProduct = function (id, name) {
  menuToDeleteId = id;
  if (confirmDeleteMenuText) {
    confirmDeleteMenuText.innerHTML = `Yakin ingin menghapus menu <b>"${name}"</b>? Sajian ini tidak akan tampil lagi di katalog pemesanan.`;
  }
  if (modalConfirmDeleteMenu) modalConfirmDeleteMenu.classList.add("show");
};

// Tutup Modal
window.closeConfirmDeleteMenuModal = function () {
  menuToDeleteId = null;
  if (modalConfirmDeleteMenu) modalConfirmDeleteMenu.classList.remove("show");
};

// Eksekusi Hapus dari Database
if (btnExecuteDeleteMenu) {
  btnExecuteDeleteMenu.addEventListener("click", async () => {
    if (!menuToDeleteId) return;

    btnExecuteDeleteMenu.disabled = true;
    btnExecuteDeleteMenu.textContent = "Menghapus...";

    try {
      const { error } = await supa
        .from("produk")
        .delete()
        .eq("id", menuToDeleteId);
      if (error) throw error;

      closeConfirmDeleteMenuModal();
      showToast("Menu berhasil dihapus!");
      loadAdminProducts();
    } catch (err) {
      console.error(err);
      showToast("Gagal menghapus menu: " + err.message, true);
    } finally {
      btnExecuteDeleteMenu.disabled = false;
      btnExecuteDeleteMenu.textContent = "Hapus Sekarang";
    }
  });
}

// Toggle Buka/Tutup Dropdown Profil
window.toggleProfileDropdown = function (e) {
  e.stopPropagation();
  const isShow = profileDropdown.classList.contains("show");
  if (isShow) {
    profileDropdown.classList.remove("show");
    profileTrigger.classList.remove("active");
  } else {
    profileDropdown.classList.add("show");
    profileTrigger.classList.add("active");
  }
};

// Tutup Dropdown jika klik di luar area
document.addEventListener("click", (e) => {
  if (
    profileDropdown &&
    !profileDropdown.contains(e.target) &&
    !profileTrigger.contains(e.target)
  ) {
    profileDropdown.classList.remove("show");
    profileTrigger.classList.remove("active");
  }
});

let allHistoryOrders = []; // Menyimpan cache untuk pencarian cepat

let categoryToDeleteId = null;

// Fungsi Toast Notifikasi
function showToast(message, isDanger = false) {
  toastMessage.textContent = message;
  if (isDanger) {
    toastNotification.classList.add("danger");
    toastIcon.textContent = "✕";
  } else {
    toastNotification.classList.remove("danger");
    toastIcon.textContent = "✓";
  }

  toastNotification.classList.add("show");
  setTimeout(() => {
    toastNotification.classList.remove("show");
  }, 2500);
}

// Elemen Modal Hapus Riwayat
const modalClearHistory = document.getElementById("modalClearHistory");
const btnExecuteClearHistory = document.getElementById(
  "btnExecuteClearHistory",
);

// Buka Modal Konfirmasi Bersihkan Riwayat
window.openClearHistoryModal = function () {
  if (allHistoryOrders.length === 0) {
    showToast("Riwayat pesanan masih kosong!", true);
    return;
  }
  if (modalClearHistory) modalClearHistory.classList.add("show");
};

// Tutup Modal
window.closeClearHistoryModal = function () {
  if (modalClearHistory) modalClearHistory.classList.remove("show");
};

// Toggle Lihat / Sembunyikan Password
window.togglePasswordVisibility = function () {
  const pwdInput = document.getElementById("adminPassword");
  const eyeIcon = document.getElementById("eyeIcon");

  if (pwdInput.type === "password") {
    pwdInput.type = "text";
    // Ikon mata dicoret
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  } else {
    pwdInput.type = "password";
    // Ikon mata terbuka
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  }
};

// Eksekusi Pembersihan Riwayat Selesai
window.executeClearHistory = async function () {
  btnExecuteClearHistory.disabled = true;
  btnExecuteClearHistory.textContent = "Membersihkan...";

  try {
    // 1. Ambil semua ID pesanan yang berstatus 'selesai'
    const { data: doneOrders, error: fetchErr } = await supa
      .from("pesanan")
      .select("id")
      .eq("status", "selesai");

    if (fetchErr) throw fetchErr;

    if (doneOrders && doneOrders.length > 0) {
      const orderIds = doneOrders.map((o) => o.id);

      // 2. Hapus detail item di pesanan_item terlebih dahulu (menjaga integritas foreign key)
      const { error: itemErr } = await supa
        .from("pesanan_item")
        .delete()
        .in("pesanan_id", orderIds);

      if (itemErr) throw itemErr;

      // 3. Hapus data utama pesanan yang selesai
      const { error: orderErr } = await supa
        .from("pesanan")
        .delete()
        .eq("status", "selesai");

      if (orderErr) throw orderErr;
    }

    closeClearHistoryModal();
    showToast("Semua riwayat pesanan berhasil dibersihkan!");

    // Muat ulang data riwayat
    loadHistoryOrders();
  } catch (err) {
    console.error("Gagal membersihkan riwayat:", err);
    showToast("Gagal membersihkan: " + err.message, true);
  } finally {
    btnExecuteClearHistory.disabled = false;
    btnExecuteClearHistory.textContent = "Ya, Bersihkan";
  }
};

// Perbarui fungsi switchTab agar mendukung tab 'category'
window.switchTab = function (tab) {
  currentTab = tab;
  [tabQueue, tabMenu, tabCategory, tabHistory].forEach(
    (btn) => btn && btn.classList.remove("active"),
  );
  [queueSection, menuBoard, categoryBoard, historyBoard].forEach(
    (el) => el && (el.style.display = "none"),
  );

  if (tab === "queue") {
    tabQueue.classList.add("active");
    queueSection.style.display = "block";
    loadActiveOrders();
  } else if (tab === "menu") {
    tabMenu.classList.add("active");
    menuBoard.style.display = "block";
    loadAdminProducts();
  } else if (tab === "category") {
    tabCategory.classList.add("active");
    categoryBoard.style.display = "block";
    loadAdminCategories();
  } else if (tab === "history") {
    tabHistory.classList.add("active");
    historyBoard.style.display = "block";
    loadHistoryOrders();
  }
};

// Fungsi memuat data kategori beserta jumlah produknya
async function loadAdminCategories() {
  const [{ data: categories, error: catErr }, { data: products }] =
    await Promise.all([
      supa.from("kategori").select("id, nama").order("id", { ascending: true }),
      supa.from("produk").select("kategori_id"),
    ]);

  if (catErr) {
    console.error(catErr);
    return;
  }

  const countMap = {};
  (products || []).forEach((p) => {
    countMap[p.kategori_id] = (countMap[p.kategori_id] || 0) + 1;
  });

  renderAdminCategories(categories || [], countMap);
}

function renderAdminCategories(categories, countMap) {
  if (!adminCategoryList) return;

  if (categories.length === 0) {
    adminCategoryList.innerHTML = `
      <div class="empty-state">
        <h3>Belum Ada Kategori</h3>
        <p>Klik tombol '+ Tambah Kategori' untuk membuat kategori baru.</p>
      </div>`;
    return;
  }

  adminCategoryList.innerHTML = categories
    .map((c) => {
      const totalMenu = countMap[c.id] || 0;
      const initial = c.nama ? c.nama.charAt(0).toUpperCase() : "#";
      return `
  <div class="category-item-card">
    <div class="category-left-info">
      <div class="category-avatar">${initial}</div>
      <div class="category-text">
        <h4>${c.nama}</h4>
        <span>${totalMenu} Menu Terkait</span>
      </div>
    </div>
    <div class="category-actions">
      <button type="button" class="btn-mini-action" onclick='openEditCategoryModal(${JSON.stringify(c)})'>Edit</button>
      <button type="button" class="btn-mini-action del" onclick="promptDeleteCategory(${c.id}, '${c.nama}', ${totalMenu})">Hapus</button>
    </div>
  </div>
`;
    })
    .join("");
}

// Buka Modal Tambah Kategori
window.openAddCategoryModal = function () {
  formCategory.reset();
  categoryIdInput.value = "";
  modalCategoryTitle.textContent = "Tambah Kategori Baru";
  modalCategory.classList.add("show");
};

// Buka Modal Edit Kategori
window.openEditCategoryModal = function (category) {
  formCategory.reset();
  categoryIdInput.value = category.id;
  categoryNameInput.value = category.nama;
  modalCategoryTitle.textContent = "Edit Kategori";
  modalCategory.classList.add("show");
};

window.closeCategoryModal = function () {
  modalCategory.classList.remove("show");
};

// Form Submit: Tambah / Edit Kategori
formCategory.addEventListener("submit", async (e) => {
  e.preventDefault();
  btnSaveCategory.disabled = true;
  btnSaveCategory.textContent = "Menyimpan...";

  try {
    const isEdit = Boolean(categoryIdInput.value);
    const catName = categoryNameInput.value.trim();
    const payload = { nama: catName };

    if (isEdit) {
      const { error } = await supa
        .from("kategori")
        .update(payload)
        .eq("id", categoryIdInput.value);
      if (error) throw error;
      showToast(`Kategori "${catName}" berhasil diperbarui!`);
    } else {
      const { error } = await supa.from("kategori").insert([payload]);
      if (error) throw error;
      showToast(`Kategori "${catName}" berhasil ditambahkan!`);
    }

    closeCategoryModal();
    loadAdminCategories();
    loadCategories(); // Segarkan dropdown kategori pada form produk
  } catch (err) {
    console.error(err);
    showToast("Gagal: " + err.message, true);
  } finally {
    btnSaveCategory.disabled = false;
    btnSaveCategory.textContent = "Simpan Kategori";
  }
});

// Konfirmasi Hapus Kategori
window.promptDeleteCategory = function (id, name, totalMenu) {
  if (totalMenu > 0) {
    showToast(
      `Tidak bisa menghapus! Masih ada ${totalMenu} menu di kategori ini.`,
      true,
    );
    return;
  }

  categoryToDeleteId = id;
  confirmDeleteText.innerHTML = `Yakin ingin menghapus kategori <b>"${name}"</b>? Tindakan ini tidak dapat dibatalkan.`;
  modalConfirmDelete.classList.add("show");
};

window.closeConfirmModal = function () {
  categoryToDeleteId = null;
  modalConfirmDelete.classList.remove("show");
};

// Eksekusi Hapus dari Modal Konfirmasi
btnExecuteDelete.addEventListener("click", async () => {
  if (!categoryToDeleteId) return;

  btnExecuteDelete.disabled = true;
  btnExecuteDelete.textContent = "Menghapus...";

  try {
    const { error } = await supa
      .from("kategori")
      .delete()
      .eq("id", categoryToDeleteId);
    if (error) throw error;

    closeConfirmModal();
    showToast("Kategori berhasil dihapus!");
    loadAdminCategories();
    loadCategories();
  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus kategori: " + err.message, true);
  } finally {
    btnExecuteDelete.disabled = false;
    btnExecuteDelete.textContent = "Hapus Sekarang";
  }
});

let realtimeChannel = null;
let currentTab = "queue";
let cachedCategories = [];
let selectedFileToUpload = null;

function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function formatJam(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ----------------------------------------------------
// 1. OTENTIKASI & TAB SWITCHING
// ----------------------------------------------------
async function checkAuth() {
  const {
    data: { session },
  } = await supa.auth.getSession();
  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginBox.style.display = "flex";
  adminHeader.style.display = "none";
  queueSection.style.display = "none";
  menuBoard.style.display = "none";
}

function showDashboard() {
  loginBox.style.display = "none";
  adminHeader.style.removeProperty("display");
  queueSection.style.display = "none";
  switchTab(currentTab);
  loadCategories();
  listenToRealtime();
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();
  const btn = document.getElementById("btnLogin");

  btn.disabled = true;
  btn.textContent = "Memeriksa...";

  const { error } = await supa.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = "Masuk";

  if (error) {
    alert("Login gagal: " + error.message);
  } else {
    showDashboard();
  }
});

window.handleLogout = async function () {
  await supa.auth.signOut();
  showLogin();
};

// ----------------------------------------------------
// 2. KELOLA ANTREAN (FIFO) & REALTIME
// ----------------------------------------------------
async function loadActiveOrders() {
  const { data: orders, error } = await supa
    .from("pesanan")
    .select(
      `
      id, nomor_antrean, nama_customer, no_wa, total_harga, status, catatan, created_at,
      pesanan_item ( id, nama_produk, qty, subtotal )
    `,
    )
    .in("status", ["menunggu_pembayaran", "diproses", "siap_diambil"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }
  renderQueue(orders || []);
}

window.openResetQueueModal = function () {
  if (modalResetQueue) modalResetQueue.classList.add("show");
};

window.closeResetQueueModal = function () {
  if (modalResetQueue) modalResetQueue.classList.remove("show");
};

window.executeResetQueue = async function () {
  btnConfirmResetQueue.disabled = true;
  btnConfirmResetQueue.textContent = "Mereset...";

  try {
    const waktuSekarang = new Date().toISOString();

    // 1. Simpan stempel waktu reset ke database Supabase
    const { error: errSetting } = await supa
      .from("pengaturan")
      .upsert({ kunci: "terakhir_reset_antrean", nilai: waktuSekarang });

    if (errSetting) throw errSetting;

    // 2. Arsipkan pesanan yang sedang aktif di papan kasir
    await supa
      .from("pesanan")
      .update({ status: "selesai" })
      .in("status", ["menunggu_pembayaran", "diproses", "siap_diambil"]);

    closeResetQueueModal();
    showToast(
      "Nomor antrean berhasil di-reset! Pesanan baru akan mulai dari #001.",
    );
    loadActiveOrders();
  } catch (err) {
    console.error(err);
    showToast("Gagal mereset antrean: " + err.message, true);
  } finally {
    btnConfirmResetQueue.disabled = false;
    btnConfirmResetQueue.textContent = "Ya, Reset ke #001";
  }
};

function renderQueue(orders) {
  if (orders.length === 0) {
    queueBoard.innerHTML = `
      <div class="empty-state">
        <h3>Belum Ada Antrean Aktif</h3>
        <p>Pesanan baru dari pelanggan akan muncul di sini secara otomatis.</p>
      </div>`;
    return;
  }

  queueBoard.innerHTML = orders
    .map((o) => {
      let badgeClass = "badge-menunggu";
      let statusLabel = "Menunggu Bayar";
      let actionButtons = "";

      if (o.status === "menunggu_pembayaran") {
        badgeClass = "badge-menunggu";
        statusLabel = "Menunggu Bayar";
        actionButtons = `<button class="btn-action btn-pay" onclick="updateStatus(${o.id}, 'diproses')">Terima Pembayaran</button>`;
      } else if (o.status === "diproses") {
        badgeClass = "badge-proses";
        statusLabel = "Sedang Dibuat";
        actionButtons = `<button class="btn-action btn-ready" onclick="updateStatus(${o.id}, 'siap_diambil')">Siap Diambil</button>`;
      } else if (o.status === "siap_diambil") {
        badgeClass = "badge-siap";
        statusLabel = "Siap Diambil";
        actionButtons = `<button class="btn-action btn-done" onclick="updateStatus(${o.id}, 'selesai')">Pesanan Selesai</button>`;
      }

      const itemsHtml = (o.pesanan_item || [])
        .map(
          (it) => `
        <div class="order-item-line">
          <span>${it.qty}x <b>${it.nama_produk}</b></span>
          <span>${formatRupiah(it.subtotal)}</span>
        </div>`,
        )
        .join("");

      return `
      <div class="order-card ${o.status}">
        <div>
          <div class="order-card-header">
            <div>
              <span class="order-num">#${String(o.nomor_antrean).padStart(3, "0")}</span>
              <div class="order-time">${formatJam(o.created_at)}</div>
            </div>
            <span class="order-status-badge ${badgeClass}">${statusLabel}</span>
          </div>

          <div class="order-cust-info">
            <div class="order-cust-name">${o.nama_customer}</div>
            ${o.no_wa ? `<div class="order-cust-wa">WA: ${o.no_wa}</div>` : ""}
            ${o.catatan ? `<div class="order-cust-note">"${o.catatan}"</div>` : ""}
          </div>

          <div class="order-items-box">${itemsHtml}</div>

          <div class="order-total-row">
            <span>Total Tagihan</span>
            <span>${formatRupiah(o.total_harga)}</span>
          </div>
        </div>

        <div class="order-action-btns">${actionButtons}</div>
      </div>`;
    })
    .join("");
}

window.updateStatus = async function (orderId, newStatus) {
  const { error } = await supa
    .from("pesanan")
    .update({ status: newStatus })
    .eq("id", orderId);
  if (error) alert("Gagal memperbarui status: " + error.message);
  else loadActiveOrders();
};

function listenToRealtime() {
  if (realtimeChannel) supa.removeChannel(realtimeChannel);

  realtimeChannel = supa
    .channel("pesanan-antrean-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pesanan" },
      () => {
        if (currentTab === "queue") loadActiveOrders();
      },
    )
    .subscribe();
}

// ----------------------------------------------------
// 3. CRUD KELOLA MENU PRODUK
// ----------------------------------------------------
async function loadCategories() {
  const { data, error } = await supa
    .from("kategori")
    .select("id, nama")
    .order("id");
  if (!error && data) {
    cachedCategories = data;
    menuKategoriSelect.innerHTML = data
      .map((c) => `<option value="${c.id}">${c.nama}</option>`)
      .join("");
    renderCategorySelect();
  }
}

function renderCategorySelect() {
  if (!menuKategoriSelect || !menuKategoriOptions || !menuKategoriTriggerText) {
    return;
  }

  const options = [...menuKategoriSelect.options];
  const selectedOption = menuKategoriSelect.selectedOptions[0] || options[0];

  if (selectedOption) {
    menuKategoriSelect.value = selectedOption.value;
    menuKategoriTriggerText.textContent = selectedOption.textContent;
  }

  menuKategoriOptions.innerHTML = options
    .map(
      (option) => `
        <button
          type="button"
          class="category-select-option${option.selected ? " selected" : ""}"
          role="option"
          aria-selected="${option.selected}"
          data-value="${option.value}"
        >${option.textContent}</button>`,
    )
    .join("");
}

function closeCategorySelect() {
  if (!menuKategoriOptions || !menuKategoriTrigger) return;
  menuKategoriOptions.classList.remove("show");
  menuKategoriTrigger.setAttribute("aria-expanded", "false");
}

if (menuKategoriTrigger) {
  menuKategoriTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menuKategoriOptions.classList.toggle("show");
    menuKategoriTrigger.setAttribute("aria-expanded", String(isOpen));
  });
}

if (menuKategoriOptions) {
  menuKategoriOptions.addEventListener("click", (e) => {
    const option = e.target.closest(".category-select-option");
    if (!option) return;

    menuKategoriSelect.value = option.dataset.value;
    menuKategoriSelect.dispatchEvent(new Event("change", { bubbles: true }));
    renderCategorySelect();
    closeCategorySelect();
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#categorySelect")) closeCategorySelect();
});

// ----------------------------------------------------
// 4. RIWAYAT PESANAN SELESAI
// ----------------------------------------------------
async function loadHistoryOrders() {
  const { data: orders, error } = await supa
    .from("pesanan")
    .select(
      `
      id, nomor_antrean, nama_customer, no_wa, total_harga, status, catatan, created_at,
      pesanan_item ( id, nama_produk, qty, subtotal )
    `,
    )
    .eq("status", "selesai")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil riwayat:", error);
    return;
  }

  allHistoryOrders = orders || [];
  calculateHistoryStats(allHistoryOrders);
  renderHistoryOrders(allHistoryOrders);
}

// Hitung Ringkasan Omzet & Jumlah Pesanan
function calculateHistoryStats(orders) {
  const totalRev = orders.reduce(
    (sum, o) => sum + (Number(o.total_harga) || 0),
    0,
  );
  statTotalRevenue.textContent = formatRupiah(totalRev);
  statTotalOrders.textContent = `${orders.length} Pesanan`;
}

// Render Card List Riwayat
function renderHistoryOrders(orders) {
  if (orders.length === 0) {
    historyOrderList.innerHTML = `
      <div class="empty-state">
        <h3>Belum Ada Riwayat Pesanan</h3>
        <p>Pesanan yang telah ditandai 'Pesanan Selesai' akan tercatat di sini.</p>
      </div>`;
    return;
  }

  historyOrderList.innerHTML = orders
    .map((o) => {
      const formattedDate = new Date(o.created_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const itemsHtml = (o.pesanan_item || [])
        .map(
          (it) => `<span class="item-chip">${it.qty}x ${it.nama_produk}</span>`,
        )
        .join("");

      return `
      <div class="history-card">
        <div class="history-card-header">
          <div>
            <span class="history-num-badge">#${String(o.nomor_antrean).padStart(3, "0")}</span>
            <span style="margin-left: 8px; font-size: 0.72rem; font-weight: 800; background: #EFEBE9; color: #4E342E; padding: 2px 7px; border-radius: 6px;">SELESAI</span>
          </div>
          <div class="history-datetime">${formattedDate}</div>
        </div>

        <div class="history-card-body">
          <div class="history-customer-info">
            <h4>${o.nama_customer}</h4>
            ${o.no_wa ? `<span>WA: ${o.no_wa}</span>` : ""}
            ${o.catatan ? `<p style="margin: 4px 0 0; font-size: 0.78rem; color: #7A6960; font-style: italic;">"${o.catatan}"</p>` : ""}
          </div>

          <div class="history-items-chips">
            ${itemsHtml}
          </div>
        </div>

        <div class="history-total-price">
          ${formatRupiah(o.total_harga)}
        </div>
      </div>`;
    })
    .join("");
}

// Fitur Pencarian Realtime di Layar Riwayat
window.handleSearchHistory = function () {
  const query = historySearchInput.value.toLowerCase().trim();
  if (!query) {
    renderHistoryOrders(allHistoryOrders);
    return;
  }

  const filtered = allHistoryOrders.filter((o) => {
    const custMatch = (o.nama_customer || "").toLowerCase().includes(query);
    const numMatch = String(o.nomor_antrean).includes(query);
    return custMatch || numMatch;
  });

  renderHistoryOrders(filtered);
};

async function loadAdminProducts() {
  const { data: products, error } = await supa
    .from("produk")
    .select(
      "id, nama, harga, deskripsi, gambar_url, tersedia, kategori_id, kategori:kategori_id(nama)",
    )
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }
  renderAdminProducts(products || []);
}

function renderAdminProducts(products) {
  if (products.length === 0) {
    adminMenuList.innerHTML = `
      <div class="empty-state">
        <h3>Belum Ada Menu</h3>
        <p>Klik tombol '+ Tambah Menu Baru' untuk menambahkan sajian.</p>
      </div>`;
    return;
  }

  adminMenuList.innerHTML = products
    .map(
      (p) => `
    <div class="menu-card-admin">
      <div class="card-top">
        <img class="thumb" src="${p.gambar_url || ""}" alt="${p.nama}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'72\' height=\'72\' fill=\'%23ccc\'><rect width=\'72\' height=\'72\'/></svg>'">
        <div class="details">
          <span class="cat-tag">${p.kategori?.nama || "Menu"}</span>
          <h4>${p.nama}</h4>
          <div class="price">${formatRupiah(p.harga)}</div>
        </div>
      </div>
      <div class="card-actions">
        <div class="toggle-wrap">
          <span>${p.tersedia ? "Tersedia" : "Habis"}</span>
          <label class="switch">
            <input type="checkbox" ${p.tersedia ? "checked" : ""} onchange="toggleStock(${p.id}, this.checked)">
            <span class="slider"></span>
          </label>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn-mini-action" onclick='openEditMenuModal(${JSON.stringify(p)})'>Edit</button>
          <button class="btn-mini-action del" onclick="promptDeleteProduct(${p.id}, '${p.nama}')">Hapus</button>
        </div>
      </div>
    </div>`,
    )
    .join("");
}

// Switch Cepat Stok (Tersedia / Habis)
window.toggleStock = async function (id, isAvailable) {
  const { error } = await supa
    .from("produk")
    .update({ tersedia: isAvailable })
    .eq("id", id);
  if (error) {
    alert("Gagal mengubah ketersediaan: " + error.message);
    loadAdminProducts();
  }
};

// Buka & Tutup Bottom Sheet Pemilih Foto
window.openPhotoPickerSheet = function () {
  photoPickerOverlay.classList.add("show");
  photoPickerSheet.style.transform = "translateY(0)";
};

window.closePhotoPickerSheet = function (e) {
  if (e && e.target !== photoPickerOverlay) return;
  photoPickerSheet.style.transform = "translateY(100%)";
  photoPickerOverlay.classList.remove("show");
};

window.triggerPickGallery = function () {
  photoPickerSheet.style.transform = "translateY(100%)";
  photoPickerOverlay.classList.remove("show");
  document.getElementById("fileGallery").click();
};

window.triggerPickCamera = function () {
  photoPickerSheet.style.transform = "translateY(100%)";
  photoPickerOverlay.classList.remove("show");
  document.getElementById("fileCamera").click();
};

// Menangani File yang Dipilih dari Kamera / Galeri
window.handleFileSelected = function (e) {
  const file = e.target.files[0];
  if (!file) return;

  selectedFileToUpload = file;
  const reader = new FileReader();
  reader.onload = function (evt) {
    imgPreview.src = evt.target.result;
    imgPreview.style.display = "block";
    photoPlaceholder.style.display = "none";
    txtPhotoBadge.textContent = "Ganti Foto";
  };
  reader.readAsDataURL(file);
};

// Modal Tambah Menu (Reset ke "Pilih Foto")
window.openAddMenuModal = function () {
  formMenu.reset();
  menuIdInput.value = "";
  menuExistingUrlInput.value = "";
  selectedFileToUpload = null;
  renderCategorySelect();

  imgPreview.src = "";
  imgPreview.style.display = "none";
  photoPlaceholder.style.display = "block";

  txtPhotoBadge.textContent = "Pilih Foto";
  modalMenuTitle.textContent = "Tambah Menu Baru";
  modalMenu.classList.add("show");
};

// Modal Edit Menu (Set ke "Ganti Foto" jika ada foto)
window.openEditMenuModal = function (product) {
  formMenu.reset();
  menuIdInput.value = product.id;
  menuExistingUrlInput.value = product.gambar_url || "";
  selectedFileToUpload = null;

  menuNameInput.value = product.nama;
  menuKategoriSelect.value = product.kategori_id;
  renderCategorySelect();
  menuPriceInput.value = product.harga;
  menuDescInput.value = product.deskripsi || "";

  if (product.gambar_url) {
    imgPreview.src = product.gambar_url;
    imgPreview.style.display = "block";
    photoPlaceholder.style.display = "none";
    txtPhotoBadge.textContent = "Ganti Foto";
  } else {
    imgPreview.src = "";
    imgPreview.style.display = "none";
    photoPlaceholder.style.display = "block";
    txtPhotoBadge.textContent = "Pilih Foto";
  }

  modalMenuTitle.textContent = "Edit Menu Sajian";
  modalMenu.classList.add("show");
};

window.closeMenuModal = function () {
  modalMenu.classList.remove("show");
};

// Simpan Menu Produk (Insert / Update)
formMenu.addEventListener("submit", async (e) => {
  e.preventDefault();
  btnSaveMenu.disabled = true;
  btnSaveMenu.textContent = "Menyimpan...";

  try {
    let finalImageUrl = menuExistingUrlInput.value;

    // 1. Upload foto jika admin memilih/mengambil foto baru
    if (selectedFileToUpload) {
      btnSaveMenu.textContent = "Mengunggah Foto...";

      const fileExt = selectedFileToUpload.name
        ? selectedFileToUpload.name.split(".").pop()
        : "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `menu/${fileName}`;

      const { data: uploadData, error: uploadErr } = await supa.storage
        .from("menu-images")
        .upload(filePath, selectedFileToUpload);

      if (uploadErr) throw uploadErr;

      // Ambil Public URL Supabase Storage
      const {
        data: { publicUrl },
      } = supa.storage.from("menu-images").getPublicUrl(filePath);

      finalImageUrl = publicUrl;
    }

    const isEdit = Boolean(menuIdInput.value);
    const menuTitle = menuNameInput.value.trim();

    const payload = {
      nama: menuTitle,
      kategori_id: Number(menuKategoriSelect.value),
      harga: Number(menuPriceInput.value),
      deskripsi: menuDescInput.value.trim() || null,
      gambar_url: finalImageUrl || null,
    };

    if (isEdit) {
      const { error } = await supa
        .from("produk")
        .update(payload)
        .eq("id", menuIdInput.value);
      if (error) throw error;
      showToast(`Menu "${menuTitle}" berhasil diperbarui!`);
    } else {
      payload.tersedia = true;
      const { error } = await supa.from("produk").insert([payload]);
      if (error) throw error;
      showToast(`Menu "${menuTitle}" berhasil ditambahkan!`);
    }

    closeMenuModal();
    loadAdminProducts();
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan menu: " + err.message, true);
  } finally {
    btnSaveMenu.disabled = false;
    btnSaveMenu.textContent = "Simpan Menu";
  }
});

// Hapus Menu
window.deleteMenu = async function (id, name) {
  if (confirm(`Yakin ingin menghapus menu "${name}"?`)) {
    const { error } = await supa.from("produk").delete().eq("id", id);
    if (error) alert("Gagal menghapus: " + error.message);
    else loadAdminProducts();
  }
};

checkAuth();
