# Form Order Undangan Digital

Stack: **GitHub Pages** (frontend statis) + **Supabase** (database + Edge
Functions sebagai backend) + **Midtrans Snap** (pembayaran).

---

## 1. Arsitektur & Kenapa Butuh Edge Function

GitHub Pages hanya bisa menyajikan file statis (HTML/CSS/JS) — tidak bisa
menjalankan kode server. Padahal **Midtrans Server Key** dan **Supabase
Service Role Key** tidak boleh pernah muncul di kode frontend, karena siapa
pun bisa membuka DevTools dan membacanya.

Solusinya: **Supabase Edge Functions** dipakai sebagai backend kecil yang
menyimpan kedua secret tersebut dengan aman, dan menjadi satu-satunya pihak
yang boleh:
- Membuat transaksi Midtrans (pakai Server Key).
- Membaca / mengubah data pesanan secara bebas (pakai Service Role Key).
- Memverifikasi notifikasi pembayaran dari Midtrans.

```
Browser (GitHub Pages)
   |  1. insert order (anon key, insert-only)
   v
Supabase Table `orders`  <-------------------+
   |                                          |
   | 2. invoke create-transaction             | 4. webhook update status
   v                                          |
Edge Function (Service Role Key + Server Key) |
   |                                          |
   | 3. create transaction                    |
   v                                          |
Midtrans Snap API  ---- 5. payment notif -----+
```

---

## 2. Struktur Folder

```
undangan-order/
├── index.html
├── sukses.html
├── css/style.css
├── js/
│   ├── config.js          <- daftar template (EDIT DI SINI untuk tambah template)
│   ├── supabaseClient.js  <- URL + anon key Supabase
│   ├── validation.js
│   └── app.js
├── images/templates/      <- file gambar preview template
└── supabase/
    ├── schema.sql
    └── functions/
        ├── create-transaction/index.ts
        ├── midtrans-webhook/index.ts
        └── check-status/index.ts
```

---

## 3. Setup Supabase

1. Buat project baru di https://supabase.com.
2. Buka **SQL Editor**, jalankan isi file `supabase/schema.sql`.
   Ini membuat tabel `orders` beserta Row Level Security (RLS) yang
   membatasi akses publik hanya untuk **insert**, tidak bisa membaca
   data pesanan orang lain.
3. Buka **Project Settings -> API**, salin:
   - `Project URL` -> tempel ke `js/supabaseClient.js` (`SUPABASE_URL`)
   - `anon public key` -> tempel ke `js/supabaseClient.js` (`SUPABASE_ANON_KEY`)
4. Install Supabase CLI, lalu login & link project:
   ```
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
5. Deploy ketiga Edge Function:
   ```
   supabase functions deploy create-transaction
   supabase functions deploy midtrans-webhook
   supabase functions deploy check-status
   ```
6. Set secrets untuk Edge Function (ganti dengan nilai asli Anda):
   ```
   supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
   supabase secrets set MIDTRANS_IS_PRODUCTION=false
   supabase secrets set ALLOWED_ORIGIN=https://USERNAME.github.io
   ```
   `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah otomatis tersedia
   di environment Edge Function, tidak perlu diset manual.

---

## 4. Setup Midtrans

1. Daftar akun di https://midtrans.com, aktifkan mode **Sandbox** dulu
   untuk uji coba.
2. Ambil **Client Key** dan **Server Key** dari Dashboard -> Settings ->
   Access Keys.
3. Tempel **Client Key** (bukan Server Key!) ke `index.html`, pada atribut
   `data-client-key` di tag `<script>` Snap.js. Client Key memang publik
   dan aman ditaruh di frontend.
4. Tempel **Server Key** ke Supabase secrets (langkah 6 di atas) — **jangan
   pernah** ditaruh di file yang di-push ke GitHub.
5. Set **Payment Notification URL** di Dashboard Midtrans -> Settings ->
   Configuration, isi dengan URL Edge Function `midtrans-webhook`, contoh:
   ```
   https://YOUR-PROJECT-REF.supabase.co/functions/v1/midtrans-webhook
   ```
6. Setelah pengujian selesai dan siap produksi:
   - Ganti URL script Snap.js di `index.html` dari
     `https://app.sandbox.midtrans.com/snap/snap.js` menjadi
     `https://app.midtrans.com/snap/snap.js`.
   - Ganti Client Key & Server Key ke versi produksi.
   - Set `MIDTRANS_IS_PRODUCTION=true` di Supabase secrets.

---

## 5. Deploy ke GitHub Pages

1. Push seluruh folder `undangan-order/` ke repository GitHub.
2. Buka **Settings -> Pages**, pilih branch & folder root, simpan.
3. Website akan tersedia di `https://USERNAME.github.io/NAMA-REPO/`.
4. Pastikan `ALLOWED_ORIGIN` di Supabase secrets sama persis dengan
   domain GitHub Pages Anda (termasuk `https://`, tanpa trailing slash).

