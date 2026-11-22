/* ============================================
   The Spain Connection — Laboratorio de Marketing y Personalización de Documentos
   ============================================
   Centraliza en un único apartado del menú lateral (#<rol>/marketing):
     1. Estudio de Identidad Profesional (foto, nombre, cargo, teléfono, email, web y logo/marca).
     2. Materiales para Compradores (B2C) — para todos los usuarios:
        · Guía Completa del Comprador en España (A4, 16 págs. — ES / EN / CA / FR)
        · Dossier de Obra Nueva y Oportunidades (16:9, 14 láminas — ES / EN)
     3. Presentaciones Comerciales B2B (16:9, 10 diapositivas — ES / EN) según jerarquía:
        · Embajadores (+15% Paraguas / 25% Directo)
        · Brokers y Agencias (25% Comisión de Compra)
        · Agentes y Realtors (15% Acuerdo Directo / vía Broker)
   Genera cada PDF 100% en el navegador (pdf-lib + HTML5 Canvas) con enlaces clicables.
   ============================================ */

window.App = window.App || {};

App.marketingLab = (function() {

  const TEMPLATE_VERSION = '20261119_ml1';
  const DEFAULT_WEBSITE = 'remaxinmomas.com';

  const COLORS = {
    navy: [22, 48, 78],
    navyDark: [16, 36, 60],
    blue: [6, 114, 197],
    orange: [254, 137, 51],
    peach: [255, 179, 122],
    slate: [75, 90, 112],
    lightBlue: [226, 236, 247]
  };

  const ROLE_TITLES = {
    es: {
      embajador: 'Embajador Internacional',
      broker: 'Broker Inmobiliario',
      realtor: 'Agente Inmobiliario / Realtor',
      colaborador: 'Colaborador Oficial',
      partner: 'Partner Oficial',
      agent_inmomas: 'Agente Inmobiliario · División Internacional',
      admin: 'Dirección Internacional'
    },
    en: {
      embajador: 'International Ambassador',
      broker: 'Real Estate Broker',
      realtor: 'Real Estate Agent / Realtor',
      colaborador: 'Official Partner',
      partner: 'Official Partner',
      agent_inmomas: 'Real Estate Agent · International Division',
      admin: 'International Advisory'
    }
  };

  const DOSSIER_FILES = {
    es: {
      label: '🇪🇸 Español',
      file: 'pdfs/Dossier_Obra_Nueva_Oportunidades_ES.pdf',
      fileName: 'Dossier_Obra_Nueva_Oportunidades_ES',
      cardLabelSpain: 'TU CONTACTO EN ESPAÑA',
      cardLabelPartner: 'TU ASESOR DE CONFIANZA',
      phoneLabel: 'Tel.'
    },
    en: {
      label: '🇺🇸 English',
      file: 'pdfs/New_Build_Properties_Opportunities_EN.pdf',
      fileName: 'New_Build_Properties_Opportunities_EN',
      cardLabelSpain: 'YOUR CONTACT IN SPAIN',
      cardLabelPartner: 'YOUR TRUSTED ADVISOR',
      phoneLabel: 'Phone'
    }
  };

  const PRESENTATION_DECKS = {
    embajadores: {
      id: 'embajadores',
      icon: '👑',
      accent: '#d97706',
      accentBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(6, 114, 197, 0.05) 100%)',
      accentBorder: 'rgba(217, 119, 6, 0.28)',
      badgeEs: '10 diapositivas · 16:9 · +15% Paraguas / 25% Directo',
      badgeEn: '10 slides · 16:9 · +15% Umbrella / 25% Direct',
      titleEs: 'Presentación Comercial — Embajadores',
      titleEn: 'Commercial Presentation — Ambassadors',
      descEs: 'Propuesta ejecutiva para captar líderes de red y Embajadores: +15 % sobre toda su red paraguas y 25 % por comprador directo. Incluye tu tarjeta de contacto directo en la diapositiva 10.',
      descEn: 'Executive deck to onboard network leaders & Ambassadors: +15% across their entire Umbrella Network and 25% on direct buyers. Customized with your direct contact card on Slide 10.',
      allowedRoles: ['admin', 'agent_inmomas'],
      files: {
        es: {
          label: '🇪🇸 Español',
          file: 'pdfs/Presentacion_Spain_Connection_Embajadores_ES.pdf',
          fileName: 'Presentacion_Comercial_Embajadores_ES'
        },
        en: {
          label: '🇺🇸 English',
          file: 'pdfs/Presentacion_Spain_Connection_Embajadores_EN.pdf',
          fileName: 'Commercial_Presentation_Ambassadors_EN'
        }
      }
    },
    brokers: {
      id: 'brokers',
      icon: '🏢',
      accent: '#0672C5',
      accentBg: 'linear-gradient(135deg, rgba(6, 114, 197, 0.07) 0%, rgba(15, 23, 42, 0.03) 100%)',
      accentBorder: 'rgba(6, 114, 197, 0.24)',
      badgeEs: '10 diapositivas · 16:9 · 25% Agencia (B2B)',
      badgeEn: '10 slides · 16:9 · 25% Brokerage Fee (B2B)',
      titleEs: 'Presentación Comercial — Brokers y Agencias',
      titleEn: 'Commercial Presentation — Brokers & Agencies',
      descEs: 'Alianza llave en mano Broker-to-Broker: portal de equipo con trazabilidad 100 % en vivo y el 25 % de la comisión de compra para gestionar con sus agentes. Personalizada en la diapositiva 10.',
      descEn: 'Turnkey Broker-to-Broker alliance: real-time roster tracking portal and 25% of the buyer-side commission to manage and split with their agents. Customized on Slide 10.',
      allowedRoles: ['admin', 'agent_inmomas', 'embajador', 'broker'],
      files: {
        es: {
          label: '🇪🇸 Español',
          file: 'pdfs/Presentacion_Spain_Connection_Brokers_ES.pdf',
          fileName: 'Presentacion_Comercial_Brokers_ES'
        },
        en: {
          label: '🇺🇸 English',
          file: 'pdfs/Presentacion_Spain_Connection_Brokers_EN.pdf',
          fileName: 'Commercial_Presentation_Brokers_EN'
        }
      }
    },
    agentes: {
      id: 'agentes',
      icon: '🏠',
      accent: '#059669',
      accentBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.07) 0%, rgba(6, 114, 197, 0.05) 100%)',
      accentBorder: 'rgba(16, 185, 129, 0.25)',
      badgeEs: '10 diapositivas · 16:9 · 15% Directo / vía Broker',
      badgeEn: '10 slides · 16:9 · 15% Direct / via Broker',
      titleEs: 'Presentación Comercial — Agentes y Realtors®',
      titleEn: 'Commercial Presentation — Agents & Realtors®',
      descEs: 'Presentación comercial para Agentes Inmobiliarios y Realtors®: acuerdo directo al 15 % abonado al agente (compatible con Embajador) o vía su Broker al 25 %. Personalizada en la diapositiva 10.',
      descEn: 'Commercial deck for Real Estate Agents & Realtors®: 15% direct agent agreement (compatible with Ambassador umbrellas) or via their Broker at 25%. Customized on Slide 10.',
      allowedRoles: ['admin', 'agent_inmomas', 'embajador', 'broker', 'realtor', 'colaborador'],
      files: {
        es: {
          label: '🇪🇸 Español',
          file: 'pdfs/Presentacion_Spain_Connection_Agentes_ES.pdf',
          fileName: 'Presentacion_Comercial_Agentes_Realtors_ES'
        },
        en: {
          label: '🇺🇸 English',
          file: 'pdfs/Presentacion_Spain_Connection_Agentes_EN.pdf',
          fileName: 'Commercial_Presentation_Agents_Realtors_EN'
        }
      }
    }
  };

  const binaryCache = {};
  let gradientCardPngCache = null;

  /* ---------- Utilities ---------- */

  function esc(v) {
    return App.utils && App.utils.escapeHtml
      ? App.utils.escapeHtml(v == null ? '' : String(v))
      : String(v == null ? '' : v)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
  }

  function syncLangVisibility() {
    if (window.App && typeof window.App.updateLangDisplay === 'function') {
      window.App.updateLangDisplay();
    }
  }

  function isEnglishUI() {
    return document.body.classList.contains('lang-en') || document.body.classList.contains('lang-en-ca');
  }

  function fetchBytes(path) {
    const key = path + '?v=' + TEMPLATE_VERSION;
    if (!binaryCache[key]) {
      binaryCache[key] = fetch(key)
        .then(r => {
          if (!r.ok) throw new Error('No se pudo cargar el archivo: ' + path);
          return r.arrayBuffer();
        })
        .catch(err => {
          delete binaryCache[key];
          throw err;
        });
    }
    return binaryCache[key];
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
      img.src = src;
    });
  }

  /** Convierte un logo (PNG/JPG/WebP/SVG/dataURL) a PNG transparente escalado para incrustar con pdf-lib. */
  async function logoToPngBytes(logoSrc) {
    if (!logoSrc) return null;
    try {
      const img = await loadImage(logoSrc);
      const maxW = 360, maxH = 140;
      let w = img.naturalWidth || img.width || maxW;
      let h = img.naturalHeight || img.height || maxH;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.max(1, Math.round(w * ratio));
      h = Math.max(1, Math.round(h * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return { bytes, width: w, height: h };
    } catch (_) {
      return null;
    }
  }

  /** Genera un PNG 2x con el degradado exacto de la tarjeta CTA de la diapositiva 10 (#16304E → #0D4B82 → #D96B27). */
  async function getPresentationCtaBgPng() {
    if (gradientCardPngCache) return gradientCardPngCache;
    const W = Math.round(585.5 * 2);
    const H = Math.round(184 * 2);
    const R = Math.round(14.2 * 2);
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(R, 0);
    ctx.lineTo(W - R, 0);
    ctx.quadraticCurveTo(W, 0, W, R);
    ctx.lineTo(W, H - R);
    ctx.quadraticCurveTo(W, H, W - R, H);
    ctx.lineTo(R, H);
    ctx.quadraticCurveTo(0, H, 0, H - R);
    ctx.lineTo(0, R);
    ctx.quadraticCurveTo(0, 0, R, 0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, W * 1.15, H * 1.15);
    grad.addColorStop(0, '#16304E');
    grad.addColorStop(0.58, '#0D4B82');
    grad.addColorStop(1, '#B85A24');
    ctx.fillStyle = grad;
    ctx.fill();
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    gradientCardPngCache = new Uint8Array(await blob.arrayBuffer());
    return gradientCardPngCache;
  }

  function getPresentationsForRole(role, isAdminViewer) {
    if (isAdminViewer) {
      return ['embajadores', 'brokers', 'agentes'].map(k => PRESENTATION_DECKS[k]);
    }
    return ['embajadores', 'brokers', 'agentes']
      .map(k => PRESENTATION_DECKS[k])
      .filter(d => d.allowedRoles.includes(role));
  }

  function getEffectiveTitle(data, langKey) {
    const pdfSafe = App.buyerGuide.pdfSafe;
    const map = ROLE_TITLES[langKey] || ROLE_TITLES.es;
    const defaultRole = map[data.role] || (langKey === 'en' ? 'Real Estate Advisor' : 'Asesor Inmobiliario');
    const customTitle = pdfSafe(data.title);
    if (customTitle) return customTitle;
    if (data.agencyName && !['agent_inmomas', 'admin'].includes(data.role)) {
      return `${defaultRole} · ${pdfSafe(data.agencyName)}`;
    }
    return defaultRole;
  }

  function slugifyName(name) {
    return App.buyerGuide.pdfSafe(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'Partner';
  }

  function roundedSvgPath(w, h, r) {
    return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  }

  function normalizeWebsiteHref(website) {
    const clean = String(website || DEFAULT_WEBSITE).trim();
    if (/^https?:\/\//i.test(clean)) return clean;
    return 'https://' + clean.replace(/^\/+/, '');
  }

  function displayWebsiteLabel(website) {
    return String(website || DEFAULT_WEBSITE).trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  /* ---------- PDF Helpers (pdf-lib) ---------- */

  function createPdfHelpers(pdfDoc, PDFLib) {
    const { PDFName, PDFString, PDFArray } = PDFLib;

    const fit = (text, font, maxSize, maxWidth) => {
      let size = maxSize;
      while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
      return size;
    };

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
        } catch (_) {}
        if (/jose\.martinez|remaxinmomas\.com|thespainconnection\.com|647861968/i.test(uri)) return;
        keep.push(ref);
      });
      page.node.set(PDFName.of('Annots'), keep);
    };

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
      if (!annots) {
        annots = PDFArray.withContext(pdfDoc.context);
        page.node.set(PDFName.of('Annots'), annots);
      }
      annots.push(ref);
    };

    const drawText = (page, text, x, baselineTop, font, maxSize, maxWidth, color, opts = {}) => {
      const t = App.buyerGuide.pdfSafe(text);
      if (!t) return 0;
      const size = fit(t, font, maxSize, maxWidth);
      const H = page.getHeight();
      page.drawText(t, { x, y: H - baselineTop, size, font, color, ...opts });
      return font.widthOfTextAtSize(t, size);
    };

    return { fit, removeContactLinks, addLink, drawText };
  }

  /* ---------- 1. Dossier de Obra Nueva PDF Generator (14 págs. 16:9) ---------- */

  async function generateNewBuildDossierPdf(data, lang = 'es') {
    const missing = App.buyerGuide.getMissing(data);
    if (missing.length) {
      throw new Error('Completa primero tu identidad profesional: ' + missing.map(m => m.es).join(', ') + '.');
    }
    const cfg = DOSSIER_FILES[lang] || DOSSIER_FILES.es;
    const [PDFLib, templateBytes, circleBytes, agencyLogoObj] = await Promise.all([
      App.buyerGuide.loadPdfLib(),
      fetchBytes(cfg.file),
      App.buyerGuide.circlePngBytes(data.photo),
      logoToPngBytes(data.agencyLogo)
    ]);

    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const C = (arr) => rgb(arr[0] / 255, arr[1] / 255, arr[2] / 255);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const backPage = pages[pages.length - 1]; // Lámina 14 (960 x 540 pt)
    const H = backPage.getHeight();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const photoImg = await pdfDoc.embedPng(circleBytes);
    const agencyLogoImg = agencyLogoObj ? await pdfDoc.embedPng(agencyLogoObj.bytes).catch(() => null) : null;

    const { removeContactLinks, addLink, drawText } = createPdfHelpers(pdfDoc, PDFLib);
    removeContactLinks(backPage);

    const K = { x: 215, top: 287, width: 530, height: 96, radius: 13 };
    const cardPath = roundedSvgPath(K.width, K.height, K.radius);
    backPage.drawSvgPath(cardPath, { x: K.x + 2, y: H - K.top - 3, color: rgb(0, 0, 0), opacity: 0.28 });
    backPage.drawSvgPath(cardPath, { x: K.x, y: H - K.top, color: rgb(1, 1, 1) });

    // Foto circular a la izquierda
    const ph = { x: K.x + 18, top: K.top + 11, size: 74 };
    backPage.drawImage(photoImg, { x: ph.x, y: H - ph.top - ph.size, width: ph.size, height: ph.size });
    backPage.drawCircle({
      x: ph.x + ph.size / 2,
      y: H - ph.top - ph.size / 2,
      size: ph.size / 2,
      borderColor: C(COLORS.orange),
      borderWidth: 2.2
    });

    // Si tiene logo de agencia personalizado, mostrarlo arriba a la derecha dentro de la tarjeta blanca
    let rightReserved = 18;
    if (agencyLogoImg && agencyLogoObj) {
      const boxMaxW = 92, boxMaxH = 30;
      const scale = Math.min(boxMaxW / agencyLogoObj.width, boxMaxH / agencyLogoObj.height);
      const lw = agencyLogoObj.width * scale;
      const lh = agencyLogoObj.height * scale;
      const lx = K.x + K.width - lw - 16;
      const lyTop = K.top + 13;
      backPage.drawImage(agencyLogoImg, { x: lx, y: H - lyTop - lh, width: lw, height: lh });
      rightReserved = lw + 28;
    }

    const tx = ph.x + ph.size + 18;
    const upperMaxW = K.x + K.width - tx - rightReserved;
    const lowerMaxW = K.x + K.width - tx - 18;

    const kicker = ['agent_inmomas', 'admin'].includes(data.role) ? cfg.cardLabelSpain : cfg.cardLabelPartner;
    const title = getEffectiveTitle(data, lang === 'en' ? 'en' : 'es');
    const phoneHref = 'tel:' + String(data.mobile).replace(/[^\d+]/g, '');
    const mailHref = 'mailto:' + String(data.email).trim();
    const webHref = normalizeWebsiteHref(data.website);
    const webLabel = displayWebsiteLabel(data.website);

    backPage.drawRectangle({ x: tx, y: H - (K.top + 19), width: 22, height: 2.3, color: C(COLORS.orange) });
    drawText(backPage, kicker, tx + 28, K.top + 20, fontBold, 7.5, upperMaxW - 28, C(COLORS.orange));
    drawText(backPage, data.name, tx, K.top + 39, fontBold, 15.2, upperMaxW, C(COLORS.navy));
    drawText(backPage, title, tx, K.top + 53, fontBold, 8.8, lowerMaxW, C(COLORS.blue));

    const phoneTxt = `${cfg.phoneLabel} ${data.mobile}`;
    const sepTxt = '   ·   ';
    const wPhone = drawText(backPage, phoneTxt, tx, K.top + 70, fontBold, 9.4, lowerMaxW * 0.48, C(COLORS.navy));
    if (wPhone) addLink(backPage, tx, K.top + 60, wPhone, 12, phoneHref);

    const wSep = drawText(backPage, sepTxt, tx + wPhone, K.top + 70, fontRegular, 9.4, 30, C(COLORS.slate));
    const mailX = tx + wPhone + wSep;
    const wMail = drawText(backPage, data.email, mailX, K.top + 70, fontBold, 9.4, Math.max(80, lowerMaxW - wPhone - wSep), C(COLORS.navy));
    if (wMail) addLink(backPage, mailX, K.top + 60, wMail, 12, mailHref);

    const wWeb = drawText(backPage, webLabel, tx, K.top + 84, fontRegular, 8.8, lowerMaxW, C(COLORS.slate));
    if (wWeb) addLink(backPage, tx, K.top + 75, wWeb, 11, webHref);
    addLink(backPage, ph.x, ph.top, ph.size, ph.size, mailHref);

    const authorOrg = App.buyerGuide.pdfSafe(data.agencyName) || 'The Spain Connection · RE/MAX Inmomás';
    pdfDoc.setTitle(`The Spain Connection · Obra Nueva — ${App.buyerGuide.pdfSafe(data.name)}`);
    pdfDoc.setAuthor(`${App.buyerGuide.pdfSafe(data.name)} · ${authorOrg}`);
    pdfDoc.setCreator('The Spain Connection · Laboratorio de Marketing');

    return {
      bytes: await pdfDoc.save({ useObjectStreams: true }),
      fileName: `${cfg.fileName}_${slugifyName(data.name)}.pdf`
    };
  }

  /* ---------- 2. Presentaciones Comerciales B2B PDF Generator (10 págs. 16:9) ---------- */

  async function generatePresentationPdf(data, deckId = 'agentes', lang = 'es') {
    const missing = App.buyerGuide.getMissing(data);
    if (missing.length) {
      throw new Error('Completa primero tu identidad profesional: ' + missing.map(m => m.es).join(', ') + '.');
    }
    const deck = PRESENTATION_DECKS[deckId] || PRESENTATION_DECKS.agentes;
    const cfg = deck.files[lang] || deck.files.es;

    const [PDFLib, templateBytes, circleBytes, ctaBgBytes, narBytes, scWhiteBytes, remaxBytes, agencyLogoObj] = await Promise.all([
      App.buyerGuide.loadPdfLib(),
      fetchBytes(cfg.file),
      App.buyerGuide.circlePngBytes(data.photo),
      getPresentationCtaBgPng(),
      fetchBytes('images/nar-logo.png'),
      fetchBytes('images/spain-connection-logo-white.png'),
      fetchBytes('images/remax-logo.png'),
      logoToPngBytes(data.agencyLogo)
    ]);

    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const C = (arr) => rgb(arr[0] / 255, arr[1] / 255, arr[2] / 255);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1]; // Diapositiva 10 (960 x 540 pt)
    const H = lastPage.getHeight();

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const [photoImg, ctaBgImg, narImg, scImg, remaxImg] = await Promise.all([
      pdfDoc.embedPng(circleBytes),
      pdfDoc.embedPng(ctaBgBytes),
      pdfDoc.embedPng(narBytes),
      pdfDoc.embedPng(scWhiteBytes),
      pdfDoc.embedPng(remaxBytes)
    ]);
    const agencyLogoImg = agencyLogoObj ? await pdfDoc.embedPng(agencyLogoObj.bytes).catch(() => null) : null;

    const { removeContactLinks, addLink, drawText } = createPdfHelpers(pdfDoc, PDFLib);
    removeContactLinks(lastPage);

    // Coordenadas exactas de .cta-card en Slide 10 (medidas sobre el render 960x540)
    const B = { x: 44.5, top: 298, width: 585.5, height: 184 };
    lastPage.drawImage(ctaBgImg, {
      x: B.x,
      y: H - B.top - B.height,
      width: B.width,
      height: B.height
    });

    // Foto circular profesional a la izquierda
    const ph = { x: B.x + 20, top: B.top + 20, size: 84 };
    lastPage.drawCircle({
      x: ph.x + ph.size / 2,
      y: H - ph.top - ph.size / 2,
      size: ph.size / 2 + 1,
      color: rgb(1, 1, 1)
    });
    lastPage.drawImage(photoImg, { x: ph.x, y: H - ph.top - ph.size, width: ph.size, height: ph.size });
    lastPage.drawCircle({
      x: ph.x + ph.size / 2,
      y: H - ph.top - ph.size / 2,
      size: ph.size / 2,
      borderColor: C(COLORS.orange),
      borderWidth: 2.4
    });

    // Píldoras superiores derechas (NAR + logo de agencia si el usuario tiene uno)
    const narPill = { x: B.x + B.width - 116, top: B.top + 22, w: 96, h: 32, r: 8 };
    lastPage.drawSvgPath(roundedSvgPath(narPill.w, narPill.h, narPill.r), {
      x: narPill.x,
      y: H - narPill.top,
      color: rgb(1, 1, 1)
    });
    const narH = 22, narW = narH * (1280 / 447);
    lastPage.drawImage(narImg, {
      x: narPill.x + (narPill.w - narW) / 2,
      y: H - narPill.top - (narPill.h + narH) / 2,
      width: narW,
      height: narH
    });

    let rightBadgesLeftX = narPill.x;
    if (agencyLogoImg && agencyLogoObj) {
      const agPill = { w: 84, h: 32, r: 8 };
      agPill.x = narPill.x - agPill.w - 8;
      agPill.top = narPill.top;
      lastPage.drawSvgPath(roundedSvgPath(agPill.w, agPill.h, agPill.r), {
        x: agPill.x,
        y: H - agPill.top,
        color: rgb(1, 1, 1)
      });
      const sc = Math.min((agPill.w - 14) / agencyLogoObj.width, (agPill.h - 8) / agencyLogoObj.height);
      const lw = agencyLogoObj.width * sc;
      const lh = agencyLogoObj.height * sc;
      lastPage.drawImage(agencyLogoImg, {
        x: agPill.x + (agPill.w - lw) / 2,
        y: H - agPill.top - (agPill.h + lh) / 2,
        width: lw,
        height: lh
      });
      rightBadgesLeftX = agPill.x;
    }

    const tx = ph.x + ph.size + 18;
    const upperMaxW = Math.max(180, rightBadgesLeftX - tx - 12);
    const fullTextMaxW = B.x + B.width - tx - 20;

    const kicker = lang === 'en'
      ? 'YOUR DIRECT CONNECTION · THE SPAIN CONNECTION'
      : 'TU ENLACE DIRECTO CON THE SPAIN CONNECTION';
    const subLine = lang === 'en'
      ? 'The Spain Connection · International Division of RE/MAX Inmomás'
      : 'The Spain Connection · División Internacional de RE/MAX Inmomás';
    const title = getEffectiveTitle(data, lang === 'en' ? 'en' : 'es');
    const phoneLabel = lang === 'en' ? 'Phone' : 'Tel.';

    drawText(lastPage, kicker, tx, B.top + 31, fontBold, 7.6, upperMaxW, C(COLORS.peach));
    drawText(lastPage, data.name, tx, B.top + 54, fontBold, 16.8, upperMaxW, rgb(1, 1, 1));
    drawText(lastPage, title, tx, B.top + 72, fontBold, 9.8, fullTextMaxW, C(COLORS.peach));
    drawText(lastPage, subLine, tx, B.top + 88, fontRegular, 8.4, fullTextMaxW, C(COLORS.lightBlue));

    // Línea divisoria inferior
    const divTop = B.top + 124;
    lastPage.drawRectangle({
      x: B.x + 20,
      y: H - divTop,
      width: B.width - 40,
      height: 0.7,
      color: rgb(1, 1, 1),
      opacity: 0.24
    });

    // Logos inferiores derechos (The Spain Connection + RE/MAX Inmomás)
    const remaxPill = { x: B.x + B.width - 86, top: B.top + 138, w: 66, h: 28, r: 7 };
    lastPage.drawSvgPath(roundedSvgPath(remaxPill.w, remaxPill.h, remaxPill.r), {
      x: remaxPill.x,
      y: H - remaxPill.top,
      color: rgb(1, 1, 1)
    });
    const rxH = 19.5, rxW = rxH * 2;
    lastPage.drawImage(remaxImg, {
      x: remaxPill.x + (remaxPill.w - rxW) / 2,
      y: H - remaxPill.top - (remaxPill.h + rxH) / 2,
      width: rxW,
      height: rxH
    });

    const scH = 27, scW = scH * (1024 / 479);
    const scX = remaxPill.x - scW - 10;
    lastPage.drawImage(scImg, {
      x: scX,
      y: H - remaxPill.top - (remaxPill.h + scH) / 2,
      width: scW,
      height: scH
    });

    // Enlaces clicables inferiores izquierdos
    const bottomMaxW = scX - (B.x + 20) - 14;
    const phoneHref = 'tel:' + String(data.mobile).replace(/[^\d+]/g, '');
    const mailHref = 'mailto:' + String(data.email).trim();
    const webHref = normalizeWebsiteHref(data.website);
    const webLabel = displayWebsiteLabel(data.website);

    const phoneTxt = `${phoneLabel} ${data.mobile}`;
    const sepTxt = '   ·   ';
    const wPhone = drawText(lastPage, phoneTxt, B.x + 20, B.top + 148, fontBold, 9.8, bottomMaxW * 0.46, rgb(1, 1, 1));
    if (wPhone) addLink(lastPage, B.x + 20, B.top + 138, wPhone, 13, phoneHref);

    const wSep = drawText(lastPage, sepTxt, B.x + 20 + wPhone, B.top + 148, fontRegular, 9.8, 28, C(COLORS.lightBlue));
    const mailX = B.x + 20 + wPhone + wSep;
    const wMail = drawText(lastPage, data.email, mailX, B.top + 148, fontBold, 9.8, Math.max(80, bottomMaxW - wPhone - wSep), rgb(1, 1, 1));
    if (wMail) addLink(lastPage, mailX, B.top + 138, wMail, 13, mailHref);

    const wWeb = drawText(lastPage, webLabel, B.x + 20, B.top + 165, fontRegular, 9.1, bottomMaxW, C(COLORS.peach));
    if (wWeb) addLink(lastPage, B.x + 20, B.top + 155, wWeb, 12, webHref);
    addLink(lastPage, ph.x, ph.top, ph.size, ph.size, mailHref);

    const authorOrg = App.buyerGuide.pdfSafe(data.agencyName) || 'The Spain Connection · RE/MAX Inmomás';
    pdfDoc.setTitle(`${cfg.fileName.replace(/_/g, ' ')} — ${App.buyerGuide.pdfSafe(data.name)}`);
    pdfDoc.setAuthor(`${App.buyerGuide.pdfSafe(data.name)} · ${authorOrg}`);
    pdfDoc.setCreator('The Spain Connection · Laboratorio de Marketing');

    return {
      bytes: await pdfDoc.save({ useObjectStreams: true }),
      fileName: `${cfg.fileName}_${slugifyName(data.name)}.pdf`
    };
  }

  /* ---------- Unified Generate / Download / Open ---------- */

  async function buildDocumentBytes(docKind, lang, user, formOverrides) {
    let effectiveAgencyLogo = user.agencyLogo || null;
    let effectiveAgencyName = user.agencyName || '';
    if (user.role === 'realtor' && App.referralBranding && typeof App.referralBranding.resolveParentBrokerForRealtor === 'function') {
      try {
        const parentBroker = await App.referralBranding.resolveParentBrokerForRealtor(user);
        if (parentBroker) {
          effectiveAgencyLogo = parentBroker.agencyLogo || effectiveAgencyLogo;
          effectiveAgencyName = parentBroker.agencyName || effectiveAgencyName;
        }
      } catch (_) {}
    }

    const data = Object.assign(
      App.buyerGuide.getGuideData(user, formOverrides),
      {
        agencyLogo: effectiveAgencyLogo,
        agencyName: effectiveAgencyName
      }
    );

    if (docKind === 'buyer_guide') {
      const bytes = await App.buyerGuide.generatePdf(data, lang);
      const L = App.buyerGuide.LANGS[lang] || App.buyerGuide.LANGS.es;
      const fileName = `${L.fileName}_The_Spain_Connection_${slugifyName(data.name)}.pdf`;
      return { bytes, fileName };
    }

    if (docKind === 'new_build_dossier') {
      return generateNewBuildDossierPdf(data, lang);
    }

    if (docKind.startsWith('pres_')) {
      const deckId = docKind.replace(/^pres_/, '');
      return generatePresentationPdf(data, deckId, lang);
    }

    throw new Error('Tipo de documento no reconocido.');
  }

  function openBytesInTab(bytes, targetWin) {
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

  /* ---------- Quick-Access Banner Card on Dashboards ---------- */

  function renderQuickCard(container, user, options = {}) {
    if (!container || !user) return;
    const targetRoute = options.route || `${user.role}/marketing`;
    const data = App.buyerGuide.getGuideData(user);
    const missing = App.buyerGuide.getMissing(data);
    const decks = getPresentationsForRole(user.role, user.role === 'admin');

    const avatarHtml = data.photo
      ? `<div style="width:52px; height:52px; border-radius:50%; border:2.5px solid #fe8933; background:url('${esc(data.photo)}') center/cover no-repeat; flex-shrink:0; box-shadow:0 3px 10px rgba(15,23,42,0.10);"></div>`
      : `<div style="width:52px; height:52px; border-radius:50%; border:2px dashed #fe8933; background:#fff; display:flex; align-items:center; justify-content:center; font-size:1.35rem; flex-shrink:0;">🎨</div>`;

    const statusBadge = missing.length
      ? `<span style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; padding:4px 10px; border-radius:999px; font-size:0.73rem; font-weight:700; white-space:nowrap;">⚠️ <span class="lang-en">Setup pending (${missing.length})</span><span class="lang-es">Configura tu foto/datos (${missing.length})</span></span>`
      : `<span style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0; padding:4px 10px; border-radius:999px; font-size:0.73rem; font-weight:700; white-space:nowrap;">✅ <span class="lang-en">Identity Ready</span><span class="lang-es">Identidad Lista</span></span>`;

    const pillStyle = 'display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:0.75rem; font-weight:600; background:#fff; border:1px solid #e2e8f0; color:#1e293b;';

    container.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(6,114,197,0.05) 0%, rgba(254,137,51,0.08) 100%); border:1px solid rgba(6,114,197,0.18); border-radius:14px; padding:16px 18px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:260px;">
          ${avatarHtml}
          <div style="min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
              <h3 style="margin:0; font-size:1.02rem; font-weight:700; color:var(--text-primary, #0f172a);">
                🎨 <span class="lang-en">Marketing &amp; Document Customization Lab</span><span class="lang-es">Laboratorio de Marketing y Personalización</span>
              </h3>
              ${statusBadge}
            </div>
            <p style="margin:0 0 8px; font-size:0.82rem; color:#475569; line-height:1.4;">
              <span class="lang-en">Download your co-branded PDFs customized with your headshot, name, phone &amp; clickable links:</span>
              <span class="lang-es">Descarga tus PDFs personalizados al instante con tu foto, nombre, teléfono y enlaces clicables:</span>
            </p>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <span style="${pillStyle}">📘 <span class="lang-en">Buyer's Guide (4 langs)</span><span class="lang-es">Guía Comprador (4 idiomas)</span></span>
              <span style="${pillStyle}">🏗️ <span class="lang-en">New-Build Dossier (ES/EN)</span><span class="lang-es">Dossier Obra Nueva (ES/EN)</span></span>
              ${decks.length ? `<span style="${pillStyle}">📊 <span class="lang-en">${decks.length} Commercial ${decks.length === 1 ? 'Deck' : 'Decks'} (ES/EN)</span><span class="lang-es">${decks.length} ${decks.length === 1 ? 'Presentación Comercial' : 'Presentaciones Comerciales'} (ES/EN)</span></span>` : ''}
            </div>
          </div>
        </div>
        <a href="#${esc(targetRoute)}" class="btn btn-primary" style="white-space:nowrap; font-weight:700; text-decoration:none; border-radius:10px; padding:10px 18px;">
          🎨 <span class="lang-en">Open Marketing Lab →</span><span class="lang-es">Abrir Laboratorio →</span>
        </a>
      </div>
    `;
    syncLangVisibility();
  }

  /* ---------- Full Marketing Lab Workspace Renderer ---------- */

  function renderLabWorkspace(container, targetUser, options = {}) {
    if (!container || !targetUser) return;
    if (container._mlSyncCleanup) {
      container._mlSyncCleanup();
      container._mlSyncCleanup = null;
    }

    const isAdminViewer = !!options.isAdminViewer;
    const isEditingOther = isAdminViewer && options.viewerId && options.viewerId !== targetUser.id;
    const uid = 'ml-' + String(targetUser.id || 'u').replace(/[^a-zA-Z0-9_-]/g, '');

    const data = App.buyerGuide.getGuideData(targetUser);
    let currentPhoto = data.photo;

    const defaultLang = isEnglishUI() ? 'en' : 'es';
    const rolePlaceholderEs = (ROLE_TITLES.es[targetUser.role]) || 'Asesor Inmobiliario';
    const defaultTitlePreview = targetUser.agencyName && !['agent_inmomas', 'admin'].includes(targetUser.role)
      ? `${rolePlaceholderEs} · ${targetUser.agencyName}`
      : rolePlaceholderEs;

    // Enlaces rápidos del usuario para autocompletar el campo Sitio Web / Enlace
    let proRefUrl = '';
    let clientWebUrl = '';
    let effectiveCode = targetUser.referralCode || '';
    if (targetUser.role === 'partner') {
      const pType = targetUser.partnerType || '';
      if (pType === 'needsUCI') effectiveCode = 'UCI';
      else if (pType === 'needsFuster') effectiveCode = 'Fuster & Associates';
      else if (pType === 'needsHolidays') effectiveCode = 'Inmomás Holidays';
    }
    if (effectiveCode && targetUser.status !== 'pending' && App.utils) {
      if (typeof App.utils.generateReferralLink === 'function') {
        proRefUrl = App.utils.generateReferralLink(effectiveCode);
      }
      if (typeof App.utils.generateClientWebinarLink === 'function') {
        clientWebUrl = App.utils.generateClientWebinarLink(effectiveCode);
      }
    }

    const availablePresentations = getPresentationsForRole(targetUser.role, isAdminViewer);
    const canShowBranding = App.referralBranding && App.referralBranding.canUse(targetUser);

    const inputStyle = 'width:100%; padding:0.56rem 0.75rem; border:1px solid #cbd5e1; border-radius:0.55rem; font-size:0.87rem; background:#fff; color:#0f172a; box-sizing:border-box;';
    const labelStyle = 'font-weight:600; font-size:0.79rem; color:#334155; display:block; margin-bottom:0.28rem;';

    const renderLangPills = (docKey, langsObj) => {
      const keys = Object.keys(langsObj);
      const activeKey = keys.includes(defaultLang) ? defaultLang : keys[0];
      return `
        <div class="ml-lang-pills" data-doc-lang-group="${esc(docKey)}" style="display:flex; gap:6px; flex-wrap:wrap; margin:12px 0;">
          ${keys.map(k => {
            const active = k === activeKey;
            return `
              <button type="button" data-lang-choice="${esc(k)}"
                style="cursor:pointer; border-radius:999px; padding:6px 12px; font-size:0.78rem; font-weight:700; transition:all 0.16s ease; border:1.5px solid ${active ? '#0672C5' : '#cbd5e1'}; background:${active ? '#0672C5' : '#fff'}; color:${active ? '#fff' : '#334155'};">
                ${langsObj[k].label}
              </button>
            `;
          }).join('')}
        </div>
      `;
    };

    container.innerHTML = `
      <!-- 1. ESTUDIO DE IDENTIDAD PROFESIONAL -->
      <div class="dashboard-section" style="background:linear-gradient(135deg, rgba(6,114,197,0.04) 0%, rgba(254,137,51,0.07) 100%); border:1px solid rgba(6,114,197,0.18); border-radius:16px; padding:1.35rem; margin-bottom:1.5rem;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.1rem;">
          <div>
            <div style="font-size:0.73rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#0672C5; margin-bottom:4px;">
              ✨ <span class="lang-en">STEP 1 · UNIFIED PROFESSIONAL IDENTITY</span><span class="lang-es">PASO 1 · TU IDENTIDAD PROFESIONAL UNIFICADA</span>
            </div>
            <h2 style="font-weight:800; color:var(--text-primary, #0f172a); margin:0 0 0.3rem; font-size:1.18rem;">
              ${isEditingOther
                ? `<span>Identidad en Documentos de ${esc(`${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email)}</span>`
                : `<span class="lang-en">Your Photo &amp; Contact Card Across All Documents</span><span class="lang-es">Tu Foto y Tarjeta de Contacto para Todos tus Documentos</span>`}
            </h2>
            <p style="margin:0; font-size:0.84rem; color:#475569; max-width:780px; line-height:1.45;">
              <span class="lang-en">Configure your professional photo and contact details once. Every guide, new-build portfolio, and commercial presentation below is stamped automatically with your photo and clickable links.</span>
              <span class="lang-es">Configura tu foto profesional y datos una sola vez. Todas tus guías, dossieres de obra nueva y presentaciones comerciales se generarán automáticamente con tu foto y enlaces clicables.</span>
            </p>
          </div>
          <span id="${uid}-status"></span>
        </div>

        <div style="display:flex; gap:1.5rem; flex-wrap:wrap; align-items:flex-start;">
          <!-- Photo Uploader -->
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.55rem; width:168px; flex-shrink:0;">
            <div id="${uid}-photo-preview" style="width:126px; height:126px; border-radius:50%; border:3px solid #fe8933; box-shadow:0 6px 16px rgba(15,23,42,0.10); background:#ffffff center/cover no-repeat; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:0.76rem; font-weight:600; text-align:center; overflow:hidden; padding:0.5rem;"></div>
            <input type="file" id="${uid}-photo-input" accept="image/*" style="display:none;">
            <button type="button" class="btn btn-outline btn-sm" id="${uid}-photo-btn" style="width:100%; justify-content:center; background:#fff; font-weight:600;">
              📸 <span class="lang-en">Upload Photo</span><span class="lang-es">Subir Foto</span>
            </button>
            <p style="font-size:0.7rem; color:#64748b; margin:0; text-align:center; line-height:1.35;">
              <span class="lang-en">Clear headshot. Auto-cropped in a circle on all PDFs.</span>
              <span class="lang-es">Foto de busto nítida. Se recorta en círculo en todos los PDFs.</span>
            </p>
          </div>

          <!-- Contact Fields -->
          <div style="flex:1; min-width:265px;">
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(215px, 1fr)); gap:0.8rem;">
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Full Name on Documents *</span><span class="lang-es">Nombre en los Documentos *</span>
                </label>
                <input type="text" id="${uid}-name" value="${esc(data.name)}" placeholder="Nombre y Apellido" maxlength="70" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Title / Role</span><span class="lang-es">Cargo / Rol</span>
                  <span style="font-weight:400; color:#94a3b8;">(<span class="lang-en">optional</span><span class="lang-es">opcional</span>)</span>
                </label>
                <input type="text" id="${uid}-title" value="${esc(data.title)}" placeholder="${esc(defaultTitlePreview)}" maxlength="65" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Phone / WhatsApp *</span><span class="lang-es">Teléfono / WhatsApp *</span>
                </label>
                <input type="tel" id="${uid}-mobile" value="${esc(data.mobile)}" placeholder="+1 305 555 0199 / +34 600 000 000" maxlength="32" style="${inputStyle}">
              </div>
              <div>
                <label style="${labelStyle}">
                  <span class="lang-en">Contact Email *</span><span class="lang-es">Email de Contacto *</span>
                </label>
                <input type="email" id="${uid}-email" value="${esc(data.email)}" placeholder="email@agencia.com" maxlength="80" style="${inputStyle}">
              </div>
              <div style="grid-column: 1 / -1;">
                <label style="${labelStyle}">
                  <span class="lang-en">Website or Personalized Referral Link</span><span class="lang-es">Sitio Web o Enlace Personalizado</span>
                </label>
                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                  <input type="text" id="${uid}-website" value="${esc(data.website)}" placeholder="remaxinmomas.com" maxlength="120" style="${inputStyle} flex:1; min-width:220px;">
                  <button type="button" class="btn btn-primary btn-sm" id="${uid}-save-btn" style="padding:0.56rem 1.1rem; border-radius:0.55rem; font-weight:700; white-space:nowrap;">
                    💾 <span class="lang-en">Save Identity</span><span class="lang-es">Guardar Identidad</span>
                  </button>
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-top:6px;">
                  <span style="font-size:0.72rem; color:#64748b; font-weight:600;">
                    <span class="lang-en">Quick fill:</span><span class="lang-es">Usar enlace rápido:</span>
                  </span>
                  <button type="button" data-quick-web="${esc(DEFAULT_WEBSITE)}" style="cursor:pointer; border:1px solid #cbd5e1; background:#fff; color:#334155; border-radius:999px; padding:2px 9px; font-size:0.72rem; font-weight:600;">
                    🌐 remaxinmomas.com
                  </button>
                  ${proRefUrl ? `
                    <button type="button" data-quick-web="${esc(proRefUrl)}" style="cursor:pointer; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:999px; padding:2px 9px; font-size:0.72rem; font-weight:600;">
                      🔗 <span class="lang-en">My Professional Referral Link</span><span class="lang-es">Mi Link Profesional B2B</span>
                    </button>
                  ` : ''}
                  ${clientWebUrl ? `
                    <button type="button" data-quick-web="${esc(clientWebUrl)}" style="cursor:pointer; border:1px solid #fecdd3; background:#fff1f2; color:#be123c; border-radius:999px; padding:2px 9px; font-size:0.72rem; font-weight:600;">
                      🎙️ <span class="lang-en">My Client Webinar Link</span><span class="lang-es">Mi Link Webinario Clientes</span>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${canShowBranding ? `
          <details style="margin-top:1.1rem; border-top:1px solid rgba(6,114,197,0.14); padding-top:0.9rem;">
            <summary style="cursor:pointer; font-weight:700; font-size:0.86rem; color:#0f172a; user-select:none; display:flex; align-items:center; gap:6px;">
              🏷️ <span class="lang-en">Agency / Brokerage Logo &amp; Referral Link Co-Branding (click to expand)</span><span class="lang-es">Logo de tu Agencia / Marca en Dossieres, Presentaciones y Enlaces (clic para abrir)</span>
            </summary>
            <div id="${uid}-branding-slot" style="margin-top:0.75rem;"></div>
          </details>
        ` : ''}
      </div>

      <!-- 2. MATERIALES PARA COMPRADORES Y CLIENTES (B2C) -->
      <div class="dashboard-section" style="margin-bottom:1.5rem;">
        <div style="margin-bottom:1rem;">
          <div style="font-size:0.73rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#ea580c; margin-bottom:3px;">
            🏡 <span class="lang-en">CLIENT &amp; BUYER MATERIALS (B2C)</span><span class="lang-es">MATERIALES PARA COMPRADORES Y CLIENTES (B2C)</span>
          </div>
          <h2 style="margin:0 0 4px; font-size:1.16rem; font-weight:800; color:var(--text-primary, #0f172a);">
            <span class="lang-en">Buyer's Guides &amp; New-Build Property Dossiers</span>
            <span class="lang-es">Guías del Comprador y Dossieres de Obra Nueva</span>
          </h2>
          <p style="margin:0; font-size:0.83rem; color:#475569;">
            <span class="lang-en">Ready to send via WhatsApp or email to qualified buyers considering Spain's Costa Blanca.</span>
            <span class="lang-es">Listos para enviar por WhatsApp o email a tus clientes interesados en comprar en la Costa Blanca.</span>
          </p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(330px, 1fr)); gap:1.15rem;">
          <!-- Card B2C 1: Guía Completa del Comprador -->
          <div style="background:#fff; border:1px solid #e2e8f0; border-top:4px solid #0672C5; border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 14px rgba(15,23,42,0.04);">
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                <span style="background:rgba(6,114,197,0.10); color:#0672C5; font-size:0.72rem; font-weight:800; padding:4px 10px; border-radius:999px;">
                  📘 <span class="lang-en">16 pages · A4 · 4 Languages</span><span class="lang-es">16 págs. · A4 · 4 Idiomas</span>
                </span>
                <a href="dossier.html" target="_blank" rel="noopener" style="font-size:0.76rem; font-weight:600; color:#64748b; text-decoration:none;">
                  👁️ <span class="lang-en">Base Guide ↗</span><span class="lang-es">Ver Base ↗</span>
                </a>
              </div>
              <h3 style="margin:0 0 6px; font-size:1.05rem; font-weight:800; color:#0f172a;">
                <span class="lang-en">Complete Spain Buyer's Guide</span>
                <span class="lang-es">Guía Completa del Comprador en España</span>
              </h3>
              <p style="margin:0; font-size:0.82rem; color:#475569; line-height:1.45;">
                <span class="lang-en">Step-by-step roadmap: buying process, NIE, taxes, non-resident mortgages up to 70% LTV (UCI) &amp; legal due diligence (Fuster). Personalized on the closing letter (p. 15) and back cover (p. 16).</span>
                <span class="lang-es">Paso a paso de compra segura: proceso legal, NIE, impuestos, hipoteca no residente hasta 70 % (UCI) y respaldo de Fuster &amp; Associates. Personalizada en la carta final (pág. 15) y contraportada (pág. 16).</span>
              </p>
              ${renderLangPills('buyer_guide', App.buyerGuide.LANGS)}
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9;">
              <button type="button" class="btn btn-primary btn-sm" data-doc-action="download" data-doc-kind="buyer_guide" style="flex:1; justify-content:center; font-weight:700; padding:9px 14px; border-radius:9px;">
                📥 <span class="lang-en">Download Personalized PDF</span><span class="lang-es">Descargar PDF Personalizado</span>
              </button>
              <button type="button" class="btn btn-outline btn-sm" data-doc-action="open" data-doc-kind="buyer_guide" style="background:#fff; font-weight:600; padding:9px 13px; border-radius:9px;">
                📄 <span class="lang-en">Open PDF</span><span class="lang-es">Abrir PDF</span>
              </button>
            </div>
          </div>

          <!-- Card B2C 2: Dossier de Obra Nueva y Oportunidades -->
          <div style="background:#fff; border:1px solid #e2e8f0; border-top:4px solid #fe8933; border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 14px rgba(15,23,42,0.04);">
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                <span style="background:rgba(254,137,51,0.14); color:#c2410c; font-size:0.72rem; font-weight:800; padding:4px 10px; border-radius:999px;">
                  🏗️ <span class="lang-en">14 slides · 16:9 Panoramic · ES &amp; EN</span><span class="lang-es">14 láminas · Panorámico 16:9 · ES y EN</span>
                </span>
                <button type="button" data-base-preview="new_build_dossier" style="border:none; background:transparent; cursor:pointer; font-size:0.76rem; font-weight:600; color:#64748b; padding:0;">
                  👁️ <span class="lang-en">Base PDF ↗</span><span class="lang-es">Ver Base ↗</span>
                </button>
              </div>
              <h3 style="margin:0 0 6px; font-size:1.05rem; font-weight:800; color:#0f172a;">
                <span class="lang-en">New-Build Properties &amp; Opportunities Dossier</span>
                <span class="lang-es">Dossier de Obra Nueva y Oportunidades</span>
              </h3>
              <p style="margin:0; font-size:0.82rem; color:#475569; line-height:1.45;">
                <span class="lang-en">Architectural showcase of verified Costa Blanca new-build developments (from €320k apartments to golf &amp; sea-view villas), stage-payment guarantees &amp; yields. Personalized with your contact card on Slide 14.</span>
                <span class="lang-es">Catálogo arquitectónico de promociones verificadas de obra nueva en Costa Blanca (desde 320.000 € hasta áticos y villas golf), avales bancarios y rentabilidades. Personalizado con tu tarjeta en la lámina 14.</span>
              </p>
              ${renderLangPills('new_build_dossier', DOSSIER_FILES)}
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9;">
              <button type="button" class="btn btn-primary btn-sm" data-doc-action="download" data-doc-kind="new_build_dossier" style="flex:1; justify-content:center; font-weight:700; padding:9px 14px; border-radius:9px;">
                📥 <span class="lang-en">Download Personalized PDF</span><span class="lang-es">Descargar PDF Personalizado</span>
              </button>
              <button type="button" class="btn btn-outline btn-sm" data-doc-action="open" data-doc-kind="new_build_dossier" style="background:#fff; font-weight:600; padding:9px 13px; border-radius:9px;">
                📄 <span class="lang-en">Open PDF</span><span class="lang-es">Abrir PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. PRESENTACIONES COMERCIALES B2B -->
      ${availablePresentations.length ? `
        <div class="dashboard-section">
          <div style="margin-bottom:1rem;">
            <div style="font-size:0.73rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#0672C5; margin-bottom:3px;">
              🤝 <span class="lang-en">COMMERCIAL B2B PRESENTATIONS · THE SPAIN CONNECTION</span><span class="lang-es">PRESENTACIONES COMERCIALES B2B · THE SPAIN CONNECTION</span>
            </div>
            <h2 style="margin:0 0 4px; font-size:1.16rem; font-weight:800; color:var(--text-primary, #0f172a);">
              <span class="lang-en">Partner Recruitment &amp; Commercial Decks (Spanish &amp; English)</span>
              <span class="lang-es">Presentaciones Comerciales en Español e Inglés</span>
            </h2>
            <p style="margin:0; font-size:0.83rem; color:#475569;">
              <span class="lang-en">16:9 executive presentations customized on Slide 10 with your headshot, role, agency, and clickable contact links.</span>
              <span class="lang-es">Presentaciones panorámicas 16:9 personalizadas en la diapositiva 10 de cierre con tu foto, cargo, agencia y enlaces de contacto directo.</span>
            </p>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(315px, 1fr)); gap:1.15rem;">
            ${availablePresentations.map(deck => {
              const docKind = 'pres_' + deck.id;
              const matchesTargetRole = deck.allowedRoles.includes(targetUser.role);
              return `
                <div style="background:#fff; border:1px solid #e2e8f0; border-top:4px solid ${deck.accent}; border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 14px rgba(15,23,42,0.04);">
                  <div>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                      <span style="background:${deck.accentBg}; border:1px solid ${deck.accentBorder}; color:#0f172a; font-size:0.72rem; font-weight:800; padding:4px 10px; border-radius:999px;">
                        ${deck.icon} <span class="lang-en">${esc(deck.badgeEn)}</span><span class="lang-es">${esc(deck.badgeEs)}</span>
                      </span>
                      <button type="button" data-base-preview="${esc(docKind)}" style="border:none; background:transparent; cursor:pointer; font-size:0.76rem; font-weight:600; color:#64748b; padding:0;">
                        👁️ <span class="lang-en">Base PDF ↗</span><span class="lang-es">Ver Base ↗</span>
                      </button>
                    </div>
                    ${isAdminViewer && !matchesTargetRole ? `
                      <div style="font-size:0.71rem; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:6px; padding:3px 8px; margin-bottom:6px; display:inline-block; font-weight:600;">
                        🛡️ Visible modo Admin
                      </div>
                    ` : ''}
                    <h3 style="margin:0 0 6px; font-size:1.03rem; font-weight:800; color:#0f172a;">
                      <span class="lang-en">${esc(deck.titleEn)}</span>
                      <span class="lang-es">${esc(deck.titleEs)}</span>
                    </h3>
                    <p style="margin:0; font-size:0.82rem; color:#475569; line-height:1.45;">
                      <span class="lang-en">${esc(deck.descEn)}</span>
                      <span class="lang-es">${esc(deck.descEs)}</span>
                    </p>
                    ${renderLangPills(docKind, deck.files)}
                  </div>
                  <div style="display:flex; gap:8px; flex-wrap:wrap; padding-top:8px; border-top:1px solid #f1f5f9;">
                    <button type="button" class="btn btn-primary btn-sm" data-doc-action="download" data-doc-kind="${esc(docKind)}" style="flex:1; justify-content:center; font-weight:700; padding:9px 14px; border-radius:9px;">
                      📥 <span class="lang-en">Download Personalized PDF</span><span class="lang-es">Descargar PDF Personalizado</span>
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" data-doc-action="open" data-doc-kind="${esc(docKind)}" style="background:#fff; font-weight:600; padding:9px 13px; border-radius:9px;">
                      📄 <span class="lang-en">Open PDF</span><span class="lang-es">Abrir PDF</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 4. VÍDEOS PERSONALIZADOS (EN) -->
      <div id="${uid}-videos"></div>
    `;

    const $ = (suffix) => container.querySelector(`#${uid}-${suffix}`);
    const previewEl = $('photo-preview');
    const statusEl = $('status');

    // Mount integrated Referral Branding editor inside collapsible details
    const brandingSlot = $('branding-slot');
    if (brandingSlot && canShowBranding) {
      App.referralBranding.renderEditor(brandingSlot, targetUser, { compact: true, uid: uid + '-rb' });
    }

    const readForm = () => ({
      name: $('name') ? $('name').value : '',
      title: $('title') ? $('title').value : '',
      mobile: $('mobile') ? $('mobile').value : '',
      email: $('email') ? $('email').value : '',
      website: $('website') ? $('website').value : DEFAULT_WEBSITE,
      photo: currentPhoto
    });

    const refreshStatus = () => {
      if (previewEl) {
        if (currentPhoto) {
          previewEl.style.backgroundImage = `url("${currentPhoto}")`;
          previewEl.innerHTML = '';
        } else {
          previewEl.style.backgroundImage = 'none';
          previewEl.innerHTML = '<span class="lang-en">No photo yet</span><span class="lang-es">Sin foto</span>';
        }
      }
      const missing = App.buyerGuide.getMissing(App.buyerGuide.getGuideData(targetUser, readForm()));
      if (statusEl) {
        statusEl.innerHTML = missing.length
          ? `<span class="badge" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; padding:6px 12px; border-radius:999px; font-size:0.76rem; font-weight:700;">⚠️ <span class="lang-en">Missing: ${esc(missing.map(m => m.en).join(', '))}</span><span class="lang-es">Falta: ${esc(missing.map(m => m.es).join(', '))}</span></span>`
          : `<span class="badge" style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0; padding:6px 12px; border-radius:999px; font-size:0.76rem; font-weight:700;">✅ <span class="lang-en">Ready to personalize all documents</span><span class="lang-es">Identidad lista para todos tus documentos</span></span>`;
      }
      syncLangVisibility();
    };

    const persistIdentity = async (silent) => {
      const formPayload = readForm();
      const fallbackSaved = {
        name: String(formPayload.name || '').trim(),
        title: String(formPayload.title || '').trim(),
        mobile: String(formPayload.mobile || '').trim(),
        email: String(formPayload.email || '').trim(),
        website: String(formPayload.website || '').trim() || DEFAULT_WEBSITE,
        photo: formPayload.photo || null,
        updatedAt: new Date().toISOString()
      };
      App.buyerGuide.saveLocalGuideCache(targetUser.id, fallbackSaved);

      let saved = fallbackSaved;
      if (App.auth && typeof App.auth.updateBuyerGuideProfile === 'function') {
        try {
          saved = await App.auth.updateBuyerGuideProfile(targetUser.id, formPayload);
        } catch (err) {
          console.warn('[MarketingLab] Cloud save fallback to local cache:', err);
        }
      }
      targetUser.buyerGuide = saved;
      window.dispatchEvent(new CustomEvent('buyerGuideUpdated', {
        detail: { userId: targetUser.id, sourceUid: uid, buyerGuide: saved }
      }));
      if (!silent && App.utils) {
        App.utils.showToast(
          isEnglishUI() ? 'Professional identity saved ✅' : 'Identidad profesional guardada ✅',
          'success'
        );
      }
      return saved;
    };

    // Photo upload
    if ($('photo-btn') && $('photo-input')) {
      $('photo-btn').onclick = () => $('photo-input').click();
      $('photo-input').onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
          currentPhoto = await App.buyerGuide.processPhotoFile(file);
          refreshStatus();
          await persistIdentity(true);
          if (App.utils) {
            App.utils.showToast(
              isEnglishUI() ? 'Professional photo saved 📸' : 'Foto profesional guardada 📸',
              'success'
            );
          }
        } catch (err) {
          if (App.utils) App.utils.showToast(err.message || 'Error al procesar foto.', 'error');
        }
      };
    }

    ['name', 'title', 'mobile', 'email', 'website'].forEach(field => {
      const el = $(field);
      if (el) el.addEventListener('input', refreshStatus);
    });

    // Quick website fill chips
    container.querySelectorAll('[data-quick-web]').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-quick-web') || DEFAULT_WEBSITE;
        if ($('website')) {
          $('website').value = val;
          refreshStatus();
        }
      });
    });

    if ($('save-btn')) {
      $('save-btn').onclick = async () => {
        const btn = $('save-btn');
        btn.disabled = true;
        try {
          await persistIdentity(false);
        } catch (err) {
          if (App.utils) App.utils.showToast(err.message || 'Error al guardar.', 'error');
        } finally {
          btn.disabled = false;
        }
      };
    }

    // Language pill selection per document card
    const selectedLangByDoc = {};
    container.querySelectorAll('[data-doc-lang-group]').forEach(group => {
      const docKey = group.getAttribute('data-doc-lang-group');
      const pills = Array.from(group.querySelectorAll('[data-lang-choice]'));
      selectedLangByDoc[docKey] = pills.find(p => p.style.background.includes('rgb(6, 114, 197)') || p.style.background.includes('#0672C5'))?.getAttribute('data-lang-choice') || defaultLang;
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          const langChoice = pill.getAttribute('data-lang-choice');
          selectedLangByDoc[docKey] = langChoice;
          pills.forEach(other => {
            const isSel = other === pill;
            other.style.borderColor = isSel ? '#0672C5' : '#cbd5e1';
            other.style.background = isSel ? '#0672C5' : '#fff';
            other.style.color = isSel ? '#fff' : '#334155';
          });
        });
      });
    });

    // Base PDF preview buttons
    container.querySelectorAll('[data-base-preview]').forEach(btn => {
      btn.addEventListener('click', () => {
        const docKind = btn.getAttribute('data-base-preview');
        const lang = selectedLangByDoc[docKind] || 'es';
        let baseUrl = '';
        if (docKind === 'new_build_dossier') {
          baseUrl = (DOSSIER_FILES[lang] || DOSSIER_FILES.es).file;
        } else if (docKind.startsWith('pres_')) {
          const deck = PRESENTATION_DECKS[docKind.replace(/^pres_/, '')];
          baseUrl = deck ? (deck.files[lang] || deck.files.es).file : '';
        }
        if (baseUrl) window.open(baseUrl + '?v=' + TEMPLATE_VERSION, '_blank', 'noopener');
      });
    });

    // Download / Open personalized PDF buttons
    container.querySelectorAll('[data-doc-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-doc-action'); // 'download' | 'open'
        const docKind = btn.getAttribute('data-doc-kind');
        const lang = selectedLangByDoc[docKind] || 'es';
        const formValues = readForm();
        const missing = App.buyerGuide.getMissing(App.buyerGuide.getGuideData(targetUser, formValues));
        if (missing.length) {
          const msg = isEnglishUI()
            ? 'Please complete first: ' + missing.map(m => m.en).join(', ')
            : 'Completa antes en el Paso 1: ' + missing.map(m => m.es).join(', ');
          if (App.utils) App.utils.showToast(msg, 'error');
          if (!currentPhoto && $('photo-btn')) {
            $('photo-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        const preWin = action === 'open' ? window.open('about:blank', '_blank') : null;
        const oldHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${isEnglishUI() ? 'Generating PDF...' : 'Generando PDF...'}`;

        try {
          try {
            await persistIdentity(true);
          } catch (_) {}

          const result = await buildDocumentBytes(docKind, lang, targetUser, formValues);
          if (action === 'open') {
            openBytesInTab(result.bytes, preWin);
            if (App.utils) {
              App.utils.showToast(
                isEnglishUI() ? 'Personalized PDF opened in a new tab 📄' : 'PDF personalizado abierto en nueva pestaña 📄',
                'success'
              );
            }
          } else {
            App.buyerGuide.triggerDownload(result.bytes, result.fileName);
            if (App.utils) {
              App.utils.showToast(
                isEnglishUI() ? 'Personalized PDF downloaded 📥' : 'Documento personalizado descargado 📥',
                'success'
              );
            }
          }
        } catch (err) {
          if (preWin && !preWin.closed) preWin.close();
          console.error('[MarketingLab] PDF generation error:', err);
          if (App.utils) App.utils.showToast(err.message || 'Error al generar el PDF.', 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = oldHtml;
          syncLangVisibility();
        }
      });
    });

    // External sync (e.g. if agencyName/agencyLogo or buyerGuide updated elsewhere)
    const onGuideSync = (ev) => {
      const d = ev && ev.detail;
      if (!d || d.userId !== targetUser.id || d.sourceUid === uid || !d.buyerGuide) return;
      targetUser.buyerGuide = d.buyerGuide;
      currentPhoto = d.buyerGuide.photo || targetUser.profileImage || null;
      if ($('name')) $('name').value = d.buyerGuide.name || `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim();
      if ($('title')) $('title').value = d.buyerGuide.title || '';
      if ($('mobile')) $('mobile').value = d.buyerGuide.mobile || targetUser.phone || '';
      if ($('email')) $('email').value = d.buyerGuide.email || targetUser.email || '';
      if ($('website')) $('website').value = d.buyerGuide.website || DEFAULT_WEBSITE;
      refreshStatus();
    };
    const onBrandingSync = (ev) => {
      const d = ev && ev.detail;
      if (!d || d.userId !== targetUser.id) return;
      targetUser.agencyName = d.agencyName || '';
      targetUser.agencyLogo = d.agencyLogo || null;
    };
    window.addEventListener('buyerGuideUpdated', onGuideSync);
    window.addEventListener('agencyBrandingUpdated', onBrandingSync);
    container._mlSyncCleanup = () => {
      window.removeEventListener('buyerGuideUpdated', onGuideSync);
      window.removeEventListener('agencyBrandingUpdated', onBrandingSync);
    };

    // Vídeos personalizados: la tarjeta de contacto final se genera con la identidad del usuario
    if (App.marketingVideos && $('videos')) {
      App.marketingVideos.renderSection($('videos'), targetUser, {
        isAdminViewer,
        getCardData: () => {
          const d = App.buyerGuide.getGuideData(targetUser, readForm());
          if (App.buyerGuide.getMissing(d).length) return null;
          return {
            name: App.buyerGuide.pdfSafe(d.name),
            title: getEffectiveTitle(Object.assign({}, d, { agencyName: targetUser.agencyName || '' }), 'en'),
            mobile: d.mobile,
            email: d.email,
            photo: d.photo,
            agencyLogo: targetUser.agencyLogo || null
          };
        },
        onMissing: () => {
          const missing = App.buyerGuide.getMissing(App.buyerGuide.getGuideData(targetUser, readForm()));
          const msg = isEnglishUI()
            ? 'Please complete first: ' + missing.map(m => m.en).join(', ')
            : 'Completa antes en el Paso 1: ' + missing.map(m => m.es).join(', ');
          if (App.utils) App.utils.showToast(msg, 'error');
          if (!currentPhoto && $('photo-btn')) $('photo-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        beforeExport: () => persistIdentity(true)
      });
    }

    refreshStatus();
  }

  /* ---------- Router View Entry Point (#<role>/marketing) ---------- */

  async function initView() {
    const root = document.getElementById('marketing-lab-root');
    if (!root) return;
    const currentUser = App.auth && App.auth.getCurrentUser ? App.auth.getCurrentUser() : null;
    if (!currentUser) {
      window.location.href = 'index.html#login';
      return;
    }

    // Hydrate fresh user profile if available
    let freshMe = currentUser;
    let allUsers = [];
    if (currentUser.role === 'admin' && App.auth && typeof App.auth.getAllUsers === 'function') {
      try {
        allUsers = await App.auth.getAllUsers();
        freshMe = allUsers.find(u => u.id === currentUser.id) || currentUser;
      } catch (_) {}
    } else if (App.auth && typeof App.auth.getUser === 'function') {
      try {
        const loaded = await App.auth.getUser(currentUser.id);
        if (loaded) freshMe = loaded;
      } catch (_) {}
    }

    const isAdmin = freshMe.role === 'admin';
    let adminBarHtml = '';

    if (isAdmin && allUsers.length) {
      const roleLabels = {
        admin: 'Admin',
        agent_inmomas: 'Agente Inmomás',
        embajador: 'Embajador',
        broker: 'Broker',
        realtor: 'Realtor',
        colaborador: 'Colaborador',
        partner: 'Partner'
      };
      const eligible = allUsers
        .filter(u => u.id !== freshMe.id && ['agent_inmomas', 'embajador', 'broker', 'realtor', 'colaborador', 'partner', 'admin'].includes(u.role))
        .sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));

      const optsHtml = [
        `<option value="${esc(freshMe.id)}">🛡️ Mi Perfil de Administración (${esc(`${freshMe.firstName || ''} ${freshMe.lastName || ''}`.trim() || freshMe.email)})</option>`,
        ...eligible.map(u => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id;
          const rTag = roleLabels[u.role] || u.role;
          return `<option value="${esc(u.id)}">[${esc(rTag)}] ${esc(fullName)}${u.agencyName ? ' · ' + esc(u.agencyName) : ''}</option>`;
        })
      ].join('');

      adminBarHtml = `
        <div style="background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:12px 16px; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; box-shadow:0 2px 8px rgba(15,23,42,0.03);">
          <div style="font-size:0.86rem; font-weight:700; color:#1e293b;">
            🛡️ <span class="lang-en">Admin Mode — Customize &amp; Download Documents For:</span><span class="lang-es">Modo Admin — Personalizar y Descargar Documentos Para:</span>
          </div>
          <select id="ml-admin-user-select" class="form-select" style="width:auto; min-width:300px; max-width:100%; padding:8px 34px 8px 12px; font-size:0.86rem; font-weight:600; border-radius:9px; margin:0;">
            ${optsHtml}
          </select>
        </div>
      `;
    }

    root.innerHTML = `
      <div class="dashboard-header">
        <div>
          <h1>🎨 <span class="lang-en">Marketing &amp; Document Customization Lab</span><span class="lang-es">Laboratorio de Marketing y Personalización</span></h1>
          <p class="dashboard-subtitle">
            <span class="lang-en">Personalize and download your official Buyer's Guides, New-Build Property Dossiers (ES/EN) &amp; Commercial Presentations (ES/EN)</span>
            <span class="lang-es">Personaliza con tu foto y contacto tus Guías del Comprador, Dossieres de Obra Nueva (ES/EN) y Presentaciones Comerciales (ES/EN)</span>
          </p>
        </div>
      </div>
      ${adminBarHtml}
      <div id="marketing-lab-workspace"></div>
    `;

    const workspaceEl = document.getElementById('marketing-lab-workspace');
    const mountUser = (selectedId) => {
      const chosen = isAdmin && selectedId && selectedId !== freshMe.id
        ? (allUsers.find(u => u.id === selectedId) || freshMe)
        : freshMe;
      renderLabWorkspace(workspaceEl, chosen, {
        isAdminViewer: isAdmin,
        viewerId: freshMe.id
      });
    };

    mountUser(freshMe.id);

    const adminSelect = document.getElementById('ml-admin-user-select');
    if (adminSelect) {
      adminSelect.addEventListener('change', (e) => mountUser(e.target.value));
    }

    syncLangVisibility();
  }

  return {
    DOSSIER_FILES,
    PRESENTATION_DECKS,
    getPresentationsForRole,
    generateNewBuildDossierPdf,
    generatePresentationPdf,
    renderQuickCard,
    renderLabWorkspace,
    initView
  };
})();
