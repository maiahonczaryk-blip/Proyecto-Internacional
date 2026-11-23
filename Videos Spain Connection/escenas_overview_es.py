"""Vídeo 5 (ES) — ¿Qué es The Spain Connection? · Visión general · versión corta, cercana y dinámica."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Stat, Text, Title, chip, header, step)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "es"

VOZ = "es-ES-ElviraNeural"
RATE = "+5%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.32
ARCHIVO = "Que_es_The_Spain_Connection_ES.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "The Spain Connection"


def escenas():
    S = []

    # 1 · PORTADA ---------------------------------------------------------
    S.append(Scene("s01",
        "¡Hola, y bienvenido a The Spain Connection! Somos la división internacional de RE/MAX Inmomás, en la "
        "preciosa Costa Blanca. Nuestra misión es sencilla: conectar a compradores y profesionales inmobiliarios "
        "de Norteamérica con España, de forma fácil y segura.",
        Background("dark", B2C + "alicante_premium_hero.png", kb=(1.0, 1.2), pan=((0.5, 0.35), (0.5, 0.6))),
        [
            Pill("por RE/MAX Inmomás · Costa Blanca, España", 120, 240, at=-0.3),
            Title("Tu puente\nhacia *España*", 120, 320, size=110, maxw=1400, at=0.0, stagger=0.14),
            Text("Conectamos a compradores y profesionales inmobiliarios de Norteamérica con España — *de forma "
                 "fácil y segura*.", 120, 570, size=32, maxw=1000, color=SOFT, hl=COL["orange_l"], at="misión"),
            Stat(120, 745, 360, 175, "{}+", [30], "años de RE/MAX Inmomás en la Costa Blanca",
                 at="internacional"),
            Stat(510, 745, 360, 175, "{}", [4], "oficinas en la Costa Blanca", at="Costa"),
            Stat(900, 745, 360, 175, "{}+", [115], "agentes inmobiliarios locales", at="preciosa"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at="conectar", anim="right"),
        ]))

    # 2 · POR QUÉ ESPAÑA --------------------------------------------------
    S.append(Scene("s02",
        "¿Y por qué España? Más de 320 días de sol al año, un coste de vida entre un 40 y un 60% más bajo que en "
        "Estados Unidos o Canadá, el país más saludable del mundo, y vuelos a toda Europa. No es de extrañar que "
        "tantos norteamericanos se estén enamorando de la Costa Blanca.",
        Background("dark", IMG + "promenade.jpg", kb=(1.05, 1.22), pan=((0.5, 0.3), (0.5, 0.7))),
        header("01 · Por qué España", "Sol, ahorro y\n*una vida mejor*", True, size=86) + [
            Stat(120, 520, 400, 200, "{}+", [320], "Días de sol al año", icon="☀️", num_size=70, at="320"),
            Stat(540, 520, 400, 200, "{}–{}%", [40, 60], "Coste de vida más bajo que en EE. UU. o Canadá",
                 icon="💶", num_size=70, at="40"),
            Stat(960, 520, 400, 200, "Nº {}", [1], "País más saludable (Bloomberg)", icon="🏥", num_size=70,
                 at="saludable"),
            Stat(1380, 520, 400, 200, "{}+", [150], "Conexiones aéreas desde Alicante", icon="✈️", num_size=70,
                 at="vuelos"),
            Card(120, 790, 1200, 110, [("rect", 0, 0, 8, 110, COL["orange"], 0),
                                       ("t", 44, 28, "Pueblos seguros · playas Bandera Azul · *visados "
                                        "de residencia*", 32, 600, WHITE,
                                        {"maxw": 1120, "hl": COL["orange_l"]})],
                 style="glass", r=18, at="extrañar", anim="left"),
        ], header=HDR, page=1))

    # 3 · CÓMO FUNCIONA ---------------------------------------------------
    flujo = [("Profesionales y compradores", "Brokers, realtors, embajadores y colaboradores en Norteamérica "
              "*conectan a sus clientes*.", "profesionales", "Norteamérica"),
             ("Nuestra plataforma", "Cada referido se *sigue en tiempo real* — desde el primer clic hasta la "
              "notaría.", "plataforma", "The Spain Connection"),
             ("Nuestro equipo en España", "Webinars, visitas VIP, legal, hipotecas y cierre — *todo sobre el "
              "terreno* en Alicante.", "equipo", "Costa Blanca")]
    els = header("02 · Cómo funciona", "Un solo puente,\n*de principio a fin*", True, size=84)
    for i, (t, b, k, tag) in enumerate(flujo):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 300, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 560, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    etapas = ["Webinar", "Selección", "Visita VIP", "Oferta", "Notaría", "¡Llaves!"]
    px = 120
    for i, e in enumerate(etapas):
        els.append(Pill(e, px, 800, fill=COL["orange"] if i == 5 else (255, 255, 255, 46), size=17,
                        at=("llaves", -1.2 + i * 0.2), anim="up", dist=20))
        px += int(motor.tracked_len(e.upper(), motor.font(17, 720), 17 * 0.16) + 34) + 12
        if i < 5:
            els.append(Text("→", px - 2, 801, size=26, weight=700, color=COL["orange_l"],
                            at=("llaves", -1.1 + i * 0.2), anim="fade"))
            px += 30
    S.append(Scene("s03",
        "Así es como funciona. Los profesionales en Norteamérica conectan a sus clientes a través de nuestra "
        "plataforma, donde cada referido se sigue en tiempo real. Y nuestro equipo en España se encarga de todo "
        "sobre el terreno, desde el primer webinar, hasta la entrega de llaves.",
        Background("navy"), els, header=HDR, page=2))

    # 4 · SOCIOS ----------------------------------------------------------
    socios = [(REC + "remax-inmomas.png", "Inmobiliaria", "Encuentra, negocia y cierra la casa adecuada. Más de "
               "30 años, 4 oficinas y 115+ agentes.", "Inmomás"),
              (REC + "fuster.png", "Legal y fiscal", "Due diligence, NIE, visados, contratos y asesoría fiscal. "
               "Más de 25 años.", "Fuster"),
              (REC + "uci.png", "Hipotecas", "Hipotecas para no residentes de hasta el 70 %, con preestudio en "
               "48 horas.", "hipotecas"),
              (REC + "holidays.png", "Alquiler vacacional", "Amueblamiento, licencia turística y gestión "
               "integral del alquiler vacacional.", "Holidays")]
    els = header("03 · Nuestros socios", "Un equipo de\n*expertos de confianza*", False, size=76)
    for i, (lg, area, txt, k) in enumerate(socios):
        els.append(Card(120 + i * 425, 440, 400, 390, [
            ("img", 30, 30, lg, 340, 110),
            ("line", 30, 170, 370, 170, COL["line"], 2),
            ("tr", 30, 196, area.upper(), 17, 720, COL["blue"], 2.6),
            ("t", 30, 236, txt, 23, 480, COL["slate"], {"maxw": 340, "lh": 1.45}),
        ], at=k, accent=COL["orange"] if i == 3 else COL["blue"], accent_side="top"))
    S.append(Scene("s04",
        "Detrás de todo hay un equipo de socios de confianza. RE/MAX Inmomás encuentra y negocia la casa "
        "adecuada. Fuster y Asociados se ocupa de la parte legal, los visados y los impuestos. U.C.I. ofrece "
        "hipotecas para no residentes. E Inmomás Holidays puede amueblar y alquilar tu propiedad.",
        Background("light", bignum="03"), els, header=HDR, page=3))

    # 5 · ROLES -----------------------------------------------------------
    roles = [("Brokers", "25%", "Una división de España llave en mano para toda la oficina — los agentes "
              "refieren y la agencia cobra.", "Brokers", "🏢"),
             ("Realtors", "15%", "Refiere a tus propios clientes con tu enlace personal y cobra directamente.",
              "Realtors", "🤝"),
             ("Embajadores", "15% / 25%", "Construye una red de brokers, agentes y compradores — y gana sobre "
              "toda ella.", "embajadores", "👑"),
             ("Colaboradores", "10%", "Profesionales de reubicación, legales o fiscales que refieren clientes "
              "a España.", "colaboradores", "🧭")]
    els = header("04 · Un rol para cada uno", "¿Quién puede unirse\n*a la red*?", False, size=76)
    for i, (t, fee, b, k, e) in enumerate(roles):
        dark = i == 2
        els.append(Card(120 + i * 425, 440, 400, 400, [
            ("e", 30, 30, e, 56),
            ("t", 30, 110, t, 32, 780, WHITE if dark else COL["navy"]),
            ("t", 30, 160, fee, 46, 800, COL["orange"] if dark else COL["blue"]),
            ("line", 30, 232, 370, 232, (255, 255, 255, 60) if dark else COL["line"], 2),
            ("t", 30, 254, b, 22, 480, SOFT if dark else COL["slate"], {"maxw": 340, "lh": 1.45}),
        ], style="navy" if dark else "light", at=k, anim="up"))
    els.append(chip(120, 875, 1680, 80, "check", "*Sin licencia española, sin cuotas, sin mínimos* — cada "
                    "cierre se paga por transferencia internacional en 30 días hábiles.", style="ice", size=23,
                    at=("referido", 0.3)))
    S.append(Scene("s05",
        "Y hay un rol para cada uno. Los brokers obtienen una división de España llave en mano y ganan un 25%. "
        "Los realtors refieren a sus propios clientes y ganan un 15%. Los embajadores construyen toda una red, y "
        "ganan sobre ella. Y los colaboradores, como asesores de reubicación o fiscales, ganan un 10% por cada "
        "referido.",
        Background("light", bignum="04"), els, header=HDR, page=4))

    # 6 · PARA COMPRADORES ------------------------------------------------
    S.append(Scene("s06",
        "¿Y para los compradores? Un equipo cercano, desde la primera videollamada hasta las llaves. Más de 150 "
        "promociones de obra nueva verificadas, un proceso claro de cuatro a ocho semanas, y la opción de "
        "comprar cien por cien a distancia.",
        Background("dark", B2C + "key_handover_villa.png", kb=(1.04, 1.2), pan=((0.6, 0.5), (0.4, 0.5))),
        header("05 · Para compradores", "De la primera llamada\n*a tus llaves*", True, size=86) + [
            Stat(120, 520, 400, 200, "{}+", [150], "Promociones de obra nueva verificadas", icon="🏡",
                 num_size=70, at="150"),
            Stat(540, 520, 400, 200, "{}–{}", [4, 8], "Semanas · proceso de compra completo", icon="🗓️",
                 num_size=70, at="cuatro"),
            Stat(960, 520, 400, 200, "{}%", [100], "Compra a distancia posible", icon="💻", num_size=70,
                 count=0.9, at="opción"),
            chip(120, 780, 1240, 110, "🛡️", "*Un único interlocutor* — inmueble, legal, hipoteca y "
                 "posventa.", style="glass", size=27, at="cercano"),
        ], header=HDR, page=5))

    # 7 · CONECTA ---------------------------------------------------------
    S.append(Scene("s07",
        "Así que, tanto si vas a comprar una casa como si ayudas a otros a comprarla, nos encantará darte la "
        "bienvenida. Visita thespainconnection.com, ¡y conecta con España!",
        Background("dark", IMG + "sunset-walk.jpg", kb=(1.02, 1.18), pan=((0.4, 0.5), (0.6, 0.5))),
        header("06 · Conectemos", "Tu conexión con España\n*empieza aquí*", True, size=80, maxw=1500) + [
            chip(120, 480, 820, 130, "🏡", "¿Vas a comprar una casa?", sub="Reserva una videollamada gratuita y "
                 "sin compromiso.", style="glass", size=30, at="comprar"),
            chip(980, 480, 820, 130, "💼", "¿Eres profesional inmobiliario?",
                 sub="Regístrate gratis y elige tu perfil: Broker, Realtor o Embajador.", style="glass",
                 size=30, at="ayudas"),
            Card(120, 660, 1000, 240, [
                ("tr", 40, 36, "TU CONTACTO DIRECTO", 17, 720, COL["blue"], 2.6),
                ("t", 40, 70, "José Martínez", 42, 780, COL["navy"]),
                ("t", 40, 126, "Broker y Director General · RE/MAX Inmomás", 23, 500, COL["slate"]),
                ("t", 40, 172, "+34 647 86 19 68   ·   jose.martinez@remax.es", 25, 650, COL["blue"]),
            ], style="white", contact=True, at="bienvenida", anim="left"),
            Card(1160, 660, 640, 240, [
                ("t", 40, 44, "Conecta\ncon España", 40, 780, WHITE, {"lh": 1.12}),
                ("t", 40, 166, "www.thespainconnection.com", 25, 650, WHITE),
            ], style="orange", at="Visita", anim="right"),
        ], header=HDR, page=6))

    # 8 · CIERRE DE MARCA -------------------------------------------------
    S.append(Scene("s08", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Tu puente hacia España — para compradores y profesionales inmobiliarios.", 260, 660, size=34,
             weight=500, color=SOFT, maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
