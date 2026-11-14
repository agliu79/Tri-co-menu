"""Match the team's dish photos (site/img/<dish-name>.jpg in the GitHub repo) to dishes, and save web-sized copies
as site/img/dishes/<dish-id>.jpg. Usage: python3 dish_photos.py <folder with the photos>"""
import json, re, sys, pathlib
from PIL import Image, ImageOps
R = pathlib.Path(__file__).parent
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else R / "site/img")
out = R / "site/img/dishes"; out.mkdir(parents=True, exist_ok=True)
SKIP = {"bakery", "beef", "burger", "cake", "chicken", "cookies", "eggs", "noodles", "pancakes", "pasta", "pizza",
        "salad", "soup", "sushi", "taco", "vegetables", "logo-dark", "logo-light", "logo-navy", "ratemyplate"}
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def key(stem):
    stem = re.sub(r"\s*\(\d+\)$", "", stem)                    # "pancakes (2)" duplicates
    stem = re.sub(r"(\s+(V|VA|A|P|H|N|PwW|PWW)|\*)+$", "", stem, flags=re.I)  # menu markers left in a file name
    return slug(stem)
data = json.loads((R / "data/menu.json").read_text())
ids = set(data["dishes"])
STOP = {"and", "with", "w", "the", "of", "a", "s"}
def toks(k):
    k = k.replace("free-zone", "fz").replace("freezone", "fz").replace("espa-ola", "espanola")
    return [t for t in k.split("-") if t and t not in STOP]
canon = lambda k: "-".join(toks(k))
by_canon = {}
for i in ids:
    by_canon.setdefault(canon(i), i)
ALIAS = {"apple-cinnamon-muffins": "apple-cinnamon-muffin", "cannolis": "cannoli", "cheeseburger-pizza": "cheeseburger-pizza-with-pickles",
         "chopped-peanuts-curry-topping": "chopped-peanuts", "corn-dog": "corn-dogs", "dr-praeger-s-veggie-burgers": "dr-praeger-s-burger",
         "fried-pickle-chips": "deep-fried-battered-pickle-chips", "haricots-verts": "green-beans", "home-fries-free-zone": "homesfries-freezone",
         "loaded-plantains": "plantains", "one-pot-vegan-pumpkin-chili": "pumpkin-chili", "pastrami-sandwich": "pastrami-swiss-on-marble-rye",
         "ramen-with-miso-broth": "ramen-noodles", "thai-vegetable-stir-fry": "thai-veggie-stir-fry", "white-bean-and-vegetables": "white-bean-veggies",
         "chicken-waffles": "waffles"}
def match(k):
    k = ALIAS.get(k, k)
    if k in ids: return k
    c = canon(k)
    if c in by_canon: return by_canon[c]
    a = set(toks(k)); best, score = None, 0
    for i in ids:
        b = set(toks(i))
        if not a or not b: continue
        j = len(a & b) / len(a | b)
        if j > score: best, score = i, j
    return best if score >= 0.75 else None
files = {}
for f in sorted(src.iterdir()):
    if f.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp") or f.stem.lower() in SKIP:
        continue
    k = match(key(f.stem))
    if k and k not in files:
        if k != key(f.stem): print("  matched", f.name, "->", k)
        files[k] = f
unmatched = sorted(f.name for f in src.iterdir() if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
                   and f.stem.lower() not in SKIP and not match(key(f.stem)))
for k, f in files.items():
    im = ImageOps.exif_transpose(Image.open(f))
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, "white"); bg.paste(im, mask=im.split()[-1]); im = bg
    im = ImageOps.fit(im.convert("RGB"), (640, 480), Image.LANCZOS)
    im.save(out / f"{k}.jpg", quality=80, optimize=True, progressive=True)
(R / "data/dish_photos.json").write_text(json.dumps(sorted(files)))
print(len(files), "dish photos;", len(unmatched), "files didn't match a dish:", unmatched)