---

## 6. Cara Menambah Template Baru

Struktur ini didesain agar menambah template **tidak perlu ubah HTML/JS
lain**, cukup 3 langkah:

1. **Upload gambar preview** ke folder `images/templates/`, contoh:
   `images/templates/classic-gold.jpg`
   (disarankan rasio 300:420, ukuran file di bawah 300KB agar cepat dimuat)

2. **Tambahkan entry baru** di `js/config.js`:
   ```js
   {
     id: "classic-gold",
     name: "Classic Gold",
     image: "images/templates/classic-gold.jpg",
     price: 200000,
     description: "Nuansa emas klasik dengan ornamen tipis."
   }
   ```

3. **Tambahkan harga yang sama** di
   `supabase/functions/create-transaction/index.ts`, pada object
   `TEMPLATE_PRICES`:
   ```ts
   "classic-gold": { name: "Classic Gold", price: 200000 },
   ```
   lalu deploy ulang function:
   ```
   supabase functions deploy create-transaction
   ```

   > Kenapa harga harus didaftarkan dua kali (di `config.js` dan di Edge
   > Function)? Karena harga yang tampil di frontend tidak boleh dipercaya
   > begitu saja saat membuat transaksi pembayaran — kalau tidak, orang
   > bisa memanipulasi harga dari DevTools browser. `config.js` hanya
   > untuk tampilan; Edge Function adalah sumber kebenaran harga yang
   > sesungguhnya dipakai saat charge ke Midtrans.

4. Push perubahan ke GitHub — template baru otomatis muncul di halaman.

Untuk **menghapus** template, cukup hapus entry-nya dari `config.js` (dan
opsional dari `TEMPLATE_PRICES` bila ingin benar-benar dinonaktifkan).

---

## 7. Checklist Keamanan

| Area | Penerapan |
|---|---|
| Secret keys | Server Key Midtrans & Service Role Key Supabase hanya ada di Supabase secrets, tidak pernah di repo/frontend |
| RLS Supabase | Anon key hanya bisa `INSERT` order baru berstatus `pending_payment`; tidak ada policy `SELECT/UPDATE/DELETE` untuk publik |
| Validasi harga | Harga final ditentukan ulang di Edge Function dari `template_id`, bukan dari nilai yang dikirim client, sehingga tidak bisa dimanipulasi |
| Webhook Midtrans | Signature (`SHA512(order_id+status_code+gross_amount+ServerKey)`) diverifikasi sebelum status order diubah, agar notifikasi palsu ditolak |
| Validasi input | Divalidasi di client (UX) **dan** diulang lagi lewat `CHECK` constraint di database (format WhatsApp, email, no. rekening, dsb.) |
| XSS | Semua input di-escape sebelum dirender ke DOM (`escapeHtml`), dan disaring karakter `<`/`>` sebelum disimpan |
| CORS | Edge Function membatasi `Access-Control-Allow-Origin` hanya ke domain GitHub Pages Anda (`ALLOWED_ORIGIN`) |
| HTTPS | GitHub Pages & Supabase & Midtrans semuanya berjalan di HTTPS secara default |
| Least privilege | Setiap Edge Function hanya melakukan operasi yang benar-benar diperlukan; tidak ada endpoint "serba bisa" |

### Yang perlu Anda lakukan tambahan (opsional tapi disarankan)

- **Rate limiting / anti-spam**: tambahkan Google reCAPTCHA v3 atau
  Cloudflare Turnstile di Step 1 form untuk mencegah bot membuat order
  massal, karena endpoint insert bersifat publik.
- **Idempotency**: bila user menekan tombol bayar berkali-kali, Edge
  Function `create-transaction` sudah menolak order yang statusnya bukan
  `pending_payment`, tapi pertimbangkan juga men-disable tombol setelah
  diklik (sudah diterapkan di `app.js`).
- **Monitoring**: aktifkan email alert di Supabase & Midtrans untuk
  transaksi gagal/anomali.
- **Backup**: aktifkan Point-in-Time-Recovery di Supabase bila volume
  order sudah tinggi.
- **Data pribadi**: pertimbangkan kebijakan retensi data (hapus data
  pemesan setelah undangan selesai diproses + beberapa bulan), sesuai
  UU PDP.

---

## 8. Menjalankan Secara Lokal

Karena `fetch` ke Supabase butuh origin yang jelas, jalankan lewat local
server sederhana, jangan buka `index.html` langsung dari file explorer:

```bash
npx serve .
# atau
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`. Tambahkan origin lokal ini juga ke
`ALLOWED_ORIGIN` sementara saat development bila diperlukan (atau buat
secret terpisah untuk staging).
