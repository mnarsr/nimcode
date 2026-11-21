/* =====================================================================
   nimcode – Motion
   Netz-Hintergrund im Hero, gestaffeltes Einblenden, Lichtkegel auf
   Karten. Läuft nur, wenn der Nutzer keine reduzierte Bewegung wünscht.
   ===================================================================== */

(function () {
  "use strict";

  var html = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  html.classList.add("motion");

  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Reihenfolge-Index für gestaffelte Animationen ---------- */

  function indexChildren(container) {
    Array.prototype.forEach.call(container.children, function (child, i) {
      child.style.setProperty("--i", i);
    });
  }

  function initHeroText() {
    document.querySelectorAll(".hero-text").forEach(indexChildren);
  }

  var STAGGER = [
    ".services",
    ".pricing-grid",
    ".about-cards",
    ".steps",
    ".shots-row",
    ".faq-list",
    ".check-list",
    ".industry-grid",
    ".example-facts"
  ].join(",");

  function initStagger() {
    document.querySelectorAll(STAGGER).forEach(function (el) {
      if (!el.closest(".section")) return;
      el.classList.add("stagger");
      indexChildren(el);
    });

    // Sicherheitsnetz: nach 5 s alles sichtbar, egal was passiert
    setTimeout(function () {
      document.querySelectorAll(".section").forEach(function (s) { s.classList.add("show"); });
    }, 5000);
  }

  /* ---------- Lichtkegel auf Karten ---------- */

  function initSpotlight() {
    if (!finePointer) return;

    var cards = document.querySelectorAll(".card, .price-card, .mini-card, .step, .portfolio-card");
    cards.forEach(function (card) {
      card.classList.add("spot");
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  /* ---------- Netz-Hintergrund im Hero (Canvas) ---------- */

  function initNetwork() {
    var hero = document.querySelector(".hero, .page-hero");
    if (!hero) return;

    var canvas = document.createElement("canvas");
    canvas.className = "net-bg";
    canvas.setAttribute("aria-hidden", "true");
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, points = [], running = false, visible = true, rafId = null;
    var mouse = { x: -9999, y: -9999 };

    function color(alpha) {
      var dark = html.classList.contains("dark");
      return dark
        ? "rgba(143,214,201," + alpha + ")"
        : "rgba(15,61,62," + (alpha * 0.75) + ")";
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var target = Math.round(Math.min(70, Math.max(24, (w * h) / 16000)));
      if (w < 700) target = Math.min(target, 30);

      points = [];
      for (var i = 0; i < target; i++) {
        points.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 0.8
        });
      }
    }

    var LINK = 130;

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // sanft von der Maus wegschieben
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        var md = mdx * mdx + mdy * mdy;
        if (md < 14000) {
          p.x += mdx * 0.012;
          p.y += mdy * 0.012;
        }

        for (var j = i + 1; j < points.length; j++) {
          var q = points[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = color((1 - d / LINK) * 0.28);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = color(0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || !visible || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    resize();
    canvas.classList.add("is-on");
    start();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    if (finePointer) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
      }, { passive: true });
      hero.addEventListener("pointerleave", function () {
        mouse.x = mouse.y = -9999;
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(hero);
    }
  }

  /* ---------- Start ---------- */

  function safe(fn) {
    try { fn(); } catch (e) { console.error("motion:", e); }
  }

  function init() {
    [initHeroText, initStagger, initSpotlight, initNetwork].forEach(safe);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
