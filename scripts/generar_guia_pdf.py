#!/usr/bin/env python3
"""
Genera los 4 PDFs A4 de la Guía del Comprador (dossier.html) con Chrome headless.

  pdfs/Guia_Compra_Espana_The_Spain_Connection_ES.pdf
  pdfs/Buying_Guide_Spain_The_Spain_Connection_EN.pdf
  pdfs/Buying_Guide_Spain_The_Spain_Connection_CA.pdf
  pdfs/Guide_Achat_Espagne_The_Spain_Connection_FR.pdf

La guía se imprime en bloques de páginas (Chrome falla con documentos muy
pesados en imágenes) y luego se une con `pdfunite` (poppler).

Uso:  python3 scripts/generar_guia_pdf.py [es en en-ca fr]
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'dossier.html')
OUT_DIR = os.path.join(ROOT, 'pdfs')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
CHUNK = 5  # páginas por bloque

OUTPUTS = {
    'es': 'Guia_Compra_Espana_The_Spain_Connection_ES.pdf',
    'en': 'Buying_Guide_Spain_The_Spain_Connection_EN.pdf',
    'en-ca': 'Buying_Guide_Spain_The_Spain_Connection_CA.pdf',
    'fr': 'Guide_Achat_Espagne_The_Spain_Connection_FR.pdf',
}


def split_document(html):
    head, rest = html.split('<section', 1)
    body, script = ('<section' + rest).split('<!-- ============================ IDIOMA', 1)
    sections = [s for s in re.split(r'(?=<section )', body) if s.strip()]
    tail = '<!-- ============================ IDIOMA' + script
    return head, sections, tail


def chrome_pdf(html_path, pdf_path, lang, profile):
    url = 'file://' + html_path.replace(' ', '%20') + '#' + lang
    subprocess.run([
        CHROME, '--headless=new', '--no-sandbox', '--disable-gpu',
        '--user-data-dir=' + profile, '--allow-file-access-from-files',
        '--no-pdf-header-footer', '--virtual-time-budget=4000',
        '--print-to-pdf=' + pdf_path, url,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    if not os.path.exists(pdf_path):
        raise RuntimeError('Chrome no pudo generar ' + pdf_path)


def main():
    langs = sys.argv[1:] or list(OUTPUTS)
    html = open(SRC, encoding='utf-8').read()
    head, sections, tail = split_document(html)
    tmp = tempfile.mkdtemp(prefix='guia_')
    profile = os.path.join(tmp, 'profile')
    try:
        for lang in langs:
            parts = []
            for i in range(0, len(sections), CHUNK):
                chunk_html = os.path.join(ROOT, '_guia_chunk_%02d.html' % i)  # rutas relativas de imágenes
                with open(chunk_html, 'w', encoding='utf-8') as f:
                    f.write(head + ''.join(sections[i:i + CHUNK]) + tail)
                part = os.path.join(tmp, '%s_%02d.pdf' % (lang, i))
                try:
                    chrome_pdf(chunk_html, part, lang, profile)
                finally:
                    os.remove(chunk_html)
                parts.append(part)
            out = os.path.join(OUT_DIR, OUTPUTS[lang])
            subprocess.run(['pdfunite'] + parts + [out], check=True)
            print('✓', os.path.relpath(out, ROOT))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
