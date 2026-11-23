/* ============================================
   RE/MAX Inmomás — Agente Inmomás View Module
   ============================================
   Handles all local Spanish Agent dashboard views:
   dashboard overview, interactive Kanban client funnel,
   and finances. Registered on App.views.agentInmomas.
   ============================================ */

;(function() {
  'use strict';

  window.App = window.App || {};
  App.views = App.views || {};

  /* ── Cached data ── */
  let currentUser = null;
  let agentClients = [];
  let agentCommissions = [];
  let allUsers = [];
  let cachedPartners = [];
  let cachedWebinarRegs = [];

  function isRegB2B(r) {
    if (App.views && App.views.admin && typeof App.views.admin.isWebinarB2B === 'function') {
      return App.views.admin.isWebinarB2B(r);
    }
    const t = String(r?.webinarType || '').toLowerCase();
    return t === 'b2b' || ['realtor', 'broker', 'embajador', 'colaborador'].includes(String(r?.role || '').toLowerCase());
  }

  /* ============================================
     initDashboard()
     Populates #view-agent-dashboard with stats,
     mini pipeline summary, and recent client activity.
     ============================================ */
  async function initDashboard() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      // Welcome text
      const welcome = document.getElementById('agent-welcome');
      if (welcome) {
        welcome.innerHTML = `<span class="lang-en">Welcome back, <strong>${currentUser.firstName}</strong>. Here is your Spain pipeline.</span>
                             <span class="lang-es">Bienvenido de nuevo, <strong>${currentUser.firstName}</strong>. Aquí está tu embudo local.</span>`;
      }

      // Load data scoped to this local agent or colaborador
      const isColaborador = currentUser.role === 'colaborador';
      const clientFilter = isColaborador ? { referredBy: currentUser.id } : { localAgentId: currentUser.id };
      agentClients = await App.auth.getClients(clientFilter);
      agentCommissions = await App.auth.getCommissions(isColaborador ? { realtorId: currentUser.id } : { agentId: currentUser.id });
      allUsers = await App.auth.getAllUsers();
      const freshMe = allUsers.find(u => u.id === currentUser.id) || currentUser;

      // Render RE/MAX Inmomás Regional Hub Banner
      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('agent-regional-banner', freshMe);
      }

      // Calculate metrics
      const activeCount = agentClients.filter(c => !['completed', 'closed'].includes(c.status)).length;
      const closedCount = agentClients.filter(c => ['completed', 'closed'].includes(c.status)).length;
      const totalEarned = agentCommissions.reduce((sum, c) => sum + (isColaborador ? (c.realtorAmount || 0) : (c.agentAmount || 0)), 0);

      // Update stat cards
      setTextById('agent-stat-clients', agentClients.length);
      setTextById('agent-stat-active', activeCount);
      setTextById('agent-stat-sales', closedCount);
      setTextById('agent-stat-commissions', App.utils.formatCurrency(totalEarned));

      // Funnel summary (mini pipeline)
      renderMiniPipeline(agentClients);

      // Recent activity (last 5 clients, sorted by updatedAt/createdAt)
      renderRecentClients(agentClients);
      
      // Recent webinar registrations (top 3)
      renderRecentWebinars();

      // Professional Partner Link & Exclusive Client Webinar Link
      const isPending = currentUser.status === 'pending';
      const refCode = currentUser.referralCode || 'LOC-DEFAULT';
      const referralLink = isPending ? '' : App.utils.generateReferralLink(refCode);
      const clientWebinarLink = isPending ? '' : App.utils.generateClientWebinarLink(refCode);

      const linkInput = document.getElementById('agent-dash-referral-link');
      if (linkInput) {
        if (isPending) {
          linkInput.value = 'Enlace pendiente de aprobación por el Administrador';
          linkInput.disabled = true;
          linkInput.style.color = '#9ca3af';
          linkInput.style.fontStyle = 'italic';
        } else {
          linkInput.value = referralLink;
          linkInput.disabled = false;
          linkInput.style.color = '';
          linkInput.style.fontStyle = '';
        }
      }

      const clientLinkInput = document.getElementById('agent-dash-client-webinar-link');
      if (clientLinkInput) {
        if (isPending) {
          clientLinkInput.value = 'Enlace pendiente de aprobación por el Administrador';
          clientLinkInput.disabled = true;
          clientLinkInput.style.color = '#9ca3af';
          clientLinkInput.style.fontStyle = 'italic';
        } else {
          clientLinkInput.value = clientWebinarLink;
          clientLinkInput.disabled = false;
          clientLinkInput.style.color = '';
          clientLinkInput.style.fontStyle = '';
        }
      }

      // Copy button handlers
      const copyBtn = document.getElementById('agent-dash-copy-link');
      if (copyBtn) {
        if (isPending) {
          copyBtn.disabled = true;
          copyBtn.style.opacity = '0.5';
          copyBtn.style.cursor = 'not-allowed';
          copyBtn.onclick = null;
        } else {
          copyBtn.disabled = false;
          copyBtn.style.opacity = '';
          copyBtn.style.cursor = 'pointer';
          copyBtn.onclick = () => {
            App.utils.copyToClipboard(referralLink);
            App.utils.showToast('🔗 Enlace profesional copiado al portapapeles', 'success');
          };
        }
      }

      const copyEmbBtn = document.getElementById('agent-dash-copy-embajador-link');
      if (copyEmbBtn) {
        const embCard = copyEmbBtn.closest('.glass-card') || copyEmbBtn.parentElement;
        if (isColaborador) {
          if (embCard && embCard !== copyEmbBtn.closest('.dashboard-section')) {
            embCard.style.display = 'none';
          } else {
            copyEmbBtn.style.display = 'none';
          }
        } else {
          if (embCard && embCard !== copyEmbBtn.closest('.dashboard-section')) {
            embCard.style.display = '';
          }
          copyEmbBtn.style.display = '';
          if (isPending) {
            copyEmbBtn.disabled = true;
            copyEmbBtn.style.opacity = '0.5';
            copyEmbBtn.style.cursor = 'not-allowed';
            copyEmbBtn.onclick = null;
          } else {
            copyEmbBtn.disabled = false;
            copyEmbBtn.style.opacity = '';
            copyEmbBtn.style.cursor = 'pointer';
            copyEmbBtn.onclick = () => {
              const embUrl = `${referralLink}&type=embajador`;
              App.utils.copyToClipboard(embUrl);
              App.utils.showToast('👑 Enlace directo de postulación como Embajador copiado al portapapeles', 'success');
            };
          }
        }
      }

      const copyClientBtn = document.getElementById('agent-dash-copy-client-link');
      if (copyClientBtn) {
        if (isPending) {
          copyClientBtn.disabled = true;
          copyClientBtn.style.opacity = '0.5';
          copyClientBtn.style.cursor = 'not-allowed';
          copyClientBtn.onclick = null;
        } else {
          copyClientBtn.disabled = false;
          copyClientBtn.style.opacity = '';
          copyClientBtn.style.cursor = 'pointer';
          copyClientBtn.onclick = () => {
            App.utils.copyToClipboard(clientWebinarLink);
            App.utils.showToast('🎙️ Enlace exclusivo de Webinario para Clientes copiado al portapapeles', 'success');
          };
        }
      }

      // Manual Add Client button is rendered statically in app.html
      // (#agent-dash-add-client-btn) so it is always available even if data loading fails.

      // Referral Link Logo & Brand Customizer (Colaboradores)
      const agentDashBranding = document.getElementById('agent-dash-referral-branding');
      if (agentDashBranding) {
        const activeUser = freshMe || currentUser;
        const canBrand = App.referralBranding && App.referralBranding.canUse(activeUser);
        agentDashBranding.style.display = canBrand ? 'block' : 'none';
        if (canBrand) {
          App.referralBranding.renderEditor(agentDashBranding, activeUser, { compact: true });
        }
      }

      // Marketing Lab Quick Access (RE/MAX Inmomás Agents & Collaborators)
      const agentDashGuide = document.getElementById('agent-dash-buyer-guide');
      if (agentDashGuide && App.marketingLab) {
        const activeUser = freshMe || currentUser;
        App.marketingLab.renderQuickCard(agentDashGuide, activeUser, { route: `${activeUser.role}/marketing` });
      }

    } catch (err) {
      console.error('[Agent] initDashboard error:', err);
      App.utils.showToast('Error loading dashboard.', 'error');
    }
  }

  /* ============================================
     renderRecentWebinars()
     Populates #agent-dash-webinar-body with top 3
     ============================================ */
  async function renderRecentWebinars() {
    const tbody = document.getElementById('agent-dash-webinar-body');
    if (!tbody || !currentUser) return;

    try {
      const allRegs = await App.auth.getWebinarRegistrations();
      const linkedRegs = allRegs.filter(r => {
        if (r.agentReferrerId === currentUser.id) return true;
        if (r.referralCode && currentUser.referralCode && r.referralCode.toUpperCase() === currentUser.referralCode.toUpperCase()) return true;
        if (r.howHeard === 'agent' && r.referrerName) {
          const agentFullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.toLowerCase();
          const refName = r.referrerName.toLowerCase();
          if (refName.includes(agentFullName) || agentFullName.includes(refName)) return true;
          const parts = refName.split('/').map(p => p.trim());
          for (const p of parts) {
            if (agentFullName.includes(p) || p.includes(agentFullName)) return true;
          }
        }
        return false;
      });

      if (linkedRegs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1rem;"><span class="lang-en">No registrations yet.</span><span class="lang-es">Aún no hay registros.</span></td></tr>`;
        return;
      }

      // Show top 3 recent
      const recent = linkedRegs.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)).slice(0, 3);
      tbody.innerHTML = recent.map(r => {
        const date = App.utils.formatDate(r.createdAt);
        const source = r.referralCode 
          ? `<span class="badge badge--approved" style="background:#d1fae5; color:#065f46; font-size:0.75rem; border-radius:12px; padding:2px 8px;">🔗 Link</span>`
          : `<span class="badge badge--pending" style="background:#fef3c7; color:#92400e; font-size:0.75rem; border-radius:12px; padding:2px 8px;">👤 Dropdown</span>`;
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem; color: var(--text-secondary);">${date}</td>
            <td style="padding: 10px; border-bottom: 1px solid var(--border-light); font-size: 0.88rem; font-weight: 600;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</td>
            <td style="padding: 10px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${App.utils.escapeHtml(r.email)}</td>
            <td style="padding: 10px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${source}</td>
          </tr>`;
      }).join('');
    } catch (err) {
      console.error('[Agent] renderRecentWebinars error:', err);
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ef4444; padding: 1rem;">Error</td></tr>';
    }
  }

  /* ============================================
     initWebinar()
     Populates #view-agent-webinar with registrations.
     ============================================ */
  async function initWebinar() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;
    const regSel = document.getElementById('agent-webinar-filter-region');
    if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
      regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
    }
    await renderWebinarRegistrations();
  }

  /* ============================================
     initPartners()
     Populates #view-agent-partners with registered brokers.
     ============================================ */
  async function initPartners() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;
    const regSel = document.getElementById('agent-partners-filter-region');
    if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
      regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
    }
    await renderPartners();
  }

  /* ── Partners (Embajadores, Brokers, Realtors, Colaboradores) linked to an Inmomás agent ── */
  function getLinkedPartners(allUsers, me, lookupMaps) {
    if (!me) return [];
    const maps = lookupMaps || (App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null);
    const agentFullLower = `${me.firstName || ''} ${me.lastName || ''}`.trim().toLowerCase();
    return allUsers.filter(u => {
      if (!['embajador', 'broker', 'realtor', 'colaborador'].includes(u.role)) return false;

      if (App.utils && App.utils.resolveAssignedInmomasAgent) {
        const res = App.utils.resolveAssignedInmomasAgent(u, allUsers, maps);
        if (res.id === me.id || (res.name && res.name.toLowerCase() === agentFullLower)) {
          return true;
        }
      }
      if (u.referredBy && u.referredBy === me.id) return true;
      if (u.referredBy && me.referralCode && u.referredBy.toUpperCase() === me.referralCode.toUpperCase()) return true;
      if (u.referredBy && me.email && u.referredBy.toLowerCase() === me.email.toLowerCase()) return true;
      if (u.source && me.email && u.source.toLowerCase() === me.email.toLowerCase()) return true;

      return false;
    });
  }

  async function renderPartners() {
    const tbody = document.getElementById('agent-partners-table-body');
    if (!tbody) return;

    try {
      const allUsers = await App.auth.getAllUsers();
      const freshCurrentUser = allUsers.find(u => u.id === currentUser.id) || currentUser;
      const regFilter = document.getElementById('agent-partners-filter-region')?.value || '';
      const searchQ = (document.getElementById('agent-partners-search')?.value || '').toLowerCase().trim();
      
      // Filter embajadores/brokers/realtors/colaboradores linked to this RE/MAX Inmomás agent
      const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
      let linkedPartners = getLinkedPartners(allUsers, freshCurrentUser, lookupMaps);

      if (regFilter && App.utils && App.utils.getUserRegions) {
        linkedPartners = linkedPartners.filter(p => App.utils.getUserRegions(p).includes(regFilter));
      }

      if (searchQ) {
        linkedPartners = linkedPartners.filter(p => {
          const pool = `${p.firstName || ''} ${p.lastName || ''} ${p.email || ''} ${p.agencyName || ''} ${p.country || ''}`.toLowerCase();
          return pool.includes(searchQ);
        });
      }

      cachedPartners = linkedPartners;

      if (linkedPartners.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              <span class="lang-en">No partners match your filters.</span>
              <span class="lang-es">No hay partners que coincidan con tus filtros.</span>
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = linkedPartners.map(p => {
        const date = App.utils.formatDate(p.createdAt);
        const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(p.status)}">${App.utils.getStatusLabel(p.status)}</span>`;
        const roleLabel = p.role === 'embajador' ? '👑 Embajador' : (p.role === 'broker' ? '🏢 Broker' : (p.role === 'colaborador' ? '🤝 Colaborador' : '🏠 Realtor'));
        const regBadge = App.utils.getUserRegionBadgesHtml ? App.utils.getUserRegionBadgesHtml(p) : '';
        const parents = App.utils.resolveUserUmbrellaParents ? App.utils.resolveUserUmbrellaParents(p, allUsers, lookupMaps) : {};
        const chainBits = [];
        if (parents.embajador && parents.embajador.id !== p.id) {
          chainBits.push(`<span class="umbrella-chain-pill umbrella-chain-pill--embajador">👑 ${App.utils.escapeHtml(parents.embajador.firstName || '')} ${App.utils.escapeHtml(parents.embajador.lastName || '')}</span>`);
        }
        if (parents.broker && parents.broker.id !== p.id) {
          chainBits.push(`<span class="umbrella-chain-pill umbrella-chain-pill--broker">🏢 ${App.utils.escapeHtml(parents.broker.agencyName || `${parents.broker.firstName || ''} ${parents.broker.lastName || ''}`.trim())}</span>`);
        }
        const chainHtml = chainBits.length > 0 ? `<div class="umbrella-chain-pills" style="margin-top:4px;">${chainBits.join('<span style="color:#94a3b8;font-size:0.7rem;">➔</span>')}</div>` : '';
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem; color: var(--text-secondary);">${date}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.88rem; font-weight: 600;">${App.utils.escapeHtml(p.firstName)} ${App.utils.escapeHtml(p.lastName)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${roleLabel}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.82rem;">
              <div>${regBadge}</div>
              <small style="color:#64748b;">🏳️ ${App.utils.escapeHtml(p.country || '—')}</small>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${App.utils.escapeHtml(p.email)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">
              <div>${App.utils.escapeHtml(p.agencyName || '—')}</div>
              ${chainHtml}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${statusBadge}</td>
          </tr>`;
      }).join('');
    } catch (err) {
      console.error('[Agent] renderPartners error:', err);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 1rem;">Error loading partners.</td></tr>';
    }
  }

  /* ── Render Webinar Registrations Linked to Agent ── */
  async function renderWebinarRegistrations() {
    const tbody = document.getElementById('agent-webinar-table-body');
    if (!tbody) return;

    try {
      const allRegs = await App.auth.getWebinarRegistrations();
      const allUsers = await App.auth.getAllUsers();
      const freshCurrentUser = allUsers.find(u => u.id === currentUser.id) || currentUser;

      const typeFilter = document.getElementById('agent-webinar-filter-type')?.value || 'all';
      const regFilter = document.getElementById('agent-webinar-filter-region')?.value || '';
      const searchQ = (document.getElementById('agent-webinar-search')?.value || '').toLowerCase().trim();

      let linkedRegs = allRegs.filter(r => {
        if (r.agentReferrerId === freshCurrentUser.id) return true;
        if (r.referralCode && freshCurrentUser.referralCode && r.referralCode.toUpperCase() === freshCurrentUser.referralCode.toUpperCase()) return true;
        if (r.howHeard === 'agent' && r.referrerName) {
          const agentFullName = `${freshCurrentUser.firstName || ''} ${freshCurrentUser.lastName || ''}`.toLowerCase();
          const refName = r.referrerName.toLowerCase();
          if (refName.includes(agentFullName) || agentFullName.includes(refName)) return true;
          const parts = refName.split('/').map(p => p.trim());
          for (const p of parts) {
            if (agentFullName.includes(p) || p.includes(agentFullName)) return true;
          }
        }
        return false;
      });

      if (typeFilter === 'b2b') linkedRegs = linkedRegs.filter(r => isRegB2B(r));
      else if (typeFilter === 'b2c') linkedRegs = linkedRegs.filter(r => !isRegB2B(r));

      if (regFilter && App.utils && App.utils.getRecordRegion) {
        linkedRegs = linkedRegs.filter(r => App.utils.getRecordRegion(r, allUsers) === regFilter);
      }

      if (searchQ) {
        linkedRegs = linkedRegs.filter(r => {
          const pool = `${r.firstName || ''} ${r.lastName || ''} ${r.email || ''} ${r.agency || ''} ${r.country || ''}`.toLowerCase();
          return pool.includes(searchQ);
        });
      }

      cachedWebinarRegs = linkedRegs;

      if (linkedRegs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              <span class="lang-en">No webinar registrations match your filters.</span>
              <span class="lang-es">No hay registros al webinar con los filtros seleccionados.</span>
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = linkedRegs.map(r => {
        const date = App.utils.formatDate(r.createdAt);
        const b2b = isRegB2B(r);
        const typeBadge = b2b
          ? `<span style="background:rgba(0,63,153,0.1);color:#003f99;padding:2px 8px;border-radius:12px;font-size:0.73rem;font-weight:700;">🏢 B2B</span>`
          : `<span style="background:rgba(16,185,129,0.1);color:#059669;padding:2px 8px;border-radius:12px;font-size:0.73rem;font-weight:700;">🏡 B2C</span>`;
        const recReg = App.utils.getRecordRegion ? App.utils.getRecordRegion(r, allUsers) : '';
        const regBadge = App.utils.getRegionBadge ? App.utils.getRegionBadge(recReg, true) : '';
        const source = r.referralCode 
          ? `<span class="badge badge--approved" style="background:#d1fae5; color:#065f46; font-size:0.75rem; border-radius:12px; padding:2px 8px;">🔗 Link</span>`
          : `<span class="badge badge--pending" style="background:#fef3c7; color:#92400e; font-size:0.75rem; border-radius:12px; padding:2px 8px;">👤 Dropdown</span>`;
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem; color: var(--text-secondary);">${date}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${typeBadge}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.88rem; font-weight: 600;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.82rem;">
              <div>${regBadge}</div>
              <small style="color:#64748b;">🏳️ ${App.utils.escapeHtml(r.country || '—')}</small>
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${App.utils.escapeHtml(r.email)}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${App.utils.escapeHtml(r.agency || r.clientInterest || '—')}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">${source}</td>
          </tr>`;
      }).join('');
    } catch (err) {
      console.error('[Agent] renderWebinarRegistrations error:', err);
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 1rem;">Error loading registrations.</td></tr>';
    }
  }

  /* ── Mini Pipeline Summary ── */
  function renderMiniPipeline(clients) {
    const container = document.getElementById('agent-dash-pipeline');
    if (!container) return;

    const total = clients.length || 1;

    const bars = App.utils.PIPELINE_COLUMNS.map(col => {
      const count = clients.filter(c => col.statuses.includes(c.status)).length;
      const pct = Math.round((count / total) * 100);
      const color = App.utils.columnColors[col.key];

      return `
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;">
            <span style="color: var(--text-secondary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${col.label}</span>
            <span style="font-weight: 600; color: ${color};">${count}</span>
          </div>
          <div style="height: 8px; background: var(--border-subtle); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div style="display: flex; gap: 0.75rem; flex-direction: column;">${bars}</div>`;
  }

  /* ── Recent Clients Activity ── */
  function renderRecentClients(clients) {
    const container = document.getElementById('agent-dash-recent');
    if (!container) return;

    const recent = [...clients]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recent.length === 0) {
      App.utils.showEmptyState('agent-dash-recent', 'No clients assigned to you yet.', '🤝');
      return;
    }

    container.innerHTML = recent.map(c => {
      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>`;
      return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-subtle); transition: background 0.2s; cursor: pointer;" onclick="App.views.agentInmomas.showClientDetail('${c.id}')">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; flex-shrink: 0;">
            ${c.firstName.charAt(0)}${c.lastName.charAt(0)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px;">${App.utils.escapeHtml(c.firstName)} ${App.utils.escapeHtml(c.lastName)}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              📍 ${App.utils.escapeHtml(c.interestArea || '—')} · Budget: ${App.utils.escapeHtml(c.budget || '—')}
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
  }

  /* ============================================
     initClients()
     Populates #view-agent-clients with an
     interactive, draggable Kanban pipeline board.
     ============================================ */
  async function initClients() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const regSel = document.getElementById('agent-client-filter-region');
      if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml && regSel.options.length <= 1) {
        regSel.innerHTML = App.utils.getRegionFilterOptionsHtml('');
      }

      const clientFilter = currentUser.role === 'colaborador' ? { referredBy: currentUser.id } : { localAgentId: currentUser.id };
      agentClients = await App.auth.getClients(clientFilter);
      allUsers = await App.auth.getAllUsers();

      filterClients();
    } catch (err) {
      console.error('[Agent] initClients error:', err);
      App.utils.showToast('Error loading client pipeline.', 'error');
    }
  }

  function filterClients() {
    const regVal = document.getElementById('agent-client-filter-region')?.value || '';
    const searchVal = (document.getElementById('agent-client-search')?.value || '').toLowerCase().trim();

    let display = [...agentClients];
    if (regVal && App.utils && App.utils.getRecordRegion) {
      display = display.filter(c => App.utils.getRecordRegion(c, allUsers) === regVal);
    }
    if (searchVal) {
      display = display.filter(c => {
        const pool = `${c.firstName || ''} ${c.lastName || ''} ${c.email || ''} ${c.country || ''} ${c.currentLocation || ''} ${c.interestArea || ''}`.toLowerCase();
        return pool.includes(searchVal);
      });
    }

    const getRealtorName = (realtorId) => {
      const realtor = allUsers.find(u => u.id === realtorId);
      return realtor ? `${realtor.firstName} ${realtor.lastName}` : 'Unknown';
    };

    App.utils.renderKanbanBoard(
      'agent-pipeline-board',
      display,
      'App.views.agentInmomas.showClientDetail',
      getRealtorName,
      'App.views.agentInmomas.handleClientDrop',
      { users: allUsers, showUmbrellaSubBadge: true }
    );
  }

  function exportPartnersToExcel() {
    if (!cachedPartners || cachedPartners.length === 0) {
      App.utils.showToast('No partners to export.', 'error');
      return;
    }
    const headers = ['Date', 'First Name', 'Last Name', 'Role', 'Region', 'Country', 'Email', 'Agency', 'Status'];
    const rows = cachedPartners.map(p => {
      const regs = App.utils.getUserRegions ? App.utils.getUserRegions(p).map(r => App.utils.REGIONS[r]?.shortEs || r).join(', ') : '';
      return [
        p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US') : '',
        p.firstName || '', p.lastName || '', p.role || '', regs, p.country || '', p.email || '', p.agencyName || '', p.status || ''
      ];
    });
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Partners');
      XLSX.writeFile(wb, `My-Partners-Export-${new Date().toISOString().slice(0,10)}.xlsx`);
      App.utils.showToast(`✅ Exportados ${cachedPartners.length} partners a Excel.`, 'success');
      return;
    }
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `My-Partners-Export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  function exportWebinarToExcel() {
    if (!cachedWebinarRegs || cachedWebinarRegs.length === 0) {
      App.utils.showToast('No registrations to export.', 'error');
      return;
    }
    const headers = ['Date', 'Type', 'First Name', 'Last Name', 'Region', 'Country', 'Email', 'Phone', 'Agency / Goal'];
    const rows = cachedWebinarRegs.map(r => {
      const rId = App.utils.getRecordRegion ? App.utils.getRecordRegion(r, allUsers) : '';
      const rLabel = (rId && App.utils.REGIONS[rId]) ? App.utils.REGIONS[rId].shortEs : '';
      return [
        r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
        isRegB2B(r) ? 'B2B' : 'B2C',
        r.firstName || '', r.lastName || '', rLabel, r.country || '', r.email || '', r.phone || '', r.agency || r.clientInterest || ''
      ];
    });
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Webinar');
      XLSX.writeFile(wb, `My-Webinar-Export-${new Date().toISOString().slice(0,10)}.xlsx`);
      App.utils.showToast(`✅ Exportados ${cachedWebinarRegs.length} inscritos a Excel.`, 'success');
      return;
    }
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `My-Webinar-Export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  async function handleClientDrop(clientId, newStatus) {
    try {
      await App.auth.updateClientStatus(clientId, newStatus, 'Moved by Agente Inmomás');
      initClients(); // Refresh board
      App.utils.showToast(`Client moved to ${App.utils.getStatusLabel(newStatus)}`, 'success');
    } catch (err) {
      console.error('Drop error:', err);
      App.utils.showToast(err.message, 'error');
    }
  }

  /* ── Client Detail Modal ── */
  async function showClientDetail(clientId) {
    try {
      // Find client in either list
      let client = agentClients.find(c => c.id === clientId);
      if (!client) {
        // Fallback fetch
        const allC = await App.auth.getClients();
        client = allC.find(c => c.id === clientId);
      }

      if (!client) {
        App.utils.showToast('Client not found.', 'error');
        return;
      }

      // Find referring realtor
      const realtor = allUsers.find(u => u.id === client.referredBy);
      const realtorName = realtor ? `${realtor.firstName} ${realtor.lastName}` : '—';
      const realtorAgency = realtor ? (realtor.agencyName || '—') : '—';

      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(client.status)}">${App.utils.getStatusLabel(client.status)}</span>`;

      // Status history timeline
      const timeline = (client.statusHistory || []).map(entry => `
        <div style="display: flex; gap: 0.75rem; padding: 0.5rem 0; border-left: 2px solid #0043ff; padding-left: 1rem; margin-left: 0.5rem;">
          <div>
            <div style="font-weight: 500; font-size: 0.85rem;">
              <span class="badge ${App.utils.getStatusBadgeClass(entry.status)}">${App.utils.getStatusLabel(entry.status)}</span>
            </div>
            <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;">
              ${App.utils.formatDate(entry.date)}${entry.note ? ' — ' + App.utils.escapeHtml(entry.note) : ''}
            </div>
          </div>
        </div>
      `).join('');

      App.utils.showModal({
        title: 'Client Details (Assigned to you)',
        body: `
          <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
            <div>
              <h3 style="margin: 0 0 0.25rem;">${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}</h3>
              <div style="margin-bottom: 0.5rem;">${statusBadge}</div>
            </div>
            <div>
              ${(App.utils && App.utils.renderClientOriginTagBadge) ? App.utils.renderClientOriginTagBadge(client, allUsers, { showUmbrellaSubBadge: true }) : ''}
            </div>
          </div>

          ${currentUser && currentUser.role === 'colaborador' ? `
          <div style="background: rgba(91, 33, 182, 0.05); border: 1px solid rgba(91, 33, 182, 0.15); padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; color: #4c1d95;">
            🤝 <strong>Acuerdo de Colaborador (10% a éxito):</strong> Tus honorarios por referido equivalen al <strong>10%</strong> de la comisión bruta del lado comprador efectivamente cobrada tras el cierre ante Notario.
          </div>
          ` : `
          <!-- Financial Settings -->
          <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px; font-size: 0.9rem; color: #059669; text-transform: uppercase; font-weight: 600;">💰 Financial Settings (Configuración Financiera)</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;">
              <div>
                <label style="font-size: 0.75rem; color: #374151; font-weight: 600; display: block; margin-bottom: 4px;">Sale Price (€)</label>
                <input type="number" id="financial-sale-price" class="form-input" style="margin-bottom: 0; padding: 6px 8px; font-size: 0.85rem;" value="${client.salePrice || 0}">
              </div>
              <div>
                <label style="font-size: 0.75rem; color: #374151; font-weight: 600; display: block; margin-bottom: 4px;">Agency Fee %</label>
                <input type="number" id="financial-fee-pct" class="form-input" style="margin-bottom: 0; padding: 6px 8px; font-size: 0.85rem;" value="${client.agencyFeePct || 5}">
              </div>
              <div>
                <label style="font-size: 0.75rem; color: #374151; font-weight: 600; display: block; margin-bottom: 4px;">Referral Share %</label>
                <input type="number" id="financial-referral-pct" class="form-input" style="margin-bottom: 0; padding: 6px 8px; font-size: 0.85rem;" value="${client.referralSharePct !== undefined ? client.referralSharePct : ((App.utils && App.utils.getDefaultReferralSharePct) ? App.utils.getDefaultReferralSharePct(client, allUsers) : 25)}">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.views.agentInmomas.handleSaveFinancials('${client.id}')" style="background: #059669; border-color: #059669; width: 100%;">
              💾 <span class="lang-en">Save Financials</span><span class="lang-es">Guardar</span>
            </button>
          </div>

          <div style="background: white; border-radius: 0.5rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-top: 1rem; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 1rem; font-size: 0.9rem; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem;">🤝 Partner Access</h4>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #4b5563; cursor: pointer;">
                <input type="checkbox" id="partner-uci-${client.id}" style="-webkit-appearance: checkbox !important; appearance: checkbox !important; transform: scale(1.2); margin-right: 4px;" ${client.needsUCI ? 'checked' : ''}>
                Require UCI Services
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #4b5563; cursor: pointer;">
                <input type="checkbox" id="partner-fuster-${client.id}" style="-webkit-appearance: checkbox !important; appearance: checkbox !important; transform: scale(1.2); margin-right: 4px;" ${client.needsFuster ? 'checked' : ''}>
                Require Fuster Services
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #4b5563; cursor: pointer;">
                <input type="checkbox" id="partner-holidays-${client.id}" style="-webkit-appearance: checkbox !important; appearance: checkbox !important; transform: scale(1.2); margin-right: 4px;" ${client.needsHolidays ? 'checked' : ''}>
                Require Inmomás Holidays
              </label>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.views.agentInmomas.handleSavePartnerFlags('${client.id}')" style="background: #3b82f6; border-color: #3b82f6; width: 100%; margin-top: 1rem;">
              💾 Save Partners
            </button>
          </div>
          `}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem; margin-bottom: 1.5rem;">
            <div>
              <div style="font-weight: 600; color: #374151;">Email</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(client.email)}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Phone</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(client.phone || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Referred By (Foreign Realtor)</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(realtorName)} (${App.utils.escapeHtml(realtorAgency)})</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Interest Area</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(client.interestArea || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Budget</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(client.budget || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Timeline</div>
              <div style="color: #6b7280;">⏱ ${App.utils.escapeHtml(client.timeline || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Objective</div>
              <div style="color: #6b7280;">🎯 ${App.utils.escapeHtml(client.objective || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Registered</div>
              <div style="color: #6b7280;">${App.utils.formatDate(client.createdAt)}</div>
            </div>
          </div>
          ${client.notes ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; color: #374151; margin-bottom: 1.5rem;">📝 ${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151;">Status Timeline</h4>
          ${timeline || '<p style="color: #6b7280;">No history available.</p>'}
        `,
        footer: `<button class="btn btn-sm" onclick="App.utils.confirmDeleteClient('${client.id}', '${client.firstName} ${client.lastName}', () => App.views.agentInmomas.initDashboard())" style="background: #ef4444; color: white; border: none;">🗑️ Delete</button>
          <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
      });

    } catch (err) {
      console.error('[Agent] showClientDetail error:', err);
      App.utils.showToast('Error loading details.', 'error');
    }
  }

  async function handleSaveFinancials(clientId) {
    try {
      const salePrice = document.getElementById('financial-sale-price').value;
      const agencyFeePct = document.getElementById('financial-fee-pct').value;
      const referralSharePct = document.getElementById('financial-referral-pct').value;
      
      await App.auth.saveClientFinancials(clientId, salePrice, agencyFeePct, referralSharePct);
      App.utils.showToast('Financial settings saved successfully!', 'success');
      App.utils.closeModal();
      initClients(); // reload
    } catch (err) {
      console.error('[Agent] handleSaveFinancials error:', err);
      App.utils.showToast('Error saving financials.', 'error');
    }
  }

  async function handleSavePartnerFlags(clientId) {
    const needsUCI = document.getElementById(`partner-uci-${clientId}`)?.checked || false;
    const needsFuster = document.getElementById(`partner-fuster-${clientId}`)?.checked || false;
    const needsHolidays = document.getElementById(`partner-holidays-${clientId}`)?.checked || false;
    
    try {
      await App.auth.updateClientPartnerFlags(clientId, { needsUCI, needsFuster, needsHolidays });
      App.utils.showToast('Partner requirements saved!', 'success');
      showClientDetail(clientId); // Refresh detail
    } catch (err) {
      console.error('[Agent] handleSavePartnerFlags error:', err);
      App.utils.showToast('Error saving partner flags.', 'error');
    }
  }

  /* ============================================
     initFinances()
     Populates #view-agent-finances with metrics
     and detailed commission history.
     ============================================ */
  async function initFinances() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const isColaborador = currentUser.role === 'colaborador';
      agentCommissions = await App.auth.getCommissions(isColaborador ? { realtorId: currentUser.id } : { agentId: currentUser.id });

      // Calculate summary metrics
      const getAmt = (c) => isColaborador ? (c.realtorAmount || 0) : (c.agentAmount || 0);
      const totalEarned = agentCommissions.reduce((sum, c) => sum + getAmt(c), 0);
      const paidEarned = agentCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + getAmt(c), 0);
      const pendingEarned = agentCommissions.filter(c => c.status === 'pending_payment' || c.status === 'projected')
                                            .reduce((sum, c) => sum + getAmt(c), 0);

      // Update summary cards
      setTextById('agent-fin-total', App.utils.formatCurrency(totalEarned));
      setTextById('agent-fin-paid', App.utils.formatCurrency(paidEarned));
      setTextById('agent-fin-pending', App.utils.formatCurrency(pendingEarned));

      // Render commission history table
      renderCommissionTable(agentCommissions);

    } catch (err) {
      console.error('[Agent] initFinances error:', err);
      App.utils.showToast('Error loading finances.', 'error');
    }
  }

  /* ── Detailed Commission History Table ── */
  function renderCommissionTable(commissions) {
    const tbody = document.getElementById('agent-commission-table-body');
    if (!tbody) return;

    if (commissions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem;">
            <div class="empty-state">
              <div class="empty-state__icon">💰</div>
              <p class="empty-state__text">No commissions recorded yet.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const isColaborador = currentUser && currentUser.role === 'colaborador';
    tbody.innerHTML = commissions.map(c => {
      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>`;

      if (isColaborador) {
        const colPct = c.realtorSharePct || 10;
        const colAmt = c.realtorAmount !== undefined ? c.realtorAmount : ((c.totalCommission || 0) * (colPct / 100));
        return `
          <tr>
            <td style="font-weight: 500;">${App.utils.escapeHtml(c.clientName)}</td>
            <td style="font-size: 0.85rem;">${App.utils.escapeHtml(c.propertyAddress || '—')}</td>
            <td>${App.utils.formatCurrency(c.salePrice)}</td>
            <td>${App.utils.formatCurrency(c.totalCommission)}</td>
            <td style="text-align: center;">${colPct}%</td>
            <td style="font-weight: 600; color: #10b981;">${App.utils.formatCurrency(colAmt)}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      }

      // Spain share is the remaining commission
      const spainCommAmount = c.totalCommission - (c.realtorAmount || 0);

      return `
        <tr>
          <td style="font-weight: 500;">${App.utils.escapeHtml(c.clientName)}</td>
          <td style="font-size: 0.85rem;">${App.utils.escapeHtml(c.propertyAddress || '—')}</td>
          <td>${App.utils.formatCurrency(c.salePrice)}</td>
          <td>${App.utils.formatCurrency(spainCommAmount)}</td>
          <td style="text-align: center;">${c.agentSharePct || 75}%</td>
          <td style="font-weight: 600; color: #10b981;">${App.utils.formatCurrency(c.agentAmount)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  /* ── Add Client Manually Modal ── */
  function showAddClientModal() {
    App.utils.showModal({
      title: '➕ Registrar Cliente Manualmente / Register Client Manually',
      body: `
        <form id="manual-client-form" style="display: grid; gap: 1rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">First Name / Nombre *</label>
              <input type="text" id="mc-firstName" class="form-input" placeholder="John" required style="margin-bottom: 0;">
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Last Name / Apellido *</label>
              <input type="text" id="mc-lastName" class="form-input" placeholder="Smith" required style="margin-bottom: 0;">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Email *</label>
              <input type="email" id="mc-email" class="form-input" placeholder="john@example.com" required style="margin-bottom: 0;">
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Phone / Teléfono</label>
              <input type="tel" id="mc-phone" class="form-input" placeholder="+1 555 123 4567" style="margin-bottom: 0;">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Country</label>
              <input type="text" id="mc-country" class="form-input" placeholder="United States" style="margin-bottom: 0;">
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Budget</label>
              <select id="mc-budget" class="form-input" style="margin-bottom: 0;">
                <option value="">Select budget range</option>
                <option value="< €150,000">< €150,000</option>
                <option value="€150,000 - €250,000">€150,000 - €250,000</option>
                <option value="€250,000 - €400,000">€250,000 - €400,000</option>
                <option value="€400,000 - €600,000">€400,000 - €600,000</option>
                <option value="> €600,000">> €600,000</option>
              </select>
            </div>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Interest Area in Spain</label>
            <select id="mc-interestArea" class="form-input" style="margin-bottom: 0;">
              <option value="">Select area / Seleccionar zona</option>
              <option value="Costa Blanca (Alicante, Valencia)">Costa Blanca (Alicante, Valencia)</option>
              <option value="Resto de España">Resto de España / Rest of Spain</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Timeline / Plazo</label>
              <select id="mc-timeline" class="form-input" style="margin-bottom: 0;">
                <option value="">Select timeline / Seleccionar plazo</option>
                <option value="0 a 6 meses">0 a 6 meses / 0 to 6 months</option>
                <option value="6 a 12 meses">6 a 12 meses / 6 to 12 months</option>
                <option value="+12 meses">+12 meses / +12 months</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Objective / Objetivo</label>
              <select id="mc-objective" class="form-input" style="margin-bottom: 0;">
                <option value="">Select objective</option>
                <option value="Mudarse a España">Mudarse a España</option>
                <option value="Invertir en España">Invertir en España</option>
                <option value="Tener casa vacacional en España">Tener casa vacacional en España</option>
                <option value="Retirarse en España">Retirarse en España</option>
              </select>
            </div>
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Notes</label>
            <textarea id="mc-notes" class="form-input" rows="3" placeholder="Additional notes about this client..." style="margin-bottom: 0; resize: vertical;"></textarea>
          </div>
          <div style="padding: 1rem; background: #f3f4f6; border-radius: 0.375rem;">
            <label style="font-size: 0.85rem; font-weight: 600; color: #374151; display: block; margin-bottom: 8px;">Partner Services Required</label>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #4b5563; cursor: pointer;">
                <input type="checkbox" id="mc-partner-uci"> UCI
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #4b5563; cursor: pointer;">
                <input type="checkbox" id="mc-partner-fuster"> Fuster
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #4b5563; cursor: pointer;">
                <input type="checkbox" id="mc-partner-holidays"> Inmomás Holidays
              </label>
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Cancelar / Cancel</button>
        <button type="button" id="mc-save-btn" class="btn btn-primary btn-sm" onclick="App.views.agentInmomas.handleAddClient()" style="margin-left: 0.5rem;">Guardar Cliente / Save Client</button>
      `
    });
  }

  async function handleAddClient() {
    const firstName = document.getElementById('mc-firstName')?.value.trim();
    const lastName = document.getElementById('mc-lastName')?.value.trim();
    const email = document.getElementById('mc-email')?.value.trim();
    const phone = document.getElementById('mc-phone')?.value.trim();
    const timeline = document.getElementById('mc-timeline')?.value;
    const objective = document.getElementById('mc-objective')?.value;

    if (!firstName || !lastName || !email) {
      App.utils.showToast('Completa los campos obligatorios: Nombre, Apellido y Email. / Please fill in First Name, Last Name and Email.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      App.utils.showToast('El email no es válido. / Invalid email address.', 'error');
      return;
    }

    const saveBtn = document.getElementById('mc-save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.style.opacity = '0.6'; }

    try {
      await App.auth.addClientManually({
        firstName,
        lastName,
        email,
        phone,
        country: document.getElementById('mc-country')?.value.trim() || '',
        budget: document.getElementById('mc-budget')?.value || '',
        interestArea: document.getElementById('mc-interestArea')?.value || '',
        timeline,
        objective,
        notes: document.getElementById('mc-notes')?.value.trim() || '',
        needsUCI: document.getElementById('mc-partner-uci')?.checked || false,
        needsFuster: document.getElementById('mc-partner-fuster')?.checked || false,
        needsHolidays: document.getElementById('mc-partner-holidays')?.checked || false
      });

      App.utils.closeModal();
      App.utils.showToast('✅ Cliente registrado correctamente / Client registered successfully! 🎉', 'success');
      const route = (App.router && App.router.getCurrentRoute) ? App.router.getCurrentRoute() : '';
      if (route && route.endsWith('/clients')) {
        initClients();
      } else {
        initDashboard();
      }
    } catch (err) {
      console.error('[Agent] handleAddClient error:', err);
      App.utils.showToast('Error al registrar el cliente / Error adding client: ' + err.message, 'error');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = ''; }
    }
  }

  /* ── Agent Inmomás Documents (#agent_inmomas/documents) ──
     • Collaboration agreement models (templates) for every partner type
     • Documents (agreements + fiscal data status) of the partners registered under this agent */
  let docsPartners = [];
  let docsAllUsers = [];

  const AGREEMENT_TEMPLATES = [
    { role: 'embajador',      icon: '👑', color: '#92400e', bg: '#fffbeb', en: 'Ambassador Umbrella Agreement', es: 'Acuerdo de Embajador y Red Paraguas', fee: '25% + 15%' },
    { role: 'broker',         icon: '🏢', color: '#1e40af', bg: '#eff6ff', en: 'Broker / Agency Master Agreement', es: 'Acuerdo Marco de Agencia / Broker', fee: '25%' },
    { role: 'realtor_direct', icon: '🏠', color: '#047857', bg: '#ecfdf5', en: 'Direct Realtor Agreement', es: 'Acuerdo de Agente / Realtor Directo', fee: '15%' },
    { role: 'realtor_broker', icon: '🏘️', color: '#0f766e', bg: '#f0fdfa', en: 'Realtor via Agency Agreement', es: 'Acuerdo de Agente vía Agencia', fee: '25%' },
    { role: 'colaborador',    icon: '🤝', color: '#5b21b6', bg: '#f5f3ff', en: 'Strategic Collaborator Agreement', es: 'Acuerdo de Colaborador Estratégico', fee: '10%' }
  ];

  async function initAgentDocuments() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;
    const esc = App.utils.escapeHtml;

    // 1. Agreement models
    const tplContainer = document.getElementById('agent-docs-templates');
    if (tplContainer) {
      tplContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem;">
          ${AGREEMENT_TEMPLATES.map(t => `
            <div class="glass-card" style="padding:1.1rem; border-left:4px solid ${t.color};">
              <div style="font-size:1.4rem;">${t.icon}</div>
              <div style="font-weight:700; font-size:0.95rem; margin:4px 0 2px; color:${t.color};">
                <span class="lang-en">${t.en}</span><span class="lang-es">${t.es}</span>
              </div>
              <div style="font-size:0.78rem; color:#6b7280; margin-bottom:0.85rem;">
                <span class="lang-en">Model / template</span><span class="lang-es">Modelo / plantilla</span> · ${t.fee}
              </div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm" style="flex:1; background:${t.bg}; color:${t.color}; border:1px solid ${t.color}; font-weight:700;" onclick="App.views.agentInmomas.previewAgreementTemplate('${t.role}')">
                  👁️ <span class="lang-en">View</span><span class="lang-es">Ver</span>
                </button>
                <button type="button" class="btn btn-outline btn-sm" style="flex:1;" onclick="App.views.agentInmomas.downloadAgreementTemplate('${t.role}')">
                  ⬇️ .doc
                </button>
              </div>
            </div>`).join('')}
        </div>`;
    }

    // 2. Documents of partners registered under this agent
    const listContainer = document.getElementById('agent-docs-partners');
    if (!listContainer) return;
    listContainer.innerHTML = `<p style="color:#6b7280; font-size:0.85rem;">⏳ <span class="lang-en">Loading...</span><span class="lang-es">Cargando...</span></p>`;

    try {
      docsAllUsers = await App.auth.getAllUsers();
      const me = docsAllUsers.find(u => u.id === currentUser.id) || currentUser;
      docsPartners = getLinkedPartners(docsAllUsers, me);
      renderAgentDocsPartners();
    } catch (err) {
      console.error('[Agent] initAgentDocuments error:', err);
      listContainer.innerHTML = `<p style="color:#ef4444;">Error cargando documentos / Error loading documents.</p>`;
    }
  }

  function renderAgentDocsPartners() {
    const listContainer = document.getElementById('agent-docs-partners');
    if (!listContainer) return;
    const esc = App.utils.escapeHtml;
    const q = (document.getElementById('agent-docs-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('agent-docs-filter-status')?.value || '';

    let list = [...docsPartners];
    if (q) {
      list = list.filter(p => `${p.firstName || ''} ${p.lastName || ''} ${p.email || ''} ${p.agencyName || ''}`.toLowerCase().includes(q));
    }
    if (statusFilter) {
      list = list.filter(p => getAgreementState(p) === statusFilter);
    }

    if (list.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📂</div>
          <p class="empty-state__text">
            <span class="lang-en">No registered partners with documents match your filters.</span>
            <span class="lang-es">No hay registrados a tu nombre que coincidan con los filtros.</span>
          </p>
        </div>`;
      return;
    }

    const roleLabel = (r) => r === 'embajador' ? '👑 Embajador' : r === 'broker' ? '🏢 Broker' : r === 'colaborador' ? '🤝 Colaborador' : '🏠 Realtor';

    listContainer.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;">
        ${list.map(p => {
          const state = getAgreementState(p);
          const badge = state === 'signed'
            ? '<span class="badge badge--approved">Firmado / Signed ✅</span>'
            : state === 'data_submitted'
              ? '<span class="badge badge--pending" style="background:#dbeafe; color:#1e40af;">Datos Enviados 📋</span>'
              : '<span class="badge badge--pending">Pendiente ⚠️</span>';
          const cd = p.contractCompanyData || {};
          const hasFiscal = Boolean(cd.companyLegalName || cd.taxId || cd.fiscalAddress);
          const detail = state === 'signed'
            ? `<span class="lang-en">Signed on</span><span class="lang-es">Firmado el</span>: ${App.utils.formatDate(p.agreementSignedAt)}`
            : state === 'data_submitted'
              ? `<span class="lang-en">Fiscal & bank data submitted — contract in preparation</span><span class="lang-es">Datos fiscales y bancarios enviados — contrato en preparación</span>`
              : `<span class="lang-en">Pending fiscal/bank data or signature</span><span class="lang-es">Pendiente de datos fiscales/bancarios o firma</span>`;
          const safeId = esc(String(p.id)).replace(/'/g, '&#39;');
          return `
            <div class="glass-card" style="padding:1.15rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:0.6rem;">
                <div>
                  <div style="font-weight:700; font-size:0.98rem;">${esc(p.firstName || '')} ${esc(p.lastName || '')}</div>
                  <div style="font-size:0.78rem; color:#6b7280;">${roleLabel(p.role)}${p.agencyName ? ' · ' + esc(p.agencyName) : ''}</div>
                  <div style="font-size:0.75rem; color:#94a3b8;">${esc(p.email || '')}</div>
                </div>
                ${badge}
              </div>
              <div style="font-size:0.8rem; color:#374151; margin-bottom:0.5rem;">${detail}</div>
              <div style="font-size:0.78rem; color:#374151; background:#f8fafc; border:1px solid #e5e7eb; border-radius:8px; padding:8px 10px; margin-bottom:0.75rem;">
                <strong><span class="lang-en">Fiscal data</span><span class="lang-es">Datos fiscales</span>:</strong>
                ${hasFiscal
                  ? `${esc(cd.companyLegalName || '—')}${cd.taxId ? ' · ' + esc(cd.taxId) : ''}${cd.fiscalAddress ? '<br>' + esc(cd.fiscalAddress) : ''}`
                  : '<span style="color:#f59e0b;">—</span>'}
              </div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap; padding-top:0.6rem; border-top:1px solid #e5e7eb;">
                <button type="button" class="btn btn-primary btn-sm" style="flex:1;" onclick="App.views.agentInmomas.previewPartnerAgreement('${safeId}')">
                  👁️ <span class="lang-en">View Agreement</span><span class="lang-es">Ver Acuerdo</span>
                </button>
                <button type="button" class="btn btn-outline btn-sm" style="flex:1;" onclick="App.views.agentInmomas.downloadPartnerAgreement('${safeId}')">
                  ⬇️ .doc
                </button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  function getAgreementState(u) {
    if (u.agreementSigned || u.agreementStatus === 'signed') return 'signed';
    if (u.agreementStatus === 'data_submitted' || u.agreementStatus === 'uploaded') return 'data_submitted';
    return 'pending';
  }

  function resolvePartnerAgreementArgs(partnerId) {
    const p = docsPartners.find(u => String(u.id) === String(partnerId));
    if (!p) return null;
    if (p.role === 'realtor' && p.brokerId) {
      const broker = docsAllUsers.find(u => u.id === p.brokerId);
      const hasOwn = p.contractCompanyData && (p.contractCompanyData.companyLegalName || p.contractCompanyData.taxId);
      return [hasOwn ? p : (broker || p), p];
    }
    return [p, null];
  }

  function ensureGenerator() {
    if (typeof App.generateReferralAgreementDoc !== 'function') {
      App.utils.showToast('Generador de acuerdos no disponible.', 'error');
      return false;
    }
    return true;
  }

  function previewAgreementTemplate(role) {
    if (!ensureGenerator()) return;
    App.generateReferralAgreementDoc({ isTemplate: true, templateRole: role }, null, { preview: true });
  }

  function downloadAgreementTemplate(role) {
    if (!ensureGenerator()) return;
    App.generateReferralAgreementDoc({ isTemplate: true, templateRole: role });
  }

  function previewPartnerAgreement(partnerId) {
    if (!ensureGenerator()) return;
    const args = resolvePartnerAgreementArgs(partnerId);
    if (!args) { App.utils.showToast('Registro no encontrado.', 'error'); return; }
    App.generateReferralAgreementDoc(args[0], args[1], { preview: true });
  }

  function downloadPartnerAgreement(partnerId) {
    if (!ensureGenerator()) return;
    const args = resolvePartnerAgreementArgs(partnerId);
    if (!args) { App.utils.showToast('Registro no encontrado.', 'error'); return; }
    App.generateReferralAgreementDoc(args[0], args[1]);
  }

  /* ── Documents & Collaborator Agreement (#colaborador/documents) ── */
  async function initDocuments() {
    currentUser = App.auth.getCurrentUser();
    if (!currentUser) return;

    const docsGuideEl = document.getElementById('colaborador-docs-buyer-guide');
    if (docsGuideEl) {
      docsGuideEl.style.display = 'none';
    }

    const contractContainer = document.getElementById('colaborador-contract-section');
    if (contractContainer && App.utils && typeof App.utils.renderContractDataSection === 'function') {
      App.utils.renderContractDataSection(contractContainer, currentUser, 'colaborador-contract', () => {
        initDocuments();
      });
    }
  }

  /* ── Utility ── */
  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================
     Public API — register on App.views.agentInmomas
     ============================================ */
  App.views.agentInmomas = {
    initDashboard,
    initClients,
    filterClients,
    initDocuments,
    initAgentDocuments,
    renderAgentDocsPartners,
    previewAgreementTemplate,
    downloadAgreementTemplate,
    previewPartnerAgreement,
    downloadPartnerAgreement,
    initFinances,
    initWebinar,
    renderWebinarRegistrations,
    exportWebinarToExcel,
    initPartners,
    renderPartners,
    exportPartnersToExcel,
    showClientDetail,
    handleClientDrop,
    showAddClientModal,
    handleAddClient,
    handleSaveFinancials,
    handleSavePartnerFlags
  };

})();
