"""Vídeo 4 (ES) — Presentación para Embajadores Internacionales · The Spain Connection · versión corta y dinámica."""
import motor
from motor import (COL, Background, Card, Logo, Photo, Pill, Scene, Slideshow, Stat, Text, Title, chip, header,
                   step)

motor.LEAD, motor.TAIL, motor.NUM_LOCALE = 0.6, 0.55, "es"

VOZ = "es-ES-AlvaroNeural"
RATE = "+5%"
PITCH = "+0Hz"
ESTILO_MUSICA = "guia"
VOL_MUSICA = 0.30
ARCHIVO = "Presentacion_Embajadores_The_Spain_Connection_ES.mp4"

IMG = "images/guia/"
REC = "Presentación Spain Connection/_recursos/img/"
B2C = "B2C/images/"
WHITE = COL["white"]
SOFT = (255, 255, 255, 228)
HDR = "Programa de Embajadores"


def escenas():
    S = []

    # 1 · PORTADA ---------------------------------------------------------
    S.append(Scene("s01",
        "¡Hola! ¿Conoces brokers, realtors o inversores a los que les encanta España? Entonces esto es para ti. "
        "Conviértete en Embajador Internacional de The Spain Connection, y construye tu propia red inmobiliaria "
        "con España.",
        Background("dark", IMG + "cover-sunset.jpg", kb=(1.0, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        [
            Pill("Programa Ejecutivo de Embajadores", 120, 240, at=-0.3),
            Title("Construye tu propia\n*red* internacional", 120, 320, size=96, maxw=1600, at=0.0, stagger=0.14),
            Text("Haz crecer tu paraguas de brokers, realtors, colaboradores y compradores — y gana *un 15 % sobre "
                 "tu red, o un 25 % por comprador directo*.", 120, 545, size=31, maxw=1080, color=SOFT,
                 hl=COL["orange_l"], at="encanta"),
            Stat(120, 745, 360, 175, "{}% / {}%", [15, 25], "Honorario de red · comprador directo",
                 at="Embajador"),
            Stat(510, 745, 360, 175, "{}", [4], "Canales: brokers, agentes, colaboradores y compradores",
                 at="construye"),
            Stat(900, 745, 360, 175, "{}%", [100], "Seguimiento multinivel del paraguas", at="red"),
            Card(1340, 780, 460, 110, [("img", 26, 18, REC + "remax-inmomas.png", 130, 74),
                                       ("img", 176, 12, REC + "fuster.png", 110, 86),
                                       ("img", 310, 20, REC + "uci.png", 124, 70)],
                 style="white", r=20, at=("red", 0.5), anim="right"),
        ]))

    # 2 · EL ROL ----------------------------------------------------------
    els = header("01 · El rol", "Un conector,\n*no un agente*", False, size=76, maxw=1000)
    els += [
        Text("Un socio ejecutivo de crecimiento que abre puertas en su mercado — y gana en cada cierre de su "
             "red.", 120, 410, size=28, maxw=960, color=COL["slate"], at="conector"),
        Card(120, 540, 960, 190, [
            ("e", 32, 32, "🤝", 48),
            ("t", 100, 36, "Tú abres las puertas", 28, 760, COL["navy"]),
            ("t", 100, 82, "Presenta la alianza a *agencias, equipos de realtors, colaboradores e inversores* "
             "con nuestras presentaciones llave en mano.", 23, 450, COL["slate"],
             {"maxw": 820, "lh": 1.42, "hl": COL["blue"]}),
        ], at="puertas", accent=COL["blue"]),
        Card(120, 760, 960, 190, [
            ("e", 32, 32, "☀️", 48),
            ("t", 100, 36, "Nosotros lo hacemos todo en España", 28, 760, WHITE),
            ("t", 100, 82, "Webinars, visitas VIP, legal, hipotecas y cierre — *gestionado por nuestro equipo en "
             "Alicante*.", 23, 450, SOFT, {"maxw": 820, "lh": 1.42, "hl": COL["orange_l"]}),
        ], style="navy", at="Alicante"),
        Photo(1140, 170, 660, 780, REC + "espana.jpg", kb=(1.0, 1.14), pan=((0.5, 0.3), (0.5, 0.6)),
              at=-0.2, tag="Alicante · Costa Blanca"),
    ]
    S.append(Scene("s02",
        "Como Embajador, eres un conector, no un agente. Tú abres puertas en tu mercado, y nuestro equipo en "
        "Alicante se encarga de todo lo demás: webinars, visitas VIP, legal, hipotecas y cierre.",
        Background("light"), els, header=HDR, page=1))

    # 3 · CANALES DE CRECIMIENTO ------------------------------------------
    canales = [("Agencias · 25%", "Incorpora oficinas completas. Sus agentes y colaboradores vinculados *quedan "
                "en tu paraguas*.", "agencias", "Canal 1"),
               ("Agentes 15% · Colab. 10%", "Conecta realtors con contrato directo y colaboradores de "
                "reubicación, legales o fiscales.", "realtors", "Canal 2"),
               ("Compradores directos · 25%", "Refiere tú a un comprador y *ganas el 25 % completo* en lugar del "
                "15 %.", "directamente", "Canal 3")]
    els = header("02 · Tu paraguas", "Tres formas de\n*hacer crecer tu red*", True, size=82)
    for i, (t, b, k, tag) in enumerate(canales):
        x = 120 + i * 570
        els.append(step(x, 440, 510, 290, i + 1, t, b, style="glass", tag=tag, tsize=29, bsize=22,
                        fill=COL["orange"] if i == 2 else COL["blue_l"], at=k))
    checks = ["Sin licencia española", "Los socios conservan el 100 %", "Seguimiento multinivel automático",
              "Cero cuotas ni objetivos"]
    for i, t in enumerate(checks):
        els.append(chip(120 + i * 425, 790, 400, 96, "check", t, style="glass2", size=22,
                        at=("colaboradores", 0.4 + i * 0.35)))
    S.append(Scene("s03",
        "Puedes hacer crecer tu red de tres formas. Incorpora agencias completas, que ganan un 25%. Conecta "
        "realtors al 15%, y colaboradores al 10%. O refiere tú directamente a un comprador, y te llevas el 25% "
        "completo.",
        Background("dark", B2C + "advisory_team_meeting.png", kb=(1.04, 1.22), veil="full"),
        els, header=HDR, page=2))

    # 4 · TUS INGRESOS ----------------------------------------------------
    filas = [("Fase de lanzamiento", "Contactos directos y socios", "3 / año", 9000, "Tres#2"),
             ("Paraguas en crecimiento", "3–4 agencias activas", "8 / año", 24000, ("Tres#2", 1.2)),
             ("Red regional consolidada", "Brokers, agentes y compradores", "15 / año", 45000, "Quince")]
    els = header("03 · Tus ingresos", "Constrúyela una vez,\n*gana en cada cierre*", False, size=68, maxw=1100)
    els += [
        Stat(1260, 175, 540, 230, "{}%", [15], "neto en cada cierre de tu red — los socios conservan el 100 % "
             "de sus honorarios", style="navy", num_size=96, label_size=21, at="neto"),
        Card(120, 450, 1680, 74, [
            ("tr", 36, 26, "FASE DE LA RED", 16, 720, COL["gray"], 2.4),
            ("tr", 720, 26, "PERFIL", 16, 720, COL["gray"], 2.4),
            ("tr", 1110, 26, "CIERRES", 16, 720, COL["gray"], 2.4),
            ("tr", 1400, 26, "TU 15 % NETO", 16, 720, COL["blue"], 2.4),
        ], style="ice", r=16, at="media", anim="fade"),
    ]
    for i, (n, p, c, v, k) in enumerate(filas):
        y = 545 + i * 120
        els.append(Card(120, y, 1680, 100, [
            ("e", 30, 26, ["🌱", "📈", "👑"][i], 46),
            ("t", 96, 30, n, 28, 700, COL["navy"]),
            ("t", 720, 33, p, 23, 500, COL["slate"]),
            ("t", 1110, 32, c, 26, 600, COL["slate"]),
        ], at=k, anim="left"))
        els.append(Stat(1480, y + 12, 300, 76, "{} €", [v], "", style="blue", num_size=38, num_color=WHITE,
                        nx=28, ny=14, at=(k[0], k[1] + 0.5) if isinstance(k, tuple) else (k, 0.5), r=16,
                        anim="scale"))
    els.append(chip(120, 912, 1680, 70, "check", "*Venta media de 400.000 € → 3.000 € netos por cierre*, "
                    "transferidos en 30 días hábiles tras la notaría.", style="ice", size=23, at="por"))
    S.append(Scene("s04",
        "Y aquí viene lo mejor. Ganas un 15% neto en cada cierre de tu red, y tus socios nunca pierden ni un "
        "céntimo de lo suyo. Con una venta media de cuatrocientos mil euros, son tres mil euros por cierre. Tres "
        "cierres al año son nueve mil. ¿Quince cierres? Cuarenta y cinco mil euros.",
        Background("light"), els, header=HDR, page=3))

    # 5 · PORTAL Y WEBINARS -----------------------------------------------
    feats = [("ENLACE MAESTRO", "Enlaces para cada tipo de socio", "socio"),
             ("MULTINIVEL", "Cada comprador vinculado a ti", "comprador"),
             ("FINANZAS", "Embudo, honorarios y exportación a Excel", "honorario"),
             ("WEBINARS", "Webinars B2B y para compradores, viajes VIP", "webinars")]
    els = header("04 · Portal ejecutivo", "Ve toda tu red,\n*en directo*", True, size=80, maxw=760)
    for i, (tag, t, k) in enumerate(feats):
        els.append(Card(120, 440 + i * 108, 680, 92, [
            ("sq", 22, 18, i + 1, 56, COL["orange"] if i == 3 else COL["blue_l"], WHITE),
            ("tr", 100, 18, tag, 16, 720, COL["orange_l"], 2.6),
            ("t", 100, 42, t, 26, 700, WHITE),
        ], style="glass", r=18, at=k, anim="left"))
    els += [
        Pill("“Beyond Borders” · webinars B2B", 870, 860, fill=(255, 255, 255, 46), size=15, at="profesionales",
             anim="up", dist=20),
        Pill("“Spain Unlocked” · compradores", 1300, 860, fill=COL["orange"], size=15, at="compradores",
             anim="up", dist=20),
        Slideshow(870, 200, 930, 581, [
            (REC + "dashboard.jpg", 0.0, "Panel ejecutivo"),
            (REC + "pipeline.jpg", "honorario", "Embudo y honorarios en directo"),
            (REC + "webinar_call.jpg", "webinars", "Webinars en directo"),
        ], kb=(1.0, 1.06), r=20, at=-0.2),
    ]
    S.append(Scene("s05",
        "Lo verás todo en tu portal ejecutivo: cada socio, cada comprador y cada honorario, en directo. Y lo "
        "impulsamos con dos ciclos de webinars en directo, uno para profesionales y otro para compradores, "
        "además de viajes VIP a Alicante.",
        Background("navy"), els, header=HDR, page=4))

    # 6 · EMPIEZA ---------------------------------------------------------
    pasos = [("Activa tu perfil", "Visita *thespainconnection.com* y nuestro equipo directivo habilita tu "
              "cuenta.", "Activa"),
             ("Firma tu acuerdo", "Añade tus datos fiscales y bancarios para formalizar tu acuerdo B2B del 15 %.",
              "firma"),
             ("Comparte tus 4 enlaces", "Presenta la alianza a brokers, realtors y socios — y apóyate en "
              "nuestros webinars.", "compartir")]
    els = header("05 · Empieza ya", "Conviértete hoy\nen *Embajador*", True, size=80, maxw=1500)
    for i, (t, b, k) in enumerate(pasos):
        els.append(step(120 + i * 570, 440, 540, 260, i + 1, t, b, style="glass",
                        fill=COL["orange"] if i == 2 else COL["blue_l"], tsize=28, bsize=22, at=k))
    els += [
        Card(120, 740, 1080, 210, [
            ("tr", 40, 32, "DIRECCIÓN DE EXPANSIÓN INTERNACIONAL", 16, 720, COL["blue"], 2.6),
            ("t", 40, 62, "José Martínez", 38, 780, COL["navy"]),
            ("t", 40, 114, "Broker y Director General · RE/MAX Inmomás", 22, 500, COL["slate"]),
            ("t", 40, 154, "+34 647 86 19 68   ·   jose.martinez@remax.es", 24, 650, COL["blue"]),
        ], style="white", contact=True, at="directivo", anim="left"),
        Card(1240, 740, 560, 210, [
            ("t", 40, 36, "Lidera el camino", 34, 780, WHITE),
            ("t", 40, 86, "con todo el apoyo desde Alicante", 23, 500, WHITE),
            ("t", 40, 146, "thespainconnection.com", 25, 700, WHITE),
        ], style="orange", at="apoyarte", anim="right"),
    ]
    S.append(Scene("s06",
        "¿Listo para liderar? Activa tu perfil, firma tu acuerdo y empieza a compartir tus enlaces. Nuestro "
        "equipo directivo en Alicante está aquí para apoyarte en cada paso del camino.",
        Background("dark", IMG + "castle.jpg", kb=(1.02, 1.2), pan=((0.5, 0.4), (0.5, 0.6))),
        els, header=HDR, page=5))

    # 7 · CIERRE DE MARCA -------------------------------------------------
    S.append(Scene("s07", "", Background("navy"), [
        Logo(REC + "sc-logo-blanco.png", 960, 330, w=620, align="center", anim="scale", at=-0.5, dur=0.9),
        Text("Construye tu red una vez. Gana en cada cierre.", 260, 660, size=34, weight=500, color=SOFT,
             maxw=1400, align="center", at=-0.1),
        Card(560, 760, 800, 110, [("img", 40, 18, REC + "remax-inmomas.png", 150, 74),
                                  ("img", 250, 12, REC + "fuster.png", 130, 86),
                                  ("img", 420, 20, REC + "uci.png", 130, 70),
                                  ("img", 590, 24, REC + "holidays.png", 170, 62)],
             style="white", r=20, at=0.3),
    ], hold=3.2, chrome=False))
    return S
