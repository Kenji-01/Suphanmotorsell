"""Step 1: walk the motorcycle pic tree and build a manifest. Read-only."""
import os, json

ROOT = r"C:\Users\kenji\OneDrive\รูปภาพ\suphan motorsell\motorcycle pic"
IMG_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp", ".heic", ".tif", ".tiff"}
VID_EXT = {".mp4", ".mov", ".avi", ".webm", ".mkv"}

try:
    from PIL import Image
    HAVE_PIL = True
except Exception:
    HAVE_PIL = False


def dims(p):
    if not HAVE_PIL:
        return None
    try:
        with Image.open(p) as im:
            return list(im.size)
    except Exception:
        return None


out = {}
for model in sorted(os.listdir(ROOT)):
    mpath = os.path.join(ROOT, model)
    if not os.path.isdir(mpath):
        continue
    entry = {"root_files": [], "subfolders": {}, "other": []}

    for name in sorted(os.listdir(mpath)):
        p = os.path.join(mpath, name)
        ext = os.path.splitext(name)[1].lower()
        if os.path.isdir(p):
            sub = {"images": [], "other": []}
            for sn in sorted(os.listdir(p)):
                sp = os.path.join(p, sn)
                sext = os.path.splitext(sn)[1].lower()
                if os.path.isdir(sp):
                    # nested deeper
                    for dn in sorted(os.listdir(sp)):
                        sub["other"].append(f"[nested] {sn}/{dn}")
                elif sext in IMG_EXT:
                    sub["images"].append({
                        "f": sn,
                        "kb": round(os.path.getsize(sp) / 1024),
                        "dim": dims(sp),
                    })
                else:
                    sub["other"].append(sn + (" [VIDEO]" if sext in VID_EXT else ""))
            entry["subfolders"][name] = sub
        elif ext in IMG_EXT:
            entry["root_files"].append({
                "f": name,
                "kb": round(os.path.getsize(p) / 1024),
                "dim": dims(p),
            })
        else:
            entry["other"].append(name + (" [VIDEO]" if ext in VID_EXT else ""))

    out[model] = entry

print(json.dumps(out, ensure_ascii=False, indent=1))
