/* ============================================================
   FreshFold — app logic
   All data lives in localStorage. No backend, no tracking,
   no network calls. Perfect for a Netlify static deploy.
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "freshfold_orders_v1";
  const DEMO_ID = "FF-482913";

  const STAGES = [
    "Order placed",
    "Picked up",
    "In the wash",
    "Ironing & folding",
    "Out for delivery",
    "Delivered",
  ];

  const RATES = {
    "Wash & Fold": 69,
    "Dry Cleaning": 149,
    "Ironing & Press": 15,
    "Shoe Care": 249,
    "Bedding & Curtains": 199,
  };

  const EXPRESS_FEE = 99;

  /* ---------------- Storage ---------------- */

  function readOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function writeOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      /* private mode / quota — app still works for this session */
    }
  }

  function seedDemoOrder() {
    const orders = readOrders();
    if (orders.some((o) => o.id === DEMO_ID)) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    orders.push({
      id: DEMO_ID,
      name: "Ananya Sharma",
      phone: "9876543210",
      address: "Flat 402, Sunshine Apartments, Indiranagar",
      service: "Wash & Fold",
      weight: 6,
      date: tomorrow.toISOString().slice(0, 10),
      slot: "10:00 AM – 1:00 PM",
      express: false,
      total: 414,
      stage: 4,
      createdAt: Date.now() - 1000 * 60 * 60 * 20,
      demo: true,
    });

    writeOrders(orders);
  }

  /* ---------------- Helpers ---------------- */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function money(n) {
    return "₹" + n.toLocaleString("en-IN");
  }

  function rateFor(serviceLabel) {
    const key = Object.keys(RATES).find((k) => serviceLabel.startsWith(k));
    return key ? RATES[key] : 0;
  }

  function newOrderId() {
    const n = Math.floor(100000 + Math.random() * 900000);
    return "FF-" + n;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2600);
  }

  /* ---------------- Nav ---------------- */

  function initNav() {
    const nav = $("#nav");
    const toggle = $("#navToggle");
    const links = $("#navLinks");

    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });

    links.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- Booking form ---------------- */

  function initForm() {
    const form = $("#bookingForm");
    const serviceSel = $("#service");
    const weightInput = $("#weight");
    const expressBox = $("#express");
    const estimateEl = $("#estimate");
    const dateInput = $("#date");

    /* Pickup defaults: earliest tomorrow, pre-filled. */
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    dateInput.min = new Date().toISOString().slice(0, 10);
    dateInput.value = iso;

    function updateEstimate() {
      const rate = rateFor(serviceSel.value);
      const qty = Math.max(0, Number(weightInput.value) || 0);
      let total = rate * qty;
      if (expressBox.checked) total += EXPRESS_FEE;
      estimateEl.textContent = money(total || 0);
      return total;
    }

    [serviceSel, weightInput, expressBox].forEach((el) => {
      el.addEventListener("input", updateEstimate);
      el.addEventListener("change", updateEstimate);
    });
    updateEstimate();

    function setError(name, message) {
      const input = form.elements[name];
      const wrapper = input ? input.closest(".field") : null;
      const slot = $('[data-error-for="' + name + '"]', form);
      if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));
      if (slot) slot.textContent = message || "";
    }

    function validate() {
      const values = {
        name: $("#name").value.trim(),
        phone: $("#phone").value.replace(/[^\d]/g, ""),
        address: $("#address").value.trim(),
        service: serviceSel.value,
        weight: Number(weightInput.value),
        date: dateInput.value,
        slot: $("#slot").value,
      };

      const errors = {};

      if (values.name.length < 2) errors.name = "Please enter your name.";
      if (values.phone.length !== 10) errors.phone = "Enter a valid 10-digit number.";
      if (values.address.length < 8) errors.address = "Please add a complete address.";
      if (!values.service) errors.service = "Choose a service.";
      if (!values.weight || values.weight < 1 || values.weight > 100)
        errors.weight = "Enter a quantity between 1 and 100.";
      if (!values.date) errors.date = "Choose a pickup date.";
      else if (values.date < dateInput.min) errors.date = "Pick today or a later date.";
      if (!values.slot) errors.slot = "Choose a pickup slot.";

      Object.keys(errors).forEach((k) => setError(k, errors[k]));
      return { values, errors, ok: Object.keys(errors).length === 0 };
    }

    ["name", "phone", "address", "service", "weight", "date", "slot"].forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      input.addEventListener("input", () => setError(name, ""));
      input.addEventListener("change", () => setError(name, ""));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { values, ok } = validate();
      if (!ok) {
        const firstBad = $(".has-error input, .has-error select", form);
        if (firstBad) firstBad.focus();
        toast("Please fix the highlighted fields.");
        return;
      }

      const total = updateEstimate();
      const order = {
        id: newOrderId(),
        name: values.name,
        phone: values.phone,
        address: values.address,
        service: values.service.split(" — ")[0],
        weight: values.weight,
        date: values.date,
        slot: values.slot,
        express: expressBox.checked,
        total: total,
        stage: 0,
        createdAt: Date.now(),
      };

      const orders = readOrders();
      orders.unshift(order);
      writeOrders(orders);

      form.reset();
      dateInput.value = iso;
      expressBox.checked = false;
      updateEstimate();

      openSuccess(order);
    });
  }

  /* ---------------- Success modal ---------------- */

  let lastOrderId = null;

  function openSuccess(order) {
    lastOrderId = order.id;
    $("#modalOrderId").textContent = order.id;
    const modal = $("#successModal");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("#successModal").hidden = true;
    document.body.style.overflow = "";
  }

  function initModal() {
    $$("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#successModal").hidden) closeModal();
    });

    $("#modalTrack").addEventListener("click", () => {
      closeModal();
      if (!lastOrderId) return;
      $("#trackInput").value = lastOrderId;
      renderOrder(lastOrderId, true);
      $("#track").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------------- Tracking ---------------- */

  function findOrder(id) {
    const clean = String(id || "").trim().toUpperCase();
    if (!clean) return null;
    return readOrders().find((o) => o.id.toUpperCase() === clean) || null;
  }

  function renderOrder(id, scrollTo) {
    const box = $("#trackResult");
    const input = $("#trackInput");
    if (!box) return;

    const order = findOrder(id);
    if (!order) {
      box.hidden = false;
      box.innerHTML =
        '<div class="track__empty">' +
        "We couldn't find an order with that ID.<br>Check the confirmation message and try again." +
        "</div>";
      return;
    }

    const stage = Math.min(Math.max(order.stage || 0, 0), STAGES.length - 1);
    const done = stage === STAGES.length - 1;

    const steps = STAGES.map((label, i) => {
      const cls = i < stage ? "is-done" : i === stage ? "is-current" : "";
      const mark = i < stage ? "✓" : i === stage ? "•" : "";
      let sub = "";
      if (i === 0) sub = formatDate(order.date) + " · " + order.slot;
      if (i === stage) sub = done ? "Completed — enjoy fresh clothes." : "Happening now";
      else if (i > stage) sub = "Pending";
      return (
        '<li class="' + cls + '">' +
        '<span class="timeline__dot">' + mark + "</span>" +
        '<div class="timeline__text"><strong>' + label + "</strong>" +
        (sub ? "<span>" + sub + "</span>" : "") +
        "</div></li>"
      );
    }).join("");

    box.hidden = false;
    box.innerHTML =
      '<div class="order-head">' +
      "<h3>" + order.id + "</h3>" +
      '<span class="status-chip ' + (done ? "is-done" : "") + '">' +
      STAGES[stage] + "</span></div>" +
      '<div class="order-meta">' +
      "<span>Service <b>" + order.service + "</b></span>" +
      "<span>Qty <b>" + order.weight + (rateFor(order.service) === 69 ? " kg" : " pcs") + "</b></span>" +
      "<span>Total <b>" + money(order.total) + "</b></span>" +
      (order.express ? "<span><b>Express</b> 6-hour</span>" : "") +
      "</div>" +
      '<div class="progress" style="margin:0 0 1.6rem"><span style="width:' +
      Math.round((stage / (STAGES.length - 1)) * 100) + '%"></span></div>' +
      '<ul class="timeline">' + steps + "</ul>" +
      '<div class="track__demo"><button type="button" id="advanceStage">' +
      (done ? "Reset demo status" : "Advance status (demo)") +
      "</button></div>";

    if (scrollTo) box.scrollIntoView({ behavior: "smooth", block: "nearest" });

    const adv = $("#advanceStage");
    if (adv) {
      adv.addEventListener("click", () => {
        const orders = readOrders();
        const target = orders.find((o) => o.id === order.id);
        if (!target) return;
        target.stage = done ? 0 : stage + 1;
        writeOrders(orders);
        renderOrder(order.id, false);
        toast(done ? "Demo order reset." : "Status updated: " + STAGES[target.stage]);
      });
    }
  }

  function initTracking() {
    const form = $("#trackForm");
    const input = $("#trackInput");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value.trim();
      if (!value) {
        toast("Enter your order ID first.");
        input.focus();
        return;
      }
      renderOrder(value, true);
    });

    /* Make the demo order discoverable. */
    const hint = $(".track__hint");
    if (hint) {
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = DEMO_ID;
      link.style.fontWeight = "700";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        input.value = DEMO_ID;
        renderOrder(DEMO_ID, true);
      });
      hint.innerHTML = "Just exploring? Try demo order ";
      hint.appendChild(link);
      hint.append(".");
    }
  }

  /* ---------------- Boot ---------------- */

  function init() {
    seedDemoOrder();
    initNav();
    initForm();
    initModal();
    initTracking();

    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
