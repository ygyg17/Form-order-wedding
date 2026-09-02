/**
 * ============================================================
 *  KONFIGURASI TEMPLATE UNDANGAN
 * ============================================================
 *  Cara menambah template baru (lihat juga README.md):
 *   1. Upload gambar preview ke folder /images/templates/
 *   2. Tambahkan satu object baru ke array TEMPLATES di bawah ini
 *   3. Simpan file ini & push ke GitHub -> template baru otomatis
 *      muncul di halaman, tidak perlu ubah kode lain.
 *
 *  Field:
 *   id        : slug unik, huruf kecil, tanpa spasi (dipakai sbg key)
 *   name      : nama yang tampil ke user
 *   image     : path relatif ke file preview
 *   price     : harga dalam Rupiah (angka biasa, tanpa titik/koma)
 *   description : deskripsi singkat (opsional)
 * ============================================================
 */

const TEMPLATES = [
  {
    id: "minimalist",
    name: "Minimalist",
    image: "images/templates/theme1.webp",
    price: 150000,
    description: "Nuansa lembut dengan tipografi klasik."
  },
  {
    id: "the-classic",
    name: "The Classic",
    image: "images/templates/theme2.webp",
    price: 150000,
    description: "garis tegas, dan minimalis."
  },
  {
    id: "modern-romance",
    name: "Modern Romance",
    image: "images/templates/theme3.webp",
    price: 150000,
    description: "Sentuhan kehangatan warna."
  },
  {
    id: "the-flower",
    name: "The Flower",
    image: "images/templates/theme4.webp",
    price: 150000,
    description: "Ornamen Bunga, cocok untuk tema romantis."
  },
  {
    id: "brown-tone",
    name: "Brown Tone",
    image: "images/templates/theme5.webp",
    price: 150000,
    description: "Kombinasi Cokelat dan putih."
  },
  {
    id: "terracotta-line",
    name: "Terracotta Line",
    image: "images/templates/terracotta-line.svg",
    price: 150000,
    description: "Garis-garis halus dengan warna terracotta hangat."
  }
];

// Jangan diubah kecuali struktur data berubah.
if (typeof module !== "undefined") {
  module.exports = { TEMPLATES };
}
