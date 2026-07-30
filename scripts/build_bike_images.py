# -*- coding: utf-8 -*-
"""Rebuild the รุ่น (models) section from the official Honda photo folder.

Outputs ASCII-only filenames on purpose: the source has Thai characters,
trailing spaces, double spaces and parentheses in filenames, all of which
are URL-encoding landmines. Slugging the OUTPUT removes the failure mode
entirely rather than relying on correct encoding everywhere. Display names
stay exactly as the folders are written.
"""
import os, re, json, shutil, unicodedata
from PIL import Image

SRC = r"C:\Users\kenji\OneDrive\รูปภาพ\suphan motorsell\motorcycle pic"
PROJ = r"C:\Users\kenji\suphan-hero"
IMG_OUT = os.path.join(PROJ, "assets", "bikes")

THUMB_W = 900     # index grid
GALLERY_W = 1500  # detail pages
Q_THUMB, Q_GAL = 82, 84

# folder, cover filename, subfolder kind ('color'|'selling'|None), {file: label}
MODELS = [
 ("ADV160", "ADV160_H2C.jpg", "selling", {
   "ESP_H2C_Lowres.png": "ระบบ eSP+",
   "S01-ADV063_0055.png": "ดีไซน์ท้ายรถ",
   "S02-ADV063_0086.png": "ช่วงล่างและระบบเบรก"}),
 ("All New Honda PCX160", "ABS_LCD_Grey_Lowres (1).jpg", "color", {
   "ABS_LCD_Black_Lowres.jpg": "Black — ABS/LCD",
   "ABS_LCD_Blue_Lowres.jpg": "Blue — ABS/LCD",
   "ABS_LCD_Grey_Lowres.jpg": "Grey — ABS/LCD",
   "ABS_TFT_Blue_Copper_Lowres.jpg": "Blue Copper — ABS/TFT",
   "ABS_TFT_Red_Copper_Lowres.jpg": "Red Copper — ABS/TFT"}),
 ("All New Supercub 2025", "All_New_Supercub_2025_Styling_45_SBW.jpg", "color", {
   "All_New_Supercub_2025_Colorchart_G-W_Lowres.png": "G-W",
   "All_New_Supercub_2025_Colorchart_GRN_Lowres.png": "GRN",
   "All_New_Supercub_2025_Colorchart_SBW_Lowres.png": "SBW",
   "All_New_Supercub_2025_Colorchart_Y-W_Lowres.png": "Y-W"}),
 ("All New Wave110 2026", "All_New_WAVE110_2025_Styling_L_Lowres.jpg", "color", {
   "All_New_WAVE110_2025_ColorChart_Drumbreake_Black_BLK.png": "Black — ดรัมเบรก",
   "All_New_WAVE110_2025_ColorChart_Max_Wheel_Blue_BLU.png": "Blue — Max Wheel",
   "All_New_WAVE110_2025_ColorChart_Max_Wheel_Gray_GBR.png": "Gray — Max Wheel",
   "All_New_WAVE110_2025_ColorChart_Max_Wheel_Red_RED.png": "Red — Max Wheel",
   "All_New_WAVE110_2025_ColorChart_Special_Black_BBR.png": "Black — Special",
   "All_New_WAVE110_2025_ColorChart_Special_White_WBR.png": "White — Special",
   "All_New_WAVE110_2025_ColorChart_Spokes_Wheel_Black_BBR.png": "Black — ล้อซี่ลวด",
   "All_New_WAVE110_2025_ColorChart_Spokes_Wheel_Blue_BUB.png": "Blue — ล้อซี่ลวด",
   "All_New_WAVE110_2025_ColorChart_Spokes_Wheel_Gray_G-B.png": "Gray — ล้อซี่ลวด"}),
 ("All New Wave125 2025", "S13-W163_0818_Lowres.jpg", "color", {
   "Honda Wave125 Black Lowres.jpg": "Black",
   "Honda Wave125 White Lowres.jpg": "White",
   "Honda Wave125 blue Lowres.jpg": "Blue",
   "Honda Wave125 brown Lowres.jpg": "Brown"}),
 ("CBR150R 2025", "New_CBR_150R_with_Talent_Lowres.jpg", None, {}),
 ("CL300 STD 2025", "2024-CL300 MAT GUNPOWDER BLACK.jpg", None, {}),
 ("Giorno+", "S01_Gon802_0038_Lowres.jpg", "color", {
   "Gon802_0215 Black_ABS.jpg": "Black — ABS",
   "Gon802_0215 Silver_ABS.jpg": "Silver — ABS",
   "Gon802_0215 White_ABS.jpg": "White — ABS",
   "Gon802_0215 Yellow_ABS.jpg": "Yellow — ABS",
   "Gon802_0243 Cyan_CBS.jpg": "Cyan — CBS",
   "Gon802_0243 Green_CBS.jpg": "Green — CBS",
   "Gon802_0243 Grey_CBS.jpg": "Grey — CBS"}),
 ("NEW FORZA350", "FZ13_0034_Forza350 styling.jpg", "selling", {
   "HONDA_FORZA350_Inner Box.jpg": "ช่องเก็บของ Inner Box",
   "Honda Forza350 Roadsync.jpg": "Honda RoadSync",
   "Honda Forza350 U Box.jpg": "ช่องเก็บของ U-Box",
   "Honda Forza350 meter.jpg": "หน้าจอเรือนไมล์",
   "Honda Forza350 sellpoint.jpg": "ดีไซน์ด้านหน้า",
   "Sellpoint Honda Forza350 rearlamp-edit_Lowres.jpg": "ไฟท้าย LED"}),
 ("New ADV160 26YM", "ADV160_Green_Lowres.jpg", None, {}),
 ("New Honda UC3", "K4HA_0639_S01 copy.png", "color", {
   "K4HA_0639_S01 copy - Copy.png": "Black",
   "K4HA_1136_S06 copy.png": "White"}),
 ("New LEAD125", "Honda Lead Styling Lowres RGB.jpg", "color", {
   "S02-LD152_0150_CBS Matt Black.jpg": "Matt Black — CBS",
   "S02-LD152_0150_CBS White.jpg": "White — CBS",
   "S03-LD152_0246_ABS Matt Black_RGB.png": "Matt Black — ABS",
   "S03-LD152_0246_ABS Matt Dim Grey Metallic_RGB.png": "Matt Dim Grey — ABS"}),
 ("New Scoopy", "S01-SCP2_0035.jpg", "color", {
   "S01-SCP3_0059 Prestige black.jpg": "Prestige Black",
   "S01-SCP3_0059 Prestige green.jpg": "Prestige Green",
   "S01-SCP3_0059 Prestige white.jpg": "Prestige White",
   "S01-SCP3_0059 club12  gray .jpg": "Club12 Gray",
   "S01-SCP3_0059 club12 matt black Red.jpg": "Club12 Matt Black/Red",
   "S01-SCP3_0059 club12 white blue .jpg": "Club12 White/Blue",
   "S03-SCP3_0218 Club 12 Pink.jpg": "Club12 Pink",
   "S03-SCP3_0218 Urban blue.jpg": "Urban Blue",
   "S03-SCP3_0218 Urban gross black .jpg": "Urban Gross Black"}),
 ("Scoopy cinamom roll", "SCOOPY Cinnamoroll Right.jpg", None, {}),
]

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def slug(s):
    s = unicodedata.normalize("NFKD", s)
    s = s.encode("ascii", "ignore").decode("ascii").lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return re.sub(r"-{2,}", "-", s) or "item"


