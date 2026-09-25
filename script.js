// ====== ISI SESUAI PROJECT SUPABASE KAMU ======
const SUPABASE_URL = "https://syzwkduoesyqddwidvkh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WoWkRBNXug-pirkKukA9VQ_SyM9JCqE";
// ===============================================

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allProducts = [];
let categories = [];
let cart = [];
let activeCategory = "Semua";
let searchQuery = "";

// Elemen DOM Katalog
const gridEl = document.getElementById("grid");
const pillRowEl = document.getElementById("pillRow");
const searchInput = document.getElementById("searchInput");
const overlay = document.getElementById("overlay");
const sheet = document.getElementById("sheet");

// Elemen DOM Keranjang & Checkout
const cartBar = document.getElementById("cartBar");
const cartCountEl = document.getElementById("cartCount");
const cartTotalPriceEl = document.getElementById("cartTotalPrice");
const btnOpenCart = document.getElementById("btnOpenCart");

const cartOverlay = document.getElementById("cartOverlay");
const cartSheet = document.getElementById("cartSheet");
const btnCloseCart = document.getElementById("btnCloseCart");
const cartItemsList = document.getElementById("cartItemsList");
const sheetTotalPriceEl = document.getElementById("sheetTotalPrice");
const btnSubmitOrder = document.getElementById("btnSubmitOrder");
const custNameInput = document.getElementById("custName");
const custWaInput = document.getElementById("custWa");
const custNoteInput = document.getElementById("custNote");

// Elemen DOM Tiket Antrean
const queueOverlay = document.getElementById("queueOverlay");
const ticketNumberEl = document.getElementById("ticketNumber");
const ticketCustomerEl = document.getElementById("ticketCustomer");
const ticketTotalEl = document.getElementById("ticketTotal");
const btnCloseTicket = document.getElementById("btnCloseTicket");

// Elemen Tracker Pesanan
const floatingTrackerPill = document.getElementById("floatingTrackerPill");
const floatingPillText = document.getElementById("floatingPillText");
const ticketBadge = document.getElementById("ticketBadge");
const ticketInstructionText = document.getElementById("ticketInstructionText");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const line1 = document.getElementById("line1");
const line2 = document.getElementById("line2");

let activeUserOrderId =
  localStorage.getItem("foregood_active_order_id") || null;
let userRealtimeChannel = null;
let productRealtimeChannel = null;

function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function formatBadgeCategory(cat) {
  if (!cat) return "Menu";
  const map = {
    coffee: "Coffee",
    noncoffee: "Non Coffee",
    "non coffee": "Non Coffee",
    "ice cream": "Ice Cream",
    camilan: "Camilan",
    cemilan: "Camilan",
  };
  return map[cat.toLowerCase().trim()] || cat;
}

// ----------------------------------------------------
// LOGIKA KERANJANG BELANJA (CART)
// ----------------------------------------------------
function addToCart(productId, e) {
  if (e) e.stopPropagation();

  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.product.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ product, qty: 1 });
  }

  updateCartUI();
}

const btnClearCart = document.getElementById("btnClearCart");
const confirmClearOverlay = document.getElementById("confirmClearOverlay");
const btnCancelClear = document.getElementById("btnCancelClear");
const btnExecuteClear = document.getElementById("btnExecuteClear");

// 1. Buka Modal Konfirmasi
if (btnClearCart) {
  btnClearCart.addEventListener("click", () => {
    if (cart.length === 0) return;
    if (confirmClearOverlay) confirmClearOverlay.classList.add("show");
  });
}

// 2. Tutup / Batalkan Modal
if (btnCancelClear) {
  btnCancelClear.addEventListener("click", () => {
    if (confirmClearOverlay) confirmClearOverlay.classList.remove("show");
  });
}

// 3. Eksekusi Pengosongan Keranjang
if (btnExecuteClear) {
  btnExecuteClear.addEventListener("click", () => {
    // Kosongkan data pesanan
    cart = [];
    updateCartUI();

    // Tutup kedua modal (modal konfirmasi & sheet keranjang)
    if (confirmClearOverlay) confirmClearOverlay.classList.remove("show");
    closeCartModal();

    // Reset input form pembeli
    if (custNameInput) custNameInput.value = "";
    if (custWaInput) custWaInput.value = "";
    if (custNoteInput) custNoteInput.value = "";
  });
}

