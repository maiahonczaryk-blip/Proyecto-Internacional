"""Video 4 (EN) — International Ambassador Presentation · The Spain Connection · short, warm, dynamic cut."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Slideshow, Stat, Text, Title, chip, header,
                   step)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "en"

VOZ = "en-US-BrianMultilingualNeural"
RATE = "+4%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.30
ARCHIVO = "Ambassador_Presentation_The_Spain_Connection_EN.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Ambassador Program"


def escenas():
    S = []

    # 1 · COVER -----------------------------------------------------------
    S.append(Scene("s01",
        "Hi! Do you know brokers, realtors or investors who love Spain? Then this is for you. Become a Spain "
        "Connection International Ambassador, and build your own real estate network with Spain.",
        Background("dark", IMG + "cover-sunset.jpg", kb=(1.0, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        [
            Pill("Executive Ambassador Program", 120, 240, at=-0.3),
            Title("Build your own\ninternational *network*", 120, 320, size=96, maxw=1600, at=0.0, stagger=0.14),
            Text("Grow your umbrella of brokers, realtors, collaborators and buyers — and earn *15% across your "
                 "network, or 25% on direct buyers*.", 120, 545, size=31, maxw=1080, color=SOFT,
                 hl=COL["orange_l"], at="love"),
            Stat(120, 745, 360, 175, "{}% / {}%", [15, 25], "Network fee · direct-buyer fee", at="Ambassador"),
            Stat(510, 745, 360, 175, "{}", [4], "Channels: brokers, agents, collaborators & buyers",
                 at="build"),
            Stat(900, 745, 360, 175, "{}%", [100], "Multi-tier umbrella tracking", at="network"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at=("network", 0.5), anim="right"),
        ]))

    # 2 · THE ROLE --------------------------------------------------------
    els = header("01 · The role", "A connector,\n*not an agent*", False, size=76, maxw=1000)
    els += [
        Text("An executive growth partner who opens doors in their home market — and earns on every closing in "
             "their network.", 120, 410, size=28, maxw=960, color=COL["slate"], at="connector"),
        Card(120, 540, 960, 190, [
            ("e", 32, 32, "🤝", 48),
            ("t", 100, 36, "You open the doors", 28, 760, COL["navy"]),
            ("t", 100, 82, "Introduce the alliance to *brokerages, realtor teams, collaborators and investors* "
             "with our turnkey decks.", 23, 450, COL["slate"], {"maxw": 820, "lh": 1.42, "hl": COL["blue"]}),
        ], at="doors", accent=COL["blue"]),
        Card(120, 760, 960, 190, [
            ("e", 32, 32, "☀️", 48),
            ("t", 100, 36, "We do everything in Spain", 28, 760, WHITE),
            ("t", 100, 82, "Webinars, VIP tours, legal, mortgages and closing — *handled by our team in "
             "Alicante*.", 23, 450, SOFT, {"maxw": 820, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="Alicante"),
        Photo(1140, 170, 660, 780, REC + "espana.jpg", kb=(1.0, 1.14), pan=((0.5, 0.3), (0.5, 0.6)),
              at=-0.2, tag="Alicante · Costa Blanca"),
    ]
    S.append(Scene("s02",
        "As an Ambassador, you're a connector, not an agent. You open doors in your market, and our team in "
        "Alicante handles everything else: webinars, VIP tours, legal, mortgages, and closing.",
        Background("light"), els, header=HDR, page=1))

    # 3 · GROWTH CHANNELS -------------------------------------------------
    canales = [("Brokerages · 25%", "Onboard whole offices. Their agents and linked collaborators are *tracked "
                "in your umbrella*.", "brokerages", "Channel 1"),
               ("Agents 15% · Collabs 10%", "Connect direct-contract realtors and relocation, legal or tax "
                "collaborators.", "realtors", "Channel 2"),
               ("Direct buyers · 25%", "Refer a buyer yourself and *you earn the full 25%* instead of 15%.",
                "directly", "Channel 3")]
    els = header("02 · Your umbrella", "Three ways to\n*grow your network*", True, size=82)
    for i, (t, b, k, tag) in enumerate(canales):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=29, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
    checks = ["No Spanish license needed", "Partners keep 100% of their fee", "Automatic multi-tier tracking",
              "Zero fees or quotas"]
    for i, t in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22,
                        at=("collaborators", 0.4 + i * 0.35)))
    S.append(Scene("s03",
        "You can grow your umbrella in three ways. Onboard whole brokerages, who earn 25%. Connect realtors at "
        "15%, and collaborators at 10%. Or refer a buyer directly, and you earn the full 25% yourself.",
        Background("dark", B2C + "advisory_team_meeting.png", kb=(1.04, 1.22), veil="full"),
        els, header=HDR, page=2))

    # 4 · YOUR INCOME -----------------------------------------------------
    filas = [("Launch phase", "Direct contacts + first partners", "3 / year", 9000, "Three#2"),
             ("Growing umbrella", "3–4 active brokerages", "8 / year", 24000, ("Three#2", 1.2)),
             ("Established regional network", "Brokers, agents & buyers", "15 / year", 45000, "Fifteen")]
    els = header("03 · Your income", "Build it once,\n*earn on every closing*", False, size=68, maxw=1100)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [15], "net on every closing in your network — partners keep 100% of "
             "their fee", style="navy", num_size=96, label_size=21, at="net"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "NETWORK STAGE", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PROFILE", 16, 720, COL["gray"], 2.4),
            ("tr", 1110, 26, "CLOSINGS", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "YOUR NET 15%", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at="average", anim="fade"),
    ]
    for i, (n, p, c, v, k) in enumerate(filas):
        y = 545 + i * 120
        els.append(Card(120, y, 1680, 100, [
            ("e", 30, 26, ["🌱", "📈", "👑"][i], 46),
            ("t", 96, 30, n, 28, 700, COL["navy"]),
            ("t", 720, 33, p, 23, 500, COL["slate"]),
            ("t", 1110, 32, c, 26, 600, COL["slate"]),
        ], at=k, anim="left"))
        els.append(Stat(1480, y + 12, 300, 76, "€{}", [v], "", style="blue", num_size=38, num_color=WHITE,
                        nx=28, ny=14, at=(k[0], k[1] + 0.5) if isinstance(k, tuple) else (k, 0.5), r=16,
                        anim="scale"))
    els.append(chip(120, 912, 1680, 70, "check", "*€400,000 average sale → €3,000 net per closing*, wired within "
                    "30 business days of the notary.", style="ice", size=23, at="per"))
    S.append(Scene("s04",
        "And here's the best part. You earn 15% net on every closing in your network, and your partners never "
        "lose a cent of theirs. With an average sale of four hundred thousand euros, that's three thousand euros "
        "per closing. Three closings a year is nine thousand. Fifteen closings? Forty-five thousand euros.",
        Background("light"), els, header=HDR, page=3))

    # 5 · PORTAL & WEBINARS -----------------------------------------------
    feats = [("MASTER LINK", "Links for every partner type", "partner"),
             ("MULTI-TIER", "Every buyer traced to you", "buyer"),
             ("FINANCE", "Pipeline, fees & Excel export", "fee"),
             ("WEBINARS", "B2B & buyer webinars, VIP trips", "webinar")]
    els = header("04 · Executive portal", "See your whole\nnetwork, *live*", True, size=80, maxw=760)
    for i, (tag, t, k) in enumerate(feats):
        els.append(Card(120, 440 + i * 108, 680, 92, [
            ("sq", 22, 18, i + 1, 56, COL["orange"] if i == 3 else COL["blue_l"], WHITE),
            ("tr", 100, 18, tag, 16, 720, COL["orange_l"], 2.6),
            ("t", 100, 42, t, 26, 700, WHITE),
        ], style="glass", r=18, at=k, anim="left"))
    els += [
        Pill("“Beyond Borders” · B2B webinars", 870, 860, fill=(255, 255, 255, 46), size=15, at="professionals",
             anim="up", dist=20),
        Pill("“Spain Unlocked” · buyer webinars", 1300, 860, fill=COL["orange"], size=15, at="buyer#2", anim="up",
             dist=20),
        Slideshow(870, 200, 930, 581, [
            (REC + "dashboard.jpg", 0.0, "Executive dashboard"),
            (REC + "pipeline.jpg", "fee", "Live pipeline & fees"),
            (REC + "webinar_call.jpg", "webinar", "Live webinars"),
        ], kb=(1.0, 1.06), r=20, at=-0.2),
    ]
    S.append(Scene("s05",
        "You'll see everything in your executive portal: every partner, every buyer, and every fee, live. And we "
        "power it all with two live webinar series, one for professionals and one for buyers, plus VIP trips to "
        "Alicante.",
        Background("navy"), els, header=HDR, page=4))

    # 6 · GET STARTED -----------------------------------------------------
    pasos = [("Activate your profile", "Visit *thespainconnection.com* and our leadership team enables your "
              "account.", "Activate"),
             ("Sign your agreement", "Add your tax and wire details to formalize your 15% B2B agreement.", "sign"),
             ("Share your 4 links", "Present the alliance to brokers, realtors and partners — and plug into our "
              "webinars.", "sharing")]
    els = header("05 · Get started", "Become an Ambassador\n*today*", True, size=80, maxw=1500)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "INTERNATIONAL EXPANSION LEADERSHIP", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker & Managing Director · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", contact=True, at="leadership", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Lead the way", 34, 780, WHITE),
            ("t", 40, 86, "with full support from Alicante", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at="support", anim="right"),
    ]
    S.append(Scene("s06",
        "Ready to lead? Activate your profile, sign your agreement, and start sharing your links. Our leadership "
        "team in Alicante is here to support you every step of the way.",
        Background("dark", IMG + "castle.jpg", kb=(1.02, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=5))

    # 7 · BRAND OUTRO -----------------------------------------------------
    S.append(Scene("s07", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Build your network once. Earn on every closing.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
