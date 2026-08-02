#!/usr/bin/env python3
"""
Generate an editable Word (.docx) Referral Agreement for
Megagestión Servicios Inmobiliarios / RE/MAX Inmomás.
Bilingual English-Spanish, formatted with professional styling.
"""

import os
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

# ── Colour palette ──
REMAX_BLUE  = RGBColor(0, 61, 165)
REMAX_RED   = RGBColor(225, 27, 34)
CHARCOAL    = RGBColor(33, 37, 41)
GREY        = RGBColor(108, 117, 125)
LIGHT_GREY  = RGBColor(248, 249, 250)
WHITE       = RGBColor(255, 255, 255)

# ── Paths ──
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH   = os.path.join(SCRIPT_DIR, "remax_logo.png")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "Referral_Agreement_Template.docx")

doc = Document()

# ── Page margins ──
for section in doc.sections:
    section.top_margin    = Cm(1.5)
    section.bottom_margin = Cm(1.5)
    section.left_margin   = Cm(2)
    section.right_margin  = Cm(2)

# ── Default font ──
style = doc.styles['Normal']
font  = style.font
font.name  = 'Calibri'
font.size  = Pt(10)
font.color.rgb = CHARCOAL

# ────────────────────────────────────────────
#  HELPER FUNCTIONS
# ────────────────────────────────────────────

def add_logo_header():
    """Add logo + title header."""
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.columns[0].width = Inches(2.5)
    table.columns[1].width = Inches(4.0)

    # Left cell: logo
    cell_left = table.cell(0, 0)
    cell_left.vertical_alignment = 1  # CENTER
    p = cell_left.paragraphs[0]
    if os.path.exists(LOGO_PATH):
        run = p.add_run()
        run.add_picture(LOGO_PATH, width=Inches(1.6))
    else:
        run = p.add_run("RE/MAX Inmomás")
        run.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = REMAX_BLUE

    # Right cell: titles
    cell_right = table.cell(0, 1)
    cell_right.vertical_alignment = 1
    p1 = cell_right.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run1 = p1.add_run("Referral Agreement\nAcuerdo de Referido")
    run1.bold = True
    run1.font.size = Pt(14)
    run1.font.color.rgb = CHARCOAL

    p2 = cell_right.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run2 = p2.add_run("B2B Broker-to-Broker / Colaboración de Corredor a Corredor")
    run2.font.size = Pt(8)
    run2.font.color.rgb = GREY

    # Remove table borders
    for row in table.rows:
        for cell in row.cells:
            tc = cell._tc
            tcPr = tc.get_or_add_tcPr()
            tcBorders = parse_xml(
                '<w:tcBorders %s>'
                '<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
                '<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
                '<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
                '<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
                '</w:tcBorders>' % nsdecls('w')
            )
            tcPr.append(tcBorders)


def add_blue_line():
    """Add a blue horizontal rule."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(8)
    pPr = p._p.get_or_add_pPr()
    pBdr = parse_xml(
        '<w:pBdr %s>'
        '<w:bottom w:val="double" w:sz="6" w:space="1" w:color="003DA5"/>'
        '</w:pBdr>' % nsdecls('w')
    )
    pPr.append(pBdr)


def add_section_title(en_text, es_text):
    """Add a blue section heading in EN / ES."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after  = Pt(4)
    run_en = p.add_run(en_text)
    run_en.bold = True
    run_en.font.size = Pt(11)
    run_en.font.color.rgb = REMAX_BLUE
    run_sep = p.add_run(" / ")
    run_sep.font.size = Pt(11)
    run_sep.font.color.rgb = GREY
    run_es = p.add_run(es_text)
    run_es.bold = True
    run_es.font.size = Pt(11)
    run_es.font.color.rgb = REMAX_RED


def add_field_row(table, label, value=""):
    """Add a label / value row to a table."""
    row = table.add_row()
    c0 = row.cells[0]
    c1 = row.cells[1]

    p0 = c0.paragraphs[0]
    run0 = p0.add_run(label)
    run0.bold = True
    run0.font.size = Pt(9)
    run0.font.color.rgb = CHARCOAL

    p1 = c1.paragraphs[0]
    run1 = p1.add_run(value)
    run1.font.size = Pt(9)
    run1.font.color.rgb = CHARCOAL


def create_field_table():
    """Create a 2-column field table."""
    table = doc.add_table(rows=0, cols=2)
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(4.3)
    return table