function updateCartQty(productId, delta) {
  const itemIndex = cart.findIndex((item) => item.product.id === productId);
  if (itemIndex === -1) return;

  cart[itemIndex].qty += delta;

  if (cart[itemIndex].qty <= 0) {
    cart.splice(itemIndex, 1);
  }

  updateCartUI();
  renderCartSheet();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.qty * Number(item.product.harga),
    0,
  );

  if (cartCountEl) cartCountEl.textContent = `${totalItems} Item`;
  if (cartTotalPriceEl) cartTotalPriceEl.textContent = formatRupiah(totalPrice);
  if (sheetTotalPriceEl)
    sheetTotalPriceEl.textContent = formatRupiah(totalPrice);

  if (cartBar) {
    if (totalItems > 0) {
      cartBar.classList.add("show");
    } else {
      cartBar.classList.remove("show");
      closeCartModal();
    }
  }
}

// ----------------------------------------------------
// REALTIME LISTENER UNTUK KATALOG PRODUK
// ----------------------------------------------------
function listenToProductChanges() {
  if (productRealtimeChannel) {
    supa.removeChannel(productRealtimeChannel);
  }

  productRealtimeChannel = supa
    .channel("public-products-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "produk",
      },
      (payload) => {
        console.log("Perubahan produk terdeteksi secara realtime:", payload);

        loadData();

        if (payload.eventType === "UPDATE" && payload.new?.tersedia === false) {
          handleProductSoldOutInCart(payload.new.id, payload.new.nama);
        }
      },
    )
    .subscribe((status) => {
      console.log("Status koneksi Realtime Produk:", status);
    });
}

function handleProductSoldOutInCart(productId, productName) {
  const itemIndex = cart.findIndex((item) => item.product.id === productId);
  if (itemIndex === -1) return;

  cart.splice(itemIndex, 1);
  updateCartUI();
  renderCartSheet();
  alert(
    `Mohon maaf, menu "${productName}" baru saja habis dan dikeluarkan dari keranjang.`,
  );
}

function renderCartSheet() {
  if (!cartItemsList) return;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px 0;">Keranjang masih kosong</p>`;
    return;
  }

  cartItemsList.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item-row">
      <div class="cart-item-detail">
        <div class="cart-item-title">${item.product.nama}</div>
        <div class="cart-item-price">${formatRupiah(item.product.harga)}</div>
      </div>
      <div class="cart-qty-ctrl">
        <button type="button" class="btn-qty" onclick="updateCartQty(${item.product.id}, -1)">−</button>
        <span class="qty-number">${item.qty}</span>
        <button type="button" class="btn-qty" onclick="updateCartQty(${item.product.id}, 1)">+</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function openCartModal() {
  renderCartSheet();
  if (cartOverlay && cartSheet) {
    cartOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
    cartSheet.style.transform = "translateY(0)";
  }
}

function closeCartModal() {
  if (cartOverlay && cartSheet) {
    cartSheet.style.transform = "translateY(100%)";
    cartOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }
}

if (btnOpenCart) btnOpenCart.addEventListener("click", openCartModal);
if (btnCloseCart) btnCloseCart.addEventListener("click", closeCartModal);
if (cartOverlay) {
  cartOverlay.addEventListener("click", (e) => {
    if (e.target === cartOverlay) closeCartModal();
  });
}

