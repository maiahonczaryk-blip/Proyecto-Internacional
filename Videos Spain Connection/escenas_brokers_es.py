"""Vídeo 2 (ES) — Presentación para Brokers · The Spain Connection · versión corta, cercana y dinámica."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Slideshow, Stat, Text, Title, chip, font,
                   header, step, tracked_len)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "es"

VOZ = "es-ES-AlvaroNeural"
RATE = "+6%"
PITCH = "+0Hz"
ESTILO_MUSICA = "brokers"
VOL_MUSICA = 0.30
ARCHIVO = "Presentacion_Brokers_The_Spain_Connection_ES.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Presentación para Brokers"


def escenas():
    S = []

    # 1 · PORTADA ---------------------------------------------------------
    S.append(Scene("s01",
        "¡Hola! Si tus clientes sueñan con España, esto es para ti. Te presentamos The Spain Connection: tu "
        "división internacional llave en mano en España. Sin cuotas, sin estructura y sin riesgo.",
        Background("dark", REC + "portada.jpg", kb=(1.0, 1.2), pan=((0.6, 0.5), (0.35, 0.45))),
        [
            Pill("Alianza internacional de agencias", 120, 240, at=-0.3),
            Title("Tu división internacional\n*en España*, llave en mano", 120, 320, size=88, maxw=1650, at=0.0,
                  stagger=0.14),
            Text("Conecta a tus agentes con nuestro ecosistema en la Costa Blanca: seguimiento en tiempo real y "
                 "*el 25 % de la comisión de compra* para tu agencia.", 120, 545, size=31, maxw=1050, color=SOFT,
                 hl=COL["orange_l"], at="sueñan"),
            Stat(120, 745, 360, 175, "{}%", [25], "De la comisión de compra para tu oficina", at="llave"),
            Stat(510, 745, 360, 175, "{}%", [100], "Seguimiento en tiempo real de agencia y agentes",
                 at="división"),
            Stat(900, 745, 360, 175, "{} €", [0], "Cero cuotas, licencias o costes fijos", at="cuotas"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at="riesgo", anim="right"),
        ]))

    # 2 · LA OPORTUNIDAD --------------------------------------------------
    els = header("01 · La oportunidad", "Captura la operación —\nno la *pierdas*", False, size=72, maxw=1000)
    els += [
        Text("Miles de compradores norteamericanos compran cada año en la costa mediterránea española.",
             120, 410, size=28, maxw=960, color=COL["slate"], at="miles"),
        Card(120, 530, 960, 190, [
            ("cross", 32, 34, 44, COL["red"]),
            ("t", 96, 36, "El problema hoy", 28, 760, COL["navy"]),
            ("t", 96, 82, "La mayoría de oficinas no tiene a nadie sobre el terreno en España. *El cliente va por "
             "libre — y cobra otra oficina.*", 23, 450, COL["slate"], {"maxw": 830, "lh": 1.42, "hl": COL["red"]}),
        ], at="Pero", accent=COL["red"]),
        Card(120, 750, 960, 200, [
            ("check", 32, 34, 44, COL["green"]),
            ("t", 96, 36, "Nuestra solución llave en mano", 28, 760, WHITE),
            ("t", 96, 82, "Nos convertimos en *el departamento de España de tu oficina* — proteges tu cartera "
             "de clientes y fidelizas a tus agentes.", 23, 450, SOFT,
             {"maxw": 830, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="departamento"),
        Photo(1140, 170, 660, 780, REC + "oportunidad.jpg", kb=(1.0, 1.16), pan=((0.5, 0.3), (0.5, 0.6)),
              at=-0.2, tag="Costa Blanca · Alicante"),
    ]
    S.append(Scene("s02",
        "Cada año, miles de compradores norteamericanos compran en la costa mediterránea española. Pero cuando "
        "un cliente pregunta por España, la mayoría de oficinas no tiene a nadie sobre el terreno, y la "
        "operación se va por la puerta. Nosotros nos convertimos en el departamento de España de tu oficina, y "
        "tú conservas al cliente.",
        Background("light"), els, header=HDR, page=1))

    # 3 · EL MODELO -------------------------------------------------------
    eslabones = [("Tus agentes refieren", "Cada agente recibe un *enlace de seguimiento único* vinculado a tu "
                  "agencia, desde el primer clic.", "refieren", "Tus agentes"),
                 ("Gestionamos el 100%", "Webinars, viajes VIP, abogados, hipotecas y notaría en Alicante.",
                  "gestionamos", "The Spain Connection"),
                 ("Ganas el 25%", "Tu agencia gana *el 25 % de la comisión de compra* para compartir con tu "
                  "agente.", "gana", "Tu agencia")]
    els = header("02 · El modelo", "Tres pasos\n*sencillos*", True, size=84)
    for i, (t, b, k, tag) in enumerate(eslabones):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 555, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    checks = ["Sin licencia española", "Protección del cliente 24 meses", "Cobro en 30 días hábiles",
              "Cero cuotas o mínimos"]
    for i, t in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22,
                        at=("gana", 0.2 + i * 0.3)))
    S.append(Scene("s03",
        "Funciona en tres pasos sencillos. Tus agentes refieren clientes con un enlace de seguimiento único. "
        "Nosotros gestionamos todo en España: webinars, viajes VIP, abogados, hipotecas y notaría. Y tu agencia "
        "gana el 25% de la comisión de compra.",
        Background("dark", B2C + "advisory_team_meeting.png", kb=(1.04, 1.22), veil="full"),
        els, header=HDR, page=2))

    # 4 · PLATAFORMA ------------------------------------------------------
    feats = [("MI EQUIPO", "Sigue a cada agente", "agente"), ("SEGUIMIENTO", "Enlaces de referido personales",
                                                            "referido"),
             ("KANBAN EN VIVO", "Embudo de compra en 6 etapas", "comprador"),
             ("CUMPLIMIENTO", "Documentos y pagos", "cierre")]
    els = header("03 · Plataforma", "Control total,\n*en tiempo real*", True, size=80, maxw=760)
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
                        at=("seis", i * 0.16), anim="up", dist=20))
        px += int(tracked_len(e.upper(), font(15, 720), 15 * 0.16) + 30) + 12
        if i < 5:
            els.append(Text("→", px - 4, 862, size=22, weight=700, color=COL["orange_l"],
                            at=("seis", i * 0.16 + 0.1), anim="fade"))
            px += 24
    els.append(Slideshow(870, 200, 930, 581, [
        (REC + "dashboard.jpg", 0.0, "Panel ejecutivo del broker"),
        (REC + "referral.jpg", "referido", "Enlaces de referido con seguimiento"),
        (REC + "pipeline.jpg", "seis", "Embudo Kanban en 6 etapas"),
    ], kb=(1.0, 1.06), r=20, at=-0.2))
    S.append(Scene("s04",
        "Y tú mantienes el control total. Tu portal de broker sigue a cada agente, cada referido y cada "
        "comprador a través de un embudo de seis etapas, desde el primer clic hasta el cierre.",
        Background("navy"), els, header=HDR, page=3))

    # 5 · WEBINARS Y VIAJE VIP --------------------------------------------
    els = header("04 · Motor de conversión", "Webinars para clientes\ny *viajes VIP*", False, size=72,
                 maxw=1000)
    els += [
        Photo(120, 410, 330, 540, REC + "webinar_call.jpg", kb=(1.0, 1.12), at="webinars"),
        Card(470, 410, 520, 540, [
            ("tr", 34, 34, "“SPAIN UNLOCKED”", 17, 720, COL["blue"], 2.6),
            ("t", 34, 70, "Webinars en directo", 32, 780, COL["navy"]),
            ("check", 34, 150, 30, COL["blue"]), ("t", 80, 148, "Panel 360°: asesores, abogados y especialistas "
                                                  "hipotecarios.", 22, 480, COL["slate"], {"maxw": 400, "lh": 1.4}),
            ("check", 34, 260, 30, COL["blue"]), ("t", 80, 258, "Cada inscripción, *100 % atribuida* a tu agente "
                                                  "y a tu agencia.", 22, 480, COL["slate"],
                                                  {"maxw": 400, "lh": 1.4, "hl": COL["blue"]}),
            ("check", 34, 370, 30, COL["blue"]), ("t", 80, 368, "Compradores cualificados: visados, impuestos y "
                                                  "financiación resueltos.", 22, 480, COL["slate"],
                                                  {"maxw": 400, "lh": 1.4}),
        ], at=("webinars", 0.3), accent=COL["blue"], accent_side="top"),
        Photo(1030, 410, 330, 540, REC + "viaje.jpg", kb=(1.0, 1.12), at="Alicante"),
        Card(1380, 410, 420, 540, [
            ("tr", 34, 34, "4–5 DÍAS EN ALICANTE", 17, 720, COL["orange_l"], 2.6),
            ("t", 34, 70, "Viaje VIP de\ninspección", 32, 780, WHITE, {"lh": 1.15}),
            ("check", 34, 190, 30, COL["orange"]), ("t", 80, 188, "Visita privada a propiedades seleccionadas.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
            ("check", 34, 300, 30, COL["orange"]), ("t", 80, 298, "Reuniones con Fuster & Asociados y UCI.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
            ("check", 34, 410, 30, COL["orange"]), ("t", 80, 408, "Cada visita y oferta, en directo en tu portal.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
        ], style="navy", at="VIP"),
    ]
    S.append(Scene("s05",
        "Y tus agentes tampoco necesitan ser expertos. Nuestros webinars en directo, Spain Unlocked, forman y "
        "cualifican a tus compradores. Y cuando están listos, los recibimos en Alicante en un viaje VIP de "
        "inspección.",
        Background("light"), els, header=HDR, page=4))

    # 6 · LOS NÚMEROS -----------------------------------------------------
    filas = [("Apartamento en Alicante", "350.000 €", "17.500 €", 4375, "apartamento"),
             ("Villa premium Costa Blanca", "600.000 €", "30.000 €", 7500, "villa"),
             ("Villa de lujo frente al mar", "1.200.000 €", "60.000 €", 15000, "mar")]
    els = header("05 · Los números", "*El 25 %* de la comisión\nde compra para ti", False, size=66, maxw=1050)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [25], "de la comisión de compra del 5 %, transferido a tu agencia al "
             "cierre", style="navy", num_size=96, label_size=21, at="números"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "TIPO DE INMUEBLE", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PRECIO", 16, 720, COL["gray"], 2.4),
            ("tr", 1010, 26, "COMISIÓN (5 %)", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "25 % PARA TI", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at=("números", 0.3), anim="fade"),
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
    els.append(chip(120, 912, 1680, 70, "check", "*Tú decides el reparto* — quédatelo, compártelo o dáselo "
                    "entero a tu agente.", style="ice", size=23, at="repartirla"))
    S.append(Scene("s06",
        "Vamos con los números. Un apartamento de trescientos cincuenta mil euros genera para tu agencia cuatro "
        "mil trescientos setenta y cinco euros. Una villa de seiscientos mil euros, siete mil quinientos. ¿Y una "
        "villa frente al mar de un millón doscientos mil euros? Quince mil euros. Y tú decides cómo repartirla "
        "con tu agente.",
        Background("light"), els, header=HDR, page=5))

    # 7 · EMPIEZA ---------------------------------------------------------
    pasos = [("Crea tu cuenta de broker", "Regístrate gratis en *thespainconnection.com* y elige el perfil "
              "Broker.", "Crea"),
             ("Firma el Acuerdo Marco", "Sube tus datos fiscales y bancarios y firma el acuerdo B2B.", "firma"),
             ("Conecta a tu equipo", "Comparte tu enlace con tus agentes e invita a tus clientes al próximo "
              "webinar.", "conecta")]
    els = header("06 · Empieza ya", "Lanza hoy tu división\n*de España*", True, size=78, maxw=1500)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "TU CONTACTO DIRECTO EN THE SPAIN CONNECTION", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker y Director General · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", contact=True, at="ganas", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Menos de 5 minutos", 34, 780, WHITE),
            ("t", 40, 86, "para activar toda tu oficina", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at="cinco", anim="right"),
    ]
    S.append(Scene("s07",
        "Empezar lleva menos de cinco minutos. Crea tu cuenta de broker, firma el acuerdo y conecta a tu equipo. "
        "¡Tenemos muchas ganas de darte la bienvenida en la Costa Blanca!",
        Background("dark", IMG + "aerial.jpg", kb=(1.02, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=6))

    # 8 · CIERRE DE MARCA -------------------------------------------------
    S.append(Scene("s08", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Tu división internacional en España, llave en mano.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
