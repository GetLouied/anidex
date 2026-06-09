# Anigame Card Dataset (Clan Breach Tool)

Source of truth for the clan tool. Three files:

## cards.csv / cards.json
One row per card (1279 total). Columns:
- **ID** — dex ID (1–1279, unique, stable join key)
- **Name** — exact dex name incl. parentheticals
- **Element** — Grass / Fire / Electric / Water / Ground / Neutral / Null / Light / Dark
- **HP, ATK, DEF, SPD** — base stats
- **TOTAL** — HP+ATK+DEF+SPD (computed)
- **Talent** — talent name (joins to talents.json)
- **Talent Variant** — variant label, or "-" for single-variant talents.
  Format varies by talent: element (e.g. "Dark"), stat ("ATK"), or compound ("Fire/ATK")
- **Series** — source series or event name (as given by dex; event tags TBD)

## talents.json
talent name -> list of variants, each `{label, desc}`. Full descriptions verbatim.
A card's (Talent, Talent Variant) joins to the matching variant's label here.

## talent_map.json
name -> [talent, variant]. Intermediate build artifact; regenerate-able.

## Counts
63 talents, 139 variants, 1279 cards. Element split:
Grass 126 / Fire 145 / Electric 109 / Water 161 / Ground 143 /
Neutral 152 / Null 74 / Light 160 / Dark 209.

## Notes
- Element = card's own element. A talent variant may DEAL a different element
  (e.g. a Light card with Arcane Affinity [Water]). Both are stored; don't conflate.
- Elemental Manipulation cards change element in-battle; stored Element is the dex base.
- "Series" includes event names (Halloween 2024, Clan Breach, etc.) — event/mode
  flagging deferred per project plan.