// ----------------------------------------------------
// TRACKER STATUS PESANAN REALTIME
// ----------------------------------------------------
function updateOrderTrackerUI(order) {
  if (!order) return;

  const formattedNo = `#${String(order.nomor_antrean).padStart(3, "0")}`;
  if (ticketNumberEl) ticketNumberEl.textContent = formattedNo;
  if (ticketCustomerEl) ticketCustomerEl.textContent = order.nama_customer;
  if (ticketTotalEl)
    ticketTotalEl.textContent = formatRupiah(order.total_harga);

  [step1, step2, step3].forEach((step) =>
    step?.classList.remove("active", "done"),
  );
  [line1, line2].forEach((line) => line?.classList.remove("done"));

  if (order.status === "menunggu_pembayaran") {
    ticketBadge.className = "ticket-badge status-menunggu";
    ticketBadge.textContent = "MENUNGGU PEMBAYARAN";
    step1?.classList.add("active");
    ticketInstructionText.textContent =
      "Silakan tunjukkan nomor antrean ini ke kasir/booth untuk pembayaran Tunai atau scan QRIS.";
    btnCloseTicket.textContent = "Tutup & Kembali ke Menu";
    if (floatingPillText)
      floatingPillText.textContent = `Antrean ${formattedNo} • Menunggu Bayar`;
  } else if (order.status === "diproses") {
    ticketBadge.className = "ticket-badge status-proses";
    ticketBadge.textContent = "SEDANG DIRACIK";
    step1?.classList.add("done");
    line1?.classList.add("done");
    step2?.classList.add("active");
    ticketInstructionText.textContent =
      "Pembayaran diterima! Barista kami sedang meracik pesanan spesialmu. Silakan ditunggu dengan santai ya.";
    btnCloseTicket.textContent = "Tutup (Pesanan Tetap Berjalan)";
    if (floatingPillText)
      floatingPillText.textContent = `Antrean ${formattedNo} • Sedang Diracik`;
  } else if (order.status === "siap_diambil") {
    ticketBadge.className = "ticket-badge status-siap";
    ticketBadge.textContent = "SIAP DIAMBIL!";
    step1?.classList.add("done");
    line1?.classList.add("done");
    step2?.classList.add("done");
    line2?.classList.add("done");
    step3?.classList.add("active");
    ticketInstructionText.innerHTML =
      "<b>Pesananmu sudah siap!</b> Silakan merapat ke booth pengambilan dan sebutkan nomor antrean ini.";
    btnCloseTicket.textContent = "Mengerti";
    if (floatingPillText)
      floatingPillText.textContent = `Antrean ${formattedNo} SIAP DIAMBIL!`;
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
  } else if (order.status === "selesai") {
    ticketBadge.className = "ticket-badge status-selesai";
    ticketBadge.textContent = "PESANAN SELESAI";
    [step1, step2, step3].forEach((step) => step?.classList.add("done"));
    [line1, line2].forEach((line) => line?.classList.add("done"));
    ticketInstructionText.textContent =
      "Pesanan telah selesai diserahkan. Terima kasih sudah menikmati sajian Foregood Coffee!";
    btnCloseTicket.textContent = "Selesai & Kembali ke Menu";
    localStorage.removeItem("foregood_active_order_id");
    activeUserOrderId = null;
    if (floatingTrackerPill) floatingTrackerPill.style.display = "none";
    if (userRealtimeChannel) {
      supa.removeChannel(userRealtimeChannel);
      userRealtimeChannel = null;
    }
  } else {
    return;
  }

  if (floatingTrackerPill && activeUserOrderId) {
    floatingTrackerPill.style.display = "flex";
  }
}

