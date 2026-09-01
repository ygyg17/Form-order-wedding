/**
 * Code.gs
 * =========================================================================
 * Backend Form Order Undangan Digital.
 * Deploy sebagai Web App: Deploy > New deployment > Web app
 *   - Execute as   : Me (atau User deploying)
 *   - Who has access: Anyone
 *
 * Semua konfigurasi sensitif (ID Sheet, ID Folder Drive, info rekening)
 * disimpan di Script Properties, BUKAN di kode ini.
 * Cara mengatur: Project Settings (ikon gerigi) > Script Properties.
 *
 * Properties yang wajib diisi:
 *   SHEET_ID              ID Google Sheet database order
 *   DRIVE_FOLDER_ID        ID folder Google Drive untuk bukti pembayaran
 *   BANK_NAME               Nama bank untuk menerima pembayaran
 *   BANK_ACCOUNT_NUMBER      Nomor rekening
 *   BANK_ACCOUNT_NAME       Atas nama rekening
 *
 * Properties opsional:
 *   SHEET_TAB_NAME          Nama tab/sheet tujuan (default: "Orders")
 *   NOTIFY_EMAIL            Email admin yang menerima salinan notifikasi order baru
 * =========================================================================
 */

const SHEET_TAB_NAME_DEFAULT = "Orders";
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const COLUMN_HEADERS = [
  "Order ID", "Timestamp", "Status", "Nama Pemesan", "WhatsApp", "Email",
  "Template", "Nama Lengkap Pria", "Nama Panggilan Pria", "Orang Tua Pria", "Alamat Pria",
  "Nama Lengkap Wanita", "Nama Panggilan Wanita", "Orang Tua Wanita", "Alamat Wanita",
  "Tanggal Acara", "Waktu Acara", "Alamat Lokasi", "Google Maps", "Background Music",
  "Nama Bank", "Nomor Rekening", "Atas Nama Rekening", "Catatan Tambahan", "Link Bukti Pembayaran",
];

const REQUIRED_FIELDS = [
  "namaPemesan", "whatsapp", "email", "template",
  "namaLengkapPria", "namaPanggilanPria", "orangTuaPria", "alamatPria",
  "namaLengkapWanita", "namaPanggilanWanita", "orangTuaWanita", "alamatWanita",
  "tanggalAcara", "waktuAcara", "alamatLokasi", "googleMaps", "backgroundMusic",
  "namaBank", "nomorRekening", "atasNamaRekening",
];

// ===========================================================================
// Entry points
// ===========================================================================

function doGet(e) {
  const action = e.parameter.action;

  if (action === "getConfig") {
    return jsonResponse({
      bankName: getProp("BANK_NAME", ""),
      accountNumber: getProp("BANK_ACCOUNT_NUMBER", ""),
      accountName: getProp("BANK_ACCOUNT_NAME", ""),
    });
  }

  return jsonResponse({ success: false, message: "Unknown action" });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === "submitOrder") {
      return jsonResponse(handleSubmitOrder(body.data));
    }

    return jsonResponse({ success: false, message: "Unknown action" });
  } catch (err) {
    return jsonResponse({ success: false, message: "Server error: " + err.message });
  }
}

// ===========================================================================
// Order handling
// ===========================================================================

function handleSubmitOrder(data) {
  const validationError = validateOrderData(data);
  if (validationError) {
    return { success: false, message: validationError };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const orderId = generateOrderId();
    const fileUrl = saveFileToDrive(data.file, orderId, data.namaPemesan);
    appendOrderToSheet(orderId, data, fileUrl);
    sendConfirmationEmail(orderId, data);

    return { success: true, orderId: orderId };
  } catch (err) {
    return { success: false, message: "Gagal memproses pesanan: " + err.message };
  } finally {
    lock.releaseLock();
  }
}

function validateOrderData(data) {
  if (!data) return "Data pesanan kosong.";

  for (let i = 0; i < REQUIRED_FIELDS.length; i++) {
    const field = REQUIRED_FIELDS[i];
    if (!data[field] || String(data[field]).trim() === "") {
      return "Field '" + field + "' wajib diisi.";
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return "Format email tidak valid.";
  }

  if (!data.file || !data.file.base64 || !data.file.mimeType) {
    return "Bukti pembayaran tidak ditemukan.";
  }

  if (ALLOWED_MIME_TYPES.indexOf(data.file.mimeType) === -1) {
    return "Format bukti pembayaran tidak didukung.";
  }

  const approxBytes = (data.file.base64.length * 3) / 4;
  if (approxBytes > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return "Ukuran bukti pembayaran melebihi " + MAX_FILE_SIZE_MB + "MB.";
  }

  return null;
}

/**
 * Order ID unik per hari: ORD-YYYYMMDD-001, -002, dst.
 * Counter disimpan di Script Properties, di-lock agar aman dari race condition.
 */
function generateOrderId() {
  const today = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyyMMdd");
  const counterKey = "ORDER_COUNTER_" + today;
  const props = PropertiesService.getScriptProperties();

  const current = parseInt(props.getProperty(counterKey) || "0", 10);
  const next = current + 1;
  props.setProperty(counterKey, String(next));

  const sequence = ("000" + next).slice(-3);
  return "ORD-" + today + "-" + sequence;
}

function saveFileToDrive(fileObj, orderId, namaPemesan) {
  const folderId = getProp("DRIVE_FOLDER_ID");
  if (!folderId) throw new Error("DRIVE_FOLDER_ID belum diatur di Script Properties.");

  const folder = DriveApp.getFolderById(folderId);
  const extension = extensionFromMime(fileObj.mimeType);
  const safeName = namaPemesan.replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const fileName = orderId + "_" + safeName + "_Bukti-Pembayaran." + extension;

  const bytes = Utilities.base64Decode(fileObj.base64);
  const blob = Utilities.newBlob(bytes, fileObj.mimeType, fileName);

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function extensionFromMime(mimeType) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
  };
  return map[mimeType] || "dat";
}

