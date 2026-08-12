import re

with open('B2B/Presentacion_Webinar_B2B.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Slide 9: 4 pillars
text = text.replace('grid-template-columns:repeat(3,1fr);', 'grid-template-columns:repeat(4,1fr);')

pillar3 = """      <div class="glass-card" style="border-top:5px solid var(--gold);padding:28px 24px;">
        <div style="font-size:2.4rem;margin-bottom:14px;">🏡</div>
        <div class="eyebrow" style="color:rgba(255,255,255,.3);font-size:.5rem;">Property Management · Slide 12</div>
        <div style="font-size:1rem;font-weight:800;color:#fff;margin-bottom:10px;">Inmomás Holidays</div>
        <p class="body-s" style="color:rgba(255,255,255,.65);">Tourist license · Airbnb · Booking · VRBO · Full management · 5–8% net yield</p>
        <div style="margin-top:14px;font-size:.68rem;font-weight:700;color:var(--gold-lt);">Property pays for itself</div>
      </div>"""

pillar4 = """      <div class="glass-card" style="border-top:5px solid var(--green);padding:28px 24px;">
        <div style="font-size:2.4rem;margin-bottom:14px;">🤝</div>
        <div class="eyebrow" style="color:rgba(255,255,255,.3);font-size:.5rem;">Gestión Integral</div>
        <div style="font-size:1rem;font-weight:800;color:#fff;margin-bottom:10px;">RE/MAX Inmomás</div>
        <p class="body-s" style="color:rgba(255,255,255,.65);">Coordinación de todos los servicios y búsqueda de la propiedad ideal para ti.</p>
        <div style="margin-top:14px;font-size:.68rem;font-weight:700;color:var(--green);">Tu socio de confianza</div>
      </div>"""

text = text.replace(pillar3, pillar3 + '\n' + pillar4)

# 2. Slide 10: Fuster Logo Size
text = text.replace(
    '<img src="../logo_fuster_transparent.png" alt="Fuster &amp; Associates" style="height:36px;object-fit:contain;object-position:left;" class="s0">',
    '<img src="../logo_fuster_transparent.png" alt="Fuster &amp; Associates" style="height:70px;object-fit:contain;object-position:left;" class="s0">'
)

# 3. Slide 18 & 19: Remove Kit

kit_slide18 = """        <div class="glass-card s6" style="display:flex;gap:13px;align-items:flex-start;border-left:3px solid rgba(255,255,255,.22);">
          <span>📁</span>
          <div><strong class="c-white" style="font-size:.84rem;">Co-Branded Marketing Kit</strong><div class="body-s" style="color:rgba(255,255,255,.6);">Your landing page · email templates · social posts — all in your portal</div></div>
        </div>"""
text = text.replace(kit_slide18, "")

text = text.replace(
    'Webinar Exclusive — Instant VIP Access &amp; Free Co-Branded Marketing Kit',
    'Webinar Exclusive — Instant VIP Access'
)

kit_slide19 = """      <div class="glass" style="padding:26px 20px;text-align:left;border-top:4px solid var(--blue);">
        <div style="font-size:1.5rem;margin-bottom:12px;">2️⃣</div>
        <div style="font-size:.9rem;font-weight:800;color:#fff;margin-bottom:6px;text-transform:uppercase;">Claim Your Free Kit</div>
        <div class="body-s c-white" style="color:rgba(255,255,255,.65);">Bilingual landing page · email templates · 5 social posts. <strong style="color:#fff;">Co-branded with your name.</strong></div>
      </div>"""
new_slide19 = """      <div class="glass" style="padding:26px 20px;text-align:left;border-top:4px solid var(--blue);">
        <div style="font-size:1.5rem;margin-bottom:12px;">2️⃣</div>
        <div style="font-size:.9rem;font-weight:800;color:#fff;margin-bottom:6px;text-transform:uppercase;">Access Your Portal</div>
        <div class="body-s c-white" style="color:rgba(255,255,255,.65);">Track your referrals in real-time, view property dossiers, and connect <strong style="color:#fff;">directly with our agents.</strong></div>
      </div>"""
text = text.replace(kit_slide19, new_slide19)


with open('B2B/Presentacion_Webinar_B2B.html', 'w', encoding='utf-8') as f:
    f.write(text)

