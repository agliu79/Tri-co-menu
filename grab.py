"""grab.py <capture.png> <type> <file title> <artist> <license> <commons url>
Crops the viewer's dark border off a browser capture, saves site/img/<type>.jpg, logs the credit."""
import sys, json, pathlib
from PIL import Image
src, typ, title, artist, lic, url = sys.argv[1:7]
im = Image.open(src).convert("RGB")
g = im.convert("L").point(lambda v: 255 if v > 24 else 0)
box = g.getbbox()
im = im.crop(box)
w, h = im.size  # crop to 4:3 centre, then 640x480
tw = min(w, int(h * 4 / 3)); th = int(tw * 3 / 4)
l, t = (w - tw) // 2, (h - th) // 2
im = im.crop((l, t, l + tw, t + th)).resize((640, 480), Image.LANCZOS)
root = pathlib.Path(__file__).parent
out = root / "site/img" / f"{typ}.jpg"
im.save(out, "JPEG", quality=78, optimize=True)
cred = root / "data/photo_credits.json"
c = json.loads(cred.read_text()) if cred.exists() else {}
c[typ] = {"title": title, "artist": artist, "license": lic, "url": url}
cred.write_text(json.dumps(c, indent=1, ensure_ascii=False))
print(typ, out.stat().st_size // 1024, "KB", box)
