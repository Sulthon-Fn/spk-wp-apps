# Sistem Pendukung Keputusan (SPK) - Metode Weighted Product (WP)
> **Aplikasi Web SPK Berbasis Client-Side dengan Konsep Modern Light Mode Glassmorphism UI**

Aplikasi Sistem Pendukung Keputusan (SPK) ini dikembangkan untuk membantu pengambilan keputusan multi-kriteria menggunakan metode **Weighted Product (WP)**. Dirancang dengan antarmuka **Light Mode Glassmorphism** yang fluid, responsif, dan elegan, aplikasi ini memproses seluruh data secara *client-side* di browser menggunakan JavaScript modular murni tanpa memerlukan backend server atau database khusus.

---

## 🌟 Fitur Unggulan

- **💎 Desain Light Mode Glassmorphism Translucent**:
  - Tampilan visual modern dengan efek kaca buram (*backdrop blur*), gradien mesh lembut (*slate, teal, emerald*), dan animasi mikro transisi yang halus.
  - Layout adaptif: **Fixed Glass Sidebar** pada layar desktop dan **Off-Canvas Mobile Drawer** pada perangkat smartphone/tablet.
- **⚡ Arsitektur Modular & Tanpa Backend (100% Client-Side)**:
  - Dipisah menjadi 4 modul terstruktur: `wp_engine.js`, `csv_handler.js`, `ui_renderer.js`, dan `app.js`.
  - Berjalan langsung di browser baik via `file://` (double click langsung) maupun lokal web server (`http://localhost`).
- **📁 Integrasi Berkas CSV Fleksibel**:
  - Mendukung upload file picker standar dan interaksi **Drag-and-Drop**.
  - Dilengkapi fitur *Auto-load 5 Supplier Default* saat aplikasi pertama kali dibuka.
  - Dilengkapi *real-time search bar* dan *pagination* dinamis pada tabel preview data.
- **🎛️ Pengaturan Kriteria Dinamis & Interaktif**:
  - Pemetaan (*mapping*) otomatis atau manual untuk kolom Kode dan Nama alternatif.
  - Pengaturan bobot ($W_j$) menggunakan sinkronisasi ganda antara slider visual (1–10) dan number input.
  - Penentuan tipe kriteria secara instan (**Benefit** vs **Cost**) dengan *translucent status badge*.
- **🔍 Transparansi Komputasi Matematis (Step-by-Step)**:
  - Menyajikan proses hitung secara terurai:
    1. **Matriks Keputusan ($X_{ij}$)**.
    2. **Perhitungan Vektor Preferensi ($S_i$)** lengkap dengan formula pemangkatan terurai per alternatif.
    3. **Perhitungan Nilai Preferensi Relatif Vektor ($V_i$)**.
