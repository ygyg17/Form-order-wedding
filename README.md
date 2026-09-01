# Form Order Undangan Digital

Form pemesanan undangan pernikahan digital — multi-step, mobile-first, dengan
frontend static (GitHub Pages) dan backend Google Apps Script + Google Sheets
+ Google Drive.

---

## 1. Struktur Folder

```
undangan-order-form/
├── index.html                 # Halaman utama form (5 step)
├── css/
│   └── style.css              # Semua styling
├── js/
│   ├── config.js              # Daftar template + pengaturan (edit di sini)
│   └── app.js                 # Logika form: validasi, step, submit
├── images/
│   └── templates/             # Gambar preview tiap template
│       ├── minimalist.svg
│       ├── the-classic.svg
│       ├── modern-romance.svg
│       ├── the-flower.svg
│       └── brown-tone.svg
├── apps-script/
│   ├── Code.gs                # Backend: submit order, Sheets, Drive, email
│   └── appsscript.json        # Manifest project Apps Script
└── README.md                  # Dokumen ini
```

> Catatan: gambar template di atas adalah **placeholder** (bentuk mockup HP
> polos). Ganti dengan preview desain asli sebelum go-live — caranya ada di
> bagian 3.1 di bawah.

---

## 2. Alur Kerja Singkat

1. Frontend (HTML/CSS/JS murni, tanpa build step) di-host di **GitHub Pages**.
2. Saat "Send Order" diklik, frontend mengirim data + bukti pembayaran
   (sebagai base64) ke **Google Apps Script Web App** lewat `fetch()`.
3. Apps Script membuat Order ID, menyimpan file ke **Google Drive**,
   menyimpan baris data ke **Google Sheets**, lalu mengirim **email
   konfirmasi**.
4. Semua data sensitif (ID Sheet, ID Folder Drive, info rekening) disimpan di
   **Script Properties** Apps Script — bukan di kode frontend.

---

## 3. Setup Awal (sekali saja)

### 3.1 Frontend

1. Buat repository GitHub baru, upload seluruh isi folder ini (kecuali
   `apps-script/`, yang tidak perlu ikut ke GitHub Pages — boleh tetap
   disimpan di repo untuk dokumentasi, tapi tidak wajib).
2. Di repo, buka **Settings > Pages**, pilih branch `main` folder `/root`,
   simpan. GitHub akan memberi URL seperti
   `https://username.github.io/nama-repo/`.
3. Isi `js/config.js` → `APPS_SCRIPT_URL` dengan URL Web App (didapat di
   langkah 3.2 poin 5).

### 3.2 Backend (Google Apps Script)

1. **Buat Google Sheet baru** untuk database order. Salin **Sheet ID** dari
   URL-nya:
   `https://docs.google.com/spreadsheets/d/`**`SHEET_ID_DI_SINI`**`/edit`
2. **Buat folder Google Drive baru** untuk menyimpan bukti pembayaran. Salin
   **Folder ID** dari URL-nya:
   `https://drive.google.com/drive/folders/`**`FOLDER_ID_DI_SINI`**
