"""Video 2 (EN) — Broker Presentation · The Spain Connection · short, warm, dynamic cut."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Slideshow, Stat, Text, Title, chip, font,
                   header, step, tracked_len)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "en"

VOZ = "en-US-AndrewMultilingualNeural"
RATE = "+5%"
PITCH = "+0Hz"
ESTILO_MUSICA = "brokers"
VOL_MUSICA = 0.30
ARCHIVO = "Broker_Presentation_The_Spain_Connection_EN.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Broker Presentation"


def escenas():
    S = []

    # 1 · COVER -----------------------------------------------------------
    S.append(Scene("s01",
        "Hi! If your clients dream about Spain, this one's for you. Meet The Spain Connection: your turnkey "
        "international division in Spain. No fees, no overhead, and no risk.",
        Background("dark", REC + "portada.jpg", kb=(1.0, 1.2), pan=((0.6, 0.5), (0.35, 0.45))),
        [
            Pill("International brokerage alliance", 120, 240, at=-0.3),
            Title("Your Turnkey International\nDivision *in Spain*", 120, 320, size=92, maxw=1600, at=0.0,
                  stagger=0.14),
            Text("Connect your agents with our Costa Blanca ecosystem: real-time tracking and *25% of the "
                 "buyer-side commission* paid to your brokerage.", 120, 545, size=31, maxw=1050, color=SOFT,
                 hl=COL["orange_l"], at="dream"),
            Stat(120, 745, 360, 175, "{}%", [25], "Buyer-side commission for your office", at="turnkey"),
            Stat(510, 745, 360, 175, "{}%", [100], "Real-time brokerage & agent tracking", at="division"),
            Stat(900, 745, 360, 175, "€{}", [0], "Zero fees, licensing or fixed costs", at="fees"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at="risk", anim="right"),
        ]))

    # 2 · THE OPPORTUNITY -------------------------------------------------
    els = header("01 · The opportunity", "Capture the deal —\ndon't *lose* it", False, size=72, maxw=1000)
    els += [
        Text("Thousands of North American buyers purchase on Spain's Mediterranean coast every year.",
             120, 410, size=28, maxw=960, color=COL["slate"], at="thousands"),
        Card(120, 530, 960, 190, [
            ("cross", 32, 34, 44, COL["red"]),
            ("t", 96, 36, "The problem today", 28, 760, COL["navy"]),
            ("t", 96, 82, "Most offices have no one on the ground in Spain. *The client goes it alone — and "
             "another office gets paid.*", 23, 450, COL["slate"], {"maxw": 830, "lh": 1.42, "hl": COL["red"]}),
        ], at="But", accent=COL["red"]),
        Card(120, 750, 960, 200, [
            ("check", 32, 34, 44, COL["green"]),
            ("t", 96, 36, "Our turnkey solution", 28, 760, WHITE),
            ("t", 96, 82, "We become *your office's Spain department* — you protect your client base and keep "
             "your agents loyal.", 23, 450, SOFT, {"maxw": 830, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="department"),
        Photo(1140, 170, 660, 780, REC + "oportunidad.jpg", kb=(1.0, 1.16), pan=((0.5, 0.3), (0.5, 0.6)),
              at=-0.2, tag="Costa Blanca · Alicante"),
    ]
    S.append(Scene("s02",
        "Every year, thousands of North American buyers purchase on Spain's Mediterranean coast. But when a "
        "client asks about Spain, most offices have no one on the ground, so the deal just walks out the door. "
        "We become your office's Spain department, and you keep the client.",
        Background("light"), els, header=HDR, page=1))

    # 3 · THE MODEL -------------------------------------------------------
    eslabones = [("Your agents refer", "Each agent gets a *unique tracking link* under your brokerage, from "
                  "click one.", "refer", "Your agents"),
                 ("We handle 100%", "Webinars, VIP trips, lawyers, mortgages and the notary in Alicante.",
                  "handle", "The Spain Connection"),
                 ("You earn 25%", "Your brokerage earns *25% of the buyer-side commission* to share with "
                  "your agent.", "earns", "Your brokerage")]
    els = header("02 · The model", "Three simple\n*steps*", True, size=84)
    for i, (t, b, k, tag) in enumerate(eslabones):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 555, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    checks = ["No Spanish license needed", "24-month client protection", "Paid within 30 business days",
              "Zero fees or minimums"]
    for i, t in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22,
                        at=("earns", 0.2 + i * 0.3)))
    S.append(Scene("s03",
        "It works in three simple steps. Your agents refer clients with a unique tracking link. We handle "
        "everything in Spain: webinars, VIP trips, lawyers, mortgages, and the notary. And your brokerage earns "
        "25% of the buyer-side commission.",
        Background("dark", B2C + "advisory_team_meeting.png", kb=(1.04, 1.22), veil="full"),
        els, header=HDR, page=2))

    # 4 · PLATFORM --------------------------------------------------------
    feats = [("MY TEAM", "Track every agent", "agent"), ("TRACKING", "Personal referral links", "referral"),
             ("LIVE KANBAN", "6-stage buyer pipeline", "buyer"), ("COMPLIANCE", "Documents & payouts", "closing")]
    els = header("03 · Platform", "Full control,\n*in real time*", True, size=80, maxw=760)
    for i, (tag, t, k) in enumerate(feats):
        els.append(Card(120, 440 + i * 108, 680, 92, [
            ("sq", 22, 18, i + 1, 56, COL["orange"] if i == 3 else COL["blue_l"], WHITE),
            ("tr", 100, 18, tag, 16, 720, COL["orange_l"], 2.6),
            ("t", 100, 42, t, 26, 700, WHITE),
        ], style="glass", r=18, at=k, anim="left"))
    etapas = ["Contacted", "Options", "VIP Visit", "Offer", "Notary", "Closed"]
    px = 860
    for i, e in enumerate(etapas):
        els.append(Pill(e, px, 860, fill=COL["orange"] if i == 5 else (255, 255, 255, 46), size=15,
                        at=("six", i * 0.16), anim="up", dist=20))
        px += int(tracked_len(e.upper(), font(15, 720), 15 * 0.16) + 30) + 12
        if i < 5:
            els.append(Text("→", px - 4, 862, size=22, weight=700, color=COL["orange_l"],
                            at=("six", i * 0.16 + 0.1), anim="fade"))
            px += 24
    els.append(Slideshow(870, 200, 930, 581, [
        (REC + "dashboard.jpg", 0.0, "Broker executive dashboard"),
        (REC + "referral.jpg", "referral", "Trackable referral links"),
        (REC + "pipeline.jpg", "six", "6-stage Kanban pipeline"),
    ], kb=(1.0, 1.06), r=20, at=-0.2))
    S.append(Scene("s04",
        "And you stay in full control. Your broker portal tracks every agent, every referral, and every buyer "
        "through a six-stage pipeline, from the first click all the way to closing.",
        Background("navy"), els, header=HDR, page=3))

    # 5 · WEBINARS & VIP TRIP ---------------------------------------------
    els = header("04 · Conversion engine", "Client webinars &\n*VIP trips*", False, size=72, maxw=1000)
    els += [
        Photo(120, 410, 330, 540, REC + "webinar_call.jpg", kb=(1.0, 1.12), at="webinars"),
        Card(470, 410, 520, 540, [
            ("tr", 34, 34, "“SPAIN UNLOCKED”", 17, 720, COL["blue"], 2.6),
            ("t", 34, 70, "Live webinars", 32, 780, COL["navy"]),
            ("check", 34, 150, 30, COL["blue"]), ("t", 80, 148, "360° panel: advisors, lawyers and mortgage "
                                                  "specialists.", 22, 480, COL["slate"], {"maxw": 400, "lh": 1.4}),
            ("check", 34, 260, 30, COL["blue"]), ("t", 80, 258, "Every sign-up is *100% tracked* to your agent "
                                                  "and brokerage.", 22, 480, COL["slate"],
                                                  {"maxw": 400, "lh": 1.4, "hl": COL["blue"]}),
            ("check", 34, 370, 30, COL["blue"]), ("t", 80, 368, "Qualified buyers: visas, taxes and financing "
                                                  "answered.", 22, 480, COL["slate"], {"maxw": 400, "lh": 1.4}),
        ], at=("webinars", 0.3), accent=COL["blue"], accent_side="top"),
        Photo(1030, 410, 330, 540, REC + "viaje.jpg", kb=(1.0, 1.12), at="Alicante"),
        Card(1380, 410, 420, 540, [
            ("tr", 34, 34, "4–5 DAYS IN ALICANTE", 17, 720, COL["orange_l"], 2.6),
            ("t", 34, 70, "VIP inspection\ntrip", 32, 780, WHITE, {"lh": 1.15}),
            ("check", 34, 190, 30, COL["orange"]), ("t", 80, 188, "Private tour of hand-picked properties.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
            ("check", 34, 300, 30, COL["orange"]), ("t", 80, 298, "Meetings with Fuster & Associates and UCI.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
            ("check", 34, 410, 30, COL["orange"]), ("t", 80, 408, "Every visit and offer, live in your portal.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
        ], style="navy", at="VIP"),
    ]
    S.append(Scene("s05",
        "Your agents don't need to be experts, either. Our live Spain Unlocked webinars educate and qualify your "
        "buyers. And when they're ready, we welcome them in Alicante on a VIP inspection trip.",
        Background("light"), els, header=HDR, page=4))

    # 6 · THE NUMBERS -----------------------------------------------------
    filas = [("Apartment in Alicante", "€350,000", "€17,500", 4375, "apartment"),
             ("Premium Costa Blanca villa", "€600,000", "€30,000", 7500, "villa"),
             ("Luxury seafront villa", "€1,200,000", "€60,000", 15000, "seafront")]
    els = header("05 · The numbers", "*25%* of the buyer-side\ncommission for you", False, size=66, maxw=1050)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [25], "of the 5% buyer-side commission, wired to your brokerage at "
             "closing", style="navy", num_size=96, label_size=21, at="numbers"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "PROPERTY TYPE", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PRICE", 16, 720, COL["gray"], 2.4),
            ("tr", 1010, 26, "COMMISSION (5%)", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "25% FOR YOU", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at=("numbers", 0.3), anim="fade"),
    ]
    for i, (n, p, c, v, k) in enumerate(filas):
        y = 545 + i * 120
        els.append(Card(120, y, 1680, 100, [
            ("e", 30, 26, ["🏢", "🏡", "🌊"][i], 46),
            ("t", 96, 30, n, 28, 700, COL["navy"]),
            ("t", 720, 32, p, 26, 600, COL["slate"]),
            ("t", 1010, 32, c, 26, 600, COL["slate"]),
        ], at=k, anim="left"))
        els.append(Stat(1480, y + 12, 300, 76, "€{}", [v], "", style="blue", num_size=38, num_color=WHITE,
                        nx=28, ny=14, at=(k, 0.5), r=16, anim="scale"))
    els.append(chip(120, 912, 1680, 70, "check", "*You decide the split* — keep it, share it, or pass it all to "
                    "your agent.", style="ice", size=23, at="split"))
    S.append(Scene("s06",
        "Now, the numbers. A three hundred fifty thousand euro apartment earns your brokerage four thousand, "
        "three hundred seventy-five euros. A six hundred thousand euro villa, seven thousand five hundred. And a "
        "one point two million euro seafront villa? Fifteen thousand euros. And you decide how to split it with "
        "your agent.",
        Background("light"), els, header=HDR, page=5))

    # 7 · GET STARTED -----------------------------------------------------
    pasos = [("Create your broker account", "Sign up free at *thespainconnection.com* and pick the Broker "
              "profile.", "Create"),
             ("Sign the Master Agreement", "Upload your tax and bank details and sign the B2B agreement.", "sign"),
             ("Connect your team", "Share your link with your agents and invite clients to the next webinar.",
              "connect")]
    els = header("06 · Get started", "Launch your Spain division\n*today*", True, size=78, maxw=1500)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "YOUR DIRECT LINK TO THE SPAIN CONNECTION", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker & Managing Director · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", contact=True, at="can't", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Under 5 minutes", 34, 780, WHITE),
            ("t", 40, 86, "to activate your whole office", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at="five", anim="right"),
    ]
    S.append(Scene("s07",
        "Getting started takes less than five minutes. Create your broker account, sign the agreement, and "
        "connect your team. We can't wait to welcome you to the Costa Blanca!",
        Background("dark", IMG + "aerial.jpg", kb=(1.02, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=6))

    # 8 · BRAND OUTRO -----------------------------------------------------
    S.append(Scene("s08", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Your turnkey international division in Spain.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
