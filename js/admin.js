const daftarAdmin = { 'admin': 'admin123', 'admin2': 'admin2123' };
const PAGE_SIZE = 10;

let halamanAktif = 1;
let halamanRiwayat = 1;

window.onload = function () {
    const u = sessionStorage.getItem('activeAdmin');
    if (u) tampilkanDashboard(u);
};

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const u = document.getElementById('adminUsername').value.trim();
    const p = document.getElementById('adminPassword').value;

    if (daftarAdmin[u] && daftarAdmin[u] === p) {
        sessionStorage.setItem('activeAdmin', u);
        tampilkanDashboard(u);
    } else {
        showToast('❌ Username/Password Salah!');
        document.getElementById('adminPassword').value = '';
    }
});

function tampilkanDashboard(user) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    document.getElementById('adminGreeting').innerHTML = `👤 ${user}`;
    renderTable();
    renderRiwayat();
}

function logoutAdmin() {
    sessionStorage.removeItem('activeAdmin');
    window.location.reload();
}

function zoomImage(src) {
    document.getElementById('modalImg').src = src;
    document.getElementById('imgModal').style.display = 'flex';
}

function getFormattedDate() {
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    const d = new Date();
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}.${String(d.getMinutes()).padStart(2,'0')}`;
}

// ─── Modal Konfirmasi & Toast Kustom ────────────────────────────────────────
// Menggantikan confirm()/alert() bawaan browser, yang bisa otomatis
// diblokir browser ("Prevent this page from creating additional dialogs")
// kalau dipanggil berkali-kali dalam waktu singkat.
function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmModalMessage');
        const okBtn = document.getElementById('confirmModalOk');
        const cancelBtn = document.getElementById('confirmModalCancel');

        msgEl.textContent = message;
        overlay.classList.remove('hidden');

        function cleanup(result) {
            overlay.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById('adminToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('is-hidden');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('is-hidden'), 2500);
}

// ─── Arsip Laporan yang Dihapus ────────────────────────────────────────────────
function getArchiveData() {
    try {
        const stored = localStorage.getItem('arsipDihapus');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Gagal membaca arsip laporan:', error);
        return [];
    }
}

function saveArchiveData(arsip) {
    localStorage.setItem('arsipDihapus', JSON.stringify(arsip));
}

// ─── Info Baris Laporan (dipakai tabel aktif & riwayat) ────────────────────────
function buildBarisInfo(item) {
    const gmapsLink = item.lat && item.lng
        ? `<a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" class="gmaps-link">📍 Buka di Maps</a>`
        : '';
    const fotoTag = item.foto
        ? `<br><img src="${item.foto}" class="img-preview" alt="Foto Bukti" onclick="zoomImage('${item.foto}')">`
        : '';

    return `
        <td><small>${item.waktu}</small></td>
        <td>
            <strong>${item.namaPelapor || '-'}</strong><br>
            <small>📞 ${item.noHpPelapor || '-'}</small>
        </td>
        <td>
            <strong>${item.kampung} RT/RW ${item.rtrw}</strong><br>
            <small>Kel. ${item.kelurahan}, Kec. ${item.kecamatan}</small><br>
            ${gmapsLink}
        </td>
        <td>
            <p style="margin:0; font-size:0.9rem;">${item.deskripsi}</p>
            ${fotoTag}
        </td>`;
}

// ─── Pagination ─────────────────────────────────────────────────────────────
function paginate(items, page) {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return {
        pageItems: items.slice(start, start + PAGE_SIZE),
        safePage,
        totalPages
    };
}

function renderPaginationBar(containerId, safePage, totalPages, onPrev, onNext) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (totalPages <= 1) {
        el.innerHTML = '';
        return;
    }

    el.innerHTML = `
        <button type="button" class="pagination-btn" id="${containerId}-prev" ${safePage === 1 ? 'disabled' : ''}>‹</button>
        <span class="pagination-info">Halaman ${safePage} dari ${totalPages}</span>
        <button type="button" class="pagination-btn" id="${containerId}-next" ${safePage === totalPages ? 'disabled' : ''}>›</button>
    `;

    const prevBtn = document.getElementById(`${containerId}-prev`);
    const nextBtn = document.getElementById(`${containerId}-next`);
    if (prevBtn) prevBtn.addEventListener('click', onPrev);
    if (nextBtn) nextBtn.addEventListener('click', onNext);
}

