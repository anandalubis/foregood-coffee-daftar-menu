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

      // Hitung urutan antrean sederhana berdasarkan jumlah pesanan yang ada
      const { count, error: countErr } = await supa
        .from("pesanan")
        .select("*", { count: "exact", head: true });

      if (countErr) throw countErr;

      const queueNumber = (count || 0) + 1;

      // 1. Simpan header pesanan
      const { data: newOrder, error: orderErr } = await supa
        .from("pesanan")
        .insert([
          {
            nomor_antrean: queueNumber,
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

      // Tampilkan tiket nomor antrean
      if (ticketNumberEl)
        ticketNumberEl.textContent = `#${String(queueNumber).padStart(3, "0")}`;
      if (ticketCustomerEl) ticketCustomerEl.textContent = name;
      if (ticketTotalEl) ticketTotalEl.textContent = formatRupiah(totalHarga);

      closeCartModal();
      if (queueOverlay) queueOverlay.classList.add("show");

      // Reset form dan keranjang
      cart = [];
      if (custNameInput) custNameInput.value = "";
      if (custWaInput) custWaInput.value = "";
      if (custNoteInput) custNoteInput.value = "";
      updateCartUI();
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
    <div class="sheet-imgbox">
      <button class="closebtn" id="closeBtn" aria-label="Tutup">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6 6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      </button>
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
          "id, nama, harga, deskripsi, gambar_url, kategori:kategori_id(nama)",
        )
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
