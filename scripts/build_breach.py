import json

cards = json.load(open('../data/cards.json'))
name_to_id = {c['name']:c['id'] for c in cards}

# Shorthand -> full card name (only the ones used in this thread; extend over time)
SHORT = {
  "Harima":"Mika Harima","Alphonse":"Alphonse Elric","Ryusui":"Ryusui Nanami",
  "Kosei":"Kosei Arima","Kyubey":"Kyubey","Ajiro":"Shinpei Ajiro","Saiki":"Kusuo Saiki",
  "Sesshomaru":"Sesshomaru","Ogawa":"Yuzuriha Ogawa","Botan":"Botan","Jo":"Jo Togame",
  "Megose":"Megose","Kairi":"Kairi","Ririka":"Ririka Momobami","Zeldris":"Zeldris",
  "Min":"Min Byung Gyu","May":"May","Tsukihi":"Tsukihi Araragi","Robota":"Robota",
  "Queen":"Queen","Jabber":"Jabber Wonger","V.V.":"V.V.","Zeref":"Zeref Dragneel",
  "August":"August Stilza","Amo":"Amo Empool","Vorona":"Vorona","Meme":"Meme Oshino",
  "Eve":"Atom Eve (Samantha Eve Wilkins)","Kaori":"Kaori Miyazono","Hero X":"Hero X","Saiki A0":"Kusuo Saiki",
}

def card_slot(short, note=None):
    full = SHORT.get(short, short)
    cid = name_to_id.get(full)
    s = {"type":"card","name":full}
    if cid: s["id"]=cid
    if note: s["note"]=note
    return s
def role_slot(label, note=None):
    s={"type":"role","label":label}
    if note:s["note"]=note
    return s
def tag_slot(label):  # A5 / Holo style
    return {"type":"tag","label":label}

# A "slot" can also be a CHOICE: pick one of several options.
def choice(options, note=None):
    s={"type":"choice","options":options}
    if note:s["note"]=note
    return s

def C(*slots, note=None):
    c={"slots":list(slots)}
    if note:c["note"]=note
    return c

