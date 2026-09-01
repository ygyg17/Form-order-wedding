/**
 * app.js
 * -----------------------------------------------------------------------
 * Logika form order undangan digital: navigasi step, validasi, render
 * template, upload bukti pembayaran, dan pengiriman data ke Google Apps
 * Script Web App.
 * -----------------------------------------------------------------------
 */

(function () {
  "use strict";

  const TOTAL_STEPS = 5;

  const state = {
    currentStep: 1,
    selectedTemplateId: null,
    file: null,       // { name, mimeType, size, base64 }
    isSubmitting: false,
  };

  // Field yang divalidasi per step. type menentukan aturan validasi.
  const STEP_FIELDS = {
    1: [
      { name: "namaPemesan", type: "required", label: "Nama Pemesan" },
      { name: "whatsapp", type: "whatsapp", label: "Nomor WhatsApp" },
      { name: "email", type: "email", label: "Email" },
    ],
    2: [{ name: "template", type: "template", label: "Template" }],
    3: [
      { name: "namaLengkapPria", type: "required" },
      { name: "namaPanggilanPria", type: "required" },
      { name: "orangTuaPria", type: "required" },
      { name: "alamatPria", type: "required" },
      { name: "namaLengkapWanita", type: "required" },
      { name: "namaPanggilanWanita", type: "required" },
      { name: "orangTuaWanita", type: "required" },
      { name: "alamatWanita", type: "required" },
    ],
    4: [
      { name: "tanggalAcara", type: "required" },
      { name: "waktuAcara", type: "required" },
      { name: "alamatLokasi", type: "required" },
      { name: "googleMaps", type: "url" },
      { name: "backgroundMusic", type: "required" },
      { name: "namaBank", type: "required" },
      { name: "nomorRekening", type: "required" },
      { name: "atasNamaRekening", type: "required" },
    ],
    5: [{ name: "buktiPembayaran", type: "file" }],
  };

  // ---------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------
  const form = document.getElementById("orderForm");
  const steps = Array.from(document.querySelectorAll(".step"));
  const progressItems = Array.from(document.querySelectorAll(".progress__item"));
  const btnBack = document.getElementById("btnBack");
  const btnNext = document.getElementById("btnNext");
  const templateGrid = document.getElementById("templateGrid");
  const templateInput = document.getElementById("template");
  const fileInput = document.getElementById("buktiPembayaran");
  const uploadStatus = document.getElementById("uploadStatus");
  const payBankName = document.getElementById("payBankName");
  const payAccountNumber = document.getElementById("payAccountNumber");
  const payAccountName = document.getElementById("payAccountName");
  const btnCopyAccount = document.getElementById("btnCopyAccount");
  const successModal = document.getElementById("successModal");
  const successOrderId = document.getElementById("successOrderId");
  const btnHome = document.getElementById("btnHome");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const toastEl = document.getElementById("toast");

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  function init() {
    if (hasCompletedSubmission()) {
      renderAlreadySubmittedState();
      return;
    }

    renderTemplates();
    fetchPaymentConfig();
    bindEvents();
    showStep(1);
  }

  function bindEvents() {
    btnNext.addEventListener("click", handleNextClick);
    btnBack.addEventListener("click", handleBackClick);
    fileInput.addEventListener("change", handleFileChange);
    btnCopyAccount.addEventListener("click", handleCopyAccount);
    btnHome.addEventListener("click", handleGoHome);

    // Bersihkan pesan error saat user mulai memperbaiki input.
    form.addEventListener("input", (e) => {
      if (e.target.name) clearFieldError(e.target.name);
    });
  }

  // ---------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------
  function showStep(stepNumber) {
    steps.forEach((section) => {
      section.hidden = Number(section.dataset.step) !== stepNumber;
    });
    updateProgress(stepNumber);
    updateNavButtons(stepNumber);
    document.querySelector(".card").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateProgress(stepNumber) {
    progressItems.forEach((item) => {
      const step = Number(item.dataset.step);
      item.classList.toggle("is-active", step === stepNumber);
      item.classList.toggle("is-done", step < stepNumber);
    });
  }

  function updateNavButtons(stepNumber) {
    btnBack.hidden = stepNumber === 1;
    btnNext.textContent = stepNumber === TOTAL_STEPS ? "Send Order" : "Lanjut";
  }

  function handleNextClick() {
    if (state.isSubmitting) return;
    const isValid = validateStep(state.currentStep);
    if (!isValid) return;

    if (state.currentStep < TOTAL_STEPS) {
      state.currentStep += 1;
      showStep(state.currentStep);
    } else {
      submitOrder();
    }
  }

  function handleBackClick() {
    if (state.currentStep === 1) return;
    state.currentStep -= 1;
    showStep(state.currentStep);
  }

  // ---------------------------------------------------------------------
  // Template rendering (Step 2)
  // ---------------------------------------------------------------------
  function renderTemplates() {
    templateGrid.innerHTML = "";
    TEMPLATES.forEach((tpl) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "template-card";
      card.dataset.id = tpl.id;
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");
      card.innerHTML = `
        <span class="template-card__check">✓</span>
        <img src="${tpl.image}" alt="Preview template ${tpl.name}" loading="lazy">
        <span class="template-card__name">${tpl.name}</span>
      `;
      card.addEventListener("click", () => selectTemplate(tpl.id));
      templateGrid.appendChild(card);
    });
  }

  function selectTemplate(id) {
    state.selectedTemplateId = id;
    templateInput.value = id;
    Array.from(templateGrid.children).forEach((card) => {
      const isSelected = card.dataset.id === id;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-checked", String(isSelected));
    });
    clearFieldError("template");
  }

  // ---------------------------------------------------------------------
  // Payment config (fetched from Apps Script Script Properties)
  // ---------------------------------------------------------------------
  function fetchPaymentConfig() {
    payBankName.textContent = PAYMENT_FALLBACK.bankName;
    payAccountNumber.textContent = PAYMENT_FALLBACK.accountNumber;
    payAccountName.textContent = PAYMENT_FALLBACK.accountName;

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PASTE_") === 0) return;

    fetch(`${APPS_SCRIPT_URL}?action=getConfig`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;
        payBankName.textContent = data.bankName || PAYMENT_FALLBACK.bankName;
        payAccountNumber.textContent = data.accountNumber || PAYMENT_FALLBACK.accountNumber;
        payAccountName.textContent = data.accountName || PAYMENT_FALLBACK.accountName;
      })
      .catch(() => {
        // Diamkan — nilai fallback tetap ditampilkan agar user tidak terblokir.
        console.warn("Gagal memuat konfigurasi pembayaran, menggunakan nilai fallback.");
      });
  }

  function handleCopyAccount() {
    const number = payAccountNumber.textContent.trim();
    if (!number || number === "—") return;

    const finish = () => {
      btnCopyAccount.textContent = "Tersalin";
      btnCopyAccount.classList.add("is-copied");
      setTimeout(() => {
        btnCopyAccount.textContent = "Copy";
        btnCopyAccount.classList.remove("is-copied");
      }, 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(number).then(finish).catch(() => fallbackCopy(number, finish));
    } else {
      fallbackCopy(number, finish);
    }
  }

  function fallbackCopy(text, onDone) {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    try { document.execCommand("copy"); } catch (e) { /* no-op */ }
    document.body.removeChild(temp);
    onDone();
  }

  // ---------------------------------------------------------------------
  // File upload (Step 5)
  // ---------------------------------------------------------------------
  function handleFileChange() {
    const file = fileInput.files[0];
    clearFieldError("buktiPembayaran");

    if (!file) {
      state.file = null;
      uploadStatus.textContent = "Belum ada file dipilih";
      uploadStatus.classList.remove("is-set");
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    const sizeMB = file.size / (1024 * 1024);

    if (!UPLOAD_CONFIG.allowedExtensions.includes(ext)) {
      state.file = null;
      showFieldError("buktiPembayaran", "Format file harus JPG, JPEG, PNG, atau PDF.");
      uploadStatus.textContent = "Format file tidak didukung";
      uploadStatus.classList.remove("is-set");
      fileInput.value = "";
      return;
    }

    if (sizeMB > UPLOAD_CONFIG.maxSizeMB) {
      state.file = null;
      showFieldError("buktiPembayaran", `Ukuran file maksimal ${UPLOAD_CONFIG.maxSizeMB}MB.`);
      uploadStatus.textContent = "Ukuran file terlalu besar";
      uploadStatus.classList.remove("is-set");
      fileInput.value = "";
      return;
    }

    uploadStatus.textContent = "Memproses file…";
    toBase64(file)
      .then((base64) => {
        state.file = {
          name: file.name,
          mimeType: file.type || guessMimeType(ext),
          size: file.size,
          base64,
        };
        uploadStatus.textContent = `${file.name} — siap diupload`;
        uploadStatus.classList.add("is-set");
      })
      .catch(() => {
        state.file = null;
        uploadStatus.textContent = "Gagal memproses file, coba lagi";
        uploadStatus.classList.remove("is-set");
      });
  }

  function guessMimeType(ext) {
    const map = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", pdf: "application/pdf" };
    return map[ext] || "application/octet-stream";
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result = "data:<mime>;base64,<data>" — ambil bagian base64 saja.
        const base64 = String(reader.result).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------
  function validateStep(stepNumber) {
    const fields = STEP_FIELDS[stepNumber] || [];
    let allValid = true;
    fields.forEach((cfg) => {
      const valid = validateField(cfg);
      if (!valid) allValid = false;
    });
    return allValid;
  }

  function validateField(cfg) {
    switch (cfg.type) {
      case "required":
        return validateRequired(cfg.name);
      case "email":
        return validateEmail(cfg.name);
      case "whatsapp":
        return validateWhatsapp(cfg.name);
      case "url":
        return validateUrl(cfg.name);
      case "template":
        return validateTemplate();
      case "file":
        return validateFile();
      default:
        return true;
    }
  }

  function getEl(name) {
    return form.querySelector(`[name="${name}"]`);
  }

  function validateRequired(name) {
    const el = getEl(name);
    const value = el.value.trim();
    if (!value) {
      showFieldError(name, "Wajib diisi.");
      return false;
    }
    return true;
  }

  function validateEmail(name) {
    if (!validateRequired(name)) return false;
    const el = getEl(name);
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(el.value.trim())) {
      showFieldError(name, "Format email tidak valid.");
      return false;
    }
    return true;
  }

  function validateWhatsapp(name) {
    if (!validateRequired(name)) return false;
    const el = getEl(name);
    const digitsOnly = el.value.trim().replace(/[\s-]/g, "");
    const pattern = /^(\+62|62|0)8[0-9]{7,12}$/;
    if (!pattern.test(digitsOnly)) {
      showFieldError(name, "Format nomor WhatsApp tidak valid.");
      return false;
    }
    return true;
  }

  function validateUrl(name) {
    if (!validateRequired(name)) return false;
    const el = getEl(name);
    try {
      new URL(el.value.trim());
      return true;
    } catch (e) {
      showFieldError(name, "Format link tidak valid.");
      return false;
    }
  }

  function validateTemplate() {
    if (!state.selectedTemplateId) {
      showFieldError("template", "Silakan pilih salah satu template.");
      return false;
    }
    return true;
  }

  function validateFile() {
    if (!state.file) {
      showFieldError("buktiPembayaran", "Silakan upload bukti pembayaran.");
      return false;
    }
    return true;
  }

  function showFieldError(name, message) {
    const errorEl = document.querySelector(`[data-error-for="${name}"]`);
    const inputEl = getEl(name);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add("has-error");
  }

  function clearFieldError(name) {
    const errorEl = document.querySelector(`[data-error-for="${name}"]`);
    const inputEl = getEl(name);
    if (errorEl) errorEl.textContent = "";
    if (inputEl) inputEl.classList.remove("has-error");
  }

  // ---------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------
  function collectFormData() {
    const data = {};
    Array.from(form.elements).forEach((el) => {
      if (!el.name || el.type === "file") return;
      data[el.name] = el.value.trim();
    });
    data.file = {
      name: state.file.name,
      mimeType: state.file.mimeType,
      base64: state.file.base64,
    };
    return data;
  }

  function submitOrder() {
    if (state.isSubmitting) return;

    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PASTE_") === 0) {
      showToast("APPS_SCRIPT_URL belum diatur di js/config.js.");
      return;
    }

    state.isSubmitting = true;
    btnNext.disabled = true;
    btnBack.disabled = true;
    loadingOverlay.hidden = false;

    const payload = { action: "submitOrder", data: collectFormData() };

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      // Content-Type text/plain menghindari CORS preflight (OPTIONS) yang
      // tidak didukung Google Apps Script Web App.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        loadingOverlay.hidden = true;
        if (result && result.success) {
          markSubmissionComplete(result.orderId);
          showSuccessModal(result.orderId);
        } else {
          throw new Error((result && result.message) || "Gagal mengirim pesanan.");
        }
      })
      .catch((err) => {
        loadingOverlay.hidden = true;
        state.isSubmitting = false;
        btnNext.disabled = false;
        btnBack.disabled = false;
        showToast(err.message || "Terjadi kesalahan. Silakan coba lagi.");
      });
  }

  function showSuccessModal(orderId) {
    successOrderId.textContent = orderId;
    successModal.hidden = false;
  }

  function handleGoHome() {
    window.location.reload();
  }

  // ---------------------------------------------------------------------
  // Prevent duplicate submission on refresh
  // ---------------------------------------------------------------------
  const STORAGE_KEY = "undangan_order_completed";

  function markSubmissionComplete(orderId) {
    try {
      sessionStorage.setItem(STORAGE_KEY, orderId);
    } catch (e) { /* sessionStorage tidak tersedia — abaikan */ }
  }

  function hasCompletedSubmission() {
    try {
      return Boolean(sessionStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return false;
    }
  }

  function renderAlreadySubmittedState() {
    const orderId = sessionStorage.getItem(STORAGE_KEY);
    showSuccessModal(orderId);
    document.querySelector(".card").style.visibility = "hidden";
  }

  // ---------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
