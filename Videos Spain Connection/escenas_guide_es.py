"""Vídeo 1 (ES) — Guía del Comprador · The Spain Connection · versión corta, cercana y dinámica."""
import motor
from motor import (COL, Background, Card, Group, Line, Logo, Pill, Scene, Slideshow, Stat, Text, Title, chip, header,
                   step)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "es"

VOZ = "es-ES-ElviraNeural"
RATE = "+5%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.32
ARCHIVO = "Guia_del_Comprador_The_Spain_Connection_ES.mp4"

IMG = "images/guia/"
PROP = "images/guia/propiedades/"
REC = "Presentación Spain Connection/_recursos/img/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Guía del Comprador · 2026"


def escenas():
    S = []

    # 1 · PORTADA ---------------------------------------------------------
    S.append(Scene("s01",
        "¡Hola! ¿Estás pensando en tener una casa en España? Vamos a ponértelo fácil. Esta es tu guía rápida "
        "para comprar en la Costa Blanca, con un equipo cercano a tu lado, en cada paso.",
        Background("dark", IMG + "portada.jpg", kb=(1.0, 1.2), pan=((0.3, 0.5), (0.7, 0.45))),
        [
            Pill("Guía del Comprador · 2026", 120, 250, at=-0.3),
            Title("Tu casa en España,\n*paso a paso*", 120, 330, size=106, maxw=1400, at=0.0, stagger=0.14),
        ]))
    S[-1].els += [
        Text("Todo lo que necesitas para comprar con seguridad en la Costa Blanca — con un equipo a tu lado.",
             120, 590, size=32, maxw=940, color=SOFT, at="fácil"),
        Stat(120, 770, 340, 150, "{}+", [320], "días de sol al año", at="Costa"),
        Stat(490, 770, 340, 150, "{}–{}", [4, 8], "semanas · proceso completo", at="cercano"),
        Stat(860, 770, 340, 150, "{}%", [100], "compra a distancia posible", at="lado"),
        Card(1290, 790, 510, 110, [("img", 30, 18, REC + "remax-inmomas.png", 140, 74),
                                   ("img", 195, 12, REC + "fuster.png", 120, 86),
                                   ("img", 350, 20, REC + "uci.png", 130, 70)],
             style="white", r=20, at="paso", anim="right"),
    ]

    # 2 · ESTILO DE VIDA --------------------------------------------------
    S.append(Scene("s02",
        "Primero, el estilo de vida. Más de 320 días de sol al año, preciosas playas con Bandera Azul, una "
        "gastronomía increíble y una sanidad de primer nivel. Y tu casa, a solo un vuelo.",
        Background("dark", IMG + "beach.jpg", kb=(1.05, 1.22), pan=((0.5, 0.3), (0.5, 0.7))),
        header("01 · Estilo de vida", "Sol, mar y\n*una vida mejor*", True, size=86) + [
            Stat(120, 520, 400, 200, "{}+", [320], "Días de sol al año", icon="☀️", num_size=70, at="320"),
            Stat(540, 520, 400, 200, "{} km", [200], "de playas con Bandera Azul", icon="🏖️", num_size=70,
                 at="playas"),
            Stat(960, 520, 400, 200, "Nº {}", [1], "País más saludable (Bloomberg)", icon="🏥", num_size=70,
                 at="sanidad"),
            Stat(1380, 520, 400, 200, "{}+", [150], "Conexiones aéreas desde ALC", icon="✈️", num_size=70,
                 at="vuelo"),
            Card(120, 790, 1200, 110, [("rect", 0, 0, 8, 110, COL["orange"], 0),
                                       ("t", 44, 28, "«Aquí, el estilo de vida mediterráneo no es un lujo: "
                                        "*es lo cotidiano*.»", 32, 600, WHITE,
                                        {"maxw": 1120, "hl": COL["orange_l"]})],
                 style="glass", r=18, at=("casa", -0.3), anim="left"),
        ], header=HDR, page=1))

    # 3 · COSTE DE VIDA ---------------------------------------------------
    S.append(Scene("s03",
        "Y aún mejor: aquí tu dinero rinde mucho más. El día a día cuesta entre un 40 y un 60% menos que en "
        "Estados Unidos o Canadá. Piensa en una cena para dos desde 35 euros, y una bonita casa de tres "
        "dormitorios desde unos 250.000.",
        Background("dark", IMG + "terrace.jpg", kb=(1.04, 1.22), pan=((0.7, 0.5), (0.4, 0.5))),
        header("02 · Coste de vida", "Tu dinero rinde\n*mucho más*", True, size=86) + [
            Stat(120, 470, 760, 230, "{}–{}%", [40, 60], "coste de vida más bajo que en EE. UU. o Canadá",
                 num_size=118, label_size=28, at="40", count=1.4),
            Stat(120, 750, 400, 170, "{}–{} €", [35, 60], "Cena gourmet para dos", icon="🍽️", num_size=50,
                 at="cena"),
            Stat(550, 750, 400, 170, "{}–{} €", [80, 150], "Seguro médico privado / mes", icon="🩺",
                 num_size=50, at=("cena", 0.7)),
            Stat(980, 750, 400, 170, "{}.000 €", [250], "Casa de 3 dormitorios, desde", icon="🏡", num_size=50,
                 at="tres"),
        ], header=HDR, page=2))

    # 4 · OBRA NUEVA ------------------------------------------------------
    props = [("Portamarina Arena", "Guardamar del Segura", "320.000 €", "Guardamar"),
             ("Towers III Poniente", "Benidorm · Playa de Poniente", "385.000 €", "Benidorm"),
             ("Sierra Cortina Sky", "Finestrat · vistas 180°", "600.000 €", "Finestrat"),
             ("Residencial Homes II", "Algorfa · Golf Resort", "650.000 €", "Algorfa")]
    els = header("03 · Obra nueva", "Obra nueva\n*llave en mano*", False, size=80, maxw=780)
    els += [
        Text("*Más de 150 promociones verificadas* por RE/MAX Inmomás y Fuster & Asociados — al precio oficial "
             "del promotor.", 120, 425, size=26, maxw=780, color=COL["slate"], hl=COL["navy"],
             at="verificadas"),
        chip(120, 555, 370, 84, "🛡️", "100% con aval bancario", at="aval", size=23),
        chip(510, 555, 390, 84, "🏗️", "Garantía de 10 años", at=("aval", 0.4), size=23),
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
        "¿Te encanta la obra nueva? Tendrás acceso a más de 150 promociones verificadas, al precio oficial del "
        "promotor y con aval bancario. Desde apartamentos junto a la playa en Guardamar y Benidorm, hasta "
        "espectaculares áticos en Finestrat y villas de golf en Algorfa.",
        Background("light"), els, header=HDR, page=3))

    # 5 · PROCESO DE COMPRA -----------------------------------------------
    pasos = [("Obtén tu\nNIE", "2–4 semanas", "N.I.E."), ("Cuenta bancaria\nespañola", "1–2 días", "bancaria"),
             ("Tu selección\npersonal", "1–2 semanas", "seleccionamos"),
             ("Due diligence\nlegal", "1 semana", "abogados"), ("Firma ante\nnotario", "1 día", "notaría"),
             ("¡Recoge tus\nllaves!", "El mismo día", "llaves")]
    els = header("04 · Proceso de compra", "Más fácil de\n*lo que crees*", False, size=76)
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
        Stat(120, 790, 640, 150, "{}–{} semanas", [4, 8], "Plazo habitual de principio a fin", style="navy",
             num_size=52, at="cuatro"),
        chip(800, 790, 1000, 150, "check", "*100% posible a distancia*",
             sub="Con poder notarial — sin necesidad de viajar a España.", style="light", size=30,
             at="distancia"),
    ]
    S.append(Scene("s05",
        "Y comprar es más fácil de lo que crees. Gestionamos tu N.I.E. y tu cuenta bancaria española, "
        "seleccionamos casas que de verdad encajan contigo, y nuestros abogados lo revisan todo antes de que "
        "firmes. Después, la notaría, ¡y tus llaves! Suele llevar de cuatro a ocho semanas, e incluso puedes "
        "hacerlo todo a distancia.",
        Background("light", bignum="04"), els, header=HDR, page=4))

    # 6 · COSTES ----------------------------------------------------------
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

    els = header("05 · Costes e impuestos", "Costes claros,\n*sin sorpresas*", False, size=76)
    els += [
        tabla(120, 440, 810, "🏠", "Segunda mano", [("ITP · Transmisiones", "9%"),
                                                    ("Notaría y Registro", "≈ 1,5%"), ("Abogado", "≈ 1%")],
              "impuestos"),
        tabla(990, 440, 810, "🏗️", "Obra nueva", [("IVA", "10%"), ("AJD · Actos jurídicos", "1,4%"),
                                                 ("Notaría, Registro y Abogado", "≈ 2,5%")], ("impuestos", 0.4)),
        Stat(120, 830, 560, 130, "≈ {}–{}%", [12, 14], "sobre el precio, todo incluido", style="navy",
             num_size=50, ny=18, at="12"),
        chip(720, 830, 1080, 130, "🏛️", "IBI: 250–800 € / año",
             sub="Muy por debajo del impuesto típico en EE. UU. o Canadá", style="light", size=27, at="anual"),
    ]
    S.append(Scene("s06",
        "Tampoco hay sorpresas con los costes. Calcula aproximadamente un 12 a 14% sobre el precio en "
        "impuestos y gastos. ¿Y el impuesto anual sobre la vivienda? Normalmente, solo de 250 a 800 euros.",
        Background("light", bignum="05"), els, header=HDR, page=5))

    # 7 · VISADOS Y EQUIPO ------------------------------------------------
    def socio(x, at, logo, txt):
        return Card(x, 690, 540, 230, [
            ("img", 30, 24, logo, 200, 90),
            ("line", 30, 134, 510, 134, COL["line"], 2),
            ("t", 30, 150, txt, 22, 600, COL["navy"], {"maxw": 480, "lh": 1.35}),
        ], style="white", at=at, anim="up")

    S.append(Scene("s07",
        "¿Quieres vivir aquí? Te ayudamos con tu visado, como el de Nómada Digital o el de Residencia No "
        "Lucrativa. Y tendrás un solo equipo para todo: RE/MAX Inmomás para tu búsqueda, Fuster y Asociados "
        "para lo legal, y U.C.I. para tu hipoteca.",
        Background("dark", IMG + "explanada.jpg", kb=(1.04, 1.22), pan=((0.6, 0.4), (0.4, 0.6)), veil="full"),
        header("06 · Visados y tu equipo", "Un solo equipo\n*para todo*", True, size=86) + [
            chip(120, 470, 560, 150, "💻", "Visado de Nómada Digital",
                 sub="Para teletrabajadores · Ley Beckham 24 %", style="glass", size=28, at="Nómada"),
            chip(720, 470, 600, 150, "🌅", "Visado No Lucrativo",
                 sub="Para jubilados y rentas pasivas · familia incluida", style="glass", size=28, at="Lucrativa"),
            socio(120, "Inmomás", REC + "remax-inmomas.png", "Búsqueda y negociación del inmueble · 30+ años"),
            socio(690, "Fuster", REC + "fuster.png", "Legal, NIE, visados e impuestos · 25+ años"),
            socio(1260, "hipoteca", REC + "uci.png", "Hipotecas para no residentes de hasta el 70 %"),
        ], header=HDR, page=6))

    # 8 · SIGUIENTE PASO --------------------------------------------------
    S.append(Scene("s08",
        "¿Listo para dar el siguiente paso? Reserva con nosotros una videollamada gratuita y sin compromiso. Nos "
        "encantará ayudarte a encontrar tu lugar al sol.",
        Background("dark", IMG + "sunset-walk.jpg", kb=(1.02, 1.18), pan=((0.4, 0.5), (0.6, 0.5))),
        header("07 · Tu siguiente paso", "Tu casa en el Mediterráneo\n*te espera*", True, size=78,
               maxw=1500) + [
            Card(120, 520, 1000, 240, [
                ("tr", 40, 36, "TU CONTACTO DIRECTO", 17, 720, COL["blue"], 2.6),
                ("t", 40, 70, "José Martínez", 42, 780, COL["navy"]),
                ("t", 40, 126, "Director de Expansión Internacional", 23, 500, COL["slate"]),
                ("t", 40, 172, "+34 647 86 19 68   ·   jose.martinez@remax.es", 25, 650, COL["blue"]),
            ], style="white", contact=True, at="Reserva", anim="left"),
            Card(1160, 520, 640, 240, [
                ("t", 40, 44, "Reserva tu\nvideollamada gratis", 40, 780, WHITE, {"lh": 1.12}),
                ("t", 40, 166, "www.thespainconnection.com", 25, 650, WHITE),
            ], style="orange", at="gratuita", anim="right"),
            Text("Nos encantará ayudarte a encontrar *tu lugar al sol*.", 120, 820, size=34, weight=500,
                 color=SOFT, hl=COL["orange_l"], maxw=1600, at="encantará"),
        ], header=HDR, page=7))

    # 9 · CIERRE DE MARCA -------------------------------------------------
    S.append(Scene("s09", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Tu casa en el Mediterráneo, con un solo equipo a tu lado.", 260, 660, size=34, weight=500,
             color=SOFT, maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
