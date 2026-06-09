# pvp.json format

Drives the public PvP page. Adapted from adobs's AniGame PvP Guide (credit in meta.credit).

## Top level
- **meta**       — title, updated date, credit string (shown in page footer)
- **tiers[]**    — talent tier list (7 tiers)
- **meta_cards[]** — best-in-slot card(s) per talent
- **archetypes[]** — comp archetypes (Burst, Stall, etc.)
- **roleTalentMap** — maps comp talent-labels to a talent(+variant) for deep-linking to cards.html

## tiers[]
```
{ "tier":"VERY META", "slug":"very-meta", "desc":"...",
  "talents":[ {"label":"Overload (ATK)","talent":"Overload","variant":"ATK","resolved":true}, ... ] }
```
- `label` = how it's shown; `talent`+`variant` = link target into the cards page.
- `resolved:false` renders greyed-out (talent name not found in talents.json).

## meta_cards[]
```
{ "talent":"Reversion", "cards":[ {"type":"card","name":"Shinpei Ajiro","id":...}, {"type":"any","label":"(any tanky)"} ] }
```

## archetypes[]
```
{ "name":"Burst", "slug":"burst", "objective":"...", "counters":"...", "stats":"...",
  "meta_comps":[ {slots, note} ], "other_comps":[ {slots, note} ] }
```
Slots: card ({type,name,id}), role ({type,role label} -> roleTalentMap link), any ({type,label}).

## Updating
Re-run scripts/build_pvp.py after editing the source lists in that script, or hand-edit
pvp.json directly. Card names must match cards.json exactly; the build script resolves
shorthand via its R{} map and reports any misses.

## Attribution
The guide is adobs's work, used with permission. Keep the credit line in meta.credit
and the page footer intact.
