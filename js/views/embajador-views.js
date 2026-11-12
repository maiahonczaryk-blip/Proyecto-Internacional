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
  let networkStatusFilter = 'all';
  let networkSearchQuery = '';

  let clientMemberFilter = 'all';
  let clientSearchQuery = '';
  let currentClientViewMode = 'board';

  let webinarFilter = 'all';
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

  /* ============================================
     1. DASHBOARD (#embajador/dashboard)
     ============================================ */
  async function initDashboard() {
    try {
      const data = await loadUmbrella();
      if (!data || !currentUser) return;

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

      // Referral Link Setup (EMB-...)
      const isPending = currentUser.status === 'pending';
      const refCode = currentUser.referralCode || 'EMB-DEFAULT';
      const baseReferralLink = isPending ? '' : App.utils.generateReferralLink(refCode);
      const linkInput = document.getElementById('embajador-dash-referral-link');
      const copyBtn = document.getElementById('embajador-dash-copy-link');

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
          App.utils.showToast('🔗 Enlace de Embajador copiado al portapapeles', 'success');
        };
      }

      // Render quick-share buttons for all 4 permitted umbrella variants (NO embajador!)
      const variantsEl = document.getElementById('embajador-referral-variants');
      if (variantsEl) {
        if (isPending) {
          variantsEl.innerHTML = '';
        } else {
          const variants = [
            { type: 'broker', icon: '🏢', labelEn: 'Invite Broker', labelEs: 'Invitar Broker', waFn: `App.utils.shareBrokerPartnerWhatsApp('${baseReferralLink}&type=broker')` },
            { type: 'realtor', icon: '🏠', labelEn: 'Invite Agent / Realtor', labelEs: 'Invitar Agente / Realtor', waFn: `App.utils.shareRealtorPartnerWhatsApp('${baseReferralLink}&type=realtor')` },
            { type: 'colaborador', icon: '🤝', labelEn: 'Invite Collaborator', labelEs: 'Invitar Colaborador', waFn: `App.utils.shareColaboradorWhatsApp('${baseReferralLink}&type=colaborador')` },
            { type: 'client', icon: '🏡', labelEn: 'Invite End Client', labelEs: 'Invitar Cliente Final', waFn: `App.utils.shareWebinarWhatsApp('${baseReferralLink}&type=client')` }
          ];

          variantsEl.innerHTML = variants.map(v => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
              <div style="font-size:0.82rem;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:6px;">
                <span>${v.icon}</span>
                <span class="lang-en">${v.labelEn}</span>
                <span class="lang-es">${v.labelEs}</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center;">
                <button type="button" class="btn btn-outline btn-sm" style="padding:4px 9px;font-size:0.75rem;" onclick="App.views.embajador.copyVariantLink('${v.type}')" title="Copiar enlace directo">
                  📋 <span class="lang-en">Link</span><span class="lang-es">Enlace</span>
                </button>
                <button type="button" class="btn btn-sm" style="padding:4px 9px;font-size:0.75rem;background:#25D366;color:#fff;border:none;" onclick="${v.waFn}" title="Enviar por WhatsApp">
                  💬 WhatsApp
                </button>
              </div>
            </div>
          `).join('');
        }
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
    const allowed = ['broker', 'realtor', 'colaborador', 'client'];
    if (!allowed.includes(variantType)) return;
    const url = `${App.utils.generateReferralLink(currentUser.referralCode)}&type=${encodeURIComponent(variantType)}`;
    App.utils.copyToClipboard(url);
    const names = { broker: 'Broker', realtor: 'Agente / Realtor', colaborador: 'Colaborador', client: 'Cliente Final' };
    App.utils.showToast(`🔗 Enlace para ${names[variantType]} copiado al portapapeles`, 'success');
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

    container.innerHTML = recent.map(c => `
      <div onclick="App.views.embajador.showClientDetail('${c.id}')" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid var(--border-subtle);cursor:pointer;">
        <div style="min-width:0;">
          <div style="font-weight:700;color:var(--text-primary);font-size:0.9rem;">
            ${App.utils.escapeHtml(c.firstName || '')} ${App.utils.escapeHtml(c.lastName || '')}
          </div>
          <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;">
            📍 ${App.utils.escapeHtml(c.interestArea || c.currentLocation || c.country || 'España')} · 🤝 ${App.utils.escapeHtml(c._originMemberName || 'Directo')}
          </div>
        </div>
        <div style="flex-shrink:0;">
          <span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>
        </div>
      </div>
    `).join('');
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

      renderNetworkTable();
      refreshLang();
    } catch (err) {
      console.error('[Embajador] initNetwork error:', err);
      App.utils.showToast('Error loading umbrella network.', 'error');
    }
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
    renderNetworkTable();
  }

  function setNetworkStatusFilter(status) {
    networkStatusFilter = status || 'all';
    renderNetworkTable();
  }

  function searchNetwork(query) {
    networkSearchQuery = (query || '').toLowerCase().trim();
    renderNetworkTable();
  }

  function renderNetworkTable() {
    const tbody = document.getElementById('embajador-network-tbody');
    if (!tbody) return;

    const filtered = (umbrella.users || []).filter(u => {
      if (networkRoleFilter !== 'all' && u.role !== networkRoleFilter) return false;
      if (networkStatusFilter !== 'all' && u.status !== networkStatusFilter) return false;
      if (networkSearchQuery) {
        const hay = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.phone || ''} ${u.agencyName || ''} ${u.country || ''} ${u._umbrellaParentName || ''} ${u.referralCode || ''}`.toLowerCase();
        if (!hay.includes(networkSearchQuery)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:2.5rem;color:#64748b;">
            <span class="lang-en">No umbrella members match the current filters.</span>
            <span class="lang-es">No hay miembros en tu paraguas con los filtros seleccionados.</span>
          </td>
        </tr>`;
      refreshLang();
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const memberClients = (umbrella.clients || []).filter(c =>
        c._originMemberId === u.id || c.referredBy === u.id || c.realtorId === u.id || c.brokerId === u.id
      ).length;
      const subMembers = (umbrella.users || []).filter(sub => sub._umbrellaParentId === u.id).length;
      const originHtml = u._isDirectFromEmbajador
        ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.78rem;font-weight:700;color:#b45309;">👑 <span class="lang-en">Direct (Level 1)</span><span class="lang-es">Directo (Nivel 1)</span></span>`
        : `<div style="font-size:0.78rem;color:#1e40af;font-weight:600;">↳ ${App.utils.escapeHtml(u._umbrellaParentName)}</div><div style="font-size:0.7rem;color:#64748b;">Nivel ${u._umbrellaLevel}</div>`;

      return `
        <tr>
          <td>
            <div style="font-weight:700;color:var(--text-primary);">${App.utils.escapeHtml(u.firstName || '')} ${App.utils.escapeHtml(u.lastName || '')}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);">${App.utils.escapeHtml(u.email || '—')}</div>
            ${u.phone ? `<div style="font-size:0.75rem;color:#64748b;">📞 ${App.utils.escapeHtml(u.phone)}</div>` : ''}
          </td>
          <td>${getRolePill(u.role)}</td>
          <td>
            <div style="font-weight:600;font-size:0.84rem;">${App.utils.escapeHtml(u.agencyName || '—')}</div>
            <div style="font-size:0.75rem;color:#64748b;">🌍 ${App.utils.escapeHtml(u.country || '—')}</div>
          </td>
          <td>${originHtml}</td>
          <td style="text-align:center;">
            <span style="font-weight:700;color:#003da5;">${memberClients}</span>
            ${subMembers > 0 ? `<div style="font-size:0.72rem;color:#059669;font-weight:600;">+${subMembers} sub-red</div>` : ''}
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

    refreshLang();
  }

  function showMemberDetail(memberId) {
    const member = (umbrella.users || []).find(u => u.id === memberId);
    if (!member) {
      App.utils.showToast('Member not found.', 'error');
      return;
    }

    const subTeam = (umbrella.users || []).filter(u => u._umbrellaParentId === member.id || u.brokerId === member.id);
    const referredClients = (umbrella.clients || []).filter(c =>
      c._originMemberId === member.id || c.referredBy === member.id || c.realtorId === member.id || c.brokerId === member.id
    );

    const subTeamHtml = subTeam.length > 0
      ? `<div style="margin-top:1rem;">
           <h4 style="margin:0 0 0.5rem;font-size:0.9rem;color:#1e3a8a;">👥 Sub-Red Asociada (${subTeam.length})</h4>
           <div style="max-height:160px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;">
             ${subTeam.map(s => `
               <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:0.82rem;">
                 <span><strong>${App.utils.escapeHtml(s.firstName || '')} ${App.utils.escapeHtml(s.lastName || '')}</strong> (${App.utils.escapeHtml(s.email || '')})</span>
                 ${getRolePill(s.role)}
               </div>`).join('')}
           </div>
         </div>`
      : '';

    const clientsHtml = referredClients.length > 0
      ? `<div style="margin-top:1rem;">
           <h4 style="margin:0 0 0.5rem;font-size:0.9rem;color:#065f46;">🏡 Clientes Referidos (${referredClients.length})</h4>
           <div style="max-height:160px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem;">
             ${referredClients.map(c => `
               <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:0.82rem;">
                 <span><strong>${App.utils.escapeHtml(c.firstName || '')} ${App.utils.escapeHtml(c.lastName || '')}</strong> · ${App.utils.escapeHtml(c.interestArea || c.budget || 'España')}</span>
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
            <span style="font-size:0.78rem;color:#64748b;font-family:monospace;background:#f8fafc;padding:3px 8px;border-radius:6px;border:1px solid #e2e8f0;">
              ${App.utils.escapeHtml(member.referralCode || '—')}
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;background:#f8fafc;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;font-size:0.85rem;">
            <div><strong>Email:</strong><br>${App.utils.escapeHtml(member.email || '—')}</div>
            <div><strong>Teléfono:</strong><br>${App.utils.escapeHtml(member.phone || '—')}</div>
            <div><strong>Agencia / Empresa:</strong><br>${App.utils.escapeHtml(member.agencyName || '—')}</div>
            <div><strong>País / Mercado:</strong><br>${App.utils.escapeHtml(member.country || '—')}</div>
            <div><strong>Origen en Paraguas:</strong><br>${App.utils.escapeHtml(member._umbrellaParentName || 'Directo')} (Nivel ${member._umbrellaLevel || 1})</div>
            <div><strong>Fecha Registro:</strong><br>${App.utils.formatDate(member.createdAt)}</div>
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
    const headers = ['Fecha', 'Nombre', 'Apellido', 'Rol', 'Estado', 'Email', 'Teléfono', 'Agencia', 'País', 'Origen en Paraguas', 'Nivel', 'Código Referido'];
    const rows = umbrella.users.map(u => [
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '',
      u.firstName || '',
      u.lastName || '',
      u.role || '',
      u.status || '',
      u.email || '',
      u.phone || '',
      u.agencyName || '',
      u.country || '',
      u._umbrellaParentName || 'Directo',
      u._umbrellaLevel || 1,
      u.referralCode || ''
    ]);

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
        const hay = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.phone || ''} ${c.interestArea || ''} ${c.budget || ''} ${c._originMemberName || ''} ${c.localAgentName || ''}`.toLowerCase();
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
    App.utils.renderKanbanBoard('embajador-pipeline-board', filtered, 'App.views.embajador.showClientDetail', null, null);

    const tbody = document.getElementById('embajador-clients-tbody');
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#64748b;">No hay clientes que coincidan con el filtro seleccionado.</td></tr>`;
      } else {
        tbody.innerHTML = filtered.map(c => `
          <tr>
            <td>
              <div style="font-weight:700;color:var(--text-primary);">${App.utils.escapeHtml(c.firstName || '')} ${App.utils.escapeHtml(c.lastName || '')}</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);">${App.utils.escapeHtml(c.email || '—')} · ${App.utils.escapeHtml(c.phone || '—')}</div>
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
              <button class="btn btn-outline btn-sm" onclick="App.views.embajador.showClientDetail('${c.id}')">👁️ Ver</button>
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
            ${entry.note ? `<div style="font-size:0.8rem;color:#334155;font-style:italic;margin-top:2px;">"${App.utils.escapeHtml(entry.note)}"</div>` : ''}
          </div>
        </div>`;
    }).join('');

    App.utils.showModal({
      title: `Ficha de Cliente — ${client.firstName || ''} ${client.lastName || ''}`,
      body: `
        <div style="text-align:left;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
            <span class="badge ${App.utils.getStatusBadgeClass(client.status)}">${App.utils.getStatusLabel(client.status)}</span>
            ${getRolePill(client._originMemberRole || 'embajador')}
            <span style="font-size:0.82rem;font-weight:600;color:#003da5;">Origen: ${App.utils.escapeHtml(client._originMemberName || 'Directo')}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;background:#f8fafc;padding:1rem;border-radius:10px;border:1px solid #e2e8f0;font-size:0.85rem;margin-bottom:1rem;">
            <div><strong>Email:</strong><br>${App.utils.escapeHtml(client.email || '—')}</div>
            <div><strong>Teléfono:</strong><br>${App.utils.escapeHtml(client.phone || '—')}</div>
            <div><strong>Zona de Interés:</strong><br>${App.utils.escapeHtml(client.interestArea || '—')}</div>
            <div><strong>Presupuesto:</strong><br>${App.utils.escapeHtml(client.budget || '—')}</div>
            <div><strong>Plazo / Objetivo:</strong><br>${App.utils.escapeHtml(client.timeline || '—')} · ${App.utils.escapeHtml(client.objective || '—')}</div>
            <div><strong>Agente España Asignado:</strong><br>${App.utils.escapeHtml(client.localAgentName || 'En asignación por Admin')}</div>
          </div>
          ${client.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:0.75rem;font-size:0.83rem;color:#78350f;margin-bottom:1rem;"><strong>Notas:</strong> ${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin:0 0 0.6rem;font-size:0.9rem;color:#0f172a;">📅 Historial de Seguimiento</h4>
          <div>${timeline || '<p style="font-size:0.82rem;color:#64748b;">Sin historial adicional.</p>'}</div>
        </div>
      `,
      footer: `<button class="btn btn-outline" onclick="App.utils.closeModal()">Cerrar</button>`
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
    const headers = ['Fecha', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Zona Interés', 'Presupuesto', 'Estado', 'Origen en Paraguas', 'Rol Origen', 'Agente España'];
    const rows = list.map(c => [
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : '',
      c.firstName || '',
      c.lastName || '',
      c.email || '',
      c.phone || '',
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

  function searchWebinar(q) {
    webinarSearchQuery = (q || '').toLowerCase().trim();
    renderWebinarTable();
  }

  function renderWebinarTable() {
    const tbody = document.getElementById('embajador-webinar-tbody');
    if (!tbody) return;

    const regs = (umbrella.webinarRegistrations || []).filter(r => {
      const isB2B = (App.views.admin && typeof App.views.admin.isWebinarB2B === 'function')
        ? App.views.admin.isWebinarB2B(r)
        : (r.webinarType === 'b2b');
      if (webinarFilter === 'b2b' && !isB2B) return false;
      if (webinarFilter === 'b2c' && isB2B) return false;
      if (webinarSearchQuery) {
        const hay = `${r.firstName || ''} ${r.lastName || ''} ${r.email || ''} ${r.phone || ''} ${r.agency || ''} ${r.agentReferrerName || ''} ${r.referralCode || ''}`.toLowerCase();
        if (!hay.includes(webinarSearchQuery)) return false;
      }
      return true;
    });

    if (regs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#64748b;">No hay inscripciones a webinarios registradas bajo tu paraguas todavía.</td></tr>`;
      return;
    }

    tbody.innerHTML = regs.map(r => {
      const isB2B = (App.views.admin && typeof App.views.admin.isWebinarB2B === 'function')
        ? App.views.admin.isWebinarB2B(r)
        : (r.webinarType === 'b2b');
      const badge = isB2B
        ? `<span style="background:rgba(0,63,153,0.1);color:#003f99;padding:3px 8px;border-radius:999px;font-size:0.74rem;font-weight:700;">🏢 B2B Profesional</span>`
        : `<span style="background:rgba(16,185,129,0.1);color:#059669;padding:3px 8px;border-radius:999px;font-size:0.74rem;font-weight:700;">🏡 B2C Cliente</span>`;

      return `
        <tr>
          <td style="font-size:0.8rem;color:#64748b;">${App.utils.formatDate(r.createdAt)}</td>
          <td>${badge}</td>
          <td>
            <div style="font-weight:700;">${App.utils.escapeHtml(r.firstName || '')} ${App.utils.escapeHtml(r.lastName || '')}</div>
            <div style="font-size:0.78rem;color:#64748b;">${App.utils.escapeHtml(r.email || '—')}</div>
          </td>
          <td style="font-size:0.84rem;">${App.utils.escapeHtml(r.phone || '—')}</td>
          <td style="font-size:0.84rem;">${App.utils.escapeHtml(r.agency || r.clientInterest || '—')}</td>
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
            const statusPill = c.status === 'paid'
              ? `<span class="badge badge--approved">Pagada</span>`
              : (c.status === 'pending_payment'
                  ? `<span class="badge badge--pending">Pendiente Cobro</span>`
                  : `<span class="badge badge--completed">Proyectada</span>`);

            return `
              <tr>
                <td style="font-weight:700;">${App.utils.escapeHtml(c.clientName || 'Cliente')}</td>
                <td style="font-size:0.84rem;color:#003da5;font-weight:600;">${App.utils.escapeHtml(originName)}</td>
                <td style="font-size:0.84rem;">${App.utils.escapeHtml(c.propertyAddress || 'España')}</td>
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
    initClients,
    initWebinar,
    initDocuments,
    initFinances,
    copyVariantLink,
    setNetworkRoleFilter,
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
    searchWebinar
  };

})();
