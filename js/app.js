const html = document.documentElement;
html.classList.add("js");

/* ---------- Safe localStorage (Safari private mode, blocked storage) ---------- */

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  }
};

const STORAGE_KEYS = {
  theme: "nimcode-theme",
  lang: "nimcode-lang",
  consent: "cookieConsent"
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* ---------- Theme ---------- */

function initTheme() {
  const themeToggle = document.getElementById("themeToggle");

  const updateState = () => {
    if (!themeToggle) return;
    const isDark = html.classList.contains("dark");
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Light Mode aktivieren" : "Dark Mode aktivieren");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  };

  // Klasse "dark" wird schon im <head> gesetzt (kein Aufblitzen). Hier nur absichern.
  const saved = store.get(STORAGE_KEYS.theme);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  html.classList.toggle("dark", saved ? saved === "dark" : prefersDark);
  updateState();

  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const darkActive = html.classList.toggle("dark");
    store.set(STORAGE_KEYS.theme, darkActive ? "dark" : "light");
    updateState();
  });
}

/* ---------- Language ---------- */

function applyLanguage(lang) {
  const langToggle = document.getElementById("langToggle");
  const supported = lang === "en" ? "en" : "de";
  html.lang = supported;

  document.querySelectorAll("[data-de]").forEach((element) => {
    const text = supported === "de" ? element.dataset.de : element.dataset.en;
    if (text) element.textContent = text;
  });

  if (langToggle) {
    langToggle.textContent = supported === "de" ? "EN" : "DE";
    langToggle.setAttribute(
      "aria-label",
      supported === "de" ? "Switch language to English" : "Sprache auf Deutsch wechseln"
    );
  }
}

function initLanguage() {
  const langToggle = document.getElementById("langToggle");
  applyLanguage(store.get(STORAGE_KEYS.lang) || html.lang || "de");

  if (!langToggle) return;

  langToggle.addEventListener("click", () => {
    const next = html.lang === "de" ? "en" : "de";
    applyLanguage(next);
    store.set(STORAGE_KEYS.lang, next);
  });
}

/* ---------- Mobile menu ---------- */

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const siteMenu = document.getElementById("siteMenu");
  if (!menuToggle || !siteMenu) return;

  const setOpen = (open) => {
    siteMenu.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "✕" : "☰";
  };

  menuToggle.addEventListener("click", () => {
    setOpen(!siteMenu.classList.contains("is-open"));
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 760) setOpen(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && siteMenu.classList.contains("is-open")) setOpen(false);
  });
}

/* ---------- Reveal on scroll ---------- */

function initReveal() {
  const sections = document.querySelectorAll(".section");

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("show"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  sections.forEach((section) => observer.observe(section));

  // Sicherheitsnetz: falls etwas den Observer blockiert, nach 4 s alles zeigen
  setTimeout(() => sections.forEach((section) => section.classList.add("show")), 4000);
}

/* ---------- Cursor + parallax (nur Desktop mit Maus) ---------- */

function initPointerEffects() {
  if (!finePointer || reduceMotion) return;

  const cursor = document.querySelector(".cursor");
  const layers = document.querySelectorAll(".parallax-layer");
  const useParallax = layers.length > 0 && window.innerWidth > 900;

  let rafId = null;
  let x = 0;
  let y = 0;

  window.addEventListener("mousemove", (event) => {
    x = event.clientX;
    y = event.clientY;
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        cursor.classList.add("is-visible");
      }

      if (useParallax) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        layers.forEach((layer, index) => {
          const speed = (index + 1) * 0.015;
          layer.style.transform = `translate(${(x - cx) * speed}px, ${(y - cy) * speed}px)`;
        });
      }

      rafId = null;
    });
  }, { passive: true });
}

/* ---------- Scroll progress ---------- */

function initProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  let rafId = null;

  const update = () => {
    const scrollTop = html.scrollTop || document.body.scrollTop;
    const max = html.scrollHeight - html.clientHeight;
    progressBar.style.width = `${max > 0 ? (scrollTop / max) * 100 : 0}%`;
    rafId = null;
  };

  window.addEventListener("scroll", () => {
    if (!rafId) rafId = requestAnimationFrame(update);
  }, { passive: true });

  update();
}

/* ---------- Portfolio slider ---------- */

function initPortfolioSlider() {
  const slider = document.getElementById("portfolioSlider");
  const prev = document.querySelector(".portfolio-prev");
  const next = document.querySelector(".portfolio-next");
  if (!slider || !prev || !next) return;

  const step = () => {
    const card = slider.querySelector(".portfolio-card");
    const gap = parseFloat(getComputedStyle(slider).columnGap) || 24;
    return card ? card.getBoundingClientRect().width + gap : 320;
  };

  prev.addEventListener("click", () => slider.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => slider.scrollBy({ left: step(), behavior: "smooth" }));
}

/* ---------- Loader (kann nicht mehr hängen bleiben) ---------- */

function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    loader.style.transition = "opacity 0.35s ease";
    loader.style.opacity = "0";
    setTimeout(() => { loader.style.display = "none"; }, 350);
  };

  if (document.readyState === "complete") hide();
  else window.addEventListener("load", hide, { once: true });

  setTimeout(hide, 2500); // Sicherheitsnetz
}

/* ---------- Cookie-Einwilligung (Google Analytics nur nach "Akzeptieren") ---------- */

function initConsent() {
  const banner = document.getElementById("cookieBanner");
  const accept = document.getElementById("acceptCookies");
  const decline = document.getElementById("declineCookies");
  const reopen = document.getElementById("cookieSettings");
  if (!banner || !accept || !decline) return;

  const show = () => { banner.style.display = "flex"; };
  const hide = () => { banner.style.display = "none"; };
  const loadAnalytics = () => {
    if (typeof window.loadGA === "function") window.loadGA();
  };

  accept.addEventListener("click", () => {
    store.set(STORAGE_KEYS.consent, "accepted");
    hide();
    loadAnalytics();
  });

  decline.addEventListener("click", () => {
    const wasLoaded = Boolean(window.__gaLoaded);
    store.set(STORAGE_KEYS.consent, "declined");
    hide();
    // GA läuft in dieser Sitzung schon -> Seite neu laden, damit es endet
    if (wasLoaded) location.reload();
  });

  if (reopen) {
    reopen.addEventListener("click", (event) => {
      event.preventDefault();
      show();
    });
  }

  const consent = store.get(STORAGE_KEYS.consent);

  if (consent === "accepted") {
    hide();
    loadAnalytics();
  } else if (consent === "declined") {
    hide();
  } else {
    show();
  }
}

/* ---------- Start (jede Funktion einzeln abgesichert) ---------- */

function safeInit(fn) {
  try { fn(); } catch (error) { console.error(`${fn.name} fehlgeschlagen:`, error); }
}

function initApp() {
  [
    initTheme,
    initLanguage,
    initMobileMenu,
    initReveal,
    initPointerEffects,
    initProgressBar,
    initPortfolioSlider,
    initLoader,
    initConsent
  ].forEach(safeInit);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  initApp();
}
