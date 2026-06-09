# Anidex — Clan Breach Toolkit

A static site for browsing Anigame cards and clan-breach comps. No backend, no
build step required to run — just static files. Data lives as JSON and the pages
fetch it at runtime.

## Project structure

```
anidex-site/
├── index.html              # redirects to cards.html
├── cards.html              # card filter page (markup only)
├── breach.html             # breach comps page (markup only)
├── assets/
│   ├── css/
│   │   ├── base.css        # shared design tokens, header/nav, element colors
│   │   ├── cards.css       # card-page-specific styles
│   │   └── breach.css      # breach-page-specific styles
│   └── js/
│       ├── data.js         # shared data loader (window.Anidex) + lookups
│       ├── cards.js        # card filter logic
│       └── breach.js       # breach page logic
├── data/
│   ├── cards.json          # 1279 cards — THE source of truth
│   ├── cards.csv           # same data, human-readable / hand-editable
│   ├── talents.json        # 63 talents, 139 variants, full descriptions
│   └── breach.json         # boss/phase/comp data (grows each weekend)
├── scripts/
│   └── build_breach.py     # regenerates data/breach.json from source mappings
└── docs/
    ├── CARDS_SCHEMA.md      # cards.json / talents.json field reference
    └── BREACH_FORMAT.md     # breach.json shape + how to add a boss
```

## Running locally

The pages use `fetch()` to load the JSON, which browsers block on `file://`.
So you must serve over HTTP. From this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 — `index.html` redirects to the card filter.

(In VS Code, the **Live Server** extension does the same thing: right-click
`cards.html` → "Open with Live Server".)

## Data model

- **cards.json** is the spine. Every other dataset joins to it by `id` (preferred)
  or `name` (also unique). IDs run 1–1279 with no gaps.
- **talents.json** holds talent descriptions; a card's `(talent, variant)` joins
  to the matching variant entry.
- **breach.json** references cards by full name/id and tags flexible slots as roles.
  See `docs/BREACH_FORMAT.md`.

## Adding next weekend's boss

1. Get the comps from the clan thread.
2. Append a boss object to `bosses[]` in `data/breach.json` (copy the Heralds
   entry as a template, or paste the thread to Claude for the JSON).
3. Refresh the breach page. No code changes needed.

## Future data (already wired for)

`data.js` loads a fixed list per page. To add new datasets (e.g. `rankings.json`
from the card-ranking work, or `effectiveness.json` for element multipliers),
add them to the `load()` function in `assets/js/data.js` and consume from
`Anidex.store`. The pages are built to absorb these without restructuring.
