// ─── Peta Utama ───────────────────────────────────────────────────────────────
const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    tap: true
}).setView([-6.5950, 106.8166], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;

// Tombol GPS
const geoBtn = L.control({ position: 'topright' });
geoBtn.onAdd = function () {
    const div     = L.DomUtil.create('div', 'btn-geo');
    div.innerHTML = '📍 Lokasi Saya';
    div.onclick   = function () {
        map.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true, timeout: 10000 });
    };
    div.onmousedown = function (e) { e.preventDefault(); };
    return div;
};
geoBtn.addTo(map);

map.on('locationfound', function (e) {
    updateMarker(e.latlng.lat, e.latlng.lng, 'Lokasi terdeteksi');
    fetchAddressData(e.latlng.lat, e.latlng.lng, false);
});

map.on('locationerror', function () {
    alert('Gagal mendeteksi lokasi. Pastikan GPS aktif di pengaturan HP Anda.');
});

map.on('click', function (e) {
    updateMarker(e.latlng.lat, e.latlng.lng, 'Mencari lokasi...');
    fetchAddressData(e.latlng.lat, e.latlng.lng, false);
});

function updateMarker(lat, lng, address = 'Mengambil alamat...') {
    if (marker) map.removeLayer(marker);
    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>Lokasi Terpilih</b><br>${address}`).openPopup();
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;
}

// ─── Geocoding (Nominatim) ─────────────────────────────────────────────────────
async function fetchAddressData(lat, lng, isEdit = false) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data    = await response.json();
        const address = data.address || {};

        const kampung     = address.road         || address.neighbourhood || address.residential || '';
        const kelurahan   = address.village       || address.suburb        || address.quarter     || '';
        const kecamatanVal = address.city_district || address.town          || address.county      || '';

        if (!isEdit) {
            document.getElementById('kampung').value   = kampung;
            document.getElementById('kelurahan').value = kelurahan;

            const kecSelect = document.getElementById('kecamatan');
            Array.from(kecSelect.options).forEach(opt => {
                if (kecamatanVal.toLowerCase().includes(opt.value.toLowerCase())) {
                    kecSelect.value = opt.value;
                }
            });
            updateMarker(lat, lng, data.display_name || 'Lokasi terpilih');
        } else {
            document.getElementById('editKampungWarga').value   = kampung;
            document.getElementById('editKelurahanWarga').value = kelurahan;

            const kecSelect = document.getElementById('editKecamatanWarga');
            Array.from(kecSelect.options).forEach(opt => {
                if (kecamatanVal.toLowerCase().includes(opt.value.toLowerCase())) {
                    kecSelect.value = opt.value;
                }
            });
            updateMarkerEdit(lat, lng, data.display_name || 'Lokasi terpilih');
        }
    } catch (err) {
        console.error('fetchAddressData error:', err);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFormattedDate() {
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    const d = new Date();
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,'0')}.${String(d.getMinutes()).padStart(2,'0')}`;
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader    = new FileReader();
        reader.onload   = () => resolve(reader.result);
        reader.onerror  = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function showToast() {
    const t = document.getElementById('toast');
    t.className = 'show';
    setTimeout(() => { t.className = ''; }, 3000);
}

// ─── Render Daftar Laporan ────────────────────────────────────────────────────
function buildLaporCard(item, laporanku) {
    const isSelesai = item.status === 'selesai';
    const tmbEdit = (laporanku.includes(item.id) && !isSelesai)
        ? `<button class="btn-edit-warga" onclick="openEditWarga(${item.id})">Ubah Laporan</button>`
        : '';
    const stempel = isSelesai
        ? '<span class="badge-status badge-selesai">✅ Selesai</span>'
        : '<span class="badge-status badge-aktif">⏳ Diproses</span>';
    const imgHtml = item.foto
        ? `<img src="${item.foto}" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:10px;">`
        : '';
    const gmapsLink = item.lat && item.lng
        ? `<br><a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" class="gmaps-link">📍 Buka di Maps</a>`
        : '';

    return `
    <div class="laporan-card" style="${isSelesai ? 'border-left-color:#10b981;' : ''}">
        <div style="display:flex; justify-content:space-between;">
            <strong>📍 Kec. ${item.kecamatan}</strong>
            ${stempel}
        </div>
        <small style="color:#666;">📅 ${item.waktu}</small>
        <p style="margin-top:8px;">${item.deskripsi}</p>
        <p style="margin-top:5px; font-size:0.85rem; color:#555;">
            Lokasi: ${item.kampung} RT/RW ${item.rtrw}, Kel. ${item.kelurahan}${gmapsLink}
        </p>
        ${imgHtml}
        <div style="margin-top:10px;">${tmbEdit}</div>
    </div>`;
}

function render() {
    const data      = JSON.parse(localStorage.getItem('dataWarga')       || '[]');
    const laporanku = JSON.parse(localStorage.getItem('riwayatLaporanku') || '[]');

    // Laporan aktif tampil di "Laporan Terkini", laporan yang sudah selesai
    // dipindah ke "Riwayat Laporan Selesai" (tetap tampil, lengkap dengan
    // link Buka di Maps), sementara laporan yang sudah dihapus admin
    // memang tidak lagi ada di dataWarga sama sekali.
    const aktifData   = data.filter(item => item.status !== 'selesai');
    const selesaiData = data.filter(item => item.status === 'selesai');

    const cardsAktif = [...aktifData].reverse()
        .map(item => buildLaporCard(item, laporanku)).join('');
    const cardsSelesai = [...selesaiData].reverse()
        .map(item => buildLaporCard(item, laporanku)).join('');

    const aktifHtml = cardsAktif || `<p class="text-muted" style="margin-top:10px;">Belum ada laporan aktif.</p>`;
    const riwayatHtml = cardsSelesai || `<p class="text-muted" style="margin-top:10px;">Belum ada laporan yang selesai diproses.</p>`;

    document.getElementById('daftarLaporan').innerHTML = `
        <h3 style="margin-top:30px; margin-bottom:15px; color:var(--primary);">Laporan Terkini</h3>
        ${aktifHtml}
        <h3 style="margin-top:30px; margin-bottom:15px; color:var(--primary);">Riwayat Laporan Selesai</h3>
        ${riwayatHtml}
    `;
}

// ─── Submit Form Laporan ──────────────────────────────────────────────────────
document.getElementById('laporForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput  = document.getElementById('fotoLaporan');
    const fotoBase64 = fileInput.files.length > 0 ? await getBase64(fileInput.files[0]) : '';

    const laporan = {
        id:          Date.now(),
        waktu:       getFormattedDate(),
        namaPelapor: document.getElementById('namaPelapor').value,
        noHpPelapor: document.getElementById('noHpPelapor').value,
        lokasi:      `${document.getElementById('kampung').value} RT/RW ${document.getElementById('rtrw').value}, Kel. ${document.getElementById('kelurahan').value}, Kec. ${document.getElementById('kecamatan').value}`,
        deskripsi:   document.getElementById('deskripsi').value,
        lat:         document.getElementById('lat').value,
        lng:         document.getElementById('lng').value,
        status:      'aktif',
        kecamatan:   document.getElementById('kecamatan').value,
        kelurahan:   document.getElementById('kelurahan').value,
        kampung:     document.getElementById('kampung').value,
        rtrw:        document.getElementById('rtrw').value,
        foto:        fotoBase64
    };

    const data = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    data.push(laporan);
    localStorage.setItem('dataWarga', JSON.stringify(data));

    const laporanku = JSON.parse(localStorage.getItem('riwayatLaporanku') || '[]');
    laporanku.push(laporan.id);
    localStorage.setItem('riwayatLaporanku', JSON.stringify(laporanku));

    document.getElementById('laporForm').reset();
    if (marker) map.removeLayer(marker);
    render();
    showToast();
});

