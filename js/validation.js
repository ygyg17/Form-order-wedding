/**
 * ============================================================
 *  VALIDASI
 *  Catatan keamanan: validasi di sini HANYA untuk pengalaman
 *  pengguna (UX). Validasi yang menentukan keamanan/keabsahan
 *  data WAJIB diulang di server (Supabase Edge Function),
 *  karena input dari browser tidak pernah bisa dipercaya 100%.
 * ============================================================
 */

const Validators = {
  required(value) {
    return String(value ?? "").trim().length > 0;
  },

  maxLen(value, max) {
    return String(value ?? "").trim().length <= max;
  },

  whatsapp(value) {
    // Menerima 08xxxxxxxxxx atau +62xxxxxxxxxx / 62xxxxxxxxxx
    const v = String(value ?? "").trim().replace(/[\s-]/g, "");
    return /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(v);
  },

  email(value) {
    const v = String(value ?? "").trim();
    // RFC-5322-lite pattern, cukup ketat untuk form publik
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  },

  url(value) {
    try {
      const u = new URL(String(value ?? "").trim());
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  },

  isFutureOrTodayDate(value) {
    if (!value) return false;
    const chosen = new Date(value + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return chosen >= today;
  }
};

/**
 * Membersihkan string dari karakter yang berpotensi disalahgunakan
 * untuk XSS ketika nantinya ditampilkan kembali (misal di dashboard
 * admin atau di halaman undangan). Ini bukan pengganti proper
 * output-encoding di sisi tampilan, hanya lapisan tambahan.
 */
function sanitizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/[<>]/g, "");
}

if (typeof module !== "undefined") {
  module.exports = { Validators, sanitizeText };
}