- **🏆 Rekomendasi Pemenang & Ekspor Laporan**:
  - **Glowing Emerald Glass Hero Card** untuk alternatif peringkat pertama (#1) sebagai rekomendasi terbaik.
  - Tabel perangkingan lengkap terurut dari nilai $V_i$ tertinggi ke terendah.
  - Tombol **Export CSV** (dengan UTF-8 BOM untuk kompatibilitas Microsoft Excel) dan tombol **Cetak Laporan / Simpan PDF**.

---

## 📐 Landasan Teori: Metode Weighted Product (WP)

Metode Weighted Product (WP) menggunakan teknik perkalian untuk menghubungkan rating atribut, di mana rating setiap atribut harus dipangkatkan terlebih dahulu dengan bobot atribut yang bersangkutan.

### 1. Normalisasi Bobot Kriteria ($w_j$)
Bobot kepentingan awal ($W_j$) dinormalisasi sehingga total seluruh bobot bernilai 1 ($\sum w_j = 1$):

$$w_j = \frac{W_j}{\sum_{k=1}^{n} W_k}$$

**Ketentuan Pangkat Eksponen:**
- Jika kriteria bertipe **Benefit** (keuntungan): nilai pangkat bernilai positif ($+w_j$).
- Jika kriteria bertipe **Cost** (biaya/ongkos): nilai pangkat bernilai negatif ($-w_j$).

### 2. Perhitungan Vektor Preferensi ($S_i$)
Nilai preferensi untuk setiap alternatif $A_i$ dihitung dengan mengalikan seluruh nilai atribut yang telah dipangkatkan:

$$S_i = \prod_{j=1}^{n} \left(X_{ij}\right)^{w_j}$$

Keterangan:
- $S_i$ = Nilai preferensi vektor S untuk alternatif ke-$i$.
- $X_{ij}$ = Nilai alternatif ke-$i$ pada kriteria ke-$j$.
- $w_j$ = Bobot kriteria ke-$j$ yang telah dinormalisasi ($\pm w_j$).
- $\prod$ = Operasi perkalian beruntun (*product*).

### 3. Perhitungan Preferensi Relatif Vektor ($V_i$)
Nilai vektor $V_i$ digunakan untuk melakukan pemeringkatan akhir. Alternatif dengan nilai $V_i$ terbesar adalah alternatif terbaik:

$$V_i = \frac{S_i}{\sum_{k=1}^{m} S_k}$$

Keterangan:
- $V_i$ = Nilai preferensi relatif alternatif ke-$i$ ($0 < V_i \le 1$).
- $S_i$ = Vektor S alternatif ke-$i$.
- $\sum_{k=1}^{m} S_k$ = Total penjumlahan vektor S seluruh alternatif.
- Total seluruh nilai $V_i$ selalu bernilai 1 ($\sum_{i=1}^{m} V_i = 1$).

---

## 📊 Contoh Studi Kasus: Pemilihan Supplier Material Baja

File sampel bawaan [`sample_supplier_default_5.csv`](sample_supplier_default_5.csv) berisi data 5 supplier dengan 4 kriteria:

| Kode | Nama Supplier | Harga Penawaran ($C_1$) | Kualitas Material ($C_2$) | Keandalan Pengiriman ($C_3$) | Fleksibilitas Pembayaran ($C_4$) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **S001** | PT Krakatau Steel | 4 | 5 | 4 | 3 |
| **S002** | PT Gunung Raja Paksi | 3 | 4 | 3 | 4 |
| **S003** | PT Baja Utama Nusantara | 2 | 3 | 2 | 2 |
| **S004** | CV Sumber Makmur Baja | 5 | 4 | 5 | 3 |
| **S005** | PT Metalindo Jaya | 3 | 5 | 4 | 5 |

**Konfigurasi Bobot & Sifat Kriteria Default:**
1. **Harga Penawaran ($C_1$)**: Bobot = 4, Sifat = **Cost** $\rightarrow w_1 = -4/16 = -0.2500$
2. **Kualitas Material ($C_2$)**: Bobot = 5, Sifat = **Benefit** $\rightarrow w_2 = +5/16 = +0.3125$
3. **Keandalan Pengiriman ($C_3$)**: Bobot = 4, Sifat = **Benefit** $\rightarrow w_3 = +4/16 = +0.2500$
4. **Fleksibilitas Pembayaran ($C_4$)**: Bobot = 3, Sifat = **Benefit** $\rightarrow w_4 = +3/16 = +0.1875$
   *(Total Bobot $\sum W = 16$)*

**Hasil Perangkingan Akhir:**
| Peringkat | Kode | Nama Supplier | Nilai Vektor $S_i$ | Nilai Vektor $V_i$ | Kontribusi % | Status Rekomendasi |
| :---: | :---: | :--- | :---: | :---: | :---: | :--- |
| 🥇 **#1** | **S005** | **PT Metalindo Jaya** | **2.402811** | **0.241856** | **24.19%** | **Sangat Direkomendasikan (Peringkat #1)** |
| 🥈 **#2** | S001 | PT Krakatau Steel | 2.031835 | 0.204515 | 20.45% | Rekomendasi Cadangan (Peringkat #2) |
| 🥉 **#3** | S002 | PT Gunung Raja Paksi | 2.000000 | 0.201311 | 20.13% | Cukup Direkomendasikan (Peringkat #3) |
| **#4** | S004 | CV Sumber Makmur Baja | 1.894977 | 0.190740 | 19.07% | Dipertimbangkan |
| **#5** | S003 | PT Baja Utama Nusantara | 1.605253 | 0.161578 | 16.16% | Dipertimbangkan |

---

## 📁 Struktur Berkas Proyek

```text
spk-wp-apps/
├── index.html                     # Halaman Web UI Utama (Light Glassmorphism)
├── sample_supplier_default_5.csv  # Berkas dataset default 5 supplier
├── README.md                      # Dokumentasi dan panduan lengkap aplikasi
└── js/
    ├── wp_engine.js               # Engine murni matematis metode WP
    ├── csv_handler.js             # Parser CSV (PapaParse), dropzone, & ekspor
    ├── ui_renderer.js             # Renderer DOM dinamis, pagination, & visual cards
    └── app.js                     # State controller, event listeners, & workflow
```

### Rincian Modul JavaScript:
1. [`js/wp_engine.js`](js/wp_engine.js):
   - `normalizeWeights(kriteria)`: Menghitung bobot ternormalisasi $w_j$ serta penyesuaian tanda eksponen $+/-$.
   - `calculateVectorS(data, kriteria, w_norm)`: Menghitung $S_i = \prod (X_{ij})^{w_j}$ dengan `Math.pow()`.
   - `calculateVectorV(vectorS)`: Menghitung $V_i = S_i / \sum S$.
   - `rankSuppliers(vectorV)`: Mengurutkan alternatif secara *descending* dan memberi label status.
2. [`js/csv_handler.js`](js/csv_handler.js):
   - `parseCSVFile(file)` & `parseCSVString(text)`: Parsing berkas/string CSV menggunakan PapaParse.
   - `loadDefaultData()` & `resetToDefaultData()`: Menjamin pemuatan data default secara aman tanpa terhambat CORS browser.
   - `initDropzone(...)`: Handler interaktif drag & drop.
   - `exportToCSV(data, filename)`: Generator file unduhan CSV dengan format standar.
3. [`js/ui_renderer.js`](js/ui_renderer.js):
   - Merender 4 tab interaktif, stat cards, tabel preview dengan search filter & pagination, kartu slider kriteria, tabel normalisasi bobot, tabel proses komputasi WP, serta hero card peringkat #1.
4. [`js/app.js`](js/app.js):
   - Mengelola state global aplikasi, sinkronisasi perubahan bobot/tipe atribut secara real-time, tab switching, aksi cetak dan reset data.

---

## 🚀 Panduan Cara Pemakaian

### 1. Menjalankan Aplikasi
Anda dapat membuka aplikasi ini dengan dua cara:

- **Cara 1 (Langsung di Browser)**:
  Cukup klik ganda (*double-click*) file [`index.html`](index.html). Aplikasi akan langsung terbuka di browser Anda (Google Chrome, Microsoft Edge, Brave, Mozilla Firefox, dll).
- **Cara 2 (Menggunakan Local Web Server)**:
  Jika menggunakan VS Code, gunakan ekstensi **Live Server**, atau jalankan perintah CLI berikut di folder proyek:
  ```bash
  # Menggunakan Python 3:
  python -m http.server 8000
  
  # Atau menggunakan Node.js npx serve:
  npx serve .
  ```
  Kemudian buka browser di `http://localhost:8000`.

---

### 2. Alur Penggunaan Berdasarkan 4 Tab

#### 📑 Tab 1: Dataset & CSV
1. **Data Default**: Saat aplikasi pertama kali dibuka, data 5 supplier dari `sample_supplier_default_5.csv` otomatis dimuat lengkap dengan hasil perhitungannya.
2. **Unggah Berkas Baru**:
   - Tarik & letakkan (*drag-and-drop*) file `.csv` Anda ke area dropzone berbingkai putus-putus.
   - Atau klik tombol **Pilih Berkas CSV** untuk memilih file dari komputer.
3. **Melihat & Mencari Data**:
   - Periksa ringkasan statistik pada 4 kartu info (Total Alternatif, Total Kriteria, Status Validasi, dan Total Kolom).
   - Gunakan kolom **Pencarian Data** untuk memfilter baris tertentu.
   - Gunakan tombol navigasi halaman (*Pagination*) di bawah tabel jika data berjumlah banyak.
4. Klik tombol **Lanjut: Mapping & Bobot Kriteria** di sudut kanan bawah.

---

#### 🎛️ Tab 2: Kriteria & Bobot
1. **Pemetaan Kolom**:
   - Pastikan **Kolom Kode / ID Alternatif** terarah ke kolom unik (misal: `Kode_Supplier`).
   - Pastikan **Kolom Nama Alternatif** terarah ke nama entitas (misal: `Nama_Supplier`).
2. **Penentuan Tipe Atribut**:
   - Klik tombol **Benefit** jika nilai semakin tinggi semakin diinginkan (contoh: Kualitas, Pengalaman, Garansi).
   - Klik tombol **Cost** jika nilai semakin kecil semakin diinginkan (contoh: Harga, Biaya Operasional, Waktu Tunggu).
3. **Pengaturan Bobot ($W_j$)**:
   - Geser slider atau masukkan angka langsung pada kotak input (skala 1 s.d 10).
   - Seluruh nilai normalisasi bobot $w_j$ akan langsung dihitung ulang otomatis.
4. **Opsi Cepat**:
   - Klik tombol **Bobot Sama** jika ingin memberikan kepentingan setara untuk semua kriteria.
5. Klik tombol **Lanjut: Hitung Komputasi WP**.

---

#### ⚙️ Tab 3: Proses Komputasi WP
Di tab ini Anda dapat memverifikasi kebenaran matematis dari metode Weighted Product:
1. **Langkah 1: Matriks Keputusan ($X_{ij}$)**: Menampilkan rating asli setiap alternatif pada tiap kriteria.
2. **Langkah 2: Perkalian Pangkat Bobot (Vektor $S_i$)**: Menampilkan formula perkalian pemangkatan terurai beserta total penjumlahan $\sum S_i$.
3. **Langkah 3: Preferensi Relatif (Vektor $V_i$)**: Menampilkan pembagian nilai $S_i$ terhadap total $\sum S_k$ beserta persentase preferensinya.
4. Klik tombol **Lihat Hasil Peringkat & Ranking**.

---

#### 🏆 Tab 4: Hasil & Ranking
1. **Peringkat Utama (Rank #1)**:
   - Ditampilkan dalam **Glowing Emerald Glass Hero Card** yang memuat Nama Pemenang, Kode Alternatif, Nilai Vektor V, Persentase Preferensi, dan Nilai Vektor S.
2. **Tabel Perangkingan Lengkap**:
   - Menampilkan urutan prioritas seluruh kandidat dari nomor 1 sampai akhir lengkap dengan medali dan status rekomendasi.
3. **Ekspor & Cetak**:
   - Klik **Export CSV** untuk mengunduh tabel ranking dalam file spreadsheet `.csv`.
   - Klik **Cetak Hasil** untuk membuka dialog cetak browser atau menyimpan laporan sebagai file **PDF**.
4. **Mulai Analisis Baru**:
   - Klik tombol **Mulai Analisis Baru** atau tombol **Reset Data** di header untuk mengembalikan aplikasi ke kondisi awal.

---

## 📋 Ketentuan Format Berkas CSV yang Didukung

Jika Anda ingin mengunggah dataset CSV buatan sendiri, pastikan berkas Anda memenuhi standar berikut:
1. **Ekstensi File**: `.csv` (format teks dipisahkan tanda koma `,`).
2. **Baris Pertama (Header)**: Berisi nama-nama kolom/atribut.
3. **Kolom Identitas**:
   - Minimal memiliki 1 kolom kode/ID alternatif (contoh nama: `Kode`, `Kode_Supplier`, `ID`, `No`).
   - Minimal memiliki 1 kolom nama alternatif (contoh nama: `Nama`, `Nama_Supplier`, `Perusahaan`, `Kandidat`).
4. **Kolom Kriteria**:
   - Kolom kriteria harus berupa angka numerik positif ($X > 0$).
   - Hindari penggunaan simbol non-numerik seperti mata uang `Rp`, titik ribuan, atau huruf di dalam sel nilai kriteria.

**Contoh Format CSV yang Valid:**
```csv
Kode,Nama_Kandidat,Pengalaman_Tahun,Skor_Tes,Gaji_Diminta
K01,Ahmad Pratama,5,85,6000000
K02,Budi Santoso,3,90,5500000
K03,Citra Dewi,4,88,5800000
```

---

## 🛠️ Dependensi & Teknologi yang Digunakan

Aplikasi ini menggunakan pustaka eksternal resmi berbasis Content Delivery Network (CDN) tanpa instalasi lokal yang rumit:

| Komponen | Sumber CDN | Kegunaan |
| :--- | :--- | :--- |
| **Tailwind CSS** | `cdn.tailwindcss.com` | Framework utilitas CSS untuk styling Light Glassmorphism |
| **Lucide Icons** | `unpkg.com/lucide@latest` | Ikonografi SVG modern dan tajam |
| **PapaParse JS** | `cdnjs.cloudflare.com/.../papaparse.min.js` | Parser CSV in-browser performa tinggi |
| **Plus Jakarta Sans** | Google Fonts | Tipografi modern UI yang bersih dan mudah dibaca |

---

## 📄 Lisensi & Hak Cipta

Proyek ini dikembangkan untuk keperluan akademik dan praktis pada mata kuliah **Sistem Pendukung Keputusan (SPK)**. Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan edukasi dan pembelajaran.
