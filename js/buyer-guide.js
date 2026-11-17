/* ============================================
   The Spain Connection — Guía de Compra Personalizada
   ============================================
   Genera en el navegador (pdf-lib) la "Guía Completa
   para Comprar tu Casa en España" de The Spain
   Connection (ES / EN / EN-CA / FR) con la foto
   profesional y el contacto del agente RE/MAX Inmomás:
     · Pág. 13 (carta "Contacto y Oficinas"): firma
       con foto, nombre, cargo, teléfono, email y web.
     · Pág. 14 (contraportada "Agenda tu Videollamada"):
       tarjeta de contacto del agente sobre los botones.
   Los enlaces (mailto / tel / web) se actualizan.
   ============================================ */

window.App = window.App || {};

App.buyerGuide = (function() {

  const PDFLIB_URL = 'js/vendor/pdf-lib.min.js';

  const LANGS = {
    es: {
      label: 'Español',
      file: 'pdfs/Guia_Compra_Espana_The_Spain_Connection_ES.pdf',
      fileName: 'Guia_Compra_Espana',
      defaultTitle: 'Agente Inmobiliario',
      cardLabel: 'TU CONTACTO EN ESPAÑA',
      phoneLabel: 'Tel.',
      sigOffset: 0
    },
    en: {
      label: 'English (USA)',
      file: 'pdfs/Buying_Guide_Spain_The_Spain_Connection_EN.pdf',
      fileName: 'Buying_Guide_Spain',
      defaultTitle: 'Real Estate Agent',
      cardLabel: 'YOUR CONTACT IN SPAIN',
      phoneLabel: 'Phone',
      sigOffset: 0
    },
    ca: {
      label: 'English (Canada)',
      file: 'pdfs/Buying_Guide_Spain_The_Spain_Connection_CA.pdf',
      fileName: 'Buying_Guide_Spain_CA',
      defaultTitle: 'Real Estate Agent',
      cardLabel: 'YOUR CONTACT IN SPAIN',
      phoneLabel: 'Phone',
      sigOffset: 0
    },
    fr: {
      label: 'Français',
      file: 'pdfs/Guide_Achat_Espagne_The_Spain_Connection_FR.pdf',
      fileName: 'Guide_Achat_Espagne',
      defaultTitle: 'Agent Immobilier',
      cardLabel: 'VOTRE CONTACT EN ESPAGNE',
      phoneLabel: 'Tél.',
      sigOffset: 7.5
    }
  };

  const DEFAULT_WEBSITE = 'remaxinmomas.com';

  // Colores de la guía
  const COLORS = {
    navy: [37, 54, 74],
    blue: [6, 114, 197],
    orange: [254, 151, 72],
    grey: [90, 100, 115]
  };

  // Coordenadas (puntos PDF, origen ARRIBA-izquierda; página A4 594.96 x 841.92)
  const LAYOUT = {
    // Pág. 13 — bloque de firma dentro de la tarjeta blanca de la carta
    sig: {
      cover: { x: 47, top: 393, right: 346, bottom: 497 },
      photo: { x: 56, top: 400, size: 60 },
      textX: 128,
      textMaxWidth: 212,
      name: 414, title: 428, lines: [444, 457, 470]
    },
    // Pág. 14 — tarjeta sobre los botones de contacto
    card: {
      x: 97.5, top: 508, width: 400, height: 158, radius: 14,
      photo: { x: 120, top: 535, size: 104 },
      textX: 248,
      textMaxWidth: 232,
      label: 548, name: 571, title: 587, lines: [610, 625, 640]
    }
  };

  const templateCache = {};
  let pdfLibPromise = null;

  /* ---------- Helpers ---------- */

  function esc(v) {
    return App.utils && App.utils.escapeHtml ? App.utils.escapeHtml(v == null ? '' : String(v)) : String(v == null ? '' : v);
  }

  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (!pdfLibPromise) {
      pdfLibPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PDFLIB_URL;
        s.onload = () => (window.PDFLib ? resolve(window.PDFLib) : reject(new Error('pdf-lib no disponible')));
        s.onerror = () => { pdfLibPromise = null; reject(new Error('No se pudo cargar el generador de PDF.')); };
        document.head.appendChild(s);
      });
    }
    return pdfLibPromise;
  }

  function loadTemplate(lang) {
    const cfg = LANGS[lang] || LANGS.es;
    if (!templateCache[cfg.file]) {
      templateCache[cfg.file] = fetch(cfg.file)
        .then(r => {
          if (!r.ok) throw new Error('No se encontró la plantilla de la guía.');
          return r.arrayBuffer();
        })
        .catch(err => { delete templateCache[cfg.file]; throw err; });
    }
    return templateCache[cfg.file];
  }

  // Helvetica estándar solo soporta WinAnsi: normalizamos caracteres raros.
  function pdfSafe(text) {
    return String(text || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u00A0/g, ' ')
      .replace(/[^\x20-\x7E\u00A1-\u00FF\u20AC]/g, '')
      .trim();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo leer la foto. Sube de nuevo la foto profesional.'));
      img.src = src;
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  /** Recorta en cuadrado (sesgado hacia la cara en retratos) y reduce a 900px JPEG. */
  async function processPhotoFile(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Selecciona un archivo de imagen (JPG o PNG).');
    if (file.size > 15 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máx. 15MB).');
    const img = await loadImage(await readFileAsDataURL(file));
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = img.height > img.width ? Math.max(0, (img.height - side) * 0.2) : (img.height - side) / 2;
    const OUT = 900;
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUT, OUT);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  /** Convierte la foto en un PNG circular (con transparencia) para el PDF. */
  async function circlePngBytes(photoSrc) {
    const img = await loadImage(photoSrc);
    const OUT = 900;
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, OUT, OUT);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }

  /* ---------- Data ---------- */

  function getGuideData(user, overrides) {
    const g = (user && user.buyerGuide) || {};
    const data = {
      name: `${(user && user.firstName) || ''} ${(user && user.lastName) || ''}`.trim(),
      title: g.title || '',
      mobile: g.mobile || (user && user.phone) || '',
      email: g.email || (user && user.email) || '',
      website: g.website || DEFAULT_WEBSITE,
      photo: g.photo || (user && user.profileImage) || null
    };
    return Object.assign(data, overrides || {});
  }

  function getMissing(data) {
    const missing = [];
    if (!data.photo) missing.push('foto profesional');
    if (!data.name) missing.push('nombre');
    if (!data.mobile) missing.push('teléfono');
    if (!data.email) missing.push('email');
    return missing;
  }

  /* ---------- PDF generation ---------- */

  async function generatePdf(data, lang = 'es') {
    const missing = getMissing(data);
    if (missing.length) throw new Error('Faltan datos para la guía: ' + missing.join(', ') + '.');
    const L = LANGS[lang] || LANGS.es;

    const [PDFLib, templateBytes] = await Promise.all([loadPdfLib(), loadTemplate(lang)]);
    const { PDFDocument, PDFName, PDFString, PDFArray, StandardFonts, rgb } = PDFLib;
    const C = (arr) => rgb(arr[0] / 255, arr[1] / 255, arr[2] / 255);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    if (pages.length < 2) throw new Error('Plantilla de guía no válida.');
    const sigPage = pages[pages.length - 2];   // "Contacto y Oficinas"
    const backPage = pages[pages.length - 1];  // "Agenda tu Videollamada"

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const photoImg = await pdfDoc.embedPng(await circlePngBytes(data.photo));

    const title = pdfSafe(data.title) || L.defaultTitle;
    const phoneHref = 'tel:' + String(data.mobile).replace(/[^\d+]/g, '');
    const mailHref = 'mailto:' + String(data.email).trim();
    const webHref = /^https?:\/\//i.test(data.website) ? data.website : 'https://' + String(data.website).replace(/^\/+/, '');

    // Ajusta el tamaño de letra para que quepa en el ancho disponible
    const fit = (text, font, maxSize, maxWidth) => {
      let size = maxSize;
      while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
      return size;
    };

    // Quita los enlaces de José Martínez / web genérica de una página
    const removeContactLinks = (page) => {
      const annots = page.node.Annots();
      if (!annots) return;
      const keep = PDFArray.withContext(pdfDoc.context);
      annots.asArray().forEach(ref => {
        const annot = pdfDoc.context.lookup(ref);
        let uri = '';
        try {
          const action = pdfDoc.context.lookup(annot.get(PDFName.of('A')));
          const u = action && action.get(PDFName.of('URI'));
          uri = u ? (u.decodeText ? u.decodeText() : String(u)) : '';
        } catch (e) { /* not a link */ }
        if (/jose\.martinez|remaxinmomas\.com/i.test(uri)) return;
        keep.push(ref);
      });
      page.node.set(PDFName.of('Annots'), keep);
    };

    // Añade un enlace clicable (rect en coords arriba-izquierda)
    const addLink = (page, x, top, width, height, uri) => {
      const H = page.getHeight();
      const link = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [x, H - top - height, x + width, H - top],
        Border: [0, 0, 0],
        A: { Type: 'Action', S: 'URI', URI: PDFString.of(uri) }
      });
      const ref = pdfDoc.context.register(link);
      let annots = page.node.Annots();
      if (!annots) { annots = PDFArray.withContext(pdfDoc.context); page.node.set(PDFName.of('Annots'), annots); }
      annots.push(ref);
    };

    // Escribe texto a la izquierda; devuelve el ancho dibujado
    const drawText = (page, text, x, baselineTop, font, maxSize, maxWidth, color, opts = {}) => {
      const t = pdfSafe(text);
      if (!t) return 0;
      const size = fit(t, font, maxSize, maxWidth);
      const H = page.getHeight();
      page.drawText(t, { x, y: H - baselineTop, size, font, color, ...opts });
      return font.widthOfTextAtSize(t, size);
    };

    const contactLines = [
      { text: `${L.phoneLabel} ${data.mobile}`, href: phoneHref },
      { text: data.email, href: mailHref },
      { text: data.website, href: webHref }
    ];

    /* ---- Pág. 13: firma de la carta ---- */
    {
      const page = sigPage;
      const H = page.getHeight();
      const S = LAYOUT.sig;
      const off = L.sigOffset || 0;
      removeContactLinks(page);
      page.drawRectangle({ x: S.cover.x, y: H - (S.cover.bottom + off), width: S.cover.right - S.cover.x, height: S.cover.bottom - S.cover.top, color: rgb(1, 1, 1) });

      const ph = S.photo;
      page.drawImage(photoImg, { x: ph.x, y: H - (ph.top + off) - ph.size, width: ph.size, height: ph.size });
      page.drawCircle({ x: ph.x + ph.size / 2, y: H - (ph.top + off) - ph.size / 2, size: ph.size / 2, borderColor: C(COLORS.orange), borderWidth: 1.5 });

      drawText(page, data.name, S.textX, S.name + off, fontBold, 15, S.textMaxWidth, C(COLORS.navy));
      drawText(page, title, S.textX, S.title + off, fontBold, 8.5, S.textMaxWidth, C(COLORS.blue));
      contactLines.forEach((ln, i) => {
        const w = drawText(page, ln.text, S.textX, S.lines[i] + off, fontBold, 9, S.textMaxWidth, C(COLORS.blue));
        if (w) addLink(page, S.textX, S.lines[i] + off - 9, w, 12, ln.href);
      });
    }

    /* ---- Pág. 14: tarjeta de contacto en la contraportada ---- */
    {
      const page = backPage;
      const H = page.getHeight();
      const K = LAYOUT.card;
      removeContactLinks(page);

      // Tarjeta blanca redondeada con sombra suave
      const r = K.radius, w = K.width, h = K.height;
      const roundedPath = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
      page.drawSvgPath(roundedPath, { x: K.x + 2, y: H - K.top - 3, color: rgb(0, 0, 0), opacity: 0.18 });
      page.drawSvgPath(roundedPath, { x: K.x, y: H - K.top, color: rgb(1, 1, 1) });
      // Acento naranja
      page.drawRectangle({ x: K.textX, y: H - (K.label - 2), width: 26, height: 2.5, color: C(COLORS.orange) });

      const ph = K.photo;
      page.drawImage(photoImg, { x: ph.x, y: H - ph.top - ph.size, width: ph.size, height: ph.size });
      page.drawCircle({ x: ph.x + ph.size / 2, y: H - ph.top - ph.size / 2, size: ph.size / 2, borderColor: C(COLORS.orange), borderWidth: 2.5 });

      drawText(page, L.cardLabel, K.textX + 34, K.label, fontBold, 8, K.textMaxWidth - 34, C(COLORS.orange));
      drawText(page, data.name, K.textX, K.name, fontBold, 18, K.textMaxWidth, C(COLORS.navy));
      drawText(page, title, K.textX, K.title, fontBold, 9.5, K.textMaxWidth, C(COLORS.blue));
      contactLines.forEach((ln, i) => {
        const w2 = drawText(page, ln.text, K.textX, K.lines[i], i === 0 ? fontBold : fontRegular, 11, K.textMaxWidth, C(COLORS.navy));
        if (w2) addLink(page, K.textX, K.lines[i] - 10, w2, 14, ln.href);
      });
      // Toda la foto lleva al email
      addLink(page, ph.x, ph.top, ph.size, ph.size, mailHref);
    }

    pdfDoc.setTitle(`The Spain Connection — ${pdfSafe(data.name)}`);
    pdfDoc.setAuthor(`${pdfSafe(data.name)} · RE/MAX Inmomás`);
    pdfDoc.setCreator('The Spain Connection · RE/MAX Inmomás');

    return pdfDoc.save({ useObjectStreams: true });
  }

  function fileNameFor(data, lang) {
    const L = LANGS[lang] || LANGS.es;
    const slug = pdfSafe(data.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `${L.fileName}_The_Spain_Connection_${slug || 'RE-MAX'}.pdf`;
  }

  function triggerDownload(bytes, fileName) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function download(user, lang = 'es', overrides) {
    const data = getGuideData(user, overrides);
    const bytes = await generatePdf(data, lang);
    triggerDownload(bytes, fileNameFor(data, lang));
  }

  /* ---------- Editor UI (perfil del agente y modal de admin) ---------- */

  function renderEditor(container, user, options = {}) {
    if (!container || !user) return;
    const isAdmin = !!options.admin;
    const uid = 'bg-' + (isAdmin ? 'adm' : 'me');
    const data = getGuideData(user);
    let currentPhoto = data.photo;

    const inputStyle = 'width:100%; padding:0.5rem 0.65rem; border:1px solid #d1d5db; border-radius:0.45rem; font-size:0.86rem; background:#fff;';
    const labelStyle = 'font-weight:600; font-size:0.78rem; color:#374151; display:block; margin-bottom:0.25rem;';
    const langOptions = Object.keys(LANGS).map(k => `<option value="${k}">${LANGS[k].label}</option>`).join('');

    container.innerHTML = `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:0.9rem;">
        <div>
          <h2 style="font-weight:700; color:var(--text-primary, #111827); margin:0 0 0.25rem; font-size:1.15rem;">
            📘 ${isAdmin ? 'Guía de Compra en España personalizada' : 'Mi Guía de Compra en España personalizada'}
          </h2>
          <p style="margin:0; font-size:0.84rem; color:#6b7280; max-width:640px;">
            ${isAdmin
              ? 'Sube la foto profesional del agente y revisa sus datos. La guía de The Spain Connection se genera con su foto y contacto en la carta final y en la contraportada.'
              : 'Sube tu foto profesional y completa tus datos. Descarga la "Guía Completa para Comprar tu Casa en España" de The Spain Connection con tu foto y tu contacto, lista para enviar a tus clientes.'}
          </p>
        </div>
        <span id="${uid}-status"></span>
      </div>

      <div style="display:flex; gap:1.5rem; flex-wrap:wrap; align-items:flex-start;">
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.55rem; width:160px;">
          <div id="${uid}-photo-preview" style="width:130px; height:130px; border-radius:50%; border:3px solid #fe9748; background:#f8fafc center/cover no-repeat; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:0.75rem; text-align:center; overflow:hidden;"></div>
          <input type="file" id="${uid}-photo-input" accept="image/*" style="display:none;">
          <button type="button" class="btn btn-outline btn-sm" id="${uid}-photo-btn" style="width:100%; justify-content:center;">📸 Subir foto profesional</button>
          <p style="font-size:0.7rem; color:#94a3b8; margin:0; text-align:center; line-height:1.35;">Foto de busto, buena luz y fondo neutro. Se recorta en círculo automáticamente.</p>
        </div>

        <div style="flex:1; min-width:260px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem;">
            <div>
              <label style="${labelStyle}">Nombre en la guía</label>
              <input type="text" value="${esc(data.name)}" disabled style="${inputStyle} background:#f3f4f6; color:#6b7280;" title="Se toma del perfil (Editar Perfil)">
            </div>
            <div>
              <label style="${labelStyle}">Cargo <span style="font-weight:400; color:#9ca3af;">(vacío = "Agente Inmobiliario" traducido)</span></label>
              <input type="text" id="${uid}-title" value="${esc(data.title)}" placeholder="Agente Inmobiliario" maxlength="60" style="${inputStyle}">
            </div>
            <div>
              <label style="${labelStyle}">Teléfono / WhatsApp</label>
              <input type="tel" id="${uid}-mobile" value="${esc(data.mobile)}" placeholder="+34 600 000 000" maxlength="30" style="${inputStyle}">
            </div>
            <div>
              <label style="${labelStyle}">Email de contacto</label>
              <input type="email" id="${uid}-email" value="${esc(data.email)}" placeholder="nombre@remax.es" maxlength="80" style="${inputStyle}">
            </div>
            <div>
              <label style="${labelStyle}">Web</label>
              <input type="text" id="${uid}-website" value="${esc(data.website)}" placeholder="remaxinmomas.com" maxlength="60" style="${inputStyle}">
            </div>
            <div>
              <label style="${labelStyle}">Idioma de la guía</label>
              <select id="${uid}-lang" style="${inputStyle}">${langOptions}</select>
            </div>
          </div>

          <div style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-top:1rem;">
            <button type="button" class="btn btn-primary" id="${uid}-download-btn">📥 Descargar guía personalizada (PDF)</button>
            <button type="button" class="btn btn-outline" id="${uid}-save-btn">💾 Guardar datos</button>
          </div>
          <p style="font-size:0.72rem; color:#94a3b8; margin:0.5rem 0 0;">Al descargar, los datos se guardan automáticamente. Tu foto y contacto aparecen en la carta final (pág. 13) y en la contraportada (pág. 14), con enlaces directos a tu email y teléfono.</p>
        </div>
      </div>
    `;

    const $ = (id) => container.querySelector('#' + uid + '-' + id);
    const preview = $('photo-preview');
    const statusEl = $('status');

    const readForm = () => ({
      title: $('title').value,
      mobile: $('mobile').value,
      email: $('email').value,
      website: $('website').value,
      photo: currentPhoto
    });

    const refreshUI = () => {
      if (currentPhoto) {
        preview.style.backgroundImage = `url("${currentPhoto}")`;
        preview.textContent = '';
      } else {
        preview.style.backgroundImage = 'none';
        preview.textContent = 'Sin foto';
      }
      const missing = getMissing(getGuideData(user, readForm()));
      statusEl.innerHTML = missing.length
        ? `<span class="badge" style="background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:999px; font-size:0.75rem; font-weight:700;">⚠️ Falta: ${esc(missing.join(', '))}</span>`
        : `<span class="badge" style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:999px; font-size:0.75rem; font-weight:700;">✅ Lista para descargar</span>`;
    };

    const save = async (silent) => {
      const saved = await App.auth.updateBuyerGuideProfile(user.id, readForm());
      user.buyerGuide = saved;
      if (!silent) App.utils.showToast('Datos de la guía guardados ✅', 'success');
      return saved;
    };

    $('photo-btn').onclick = () => $('photo-input').click();
    $('photo-input').onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        currentPhoto = await processPhotoFile(file);
        refreshUI();
        await save(true);
        App.utils.showToast('Foto profesional guardada 📸', 'success');
      } catch (err) {
        App.utils.showToast(err.message, 'error');
      }
    };

    ['title', 'mobile', 'email', 'website'].forEach(k => $(k).addEventListener('input', refreshUI));

    $('save-btn').onclick = async () => {
      const btn = $('save-btn');
      btn.disabled = true;
      try { await save(false); } catch (err) { App.utils.showToast(err.message, 'error'); }
      finally { btn.disabled = false; }
    };

    $('download-btn').onclick = async () => {
      const btn = $('download-btn');
      const old = btn.innerHTML;
      const missing = getMissing(getGuideData(user, readForm()));
      if (missing.length) {
        App.utils.showToast('Completa antes: ' + missing.join(', '), 'error');
        return;
      }
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Generando guía...';
      try {
        await save(true);
        await download(user, $('lang').value);
        App.utils.showToast('Guía generada y descargada 📘', 'success');
      } catch (err) {
        console.error('[BuyerGuide] Error:', err);
        App.utils.showToast(err.message || 'Error al generar la guía.', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
      }
    };

    refreshUI();
  }

  return {
    LANGS,
    getGuideData,
    getMissing,
    generatePdf,
    download,
    renderEditor,
    processPhotoFile
  };
})();