// ─── Modal Edit Warga ─────────────────────────────────────────────────────────
let mapEdit;
let markerEdit;

function updateMarkerEdit(lat, lng, address = 'Mengambil alamat...') {
    if (markerEdit) mapEdit.removeLayer(markerEdit);
    markerEdit = L.marker([lat, lng]).addTo(mapEdit);
    markerEdit.bindPopup(`<b>Lokasi Baru</b><br>${address}`).openPopup();
    document.getElementById('editLatWarga').value = lat;
    document.getElementById('editLngWarga').value = lng;
}

function openEditWarga(id) {
    const data = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    const l    = data.find(i => i.id === id);
    if (!l) return;

    document.getElementById('editIdWarga').value         = id;
    document.getElementById('editKecamatanWarga').value  = l.kecamatan;
    document.getElementById('editKelurahanWarga').value  = l.kelurahan;
    document.getElementById('editKampungWarga').value    = l.kampung;
    document.getElementById('editRtrwWarga').value       = l.rtrw;
    document.getElementById('editNamaPelaporWarga').value = l.namaPelapor || '';
    document.getElementById('editNoHpPelaporWarga').value = l.noHpPelapor || '';
    document.getElementById('editDeskripsiWarga').value  = l.deskripsi;
    document.getElementById('editLatWarga').value        = l.lat;
    document.getElementById('editLngWarga').value        = l.lng;
    document.getElementById('editFotoLaporan').value     = '';

    // Fix: set display dulu, lalu tambahkan class 'show' di frame berikutnya
    // agar CSS transition opacity bisa berjalan dengan benar
    const modal = document.getElementById('modalEditWarga');
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show'));

    if (!mapEdit) {
        mapEdit = L.map('mapEdit').setView([-6.5950, 106.8166], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapEdit);
        mapEdit.on('click', function (e) {
            fetchAddressData(e.latlng.lat, e.latlng.lng, true);
        });
    }

    setTimeout(() => {
        mapEdit.invalidateSize();
        if (l.lat) {
            mapEdit.setView([l.lat, l.lng], 16);
            updateMarkerEdit(l.lat, l.lng, 'Lokasi Laporan');
        }
    }, 300);
}

