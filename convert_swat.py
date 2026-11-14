"""Turn the Swarthmore Dining Center menu text (copied from The Dash) into data/raw_swat.txt.
Times in the copied text were 3 hours early (the page was showing another time zone), so hours come from build_data.py instead."""
import re, pathlib
R = pathlib.Path(__file__).parent
src = (R / "data/source/swat_menu_week_nov9.txt").read_text()

STATIONS = {"Field of Greens", "Free Zone", "World of Flavor", "The Classics", "Daily Kneads", "Fired Up",
            "Grillin' Out", "Verdant & Vegan", "Spice of Life"}
# theme or event names that head a station's list; they aren't dishes
THEMES = {"Chinese", "Steak Night", "Spanish Brunch", "Middle Eastern Breakfast", "Ravioli Night", "Mashed Potato Bar",
          "Bao Bun Station", "Nacho Bar", "Chicken Pot Pie Station", "Gyros", "Alfredo Bar", "Burrito Bowls",
          "Loaded Plantains", "Indian Bar", "Baked Potato Bar", "Ramen Bar", "Mezze", "Cheesesteak Bar",
          "Mediterranean Grain Bowl", "Italian", "Thai", "BBQ Dinner", "Breakfast Totchos", "Chicken & Waffles",
          "The 5th Meal Grill", "International Chefs Day w/ Chef Danielle", "Fried Rice station", "Chefs Choice"}
# dish names that contain commas, so a line isn't split inside them
KEEP = ["Spinach, Tomato, Ricotta Pizza", "Bacon, Jalapeño & Ranch Pizza", "Feta w/ Olive Oil, Lemon, Mint",
        "Smokey Squash Chili w/Quinoa, Pinto Beans", "Baby Kale Salad w/ Squash, Pear, Pepitas",
        "Spinach Salad w/ Feta, Apple, & Cranberry", "Roasted Brussels Sprouts, Fennel & Apple"]
LABELS = {"gluten free", "vegan", "vegetarian", "halal", "kosher", "milk", "egg", "wheat", "soy", "sesame",
          "tree nut", "peanut", "fish", "shellfish", "pork", "alcohol"}
DAY = re.compile(r"^(?:Today \()?(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),? Nov")
DIDX = {"Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6}
MEAL = re.compile(r"^(Breakfast|Brunch|Lunch|Mid Day Munches|Dinner|5th Meal),")
MKEY = {"Breakfast": "breakfast", "Brunch": "brunch", "Lunch": "lunch", "Mid Day Munches": "midday", "Dinner": "dinner", "5th Meal": "fifth"}

def split_names(line):
    keep = {}
    for i, k in enumerate(KEEP):
        if k in line:
            line = line.replace(k, f"\u0000{i}\u0000")
            keep[f"\u0000{i}\u0000"] = k
    out = []
    for p in line.split(", "):
        p = p.strip()
        for tok, k in keep.items():
            p = p.replace(tok, k)
        if p:
            out.append(p)
    return out

rows, seen = [], set()
day = meal = None; station = ""; group = None; blank = False
def flush():
    global group
    if group and day is not None and meal:
        names, labels, st = group
        for i, n in enumerate(names):
            if n in THEMES:
                continue
            lab = list(labels) if i == len(names) - 1 else []
            m2 = re.search(r"\s*\((H|V|v)\)\s*$", n)
            if m2:   # "(H)" = halal, "(V)" = vegan, written into the dish name
                n = n[:m2.start()].strip()
                tag = "halal" if m2.group(1) == "H" else "vegan"
                if tag not in lab:
                    lab.append(tag)
            key = (day, meal, re.sub(r"[^a-z0-9]", "", n.lower()))
            if key in seen:
                continue
            seen.add(key)
            rows.append(f"{day}|{meal}|{st}|{n}|{','.join(lab)}")
    group = None

for raw in src.splitlines():
    l = raw.strip()
    if not l:
        blank = True; continue
    m = DAY.match(l)
    if m:
        flush(); day = DIDX[m.group(1)]; meal = None; station = ""; blank = False; continue
    m = MEAL.match(l)
    if m:
        flush(); meal = MKEY[m.group(1)]; station = ""; blank = False; continue
    if l.startswith("Chefs Choice of Protein"):
        flush(); blank = False; continue
    if l in STATIONS:
        flush(); station = l; blank = False; continue
    m = re.fullmatch(r"\((.+)\)", l)
    if m:
        if group and m.group(1).lower() in LABELS:
            group[1].append(m.group(1).lower())
        blank = False; continue
    cont = l.startswith(",")
    flush()
    if not cont and blank and station:   # a list after a gap with no station heading: the shared salad bar etc.
        station = ""
    group = (split_names(l.lstrip(", ").strip()), [], station)
    blank = False
flush()

head = ["# Swarthmore Dining Center, Mon Nov 9 - Sun Nov 15 2026, from The Dash (data/source/swat_menu_week_nov9.txt)",
        "# day(0=Sun)|meal|station|item|labels"]
(R / "data/raw_swat.txt").write_text("\n".join(head + rows) + "\n")
from collections import Counter
print(len(rows), "rows;", sorted(Counter((r.split("|")[0], r.split("|")[1]) for r in rows).items()))
