import sys

def main():
    filepath = "/Users/maiahonczaryk/Desktop/Proyecto Internacional/B2B/Presentacion_Webinar_B2B.html"
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 1. Fix Slide 4 Image (Angel & Debra)
    for i, line in enumerate(lines):
        if 'Angel y Debra.png' in line and 'object-position' in line:
            # Replace whatever object-position is there with 'object-position: top;'
            import re
            lines[i] = re.sub(r'object-position:[^;]+;', 'object-position: top;', line)
            # Make sure it didn't mess up
            print(f"Updated Image Line: {lines[i].strip()}")

    # 2. Fix Slide 6 Corrupted HTML
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if '<!-- ══ SLIDE 06: THE NORTH AMERICAN EXODUS' in line:
            start_idx = i
        if '<!-- ══ SLIDE 08: BUYER PROFILES' in line:
            end_idx = i
            break
            
    if start_idx != -1 and end_idx != -1:
        fixed_slide_6 = """<!-- ══ SLIDE 06: THE NORTH AMERICAN EXODUS ════════════════════════════════ -->
<div class="slide" data-name="Slide 6 · The North American Exodus" style="background:var(--cream);">
  <div style="height:calc(100% - 52px);display:flex;flex-direction:column;padding:36px 56px 48px;">
    <div style="margin-bottom:12px;" class="s0">
      <div class="eyebrow" style="color:var(--gold);">Block 2 · The North American Exodus</div>
      <div class="headline" style="margin-bottom:0;">Why Are They <span class="c-red">Leaving?</span> The 5 Forces</div>
    </div>
    <hr class="accent ac-gold ac-full s1" style="margin-bottom:24px;">
    
    <div class="force-grid s2" style="flex:1;align-content:stretch;">
      <div class="force-card s2" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
        <div style="height:110px;background-image:url('https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=70');background-size:cover;background-position:center;position:relative;"><div style="position:absolute;inset:0;background:rgba(255,18,0,.55);display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-size:2.4rem;font-weight:900;color:#fff;letter-spacing:-2px;">40–60%</div><div style="font-size:.62rem;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:1.5px;text-transform:uppercase;">Savings</div></div></div>
        <div style="padding:14px 16px;flex:1;"><div style="font-size:.9rem;font-weight:800;color:var(--charcoal);margin-bottom:6px;">💶 Cost of Living</div><div style="font-size:.76rem;color:var(--fog);line-height:1.65;">Groceries, dining &amp; transport 40–60% cheaper than US/CA cities. A 2-bedroom in Alicante costs a fraction of Miami or Toronto. Your dollar stretches further — every single day. Lower taxes too.</div></div>
      </div>
      <div class="force-card s3" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
        <div style="height:110px;background-image:url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=70');background-size:cover;background-position:center;position:relative;"><div style="position:absolute;inset:0;background:rgba(0,67,255,.60);display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-size:2.4rem;font-weight:900;color:#fff;letter-spacing:-2px;">#7</div><div style="font-size:.62rem;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:1.5px;text-transform:uppercase;">WHO Rank</div></div></div>
        <div style="padding:14px 16px;flex:1;"><div style="font-size:.9rem;font-weight:800;color:var(--charcoal);margin-bottom:6px;">🏥 World-Class Healthcare</div><div style="font-size:.76rem;color:var(--fog);line-height:1.65;">Spain ranks #7 globally by WHO — the US sits at #37. Full private family coverage from just 250–400 € /month. English-speaking specialists available. Wait times far shorter than Canada.</div></div>
      </div>
      <div class="force-card s4" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
        <div style="height:110px;background-image:url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&q=70');background-size:cover;background-position:center;position:relative;"><div style="position:absolute;inset:0;background:rgba(21,128,61,.60);display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-size:1.6rem;font-weight:900;color:#fff;letter-spacing:-1px;">Top 10</div><div style="font-size:.62rem;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:1.5px;text-transform:uppercase;">Peace Index</div></div></div>
        <div style="padding:14px 16px;flex:1;"><div style="font-size:.9rem;font-weight:800;color:var(--charcoal);margin-bottom:6px;">🛡️ Global Safety</div><div style="font-size:.76rem;color:var(--fog);line-height:1.65;">Top-10 Global Peace Index. Gun violence virtually non-existent. Families walk safely at night. Excellent international schools in Alicante &amp; Valencia. A truly secure environment to raise children.</div></div>
      </div>
      <div class="force-card s5" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
        <div style="height:110px;background-image:url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=70');background-size:cover;background-position:center;position:relative;"><div style="position:absolute;inset:0;background:rgba(184,134,11,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-size:2.4rem;font-weight:900;color:#fff;letter-spacing:-2px;">320+</div><div style="font-size:.62rem;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:1.5px;text-transform:uppercase;">Days Sun</div></div></div>
        <div style="padding:14px 16px;flex:1;"><div style="font-size:.9rem;font-weight:800;color:var(--charcoal);margin-bottom:6px;">☀️ 320+ Days of Sunshine</div><div style="font-size:.76rem;color:var(--fog);line-height:1.65;">Costa Blanca is the sunniest coast in Europe. Mild winters (14–18°C). Year-round outdoor lifestyle — beach, cycling, hiking, golf. This alone closes more deals than any presentation can.</div></div>
      </div>
      <div class="force-card s6" style="overflow:hidden;padding:0;display:flex;flex-direction:column;">
        <div style="height:110px;background-image:url('https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=400&q=70');background-size:cover;background-position:center;position:relative;"><div style="position:absolute;inset:0;background:rgba(12,39,73,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-size:1.6rem;font-weight:900;color:#fff;letter-spacing:-1px;">3 Pathways</div><div style="font-size:.62rem;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:1.5px;text-transform:uppercase;">Residency</div></div></div>
        <div style="padding:14px 16px;flex:1;"><div style="font-size:.9rem;font-weight:800;color:var(--charcoal);margin-bottom:6px;">🛂 Residency &amp; Visas</div><div style="font-size:.76rem;color:var(--fog);line-height:1.65;">Non-Lucrative Visa for retirees · Digital Nomad Visa with 15% flat income tax for 5 years · Golden Visa from 500,000 €. Spain has a clear legal pathway for every type of North American buyer.</div></div>
      </div>
    </div>
  </div>
</div>
"""
        lines = lines[:start_idx] + [fixed_slide_6 + "\n"] + lines[end_idx:]
        print("Fixed corrupted slide 6.")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
        
    print("Done")

if __name__ == "__main__":
    main()
