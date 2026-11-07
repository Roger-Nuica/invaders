# Porcii Cosmici

Un shooter spațial cu porci zburători (cu căști cu elice, eșarfe și aripi de liliac), făcut pentru telefon (portret). Totul e desenat din cod pe Canvas 2D, sunetele sunt sintetizate, fără fișiere de imagini sau audio.

## Cum se joacă
- **Trage cu degetul** oriunde pe ecran: nava te urmărește (puțin deasupra degetului) și **trage automat**.
- **Butonul din stânga** schimbă arma: **Ion** (evantai de gloanțe), **Neutron** (bolțuri groase care străpung rânduri întregi), **Vulcan** (rafală rapidă).
- **Cadourile** 🎁 cresc puterea armei (max 6), **cârnații** 🌭 dau puncte, **bomba** 💣 curăță proiectilele și lovește tare.
- 4 valuri de porci în 5 culori (rânduri, V, inele rotative, un opt) care aruncă bile de noroi, apoi **Porcul Uriaș** (cu toc de bucătar și mustață): noroi în evantai, spirale, ploaie și **roșii mari** care se sparg în trei. Ferește-te!

Pe desktop: săgeți/WASD, `1` `2` `3` sau `Q` pentru arme, `B`/spațiu bombă, `P` pauză.

## Rulare
```
npm start        # http://localhost:8080
npm test         # teste pentru regulile jocului
npm run build    # dist/ (pentru Vercel)
```
Parametri de debug în URL: `?boss` (direct la boss), `?wave=3`, `?god` (nemuritor), `?seed=7`, `?autostart`, `?nosw`.

## Structura
- `src/game.js`, `waves.js`, `boss.js`, `weapons.js`, `drops.js`, `math.js` – regulile jocului, fără DOM, testate în `tests/`.
- `src/render/` – porcul (`pig.js`), sprite-uri pre-randate (`sprites.js`), fundal, efecte, HUD (`renderer.js`).
- `src/input.js`, `audio.js`, `main.js` – control, sunet, bucla de joc.
- `sw.js` + `manifest.json` – PWA, merge offline. `scripts/icon.html` generează iconițele din același porc.
