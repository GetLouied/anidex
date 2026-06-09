# breach.json format

Drives the Breach page. Add a new boss each weekend by appending to `bosses[]`.

## Top level
- **meta** — title, updated date, note
- **reference** — permanent info: energy, principles, rewards, formulas (plain text/arrays)
- **bosses[]** — one entry per boss (Heralds is the fixed one, always present)
- **roleTalentMap** — maps role tags (e.g. "Sap") to a talent (+variant) so role slots
  can deep-link into the card filter. Add new roles here as they appear.

## A boss
```
{
  "id":"turnip-head",            // url-safe slug
  "name":"Turnip Head",
  "series":"Howls Moving Castle",// for pack context
  "fixed":false,                 // true only for Heralds
  "tips":["...","..."],          // optional, boss-specific
  "phases":[ ... ]
}
```

## A phase  (e.g. a boss has Collapse / Enraged; Heralds has Salvation / Damnation)
```
{ "name":"Enraged", "icon":"sun|moon|null",
  "difficulties":[ {mode, comps, best_energy?}, ... ] }
```

## A difficulty
```
{ "mode":"Impossible|Hard|Medium",
  "best_energy":true,            // optional flag = "safest place to spend energy"
  "comps":[ {slots, note?}, ... ] }
```

## A comp = list of slots (+optional note)
Each **slot** is one of:
- **card**:   {"type":"card","name":"Full Card Name","id":123,"note":"A5"}
- **role**:   {"type":"role","label":"Sap","note":"..."}      // links via roleTalentMap
- **tag**:    {"type":"tag","label":"A5"}                       // ascension/holo constraints
- **choice**: {"type":"choice","options":[ <slot>, <slot>, ... ],"note":"..."}
              // "pick one of these" — used for the X/Y/Z shorthand

## Adding a boss fastest
Paste the Discord thread to Claude and ask for the JSON entry; or copy the Heralds
entry, change id/name/phases, and edit the comps. Names must match cards.json exactly
(full names). Unknown shorthand -> resolve to full name or make it a role/tag.