// ─── Tabel Data Laporan Aktif ───────────────────────────────────────────────
function renderTable() {
    const data = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    const body = document.getElementById('tabelBody');
    const aktifData = data.filter(item => item.status !== 'selesai');
    const selesaiData = data.filter(item => item.status === 'selesai');
    const dihapusData = getArchiveData();

    document.getElementById('countAktif').textContent = aktifData.length;
    document.getElementById('countSelesai').textContent = selesaiData.length;
    document.getElementById('countDihapus').textContent = dihapusData.length;

    const totalBadgeAktif = document.getElementById('aktifTotal');
    if (totalBadgeAktif) totalBadgeAktif.textContent = `${aktifData.length} Laporan`;

    if (aktifData.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada laporan aktif.</td></tr>`;
        renderPaginationBar('paginasiAktif', 1, 1, () => {}, () => {});
        return;
    }

    const urutan = [...aktifData].reverse();
    const { pageItems, safePage, totalPages } = paginate(urutan, halamanAktif);
    halamanAktif = safePage;

    body.innerHTML = pageItems.map((item) => `
        <tr>
            ${buildBarisInfo(item)}
            <td><span class="badge-status badge-aktif">⏳ Aktif</span></td>
            <td>
                <div style="display:flex; justify-content:center; gap:5px; flex-wrap:wrap;">
                    <button class="btn-admin btn-admin-success" onclick="tandaiSelesai(${item.id})">Selesai</button>
                    <button class="btn-admin btn-admin-danger" onclick="deleteItem(${item.id})">Hapus</button>
                </div>
            </td>
        </tr>`).join('');

    renderPaginationBar('paginasiAktif', safePage, totalPages,
        () => { halamanAktif = safePage - 1; renderTable(); },
        () => { halamanAktif = safePage + 1; renderTable(); });
}

// ─── Tabel Riwayat (Selesai + Dihapus) ──────────────────────────────────────
function renderRiwayat() {
    const data = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    const body = document.getElementById('tabelRiwayatBody');

    const selesaiData = data
        .filter(item => item.status === 'selesai')
        .map(item => ({ ...item, sumberRiwayat: 'selesai' }));
    const dihapusData = getArchiveData()
        .map(item => ({ ...item, sumberRiwayat: 'dihapus' }));

    const gabungan = [...selesaiData, ...dihapusData]
        .sort((a, b) => (b.id || 0) - (a.id || 0));

    const totalBadge = document.getElementById('riwayatTotal');
    if (totalBadge) totalBadge.textContent = `${gabungan.length} Laporan`;

    if (gabungan.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada riwayat laporan.</td></tr>`;
        renderPaginationBar('paginasiRiwayat', 1, 1, () => {}, () => {});
        return;
    }

    const { pageItems, safePage, totalPages } = paginate(gabungan, halamanRiwayat);
    halamanRiwayat = safePage;

    body.innerHTML = pageItems.map((item) => {
        const isSelesai = item.sumberRiwayat === 'selesai';
        const badge = isSelesai
            ? '<span class="badge-status badge-selesai">✅ Selesai</span>'
            : '<span class="badge-status badge-dihapus">🗑️ Dihapus</span>';

        return `
        <tr>
            ${buildBarisInfo(item)}
            <td>${badge}</td>
            <td>
                <div style="display:flex; justify-content:center; gap:5px; flex-wrap:wrap;">
                    <button class="btn-admin btn-admin-danger" onclick="hapusPermanen(${item.id}, '${item.sumberRiwayat}')">Hapus</button>
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPaginationBar('paginasiRiwayat', safePage, totalPages,
        () => { halamanRiwayat = safePage - 1; renderRiwayat(); },
        () => { halamanRiwayat = safePage + 1; renderRiwayat(); });
}

// ─── Aksi Laporan ───────────────────────────────────────────────────────────
async function tandaiSelesai(id) {
    const setuju = await showConfirm('Apakah Anda yakin ingin menandai laporan ini sebagai SELESAI?');
    if (!setuju) return;

    const data  = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    const index = data.findIndex(item => item.id === id);

    if (index !== -1) {
        data[index].status = 'selesai';
        localStorage.setItem('dataWarga', JSON.stringify(data));
        renderTable();
        renderRiwayat();
        showToast('Laporan berhasil ditandai sebagai selesai!');
    }
}

async function deleteItem(id) {
    const setuju = await showConfirm('Apakah Anda yakin ingin menghapus laporan ini?');
    if (!setuju) return;

    let data  = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    const item = data.find(i => i.id === id);

    if (item) {
        const arsip = getArchiveData();
        arsip.push({ ...item, waktuHapus: getFormattedDate() });
        saveArchiveData(arsip);
    }

    data = data.filter(i => i.id !== id);
    localStorage.setItem('dataWarga', JSON.stringify(data));
    renderTable();
    renderRiwayat();
    showToast('Laporan berhasil dihapus.');
}

async function hapusPermanen(id, sumber) {
    const setuju = await showConfirm('Laporan ini akan dihapus permanen dari riwayat dan tidak bisa dikembalikan. Lanjutkan?');
    if (!setuju) return;

    if (sumber === 'selesai') {
        const data = JSON.parse(localStorage.getItem('dataWarga') || '[]').filter(i => i.id !== id);
        localStorage.setItem('dataWarga', JSON.stringify(data));
    } else {
        const arsip = getArchiveData().filter(i => i.id !== id);
        saveArchiveData(arsip);
    }

    renderTable();
    renderRiwayat();
    showToast('Laporan berhasil dihapus permanen dari riwayat.');
}
