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
      if (e.target.classList.contains("nav__link")) {
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
     Щоб заявки приходили тобі в Telegram, впиши нижче два значення:
       1) TG_BOT_TOKEN — токен бота від @BotFather
       2) TG_CHAT_ID   — твій chat_id (дізнатися: напиши боту @userinfobot)
     Поки вони порожні, форма просто показує «Дякуємо» без відправки.        */
  var TG_BOT_TOKEN = "8613342657:AAHvufe9hvzwpSTMsM-6pcYMVj712PBRg0c";
  var TG_CHAT_ID = "8837665295";

  const form = document.getElementById("leadForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      let valid = true;
      ["name", "phone"].forEach((id) => {
        const field = form.elements[id];
        if (!field.value.trim()) {
          field.classList.add("invalid");
          valid = false;
        } else {
          field.classList.remove("invalid");
        }
      });
      if (!valid) return;

      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;

      const data = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        direction: form.elements.direction.value || "не вказано",
        msg: form.elements.msg.value.trim() || "—",
      };
      const text =
        "🔔 Нова заявка — Firefly School\n\n" +
        "👤 Ім'я: " + data.name + "\n" +
        "📞 Телефон: " + data.phone + "\n" +
        "🎯 Напрямок: " + data.direction + "\n" +
        "💬 Коментар: " + data.msg;

      if (TG_BOT_TOKEN && TG_CHAT_ID) {
        try {
          await fetch("https://api.telegram.org/bot" + TG_BOT_TOKEN + "/sendMessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: TG_CHAT_ID, text: text }),
          });
        } catch (err) {
          console.error("Не вдалося надіслати заявку в Telegram:", err);
        }
      } else {
        console.warn("Telegram не налаштовано — впиши TG_BOT_TOKEN і TG_CHAT_ID у script.js");
      }

      if (note) note.hidden = false;
      form.reset();
    });
    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("invalid") && e.target.value.trim()) {
        e.target.classList.remove("invalid");
      }
    });
  }
})();
