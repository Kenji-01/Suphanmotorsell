# -*- coding: utf-8 -*-
"""Generate the new รุ่น index + one detail page per model, reusing the
existing site shell (nav/footer) verbatim so conventions match exactly."""
import os, re, json, html

PROJ = r"C:\Users\kenji\suphan-hero"
CSS = os.path.join(PROJ, "site.css")
BASE_URL = "https://www.suphanmotorsale.com"

data = json.load(open(os.path.join(PROJ, "bikes.json"), encoding="utf-8"))["models"]

# ---------------------------------------------------------------- CSS
MARK = "/* === bike detail (models rebuild) === */"
css = open(CSS, encoding="utf-8").read()
if MARK not in css:
    css += "\n" + MARK + """
.bike { font-family: var(--font-kanit); padding: clamp(28px,4vw,52px) clamp(20px,4vw,40px) clamp(72px,9vw,120px); }
.bike__inner { max-width: 1100px; margin-inline: auto; }
.bike__back { display:inline-flex; align-items:center; gap:7px; font-size:.9375rem; font-weight:400;
  color: var(--slate); text-decoration:none; margin-bottom: clamp(14px,2vw,20px); }
.bike__back:hover { color: var(--brand-red); }
.bike__title { margin:0 0 clamp(20px,3vw,30px); font-size: clamp(1.6rem,3.4vw,2.5rem);
  font-weight:600; line-height:1.25; letter-spacing:-.01em; color: var(--navy); }
.bike__stage { background:#fff; border:1px solid #ECEFF2; border-radius:14px; overflow:hidden;
  aspect-ratio: 4/3; display:flex; align-items:center; justify-content:center; padding:2.5%; }
.bike__stage img { max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain; display:block; }
.bike__picker { margin-top: clamp(18px,2.4vw,26px); }
.bike__picker h2 { margin:0 0 12px; font-size:.9375rem; font-weight:500; color: var(--slate); }
.bike__thumbs { display:flex; flex-wrap:wrap; gap:10px; }
.bike__thumb { width:96px; aspect-ratio:4/3; padding:0; cursor:pointer; background:#fff; overflow:hidden;
  border:1.5px solid #E2E6EA; border-radius:9px; transition:border-color .2s var(--ease); }
.bike__thumb img { width:100%; height:100%; object-fit:contain; display:block; }
.bike__thumb:hover { border-color: var(--slate); }
.bike__thumb[aria-pressed="true"] { border-color: var(--brand-red); border-width:2px; }
.bike__swatches { display:flex; flex-wrap:wrap; gap:9px; }
.bike__swatch { font-family:var(--font-kanit); font-size:.8125rem; font-weight:500; color:var(--navy);
  background:#fff; border:1.5px solid #E2E6EA; border-radius:999px; padding:8px 15px; cursor:pointer;
  transition:border-color .2s var(--ease), background .2s var(--ease); }
.bike__swatch:hover { border-color: var(--slate); }
.bike__swatch[aria-pressed="true"] { background: var(--navy); border-color: var(--navy); color:#fff; }
.bike__sell { margin-top: clamp(44px,5.5vw,72px); padding-top: clamp(28px,3.4vw,40px); border-top:1px solid #ECEFF2; }
.bike__sell h2 { margin:0 0 clamp(18px,2.4vw,26px); font-size: clamp(1.15rem,2vw,1.5rem);
  font-weight:600; color: var(--navy); }
.bike__sellgrid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap: clamp(18px,2.4vw,28px); }
.bike__sellgrid figure { margin:0; }
.bike__sellgrid img { width:100%; aspect-ratio:4/3; object-fit:cover; background:#F4F5F7;
  border-radius:10px; display:block; }
.bike__sellgrid figcaption { margin-top:9px; font-size:.9375rem; font-weight:500; color:var(--navy); }
.bike__cta { margin-top: clamp(40px,5vw,64px); display:flex; flex-wrap:wrap; gap:12px; }
@media (max-width:560px){ .bike__thumb{ width:76px; } }
"""
    open(CSS, "w", encoding="utf-8").write(css)
    print("site.css: appended bike styles")
else:
    print("site.css: bike styles already present")

# ------------------------------------------------- shell from old page
old = open(os.path.join(PROJ, "models.html"), encoding="utf-8").read()
fontlink = re.search(r'<link href="https://fonts\.googleapis\.com[^>]*>', old).group(0)
header = re.search(r'<header class="site-head">.*?</header>', old, re.S).group(0)
footer = re.search(r'<footer class="site-footer">.*?</footer>', old, re.S).group(0)
tail = ('  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>\n'
        '  <script src="site.js"></script>\n')

HEAD = """<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content="{desc}" />
<link rel="canonical" href="{canon}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="SUPHAN MOTORSALE" />
<meta property="og:locale" content="th_TH" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:url" content="{canon}" />
<meta property="og:image" content="{ogimg}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{ogimg}" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
{fontlink}

<link rel="stylesheet" href="site.css?v=7" />
{extra}</head>

<body>

{header}
"""

E = html.escape


def page(title, desc, canon, ogimg, body, extra=""):
    return (HEAD.format(title=E(title, quote=True), desc=E(desc, quote=True), canon=canon,
                        ogimg=ogimg, fontlink=fontlink, header=header, extra=extra)
            + body + "\n" + footer + "\n\n" + tail + "</body>\n</html>\n")


