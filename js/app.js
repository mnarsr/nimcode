const html = document.documentElement;
html.classList.add("js");

const themeToggle = document.getElementById("themeToggle");
const langToggle = document.getElementById("langToggle");
const menuToggle = document.getElementById("menuToggle");
const siteMenu = document.getElementById("siteMenu");
const progressBar = document.getElementById("progressBar");
const loader = document.getElementById("loader");
const cursor = document.querySelector(".cursor");
const modal = document.getElementById("modal");
const modalText = document.getElementById("modalText");
const modalClose = document.getElementById("modalClose");
const slides = document.querySelectorAll(".slide");
const sections = document.querySelectorAll(".section");
const counters = document.querySelectorAll(".counter");
const parallaxLayers = document.querySelectorAll(".parallax-layer");
const testimonialSlider = document.getElementById("testimonialSlider");
const testimonialPrev = document.getElementById("testimonialPrev");
const testimonialNext = document.getElementById("testimonialNext");

const STORAGE_KEYS = {
  theme: "nimcode-theme",
  lang: "nimcode-lang"
};

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme ? savedTheme === "dark" : prefersDark;

  html.classList.toggle("dark", isDark);
  updateThemeToggleState();

  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    const darkModeActive = html.classList.toggle("dark");
    localStorage.setItem(STORAGE_KEYS.theme, darkModeActive ? "dark" : "light");
    updateThemeToggleState();
  });
}

function updateThemeToggleState() {
  if (!themeToggle) return;

  const isDark = html.classList.contains("dark");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Light Mode aktivieren" : "Dark Mode aktivieren"
  );
  themeToggle.textContent = isDark ? "☀️" : "🌙";
}

function initLanguage() {
  const savedLang = localStorage.getItem(STORAGE_KEYS.lang);
  const initialLang = savedLang || html.lang || "de";

  applyLanguage(initialLang);

  if (!langToggle) return;

  langToggle.addEventListener("click", () => {
    const nextLang = html.lang === "de" ? "en" : "de";
    applyLanguage(nextLang);
    localStorage.setItem(STORAGE_KEYS.lang, nextLang);
  });
}

function applyLanguage(lang) {
  const supportedLang = lang === "en" ? "en" : "de";
  html.lang = supportedLang;

  document.querySelectorAll("[data-de]").forEach((element) => {
    const nextText = supportedLang === "de" ? element.dataset.de : element.dataset.en;
    if (nextText) {
      element.textContent = nextText;
    }
  });

  if (langToggle) {
    langToggle.textContent = supportedLang === "de" ? "EN" : "DE";
    langToggle.setAttribute(
      "aria-label",
      supportedLang === "de" ? "Switch language to English" : "Sprache auf Deutsch wechseln"
    );
  }
}

function initMobileMenu() {
  if (!menuToggle || !siteMenu) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 760) {
        siteMenu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
      }
    });
  });
}

function initReveal() {
  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("show"));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  sections.forEach((section) => revealObserver.observe(section));
}

function initCursor() {
  if (!cursor) return;

  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!isFinePointer || reduceMotion) {
    cursor.style.display = "none";
    return;
  }

  let rafId = null;
  let x = 0;
  let y = 0;

  window.addEventListener("mousemove", (event) => {
    x = event.clientX;
    y = event.clientY;

    if (rafId) return;

    rafId = window.requestAnimationFrame(() => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      rafId = null;
    });
  });
}

function initParallax() {
  if (!parallaxLayers.length) return;
  if (window.innerWidth <= 900) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  let rafId = null;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if (rafId) return;

    rafId = window.requestAnimationFrame(() => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      parallaxLayers.forEach((layer, index) => {
        const speed = (index + 1) * 0.015;
        const x = (mouseX - centerX) * speed;
        const y = (mouseY - centerY) * speed;
        layer.style.transform = `translate(${x}px, ${y}px)`;
      });

      rafId = null;
    });
  });
}

function initCounters() {
  if (!counters.length) return;

  if (!("IntersectionObserver" in window)) {
    counters.forEach((counter) => {
      counter.textContent = counter.dataset.target || counter.textContent;
    });
    return;
  }

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const counter = entry.target;
      const target = Number(counter.dataset.target);

      if (!Number.isFinite(target)) {
        observer.unobserve(counter);
        return;
      }

      let current = 0;
      const increment = Math.max(1, Math.ceil(target / 60));

      const updateCounter = () => {
        current += increment;

        if (current >= target) {
          counter.textContent = String(target);
          observer.unobserve(counter);
          return;
        }

        counter.textContent = String(current);
        requestAnimationFrame(updateCounter);
      };

      updateCounter();
    });
  }, { threshold: 0.4 });

  counters.forEach((counter) => counterObserver.observe(counter));
}

function initProgressBar() {
  if (!progressBar) return;

  let rafId = null;

  const updateProgressBar = () => {
    const scrollTop = html.scrollTop || document.body.scrollTop;
    const scrollHeight = html.scrollHeight - html.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    rafId = null;
  };

  window.addEventListener("scroll", () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(updateProgressBar);
  });

  updateProgressBar();
}

function initModal() {
  if (!modal || !modalText || !slides.length) return;

  const openModal = (text) => {
    modalText.textContent = text;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (modalClose) {
      modalClose.focus();
    }
  };

  const closeModal = () => {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  slides.forEach((slide) => {
    slide.addEventListener("click", () => {
      openModal(slide.dataset.modal || slide.textContent.trim());
    });
  });

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display === "flex") {
      closeModal();
    }
  });
}

function initTestimonialSlider() {
  if (!testimonialSlider) return;

  const scrollAmount = () => testimonialSlider.clientWidth * 0.85;

  if (testimonialPrev) {
    testimonialPrev.addEventListener("click", () => {
      testimonialSlider.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
  }

  if (testimonialNext) {
    testimonialNext.addEventListener("click", () => {
      testimonialSlider.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let autoSlide = window.setInterval(() => {
    const maxScrollLeft = testimonialSlider.scrollWidth - testimonialSlider.clientWidth;
    const nearEnd = testimonialSlider.scrollLeft >= maxScrollLeft - 10;

    if (nearEnd) {
      testimonialSlider.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      testimonialSlider.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    }
  }, 4500);

  testimonialSlider.addEventListener("mouseenter", () => {
    window.clearInterval(autoSlide);
  });

  testimonialSlider.addEventListener("mouseleave", () => {
    autoSlide = window.setInterval(() => {
      const maxScrollLeft = testimonialSlider.scrollWidth - testimonialSlider.clientWidth;
      const nearEnd = testimonialSlider.scrollLeft >= maxScrollLeft - 10;

      if (nearEnd) {
        testimonialSlider.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        testimonialSlider.scrollBy({ left: scrollAmount(), behavior: "smooth" });
      }
    }, 4500);
  });
}

function initLoader() {
  if (!loader) return;

  window.addEventListener("load", () => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.35s ease";

    window.setTimeout(() => {
      loader.style.display = "none";
    }, 350);
  });
}

function initApp() {
  initTheme();
  initLanguage();
  initMobileMenu();
  initReveal();
  initCursor();
  initParallax();
  initCounters();
  initProgressBar();
  initModal();
  initTestimonialSlider();
  initLoader();
}

initApp();