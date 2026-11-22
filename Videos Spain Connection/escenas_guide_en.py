"""Video 1 (EN) — Buyer's Guide · The Spain Connection · short, warm, dynamic cut."""
import motor
from motor import (COL, Background, Card, Group, Line, Logo, Pill, Scene, Slideshow, Stat, Text, Title, chip, header,
                   step)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "en"

VOZ = "en-US-AvaMultilingualNeural"
RATE = "+4%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.32
ARCHIVO = "Buyers_Guide_The_Spain_Connection_EN.mp4"

IMG = "images/guia/"
PROP = "images/guia/propiedades/"
REC = "Presentación Spain Connection/_recursos/img/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Buyer's Guide · 2026"


def escenas():
    S = []

    # 1 · COVER -----------------------------------------------------------
    S.append(Scene("s01",
        "Hi there! Thinking about a home in Spain? Let's make it simple. Here's your quick guide to buying on "
        "the Costa Blanca, with one friendly team by your side, all the way.",
        Background("dark", IMG + "portada.jpg", kb=(1.0, 1.2), pan=((0.3, 0.5), (0.7, 0.45))),
        [
            Pill("Buyer's Guide · 2026", 120, 250, at=-0.3),
            Title("Your home in Spain,\n*step by step*", 120, 330, size=106, maxw=1400, at=0.0, stagger=0.14),
        ]))
    S[-1].els += [
        Text("Everything you need to buy with confidence on the Costa Blanca — with one team by your side.",
             120, 590, size=32, maxw=940, color=SOFT, at="simple"),
        Stat(120, 770, 340, 150, "{}+", [320], "sunny days a year", at="Costa"),
        Stat(490, 770, 340, 150, "{}–{}", [4, 8], "weeks · full process", at="friendly"),
        Stat(860, 770, 340, 150, "{}%", [100], "remote purchase possible", at="team"),
        Card(1290, 790, 510, 110, [("img", 30, 18, REC + "remax-inmomas.png", 140, 74),
                                   ("img", 195, 12, REC + "fuster.png", 120, 86),
                                   ("img", 350, 20, REC + "uci.png", 130, 70)],
             style="white", r=20, at="side", anim="right"),
    ]

    # 2 · LIFESTYLE -------------------------------------------------------
    S.append(Scene("s02",
        "First, the lifestyle. Over 320 sunny days a year, beautiful Blue Flag beaches, amazing food, and "
        "world-class healthcare. And home is just one flight away.",
        Background("dark", IMG + "beach.jpg", kb=(1.05, 1.22), pan=((0.5, 0.3), (0.5, 0.7))),
        header("01 · Lifestyle", "Sun, sea and\n*a better life*", True, size=86) + [
            Stat(120, 520, 400, 200, "{}+", [320], "Sunny days a year", icon="☀️", num_size=70, at="320"),
            Stat(540, 520, 400, 200, "{} km", [200], "of Blue Flag beaches", icon="🏖️", num_size=70,
                 at="beaches"),
            Stat(960, 520, 400, 200, "Nº {}", [1], "Healthiest country (Bloomberg)", icon="🏥", num_size=70,
                 at="healthcare"),
            Stat(1380, 520, 400, 200, "{}+", [150], "Flight connections from ALC", icon="✈️", num_size=70,
                 at="flight"),
            Card(120, 790, 1200, 110, [("rect", 0, 0, 8, 110, COL["orange"], 0),
                                       ("t", 44, 28, "“Here, the Mediterranean lifestyle isn't a luxury — "
                                        "*it's everyday life*.”", 32, 600, WHITE,
                                        {"maxw": 1120, "hl": COL["orange_l"]})],
                 style="glass", r=18, at=("home", -0.3), anim="left"),
        ], header=HDR, page=1))

    # 3 · COST OF LIVING --------------------------------------------------
    S.append(Scene("s03",
        "Even better, your money goes a lot further here. Everyday life costs about 40 to 60% less than in the "
        "US or Canada. Think dinner for two from 35 euros, and a lovely three-bedroom home from around 250,000.",
        Background("dark", IMG + "terrace.jpg", kb=(1.04, 1.22), pan=((0.7, 0.5), (0.4, 0.5))),
        header("02 · Cost of living", "Your money goes\n*a lot further*", True, size=86) + [
            Stat(120, 470, 760, 230, "{}–{}%", [40, 60], "lower cost of living than the US or Canada",
                 num_size=118, label_size=28, at="40", count=1.4),
            Stat(120, 750, 400, 170, "€{}–{}", [35, 60], "Gourmet dinner for two", icon="🍽️", num_size=50,
                 at="dinner"),
            Stat(550, 750, 400, 170, "€{}–{}", [80, 150], "Private health cover / month", icon="🩺",
                 num_size=50, at=("dinner", 0.7)),
            Stat(980, 750, 400, 170, "€{}K", [250], "3-bedroom home, from", icon="🏡", num_size=50,
                 at="three"),
        ], header=HDR, page=2))

    # 4 · NEW BUILDS ------------------------------------------------------
    props = [("Portamarina Arena", "Guardamar del Segura", "€320,000", "Guardamar"),
             ("Towers III Poniente", "Benidorm · Poniente Beach", "€385,000", "Benidorm"),
             ("Sierra Cortina Sky", "Finestrat · 180° views", "€600,000", "Finestrat"),
             ("Residencial Homes II", "Algorfa · Golf Resort", "€650,000", "Algorfa")]
    els = header("03 · New builds", "Turnkey\n*new builds*", False, size=80, maxw=780)
    els += [
        Text("*150+ verified developments*, checked by RE/MAX Inmomás and Fuster & Associates — at the "
             "developer's official price.", 120, 425, size=26, maxw=780, color=COL["slate"], hl=COL["navy"],
             at="verified"),
        chip(120, 555, 370, 84, "🛡️", "100% bank-guaranteed", at="bank", size=23),
        chip(510, 555, 390, 84, "🏗️", "10-year warranty", at=("bank", 0.4), size=23),
    ]
    for i, (n, loc, pr, k) in enumerate(props):
        els.append(Card(120, 668 + i * 84, 780, 72,
                        [("rect", 0, 0, 8, 72, COL["orange"] if i == 3 else COL["blue"], 0),
                         ("t", 34, 20, n, 24, 720, COL["navy"]),
                         ("t", 320, 23, loc, 20, 500, COL["slate"]),
                         ("t", 540, 19, pr, 26, 780, COL["blue"], {"maxw": 214, "align": "right"})],
                        r=16, at=k, anim="left"))
    els.append(Slideshow(980, 170, 820, 790, [
        (PROP + "portamarina-1.jpg", 0.0, "Portamarina Arena · Guardamar"),
        (PROP + "towers3-1.jpg", "Benidorm", "Towers III · Benidorm"),
        (PROP + "sierracortina-1.jpg", "Finestrat", "Sierra Cortina Sky · Finestrat"),
        (PROP + "homes2-1.jpg", "Algorfa", "Residencial Homes II · Algorfa"),
    ], kb=(1.02, 1.18), at=-0.2))
    S.append(Scene("s04",
        "Love new builds? You'll get access to over 150 verified developments, at the developer's official "
        "price, and fully bank-guaranteed. From beachside apartments in Guardamar and Benidorm, to stunning "
        "penthouses in Finestrat and golf villas in Algorfa.",
        Background("light"), els, header=HDR, page=3))

    # 5 · BUYING PROCESS --------------------------------------------------
    pasos = [("Get your\nNIE number", "2–4 weeks", "N.I.E."), ("Spanish\nbank account", "1–2 days", "bank"),
             ("Your personal\nshortlist", "1–2 weeks", "shortlist"),
             ("Legal\ndue diligence", "1 week", "lawyers"), ("Notary\nsigning", "1 day", "notary"),
             ("Get your\nkeys!", "Same day", "keys")]
    els = header("04 · Buying process", "Easier than\n*you think*", False, size=76)
    x0, x1, ly = 230, 1690, 520
    sp = (x1 - x0) / 5
    els.append(Line(x0, ly, x1, ly, color=COL["line"], width=6, at=-0.2, dur=0.8))
    for i, (t, d, k) in enumerate(pasos):
        cx = x0 + i * sp
        last = i == len(pasos) - 1
        if i > 0:
            els.append(Line(cx - sp + 34, ly, cx - 34, ly, color=COL["blue"], width=6, at=(k, -0.4), dur=0.4))
        els.append(Group(int(cx - 130), ly - 34, 260, 230, [
            ("badge", 96, 0, i + 1, 68, COL["orange"] if last else COL["blue"], WHITE),
            ("t", 0, 92, t, 24, 720, COL["navy"], {"maxw": 260, "align": "center", "lh": 1.18}),
            ("t", 0, 162, d, 20, 600, COL["orange"] if last else COL["blue"], {"maxw": 260, "align": "center"}),
        ], at=k, anim="scale", dur=0.55))
    els += [
        Stat(120, 790, 640, 150, "{}–{} weeks", [4, 8], "Typical end-to-end timeline", style="navy",
             num_size=52, at="four"),
        chip(800, 790, 1000, 150, "check", "*100% doable remotely*",
             sub="With power of attorney — no need to fly to Spain.", style="light", size=30, at="remotely"),
    ]
    S.append(Scene("s05",
        "And buying is easier than you think. We'll sort out your N.I.E. and your Spanish bank account, "
        "shortlist homes that really fit you, and our lawyers check everything before you sign. Then it's the "
        "notary, and your keys! It usually takes four to eight weeks, and you can even do it all remotely.",
        Background("light", bignum="04"), els, header=HDR, page=4))

    # 6 · COSTS -----------------------------------------------------------
    def tabla(x, y, w, emoji, titulo, filas, at):
        items = [("e", 32, 30, emoji, 48), ("t", 100, 34, titulo, 30, 760, COL["navy"])]
        yy = 112
        for i, (a, b) in enumerate(filas):
            if i:
                items.append(("line", 32, yy - 14, w - 32, yy - 14, COL["line"], 2))
            items.append(("t", 32, yy, a, 23, 500, COL["slate"], {"maxw": w - 230}))
            items.append(("t", w - 232, yy - 3, b, 28, 780, COL["blue"], {"maxw": 200, "align": "right"}))
            yy += 64
        return Card(x, y, w, yy + 10, items, at=at, anim="up")

    els = header("05 · Costs & taxes", "Clear costs,\n*no surprises*", False, size=76)
    els += [
        tabla(120, 440, 810, "🏠", "Resale home", [("ITP · Transfer tax", "9%"), ("Notary & Land Registry", "≈ 1.5%"),
                                                  ("Lawyer", "≈ 1%")], "taxes"),
        tabla(990, 440, 810, "🏗️", "New build", [("VAT", "10%"), ("AJD · Stamp duty", "1.4%"),
                                                ("Notary, Registry & Lawyer", "≈ 2.5%")], ("taxes", 0.4)),
        Stat(120, 830, 560, 130, "≈ {}–{}%", [12, 14], "on top of the price, all-in", style="navy",
             num_size=50, ny=18, at="12"),
        chip(720, 830, 1080, 130, "🏛️", "IBI property tax: €250–800 / year",
             sub="Far lower than a typical US or Canadian property tax bill", style="light", size=27, at="yearly"),
    ]
    S.append(Scene("s06",
        "No surprises on costs, either. Plan on roughly 12 to 14% on top of the price for taxes and fees. And "
        "your yearly property tax? Usually just 250 to 800 euros.",
        Background("light", bignum="05"), els, header=HDR, page=5))

    # 7 · VISAS & TEAM ----------------------------------------------------
    def socio(x, at, logo, txt):
        return Card(x, 690, 540, 230, [
            ("img", 30, 24, logo, 200, 90),
            ("line", 30, 134, 510, 134, COL["line"], 2),
            ("t", 30, 150, txt, 22, 600, COL["navy"], {"maxw": 480, "lh": 1.35}),
        ], style="white", at=at, anim="up")

    S.append(Scene("s07",
        "Want to live here? We'll help with your visa, like the Digital Nomad or the Non-Lucrative visa. And you'll "
        "have one team for everything: RE/MAX Inmomás for your search, Fuster and Associates for legal, and U.C.I. "
        "for your mortgage.",
        Background("dark", IMG + "explanada.jpg", kb=(1.04, 1.22), pan=((0.6, 0.4), (0.4, 0.6)), veil="full"),
        header("06 · Visas & your team", "One team for\n*everything*", True, size=86) + [
            chip(120, 470, 560, 150, "💻", "Digital Nomad Visa", sub="For remote workers · Beckham Law 24% tax",
                 style="glass", size=28, at="Digital"),
            chip(720, 470, 600, 150, "🌅", "Non-Lucrative Visa", sub="For retirees & passive income · family included",
                 style="glass", size=28, at="Non"),
            socio(120, "Inmomás", REC + "remax-inmomas.png", "Property search & negotiation · 30+ years"),
            socio(690, "Fuster", REC + "fuster.png", "Legal, NIE, visas & taxes · 25+ years"),
            socio(1260, "mortgage", REC + "uci.png", "Non-resident mortgages up to 70% LTV"),
        ], header=HDR, page=6))

    # 8 · NEXT STEP -------------------------------------------------------
    S.append(Scene("s08",
        "So, ready for your next step? Book a free, no-pressure video call with us. We'd love to help you find "
        "your place in the sun.",
        Background("dark", IMG + "sunset-walk.jpg", kb=(1.02, 1.18), pan=((0.4, 0.5), (0.6, 0.5))),
        header("07 · Your next step", "Your home in the Mediterranean\n*is waiting*", True, size=78,
               maxw=1500) + [
            Card(120, 520, 1000, 240, [
                ("tr", 40, 36, "YOUR DIRECT CONTACT", 17, 720, COL["blue"], 2.6),
                ("t", 40, 70, "José Martínez", 42, 780, COL["navy"]),
                ("t", 40, 126, "International Expansion Director", 23, 500, COL["slate"]),
                ("t", 40, 172, "+34 647 86 19 68   ·   jose.martinez@remax.es", 25, 650, COL["blue"]),
            ], style="white", contact=True, at="Book", anim="left"),
            Card(1160, 520, 640, 240, [
                ("t", 40, 44, "Book your free\nvideo call", 40, 780, WHITE, {"lh": 1.12}),
                ("t", 40, 166, "www.thespainconnection.com", 25, 650, WHITE),
            ], style="orange", at="free", anim="right"),
            Text("We'd love to help you find *your place in the sun*.", 120, 820, size=34, weight=500, color=SOFT,
                 hl=COL["orange_l"], maxw=1600, at="love"),
        ], header=HDR, page=7))

    # 9 · BRAND OUTRO -----------------------------------------------------
    S.append(Scene("s09", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Your home in the Mediterranean, with one team by your side.", 260, 660, size=34, weight=500,
             color=SOFT, maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
