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
      label: '🇪🇸 Español',
      file: 'pdfs/Guia_Compra_Espana_The_Spain_Connection_ES.pdf',
      fileName: 'Guia_Compra_Espana',
      defaultTitle: 'Agente Inmobiliario',
      roleTitles: {
        embajador: 'Embajador Internacional',
        broker: 'Broker Inmobiliario',
        realtor: 'Agente Inmobiliario / Realtor',
        colaborador: 'Colaborador Oficial',
        partner: 'Partner Oficial',
        agent_inmomas: 'Agente Inmobiliario',
        admin: 'Dirección Internacional'
      },
      cardLabelSpain: 'TU CONTACTO EN ESPAÑA',
      cardLabelPartner: 'TU ASESOR DE CONFIANZA',
      phoneLabel: 'Tel.',
      sigOffset: 0
    },
    en: {
      label: '🇺🇸 English (USA)',
      file: 'pdfs/Buying_Guide_Spain_The_Spain_Connection_EN.pdf',
      fileName: 'Buying_Guide_Spain',
      defaultTitle: 'Real Estate Agent',
      roleTitles: {
        embajador: 'International Ambassador',
        broker: 'Real Estate Broker',
        realtor: 'Real Estate Agent / Realtor',
        colaborador: 'Official Partner',
        partner: 'Official Partner',
        agent_inmomas: 'Real Estate Agent',
        admin: 'International Advisory'
      },
      cardLabelSpain: 'YOUR CONTACT IN SPAIN',
      cardLabelPartner: 'YOUR TRUSTED ADVISOR',
      phoneLabel: 'Phone',
      sigOffset: 0
    },
    ca: {
      label: '🇨🇦 English (Canada)',
      file: 'pdfs/Buying_Guide_Spain_The_Spain_Connection_CA.pdf',
      fileName: 'Buying_Guide_Spain_CA',
      defaultTitle: 'Real Estate Agent',
      roleTitles: {
        embajador: 'International Ambassador',
        broker: 'Real Estate Broker',
        realtor: 'Real Estate Agent / Realtor',
        colaborador: 'Official Partner',
        partner: 'Official Partner',
        agent_inmomas: 'Real Estate Agent',
        admin: 'International Advisory'
      },
      cardLabelSpain: 'YOUR CONTACT IN SPAIN',
      cardLabelPartner: 'YOUR TRUSTED ADVISOR',
      phoneLabel: 'Phone',
      sigOffset: 0
    },
    fr: {
      label: '🇫🇷 Français',
      file: 'pdfs/Guide_Achat_Espagne_The_Spain_Connection_FR.pdf',
      fileName: 'Guide_Achat_Espagne',
      defaultTitle: 'Agent Immobilier',
      roleTitles: {
        embajador: 'Ambassadeur International',
        broker: 'Courtier Immobilier',
        realtor: 'Agent Immobilier',
        colaborador: 'Partenaire Officiel',
        partner: 'Partenaire Officiel',
        agent_inmomas: 'Agent Immobilier',
        admin: 'Direction Internationale'
      },
      cardLabelSpain: 'VOTRE CONTACT EN ESPAGNE',
      cardLabelPartner: 'VOTRE CONSEILLER DE CONFIANCE',
      phoneLabel: 'Tél.',
      sigOffset: 7.5
    }
  };

  const ALLOWED_ROLES = ['embajador', 'broker', 'realtor', 'colaborador', 'partner', 'agent_inmomas', 'admin'];

  function canUse(user) {
    return !!(user && ALLOWED_ROLES.includes(user.role));
  }

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
    // Pág. 15 — bloque de firma dentro de la tarjeta blanca de la carta
    sig: {
      cover: { x: 47, top: 380, right: 346, bottom: 497 },
      photo: { x: 56, top: 400, size: 60 },
      textX: 128,
      textMaxWidth: 212,
      name: 414, title: 428, lines: [444, 457, 470]
    },
    // Pág. 16 — tarjeta sobre los botones de contacto
    card: {
      x: 97.5, top: 500, width: 400, height: 166, radius: 14,
      photo: { x: 120, top: 531, size: 104 },
      textX: 248,
      textMaxWidth: 232,
      label: 544, name: 567, title: 583, lines: [606, 621, 636]
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

  const TEMPLATE_VERSION = '20261119_v6';

  function loadTemplate(lang) {
    const cfg = LANGS[lang] || LANGS.es;
    if (!templateCache[cfg.file]) {
      templateCache[cfg.file] = fetch(cfg.file + '?v=' + TEMPLATE_VERSION)
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

  /** Recorta en cuadrado (sesgado hacia la cara en retratos) y reduce a 480px JPEG (ligero para Firestore y caché local). */
  async function processPhotoFile(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Selecciona un archivo de imagen (JPG o PNG).');
    if (file.size > 15 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máx. 15MB).');
    const img = await loadImage(await readFileAsDataURL(file));
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = img.height > img.width ? Math.max(0, (img.height - side) * 0.2) : (img.height - side) / 2;
    const OUT = 480;
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUT, OUT);
    return canvas.toDataURL('image/jpeg', 0.84);
  }

  /** Convierte la foto en un PNG circular (con transparencia) para el PDF. */
  async function circlePngBytes(photoSrc) {
    const img = await loadImage(photoSrc);
    const OUT = 640;
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

  function loadLocalGuideCache(userId) {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem('remax_buyer_guide_' + userId);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveLocalGuideCache(userId, guideObj) {
    if (!userId || !guideObj) return;
    try {
      localStorage.setItem('remax_buyer_guide_' + userId, JSON.stringify(guideObj));
    } catch (e) { /* quota */ }
  }

  function getGuideData(user, overrides) {
    const remote = (user && user.buyerGuide) || {};
    const local = (user && user.id) ? (loadLocalGuideCache(user.id) || {}) : {};
    const preferLocal = !!(local.updatedAt && (!remote.updatedAt || local.updatedAt >= remote.updatedAt));
    const g = preferLocal ? Object.assign({}, remote, local) : Object.assign({}, local, remote);
    const profileName = `${(user && user.firstName) || ''} ${(user && user.lastName) || ''}`.trim();
    const data = {
      role: (user && user.role) || 'agent_inmomas',
      agencyName: (user && user.agencyName) || '',
      name: g.name || profileName,
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
    if (!data.photo) missing.push({ es: 'foto profesional', en: 'professional photo' });
    if (!data.name) missing.push({ es: 'nombre', en: 'name' });
    if (!data.mobile) missing.push({ es: 'teléfono', en: 'phone' });
    if (!data.email) missing.push({ es: 'email', en: 'email' });
    return missing;
  }

  /* ---------- PDF generation ---------- */

  async function generatePdf(data, lang = 'es') {
    const missing = getMissing(data);
    if (missing.length) throw new Error('Faltan datos para la guía: ' + missing.map(m => m.es).join(', ') + '.');
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

    const defaultRoleTitle = (L.roleTitles && L.roleTitles[data.role]) || L.defaultTitle;
    const baseTitle = pdfSafe(data.title) || defaultRoleTitle;
    const title = !pdfSafe(data.title) && data.agencyName && !['agent_inmomas', 'admin'].includes(data.role)
      ? `${baseTitle} · ${pdfSafe(data.agencyName)}`
      : baseTitle;
    const cardKicker = ['agent_inmomas', 'admin'].includes(data.role) ? L.cardLabelSpain : L.cardLabelPartner;

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
        if (/jose\.martinez|remaxinmomas\.com|647861968/i.test(uri)) return;
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

    /* ---- Penúltima página: firma de la carta ---- */
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

    /* ---- Contraportada: tarjeta de contacto ---- */
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

      drawText(page, cardKicker, K.textX + 34, K.label, fontBold, 8, K.textMaxWidth - 34, C(COLORS.orange));
      drawText(page, data.name, K.textX, K.name, fontBold, 18, K.textMaxWidth, C(COLORS.navy));
      drawText(page, title, K.textX, K.title, fontBold, 9.5, K.textMaxWidth, C(COLORS.blue));
      contactLines.forEach((ln, i) => {
        const w2 = drawText(page, ln.text, K.textX, K.lines[i], i === 0 ? fontBold : fontRegular, 11, K.textMaxWidth, C(COLORS.navy));
        if (w2) addLink(page, K.textX, K.lines[i] - 10, w2, 14, ln.href);
      });
      // Toda la foto lleva al email
      addLink(page, ph.x, ph.top, ph.size, ph.size, mailHref);
    }

    const authorOrg = pdfSafe(data.agencyName) || 'The Spain Connection · RE/MAX Inmomás';
    pdfDoc.setTitle(`The Spain Connection — ${pdfSafe(data.name)}`);
    pdfDoc.setAuthor(`${pdfSafe(data.name)} · ${authorOrg}`);
    pdfDoc.setCreator('The Spain Connection · RE/MAX Inmomás');

    return pdfDoc.save({ useObjectStreams: true });
  }

  function fileNameFor(data, lang) {
    const L = LANGS[lang] || LANGS.es;
    const slug = pdfSafe(data.name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `${L.fileName}_The_Spain_Connection_${slug || 'Partner'}.pdf`;
  }

  function triggerDownload(bytes, fileName) {
    const pdfBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 60000);
  }

  async function download(user, lang = 'es', overrides) {
    const data = getGuideData(user, overrides);
    const bytes = await generatePdf(data, lang);
    triggerDownload(bytes, fileNameFor(data, lang));
  }

  async function openInNewTab(user, lang = 'es', overrides, targetWin = null) {
    const data = getGuideData(user, overrides);
    const bytes = await generatePdf(data, lang);
    const pdfBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    if (targetWin && !targetWin.closed) {
      targetWin.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener');
    }
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  }

  /* ---------- Editor UI (Dashboards, Documentos, Perfil y Admin) ---------- */

  function renderEditor(container, user, options = {}) {
    if (!container || !user) return;
    if (container._bgSyncCleanup) {
      container._bgSyncCleanup();
      container._bgSyncCleanup = null;
    }

    const isAdmin = !!options.admin;
    const safeId = (options.uid || container.id || ('inst-' + Math.random().toString(36).slice(2, 8))).replace(/[^a-zA-Z0-9_-]/g, '');
    const uid = 'bg-' + safeId;
    const data = getGuideData(user);
    let currentPhoto = data.photo;

    const rolePlaceholderEs = (LANGS.es.roleTitles && LANGS.es.roleTitles[user.role]) || LANGS.es.defaultTitle;
    const defaultTitlePreview = user.agencyName && !['agent_inmomas', 'admin'].includes(user.role)
      ? `${rolePlaceholderEs} · ${user.agencyName}`
      : rolePlaceholderEs;

    const inputStyle = 'width:100%; padding:0.52rem 0.7rem; border:1px solid #cbd5e1; border-radius:0.5rem; font-size:0.86rem; background:#fff; color:#0f172a; box-sizing:border-box;';
    const labelStyle = 'font-weight:600; font-size:0.78rem; color:#334155; display:block; margin-bottom:0.28rem;';
    const langOptions = Object.keys(LANGS).map(k => `<option value="${k}">${LANGS[k].label}</option>`).join('');

    container.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(6,114,197,0.04) 0%, rgba(254,151,72,0.06) 100%); border:1px solid rgba(6,114,197,0.16); border-radius:14px; padding:1.25rem;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
          <div>
            <h2 style="font-weight:700; color:var(--text-primary, #0f172a); margin:0 0 0.3rem; font-size:1.12rem; display:flex; align-items:center; gap:0.45rem;">
              <span>📘</span>
              ${isAdmin
                ? '<span>Guía del Comprador en España Personalizada</span>'
                : '<span class="lang-en">Personalized Spain Buyer\'s Guide (PDF)</span><span class="lang-es">Tu Guía del Comprador en España Personalizada (PDF)</span>'}
            </h2>
            <p style="margin:0; font-size:0.84rem; color:#475569; max-width:720px; line-height:1.45;">
              ${isAdmin
                ? 'Sube la foto profesional y revisa los datos de contacto. La guía oficial de The Spain Connection (16 págs. A4) se genera con su foto, nombre, cargo, teléfono y email en la carta final y en la contraportada.'
                : '<span class="lang-en">Upload your professional photo and verify your contact details to download the official 16-page <strong>Spain Buyer\'s Guide</strong> branded with your photo, name, phone, and email — ready to send to your clients in 4 languages.</span><span class="lang-es">Sube tu foto profesional y verifica tus datos para descargar la <strong>Guía Completa del Comprador en España</strong> (16 págs.) personalizada con tu foto, nombre, teléfono y email, lista para enviar a tus clientes en 4 idiomas.</span>'}
            </p>
          </div>
          <span id="${uid}-status"></span>
        </div>

        <div style="display:flex; gap:1.5rem; flex-wrap:wrap; align-items:flex-start;">
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.55rem; width:164px; flex-shrink:0;">
            <div id="${uid}-photo-preview" style="width:124px; height:124px; border-radius:50%; border:3px solid #fe9748; box-shadow:0 4px 12px rgba(15,23,42,0.08); background:#ffffff center/cover no-repeat; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:0.76rem; font-weight:600; text-align:center; overflow:hidden; padding:0.5rem;"></div>
            <input type="file" id="${uid}-photo-input" accept="image/*" style="display:none;">
            <button type="button" class="btn btn-outline btn-sm" id="${uid}-photo-btn" style="width:100%; justify-content:center; background:#fff;">
              📸 <span class="lang-en">Upload Photo</span><span class="lang-es">Subir Foto</span>
            </button>
            <p style="font-size:0.7rem; color:#64748b; margin:0; text-align:center; line-height:1.35;">
              <span class="lang-en">Headshot with good lighting. Auto-cropped in a circle.</span>
              <span class="lang-es">Foto de busto con buena luz. Se recorta en círculo automáticamente.</span>
            </p>
          </div>

          <div style="flex:1; min-width:260px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(205px, 1fr)); gap:0.75rem;">
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Name on Guide *</span><span class="lang-es">Nombre en la Guía *</span>
                </label>
                <input type="text" id="${uid}-name" value="${esc(data.name)}" placeholder="Nombre y Apellido" maxlength="70" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Title / Role</span><span class="lang-es">Cargo / Rol</span>
                  <span style="font-weight:400; color:#94a3b8;">(<span class="lang-en">optional</span><span class="lang-es">opcional</span>)</span>
                </label>
                <input type="text" id="${uid}-title" value="${esc(data.title)}" placeholder="${esc(defaultTitlePreview)}" maxlength="60" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Phone / WhatsApp *</span><span class="lang-es">Teléfono / WhatsApp *</span>
                </label>
                <input type="tel" id="${uid}-mobile" value="${esc(data.mobile)}" placeholder="+1 305 555 0199 / +34 600 000 000" maxlength="30" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Contact Email *</span><span class="lang-es">Email de Contacto *</span>
                </label>
                <input type="email" id="${uid}-email" value="${esc(data.email)}" placeholder="email@agencia.com" maxlength="80" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Website</span><span class="lang-es">Sitio Web</span>
                </label>
                <input type="text" id="${uid}-website" value="${esc(data.website)}" placeholder="remaxinmomas.com" maxlength="60" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Guide Language</span><span class="lang-es">Idioma de la Guía</span>
                </label>
                <select id="${uid}-lang" style="${inputStyle} font-weight:600;">${langOptions}</select>
              </div>
            </div>

            <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center; margin-top:1rem;">
              <button type="button" class="btn btn-primary" id="${uid}-download-btn" style="font-weight:700;">
                📥 <span class="lang-en">Download Personalized Guide (PDF)</span><span class="lang-es">Descargar Guía Personalizada (PDF)</span>
              </button>
              <button type="button" class="btn btn-outline" id="${uid}-open-pdf-btn" style="background:#fff; font-weight:600;">
                📄 <span class="lang-en">Open PDF in Tab</span><span class="lang-es">Abrir PDF en Pestaña</span>
              </button>
              <button type="button" class="btn btn-outline" id="${uid}-save-btn" style="background:#fff;">
                💾 <span class="lang-en">Save Details</span><span class="lang-es">Guardar Datos</span>
              </button>
              <a href="dossier.html" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="background:#fff; text-decoration:none;">
                👁️ <span class="lang-en">Preview Base Guide</span><span class="lang-es">Ver Guía Base</span>
              </a>
            </div>
            <p style="font-size:0.73rem; color:#64748b; margin:0.55rem 0 0; line-height:1.4;">
              <span class="lang-en">Your details are saved automatically when downloading. Your photo and clickable email/phone appear on the closing letter (p. 15) and back cover (p. 16).</span>
              <span class="lang-es">Tus datos se guardan automáticamente al descargar. Tu foto y enlaces clicables a tu email y teléfono aparecen en la carta final (pág. 15) y en la contraportada (pág. 16).</span>
            </p>
          </div>
        </div>
      </div>
    `;

    const $ = (id) => container.querySelector('#' + uid + '-' + id);
    const preview = $('photo-preview');
    const statusEl = $('status');

    // Default guide language to EN when dashboard is in English, ES when in Spanish
    const langSel = $('lang');
    if (langSel && document.body.classList.contains('lang-en')) {
      langSel.value = 'en';
    }

    const syncLangVisibility = () => {
      if (window.App && typeof window.App.updateLangDisplay === 'function') {
        window.App.updateLangDisplay();
      }
    };

    const readForm = () => ({
      name: $('name').value,
      title: $('title').value,
      mobile: $('mobile').value,
      email: $('email').value,
      website: $('website').value,
      photo: currentPhoto
    });

    const refreshUI = () => {
      if (currentPhoto) {
        preview.style.backgroundImage = `url("${currentPhoto}")`;
        preview.innerHTML = '';
      } else {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<span class="lang-en">No photo yet</span><span class="lang-es">Sin foto</span>';
      }
      const missing = getMissing(getGuideData(user, readForm()));
      statusEl.innerHTML = missing.length
        ? `<span class="badge" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; padding:5px 11px; border-radius:999px; font-size:0.75rem; font-weight:700;">⚠️ <span class="lang-en">Missing: ${esc(missing.map(m => m.en).join(', '))}</span><span class="lang-es">Falta: ${esc(missing.map(m => m.es).join(', '))}</span></span>`
        : `<span class="badge" style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0; padding:5px 11px; border-radius:999px; font-size:0.75rem; font-weight:700;">✅ <span class="lang-en">Ready to download</span><span class="lang-es">Lista para descargar</span></span>`;
      syncLangVisibility();
    };

    const save = async (silent) => {
      const formPayload = readForm();
      const fallbackSaved = {
        name: String(formPayload.name || '').trim(),
        title: String(formPayload.title || '').trim(),
        mobile: String(formPayload.mobile || '').trim(),
        email: String(formPayload.email || '').trim(),
        website: String(formPayload.website || '').trim(),
        photo: formPayload.photo || null,
        updatedAt: new Date().toISOString()
      };
      saveLocalGuideCache(user.id, fallbackSaved);

      let saved = fallbackSaved;
      if (App.auth && typeof App.auth.updateBuyerGuideProfile === 'function') {
        try {
          saved = await App.auth.updateBuyerGuideProfile(user.id, formPayload);
        } catch (err) {
          console.warn('[BuyerGuide] Cloud save fallback to local cache:', err);
        }
      }
      user.buyerGuide = saved;
      window.dispatchEvent(new CustomEvent('buyerGuideUpdated', {
        detail: { userId: user.id, sourceUid: uid, buyerGuide: saved }
      }));
      if (!silent) App.utils.showToast('Datos de la guía guardados ✅', 'success');
      return saved;
    };

    const onExternalSync = (ev) => {
      const d = ev && ev.detail;
      if (!d || d.userId !== user.id || d.sourceUid === uid || !d.buyerGuide) return;
      user.buyerGuide = d.buyerGuide;
      currentPhoto = d.buyerGuide.photo || user.profileImage || null;
      if ($('name')) $('name').value = d.buyerGuide.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if ($('title')) $('title').value = d.buyerGuide.title || '';
      if ($('mobile')) $('mobile').value = d.buyerGuide.mobile || user.phone || '';
      if ($('email')) $('email').value = d.buyerGuide.email || user.email || '';
      if ($('website')) $('website').value = d.buyerGuide.website || DEFAULT_WEBSITE;
      refreshUI();
    };
    window.addEventListener('buyerGuideUpdated', onExternalSync);
    container._bgSyncCleanup = () => window.removeEventListener('buyerGuideUpdated', onExternalSync);

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

    ['name', 'title', 'mobile', 'email', 'website'].forEach(k => $(k).addEventListener('input', refreshUI));

    $('save-btn').onclick = async () => {
      const btn = $('save-btn');
      btn.disabled = true;
      try { await save(false); } catch (err) { App.utils.showToast(err.message, 'error'); }
      finally { btn.disabled = false; }
    };

    $('download-btn').onclick = async () => {
      const btn = $('download-btn');
      const old = btn.innerHTML;
      const formValues = readForm();
      const missing = getMissing(getGuideData(user, formValues));
      if (missing.length) {
        App.utils.showToast('Completa antes: ' + missing.map(m => m.es).join(', '), 'error');
        return;
      }
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Generando guía PDF...';
      try {
        try {
          await save(true);
        } catch (saveErr) {
          console.warn('[BuyerGuide] Save skipped during download:', saveErr);
        }
        await download(user, $('lang').value, formValues);
        App.utils.showToast('Guía personalizada generada y descargada 📘', 'success');
      } catch (err) {
        console.error('[BuyerGuide] Error:', err);
        App.utils.showToast(err.message || 'Error al generar la guía.', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
        syncLangVisibility();
      }
    };

    const openPdfBtn = $('open-pdf-btn');
    if (openPdfBtn) {
      openPdfBtn.onclick = async () => {
        const old = openPdfBtn.innerHTML;
        const formValues = readForm();
        const missing = getMissing(getGuideData(user, formValues));
        if (missing.length) {
          App.utils.showToast('Completa antes: ' + missing.map(m => m.es).join(', '), 'error');
          return;
        }
        const preWin = window.open('about:blank', '_blank');
        openPdfBtn.disabled = true;
        openPdfBtn.innerHTML = '<span class="spinner"></span> Abriendo PDF...';
        try {
          try {
            await save(true);
          } catch (saveErr) {
            console.warn('[BuyerGuide] Save skipped during open:', saveErr);
          }
          await openInNewTab(user, $('lang').value, formValues, preWin);
          App.utils.showToast('Guía personalizada abierta en una nueva pestaña 📄', 'success');
        } catch (err) {
          if (preWin && !preWin.closed) preWin.close();
          console.error('[BuyerGuide] Open error:', err);
          App.utils.showToast(err.message || 'Error al abrir la guía.', 'error');
        } finally {
          openPdfBtn.disabled = false;
          openPdfBtn.innerHTML = old;
          syncLangVisibility();
        }
      };
    }

    refreshUI();
  }

  return {
    LANGS,
    ALLOWED_ROLES,
    canUse,
    getGuideData,
    getMissing,
    generatePdf,
    download,
    openInNewTab,
    renderEditor,
    processPhotoFile,
    loadPdfLib,
    circlePngBytes,
    saveLocalGuideCache,
    pdfSafe,
    triggerDownload
  };
})();
