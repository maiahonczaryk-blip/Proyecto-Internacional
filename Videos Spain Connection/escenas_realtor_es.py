"""Vídeo 3 (ES) — Presentación para Realtors / Agentes · The Spain Connection · versión corta, cercana y dinámica."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Slideshow, Stat, Text, Title, chip, font,
                   header, step, tracked_len)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "es"

VOZ = "es-ES-XimenaNeural"
RATE = "+5%"
PITCH = "+0Hz"
ESTILO_MUSICA = "brokers"
VOL_MUSICA = 0.30
ARCHIVO = "Presentacion_Realtors_The_Spain_Connection_ES.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Presentación para Realtors"


def escenas():
    S = []

    # 1 · PORTADA ---------------------------------------------------------
    S.append(Scene("s01",
        "¡Hola! ¿Tus clientes te preguntan alguna vez por comprar en España? Ahora puedes ayudarles, y cobrar "
        "por ello. Te presentamos The Spain Connection: tú refieres, nosotros lo hacemos todo en España, y tú "
        "ganas un 15%.",
        Background("dark", IMG + "villa-sea.jpg", kb=(1.0, 1.2), pan=((0.6, 0.5), (0.35, 0.45))),
        [
            Pill("Alianza internacional para agentes", 120, 240, at=-0.3),
            Title("Rentabiliza a tus clientes\nque compran *en España*", 120, 320, size=92, maxw=1650, at=0.0,
                  stagger=0.14),
            Text("Conecta a tus compradores con nuestro ecosistema en la Costa Blanca: seguimiento en tiempo real "
                 "y *un 15 % de honorarios, directo para ti*.", 120, 545, size=31, maxw=1050, color=SOFT,
                 hl=COL["orange_l"], at="ayudarles"),
            Stat(120, 745, 360, 175, "{}%", [15], "Pago directo al agente en cada cierre", at="refieres"),
            Stat(510, 745, 360, 175, "{}%", [100], "Seguimiento por agente desde el primer clic", at="todo"),
            Stat(900, 745, 360, 175, "{} €", [0], "Cero cuotas, licencias o mínimos", at="15"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at=("15", 0.4), anim="right"),
        ]))

    # 2 · LA OPORTUNIDAD --------------------------------------------------
    els = header("01 · La oportunidad", "Conserva a tu cliente —\n*y los honorarios*", False, size=72, maxw=1000)
    els += [
        Text("Miles de compradores internacionales compran cada año en la costa mediterránea española.",
             120, 410, size=28, maxw=960, color=COL["slate"], at="miles"),
        Card(120, 530, 960, 190, [
            ("cross", 32, 34, 44, COL["red"]),
            ("t", 96, 36, "El problema hoy", 28, 760, COL["navy"]),
            ("t", 96, 82, "Sin nadie sobre el terreno en España, *tu cliente puede acabar en un portal online — "
             "y los honorarios se los lleva otro.*", 23, 450, COL["slate"],
             {"maxw": 830, "lh": 1.42, "hl": COL["red"]}),
        ], at="Sin", accent=COL["red"]),
        Card(120, 750, 960, 200, [
            ("check", 32, 34, 44, COL["green"]),
            ("t", 96, 36, "Nuestra solución llave en mano", 28, 760, WHITE),
            ("t", 96, 82, "Gestionamos *el 100 % del proceso en España* — y la atribución de tu cliente queda "
             "asegurada desde el primer clic.", 23, 450, SOFT, {"maxw": 830, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="gestionamos"),
        Photo(1140, 170, 660, 780, B2C + "happy_buyer_couple.png", kb=(1.0, 1.16), pan=((0.4, 0.4), (0.6, 0.5)),
              at=-0.2, tag="Costa Blanca · Alicante"),
    ]
    S.append(Scene("s02",
        "Cada año, miles de compradores internacionales compran en la costa mediterránea española. Sin nadie "
        "sobre el terreno, puedes perder a ese cliente frente a un portal online. Nosotros gestionamos todo el "
        "proceso en España, y tu cliente sigue siendo tuyo.",
        Background("light"), els, header=HDR, page=1))

    # 3 · CÓMO FUNCIONA ---------------------------------------------------
    eslabones = [("Compartes tu enlace", "Tu *enlace de referido personal* vincula cada comprador contigo — "
                  "directamente o bajo un Embajador.", "compartes", "Tú"),
                 ("Gestionamos el 100%", "Webinars, visitas VIP, abogados, hipotecas y notaría en Alicante.",
                  "ocupamos", "The Spain Connection"),
                 ("Ganas el 15%", "*El 15 % de la comisión de compra*, pagado directamente a ti — o a través de "
                  "tu broker.", "recibes", "Tu cobro")]
    els = header("02 · Cómo funciona", "Sencillo para ti,\n*gestionado por nosotros*", True, size=84,
                 maxw=1500)
    for i, (t, b, k, tag) in enumerate(eslabones):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 555, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    checks = ["Sin licencia española", "Protección del cliente 24 meses", "Cobro en 30 días hábiles",
              "Compatible con un Embajador"]
    for i, t in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22,
                        at=("recibes", 0.3 + i * 0.3)))
    S.append(Scene("s03",
        "Es muy sencillo. Compartes tu enlace de referido personal. Nosotros nos ocupamos de todo en España: "
        "webinars, visitas VIP, abogados, hipotecas y notaría. Y tú recibes el 15% de la comisión de compra, "
        "pagado directamente a ti.",
        Background("dark", B2C + "vip_tour_car.png", kb=(1.04, 1.22), veil="full"),
        els, header=HDR, page=2))

    # 4 · PLATAFORMA ------------------------------------------------------
    feats = [("MIS CLIENTES", "Registro de compradores al instante", "portal"),
             ("SEGUIMIENTO", "Protección del cliente 24 meses", "referido"),
             ("KANBAN EN VIVO", "Cada comprador, cada etapa", "directo"),
             ("FINANZAS", "Audita tu 15 % de honorarios", "notaría")]
    els = header("03 · Portal del agente", "Sigue cada paso,\n*en directo*", True, size=80, maxw=760)
    for i, (tag, t, k) in enumerate(feats):
        els.append(Card(120, 440 + i * 108, 680, 92, [
            ("sq", 22, 18, i + 1, 56, COL["orange"] if i == 3 else COL["blue_l"], WHITE),
            ("tr", 100, 18, tag, 16, 720, COL["orange_l"], 2.6),
            ("t", 100, 42, t, 26, 700, WHITE),
        ], style="glass", r=18, at=k, anim="left"))
    etapas = ["Contactado", "Opciones", "Visita VIP", "Oferta", "Notaría", "Cerrado"]
    px = 860
    for i, e in enumerate(etapas):
        els.append(Pill(e, px, 860, fill=COL["orange"] if i == 5 else (255, 255, 255, 46), size=15,
                        at=("primer", i * 0.16), anim="up", dist=20))
        px += int(tracked_len(e.upper(), font(15, 720), 15 * 0.16) + 30) + 12
        if i < 5:
            els.append(Text("→", px - 4, 862, size=22, weight=700, color=COL["orange_l"],
                            at=("primer", i * 0.16 + 0.1), anim="fade"))
            px += 24
    els.append(Slideshow(870, 200, 930, 581, [
        (REC + "dashboard.jpg", 0.0, "Tu panel de agente"),
        (REC + "referral.jpg", "referido", "Tu enlace de referido personal"),
        (REC + "pipeline.jpg", "directo", "Embudo de compradores en directo"),
    ], kb=(1.0, 1.06), r=20, at=-0.2))
    S.append(Scene("s04",
        "Y puedes seguir cada paso. Tu portal de agente muestra cada comprador que has referido, en directo, "
        "desde el primer contacto hasta la notaría.",
        Background("navy"), els, header=HDR, page=3))

    # 5 · LO QUE GANAS ----------------------------------------------------
    filas = [("Apartamento en Alicante", "350.000 €", "17.500 €", 2625, "apartamento"),
             ("Villa premium Costa Blanca", "600.000 €", "30.000 €", 4500, "villa"),
             ("Villa de lujo frente al mar", "1.200.000 €", "60.000 €", 9000, "mar")]
    els = header("04 · Lo que ganas", "*El 15 %* de la comisión\nde compra, directo a ti", False, size=66,
                 maxw=1100)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [15], "de la comisión de compra del 5 %, transferido a ti en 30 días "
             "hábiles", style="navy", num_size=96, label_size=21, at="ganar"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "TIPO DE INMUEBLE", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PRECIO", 16, 720, COL["gray"], 2.4),
            ("tr", 1010, 26, "COMISIÓN (5 %)", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "TU 15 %", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at=("ganar", 0.3), anim="fade"),
    ]
    for i, (n, p, c, v, k) in enumerate(filas):
        y = 545 + i * 120
        els.append(Card(120, y, 1680, 100, [
            ("e", 30, 26, ["🏢", "🏡", "🌊"][i], 46),
            ("t", 96, 30, n, 28, 700, COL["navy"]),
            ("t", 720, 32, p, 26, 600, COL["slate"]),
            ("t", 1010, 32, c, 26, 600, COL["slate"]),
        ], at=k, anim="left"))
        els.append(Stat(1480, y + 12, 300, 76, "{} €", [v], "", style="blue", num_size=38, num_color=WHITE,
                        nx=28, ny=14, at=(k, 0.5), r=16, anim="scale"))
    els.append(chip(120, 912, 1680, 70, "check", "*¿Necesitas cobrar vía tu broker?* Firmamos un acuerdo del "
                    "25 % con tu Managing Broker.", style="ice", size=23, at="broker"))
    S.append(Scene("s05",
        "¿Y cuánto puedes ganar? Un apartamento de trescientos cincuenta mil euros te paga dos mil seiscientos "
        "veinticinco euros. Una villa de seiscientos mil euros, cuatro mil quinientos. ¿Y una villa frente al mar "
        "de un millón doscientos mil euros? Nueve mil euros. Y si tu mercado lo exige, podemos pagar a través de "
        "tu broker.",
        Background("light"), els, header=HDR, page=4))

    # 6 · EMPIEZA ---------------------------------------------------------
    pasos = [("Crea tu cuenta de agente", "Regístrate gratis en *thespainconnection.com* y elige el perfil "
              "Agente / Realtor.", "Crea"),
             ("Firma tu acuerdo", "Añade tus datos y firma tu Acuerdo de Agente Directo — o vincula a tu "
              "broker.", "firma"),
             ("Comparte tu enlace", "Envía tu enlace a compradores o invítales al próximo webinar en directo.",
              "comparte")]
    els = header("05 · Empieza ya", "Activa hoy tu enlace\nde referidos *a España*", True, size=78, maxw=1500)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "TU CONEXIÓN DIRECTA CON ESPAÑA", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker y Director General · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", contact=True, at="ganas", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Menos de 5 minutos", 34, 780, WHITE),
            ("t", 40, 86, "para empezar a referir compradores", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at="cinco", anim="right"),
    ]
    S.append(Scene("s06",
        "Empezar lleva menos de cinco minutos. Crea tu cuenta de agente, firma tu acuerdo y comparte tu enlace. "
        "¡Tenemos muchas ganas de dar la bienvenida a tus clientes en la Costa Blanca!",
        Background("dark", IMG + "aerial.jpg", kb=(1.02, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=5))

    # 7 · CIERRE DE MARCA -------------------------------------------------
    S.append(Scene("s07", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Tú refieres. Nosotros gestionamos España. Tú ganas.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
