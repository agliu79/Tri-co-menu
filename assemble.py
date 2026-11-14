import json, pathlib
r = pathlib.Path(__file__).parent
data = (r/"data/menu.json").read_text()
cred_p = r/"data/photo_credits.json"
cred = json.loads(cred_p.read_text()) if cred_p.exists() else {}
cred = {k: v for k, v in cred.items() if (r/"site/img"/f"{k}.jpg").exists()}
html = (r/"template.html").read_text()
html = html.replace("/*DATA*/null", data.replace("</", "<\\/"), 1)
html = html.replace("/*STOCK*/{}", json.dumps(cred, ensure_ascii=False).replace("</", "<\\/"), 1)
(r/"index.html").write_text(html)
print("index.html", round(len(html)/1024), "KB;", len(cred), "stock photos")
