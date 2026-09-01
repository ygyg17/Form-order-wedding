/**
 * config.js
 * -----------------------------------------------------------------------
 * Satu-satunya file yang perlu diubah untuk menambahkan template baru.
 * Lihat README.md bagian "Menambahkan Template Baru" untuk tutorial lengkap.
 * -----------------------------------------------------------------------
 */

// Ganti dengan URL Web App Google Apps Script Anda setelah proses deploy.
// Contoh: "https://script.google.com/macros/s/AKfycb.../exec"
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyurSS_nDgMnJFEdB87iT0WTDesMAXmYUZqNi9Xe94RUhRL5QKYJAIcRzhsZ--1UWFM/exec";

// Daftar template undangan.
// Untuk menambah template baru:
//   1. Upload gambar preview ke folder images/templates/
//   2. Tambahkan satu baris object baru di bawah ini
//   3. Template otomatis muncul di halaman — tidak perlu ubah kode lain.
const TEMPLATES = [
  { id: "minimalist",      name: "Minimalist",      image: "images/templates/minimalist.svg" },
  { id: "the-classic",     name: "The Classic",     image: "images/templates/the-classic.svg" },
  { id: "modern-romance",  name: "Modern Romance",  image: "images/templates/modern-romance.svg" },
  { id: "the-flower",      name: "The Flower",      image: "images/templates/the-flower.svg" },
  { id: "brown-tone",      name: "Brown Tone",      image: "images/templates/brown-tone.svg" },
];

// Pengaturan upload bukti pembayaran.
const UPLOAD_CONFIG = {
  maxSizeMB: 5,
  allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
  allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
};

// Nilai fallback yang ditampilkan sebelum data rekening berhasil diambil
// dari Google Apps Script (Script Properties). Lihat README bagian
// "Mengubah Detail Rekening Pembayaran".
const PAYMENT_FALLBACK = {
  bankName: "—",
  accountNumber: "—",
  accountName: "—",
};
