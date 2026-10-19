# Borostyán – e-commerce termékoldal

Egyetemi projektfeladat (Szoftverfejlesztés projektfeladat, SZOFTF-N-EK, „A” projekt: Weblapfejlesztés).
Készítette: **Juhász Jenő** · Konzulens: Dr. Vári-Kakas István Ákos

Reszponzív termékoldal egy fiktív ruházati webáruház számára, három fő funkcióval:

- **Képnézegető**: 5 termékkép, előző/következő gomb, bélyegképek, körbeérő lapozás, lapozás billentyűzettel (←/→) és elhúzással (swipe), nagyítás, ahol a kinagyított részlet az egér vagy az ujj mozgását követi.
- **Méretválasztó**: az elfogyott méretek letiltva, az alacsony készlet jelezve, mérettáblázat a választott méret kiemelésével; méret nélkül nem lehet kosárba tenni.
- **Kosár**: oldalsó panel, mennyiségmódosítás a készlethatárig, törlés, részösszeg, szállítási díj (25 000 Ft felett ingyenes), végösszeg; a tartalom `localStorage`-ban megmarad.

A termék, a márka és az árak fiktívek. A termékképek saját készítésű SVG-illusztrációk, így licencproblémát nem okoznak.

## Technológia

- HTML5, CSS3 (mobil-első, Grid/Flexbox), natív JavaScript (ES-modulok); keretrendszer és build lépés nélkül
- Adatforrás: `data/product.json`
- Tesztelés: Node.js beépített tesztfuttató (egységtesztek), Playwright (E2E-tesztek), Lighthouse

## Mappaszerkezet

```
index.html            – az oldal szerkezete
css/styles.css        – stílusok
js/app.js             – belépési pont: adatbetöltés, a modulok összekötése
js/gallery.js         – képnézegető
js/sizeSelector.js    – méretválasztó + mérettáblázat
js/cart.js            – kosár üzleti logikája (DOM-független)
js/cartView.js        – kosár panel megjelenítése
js/utils.js           – segédfüggvények (árformázás, tároló, értesítés)
data/product.json     – termékadatok
img/                  – termékképek (SVG)
tests/unit/           – egységtesztek (node --test)
tests/e2e/            – végponttól végpontig tartó tesztek (Playwright)
```

## Futtatás helyben

Az ES-modulok miatt az oldalt webszerveren keresztül kell megnyitni (fájlként, `file://` címről nem működik):

```bash
python3 -m http.server 8080
# majd böngészőben: http://localhost:8080
```

Alternatíva: a VS Code „Live Server” bővítménye.

## Tesztek futtatása

```bash
npm install
npx playwright install chromium   # első alkalommal
npm test                          # egységtesztek + E2E-tesztek
```

Eredmény (2026. 10. 13.): 11/11 egységteszt és 29 E2E-teszt × 2 eszközprofil (asztali, mobil) = 58/58 sikeres.
Lighthouse (mobil): teljesítmény 98, akadálymentesség 100, bevált gyakorlatok 100, SEO 100.

## Publikálás GitHub Pages-en

1. Hozz létre egy nyilvános GitHub-tárolót (pl. `termekoldal`), és töltsd fel a mappa tartalmát.
2. Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, mappa: `/ (root)` → Save.
3. Kb. 1 perc múlva az oldal elérhető: `https://<felhasználónév>.github.io/termekoldal/`
