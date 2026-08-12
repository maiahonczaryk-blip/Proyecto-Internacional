import re
import sys

def main():
    filepath = "/Users/maiahonczaryk/Desktop/Proyecto Internacional/B2B/Presentacion_Webinar_B2B.html"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Slide 4: Angel and Debra faces cut off
    # Change object-position:center top; to object-position:center 20%;
    content = content.replace(
        'img src="../Agentes Inmomás/Angel y Debra.png" alt="Angel &amp; Debra" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center top;',
        'img src="../Agentes Inmomás/Angel y Debra.png" alt="Angel &amp; Debra" style="width:100%;flex:1;min-height:0;object-fit:cover;object-position:center 15%;'
    )

    # 2. Slide 7: Center the cards more (force-grid)
    # Change grid-template-columns:repeat(6,1fr); to grid-template-columns:repeat(5,1fr);
    grid_pattern = r'\.force-grid\{display:grid;grid-template-columns:repeat\(6,1fr\);gap:10px;align-items:stretch;\}'
    content = content.replace(grid_pattern, '.force-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;align-items:stretch;}')

    # 3. Slide 8 (actually 9): "four-pillar ecosystem"
    # Find "The 360° Ecosystem" and change to "The Four-Pillar Ecosystem"
    content = content.replace('Slide 9 · The 360° Ecosystem', 'Slide 9 · The Four-Pillar Ecosystem')
    content = content.replace('Block 3 · The 360° Ecosystem', 'Block 3 · The Four-Pillar Ecosystem')
    
    # 4. Create Slide 11 and 12
    # I will insert them right before Slide 13 (data-name="Slide 13 · RE/MAX Marketing Toolkit")
    slide_13_index = content.find('<!-- ══ SLIDE 13')
    if slide_13_index == -1:
        print("Could not find Slide 13")
        sys.exit(1)

    slide_11_12_html = """
<!-- ══ SLIDE 11: UCI — NON-RESIDENT MORTGAGES ═════════════════════════════ -->
<div class="slide" data-name="Slide 11 · UCI Mortgages" style="background:var(--cream);">
  <div class="partner-hero" style="height:calc(100% - 52px);">
    <div class="partner-left" style="background:var(--cream);">
      <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px;" class="s0">
        <div style="width:48px;height:48px;background:var(--red);border-radius:var(--r2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">🏦</div>
        <div><div class="eyebrow">Partner Speaker · Finance · Slide 11</div><div class="title">UCI <span class="c-red">Non-Resident</span> Mortgages</div></div>
      </div>
      <hr class="accent ac-red s1" style="margin-bottom:16px;">
      <div class="s2" style="padding:15px 17px;background:rgba(255,18,0,.05);border:1px solid rgba(255,18,0,.16);border-radius:var(--r3);margin-bottom:16px;">
        <p style="font-size:.9rem;font-style:italic;color:var(--charcoal);line-height:1.78;">"With rates in North America around 6-7%, our clients are shocked when they hear they can get ~3.2% in Spain. <strong>We make their money go further.</strong>"</p>
      </div>
      <div class="check-list s3">
        <div class="check-item"><div class="check-ico">✓</div><div><div class="check-t">Up to 70% LTV for Non-Residents</div><div class="check-d">Low down payment requirement allows better portfolio diversification</div></div></div>
        <div class="check-item"><div class="check-ico">✓</div><div><div class="check-t">US &amp; CA Income Fully Accepted</div><div class="check-d">We translate and validate North American tax returns and W-2s seamlessly</div></div></div>
        <div class="check-item"><div class="check-ico">✓</div><div><div class="check-t">48-Hour Fast-Track Pre-Approval</div><div class="check-d">Your client knows exactly what they can afford before they step on the plane</div></div></div>
        <div class="check-item"><div class="check-ico">✓</div><div><div class="check-t">English-Speaking Dedicated Advisors</div><div class="check-d">100% bilingual support from application to notary signing</div></div></div>
      </div>
    </div>
    <div class="partner-right" style="background:var(--white);">
      <img src="../Logo_UCI.png" alt="UCI" style="height:70px;object-fit:contain;object-position:left;" class="s0">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="s1">
        <div class="card" style="padding:22px;background:var(--cream);border:1px solid var(--line);border-top:4px solid var(--red);text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05);"><div class="kpi-n c-red" style="font-size:3rem;">~3.2%</div><div class="kpi-l">Competitive interest rates</div></div>
        <div class="card" style="padding:22px;background:var(--cream);border:1px solid var(--line);border-top:4px solid var(--red);text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05);"><div class="kpi-n c-red" style="font-size:3rem;">48h</div><div class="kpi-l">Average pre-approval time</div></div>
      </div>
      <div class="s2" style="padding:16px;background:var(--cream);border-radius:var(--r3);border:1px solid var(--line);">
        <div class="eyebrow" style="color:var(--gold);margin-bottom:10px;">The Financial Advantage</div>
        <div style="display:flex;flex-direction:column;gap:7px;">
          <div style="display:flex;gap:10px;padding:10px 12px;background:#fff;border-radius:var(--r2);border:1px solid var(--line);border-left:3px solid var(--red);"><span>📉</span><div><div class="check-t">Lower Rates vs NA</div><div class="check-d">Significantly cheaper cost of borrowing than local US/CA banks</div></div></div>
          <div style="display:flex;gap:10px;padding:10px 12px;background:#fff;border-radius:var(--r2);border:1px solid var(--line);border-left:3px solid var(--blue);"><span>🛡️</span><div><div class="check-t">Secure Lending</div><div class="check-d">UCI is a joint venture by BNP Paribas &amp; Banco Santander</div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ══ SLIDE 12: INMOMÁS HOLIDAYS — PROPERTY MANAGEMENT ═══════════════════ -->
<div class="slide" data-name="Slide 12 · Inmomás Holidays" style="background:var(--cream);">
  <div class="partner-hero" style="height:calc(100% - 52px);">
    <div class="partner-left" style="background:var(--cream);">
      <div style="display:flex;align-items:center;gap:13px;margin-bottom:16px;" class="s0">
        <div style="width:48px;height:48px;background:var(--gold);border-radius:var(--r2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">🏡</div>
        <div><div class="eyebrow">Partner Speaker · Management · Slide 12</div><div class="title">Inmomás <span class="c-gold">Holidays</span></div></div>
      </div>
      <hr class="accent ac-gold s1" style="margin-bottom:16px;">
      <div class="s2" style="padding:15px 17px;background:rgba(184,134,11,.05);border:1px solid rgba(184,134,11,.16);border-radius:var(--r3);margin-bottom:16px;">
        <p style="font-size:.9rem;font-style:italic;color:var(--charcoal);line-height:1.78;">"Investors want the yield but not the headache. We manage the guests, the cleaning, and the maintenance. <strong>Your client just checks their bank account.</strong>"</p>
      </div>
      <div class="check-list s3">
        <div class="check-item"><div class="check-ico" style="background:var(--gold);">✓</div><div><div class="check-t">Complete Turnkey Management</div><div class="check-d">From professional photography to 24/7 guest communication</div></div></div>
        <div class="check-item"><div class="check-ico" style="background:var(--gold);">✓</div><div><div class="check-t">Multi-Platform Distribution</div><div class="check-d">Listings optimized across Airbnb, Booking.com, VRBO, and our direct channel</div></div></div>
        <div class="check-item"><div class="check-ico" style="background:var(--gold);">✓</div><div><div class="check-t">Legal &amp; Tourist Licensing</div><div class="check-d">We handle all local regulations to ensure 100% legal compliance</div></div></div>
        <div class="check-item"><div class="check-ico" style="background:var(--gold);">✓</div><div><div class="check-t">Maintenance &amp; Care</div><div class="check-d">Cleaning, repairs, and upkeep handled by our trusted local network</div></div></div>
      </div>
    </div>
    <div class="partner-right" style="background:var(--white);">
      <img src="../Inmomas-holidays-Op-3-color-e1752073650140.png" alt="Inmomás Holidays" style="height:70px;object-fit:contain;object-position:left;" class="s0">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="s1">
        <div class="card" style="padding:22px;background:var(--cream);border:1px solid var(--line);border-top:4px solid var(--gold);text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05);"><div class="kpi-n c-gold" style="font-size:3rem;">5–8%</div><div class="kpi-l">Average Net Rental Yield</div></div>
        <div class="card" style="padding:22px;background:var(--cream);border:1px solid var(--line);border-top:4px solid var(--gold);text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05);"><div class="kpi-n c-gold" style="font-size:3rem;">100%</div><div class="kpi-l">Hands-off for the owner</div></div>
      </div>
      <div class="s2" style="padding:16px;background:var(--cream);border-radius:var(--r3);border:1px solid var(--line);">
        <div class="eyebrow" style="color:var(--gold);margin-bottom:10px;">Why Investors Choose Us</div>
        <div style="display:flex;flex-direction:column;gap:7px;">
          <div style="display:flex;gap:10px;padding:10px 12px;background:#fff;border-radius:var(--r2);border:1px solid var(--line);border-left:3px solid var(--gold);"><span>📈</span><div><div class="check-t">Maximize ROI</div><div class="check-d">Dynamic pricing ensures maximum occupancy and revenue</div></div></div>
          <div style="display:flex;gap:10px;padding:10px 12px;background:#fff;border-radius:var(--r2);border:1px solid var(--line);border-left:3px solid var(--blue);"><span>🧘</span><div><div class="check-t">Peace of Mind</div><div class="check-d">Zero stress across time zones. Total transparency in earnings.</div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>

"""
    content = content[:slide_13_index] + slide_11_12_html + content[slide_13_index:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Modifications applied successfully.")

if __name__ == "__main__":
    main()