breach = {
  "meta":{
    "title":"Clan Breach",
    "updated":"2026-06-09",
    "note":"Heralds are the only fixed phase every breach. Per-boss phases change weekly."
  },
  "reference":{
    "energy":[
      "You only start gaining breach energy (20 at start + 1 every 10 min) once you do .br for the first time during breach — do it as early as possible.",
      "When breach starts, use '.br charge' in the charge channels to be reminded every 30 minutes for 5 additional energy per use."
    ],
    "principles":[
      "There is no single best team. Each breach features a different old clan-shop card as boss and needs a new team to beat it quickly. Fewer turns (under 10) = better damage, so burst teams shine here.",
      "Heralds mini-boss phase is the most annoying and longest. It is the only fixed phase every breach, so you can prepare for it ahead of time.",
      "Consistent damage beats risky high-difficulty teams. If your team isn't crit-safe for many turns in Impossible, drop to Hard or Medium.",
      "Don't test your luck with crits. Go one mode lower where you are crit-safe. Consistent damage > a small extra percentage."
    ],
    "rewards":{
      "personal":"Highest damage milestone is 1.5mil damage: 300k Rubies + 4 epic & 2 legendary breach packs + instant 800k gold donation to clan.",
      "packs":"Epic/legendary packs give cards from the boss's featured clan series (e.g. Turnip Head boss -> Howl's Moving Castle clan-shop cards).",
      "clan":"Clan goal is rank 1 every breach: instant 25mil gold donation + 250,000 Rubies + 4 Breach Legendary packs to EVERY member. Your performance affects the whole clan."
    },
    "formulas":{
      "solo":"[First Bar + (Second Bar x Annihilation Multiplier)] x Difficulty Damage Multiplier x Number of Battles",
      "duo":"{[First Bar + (Second Bar x Annihilation Multiplier)] x Difficulty Damage Multiplier x Tag Battle Multiplier x Number of Battles} / 2  (damage per person)",
      "enraged":"Multiply the whole formula by 1.2",
      "conclusions":[
        "Heralds have only 1 health bar and no Annihilation Multiplier, so the bar/annihilation notes below apply only to Boss phases, not Heralds.",
        "Duo Impossible cannot beat Solo Impossible in any scenario.",
        "Duo Impossible beats Solo Hard if Duo clears in 7 turns or less and Solo Hard clears in 10 turns.",
        "Duo Impossible beats Solo Medium in all cases, even at 10-turn clear.",
        "Enraged Phase is the BEST phase to use energy — even an R10+ clear beats an R3 clear on Collapse phase.",
        "Heralds Phase is the WORST phase to use energy (no Zombie Bar, no Annihilation Multiplier)."
      ]
    }
  },
  "bosses":[
    {
      "id":"heralds",
      "name":"Heralds (Fixed Phase)",
      "fixed":True,
      "series":"Clan Breach",
      "tips":[
        "Salvation is safer to use energy on than Damnation: R1 Resist + no further resist on Damnation = death sentence to any team (~10% failure chance).",
        "Use your energy OUTSIDE the Heralds phase as much as you can. Drain energy before Heralds spawn, and save as many as you can toward the END of the Heralds' HP.",
        "Heralds only give 50% of the damage you deal to the boss (1 health bar only).",
        "What works in Impossible works in Hard/Medium with lower ascends or non-dark/light/null elements.",
        "You do NOT need to do both Heralds. Pick the one you can do safely in the highest mode and stick to it.",
        "Do not test luck with crits — go one mode lower where you're crit-safe."
      ],
      "phases":[
        {
          "name":"Herald of Salvation",
          "icon":"sun",
          "difficulties":[
            {"mode":"Impossible","comps":[
              C(card_slot("Harima"),card_slot("Alphonse"),
                choice([card_slot("Ryusui"),card_slot("Kosei"),card_slot("Kyubey")]),
                note="A5 on all + at least fam 1 on two of them"),
              C(card_slot("Harima"),card_slot("Ajiro"),
                choice([card_slot("Ryusui"),card_slot("Kosei"),card_slot("Kyubey")]),
                note="A5 + at least 1 Holo"),
            ]},
            {"mode":"Hard","best_energy":True,"comps":[
              C(choice([card_slot("Min"),card_slot("Harima"),card_slot("May"),card_slot("Tsukihi"),card_slot("Robota")]),
                choice([card_slot("Kosei"),card_slot("Kairi"),card_slot("Ryusui"),card_slot("Ririka"),card_slot("Zeldris"),card_slot("Kyubey")]),
                role_slot("Sap"),
                note="Light and Null, or A5 Holos"),
              C(choice([card_slot("Ajiro"),card_slot("Botan")]),
                choice([card_slot("Kaori",note="Kaori Miyazono - confirm"),card_slot("Queen"),role_slot("Tanky DefTrick")]),
                card_slot("Saiki")),
              C(choice([card_slot("Jo"),card_slot("Megose")]),role_slot("Rejuvenation"),card_slot("Hero X"),
                note="High Ascends"),
              C(card_slot("Sesshomaru",note="A5"),card_slot("Ogawa",note="A5H"),card_slot("Saiki",note="A0")),
            ]},
            {"mode":"Medium","comps":[
              C(choice([role_slot("Def Transformation"),role_slot("Reversion")]),
                choice([role_slot("Hack"),role_slot("Sap")]),
                role_slot("Sap"),
                note="Light or Null or Holo A5s"),
              C(role_slot("Rising Resolve"),role_slot("Regen"),role_slot("Sap")),
            ]},
          ]
        },
        {
          "name":"Herald of Damnation",
          "icon":"moon",
          "difficulties":[
            {"mode":"Impossible","comps":[
              C(choice([card_slot("Harima"),card_slot("May"),card_slot("Tsukihi"),card_slot("Jabber"),card_slot("Robota"),card_slot("V.V.")]),
                choice([card_slot("Zeref"),card_slot("Ajiro")]),
                card_slot("Meme"),
                note="A5, no fam required"),
            ]},
            {"mode":"Hard","comps":[
              C(choice([card_slot("Ajiro"),card_slot("Zeref")]),
                choice([card_slot("August"),card_slot("Amo"),card_slot("Vorona")]),
                card_slot("Meme")),
              C(card_slot("Ajiro"),card_slot("Eve"),card_slot("Amo"),note="High Ascends"),
            ]},
            {"mode":"Medium","comps":[
              C(role_slot("Reversion"),role_slot("Regen"),role_slot("Recoil")),
              C(role_slot("Atk Trick"),role_slot("Def Trick"),role_slot("Surge"),
                note="Surge must activate on round 4 when not silenced"),
            ]},
          ]
        }
      ]
    }
  ]
}

# Resolve role->talent hints for filtering later
ROLE_TALENT = {
  "Sap":("Life Sap",None),"Tanky DefTrick":("Trick Room","DEF"),
  "Rejuvenation":("Rejuvenation",None),"Rising Resolve":("Rising Resolve",None),
  "Regen":("Regeneration",None),"Hack":("Omniscient Hack",None),
  "Recoil":("Recoil",None),"Surge":("Blood Surge",None),
  "Def Transformation":("Transformation","DEF"),"Reversion":("Reversion",None),
  "Atk Trick":("Trick Room","ATK"),"Def Trick":("Trick Room","DEF"),
}
breach["roleTalentMap"]={k:{"talent":v[0],"variant":v[1]} for k,v in ROLE_TALENT.items()}

with open("../data/breach.json","w") as f:
    json.dump(breach,f,indent=2,ensure_ascii=False)

# Report any card slots that failed to resolve to an ID
def walk(comp):
    out=[]
    for s in comp["slots"]:
        if s["type"]=="choice":
            for o in s["options"]:
                if o["type"]=="card": out.append(o)
        elif s["type"]=="card": out.append(s)
    return out
unresolved=set()
for b in breach["bosses"]:
    for ph in b["phases"]:
        for d in ph["difficulties"]:
            for comp in d["comps"]:
                for cs in walk(comp):
                    if "id" not in cs: unresolved.add(cs["name"])
print("breach.json written.")
print("Unresolved card slots:", sorted(unresolved) if unresolved else "none")
