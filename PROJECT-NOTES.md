# SUPHAN MOTORSALE — project handover notes

Static site, **no build step, no Node.js, no dev server**. Open `index.html`
directly in a browser (`file://` works), or deploy the whole folder as-is.
Last updated 2026-07-30.

**Starting a new chat?** This repo lives at
https://github.com/Kenji-01/Suphanmotorsell.git (branch `main`) — clone that
if the local folder isn't present. See *Version control* below.

### How to preview it (read this first)

There is **nothing to install and nothing to run** — no `npm install`, no
`npm start`, no framework. It is plain HTML + CSS + vanilla JS.

- **Simplest:** double-click `index.html`, or in this tool open a browser
  preview tab pointed at `file:///C:/Users/kenji/suphan-hero/index.html`.
- Python scripts under `scripts/` (or the scratchpad) are **one-off asset
  generators** — they slice video frames and resize photos. They are *not*
  needed to view the site and are not part of a build pipeline.
- Known quirk of the in-tool preview pane: it renders `file://` pages as
  static snapshots and **will not follow in-page link clicks**. To check
  another page, point the preview directly at that page's URL. Verify links
  by confirming the target file exists on disk, not by clicking.
- `git` is now initialised here (see *Version control* below).

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: scroll-scrubbed hero animation, brand promise, 2-bike teaser, promo carousel |
| `models.html` | รุ่น index — 14 Honda models, 3/2/1-column grid |
| `model-<slug>.html` | **14 files.** One detail page per model (gallery + colour selector + selling points) |
| `test-drive.html` | จองทดลองขับ form (tabbed with service) |
| `service.html` | จองเข้ารับบริการ form (tabbed with test-drive) |
| `parts.html` | อะไหล่ — **วิธีสั่งอะไหล่ 6 ขั้นตอน**, illustrated how-to for ordering via Honda PEC + LINE |
| `experience.html` | ประสบการณ์ / company story + both branches |
| `contact.html` | Facebook + TikTok, both branch cards with phone numbers |
| `admin.html` | **Internal.** Passphrase-gated list of booking requests, read from the Sheet. `noindex`. |

Shared: `site.css` (tokens, nav, footer, cards, forms), `site.js` (icons, mobile
nav, scroll reveal), `config.js` (booking endpoint + shop phones), `bookings.js`
(booking client), `promos.js` (banner carousel).

**Cache-busting:** `site.css` is linked as `site.css?v=N` in every page, and since
2026-07-30 so are `site.js`, `bookings.js`, `config.js`, `promos.js`. Bump N in
all HTML files whenever any of those files change, or browsers serve a stale copy.
Currently **v8**.

---

## Version control — GitHub is the source of truth

`git` was initialised on 2026-07-29 (it did not exist before). `frames/` is
gitignored — 472 generated stills, re-creatable from the source video.

**Remote:** https://github.com/Kenji-01/Suphanmotorsell.git (branch `main`).
The full project — code, `PROJECT-NOTES.md`, `bikes.json`, all `assets/*`
(except gitignored `frames/`) — is pushed there. **Start a new chat by
cloning this repo rather than assuming local files exist**, especially on a
different machine:
```bash
git clone https://github.com/Kenji-01/Suphanmotorsell.git
```

**Auth gotcha hit once already:** Windows had a *different* GitHub account
(`hachimagic`) cached in Credential Manager under the generic
`git:https://github.com` key, which silently 403'd every push as the wrong
user. Fixed by deleting that cached entry (`cmdkey /delete:...`) so Git
Credential Manager re-prompted for `Kenji-01`. If pushes ever start failing
with a 403 again, check `cmdkey /list` for which account `git:https://github.com`
resolves to before assuming it's a permissions problem on GitHub's side.

**Workflow going forward:** after each meaningful unit of work (not every
single edit), commit locally *and* push to `origin/main` — treat GitHub as
the durable backup, not just the local `.git` folder. If a session ends
mid-task, still push whatever is in a working state rather than leaving it
local-only.

| Commit | Meaning |
|---|---|
| `a74b001` | Restore point: whole site **before** the models-page rebuild |
| `1c7a77c` | The models-page rebuild |
| `fc071e5` | Docs for the rebuild + generator scripts moved into `scripts/` |
| *(GitHub)* | Repo connected to `Kenji-01/Suphanmotorsell`, pushed 2026-07-30 |

To recover anything from the old models page: `git show a74b001:models.html`.

---

## รุ่น (models) section — rebuilt 2026-07-29

**Source of truth:** `OneDrive/รูปภาพ/suphan motorsell/motorcycle pic/`.
One top-level folder = one model. Folder name **is** the display name and is
shown verbatim — do not rename, translate or "fix" it.

14 models, 95 source images → **109 WebP** in `assets/bikes/<slug>/` (10.3 MB):
`cover.webp` (900w, index grid) · `g*.webp` gallery · `c*.webp` colours ·
`s*.webp` selling points (all 1500w).

