/* ============================================
   RE/MAX Inmomás — B2B & Client Tracking Views
   ============================================
   Shared by Admin (all records) and Agente Inmomás
   (records linked/assigned to the logged-in agent).
   ============================================ */

window.App = window.App || {};
App.views = App.views || {};

App.views.tracking = (function() {
  let currentUser = null;
  let allUsers = [];
  let allClients = [];
  let lookupMaps = null;

  // Filtered/computed caches for modals & Excel export
  let cachedB2BRows = [];
  let cachedClientRows = [];

  const B2B_ROLES = ['embajador', 'broker', 'realtor', 'colaborador'];

  const CHANNEL_META = {
    llamada:      { icon: '📞', es: 'Llamada',      en: 'Call' },
    whatsapp:     { icon: '💬', es: 'WhatsApp',     en: 'WhatsApp' },
    email:        { icon: '✉️', es: 'Email',        en: 'Email' },
    videollamada: { icon: '🎥', es: 'Videollamada', en: 'Video Call' },
    reunion:      { icon: '🤝', es: 'Reunión',      en: 'Meeting' },
    visita:       { icon: '🏡', es: 'Visita',       en: 'Property Visit' },
    evento:       { icon: '🎙️', es: 'Webinar / Evento', en: 'Webinar / Event' },
    otro:         { icon: '📝', es: 'Otro',         en: 'Other' }
  };

  const TEMP_META = {
    hot:  { icon: '🔥', es: 'Caliente', en: 'Hot',  rangeEs: '0 a 6 meses',  rangeEn: '0–6 months',  monthsMin: 0,  monthsMax: 6,  cls: 'trk-temp--hot' },
    warm: { icon: '🌤️', es: 'Templado', en: 'Warm', rangeEs: '6 a 12 meses', rangeEn: '6–12 months', monthsMin: 6,  monthsMax: 12, cls: 'trk-temp--warm' },
    cold: { icon: '❄️', es: 'Frío',     en: 'Cold', rangeEs: '+ de 12 meses', rangeEn: '12+ months', monthsMin: 12, monthsMax: null, cls: 'trk-temp--cold' }
  };

  function esc(v) {
    return App.utils && App.utils.escapeHtml ? App.utils.escapeHtml(String(v ?? '')) : String(v ?? '');
  }

  function canEdit() {
    return Boolean(currentUser && currentUser.role === 'agent_inmomas');
  }

  function normalizePipelinePhase(status) {
    const map = {
      'new': 'contacted',
      'seguimiento': 'contacted',
      'options_sent': 'first_property_meeting',
      'offer_made': 'negotiation',
      'notary_pending': 'negotiation',
      'completed': 'closed'
    };
    const s = String(status || 'contacted').trim();
    return map[s] || s;
  }

  function getPipelinePhaseList() {
    const order = (App.utils && Array.isArray(App.utils.clientStatusOrder))
      ? App.utils.clientStatusOrder
      : ['contacted', 'service_presentation', 'mandate_signed', 'first_property_meeting', 'second_property_meeting', 'properties_visited', 'negotiation', 'closed'];
    const labelsEs = (App.utils && App.utils.clientStatusLabelsEs) || {};
    return order.map(key => ({ key, label: labelsEs[key] || key }));
  }

  function getPipelinePhaseOptionsHtml(selectedPhase) {
    const norm = normalizePipelinePhase(selectedPhase);
    return getPipelinePhaseList()
      .map(p => `<option value="${esc(p.key)}" ${p.key === norm ? 'selected' : ''}>${esc(p.label)}</option>`)
      .join('');
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    const raw = String(dateStr).trim();
    // Handle YYYY-MM-DD cleanly without timezone drift
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return `${m[3]}/${m[2]}/${m[1]}`;
    }
    return App.utils && App.utils.formatDate ? App.utils.formatDate(raw) : raw;
  }

  function parseDateSafe(dateStr) {
    if (!dateStr) return null;
    const raw = String(dateStr).trim();
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  function addMonths(dateObj, months) {
    const d = new Date(dateObj.getTime());
    d.setMonth(d.getMonth() + months);
    return d;
  }

  function formatMonthYear(dateObj) {
    if (!dateObj) return '';
    const lang = (App.utils && App.utils.getCurrentLanguage && App.utils.getCurrentLanguage() === 'en') ? 'en-US' : 'es-ES';
    try {
      const s = dateObj.toLocaleDateString(lang, { month: 'short', year: 'numeric' });
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (_) {
      return `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    }
  }

  function computeTemperatureDeadline(temp, setAtStr) {
    if (!temp || !TEMP_META[temp]) {
      return { hasData: false, elapsedLabel: '', deadlineLabel: '', statusCls: '' };
    }
    const setDate = parseDateSafe(setAtStr);
    if (!setDate) {
      return {
        hasData: true,
        elapsedLabel: 'Sin fecha de seteo',
        deadlineLabel: TEMP_META[temp].rangeEs,
        statusCls: 'trk-deadline--neutral'
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((today - setDate) / (1000 * 60 * 60 * 24));
    const elapsedLabel = diffDays <= 0
      ? 'Seteado hoy'
      : (diffDays === 1 ? 'Hace 1 día' : (diffDays < 60 ? `Hace ${diffDays} días` : `Hace ${Math.floor(diffDays / 30)} meses`));

    if (temp === 'hot') {
      const targetEnd = addMonths(setDate, 6);
      const remDays = Math.ceil((targetEnd - today) / (1000 * 60 * 60 * 24));
      if (remDays < 0) {
        return {
          hasData: true,
          elapsedLabel,
          deadlineLabel: `⚠️ Plazo 6m superado (+${Math.abs(remDays)}d · era ${formatMonthYear(targetEnd)})`,
          statusCls: 'trk-deadline--overdue'
        };
      }
      if (remDays <= 30) {
        return {
          hasData: true,
          elapsedLabel,
          deadlineLabel: `⏳ Vence en ${remDays}d (${formatMonthYear(targetEnd)})`,
          statusCls: 'trk-deadline--soon'
        };
      }
      const remMonths = Math.max(1, Math.round(remDays / 30));
      return {
        hasData: true,
        elapsedLabel,
        deadlineLabel: `🎯 Hasta ${formatMonthYear(targetEnd)} (~${remMonths}m rest.)`,
        statusCls: 'trk-deadline--ok'
      };
    }

    if (temp === 'warm') {
      const winStart = addMonths(setDate, 6);
      const winEnd = addMonths(setDate, 12);
      const remEndDays = Math.ceil((winEnd - today) / (1000 * 60 * 60 * 24));
      if (remEndDays < 0) {
        return {
          hasData: true,
          elapsedLabel,
          deadlineLabel: `⚠️ Ventana 12m superada (${formatMonthYear(winEnd)})`,
          statusCls: 'trk-deadline--overdue'
        };
      }
      if (today >= winStart) {
        return {
          hasData: true,
          elapsedLabel,
          deadlineLabel: `⏳ En ventana activa (hasta ${formatMonthYear(winEnd)})`,
          statusCls: 'trk-deadline--soon'
        };
      }
      return {
        hasData: true,
        elapsedLabel,
        deadlineLabel: `📅 Ventana: ${formatMonthYear(winStart)} – ${formatMonthYear(winEnd)}`,
        statusCls: 'trk-deadline--ok'
      };
    }

    // cold (+12m)
    const horizon = addMonths(setDate, 12);
    return {
      hasData: true,
      elapsedLabel,
      deadlineLabel: `🧊 Horizonte: desde ${formatMonthYear(horizon)}`,
      statusCls: 'trk-deadline--neutral'
    };
  }

  function isPartnerLinkedToAgent(partner, me, users, maps) {
    if (!me) return false;
    const agentFullLower = `${me.firstName || ''} ${me.lastName || ''}`.trim().toLowerCase();
    if (App.utils && App.utils.resolveAssignedInmomasAgent) {
      const res = App.utils.resolveAssignedInmomasAgent(partner, users, maps);
      if (res.id === me.id || (res.name && res.name.toLowerCase() === agentFullLower)) {
        return true;
      }
    }
    if (partner.referredBy && partner.referredBy === me.id) return true;
    if (partner.referredBy && me.referralCode && String(partner.referredBy).toUpperCase() === String(me.referralCode).toUpperCase()) return true;
    if (partner.referredBy && me.email && String(partner.referredBy).toLowerCase() === String(me.email).toLowerCase()) return true;
    if (partner.source && me.email && String(partner.source).toLowerCase() === String(me.email).toLowerCase()) return true;
    return false;
  }

  function computeB2BNetworkCounts(partner, users, clients, maps) {
    const pid = partner.id;
    const pCode = partner.referralCode ? String(partner.referralCode).toUpperCase().trim() : '';
    const pEmail = partner.email ? String(partner.email).toLowerCase().trim() : '';

    const matchesRef = (val) => {
      if (!val) return false;
      const raw = String(val).trim();
      if (raw === pid) return true;
      if (pCode && raw.toUpperCase() === pCode) return true;
      if (pEmail && raw.toLowerCase() === pEmail) return true;
      return false;
    };

    let brokersCount = 0;
    let agentsCount = 0;
    let colaboradoresCount = 0;
    let embajadoresCount = 0;

    users.forEach(u => {
      if (!u || u.id === pid) return;
      if (!B2B_ROLES.includes(u.role)) return;

      const parents = App.utils && App.utils.resolveUserUmbrellaParents
        ? App.utils.resolveUserUmbrellaParents(u, users, maps)
        : { embajador: null, broker: null, directParent: null };

      const belongsUnder =
        (parents.embajador && parents.embajador.id === pid) ||
        (parents.broker && parents.broker.id === pid) ||
        (parents.directParent && parents.directParent.id === pid) ||
        matchesRef(u.referredBy) ||
        (u.brokerId && u.brokerId === pid) ||
        (u.embajadorId && u.embajadorId === pid);

      if (!belongsUnder) return;

      if (u.role === 'broker') brokersCount++;
      else if (u.role === 'realtor') agentsCount++;
      else if (u.role === 'colaborador') colaboradoresCount++;
      else if (u.role === 'embajador') embajadoresCount++;
    });

    let clientsCount = 0;
    clients.forEach(c => {
      if (!c) return;
      const origin = App.utils && App.utils.resolveClientOriginInfo
        ? App.utils.resolveClientOriginInfo(c, users, maps)
        : null;
      const belongs =
        matchesRef(c.referredBy) ||
        matchesRef(c.referredByCode) ||
        (origin && (
          (origin.originUser && origin.originUser.id === pid) ||
          (origin.broker && origin.broker.id === pid) ||
          (origin.embajador && origin.embajador.id === pid)
        ));
      if (belongs) clientsCount++;
    });

    return { clientsCount, brokersCount, agentsCount, colaboradoresCount, embajadoresCount };
  }

  function renderRoleBadge(role) {
    const map = {
      embajador:   { cls: 'trk-role--embajador',   label: '👑 Embajador' },
      broker:      { cls: 'trk-role--broker',      label: '🏢 Broker' },
      realtor:     { cls: 'trk-role--realtor',     label: '🏠 Agente / Realtor' },
      colaborador: { cls: 'trk-role--colaborador', label: '🤝 Colaborador' }
    };
    const m = map[role] || { cls: '', label: esc(role) };
    return `<span class="trk-role-pill ${m.cls}">${m.label}</span>`;
  }

  function renderCountPill(n, title) {
    const num = Number(n) || 0;
    if (num === 0) {
      return `<span class="trk-count-pill trk-count-pill--zero" title="${esc(title)}">0</span>`;
    }
    return `<span class="trk-count-pill trk-count-pill--active" title="${esc(title)}">${num}</span>`;
  }

  function populateAgentFilterSelect(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    if (!currentUser || currentUser.role !== 'admin') {
      sel.style.display = 'none';
      return;
    }
    sel.style.display = '';
    const prevVal = sel.value || '';
    const agents = allUsers
      .filter(u => u.role === 'agent_inmomas' && (u.status === 'active' || u.status === 'approved'))
      .sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));

    sel.innerHTML = `<option value="">🇪🇸 Todos los Agentes Inmomás</option>` +
      agents.map(a => `<option value="${esc(a.id)}">${esc(`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email)}</option>`).join('');
    if (prevVal) sel.value = prevVal;
  }

  /* ============================================
     SECTION 1: SEGUIMIENTO B2B
     ============================================ */
  async function initB2B() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;

    const subtitleEl = document.getElementById('trk-b2b-subtitle');
    if (subtitleEl) {
      subtitleEl.innerHTML = currentUser.role === 'admin'
        ? `<span class="lang-en">Global B2B supervision (read-only) — updates are managed exclusively by each Inmomás Agent.</span>
           <span class="lang-es">Supervisión global B2B (solo lectura) — visualizas todos los Embajadores, Brokers, Agentes y Colaboradores; las actualizaciones las gestiona cada Agente Inmomás.</span>`
        : `<span class="lang-en">Track conversations with your linked Ambassadors, Brokers, Realtors & Collaborators, newsletter status and registered network.</span>
           <span class="lang-es">Registra conversaciones con fecha de tus Embajadores, Brokers, Agentes y Colaboradores, estado de newsletter y cartera registrada a su nombre.</span>`;
    }

    const regSel = document.getElementById('trk-b2b-filter-region');
    if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
      regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
    }

    const tbody = document.getElementById('trk-b2b-table-body');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">Cargando seguimiento B2B...</td></tr>`;
    }

    try {
      [allUsers, allClients] = await Promise.all([
        App.auth.getAllUsers(),
        App.auth.getClients({}, true)
      ]);
      lookupMaps = App.utils && App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
      populateAgentFilterSelect('trk-b2b-filter-agent');
      renderB2BTable();
    } catch (err) {
      console.error('[Tracking] initB2B error:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#ef4444;">Error cargando datos de seguimiento B2B.</td></tr>`;
      }
    }
  }

  function renderB2BTable() {
    const tbody = document.getElementById('trk-b2b-table-body');
    if (!tbody || !currentUser) return;

    const freshMe = allUsers.find(u => u.id === currentUser.id) || currentUser;
    const isAdmin = currentUser.role === 'admin';

    // Base scope
    let partners = allUsers.filter(u => B2B_ROLES.includes(u.role));
    if (!isAdmin) {
      partners = partners.filter(u => isPartnerLinkedToAgent(u, freshMe, allUsers, lookupMaps));
    }

    // Compute counts + assigned agent for every partner
    const enriched = partners.map(p => {
      const counts = computeB2BNetworkCounts(p, allUsers, allClients, lookupMaps);
      const assigned = App.utils && App.utils.resolveAssignedInmomasAgent
        ? App.utils.resolveAssignedInmomasAgent(p, allUsers, lookupMaps)
        : { id: null, name: '' };
      const updates = Array.isArray(p.b2bUpdates) ? p.b2bUpdates : [];
      const latestUpdate = updates[0] || null;
      return {
        user: p,
        counts,
        assigned,
        updates,
        latestUpdate,
        isSubscribed: p.newsletterConsent === true
      };
    });

    // Update KPI cards from scoped universe (before narrow search filters, or after agent/region filter)
    const searchQ = (document.getElementById('trk-b2b-search')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('trk-b2b-filter-role')?.value || '';
    const newsFilter = document.getElementById('trk-b2b-filter-newsletter')?.value || '';
    const regFilter = document.getElementById('trk-b2b-filter-region')?.value || '';
    const agentFilter = isAdmin ? (document.getElementById('trk-b2b-filter-agent')?.value || '') : '';

    let filtered = enriched;
    if (roleFilter) filtered = filtered.filter(r => r.user.role === roleFilter);
    if (newsFilter === 'yes') filtered = filtered.filter(r => r.isSubscribed);
    if (newsFilter === 'no') filtered = filtered.filter(r => !r.isSubscribed);
    if (regFilter && App.utils && App.utils.getUserRegions) {
      filtered = filtered.filter(r => App.utils.getUserRegions(r.user).includes(regFilter));
    }
    if (agentFilter) {
      filtered = filtered.filter(r => r.assigned && r.assigned.id === agentFilter);
    }
    if (searchQ) {
      filtered = filtered.filter(r => {
        const u = r.user;
        const notesText = r.updates.map(up => up.note || '').join(' ');
        const pool = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.agencyName || ''} ${u.country || ''} ${r.assigned?.name || ''} ${notesText}`.toLowerCase();
        return pool.includes(searchQ);
      });
    }

    // Sort: most recently updated first, then by createdAt desc
    filtered.sort((a, b) => {
      const da = a.latestUpdate ? String(a.latestUpdate.date || a.latestUpdate.createdAt || '') : '';
      const db = b.latestUpdate ? String(b.latestUpdate.date || b.latestUpdate.createdAt || '') : '';
      if (db !== da) return db.localeCompare(da);
      return String(b.user.createdAt || '').localeCompare(String(a.user.createdAt || ''));
    });

    cachedB2BRows = filtered;

    // KPI counters
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('trk-b2b-kpi-total', filtered.length);
    setTxt('trk-b2b-kpi-newsletter', filtered.filter(r => r.isSubscribed).length);
    setTxt('trk-b2b-kpi-with-updates', filtered.filter(r => r.updates.length > 0).length);
    setTxt('trk-b2b-kpi-clients', filtered.reduce((acc, r) => acc + r.counts.clientsCount, 0));

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2.25rem; color:var(--text-muted);">
            <span class="lang-en">No B2B partners match your filters.</span>
            <span class="lang-es">No hay contactos B2B que coincidan con los filtros seleccionados.</span>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const u = r.user;
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '—';
      const regBadge = App.utils && App.utils.getUserRegionBadgesHtml ? App.utils.getUserRegionBadgesHtml(u) : '';
      const agentTag = isAdmin && r.assigned && r.assigned.name
        ? `<div class="trk-submeta">🇪🇸 Agente: <strong>${esc(r.assigned.name)}</strong></div>`
        : '';

      const editable = canEdit();
      const newsBtn = editable
        ? (r.isSubscribed
            ? `<button type="button" class="trk-news-btn trk-news-btn--yes" onclick="App.views.tracking.toggleNewsletter('${esc(u.id)}', false)" title="Clic para marcar como NO suscripto">✅ Suscripto</button>`
            : `<button type="button" class="trk-news-btn trk-news-btn--no" onclick="App.views.tracking.toggleNewsletter('${esc(u.id)}', true)" title="Clic para marcar como SUSCRIPTO">⛔ No suscripto</button>`)
        : (r.isSubscribed
            ? `<span class="trk-news-btn trk-news-btn--yes trk-news-btn--readonly" title="Solo los Agentes Inmomás pueden modificar este estado">✅ Suscripto</span>`
            : `<span class="trk-news-btn trk-news-btn--no trk-news-btn--readonly" title="Solo los Agentes Inmomás pueden modificar este estado">⛔ No suscripto</span>`);

      let lastUpdateHtml = `<span style="color:#94a3b8;font-size:0.8rem;font-style:italic;">Sin seguimiento aún</span>`;
      if (r.latestUpdate) {
        const ch = CHANNEL_META[r.latestUpdate.channel] || CHANNEL_META.otro;
        const snippet = r.latestUpdate.note.length > 80
          ? r.latestUpdate.note.slice(0, 80) + '…'
          : r.latestUpdate.note;
        lastUpdateHtml = `
          <div class="trk-last-update">
            <div class="trk-last-update__meta">
              <span class="trk-date-chip">📅 ${formatShortDate(r.latestUpdate.date)}</span>
              <span class="trk-channel-chip">${ch.icon} ${ch.es}</span>
              ${r.updates.length > 1 ? `<span class="trk-more-chip">+${r.updates.length - 1}</span>` : ''}
            </div>
            <div class="trk-last-update__note">${esc(snippet)}</div>
          </div>`;
      }

      return `
        <tr>
          <td>
            <div class="trk-person-name">${esc(fullName)}</div>
            <div style="margin-top:4px; display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
              ${renderRoleBadge(u.role)}
              ${regBadge}
            </div>
            <div class="trk-submeta">${esc(u.agencyName || '—')} · ${esc(u.email || '')}</div>
            ${agentTag}
          </td>
          <td style="text-align:center;">${newsBtn}</td>
          <td style="text-align:center;">${renderCountPill(r.counts.clientsCount, 'Clientes registrados a su nombre')}</td>
          <td style="text-align:center;">${renderCountPill(r.counts.brokersCount, 'Brokers registrados a su nombre')}</td>
          <td style="text-align:center;">${renderCountPill(r.counts.agentsCount, 'Agentes / Realtors registrados a su nombre')}</td>
          <td style="text-align:center;">${renderCountPill(r.counts.colaboradoresCount, 'Colaboradores registrados a su nombre')}</td>
          <td style="text-align:center;">${renderCountPill(r.counts.embajadoresCount, 'Embajadores registrados a su nombre')}</td>
          <td>${lastUpdateHtml}</td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn ${editable ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="App.views.tracking.openB2BModal('${esc(u.id)}')">
              ${editable
                ? `💬 <span class="lang-en">Follow-up</span><span class="lang-es">Seguimiento</span>`
                : `👁️ <span class="lang-en">View Log</span><span class="lang-es">Ver Historial</span>`}
            </button>
          </td>
        </tr>`;
    }).join('');
  }

  async function toggleNewsletter(userId, nextSubscribed) {
    if (!canEdit()) {
      App.utils.showToast('Solo los Agentes Inmomás pueden actualizar el seguimiento.', 'info');
      return;
    }
    try {
      await App.auth.updateUserNewsletter(userId, nextSubscribed);
      const localU = allUsers.find(u => u.id === userId);
      if (localU) {
        localU.newsletterConsent = Boolean(nextSubscribed);
        localU.newsletterConsentAt = nextSubscribed ? new Date().toISOString() : null;
      }
      App.utils.showToast(
        nextSubscribed ? '✅ Marcado como suscripto al newsletter oficial.' : '⛔ Marcado como no suscripto al newsletter oficial.',
        'success'
      );
      renderB2BTable();
      // If modal is open for this user, refresh it
      const modalUserId = document.getElementById('trk-b2b-modal-userid')?.value;
      if (modalUserId === userId) {
        openB2BModal(userId);
      }
    } catch (err) {
      console.error('[Tracking] toggleNewsletter error:', err);
      App.utils.showToast('Error actualizando estado de newsletter.', 'error');
    }
  }

  function openB2BModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
      App.utils.showToast('Contacto B2B no encontrado.', 'error');
      return;
    }

    const counts = computeB2BNetworkCounts(user, allUsers, allClients, lookupMaps);
    const updates = Array.isArray(user.b2bUpdates) ? user.b2bUpdates : [];
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const isSub = user.newsletterConsent === true;

    const editable = canEdit();
    const historyHtml = updates.length === 0
      ? `<div class="trk-empty-log">${editable ? 'Aún no hay conversaciones registradas con este contacto. Añade la primera actualización arriba.' : 'Aún no hay conversaciones registradas por el Agente Inmomás.'}</div>`
      : updates.map(up => {
          const ch = CHANNEL_META[up.channel] || CHANNEL_META.otro;
          return `
            <div class="trk-log-item">
              <div class="trk-log-item__header">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span class="trk-date-chip">📅 ${formatShortDate(up.date)}</span>
                  <span class="trk-channel-chip">${ch.icon} ${ch.es}</span>
                  <span style="font-size:0.76rem;color:#64748b;">por <strong>${esc(up.authorName || 'Equipo')}</strong></span>
                </div>
                ${editable ? `<button type="button" class="trk-del-btn" onclick="App.views.tracking.deleteB2BUpdate('${esc(user.id)}', '${esc(up.id)}')" title="Eliminar registro">🗑️</button>` : ''}
              </div>
              <div class="trk-log-item__body">${esc(up.note).replace(/\n/g, '<br>')}</div>
            </div>`;
        }).join('');

    const channelOptions = Object.entries(CHANNEL_META)
      .map(([k, v]) => `<option value="${k}">${v.icon} ${v.es}</option>`)
      .join('');

    const newsletterHeaderHtml = editable
      ? `<button type="button" class="trk-news-btn ${isSub ? 'trk-news-btn--yes' : 'trk-news-btn--no'}"
           onclick="App.views.tracking.toggleNewsletter('${esc(user.id)}', ${!isSub})">
           ${isSub ? '✅ Suscripto al Newsletter' : '⛔ No suscripto al Newsletter'}
         </button>`
      : `<span class="trk-news-btn trk-news-btn--readonly ${isSub ? 'trk-news-btn--yes' : 'trk-news-btn--no'}">
           ${isSub ? '✅ Suscripto al Newsletter' : '⛔ No suscripto al Newsletter'}
         </span>`;

    const b2bFormSectionHtml = editable
      ? `<div class="trk-form-box">
          <h4 class="trk-section-title">➕ Registrar Actualización de Conversación</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <div>
              <label class="trk-label">Fecha de la conversación</label>
              <input type="date" id="trk-b2b-update-date" class="form-input" style="margin-bottom:0;" value="${todayIso()}">
            </div>
            <div>
              <label class="trk-label">Canal</label>
              <select id="trk-b2b-update-channel" class="form-input" style="margin-bottom:0;">
                ${channelOptions}
              </select>
            </div>
          </div>
          <div style="margin-bottom:10px;">
            <label class="trk-label">Resumen / Próximos pasos</label>
            <textarea id="trk-b2b-update-note" class="form-input" rows="3" style="margin-bottom:0;" placeholder="Ej. Llamada de seguimiento, interesado en traer 2 compradores en Q2, enviado material de Marketing Lab..."></textarea>
          </div>
          <button type="button" class="btn btn-primary btn-sm" style="width:100%;" onclick="App.views.tracking.submitB2BUpdate('${esc(user.id)}')">
            💾 Guardar Actualización
          </button>
        </div>`
      : `<div class="trk-readonly-banner">
          👁️ <strong>Vista de supervisión (Solo lectura):</strong> Solo los Agentes Inmomás pueden registrar o modificar actualizaciones de seguimiento y estado de newsletter.
        </div>`;

    App.utils.showModal({
      title: `Seguimiento B2B — ${fullName}`,
      body: `
        <input type="hidden" id="trk-b2b-modal-userid" value="${esc(user.id)}">
        <div class="trk-modal-header-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                <strong style="font-size:1.05rem;color:#0f172a;">${esc(fullName)}</strong>
                ${renderRoleBadge(user.role)}
              </div>
              <div style="font-size:0.82rem;color:#475569;">
                🏢 ${esc(user.agencyName || 'Sin agencia')} · ✉️ ${esc(user.email || '—')} ${user.phone ? `· 📞 ${esc(user.phone)}` : ''}
              </div>
            </div>
            <div>
              ${newsletterHeaderHtml}
            </div>
          </div>
          <div class="trk-network-strip">
            <div class="trk-network-chip"><span>Clientes</span><strong>${counts.clientsCount}</strong></div>
            <div class="trk-network-chip"><span>Brokers</span><strong>${counts.brokersCount}</strong></div>
            <div class="trk-network-chip"><span>Agentes</span><strong>${counts.agentsCount}</strong></div>
            <div class="trk-network-chip"><span>Colaboradores</span><strong>${counts.colaboradoresCount}</strong></div>
            <div class="trk-network-chip"><span>Embajadores</span><strong>${counts.embajadoresCount}</strong></div>
          </div>
        </div>

        ${b2bFormSectionHtml}

        <div style="margin-top:16px;">
          <h4 class="trk-section-title">📜 Historial de Conversaciones (${updates.length})</h4>
          <div class="trk-log-list">${historyHtml}</div>
        </div>
      `,
      footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Cerrar</button>`
    });
  }

  async function submitB2BUpdate(userId) {
    if (!canEdit()) return;
    const dateVal = document.getElementById('trk-b2b-update-date')?.value || todayIso();
    const channelVal = document.getElementById('trk-b2b-update-channel')?.value || 'llamada';
    const noteVal = (document.getElementById('trk-b2b-update-note')?.value || '').trim();

    if (!noteVal) {
      App.utils.showToast('Escribe una nota o resumen de la conversación.', 'error');
      return;
    }

    try {
      const res = await App.auth.addB2BTrackingUpdate(userId, {
        date: dateVal,
        channel: channelVal,
        note: noteVal
      });
      const localU = allUsers.find(u => u.id === userId);
      if (localU) {
        localU.b2bUpdates = res.b2bUpdates;
        localU.b2bLastContactAt = res.b2bUpdates[0]?.date || null;
      }
      App.utils.showToast('✅ Actualización B2B guardada.', 'success');
      renderB2BTable();
      openB2BModal(userId);
    } catch (err) {
      console.error('[Tracking] submitB2BUpdate error:', err);
      App.utils.showToast('Error guardando la actualización.', 'error');
    }
  }

  async function deleteB2BUpdate(userId, updateId) {
    if (!canEdit()) return;
    if (!confirm('¿Eliminar esta actualización del historial?')) return;
    try {
      const res = await App.auth.deleteB2BTrackingUpdate(userId, updateId);
      const localU = allUsers.find(u => u.id === userId);
      if (localU) {
        localU.b2bUpdates = res.b2bUpdates;
        localU.b2bLastContactAt = res.b2bUpdates[0]?.date || null;
      }
      App.utils.showToast('Actualización eliminada.', 'info');
      renderB2BTable();
      openB2BModal(userId);
    } catch (err) {
      console.error('[Tracking] deleteB2BUpdate error:', err);
      App.utils.showToast('Error eliminando actualización.', 'error');
    }
  }

  function exportB2BExcel() {
    if (!cachedB2BRows.length) {
      App.utils.showToast('No hay contactos B2B para exportar.', 'error');
      return;
    }
    const headers = [
      'Nombre', 'Rol', 'Agencia', 'Email', 'Teléfono', 'País',
      'Agente Inmomás', 'Newsletter Oficial',
      'Clientes Registrados', 'Brokers Registrados', 'Agentes Registrados', 'Colaboradores Registrados', 'Embajadores Registrados',
      'Total Updates', 'Fecha Último Update', 'Último Update'
    ];
    const rows = cachedB2BRows.map(r => [
      `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim(),
      r.user.role || '',
      r.user.agencyName || '',
      r.user.email || '',
      r.user.phone || '',
      r.user.country || '',
      r.assigned?.name || '',
      r.isSubscribed ? 'Sí' : 'No',
      r.counts.clientsCount,
      r.counts.brokersCount,
      r.counts.agentsCount,
      r.counts.colaboradoresCount,
      r.counts.embajadoresCount,
      r.updates.length,
      r.latestUpdate ? formatShortDate(r.latestUpdate.date) : '',
      r.latestUpdate ? r.latestUpdate.note : ''
    ]);
    downloadSpreadsheet(headers, rows, 'Seguimiento-B2B', `Seguimiento-B2B-${todayIso()}`);
  }

  /* ============================================
     SECTION 2: SEGUIMIENTO DE CLIENTES
     ============================================ */
  async function initClients() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;

    const subtitleEl = document.getElementById('trk-clients-subtitle');
    if (subtitleEl) {
      subtitleEl.innerHTML = currentUser.role === 'admin'
        ? `<span class="lang-en">Global buyer supervision (read-only) — updates, temperature and search criteria are managed by each Inmomás Agent.</span>
           <span class="lang-es">Supervisión global de clientes (solo lectura) — visualizas todos los clientes; las actualizaciones, temperatura y búsqueda las gestiona cada Agente Inmomás.</span>`
        : `<span class="lang-en">Manage your assigned clients: Type A/B, Temperature & deadlines, property search criteria and dated updates.</span>
           <span class="lang-es">Gestiona tus clientes asignados: Tipo A/B, temperatura con fecha de seteo y control de plazos, características de la búsqueda y actualizaciones.</span>`;
    }

    const pipelineLink = document.getElementById('trk-cli-pipeline-link');
    if (pipelineLink) {
      pipelineLink.setAttribute('href', currentUser.role === 'admin' ? '#admin/clients' : '#agent_inmomas/clients');
    }

    const phaseSel = document.getElementById('trk-cli-filter-phase');
    if (phaseSel && phaseSel.options.length <= 1) {
      phaseSel.innerHTML = `<option value="">📊 Fase Pipeline: Todas</option>` +
        getPipelinePhaseList().map(p => `<option value="${esc(p.key)}">${esc(p.label)}</option>`).join('');
    }

    const regSel = document.getElementById('trk-cli-filter-region');
    if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
      regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
    }

    const tbody = document.getElementById('trk-cli-table-body');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">Cargando seguimiento de clientes...</td></tr>`;
    }

    try {
      const isAdmin = currentUser.role === 'admin';
      const clientFilter = isAdmin ? {} : { localAgentId: currentUser.id };
      [allUsers, allClients] = await Promise.all([
        App.auth.getAllUsers(),
        App.auth.getClients(clientFilter, isAdmin)
      ]);
      lookupMaps = App.utils && App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
      populateAgentFilterSelect('trk-cli-filter-agent');
      renderClientsTable();
    } catch (err) {
      console.error('[Tracking] initClients error:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#ef4444;">Error cargando datos de seguimiento de clientes.</td></tr>`;
      }
    }
  }

  function getEffectiveSearchCriteria(c) {
    const sc = c.searchCriteria || {};
    return {
      zones: sc.zones || c.interestArea || '',
      propertyType: sc.propertyType || c.propertyType || '',
      budget: sc.budget || c.budget || '',
      bedrooms: sc.bedrooms || '',
      bathrooms: sc.bathrooms || '',
      operationPurpose: sc.operationPurpose || c.objective || '',
      financing: sc.financing || '',
      mustHaves: sc.mustHaves || ''
    };
  }

  function renderClientsTable() {
    const tbody = document.getElementById('trk-cli-table-body');
    if (!tbody || !currentUser) return;

    const isAdmin = currentUser.role === 'admin';
    const searchQ = (document.getElementById('trk-cli-search')?.value || '').toLowerCase().trim();
    const phaseFilter = document.getElementById('trk-cli-filter-phase')?.value || '';
    const typeFilter = document.getElementById('trk-cli-filter-type')?.value || '';
    const tempFilter = document.getElementById('trk-cli-filter-temp')?.value || '';
    const regFilter = document.getElementById('trk-cli-filter-region')?.value || '';
    const agentFilter = isAdmin ? (document.getElementById('trk-cli-filter-agent')?.value || '') : '';

    let filtered = [...allClients];

    if (phaseFilter) {
      filtered = filtered.filter(c => normalizePipelinePhase(c.status) === phaseFilter);
    }

    if (typeFilter === 'unassigned') filtered = filtered.filter(c => !c.clientType);
    else if (typeFilter) filtered = filtered.filter(c => c.clientType === typeFilter);

    if (tempFilter === 'unassigned') filtered = filtered.filter(c => !c.temperature);
    else if (tempFilter) filtered = filtered.filter(c => c.temperature === tempFilter);

    if (regFilter && App.utils && App.utils.getRecordRegion) {
      filtered = filtered.filter(c => App.utils.getRecordRegion(c, allUsers) === regFilter);
    }

    if (agentFilter) {
      filtered = filtered.filter(c => c.localAgentId === agentFilter);
    }

    if (searchQ) {
      filtered = filtered.filter(c => {
        const sc = getEffectiveSearchCriteria(c);
        const updatesText = (c.trackingUpdates || []).map(u => u.note || '').join(' ');
        const pool = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.phone || ''} ${sc.zones} ${sc.propertyType} ${sc.budget} ${sc.operationPurpose} ${sc.financing} ${sc.mustHaves} ${updatesText}`.toLowerCase();
        return pool.includes(searchQ);
      });
    }

    // Sort: hot -> warm -> cold -> unset, then by latest tracking date desc
    const tempRank = { hot: 1, warm: 2, cold: 3 };
    filtered.sort((a, b) => {
      const ra = tempRank[a.temperature] || 4;
      const rb = tempRank[b.temperature] || 4;
      if (ra !== rb) return ra - rb;
      const da = String(a.lastTrackingAt || a.updatedAt || a.createdAt || '');
      const db = String(b.lastTrackingAt || b.updatedAt || b.createdAt || '');
      return db.localeCompare(da);
    });

    cachedClientRows = filtered;

    // KPI counters
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('trk-cli-kpi-total', filtered.length);
    setTxt('trk-cli-kpi-type-a', filtered.filter(c => c.clientType === 'A').length);
    setTxt('trk-cli-kpi-type-b', filtered.filter(c => c.clientType === 'B').length);
    setTxt('trk-cli-kpi-hot', filtered.filter(c => c.temperature === 'hot').length);
    setTxt('trk-cli-kpi-warm', filtered.filter(c => c.temperature === 'warm').length);
    setTxt('trk-cli-kpi-cold', filtered.filter(c => c.temperature === 'cold').length);

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2.25rem; color:var(--text-muted);">
            <span class="lang-en">No clients match your filters.</span>
            <span class="lang-es">No hay clientes que coincidan con los filtros seleccionados.</span>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => {
      const editable = canEdit();
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || '—';
      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}" style="font-size:0.72rem;">${App.utils.getStatusLabel(c.status)}</span>`;
      const phaseCellHtml = editable
        ? `<select class="trk-phase-select" onchange="App.views.tracking.changeClientPipelinePhase('${esc(c.id)}', this.value)" title="Cambiar fase (se sincroniza con la Pipeline)">
             ${getPipelinePhaseOptionsHtml(c.status)}
           </select>`
        : statusBadge;
      const assignedAgent = c.localAgentName || (allUsers.find(u => u.id === c.localAgentId)?.firstName ? `${allUsers.find(u => u.id === c.localAgentId).firstName} ${allUsers.find(u => u.id === c.localAgentId).lastName || ''}`.trim() : '');
      const agentLine = isAdmin && assignedAgent ? `<div class="trk-submeta">🇪🇸 Agente: <strong>${esc(assignedAgent)}</strong></div>` : '';

      // Type badge
      const typeHtml = c.clientType === 'A'
        ? `<span class="trk-type-pill trk-type-pill--a">⭐ Tipo A</span>`
        : (c.clientType === 'B'
          ? `<span class="trk-type-pill trk-type-pill--b">🔹 Tipo B</span>`
          : `<span class="trk-type-pill trk-type-pill--none">Sin definir</span>`);

      // Temperature + set date + deadline calculation
      let tempHtml = `<span class="trk-temp-pill trk-temp--none">Sin temperatura</span>`;
      if (c.temperature && TEMP_META[c.temperature]) {
        const tm = TEMP_META[c.temperature];
        const dl = computeTemperatureDeadline(c.temperature, c.temperatureSetAt);
        tempHtml = `
          <div class="trk-temp-cell">
            <span class="trk-temp-pill ${tm.cls}">${tm.icon} ${tm.es} <small>(${tm.rangeEs})</small></span>
            <div class="trk-temp-date">
              Seteado: <strong>${formatShortDate(c.temperatureSetAt)}</strong>
              ${dl.elapsedLabel ? ` · <span>${esc(dl.elapsedLabel)}</span>` : ''}
            </div>
            ${dl.deadlineLabel ? `<div class="trk-deadline-pill ${dl.statusCls}">${esc(dl.deadlineLabel)}</div>` : ''}
          </div>`;
      }

      // Search criteria chips
      const sc = getEffectiveSearchCriteria(c);
      const chips = [];
      if (sc.zones) chips.push(`📍 ${esc(sc.zones)}`);
      if (sc.propertyType) chips.push(`🏠 ${esc(sc.propertyType)}`);
      if (sc.budget) chips.push(`💶 ${esc(sc.budget)}`);
      if (sc.bedrooms) chips.push(`🛏️ ${esc(sc.bedrooms)} hab.`);
      if (sc.operationPurpose) chips.push(`🎯 ${esc(sc.operationPurpose)}`);
      if (sc.financing) chips.push(`🏦 ${esc(sc.financing)}`);
      const criteriaHtml = chips.length > 0 || sc.mustHaves
        ? `<div class="trk-criteria-chips">${chips.map(ch => `<span class="trk-criteria-chip">${ch}</span>`).join('')}</div>` +
          (sc.mustHaves ? `<div class="trk-submeta" style="margin-top:4px;">📝 ${esc(sc.mustHaves.length > 65 ? sc.mustHaves.slice(0, 65) + '…' : sc.mustHaves)}</div>` : '')
        : `<span style="color:#94a3b8;font-size:0.8rem;font-style:italic;">Sin especificar</span>`;

      // Latest tracking update
      const updates = Array.isArray(c.trackingUpdates) ? c.trackingUpdates : [];
      const latest = updates[0] || null;
      let lastUpdateHtml = `<span style="color:#94a3b8;font-size:0.8rem;font-style:italic;">Sin updates aún</span>`;
      if (latest) {
        const ch = CHANNEL_META[latest.channel] || CHANNEL_META.otro;
        const snippet = latest.note.length > 75 ? latest.note.slice(0, 75) + '…' : latest.note;
        lastUpdateHtml = `
          <div class="trk-last-update">
            <div class="trk-last-update__meta">
              <span class="trk-date-chip">📅 ${formatShortDate(latest.date)}</span>
              <span class="trk-channel-chip">${ch.icon} ${ch.es}</span>
              ${updates.length > 1 ? `<span class="trk-more-chip">+${updates.length - 1}</span>` : ''}
            </div>
            <div class="trk-last-update__note">${esc(snippet)}</div>
          </div>`;
      }

      return `
        <tr>
          <td>
            <div class="trk-person-name">${esc(fullName)}</div>
            <div class="trk-submeta">${esc(c.email || '—')}${c.phone ? ` · ${esc(c.phone)}` : ''}</div>
            ${agentLine}
          </td>
          <td>${phaseCellHtml}</td>
          <td style="text-align:center;">${typeHtml}</td>
          <td>${tempHtml}</td>
          <td>${criteriaHtml}</td>
          <td>${lastUpdateHtml}</td>
          <td style="text-align:right; white-space:nowrap;">
            <button type="button" class="btn ${editable ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="App.views.tracking.openClientModal('${esc(c.id)}')">
              ${editable
                ? `📋 <span class="lang-en">Manage</span><span class="lang-es">Gestionar</span>`
                : `👁️ <span class="lang-en">View File</span><span class="lang-es">Ver Ficha</span>`}
            </button>
          </td>
        </tr>`;
    }).join('');
  }

  function openClientModal(clientId) {
    const c = allClients.find(cl => cl.id === clientId);
    if (!c) {
      App.utils.showToast('Cliente no encontrado.', 'error');
      return;
    }

    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
    const sc = getEffectiveSearchCriteria(c);
    const updates = Array.isArray(c.trackingUpdates) ? c.trackingUpdates : [];
    const tempHistory = Array.isArray(c.temperatureHistory) ? c.temperatureHistory : [];
    const currentTemp = c.temperature || '';
    const currentSetAt = c.temperatureSetAt || (currentTemp ? todayIso() : '');
    const dl = computeTemperatureDeadline(currentTemp, currentSetAt);

    const channelOptions = Object.entries(CHANNEL_META)
      .map(([k, v]) => `<option value="${k}">${v.icon} ${v.es}</option>`)
      .join('');

    const propTypeOpts = ['', 'Apartamento', 'Ático', 'Villa / Chalet', 'Adosado / Bungalow', 'Obra Nueva', 'Inversión / Edificio', 'Terreno', 'Otro'];
    const bedOpts = ['', 'Estudio', '1+', '2+', '3+', '4+', '5+'];
    const bathOpts = ['', '1+', '2+', '3+', '4+'];
    const purposeOpts = ['', 'Residencia habitual', 'Segunda residencia', 'Inversión / Rentabilidad', 'Retiro / Jubilación', 'Golden / Visado', 'Otro'];
    const financingOpts = ['', 'Contado / Cash', 'Hipoteca / UCI', 'Mixto', 'Por definir'];

    const buildOpts = (arr, selected) => {
      const hasSel = selected && !arr.includes(selected);
      const list = hasSel ? [...arr, selected] : arr;
      return list.map(v => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${v ? esc(v) : '— Seleccionar —'}</option>`).join('');
    };

    const tempHistoryHtml = tempHistory.length > 0
      ? `<div class="trk-temp-history">
           <div style="font-size:0.75rem;font-weight:700;color:#475569;margin-bottom:4px;">📈 Historial de cambios de temperatura:</div>
           ${tempHistory.slice(0, 5).map(h => {
             const m = TEMP_META[h.temperature] || { icon: '•', es: h.temperature };
             return `<div style="font-size:0.76rem;color:#64748b;">${m.icon} <strong>${m.es}</strong> · Seteado: ${formatShortDate(h.setAt)} <span style="opacity:0.8;">(${esc(h.changedBy || '')})</span></div>`;
           }).join('')}
         </div>`
      : '';

    const editable = canEdit();
    const updatesHtml = updates.length === 0
      ? `<div class="trk-empty-log">${editable ? 'Aún no hay updates registrados para este cliente.' : 'Aún no hay updates registrados por el Agente Inmomás.'}</div>`
      : updates.map(up => {
          const ch = CHANNEL_META[up.channel] || CHANNEL_META.otro;
          return `
            <div class="trk-log-item">
              <div class="trk-log-item__header">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span class="trk-date-chip">📅 ${formatShortDate(up.date)}</span>
                  <span class="trk-channel-chip">${ch.icon} ${ch.es}</span>
                  <span style="font-size:0.76rem;color:#64748b;">por <strong>${esc(up.authorName || 'Equipo')}</strong></span>
                </div>
                ${editable ? `<button type="button" class="trk-del-btn" onclick="App.views.tracking.deleteClientUpdate('${esc(c.id)}', '${esc(up.id)}')" title="Eliminar update">🗑️</button>` : ''}
              </div>
              <div class="trk-log-item__body">${esc(up.note).replace(/\n/g, '<br>')}</div>
            </div>`;
        }).join('');

    const tm = currentTemp && TEMP_META[currentTemp] ? TEMP_META[currentTemp] : null;
    const typeReadOnlyHtml = c.clientType === 'A'
      ? `<span class="trk-type-pill trk-type-pill--a">⭐ Tipo A</span>`
      : (c.clientType === 'B'
        ? `<span class="trk-type-pill trk-type-pill--b">🔹 Tipo B</span>`
        : `<span class="trk-type-pill trk-type-pill--none">Sin definir</span>`);

    const tempReadOnlyHtml = tm
      ? `<span class="trk-temp-pill ${tm.cls}">${tm.icon} ${tm.es} (${tm.rangeEs})</span>`
      : `<span class="trk-temp-pill trk-temp--none">Sin temperatura</span>`;

    const clientBodyMainHtml = editable
      ? `
        <!-- 1. Clasificación, Fase en Pipeline y Temperatura -->
        <div class="trk-form-box">
          <h4 class="trk-section-title">🌡️ Clasificación, Fase en Pipeline y Temperatura</h4>
          <div style="margin-bottom:10px;">
            <label class="trk-label">📊 Fase en Pipeline (sincronizada bidireccionalmente con Mis Clientes)</label>
            <select id="trk-cli-phase" class="form-input" style="margin-bottom:0;">
              ${getPipelinePhaseOptionsHtml(c.status)}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:10px;margin-bottom:10px;" class="trk-grid-3">
            <div>
              <label class="trk-label">Tipo de Cliente</label>
              <select id="trk-cli-type" class="form-input" style="margin-bottom:0;">
                <option value="" ${!c.clientType ? 'selected' : ''}>— Sin definir —</option>
                <option value="A" ${c.clientType === 'A' ? 'selected' : ''}>⭐ Tipo A</option>
                <option value="B" ${c.clientType === 'B' ? 'selected' : ''}>🔹 Tipo B</option>
              </select>
            </div>
            <div>
              <label class="trk-label">Temperatura (Plazo de mudanza)</label>
              <select id="trk-cli-temp" class="form-input" style="margin-bottom:0;" onchange="App.views.tracking.onTempInputChange()">
                <option value="" ${!currentTemp ? 'selected' : ''}>— Sin definir —</option>
                <option value="hot" ${currentTemp === 'hot' ? 'selected' : ''}>🔥 Caliente (0 a 6 meses)</option>
                <option value="warm" ${currentTemp === 'warm' ? 'selected' : ''}>🌤️ Templado (6 a 12 meses)</option>
                <option value="cold" ${currentTemp === 'cold' ? 'selected' : ''}>❄️ Frío (+ de 12 meses)</option>
              </select>
            </div>
            <div>
              <label class="trk-label">Fecha de seteo</label>
              <input type="date" id="trk-cli-temp-date" class="form-input" style="margin-bottom:0;" value="${esc(currentSetAt)}" onchange="App.views.tracking.onTempInputChange()">
            </div>
          </div>
          <div id="trk-cli-deadline-preview" class="trk-deadline-preview ${dl.hasData ? dl.statusCls : ''}" style="${dl.hasData ? '' : 'display:none;'}">
            ${dl.hasData ? `<strong>Plazo / Expectativa:</strong> ${esc(dl.elapsedLabel)} · ${esc(dl.deadlineLabel)}` : ''}
          </div>
          ${tempHistoryHtml}
        </div>

        <!-- 2. Características de la Búsqueda -->
        <div class="trk-form-box" style="margin-top:12px;">
          <h4 class="trk-section-title">🏡 Características de la Búsqueda</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <div>
              <label class="trk-label">Zona / Ciudad de interés</label>
              <input type="text" id="trk-cli-zones" class="form-input" style="margin-bottom:0;" value="${esc(sc.zones)}" placeholder="Ej. Alicante, Costa Blanca, Altea, San Juan...">
            </div>
            <div>
              <label class="trk-label">Tipo de propiedad</label>
              <select id="trk-cli-proptype" class="form-input" style="margin-bottom:0;">
                ${buildOpts(propTypeOpts, sc.propertyType)}
              </select>
            </div>
            <div>
              <label class="trk-label">Presupuesto estimado</label>
              <input type="text" id="trk-cli-budget" class="form-input" style="margin-bottom:0;" value="${esc(sc.budget)}" placeholder="Ej. 350.000€ - 500.000€">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label class="trk-label">Dormitorios</label>
                <select id="trk-cli-beds" class="form-input" style="margin-bottom:0;">
                  ${buildOpts(bedOpts, sc.bedrooms)}
                </select>
              </div>
              <div>
                <label class="trk-label">Baños</label>
                <select id="trk-cli-baths" class="form-input" style="margin-bottom:0;">
                  ${buildOpts(bathOpts, sc.bathrooms)}
                </select>
              </div>
            </div>
            <div>
              <label class="trk-label">Finalidad de compra</label>
              <select id="trk-cli-purpose" class="form-input" style="margin-bottom:0;">
                ${buildOpts(purposeOpts, sc.operationPurpose)}
              </select>
            </div>
            <div>
              <label class="trk-label">Financiación</label>
              <select id="trk-cli-financing" class="form-input" style="margin-bottom:0;">
                ${buildOpts(financingOpts, sc.financing)}
              </select>
            </div>
          </div>
          <div style="margin-bottom:10px;">
            <label class="trk-label">Requisitos clave / Notas de búsqueda</label>
            <textarea id="trk-cli-musthaves" class="form-input" rows="2" style="margin-bottom:0;" placeholder="Ej. Vista al mar, piscina, cerca de colegios internacionales, terraza amplia, garaje...">${esc(sc.mustHaves)}</textarea>
          </div>
          <button type="button" class="btn btn-primary btn-sm" style="width:100%;background:#0f766e;border-color:#0f766e;" onclick="App.views.tracking.saveClientProfile('${esc(c.id)}')">
            💾 Guardar Clasificación, Temperatura y Búsqueda
          </button>
        </div>

        <!-- 3. Actualizaciones / Updates con Fecha -->
        <div class="trk-form-box" style="margin-top:12px;">
          <h4 class="trk-section-title">💬 Añadir Update de Seguimiento</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <div>
              <label class="trk-label">Fecha</label>
              <input type="date" id="trk-cli-update-date" class="form-input" style="margin-bottom:0;" value="${todayIso()}">
            </div>
            <div>
              <label class="trk-label">Canal</label>
              <select id="trk-cli-update-channel" class="form-input" style="margin-bottom:0;">
                ${channelOptions}
              </select>
            </div>
          </div>
          <div style="margin-bottom:10px;">
            <label class="trk-label">Actualización / Próximo paso</label>
            <textarea id="trk-cli-update-note" class="form-input" rows="2" style="margin-bottom:0;" placeholder="Ej. Enviadas 3 propiedades en Playa San Juan, confirma viaje a España en abril..."></textarea>
          </div>
          <button type="button" class="btn btn-primary btn-sm" style="width:100%;" onclick="App.views.tracking.submitClientUpdate('${esc(c.id)}')">
            ➕ Guardar Update
          </button>
        </div>`
      : `
        <div class="trk-readonly-banner" style="margin-bottom:12px;">
          👁️ <strong>Vista de supervisión (Solo lectura):</strong> Solo los Agentes Inmomás pueden modificar la clasificación, temperatura, búsqueda o añadir updates.
        </div>

        <div class="trk-form-box">
          <h4 class="trk-section-title">🌡️ Clasificación y Temperatura</h4>
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:8px;">
            <div><span class="trk-label" style="margin-bottom:2px;">Tipo</span>${typeReadOnlyHtml}</div>
            <div><span class="trk-label" style="margin-bottom:2px;">Temperatura</span>${tempReadOnlyHtml}</div>
            ${tm ? `<div><span class="trk-label" style="margin-bottom:2px;">Fecha de seteo</span><span class="trk-date-chip">📅 ${formatShortDate(c.temperatureSetAt)}</span></div>` : ''}
          </div>
          ${dl.hasData ? `<div class="trk-deadline-preview ${dl.statusCls}"><strong>Plazo / Expectativa:</strong> ${esc(dl.elapsedLabel)} · ${esc(dl.deadlineLabel)}</div>` : ''}
          ${tempHistoryHtml}
        </div>

        <div class="trk-form-box" style="margin-top:12px;">
          <h4 class="trk-section-title">🏡 Características de la Búsqueda</h4>
          <div class="trk-readonly-grid">
            <div><span class="trk-label">Zona / Ciudad</span><div class="trk-ro-val">${esc(sc.zones || '—')}</div></div>
            <div><span class="trk-label">Tipo de propiedad</span><div class="trk-ro-val">${esc(sc.propertyType || '—')}</div></div>
            <div><span class="trk-label">Presupuesto</span><div class="trk-ro-val">${esc(sc.budget || '—')}</div></div>
            <div><span class="trk-label">Dormitorios / Baños</span><div class="trk-ro-val">${esc(sc.bedrooms || '—')} hab. / ${esc(sc.bathrooms || '—')} baños</div></div>
            <div><span class="trk-label">Finalidad</span><div class="trk-ro-val">${esc(sc.operationPurpose || '—')}</div></div>
            <div><span class="trk-label">Financiación</span><div class="trk-ro-val">${esc(sc.financing || '—')}</div></div>
          </div>
          ${sc.mustHaves ? `<div style="margin-top:8px;"><span class="trk-label">Requisitos clave / Notas</span><div class="trk-ro-val">${esc(sc.mustHaves)}</div></div>` : ''}
        </div>`;

    App.utils.showModal({
      title: `Seguimiento de Cliente — ${fullName}`,
      body: `
        <div class="trk-modal-header-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
            <div>
              <strong style="font-size:1.05rem;color:#0f172a;">${esc(fullName)}</strong>
              <div style="font-size:0.82rem;color:#475569;margin-top:2px;">
                ✉️ ${esc(c.email || '—')} ${c.phone ? `· 📞 ${esc(c.phone)}` : ''} · Registrado: ${formatShortDate(c.createdAt)}
              </div>
            </div>
            <span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>
          </div>
        </div>

        ${clientBodyMainHtml}

        <div style="margin-top:14px;">
          <h4 class="trk-section-title">📜 Historial de Updates (${updates.length})</h4>
          <div class="trk-log-list">${updatesHtml}</div>
        </div>
      `,
      footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Cerrar</button>`
    });
  }

  function onTempInputChange() {
    const tempSel = document.getElementById('trk-cli-temp');
    const dateInput = document.getElementById('trk-cli-temp-date');
    const preview = document.getElementById('trk-cli-deadline-preview');
    if (!tempSel || !dateInput || !preview) return;

    const tempVal = tempSel.value;
    if (tempVal && !dateInput.value) {
      dateInput.value = todayIso();
    }
    if (!tempVal) {
      preview.style.display = 'none';
      return;
    }

    const dl = computeTemperatureDeadline(tempVal, dateInput.value);
    preview.style.display = '';
    preview.className = `trk-deadline-preview ${dl.statusCls}`;
    preview.innerHTML = `<strong>Plazo / Expectativa:</strong> ${esc(dl.elapsedLabel)} · ${esc(dl.deadlineLabel)}`;
  }

  async function changeClientPipelinePhase(clientId, newPhase) {
    if (!canEdit()) return;
    if (!newPhase) return;
    try {
      const idx = allClients.findIndex(c => c.id === clientId);
      const prevPhase = idx !== -1 ? normalizePipelinePhase(allClients[idx].status) : '';
      if (prevPhase === newPhase) return;

      await App.auth.updateClientStatus(clientId, newPhase, 'Fase actualizada desde Seguimiento de Clientes');
      if (idx !== -1) {
        allClients[idx].status = newPhase;
        allClients[idx].updatedAt = new Date().toISOString();
      }
      const labelEs = (App.utils && App.utils.clientStatusLabelsEs && App.utils.clientStatusLabelsEs[newPhase]) || newPhase;
      App.utils.showToast(`✅ Fase actualizada a "${labelEs}" (sincronizada con la Pipeline).`, 'success');
      renderClientsTable();
    } catch (err) {
      console.error('[Tracking] changeClientPipelinePhase error:', err);
      App.utils.showToast('Error actualizando la fase en la Pipeline.', 'error');
      renderClientsTable();
    }
  }

  async function saveClientProfile(clientId) {
    if (!canEdit()) return;
    const nextPhase = document.getElementById('trk-cli-phase')?.value || '';
    const clientType = document.getElementById('trk-cli-type')?.value || '';
    const temperature = document.getElementById('trk-cli-temp')?.value || '';
    let temperatureSetAt = document.getElementById('trk-cli-temp-date')?.value || '';
    if (temperature && !temperatureSetAt) {
      temperatureSetAt = todayIso();
    }

    const searchCriteria = {
      zones: document.getElementById('trk-cli-zones')?.value || '',
      propertyType: document.getElementById('trk-cli-proptype')?.value || '',
      budget: document.getElementById('trk-cli-budget')?.value || '',
      bedrooms: document.getElementById('trk-cli-beds')?.value || '',
      bathrooms: document.getElementById('trk-cli-baths')?.value || '',
      operationPurpose: document.getElementById('trk-cli-purpose')?.value || '',
      financing: document.getElementById('trk-cli-financing')?.value || '',
      mustHaves: document.getElementById('trk-cli-musthaves')?.value || ''
    };

    try {
      const idx = allClients.findIndex(c => c.id === clientId);
      const prevPhase = idx !== -1 ? normalizePipelinePhase(allClients[idx].status) : '';
      if (nextPhase && nextPhase !== prevPhase) {
        await App.auth.updateClientStatus(clientId, nextPhase, 'Fase actualizada desde Seguimiento de Clientes');
      }

      const updated = await App.auth.updateClientTrackingProfile(clientId, {
        clientType,
        temperature,
        temperatureSetAt,
        searchCriteria
      });
      if (idx !== -1) {
        allClients[idx] = { ...allClients[idx], ...updated, ...(nextPhase ? { status: nextPhase } : {}) };
      }
      App.utils.showToast('✅ Clasificación, fase, temperatura y búsqueda guardadas.', 'success');
      renderClientsTable();
      openClientModal(clientId);
    } catch (err) {
      console.error('[Tracking] saveClientProfile error:', err);
      App.utils.showToast('Error guardando los datos del cliente.', 'error');
    }
  }

  async function submitClientUpdate(clientId) {
    if (!canEdit()) return;
    const dateVal = document.getElementById('trk-cli-update-date')?.value || todayIso();
    const channelVal = document.getElementById('trk-cli-update-channel')?.value || 'llamada';
    const noteVal = (document.getElementById('trk-cli-update-note')?.value || '').trim();

    if (!noteVal) {
      App.utils.showToast('Escribe una actualización antes de guardar.', 'error');
      return;
    }

    try {
      const res = await App.auth.addClientTrackingUpdate(clientId, {
        date: dateVal,
        channel: channelVal,
        note: noteVal
      });
      const localC = allClients.find(c => c.id === clientId);
      if (localC) {
        localC.trackingUpdates = res.trackingUpdates;
        localC.lastTrackingAt = res.trackingUpdates[0]?.date || null;
      }
      App.utils.showToast('✅ Update guardado en el historial del cliente.', 'success');
      renderClientsTable();
      openClientModal(clientId);
    } catch (err) {
      console.error('[Tracking] submitClientUpdate error:', err);
      App.utils.showToast('Error guardando el update.', 'error');
    }
  }

  async function deleteClientUpdate(clientId, updateId) {
    if (!canEdit()) return;
    if (!confirm('¿Eliminar este update del historial del cliente?')) return;
    try {
      const res = await App.auth.deleteClientTrackingUpdate(clientId, updateId);
      const localC = allClients.find(c => c.id === clientId);
      if (localC) {
        localC.trackingUpdates = res.trackingUpdates;
        localC.lastTrackingAt = res.trackingUpdates[0]?.date || null;
      }
      App.utils.showToast('Update eliminado.', 'info');
      renderClientsTable();
      openClientModal(clientId);
    } catch (err) {
      console.error('[Tracking] deleteClientUpdate error:', err);
      App.utils.showToast('Error eliminando el update.', 'error');
    }
  }

  function exportClientsExcel() {
    if (!cachedClientRows.length) {
      App.utils.showToast('No hay clientes para exportar.', 'error');
      return;
    }
    const headers = [
      'Nombre', 'Email', 'Teléfono', 'Estado Pipeline', 'Agente Inmomás',
      'Tipo', 'Temperatura', 'Fecha Seteo Temperatura', 'Plazo / Expectativa',
      'Zona', 'Tipo Propiedad', 'Presupuesto', 'Dormitorios', 'Baños', 'Finalidad', 'Financiación', 'Requisitos Clave',
      'Total Updates', 'Fecha Último Update', 'Último Update'
    ];
    const rows = cachedClientRows.map(c => {
      const sc = getEffectiveSearchCriteria(c);
      const tm = c.temperature && TEMP_META[c.temperature] ? `${TEMP_META[c.temperature].es} (${TEMP_META[c.temperature].rangeEs})` : '';
      const dl = computeTemperatureDeadline(c.temperature, c.temperatureSetAt);
      const updates = Array.isArray(c.trackingUpdates) ? c.trackingUpdates : [];
      const latest = updates[0] || null;
      return [
        `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        c.email || '',
        c.phone || '',
        App.utils.getStatusLabelText ? App.utils.getStatusLabelText(c.status) : (c.status || ''),
        c.localAgentName || '',
        c.clientType ? `Tipo ${c.clientType}` : '',
        tm,
        formatShortDate(c.temperatureSetAt),
        dl.deadlineLabel || '',
        sc.zones,
        sc.propertyType,
        sc.budget,
        sc.bedrooms,
        sc.bathrooms,
        sc.operationPurpose,
        sc.financing,
        sc.mustHaves,
        updates.length,
        latest ? formatShortDate(latest.date) : '',
        latest ? latest.note : ''
      ];
    });
    downloadSpreadsheet(headers, rows, 'Seguimiento-Clientes', `Seguimiento-Clientes-${todayIso()}`);
  }

  function downloadSpreadsheet(headers, rows, sheetName, filenameBase) {
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filenameBase}.xlsx`);
      App.utils.showToast(`✅ Exportados ${rows.length} registros a Excel.`, 'success');
      return;
    }
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filenameBase}.csv`;
    a.click();
    App.utils.showToast(`✅ Exportados ${rows.length} registros a CSV.`, 'success');
  }

  return {
    initB2B,
    renderB2BTable,
    toggleNewsletter,
    openB2BModal,
    submitB2BUpdate,
    deleteB2BUpdate,
    exportB2BExcel,
    initClients,
    renderClientsTable,
    openClientModal,
    onTempInputChange,
    changeClientPipelinePhase,
    saveClientProfile,
    submitClientUpdate,
    deleteClientUpdate,
    exportClientsExcel
  };
})();