function closeEditWarga() {
    const modal = document.getElementById('modalEditWarga');
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

async function saveEditWarga() {
    const id   = parseInt(document.getElementById('editIdWarga').value);
    const data = JSON.parse(localStorage.getItem('dataWarga') || '[]');
    const idx  = data.findIndex(i => i.id === id);
    if (idx === -1) return;

    data[idx].kecamatan   = document.getElementById('editKecamatanWarga').value;
    data[idx].kelurahan   = document.getElementById('editKelurahanWarga').value;
    data[idx].kampung     = document.getElementById('editKampungWarga').value;
    data[idx].rtrw        = document.getElementById('editRtrwWarga').value;
    data[idx].namaPelapor = document.getElementById('editNamaPelaporWarga').value;
    data[idx].noHpPelapor = document.getElementById('editNoHpPelaporWarga').value;
    data[idx].deskripsi   = document.getElementById('editDeskripsiWarga').value;
    data[idx].lat         = document.getElementById('editLatWarga').value;
    data[idx].lng         = document.getElementById('editLngWarga').value;
    data[idx].lokasi      = `${data[idx].kampung} RT/RW ${data[idx].rtrw}, Kel. ${data[idx].kelurahan}, Kec. ${data[idx].kecamatan}`;

    const fileInput = document.getElementById('editFotoLaporan');
    if (fileInput.files.length > 0) {
        data[idx].foto = await getBase64(fileInput.files[0]);
    }

    localStorage.setItem('dataWarga', JSON.stringify(data));
    render();
    closeEditWarga();
    showToast();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
render();
