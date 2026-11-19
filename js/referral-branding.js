/* ============================================
   RE/MAX Inmomás — Self-Service Referral Link Branding (Logo & Agency/Brand)
   ============================================
   Allows Brokers, Independent Realtors, Colaboradores, Partners, and
   Embajadores to customize their Referral Link & Client Webinar Link
   with their own logo (agencyLogo) and agency/company/brand name (agencyName).

   RULE: If a Realtor is under a Broker's umbrella (brokerId or referredBy -> broker),
   their logo MUST match their Broker's logo and CANNOT be edited by the Realtor.
   ============================================ */

window.App = window.App || {};

App.referralBranding = (function() {
  const ALLOWED_ROLES = ['broker', 'realtor', 'colaborador', 'embajador', 'partner'];

  function canUse(user) {
    return !!(user && ALLOWED_ROLES.includes(user.role));
  }

  function esc(str) {
    if (App.utils && typeof App.utils.escapeHtml === 'function') {
      return App.utils.escapeHtml(str || '');
    }
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Formato de imagen no válido. Usa PNG, JPG, WebP o SVG.'));
      img.src = src;
    });
  }

  /**
   * Resizes logo preserving aspect ratio and transparency (PNG/WebP),
   * keeping payload compact (< ~120 KB) for Firestore user documents.
   */
  async function processLogoFile(file) {
    if (!file || !/^image\//.test(file.type)) {
      throw new Error('Selecciona un archivo de imagen válido (PNG, JPG, WebP o SVG).');
    }
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('El archivo supera el máximo permitido (12 MB).');
    }

    const rawDataUrl = await readFileAsDataURL(file);
    const img = await loadImage(rawDataUrl);

    const renderScaled = (maxW, maxH, mime, quality) => {
      let w = img.naturalWidth || img.width || maxW;
      let h = img.naturalHeight || img.height || maxH;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      return quality !== undefined ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);
    };

    let result = renderScaled(420, 160, 'image/png');
    if (result.length > 165000) {
      result = renderScaled(320, 120, 'image/webp', 0.88);
    }
    if (result.length > 165000) {
      result = renderScaled(280, 105, 'image/png');
    }
    return result;
  }

  function getRoleFieldLabels(role) {
    if (role === 'broker') {
      return {
        labelEn: 'Brokerage / Office Name',
        labelEs: 'Nombre de tu Agencia / Oficina',
        placeholder: 'RE/MAX Premier, Keller Williams, Coldwell Banker...'
      };
    }
    if (role === 'colaborador' || role === 'partner') {
      return {
        labelEn: 'Company / Firm / Brand Name',
        labelEs: 'Nombre de tu Empresa / Despacho / Marca',
        placeholder: 'Ej. Despacho Jurídico, Consultoría, Agencia...'
      };
    }
    if (role === 'embajador') {
      return {
        labelEn: 'Brand / Agency / Organization Name',
        labelEs: 'Nombre de tu Marca / Agencia / Organización',
        placeholder: 'Ej. Grupo Inmobiliario, Asociación, Marca Personal...'
      };
    }
    return {
      labelEn: 'Agency / Team Name (Independent)',
      labelEs: 'Nombre de tu Agencia / Marca (Independiente)',
      placeholder: 'Ej. Marca Personal, Equipo Inmobiliario...'
    };
  }

  function buildPreviewUrl(user) {
    if (!user) return '';
    let code = user.referralCode || '';
    if (user.role === 'partner') {
      const pType = user.partnerType || '';
      if (pType === 'needsUCI') code = 'UCI';
      else if (pType === 'needsFuster') code = 'Fuster & Associates';
      else if (pType === 'needsHolidays') code = 'Inmomás Holidays';
    }
    if (!code || user.status === 'pending') return '';
    return App.utils && typeof App.utils.generateReferralLink === 'function'
      ? App.utils.generateReferralLink(code)
      : `index.html?ref=${encodeURIComponent(code)}`;
  }

  function syncLangVisibility() {
    if (window.App && typeof window.App.updateLangDisplay === 'function') {
      window.App.updateLangDisplay();
    }
  }

  /**
   * Resolves the parent Broker if `user` is a Realtor under a Broker's umbrella.
   */
  async function resolveParentBrokerForRealtor(user) {
    if (!user || user.role !== 'realtor') return null;

    if (user.brokerId && App.auth && typeof App.auth.getUser === 'function') {
      try {
        const directBroker = await App.auth.getUser(user.brokerId);
        if (directBroker) return directBroker;
      } catch (_) {}
    }

    if (user.referredBy && App.auth && typeof App.auth.getAllUsers === 'function') {
      try {
        const allUsers = await App.auth.getAllUsers();
        if (App.utils && typeof App.utils.resolveUserUmbrellaParents === 'function') {
          const parents = App.utils.resolveUserUmbrellaParents(user, allUsers);
          if (parents && parents.broker) return parents.broker;
        }
        const refUpper = String(user.referredBy).trim().toUpperCase();
        const found = (allUsers || []).find(u =>
          u.role === 'broker' && (
            u.id === user.referredBy ||
            (u.referralCode && String(u.referralCode).trim().toUpperCase() === refUpper)
          )
        );
        if (found) return found;
      } catch (_) {}
    }

    // If brokerId is present even if broker doc wasn't fetched, still treat as locked under Broker
    if (user.brokerId) {
      return {
        id: user.brokerId,
        firstName: '',
        lastName: '',
        agencyName: user.agencyName || '',
        agencyLogo: user.agencyLogo || null
      };
    }

    return null;
  }

  /**
   * Renders a read-only / locked view for Realtors who belong to a Broker's umbrella.
   */
  function renderLockedBrokerView(container, user, broker, options = {}) {
    const compact = !!options.compact;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Realtor';
    const brokerFullName = `${broker.firstName || ''} ${broker.lastName || ''}`.trim();
    const effectiveAgency = (broker.agencyName || user.agencyName || '').trim();
    const effectiveLogo = broker.agencyLogo || null;
    const previewHref = buildPreviewUrl(user);

    const wrapperStyle = compact
      ? 'margin-top: 16px; padding: 16px 18px; border-radius: 14px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(0, 67, 255, 0.045) 100%); border: 1px solid rgba(0, 67, 255, 0.18);'
      : 'padding: 20px; border-radius: 14px; background: linear-gradient(135deg, rgba(0, 67, 255, 0.035) 0%, rgba(16, 185, 129, 0.04) 100%); border: 1px solid rgba(0, 67, 255, 0.18);';

    container.innerHTML = `
      <div style="${wrapperStyle}">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:${compact ? '1rem' : '1.1rem'}; font-weight:700; color:var(--text-primary, #0f172a); display:flex; align-items:center; gap:7px;">
              <span>🏢</span>
              <span class="lang-en">Official Brokerage Logo on Your Referral Links</span>
              <span class="lang-es">Logo Oficial de tu Broker en tus Referral Links</span>
            </h3>
            <p style="margin:0; font-size:0.81rem; color:var(--text-secondary, #475569); max-width:700px; line-height:1.45;">
              <span class="lang-en">Because your account is under a <strong>Broker's umbrella</strong>, your links automatically display your Broker's official logo and brokerage name and cannot be modified individually.</span>
              <span class="lang-es">Al formar parte del <strong>paraguas de un Broker</strong>, tus enlaces utilizan obligatoriamente el mismo logo oficial y agencia de tu Broker y no pueden editarse de forma individual.</span>
            </p>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe; padding:4px 11px; border-radius:999px; font-size:0.74rem; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
              🔒 <span class="lang-en">Managed by your Broker</span><span class="lang-es">Gestionado por tu Broker</span>
            </span>
            ${previewHref ? `
              <a href="${esc(previewHref)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="background:#fff; text-decoration:none; font-size:0.78rem; padding:5px 11px; border-radius:8px;">
                👁️ <span class="lang-en">Open My Link</span><span class="lang-es">Ver mi Link</span> ↗
              </a>
            ` : ''}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(265px, 1fr)); gap:16px; align-items:stretch;">
          <!-- Left column: Read-only Broker Umbrella Details -->
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <div style="width:148px; height:64px; border:1.5px solid #e2e8f0; border-radius:10px; background:#f8fafc; display:flex; align-items:center; justify-content:center; padding:6px; overflow:hidden; flex-shrink:0;">
                ${effectiveLogo
                  ? `<img src="${esc(effectiveLogo)}" alt="Logo Broker" style="max-width:100%; max-height:100%; object-fit:contain;">`
                  : `<span style="font-size:0.73rem; color:#94a3b8; font-weight:600; text-align:center;"><span class="lang-en">Pending Broker logo</span><span class="lang-es">Pendiente del Broker</span></span>`
                }
              </div>
              <div style="flex:1; min-width:150px;">
                <div style="font-size:0.73rem; font-weight:700; text-transform:uppercase; letter-spacing:0.03em; color:#64748b; margin-bottom:3px;">
                  <span class="lang-en">Your Broker Umbrella</span><span class="lang-es">Tu Paraguas Broker</span>
                </div>
                <div style="font-size:0.9rem; font-weight:700; color:#0f172a;">
                  ${esc(effectiveAgency || brokerFullName || 'Broker')}
                </div>
                ${brokerFullName && effectiveAgency && brokerFullName.toLowerCase() !== effectiveAgency.toLowerCase() ? `
                  <div style="font-size:0.79rem; color:#475569; margin-top:2px;">Broker: ${esc(brokerFullName)}</div>
                ` : ''}
              </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:9px 11px; font-size:0.77rem; color:#475569; line-height:1.4;">
              🔒 <span class="lang-en">Any logo update made by your Broker automatically updates your Referral Link and Client Webinar Link.</span>
              <span class="lang-es">Cualquier cambio de logo que realice tu Broker actualizará automáticamente tu Referral Link y tu Link de Webinario.</span>
            </div>
          </div>

          <!-- Right column: Live Referral Header Card Preview -->
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
            <div style="font-size:0.74rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#64748b; margin-bottom:10px;">
              ✨ <span class="lang-en">How Clients &amp; Colleagues See Your Link</span><span class="lang-es">Así se ve tu Referral Link</span>
            </div>

            <div style="margin:auto 0; padding:16px 18px; border-radius:14px; background:linear-gradient(135deg, rgba(0, 63, 153, 0.05) 0%, rgba(37, 99, 235, 0.08) 100%); border:1.5px solid rgba(0, 63, 153, 0.16); box-shadow:0 4px 14px rgba(0, 63, 153, 0.05); text-align:center;">
              ${effectiveLogo ? `
                <div style="display:flex; justify-content:center; align-items:center; margin-bottom:10px;">
                  <img src="${esc(effectiveLogo)}" alt="Agency Logo" style="max-height:54px; max-width:200px; width:auto; height:auto; object-fit:contain; border-radius:6px;">
                </div>
              ` : ''}
              <div style="font-weight:600; color:#0f172a; font-size:0.93rem;">
                <span class="lang-en">Personalized link of <strong>${esc(fullName)}</strong></span>
                <span class="lang-es">Enlace personalizado de <strong>${esc(fullName)}</strong></span>
              </div>
              ${effectiveAgency && effectiveAgency.toLowerCase() !== fullName.toLowerCase() ? `
                <div style="margin-top:4px; font-size:0.85rem; color:#475569;">
                  <span class="lang-en">Belongs to agency: <strong style="color:#003f99;">${esc(effectiveAgency)}</strong></span>
                  <span class="lang-es">Pertenece a la agencia: <strong style="color:#003f99;">${esc(effectiveAgency)}</strong></span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    syncLangVisibility();
  }

  function renderEditableView(container, user, options = {}) {
    const compact = !!options.compact;
    const safeId = (options.uid || container.id || ('rb-' + Math.random().toString(36).slice(2, 8))).replace(/[^a-zA-Z0-9_-]/g, '');
    const uid = 'rb-' + safeId;

    let ownLogo = user.agencyLogo || null;
    const isBroker = user.role === 'broker';
    const fieldMeta = getRoleFieldLabels(user.role);
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Partner';
    const previewHref = buildPreviewUrl(user);

    const wrapperStyle = compact
      ? 'margin-top: 16px; padding: 16px 18px; border-radius: 14px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(0, 67, 255, 0.045) 100%); border: 1px solid rgba(0, 67, 255, 0.18);'
      : 'padding: 20px; border-radius: 14px; background: linear-gradient(135deg, rgba(0, 67, 255, 0.035) 0%, rgba(16, 185, 129, 0.04) 100%); border: 1px solid rgba(0, 67, 255, 0.18);';

    container.innerHTML = `
      <div style="${wrapperStyle}">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px;">
          <div>
            <h3 style="margin:0 0 4px; font-size:${compact ? '1rem' : '1.1rem'}; font-weight:700; color:var(--text-primary, #0f172a); display:flex; align-items:center; gap:7px;">
              <span>🏷️</span>
              <span class="lang-en">Customize Your Referral Links with Your Logo</span>
              <span class="lang-es">Personaliza tu Referral Link con tu Logo y Marca</span>
            </h3>
            <p style="margin:0; font-size:0.81rem; color:var(--text-secondary, #475569); max-width:700px; line-height:1.45;">
              <span class="lang-en">Your logo and agency/brand name appear automatically at the top of your <strong>Professional Referral Link</strong> and your <strong>Exclusive Client Webinar Link</strong>.</span>
              <span class="lang-es">Tu logo y el nombre de tu agencia o marca se muestran automáticamente en la cabecera de tu <strong>Referral Link Profesional</strong> y de tu <strong>Link de Webinario para Clientes</strong>.</span>
            </p>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span id="${uid}-status-pill"></span>
            ${previewHref ? `
              <a href="${esc(previewHref)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="background:#fff; text-decoration:none; font-size:0.78rem; padding:5px 11px; border-radius:8px;">
                👁️ <span class="lang-en">Open My Link</span><span class="lang-es">Ver mi Link</span> ↗
              </a>
            ` : ''}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(265px, 1fr)); gap:16px; align-items:stretch;">
          <!-- Left column: Upload Logo + Agency Name + Save -->
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <div id="${uid}-logo-box" style="width:148px; height:64px; border:1.5px dashed #cbd5e1; border-radius:10px; background:#f8fafc; display:flex; align-items:center; justify-content:center; padding:6px; overflow:hidden; flex-shrink:0;"></div>
              <div style="flex:1; min-width:150px; display:flex; flex-direction:column; gap:6px;">
                <input type="file" id="${uid}-file-input" accept="image/*" style="display:none;">
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-outline btn-sm" id="${uid}-upload-btn" style="background:#fff; font-weight:600; font-size:0.79rem; padding:6px 12px; border-radius:8px;">
                    🖼️ <span class="lang-en">Upload Logo</span><span class="lang-es">Subir Logo</span>
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" id="${uid}-remove-btn" style="display:none; color:#dc2626; border-color:#fecaca; background:#fff; font-size:0.78rem; padding:6px 10px; border-radius:8px;">
                    🗑️ <span class="lang-en">Remove</span><span class="lang-es">Quitar</span>
                  </button>
                </div>
                <span style="font-size:0.71rem; color:#64748b; line-height:1.3;">
                  <span class="lang-en">PNG (transparent recommended), JPG, SVG or WebP.</span>
                  <span class="lang-es">PNG (fondo transparente recomendado), JPG, SVG o WebP.</span>
                </span>
              </div>
            </div>

            <div>
              <label for="${uid}-agency-input" style="font-weight:600; font-size:0.78rem; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">${esc(fieldMeta.labelEn)}</span>
                <span class="lang-es">${esc(fieldMeta.labelEs)}</span>
              </label>
              <input type="text" id="${uid}-agency-input" value="${esc(user.agencyName || '')}" placeholder="${esc(fieldMeta.placeholder)}" maxlength="90"
                style="width:100%; padding:8px 11px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem; background:#fff; color:#0f172a; box-sizing:border-box;">
            </div>

            <details style="font-size:0.76rem; color:#475569;">
              <summary style="cursor:pointer; user-select:none; font-weight:600; color:#0043ff;">
                🔗 <span class="lang-en">Or paste a direct logo image URL</span><span class="lang-es">O pegar URL directa de imagen del logo</span>
              </summary>
              <div style="margin-top:6px;">
                <input type="url" id="${uid}-url-input" placeholder="https://tu-web.com/logo.png"
                  value="${ownLogo && !ownLogo.startsWith('data:') ? esc(ownLogo) : ''}"
                  style="width:100%; padding:7px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.8rem; background:#fff; color:#0f172a; box-sizing:border-box;">
              </div>
            </details>

            ${isBroker ? `
              <div style="font-size:0.76rem; color:#1e40af; background:#eff6ff; padding:8px 10px; border-radius:8px; border:1px solid #bfdbfe; line-height:1.35;">
                🏢 <span class="lang-en">This logo and brokerage name are <strong>automatically applied</strong> to all Realtors under your umbrella.</span>
                <span class="lang-es">Este logo y agencia se <strong>aplican automáticamente</strong> a todos los Realtors bajo tu paraguas.</span>
              </div>
            ` : ''}

            <div style="display:flex; align-items:center; gap:8px; margin-top:auto; padding-top:2px;">
              <button type="button" class="btn btn-primary btn-sm" id="${uid}-save-btn" style="border-radius:8px; padding:8px 16px; font-weight:700; width:100%; justify-content:center;">
                💾 <span class="lang-en">Save Logo &amp; Brand</span><span class="lang-es">Guardar Logo y Marca</span>
              </button>
            </div>
          </div>

          <!-- Right column: Live Referral Header Card Preview -->
          <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
            <div style="font-size:0.74rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#64748b; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between;">
              <span>✨ <span class="lang-en">Live Referral Card Preview</span><span class="lang-es">Vista Previa en tu Referral Link</span></span>
            </div>

            <div style="margin:auto 0; padding:16px 18px; border-radius:14px; background:linear-gradient(135deg, rgba(0, 63, 153, 0.05) 0%, rgba(37, 99, 235, 0.08) 100%); border:1.5px solid rgba(0, 63, 153, 0.16); box-shadow:0 4px 14px rgba(0, 63, 153, 0.05); text-align:center;">
              <div id="${uid}-live-logo-wrap" style="display:none; justify-content:center; align-items:center; margin-bottom:10px;">
                <img id="${uid}-live-logo-img" src="" alt="Agency Logo" style="max-height:54px; max-width:200px; width:auto; height:auto; object-fit:contain; border-radius:6px;">
              </div>
              <div style="font-weight:600; color:#0f172a; font-size:0.93rem;">
                <span class="lang-en">Personalized link of <strong>${esc(fullName)}</strong></span>
                <span class="lang-es">Enlace personalizado de <strong>${esc(fullName)}</strong></span>
              </div>
              <div id="${uid}-live-agency-line" style="display:none; margin-top:4px; font-size:0.85rem; color:#475569;"></div>
            </div>

            <p style="margin:10px 0 0; font-size:0.73rem; color:#64748b; text-align:center; line-height:1.35;">
              <span class="lang-en">Displayed automatically when anyone opens your link on mobile or desktop.</span>
              <span class="lang-es">Así verán tu cabecera tus clientes y colegas al abrir tu enlace desde móvil u ordenador.</span>
            </p>
          </div>
        </div>
      </div>
    `;

    const $ = (suffix) => container.querySelector(`#${uid}-${suffix}`);
    const logoBox = $('logo-box');
    const fileInput = $('file-input');
    const uploadBtn = $('upload-btn');
    const removeBtn = $('remove-btn');
    const agencyInput = $('agency-input');
    const urlInput = $('url-input');
    const saveBtn = $('save-btn');
    const statusPill = $('status-pill');
    const liveLogoWrap = $('live-logo-wrap');
    const liveLogoImg = $('live-logo-img');
    const liveAgencyLine = $('live-agency-line');

    const refreshPreview = () => {
      const effectiveLogo = ownLogo || null;
      const effectiveAgency = (agencyInput ? agencyInput.value : '').trim();

      if (logoBox) {
        if (effectiveLogo) {
          logoBox.innerHTML = `<img src="${esc(effectiveLogo)}" alt="Logo" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        } else {
          logoBox.innerHTML = `<span style="font-size:0.74rem; color:#94a3b8; font-weight:600; text-align:center;"><span class="lang-en">No logo</span><span class="lang-es">Sin logo</span></span>`;
        }
      }

      if (removeBtn) {
        removeBtn.style.display = ownLogo ? 'inline-flex' : 'none';
      }

      if (liveLogoWrap && liveLogoImg) {
        if (effectiveLogo) {
          liveLogoImg.src = effectiveLogo;
          liveLogoWrap.style.display = 'flex';
        } else {
          liveLogoImg.src = '';
          liveLogoWrap.style.display = 'none';
        }
      }

      if (liveAgencyLine) {
        if (effectiveAgency && effectiveAgency.toLowerCase() !== fullName.toLowerCase()) {
          liveAgencyLine.style.display = 'block';
          liveAgencyLine.innerHTML = `
            <span class="lang-en">Belongs to agency: <strong style="color:#003f99;">${esc(effectiveAgency)}</strong></span>
            <span class="lang-es">Pertenece a la agencia: <strong style="color:#003f99;">${esc(effectiveAgency)}</strong></span>
          `;
        } else {
          liveAgencyLine.style.display = 'none';
          liveAgencyLine.innerHTML = '';
        }
      }

      if (statusPill) {
        if (ownLogo) {
          statusPill.innerHTML = `<span style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0; padding:4px 10px; border-radius:999px; font-size:0.74rem; font-weight:700; display:inline-flex; align-items:center; gap:4px;">✅ <span class="lang-en">Custom logo active</span><span class="lang-es">Logo personalizado activo</span></span>`;
        } else {
          statusPill.innerHTML = `<span style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:4px 10px; border-radius:999px; font-size:0.74rem; font-weight:600; display:inline-flex; align-items:center; gap:4px;">⚪ <span class="lang-en">No logo uploaded yet</span><span class="lang-es">Sin logo subido aún</span></span>`;
        }
      }

      syncLangVisibility();
    };

    const persistBranding = async ({ silentToast = false, customToastEs = '', customToastEn = '' } = {}) => {
      const newAgencyName = (agencyInput ? agencyInput.value : '').trim();

      const res = await App.auth.updateUserAgencyBranding(user.id, {
        agencyName: newAgencyName,
        agencyLogo: ownLogo,
        applyToOffice: isBroker
      });

      user.agencyName = newAgencyName;
      user.agencyLogo = ownLogo || null;

      window.dispatchEvent(new CustomEvent('agencyBrandingUpdated', {
        detail: {
          userId: user.id,
          sourceUid: uid,
          agencyName: newAgencyName,
          agencyLogo: ownLogo || null,
          updatedCount: (res && res.updatedCount) || 1
        }
      }));

      if (!silentToast && App.utils && typeof App.utils.showToast === 'function') {
        const isEn = document.body.classList.contains('lang-en') || document.body.classList.contains('lang-en-ca');
        const teamSuffix = isBroker && res && res.updatedCount > 1
          ? (isEn ? ` (${res.updatedCount} umbrella members synced)` : ` (${res.updatedCount} miembros del paraguas sincronizados)`)
          : '';
        const msg = isEn
          ? (customToastEn || `Logo and brand saved to your referral links!${teamSuffix}`)
          : (customToastEs || `Logo y marca guardados en tu Referral Link${teamSuffix} ✅`);
        App.utils.showToast(msg, 'success');
      }
      return res;
    };

    if (uploadBtn && fileInput) {
      uploadBtn.onclick = () => fileInput.click();
      fileInput.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        const oldBtnHtml = uploadBtn.innerHTML;
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner"></span>';
        try {
          ownLogo = await processLogoFile(file);
          if (urlInput) urlInput.value = '';
          refreshPreview();
          await persistBranding({
            customToastEs: 'Logo subido y activado en tus enlaces de referido 🖼️',
            customToastEn: 'Logo uploaded and activated on your referral links! 🖼️'
          });
        } catch (err) {
          if (App.utils) App.utils.showToast(err.message || 'Error al procesar el logo.', 'error');
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = oldBtnHtml;
          syncLangVisibility();
        }
      };
    }

    if (removeBtn) {
      removeBtn.onclick = async () => {
        ownLogo = null;
        if (urlInput) urlInput.value = '';
        if (fileInput) fileInput.value = '';
        refreshPreview();
        try {
          await persistBranding({
            customToastEs: 'Logo personalizado eliminado de tu enlace.',
            customToastEn: 'Custom logo removed from your link.'
          });
        } catch (err) {
          if (App.utils) App.utils.showToast(err.message || 'Error al quitar el logo.', 'error');
        }
      };
    }

    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const val = urlInput.value.trim();
        if (val) {
          ownLogo = val;
        } else if (ownLogo && !ownLogo.startsWith('data:')) {
          ownLogo = null;
        }
        refreshPreview();
      });
    }

    if (agencyInput) {
      agencyInput.addEventListener('input', refreshPreview);
    }

    if (saveBtn) {
      saveBtn.onclick = async () => {
        const oldHtml = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span>';
        try {
          await persistBranding();
        } catch (err) {
          console.error('[ReferralBranding] Save error:', err);
          if (App.utils) App.utils.showToast('Error al guardar: ' + (err.message || err), 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = oldHtml;
          syncLangVisibility();
        }
      };
    }

    const onExternalSync = (ev) => {
      const d = ev && ev.detail;
      if (!d || d.userId !== user.id || d.sourceUid === uid) return;
      user.agencyName = d.agencyName || '';
      user.agencyLogo = d.agencyLogo || null;
      ownLogo = user.agencyLogo;
      if (agencyInput) agencyInput.value = user.agencyName;
      if (urlInput) urlInput.value = ownLogo && !ownLogo.startsWith('data:') ? ownLogo : '';
      refreshPreview();
    };
    window.addEventListener('agencyBrandingUpdated', onExternalSync);
    container._rbSyncCleanup = () => window.removeEventListener('agencyBrandingUpdated', onExternalSync);

    refreshPreview();
  }

  function renderEditor(container, user, options = {}) {
    if (!container || !user) return;
    if (container._rbSyncCleanup) {
      container._rbSyncCleanup();
      container._rbSyncCleanup = null;
    }

    // For Realtors: first check whether they belong to a Broker's umbrella before showing any editable controls
    if (user.role === 'realtor') {
      if (user.brokerId) {
        // Immediately render locked skeleton with current info, then hydrate with fresh Broker doc
        renderLockedBrokerView(container, user, {
          id: user.brokerId,
          agencyName: user.agencyName || '',
          agencyLogo: user.agencyLogo || null
        }, options);
        resolveParentBrokerForRealtor(user).then((broker) => {
          if (broker) renderLockedBrokerView(container, user, broker, options);
        });
        return;
      }

      if (user.referredBy) {
        resolveParentBrokerForRealtor(user).then((broker) => {
          if (broker) {
            renderLockedBrokerView(container, user, broker, options);
          } else {
            renderEditableView(container, user, options);
          }
        });
        return;
      }
    }

    renderEditableView(container, user, options);
  }

  return {
    ALLOWED_ROLES,
    canUse,
    processLogoFile,
    resolveParentBrokerForRealtor,
    renderEditor
  };
})();
