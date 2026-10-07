// State Global Aplikasi
let mataKuliahList = JSON.parse(localStorage.getItem('mk_list')) || [
    { kode: 'IF2101', nama: 'Pemrograman Web' },
    { kode: 'IF2102', nama: 'Struktur Data & Algoritma' },
    { kode: 'IF2103', nama: 'Basis Data Lanjut' }
];
let absensiList = JSON.parse(localStorage.getItem('mhs_absen')) || [];
let mahasiswaData = JSON.parse(localStorage.getItem('mhs_profil')) || null;

// PIN Admin/Dosen (Default: 1234)
let adminPin = localStorage.getItem('admin_pin') || '1234';
let html5QrCode = null;

// Fungsi Pilih Peran dengan Proteksi PIN untuk Dosen
function pilihPeran(peran) {
    if (peran === 'dosen') {
        let inputPin = prompt("🔒 Masukkan PIN Akses Dosen / Admin:\n(Default PIN awal: 1234)");
        
        if (inputPin === null) return; // Batal jika klik cancel

        if (inputPin !== adminPin) {
            alert("❌ PIN Salah! Akses ke Portal Dosen ditolak.");
            return;
        }
    }

    document.getElementById('view-landing').classList.add('hidden');
    document.getElementById('view-app').classList.remove('hidden');

    const badge = document.getElementById('role-title-badge');
    const secDosen = document.getElementById('section-dosen');
    const secMhs = document.getElementById('section-mahasiswa');
    const btnGantiPin = document.getElementById('btn-ganti-pin');

    if (peran === 'dosen') {
        badge.innerText = "Mode Dosen (Privat & Terproteksi)";
        secDosen.classList.remove('hidden');
        secMhs.classList.add('hidden');
        btnGantiPin.classList.remove('hidden');
        renderMataKuliah();
        renderAbsensi();
        updateDropdownMK();
    } else {
        badge.innerText = "Mode Portal Mahasiswa";
        secMhs.classList.remove('hidden');
        secDosen.classList.add('hidden');
        btnGantiPin.classList.add('hidden');
        if (mahasiswaData) {
            muatKartuMahasiswaKeTampilan();
        }
    }
}

function kembaliKeHome() {
    hentikanScan();
    document.getElementById('view-app').classList.add('hidden');
    document.getElementById('view-landing').classList.remove('hidden');
}

// Fitur Ganti PIN Dosen
function ubahPinDosen() {
    let pinLama = prompt("Masukkan PIN saat ini:");
    if (pinLama === adminPin) {
        let pinBaru = prompt("Masukkan PIN Baru (minimal 4 karakter):");
        if (pinBaru && pinBaru.length >= 4) {
            adminPin = pinBaru;
            localStorage.setItem('admin_pin', adminPin);
            alert("✅ PIN Berhasil diubah!");
        } else {
            alert("❌ PIN baru minimal 4 karakter.");
        }
    } else if (pinLama !== null) {
        alert("❌ PIN lama salah!");
    }
}

// ================= LOGIKA DOSEN =================
function tambahMataKuliah(e) {
    e.preventDefault();
    const kode = document.getElementById('mk-kode').value.trim().toUpperCase();
    const nama = document.getElementById('mk-nama').value.trim();

    if (mataKuliahList.some(mk => mk.kode === kode)) {
        alert('Kode mata kuliah sudah ada!');
        return;
    }

    mataKuliahList.push({ kode, nama });
    localStorage.setItem('mk_list', JSON.stringify(mataKuliahList));

    document.getElementById('form-tambah-mk').reset();
    renderMataKuliah();
    updateDropdownMK();
}

function hapusMataKuliah(kode) {
    if (confirm(`Hapus mata kuliah ${kode}?`)) {
        mataKuliahList = mataKuliahList.filter(mk => mk.kode !== kode);
        localStorage.setItem('mk_list', JSON.stringify(mataKuliahList));
        renderMataKuliah();
        updateDropdownMK();
    }
}

