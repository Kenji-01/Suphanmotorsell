# SUPHAN MOTORSALE — project handover notes

Static site, no build step. Open `index.html` directly, or deploy the whole
folder as-is. Last updated 2026-07-29.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: scroll-scrubbed hero animation, brand promise, 2-bike teaser, promo carousel |
| `models.html` | All 11 Honda models, 3/2/1-column grid |
| `test-drive.html` | จองทดลองขับ form (tabbed with service) |
| `service.html` | จองเข้ารับบริการ form (tabbed with test-drive) |
| `parts.html` | อะไหล่ — placeholder page, real content pending |
| `experience.html` | ประสบการณ์ / company story + both branches |
| `contact.html` | Facebook + TikTok, both branch cards with phone numbers |
| `admin.html` | **Internal.** PIN-gated list of booking requests. `noindex`. |

Shared: `site.css` (tokens, nav, footer, cards, forms), `site.js` (icons, mobile
nav, scroll reveal), `bookings.js` (booking store), `promos.js` (banner carousel).

**Cache-busting:** `site.css` is linked as `site.css?v=N` in every page. Bump N
in all HTML files whenever `site.css` changes, or browsers serve a stale copy.
Currently **v7**.

---

## Hero animation (scroll-scrubbed)

Source: `OneDrive/รูปภาพ/suphan motorsell/new 3d animate/Suphanmotorsell final3d.mp4`
(5040×2160, 60fps, 944 frames, 15.7s, aspect 2.333).

Pre-sliced to WebP stills — **every 2nd frame → 472 frames**:
- `frames/lg/` 1920×823, 19.4 MB — desktop/tablet/landscape
- `frames/pt/` 724×1200 centre crop, 14.2 MB — narrow portrait phones

Only one tier downloads per device; tier is re-checked on resize/rotate.
Scroll maps 1:1 to frame index (`FRAME_COUNT = 472` in `index.html`).
~5.7px of scroll per frame at a 900px-tall viewport.

To re-slice after a new video: see `extract_v2.py` approach — decode with
OpenCV, take every Nth frame, save two tiers, then update `FRAME_COUNT`.

### Headline reveal
`ขับเคลื่อนทุกความฝัน / ในทุกเจนเนอเรชั่น` is hidden until the animation
finishes, then fades in. Driven by `hero.dataset.ended`, flipped in `onScroll()`
at `REVEAL_AT = 0.92` of the scroll track. Scrolling back up hides it again.

**Why the text has a shadow:** this clip goes from a near-black scooter to a
near-white backdrop *within* the headline area. Measured: no flat colour works —
dark text failed 38–41% of pixels, white failed 46–70%. A halo on the glyphs
(not a scrim over the video) fixes it: worst pixel 3.98:1 vs the 3.0:1 threshold
for large text. Do not remove the `text-shadow` without re-measuring.

---

## Promo banners (marketing-editable)

Vertical poster carousel on the homepage. Auto-advances, swipeable, arrows+dots.

- **Images:** `assets/promos/` — currently 5 **placeholders**, replace with real
  Honda artwork. 1080×1350 (4:5) recommended.
- **Config:** `promos.json` — heading, autoplay interval, and the item list
  (image, alt, optional click-through href, active flag, optional start/end dates
  for auto-scheduling).
- **Instructions for staff:** `assets/promos/README.txt` (in Thai).

Adding/removing a banner needs no code change. `promos.js` fetches the JSON at
runtime; if `fetch` is blocked (opening the page as `file://`) it falls back to a
built-in copy so the section still renders. **On a real host it reads the JSON.**

---

## Booking system — IMPORTANT LIMITATION

`test-drive.html` and `service.html` both write to **browser localStorage** via
`bookings.js`. `admin.html` reads from the same place.

**This is not a real inbox.** A customer submitting on their phone and staff
opening `admin.html` on the shop PC are separate storage. Admin will see nothing.
There is a visible warning banner on `admin.html` saying exactly this.

To make it real, the forms need a backend. Cheapest realistic option for this
business: a Google Sheet behind a free Google Apps Script web endpoint. Not built.

`admin.html` PIN is `suphan2026`, **in plaintext in the file** — it deters casual
clicks, it is not security. Replace before handling real customer data.

---

## Brand assets

- `assets/brand/suphan-mark-{dark,light}.webp` — the real logo, processed from the
  customer's PNG. The source file had its "black" shapes at ~(240,240,240) with
  88% alpha (near-white), which is why it looked washed out; alpha was normalised
  and ink recoloured. Silhouette is unmodified.
- `assets/brand/honda-wing-{dark,light}.webp` — same treatment.
- `assets/models/*.webp` — 11 real bike photos, cover-fit avoided; cards use
  `object-fit: contain` because sources range 1.0–1.8 aspect.
- `assets/branches/{hq,bangplama}{,-sm}.webp` — the two storefronts.

---

## SEO — done, but pending a real domain

Every public page has: unique `<title>` + meta description, canonical URL,
Open Graph + Twitter Card tags. Homepage has `MotorcycleDealer` JSON-LD with both
branches. Plus `robots.txt` (disallows `/admin.html`) and `sitemap.xml` (7 pages).

**All of it points at the placeholder `https://www.suphanmotorsale.com`.**
Once the real domain is registered, find-and-replace that string across all HTML
plus `robots.txt` and `sitemap.xml`.

### Launch checklist (not started)
1. Buy domain. `.com` is simple; `.co.th` signals official Thai business but
   requires DBD/ทะเบียนพาณิชย์ documents.
2. Deploy folder to Cloudflare Pages (free, auto-HTTPS, edge presence in Bangkok
   → fast for TH + neighbouring countries). Add custom domain there.
3. Google Search Console → verify ownership → submit `sitemap.xml`.

---

## Known gaps / next steps

- [ ] Replace the 5 promo placeholders with real Honda banner artwork
- [ ] `parts.html` still a placeholder — needs real parts content
- [ ] Founding year on `experience.html` is a highlighted placeholder:
      `[พ.ศ. 2524 / ปีที่ก่อตั้งจริง]` — confirm the real year
- [ ] Booking backend (see limitation above)
- [ ] Domain + deploy + Search Console
- [ ] Model categories on `models.html` were inferred, not supplied — verify
      (esp. UC3, labelled รถไฟฟ้า)

---

## Fonts

Kanit (headline + all Thai UI), Chonburi (ดูเพิ่มเติม cue), Archivo Black (Latin
logo fallback), Tiro Devanagari Marathi + Noto Sans Thai (nav).

Note: Tiro Devanagari Marathi has **no Thai glyphs** — Thai nav text actually
renders in Noto Sans Thai via fallback. Intentional; it was requested by name.

The headline stack is `"FC Twist Speed", "Kanit", ...`. FC Twist Speed is the
font in the customer's reference artwork (Fontcraft, free personal / 500 THB
commercial, not on Google Fonts). A commented-out `@font-face` block sits at the
top of `index.html` — drop the licensed file in `./fonts/` and uncomment.