function listenToUserOrder(orderId) {
  if (userRealtimeChannel) supa.removeChannel(userRealtimeChannel);

  userRealtimeChannel = supa
    .channel(`order-track-${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pesanan",
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        console.log("Update status pesanan pelanggan:", payload.new);
        updateOrderTrackerUI(payload.new);
      },
    )
    .subscribe();
}

async function restoreActiveOrder() {
  if (!activeUserOrderId) return;

  const { data: order, error } = await supa
    .from("pesanan")
    .select("id, nomor_antrean, nama_customer, total_harga, status")
    .eq("id", activeUserOrderId)
    .maybeSingle();

  if (error || !order || order.status === "selesai") {
    localStorage.removeItem("foregood_active_order_id");
    activeUserOrderId = null;
    return;
  }

  updateOrderTrackerUI(order);
  listenToUserOrder(order.id);
}

window.reopenTicketModal = function () {
  if (!activeUserOrderId || !queueOverlay) return;
  if (floatingTrackerPill) floatingTrackerPill.style.display = "none";
  queueOverlay.classList.add("show");
  document.body.style.overflow = "hidden";
};

// ----------------------------------------------------
// CHECKOUT & SISTEM ANTREAN (FIFO)
// ----------------------------------------------------
if (btnSubmitOrder) {
  btnSubmitOrder.addEventListener("click", async () => {
    const name = custNameInput ? custNameInput.value.trim() : "";
    const wa = custWaInput ? custWaInput.value.trim() : "";
    const note = custNoteInput ? custNoteInput.value.trim() : "";

    if (!name) {
      alert("Silakan masukkan nama pemesan terlebih dahulu!");
      if (custNameInput) custNameInput.focus();
      return;
    }

    if (cart.length === 0) return;

    btnSubmitOrder.disabled = true;
    btnSubmitOrder.textContent = "Memproses Pesanan...";

    try {
      const totalHarga = cart.reduce(
        (sum, item) => sum + item.qty * Number(item.product.harga),
        0,
      );

      // 1. Ambil waktu terakhir admin menekan tombol reset
      const { data: settingData } = await supa
        .from("pengaturan")
        .select("nilai")
        .eq("kunci", "terakhir_reset_antrean")
        .single();

      const lastResetTime = settingData?.nilai || "1970-01-01T00:00:00Z";

      // 2. Cari nomor antrean tertinggi yang dibuat setelah waktu reset
      const { data: latestOrders, error: latestErr } = await supa
        .from("pesanan")
        .select("nomor_antrean")
        .gte("created_at", lastResetTime)
        .order("nomor_antrean", { ascending: false })
        .limit(1);

      if (latestErr) throw latestErr;

      let nextQueueNumber = 1;

      if (latestOrders && latestOrders.length > 0) {
        nextQueueNumber = Number(latestOrders[0].nomor_antrean) + 1;
      }

      // 1. Simpan header pesanan
      const { data: newOrder, error: orderErr } = await supa
        .from("pesanan")
        .insert([
          {
            nomor_antrean: nextQueueNumber,
            nama_customer: name,
            no_wa: wa || null,
            total_harga: totalHarga,
            metode_pembayaran: "kasir",
            status: "menunggu_pembayaran",
            catatan: note || null,
          },
        ])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Simpan rincian item pesanan
      const orderItems = cart.map((item) => ({
        pesanan_id: newOrder.id,
        produk_id: item.product.id,
        nama_produk: item.product.nama,
        harga_satuan: item.product.harga,
        qty: item.qty,
        subtotal: item.qty * Number(item.product.harga),
      }));

      const { error: itemsErr } = await supa
        .from("pesanan_item")
        .insert(orderItems);

      if (itemsErr) throw itemsErr;

      activeUserOrderId = String(newOrder.id);
      localStorage.setItem("foregood_active_order_id", activeUserOrderId);
      updateOrderTrackerUI(newOrder);
      listenToUserOrder(activeUserOrderId);

      closeCartModal();

      // Reset form dan keranjang
      cart = [];
      if (custNameInput) custNameInput.value = "";
      if (custWaInput) custWaInput.value = "";
      if (custNoteInput) custNoteInput.value = "";
      updateCartUI();

      if (queueOverlay) {
        queueOverlay.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim pesanan. Silakan periksa koneksi internet.");
    } finally {
      btnSubmitOrder.disabled = false;
      btnSubmitOrder.textContent = "Kirim Pesanan Sekarang";
    }
  });
}

if (btnCloseTicket) {
  btnCloseTicket.addEventListener("click", () => {
    if (queueOverlay) queueOverlay.classList.remove("show");
    if (floatingTrackerPill && activeUserOrderId) {
      floatingTrackerPill.style.display = "flex";
    }
    document.body.style.overflow = "";
  });
}

// ----------------------------------------------------
// RENDER KATALOG & DETAIL PRODUK
// ----------------------------------------------------
function renderSkeleton() {
  gridEl.innerHTML = Array.from({ length: 6 })
    .map(
      () => `
    <div class="card skel-card">
      <div class="imgwrap skel"></div>
      <div class="info">
        <div class="skel" style="height:14px;width:70%;border-radius:6px;"></div>
        <div class="skel" style="height:12px;width:40%;border-radius:6px;margin-top:8px;"></div>
      </div>
    </div>`,
    )
    .join("");
}

function renderPills() {
  const priorityOrder = [
    "coffee",
    "non coffee",
    "noncoffee",
    "ice cream",
    "cemilan",
    "camilan",
  ];

  const sortedCategories = categories
    .map((c) => c.nama)
    .sort((a, b) => {
      let indexA = priorityOrder.indexOf(a.toLowerCase().trim());
      let indexB = priorityOrder.indexOf(b.toLowerCase().trim());
      if (indexA === -1) indexA = 99;
      if (indexB === -1) indexB = 99;
      return indexA - indexB;
    });

  const options = ["Semua", ...sortedCategories];

  pillRowEl.innerHTML = options
    .map(
      (cat) => `
    <div class="pill ${cat === activeCategory ? "active" : ""}" data-cat="${cat}">
      ${cat === "Semua" ? cat : formatBadgeCategory(cat)}
    </div>
  `,
    )
    .join("");

  pillRowEl.querySelectorAll(".pill").forEach((el) => {
    el.addEventListener("click", () => {
      activeCategory = el.dataset.cat;
      renderPills();
      renderGrid();
    });
  });
}

function getFiltered() {
  const q = searchQuery.toLowerCase().trim();
  return allProducts.filter((p) => {
    const matchCat =
      activeCategory === "Semua" || p.kategori?.nama === activeCategory;
    const matchQuery = !q || p.nama.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });
}

function renderGrid() {
  const items = getFiltered();

  if (items.length === 0) {
    gridEl.innerHTML = `
      <div class="state-msg">
        <h3>Menu Tidak Ditemukan</h3>
        <p>Coba kata kunci atau kategori lain</p>
      </div>`;
    return;
  }

  gridEl.innerHTML = items
    .map(
      (p) => `
    <div class="card" tabindex="0" data-id="${p.id}">
      <div class="imgwrap">
        <img src="${p.gambar_url || ""}" alt="${p.nama}" loading="lazy" onerror="this.style.opacity=0">
        <span class="badge">${formatBadgeCategory(p.kategori?.nama)}</span>
      </div>
      <div class="info">
        <h3>${p.nama}</h3>
        <div class="meta-row">
          <span class="price">${formatRupiah(p.harga)}</span>
          <button type="button" class="btn-add-card" onclick="addToCart(${p.id}, event)" title="Tambah ke Pesanan">+</button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  gridEl.querySelectorAll(".card").forEach((card) => {
    const open = () => openDetail(Number(card.dataset.id));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") open();
    });
  });
}