# ------------------------------------------------------------- index
cards = []
for m in data:
    n = len(m["colors"])
    cat = f"{n} สี" if n else f"{len(m['gallery'])} รูป"
    cards.append(f"""        <a class="model-card reveal" id="{m['slug']}" style="--i:{len(cards)%3}" href="model-{m['slug']}.html">
          <span class="model-card__media">
            <img src="{m['cover']['src']}" width="{m['cover']['w']}" height="{m['cover']['h']}"
                 loading="lazy" decoding="async" alt="Honda {E(m['name'])}" />
          </span>
          <span class="model-card__cat">{cat}</span>
          <span class="model-card__name">{E(m['name'])}</span>
        </a>""")

index_body = f"""  <main class="models">
    <div class="models__inner">

      <div class="models__head">
        <h1 class="models__title reveal" style="--i:0">รุ่นรถจักรยานยนต์ฮอนด้า</h1>
        <p class="models__sub reveal" style="--i:1">
          <span class="nb">เลือกรุ่นที่ใช่สำหรับคุณ</span>
          <span class="nb">พร้อมบริการหลังการขายจากสุพรรณมอเตอร์เซล</span>
        </p>
      </div>

      <div class="models__grid">

{chr(10).join(cards)}

      </div>

      <div class="models__foot">
        <a class="btn reveal" style="--i:0" href="test-drive.html">สอบถามรุ่นที่สนใจ</a>
      </div>

    </div>
  </main>"""

open(os.path.join(PROJ, "models.html"), "w", encoding="utf-8").write(page(
    "รุ่นรถจักรยานยนต์ฮอนด้าทุกรุ่น — SUPHAN MOTORSALE",
    "รวมรุ่นรถจักรยานยนต์และสกู๊ตเตอร์ฮอนด้าทุกรุ่นที่สุพรรณมอเตอร์เซล ตัวแทนจำหน่ายฮอนด้าอย่างเป็นทางการ จังหวัดสุพรรณบุรี",
    f"{BASE_URL}/models.html", f"{BASE_URL}/{data[1]['cover']['src']}", index_body))
print(f"models.html: {len(cards)} cards")

# ------------------------------------------------------ detail pages
JS = """  <script>
  (function () {
    var main = document.getElementById('bike-main');
    if (!main) return;
    document.querySelectorAll('[data-src]').forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.dataset.src;
        if (b.dataset.alt) main.alt = b.dataset.alt;
        document.querySelectorAll('[data-src]').forEach(function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
      });
    });
  })();
  </script>
"""

for m in data:
    nm, sl = m["name"], m["slug"]
    first = m["gallery"][0]

    thumbs = "".join(
        f"""
          <button type="button" class="bike__thumb" aria-pressed="{'true' if i == 0 else 'false'}"
                  data-src="{g['src']}" data-alt="Honda {E(nm)} รูปที่ {i+1}"
                  aria-label="Honda {E(nm)} รูปที่ {i+1}">
            <img src="{g['src']}" loading="lazy" decoding="async" alt="Honda {E(nm)} รูปที่ {i+1}" />
          </button>""" for i, g in enumerate(m["gallery"]))

    blocks = [f"""    <div class="bike__picker">
        <h2>รูปภาพรถ</h2>
        <div class="bike__thumbs">{thumbs}
        </div>
      </div>"""]

    if m["colors"]:
        sw = "".join(
            f"""
          <button type="button" class="bike__swatch" aria-pressed="false"
                  data-src="{c['src']}" data-alt="Honda {E(nm)} สี {E(c['label'])}">{E(c['label'])}</button>"""
            for c in m["colors"])
        blocks.append(f"""    <div class="bike__picker">
        <h2>เลือกสี ({len(m['colors'])} สี)</h2>
        <div class="bike__swatches">{sw}
        </div>
      </div>""")

    sell = ""
    if m["sellingPoints"]:
        figs = "".join(
            f"""
          <figure>
            <img src="{s['src']}" width="{s['w']}" height="{s['h']}" loading="lazy" decoding="async"
                 alt="Honda {E(nm)} — {E(s['label'])}" />
            <figcaption>{E(s['label'])}</figcaption>
          </figure>""" for s in m["sellingPoints"])
        sell = f"""

      <section class="bike__sell">
        <h2>จุดเด่นของ {E(nm)}</h2>
        <div class="bike__sellgrid">{figs}
        </div>
      </section>"""

    body = f"""  <main class="bike">
    <div class="bike__inner">

      <a class="bike__back" href="models.html">
        <i data-lucide="arrow-left"></i>กลับไปหน้ารุ่นรถทั้งหมด
      </a>
      <h1 class="bike__title">{E(nm)}</h1>

      <div class="bike__stage">
        <img id="bike-main" src="{first['src']}" width="{first['w']}" height="{first['h']}"
             decoding="async" alt="Honda {E(nm)}" />
      </div>

{chr(10).join(blocks)}{sell}

      <div class="bike__cta">
        <a class="btn" href="test-drive.html">จองทดลองขับ {E(nm)}</a>
      </div>

    </div>
  </main>"""

    open(os.path.join(PROJ, f"model-{sl}.html"), "w", encoding="utf-8").write(page(
        f"Honda {nm} — SUPHAN MOTORSALE",
        f"ดูรายละเอียดและสีของ Honda {nm} ทุกสี พร้อมจองทดลองขับที่สุพรรณมอเตอร์เซล "
        f"ตัวแทนจำหน่ายฮอนด้าอย่างเป็นทางการ จังหวัดสุพรรณบุรี",
        f"{BASE_URL}/model-{sl}.html", f"{BASE_URL}/{m['cover']['src']}", body, extra="")
        .replace("</body>", JS + "</body>"))

print(f"detail pages: {len(data)}")
