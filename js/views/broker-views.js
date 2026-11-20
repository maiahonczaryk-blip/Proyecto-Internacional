/* ============================================
   RE/MAX Inmomás — Broker View Module
   ============================================
   Handles all Broker dashboard views: dashboard
   overview, team management, clients, documents,
   and finances. Registered on App.views.broker.
   ============================================ */

;(function() {
  'use strict';

  window.App = window.App || {};
  App.views = App.views || {};

  /* ── Cached data ── */
  let currentUser  = null;
  let allSysUsers  = [];
  let teamRealtors = [];
  let brokerClients = [];
  let brokerCommissions = [];
  let teamViewMode = 'umbrella'; // 'umbrella' | 'cards'
  let teamSearchQuery = '';
  let expandedBrokerNodes = new Set(['brk-active-group', 'brk-pending-group']);

  /* ============================================
     initDashboard()
     Populates #view-broker-dashboard with stats,
     team overview, and recent client activity.
     ============================================ */
  async function initDashboard() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const welcomeEl = document.getElementById('broker-welcome');
      if (welcomeEl) {
        welcomeEl.innerHTML = `<span class="lang-en">Welcome back, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Manage your agency team, clients, and commissions.</span><span class="lang-es">Bienvenido/a de nuevo, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Gestiona tu equipo de agencia, clientes y comisiones.</span>`;
      }

      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('broker-regional-banner', currentUser);
      }

      // Check agreement status
      const agreementStatus = currentUser.agreementStatus || 'none';
      const warningEl = document.getElementById('broker-agreement-warning');
      const hasSigned = (agreementStatus === 'signed');
      const hasSubmittedData = (agreementStatus === 'data_submitted' || agreementStatus === 'uploaded');
      
      if (warningEl) {
        if (hasSigned) {
          warningEl.style.display = 'none';
        } else if (hasSubmittedData) {
          warningEl.style.display = 'block';
          warningEl.innerHTML = `
            <div class="glass-card" style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; text-align:left;">
              <span style="font-size:2rem;">📋</span>
              <div>
                <div style="font-weight:700; color:#1e40af; font-size:1.05rem;">
                  <span class="lang-en">Fiscal &amp; Bank Details Received — Preparing Contract</span>
                  <span class="lang-es">Datos Fiscales y Bancarios Recibidos — Preparando Contrato</span>
                  <span class="lang-fr">Données Fiscales et Bancaires Reçues — Préparation du Contrat</span>
                  <span class="lang-en-ca">Fiscal &amp; Bank Details Received — Preparing Contract</span>
                </div>
                <div style="font-size:0.85rem; color:#1d4ed8; margin-top:4px;">
                  <span class="lang-en">Our administration team is preparing your joint Collaboration Agreement externally and will present it to you for signature shortly. You can review or update your details in <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documents</a>.</span>
                  <span class="lang-es">Nuestro equipo de administración está redactando tu Contrato de Colaboración Conjunta de forma externa y te lo presentará en breve para la firma. Puedes revisar o actualizar tus datos en <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documentos</a>.</span>
                  <span class="lang-fr">Notre équipe prépare votre Contrat de Collaboration et vous le présentera sous peu. Vous pouvez vérifier vos données dans <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documents</a>.</span>
                  <span class="lang-en-ca">Our administration team is preparing your joint Collaboration Agreement externally and will present it to you for signature shortly. You can review or update your details in <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documents</a>.</span>
                </div>
              </div>
            </div>`;
        } else {
          warningEl.style.display = 'block';
          warningEl.innerHTML = `
            <div class="glass-card" style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#fef3c7; border:1px solid #fde68a; border-radius:12px; text-align:left;">
              <span style="font-size:2rem;">⚠️</span>
              <div>
                <div style="font-weight:700; color:#92400e; font-size:1.05rem;">
                  <span class="lang-en">Company Fiscal &amp; Bank Details Required for Contract</span>
                  <span class="lang-es">Datos Fiscales y Bancarios Requeridos para el Contrato</span>
                  <span class="lang-fr">Données Fiscales et Bancaires Requises pour le Contrat</span>
                  <span class="lang-en-ca">Company Fiscal &amp; Bank Details Required for Contract</span>
                </div>
                <div style="font-size:0.85rem; color:#78350f; margin-top:4px;">
                  <span class="lang-en">To prepare and present your joint Collaboration Agreement, please go to <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documents</a> and fill out your company's fiscal and corporate bank account details.</span>
                  <span class="lang-es">Para que podamos redactar y presentarte el Contrato de Colaboración Conjunta, ve a <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documentos</a> y completa el formulario con los datos fiscales de tu empresa y cuenta bancaria.</span>
                  <span class="lang-fr">Pour que nous puissions préparer votre Contrat de Collaboration, rendez-vous dans <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documents</a> et complétez les données fiscales et bancaires de votre entreprise.</span>
                  <span class="lang-en-ca">To prepare and present your joint Collaboration Agreement, please go to <a href="#broker/documents" style="font-weight:700; color:#003f99; text-decoration:underline;">Documents</a> and fill out your company's fiscal and corporate bank account details.</span>
                </div>
              </div>
            </div>`;
        }
      }

      // Professional Team Link & Exclusive Client Webinar Link
      const isPending = currentUser.status === 'pending';
      const refCode = currentUser.referralCode || 'BRK-DEFAULT';
      const referralLink = isPending ? '' : App.utils.generateReferralLink(refCode);
      const clientWebinarLink = isPending ? '' : App.utils.generateClientWebinarLink(refCode);

      const linkInput = document.getElementById('broker-dash-referral-link');
      if (linkInput) {
        if (isPending) {
          linkInput.value = 'Enlace pendiente de aprobación / Pending admin approval';
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

      const clientLinkInput = document.getElementById('broker-dash-client-webinar-link');
      if (clientLinkInput) {
        if (isPending) {
          clientLinkInput.value = 'Enlace pendiente de aprobación / Pending admin approval';
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
      const copyBtn = document.getElementById('broker-dash-copy-link');
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

      const copyClientBtn = document.getElementById('broker-dash-copy-client-link');
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

      // Manual Add Client button
      const addBtnContainer = document.getElementById('broker-dash-add-client-btn');
      if (addBtnContainer) {
        addBtnContainer.innerHTML = `
          <button class="btn btn-primary" onclick="App.views.broker.showAddClientModal()" style="display: flex; align-items: center; gap: 8px; padding: 0.65rem 1.25rem; font-size: 0.9rem; border-radius: 8px; background: linear-gradient(135deg, #0043ff, #0066ff); border: none; box-shadow: 0 2px 8px rgba(0,67,255,0.2);">
            <span style="font-size: 1.1rem;">➕</span>
            <span class="lang-en">Add Client Manually</span>
            <span class="lang-es">Añadir Cliente Manualmente</span>
          </button>
        `;
      }

      // Referral Link Logo & Brand Customizer
      const brokerDashBranding = document.getElementById('broker-dash-referral-branding');
      if (brokerDashBranding && App.referralBranding && App.referralBranding.canUse(currentUser)) {
        App.referralBranding.renderEditor(brokerDashBranding, currentUser, { compact: true });
      }

      // Marketing Lab Quick Access
      const brokerDashGuide = document.getElementById('broker-dash-buyer-guide');
      if (brokerDashGuide && App.marketingLab) {
        App.marketingLab.renderQuickCard(brokerDashGuide, currentUser, { route: 'broker/marketing' });
      }

      // Load data scoped to this broker (includes linked Realtors and Collaborators)
      const [allBrokerTeam, loadedClients, loadedComms, leads] = await Promise.all([
        App.auth.getAllUsers({ brokerId: currentUser.id }).catch(() => []),
        App.auth.getClients({ brokerId: currentUser.id }).catch(() => []),
        App.auth.getCommissions({ brokerId: currentUser.id }).catch(() => []),
        App.auth.getDossierLeads().catch(() => [])
      ]);
      teamRealtors      = (allBrokerTeam || []).filter(u => ['realtor', 'colaborador'].includes(u.role));
      brokerClients     = loadedClients || [];
      brokerCommissions = loadedComms || [];

      // Count metrics
      const approvedRealtors = teamRealtors.filter(r => r.status === 'active');
      const completedSales   = brokerCommissions.filter(c => c.status === 'paid' || c.status === 'pending_payment');
      const totalBrokerComm  = brokerCommissions.reduce((sum, c) => sum + (c.brokerAmount || c.realtorAmount || 0), 0);

      // Update stat cards
      setTextById('broker-stat-realtors',    approvedRealtors.length);
      setTextById('broker-stat-clients',     brokerClients.length);
      setTextById('broker-stat-sales',       completedSales.length);
      setTextById('broker-stat-commissions', App.utils.formatCurrency(totalBrokerComm));

      // Team overview
      renderTeamOverview(approvedRealtors);

      // Recent clients (latest 5)
      renderRecentClients(brokerClients);

      // Dossier downloads (leads)
      renderDossierLeads(leads || []);

    } catch (err) {
      console.error('[Broker] initDashboard error:', err);
      App.utils.showToast('Error loading broker dashboard.', 'error');
    }
  }

  /* ── Dossier Leads ── */
  function renderDossierLeads(leads) {
    const section = document.getElementById('broker-dossier-leads-section');
    const tbody = document.getElementById('broker-dossier-leads-tbody');
    if (!tbody) return;

    if (section) section.style.display = 'block';

    if (leads.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280; padding: 2rem;">No downloads yet.</td></tr>';
      return;
    }

    tbody.innerHTML = leads.map(lead => {
      const dateStr = App.utils.formatDate(lead.createdAt);
      return `
        <tr>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${dateStr}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${App.utils.escapeHtml(lead.firstName)} ${App.utils.escapeHtml(lead.lastName)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${App.utils.escapeHtml(lead.email)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${App.utils.escapeHtml(lead.phone)}</td>
        </tr>
      `;
    }).join('');
  }

  /* ── Team Overview (dashboard widget) ── */
  function renderTeamOverview(realtors) {
    const container = document.getElementById('broker-team-overview');
    if (!container) return;

    if (realtors.length === 0) {
      App.utils.showEmptyState('broker-team-overview', '<span class="lang-en">No team members yet.</span><span class="lang-es">Aún no hay miembros en el equipo.</span>', '👥');
      return;
    }

    container.innerHTML = realtors.map(r => {
      const avatar = App.utils.generateAvatar(r.firstName, r.lastName, 'sm');
      const clientCount = brokerClients.filter(c => c.referredBy === r.id).length;
      const statusBadge = App.utils.getUserStatusBadge(r.status);

      return `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">
          ${avatar}
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.9rem;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</div>
            <div style="font-size: 0.8rem; color: #6b7280;">${clientCount} <span class="lang-en">client${clientCount !== 1 ? 's' : ''}</span><span class="lang-es">cliente${clientCount !== 1 ? 's' : ''}</span></div>
          </div>
          ${statusBadge}
        </div>
      `;
    }).join('');
  }

  /* ── Recent Clients Table (dashboard widget) ── */
  function renderRecentClients(clients) {
    const container = document.getElementById('broker-recent-clients');
    if (!container) return;

    const recent = [...clients]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recent.length === 0) {
      App.utils.showEmptyState('broker-recent-clients', 'No clients yet.', '📋');
      return;
    }

    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Referred By</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(c => {
            const realtor = teamRealtors.find(r => r.id === c.referredBy);
            const realtorName = realtor ? `${realtor.firstName} ${realtor.lastName}` : '—';
            const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>`;
            return `
              <tr>
                <td style="font-weight: 500;">${App.utils.escapeHtml(c.firstName)} ${App.utils.escapeHtml(c.lastName)}</td>
                <td style="font-size: 0.85rem; color: #6b7280;">${App.utils.escapeHtml(realtorName)}</td>
                <td>${statusBadge}</td>
                <td style="font-size: 0.85rem; color: #6b7280;">${App.utils.formatDate(c.createdAt)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  /* ============================================
     initTeam()
     Populates #view-broker-team with realtor
     cards showing performance metrics.
     ============================================ */
  async function initTeam() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const welcomeEl = document.getElementById('broker-welcome');
      if (welcomeEl) {
        welcomeEl.innerHTML = `<span class="lang-en">Welcome back, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Manage your agency team, clients, and commissions.</span><span class="lang-es">Bienvenido/a de nuevo, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Gestiona tu equipo de agencia, clientes y comisiones.</span>`;
      }

      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('broker-regional-banner', currentUser);
      }

      const [loadedAllUsers, loadedClients, loadedComms] = await Promise.all([
        App.auth.getAllUsers(),
        App.auth.getClients({ brokerId: currentUser.id }),
        App.auth.getCommissions({ brokerId: currentUser.id })
      ]);

      allSysUsers = loadedAllUsers || [];
      const freshBroker = allSysUsers.find(u => u.id === currentUser.id) || currentUser;
      currentUser = freshBroker;

      const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allSysUsers) : null;
      teamRealtors = allSysUsers.filter(u => {
        if (u.id === currentUser.id || !['realtor', 'colaborador'].includes(u.role)) return false;
        if (u.brokerId === currentUser.id) return true;
        if (App.utils.resolveUserUmbrellaParents) {
          const p = App.utils.resolveUserUmbrellaParents(u, allSysUsers, lookupMaps);
          return Boolean(p.broker && p.broker.id === currentUser.id);
        }
        return false;
      });
      brokerClients = loadedClients || [];
      brokerCommissions = loadedComms || [];

      renderBrokerContextBanner(lookupMaps);
      setTeamViewMode(teamViewMode, false);
      renderTeamViews();

    } catch (err) {
      console.error('[Broker] initTeam error:', err);
      App.utils.showToast('Error loading team data.', 'error');
    }
  }

  function renderBrokerContextBanner(lookupMaps) {
    const bannerEl = document.getElementById('broker-umbrella-context-banner');
    if (!bannerEl || !currentUser) return;
    const parents = App.utils.resolveUserUmbrellaParents
      ? App.utils.resolveUserUmbrellaParents(currentUser, allSysUsers, lookupMaps)
      : { embajador: null };
    const embHtml = parents.embajador
      ? `<span class="umbrella-chain-pill umbrella-chain-pill--embajador">👑 Embajador: ${App.utils.escapeHtml(parents.embajador.firstName || '')} ${App.utils.escapeHtml(parents.embajador.lastName || '')}</span><span style="color:#94a3b8;font-weight:700;">➔</span>`
      : '';
    const inmomasBadge = App.utils.renderInmomasAgentBadge
      ? App.utils.renderInmomasAgentBadge(currentUser, allSysUsers, { showUnassigned: true, maps: lookupMaps })
      : '';
    const logoHtml = currentUser.agencyLogo
      ? `<img src="${App.utils.escapeHtml(currentUser.agencyLogo)}" alt="" style="height:24px; max-width:72px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; background:#fff; padding:2px;">`
      : '';

    bannerEl.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(0,67,255,0.08) 0%, rgba(16,185,129,0.04) 100%); border:1px solid rgba(0,67,255,0.22); border-left:4px solid #0043ff; border-radius:12px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${embHtml}
          <span class="umbrella-chain-pill umbrella-chain-pill--broker">🏢 <span class="lang-en">Your Broker Umbrella</span><span class="lang-es">Tu Paraguas Broker</span></span>
          ${logoHtml}
          <strong style="font-size:0.95rem; color:#0f172a;">${App.utils.escapeHtml(currentUser.agencyName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`)}</strong>
          ${inmomasBadge}
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span class="umbrella-kpi-pill">🏠 ${teamRealtors.length} Realtors</span>
          <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${brokerClients.length} <span class="lang-en">Clients</span><span class="lang-es">Clientes</span></span>
        </div>
      </div>
    `;
  }

  function setTeamViewMode(mode, reRender = true) {
    teamViewMode = mode === 'cards' ? 'cards' : 'umbrella';
    const accEl = document.getElementById('broker-team-accordion');
    const gridEl = document.getElementById('broker-team-grid');
    const expEl = document.getElementById('broker-umbrella-expand-controls');
    const btnUmb = document.getElementById('btn-broker-team-mode-umbrella');
    const btnCards = document.getElementById('btn-broker-team-mode-cards');

    if (accEl) accEl.style.display = teamViewMode === 'umbrella' ? 'flex' : 'none';
    if (gridEl) gridEl.style.display = teamViewMode === 'cards' ? 'block' : 'none';
    if (expEl) expEl.style.display = teamViewMode === 'umbrella' ? 'inline-flex' : 'none';
    if (btnUmb) btnUmb.classList.toggle('active', teamViewMode === 'umbrella');
    if (btnCards) btnCards.classList.toggle('active', teamViewMode === 'cards');

    if (reRender) renderTeamViews();
  }

  function searchTeam(query) {
    teamSearchQuery = (query || '').toLowerCase().trim();
    renderTeamViews();
  }

  function toggleBrokerNode(nodeId) {
    if (!nodeId) return;
    const el = document.getElementById(`brk-umb-node-${nodeId}`);
    if (expandedBrokerNodes.has(nodeId)) {
      expandedBrokerNodes.delete(nodeId);
      if (el) el.classList.remove('is-open');
    } else {
      expandedBrokerNodes.add(nodeId);
      if (el) el.classList.add('is-open');
    }
  }

  function expandAllBrokerNodes(expand) {
    const container = document.getElementById('broker-team-accordion');
    if (!container) return;
    container.querySelectorAll('[data-brk-node]').forEach(el => {
      const id = el.getAttribute('data-brk-node');
      if (expand) {
        expandedBrokerNodes.add(id);
        el.classList.add('is-open');
      } else {
        expandedBrokerNodes.delete(id);
        el.classList.remove('is-open');
      }
    });
  }

  function getFilteredTeamRealtors() {
    const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allSysUsers) : null;
    if (!teamSearchQuery) return teamRealtors;
    return teamRealtors.filter(r => {
      const inmomasRes = App.utils.resolveAssignedInmomasAgent ? App.utils.resolveAssignedInmomasAgent(r, allSysUsers, lookupMaps) : { name: '' };
      const hay = `${r.firstName || ''} ${r.lastName || ''} ${r.email || ''} ${r.agencyName || ''} ${r.country || ''} ${inmomasRes.name || ''}`.toLowerCase();
      return hay.includes(teamSearchQuery);
    });
  }

  function renderTeamViews() {
    const filtered = getFilteredTeamRealtors();
    renderTeamAccordion(filtered);
    renderTeamGrid(filtered);
    if (window.App && typeof window.App.updateLangDisplay === 'function') {
      window.App.updateLangDisplay();
    }
  }

  function renderBrokerRealtorAccordionItem(r, isPending, lookupMaps) {
    const nodeId = `realtor-${r.id}`;
    const isOpen = teamSearchQuery ? true : expandedBrokerNodes.has(nodeId);
    const rClients = brokerClients.filter(c => c.referredBy === r.id || c.realtorId === r.id);
    const rComms = brokerCommissions.filter(c => c.realtorId === r.id);
    const commTotal = rComms.reduce((sum, c) => sum + (c.realtorAmount || 0), 0);
    const inmomasBadge = App.utils.renderInmomasAgentBadge
      ? App.utils.renderInmomasAgentBadge(r, allSysUsers, { showUnassigned: true, compact: true, maps: lookupMaps })
      : '';
    const agreementBadge = r.agreementSigned
      ? '<span class="badge badge--approved">✓ Acuerdo</span>'
      : '<span class="badge badge--pending">⏳ Acuerdo</span>';

    const actionsHtml = isPending
      ? `
        <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); App.views.broker.approveRealtor('${r.id}')">✓ Approve</button>
        <button type="button" class="btn btn-outline btn-sm" style="border-color:#ef4444;color:#ef4444;" onclick="event.stopPropagation(); App.views.broker.rejectRealtor('${r.id}')">✕ Reject</button>
      `
      : `
        <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); App.views.broker.showRealtorDetail('${r.id}')">
          👁️ <span class="lang-en">Details</span><span class="lang-es">Ficha</span>
        </button>
      `;

    return `
      <div class="umbrella-subcard ${isOpen ? 'is-open' : ''}" id="brk-umb-node-${nodeId}" data-brk-node="${nodeId}" style="border-left-color:${isPending ? '#f59e0b' : '#10b981'};">
        <div class="umbrella-subcard__header" onclick="App.views.broker.toggleBrokerNode('${nodeId}')">
          <div style="display:flex; align-items:center; gap:10px; min-width:210px; flex:1; flex-wrap:wrap;">
            <span class="umbrella-chevron">▶</span>
            ${App.utils.generateAvatar(r.firstName, r.lastName, 'sm')}
            <div style="min-width:0;">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <strong style="font-size:0.9rem; color:#0f172a;">🏠 ${App.utils.escapeHtml(r.firstName || '')} ${App.utils.escapeHtml(r.lastName || '')}</strong>
                ${agreementBadge}
              </div>
              <div style="font-size:0.76rem; color:#64748b; margin-top:2px;">
                ✉️ ${App.utils.escapeHtml(r.email || '—')}${r.country ? ` · 🌍 ${App.utils.escapeHtml(r.country)}` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            ${inmomasBadge}
            <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${rClients.length} <span class="lang-en">Clients</span><span class="lang-es">Clientes</span></span>
            ${!isPending ? `<span class="umbrella-kpi-pill">💰 ${App.utils.formatCurrency(commTotal)}</span>` : ''}
            ${actionsHtml}
          </div>
        </div>
        <div class="umbrella-subcard__body">
          ${rClients.length > 0 ? `
            <div style="font-size:0.76rem; font-weight:700; color:#047857; margin-bottom:6px;">
              ↳ <span class="lang-en">Buyers Referred by ${App.utils.escapeHtml(r.firstName || '')} (${rClients.length})</span><span class="lang-es">Clientes Referidos por ${App.utils.escapeHtml(r.firstName || '')} (${rClients.length})</span>
            </div>
            <div class="umbrella-leaf-grid">
              ${rClients.map(c => `
                <div class="umbrella-leaf" style="cursor:pointer;" onclick="App.views.broker.showClientDetail('${c.id}')">
                  <div>
                    <strong>🏡 ${App.utils.escapeHtml(c.firstName || '')} ${App.utils.escapeHtml(c.lastName || '')}</strong>
                    <div style="font-size:0.74rem; color:#64748b;">📍 ${App.utils.escapeHtml(c.interestArea || c.budget || 'España')} · ${App.utils.formatDate(c.createdAt)}</div>
                  </div>
                  <span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size:0.8rem; color:#64748b;">
              <span class="lang-en">No clients referred by this Realtor yet.</span>
              <span class="lang-es">Este Realtor aún no ha registrado clientes compradores.</span>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderTeamAccordion(realtors) {
    const container = document.getElementById('broker-team-accordion');
    if (!container) return;

    if (!realtors || realtors.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:2.5rem 1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px; color:#64748b;">
          <div style="font-size:2rem; margin-bottom:8px;">👥</div>
          <span class="lang-en">No realtors in your umbrella match the current search.</span>
          <span class="lang-es">No hay realtors en tu paraguas con la búsqueda actual.</span>
        </div>
      `;
      return;
    }

    const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allSysUsers) : null;
    const pending = realtors.filter(r => r.status === 'pending_broker' || r.status === 'pending');
    const active = realtors.filter(r => r.status === 'active' || r.status === 'approved');

    let html = '';
    if (pending.length > 0) {
      const pNode = 'brk-pending-group';
      const pOpen = expandedBrokerNodes.has(pNode);
      html += `
        <div class="umbrella-card umbrella-card--embajador ${pOpen ? 'is-open' : ''}" id="brk-umb-node-${pNode}" data-brk-node="${pNode}">
          <div class="umbrella-card__header" onclick="App.views.broker.toggleBrokerNode('${pNode}')">
            <div class="umbrella-card__left">
              <span class="umbrella-chevron">▶</span>
              <div class="umbrella-card__identity">
                <span class="umbrella-card__name">⏳ <span class="lang-en">Pending Realtor Approvals</span><span class="lang-es">Solicitudes Pendientes de Aprobación</span> (${pending.length})</span>
              </div>
            </div>
          </div>
          <div class="umbrella-card__body">
            <div class="umbrella-branch">
              ${pending.map(r => renderBrokerRealtorAccordionItem(r, true, lookupMaps)).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (active.length > 0) {
      const aNode = 'brk-active-group';
      const aOpen = expandedBrokerNodes.has(aNode);
      html += `
        <div class="umbrella-card umbrella-card--broker ${aOpen ? 'is-open' : ''}" id="brk-umb-node-${aNode}" data-brk-node="${aNode}">
          <div class="umbrella-card__header" onclick="App.views.broker.toggleBrokerNode('${aNode}')">
            <div class="umbrella-card__left">
              <span class="umbrella-chevron">▶</span>
              <div class="umbrella-card__identity">
                <span class="umbrella-card__name">🏢 ➔ 🏠 <span class="lang-en">Active Realtors Under Your Broker Umbrella</span><span class="lang-es">Equipo de Realtors Activos bajo tu Paraguas</span> (${active.length})</span>
                <div class="umbrella-card__meta">
                  <span class="lang-en">Click any Realtor to expand their referred clients &amp; assigned RE/MAX Inmomás Agent</span>
                  <span class="lang-es">Haz clic en cualquier Realtor para desplegar sus clientes y ver su Agente RE/MAX Inmomás</span>
                </div>
              </div>
            </div>
          </div>
          <div class="umbrella-card__body">
            <div class="umbrella-branch">
              ${active.map(r => renderBrokerRealtorAccordionItem(r, false, lookupMaps)).join('')}
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  /* ── Team Grid ── */
  function renderTeamGrid(realtors) {
    const container = document.getElementById('broker-team-grid');
    if (!container) return;

    if (realtors.length === 0) {
      App.utils.showEmptyState('broker-team-grid', 'No realtors in your team yet.', '👥');
      return;
    }

    const pending = realtors.filter(r => r.status === 'pending_broker');
    const active = realtors.filter(r => r.status === 'active');

    let html = '';

    if (pending.length > 0) {
      html += `
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <span class="badge badge--warning">${pending.length}</span> Pending Approvals
          </h2>
          <div class="team-cards-grid">
            ${pending.map(r => renderRealtorCard(r, true)).join('')}
          </div>
        </div>
      `;
    }

    if (active.length > 0) {
      html += `
        <div>
          <h2 style="font-size: 1.25rem; margin-bottom: 16px; color: var(--text-primary);">Active Team</h2>
          <div class="team-cards-grid">
            ${active.map(r => renderRealtorCard(r, false)).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderRealtorCard(r, isPending) {
    const avatar = App.utils.generateAvatar(r.firstName, r.lastName);
    const clientCount = brokerClients.filter(c => c.referredBy === r.id).length;
    const realtorComms = brokerCommissions.filter(c => c.realtorId === r.id);
    const commTotal = realtorComms.reduce((sum, c) => sum + (c.realtorAmount || 0), 0);
    const agreementBadge = r.agreementSigned
      ? '<span class="badge badge--approved">Signed</span>'
      : '<span class="badge badge--pending">Unsigned</span>';

    const actionButtons = isPending ? `
      <div style="display: flex; gap: 8px; margin-top: 16px;">
        <button class="btn btn-primary" style="flex: 1;" onclick="App.views.broker.approveRealtor('${r.id}')">Approve</button>
        <button class="btn btn-outline" style="flex: 1; border-color: #ef4444; color: #ef4444;" onclick="App.views.broker.rejectRealtor('${r.id}')">Reject</button>
      </div>
    ` : '';

    return `
      <div class="stat-card" style="flex-direction: column; cursor: ${isPending ? 'default' : 'pointer'}; padding: 1.5rem;" ${!isPending ? `onclick="App.views.broker.showRealtorDetail('${r.id}')"` : ''}>
        <div style="text-align: center; margin-bottom: 1rem;">
          <div style="display: inline-block; box-shadow: var(--shadow-sm); border-radius: 50%;">${avatar}</div>
          <h4 style="margin: 0.75rem 0 0.25rem; color: var(--text-primary); font-size: 1.1rem;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">${App.utils.escapeHtml(r.agencyName || '—')}</p>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; text-align: center;">
          ✉️ ${App.utils.escapeHtml(r.email)}
        </div>
        <div style="text-align: center; margin-bottom: 10px;">
          ${App.utils.renderInmomasAgentBadge ? App.utils.renderInmomasAgentBadge(r, allSysUsers, { showUnassigned: true, compact: true }) : ''}
        </div>
        ${!isPending ? `
        <div style="display: flex; justify-content: space-between; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); font-size: 0.85rem; color: var(--text-primary);">
          <span>👥 ${clientCount} clients</span>
          <span style="font-family: 'JetBrains Mono', monospace;">💰 ${App.utils.formatCurrency(commTotal)}</span>
        </div>
        <div style="margin-top: 0.75rem; text-align: center;">
          Agreement: ${agreementBadge}
        </div>
        ` : ''}
        ${actionButtons}
      </div>
    `;
  }

  async function approveRealtor(id) {
    if (!confirm('Approve this Realtor?')) return;
    try {
      await App.auth.updateUserStatus(id, 'active');
      App.utils.showToast('Realtor approved!', 'success');
      initTeam(); // refresh
    } catch (err) {
      App.utils.showToast(err.message, 'error');
    }
  }

  async function rejectRealtor(id) {
    if (!confirm('Reject this Realtor?')) return;
    try {
      await App.auth.updateUserStatus(id, 'rejected');
      App.utils.showToast('Realtor rejected.', 'success');
      initTeam(); // refresh
    } catch (err) {
      App.utils.showToast(err.message, 'error');
    }
  }

  /* ── Realtor Detail Modal ── */
  async function showRealtorDetail(realtorId) {
    try {
      const realtor = await App.auth.getUser(realtorId);
      if (!realtor) {
        App.utils.showToast('Realtor not found.', 'error');
        return;
      }

      const avatar = App.utils.generateAvatar(realtor.firstName, realtor.lastName, 'lg');
      const clientCount = brokerClients.filter(c => c.referredBy === realtorId).length;
      const realtorComms = brokerCommissions.filter(c => c.realtorId === realtorId);
      const commTotal = realtorComms.reduce((sum, c) => sum + (c.realtorAmount || 0), 0);

      // Client list for this realtor
      const realtorClients = brokerClients.filter(c => c.referredBy === realtorId);
      const clientRows = realtorClients.map(c => `
        <tr>
          <td>${App.utils.escapeHtml(c.firstName)} ${App.utils.escapeHtml(c.lastName)}</td>
          <td><span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span></td>
          <td>${App.utils.formatDate(c.createdAt)}</td>
        </tr>
      `).join('');

      App.utils.showModal({
        title: 'Realtor Details',
        body: `
          <div style="text-align: center; margin-bottom: 1.5rem;">
            ${avatar}
            <h3 style="margin: 1rem 0 0.25rem;">${App.utils.escapeHtml(realtor.firstName)} ${App.utils.escapeHtml(realtor.lastName)}</h3>
            <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 8px;">${App.utils.escapeHtml(realtor.agencyName || '—')} · ${App.utils.escapeHtml(realtor.country || '—')}</p>
            <div>${App.utils.renderInmomasAgentBadge ? App.utils.renderInmomasAgentBadge(realtor, allSysUsers, { showUnassigned: true }) : ''}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; text-align: center; margin-bottom: 1.5rem;">
            <div class="stat-card" style="padding: 1rem;">
              <div class="stat-value" style="font-size: 1.25rem;">${clientCount}</div>
              <div class="stat-title">Clients</div>
            </div>
            <div class="stat-card" style="padding: 1rem;">
              <div class="stat-value" style="font-size: 1.25rem;">${App.utils.formatCurrency(commTotal)}</div>
              <div class="stat-title">Commissions</div>
            </div>
            <div class="stat-card" style="padding: 1rem;">
              <div class="stat-value" style="font-size: 1.25rem;">${realtor.agreementSigned ? '✅' : '❌'}</div>
              <div class="stat-title">Agreement</div>
            </div>
          </div>
          ${realtorClients.length > 0 ? `
            <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem; color: #374151;">Referred Clients</h4>
            <table class="data-table" style="font-size: 0.85rem;">
              <thead><tr><th>Client</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>${clientRows}</tbody>
            </table>
          ` : '<p style="color: #6b7280; text-align: center;">No clients referred yet.</p>'}
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
      });

    } catch (err) {
      console.error('[Broker] showRealtorDetail error:', err);
      App.utils.showToast('Error loading realtor details.', 'error');
    }
  }

  /* ============================================
     initClients()
     Populates #view-broker-clients with a
     filterable client table.
     ============================================ */
  async function initClients() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const welcomeEl = document.getElementById('broker-welcome');
      if (welcomeEl) {
        welcomeEl.innerHTML = `<span class="lang-en">Welcome back, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Manage your agency team, clients, and commissions.</span><span class="lang-es">Bienvenido/a de nuevo, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Gestiona tu equipo de agencia, clientes y comisiones.</span>`;
      }

      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('broker-regional-banner', currentUser);
      }

      const allBrokerTeam = await App.auth.getAllUsers({ brokerId: currentUser.id });
      teamRealtors  = allBrokerTeam.filter(u => ['realtor', 'colaborador'].includes(u.role));
      brokerClients = await App.auth.getClients({ brokerId: currentUser.id });

      const getRealtorName = (realtorId) => {
        if (!realtorId || realtorId === currentUser.id) return `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Broker Directo';
        const realtor = teamRealtors.find(r => r.id === realtorId);
        return realtor ? `${realtor.firstName} ${realtor.lastName}` : 'Unknown';
      };

      App.utils.renderKanbanBoard(
        'broker-pipeline-board',
        brokerClients,
        'App.views.broker.showClientDetail',
        getRealtorName,
        null,
        { users: [currentUser, ...teamRealtors].filter(Boolean), showUmbrellaSubBadge: false }
      );

    } catch (err) {
      console.error('[Broker] initClients error:', err);
      App.utils.showToast('Error loading clients.', 'error');
    }
  }



  /* ── Client Detail Modal ── */
  async function showClientDetail(clientId) {
    try {
      const client = brokerClients.find(c => c.id === clientId);
      if (!client) {
        App.utils.showToast('Client not found.', 'error');
        return;
      }

      const realtor = teamRealtors.find(r => r.id === client.referredBy);
      const realtorName = realtor ? `${realtor.firstName} ${realtor.lastName}` : '—';
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
        title: 'Client Details',
        body: `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.25rem;">${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}</h3>
            <div style="margin-bottom: 0.5rem;">${statusBadge}</div>
          </div>
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
              <div style="font-weight: 600; color: #374151;">Referred By</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(realtorName)}</div>
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
            <div style="grid-column: span 2;">
              <div style="font-weight: 600; color: #374151;">Agente Inmomás (España)</div>
              <div style="color: #b45309; font-weight: 600;">🇪🇸 ${App.utils.escapeHtml(client.localAgentName || 'Sin asignar / Unassigned')}</div>
            </div>
          </div>
          ${client.notes ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; color: #374151; margin-bottom: 1.5rem;">${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151;">Status Timeline</h4>
          ${timeline || '<p style="color: #6b7280;">No history available.</p>'}
        `,
        footer: `<button class="btn btn-sm" onclick="App.utils.confirmDeleteClient('${client.id}', '${client.firstName} ${client.lastName}', () => App.views.broker.initDashboard())" style="background: #ef4444; color: white; border: none;">🗑️ Delete</button>
                  <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
      });

    } catch (err) {
      console.error('[Broker] showClientDetail error:', err);
      App.utils.showToast('Error loading client details.', 'error');
    }
  }

  /* ============================================
     initDocuments()
     Populates #view-broker-documents with
     agreement status and team documents.
     ============================================ */
  async function initDocuments() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const welcomeEl = document.getElementById('broker-welcome');
      if (welcomeEl) {
        welcomeEl.innerHTML = `<span class="lang-en">Welcome back, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Manage your agency team, clients, and commissions.</span><span class="lang-es">Bienvenido/a de nuevo, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Gestiona tu equipo de agencia, clientes y comisiones.</span>`;
      }

      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('broker-regional-banner', currentUser);
      }

      const brokerDocsGuide = document.getElementById('broker-docs-buyer-guide');
      if (brokerDocsGuide) {
        brokerDocsGuide.style.display = 'none';
      }

      const container = document.getElementById('broker-documents-content');
      if (!container) return;

      const allBrokerDocsTeam = await App.auth.getAllUsers({ brokerId: currentUser.id });
      teamRealtors = allBrokerDocsTeam.filter(u => ['realtor', 'colaborador'].includes(u.role));

      const teamDocsHtml = teamRealtors.length === 0
        ? `<div class="empty-state"><div class="empty-state__icon">👥</div><p class="empty-state__text">No team members yet.</p></div>`
        : `<div class="team-cards-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1rem;">
             ${teamRealtors.map(r => {
               const isColab = r.role === 'colaborador';
               const rStatus = r.agreementStatus || 'none';
               const badge = rStatus === 'signed'
                 ? '<span class="badge badge--approved">Firmado / Signed ✅</span>'
                 : (rStatus === 'data_submitted' || rStatus === 'uploaded')
                   ? '<span class="badge badge--pending" style="background:#dbeafe; color:#1e40af;">Datos Enviados 📋</span>'
                   : '<span class="badge badge--pending">Pendiente ⚠️</span>';
               const detail = rStatus === 'signed'
                 ? `<p style="margin:0; color:#10b981;">Firmado el / Signed on: ${App.utils.formatDate(r.agreementSignedAt)}</p>`
                 : (rStatus === 'data_submitted' || rStatus === 'uploaded')
                   ? `<p style="margin:0; color:#1d4ed8;">Datos fiscales y bancarios enviados — preparando contrato externo</p>`
                   : `<p style="margin:0; color:#f59e0b;">Pendiente de completar datos fiscales/bancarios o firma</p>`;
               return `
               <div class="glass-card" style="padding:1.25rem;">
                 <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                   <div>
                     <div style="font-weight:600; font-size:1rem;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</div>
                     <div style="font-size:0.8rem; color:#6b7280;">${isColab ? '🤝 Colaborador (10% a éxito)' : '🏠 Agente / Realtor (25% vía Agencia)'}</div>
                   </div>
                   ${badge}
                 </div>
                 <div style="font-size:0.85rem; color:#374151;">
                   <p style="margin:0 0 0.5rem;"><strong>Contrato:</strong> ${isColab ? 'Acuerdo de Colaborador (10% a éxito)' : 'Acuerdo de Colaboración vía Agencia (25%)'}</p>
                   ${detail}
                   <div style="margin-top:0.85rem; padding-top:0.75rem; border-top:1px solid #e5e7eb;">
                     <button type="button" class="btn btn-outline btn-sm" style="width:100%; border-color:${isColab ? '#5b21b6' : '#047857'}; color:${isColab ? '#5b21b6' : '#047857'}; background:${isColab ? '#f5f3ff' : '#ecfdf5'}; font-weight:700;" onclick="App.views.broker.exportRealtorAgreement('${r.id}')">
                       ${isColab ? '🤝' : '🏠'} <span class="lang-en">Export ${isColab ? 'Collaborator (10%)' : 'Realtor (25%)'} Agreement (.doc)</span><span class="lang-es">Exportar Acuerdo de ${isColab ? 'Colaborador (10%)' : 'Agente vía Agencia (25%)'} (.doc)</span><span class="lang-fr">Exporter Accord (${isColab ? '10%' : '25%'}) (.doc)</span><span class="lang-en-ca">Export ${isColab ? 'Collaborator (10%)' : 'Realtor (25%)'} Agreement (.doc)</span>
                     </button>
                   </div>
                 </div>
               </div>`;
             }).join('')}
           </div>`;

      container.innerHTML = `
        <div class="dashboard-section">
          <h2>
            <span class="lang-en">Collaboration Agreement &amp; Company Fiscal Details</span>
            <span class="lang-es">Contrato de Colaboración y Datos Fiscales de la Empresa</span>
            <span class="lang-fr">Contrat de Collaboration et Données Fiscales</span>
            <span class="lang-en-ca">Collaboration Agreement &amp; Company Fiscal Details</span>
          </h2>
          <div id="broker-contract-data-section"></div>
        </div>
        <div class="dashboard-section">
          <h2>
            <span class="lang-en">Team Realtors — Collaboration Agreement Status</span>
            <span class="lang-es">Agentes del Equipo — Estado del Contrato de Colaboración</span>
            <span class="lang-fr">Agents de l'Équipe — Statut du Contrat</span>
            <span class="lang-en-ca">Team Realtors — Collaboration Agreement Status</span>
          </h2>
          ${teamDocsHtml}
        </div>
      `;

      const contractContainer = document.getElementById('broker-contract-data-section');
      if (contractContainer && App.utils && typeof App.utils.renderContractDataSection === 'function') {
        App.utils.renderContractDataSection(contractContainer, currentUser, 'broker-contract', () => {
          initDocuments();
        });
      }

    } catch (err) {
      console.error('[Broker] initDocuments error:', err);
      App.utils.showToast('Error loading documents.', 'error');
    }
  }

  /* ============================================
     initFinances()
     Populates #view-broker-finances with
     commission summary and detailed table.
     ============================================ */
  async function initFinances() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      const welcomeEl = document.getElementById('broker-welcome');
      if (welcomeEl) {
        welcomeEl.innerHTML = `<span class="lang-en">Welcome back, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Manage your agency team, clients, and commissions.</span><span class="lang-es">Bienvenido/a de nuevo, <strong>${App.utils.escapeHtml(currentUser.firstName || '')}</strong>. Gestiona tu equipo de agencia, clientes y comisiones.</span>`;
      }

      if (App.utils && App.utils.renderUserRegionalBanner) {
        await App.utils.renderUserRegionalBanner('broker-regional-banner', currentUser);
      }

      brokerCommissions = await App.auth.getCommissions({ brokerId: currentUser.id });

      // Calculate summary metrics
      const getBrkAmt = (c) => c.brokerAmount || c.realtorAmount || 0;
      const totalComm   = brokerCommissions.reduce((s, c) => s + getBrkAmt(c), 0);
      const paidComm    = brokerCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + getBrkAmt(c), 0);
      const pendingComm = brokerCommissions.filter(c => c.status === 'pending_payment').reduce((s, c) => s + getBrkAmt(c), 0);
      const projComm    = brokerCommissions.filter(c => c.status === 'projected').reduce((s, c) => s + getBrkAmt(c), 0);

      // Update summary stat cards
      setTextById('broker-fin-total',     App.utils.formatCurrency(totalComm));
      setTextById('broker-fin-paid',      App.utils.formatCurrency(paidComm));
      setTextById('broker-fin-pending',   App.utils.formatCurrency(pendingComm));
      setTextById('broker-fin-projected', App.utils.formatCurrency(projComm));

      // Render commission table
      renderBrokerCommissionTable(brokerCommissions);

    } catch (err) {
      console.error('[Broker] initFinances error:', err);
      App.utils.showToast('Error loading financial data.', 'error');
    }
  }

  /* ── Broker Commission Table ── */
  function renderBrokerCommissionTable(commissions) {
    const tbody = document.getElementById('broker-commission-table-body');
    if (!tbody) return;

    if (commissions.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="8" style="text-align: center; padding: 2rem;">
          <div class="empty-state">
            <div class="empty-state__icon">💰</div>
            <p class="empty-state__text">No commissions recorded yet.</p>
          </div>
        </td></tr>
      `;
      return;
    }

    tbody.innerHTML = commissions.map(c => {
      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>`;

      return `
        <tr>
          <td style="font-weight: 500;">${App.utils.escapeHtml(c.clientName)}</td>
          <td style="font-size: 0.85rem;">${App.utils.escapeHtml(c.propertyAddress || '—')}</td>
          <td>${App.utils.formatCurrency(c.salePrice)}</td>
          <td>${App.utils.formatCurrency(c.totalCommission)}</td>
          <td style="text-align: center;">${c.brokerSharePct || c.realtorSharePct || 25}%</td>
          <td style="font-weight: 600;">${App.utils.formatCurrency(c.brokerAmount || c.realtorAmount || 0)}</td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.85rem; color: #6b7280;">${App.utils.formatDate(c.closingDate || c.createdAt)}</td>
        </tr>
      `;
    }).join('');
  }

  /* ── Add Client Manually Modal ── */
  function showAddClientModal() {
    App.utils.showModal({
      title: '➕ Add Client Manually',
      body: `
        <form id="manual-client-form" style="display: grid; gap: 1rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">First Name *</label>
              <input type="text" id="mc-firstName" class="form-input" placeholder="John" required style="margin-bottom: 0;">
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Last Name *</label>
              <input type="text" id="mc-lastName" class="form-input" placeholder="Smith" required style="margin-bottom: 0;">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Email *</label>
              <input type="email" id="mc-email" class="form-input" placeholder="john@example.com" required style="margin-bottom: 0;">
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Phone *</label>
              <input type="tel" id="mc-phone" class="form-input" placeholder="+1 555 123 4567" required style="margin-bottom: 0;">
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
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Timeline *</label>
              <select id="mc-timeline" class="form-input" required style="margin-bottom: 0;">
                <option value="">Select timeline / Seleccionar plazo</option>
                <option value="0 a 6 meses">0 a 6 meses / 0 to 6 months</option>
                <option value="6 a 12 meses">6 a 12 meses / 6 to 12 months</option>
                <option value="+12 meses">+12 meses / +12 months</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Objective *</label>
              <select id="mc-objective" class="form-input" required style="margin-bottom: 0;">
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
        </form>
      `,
      footer: `
        <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="App.views.broker.handleAddClient()" style="margin-left: 0.5rem;">Save Client</button>
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

    if (!firstName || !lastName || !email || !phone) {
      App.utils.showToast('Please fill in all required fields (Name, Email, Phone).', 'error');
      return;
    }
    if (!timeline) {
      App.utils.showToast('Please select a timeline.', 'error');
      return;
    }
    if (!objective) {
      App.utils.showToast('Please select an objective.', 'error');
      return;
    }

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
        notes: document.getElementById('mc-notes')?.value.trim() || ''
      });

      App.utils.closeModal();
      App.utils.showToast('Client added successfully! 🎉', 'success');
      initDashboard(); // Refresh dashboard
    } catch (err) {
      console.error('[Broker] handleAddClient error:', err);
      App.utils.showToast('Error adding client: ' + err.message, 'error');
    }
  }

  /* ── Export Team Realtor Agreement to Word ── */
  function exportRealtorAgreement(realtorId) {
    if (typeof App.generateReferralAgreementDoc !== 'function') {
      App.utils.showToast('Generador de documento Word no disponible.', 'error');
      return;
    }
    const realtor = (teamRealtors || []).find(r => r.id === realtorId);
    const broker = currentUser || App.auth.getCurrentUser();
    if (!realtor) {
      App.utils.showToast('Realtor no encontrado.', 'error');
      return;
    }
    if (realtor.role === 'colaborador') {
      App.generateReferralAgreementDoc(realtor);
      return;
    }
    // Use realtor's own contractCompanyData if submitted, otherwise fall back to Broker's company data
    const hasRealtorCompanyData = realtor.contractCompanyData && (realtor.contractCompanyData.companyLegalName || realtor.contractCompanyData.taxId);
    const primaryUserData = hasRealtorCompanyData ? realtor : (broker || realtor);
    App.generateReferralAgreementDoc(primaryUserData, realtor);
  }

  /* ── Utility ── */
  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================
     Public API — register on App.views.broker
     ============================================ */
  App.views.broker = {
    initDashboard,
    initTeam,
    setTeamViewMode,
    searchTeam,
    toggleBrokerNode,
    expandAllBrokerNodes,
    initClients,
    initDocuments,
    initFinances,
    showRealtorDetail,
    showClientDetail,
    approveRealtor,
    rejectRealtor,
    showAddClientModal,
    handleAddClient,
    exportRealtorAgreement
  };

})();
