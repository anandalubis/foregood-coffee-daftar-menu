// ====== KREDENSIAL SUPABASE PROJECT BARU ======
const SUPABASE_URL = "https://syzwkduoesyqddwidvkh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WoWkRBNXug-pirkKukA9VQ_SyM9JCqE";
// ===============================================

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBox = document.getElementById("loginBox");
const adminNav = document.getElementById("adminNav");
const queueBoard = document.getElementById("queueBoard");
const formLogin = document.getElementById("formLogin");
const btnLogout = document.getElementById("btnLogout");

function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function formatJam(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ----------------------------------------------------
// 1. CEK SESI LOGIN
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
  loginBox.style.display = "block";
  adminNav.style.display = "none";
  queueBoard.style.display = "none";
}

function showDashboard() {
  loginBox.style.display = "none";
  adminNav.style.display = "flex";
  queueBoard.style.display = "grid";
  loadActiveOrders();
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

btnLogout.addEventListener("click", async () => {
  await supa.auth.signOut();
  showLogin();
});

// ----------------------------------------------------
// 2. AMBIL PESANAN AKTIF (FIFO)
// ----------------------------------------------------
async function loadActiveOrders() {
  // Hanya ambil status yang belum selesai
  const { data: orders, error } = await supa
    .from("pesanan")
    .select(
      `
      id, nomor_antrean, nama_customer, no_wa, total_harga, status, catatan, created_at,
      pesanan_item ( id, nama_produk, qty, subtotal )
    `,
    )
    .in("status", ["menunggu_pembayaran", "diproses", "siap_diambil"])
    .order("created_at", { ascending: true }); // FIFO: Yang paling awal pesan di urutan pertama

  if (error) {
    console.error(error);
    return;
  }

  renderQueue(orders || []);
}

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
      let statusLabel = "Belum Bayar";
      let actionButtons = "";

      if (o.status === "menunggu_pembayaran") {
        badgeClass = "badge-menunggu";
        statusLabel = "Menunggu Bayar";
        actionButtons = `
          <button class="btn-action btn-pay" onclick="updateStatus(${o.id}, 'diproses')">
            Terima Pembayaran
          </button>`;
      } else if (o.status === "diproses") {
        badgeClass = "badge-proses";
        statusLabel = "Sedang Dibuat";
        actionButtons = `
          <button class="btn-action btn-ready" onclick="updateStatus(${o.id}, 'siap_diambil')">
            Siap Diambil / Panggil
          </button>`;
      } else if (o.status === "siap_diambil") {
        badgeClass = "badge-siap";
        statusLabel = "Siap Diambil";
        actionButtons = `
          <button class="btn-action btn-done" onclick="updateStatus(${o.id}, 'selesai')">
            Pesanan Selesai
          </button>`;
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

          <div class="order-items-box">
            ${itemsHtml}
          </div>

          <div class="order-total-row">
            <span>Total Tagihan</span>
            <span>${formatRupiah(o.total_harga)}</span>
          </div>
        </div>

        <div class="order-action-btns">
          ${actionButtons}
        </div>
      </div>`;
    })
    .join("");
}

// ----------------------------------------------------
// 3. UBAH STATUS PESANAN (KASIR / BARISTA ACTION)
// ----------------------------------------------------
window.updateStatus = async function (orderId, newStatus) {
  const { error } = await supa
    .from("pesanan")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) {
    alert("Gagal memperbarui status: " + error.message);
  } else {
    loadActiveOrders();
  }
};

// ----------------------------------------------------
// 4. REALTIME LISTENER SUPABASE
// ----------------------------------------------------
let realtimeChannel = null;

function listenToRealtime() {
  // Cegah duplikasi subscription jika fungsi terpanggil ulang
  if (realtimeChannel) {
    supa.removeChannel(realtimeChannel);
  }

  realtimeChannel = supa
    .channel("pesanan-antrean-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pesanan",
      },
      (payload) => {
        console.log("Perubahan pesanan terdeteksi:", payload);
        loadActiveOrders();
      },
    )
    .subscribe((status, err) => {
      console.log("Status Realtime Supabase:", status);
      if (err) console.error("Realtime Error:", err);
    });
}

checkAuth();
