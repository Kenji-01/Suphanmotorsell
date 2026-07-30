# -*- coding: utf-8 -*-
"""Convert the PEC parts-ordering screenshots to WebP for parts-guide.html.

Source filenames are timestamped screenshots; the order of the six steps is
the sort order of those names, which matches the guide's step order.
"""
import os
from PIL import Image

SRC = r"C:\Users\kenji\OneDrive\รูปภาพ\suphan motorsell\spair part instruction guide pic"
OUT = r"C:\Users\kenji\suphan-hero\assets\parts-guide"

WIDTH = 1400
QUALITY = 86

os.makedirs(OUT, exist_ok=True)
files = sorted(f for f in os.listdir(SRC) if f.lower().endswith((".png", ".jpg", ".jpeg")))
assert len(files) == 6, f"expected 6 screenshots, found {len(files)}"

for i, f in enumerate(files, 1):
    im = Image.open(os.path.join(SRC, f))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    dest = os.path.join(OUT, f"step-{i}.webp")
    im.save(dest, "WEBP", quality=QUALITY, method=6)
    kb = os.path.getsize(dest) / 1024
    print(f"step-{i}.webp  {im.width}x{im.height}  {kb:.0f} KB   <- {f}")