def shade_table(table, color_hex="F8F9FA"):
    """Apply light grey shading to all cells."""
    for row in table.rows:
        for cell in row.cells:
            shading = parse_xml(
                '<w:shd {} w:fill="{}"/>'.format(nsdecls('w'), color_hex)
            )
            cell._tc.get_or_add_tcPr().append(shading)


def add_clause(num, title_en, title_es, text_en, text_es):
    """Add a bilingual clause."""
    # Title
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after  = Pt(2)
    run = p.add_run(f"{num}. {title_en} / {title_es}")
    run.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = REMAX_BLUE

    # English text
    p_en = doc.add_paragraph()
    p_en.paragraph_format.space_after = Pt(4)
    p_en.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run_en = p_en.add_run(text_en)
    run_en.font.size = Pt(9.5)
    run_en.font.color.rgb = CHARCOAL

    # Spanish text
    p_es = doc.add_paragraph()
    p_es.paragraph_format.space_after = Pt(6)
    p_es.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    run_es = p_es.add_run(text_es)
    run_es.font.size = Pt(9)
    run_es.font.color.rgb = GREY
    run_es.italic = True


def add_signature_block(title, name="", role=""):
    """Add a signature area."""
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(14)
    run_t = p_title.add_run(title)
    run_t.bold = True
    run_t.font.size = Pt(9)
    run_t.font.color.rgb = REMAX_BLUE

    # Signature line
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(24)
    pPr = p_sig._p.get_or_add_pPr()
    pBdr = parse_xml(
        '<w:pBdr %s>'
        '<w:bottom w:val="single" w:sz="4" w:space="1" w:color="212529"/>'
        '</w:pBdr>' % nsdecls('w')
    )
    pPr.append(pBdr)

    fields = [
        ("Signature / Firma:", ""),
        ("Print Name / Nombre:", name),
        ("Title / Cargo:", role),
        ("Date / Fecha:", ""),
    ]
    for label, val in fields:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(1)
        run_l = p.add_run(f"{label}  ")
        run_l.font.size = Pt(9)
        run_l.font.color.rgb = GREY
        if val:
            run_v = p.add_run(val)
            run_v.bold = True
            run_v.font.size = Pt(9)
            run_v.font.color.rgb = CHARCOAL


# ────────────────────────────────────────────
#  BUILD THE DOCUMENT
# ────────────────────────────────────────────

# 1. Header with logo
add_logo_header()
add_blue_line()

# 2. Main bilingual title
p_main = doc.add_paragraph()
p_main.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_main.paragraph_format.space_after = Pt(2)
r1 = p_main.add_run("INTERNATIONAL REFERRAL & COLLABORATION AGREEMENT\n")
r1.bold = True
r1.font.size = Pt(13)
r1.font.color.rgb = REMAX_BLUE
r2 = p_main.add_run("ACUERDO INTERNACIONAL DE REFERIDO Y COLABORACIÓN")
r2.bold = True
r2.font.size = Pt(12)
r2.font.color.rgb = REMAX_RED

# ── BROKER A ──
add_section_title("BROKER A — Referring Brokerage (US / Canada)", "CORREDOR A — Agencia Referente")
t1 = create_field_table()
add_field_row(t1, "Brokerage Name / Agencia:")
add_field_row(t1, "Broker of Record / Corredor:")
add_field_row(t1, "Office Address / Dirección:")
add_field_row(t1, "Broker License # / Licencia:")
add_field_row(t1, "Referring Agent / Agente Referente:")
add_field_row(t1, "Agent License # / Licencia Agente:")
add_field_row(t1, "Agent Contact / Contacto:")
shade_table(t1)

# ── BROKER B ──
add_section_title("BROKER B — Receiving Brokerage (Spain)", "CORREDOR B — Agencia Receptora")
t2 = create_field_table()
add_field_row(t2, "Brokerage Name / Agencia:", "Megagestión Servicios Inmobiliarios")
add_field_row(t2, "Broker of Record / Corredor:", "José Martínez Sánchez")
add_field_row(t2, "Office Address / Dirección:", "Carrer Conrado del Campo 16, 03204, Elche (Alicante), Spain")
add_field_row(t2, "CIF (Tax ID) / NIF:", "B-54829767")
add_field_row(t2, "Contact Email / Correo:", "jose.martinez@remax.es")
add_field_row(t2, "Office Phone / Teléfono:", "+34 966 665 651")
add_field_row(t2, "Local Agent / Agente Local España:")
shade_table(t2)