function appendOrderToSheet(orderId, data, fileUrl) {
  const sheetId = getProp("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID belum diatur di Script Properties.");

  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const tabName = getProp("SHEET_TAB_NAME", SHEET_TAB_NAME_DEFAULT);
  let sheet = spreadsheet.getSheetByName(tabName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(tabName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMN_HEADERS);
    sheet.setFrozenRows(1);
  }

  const row = [
    orderId,
    new Date(),
    "Baru",
    data.namaPemesan,
    data.whatsapp,
    data.email,
    data.template,
    data.namaLengkapPria,
    data.namaPanggilanPria,
    data.orangTuaPria,
    data.alamatPria,
    data.namaLengkapWanita,
    data.namaPanggilanWanita,
    data.orangTuaWanita,
    data.alamatWanita,
    data.tanggalAcara,
    data.waktuAcara,
    data.alamatLokasi,
    data.googleMaps,
    data.backgroundMusic,
    data.namaBank,
    data.nomorRekening,
    data.atasNamaRekening,
    data.catatanTambahan || "",
    fileUrl,
  ];

  sheet.appendRow(row);
}

function sendConfirmationEmail(orderId, data) {
  const subject = "Konfirmasi Pesanan Undangan Digital — " + orderId;
  const htmlBody = buildEmailHtml(orderId, data);
  const plainBody =
    "Pesanan Anda telah kami terima.\n\n" +
    "Order ID: " + orderId + "\n" +
    "Nama Pemesan: " + data.namaPemesan + "\n" +
    "Template: " + data.template + "\n" +
    "Mempelai: " + data.namaPanggilanPria + " & " + data.namaPanggilanWanita + "\n" +
    "Tanggal Acara: " + data.tanggalAcara + " " + data.waktuAcara + "\n\n" +
    "Terima kasih telah memesan.";

  GmailApp.sendEmail(data.email, subject, plainBody, { htmlBody: htmlBody });

  const notifyEmail = getProp("NOTIFY_EMAIL", "");
  if (notifyEmail) {
    GmailApp.sendEmail(notifyEmail, "[Order Baru] " + orderId, plainBody, { htmlBody: htmlBody });
  }
}

function buildEmailHtml(orderId, data) {
  return "" +
    '<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;background:#FBF8F3;padding:32px 24px;color:#2A2620;">' +
    '  <h1 style="font-size:22px;font-weight:500;margin:0 0 8px;">Pesanan Anda Sudah Kami Terima</h1>' +
    '  <p style="font-family:Arial,sans-serif;font-size:14px;color:#5B564C;margin:0 0 24px;">Terima kasih, ' + escapeHtml(data.namaPemesan) + '. Berikut ringkasan pesanan undangan digital Anda.</p>' +
    '  <div style="background:#FFFFFF;border:1px solid #E1D8C9;border-radius:10px;padding:20px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">' +
    '    <p style="margin:0 0 4px;color:#5B564C;font-size:12px;">ORDER ID</p>' +
    '    <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:18px;">' + orderId + '</p>' +
    '    <p style="margin:0 0 4px;"><strong>Template:</strong> ' + escapeHtml(data.template) + '</p>' +
    '    <p style="margin:0 0 4px;"><strong>Mempelai:</strong> ' + escapeHtml(data.namaPanggilanPria) + ' &amp; ' + escapeHtml(data.namaPanggilanWanita) + '</p>' +
    '    <p style="margin:0 0 4px;"><strong>Tanggal Acara:</strong> ' + escapeHtml(data.tanggalAcara) + ' pukul ' + escapeHtml(data.waktuAcara) + '</p>' +
    '    <p style="margin:0;"><strong>Lokasi:</strong> ' + escapeHtml(data.alamatLokasi) + '</p>' +
    '  </div>' +
    '  <p style="font-family:Arial,sans-serif;font-size:12.5px;color:#5B564C;margin:24px 0 0;">Tim kami akan segera memproses pesanan Anda. Jika ada pertanyaan, balas email ini kapan saja.</p>' +
    '</div>';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===========================================================================
// Helpers
// ===========================================================================

function getProp(key, fallback) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value !== null && value !== undefined ? value : (fallback !== undefined ? fallback : "");
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