`bikes.json` is the generated manifest — model names, slugs, cover choice,
and every image path with its source filename. **Changing a cover is a
one-line edit there**, no rebuild needed.

Subfolder convention in the source folder, verified by opening the images:
- `All color` → colour variants (8 models) → drives the colour selector
- `Selling point` → feature shots (ADV160, NEW FORZA350) → separate section

### Things that will bite you here

- **Output filenames are ASCII-slugged on purpose.** The source has Thai
  filenames (`ไฟต่ำ`, `ไฟสูง`), trailing spaces, double spaces and
  parentheses. Rather than trusting URL-encoding everywhere, the generator
  renames outputs. Keep doing this. Verified: 0 non-ASCII/space image paths.
- **22 source PNGs have real alpha** (Supercub + Wave110 `All color`, all of
  UC3, ADV160 selling points). They must be flattened onto **white** or they
  render with black/garbage backgrounds.
- Filenames lie. `FORZA350 colorchart.jpg` is a clean single-bike side view,
  not an infographic. UC3's `All color` files look like duplicates by name
  but are black vs white. Always open the image before judging.
- `CBR150R 2025` has exactly one photo and it **has a rider in it** — used as
  the cover by explicit owner decision. Swap it if a clean shot arrives.
- `ADV160` cover has an accessory top box fitted (only root image available).
- Supercub colour labels are Honda's raw codes (`G-W`, `GRN`, `SBW`, `Y-W`)
  because the filenames carry no plain colour word. Rename in `bikes.json`
  if you learn the real names.
- `ADV160` / `New ADV160 26YM` and `New Scoopy` / `Scoopy cinamom roll` are
  same-family pairs kept as **separate cards** by owner decision.

### Regenerating after new photos

Re-run the two generator scripts (image builder, then page builder). The page
builder reads the nav/footer out of the existing `models.html` so the shell
stays in sync — if you ever change the nav, regenerate the detail pages too,
or they keep the old nav.

⚠️ **Gotcha that already bit once:** the page generator reuses only the
header/footer, *not* the page-level `<style>` block. Grid + light-background
rules therefore live in `site.css` (`body.page-light`, `.models*`). All 15
generated pages carry `<body class="page-light">`. Without it they render on
the black default background.

### Archived

`archive/old-runs-page/` — old `models.html` + the 11 old bike images.
Nothing deleted. Full restore point is commit `a74b001`.

---

## Parts-ordering guide — added 2026-07-30

**`parts.html` *is* this guide.** It walks a customer through finding a part
number on Honda's official catalogue and sending it to the shop. Six steps, each
a real screenshot of the Honda PEC site with a Thai caption.

It briefly existed as a separate `parts-guide.html` behind a stub `parts.html`;
the owner asked for the stub gone, so the guide was `git mv`'d onto `parts.html`
(same commit history). The nav item **อะไหล่** now lands straight on it. There is
no `parts-guide.html` — don't recreate one, and don't reintroduce the
"หน้านี้อยู่ระหว่างจัดทำ" stub copy.

- **Screenshots:** `assets/parts-guide/step-{1..6}.webp`, 166 KB total, built by
  `scripts/build_parts_guide_images.py` from
  `OneDrive/รูปภาพ/suphan motorsell/spair part instruction guide pic/`.
  Step order = sort order of the source filenames (they are timestamped).
  Sources are 825–1150px wide, i.e. **below** the 1400px cap, so nothing is
  upscaled — re-shoot at a higher resolution if crisper images are wanted.
- The green ring drawn on each screenshot is the customer's own annotation and
  is what makes the steps readable. Keep it when replacing them.