# ── PROSPECT ──
add_section_title("PROSPECT — Referred Buyer Client", "CLIENTE REFERIDO — Comprador")
t3 = create_field_table()
add_field_row(t3, "Full Name / Nombre Completo:")
add_field_row(t3, "Email Address / Correo:")
add_field_row(t3, "Phone Number / Teléfono:")
add_field_row(t3, "Target Region / Región Destino:", "Alicante Province / Costa Blanca (Spain)")
shade_table(t3)

# ── COMMISSION SPLIT ──
add_section_title("COMMISSION SPLIT & REFERRAL FEE", "SPLIT DE COMISIÓN Y HONORARIOS DE REFERIDO")

p_intro = doc.add_paragraph()
p_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
p_intro.paragraph_format.space_after = Pt(4)
r = p_intro.add_run(
    "In consideration of the referral of the Prospect, Broker B shall compensate Broker A "
    "in the amount of (select one): / En contraprestación por la presentación del Cliente, "
    "el Corredor B compensará al Corredor A con el siguiente importe (marque uno):"
)
r.font.size = Pt(9.5)

options = [
    ("☐", "$ ______________ USD / CAD — Flat-rate referral fee / Tarifa plana."),
    ("☑", "25% (Twenty-Five Percent / Veinticinco Por Ciento) of the gross buyer-side commission "
           "received by Broker B / de la comisión bruta del lado comprador recibida por el Corredor B."),
    ("☐", "________ % of the gross buyer-side commission / de la comisión bruta del lado comprador."),
]
for check, text in options:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.left_indent = Cm(0.5)
    rc = p.add_run(f"  {check}  ")
    rc.bold = True
    rc.font.size = Pt(11)
    rc.font.color.rgb = REMAX_BLUE
    rt = p.add_run(text)
    rt.font.size = Pt(9.5)

# Example box
p_ex = doc.add_paragraph()
p_ex.paragraph_format.space_before = Pt(6)
p_ex.paragraph_format.space_after  = Pt(8)
p_ex.paragraph_format.left_indent  = Cm(0.5)
pPr = p_ex._p.get_or_add_pPr()
pBdr = parse_xml(
    '<w:pBdr %s>'
    '<w:left w:val="single" w:sz="12" w:space="4" w:color="003DA5"/>'
    '</w:pBdr>' % nsdecls('w')
)
pPr.append(pBdr)
r_h = p_ex.add_run("💡 Example / Ejemplo (25% Split):\n")
r_h.bold = True
r_h.font.size = Pt(9)
r_b = p_ex.add_run(
    "• Purchase Price / Precio: €400,000\n"
    "• Gross buyer commission (5%) / Comisión bruta: €20,000\n"
    "• Referring Broker payout (25%) / Pago al Corredor A: €5,000 EUR (wire/transferencia)"
)
r_b.font.size = Pt(9)
r_b.font.color.rgb = GREY

# ── CLAUSES ──
add_clause(
    "1",
    "B2B Broker-to-Broker Relationship",
    "Relación Comercial B2B",
    "This agreement represents a business-to-business (B2B) marketing and referral contract. "
    "Broker A is a legally licensed brokerage in its jurisdiction of origin (United States or Canada) "
    "and Broker B is a licensed real estate entity in Spain. As this is an international service referral, "
    "Broker A and its agents do not require licensing or registration in Spain to receive this B2B service fee.",
    "Este acuerdo representa un contrato de marketing y referido de empresa a empresa (B2B). "
    "El Corredor A es una agencia legalmente autorizada en su jurisdicción de origen (EE. UU. o Canadá) "
    "y el Corredor B es una entidad inmobiliaria con licencia en España. Al tratarse de un servicio de "
    "referido internacional, el Corredor A y sus agentes no requieren licencia ni registro en España "
    "para percibir estos honorarios de servicio B2B."
)

add_clause(
    "2",
    "Distribution to Involved Agents",
    "Distribución a los Agentes Involucrados",
    "Broker B shall wire the referral fee directly to the brokerage bank account of Broker A. "
    "Broker A is solely responsible for distributing the corresponding commission split to the "
    "Referring Real Estate Agent named above. Broker B is responsible for distributing commission "
    "splits to the local Spain Receiving Agent assigned to the transaction.",
    "El Corredor B transferirá los honorarios de referido directamente a la cuenta bancaria "
    "corporativa del Corredor A. El Corredor A es el único responsable de distribuir la comisión "
    "correspondiente al Agente Inmobiliario Referente aquí nombrado. El Corredor B es responsable "
    "de pagar la comisión correspondiente al Agente Receptor local en España asignado a la transacción."
)

