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
    id: "elegant-ivory",
    name: "Elegant Ivory",
    image: "images/templates/elegant-ivory.svg",
    price: 150000,
    description: "Nuansa krem lembut dengan tipografi klasik."
  },
  {
    id: "modern-mono",
    name: "Modern Mono",
    image: "images/templates/modern-mono.svg",
    price: 150000,
    description: "Hitam putih, garis tegas, dan minimalis."
  },
  {
    id: "sage-garden",
    name: "Sage Garden",
    image: "images/templates/sage-garden.svg",
    price: 175000,
    description: "Hijau sage dengan sentuhan botanikal sederhana."
  },
  {
    id: "dusty-rose",
    name: "Dusty Rose",
    image: "images/templates/dusty-rose.svg",
    price: 175000,
    description: "Palet mauve lembut, cocok untuk tema romantis."
  },
  {
    id: "royal-navy",
    name: "Royal Navy",
    image: "images/templates/royal-navy.svg",
    price: 200000,
    description: "Navy elegan dengan aksen emas tipis."
  },
  {
    id: "terracotta-line",
    name: "Terracotta Line",
    image: "images/templates/terracotta-line.svg",
    price: 175000,
    description: "Garis-garis halus dengan warna terracotta hangat."
  }
];

// Jangan diubah kecuali struktur data berubah.
if (typeof module !== "undefined") {
  module.exports = { TEMPLATES };
}
