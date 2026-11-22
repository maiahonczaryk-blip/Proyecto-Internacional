"""Vídeo 1 — Guía del Comprador (The Spain Connection) · guion y escenas."""
from motor import (COL, Background, Card, Group, Line, Logo, Pill, Scene, Slideshow, Stat, Text, Title, chip,
                   feature, header, step)

VOZ = "es-ES-ElviraNeural"
RATE = "+7%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.30
ARCHIVO = "Guia_del_Comprador_The_Spain_Connection.mp4"

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
        "Comprar tu casa en España nunca fue tan sencillo. Bienvenido a la Guía del Comprador de The Spain "
        "Connection: todo lo que necesitas para comprar con seguridad en la Costa Blanca, con un único equipo "
        "a tu lado.",
        Background("dark", IMG + "portada.jpg", kb=(1.0, 1.18), pan=((0.3, 0.5), (0.7, 0.45))),
        [
            Pill("Guía del comprador · 2026", 120, 250, at=-0.3),
            Title("Tu casa en España,\n*paso a paso*", 120, 330, size=106, maxw=1300, at=0.0, stagger=0.16),
            Text("Todo lo que necesitas para comprar con seguridad en la Costa Blanca — con un único equipo a "
                 "tu lado.", 120, 590, size=32, maxw=920, color=SOFT, at="Guía"),
            Stat(120, 770, 340, 150, "{}+", [320], "días de sol al año", at="seguridad"),
            Stat(490, 770, 340, 150, "{}–{}", [4, 8], "semanas · proceso completo", at="Costa"),
            Stat(860, 770, 340, 150, "{}%", [100], "compra remota posible", at="único"),
            Card(1290, 790, 510, 110, [("img", 30, 18, REC + "remax-inmomas.png", 140, 74),
                                       ("img", 195, 12, REC + "fuster.png", 120, 86),
                                       ("img", 350, 20, REC + "uci.png", 130, 70)],
                 style="white", r=20, at="equipo", anim="right"),
        ]))

    # 2 · ESTILO DE VIDA --------------------------------------------------
    S.append(Scene("s02",
        "La Organización Mundial de la Salud reconoce a la Costa Blanca como una de las regiones con el clima "
        "más saludable del planeta. Más de 320 días de sol al año, 18 grados de media y 218 kilómetros de "
        "costa. Aquí, el estilo de vida mediterráneo no es un lujo: es lo cotidiano.",
        Background("dark", IMG + "beach.jpg", kb=(1.05, 1.2), pan=((0.5, 0.3), (0.5, 0.7))),
        header("01 · Estilo de vida", "El clima más\n*saludable* del planeta", True, size=86) + [
            Text("Reconocido por la Organización Mundial de la Salud (OMS).", 120, 445, size=30, color=SOFT,
                 at="Salud"),
            Stat(120, 540, 380, 200, "{}+", [320], "Días de sol al año", icon="☀️", num_size=72, at="320"),
            Stat(530, 540, 380, 200, "{} ºC", [18], "Temperatura media anual", icon="🌡️", num_size=72, at="18"),
            Stat(940, 540, 380, 200, "{} km", [218], "Línea de costa", icon="🏖️", num_size=72, at="218"),
            Card(120, 790, 1200, 120, [("rect", 0, 0, 8, 120, COL["orange"], 0),
                                       ("t", 44, 30, "«Aquí, el estilo de vida mediterráneo no es un lujo: "
                                        "*es lo cotidiano*.»", 34, 600, WHITE,
                                        {"maxw": 1120, "hl": COL["orange_l"]})],
                 style="glass", r=18, at="estilo", anim="left"),
        ], header=HDR, page=1))

    # 3 · ¿POR QUÉ ALICANTE? ---------------------------------------------
    feats = [
        ("🏖️", "Playas Bandera Azul", "Más de 200 km de costa: San Juan, Postiguet, La Granadella.", "Playas"),
        ("🍷", "Gastronomía mediterránea", "Estrellas Michelin, marisco del día y vinos D.O. Alicante.",
         "gastronomía"),
        ("⛳", "Golf y deportes", "Más de 7 campos de campeonato a menos de 30 minutos.", "golf"),
        ("🏥", "Sanidad de primer nivel", "España, *Nº 1 país más saludable* del mundo (Bloomberg).",
         "saludable"),
        ("✈️", "Aeropuerto Alicante-Elche", "Más de *150 conexiones* directas con Europa.", "vuelo"),
        ("🚄", "AVE a Madrid en 2 h", "Conexión rápida con los vuelos directos a EE. UU. y Canadá.", "AVE"),
    ]
    els = header("02 · ¿Por qué Alicante?", "Tu nuevo hogar,\na *un vuelo* de casa", False, size=72)
    for i, (e, t, b, k) in enumerate(feats):
        els.append(feature(120 + (i % 3) * 570, 445 + (i // 3) * 215, 540, 185, e, t, b, at=k))
    S.append(Scene("s03",
        "¿Por qué Alicante? Playas con Bandera Azul, gastronomía con estrellas Michelin y campos de golf a "
        "menos de treinta minutos. España es el país más saludable del mundo según Bloomberg, con una sanidad "
        "de primer nivel a una fracción del coste de Estados Unidos. Y siempre estarás a un vuelo de casa: "
        "más de 150 conexiones desde el aeropuerto de Alicante-Elche, y el AVE a Madrid en dos horas.",
        Background("light", bignum="02"), els, header=HDR, page=2))

    # 4 · COSTE DE VIDA ---------------------------------------------------
    S.append(Scene("s04",
        "Y tu dinero rinde mucho más. Vivir en la Costa Blanca cuesta entre un 40 y un 60% menos que en "
        "Estados Unidos o Canadá. Una cena gourmet para dos, de 35 a 60 euros. Un seguro médico privado "
        "completo, desde 80 euros al mes. Y una casa de tres habitaciones de calidad, desde 250.000 euros.",
        Background("dark", IMG + "terrace.jpg", kb=(1.04, 1.2), pan=((0.7, 0.5), (0.4, 0.5))),
        header("03 · Coste de vida", "Tu dinero rinde\n*mucho más*", True, size=86) + [
            Stat(120, 470, 760, 230, "{}–{}%", [40, 60], "menos coste de vida que en EE. UU. o Canadá",
                 num_size=118, label_size=28, at="40", count=1.6),
            Stat(120, 750, 400, 170, "{}–{} €", [35, 60], "Cena gourmet para dos", icon="🍽️", num_size=50,
                 at="cena"),
            Stat(550, 750, 400, 170, "{}–{} €", [80, 150], "Seguro médico privado / mes", icon="🩺",
                 num_size=50, at="seguro"),
            Stat(980, 750, 400, 170, "{}K €", [250], "Casa de 3 habitaciones, desde", icon="🏡", num_size=50,
                 at="casa"),
        ], header=HDR, page=3))

    # 5 · OBRA NUEVA ------------------------------------------------------
    props = [("Portamarina Arena", "Guardamar del Segura", "320.000 €", "Guardamar"),
             ("Towers III Poniente", "Benidorm · Playa Poniente", "385.000 €", "Benidorm"),
             ("Sierra Cortina Sky", "Finestrat · Ático 180°", "600.000 €", "Finestrat"),
             ("Residencial Homes II", "Algorfa · Golf Resort", "650.000 €", "golf")]
    els = header("04 · Obra nueva", "Obra nueva\n*llave en mano*", False, size=76, maxw=780)
    els += [
        Text("Más de *150 promociones verificadas* por RE/MAX Inmomás y auditadas por Fuster & Associates, "
             "al precio oficial del promotor.", 120, 425, size=26, maxw=780, color=COL["slate"],
             hl=COL["navy"], at="promociones"),
        chip(120, 555, 370, 84, "🛡️", "100% aval bancario", at="aval", size=23),
        chip(510, 555, 390, 84, "🏗️", "10 años de garantía", at="garantía", size=23),
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
        (PROP + "palmanova-1.jpg", "villas", "Villa Palma Nova · San Fulgencio"),
        (PROP + "homes2-1.jpg", "golf", "Residencial Homes II · Algorfa"),
    ], kb=(1.02, 1.18), at=-0.2))
    S.append(Scene("s05",
        "¿Buscas obra nueva? Te damos acceso a más de 150 promociones verificadas por Remax Inmomás y "
        "auditadas por Fuster and Associates, al mismo precio oficial del promotor, con aval bancario y diez "
        "años de garantía estructural. Desde apartamentos junto al mar en Guardamar o Benidorm, por 320.000 "
        "euros, hasta áticos con vistas panorámicas en Finestrat y villas con piscina privada en campo de golf.",
        Background("light"), els, header=HDR, page=4))

    # 6 · PROCESO DE COMPRA -----------------------------------------------
    pasos = [("Obtención\ndel NIE", "2–4 semanas", "NIE"), ("Cuenta\nbancaria", "1–2 días", "cuenta"),
             ("Estrategia\nde búsqueda", "1–2 semanas", "estrategia"),
             ("Selección de\npropiedades", "1–2 semanas", "selección"),
             ("Due diligence\nlegal", "1 semana", "due"), ("Contrato de\narras (10%)", "1 día", "arras"),
             ("Escritura\nnotarial", "1 día", "escritura"), ("Entrega\nde llaves", "Mismo día", "llaves")]
    els = header("05 · Proceso de compra", "El proceso de compra,\n*paso a paso*", False, size=72)
    x0, x1, ly = 220, 1700, 530
    sp = (x1 - x0) / 7
    els.append(Line(x0, ly, x1, ly, color=COL["line"], width=6, at=-0.2, dur=0.9))
    for i, (t, d, k) in enumerate(pasos):
        cx = x0 + i * sp
        last = i == len(pasos) - 1
        if i > 0:
            els.append(Line(cx - sp + 34, ly, cx - 34, ly, color=COL["blue"], width=6, at=(k, -0.45), dur=0.45))
        els.append(Group(int(cx - 110), ly - 34, 220, 230, [
            ("badge", 76, 0, i + 1, 68, COL["orange"] if last else COL["blue"], WHITE),
            ("t", 0, 92, t, 23, 720, COL["navy"], {"maxw": 220, "align": "center", "lh": 1.18}),
            ("t", 0, 160, d, 19, 600, COL["orange"] if last else COL["blue"],
             {"maxw": 220, "align": "center"}),
        ], at=k, anim="scale", dur=0.6))
    els += [
        Stat(120, 790, 640, 150, "{}–{} semanas", [4, 8], "Proceso completo estimado", style="navy",
             num_size=52, at="cuatro"),
        chip(800, 790, 1000, 150, "check", "*100% posible en remoto*",
             sub="Con poder notarial, sin necesidad de viajar a España.", style="light", size=30, at="remoto"),
    ]
    S.append(Scene("s06",
        "El proceso de compra es claro y ordenado. Primero, gestionamos tu NIE y abrimos tu cuenta bancaria "
        "española. Después definimos tu estrategia de búsqueda y te presentamos una selección de propiedades a "
        "tu medida. Nuestros abogados realizan la due diligence legal completa antes de firmar el contrato de "
        "arras, con un depósito del 10%. Y finalmente, la escritura ante notario y la entrega de llaves. Todo "
        "en cuatro a ocho semanas, e incluso cien por cien en remoto, con poder notarial.",
        Background("light", bignum="05"), els, header=HDR, page=5))

    # 7 · COSTES Y FISCALIDAD ---------------------------------------------
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

    els = header("06 · Costes y fiscalidad", "Costes de compra,\n*sin sorpresas*", False, size=72)
    els += [
        tabla(120, 440, 810, "🏠", "Segunda mano",
              [("ITP · Impuesto de Transmisiones", "9%"), ("Notaría y Registro", "≈ 1,5%"),
               ("Abogado", "≈ 1%")], "segunda"),
        tabla(990, 440, 810, "🏗️", "Obra nueva",
              [("IVA", "10%"), ("AJD · Actos Jurídicos Documentados", "1,4%"),
               ("Notaría, Registro y Abogado", "≈ 2,5%")], "obra"),
        Stat(120, 830, 560, 130, "≈ {}–{}%", [12, 14], "del precio en costes totales de compra", style="navy",
             num_size=50, ny=18, at="calcula"),
        chip(720, 830, 520, 130, "🏛️", "IBI: 250–800 € / año", sub="Impuesto municipal anual", style="light",
             size=27, at="IBI"),
        chip(1280, 830, 520, 130, "🧾", "No residentes: 100–350 €", sub="IRNR anual, si no alquilas",
             style="light", size=27, at="residente"),
    ]
    S.append(Scene("s07",
        "Hablemos de costes, sin sorpresas. En una vivienda de segunda mano pagarás el Impuesto de "
        "Transmisiones Patrimoniales: un 9% en la Comunidad Valenciana. En obra nueva, el 10% de IVA más un "
        "1,4% de actos jurídicos documentados. Sumando notaría, registro y abogado, calcula en torno a un 12 a "
        "14% sobre el precio. Y después, impuestos anuales muy moderados: un IBI de 250 a 800 euros al año y, "
        "como no residente, entre 100 y 350 euros.",
        Background("light", bignum="06"), els, header=HDR, page=6))

    # 8 · RESIDENCIA Y VISADOS --------------------------------------------
    def visa(x, at, emoji, titulo, sub, filas):
        items = [("e", 32, 32, emoji, 54), ("t", 104, 28, titulo, 30, 760, WHITE),
                 ("t", 104, 70, sub, 21, 500, COL["orange_l"])]
        yy = 140
        for f in filas:
            items.append(("check", 32, yy, 30, COL["orange"]))
            items.append(("t", 78, yy - 1, f, 23, 500, SOFT, {"maxw": 460}))
            yy += 52
        return Card(x, 455, 580, 320, items, style="glass", at=at)

    S.append(Scene("s08",
        "¿Quieres vivir en España? Existen vías de residencia consolidadas. La visa de Nómada Digital, para "
        "profesionales en remoto, con acceso al régimen fiscal de la Ley Beckham. Y la visa No Lucrativa, ideal "
        "para jubilados e inversores con ingresos pasivos. Ambas incluyen a tu familia, y todo el expediente "
        "lo gestionan los abogados de Fuster and Associates.",
        Background("dark", IMG + "explanada.jpg", kb=(1.04, 1.2), pan=((0.6, 0.4), (0.4, 0.6))),
        header("07 · Residencia y visados", "Tu nueva vida\nempieza *aquí*", True, size=86) + [
            visa(120, "Nómada", "💻", "Visa Nómada Digital", "Profesionales en remoto",
                 ["Ingreso mínimo ≈ 3.024 € / mes", "Ley Beckham: tipo fijo del 24%", "1 año, renovable a 3"]),
            visa(730, "Lucrativa", "🌅", "Visa No Lucrativa", "Jubilados e inversores pasivos",
                 ["Ingreso mínimo ≈ 28.800 € / año", "Seguro médico privado", "1 año, renovable 2 + 2"]),
            chip(120, 810, 580, 96, "👪", "Incluye cónyuge e hijos", style="glass2", at="familia"),
            chip(730, 810, 580, 96, "⚖️", "Expediente gestionado por *Fuster & Associates*", style="glass2",
                 size=22, at="expediente"),
        ], header=HDR, page=7))

    # 9 · ECOSISTEMA ------------------------------------------------------
    def socio(x, at, logo, area, txt, dato):
        return Card(x, 440, 540, 370, [
            ("img", 32, 28, logo, 210, 96),
            ("tr", 32, 150, area.upper(), 17, 720, COL["blue"], 2.6),
            ("t", 32, 188, txt, 23, 480, COL["slate"], {"maxw": 476, "lh": 1.42}),
            ("line", 32, 290, 508, 290, COL["line"], 2),
            ("t", 32, 308, dato, 23, 760, COL["navy"], {"maxw": 476}),
        ], at=at, accent=COL["blue"], accent_side="top")

    S.append(Scene("s09",
        "No estarás solo. Hemos construido una alianza con los mejores especialistas de cada área. Remax "
        "Inmomás, con más de 30 años y 115 agentes en la Costa Blanca. Fuster and Associates, para el "
        "blindaje legal y fiscal. Y Banco UCI, con hipotecas para no residentes de hasta el 70% y "
        "preaprobación en 48 horas. Un solo punto de contacto para todo.",
        Background("light", bignum="08"),
        header("08 · Ecosistema de socios", "No estarás solo:\n*un único equipo*", False, size=72) + [
            socio(120, "Remax", REC + "remax-inmomas.png", "Asesoría inmobiliaria",
                  "Tours de propiedades, análisis de mercado y negociación experta.",
                  "30+ años · 115+ agentes · 4 oficinas"),
            socio(690, "Fuster", REC + "fuster.png", "Legal y fiscal",
                  "Due diligence, NIE, visados, contratos y testamento español.",
                  "25+ años · 20.000 clientes"),
            socio(1260, "UCI", REC + "uci.png", "Financiación",
                  "Hipotecas para no residentes, a tipo fijo o variable.",
                  "Hasta 70% LTV · respuesta en 48 h"),
            chip(120, 850, 1680, 104, "🛡️", "*Un solo punto de contacto para todo.*  Tú eliges tu hogar; "
                 "nosotros nos encargamos del resto.", style="navy", size=27, at="punto"),
        ], header=HDR, page=8))

    # 10 · PRÓXIMO PASO ---------------------------------------------------
    pasos = [("Videollamada", "Sin compromiso, para entender tus necesidades.", "videollamada"),
             ("Propiedades", "Selección personalizada según tu perfil.", "selección"),
             ("Visita", "Tour presencial o virtual en la Costa Blanca.", "visita"),
             ("Cierre", "Toda la gestión hasta la entrega de llaves.", "llaves")]
    els = header("09 · Tu próximo paso", "Tu hogar en el Mediterráneo\n*te espera*", True, size=80, maxw=1400)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 425, 450, 395, 235, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 3 else COL["blue_l"], at=k))
    els += [
        Card(120, 730, 1000, 220, [
            ("tr", 40, 34, "TU CONTACTO DIRECTO", 17, 720, COL["blue"], 2.6),
            ("t", 40, 66, "José Martínez", 40, 780, COL["navy"]),
            ("t", 40, 120, "Director de Expansión Internacional", 23, 500, COL["slate"]),
            ("t", 40, 164, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", at="Spain", anim="left"),
        Card(1160, 730, 640, 220, [
            ("t", 40, 40, "Agenda tu videollamada\nsin compromiso", 34, 780, WHITE, {"lh": 1.15}),
            ("t", 40, 150, "www.thespainconnection.com", 25, 650, WHITE),
        ], style="orange", at=("Spain", 0.3), anim="right"),
    ]
    S.append(Scene("s10",
        "¿Cuál es tu próximo paso? Agenda una videollamada sin compromiso. Te enviaremos una selección de "
        "propiedades a tu medida, organizaremos tu visita, presencial o virtual, y gestionaremos todo hasta la "
        "entrega de llaves. The Spain Connection: tu hogar en el Mediterráneo te espera.",
        Background("dark", IMG + "sunset-walk.jpg", kb=(1.02, 1.16), pan=((0.4, 0.5), (0.6, 0.5))),
        els, header=HDR, page=9))

    # 11 · CIERRE DE MARCA ------------------------------------------------
    S.append(Scene("s11", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Tu hogar en el Mediterráneo, con un único equipo a tu lado.", 960, 660, size=34, weight=500,
             color=SOFT, maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.6, chrome=False))
    # Text centrado: x es el borde izquierdo del área
    S[-1].els[1].x = 960 - 700
    S[-1].els[2].x = 560
    return S
