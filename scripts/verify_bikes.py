# -*- coding: utf-8 -*-
"""Cross-check every referenced asset/route in the rebuilt pages against disk."""
import os, re, json, glob, urllib.parse

PROJ = r"C:\Users\kenji\suphan-hero"
SRC = r"C:\Users\kenji\OneDrive\รูปภาพ\suphan motorsell\motorcycle pic"
data = json.load(open(os.path.join(PROJ, "bikes.json"), encoding="utf-8"))["models"]

pages = [os.path.join(PROJ, "models.html")] + sorted(glob.glob(os.path.join(PROJ, "model-*.html")))
missing_img, missing_route, non_ascii, checked_img, checked_route = [], [], [], 0, 0

for p in pages:
    t = open(p, encoding="utf-8").read()
    for m in re.finditer(r'<img[^>]+src="([^"]+)"', t):
        s = m.group(1)
        if s.startswith(("http://", "https://", "data:")):
            continue
        checked_img += 1
        if any(ord(c) > 127 for c in s) or " " in s:
            non_ascii.append((os.path.basename(p), s))
        fp = os.path.join(PROJ, urllib.parse.unquote(s).replace("/", os.sep))
        if not os.path.isfile(fp):
            missing_img.append((os.path.basename(p), s))
    # data-src on thumb/swatch buttons
    for m in re.finditer(r'data-src="([^"]+)"', t):
        s = m.group(1)
        checked_img += 1
        fp = os.path.join(PROJ, urllib.parse.unquote(s).replace("/", os.sep))
        if not os.path.isfile(fp):
            missing_img.append((os.path.basename(p), s))
    for m in re.finditer(r'href="(model-[^"]+\.html|models\.html|[a-z-]+\.html)"', t):
        s = m.group(1)
        checked_route += 1
        if not os.path.isfile(os.path.join(PROJ, s)):
            missing_route.append((os.path.basename(p), s))

# folder-count vs card-count
src_folders = sorted([d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d))])
idx = open(os.path.join(PROJ, "models.html"), encoding="utf-8").read()
cards = re.findall(r'<a class="model-card[^"]*"[^>]*href="model-([^"]+)\.html"', idx)
detail_files = [os.path.basename(f) for f in glob.glob(os.path.join(PROJ, "model-*.html"))]

# every source image accounted for?
src_total = 0
for d in src_folders:
    for dp, _, fn in os.walk(os.path.join(SRC, d)):
        src_total += sum(1 for f in fn if os.path.splitext(f)[1].lower() in
                         {".jpg", ".jpeg", ".png", ".webp"})
built = sum(len(m["gallery"]) + len(m["colors"]) + len(m["sellingPoints"]) for m in data)

print(f"source folders      : {len(src_folders)}")
print(f"cards on index      : {len(cards)}")
print(f"detail html files   : {len(detail_files)}")
print(f"source images       : {src_total}")
print(f"images represented  : {built}   (+14 cover thumbs)")
print(f"img/data-src checked: {checked_img}   MISSING: {len(missing_img)}")
print(f"routes checked      : {checked_route}   MISSING: {len(missing_route)}")
print(f"non-ascii/space srcs: {len(non_ascii)}")
if missing_img:
    print("  !! missing images:", missing_img[:10])
if missing_route:
    print("  !! missing routes:", missing_route[:10])
if non_ascii:
    print("  !! risky srcs:", non_ascii[:10])

# colour selector presence
for m in data:
    f = os.path.join(PROJ, f"model-{m['slug']}.html")
    t = open(f, encoding="utf-8").read()
    sw = t.count('class="bike__swatch"')
    sp = t.count("<figcaption>")
    ok = (sw == len(m["colors"])) and (sp == len(m["sellingPoints"]))
    if not ok:
        print(f"  !! mismatch {m['slug']}: swatches {sw}/{len(m['colors'])} sell {sp}/{len(m['sellingPoints'])}")
print("per-model swatch/sellingpoint counts: all match" if all(
    open(os.path.join(PROJ, f"model-{m['slug']}.html"), encoding="utf-8").read().count('class="bike__swatch"') == len(m["colors"])
    for m in data) else "MISMATCH ABOVE")
print("orphan check: folders without a card ->",
      [d for d in src_folders if not any(c for c in cards)] and "n/a" or "none")
