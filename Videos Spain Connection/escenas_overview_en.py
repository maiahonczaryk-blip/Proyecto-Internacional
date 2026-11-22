"""Video 5 (EN) — What is The Spain Connection? · General overview · short, warm, dynamic cut."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Stat, Text, Title, chip, header, step)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "en"

VOZ = "en-US-AvaMultilingualNeural"
RATE = "+4%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.32
ARCHIVO = "What_is_The_Spain_Connection_EN.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "The Spain Connection"


def escenas():
    S = []

    # 1 · COVER -----------------------------------------------------------
    S.append(Scene("s01",
        "Hi, and welcome to The Spain Connection! We're the international division of RE/MAX Inmomás, on Spain's "
        "beautiful Costa Blanca. Our mission is simple: to connect North American buyers and real estate "
        "professionals with Spain, easily and safely.",
        Background("dark", B2C + "alicante_premium_hero.png", kb=(1.0, 1.2), pan=((0.5, 0.35), (0.5, 0.6))),
        [
            Pill("by RE/MAX Inmomás · Costa Blanca, Spain", 120, 240, at=-0.3),
            Title("Your bridge\nto *Spain*", 120, 320, size=110, maxw=1400, at=0.0, stagger=0.14),
            Text("Connecting North American buyers and real estate professionals with Spain — *easily and "
                 "safely*.", 120, 570, size=32, maxw=1000, color=SOFT, hl=COL["orange_l"], at="mission"),
            Stat(120, 745, 360, 175, "{}+", [30], "years of RE/MAX Inmomás on the Costa Blanca",
                 at="international"),
            Stat(510, 745, 360, 175, "{}", [4], "offices across the Costa Blanca", at="Costa"),
            Stat(900, 745, 360, 175, "{}+", [115], "local real estate agents", at="beautiful"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at="connect", anim="right"),
        ]))

    # 2 · WHY SPAIN -------------------------------------------------------
    S.append(Scene("s02",
        "So, why Spain? Over 320 sunny days a year, a cost of living 40 to 60% lower than in the US or Canada, "
        "the healthiest country in the world, and flights all over Europe. No wonder so many North Americans are "
        "falling in love with the Costa Blanca.",
        Background("dark", IMG + "promenade.jpg", kb=(1.05, 1.22), pan=((0.5, 0.3), (0.5, 0.7))),
        header("01 · Why Spain", "Sun, savings and\n*a better life*", True, size=86) + [
            Stat(120, 520, 400, 200, "{}+", [320], "Sunny days a year", icon="☀️", num_size=70, at="320"),
            Stat(540, 520, 400, 200, "{}–{}%", [40, 60], "Lower cost of living than the US or Canada", icon="💶",
                 num_size=70, at="40"),
            Stat(960, 520, 400, 200, "Nº {}", [1], "Healthiest country (Bloomberg)", icon="🏥", num_size=70,
                 at="healthiest"),
            Stat(1380, 520, 400, 200, "{}+", [150], "Flight connections from Alicante", icon="✈️", num_size=70,
                 at="flights"),
            Card(120, 790, 1200, 110, [("rect", 0, 0, 8, 110, COL["orange"], 0),
                                       ("t", 44, 28, "Safe, walkable towns · Blue Flag beaches · clear "
                                        "*residency visas*", 32, 600, WHITE,
                                        {"maxw": 1120, "hl": COL["orange_l"]})],
                 style="glass", r=18, at="wonder", anim="left"),
        ], header=HDR, page=1))

    # 3 · HOW IT WORKS ----------------------------------------------------
    flujo = [("Professionals & buyers", "Brokers, realtors, ambassadors and collaborators in North America "
              "*connect their clients*.", "Professionals", "North America"),
             ("Our platform", "Every referral is *tracked in real time* — from the very first click to the "
              "notary.", "platform", "The Spain Connection"),
             ("Our team in Spain", "Webinars, VIP tours, legal, mortgages and closing — *all on the ground* in "
              "Alicante.", "team", "Costa Blanca")]
    els = header("02 · How it works", "One bridge,\n*end to end*", True, size=84)
    for i, (t, b, k, tag) in enumerate(flujo):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 300, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 560, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    etapas = ["Webinar", "Shortlist", "VIP visit", "Offer", "Notary", "Keys!"]
    px = 120
    for i, e in enumerate(etapas):
        els.append(Pill(e, px, 800, fill=COL["orange"] if i == 5 else (255, 255, 255, 46), size=17,
                        at=("keys", -1.2 + i * 0.2), anim="up", dist=20))
        px += int(motor.tracked_len(e.upper(), motor.font(17, 720), 17 * 0.16) + 34) + 12
        if i < 5:
            els.append(Text("→", px - 2, 801, size=26, weight=700, color=COL["orange_l"],
                            at=("keys", -1.1 + i * 0.2), anim="fade"))
            px += 30
    S.append(Scene("s03",
        "Here's how it works. Professionals in North America connect their clients through our platform, where "
        "every referral is tracked in real time. And our team in Spain takes care of everything on the ground, "
        "from the first webinar, all the way to the keys.",
        Background("navy"), els, header=HDR, page=2))

    # 4 · PARTNERS --------------------------------------------------------
    socios = [(REC + "remax-inmomas.png", "Real estate", "Finds, negotiates and closes the right home. 30+ "
               "years, 4 offices, 115+ agents.", "Inmomás"),
              (REC + "fuster.png", "Legal & tax", "Due diligence, NIE, visas, contracts and tax advice. 25+ "
               "years.", "Fuster"),
              (REC + "uci.png", "Mortgages", "Non-resident mortgages up to 70% LTV, with a 48-hour "
               "pre-check.", "mortgages"),
              (REC + "holidays.png", "Holiday rentals", "Furnishing, tourist license and full vacation rental "
               "management.", "Holidays")]
    els = header("03 · Our partners", "One team of\n*trusted experts*", False, size=76)
    for i, (lg, area, txt, k) in enumerate(socios):
        els.append(Card(120 + i * 425, 440, 400, 390, [
            ("img", 30, 30, lg, 340, 110),
            ("line", 30, 170, 370, 170, COL["line"], 2),
            ("tr", 30, 196, area.upper(), 17, 720, COL["blue"], 2.6),
            ("t", 30, 236, txt, 23, 480, COL["slate"], {"maxw": 340, "lh": 1.45}),
        ], at=k, accent=COL["orange"] if i == 3 else COL["blue"], accent_side="top"))
    S.append(Scene("s04",
        "Behind it all is a team of trusted partners. RE/MAX Inmomás finds and negotiates the right home. Fuster "
        "and Associates takes care of legal, visas, and taxes. U.C.I. provides mortgages for non-residents. And "
        "Inmomás Holidays can furnish and rent out your property.",
        Background("light", bignum="03"), els, header=HDR, page=3))

    # 5 · ROLES -----------------------------------------------------------
    roles = [("Brokers", "25%", "A turnkey Spain division for the whole office — agents refer, the brokerage "
              "earns.", "Brokers", "🏢"),
             ("Realtors", "15%", "Refer your own clients with a personal link and get paid directly.", "Realtors",
              "🤝"),
             ("Ambassadors", "15% / 25%", "Build a network of brokers, agents and buyers — and earn across "
              "it.", "Ambassadors", "👑"),
             ("Collaborators", "10%", "Relocation, legal or tax pros who refer clients to Spain.", "collaborators",
              "🧭")]
    els = header("04 · A role for everyone", "Who can join\n*the network*?", False, size=76)
    for i, (t, fee, b, k, e) in enumerate(roles):
        dark = i == 2
        els.append(Card(120 + i * 425, 440, 400, 400, [
            ("e", 30, 30, e, 56),
            ("t", 30, 110, t, 32, 780, WHITE if dark else COL["navy"]),
            ("t", 30, 160, fee, 46, 800, COL["orange"] if dark else COL["blue"]),
            ("line", 30, 232, 370, 232, (255, 255, 255, 60) if dark else COL["line"], 2),
            ("t", 30, 254, b, 22, 480, SOFT if dark else COL["slate"], {"maxw": 340, "lh": 1.45}),
        ], style="navy" if dark else "light", at=k, anim="up"))
    els.append(chip(120, 875, 1680, 80, "check", "*No Spanish license, no fees, no minimums* — every closing "
                    "is paid by international wire within 30 business days.", style="ice", size=23,
                    at=("referral", 0.3)))
    S.append(Scene("s05",
        "And there's a role for everyone. Brokers get a turnkey Spain division and earn 25%. Realtors refer their "
        "own clients and earn 15%. Ambassadors build a whole network, and earn across it. And collaborators, "
        "like relocation or tax advisors, earn 10% on every referral.",
        Background("light", bignum="04"), els, header=HDR, page=4))

    # 6 · FOR BUYERS ------------------------------------------------------
    S.append(Scene("s06",
        "And for buyers? One friendly team, from the first video call to the keys. Over 150 verified new "
        "developments, a clear process of four to eight weeks, and the option to buy 100% remotely.",
        Background("dark", B2C + "key_handover_villa.png", kb=(1.04, 1.2), pan=((0.6, 0.5), (0.4, 0.5))),
        header("05 · For buyers", "From the first call\n*to your keys*", True, size=86) + [
            Stat(120, 520, 400, 200, "{}+", [150], "Verified new developments", icon="🏡", num_size=70,
                 at="150"),
            Stat(540, 520, 400, 200, "{}–{}", [4, 8], "Weeks · full buying process", icon="🗓️", num_size=70,
                 at="four"),
            Stat(960, 520, 400, 200, "{}%", [100], "Remote purchase possible", icon="💻", num_size=70, count=0.9,
                 at="option"),
            chip(120, 780, 1240, 110, "🛡️", "*One single point of contact* — property, legal, mortgage and "
                 "after-sales.", style="glass", size=27, at="friendly"),
        ], header=HDR, page=5))

    # 7 · CONNECT ---------------------------------------------------------
    S.append(Scene("s07",
        "So whether you're buying a home, or helping others buy one, we'd love to welcome you. Visit "
        "thespainconnection.com, and let's connect you with Spain!",
        Background("dark", IMG + "sunset-walk.jpg", kb=(1.02, 1.18), pan=((0.4, 0.5), (0.6, 0.5))),
        header("06 · Let's connect", "Your connection to Spain\n*starts here*", True, size=80, maxw=1500) + [
            chip(120, 480, 820, 130, "🏡", "Buying a home?", sub="Book a free, no-pressure video call.",
                 style="glass", size=30, at="buying"),
            chip(980, 480, 820, 130, "💼", "A real estate professional?",
                 sub="Register free and pick your profile: Broker, Realtor or Ambassador.", style="glass",
                 size=30, at="helping"),
            Card(120, 660, 1000, 240, [
                ("tr", 40, 36, "YOUR DIRECT CONTACT", 17, 720, COL["blue"], 2.6),
                ("t", 40, 70, "José Martínez", 42, 780, COL["navy"]),
                ("t", 40, 126, "Broker & Managing Director · RE/MAX Inmomás", 23, 500, COL["slate"]),
                ("t", 40, 172, "+34 647 86 19 68   ·   jose.martinez@remax.es", 25, 650, COL["blue"]),
            ], style="white", contact=True, at="welcome", anim="left"),
            Card(1160, 660, 640, 240, [
                ("t", 40, 44, "Let's connect you\nwith Spain", 40, 780, WHITE, {"lh": 1.12}),
                ("t", 40, 166, "www.thespainconnection.com", 25, 650, WHITE),
            ], style="orange", at="Visit", anim="right"),
        ], header=HDR, page=6))

    # 8 · BRAND OUTRO -----------------------------------------------------
    S.append(Scene("s08", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Your bridge to Spain — for buyers and real estate professionals.", 260, 660, size=34, weight=500,
             color=SOFT, maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
