import re

with open('B2B/Presentacion_Webinar_B2B.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Slide 3 updates:
old_grid = 'grid-template-columns:repeat(5,1fr);'
new_grid = 'grid-template-columns:repeat(6,1fr);'
text = text.replace(old_grid, new_grid)

# Define the new agents HTML
agents_html = """
      <!-- Pepe Martinez -->
      <div style="border-radius:12px;overflow:hidden;background:var(--white);border:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,14,53,.06);transition:transform .22s,box-shadow .22s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,14,53,.13)';" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,14,53,.06)';">
        <img src="../Agentes Inmomás/Pepe Martinez BROKER.jpg" alt="Pepe Martínez Sánchez" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;display:block;background:#f5f4f0;" onerror="this.style.background='#0C2749';this.style.minHeight='160px';">
        <div style="padding:8px 10px 10px;border-top:3px solid var(--blue);">
          <div style="font-size:.62rem;margin-bottom:2px;">🇪🇸</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--charcoal);line-height:1.1;margin-bottom:2px;">Pepe Martínez Sánchez</div>
          <div style="font-size:.5rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Broker RE/MAX Inmomás</div>
          <div style="font-size:.55rem;color:var(--charcoal);line-height:1.4;">
            <div>📧 jose.martinez@remax.es</div>
            <div>📞 +34 966 665 651</div>
          </div>
        </div>
      </div>

      <!-- Angel Luis & Debra -->
      <div style="border-radius:12px;overflow:hidden;background:var(--white);border:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,14,53,.06);transition:transform .22s,box-shadow .22s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,14,53,.13)';" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,14,53,.06)';">
        <img src="../Agentes Inmomás/Angel y Debra.png" alt="Angel &amp; Debra" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;display:block;background:#f5f4f0;" onerror="this.style.background='#0C2749';this.style.minHeight='160px';">
        <div style="padding:8px 10px 10px;border-top:3px solid var(--red);">
          <div style="font-size:.62rem;margin-bottom:2px;">🇺🇸 🇵🇷</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--charcoal);line-height:1.1;margin-bottom:2px;">Angel Luis &amp; Debra</div>
          <div style="font-size:.5rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Relocation Specialist</div>
          <div style="font-size:.55rem;color:var(--charcoal);line-height:1.4;">
            <div>📧 angel.rodriguez@remax.es</div>
            <div>📞 +1 407 580 4141</div>
          </div>
        </div>
      </div>

      <!-- Denise -->
      <div style="border-radius:12px;overflow:hidden;background:var(--white);border:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,14,53,.06);transition:transform .22s,box-shadow .22s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,14,53,.13)';" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,14,53,.06)';">
        <img src="../Agentes Inmomás/Denise McNeal .png" alt="Denise" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;display:block;background:#f5f4f0;" onerror="this.style.background='#0C2749';this.style.minHeight='160px';">
        <div style="padding:8px 10px 10px;border-top:3px solid var(--blue);">
          <div style="font-size:.62rem;margin-bottom:2px;">🇺🇸</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--charcoal);line-height:1.1;margin-bottom:2px;">Denise McNeal</div>
          <div style="font-size:.5rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Relocation Specialist</div>
          <div style="font-size:.55rem;color:var(--charcoal);line-height:1.4;">
            <div>📧 denise.mcneal@remax.es</div>
            <div>📞 +34 660 102 317</div>
          </div>
        </div>
      </div>

      <!-- Giancarlo -->
      <div style="border-radius:12px;overflow:hidden;background:var(--white);border:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,14,53,.06);transition:transform .22s,box-shadow .22s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,14,53,.13)';" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,14,53,.06)';">
        <img src="../Agentes Inmomás/Giancarlo Agudelo .png" alt="Giancarlo" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;display:block;background:#f5f4f0;" onerror="this.style.background='#0C2749';this.style.minHeight='160px';">
        <div style="padding:8px 10px 10px;border-top:3px solid var(--gold);">
          <div style="font-size:.62rem;margin-bottom:2px;">🇺🇸</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--charcoal);line-height:1.1;margin-bottom:2px;">Giancarlo Agudelo</div>
          <div style="font-size:.5rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Relocation Specialist</div>
          <div style="font-size:.55rem;color:var(--charcoal);line-height:1.4;">
            <div>📧 giancarlo.agudelo@remax.es</div>
            <div>📞 +34 611 535 602</div>
          </div>
        </div>
      </div>

      <!-- James -->
      <div style="border-radius:12px;overflow:hidden;background:var(--white);border:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,14,53,.06);transition:transform .22s,box-shadow .22s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,14,53,.13)';" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,14,53,.06)';">
        <img src="../Agentes Inmomás/James e Isabelle.webp" alt="James Lavoie-Montero" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;display:block;background:#f5f4f0;" onerror="this.style.background='#0C2749';this.style.minHeight='160px';">
        <div style="padding:8px 10px 10px;border-top:3px solid var(--green);">
          <div style="font-size:.62rem;margin-bottom:2px;">🇨🇦</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--charcoal);line-height:1.1;margin-bottom:2px;">James Lavoie-Montero</div>
          <div style="font-size:.5rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Relocation Specialist</div>
          <div style="font-size:.55rem;color:var(--charcoal);line-height:1.4;">
            <div>📧 james.lavoiemontero@remax.es</div>
            <div>📞 +34 645 999 308</div>
          </div>
        </div>
      </div>

      <!-- Sepehr -->
      <div style="border-radius:12px;overflow:hidden;background:var(--white);border:1px solid var(--line);display:flex;flex-direction:column;box-shadow:0 2px 12px rgba(0,14,53,.06);transition:transform .22s,box-shadow .22s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,14,53,.13)';" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 12px rgba(0,14,53,.06)';">
        <img src="../Agentes Inmomás/Sepehr Seyed Hosseini.png" alt="Sepehr" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;display:block;background:#f5f4f0;" onerror="this.style.background='#0C2749';this.style.minHeight='160px';">
        <div style="padding:8px 10px 10px;border-top:3px solid var(--red);">
          <div style="font-size:.62rem;margin-bottom:2px;">🇨🇦 🇮🇷</div>
          <div style="font-size:.7rem;font-weight:800;color:var(--charcoal);line-height:1.1;margin-bottom:2px;">Sepehr Hosseini</div>
          <div style="font-size:.5rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Relocation Specialist</div>
          <div style="font-size:.55rem;color:var(--charcoal);line-height:1.4;">
            <div>📧 sepehr.hosseini@remax.es</div>
            <div>📞 +34 601 867 627</div>
          </div>
        </div>
      </div>
"""

# Find the block and replace
pattern = re.compile(r'<!-- Angel Luis & Debra -->.*?(?=</div>\n\n    <!-- Bottom tagline -->)', re.DOTALL)
text = pattern.sub(agents_html, text)

with open('B2B/Presentacion_Webinar_B2B.html', 'w', encoding='utf-8') as f:
    f.write(text)

