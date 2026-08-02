#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_doc.py
Genera el Guión Completo del Webinario B2B — Beyond Borders
RE/MAX Inmomás International Partner Program
"""

from docx import Document
from docx.shared import Pt, RGBColor, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ─── Colores corporativos ─────────────────────────────────────────────────────
RED   = RGBColor(0xC8, 0x10, 0x2E)   # RE/MAX rojo
GREY  = RGBColor(0x80, 0x80, 0x80)   # instrucciones
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BLACK = RGBColor(0x00, 0x00, 0x00)
DARK  = RGBColor(0x1A, 0x1A, 0x2E)   # encabezados tabla

# ─── Helpers ──────────────────────────────────────────────────────────────────

def set_cell_bg(cell, hex_color: str):
    """Relleno de fondo para celdas de tabla."""
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)


def set_table_borders(table):
    """Bordes ligeros en toda la tabla."""
    tbl   = table._tbl
    tblPr = tbl.find(qn('w:tblPr'))
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        tbl.insert(0, tblPr)
    borders = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'),   'single')
        el.set(qn('w:sz'),    '4')
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), 'D0D0D0')
        borders.append(el)
    tblPr.append(borders)


def add_paragraph(doc, text='', bold=False, italic=False,
                  color=None, size=11, align=WD_ALIGN_PARAGRAPH.LEFT,
                  indent_left=None, space_before=None, space_after=None):
    p  = doc.add_paragraph()
    p.alignment = align
    pPr = p.paragraph_format
    if indent_left  is not None: pPr.left_indent   = Cm(indent_left)
    if space_before is not None: pPr.space_before   = Pt(space_before)
    if space_after  is not None: pPr.space_after    = Pt(space_after)
    if text:
        run = p.add_run(text)
        run.bold    = bold
        run.italic  = italic
        run.font.size  = Pt(size)
        run.font.color.rgb = color if color else BLACK
    return p


def add_heading1(doc, text):
    """BLOQUE — Heading 1 rojo y negrita."""
    p   = doc.add_paragraph()
    p.style = doc.styles['Heading 1']
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after  = Pt(6)
    run = p.add_run(text)
    run.bold = True
    run.font.size  = Pt(18)
    run.font.color.rgb = RED
    return p


def add_heading2(doc, text):
    """SLIDE — Heading 2 oscuro."""
    p   = doc.add_paragraph()
    p.style = doc.styles['Heading 2']
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run(text)
    run.bold = True
    run.font.size  = Pt(14)
    run.font.color.rgb = DARK
    return p


def add_script(doc, text, speaker=None):
    """Guión de agente en cursiva con sangría."""
    if speaker:
        sp = doc.add_paragraph()
        sp.paragraph_format.left_indent  = Cm(1)
        sp.paragraph_format.space_before = Pt(6)
        sp.paragraph_format.space_after  = Pt(2)
        run = sp.add_run(speaker)
        run.bold = True
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    p  = doc.add_paragraph()
    p.paragraph_format.left_indent  = Cm(1.5)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(6)
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(10.5)
    run.font.color.rgb = BLACK
    return p


def add_instruction(doc, text):
    """Instrucción [entre corchetes] en gris."""
    p  = doc.add_paragraph()
    p.paragraph_format.left_indent  = Cm(1)
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after  = Pt(3)
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(9.5)
    run.font.color.rgb = GREY
    return p


def add_separator(doc):
    p = doc.add_paragraph('─' * 70)
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(4)
    for run in p.runs:
        run.font.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
        run.font.size = Pt(8)


def add_footer(doc):
    section = doc.sections[0]
    footer  = section.footer
    fp = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fp.clear()
    run = fp.add_run('RE/MAX Inmomás International · Uso interno · 2026')
    run.font.size  = Pt(8)
    run.font.color.rgb = GREY
    run.italic = True


# ─── Construcción del documento ───────────────────────────────────────────────

doc = Document()

# Márgenes de página
for section in doc.sections:
    section.top_margin    = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin   = Cm(3.0)
    section.right_margin  = Cm(2.5)

# Fuente predeterminada
doc.styles['Normal'].font.name = 'Calibri'
doc.styles['Normal'].font.size = Pt(11)

# ── PIE DE PÁGINA ──────────────────────────────────────────────────────────────
add_footer(doc)

# ══════════════════════════════════════════════════════════════════════════════
# PORTADA / TÍTULO
# ══════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(10)
p.paragraph_format.space_after  = Pt(4)
run = p.add_run('GUIÓN COMPLETO DEL WEBINARIO B2B — Beyond Borders')
run.bold = True
run.font.size  = Pt(22)
run.font.color.rgb = RED

p2 = doc.add_paragraph()
p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
p2.paragraph_format.space_after = Pt(2)
run2 = p2.add_run(
    'RE/MAX Inmomás International Partner Program\n'
    'Dirigido a Realtors de EE.UU. y Canadá'
)
run2.font.size = Pt(13)
run2.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

p3 = doc.add_paragraph()
p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
p3.paragraph_format.space_after = Pt(2)
run3 = p3.add_run('"Beyond Borders: The North American Realtor\'s Blueprint to Spain\'s Expat Boom"')
run3.italic = True
run3.font.size = Pt(11)
run3.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

p4 = doc.add_paragraph()
p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
p4.paragraph_format.space_after = Pt(16)
run4 = p4.add_run('Duración total: 50–55 minutos | Formato: Bilingüe Inglés / Español')
run4.font.size = Pt(10)
run4.font.color.rgb = GREY

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# FICHA TÉCNICA
# ══════════════════════════════════════════════════════════════════════════════
add_paragraph(doc, '📋  FICHA TÉCNICA / FACT SHEET',
              bold=True, color=RED, size=13, space_before=10, space_after=6)

ficha_data = [
    ('Título',             '"Beyond Borders: The North American Realtor\'s Blueprint to Spain\'s Expat Boom"'),
    ('Subtítulo',          '"How to secure your clients\' relocation to Europe and capture premium 25% referral fees — without leaving your desk."'),
    ('Duración',           '50 – 55 minutos + Q&A'),
    ('Formato',            'Webinario en vivo (Zoom / Teams) con grabación'),
    ('Presentadores',      '2–3 Agentes de RE/MAX Inmomás (americanos/canadienses viviendo en España)'),
    ('Partners invitados', 'Fuster & Associates (Legal) · UCI (Financiación) · Inmomás Holidays (Rentas) · Smbiotica (Marketing)'),
    ('Audiencia objetivo', 'Realtors y Broker Associates de EE.UU. y Canadá'),
    ('Herramienta visual', 'Presentación de 16 diapositivas (PowerPoint / Canva)'),
]

t1 = doc.add_table(rows=1 + len(ficha_data), cols=2)
t1.alignment = WD_TABLE_ALIGNMENT.LEFT
t1.style = 'Table Grid'
set_table_borders(t1)

# Encabezado
hdr = t1.rows[0].cells
set_cell_bg(hdr[0], 'C8102E')
set_cell_bg(hdr[1], 'C8102E')
for ci, txt in enumerate(('Campo', 'Detalle')):
    run = hdr[ci].paragraphs[0].add_run(txt)
    run.bold = True
    run.font.color.rgb = WHITE
    run.font.size = Pt(10)
    hdr[ci].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

for i, (campo, detalle) in enumerate(ficha_data, start=1):
    row = t1.rows[i].cells
    if i % 2 == 0:
        set_cell_bg(row[0], 'FFF0F0')
        set_cell_bg(row[1], 'FFF0F0')
    run_c = row[0].paragraphs[0].add_run(campo)
    run_c.bold = True
    run_c.font.size = Pt(9.5)
    run_c.font.color.rgb = RED
    run_d = row[1].paragraphs[0].add_run(detalle)
    run_d.font.size = Pt(9.5)
    run_d.font.color.rgb = BLACK

# Anchos de columna
t1.columns[0].width = Cm(4.5)
t1.columns[1].width = Cm(12.0)

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════════
# CRONOGRAMA
# ══════════════════════════════════════════════════════════════════════════════
add_paragraph(doc, '⏱️  CRONOGRAMA', bold=True, color=RED, size=13,
              space_before=10, space_after=6)

crono_data = [
    ('1', 'Apertura, Bienvenida y Presentación',    '00:00 – 08:00', 'Agentes RE/MAX Inmomás'),
    ('2', 'El Gran Éxodo Norteamericano (Datos)',    '08:00 – 20:00', 'Agentes RE/MAX Inmomás'),
    ('3', 'El Ecosistema 360° – Partners invitados', '20:00 – 35:00', 'Partners (1.5–2 min c/u)'),
    ('4', 'La Fórmula Financiera: Tu 25%',           '35:00 – 43:00', 'Agentes RE/MAX Inmomás'),
    ('5', 'El Portal, CTA y Q&A en vivo',            '43:00 – 55:00', 'Agentes RE/MAX Inmomás'),
]

t2 = doc.add_table(rows=1 + len(crono_data), cols=4)
t2.alignment = WD_TABLE_ALIGNMENT.LEFT
t2.style = 'Table Grid'
set_table_borders(t2)

crono_hdrs = ('Bloque', 'Tema', 'Minutos', 'Presentador')
for ci, h in enumerate(crono_hdrs):
    c = t2.rows[0].cells[ci]
    set_cell_bg(c, 'C8102E')
    run = c.paragraphs[0].add_run(h)
    run.bold = True
    run.font.color.rgb = WHITE
    run.font.size = Pt(10)
    c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

for i, row_data in enumerate(crono_data, start=1):
    row = t2.rows[i].cells
    if i % 2 == 0:
        for c in row: set_cell_bg(c, 'FFF5F5')
    for ci, txt in enumerate(row_data):
        run = row[ci].paragraphs[0].add_run(txt)
        run.font.size = Pt(9.5)
        if ci == 0:
            run.bold = True
            run.font.color.rgb = RED
        else:
            run.font.color.rgb = BLACK
        if ci in (0, 2):
            row[ci].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

t2.columns[0].width = Cm(1.5)
t2.columns[1].width = Cm(7.5)
t2.columns[2].width = Cm(3.0)
t2.columns[3].width = Cm(4.5)

doc.add_paragraph()
add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# BLOQUE 1 — APERTURA Y BIENVENIDA
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, 'BLOQUE 1 — APERTURA Y BIENVENIDA')
add_paragraph(doc, '⏰ 00:00 – 08:00 | Presentan: Agentes de RE/MAX Inmomás',
              italic=True, color=GREY, size=10)

# SLIDE 1
add_heading2(doc, '🎬 SLIDE 1: PORTADA — "Beyond Borders"')
add_instruction(doc,
    '[Acción de producción: La pantalla muestra la portada con música de fondo '
    'suave. El presentador entra en cámara sonriendo.]')
add_script(doc,
    '"Hello, everyone, and welcome! I\'m so glad you\'re here today. My name is [Nombre], '
    'and on behalf of the entire RE/MAX Inmomás International team, I want to genuinely '
    'thank you for carving out this hour from your busy schedule.\n\n'
    'I know that as a Realtor, your time is your most valuable asset. So let me make you '
    'a promise right now: by the end of this session, you\'re going to walk away with a '
    'completely new revenue stream that requires zero new licensing, zero new market '
    'knowledge, and zero extra hours of driving clients around town.\n\n'
    'This is a Realtor-to-Realtor conversation. No sales pitch. No corporate speak. Just '
    'two colleagues who found something remarkable — and want to share it with you."',
    speaker='GUIÓN (Agente 1 — voz principal de apertura):')

add_paragraph(doc, '🇪🇸 Versión en español (opcional):',
              bold=True, color=RGBColor(0x22, 0x66, 0xAA), size=10, space_before=6)
add_script(doc,
    '"Bienvenidos a todos. Soy [Nombre] y, en nombre de todo el equipo de RE/MAX Inmomás '
    'International, gracias por estar aquí. Os prometo que esta hora será de las más '
    'rentables de vuestra semana."')

# SLIDE 2
add_heading2(doc, '🎬 SLIDE 2: PRESENTACIÓN DE LOS PONENTES — "Meet Your Hosts"')
add_instruction(doc,
    '[Diapositiva con fotos profesionales de los agentes, sus banderas de origen '
    'y de España, nombre y cargo.]')
add_script(doc,
    '"Before we get into the big numbers, let me tell you who we are — because I think '
    'that\'s actually the most important part.\n\n'
    'My name is [Nombre completo]. I spent [X] years as a licensed Realtor in '
    '[California / Florida / Texas / etc.]. I worked with buyers, sellers, investors — '
    'I know the grind, I know the paperwork, I know what it takes to close a deal in a '
    'competitive market.\n\n'
    'Three years ago, I made the move to Spain. And I want to be honest with you: it '
    'wasn\'t a retirement plan, it was the best business decision of my life. Today I '
    'specialize in helping North American buyers find their perfect property on the Costa '
    'Blanca — and I do it under the RE/MAX brand, the most trusted name in international '
    'real estate."',
    speaker='GUIÓN (Agente 1 — se presenta a sí mismo):')

add_script(doc,
    '"And I\'m [Nombre completo]. I was a Broker Associate in [Toronto / Vancouver / '
    'Montreal] for [X] years. My clients were high-net-worth buyers who knew what they '
    'wanted. The thing that finally pushed me to Spain was a combination of the cost of '
    'living, the lifestyle, and — quite honestly — those Canadian winters.\n\n'
    'Today, my spouse and I live in [Alicante / Valencia / Murcia], our kids go to an '
    'international school, and I spend my working hours connecting people with '
    'life-changing opportunities in one of the most beautiful places on earth.\n\n'
    'We are not corporate representatives. We are you — Realtors who made the leap. And '
    'that\'s exactly why we can help your clients make it too."',
    speaker='GUIÓN (Agente 2 — se presenta):')

add_instruction(doc, '[Pausa de 5 segundos. El tono se vuelve cálido y cómplice.]')
add_script(doc,
    '"We\'ve been in your exact position: watching clients talk about moving abroad, not '
    'knowing how to help them, and quietly losing that relationship. Today we\'re going '
    'to fix that. Forever."')

# SLIDE 3
add_heading2(doc, '🎬 SLIDE 3: TESTIMONIO DE VIDA — "Why We Made the Leap"')
add_instruction(doc,
    '[Fotos personales: familia en la playa, terraza mediterránea, oficina con vistas '
    'al mar, mercado local.]')
add_script(doc,
    '"Let me take 60 seconds to paint you a picture of my typical Tuesday.\n\n'
    'I wake up at 7:30 AM. There\'s sunlight coming through the window. I have breakfast '
    'on my terrace with a view of the Mediterranean. By 9 AM I\'m at the office — and I '
    'mean a proper office, with a team, with systems, with the full RE/MAX infrastructure '
    'behind me. I spend my morning on calls with clients in California, Texas, New York. '
    'By 1 PM I\'m done with most of my digital meetings.\n\n'
    'Then I drive 8 minutes to the beach for lunch.\n\n'
    'That is the life I\'m selling. And the thing is — it\'s my actual life. I don\'t '
    'need to exaggerate, I just need to show it."',
    speaker='GUIÓN (Agente 1 — testimonio emocional):')

add_script(doc,
    '"For me, the tipping point was healthcare. In Canada, I paid a fortune in taxes and '
    'still waited months for specialist appointments. Here, my entire family has '
    'world-class private healthcare coverage for less than $200 a month.\n\n'
    'My clients from Canada always ask me: \'Is it really that good?\' And I show them '
    'my utility bills, my grocery receipts, my kids\' school grades — and then I invite '
    'them to come see it for themselves. The VIP tour we organize does the closing. Not '
    'me. Spain does the closing."',
    speaker='GUIÓN (Agente 2 — testimonio canadiense):')

# SLIDE 4
add_heading2(doc, '🎬 SLIDE 4: LA AGENDA — "Today\'s Playbook"')
add_script(doc,
    '"Here\'s what we\'re going to cover today — and I promise we\'ll stay tight on time '
    'because I know you have clients to call.\n\n'
    'First, we\'ll show you the data — the migration numbers that prove this isn\'t a '
    'trend, it\'s a structural shift. Second, you\'re going to meet our full ecosystem of '
    'partners: a legal team, a mortgage specialist, a vacation rental management company, '
    'and our marketing team — because we don\'t just sell houses, we deliver a complete '
    'transition service. Third, we\'ll break down the commission math — exactly how your '
    '25% works and what it looks like on a real deal. And finally, we\'ll do a live demo '
    'of our partner portal so you can see exactly how simple it is to send us a referral.\n\n'
    'Any questions along the way, drop them in the chat — we\'ll address everything in '
    'the Q&A at the end.\n\n'
    'Let\'s get started."',
    speaker='GUIÓN:')

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# BLOQUE 2 — EL GRAN ÉXODO NORTEAMERICANO
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, 'BLOQUE 2 — EL GRAN ÉXODO NORTEAMERICANO')
add_paragraph(doc, '⏰ 08:00 – 20:00 | Presentan: Agentes de RE/MAX Inmomás',
              italic=True, color=GREY, size=10)

# SLIDE 5
add_heading2(doc, '🎬 SLIDE 5: "The North American Exodus" — Los Números que Cambian Todo')
add_instruction(doc,
    '[Diapositiva de alto impacto: mapa animado de EE.UU. y Canadá → España, con cifras grandes.]')
add_script(doc,
    '"Let me ask you something. In the last 12 months, how many of your clients have '
    'mentioned thinking about moving abroad? Maybe to Mexico, Costa Rica, Portugal, Spain?\n\n'
    'Go ahead and drop a number in the chat right now. I\'m genuinely curious.\n\n'
    '[Pausa de 15 segundos para respuestas del chat.]\n\n'
    'Right. Every single one of you has had that conversation. And here\'s the problem: '
    'most of us, when that client says \'I\'m thinking about Spain,\' we smile, we say '
    '\'wow, how exciting\' — and then we lose them. Because we don\'t have the '
    'infrastructure to help them.\n\n'
    'Until today.\n\n'
    'Now look at these numbers."',
    speaker='GUIÓN:')

add_instruction(doc, '[Transición a estadísticas — leer cada una con énfasis dramático:]')

stats = [
    ('🔢', 'Over 40 million Americans have considered relocating abroad — that\'s not a fringe idea, '
           'that\'s a movement. [Fuente: Gallup / State Department]'),
    ('🔢', 'Spain received a record 3.9 million international residents in 2023, with North Americans '
           'among the fastest-growing segments. [Fuente: INE España]'),
    ('🔢', 'Searches for \'move to Spain\' and \'buy property in Spain\' from the US have increased '
           'by 340% in the last three years. [Fuente: Google Trends]'),
    ('🔢', 'For Canadians specifically, Spain\'s digital nomad visa and golden visa program have '
           'triggered a 35% surge in relocation inquiries since 2022. [Fuente: Fuster & Associates / UCI]'),
    ('🔢', 'The Costa Blanca alone — our market — saw over €2.1 billion in international real estate '
           'transactions in 2023, with North Americans in the top 5 buyer nationalities.'),
]
for icon, stat in stats:
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.left_indent = Cm(1.5)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(f'{icon}  {stat}')
    run.italic = True
    run.font.size = Pt(10.5)
    run.font.color.rgb = BLACK

add_script(doc,
    '"These are not projections. These are not marketing numbers. These are documented, '
    'official statistics. The demand is here. The question is: who is going to capture it?"')

# SLIDE 6
add_heading2(doc, '🎬 SLIDE 6: "Why Spain? Why NOW?" — Los Motivos que Impulsan la Migración')
add_instruction(doc,
    '[Infografía comparativa: EE.UU./Canadá vs España en costo de vida, salud, seguridad, clima.]')
add_script(doc,
    '"Now let\'s talk about WHY they\'re going to Spain specifically. Because your clients are '
    'going to ask you — and you need to have these answers ready.\n\n'
    'There are five core drivers. I call them the Five Forces of the Spanish Expat Boom."',
    speaker='GUIÓN:')

forces = [
    ('🟡 Fuerza 1 — Costo de vida:',
     '"First: cost of living. The average North American family moving from a major metropolitan '
     'area saves between 40% and 60% on their monthly expenses. We\'re talking about groceries, '
     'utilities, transportation, dining out — everything. A €350,000 beachfront apartment in '
     'Alicante would cost over a million in Miami. That\'s not an estimate, that\'s a listing '
     'comparison I can show you right now."'),
    ('🟡 Fuerza 2 — Sanidad:',
     '"Second: healthcare. Spain ranks number 7 in the world for healthcare quality [WHO], '
     'compared to the US at number 37. A private comprehensive health plan for a family of four '
     'in Spain costs approximately €250 to €400 per month. In the United States, that same '
     'coverage is $2,000 or more. For your clients who are pre-retirement or dealing with high '
     'insurance premiums, this alone justifies the move."'),
    ('🟡 Fuerza 3 — Seguridad:',
     '"Third: safety. Spain is consistently ranked among the top 10 safest countries in the '
     'world [Global Peace Index]. Gun violence, as a risk factor, is virtually non-existent. '
     'For families with children, for retirees, for anyone concerned about personal security '
     '— Spain is a haven."'),
    ('🟡 Fuerza 4 — Clima:',
     '"Fourth: climate. The Costa Blanca — which is our primary market — has over 320 days of '
     'sunshine per year. Average winter temperatures are 14°C to 18°C — which is 57 to 65°F. '
     'For our Canadian clients especially, this is transformational. They\'re trading six months '
     'of darkness and frozen pipes for a Mediterranean lifestyle. No contest."'),
    ('🟡 Fuerza 5 — Visados y residencia:',
     '"And fifth — and this is what\'s really driving the current wave — Spain\'s visa landscape '
     'has never been more favorable for North Americans.\n\n'
     'The Non-Lucrative Visa is perfect for retirees and those with passive income. The Digital '
     'Nomad Visa, launched in 2023, lets remote workers live in Spain legally for up to 5 years. '
     'The Golden Visa allows property investors of €500,000 or more to obtain full family residency.\n\n'
     'Our legal partner — Fuster & Associates, whom you\'ll meet shortly — handles all of this. '
     'Your clients don\'t need to figure it out alone. They just need to call us."'),
]
for label, text in forces:
    add_paragraph(doc, label, bold=True, color=RGBColor(0xC8, 0x86, 0x00), size=11, space_before=8)
    add_script(doc, text)

# SLIDE 7
add_heading2(doc, '🎬 SLIDE 7: "Your Clients Are Already Looking" — El Mercado que Ya Existe')
add_instruction(doc,
    '[Pantalla dividida: búsquedas de Google + perfiles de compradores tipo]')
add_script(doc,
    '"Here\'s the thing I want you to really internalize: your clients are NOT waiting for your '
    'permission to explore this. They are already googling \'how to move to Spain,\' they\'re '
    'already in Facebook groups, they\'re already watching YouTube videos of expats in Valencia '
    'and Alicante.\n\n'
    'The question is not IF they will explore it. The question is: will you be the person who '
    'guides them, or will they find someone else online and disappear from your pipeline forever?\n\n'
    'We are giving you the tools, the team, and the infrastructure to be THAT person.\n\n'
    'Let\'s talk about how."',
    speaker='GUIÓN:')

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# BLOQUE 3 — EL ECOSISTEMA 360°
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, 'BLOQUE 3 — EL ECOSISTEMA 360°')
add_paragraph(doc, '⏰ 20:00 – 35:00 | Hablan: Partners Invitados',
              italic=True, color=GREY, size=10)

# SLIDE 8
add_heading2(doc, '🎬 SLIDE 8: INTRODUCCIÓN AL ECOSISTEMA')
add_script(doc,
    '"Now, the number one fear of a North American buyer going into a foreign market is: \'What '
    'if something goes wrong? What if I\'m scammed? What if I pay taxes I don\'t know about? '
    'What if the property title isn\'t clean?\'\n\n'
    'This fear is completely legitimate. And it\'s exactly why we built what we call our 360° '
    'Ecosystem.\n\n'
    'We don\'t sell properties in isolation. We deliver a complete, end-to-end service covering '
    'legal, financial, property management, and marketing support — all under one coordinated team.\n\n'
    'I\'d like to introduce you to the specialists who make this possible. Each of them is going '
    'to take about two minutes to explain what they do and why it matters for your clients. Pay '
    'attention — because this ecosystem is what makes our offer completely unique in the market.\n\n'
    'Let me start with perhaps the most critical piece: legal security."',
    speaker='GUIÓN (Agente 1 — introduce el bloque):')

# SLIDE 9
add_heading2(doc, '🎬 SLIDE 9: PARTNER LEGAL — Fuster & Associates')
add_instruction(doc, '[Logo de Fuster & Associates · 2 minutos]')
add_script(doc,
    '"Hello everyone, I\'m [Nombre] from Fuster & Associates. We are a bilingual law firm '
    'based in Alicante, and for the past [X] years we have exclusively specialized in assisting '
    'international buyers — particularly from the United States, Canada, and the United Kingdom '
    '— in legally securing their property purchase and their residency in Spain.\n\n'
    'When your client decides to buy in Spain, here\'s what our firm handles:\n\n'
    'Number one — the NIE number, which is the Spanish tax ID that every non-resident buyer '
    'needs. We have it done in days, not weeks.\n\n'
    'Number two — due diligence on every property: title deeds, outstanding debts, urban planning '
    'compliance. Your client will never buy a property with hidden surprises.\n\n'
    'Number three — the full drafting and review of purchase contracts, negotiated in English.\n\n'
    'Number four — residency applications. Whether it\'s a non-lucrative visa, a digital nomad '
    'visa, or a Golden Visa, our immigration team has a 98% success rate.\n\n'
    'Our job is to make the legal process completely invisible to your client — they experience '
    'it as smooth, safe, and professional. You, as the referring Realtor, look like a hero '
    'because you sent them to the right team.\n\n'
    'We look forward to protecting your clients\' most important investment."',
    speaker='GUIÓN (Representante de Fuster):')

add_instruction(doc, '[Agente 1 regresa:]')
add_script(doc,
    '"Thank you. Fuster is the reason our buyers sleep soundly at night. Now let\'s talk about '
    'something else that keeps buyers awake: how to pay for the property."')

# SLIDE 10
add_heading2(doc, '🎬 SLIDE 10: PARTNER FINANCIERO — UCI (Unión de Créditos Inmobiliarios)')
add_instruction(doc, '[Logo de UCI · 2 minutos]')
add_script(doc,
    '"Thank you. I\'m [Nombre] from UCI — Unión de Créditos Inmobiliarios. We are one of '
    'Spain\'s leading mortgage specialists, and we have a dedicated product line for '
    'non-resident buyers, including Americans and Canadians.\n\n'
    'There\'s a common misconception that foreigners can\'t get a mortgage in Spain. That is '
    'simply not true.\n\n'
    'Non-resident buyers from the US and Canada can access mortgages for up to 70% of the '
    'property value at very competitive fixed rates — currently in the range of 2.8% to 3.5% '
    '— which are substantially lower than current US mortgage rates.\n\n'
    'Our process is designed for international clients: we conduct income verification based on '
    'US or Canadian tax returns, we have English-speaking advisors, and we can issue a mortgage '
    'pre-approval in as little as 48 to 72 hours.\n\n'
    'Why does this matter for you as a Realtor? Because many of your clients who say \'I\'d '
    'love to buy in Spain but I can\'t afford to pay cash\' actually CAN buy in Spain with '
    'financing. We remove the cash-only barrier.\n\n'
    'We are here to make sure price is never the reason your client says no."',
    speaker='GUIÓN (Representante de UCI):')

add_instruction(doc, '[Agente 2 regresa:]')
add_script(doc,
    '"Remarkable, right? European mortgage rates that are significantly lower than what your '
    'clients are seeing at home. Now, here\'s a question I get a lot: \'What if my client wants '
    'to buy the property but only live there part of the year? Can they generate income from it?\' '
    'Absolutely — and here\'s how."')

# SLIDE 11
add_heading2(doc, '🎬 SLIDE 11: PARTNER DE GESTIÓN — Inmomás Holidays')
add_instruction(doc, '[Logo de Inmomás Holidays · 2 minutos]')
add_script(doc,
    '"Hi everyone, I\'m [Nombre] from Inmomás Holidays — we are the property management and '
    'vacation rental arm of the RE/MAX Inmomás group.\n\n'
    'Many North American buyers are buying in Spain not just as a primary residence, but as an '
    'investment — they want to use the property 4 to 6 weeks a year and have it generating '
    'income the rest of the time. That\'s exactly what we manage.\n\n'
    'Here\'s what we do: we handle the tourist rental license — which is required by Spanish law '
    'and quite complex to obtain. We list the property on all major platforms — Airbnb, '
    'Booking.com, VRBO. We manage check-in, cleaning, maintenance, and guest communication. '
    'Our clients receive a monthly report and a bank transfer, and they don\'t lift a finger.\n\n'
    'What are the yields? On a well-located Costa Blanca property, we consistently deliver net '
    'rental yields of between 5% and 8% per year after our management fee.\n\n'
    'So your client\'s property doesn\'t just appreciate — it pays for itself while they\'re '
    'not there. That\'s a very compelling story to tell your investor clients."',
    speaker='GUIÓN (Representante de Inmomás Holidays):')

add_instruction(doc, '[Agente 1 regresa:]')
add_script(doc,
    '"Excellent. And now, finally, I want you to understand how we support YOU as the referring '
    'partner — specifically with marketing tools that make it incredibly easy to introduce this '
    'opportunity to your clients."')

# SLIDE 12
add_heading2(doc, '🎬 SLIDE 12: PARTNER DE MARKETING — Smbiotica')
add_instruction(doc, '[Logo de Smbiotica · 2 minutos]')
add_script(doc,
    '"Hello! I\'m [Nombre] from Smbiotica — we are the digital strategy and marketing partner '
    'for RE/MAX Inmomás International.\n\n'
    'Our role is to make sure that you — the referring Realtor — have everything you need to '
    'generate interest in Spain without doing any heavy lifting.\n\n'
    'What does that look like in practice? We provide you with co-branded landing pages — '
    'personalized with your name and photo — that you can share directly with your client '
    'database or post on social media. We design bilingual email campaigns in English and '
    'Spanish. We produce social media content — reels, graphics, statistics — that you can '
    'literally copy and paste into your Instagram or LinkedIn.\n\n'
    'We also run targeted advertising campaigns in your local market — in cities like Miami, '
    'Los Angeles, Toronto, New York — that generate pre-qualified leads who are already '
    'researching Spain. When a lead comes in from your territory, it gets assigned to you.\n\n'
    'You don\'t need to become a Spain expert. You need to make one introduction, and we make '
    'you look like one.\n\n'
    'That is our commitment to you as a partner."',
    speaker='GUIÓN (Representante de Smbiotica):')

# SLIDE 13
add_heading2(doc, '🎬 SLIDE 13: EL VIP PROPERTY TOUR — La Experiencia que Cierra la Venta')
add_instruction(doc,
    '[Fotos: clientes en tour de propiedades, cenas en restaurantes, vista al Mediterráneo]')
add_script(doc,
    '"I want to close this section with something that I think is the most powerful sales tool '
    'in our entire program — and it costs your client nothing extra.\n\n'
    'It\'s called the VIP Property Tour.\n\n'
    'When a client is seriously interested, we invite them to Spain for a 4 to 5 day fully '
    'organized visit. We pick them up from the airport. We take them to carefully selected '
    'properties. We arrange meetings with the legal team and the mortgage specialist. We organize '
    'dinners where they meet other American and Canadian expats who already live here — people '
    'they can ask \'is this really as good as it sounds?\' And the answer, every single time, '
    'is: \'Yes. And I wish I\'d done it sooner.\'\n\n'
    'The close rate on clients who come on a VIP tour is over 70%. They arrive as prospects. '
    'They leave as buyers.\n\n'
    'You make the introduction. We do the rest. You earn your 25%."',
    speaker='GUIÓN (Agente 2):')

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# BLOQUE 4 — LA FÓRMULA FINANCIERA
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, 'BLOQUE 4 — LA FÓRMULA FINANCIERA')
add_paragraph(doc, '⏰ 35:00 – 43:00 | Presentan: Agentes de RE/MAX Inmomás',
              italic=True, color=GREY, size=10)

# SLIDE 14
add_heading2(doc, '🎬 SLIDE 14: "The Commission Blueprint" — Tu 25%')
add_instruction(doc,
    '[Infografía clara con el flujo de comisión: Buyer → 5% Fee → 25% a Realtor Referente]')
add_script(doc,
    '"Alright. This is the part everyone\'s been waiting for. Let\'s talk money.\n\n'
    'Here\'s how the commission structure works — and I\'m going to be 100% transparent '
    'because I know that\'s what you need as a professional.\n\n'
    'In Spain, our team manages the full buyer-side service. We charge the buyer a comprehensive '
    'service fee of 5% of the property purchase price. This fee covers everything: property '
    'search, legal coordination, financing assistance, negotiation, closing, and post-sale support.\n\n'
    'As the referring Realtor — meaning you introduced us to your client — you receive 25% of '
    'that total fee.\n\n'
    'Let me do the math for you."',
    speaker='GUIÓN (Agente 1):')

# SLIDE 15 — TABLA DE GANANCIAS
add_heading2(doc, '🎬 SLIDE 15: TABLA DE GANANCIAS REALES — "Real Earnings"')
add_instruction(doc, '[Tabla grande y visual con tres ejemplos de propiedades]')
add_script(doc,
    '"Let\'s look at three real scenarios:"',
    speaker='GUIÓN:')

# Tabla de ganancias
earnings_data = [
    ('Apartamento en playa (Alicante)', '€350,000', '~$380,000 USD', '€17,500', '€4,375'),
    ('Villa premium con piscina (Golden Visa)', '€600,000', '~$652,000 USD', '€30,000', '€7,500'),
    ('Villa de lujo en la costa', '€1,200,000', '~$1,304,000 USD', '€60,000', '€15,000'),
]

t3 = doc.add_table(rows=1 + len(earnings_data), cols=5)
t3.alignment = WD_TABLE_ALIGNMENT.LEFT
t3.style = 'Table Grid'
set_table_borders(t3)

earn_hdrs = ('Propiedad', 'Precio (€)', 'Equivalente USD', 'Fee 5%', 'Tu 25% ✓')
for ci, h in enumerate(earn_hdrs):
    c = t3.rows[0].cells[ci]
    set_cell_bg(c, 'C8102E')
    run = c.paragraphs[0].add_run(h)
    run.bold = True
    run.font.color.rgb = WHITE
    run.font.size = Pt(10)
    c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

for i, row_data in enumerate(earnings_data, start=1):
    row = t3.rows[i].cells
    bg = 'FFF0F0' if i % 2 == 0 else 'FFFFFF'
    for ci, txt in enumerate(row_data):
        set_cell_bg(row[ci], bg)
        run = row[ci].paragraphs[0].add_run(txt)
        run.font.size = Pt(10)
        row[ci].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if ci == 4:   # columna de ganancia
            run.bold = True
            run.font.color.rgb = RED
        elif ci == 0:
            run.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
            row[ci].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
        else:
            run.font.color.rgb = BLACK

t3.columns[0].width = Cm(5.5)
t3.columns[1].width = Cm(2.5)
t3.columns[2].width = Cm(3.0)
t3.columns[3].width = Cm(2.0)
t3.columns[4].width = Cm(2.0)

doc.add_paragraph()

add_script(doc,
    '"Now think about this: how many hours do you currently spend to earn $7,500 in your local '
    'market? Showings, open houses, negotiations, inspections, contingencies, appraisals...\n\n'
    'With us, you spend five minutes filling out our partner portal. We handle the rest. And '
    'you get paid."')

add_script(doc,
    '"I\'m not suggesting you abandon your local market. Absolutely not. We\'re not asking you '
    'to change anything about your business. What we ARE offering is a new, parallel income '
    'stream that activates every time one of your clients expresses interest in Spain — which, '
    'based on the chat messages you\'re sending right now, happens more often than you might think.\n\n'
    'This isn\'t a side hustle. This is a referral network upgrade."',
    speaker='GUIÓN (continuación — tono cómplice):')

# SLIDE 16
add_heading2(doc, '🎬 SLIDE 16: EL PROCESO — "How Simple Is It?"')
add_instruction(doc,
    '[Infografía de 4 pasos: 1. Introduce → 2. Register → 3. We Handle → 4. You Get Paid]')
add_script(doc,
    '"Here\'s the entire process in four steps:\n\n'
    'Step one: your client mentions Spain. You say: \'I actually have the perfect team for that. '
    'Let me connect you.\'\n\n'
    'Step two: you log into our partner portal — which takes two minutes to register — and you '
    'enter your client\'s basic information.\n\n'
    'Step three: we take over completely. Your client is contacted by our bilingual team within '
    '24 hours. We manage the search, the tours, the legal process, the mortgage, everything. '
    'You can track every step in real time on your dashboard — like a Kanban board for your referrals.\n\n'
    'Step four: the deal closes. You receive your referral fee — in your currency of choice, via '
    'international wire transfer, with a formal referral agreement signed digitally.\n\n'
    'That\'s it. Four steps. Zero additional licensing. Zero extra hours.\n\n'
    'You just extended your business to Europe."',
    speaker='GUIÓN:')

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# BLOQUE 5 — DEMO DEL PORTAL Y CIERRE
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, 'BLOQUE 5 — DEMO DEL PORTAL Y CIERRE')
add_paragraph(doc, '⏰ 43:00 – 55:00 | Presentan: Agentes de RE/MAX Inmomás',
              italic=True, color=GREY, size=10)

# SLIDE 17
add_heading2(doc, '🎬 SLIDE 17: DEMO EN VIVO DEL PORTAL PARTNER')
add_instruction(doc,
    '[Compartir pantalla: demostración del portal web inmomas-international.com/app.html]')
add_script(doc,
    '"Let me show you exactly what you\'ll be working with. I\'m going to share my screen now.\n\n'
    'This is our RE/MAX Inmomás International partner portal. [Mostrar pantalla de login / dashboard]\n\n'
    'Here\'s what you see when you log in as a partner Realtor: your personal dashboard with all '
    'your referred clients, their current status in the buying process — whether they\'re in the '
    'initial consultation phase, the property search phase, the offer phase, or post-signing — '
    'and a direct communication channel with your assigned agent here in Spain.\n\n'
    'You don\'t need to send emails asking \'hey, what happened with my client?\' You can see it. '
    'In real time. Right here.\n\n'
    'On the right side, you\'ll see your earnings tracker — every referral, every pending '
    'commission, every payment processed.\n\n'
    '[Mostrar sección de documentos]\n\n'
    'Here\'s your co-branded marketing toolkit: your personalized landing page link, your '
    'bilingual email templates, your social media graphics — ready to download and share in minutes.\n\n'
    '[Mostrar sección de acuerdo de referidos]\n\n'
    'And here\'s the referral agreement — pre-signed by RE/MAX Inmomás, with space for your '
    'digital signature. It\'s a legal document that protects you, protects your client, and '
    'defines your fee. You\'ll have it in your inbox within 24 hours of submitting your first referral.\n\n'
    'This is a professional system built for professional Realtors."',
    speaker='GUIÓN (Agente 2):')

# SLIDE 18
add_heading2(doc, '🎬 SLIDE 18: CALL TO ACTION — "Your Next Step"')
add_instruction(doc,
    '[Diapositiva con QR code, URL del portal, y oferta especial para asistentes al webinario]')
add_script(doc,
    '"We\'re going to open up for questions in just a moment. But first, let me tell you what '
    'we\'d like you to do right now, before you close this tab and go back to your day.\n\n'
    'Step one: Scan the QR code on your screen — or visit [URL] — and register as an official '
    'partner. It takes less than two minutes. It costs you absolutely nothing.\n\n'
    'Step two: download your bilingual Marketing Kit. It includes your co-branded landing page, '
    'three ready-to-send email templates, and five social media posts you can publish this week.\n\n'
    'Step three: think of one client — just one — who has mentioned Spain. Send me their name '
    'in the chat right now. Not a commitment. Just a name. I\'ll personally follow up with you '
    'after the webinar.\n\n'
    'And that\'s it. That\'s all we need from you to get started.\n\n'
    '[Pausa emocional]\n\n'
    'I want to close with something personal. Before I moved to Spain, I looked at opportunities '
    'like this one and I thought: \'Sounds too good to be true.\' I understand that skepticism. '
    'I really do.\n\n'
    'But here\'s what I know now that I didn\'t know then: the North American expat market in '
    'Spain is not a niche. It\'s not a trend. It\'s a generational movement — millions of people '
    'redefining what quality of life means, and choosing Spain to live it.\n\n'
    'You have clients who are part of that movement. We have the platform, the team, and the '
    'track record to serve them at the highest level.\n\n'
    'Together, we win.\n\n'
    'Thank you so much for being here today. Let\'s open up for Q&A."',
    speaker='GUIÓN (Agente 1 — cierre poderoso):')

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# Q&A — PREGUNTAS FRECUENTES
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, '💬 SESIÓN Q&A — PREGUNTAS FRECUENTES Y RESPUESTAS MODELO')
add_paragraph(doc, '⏰ 48:00 – 55:00', italic=True, color=GREY, size=10)

qas = [
    (
        '"How does my client pay you if they\'re buying in euros?"',
        '"Great question. All transactions are done in euros — that\'s standard for Spanish '
        'property. Most of our North American clients use currency exchange specialists like '
        'Wise or OFX to transfer funds at competitive rates. UCI, our mortgage partner, also '
        'supports US/Canadian taxpayers with euro-denominated financing. We provide full guidance '
        'on this — your client won\'t have to figure it out alone."'
    ),
    (
        '"Do I need to be licensed in Spain to receive a referral fee?"',
        '"No. In Spain, the real estate agency system does not require the same licensing '
        'structure as NAR in the US or CREA in Canada. The referral fee is paid to you as a '
        'business-to-business service fee under a referral agreement — not as a commission split. '
        'We recommend you verify with your own broker that this is permissible under your '
        'brokerage\'s policy, which in the vast majority of cases it is for international referrals. '
        'Our legal team can provide documentation to support this if needed."'
    ),
    (
        '"What if my client decides not to buy? Do I still get paid?"',
        '"The referral fee is paid upon successful closing. If the client decides not to buy, '
        'there is no fee — from us or from you. There are no upfront costs, no retainers, no '
        'risk to you whatsoever. You invest zero. If it closes, you earn. That\'s the deal."'
    ),
    (
        '"How do I know my client is protected legally?"',
        '"Our legal partner — Fuster & Associates — has been protecting international buyers in '
        'Spain for over [X] years. They conduct full due diligence on every property: title check, '
        'urban planning verification, outstanding debts, compliance with all local regulations. '
        'Every purchase goes through an independent notary. Your client is protected at every step, '
        'and you can communicate directly with the legal team in English."'
    ),
    (
        '"What are the typical taxes a buyer has to pay in Spain?"',
        '"For resale properties, buyers pay a transfer tax — called ITP — which varies by region, '
        'typically between 8% and 10% of the purchase price. For new builds, it\'s VAT at 10% '
        'plus 1.5% stamp duty. These taxes are factored into every budget we provide to clients '
        'from day one — no surprises. Fuster\'s team provides a complete cost breakdown before '
        'any offer is made."'
    ),
    (
        '"Can Canadian clients also get the Golden Visa?"',
        '"Absolutely. The Golden Visa program is available to non-EU citizens regardless of '
        'nationality — Americans, Canadians, and others. A minimum real estate investment of '
        '€500,000 unlocks full family residency, including for spouse and dependent children. '
        'Processing time is currently 3 to 6 months. Fuster & Associates handles the entire '
        'application."'
    ),
]

for i, (pregunta, respuesta) in enumerate(qas, start=1):
    # Número y pregunta
    p_q = doc.add_paragraph()
    p_q.paragraph_format.space_before = Pt(10)
    p_q.paragraph_format.space_after  = Pt(3)
    run_num = p_q.add_run(f'Pregunta frecuente {i}:  ')
    run_num.bold = True
    run_num.font.size = Pt(11)
    run_num.font.color.rgb = RED
    run_preg = p_q.add_run(pregunta)
    run_preg.italic = True
    run_preg.font.size = Pt(11)
    run_preg.font.color.rgb = RGBColor(0x22, 0x22, 0x66)

    # Respuesta
    p_r = doc.add_paragraph()
    p_r.paragraph_format.left_indent  = Cm(1.0)
    p_r.paragraph_format.space_before = Pt(3)
    p_r.paragraph_format.space_after  = Pt(6)
    run_label = p_r.add_run('Respuesta: ')
    run_label.bold = True
    run_label.font.size = Pt(10.5)
    run_label.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    run_resp = p_r.add_run(respuesta)
    run_resp.italic = True
    run_resp.font.size = Pt(10.5)
    run_resp.font.color.rgb = BLACK

add_separator(doc)

# ══════════════════════════════════════════════════════════════════════════════
# CIERRE FORMAL DEL WEBINARIO
# ══════════════════════════════════════════════════════════════════════════════
add_heading1(doc, '🎬 CIERRE FORMAL DEL WEBINARIO')
add_script(doc,
    '"Thank you all so much for your incredible questions and for your energy today. It\'s '
    'conversations like these that remind me why I love this business.\n\n'
    'The recording of today\'s session will be sent to your email within 24 hours. Share it '
    'with colleagues who couldn\'t make it — this opportunity is open to every Realtor in '
    'your network.\n\n'
    'Don\'t forget: scan the QR code, register on the portal, download your Marketing Kit. '
    'Your first referral could be closer than you think.\n\n'
    'And please — reach out to us directly. Our WhatsApp is on screen. Our email is on screen. '
    'We are real people, in a real office, in a real beautiful country — and we genuinely look '
    'forward to working with you.\n\n'
    'Have a wonderful day, wherever you are. Bienvenidos al equipo. Welcome to the team."',
    speaker='GUIÓN (Agente 1 — cierre final):')

# ══════════════════════════════════════════════════════════════════════════════
# POST-WEBINARIO
# ══════════════════════════════════════════════════════════════════════════════
add_separator(doc)
add_paragraph(doc, '📌  POST-WEBINARIO — ACCIONES INMEDIATAS (en las siguientes 2 horas):',
              bold=True, color=RGBColor(0x00, 0x70, 0xC0), size=11, space_before=10)

acciones = [
    'Enviar email de seguimiento con la grabación y el Kit de Marketing.',
    'Contactar vía WhatsApp personal a los asistentes que dejaron su nombre de cliente en el chat.',
    'Publicar en LinkedIn/Instagram: foto de equipo + "Thank you to everyone who joined us today" + link de registro.',
    'Programar el próximo webinario para 3 semanas después y abrir inscripciones inmediatamente.',
]
for n, accion in enumerate(acciones, start=1):
    p = doc.add_paragraph(style='List Number')
    p.paragraph_format.left_indent = Cm(1.0)
    p.paragraph_format.space_after = Pt(3)
    run = p.add_run(accion)
    run.font.size = Pt(10.5)
    run.font.color.rgb = BLACK

add_separator(doc)

# ── Nota final ─────────────────────────────────────────────────────────────────
p_nota = doc.add_paragraph()
p_nota.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_nota.paragraph_format.space_before = Pt(16)
run_n1 = p_nota.add_run(
    'Documento preparado por RE/MAX Inmomás International | Uso interno del equipo de presentación\n'
)
run_n1.italic = True
run_n1.font.size = Pt(9)
run_n1.font.color.rgb = GREY
run_n2 = p_nota.add_run('Versión 2.0 — Guión completo con diálogo detallado')
run_n2.italic = True
run_n2.font.size = Pt(9)
run_n2.font.color.rgb = GREY

# ══════════════════════════════════════════════════════════════════════════════
# GUARDAR
# ══════════════════════════════════════════════════════════════════════════════
output_path = (
    '/Users/maiahonczaryk/Desktop/Proyecto Internacional/'
    'USA - Spain /Presentación B2B/Guion_Webinario_Beyond_Borders.docx'
)
doc.save(output_path)
print(f'✅  Documento guardado en:\n    {output_path}')
