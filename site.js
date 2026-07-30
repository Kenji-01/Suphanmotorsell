/* ===================================================================
   SUPHAN MOTORSALE — shared behaviour
   Icon rendering, mobile nav panel, scroll reveal.
   =================================================================== */

/* Lucide icons ---------------------------------------------------- */
if (window.lucide) lucide.createIcons();

/* Mobile nav panel ------------------------------------------------ */
(function () {
  const burger = document.getElementById('burger');
  const panel = document.getElementById('mobile-panel');
  if (!burger || !panel) return;

  burger.addEventListener('click', () => {
    const open = panel.dataset.open === 'true';
    panel.dataset.open = String(!open);
    burger.setAttribute('aria-expanded', String(!open));
    burger.setAttribute('aria-label', !open ? 'ปิดเมนู' : 'เปิดเมนู');
  });

  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    panel.dataset.open = 'false';
    burger.setAttribute('aria-expanded', 'false');
  }));
})();

/* Scroll reveal --------------------------------------------------- */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.dataset.shown = 'true');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.dataset.shown = 'true';
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  items.forEach(el => io.observe(el));
})();
