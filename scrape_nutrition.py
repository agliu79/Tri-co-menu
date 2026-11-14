"""Collect per-dish nutrition from Meal Choice Connect (Bryn Mawr + Haverford) into data/nutrition.json.

Run on any computer with internet:
    pip install playwright && playwright install chromium
    python scrape_nutrition.py 2026-11-14
then:  python build_data.py && python assemble.py

It opens each hall's menu for every meal on the given date, clicks every dish,
and reads the "Nutrition Facts per Serving" panel. Be polite: it waits between clicks.
"""
import json, re, sys, time, pathlib
from playwright.sync_api import sync_playwright

BASE = "https://mcc-brynmawr.computrition.online/#/"
HALLS = {"erdman": "ERDMAN", "nddh": "NDDH", "hcdc": "Haverford"}
FIELDS = {"Calories": "cal", "Total Fat": "fat", "Saturated Fat": "satfat", "Cholesterol": "chol",
          "Sodium": "sodium", "Total Carbohydrate": "carbs", "Dietary Fiber": "fiber",
          "Total Sugars": "sugar", "Protein": "protein"}
OUT = pathlib.Path(__file__).parent / "data/nutrition.json"

def num(s):
    m = re.search(r"[\d.]+", s or "")
    return float(m.group()) if m else None

def main(date):
    data = json.loads(OUT.read_text()) if OUT.exists() else {}
    with sync_playwright() as p:
        page = p.chromium.launch().new_page()
        for hall_id, code in HALLS.items():
            page.goto(BASE + code + "/menu-selection")
            page.wait_for_selector("text=Meal Period", timeout=20000)
            page.click("button:has-text('Meal Period')")
            meals = [m.strip() for m in page.locator(".dropdown-menu li, [role=menu] li").all_inner_texts() if m.strip()]
            page.keyboard.press("Escape")
            for meal in meals:
                page.click("button:has-text('Meal Period')")
                page.click(f"li:has-text('{meal}')")
                page.wait_for_timeout(1500)
                names = page.locator("[cursor=pointer] >> nth=0").all_inner_texts()  # fallback below
                items = page.locator("text=/\\d+ Calories/").all()
                for i in range(len(items)):
                    row = page.locator("text=/\\d+ Calories/").nth(i)
                    row.click()
                    page.wait_for_selector("text=Nutrition Facts per Serving", timeout=10000)
                    name = page.locator("text=Quantity").locator("xpath=preceding-sibling::*[1]").inner_text().strip()
                    facts = {}
                    for label, key in FIELDS.items():
                        el = page.locator(f"text='{label}'").first
                        if el.count():
                            facts[key] = num(el.locator("xpath=following-sibling::*[1]").inner_text())
                    data[f"{hall_id}|{name}"] = {k: v for k, v in facts.items() if v is not None}
                    print(hall_id, meal, name, facts.get("cal"))
                    page.go_back(); page.wait_for_timeout(800)
                    time.sleep(0.5)
    OUT.write_text(json.dumps(data, indent=1))

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else time.strftime("%Y-%m-%d"))
