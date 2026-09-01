/**
 * ============================================================
 *  APP.JS — logika form multi-step, render template, submit & bayar
 * ============================================================
 */

(function () {
  "use strict";

  const TOTAL_STEPS = 4;
  let currentStep = 1;
  let selectedTemplateId = null;

  const form = document.getElementById("orderForm");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnSubmit = document.getElementById("btnSubmit");
  const formError = document.getElementById("formError");
  const loadingModal = document.getElementById("loadingModal");
  const loadingModalText = document.getElementById("loadingModalText");
  const orderSummary = document.getElementById("orderSummary");

  // ---------- Render template grid from config.js ----------
  function renderTemplates() {
    const grid = document.getElementById("templateGrid");
    grid.innerHTML = "";

    TEMPLATES.forEach((tpl) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "template-card";
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");
      card.dataset.templateId = tpl.id;

      card.innerHTML = `
        <img class="template-card__image" src="${tpl.image}" alt="Preview template ${escapeHtml(tpl.name)}" loading="lazy">
        <p class="template-card__name">${escapeHtml(tpl.name)}</p>
        <p class="template-card__price">${formatRupiah(tpl.price)}</p>
        <span class="template-card__check">✓ Terpilih</span>
      `;

      card.addEventListener("click", () => selectTemplate(tpl.id));
      grid.appendChild(card);
    });
  }

  function selectTemplate(templateId) {
    selectedTemplateId = templateId;
    document.querySelectorAll(".template-card").forEach((card) => {
      const isSelected = card.dataset.templateId === templateId;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-checked", String(isSelected));
    });
    clearFieldError("templateId");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatRupiah(amount) {
    return "Rp " + Number(amount).toLocaleString("id-ID");
  }

  // ---------- Step navigation ----------
  function goToStep(step) {
    document.querySelectorAll(".panel").forEach((panel) => {
      panel.classList.toggle("is-active", Number(panel.dataset.panel) === step);
    });
    document.querySelectorAll(".steps__item").forEach((item) => {
      const itemStep = Number(item.dataset.step);
      item.classList.toggle("is-active", itemStep === step);
      item.classList.toggle("is-done", itemStep < step);
    });

    btnPrev.hidden = step === 1;
    btnNext.hidden = step === TOTAL_STEPS;
    btnSubmit.hidden = step !== TOTAL_STEPS;
    orderSummary.hidden = step !== TOTAL_STEPS;

    if (step === TOTAL_STEPS) updateSummary();

    formError.hidden = true;
    currentStep = step;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSummary() {
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplateId);
    document.getElementById("summaryTemplateName").textContent = tpl ? tpl.name : "-";
    document.getElementById("summaryTemplatePrice").textContent = tpl ? formatRupiah(tpl.price) : "-";
  }

  // ---------- Field-level validation ----------
  const FIELD_RULES = {
    1: [
      { id: "ordererName", check: (v) => Validators.required(v) && Validators.maxLen(v, 100), message: "Nama wajib diisi." },
      { id: "ordererWhatsapp", check: Validators.whatsapp, message: "Format nomor WhatsApp tidak valid." },
      { id: "ordererEmail", check: Validators.email, message: "Format email tidak valid." }
    ],
    3: [
      { id: "groomFullName", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "groomNickname", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "groomParents", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "groomAddress", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "brideFullName", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "brideNickname", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "brideParents", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "brideAddress", check: (v) => Validators.required(v), message: "Wajib diisi." }
    ],
    4: [
      { id: "eventDate", check: (v) => Validators.required(v) && Validators.isFutureOrTodayDate(v), message: "Pilih tanggal acara (hari ini atau setelahnya)." },
      { id: "eventTime", check: (v) => Validators.required(v), message: "Waktu acara wajib diisi." },
      { id: "eventAddress", check: (v) => Validators.required(v), message: "Alamat lokasi wajib diisi." },
      { id: "mapsLink", check: Validators.url, message: "Link Google Maps tidak valid." },
      { id: "backgroundMusic", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "bankName", check: (v) => Validators.required(v), message: "Wajib diisi." },
      { id: "bankAccountNumber", check: (v) => Validators.required(v) && /^[0-9]{4,30}$/.test(v.trim()), message: "Nomor rekening hanya berupa angka." },
      { id: "bankAccountName", check: (v) => Validators.required(v), message: "Wajib diisi." }
    ]
  };

  function showFieldError(id, message) {
    const input = document.getElementById(id);
    const errorEl = document.querySelector(`[data-error-for="${id}"]`);
    if (input) input.classList.add("is-invalid");
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(id) {
    const input = document.getElementById(id);
    const errorEl = document.querySelector(`[data-error-for="${id}"]`);
    if (input) input.classList.remove("is-invalid");
    if (errorEl) errorEl.textContent = "";
  }

  function validateStep(step) {
    let isValid = true;
    const rules = FIELD_RULES[step] || [];

    rules.forEach(({ id, check, message }) => {
      const el = document.getElementById(id);
      const value = el ? el.value : "";
      if (!check(value)) {
        showFieldError(id, message);
        isValid = false;
      } else {
        clearFieldError(id);
      }
    });

    if (step === 2) {
      if (!selectedTemplateId) {
        document.querySelector('[data-error-for="templateId"]').textContent = "Pilih salah satu template.";
        isValid = false;
      } else {
        document.querySelector('[data-error-for="templateId"]').textContent = "";
      }
    }

    return isValid;
  }

  // ---------- Buttons ----------
  btnNext.addEventListener("click", () => {
    if (validateStep(currentStep)) {
      goToStep(Math.min(currentStep + 1, TOTAL_STEPS));
    }
  });

  btnPrev.addEventListener("click", () => {
    goToStep(Math.max(currentStep - 1, 1));
  });

  // ---------- Collect form data ----------
  function collectPayload() {
    const val = (id) => sanitizeText(document.getElementById(id).value);
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplateId);

    return {
      orderer_name: val("ordererName"),
      orderer_whatsapp: val("ordererWhatsapp"),
      orderer_email: val("ordererEmail"),

      template_id: tpl.id,
      template_name: tpl.name,
      template_price: tpl.price,

      groom_full_name: val("groomFullName"),
      groom_nickname: val("groomNickname"),
      groom_parents: val("groomParents"),
      groom_address: val("groomAddress"),

      bride_full_name: val("brideFullName"),
      bride_nickname: val("brideNickname"),
      bride_parents: val("brideParents"),
      bride_address: val("brideAddress"),

      event_date: val("eventDate"),
      event_time: val("eventTime"),
      event_address: val("eventAddress"),
      maps_link: val("mapsLink"),
      background_music: val("backgroundMusic"),

      bank_name: val("bankName"),
      bank_account_number: val("bankAccountNumber"),
      bank_account_name: val("bankAccountName"),
      notes: val("notes"),

      status: "pending_payment"
    };
  }

  // ---------- Loading modal helpers ----------
  function showLoading(text) {
    loadingModalText.textContent = text;
    loadingModal.classList.remove("is-hidden");
  }
  function hideLoading() {
    loadingModal.classList.add("is-hidden");
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  // ---------- Submit + Payment flow ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateStep(4)) return;
    formError.hidden = true;

    const payload = collectPayload();

    btnSubmit.disabled = true;
    showLoading("Menyimpan pesanan...");

    try {
      // 1) Simpan order ke Supabase (anon key, dibatasi RLS insert-only)
      const { data: inserted, error: insertError } = await supabaseClient
        .from("orders")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) throw new Error("Gagal menyimpan pesanan. Silakan coba lagi.");

      const orderId = inserted.id;

      // 2) Minta Snap token dari Edge Function (Server Key TIDAK pernah
      //    ada di frontend, hanya di Edge Function secrets).
      showLoading("Menyiapkan pembayaran...");

      const { data: txData, error: fnError } = await supabaseClient.functions.invoke(
        "create-transaction",
        { body: { order_id: orderId } }
      );

      if (fnError || !txData || !txData.token) {
        throw new Error("Gagal menyiapkan pembayaran. Silakan coba lagi.");
      }

      hideLoading();

      // 3) Buka Midtrans Snap popup
      window.snap.pay(txData.token, {
        onSuccess: () => {
          window.location.href = `sukses.html?order_id=${encodeURIComponent(orderId)}`;
        },
        onPending: () => {
          window.location.href = `sukses.html?order_id=${encodeURIComponent(orderId)}&status=pending`;
        },
        onError: () => {
          showFormError("Pembayaran gagal diproses. Silakan coba lagi.");
          btnSubmit.disabled = false;
        },
        onClose: () => {
          showFormError("Pembayaran belum diselesaikan. Anda dapat mencoba lagi.");
          btnSubmit.disabled = false;
        }
      });
    } catch (err) {
      hideLoading();
      showFormError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
      btnSubmit.disabled = false;
    }
  });

  // ---------- Init ----------
  renderTemplates();
  goToStep(1);
})();
