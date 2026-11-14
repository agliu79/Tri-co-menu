"""Turn the one-time scrape (data/raw_*.txt) into data/menu.json for the site.

Sources (scraped once, Nov 13-14 2026):
  Bryn Mawr + Haverford: Meal Choice Connect (mcc-brynmawr.computrition.online), week of Sun Nov 8 - Sat Nov 14
  Swarthmore: The Dash (dash.swarthmore.edu/menu/dining-center), Sat Nov 14 - Thu Nov 19
Only labels the colleges publish are stored as facts. Cuisine, category, emoji and
"goal" hints are guesses from the dish name and are flagged as such in the UI.
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).parent / "data"

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

# ---------- label parsing ----------
MCC_SUFFIX = re.compile(r"\s*(\*|\bVA\b|\bV\b|\bA\b|\bP\b|\bH\b|\bN\b|\bHC\b|\bPD\b|\bPWW\b)\s*$", re.I)

def parse_mcc(name):
    diets = set()
    other = set()
    name = re.sub(r"(?<=\S)V\s*PwW\b", " V PwW", name)
    name = re.sub(r"\s+\*", "*", name)
    while True:
        m = MCC_SUFFIX.search(name)
        if not m:
            break
        tok = m.group(1).upper()
        if tok == "PWW":
            other.add("pww")
        elif tok == "*":
            diets.add("vegetarian")
        elif tok in ("V", "VA"):
            diets.update(["vegan", "vegetarian"])
        name = name[: m.start()].rstrip()
    if re.search(r"\bvegan\b", name, re.I):
        diets.update(["vegan", "vegetarian"])
    if re.search(r"\bhalal\b", name, re.I):
        diets.add("halal")
    return re.sub(r"\*(?=\s|$)", "", name).strip(), diets, other

SWAT_ALLERGENS = {"egg": "egg", "fish": "fish", "milk": "milk", "peanut": "peanut", "sesame": "sesame",
                  "shellfish": "shellfish", "soy": "soy", "tree nut": "treenut", "wheat": "wheat"}
SWAT_DIETS = {"vegan": "vegan", "vegetarian": "vegetarian", "halal": "halal", "kosher": "kosher",
              "gluten free": "gluten-free"}
SWAT_OTHER = {"pork": "pork", "alcohol": "alcohol"}

# ---------- guesses from the dish name ----------
def has(n, pat):
    return re.search(pat, n, re.I) is not None

CUISINE_RULES = [
    ("indian", r"tikka|masala|naan|aloo|gobi|pakora|basmati|raita|chutney|curry chicken|dal\b|indian"),
    ("korean", r"bibimbap|bulgogi|kimchi|gochujang|korean|japchae"),
    ("japanese", r"teriyaki|miso|sushi|udon|ramen|karaage|katsu|japanese|wakame|tempura|mochi|matcha|oden|surimi|furikake|kewpie"),
    ("thai", r"thai|pad |panang|green curry|coconut curry|satay|tamarind|mango sticky"),
    ("vietnamese", r"pho\b|banh|vietnamese|lemongrass"),
    ("chinese", r"lo mein|general tso|kung pao|mapo|sweet and sour|fried rice|scallion pancake|congee|bok choy|spring roll|dumpling|chinese|szechuan|bao|black bean sauce|potsticker|bang bang"),
    ("middle-eastern", r"shawarma|falafel|hummus|tabbouleh|za'atar|kofta|baba ghanoush|pita|gyro|mezze|dolmades|shakshuka|schug|toum|lentil soup"),
    ("mediterranean", r"greek|feta|orzo|tzatziki|provencal|ratatouille|olive"),
    ("mexican", r"taco|burrito|quesadilla|nacho|tinga|enchilada|barbacoa|salsa|chipotle|guacamole|churro|plantain|mojo|ancho|tostada|chorizo|pico de gallo|cilantro lime|tortilla"),
    ("italian", r"pizza|pasta|ravioli|spaghetti|penne|gnocchi|ziti|parmesan|tortellini|marinara|alfredo|tiramisu|cannoli|rotini|campanelle|cavatappi|meatball|garlic bread|bolognese|italian|flatbread|caprese|gemelli|fagioli|limoncello|lemoncello|bread knots|garlic knots|mascarpone"),
]

def guess_cuisine(n, diets):
    for c, pat in CUISINE_RULES:
        if has(n, pat):
            return c
    if "vegan" in diets and has(n, r"tofu|tempeh|vegan|plant based|beyond|impossible|chickpea|lentil|seitan|just egg"):
        return "plant-based"
    return "american"

DESSERT = r"crumble|\btorte\b|cobbler|jello|cake|cookie|brownie|\bpie\b|pudding|cheesecake|cupcake|\btart\b|muffin|donut|doughnut|scone|\bbars?\b|blondie|cannoli|tiramisu|beignet|madeleine|mousse|parfait|cr[eè]me|treat|shortcake|sundae|ice cream|croissant|cookie dough|loaf|danish|banana bread|krispie"
SOUP = r"ribollita|oden\b|soup|chowder|chili|stew|bisque|gumbo|broth|pho\b|ramen|congee"
SALAD = r"salad|slaw|tabbouleh|mezze"
PIZZA = r"pizza|flatbread|pasta|ravioli|spaghetti|penne|gnocchi|ziti|tortellini|rotini|campanelle|cavatappi|alfredo|lo mein|udon|noodle|orzo|macaroni|garlic knots|bread knots"
GRILL = r"onion rings|burger|sandwich|fries|wings|tenders|hot dog|corn dog|cheesesteak|hoagie|griller|grilled cheese|quesadilla|wrap|nuggets|mozzarella sticks|club|pretzel roll|gyro|shawarma|bánh mì|banh mi|bao"
SIDE = r"\bpickles\b|pickle spears|pickle chips|gherkins$|kamut|spelt|barley|\brice\b|beans|potato|vegetable|broccoli|green beans|haricot|carrots|\bcorn\b|asparagus|peas|spinach|cabbage|bok choy|zucchini|eggplant|sprouts|cauliflower|plantains|mustard greens|biscuits?|garlic bread|tots|hashbrowns|home ?fries|pilaf|couscous|quinoa|farro|naan|roti|pita|kimchi|edamame|mushrooms|squash|tomatoes|coleslaw|applesauce|pickled"
BREAKFAST = r"pancake|waffle|french toast|scrambl|eggs|omelet|oatmeal|granola|yogurt|bacon|sausage|bagel|hash|egg bake|strata|breakfast|melt|totchos|biscuits|skillet|shakshuka"

def guess_category(n, meal, station):
    bar = re.search(r"\b(salad|deli|omelet|yogurt|pasta)\s+bar\b", n, re.I)
    if bar:
        return {"salad": "Salads", "deli": "Grill & Deli", "omelet": "Breakfast", "yogurt": "Breakfast", "pasta": "Pizza & Pasta"}[bar.group(1).lower()]
    if has(n, DESSERT) or has(station, r"knead|dessert|finishing|sweets"):
        if not has(n, r"cheese ?steak|egg melt|corn muffin|cheddar.*muffin"):
            return "Desserts & Bakery"
    if meal in ("breakfast", "brunch") and has(n, BREAKFAST):
        return "Breakfast"
    if has(n, SOUP):
        return "Soups & Chili"
    if has(n, SALAD):
        return "Salads"
    if has(n, PIZZA):
        return "Pizza & Pasta"
    if has(n, GRILL) or has(station, r"grill|sandwich|deli"):
        return "Grill & Deli"
    if has(n, SIDE) and not has(n, r"chicken|beef|steak|pork|tofu|salmon|fish|shrimp|tempeh|lamb|brisket|turkey|meat"):
        return "Sides"
    if meal in ("breakfast", "brunch"):
        return "Breakfast"
    return "Entrées"

EMOJI_RULES = [
    (r"pizza|flatbread", "🍕"), (r"burger|griller", "🍔"), (r"taco|nacho", "🌮"), (r"burrito", "🌯"),
    (r"quesadilla", "🫓"), (r"sushi|maki", "🍣"), (r"ramen|noodle|lo mein|udon|pho\b|japchae", "🍜"),
    (r"dumpling|potsticker", "🥟"), (r"spring roll", "🥢"), (r"fried rice|congee", "🍚"),
    (r"curry|masala|rendang|aloo|adobo", "🍛"), (r"chili", "🌶️"), (r"soup|chowder|bisque|stew|gumbo|broth", "🍲"),
    (r"salad|slaw|tabbouleh", "🥗"), (r"shrimp|clam", "🍤"), (r"salmon|tuna|cod|flounder|tilapia|fish|surimi", "🐟"),
    (r"gyro|shawarma|pita|wrap|kofta", "🥙"), (r"falafel|hummus|baba|mezze|dolmades", "🧆"),
    (r"wings|chicken|karaage", "🍗"), (r"steak|beef|brisket|pot roast|barbacoa|bulgogi|lamb", "🥩"),
    (r"ribs|pork", "🍖"), (r"bacon", "🥓"), (r"sausage|hot dog|corn dog|chorizo", "🌭"),
    (r"pancake", "🥞"), (r"waffle", "🧇"), (r"french toast|bread|biscuit|roll|knots|naan|roti", "🍞"),
    (r"bagel", "🥯"), (r"donut|doughnut", "🍩"), (r"cupcake|muffin", "🧁"), (r"cheesecake|cake|tiramisu|shortcake", "🍰"),
    (r"cookie", "🍪"), (r"brownie|chocolate|blondie", "🍫"), (r"\bpie\b|tart", "🥧"), (r"pudding|cr[eè]me|mousse|parfait", "🍮"),
    (r"ice cream|sundae", "🍨"), (r"cannoli|beignet|madeleine|scone|croissant|danish|churro", "🥐"),
    (r"egg|omelet|shakshuka|tortilla espa", "🍳"), (r"oatmeal|granola|yogurt|oats", "🥣"),
    (r"pasta|spaghetti|penne|ravioli|gnocchi|ziti|tortellini|rotini|campanelle|cavatappi|orzo|macaroni|alfredo|gemelli|fagioli", "🍝"),
    (r"sandwich|hoagie|cheesesteak|club|bánh|banh|bao", "🥪"), (r"grilled cheese|mozzarella|cheese|feta", "🧀"),
    (r"tofu|tempeh", "🍱"), (r"fries|tots|wedges", "🍟"), (r"sweet potato", "🍠"), (r"potato|hash|home ?fries", "🥔"),
    (r"broccoli|kale|greens|bok choy|cabbage|spinach|kimchi", "🥦"), (r"green beans|haricot|snap peas|peas|edamame", "🫛"),
    (r"carrot", "🥕"), (r"corn", "🌽"), (r"eggplant", "🍆"), (r"mushroom", "🍄"), (r"avocado|guacamole", "🥑"),
    (r"beans|lentil|chickpea", "🫘"), (r"rice|pilaf|couscous|quinoa|farro", "🍚"), (r"plantain|banana", "🍌"),
    (r"fruit|melon|watermelon|apple|berry", "🍉"), (r"tomato", "🍅"), (r"asparagus|zucchini|vegetable|cauliflower|squash|sprouts", "🥬"),
]

def guess_emoji(n):
    for pat, e in EMOJI_RULES:
        if has(n, pat):
            return e
    return "🍽️"

def guess_goals(n, cat):
    fried = has(n, r"fried|battered|breaded|tenders|nuggets|crispy|fries|tots|popper|mozzarella sticks|onion rings|corn dog|karaage|beignet")
    rich = has(n, r"alfredo|cheese|cream|mac|bacon|buffalo|ranch|gravy") or cat == "Desserts & Bakery"
    protein = has(n, r"chicken|beef|steak|salmon|fish|cod|tilapia|flounder|tuna|shrimp|turkey|pork|lamb|tofu|tempeh|\beggs?\b|brisket|gyro|shawarma|meatball|seitan|pot roast|ribs|kofta|barbacoa|bulgogi|edamame|greek yogurt|cottage cheese")
    fibre = has(n, r"bean|lentil|chickpea|quinoa|chili|oat|farro|barley|tabbouleh|hummus|edamame|brussels|broccoli|kale|spelt|kamut|amaranth|brown rice|dolmades|baba ghanoush")
    veg = has(n, r"salad|broccoli|kale|spinach|greens|vegetable|asparagus|carrot|bok choy|cabbage|green beans|haricot|pepper|eggplant|cauliflower|brussels|squash|sweet potato|zucchini|ratatouille|snap peas|tomato|mushroom|kimchi|aloo gobi|mezze|dolmades")
    heart = has(n, r"salmon|tuna|fish|cod|tilapia|flounder|bean|lentil|oat|quinoa|chickpea|olive|hummus|vegetable|salad|tofu|edamame") and not fried and not rich
    light = (has(n, r"grilled|steamed|roasted|salad|soup|broth|baked|poached|miso") or veg) and not fried and not rich
    g = []
    if light: g.append("weight")
    if protein: g.append("muscle")
    if protein and not fried and not rich: g.append("recomp")
    if heart: g.append("cardio")
    if veg: g.append("micro")
    if fibre and not cat == "Desserts & Bakery": g.append("fibre")
    return g


PHOTO_RULES = [
    ("pizza", r"pizza|flatbread"), ("burger", r"burger|griller"), ("taco", r"taco|nacho|burrito|quesadilla|tinga|barbacoa"),
    ("sushi", r"sushi|maki"), ("noodles", r"ramen|noodle|lo mein|udon|pho\b|japchae|pad thai"),
    ("dumplings", r"dumpling|potsticker|spring roll|bao|scallion pancake"), ("soup", r"soup|chowder|bisque|stew|gumbo|broth|chili"),
    ("curry", r"curry|masala|rendang|aloo|adobo|tikka|korma"), ("salad", r"salad|slaw|tabbouleh"),
    ("seafood", r"shrimp|clam|salmon|tuna|cod|flounder|tilapia|fish|surimi"), ("wrap", r"gyro|shawarma|pita|wrap|kofta|falafel|hummus|baba|mezze|dolmades"),
    ("pancakes", r"pancake|waffle|french toast"), ("eggs", r"\beggs?\b|omelet|shakshuka|tortilla espa|strata|egg bake|egg melt|frittata|scramble"),
    ("bacon", r"bacon|sausage|chorizo|hot dog|corn dog"), ("oatmeal", r"oatmeal|granola|yogurt|oats|chia"),
    ("cookies", r"cookie|brownie|blondie|\bbars?\b|krispie|treat"), ("cake", r"cake|tiramisu|\bpie\b|tart|cannoli|cr[eè]me|pudding|mousse|parfait|sundae|ice cream"),
    ("bakery", r"muffin|scone|croissant|danish|donut|doughnut|bagel|biscuit|bread|roll|knots|naan|roti|beignet|madeleine|loaf|churro"),
    ("pasta", r"pasta|spaghetti|penne|ravioli|gnocchi|ziti|tortellini|rotini|campanelle|cavatappi|orzo|macaroni|alfredo|gemelli|fagioli|bolognese"),
    ("sandwich", r"sandwich|hoagie|cheesesteak|club|bánh|banh|grilled cheese|melt"), ("fries", r"fries|tots|wedges|onion rings|mozzarella sticks"),
    ("chicken", r"chicken|wings|karaage|turkey"), ("beef", r"steak|beef|brisket|pot roast|bulgogi|lamb|meatball|ribs|pork"),
    ("tofu", r"tofu|tempeh|seitan"), ("rice", r"rice|pilaf|couscous|quinoa|farro|barley|spelt|kamut|amaranth"),
    ("potatoes", r"potato|hash|home ?fries"), ("beans", r"beans|lentil|chickpea|edamame"),
    ("fruit", r"fruit|melon|grapefruit|plantain|banana|apple"),
    ("vegetables", r"broccoli|kale|greens|bok choy|cabbage|spinach|kimchi|green beans|haricot|snap peas|peas|carrot|corn|eggplant|mushroom|asparagus|zucchini|vegetable|cauliflower|squash|sprouts|tomato|pepper"),
]
ALIAS = {"bacon": "pancakes", "dumplings": "noodles", "fruit": "salad", "seafood": "sushi", "wrap": "salad"}
def guess_photo(n):
    for t, pat in PHOTO_RULES:
        if has(n, pat):
            return ALIAS.get(t, t)
    return ""

# ---------- halls, hours (Eastern time, 24h decimals), dates ----------
BICO_DATES = ["Sun Nov 8", "Mon Nov 9", "Tue Nov 10", "Wed Nov 11", "Thu Nov 12", "Fri Nov 13", "Sat Nov 14"]
SWAT_DATES = ["Sun Nov 15", "Mon Nov 16", "Tue Nov 17", "Wed Nov 18", "Thu Nov 19", "Fri Nov 20", "Sat Nov 14"]

def wk(mon_fri, sat, sun):
    return [sun] + [mon_fri] * 5 + [sat]

HALLS = [
    {"id": "erdman", "college": "B", "name": "Erdman Dining Hall", "raw": "raw_erdman.txt", "fmt": "mcc",
     "marksVeg": True, "blurb": "Bryn Mawr's largest dining hall", "dates": BICO_DATES,
     "coverage": "Full menu (all stations)",
     "source": "Meal Choice Connect", "sourceUrl": "https://mcc-brynmawr.computrition.online/",
     "hoursSource": "brynmawr.edu, Fall 2026 hours",
     "hours": wk([["breakfast", 7.5, 10.5], ["lunch", 11, 13.5], ["dinner", 17, 19]],
                 [["brunch", 10, 13.5], ["dinner", 17, 19]],
                 [["brunch", 10, 13.5], ["dinner", 17, 19]])},
    {"id": "nddh", "college": "B", "name": "New Dorm Dining Hall", "raw": "raw_nddh.txt", "fmt": "mcc",
     "marksVeg": True, "blurb": "Relaxed, self-serve stations", "dates": BICO_DATES,
     "coverage": "Full menu",
     "source": "Meal Choice Connect", "sourceUrl": "https://mcc-brynmawr.computrition.online/",
     "hoursSource": "brynmawr.edu, Fall 2026 hours",
     "hours": [[["brunch", 11, 13.5], ["dinner", 16, 18.5]]]
              + [[["lunch", 12, 13.5], ["dinner", 16, 21]]] * 4
              + [[["lunch", 12, 13.5], ["dinner", 16, 18.5]]]
              + [[["brunch", 11, 13.5], ["dinner", 16, 18.5]]]},
    {"id": "hcdc", "college": "H", "name": "Dining Center (DC)", "raw": "raw_hcdc.txt", "fmt": "mcc",
     "marksVeg": False, "blurb": "Haverford's all-you-care-to-eat hall", "dates": BICO_DATES,
     "coverage": "Main dishes; this menu rarely marks vegetarian/vegan, so those show as not labeled",
     "source": "Meal Choice Connect", "sourceUrl": "https://mcc-brynmawr.computrition.online/",
     "hoursSource": "haverford.edu, Fall 2026 hours (meal split from the DC page)",
     "hours": wk([["breakfast", 7.5, 10.5], ["lunch", 11, 14], ["dinner", 17, 20]],
                 [["brunch", 10, 14], ["dinner", 17, 19.5]],
                 [["brunch", 10, 14], ["dinner", 17, 19.5]])},
    {"id": "swatdc", "college": "S", "name": "The Dining Center", "raw": "raw_swat.txt", "fmt": "swat",
     "marksVeg": True, "blurb": "Swarthmore's dining hall, nine stations", "dates": SWAT_DATES,
     "coverage": "Main dishes; Friday Nov 20 and Thursday dinner were not published yet",
     "source": "The Dash", "sourceUrl": "https://dash.swarthmore.edu/menu/dining-center/",
     "hoursSource": "swarthmore.edu Dining Locations & Hours (Sept-May)",
     "hours": [[["brunch", 10, 14], ["dinner", 16, 21]]]
              + [[["breakfast", 7, 11], ["lunch", 11, 14], ["dinner", 16.5, 21.5]]] * 4
              + [[["breakfast", 7, 11], ["lunch", 11, 14], ["dinner", 16.5, 20]]]
              + [[["breakfast", 7, 11], ["lunch", 11, 14], ["dinner", 16, 20]]]},
]

dishes = {}
halls_out = []
for h in HALLS:
    menus = {}
    for line in (ROOT / h["raw"]).read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.split("|")
        day, meal, station, raw_name = int(parts[0]), parts[1], parts[2], parts[3]
        if h["fmt"] == "mcc":
            name, diets, oth = parse_mcc(raw_name)
            allergens, other, listed = [], sorted(oth), False
        else:
            name = raw_name.strip()
            labels = [x.strip() for x in parts[4].split(",") if x.strip()] if len(parts) > 4 else []
            diets = {SWAT_DIETS[l] for l in labels if l in SWAT_DIETS}
            if "vegan" in diets:
                diets.add("vegetarian")
            allergens = sorted({SWAT_ALLERGENS[l] for l in labels if l in SWAT_ALLERGENS})
            other = sorted({SWAT_OTHER[l] for l in labels if l in SWAT_OTHER})
            listed = True
        did = slug(name)
        cat = guess_category(name, meal, station)
        d = dishes.setdefault(did, {
            "id": did, "name": name, "photo": guess_photo(name), "category": cat,
            "cuisine": guess_cuisine(name, diets), "goals": guess_goals(name, cat),
            "labels": {}, "served": []})
        # labels are per source (the same dish name can be labeled differently at each college)
        d["labels"][h["id"]] = {"diets": sorted(diets), "allergens": allergens, "other": other,
                                "allergensListed": listed}
        d["served"].append({"hall": h["id"], "day": day, "meal": meal, "station": station})
        menus.setdefault(str(day), {}).setdefault(meal, [])
        if did not in menus[str(day)][meal]:
            menus[str(day)][meal].append(did)
    halls_out.append({k: h[k] for k in ("id", "college", "name", "marksVeg", "blurb", "dates", "coverage",
                                         "source", "sourceUrl", "hoursSource", "hours")} | {"menus": menus})

nut = json.loads((ROOT / "nutrition.json").read_text())
for key, v in nut.items():
    if key.startswith("_"): continue
    hall, name = key.split("|", 1)
    d = dishes.get(slug(name))
    if d and hall in d["labels"]:
        d.setdefault("nutrition", {})[hall] = v
out = {"scrapedAt": "2026-11-13", "halls": halls_out, "dishes": dishes}
(ROOT / "menu.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(len(dishes), "dishes;", sum(len(d["served"]) for d in dishes.values()), "servings;",
      round((ROOT / "menu.json").stat().st_size / 1024), "KB")
from collections import Counter
print(Counter(d["category"] for d in dishes.values()))
print(Counter(d["cuisine"] for d in dishes.values()))
