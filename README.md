# Tri-Co Eatmaxxing

Dining menus for Bryn Mawr, Haverford and Swarthmore in one place, filtered by dietary restrictions, allergens and preferences.

## Open it

`index.html` (with the `img/` folder next to it) is the whole site. Open it in a browser, or turn on GitHub Pages for this repo.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html`, `config.js` | The built site. `config.js` holds your Supabase address and key |
| `site/img/` | All images: stock photos, logos, the team's dish photos, and web-sized copies in `site/img/dishes/` |
| `DEPLOY.md`, `supabase_setup.sql` | How to set up the database and publish on GitHub Pages |
| `template.html` | Page HTML and CSS; the app code is spliced in |
| `app.js` | All the app code |
| `data/raw_*.txt` | Menus collected from Meal Choice Connect and The Dash (`day|meal|station|item|labels`) |
| `data/nutrition.json` | Nutrition values collected so far |
| `data/photo_credits.json` | Stock photo credits (Wikimedia Commons) |
| `data/source/` | Menu text pasted from the Bryn Mawr dining site |
| `convert_bmc.py` | Bryn Mawr menu text → `data/raw_nddh.txt` and `data/raw_erdman.txt` |
| `build_data.py` | Raw menus → `data/menu.json` |
| `splice.py` | Puts `app.js` into `template.html` |
| `assemble.py` | Embeds the data into the template → `site/index.html` |
| `scrape_nutrition.py` | Playwright script to collect nutrition for every Bi-Co dish (untested) |
| `grab.py` | Crops a stock photo into `site/img/` |

## Rebuild after editing

```bash
python3 convert_bmc.py  # only after pasting a new Bryn Mawr menu into data/source/
python3 build_data.py   # only if data/raw_*.txt changed
python3 splice.py       # after editing app.js
python3 dish_photos.py  # after adding dish photos to site/img/
python3 assemble.py     # writes index.html
```

## Shared data

To share reviews, posts, likes and photos between students on GitHub Pages, connect the free Supabase database: follow `DEPLOY.md` (run `supabase_setup.sql`, then fill in `config.js`). With `config.js` left blank, data is saved in each browser only.