3. Buka [script.google.com](https://script.google.com), buat project baru,
   lalu salin isi `apps-script/Code.gs` dan `apps-script/appsscript.json`
   ke project tersebut (gunakan editor manifest: View > Show manifest file).
4. Buka **Project Settings** (ikon gerigi) > **Script Properties**, tambahkan:

   | Property              | Contoh Nilai                          |
   |------------------------|----------------------------------------|
   | `SHEET_ID`             | ID dari langkah 1                      |
   | `DRIVE_FOLDER_ID`      | ID dari langkah 2                      |
   | `BANK_NAME`            | `Mandiri`                              |
   | `BANK_ACCOUNT_NUMBER`  | `1450014474577`                        |
   | `BANK_ACCOUNT_NAME`    | `I Kadek Yogi Suryawan`                |
   | `NOTIFY_EMAIL` *(opsional)* | email admin untuk notifikasi order baru |
   | `SHEET_TAB_NAME` *(opsional)* | nama tab sheet, default `Orders` |

5. Klik **Deploy > New deployment > Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Klik **Deploy**, salin URL Web App (`https://script.google.com/macros/s/xxx/exec`).
6. Tempel URL tersebut ke `js/config.js` → `APPS_SCRIPT_URL`, lalu push ulang
   ke GitHub Pages.

Form sekarang siap digunakan.

---

## 4. Dokumentasi Operasional

### 4.1 Cara Menambahkan Template Baru

1. Siapkan gambar preview template (rasio potret, disarankan 3:4).
2. Upload gambar ke folder `images/templates/` di repository GitHub.
3. Buka `js/config.js`, tambahkan satu baris baru di array `TEMPLATES`:
   ```js
   { id: "nama-unik-template", name: "Nama Template", image: "images/templates/nama-file.jpg" },
   ```
4. Commit & push. Template baru otomatis muncul di Step 2 — tidak perlu
   mengubah file lain.

### 4.2 Lokasi Folder Image Template

`images/templates/` di root project. Nama file bebas, tapi disarankan
mengikuti pola `nama-template.svg` / `.jpg` / `.png` agar mudah dikenali.

### 4.3 Cara Mengubah Nama Template

Buka `js/config.js`, ubah nilai `name` pada object template terkait. Nilai
`id` sebaiknya **tidak diubah** jika sudah ada order yang tersimpan dengan id
tersebut di Google Sheets (agar histori data tetap konsisten).

### 4.4 Cara Mengubah Detail Rekening Pembayaran

Rekening pembayaran **tidak disimpan di kode**, melainkan di Script
Properties Apps Script:

1. Buka project Apps Script di [script.google.com](https://script.google.com).
2. **Project Settings** (ikon gerigi) > **Script Properties**.
3. Ubah nilai `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, atau `BANK_ACCOUNT_NAME`.
4. Simpan — perubahan langsung berlaku, **tanpa perlu deploy ulang** dan
   tanpa perlu mengubah frontend, karena halaman mengambil data ini secara
   otomatis lewat `doGet`.

### 4.5 Cara Mengakses Google Sheets Database

Buka langsung Google Sheet yang ID-nya diisi pada `SHEET_ID` (lihat bagian
3.2). Setiap order tersimpan sebagai satu baris di tab `Orders` (atau nama
lain sesuai `SHEET_TAB_NAME`), dengan kolom sesuai urutan berikut:

`Order ID, Timestamp, Status, Nama Pemesan, WhatsApp, Email, Template, Nama
Lengkap Pria, Nama Panggilan Pria, Orang Tua Pria, Alamat Pria, Nama Lengkap
Wanita, Nama Panggilan Wanita, Orang Tua Wanita, Alamat Wanita, Tanggal
Acara, Waktu Acara, Alamat Lokasi, Google Maps, Background Music, Nama Bank,
Nomor Rekening, Atas Nama Rekening, Catatan Tambahan, Link Bukti Pembayaran`

Kolom **Status** default terisi `"Baru"` — Anda bebas menambah/mengubah nilai
ini secara manual di sheet untuk keperluan tracking (misalnya `Diproses`,
`Selesai`).

### 4.6 Cara Mengubah Google Drive Folder untuk Upload

1. Buat atau pilih folder Drive baru, salin Folder ID dari URL-nya.
2. Di Apps Script, **Project Settings > Script Properties**, ubah nilai
   `DRIVE_FOLDER_ID` ke ID folder baru.
3. Simpan — order berikutnya otomatis tersimpan ke folder baru. Order lama
   tetap berada di folder sebelumnya (tidak dipindahkan otomatis).

### 4.7 Cara Mengatur Google Apps Script Properties / Environment Configuration

1. Buka project di [script.google.com](https://script.google.com).
2. Klik ikon gerigi **Project Settings** di sidebar kiri.
3. Scroll ke bagian **Script Properties**.
4. Klik **Add script property** untuk menambah, atau klik nilai yang ada
   untuk mengubahnya. Lihat tabel lengkap di bagian 3.2 poin 4.
5. Tidak perlu deploy ulang setelah mengubah Script Properties — nilainya
   dibaca langsung setiap kali fungsi dijalankan.

### 4.8 Cara Deploy Ulang Google Apps Script Jika Ada Perubahan

Perubahan **kode** (`Code.gs` atau `appsscript.json`) memerlukan deploy ulang
agar Web App menggunakan versi terbaru:

1. Buka project Apps Script, pastikan perubahan kode sudah disimpan
   (Ctrl/Cmd + S).
2. Klik **Deploy > Manage deployments**.
3. Klik ikon pensil pada deployment aktif (Web app).
4. Di dropdown **Version**, pilih **New version**.
5. Klik **Deploy**.

> URL Web App biasanya **tidak berubah** setelah deploy ulang versi
> (selama Anda melakukan "New version" pada deployment yang sama, bukan
> membuat deployment baru), sehingga `APPS_SCRIPT_URL` di frontend tidak
> perlu diubah. Jika Anda membuat deployment baru dari nol, URL akan berbeda
> dan wajib diperbarui di `js/config.js`.

### 4.9 Cara Update dan Deploy Frontend ke GitHub Pages

1. Ubah file yang diperlukan (`index.html`, `css/style.css`, `js/*.js`, atau
   gambar template).
2. Commit dan push perubahan ke branch yang digunakan GitHub Pages
   (biasanya `main`).
3. GitHub Pages otomatis membangun ulang halaman dalam waktu singkat
   (biasanya kurang dari satu menit). Tidak ada proses build tambahan karena
   project ini murni HTML/CSS/JS statis.
4. Refresh halaman (hard refresh / clear cache jika perubahan tidak langsung
   terlihat).

---

## 5. Catatan Teknis

- **CORS pada `POST`**: request submit order dikirim dengan header
  `Content-Type: text/plain;charset=utf-8` agar browser tidak mengirim
  *preflight* `OPTIONS` (yang tidak didukung Apps Script Web App). Body tetap
  berisi JSON yang di-`JSON.parse()` di sisi server.
- **Upload file**: file dikonversi ke base64 di browser lalu dikirim sebagai
  bagian dari body JSON. Ini menghindari kebutuhan multipart/form-data yang
  lebih rumit ditangani Apps Script.
- **Mencegah duplicate submission saat refresh**: setelah order berhasil,
  Order ID disimpan ke `sessionStorage`. Jika halaman di-refresh sebelum tab
  ditutup, popup sukses akan tetap tampil (bukan form kosong) sampai user
  menekan "Kembali ke Beranda".
- **Order ID unik**: dibuat dengan pola `ORD-YYYYMMDD-XXX`, counter harian
  disimpan di Script Properties dan diproses dengan `LockService` agar aman
  dari race condition saat ada order bersamaan.
- **Validasi**: dilakukan di frontend (untuk UX) **dan** di backend (untuk
  keamanan) — jangan hanya mengandalkan validasi frontend.

---

## 6. Troubleshooting

| Gejala | Kemungkinan Penyebab |
|---|---|
| Submit gagal, error di console soal CORS | Pastikan `Content-Type` request tetap `text/plain`, dan Web App di-deploy dengan akses **Anyone**. |
| Info rekening tidak muncul (tampil `—`) | `APPS_SCRIPT_URL` belum diisi di `config.js`, atau Script Properties `BANK_*` belum diatur. |
| Data tidak masuk ke Sheet | Cek `SHEET_ID` benar, dan akun yang deploy Apps Script punya akses edit ke Sheet tersebut. |
| File tidak muncul di Drive | Cek `DRIVE_FOLDER_ID` benar, dan akun yang deploy Apps Script punya akses ke folder tersebut. |
| Email konfirmasi tidak terkirim | Cek kuota `GmailApp` harian (akun Gmail biasa: ~100 email/hari), dan folder spam penerima. |