add_clause(
    "3",
    "Client Registry & Lock Period",
    "Registro del Cliente y Periodo de Reserva",
    "The referral is considered registered and protected once the Prospect is submitted through "
    "Broker B's portal or signed below. Broker A is entitled to the referral compensation for any "
    "real estate transaction closed by the Prospect in Spain within 24 months of the referral "
    "registration date.",
    "El referido se considera registrado y protegido una vez que se envía el Cliente a través del "
    "portal del Corredor B o se firma el presente acuerdo. El Corredor A tendrá derecho a la "
    "compensación por referido para cualquier transacción inmobiliaria cerrada por el Cliente en "
    "España dentro de los 24 meses posteriores a la fecha de registro."
)

add_clause(
    "4",
    "Payout Settlement & Wire Transfers",
    "Liquidación de Pagos y Transferencias",
    "Referral fees shall be settled and wired to Broker A within 30 business days of the transaction "
    "closing in Spain and subsequent receipt of clear funds by Broker B. Payouts will be processed via "
    "international bank wire. Intermediary bank wire and currency conversion fees shall be borne by the recipient.",
    "Los honorarios de referido se liquidarán y transferirán al Corredor A dentro de los 30 días "
    "hábiles posteriores al cierre de la transacción en España y la posterior recepción de los fondos "
    "correspondientes por el Corredor B. Los pagos se realizarán mediante transferencia bancaria "
    "internacional. Los gastos bancarios intermediarios y de conversión de divisas serán asumidos "
    "por el destinatario."
)

add_clause(
    "5",
    "Tax Compliance & Invoicing",
    "Cumplimiento Fiscal y Facturación",
    "To comply with Spanish Tax Authorities, Broker A (if US-based) agrees to provide a completed "
    "IRS Form W-8BEN-E (or Canadian equivalent) to Broker B prior to payout, verifying corporate "
    "non-resident status and exempting the transaction from local Spanish withholding tax. "
    "Broker A shall also issue a commercial invoice for the referral fee amount.",
    "Para cumplir con la Agencia Tributaria Española, el Corredor A (si tiene sede en EE. UU.) "
    "se compromete a facilitar el formulario IRS W-8BEN-E (o equivalente canadiense) al Corredor B "
    "antes del pago, acreditando su condición de entidad extranjera no residente para eximir la "
    "retención fiscal en España. El Corredor A emitirá también una factura comercial por los "
    "honorarios correspondientes."
)

add_clause(
    "6",
    "Governing Law & Jurisdiction",
    "Ley Aplicable y Jurisdicción",
    "This agreement is governed by and construed under the laws of Spain. The parties agree that any "
    "disputes arising out of this agreement which cannot be resolved through amicable mediation "
    "shall be submitted to the exclusive jurisdiction of the Courts of Alicante, Spain.",
    "Este acuerdo se rige e interpreta según las leyes de España. Las partes acuerdan que cualquier "
    "disputa derivada de este acuerdo que no pueda resolverse mediante mediación amistosa se someterá "
    "a la jurisdicción exclusiva de los Tribunales de Alicante, España."
)

# ── SIGNATURE BLOCKS ──
add_section_title("SIGNATURE BLOCKS", "FIRMAS")
add_signature_block(
    "BROKER A — Referring Brokerage Representative / Representante Corredor A"
)
add_signature_block(
    "BROKER B — Megagestión Spain Representative / Representante Corredor B",
    name="José Martínez Sánchez",
    role="Managing Broker / Corredor de la Oficina"
)

# ── FOOTER ──
p_footer = doc.add_paragraph()
p_footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_footer.paragraph_format.space_before = Pt(24)
pPr = p_footer._p.get_or_add_pPr()
pBdr = parse_xml(
    '<w:pBdr %s>'
    '<w:top w:val="single" w:sz="4" w:space="4" w:color="DEE2E6"/>'
    '</w:pBdr>' % nsdecls('w')
)
pPr.append(pBdr)
rf = p_footer.add_run(
    "Megagestión Servicios Inmobiliarios • Carrer Conrado del Campo 16, 03204, Elche (Alicante), Spain\n"
    "CIF: B-54829767 • jose.martinez@remax.es • +34 966 665 651\n"
    "© 2026 Megagestión Servicios Inmobiliarios. All Rights Reserved."
)
rf.font.size = Pt(7.5)
rf.font.color.rgb = GREY

# ── SAVE ──
doc.save(OUTPUT_PATH)
print(f"✅ Word document saved to: {OUTPUT_PATH}")