function renderMataKuliah() {
    const container = document.getElementById('list-mk-badge');
    if (!container) return;
    if (mataKuliahList.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-400">Belum ada mata kuliah.</span>`;
        return;
    }
    container.innerHTML = mataKuliahList.map(mk => `
        <div class="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
            <span class="font-bold text-indigo-600">${mk.kode}</span>
            <span>${mk.nama}</span>
            <button onclick="hapusMataKuliah('${mk.kode}')" class="text-slate-400 hover:text-rose-600 ml-1"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

function updateDropdownMK() {
    const select = document.getElementById('scanner-mk');
    if (!select) return;
    select.innerHTML = `<option value="">-- Pilih Mata Kuliah --</option>` +
        mataKuliahList.map(mk => `<option value="${mk.kode}">${mk.kode} - ${mk.nama}</option>`).join('');
}

// Scanner Kamera Dosen
function mulaiScan() {
    const kodeMk = document.getElementById('scanner-mk').value;
    if (!kodeMk) {
        alert('Silakan pilih mata kuliah yang sedang berlangsung terlebih dahulu!');
        return;
    }

    const statusEl = document.getElementById('scan-status');
    statusEl.className = "text-xs text-center font-medium text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200";
    statusEl.innerText = "Mengaktifkan kamera...";

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
            handleScanSuccess(decodedText, kodeMk);
        },
        (errorMessage) => {}
    ).catch(err => {
        statusEl.className = "text-xs text-center font-medium text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200";
        statusEl.innerText = "Gagal mengakses kamera. Pastikan izin kamera browser diaktifkan.";
    });

    statusEl.className = "text-xs text-center font-medium text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200";
    statusEl.innerText = "Kamera aktif. Silakan arahkan ke QR Code Kartu Mahasiswa.";
}

function hentikanScan() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            const statusEl = document.getElementById('scan-status');
            if (statusEl) {
                statusEl.className = "text-xs text-center font-medium text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100";
                statusEl.innerText = "Kamera dihentikan.";
            }
        }).catch(err => {});
    }
}

function handleScanSuccess(decodedText, kodeMk) {
    try {
        let dataMhs = JSON.parse(decodedText);
        let nim = dataMhs.nim;
        let nama = dataMhs.nama;

        const mkObj = mataKuliahList.find(m => m.kode === kodeMk);
        const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const sudahAbsen = absensiList.some(a => a.nim === nim && a.kodeMk === kodeMk);
        if (sudahAbsen) {
            const statusEl = document.getElementById('scan-status');
            statusEl.className = "text-xs text-center font-medium text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200";
            statusEl.innerText = `⚠️ ${nama} (${nim}) sudah tercatat hadir sebelumnya!`;
            return;
        }

        absensiList.unshift({
            waktu,
            kodeMk,
            namaMk: mkObj.nama,
            nim,
            nama,
            status: 'Hadir'
        });

        localStorage.setItem('mhs_absen', JSON.stringify(absensiList));
        renderAbsensi();

        const statusEl = document.getElementById('scan-status');
        statusEl.className = "text-xs text-center font-medium text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200";
        statusEl.innerText = `✅ Berhasil Absen: ${nama} (${nim})`;

    } catch (e) {
        const statusEl = document.getElementById('scan-status');
        statusEl.className = "text-xs text-center font-medium text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200";
        statusEl.innerText = "❌ Format QR Code tidak valid!";
    }
}

function renderAbsensi() {
    const tbody = document.getElementById('tabel-absen-body');
    if (!tbody) return;
    if (absensiList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-400">Belum ada mahasiswa yang diabsen.</td></tr>`;
        return;
    }
    tbody.innerHTML = absensiList.map(a => `
        <tr class="hover:bg-slate-50/80 transition">
            <td class="p-3.5 text-slate-500 text-xs">${a.waktu}</td>
            <td class="p-3.5 font-medium text-slate-700">${a.namaMk}</td>
            <td class="p-3.5 font-mono font-semibold text-indigo-600">${a.nim}</td>
            <td class="p-3.5 font-medium text-slate-800">${a.nama}</td>
            <td class="p-3.5 text-center"><span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-semibold">${a.status}</span></td>
        </tr>
    `).join('');
}

function resetAbsen() {
    if (confirm('Bersihkan seluruh log kehadiran sesi ini?')) {
        absensiList = [];
        localStorage.removeItem('mhs_absen');
        renderAbsensi();
    }
}

// ================= LOGIKA MAHASISWA =================
function simpanKartuMahasiswa(e) {
    e.preventDefault();
    const nim = document.getElementById('mhs-input-nim').value.trim();
    const nama = document.getElementById('mhs-input-nama').value.trim();
    const kelas = document.getElementById('mhs-input-kelas').value.trim();

    mahasiswaData = {
        nim,
        nama,
        kelas,
        qrPayload: JSON.stringify({ nim, nama })
    };

    localStorage.setItem('mhs_profil', JSON.stringify(mahasiswaData));
    muatKartuMahasiswaKeTampilan();
}

function muatKartuMahasiswaKeTampilan() {
    const formEl = document.getElementById('form-mhs-single');
    if (formEl) formEl.parentElement.classList.add('hidden');
    
    const kartuContainer = document.getElementById('kartu-digital-container');
    if (kartuContainer) kartuContainer.classList.remove('hidden');

    document.getElementById('display-nama').innerText = mahasiswaData.nama;
    document.getElementById('display-nim').innerText = mahasiswaData.nim;
    document.getElementById('display-kelas').innerText = mahasiswaData.kelas;

    const qrEl = document.getElementById('qrcode-mahasiswa-besar');
    qrEl.innerHTML = ''; 
    new QRCode(qrEl, {
        text: mahasiswaData.qrPayload,
        width: 180,
        height: 180,
        colorDark : "#0f172a",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
    });
}

function editKartuMahasiswa() {
    localStorage.removeItem('mhs_profil');
    mahasiswaData = null;
    document.getElementById('kartu-digital-container').classList.add('hidden');
    document.getElementById('form-mhs-single').parentElement.classList.remove('hidden');
}