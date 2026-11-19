# makefun-gta6-cover-art-01-v3
[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kiowayyy2109/makefun-gta6-cover-art-01-v3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kiowayyy2109/makefun-gta6-cover-art-01-v3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**ViceFrame** is a poster cover studio that turns your own photos and a headline into bold, multi-panel, GTA-poster-style cover art — thick panel gutters, a Vice City sunset or neon colour grade, huge condensed lettering and hand-drawn-in-code decorations (retro sun with scanline cuts, palm silhouettes, sparkles and an editable starburst badge) — then exports a share-ready PNG. Everything runs offline in a desktop browser from the static files in `app/`; your photos never leave your machine.

What it does:

- **Four poster layouts** — Classic Spread (one tall hero panel plus two stacked panels), Hero + Strip, Duo Split and Mosaic Four — with heavy poster-style borders around every panel, reflowed automatically for each export size.
- **Real photo handling** — load one or more of your own photos (file picker or drag & drop), mix them with the two bundled samples, assign a different photo to every panel or stretch one photo across all panels, click a panel to select it, drag on the canvas to reposition, scroll or use the slider to zoom, and switch each panel between Fill and Fit.
- **Five colour grades** — Vice Sunset, Neon Nights, Golden Hour, Noir and Clean — built from canvas filters and colour washes, plus a Punch slider for extra saturation and contrast.
- **Poster lettering** — an editable main title in the bundled Anton typeface (SIL Open Font License, see `app/fonts/OFL.txt`) with a sunset-gradient, solid-white or outline fill, dark outline and hard shadow, an editable tagline in a pill, top or bottom placement and a size control.
- **One-click export** — PNG download at 1080×1080, 1080×1350 or 1920×1080. Sensible defaults (samples loaded, headline set, Vice Sunset grade) mean the first paint already looks like a finished cover, so it is seconds from opening the page to a saved PNG.

All artwork is original and drawn in code at render time; no game logos, wordmarks, official artwork, characters or font files from any game are used. The only bundled font is Anton under the SIL OFL.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step and no network connection are needed — `app/index.html` and everything it loads are local files.

Fixed scenes for screenshots: `?shot=cover` renders only the finished cover, `?shot=editor` renders the full studio, and `&photo=pier|boulevard` plus `&caption=<text>` choose the sample and headline (see `shots.json`).

<sub>Entered on [make.fun](https://make.fun/?ref=8b9bbsfs&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