- Off-site link: `https://pec.thaihonda.co.th/Applications/Common/Programs/StartApp.aspx`
  (Thai Honda's parts catalogue). Not ours — if it moves, this page breaks.

**Thai copy note:** the owner's source text had three common informal
misspellings, corrected here for a customer-facing page — เว็ปไซน์ → เว็บไซต์,
ปั้มน้ำ → ปั๊มน้ำ, คลิ๊ก → คลิก, รุป → รูป. Meaning is unchanged.

### ⚠️ LINE ID is a placeholder
The "เพิ่มเพื่อนทางไลน์" button points at `line.me/R/ti/p/~@suphanmotorsale`,
which is **invented** — it does not resolve to the shop's account. The owner said
on 2026-07-30 they would send the real link; it has not arrived yet.

When it does: replace the href (there's a `TODO(owner)` comment on it in
`parts.html`), **delete the `.guide__line-note` warning paragraph** below the
button, and drop this section. This is the only LINE link on the site —
`contact.html` still has Facebook and TikTok only, so consider adding it there
too.

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

## Booking system — rebuilt on a real backend 2026-07-30

Both booking forms now post to a **Google Apps Script web app** that appends to a
Google Sheet. `admin.html` reads the same Sheet, so a booking made on a
customer's phone shows up on the shop PC. That is new — see *What changed* below.

| Piece | Role |
|---|---|
| `scripts/apps-script/Code.gs` | The backend. Pasted into Apps Script, bound to a Sheet. Not served as part of the site. |
| `scripts/apps-script/SETUP-TH.md` | Thai step-by-step for the owner: create Sheet → paste code → set passphrase → deploy → paste URL. |
| `config.js` | **The only file to edit** to connect it. Holds `BOOKING_ENDPOINT`, fallback shop phones, optional `SHEET_URL`. |
| `bookings.js` | Async client. Posts bookings, fetches the list, toggles call-back status. |
| `admin.html` | Passphrase-gated dashboard reading from the Sheet. Auto-refreshes every 60s. |

### ⚠️ Not live until the owner does the setup
`config.js` ships with `BOOKING_ENDPOINT: ''`. Until a real `/exec` URL is pasted
in, the forms tell the customer to phone the shop (they do **not** fake a
success), and `admin.html` shows the setup checklist instead of a login box.
Only the owner can complete it — it needs their Google account.

### Things that will bite you here

- **Never set `Content-Type: application/json` on the fetch in `bookings.js`.**
  That turns it into a CORS preflighted request, and Apps Script does not answer
  `OPTIONS` — every booking would fail. The plain string body keeps it a "simple
  request" and the backend `JSON.parse`s it itself. There is a comment saying so
  at the top of `bookings.js`; heed it.
- **Editing `Code.gs` is not enough — you must deploy a new version.** Apps
  Script keeps serving the old code otherwise. Deploy → Manage deployments →
  pencil → Version: New version. The URL does not change.
- The deployment's *Who has access* must be **Anyone**, not *Anyone with a
  Google account*. Customers are not logged into Google.
- Sheet columns are looked up by header **name**, so reordering columns is safe
  but renaming a header breaks reads.
- `phone` and `plate` columns are forced to text format. As numbers, Sheets eats
  the leading zero off `08x` and mangles plates.
- The flood guard accepts 10 bookings/minute globally (no per-IP data available
  in Apps Script). Fine for this shop, would be wrong for a busy site.
- Local `localStorage` is now only a **backup outbox**, not the store. A failed
  submission is retried on the customer's next visit, but only if under 24h old —
  a week-old service booking would arrive for a date already past, so it is
  abandoned instead.

### Admin auth — changed, read this
The old plaintext PIN `suphan2026` is **gone**. It sat in `admin.html` where
anyone viewing source could read it. The passphrase now lives only in the Apps
Script Script Property `ADMIN_PASSPHRASE`, is verified server-side, and is held
in `sessionStorage` for the tab. **Nothing secret is in this repo** — a static
site cannot hold a secret, so the secret moved to the one place that can.

Still a single shared passphrase with no per-user accounts or access log:
adequate for a booking list, not for anything more sensitive. `SETUP-TH.md` has a
PDPA section covering this.

### JS cache-busting — new, and it matters on deploy
`site.js`, `bookings.js`, `config.js`, `promos.js` are now linked as
`...js?v=8`, matching the existing `site.css?v=N` scheme. Previously they had no
version, which would have been an outage on this particular deploy: a returning
visitor's cached old `bookings.js` (with `add()`) against the new HTML (calling
`submit()`) means every booking silently fails. **Bump the version in all HTML
when any of those files change** — same rule as `site.css`. Currently **v8** for
both CSS and JS.

---

## Brand assets

- `assets/brand/suphan-mark-{dark,light}.webp` — the real logo, processed from the
  customer's PNG. The source file had its "black" shapes at ~(240,240,240) with
  88% alpha (near-white), which is why it looked washed out; alpha was normalised
  and ink recoloured. Silhouette is unmodified.
- `assets/brand/honda-wing-{dark,light}.webp` — same treatment.
- `assets/bikes/<slug>/*.webp` — the 14-model photo set (see the รุ่น section).
  Cards use `object-fit: contain`, never cover: sources range 1.0–1.8 aspect and
  a crop clips wheels/mirrors on the squarer shots.
  *(`assets/models/` is gone — moved to `archive/old-runs-page/assets-models/`.)*
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
- [ ] **Real LINE Official Account ID** for `parts-guide.html` (placeholder now)
- [ ] `parts.html` still a placeholder — needs real parts content
- [ ] Founding year on `experience.html` is a highlighted placeholder:
      `[พ.ศ. 2524 / ปีที่ก่อตั้งจริง]` — confirm the real year
- [ ] **Owner action: run `scripts/apps-script/SETUP-TH.md`** to switch the
      booking backend on. Code is built and tested; it needs the owner's Google
      account to deploy. Until then the forms tell customers to phone instead.
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
