/* ═══════════════════════════════════════════
   FireFly School — interactions
   ═══════════════════════════════════════════ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Current year ── */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Mobile menu ── */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── Reveal on scroll ── */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ── Fireflies in hero ── */
  const flyBox = document.getElementById("fireflies");
  if (flyBox && !reduceMotion) {
    const COUNT = window.innerWidth < 600 ? 14 : 26;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < COUNT; i++) {
      const f = document.createElement("span");
      f.className = "firefly";
      const size = 3 + Math.random() * 5;
      f.style.left = Math.random() * 100 + "%";
      f.style.top = Math.random() * 100 + "%";
      f.style.width = size + "px";
      f.style.height = size + "px";
      f.style.setProperty("--dur", 7 + Math.random() * 8 + "s");
      f.style.animationDelay = -(Math.random() * 8) + "s, " + -(Math.random() * 2) + "s";
      frag.appendChild(f);
    }
    flyBox.appendChild(frag);
  }

  /* ── Live timestamp (UKRAINE, HH:MM:SS) ── */
  const stamps = document.querySelectorAll(".timestamp");
  if (stamps.length) {
    const tick = function () {
      stamps.forEach((el) => {
        const tz = el.dataset.timezone || "Europe/Kyiv";
        const country = el.dataset.country || "UKRAINE";
        const time = new Date().toLocaleTimeString("en-GB", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        el.textContent = country + ", " + time;
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ── Lead form → надсилання заявки в Telegram ──
     Заявка йде на Cloudflare Worker (WORKER_URL), а не напряму в Telegram —
     токен бота зберігається у секретах Worker'а і ніколи не потрапляє в код сайту.
     Заповни WORKER_URL адресою свого Worker'а після його деплою.             */
  var WORKER_URL = "https://firefly-lead-form.tkachenko-ui-ux.workers.dev";

  const form = document.getElementById("leadForm");
  const note = document.getElementById("formNote");
  const errorNote = document.getElementById("formError");

  /* ── Маска телефону +38 (0XX) XXX-XX-XX ── */
  const phoneField = form ? form.elements.phone : null;
  function formatPhone(raw) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("380")) digits = digits.slice(3);
    else if (digits.startsWith("0") && digits.length >= 1) digits = digits.slice(digits.startsWith("00") ? 2 : 0);
    digits = digits.replace(/^0/, "");
    digits = digits.slice(0, 9);
    let out = "+38 (0";
    out += digits.slice(0, 2);
    if (digits.length > 2) out += ") " + digits.slice(2, 5);
    else if (digits.length === 2) out += ")";
    if (digits.length > 5) out += "-" + digits.slice(5, 7);
    if (digits.length > 7) out += "-" + digits.slice(7, 9);
    return out;
  }
  function isValidPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("380");
  }
  if (phoneField) {
    phoneField.addEventListener("focus", function () {
      if (!phoneField.value) phoneField.value = "+38 (0";
    });
    phoneField.addEventListener("input", function () {
      phoneField.value = formatPhone(phoneField.value);
    });
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      let valid = true;
      ["name"].forEach((id) => {
        const field = form.elements[id];
        if (!field.value.trim()) {
          field.classList.add("invalid");
          valid = false;
        } else {
          field.classList.remove("invalid");
        }
      });
      if (!isValidPhone(form.elements.phone.value)) {
        form.elements.phone.classList.add("invalid");
        valid = false;
      } else {
        form.elements.phone.classList.remove("invalid");
      }
      const consentField = form.elements.consent;
      if (consentField && !consentField.checked) {
        consentField.classList.add("invalid");
        valid = false;
      } else if (consentField) {
        consentField.classList.remove("invalid");
      }
      if (!valid) return;

      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      if (errorNote) errorNote.hidden = true;

      const data = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        direction: form.elements.direction.value || "не вказано",
        msg: form.elements.msg.value.trim() || "—",
        website: form.elements.website ? form.elements.website.value : "", // honeypot
      };

      let ok = false;
      if (WORKER_URL && WORKER_URL.indexOf("YOUR-SUBDOMAIN") === -1) {
        try {
          const res = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          ok = res.ok;
        } catch (err) {
          console.error("Не вдалося надіслати заявку:", err);
        }
      } else {
        console.warn("WORKER_URL не налаштовано — впиши адресу свого Cloudflare Worker у script.js");
      }

      submitBtn.disabled = false;

      if (ok) {
        if (note) note.hidden = false;
        form.reset();
      } else {
        if (errorNote) errorNote.hidden = false;
      }
    });
    form.addEventListener("input", function (e) {
      const isFilled = e.target.type === "checkbox" ? e.target.checked : e.target.value.trim();
      if (e.target.classList.contains("invalid") && isFilled) {
        e.target.classList.remove("invalid");
      }
    });
  }
})();
