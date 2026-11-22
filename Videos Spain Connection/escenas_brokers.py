"""Vídeo 2 — Presentación Comercial para Brokers (The Spain Connection) · guion y escenas."""
from motor import (COL, font, tracked_len, Background, Card, Group, Line, Logo, Photo, Pill, Scene, Slideshow, SplitBar, Stat, Text,
                   Title, chip, feature, header, step)

VOZ = "es-ES-AlvaroNeural"
RATE = "+8%"
PITCH = "+0Hz"
ESTILO_MUSICA = "brokers"
VOL_MUSICA = 0.28
ARCHIVO = "Presentacion_Brokers_The_Spain_Connection.mp4"

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
        "Convierte la demanda internacional por España en facturación para tu oficina. Te presentamos The "
        "Spain Connection: tu división internacional llave en mano en España. Sin costes fijos, y sin riesgos.",
        Background("dark", REC + "portada.jpg", kb=(1.0, 1.18), pan=((0.6, 0.5), (0.35, 0.45))),
        [
            Pill("Alianza internacional para brokers", 120, 240, at=-0.3),
            Title("Tu División Internacional\n*Llave en Mano* en España", 120, 320, size=92, maxw=1500, at=0.0,
                  stagger=0.16),
            Text("Conecta a tu equipo de agentes con nuestro ecosistema en la Costa Blanca: trazabilidad 100% en "
                 "tiempo real y el *25% de la comisión de compra* para tu agencia.", 120, 545, size=31, maxw=1050,
                 color=SOFT, hl=COL["orange_l"], at="facturación"),
            Stat(120, 745, 360, 175, "{}%", [25], "Comisión de compra para tu agencia", at="presentamos"),
            Stat(510, 745, 360, 175, "{}%", [100], "Trazabilidad por agencia y agente", at="división"),
            Stat(900, 745, 360, 175, "{} €", [0], "Sin cuotas, licencias ni estructura fija", at="costes"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at="riesgos", anim="right"),
        ]))

    # 2 · LA OPORTUNIDAD --------------------------------------------------
    els = header("01 · La oportunidad", "¿Tu oficina captura ese\nnegocio o lo *pierde*?", False, size=68,
                 maxw=1000)
    els += [
        Text("Miles de compradores de Norteamérica compran cada año en la costa mediterránea española.",
             120, 410, size=28, maxw=960, color=COL["slate"], at="miles"),
        Card(120, 530, 960, 190, [
            ("cross", 32, 34, 44, COL["red"]),
            ("t", 96, 36, "El problema actual", 28, 760, COL["navy"]),
            ("t", 96, 82, "La mayoría de agencias no tiene infraestructura segura en destino. *El cliente busca "
             "solo y otra oficina cobra.*", 23, 450, COL["slate"], {"maxw": 830, "lh": 1.42, "hl": COL["red"]}),
        ], at="Pero", accent=COL["red"]),
        Card(120, 750, 960, 200, [
            ("check", 32, 34, 44, COL["green"]),
            ("t", 96, 36, "Nuestra solución llave en mano", 28, 760, WHITE),
            ("t", 96, 82, "The Spain Connection actúa como *el departamento en España de tu oficina*, protegiendo "
             "tu cartera y fidelizando a tus agentes.", 23, 450, SOFT,
             {"maxw": 830, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="Nosotros"),
        Photo(1140, 170, 660, 780, REC + "oportunidad.jpg", kb=(1.0, 1.15), pan=((0.5, 0.3), (0.5, 0.6)),
              at=-0.2, tag="Costa Blanca · Alicante"),
    ]
    S.append(Scene("s02",
        "Cada año, miles de compradores de Norteamérica compran en la costa mediterránea española. Pero cuando "
        "un cliente le dice a su agente que quiere comprar en España, la mayoría de agencias no tiene "
        "infraestructura en destino. El cliente busca solo, y otra oficina cobra. Nosotros actuamos como el "
        "departamento en España de tu oficina, protegiendo tu cartera y fidelizando a tus agentes.",
        Background("light", bignum="01"), els, header=HDR, page=1))

    # 3 · TRES ESLABONES --------------------------------------------------
    eslabones = [("Tu oficina refiere", "Cada agente opera con un *enlace único trazable* bajo el paraguas de tu "
                  "agencia desde el clic 1.", "Uno", "Tus agentes"),
                 ("Ejecutamos el 100%", "Webinarios, cualificación, viaje VIP, abogados, hipoteca y firma ante "
                  "notario en Alicante.", "Dos", "The Spain Connection"),
                 ("Tu agencia cobra el 25%", "Recibes el *25% de la comisión de compra* para gestionar y "
                  "repartir con tu agente.", "tres", "Tu agencia")]
    els = header("02 · El modelo", "Un puente comercial\nen *3 eslabones*", True, size=80)
    for i, (t, b, k, tag) in enumerate(eslabones):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=30, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
        if i < 2:
            els.append(Text("→", x + 520, 555, size=46, weight=700, color=COL["orange"], at=(k, 0.5),
                            anim="left", dist=20))
    checks = [("Sin licencia española", "licencia"), ("Protección del cliente 24 meses", "protección"),
              ("Liquidación en 30 días hábiles", ("protección", 0.6)), ("Cero cuotas ni mínimos", ("protección", 1.2))]
    for i, (t, k) in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22, at=k))
    S.append(Scene("s03",
        "El modelo funciona en tres eslabones. Uno: tus agentes refieren a sus clientes con un enlace único y "
        "trazable. Dos: nosotros ejecutamos el cien por cien del proceso en España. Webinarios, viaje VIP, "
        "abogados, hipoteca y notaría. Y tres: tu agencia cobra el 25% de la comisión de compra. Sin licencia "
        "española, y con protección del cliente durante 24 meses.",
        Background("dark", B2C + "advisory_team_meeting.png", kb=(1.04, 1.2), veil="full"),
        els, header=HDR, page=2))

    # 4 · POR QUÉ ESPAÑA --------------------------------------------------
    feats = [("💶", "Coste de vida", "Ahorro del *40–60%* en gastos mensuales; IBI muy inferior al property tax.",
              "Ahorro"),
             ("🏥", "Sanidad de primer nivel", "Seguros privados completos desde 80–150 € / mes.", "sanidad"),
             ("🛡️", "Seguridad familiar", "Entre los países más seguros de Europa; ciudades caminables.",
              "seguridad"),
             ("☀️", "Clima mediterráneo", "*320+ días de sol* y 200 km de playas Bandera Azul.", "sol"),
             ("🛂", "Visados de residencia", "Nómada Digital y No Lucrativa, tramitados por nuestros abogados.",
              "visados"),
             ("✈️", "Conectividad", "Aeropuerto ALC con *+150 conexiones* y AVE a Madrid en 2 h.", "conexión")]
    els = header("03 · Por qué España", "¿Por qué España enamora\na *tus clientes*?", False, size=70)
    for i, (e, t, b, k) in enumerate(feats):
        els.append(feature(120 + (i % 3) * 570, 445 + (i // 3) * 215, 540, 185, e, t, b, at=k))
    S.append(Scene("s04",
        "¿Y por qué España enamora a tus clientes? Ahorro del 40 al 60% en coste de vida, una sanidad de primer "
        "nivel, seguridad, más de 320 días de sol, visados de residencia consolidados, y conexión directa con "
        "más de 150 destinos desde Alicante.",
        Background("light", bignum="03"), els, header=HDR, page=3))

    # 5 · OPERATIVA EN 4 PASOS --------------------------------------------
    ops = [("Alta de agencia", "Registro gratuito y firma digital del *Master Referral Agreement*.", "Tu oficina",
            "Primero"),
           ("Enlaces de equipo", "Tus agentes se vinculan a tu cuenta y activan su *enlace único*.", "Tus agentes",
            "Segundo"),
           ("Cierre 360° en destino", "Webinarios, viaje VIP, due diligence, hipoteca y notaría.", "Inmomás",
            "Tercero"),
           ("Cobro y reparto", "Tu agencia recibe el *25%* y gestiona el reparto con su agente.", "Tu oficina",
            "cuarto")]
    els = header("04 · Operativa de oficina", "Operativa para tu agencia\nen *4 pasos simples*", False, size=70)
    for i, (t, b, tag, k) in enumerate(ops):
        els.append(step(120 + i * 425, 440, 400, 300, i + 1, t, b, tag=tag, tsize=28, bsize=22,
                        fill=COL["orange"] if i == 3 else COL["blue"], at=k))
    bullets = ["Contrato B2B internacional estándar", "Transferencia directa sin retención (W-8BEN-E)",
               "Cero inversión en marketing o estructura", "Soporte dedicado para tu equipo"]
    for i, b in enumerate(bullets):
        els.append(chip(120 + (i % 2) * 850, 780 + (i // 2) * 94, 830, 80, "check", b, style="ice", size=23,
                        at=("decida", -1.2 + i * 0.25)))
    S.append(Scene("s05",
        "Tu equipo no necesita aprender legislación española. Primero, das de alta tu agencia gratis y firmas "
        "digitalmente el acuerdo marco. Segundo, tus agentes se vinculan a tu cuenta y activan su enlace. "
        "Tercero, nosotros nos encargamos del cierre en destino. Y cuarto, tu agencia cobra y reparte con su "
        "agente como decida.",
        Background("light", bignum="04"), els, header=HDR, page=4))

    # 6 · PLATAFORMA ------------------------------------------------------
    feats = [("MI EQUIPO", "Supervisión de agentes", "equipo"),
             ("TRAZABILIDAD", "Links personalizados de equipo", "enlaces"),
             ("KANBAN EN VIVO", "Pipeline en 6 etapas", "pipeline"),
             ("COMPLIANCE", "Documentos y finanzas", "documentos")]
    els = header("05 · Plataforma", "Control absoluto,\n*en tiempo real*", True, size=78, maxw=760)
    for i, (tag, t, k) in enumerate(feats):
        els.append(Card(120, 440 + i * 108, 680, 92, [
            ("sq", 22, 18, i + 1, 56, COL["orange"] if i == 3 else COL["blue_l"], WHITE),
            ("tr", 100, 18, tag, 16, 720, COL["orange_l"], 2.6),
            ("t", 100, 42, t, 26, 700, WHITE),
        ], style="glass", r=18, at=k, anim="left"))
    etapas = ["Contactado", "Opciones", "Visita VIP", "Oferta", "Notaría", "Cerrado"]
    px = 845
    for i, e in enumerate(etapas):
        els.append(Pill(e, px, 860, fill=COL["orange"] if i == 5 else (255, 255, 255, 46), size=15,
                        at=("contactado", i * 0.18), anim="up", dist=20))
        px += int(tracked_len(e.upper(), font(15, 720), 15 * 0.16) + 30) + 12
        if i < 5:
            els.append(Text("→", px - 4, 862, size=22, weight=700, color=COL["orange_l"],
                            at=("contactado", i * 0.18 + 0.1), anim="fade"))
            px += 22
    els.append(Slideshow(870, 200, 930, 581, [
        (REC + "dashboard.jpg", 0.0, "Panel ejecutivo del broker"),
        (REC + "referral.jpg", "enlaces", "Enlaces de referido trazables"),
        (REC + "pipeline.jpg", "pipeline", "Pipeline Kanban en 6 etapas"),
    ], kb=(1.0, 1.06), r=20, at=-0.2))
    S.append(Scene("s06",
        "Y todo, con control absoluto. Desde tu portal de broker supervisas a todo tu equipo, generas enlaces "
        "personalizados para cada agente, y sigues a cada comprador en un pipeline de seis etapas: de contactado "
        "a cerrado. Además, gestionas tus documentos y auditas cada liquidación. Trazabilidad permanente, desde "
        "el primer clic hasta la notaría.",
        Background("navy"), els, header=HDR, page=5))

    # 7 · WEBINARIOS Y VIAJE VIP ------------------------------------------
    els = header("06 · Motor de conversión", "Webinarios para clientes\ny *viaje VIP* en destino", False,
                 size=66, maxw=1000)
    els += [
        Photo(120, 410, 330, 540, REC + "webinar_call.jpg", kb=(1.0, 1.12), at="webinarios"),
        Card(470, 410, 520, 540, [
            ("tr", 34, 34, "«SPAIN UNLOCKED»", 17, 720, COL["blue"], 2.6),
            ("t", 34, 70, "Webinarios en directo", 32, 780, COL["navy"]),
            ("check", 34, 150, 30, COL["blue"]), ("t", 80, 148, "Panel 360°: asesores, abogados y "
                                                  "especialistas hipotecarios.", 22, 480, COL["slate"],
                                                  {"maxw": 400, "lh": 1.4}),
            ("check", 34, 260, 30, COL["blue"]), ("t", 80, 258, "Invitación *100% trazable* al agente y a tu "
                                                  "agencia.", 22, 480, COL["slate"],
                                                  {"maxw": 400, "lh": 1.4, "hl": COL["blue"]}),
            ("check", 34, 370, 30, COL["blue"]), ("t", 80, 368, "Compradores cualificados: visados, impuestos y "
                                                  "financiación resueltos.", 22, 480, COL["slate"],
                                                  {"maxw": 400, "lh": 1.4}),
        ], at=("webinarios", 0.3), accent=COL["blue"], accent_side="top"),
        Photo(1030, 410, 330, 540, REC + "viaje.jpg", kb=(1.0, 1.12), at="VIP"),
        Card(1380, 410, 420, 540, [
            ("tr", 34, 34, "4–5 DÍAS EN ALICANTE", 17, 720, COL["orange_l"], 2.6),
            ("t", 34, 70, "Viaje VIP de\ninspección", 32, 780, WHITE, {"lh": 1.15}),
            ("check", 34, 190, 30, COL["orange"]), ("t", 80, 188, "Ruta privada por propiedades "
                                                    "preseleccionadas.", 22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
            ("check", 34, 300, 30, COL["orange"]), ("t", 80, 298, "Reuniones con Fuster & Associates y UCI.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
            ("check", 34, 410, 30, COL["orange"]), ("t", 80, 408, "Cada visita y oferta, en vivo en tu portal.",
                                                    22, 480, SOFT, {"maxw": 310, "lh": 1.4}),
        ], style="navy", at=("VIP", 0.3)),
    ]
    S.append(Scene("s07",
        "Tus agentes tampoco necesitan ser expertos en hipotecas o visados. Organizamos webinarios en directo, "
        "Spain Unlocked, con asesores, abogados y especialistas hipotecarios, que educan y cualifican a tus "
        "compradores. Y cuando están listos, los recibimos en Alicante con un viaje VIP de inspección de cuatro "
        "a cinco días.",
        Background("light", bignum="06"), els, header=HDR, page=6))

    # 8 · MODELO ECONÓMICO ------------------------------------------------
    filas = [("Apartamento en Alicante", "350.000 €", "17.500 €", 4375, "apartamento"),
             ("Villa Premium Costa Blanca", "600.000 €", "30.000 €", 7500, "premium"),
             ("Villa de lujo frente al mar", "1.200.000 €", "60.000 €", 15000, "lujo")]
    els = header("07 · Modelo económico", "*25%* de la comisión\nde compra para tu agencia", False, size=66,
                 maxw=1000)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [25], "sobre la comisión de compra (5%), por transferencia "
             "internacional al cierre", style="navy", num_size=96, label_size=21, at="25"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "TIPO DE PROPIEDAD", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PRECIO", 16, 720, COL["gray"], 2.4),
            ("tr", 1010, 26, "COMISIÓN (5%)", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "25% TU AGENCIA", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at="Un", anim="fade"),
    ]
    for i, (n, p, c, v, k) in enumerate(filas):
        y = 545 + i * 120
        els.append(Card(120, y, 1680, 100, [
            ("e", 30, 26, ["🏢", "🏡", "🌊"][i], 46),
            ("t", 96, 30, n, 28, 700, COL["navy"]),
            ("t", 720, 32, p, 26, 600, COL["slate"]),
            ("t", 1010, 32, c, 26, 600, COL["slate"]),
        ], at=k, anim="left"))
        els.append(Stat(1480, y + 12, 300, 76, "{} €", [v], "", style="blue", num_size=38, num_color=WHITE, nx=28, ny=14,
                        at=(k, 0.5), r=16, anim="scale"))
    els.append(Text("* Ejemplos orientativos antes de impuestos. Comisión estándar de compra del 5%, sobre la "
                    "que tu agencia percibe el 25%.", 120, 925, size=19, color=COL["gray"], maxw=1680,
                    at=("lujo", 1.0)))
    S.append(Scene("s08",
        "Hablemos de números. Al cierre, tu agencia recibe por transferencia internacional el 25% de la "
        "comisión de compra, que es del 5%. Un apartamento en Alicante de 350.000 euros genera 4.375 euros para "
        "tu agencia. Una villa premium de 600.000, 7.500 euros. Y una villa de lujo frente al mar de un millón "
        "doscientos mil, 15.000 euros.",
        Background("light", bignum="07"), els, header=HDR, page=7))

    # 9 · REPARTO INTERNO -------------------------------------------------
    politicas = [("100% para el agente", 0.0, "Agencia 0 €", "Agente 5.000 €", "todo"),
                 ("A partes iguales", 0.5, "Agencia 2.500 €", "Agente 2.500 €", "iguales"),
                 ("100% para la agencia", 1.0, "Agencia 5.000 €", "Agente 0 €", "retenerlo")]
    els = header("08 · Tú decides", "Reparte el 25%\n*como tú decidas*", True, size=80, maxw=900)
    els.append(Text("Ejemplo: propiedad de 400.000 € → comisión de compra 20.000 € → *tu agencia recibe "
                    "5.000 €*", 120, 425, size=28, color=SOFT, hl=COL["orange_l"], maxw=1000, at="ejemplo"))
    for i, (t, f, l, r, k) in enumerate(politicas):
        y = 520 + i * 110
        els.append(Text(t, 120, y + 18, size=26, weight=700, color=WHITE, at=k, anim="left"))
        els.append(SplitBar(470, y, 640, 76, f, l, r, at=k))
    els += [
        Card(1220, 470, 580, 420, [
            ("tr", 40, 40, "POTENCIAL A ESCALA DE EQUIPO", 16, 720, COL["orange_l"], 2.6),
            ("t", 40, 78, "Con 5–10 cierres al año", 28, 700, WHITE),
            ("check", 40, 268, 30, COL["orange"]), ("t", 86, 266, "Cero costes locales: sin oficinas, nóminas "
                                                    "ni marketing en España.", 21, 480, SOFT,
                                                    {"maxw": 460, "lh": 1.4}),
            ("check", 40, 342, 30, COL["orange"]), ("t", 86, 340, "Retienes talento con acceso internacional "
                                                    "real.", 21, 480, SOFT, {"maxw": 460, "lh": 1.4}),
        ], style="glass", at="cinco", anim="right"),
        Stat(1260, 600, 500, 120, "{}–{}K €", [25, 50], "", style="none", num_size=72, nx=0, ny=8,
             at=("cinco", 0.4), anim="fade"),
    ]
    S.append(Scene("s09",
        "Y tú decides cómo repartirlo. Por ejemplo, en una propiedad de 400.000 euros, tu agencia recibe 5.000. "
        "Puedes entregarlo todo a tu agente, repartirlo a partes iguales, o retenerlo. Con solo cinco a diez "
        "cierres al año, son entre 25.000 y 50.000 euros adicionales, sin oficinas, nóminas ni marketing en "
        "España.",
        Background("dark", REC + "comision.jpg", kb=(1.04, 1.18), veil="full", strength=1.05),
        els, header=HDR, page=8))

    # 10 · ECOSISTEMA Y PREGUNTAS -----------------------------------------
    socios = [(REC + "remax-inmomas.png", "+30 años · 4 oficinas · +115 agentes", "Remax"),
              (REC + "fuster.png", "Due diligence, NIE, visados y fiscalidad", "Fuster"),
              (REC + "uci.png", "Hipotecas no residentes hasta 70% LTV", "UCI"),
              (REC + "holidays.png", "Licencia turística y alquiler vacacional", "Holidays")]
    els = header("09 · Respaldo institucional", "Un ecosistema 360°\n*líder en la Costa Blanca*", False,
                 size=66, maxw=1100)
    for i, (lg, t, k) in enumerate(socios):
        els.append(Card(120 + i * 425, 420, 400, 230, [
            ("img", 30, 26, lg, 340, 100),
            ("line", 30, 146, 370, 146, COL["line"], 2),
            ("t", 30, 162, t, 21, 550, COL["slate"], {"maxw": 340, "lh": 1.35}),
        ], at=k, anim="up"))
    faqs = [("¿Necesitamos licencia en España?", "*No.* Acuerdo mercantil B2B internacional, sin retención.",
             "licencia"),
            ("¿Tiene algún coste o mínimo?", "*Cero cuotas y cero mínimos:* solo ganamos juntos al firmar "
             "en notaría.", "coste")]
    for i, (q, a, k) in enumerate(faqs):
        els.append(Card(120 + i * 850, 700, 830, 230, [
            ("t", 36, 34, q, 28, 760, COL["navy"], {"maxw": 760}),
        ], at=k, accent=COL["orange"]))
        els.append(Text(a, 120 + i * 850 + 36, 700 + 96, size=25, weight=480, color=COL["slate"], hl=COL["blue"],
                        maxw=740, lh=1.4, at=(["No", "Ninguno"][i], 0.0)))
    S.append(Scene("s10",
        "Detrás, un ecosistema líder: Remax Inmomás, Fuster and Associates, Banco UCI e Inmomás Holidays. "
        "¿Necesitas licencia en España? No. ¿Tiene algún coste o mínimo? Ninguno: solo ganamos juntos, al "
        "firmar en notaría.",
        Background("light", bignum="09"), els, header=HDR, page=9))

    # 11 · ACTIVACIÓN -----------------------------------------------------
    pasos = [("Crea tu cuenta de broker", "Regístrate gratis en *thespainconnection.com* eligiendo el perfil "
              "Broker.", "Crea"),
             ("Firma el Master Agreement", "Sube tus datos fiscales y bancarios y firma el acuerdo B2B.", "firma"),
             ("Conecta agentes y clientes", "Comparte el enlace con tu equipo e invita clientes al próximo "
              "webinario.", "conecta")]
    els = header("10 · Activación", "Activa hoy la división\nen España de *tu agencia*", True, size=78)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "TU ENLACE DIRECTO CON THE SPAIN CONNECTION", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker & Director General · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", at="Spain", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Menos de 5 minutos", 34, 780, WHITE),
            ("t", 40, 86, "para activar toda tu oficina", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at=("Spain", 0.3), anim="right"),
    ]
    S.append(Scene("s11",
        "Activar la alianza para toda tu oficina lleva menos de cinco minutos. Crea tu cuenta de broker, firma "
        "el acuerdo, y conecta a tus agentes y clientes. The Spain Connection, by Remax Inmomás. Te esperamos "
        "en la Costa Blanca.",
        Background("dark", IMG + "aerial.jpg", kb=(1.02, 1.18), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=10))

    # 12 · CIERRE DE MARCA ------------------------------------------------
    S.append(Scene("s12", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Tu división internacional llave en mano en España.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.6, chrome=False))
    return S