def load_flat(path):
    """Open an image and flatten alpha onto white (22 source PNGs have alpha)."""
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def emit(src_path, out_path, width, quality):
    im = load_flat(src_path)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out_path, "WEBP", quality=quality, method=6)
    return im.size


if os.path.isdir(IMG_OUT):
    shutil.rmtree(IMG_OUT)
os.makedirs(IMG_OUT, exist_ok=True)

manifest = []
for folder, cover, kind, labels in MODELS:
    mdir = os.path.join(SRC, folder)
    sl = slug(folder)
    odir = os.path.join(IMG_OUT, sl)
    os.makedirs(odir, exist_ok=True)

    root_imgs = sorted([f for f in os.listdir(mdir)
                        if os.path.splitext(f)[1].lower() in IMG_EXT
                        and os.path.isfile(os.path.join(mdir, f))])
    assert cover in root_imgs, f"cover missing for {folder}: {cover}"

    rec = {"name": folder, "slug": sl, "cover": None,
           "gallery": [], "colors": [], "sellingPoints": []}

    # cover thumb
    cw, ch = emit(os.path.join(mdir, cover), os.path.join(odir, "cover.webp"), THUMB_W, Q_THUMB)
    rec["cover"] = {"src": f"assets/bikes/{sl}/cover.webp", "w": cw, "h": ch, "from": cover}

    # gallery = every root image (cover included, it's a real product shot)
    for i, f in enumerate(root_imgs, 1):
        n = f"g{i}-{slug(os.path.splitext(f)[0])}.webp"
        w, h = emit(os.path.join(mdir, f), os.path.join(odir, n), GALLERY_W, Q_GAL)
        rec["gallery"].append({"src": f"assets/bikes/{sl}/{n}", "w": w, "h": h, "from": f})

    # subfolder
    subs = sorted([d for d in os.listdir(mdir) if os.path.isdir(os.path.join(mdir, d))])
    for sub in subs:
        sdir = os.path.join(mdir, sub)
        files = sorted([f for f in os.listdir(sdir)
                        if os.path.splitext(f)[1].lower() in IMG_EXT])
        bucket = "colors" if kind == "color" else "sellingPoints"
        pfx = "c" if kind == "color" else "s"
        for i, f in enumerate(files, 1):
            n = f"{pfx}{i}-{slug(os.path.splitext(f)[0])}.webp"
            w, h = emit(os.path.join(sdir, f), os.path.join(odir, n), GALLERY_W, Q_GAL)
            rec[bucket].append({
                "src": f"assets/bikes/{sl}/{n}", "w": w, "h": h, "from": f,
                "label": labels.get(f, os.path.splitext(f)[0])})
        rec["subfolder"] = sub
    manifest.append(rec)

with open(os.path.join(PROJ, "bikes.json"), "w", encoding="utf-8") as fh:
    json.dump({"models": manifest}, fh, ensure_ascii=False, indent=1)

tot = sum(1 + len(m["gallery"]) + len(m["colors"]) + len(m["sellingPoints"]) for m in manifest)
print(f"models={len(manifest)}  webp_written={tot}")
for m in manifest:
    print(f"  {m['name']:<26} cover={m['cover']['w']}x{m['cover']['h']:<5} "
          f"g={len(m['gallery'])} c={len(m['colors'])} s={len(m['sellingPoints'])}")
