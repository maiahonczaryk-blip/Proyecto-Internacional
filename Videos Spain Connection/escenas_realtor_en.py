"""Video 3 (EN) — Realtor / Agent Presentation · The Spain Connection · short, warm, dynamic cut."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Slideshow, Stat, Text, Title, chip, font,
                   header, step, tracked_len)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "en"

VOZ = "en-US-EmmaMultilingualNeural"
RATE = "+4%"
PITCH = "+0Hz"
ESTILO_MUSICA = "brokers"
VOL_MUSICA = 0.30
ARCHIVO = "Realtor_Presentation_The_Spain_Connection_EN.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Realtor Presentation"


def escenas():
    S = []

    # 1 · COVER -----------------------------------------------------------
    S.append(Scene("s01",
        "Hi! Do your clients ever ask you about buying in Spain? Now you can help them, and get paid for it. "
        "Meet The Spain Connection: you refer, we do everything in Spain, and you earn 15%.",
        Background("dark", IMG + "villa-sea.jpg", kb=(1.0, 1.2), pan=((0.6, 0.5), (0.35, 0.45))),
        [
            Pill("International alliance for agents", 120, 240, at=-0.3),
            Title("Monetize your clients\nbuying *in Spain*", 120, 320, size=96, maxw=1600, at=0.0, stagger=0.14),
            Text("Connect your buyers with our Costa Blanca ecosystem: real-time tracking and a *15% referral fee "
                 "paid directly to you*.", 120, 545, size=31, maxw=1050, color=SOFT, hl=COL["orange_l"],
                 at="help"),
            Stat(120, 745, 360, 175, "{}%", [15], "Direct agent payout on every closing", at="refer"),
            Stat(510, 745, 360, 175, "{}%", [100], "Agent-level tracking from click one", at="everything"),
            Stat(900, 745, 360, 175, "€{}", [0], "Zero fees, licenses or minimums", at="15"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at=("15", 0.4), anim="right"),
        ]))

    # 2 · THE OPPORTUNITY -------------------------------------------------
    els = header("01 · The opportunity", "Keep your client —\n*and the fee*", False, size=72, maxw=1000)
    els += [
        Text("Thousands of international buyers purchase on Spain's Mediterranean coast every year.",
             120, 410, size=28, maxw=960, color=COL["slate"], at="thousands"),
        Card(120, 530, 960, 190, [
            ("cross", 32, 34, 44, COL["red"]),
            ("t", 96, 36, "The gap today", 28, 760, COL["navy"]),
            ("t", 96, 82, "With no one on the ground in Spain, *your client can end up with an online portal — "
             "and someone else collects the fee.*", 23, 450, COL["slate"],
             {"maxw": 830, "lh": 1.42, "hl": COL["red"]}),
        ], at="Without", accent=COL["red"]),
        Card(120, 750, 960, 200, [
            ("check", 32, 34, 44, COL["green"]),
            ("t", 96, 36, "Our turnkey solution", 28, 760, WHITE),
            ("t", 96, 82, "We run *100% of the process in Spain* — and your client attribution is locked in "
             "from the very first click.", 23, 450, SOFT, {"maxw": 830, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="handle"),
        Photo(1140, 170, 660, 780, B2C + "happy_buyer_couple.png", kb=(1.0, 1.16), pan=((0.4, 0.4), (0.6, 0.5)),
              at=-0.2, tag="Costa Blanca · Alicante"),
    ]
    S.append(Scene("s02",
        "Every year, thousands of international buyers purchase on Spain's Mediterranean coast. Without someone on "
        "the ground, you can lose that client to an online portal. We handle the whole process in Spain, and "
        "your client stays yours.",
        Background("light"), els, header=HDR, page=1))

    # 3 · HOW IT WORKS ----------------------------------------------------
    eslabones = [("You share your link", "Your *personal referral link* ties every buyer to you — "
                  "directly or under an Ambassador.", "share", "You"),
                 ("We handle 100%", "Webinars, VIP tours, lawyers, mortgages and the notary in Alicante.",
                  "care", "The Spain Connection"),
                 ("You earn 15%", "*15% of the buyer-side commission*, paid directly to you — or via your "
                  "broker.", "get", "Your payout")]
    els = header("02 · How it works", "Simple for you,\n*handled by us*", True, size=84)
    for i, (t, b, k, tag) in enumerate(eslabones):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 555, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    checks = ["No Spanish license needed", "24-month client protection", "Paid within 30 business days",
              "Works under an Ambassador"]
    for i, t in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22,
                        at=("get", 0.3 + i * 0.3)))
    S.append(Scene("s03",
        "It's really simple. You share your personal referral link. We take care of everything in Spain: "
        "webinars, VIP tours, lawyers, mortgages, and the notary. And you get 15% of the buyer-side commission, "
        "paid directly to you.",
        Background("dark", B2C + "vip_tour_car.png", kb=(1.04, 1.22), veil="full"),
        els, header=HDR, page=2))

    # 4 · PLATFORM --------------------------------------------------------
    feats = [("MY CLIENTS", "Instant buyer registration", "portal"),
             ("TRACKING", "24-month client protection", "referred"),
             ("LIVE KANBAN", "Every buyer, every stage", "live"),
             ("FINANCE", "Audit your 15% payout", "notary")]
    els = header("03 · Agent portal", "Follow every step,\n*live*", True, size=80, maxw=760)
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
                        at=("first", i * 0.16), anim="up", dist=20))
        px += int(tracked_len(e.upper(), font(15, 720), 15 * 0.16) + 30) + 12
        if i < 5:
            els.append(Text("→", px - 4, 862, size=22, weight=700, color=COL["orange_l"],
                            at=("first", i * 0.16 + 0.1), anim="fade"))
            px += 24
    els.append(Slideshow(870, 200, 930, 581, [
        (REC + "dashboard.jpg", 0.0, "Your agent dashboard"),
        (REC + "referral.jpg", "referred", "Your personal referral link"),
        (REC + "pipeline.jpg", "live", "Live buyer pipeline"),
    ], kb=(1.0, 1.06), r=20, at=-0.2))
    S.append(Scene("s04",
        "And you can follow every step. Your agent portal shows each buyer you've referred, live, from the "
        "first contact all the way to the notary.",
        Background("navy"), els, header=HDR, page=3))

    # 5 · WHAT YOU EARN ---------------------------------------------------
    filas = [("Apartment in Alicante", "€350,000", "€17,500", 2625, "apartment"),
             ("Premium Costa Blanca villa", "€600,000", "€30,000", 4500, "villa"),
             ("Luxury seafront villa", "€1,200,000", "€60,000", 9000, "seafront")]
    els = header("04 · What you earn", "*15%* of the buyer-side\ncommission, direct to you", False, size=66,
                 maxw=1100)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [15], "of the 5% buyer-side commission, wired to you within 30 "
             "business days", style="navy", num_size=96, label_size=21, at="earn"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "PROPERTY TYPE", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PRICE", 16, 720, COL["gray"], 2.4),
            ("tr", 1010, 26, "COMMISSION (5%)", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "YOUR 15%", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at=("earn", 0.3), anim="fade"),
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
    els.append(chip(120, 912, 1680, 70, "check", "*Need a broker payout?* We sign a 25% agreement with your "
                    "Managing Broker instead.", style="ice", size=23, at="broker"))
    S.append(Scene("s05",
        "So, what can you earn? A three hundred fifty thousand euro apartment pays you two thousand, six hundred "
        "twenty-five euros. A six hundred thousand euro villa, four thousand five hundred. And a one point two "
        "million euro seafront villa? Nine thousand euros. And if your market requires it, we can pay through "
        "your broker instead.",
        Background("light"), els, header=HDR, page=4))

    # 6 · GET STARTED -----------------------------------------------------
    pasos = [("Create your agent account", "Sign up free at *thespainconnection.com* and pick the Agent / "
              "Realtor profile.", "Create"),
             ("Sign your agreement", "Add your details and sign your Direct Agent Agreement — or link your "
              "broker.", "sign"),
             ("Share your link", "Send your link to buyers or invite them to the next live webinar.", "share")]
    els = header("05 · Get started", "Activate your Spain\nreferral link *today*", True, size=78, maxw=1500)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "YOUR DIRECT CONNECTION TO SPAIN", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker & Managing Director · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", contact=True, at="can't", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Under 5 minutes", 34, 780, WHITE),
            ("t", 40, 86, "to start referring buyers", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at="five", anim="right"),
    ]
    S.append(Scene("s06",
        "Getting started takes less than five minutes. Create your agent account, sign your agreement, and "
        "share your link. We can't wait to welcome your clients to the Costa Blanca!",
        Background("dark", IMG + "aerial.jpg", kb=(1.02, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=5))

    # 7 · BRAND OUTRO -----------------------------------------------------
    S.append(Scene("s07", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("You refer. We handle Spain. You earn.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
