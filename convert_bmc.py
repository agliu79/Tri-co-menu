"""Turn the Bryn Mawr dining menu text (copied from the BMC dining site) into data/raw_nddh.txt and data/raw_erdman.txt.
Keeps the existing Sunday entries (the text starts on Monday)."""
import re, pathlib, unicodedata
R = pathlib.Path(__file__).parent
src = (R / "data/source/bmc_menu_week_nov9.txt").read_text()

# items the copy split across two lines, joined back up
JOIN = {("Roasted Lemon-Pepper", "Chickpeas V"): "Roasted Lemon-Pepper Chickpeas V",
        ("Curry Tofu Potato", "Scramble V PwW"): "Curry Tofu Potato Scramble V PwW",
        ("White Beans &", "Mushrooms V PwW"): "White Beans & Mushrooms V PwW",
        ("Breakfast Caprese", "on a Brioche Roll*"): "Breakfast Caprese on a Brioche Roll*",
        ("Tostada with Chorizo, Egg,", "Pico & Queso"): "Tostada with Chorizo, Egg, Pico & Queso",
        ("Strawberry Poppyseed", "Salad * PwW"): "Strawberry Poppyseed Salad* PwW",
        ("Cheese Sticks &", "Sriracha Ketchup"): "Cheese Sticks & Sriracha Ketchup",
        ("Maple Glazed", "Sweet Potatoes V PwW"): "Maple Glazed Sweet Potatoes V PwW"}
# lines holding two dishes
SPLIT = {"Corn Dogs Dr Praeger’s Burger V": ["Corn Dogs", "Dr Praeger’s Burger V"],
         "Marinara V PwW Penne V": ["Marinara V PwW", "Penne V"],
         "Marinara V PwW Rigatoni V": ["Marinara V PwW", "Rigatoni V"],
         "Blush* & Bolognese PwW Penne V": ["Blush* & Bolognese PwW", "Penne V"],
         "Blush* & Bolognese PwW Garlic Breadsticks*": ["Blush* & Bolognese PwW", "Garlic Breadsticks*"],
         "deep fried battered pickle chips garlic rice & peas": ["deep fried battered pickle chips", "garlic rice & peas"],
         "fire & ice pickles pickle spears": ["fire & ice pickles", "pickle spears"]}
FIX = {"Sushi, Tuna Salad Rol": "Sushi: Tuna Salad Roll", "Flourless Chocolate": "Flourless Chocolate Cake",
       "Seasoned Impossible “Meat” V": "Seasoned Impossible Meat V", "Buffalo Chix Flatbread": "Buffalo Chicken Flatbread",
       "Scrambled Eggs PwW": "Scrambled Eggs* PwW", "Selection of Cookies *": "Selection of Cookies*",
       "Assorted Bagels* •": "Assorted Bagels*", "Chocolate Chocolate Chip Cookies V": "Double Chocolate Chip Cookies V"}
SMALL = {"and", "or", "with", "of", "on", "in", "a", "the", "&"}
def title(s):
    if s != s.lower():
        return s
    w = s.split()
    return " ".join(x if (i and x in SMALL) else x[:1].upper() + x[1:] for i, x in enumerate(w))

DAY = re.compile(r"^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b|^SAT\b", re.I)
DIDX = {"sunday": 0, "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6, "sat": 6}
MEAL = {"BREAKFAST": "breakfast", "BRUNCH": "brunch", "LUNCH": "lunch", "DINNER": "dinner"}

hall, day, meal, station = None, None, None, ""
out = {"nddh": [], "erdman": []}
lines = [re.sub(r"\s+", " ", unicodedata.normalize("NFC", l)).strip() for l in src.splitlines()]
i = 0
while i < len(lines):
    l = lines[i]; i += 1
    if not l:
        continue
    if l.startswith("New Dorm Dining Hall"):
        hall = "nddh"; continue
    if l.startswith("Erdman Dining Hall"):
        hall = "erdman"; day = None; continue
    if hall is None or l.startswith(("*", "Expand", "Menu items", "ERDMUND", "Dining")):
        continue
    m = DAY.match(l)
    if m:
        day = DIDX[m.group(0).lower()]; meal = None; station = ""; continue
    if l.upper() in MEAL:
        meal = MEAL[l.upper()]; station = ""; continue
    if l.lower() == "national pickle day":   # Erdman Saturday: dinner theme
        meal = "dinner"; station = "National Pickle Day"; continue
    if l.lower().rstrip(":") == "pickle bar":
        station = "Pickle Bar"; continue
    if day is None or meal is None:
        continue
    if i < len(lines) and (l, lines[i]) in JOIN:
        l = JOIN[(l, lines[i])]; i += 1
    l = FIX.get(l, l)
    parts = SPLIT.get(l) or [p.strip() for p in l.split("•")]
    for p in parts:
        p = FIX.get(p.strip(), p.strip())
        if not p:
            continue
        out[hall].append((day, meal, station, title(p)))

for hall, fname, head in [("nddh", "raw_nddh.txt", "New Dorm Dining Hall, full menu"),
                          ("erdman", "raw_erdman.txt", "Erdman Dining Hall, full menu")]:
    old = (R / "data" / fname).read_text().splitlines()
    sunday = [x for x in old if x.startswith("0|")]
    seen, rows = set(), []
    for d, m, st, name in out[hall]:
        key = (d, m, re.sub(r"[^a-z]", "", name.lower()))
        if key in seen:
            continue
        seen.add(key); rows.append(f"{d}|{m}|{st}|{name}")
    txt = [f"# {head}. Mon Nov 9 - Sat Nov 14 2026 from the BMC dining menu (data/source/bmc_menu_week_nov9.txt); Sunday kept from Meal Choice Connect",
           "# day(0=Sun)|meal|station|item as printed (* vegetarian, V vegan, PwW prepared without wheat)"] + sunday + rows
    (R / "data" / fname).write_text("\n".join(txt) + "\n")
    print(fname, len(sunday), "sunday +", len(rows), "new")
