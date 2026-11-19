/* ============================================
   RE/MAX Inmomás — Embajador (Ambassador) View Module
   ============================================
   Executive portal for the Embajador role.
   Sits right below Admin (scoped to all contacts
   generated under the Embajador's umbrella) and
   above Brokers, Realtors, Colaboradores & Clients.
   Registered on App.views.embajador.
   ============================================ */

;(function() {
  'use strict';

  window.App = window.App || {};
  App.views = App.views || {};

  /* ── Cached Umbrella State ── */
  let currentUser = null;
  let umbrella = {
    users: [],
    brokers: [],
    realtors: [],
    colaboradores: [],
    clients: [],
    commissions: [],
    webinarRegistrations: []
  };

  let networkRoleFilter = 'all';
  let networkRegionFilter = '';
  let networkStatusFilter = 'all';
  let networkSearchQuery = '';
  let networkViewMode = 'umbrella'; // 'umbrella' | 'table'
  let expandedEmbNodes = new Set();
  let embUmbrellaInitialized = false;

  let clientMemberFilter = 'all';
  let clientSearchQuery = '';
  let currentClientViewMode = 'board';

  let webinarFilter = 'all';
  let webinarRegionFilter = '';
  let webinarSearchQuery = '';

  function setTextById(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function refreshLang() {
    if (window.App && typeof window.App.updateLangDisplay === 'function') {
      window.App.updateLangDisplay();
    }
  }

  async function loadUmbrella() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return null;
    umbrella = await App.auth.getUmbrellaData(currentUser.id);
    return umbrella;
  }

  function getRolePill(role) {
    const map = {
      embajador:   { icon: '👑', labelEn: 'Ambassador', labelEs: 'Embajador', bg: 'rgba(245,158,11,0.14)', color: '#92400e', border: 'rgba(217,119,6,0.3)' },
      broker:      { icon: '🏢', labelEn: 'Broker', labelEs: 'Broker', bg: 'rgba(0,67,255,0.1)', color: '#002dae', border: 'rgba(0,67,255,0.22)' },
      realtor:     { icon: '🏠', labelEn: 'Realtor / Agent', labelEs: 'Agente / Realtor', bg: 'rgba(16,185,129,0.12)', color: '#047857', border: 'rgba(16,185,129,0.25)' },
      colaborador: { icon: '🤝', labelEn: 'Collaborator', labelEs: 'Colaborador', bg: 'rgba(245,158,11,0.12)', color: '#b45309', border: 'rgba(245,158,11,0.25)' },
      client:      { icon: '🏡', labelEn: 'Client', labelEs: 'Cliente Final', bg: 'rgba(124,58,237,0.1)', color: '#6d28d9', border: 'rgba(124,58,237,0.22)' }
    };
    const cfg = map[role] || { icon: '👤', labelEn: role || 'Member', labelEs: role || 'Miembro', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:0.74rem;font-weight:700;background:${cfg.bg};color:${cfg.color};border:1px solid ${cfg.border};white-space:nowrap;">${cfg.icon} <span class="lang-en">${cfg.labelEn}</span><span class="lang-es">${cfg.labelEs}</span></span>`;
  }

  function getClientAnonCode(c) {
    if (!c) return 'CLI';
    if (c._anonCode) return String(c._anonCode);
    const clean = String(c.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `CLI-${clean.length >= 4 ? clean.slice(-4) : '0001'}`;
  }

  function getClientDisplayName(c) {
    if (!c) return '—';
    const full = String(c._displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || c.clientName || '').trim();
    return full || getClientAnonCode(c);
  }

  function renderClientAnonLabel(c) {
    if (!c) return '🏡 <span class="lang-en">Client</span><span class="lang-es">Cliente</span>';
    return `🏡 ${App.utils.escapeHtml(getClientDisplayName(c))}`;
  }

  /* ============================================
     1. DASHBOARD (#embajador/dashboard)
     ============================================ */
  async function initDashboard() {
    try {
      const data = await loadUmbrella();
      if (!data || !currentUser) return;

      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('embajador-regional-banner', currentUser);
      }

      // Agreement / Fiscal data status banner
      const agreementStatus = currentUser.agreementStatus || (currentUser.agreementSigned ? 'signed' : 'none');
      const warningEl = document.getElementById('embajador-agreement-warning');
      if (warningEl) {
        if (agreementStatus === 'signed') {
          warningEl.style.display = 'none';
        } else if (agreementStatus === 'data_submitted' || agreementStatus === 'uploaded') {
          warningEl.style.display = 'block';
          warningEl.innerHTML = `
            <div class="glass-card" style="display:flex;align-items:center;gap:1rem;padding:1.25rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;text-align:left;">
              <span style="font-size:2rem;">📋</span>
              <div>
                <div style="font-weight:700;color:#1e40af;font-size:1rem;">
                  <span class="lang-en">Fiscal &amp; Bank Details Received — Preparing Ambassador Agreement</span>
                  <span class="lang-es">Datos Fiscales y Bancarios Recibidos — Preparando Acuerdo de Embajador</span>
                </div>
                <div style="font-size:0.85rem;color:#1d4ed8;margin-top:4px;">
                  <span class="lang-en">Administration is preparing your Ambassador Collaboration Agreement externally. You can review your details in <a href="#embajador/documents" style="font-weight:700;color:#003f99;text-decoration:underline;">Documents</a>.</span>
                  <span class="lang-es">Administración está redactando tu Acuerdo de Colaboración de Embajador. Puedes revisar tus datos en <a href="#embajador/documents" style="font-weight:700;color:#003f99;text-decoration:underline;">Documentos</a>.</span>
                </div>
              </div>
            </div>`;
        } else {
          warningEl.style.display = 'block';
          warningEl.innerHTML = `
            <div class="glass-card" style="display:flex;align-items:center;gap:1rem;padding:1.25rem;background:#fef3c7;border:1px solid #fde68a;border-radius:12px;text-align:left;">
              <span style="font-size:2rem;">👑</span>
              <div>
                <div style="font-weight:700;color:#92400e;font-size:1rem;">
                  <span class="lang-en">Complete Your Fiscal &amp; Bank Information</span>
                  <span class="lang-es">Completa tus Datos Fiscales y Bancarios de Embajador</span>
                </div>
                <div style="font-size:0.85rem;color:#78350f;margin-top:4px;">
                  <span class="lang-en">To formalize your Ambassador Agreement with RE/MAX Inmomás, please go to <a href="#embajador/documents" style="font-weight:700;color:#003f99;text-decoration:underline;">Documents</a> and submit your company/tax and bank details.</span>
                  <span class="lang-es">Para formalizar tu Acuerdo de Embajador con RE/MAX Inmomás, entra en <a href="#embajador/documents" style="font-weight:700;color:#003f99;text-decoration:underline;">Documentos</a> y guarda tus datos fiscales y bancarios.</span>
                </div>
              </div>
            </div>`;
        }
      }

      // KPIs
      const closedSales = data.clients.filter(c => ['completed', 'closed'].includes(c.status));
      const totalCommissionPool = data.commissions.reduce((sum, c) => sum + (c.realtorAmount || c.totalCommission || 0), 0);

      setTextById('embajador-stat-network', data.users.length);
      setTextById('embajador-stat-clients', data.clients.length);
      setTextById('embajador-stat-sales', closedSales.length);
      setTextById('embajador-stat-commissions', App.utils.formatCurrency(totalCommissionPool));

      const breakdownEl = document.getElementById('embajador-stat-network-breakdown');
      if (breakdownEl) {
        breakdownEl.innerHTML = `
          <span>🏢 ${data.brokers.length} Brokers</span> ·
          <span>🏠 ${data.realtors.length} <span class="lang-en">Agents</span><span class="lang-es">Agentes</span></span> ·
          <span>🤝 ${data.colaboradores.length} <span class="lang-en">Collaborators</span><span class="lang-es">Colaboradores</span></span>
        `;
      }

      // Professional Umbrella Link & Exclusive Client Webinar Link Setup (EMB-...)
      const isPending = currentUser.status === 'pending';
      const refCode = currentUser.referralCode || 'EMB-DEFAULT';
      const baseReferralLink = isPending ? '' : App.utils.generateReferralLink(refCode);
      const clientWebinarLink = isPending ? '' : App.utils.generateClientWebinarLink(refCode);

      const linkInput = document.getElementById('embajador-dash-referral-link');
      const copyBtn = document.getElementById('embajador-dash-copy-link');
      const clientLinkInput = document.getElementById('embajador-dash-client-webinar-link');
      const copyClientBtn = document.getElementById('embajador-dash-copy-client-link');

      if (linkInput) {
        if (isPending) {
          linkInput.value = 'Enlace pendiente de aprobación por Administración / Link pending Admin approval';
          linkInput.disabled = true;
          linkInput.style.color = '#9ca3af';
        } else {
          linkInput.value = baseReferralLink;
          linkInput.disabled = false;
          linkInput.style.color = '';
        }
      }

      if (copyBtn) {
        copyBtn.disabled = isPending;
        copyBtn.onclick = isPending ? null : () => {
          App.utils.copyToClipboard(baseReferralLink);
          App.utils.showToast('🔗 Enlace profesional de Embajador copiado al portapapeles', 'success');
        };
      }

      if (clientLinkInput) {
        if (isPending) {
          clientLinkInput.value = 'Enlace pendiente de aprobación por Administración / Link pending Admin approval';
          clientLinkInput.disabled = true;
          clientLinkInput.style.color = '#9ca3af';
        } else {
          clientLinkInput.value = clientWebinarLink;
          clientLinkInput.disabled = false;
          clientLinkInput.style.color = '';
        }
      }

      if (copyClientBtn) {
        copyClientBtn.disabled = isPending;
        copyClientBtn.onclick = isPending ? null : () => {
          App.utils.copyToClipboard(clientWebinarLink);
          App.utils.showToast('🎙️ Enlace exclusivo de Webinario para Clientes copiado al portapapeles', 'success');
        };
      }

      // Add Client Manually button
      const addClientContainer = document.getElementById('embajador-dash-add-client-btn');
      if (addClientContainer) {
        addClientContainer.innerHTML = `
          <button class="btn btn-primary" onclick="App.views.embajador.showAddClientModal()" style="display:inline-flex;align-items:center;gap:8px;padding:0.65rem 1.25rem;font-size:0.88rem;border-radius:8px;">
            <span>➕</span>
            <span class="lang-en">Add Client Manually</span>
            <span class="lang-es">Añadir Cliente Manualmente</span>
          </button>
        `;
      }

      const dashGuideEl = document.getElementById('embajador-dash-buyer-guide');
      if (dashGuideEl && App.buyerGuide && App.buyerGuide.canUse(currentUser)) {
        App.buyerGuide.renderEditor(dashGuideEl, currentUser);
      }

      renderDashPipeline(data.clients);
      renderDashRecentMembers(data.users);
      renderDashRecentClients(data.clients);
      refreshLang();
    } catch (err) {
      console.error('[Embajador] initDashboard error:', err);
      App.utils.showToast('Error loading Ambassador dashboard.', 'error');
    }
  }

  function copyVariantLink(variantType) {
    if (!currentUser || !currentUser.referralCode) return;
    const url = variantType === 'client'
      ? App.utils.generateClientWebinarLink(currentUser.referralCode)
      : App.utils.generateReferralLink(currentUser.referralCode);
    App.utils.copyToClipboard(url);
  }

  function renderDashPipeline(clients) {
    const container = document.getElementById('embajador-dash-pipeline');
    if (!container) return;
    const total = clients.length || 1;
    const bars = App.utils.PIPELINE_COLUMNS.map(col => {
      const count = clients.filter(c => col.statuses.includes(c.status)).length;
      const pct = Math.round((count / total) * 100);
      const color = App.utils.columnColors[col.key] || '#0043ff';
      return `
        <div style="margin-bottom:0.65rem;">
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px;">
            <span style="color:#334155;font-weight:600;">${col.label}</span>
            <span style="font-weight:700;color:${color};">${count}</span>
          </div>
          <div style="height:8px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:999px;transition:width 0.4s;"></div>
          </div>
        </div>`;
    }).join('');
    container.innerHTML = bars;
  }

  function renderDashRecentMembers(members) {
    const container = document.getElementById('embajador-dash-recent-members');
    if (!container) return;
    const recent = members.slice(0, 5);
    if (recent.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;color:#64748b;font-size:0.88rem;">
          <div style="font-size:1.8rem;margin-bottom:0.5rem;">🌐</div>
          <span class="lang-en">No partners registered under your umbrella yet. Share your Ambassador link above!</span>
          <span class="lang-es">Aún no hay profesionales registrados bajo tu paraguas. ¡Comparte tu enlace de Embajador arriba!</span>
        </div>`;
      return;
    }

    container.innerHTML = recent.map(m => {
      const originLabel = m._isDirectFromEmbajador
        ? `<span style="color:#b45309;font-weight:600;">👑 <span class="lang-en">Direct</span><span class="lang-es">Directo</span></span>`
        : `<span style="color:#003da5;font-weight:600;">↳ Vía ${App.utils.escapeHtml(m._umbrellaParentName)}</span>`;
      return `
        <div onclick="App.views.embajador.showMemberDetail('${m.id}')" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid var(--border-subtle);cursor:pointer;">
          <div style="min-width:0;">
            <div style="font-weight:700;color:var(--text-primary);font-size:0.9rem;">
              ${App.utils.escapeHtml(m.firstName || '')} ${App.utils.escapeHtml(m.lastName || '')}
            </div>
            <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;">
              ${App.utils.escapeHtml(m.agencyName || m.country || '—')} · ${originLabel}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
            ${getRolePill(m.role)}
            ${App.utils.getUserStatusBadge(m.status)}
          </div>
        </div>`;
    }).join('');
  }

  function renderDashRecentClients(clients) {
    const container = document.getElementById('embajador-dash-recent-clients');
    if (!container) return;
    const recent = clients.slice(0, 5);
    if (recent.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;color:#64748b;font-size:0.88rem;">
          <div style="font-size:1.8rem;margin-bottom:0.5rem;">🏡</div>
          <span class="lang-en">No buyers in your umbrella pipeline yet.</span>
          <span class="lang-es">Aún no hay clientes compradores en el pipeline de tu paraguas.</span>
        </div>`;
      return;
    }

    container.innerHTML = recent.map(c => {
      const cleanZone = [c.interestArea, c.country].map(v => String(v || '').trim()).find(v => v && v !== '—' && v !== '-') || 'España';
      return `
      <div onclick="App.views.embajador.showClientDetail('${c.id}')" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid var(--border-subtle);cursor:pointer;">
        <div style="min-width:0;">
          <div style="font-weight:700;color:var(--text-primary);font-size:0.92rem;">
            ${renderClientAnonLabel(c)}
          </div>
          <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span>📍 ${App.utils.escapeHtml(cleanZone)}</span>
            <span>·</span>
            <span>🤝 ${App.utils.escapeHtml(c._originMemberName || 'Directo')}</span>
            <span>·</span>
            <span style="color:#94a3b8;">🔒 <span class="lang-en">Email &amp; phone protected</span><span class="lang-es">Email y tel. protegidos</span></span>
          </div>
        </div>
        <div style="flex-shrink:0;">
          <span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>
        </div>
      </div>
    `;
    }).join('');
  }

  /* ============================================
     2. UMBRELLA NETWORK (#embajador/network)
        Brokers, Agentes/Realtors & Colaboradores
     ============================================ */
  async function initNetwork() {
    try {
      const data = await loadUmbrella();
      if (!data) return;

      setTextById('embajador-net-count-all', data.users.length);
      setTextById('embajador-net-count-broker', data.brokers.length);
      setTextById('embajador-net-count-realtor', data.realtors.length);
      setTextById('embajador-net-count-colaborador', data.colaboradores.length);

      const regSel = document.getElementById('emb-net-region-select');
      if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
        regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
      }

      renderEmbajadorRootBanner(data);
      setNetworkViewMode(networkViewMode, false);
      renderNetworkView();
      refreshLang();
    } catch (err) {
      console.error('[Embajador] initNetwork error:', err);
      App.utils.showToast('Error loading umbrella network.', 'error');
    }
  }

  function renderEmbajadorRootBanner(data) {
    const bannerEl = document.getElementById('embajador-network-root-banner');
    if (!bannerEl || !currentUser) return;
    const embObj = (data && data.embajador) || currentUser;
    const allRefUsers = (data && data.allUsers) || [];
    const inmomasBadge = App.utils.renderInmomasAgentBadge
      ? App.utils.renderInmomasAgentBadge(embObj, allRefUsers, { showUnassigned: true })
      : '';
    bannerEl.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(0,63,153,0.05) 100%); border:1px solid rgba(217,119,6,0.3); border-left:4px solid #d97706; border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span class="umbrella-chain-pill umbrella-chain-pill--embajador">👑 <span class="lang-en">Root Umbrella</span><span class="lang-es">Paraguas Raíz</span></span>
          <strong style="font-size:0.95rem; color:#0f172a;">${App.utils.escapeHtml(embObj.firstName || '')} ${App.utils.escapeHtml(embObj.lastName || '')}</strong>
          ${embObj.agencyName ? `<span style="font-size:0.82rem; color:#475569;">· ${App.utils.escapeHtml(embObj.agencyName)}</span>` : ''}
          ${inmomasBadge}
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span class="umbrella-kpi-pill">🏢 ${data.brokers.length} Brokers</span>
          <span class="umbrella-kpi-pill">🏠 ${data.realtors.length} <span class="lang-en">Agents</span><span class="lang-es">Agentes</span></span>
          <span class="umbrella-kpi-pill">🤝 ${data.colaboradores.length} Colab.</span>
          <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${data.clients.length} <span class="lang-en">Clients</span><span class="lang-es">Clientes</span></span>
        </div>
      </div>
    `;
  }

  function setNetworkViewMode(mode, reRender = true) {
    networkViewMode = mode === 'table' ? 'table' : 'umbrella';
    const accEl = document.getElementById('embajador-network-accordion');
    const tblEl = document.getElementById('embajador-network-table-wrap');
    const expEl = document.getElementById('emb-net-expand-controls');
    const btnUmb = document.getElementById('btn-emb-net-mode-umbrella');
    const btnTbl = document.getElementById('btn-emb-net-mode-table');

    if (accEl) accEl.style.display = networkViewMode === 'umbrella' ? 'flex' : 'none';
    if (tblEl) tblEl.style.display = networkViewMode === 'table' ? 'block' : 'none';
    if (expEl) expEl.style.display = networkViewMode === 'umbrella' ? 'inline-flex' : 'none';
    if (btnUmb) btnUmb.classList.toggle('active', networkViewMode === 'umbrella');
    if (btnTbl) btnTbl.classList.toggle('active', networkViewMode === 'table');

    if (reRender) renderNetworkView();
  }

  function toggleEmbNode(nodeId) {
    if (!nodeId) return;
    const el = document.getElementById(`emb-umb-node-${nodeId}`);
    if (expandedEmbNodes.has(nodeId)) {
      expandedEmbNodes.delete(nodeId);
      if (el) el.classList.remove('is-open');
    } else {
      expandedEmbNodes.add(nodeId);
      if (el) el.classList.add('is-open');
    }
  }

  function expandAllUmbrellaNodes(expand) {
    const container = document.getElementById('embajador-network-accordion');
    if (!container) return;
    container.querySelectorAll('[data-emb-node]').forEach(el => {
      const id = el.getAttribute('data-emb-node');
      if (expand) {
        expandedEmbNodes.add(id);
        el.classList.add('is-open');
      } else {
        expandedEmbNodes.delete(id);
        el.classList.remove('is-open');
      }
    });
  }

  function setNetworkRoleFilter(role) {
    networkRoleFilter = role || 'all';
    ['all', 'broker', 'realtor', 'colaborador'].forEach(r => {
      const btn = document.getElementById(`emb-net-filter-${r}`);
      if (btn) {
        const active = r === networkRoleFilter;
        btn.className = active ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
      }
    });
    renderNetworkView();
  }

  function setNetworkRegionFilter(regionId) {
    networkRegionFilter = regionId || '';
    renderNetworkView();
  }

  function setNetworkStatusFilter(status) {
    networkStatusFilter = status || 'all';
    renderNetworkView();
  }

  function searchNetwork(query) {
    networkSearchQuery = (query || '').toLowerCase().trim();
    renderNetworkView();
  }

  function getDirectClientsForMember(u, subAgentIdsSet = null) {
    if (!u) return [];
    const uCode = u.referralCode ? String(u.referralCode).toUpperCase().trim() : '';
    return (umbrella.clients || []).filter(c => {
      if (!c) return false;
      // If checking direct clients of a Broker, exclude clients originated by one of its sub-agents
      if (subAgentIdsSet && subAgentIdsSet.size > 0) {
        if ((c._originMemberId && subAgentIdsSet.has(c._originMemberId)) ||
            (c.realtorId && subAgentIdsSet.has(c.realtorId)) ||
            (c.referredBy && subAgentIdsSet.has(c.referredBy))) {
          return false;
        }
      }
      const cRef = c.referredBy ? String(c.referredBy).toUpperCase().trim() : '';
      if (u.role === 'broker') {
        return c._originMemberId === u.id ||
               c.referredBy === u.id ||
               (uCode && cRef === uCode) ||
               (c.brokerId === u.id && !c.realtorId && (!c._originMemberId || c._originMemberId === u.id));
      }
      return c._originMemberId === u.id ||
             c.referredBy === u.id ||
             c.realtorId === u.id ||
             (uCode && cRef === uCode);
    });
  }

  function getUniqueClientsForGroup(brokerUser, subMembers = []) {
    const map = new Map();
    const subIds = new Set((subMembers || []).map(s => s.id));
    getDirectClientsForMember(brokerUser, subIds).forEach(c => { if (c && c.id) map.set(c.id, c); });
    (subMembers || []).forEach(m => {
      getDirectClientsForMember(m).forEach(c => { if (c && c.id) map.set(c.id, c); });
    });
    // Also catch any client tagged with brokerId === brokerUser.id
    if (brokerUser && brokerUser.id) {
      (umbrella.clients || []).forEach(c => {
        if (c && c.id && c.brokerId === brokerUser.id) map.set(c.id, c);
      });
    }
    return Array.from(map.values());
  }

  function renderInlineClientPills(clientsList, emptyTextEs = '') {
    if (!clientsList || clientsList.length === 0) {
      return emptyTextEs
        ? `<span style="font-size:0.74rem; color:#94a3b8; font-style:italic;">${emptyTextEs}</span>`
        : '';
    }
    return `
      <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:6px;">
        ${clientsList.map(c => {
          const clientName = getClientDisplayName(c);
          const statusLbl = App.utils.getStatusLabel ? App.utils.getStatusLabel(c.status) : App.utils.escapeHtml(c.status || 'Nuevo');
          return `
            <button type="button"
              onclick="event.stopPropagation(); App.views.embajador.showClientDetail('${c.id}')"
              title="Ver seguimiento del cliente (email y teléfono protegidos)"
              style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:999px; background:#f5f3ff; border:1px solid #ddd6fe; color:#5b21b6; font-size:0.74rem; font-weight:700; cursor:pointer; transition:background 0.15s;">
              <span>🏡 ${App.utils.escapeHtml(clientName)}</span>
              <span style="font-weight:600; color:#7c3aed; opacity:0.85;">· ${statusLbl}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function getFilteredUmbrellaMembers() {
    return (umbrella.users || []).filter(u => {
      if (networkRoleFilter !== 'all' && u.role !== networkRoleFilter) return false;
      if (networkRegionFilter && App.utils && App.utils.getUserRegions && !App.utils.getUserRegions(u).includes(networkRegionFilter)) return false;
      if (networkStatusFilter !== 'all') {
        if (networkStatusFilter === 'approved' && !(u.status === 'active' || u.status === 'approved')) return false;
        if (networkStatusFilter !== 'approved' && u.status !== networkStatusFilter) return false;
      }
      if (networkSearchQuery) {
        const directClientsNames = getDirectClientsForMember(u).map(c => `${getClientDisplayName(c)} ${getClientAnonCode(c)}`).join(' ');
        const hay = `${u.firstName || ''} ${u.lastName || ''} ${u.agencyName || ''} ${u.country || ''} ${u._umbrellaParentName || ''} ${u._inmomasAgentName || ''} ${directClientsNames} ${u.referralCode || ''}`.toLowerCase();
        if (!hay.includes(networkSearchQuery)) return false;
      }
      return true;
    });
  }

  function countMemberClients(u) {
    return getDirectClientsForMember(u).length;
  }

  function renderEmbLeaf(u) {
    const allRefUsers = umbrella.allUsers || [];
    const memberClients = getDirectClientsForMember(u);
    const isColab = u.role === 'colaborador';
    const inmomasBadge = App.utils.renderInmomasAgentBadge
      ? App.utils.renderInmomasAgentBadge(u, allRefUsers, { showUnassigned: true, compact: true })
      : '';
    const locParts = [u.agencyName, u.country ? `🌍 ${u.country}` : ''].filter(Boolean);

    return `
      <div class="umbrella-leaf ${isColab ? 'umbrella-leaf--colaborador' : ''}" style="align-items:flex-start;">
        <div style="min-width:0; flex:1;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <strong style="font-size:0.9rem; color:#0f172a;">${isColab ? '🤝' : '🏠'} ${App.utils.escapeHtml(u.firstName || '')} ${App.utils.escapeHtml(u.lastName || '')}</strong>
            ${getRolePill(u.role)}
            ${App.utils.getUserStatusBadge(u.status)}
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:3px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            ${locParts.length > 0 ? `<span>${ locParts.map(p => App.utils.escapeHtml(p)).join(' · ') }</span><span>·</span>` : ''}
            <span style="color:#94a3b8;">🔒 <span class="lang-en">Protected contact</span><span class="lang-es">Contacto protegido</span></span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:6px;">
            ${inmomasBadge}
            <span class="umbrella-kpi-pill umbrella-kpi-pill--clients" style="font-size:0.7rem; padding:1px 7px;">
              🏡 ${memberClients.length} <span class="lang-en">${memberClients.length === 1 ? 'Client' : 'Clients'}</span><span class="lang-es">${memberClients.length === 1 ? 'Cliente' : 'Clientes'}</span>
            </span>
          </div>
          ${memberClients.length > 0 ? `
            <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #e2e8f0;">
              <div style="font-size:0.71rem; font-weight:700; color:#6d28d9; text-transform:uppercase; letter-spacing:0.03em;">
                <span class="lang-en">Referred Buyers:</span><span class="lang-es">Clientes Referidos:</span>
              </div>
              ${renderInlineClientPills(memberClients)}
            </div>
          ` : ''}
        </div>
        <div style="flex-shrink:0;">
          <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); App.views.embajador.showMemberDetail('${u.id}')">
            👁️ <span class="lang-en">Details</span><span class="lang-es">Ficha</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderNetworkAccordion(filtered) {
    const container = document.getElementById('embajador-network-accordion');
    if (!container) return;

    const hasActiveFilter = Boolean(networkRoleFilter !== 'all' || networkRegionFilter || networkStatusFilter !== 'all' || networkSearchQuery);

    const allMembers = umbrella.users || [];
    const allRefUsers = umbrella.allUsers || [];
    const filteredIds = new Set(filtered.map(u => u.id));
    const allBrokers = allMembers.filter(u => u.role === 'broker');

    // Determine which members belong under a Broker in this umbrella
    const getBrokerForMember = (m) => {
      if (!m || m.role === 'broker') return null;
      if (m.brokerId) {
        const b = allBrokers.find(x => x.id === m.brokerId);
        if (b) return b;
      }
      if (m._umbrellaParentId) {
        const b = allBrokers.find(x => x.id === m._umbrellaParentId);
        if (b) return b;
      }
      return null;
    };

    const brokerCards = [];
    allBrokers.forEach(brk => {
      const fullSubTeam = allMembers.filter(m => {
        const b = getBrokerForMember(m);
        return b && b.id === brk.id;
      });
      const matchingSubTeam = fullSubTeam.filter(m => filteredIds.has(m.id));
      const brkMatches = filteredIds.has(brk.id);

      if (!brkMatches && matchingSubTeam.length === 0) return;

      const shownSubTeam = (hasActiveFilter && !brkMatches) ? matchingSubTeam : (hasActiveFilter ? matchingSubTeam : fullSubTeam);
      const subIds = new Set(fullSubTeam.map(s => s.id));
      const directBrokerClients = getDirectClientsForMember(brk, subIds);
      const allGroupClients = getUniqueClientsForGroup(brk, fullSubTeam);

      const nodeId = `brk-${brk.id}`;
      if (!embUmbrellaInitialized && brokerCards.length < 3) {
        expandedEmbNodes.add(nodeId);
      }
      const isOpen = hasActiveFilter ? true : expandedEmbNodes.has(nodeId);
      const inmomasBadge = App.utils.renderInmomasAgentBadge
        ? App.utils.renderInmomasAgentBadge(brk, allRefUsers, { showUnassigned: true })
        : '';

      const agentNamesPreview = fullSubTeam.map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim()).filter(Boolean).join(', ');
      const clientNamesPreview = allGroupClients.map(c => getClientDisplayName(c)).filter(Boolean).join(', ');

      brokerCards.push(`
        <div class="umbrella-card umbrella-card--broker ${isOpen ? 'is-open' : ''}" id="emb-umb-node-${nodeId}" data-emb-node="${nodeId}">
          <div class="umbrella-card__header" onclick="App.views.embajador.toggleEmbNode('${nodeId}')">
            <div class="umbrella-card__left">
              <span class="umbrella-chevron">▶</span>
              ${App.utils.generateAvatar(brk.firstName, brk.lastName, 'sm')}
              <div class="umbrella-card__identity">
                <div class="umbrella-card__title-row">
                  <span class="umbrella-chain-pill umbrella-chain-pill--broker">🏢 Broker</span>
                  <span class="umbrella-card__name">${App.utils.escapeHtml(brk.firstName || '')} ${App.utils.escapeHtml(brk.lastName || '')}</span>
                  ${brk.agencyName ? `<span style="font-weight:700; color:#003da5; font-size:0.86rem;">— ${App.utils.escapeHtml(brk.agencyName)}</span>` : ''}
                  ${App.utils.getUserStatusBadge(brk.status)}
                </div>
                <div class="umbrella-card__meta">
                  ${brk.country ? `<span>🌍 ${App.utils.escapeHtml(brk.country)}</span><span>·</span>` : ''}
                  <span style="color:#94a3b8;">🔒 <span class="lang-en">Protected contact</span><span class="lang-es">Contacto protegido</span></span>
                  ${agentNamesPreview ? `<span>· <strong style="color:#047857;">🏠 ${App.utils.escapeHtml(agentNamesPreview)}</strong></span>` : ''}
                  ${clientNamesPreview ? `<span>· <strong style="color:#6d28d9;">🏡 ${App.utils.escapeHtml(clientNamesPreview)}</strong></span>` : ''}
                </div>
              </div>
            </div>
            <div class="umbrella-card__right">
              ${inmomasBadge}
              <span class="umbrella-kpi-pill">🏠 ${fullSubTeam.length} <span class="lang-en">${fullSubTeam.length === 1 ? 'Agent' : 'Agents'}</span><span class="lang-es">${fullSubTeam.length === 1 ? 'Agente' : 'Agentes'}</span></span>
              <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${allGroupClients.length} <span class="lang-en">${allGroupClients.length === 1 ? 'Client' : 'Clients'}</span><span class="lang-es">${allGroupClients.length === 1 ? 'Cliente' : 'Clientes'}</span></span>
              <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); App.views.embajador.showMemberDetail('${brk.id}')">
                👁️ <span class="lang-en">Details</span><span class="lang-es">Ficha</span>
              </button>
            </div>
          </div>
          <div class="umbrella-card__body">
            <div class="umbrella-branch">
              ${shownSubTeam.length > 0
                ? `<div class="umbrella-leaf-grid">${shownSubTeam.map(m => renderEmbLeaf(m)).join('')}</div>`
                : `<div style="font-size:0.82rem; color:#64748b;"><span class="lang-en">No agents registered under this Broker yet.</span><span class="lang-es">Aún no hay agentes registrados bajo este Broker.</span></div>`
              }
              ${directBrokerClients.length > 0 ? `
                <div style="background:#fff; border:1px solid #e2e8f0; border-left:3px solid #7c3aed; border-radius:9px; padding:9px 12px; margin-top:4px;">
                  <div style="font-size:0.75rem; font-weight:700; color:#5b21b6;">
                    🏡 <span class="lang-en">Direct Clients of ${App.utils.escapeHtml(brk.firstName || 'Broker')} (${directBrokerClients.length}):</span>
                    <span class="lang-es">Clientes Directos de ${App.utils.escapeHtml(brk.firstName || 'Broker')} (${directBrokerClients.length}):</span>
                  </div>
                  ${renderInlineClientPills(directBrokerClients)}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `);
    });

    const directRealtors = filtered.filter(u => u.role === 'realtor' && !getBrokerForMember(u));
    const directColabs = filtered.filter(u => u.role === 'colaborador' && !getBrokerForMember(u));

    // Clients invited directly by the Embajador (not through any sub-member)
    const directEmbClients = (networkRoleFilter === 'all' ? (umbrella.clients || []) : []).filter(c => {
      if (!c || !c._isDirectFromEmbajador) return false;
      if (!networkSearchQuery) return true;
      const hay = `${getClientDisplayName(c)} ${getClientAnonCode(c)} ${c.interestArea || ''} ${c.country || ''}`.toLowerCase();
      return hay.includes(networkSearchQuery);
    });

    if (brokerCards.length === 0 && directRealtors.length === 0 && directColabs.length === 0 && directEmbClients.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2.5rem;background:#fff;border:1px solid #e2e8f0;border-radius:12px;color:#64748b;">
          <div style="font-size:1.8rem;margin-bottom:6px;">🌐</div>
          <span class="lang-en">No umbrella members match the current filters.</span>
          <span class="lang-es">No hay miembros en tu paraguas con los filtros seleccionados.</span>
        </div>`;
      return;
    }

    let html = '';
    if (brokerCards.length > 0) {
      html += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🏢 <span class="lang-en">Brokers &amp; Their Teams in Your Umbrella</span><span class="lang-es">Brokers y sus Equipos en tu Paraguas</span></span>
            <span class="umbrella-kpi-pill">${brokerCards.length} Brokers</span>
          </div>
          ${brokerCards.join('')}
        </div>
      `;
    }

    if (directRealtors.length > 0) {
      const nodeId = 'direct-realtors';
      if (!embUmbrellaInitialized) expandedEmbNodes.add(nodeId);
      const isOpen = hasActiveFilter ? true : expandedEmbNodes.has(nodeId);
      const dirClients = directRealtors.reduce((s, r) => s + countMemberClients(r), 0);
      html += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🏠 <span class="lang-en">Direct Realtors / Agents (Level 1 — Pending or Without Broker)</span><span class="lang-es">Agentes / Realtors Directos (Nivel 1 — Sin Broker o a la espera de su Broker)</span></span>
            <span class="umbrella-kpi-pill">${directRealtors.length}</span>
          </div>
          <div class="umbrella-card umbrella-card--direct ${isOpen ? 'is-open' : ''}" id="emb-umb-node-${nodeId}" data-emb-node="${nodeId}">
            <div class="umbrella-card__header" onclick="App.views.embajador.toggleEmbNode('${nodeId}')">
              <div class="umbrella-card__left">
                <span class="umbrella-chevron">▶</span>
                <div class="umbrella-card__identity">
                  <span class="umbrella-card__name">👑 ➔ 🏠 <span class="lang-en">Invited Directly by You</span><span class="lang-es">Invitados Directamente en tu Paraguas</span></span>
                  <div class="umbrella-card__meta">
                    <span class="lang-en">If their Broker registers later and is linked to them, the Broker automatically attaches to your umbrella</span>
                    <span class="lang-es">Si su Broker se registra después y se vincula al agente, el Broker pasará automáticamente a tu paraguas</span>
                  </div>
                </div>
              </div>
              <div class="umbrella-card__right">
                <span class="umbrella-kpi-pill">🏠 ${directRealtors.length} Agentes</span>
                <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${dirClients} Clientes</span>
              </div>
            </div>
            <div class="umbrella-card__body">
              <div class="umbrella-leaf-grid">${directRealtors.map(r => renderEmbLeaf(r)).join('')}</div>
            </div>
          </div>
        </div>
      `;
    }

    if (directColabs.length > 0) {
      const nodeId = 'direct-colabs';
      if (!embUmbrellaInitialized) expandedEmbNodes.add(nodeId);
      const isOpen = hasActiveFilter ? true : expandedEmbNodes.has(nodeId);
      const colClients = directColabs.reduce((s, r) => s + countMemberClients(r), 0);
      html += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🤝 <span class="lang-en">Collaborators in Your Umbrella</span><span class="lang-es">Colaboradores en tu Paraguas</span></span>
            <span class="umbrella-kpi-pill">${directColabs.length}</span>
          </div>
          <div class="umbrella-card umbrella-card--embajador ${isOpen ? 'is-open' : ''}" id="emb-umb-node-${nodeId}" data-emb-node="${nodeId}">
            <div class="umbrella-card__header" onclick="App.views.embajador.toggleEmbNode('${nodeId}')">
              <div class="umbrella-card__left">
                <span class="umbrella-chevron">▶</span>
                <div class="umbrella-card__identity">
                  <span class="umbrella-card__name">👑 ➔ 🤝 <span class="lang-en">Direct Strategic Collaborators</span><span class="lang-es">Colaboradores Directos del Paraguas</span></span>
                </div>
              </div>
              <div class="umbrella-card__right">
                <span class="umbrella-kpi-pill">🤝 ${directColabs.length} Colaboradores</span>
                <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${colClients} Clientes</span>
              </div>
            </div>
            <div class="umbrella-card__body">
              <div class="umbrella-leaf-grid">${directColabs.map(c => renderEmbLeaf(c)).join('')}</div>
            </div>
          </div>
        </div>
      `;
    }

    if (directEmbClients.length > 0) {
      const nodeId = 'direct-emb-clients';
      if (!embUmbrellaInitialized) expandedEmbNodes.add(nodeId);
      const isOpen = hasActiveFilter ? true : expandedEmbNodes.has(nodeId);
      html += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🏡 <span class="lang-en">Direct Buyers Referred by You</span><span class="lang-es">Clientes Compradores Directos de tu Enlace</span></span>
            <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">${directEmbClients.length}</span>
          </div>
          <div class="umbrella-card umbrella-card--embajador ${isOpen ? 'is-open' : ''}" id="emb-umb-node-${nodeId}" data-emb-node="${nodeId}">
            <div class="umbrella-card__header" onclick="App.views.embajador.toggleEmbNode('${nodeId}')">
              <div class="umbrella-card__left">
                <span class="umbrella-chevron">▶</span>
                <div class="umbrella-card__identity">
                  <span class="umbrella-card__name">👑 ➔ 🏡 <span class="lang-en">Direct Ambassador Buyers</span><span class="lang-es">Clientes Directos de Embajador</span></span>
                </div>
              </div>
              <div class="umbrella-card__right">
                <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${directEmbClients.length} Clientes</span>
              </div>
            </div>
            <div class="umbrella-card__body">
              ${renderInlineClientPills(directEmbClients)}
            </div>
          </div>
        </div>
      `;
    }

    embUmbrellaInitialized = true;
    container.innerHTML = html;
  }

  function renderNetworkView() {
    const filtered = getFilteredUmbrellaMembers();
    renderNetworkAccordion(filtered);
    renderNetworkTable(filtered);
    refreshLang();
  }

  function renderNetworkTable(filteredInput) {
    const tbody = document.getElementById('embajador-network-tbody');
    if (!tbody) return;

    const filtered = filteredInput || getFilteredUmbrellaMembers();
    const allRefUsers = umbrella.allUsers || [];

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;padding:2.5rem;color:#64748b;">
            <span class="lang-en">No umbrella members match the current filters.</span>
            <span class="lang-es">No hay miembros en tu paraguas con los filtros seleccionados.</span>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const subMembers = (umbrella.users || []).filter(sub => sub._umbrellaParentId === u.id || (u.role === 'broker' && sub.brokerId === u.id));
      const memberClients = u.role === 'broker'
        ? getUniqueClientsForGroup(u, subMembers)
        : getDirectClientsForMember(u);
      const originHtml = u._isDirectFromEmbajador
        ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.78rem;font-weight:700;color:#b45309;">👑 <span class="lang-en">Direct (Level 1)</span><span class="lang-es">Directo (Nivel 1)</span></span>`
        : `<div style="font-size:0.78rem;color:#1e40af;font-weight:600;">↳ ${App.utils.escapeHtml(u._umbrellaParentName)}</div><div style="font-size:0.7rem;color:#64748b;">Nivel ${u._umbrellaLevel}</div>`;
      const inmomasBadge = App.utils.renderInmomasAgentBadge
        ? App.utils.renderInmomasAgentBadge(u, allRefUsers, { showUnassigned: true, compact: true })
        : '—';

      const subNamesHtml = subMembers.length > 0
        ? `<div style="font-size:0.73rem;color:#047857;font-weight:600;margin-top:3px;">🏠 ${subMembers.map(s => App.utils.escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim())).join(', ')}</div>`
        : '';
      const clientCodesHtml = memberClients.length > 0
        ? `<div style="font-size:0.73rem;color:#6d28d9;font-weight:600;margin-top:2px;">🏡 ${memberClients.map(c => App.utils.escapeHtml(getClientDisplayName(c))).join(', ')}</div>`
        : '';

      return `
        <tr>
          <td>
            <div style="font-weight:700;color:var(--text-primary);">${App.utils.escapeHtml(u.firstName || '')} ${App.utils.escapeHtml(u.lastName || '')}</div>
            <div style="font-size:0.73rem;color:#94a3b8;">🔒 <span class="lang-en">Protected contact</span><span class="lang-es">Contacto protegido</span></div>
          </td>
          <td>${getRolePill(u.role)}</td>
          <td>
            <div style="font-weight:600;font-size:0.84rem;">${App.utils.escapeHtml(u.agencyName || '—')}</div>
            <div style="font-size:0.75rem;color:#64748b;">🌍 ${App.utils.escapeHtml(u.country || '—')}</div>
          </td>
          <td>${originHtml}</td>
          <td>${inmomasBadge}</td>
          <td style="text-align:left;">
            <span style="font-weight:700;color:#003da5;">${memberClients.length} <span class="lang-en">clients</span><span class="lang-es">clientes</span></span>
            ${subMembers.length > 0 ? ` · <span style="font-size:0.75rem;color:#059669;font-weight:700;">${subMembers.length} <span class="lang-en">agents</span><span class="lang-es">agentes</span></span>` : ''}
            ${subNamesHtml}
            ${clientCodesHtml}
          </td>
          <td>${App.utils.getUserStatusBadge(u.status)}</td>
          <td style="font-size:0.8rem;color:#64748b;white-space:nowrap;">${App.utils.formatDate(u.createdAt)}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="App.views.embajador.showMemberDetail('${u.id}')">
              👁️ <span class="lang-en">Details</span><span class="lang-es">Ver Ficha</span>
            </button>
          </td>
        </tr>`;
    }).join('');
  }

  function showMemberDetail(memberId) {
    const member = (umbrella.users || []).find(u => u.id === memberId);
    if (!member) {
      App.utils.showToast('Member not found.', 'error');
      return;
    }

    const subTeam = (umbrella.users || []).filter(u => u._umbrellaParentId === member.id || u.brokerId === member.id);
    const referredClients = member.role === 'broker'
      ? getUniqueClientsForGroup(member, subTeam)
      : getDirectClientsForMember(member);

    const subTeamHtml = subTeam.length > 0
      ? `<div style="margin-top:1rem;">
           <h4 style="margin:0 0 0.5rem;font-size:0.9rem;color:#1e3a8a;">👥 Agentes Asociados (${subTeam.length})</h4>
           <div style="max-height:160px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;">
             ${subTeam.map(s => `
               <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:0.82rem;">
                 <span><strong>${App.utils.escapeHtml(s.firstName || '')} ${App.utils.escapeHtml(s.lastName || '')}</strong>${s.country ? ` · 🌍 ${App.utils.escapeHtml(s.country)}` : ''}</span>
                 <div style="display:flex;gap:6px;align-items:center;">${getRolePill(s.role)} ${App.utils.getUserStatusBadge(s.status)}</div>
               </div>`).join('')}
           </div>
         </div>`
      : '';

    const clientsHtml = referredClients.length > 0
      ? `<div style="margin-top:1rem;">
           <h4 style="margin:0 0 0.5rem;font-size:0.9rem;color:#065f46;">🏡 Clientes en Paraguas (${referredClients.length})</h4>
           <div style="max-height:160px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;">
             ${referredClients.map(c => `
               <div onclick="App.views.embajador.showClientDetail('${c.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:0.82rem;cursor:pointer;">
                 <span><strong>${renderClientAnonLabel(c)}</strong> · ${App.utils.escapeHtml(c.interestArea || c.budget || 'España')}</span>
                 <span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>
               </div>`).join('')}
           </div>
         </div>`
      : '';

    App.utils.showModal({
      title: `${member.firstName || ''} ${member.lastName || ''} — Paraguas Embajador`,
      body: `
        <div style="text-align:left;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
            ${getRolePill(member.role)}
            ${App.utils.getUserStatusBadge(member.status)}
            ${App.utils.renderInmomasAgentBadge ? App.utils.renderInmomasAgentBadge(member, umbrella.allUsers || [], { showUnassigned: true }) : ''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;background:#f8fafc;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;font-size:0.85rem;">
            <div><strong>Agencia / Empresa:</strong><br>${App.utils.escapeHtml(member.agencyName || '—')}</div>
            <div><strong>País / Mercado:</strong><br>${App.utils.escapeHtml(member.country || '—')}</div>
            <div><strong>Origen en Paraguas:</strong><br>${App.utils.escapeHtml(member._umbrellaParentName || 'Directo')} (Nivel ${member._umbrellaLevel || 1})</div>
            <div><strong>Fecha Registro:</strong><br>${App.utils.formatDate(member.createdAt)}</div>
            <div style="grid-column:span 2;color:#64748b;font-size:0.8rem;">🔒 <strong>Datos de contacto:</strong> Protegidos por privacidad de agencia y gestionados por RE/MAX Inmomás.</div>
          </div>
          ${subTeamHtml}
          ${clientsHtml}
        </div>
      `,
      footer: `<button class="btn btn-outline" onclick="App.utils.closeModal()">Cerrar</button>`
    });
    refreshLang();
  }

  function exportNetworkToExcel() {
    if (!umbrella.users || umbrella.users.length === 0) {
      App.utils.showToast('No hay miembros en tu red para exportar.', 'info');
      return;
    }
    const headers = ['Fecha', 'Nombre', 'Apellido', 'Rol', 'Estado', 'Agencia', 'País', 'Origen en Paraguas', 'Nivel', 'Sub-Agentes', 'Clientes Referidos', 'Agente RE/MAX Inmomás'];
    const rows = umbrella.users.map(u => {
      const subMembers = (umbrella.users || []).filter(sub => sub._umbrellaParentId === u.id || (u.role === 'broker' && sub.brokerId === u.id));
      const memberClients = u.role === 'broker' ? getUniqueClientsForGroup(u, subMembers) : getDirectClientsForMember(u);
      return [
        u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '',
        u.firstName || '',
        u.lastName || '',
        u.role || '',
        u.status || '',
        u.agencyName || '',
        u.country || '',
        u._umbrellaParentName || 'Directo',
        u._umbrellaLevel || 1,
        subMembers.map(s => `${s.firstName || ''} ${s.lastName || ''}`.trim()).join(', '),
        memberClients.length > 0 ? `${memberClients.length} (${memberClients.map(c => getClientDisplayName(c)).join(', ')})` : '0',
        u._inmomasAgentName ? (u._inmomasAgentInherited ? `${u._inmomasAgentName} (vía ${u._inmomasAgentInheritedFrom})` : u._inmomasAgentName) : ''
      ];
    });

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Paraguas Embajador');
      XLSX.writeFile(wb, `Paraguas-Embajador-${new Date().toISOString().slice(0, 10)}.xlsx`);
      App.utils.showToast('✅ Red exportada a Excel (.xlsx)', 'success');
      return;
    }

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paraguas-Embajador-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.utils.showToast('✅ Red exportada a CSV/Excel', 'success');
  }

  /* ============================================
     3. CLIENTS PIPELINE (#embajador/clients)
     ============================================ */
  async function initClients() {
    try {
      const data = await loadUmbrella();
      if (!data) return;

      // Populate member filter dropdown
      const memberSelect = document.getElementById('embajador-client-member-filter');
      if (memberSelect) {
        const prev = memberSelect.value || 'all';
        let opts = `<option value="all">🌐 Todos los orígenes del Paraguas (${data.clients.length})</option>`;
        opts += `<option value="direct">👑 Directos de Embajador</option>`;
        data.users.forEach(u => {
          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          opts += `<option value="${u.id}">${App.utils.escapeHtml(name)} (${u.role})</option>`;
        });
        memberSelect.innerHTML = opts;
        if ([...memberSelect.options].some(o => o.value === prev)) {
          memberSelect.value = prev;
        }
      }

      renderClientsViews();
      refreshLang();
    } catch (err) {
      console.error('[Embajador] initClients error:', err);
      App.utils.showToast('Error loading umbrella clients.', 'error');
    }
  }

  function getFilteredClients() {
    return (umbrella.clients || []).filter(c => {
      if (clientMemberFilter === 'direct' && !c._isDirectFromEmbajador) return false;
      if (clientMemberFilter !== 'all' && clientMemberFilter !== 'direct') {
        if (c._originMemberId !== clientMemberFilter && c.referredBy !== clientMemberFilter && c.realtorId !== clientMemberFilter && c.brokerId !== clientMemberFilter) {
          return false;
        }
      }
      if (clientSearchQuery) {
        const hay = `${getClientDisplayName(c)} ${getClientAnonCode(c)} ${c.firstName || ''} ${c.lastName || ''} ${c.interestArea || ''} ${c.budget || ''} ${c.country || ''} ${c._originMemberName || ''} ${c.localAgentName || ''}`.toLowerCase();
        if (!hay.includes(clientSearchQuery)) return false;
      }
      return true;
    });
  }

  function filterClientsByMember(memberId) {
    clientMemberFilter = memberId || 'all';
    renderClientsViews();
  }

  function searchClients(query) {
    clientSearchQuery = (query || '').toLowerCase().trim();
    renderClientsViews();
  }

  function toggleClientView(mode) {
    currentClientViewMode = mode === 'list' ? 'list' : 'board';
    const boardWrap = document.getElementById('embajador-clients-board-wrap');
    const listWrap = document.getElementById('embajador-clients-list-wrap');
    const btnBoard = document.getElementById('btn-embajador-client-board');
    const btnList = document.getElementById('btn-embajador-client-list');

    if (boardWrap) boardWrap.style.display = currentClientViewMode === 'board' ? 'block' : 'none';
    if (listWrap) listWrap.style.display = currentClientViewMode === 'list' ? 'block' : 'none';
    if (btnBoard) btnBoard.className = currentClientViewMode === 'board' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    if (btnList) btnList.className = currentClientViewMode === 'list' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  }

  function renderClientsViews() {
    const filtered = getFilteredClients();
    const resolveOriginLabel = (refId) => {
      if (!refId) return 'Directo (Embajador)';
      const foundMember = (umbrella.users || []).find(u =>
        u.id === refId || (u.referralCode && String(u.referralCode).toUpperCase() === String(refId).toUpperCase())
      );
      if (foundMember) return `${foundMember.firstName || ''} ${foundMember.lastName || ''}`.trim();
      if (currentUser && (refId === currentUser.id || (currentUser.referralCode && String(currentUser.referralCode).toUpperCase() === String(refId).toUpperCase()))) {
        return 'Directo (Embajador)';
      }
      return 'Paraguas';
    };

    App.utils.renderKanbanBoard('embajador-pipeline-board', filtered, 'App.views.embajador.showClientDetail', resolveOriginLabel, null);

    const tbody = document.getElementById('embajador-clients-tbody');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#64748b;">No hay clientes que coincidan con el filtro seleccionado.</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(c => `
          <tr>
            <td>
              <div style="font-weight:700;color:var(--text-primary);">${renderClientAnonLabel(c)}</div>
              <div style="font-size:0.75rem;color:#94a3b8;">${c.country ? `🌍 ${App.utils.escapeHtml(c.country)} · ` : ''}🔒 <span class="lang-en">Email &amp; phone protected</span><span class="lang-es">Email y teléfono protegidos</span></div>
            </td>
            <td>
              <div style="font-weight:600;font-size:0.84rem;color:#003da5;">${App.utils.escapeHtml(c._originMemberName || 'Directo')}</div>
              <div style="margin-top:2px;">${getRolePill(c._originMemberRole || 'embajador')}</div>
            </td>
            <td style="font-size:0.84rem;">${App.utils.escapeHtml(c.interestArea || '—')}<div style="font-size:0.75rem;color:#64748b;">💰 ${App.utils.escapeHtml(c.budget || 'TBD')}</div></td>
            <td style="font-size:0.84rem;">${App.utils.escapeHtml(c.localAgentName || 'Pendiente asignar')}</td>
            <td><span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span></td>
            <td style="font-size:0.8rem;color:#64748b;">${App.utils.formatDate(c.createdAt)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="App.views.embajador.showClientDetail('${c.id}')">👁️ <span class="lang-en">Track</span><span class="lang-es">Ver</span></button>
            </td>
          </tr>
        `).join('');
      }
    }
    refreshLang();
  }

  function showClientDetail(clientId) {
    const client = (umbrella.clients || []).find(c => c.id === clientId);
    if (!client) {
      App.utils.showToast('Client not found.', 'error');
      return;
    }

    const clientName = getClientDisplayName(client);
    const timeline = (client.statusHistory || []).map((entry, idx) => {
      const isLast = idx === client.statusHistory.length - 1;
      return `
        <div style="display:flex;gap:0.75rem;padding-bottom:${isLast ? '0' : '0.85rem'};">
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:10px;height:10px;border-radius:50%;background:${isLast ? '#0043ff' : '#cbd5e1'};"></div>
            ${!isLast ? '<div style="width:2px;flex:1;background:#e2e8f0;"></div>' : ''}
          </div>
          <div>
            <span class="badge ${App.utils.getStatusBadgeClass(entry.status)}">${App.utils.getStatusLabel(entry.status)}</span>
            <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">${App.utils.formatDate(entry.date)}</div>
          </div>
        </div>`;
    }).join('');

    App.utils.showModal({
      title: `🏡 ${clientName}`,
      body: `
        <div style="text-align:left;">
          <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;margin-bottom:1rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:0.8rem;color:#1e40af;">
            <span style="font-size:1.1rem;line-height:1.2;">🛡️</span>
            <div>
              <span class="lang-en"><strong>Contact Privacy Protection:</strong> Direct contact details (email and phone number) are strictly confidential and managed directly by RE/MAX Inmomás.</span>
              <span class="lang-es"><strong>Protección de Contacto:</strong> El correo electrónico y el teléfono del cliente son confidenciales y están gestionados directamente por RE/MAX Inmomás.</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
            <span class="badge ${App.utils.getStatusBadgeClass(client.status)}">${App.utils.getStatusLabel(client.status)}</span>
            ${getRolePill(client._originMemberRole || 'embajador')}
            <span style="font-size:0.82rem;font-weight:600;color:#003da5;"><span class="lang-en">Origin:</span><span class="lang-es">Origen:</span> ${App.utils.escapeHtml(client._originMemberName || 'Directo')}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;background:#f8fafc;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;font-size:0.85rem;margin-bottom:1rem;">
            <div><strong><span class="lang-en">Client:</span><span class="lang-es">Cliente:</span></strong><br>${App.utils.escapeHtml(clientName)}</div>
            <div><strong><span class="lang-en">Contact Details:</span><span class="lang-es">Email / Teléfono:</span></strong><br><span style="color:#64748b;font-size:0.8rem;">🔒 <span class="lang-en">Protected</span><span class="lang-es">Protegidos</span></span></div>
            <div><strong><span class="lang-en">Country / Market:</span><span class="lang-es">País de Residencia:</span></strong><br>${App.utils.escapeHtml(client.country || '—')}</div>
            <div><strong><span class="lang-en">Area of Interest:</span><span class="lang-es">Zona de Interés:</span></strong><br>${App.utils.escapeHtml(client.interestArea || '—')}</div>
            <div><strong><span class="lang-en">Estimated Budget:</span><span class="lang-es">Presupuesto:</span></strong><br>${App.utils.escapeHtml(client.budget || '—')}</div>
            <div><strong><span class="lang-en">Timeline / Goal:</span><span class="lang-es">Plazo / Objetivo:</span></strong><br>${App.utils.escapeHtml(client.timeline || '—')} · ${App.utils.escapeHtml(client.objective || '—')}</div>
            <div style="grid-column:span 2;"><strong><span class="lang-en">Assigned Spain Agent:</span><span class="lang-es">Agente España Asignado:</span></strong><br>${App.utils.escapeHtml(client.localAgentName || 'En asignación por Admin')}</div>
          </div>
          <h4 style="margin:0 0 0.6rem;font-size:0.9rem;color:#0f172a;">📅 <span class="lang-en">Pipeline Status History</span><span class="lang-es">Historial de Estados</span></h4>
          <div>${timeline || '<p style="font-size:0.82rem;color:#64748b;"><span class="lang-en">No additional history.</span><span class="lang-es">Sin historial adicional.</span></p>'}</div>
        </div>
      `,
      footer: `<button class="btn btn-outline" onclick="App.utils.closeModal()"><span class="lang-en">Close</span><span class="lang-es">Cerrar</span></button>`
    });
    refreshLang();
  }

  function showAddClientModal() {
    App.utils.showModal({
      title: '➕ Añadir Cliente al Paraguas',
      body: `
        <form id="embajador-add-client-form" style="display:grid;gap:0.85rem;text-align:left;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div>
              <label class="form-label">Nombre *</label>
              <input type="text" id="emb-cli-first" class="form-input" required placeholder="Ej. Michael">
            </div>
            <div>
              <label class="form-label">Apellido *</label>
              <input type="text" id="emb-cli-last" class="form-input" required placeholder="Ej. Anderson">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div>
              <label class="form-label">Email *</label>
              <input type="email" id="emb-cli-email" class="form-input" required placeholder="cliente@email.com">
            </div>
            <div>
              <label class="form-label">Teléfono *</label>
              <input type="tel" id="emb-cli-phone" class="form-input" required placeholder="+1 305 555 0199">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div>
              <label class="form-label">País de Residencia</label>
              <input type="text" id="emb-cli-country" class="form-input" placeholder="United States / Canada">
            </div>
            <div>
              <label class="form-label">Presupuesto Estimado</label>
              <select id="emb-cli-budget" class="form-select">
                <option value="200k-400k">€200,000 – €400,000</option>
                <option value="400k-750k">€400,000 – €750,000</option>
                <option value="750k-1.5m">€750,000 – €1,500,000</option>
                <option value="1.5m+">€1,500,000+</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label">Zona de Interés en España</label>
            <input type="text" id="emb-cli-area" class="form-input" placeholder="Costa Blanca, Alicante, Madrid, Costa del Sol...">
          </div>
          <div>
            <label class="form-label">Notas / Perfil del Comprador</label>
            <textarea id="emb-cli-notes" class="form-input" rows="3" placeholder="Detalles relevantes de búsqueda, horizonte temporal o financiación..."></textarea>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem;">
            <button type="button" class="btn btn-outline" onclick="App.utils.closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="emb-cli-submit">Guardar Cliente</button>
          </div>
        </form>
      `
    });

    const form = document.getElementById('embajador-add-client-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('emb-cli-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
        try {
          await App.auth.addClientManually({
            firstName: document.getElementById('emb-cli-first').value.trim(),
            lastName: document.getElementById('emb-cli-last').value.trim(),
            email: document.getElementById('emb-cli-email').value.trim(),
            phone: document.getElementById('emb-cli-phone').value.trim(),
            country: document.getElementById('emb-cli-country').value.trim() || 'United States',
            budget: document.getElementById('emb-cli-budget').value,
            interestArea: document.getElementById('emb-cli-area').value.trim() || 'Costa Blanca',
            notes: document.getElementById('emb-cli-notes').value.trim()
          });
          App.utils.closeModal();
          App.utils.showToast('✅ Cliente registrado bajo tu paraguas con éxito.', 'success');
          const route = App.router.getCurrentRoute();
          if (route === 'embajador/clients') initClients();
          else initDashboard();
        } catch (err) {
          App.utils.showToast('Error: ' + err.message, 'error');
          if (btn) { btn.disabled = false; btn.textContent = 'Guardar Cliente'; }
        }
      });
    }
  }

  function exportClientsToExcel() {
    const list = getFilteredClients();
    if (!list.length) {
      App.utils.showToast('No hay clientes para exportar.', 'info');
      return;
    }
    const headers = ['Fecha', 'Cliente', 'País', 'Zona Interés', 'Presupuesto', 'Estado', 'Origen en Paraguas', 'Rol Origen', 'Agente España'];
    const rows = list.map(c => [
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : '',
      getClientDisplayName(c),
      c.country || '',
      c.interestArea || '',
      c.budget || '',
      c.status || '',
      c._originMemberName || 'Directo',
      c._originMemberRole || 'embajador',
      c.localAgentName || 'Sin asignar'
    ]);

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes Paraguas');
      XLSX.writeFile(wb, `Clientes-Paraguas-${new Date().toISOString().slice(0, 10)}.xlsx`);
      App.utils.showToast('✅ Clientes exportados a Excel (.xlsx)', 'success');
      return;
    }

    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clientes-Paraguas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ============================================
     4. WEBINAR REGISTRATIONS (#embajador/webinar)
     ============================================ */
  async function initWebinar() {
    try {
      const data = await loadUmbrella();
      if (!data) return;

      const regs = data.webinarRegistrations || [];
      const b2bCount = regs.filter(r => App.views.admin && App.views.admin.isWebinarB2B ? App.views.admin.isWebinarB2B(r) : (r.webinarType === 'b2b')).length;
      const b2cCount = regs.length - b2bCount;

      setTextById('embajador-webinar-total', regs.length);
      setTextById('embajador-webinar-b2b', b2bCount);
      setTextById('embajador-webinar-b2c', b2cCount);

      const regSel = document.getElementById('emb-webinar-region-select');
      if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
        regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
      }

      renderWebinarTable();
      refreshLang();
    } catch (err) {
      console.error('[Embajador] initWebinar error:', err);
    }
  }

  function setWebinarFilter(type) {
    webinarFilter = type || 'all';
    renderWebinarTable();
  }

  function setWebinarRegionFilter(regionId) {
    webinarRegionFilter = regionId || '';
    renderWebinarTable();
  }

  function searchWebinar(q) {
    webinarSearchQuery = (q || '').toLowerCase().trim();
    renderWebinarTable();
  }

  function renderWebinarTable() {
    const tbody = document.getElementById('embajador-webinar-tbody');
    if (!tbody) return;

    const regs = (umbrella.webinarRegistrations || []).filter(r => {
      const isB2B = !r._isRedactedB2C && ((App.views.admin && typeof App.views.admin.isWebinarB2B === 'function')
        ? App.views.admin.isWebinarB2B(r)
        : (String(r.webinarType || '').toLowerCase() === 'b2b'));
      if (webinarFilter === 'b2b' && !isB2B) return false;
      if (webinarFilter === 'b2c' && isB2B) return false;
      if (webinarRegionFilter && App.utils && App.utils.getRecordRegion && App.utils.getRecordRegion(r, umbrella.users) !== webinarRegionFilter) return false;
      if (webinarSearchQuery) {
        const namePart = `${r.firstName || ''} ${r.lastName || ''} ${r._displayName || ''} ${r.agency || ''}`;
        const hay = `${namePart} ${r.country || ''} ${r.agentReferrerName || ''} ${r.referrerName || ''} ${r.referralCode || ''}`.toLowerCase();
        if (!hay.includes(webinarSearchQuery)) return false;
      }
      return true;
    });

    if (regs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#64748b;"><span class="lang-en">No webinar registrations recorded under your umbrella yet.</span><span class="lang-es">No hay inscripciones a webinarios registradas bajo tu paraguas todavía.</span></td></tr>`;
      return;
    }

    tbody.innerHTML = regs.map(r => {
      const isB2B = !r._isRedactedB2C && ((App.views.admin && typeof App.views.admin.isWebinarB2B === 'function')
        ? App.views.admin.isWebinarB2B(r)
        : (String(r.webinarType || '').toLowerCase() === 'b2b'));
      const badge = isB2B
        ? `<span style="background:rgba(0,63,153,0.1);color:#003f99;padding:3px 8px;border-radius:999px;font-size:0.74rem;font-weight:700;">🏢 B2B Profesional</span>`
        : `<span style="background:rgba(16,185,129,0.1);color:#059669;padding:3px 8px;border-radius:999px;font-size:0.74rem;font-weight:700;">🏡 B2C Cliente</span>`;

      const attendeeFullName = String(r._displayName || `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.name || '—');
      const attendeeHtml = `
        <div style="font-weight:700;">${App.utils.escapeHtml(attendeeFullName)}</div>
        <div style="font-size:0.73rem;color:#94a3b8;">🔒 <span class="lang-en">Email &amp; phone protected</span><span class="lang-es">Email y teléfono protegidos</span></div>`;

      return `
        <tr>
          <td style="font-size:0.8rem;color:#64748b;">${App.utils.formatDate(r.createdAt)}</td>
          <td>${badge}</td>
          <td>${attendeeHtml}</td>
          <td style="font-size:0.84rem;">🌍 ${App.utils.escapeHtml(r.country || '—')}</td>
          <td style="font-size:0.84rem;">${App.utils.escapeHtml(isB2B ? (r.agency || '—') : (r.clientInterest || 'España'))}</td>
          <td style="font-size:0.82rem;font-weight:600;color:#003da5;">${App.utils.escapeHtml(r.agentReferrerName || r.referrerName || r.referralCode || 'Paraguas')}</td>
        </tr>
      `;
    }).join('');
  }

  /* ============================================
     5. DOCUMENTS & CONTRACT (#embajador/documents)
     ============================================ */
  async function initDocuments() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;
    const docsGuideEl = document.getElementById('embajador-docs-buyer-guide');
    if (docsGuideEl && App.buyerGuide && App.buyerGuide.canUse(currentUser)) {
      App.buyerGuide.renderEditor(docsGuideEl, currentUser);
    }
    const container = document.getElementById('embajador-contract-section');
    if (container && App.utils && typeof App.utils.renderContractDataSection === 'function') {
      App.utils.renderContractDataSection(container, currentUser, 'embajador-contract');
    }
    refreshLang();
  }

  /* ============================================
     6. FINANCES & COMMISSIONS (#embajador/finances)
     ============================================ */
  async function initFinances() {
    try {
      const data = await loadUmbrella();
      if (!data) return;

      const comms = data.commissions || [];
      const totalVolume = comms.reduce((s, c) => s + (c.salePrice || 0), 0);
      const paidTotal = comms.filter(c => c.status === 'paid').reduce((s, c) => s + (c.realtorAmount || 0), 0);
      const pendingTotal = comms.filter(c => c.status !== 'paid').reduce((s, c) => s + (c.realtorAmount || 0), 0);

      setTextById('embajador-fin-deals', comms.length);
      setTextById('embajador-fin-volume', App.utils.formatCurrency(totalVolume));
      setTextById('embajador-fin-paid', App.utils.formatCurrency(paidTotal));
      setTextById('embajador-fin-pending', App.utils.formatCurrency(pendingTotal));

      const tbody = document.getElementById('embajador-finances-tbody');
      if (tbody) {
        if (comms.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#64748b;">Aún no hay operaciones comisionables registradas en el paraguas.</td></tr>`;
        } else {
          tbody.innerHTML = comms.map(c => {
            const matchedClient = (data.clients || []).find(cl => cl.id === c.clientId);
            const originName = matchedClient ? matchedClient._originMemberName : 'Red Paraguas';
            const clientCellHtml = renderClientAnonLabel(matchedClient || c);
            const zoneLabel = (matchedClient && matchedClient.interestArea) || c.propertyAddress || 'España';
            const statusPill = c.status === 'paid'
              ? `<span class="badge badge--approved"><span class="lang-en">Paid</span><span class="lang-es">Pagada</span></span>`
              : (c.status === 'pending_payment'
                  ? `<span class="badge badge--pending"><span class="lang-en">Pending Payment</span><span class="lang-es">Pendiente Cobro</span></span>`
                  : `<span class="badge badge--completed"><span class="lang-en">Projected</span><span class="lang-es">Proyectada</span></span>`);

            return `
              <tr>
                <td style="font-weight:700;">${clientCellHtml}</td>
                <td style="font-size:0.84rem;color:#003da5;font-weight:600;">${App.utils.escapeHtml(originName)}</td>
                <td style="font-size:0.84rem;">📍 ${App.utils.escapeHtml(zoneLabel)}</td>
                <td style="font-weight:600;">${App.utils.formatCurrency(c.salePrice || 0)}</td>
                <td style="font-weight:700;color:#059669;">${App.utils.formatCurrency(c.realtorAmount || 0)}</td>
                <td>${statusPill}</td>
              </tr>`;
          }).join('');
        }
      }
      refreshLang();
    } catch (err) {
      console.error('[Embajador] initFinances error:', err);
    }
  }

  /* ── Register Public Module API ── */
  App.views.embajador = {
    initDashboard,
    initNetwork,
    setNetworkViewMode,
    toggleEmbNode,
    expandAllUmbrellaNodes,
    initClients,
    initWebinar,
    initDocuments,
    initFinances,
    copyVariantLink,
    setNetworkRoleFilter,
    setNetworkRegionFilter,
    setNetworkStatusFilter,
    searchNetwork,
    showMemberDetail,
    exportNetworkToExcel,
    filterClientsByMember,
    searchClients,
    toggleClientView,
    showClientDetail,
    showAddClientModal,
    exportClientsToExcel,
    setWebinarFilter,
    setWebinarRegionFilter,
    searchWebinar
  };

})();
