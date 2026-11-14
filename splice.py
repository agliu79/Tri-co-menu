import re,pathlib
r=pathlib.Path(__file__).parent
t=(r/"template.html").read_text()
a=(r/"app.js").read_text()
i=t.index("const STOCK = /*STOCK*/{};\n")+len("const STOCK = /*STOCK*/{};\n")
j=t.rindex("</script>")
(r/"template.html").write_text(t[:i]+a.rstrip("\n")+"\n"+t[j:])
