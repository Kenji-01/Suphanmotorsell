/* ===================================================================
   Promo banner carousel.

   Reads promos.json at runtime so marketing/admin staff can swap
   banners by replacing image files or editing that one JSON file —
   no code change, no redeploy of markup.

   NOTE ON LOCAL FILES: fetch() of a local .json is blocked by the
   browser when the page is opened as file:///... (CORS). On a real
   host (Cloudflare Pages etc.) it works normally. When it is blocked
   we fall back to a built-in copy of the list so the section still
   renders instead of collapsing.
   =================================================================== */
(function () {
  const root = document.getElementById('promos');
  if (!root) return;

  const viewport = root.querySelector('.promos__viewport');
  const track = root.querySelector('.promos__track');
  const dotsEl = root.querySelector('.promos__dots');
  const titleEl = root.querySelector('.promos__title');
  const subEl = root.querySelector('.promos__sub');
  const prevBtn = root.querySelector('.promos__nav--prev');
  const nextBtn = root.querySelector('.promos__nav--next');

  // Mirrors promos.json — only used if fetch is unavailable (file:// preview).
  const FALLBACK = {
    settings: {
      autoplaySeconds: 6,
      heading: 'โปรโมชั่นและข่าวสาร',
      subheading: 'อัปเดตโปรโมชั่นล่าสุดจากฮอนด้าและสุพรรณมอเตอร์เซล'
    },
    items: [
      { image: 'assets/promos/promo-1.webp', alt: 'My Honda Moto แอปเดียว จบทุกเรื่องรถ', href: '', active: true },
      { image: 'assets/promos/promo-2.webp', alt: 'THE ONE-SIXTI-ER ตัวจริง 160', href: '', active: true },
      { image: 'assets/promos/promo-3.webp', alt: 'PCX160 สปอยล์สายพรีเมียม', href: '', active: true },
      { image: 'assets/promos/promo-4.webp', alt: 'CLICK160 โดนใจสายสปอร์ต', href: '', active: true },
      { image: 'assets/promos/promo-5.webp', alt: 'ADV160 ฮีลใจสายลุย', href: '', active: true }
    ]
  };

  let slides = [];
  let index = 0;
  let timer = 0;
  let autoplayMs = 6000;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function withinDateWindow(item) {
    const today = new Date().toISOString().slice(0, 10);
    if (item.starts && today < item.starts) return false;
    if (item.ends && today > item.ends) return false;
    return true;
  }

  function render(data) {
    const s = data.settings || {};
    if (s.heading && titleEl) titleEl.textContent = s.heading;
    if (s.subheading && subEl) subEl.textContent = s.subheading;
    if (s.autoplaySeconds) autoplayMs = Math.max(2, s.autoplaySeconds) * 1000;

    slides = (data.items || []).filter(function (it) {
      return it && it.image && it.active !== false && withinDateWindow(it);
    });

    if (!slides.length) {
      viewport.innerHTML = '<p class="promos__empty">ยังไม่มีโปรโมชั่นในขณะนี้</p>';
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      dotsEl.innerHTML = '';
      return;
    }

    track.innerHTML = slides.map(function (it) {
      const img = '<img src="' + it.image + '" alt="' + String(it.alt || '').replace(/"/g, '&quot;') +
                  '" loading="lazy" decoding="async" />';
      const inner = it.href
        ? '<a href="' + it.href + '" target="_blank" rel="noopener">' + img + '</a>'
        : '<span>' + img + '</span>';
      return '<div class="promos__slide">' + inner + '</div>';
    }).join('');

    dotsEl.innerHTML = slides.map(function (_, i) {
      return '<button type="button" class="promos__dot" data-i="' + i +
             '" aria-label="แบนเนอร์ที่ ' + (i + 1) + '"></button>';
    }).join('');

    const single = slides.length < 2;
    if (prevBtn) prevBtn.style.display = single ? 'none' : '';
    if (nextBtn) nextBtn.style.display = single ? 'none' : '';
    dotsEl.style.display = single ? 'none' : '';

    go(0);
    if (!single) start();
  }

  function go(i) {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    dotsEl.querySelectorAll('.promos__dot').forEach(function (d, n) {
      d.setAttribute('aria-current', n === index ? 'true' : 'false');
    });
  }

  function start() {
    if (reduceMotion) return;   // don't auto-advance for motion-sensitive users
    stop();
    timer = setInterval(function () { go(index + 1); }, autoplayMs);
  }
  function stop() { if (timer) { clearInterval(timer); timer = 0; } }

  if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); start(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); start(); });
  dotsEl.addEventListener('click', function (e) {
    const d = e.target.closest('.promos__dot');
    if (!d) return;
    go(parseInt(d.dataset.i, 10));
    start();
  });

  // Pause while hovered or while the tab is hidden
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // Touch swipe
  let x0 = null;
  viewport.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; stop();
  }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    x0 = null;
    start();
  }, { passive: true });

  /* ---- load the manifest ---- */
  fetch('promos.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(render)
    .catch(function () {
      // file:// preview or missing manifest — still show something
      render(FALLBACK);
    });
})();