function openDetail(id) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;

  sheet.innerHTML = `
    <div class="sheet-drag-area" id="sheetDragArea">
      <div class="grabber"></div>
    </div>
    <div class="sheet-closebar">
      <button class="closebtn" id="closeBtn" aria-label="Tutup">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6 6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="sheet-imgbox">
      <div class="hero">
        <img src="${p.gambar_url || ""}" alt="${p.nama}" onerror="this.style.opacity=0">
      </div>
    </div>
    <div class="body">
      <span class="tag">${formatBadgeCategory(p.kategori?.nama)}</span>
      <div class="sheet-header-row">
        <h2>${p.nama}</h2>
        <div class="price">${formatRupiah(p.harga)}</div>
      </div>
      <div class="sheet-desc-box">
        <div class="sheet-desc-title">Tentang Produk Ini</div>
        <p class="desc ${p.deskripsi ? "" : "empty"}">
          ${p.deskripsi || "Belum ada catatan racikan atau deskripsi sajian untuk menu ini."}
        </p>
      </div>
      <button type="button" class="btn-sheet-add" onclick="addToCart(${p.id}); closeDetail();">
        + Tambah ke Pesanan (${formatRupiah(p.harga)})
      </button>
    </div>
  `;

  overlay.classList.add("show");
  document.body.style.overflow = "hidden";

  sheet.style.transition = "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)";
  sheet.style.transform = "translateY(0)";

  document.getElementById("closeBtn").addEventListener("click", closeDetail);
}

function closeDetail() {
  sheet.style.transition = "transform 0.24s ease";
  sheet.style.transform = "translateY(100%)";
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

// ----------------------------------------------------
// GESTURE SWIPE-DOWN MODAL DETAIL
// ----------------------------------------------------
let startY = 0;
let currentY = 0;
let isDragging = false;

sheet.addEventListener(
  "touchstart",
  (e) => {
    if (sheet.scrollTop <= 0) {
      startY = e.touches[0].clientY;
      isDragging = true;
      sheet.style.transition = "none";
    }
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    if (deltaY > 0) {
      sheet.style.transform = `translateY(${deltaY}px)`;
    }
  },
  { passive: true },
);

window.addEventListener("touchend", () => {
  if (!isDragging) return;
  isDragging = false;
  const deltaY = currentY - startY;
  if (deltaY > 90) {
    closeDetail();
  } else {
    sheet.style.transition = "transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)";
    sheet.style.transform = "translateY(0)";
  }
  startY = 0;
  currentY = 0;
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeDetail();
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderGrid();
});

// ----------------------------------------------------
// LOAD INITIAL DATA
// ----------------------------------------------------
async function loadData() {
  renderSkeleton();
  try {
    const [
      { data: kategoriData, error: kErr },
      { data: produkData, error: pErr },
    ] = await Promise.all([
      supa.from("kategori").select("nama").order("nama"),
      supa
        .from("produk")
        .select(
          "id, nama, harga, deskripsi, gambar_url, tersedia, kategori:kategori_id(nama)",
        )
        .eq("tersedia", true)
        .order("id", { ascending: false }),
    ]);

    if (kErr) throw kErr;
    if (pErr) throw pErr;

    categories = kategoriData || [];
    allProducts = produkData || [];

    renderPills();
    renderGrid();
  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `
      <div class="state-msg">
        <h3>Gagal memuat menu</h3>
        <p>Periksa koneksi internet atau coba lagi nanti.</p>
      </div>`;
  }
}

loadData();
listenToProductChanges();
restoreActiveOrder();
