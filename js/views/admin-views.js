/* ============================================
   RE/MAX Inmomás — Admin View Module
   ============================================
   Handles the Admin Dashboard and User
   Management views. Registered on App.views.admin.
   ============================================ */

;(function() {
  'use strict';

  window.App = window.App || {};
  App.views = App.views || {};

  /* ── Local state ── */
  let allUsers = [];
  let allClients = [];
  let allLeads = [];
  let activeClientTag = 'spain_buyer'; // 'spain_buyer' | 'realtor_network' | 'all'
  let clientSearchQuery = '';
  let clientRegionFilter = '';
  let clientCountryFilter = '';
  let clientAgentFilter = '';
  let dashRegionFilter = '';
  let dashCountryFilter = '';
  let dashWebinarsCache = [];
  let pendingAdminRegionFilter = '';
  let pendingAdminCountryFilter = '';
  let filteredUsersCache = [];
  let filteredClientsCache = [];
  let filteredUnifiedCache = [];
  let currentUsersViewMode = 'umbrella'; // 'umbrella' | 'table'
  let expandedAdminNodes = new Set();
  let adminUmbrellaInitialized = false;

  function jumpToRegionView(routeName, regionId, countryVal = '') {
    pendingAdminRegionFilter = regionId || '';
    pendingAdminCountryFilter = countryVal || '';
    if (App.router && typeof App.router.navigateTo === 'function') {
      App.router.navigateTo(routeName);
    } else {
      window.location.hash = routeName;
    }
  }

  function jumpFromDashFilter(routeName) {
    jumpToRegionView(routeName, dashRegionFilter, dashCountryFilter);
  }

  function buildSmartMasAgentOptions(localAgents, selectedAgentId = '', targetRegionId = '', placeholder = '-- Seleccionar Agente RE/MAX Inmomás --') {
    const formatAgentLabel = (a) => {
      const nat = App.utils.getUserNationality ? App.utils.getUserNationality(a) : (a.nationality || a.country || '');
      const regs = App.utils.getUserRegions ? App.utils.getUserRegions(a) : [];
      const regNames = regs.map(r => (App.utils.REGIONS && App.utils.REGIONS[r]) ? App.utils.REGIONS[r].shortEs : r).filter(Boolean).join(', ');
      const meta = [nat, regNames].filter(Boolean).join(' · ');
      return `${App.utils.escapeHtml(a.firstName)} ${App.utils.escapeHtml(a.lastName)}${meta ? ` (${App.utils.escapeHtml(meta)})` : ' (RE/MAX Inmomás)'}`;
    };

    if (!targetRegionId) {
      return `<option value="">${placeholder}</option>` + localAgents.map(a =>
        `<option value="${a.id}" ${selectedAgentId === a.id ? 'selected' : ''}>${formatAgentLabel(a)}</option>`
      ).join('');
    }

    const matching = [];
    const others = [];
    localAgents.forEach(a => {
      const regs = App.utils.getUserRegions ? App.utils.getUserRegions(a) : [];
      if (regs.includes(targetRegionId)) matching.push(a);
      else others.push(a);
    });

    const regTitle = (App.utils.REGIONS && App.utils.REGIONS[targetRegionId]) ? App.utils.REGIONS[targetRegionId].shortEs : targetRegionId;
    let html = `<option value="">${placeholder}</option>`;
    if (matching.length > 0) {
      html += `<optgroup label="⭐ Recomendados — Región ${App.utils.escapeHtml(regTitle)}">`;
      html += matching.map(a => `<option value="${a.id}" ${selectedAgentId === a.id ? 'selected' : ''}>⭐ ${formatAgentLabel(a)}</option>`).join('');
      html += `</optgroup>`;
    }
    if (others.length > 0) {
      html += `<optgroup label="🇪🇸 Otros Agentes RE/MAX Inmomás">`;
      html += others.map(a => `<option value="${a.id}" ${selectedAgentId === a.id ? 'selected' : ''}>${formatAgentLabel(a)}</option>`).join('');
      html += `</optgroup>`;
    }
    return html;
  }

  function isMaiaOrSuperAdmin() {
    let email = '';
    let fullName = '';

    const user = App.auth ? App.auth.getCurrentUser() : null;
    if (user) {
      email = (user.email || '').toLowerCase().trim();
      fullName = `${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}`.toLowerCase();
    }

    // Direct Firebase auth check fallback
    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
      const fbEmail = (firebase.auth().currentUser.email || '').toLowerCase().trim();
      if (fbEmail) email = email || fbEmail;
      const fbName = (firebase.auth().currentUser.displayName || '').toLowerCase();
      if (fbName) fullName = fullName || fbName;
    }

    // LocalStorage fallback
    if (!email) {
      try {
        const session = JSON.parse(localStorage.getItem('remax_session') || localStorage.getItem('remax_current_user') || '{}');
        if (session.email) email = (session.email || '').toLowerCase().trim();
        if (session.firstName || session.lastName || session.name) {
          fullName = `${session.firstName || ''} ${session.lastName || ''} ${session.name || ''}`.toLowerCase();
        }
      } catch (_) {}
    }

    // SuperAdmin email list
    const superAdminEmails = [
      'maia.honczaryk@remax.es',
      'spainconnection0@gmail.com',
      'inmomas@remax.es',
      'admin@remax-inmomas.com'
    ];

    if (superAdminEmails.includes(email)) return true;

    // SuperAdmin name check
    if (fullName.includes('maia') && (fullName.includes('honczaryk') || fullName.includes('belen') || fullName.includes('belón'))) {
      return true;
    }

    return false;
  }

  function isJoseMartinezSession() {
    if (isMaiaOrSuperAdmin()) return false;
    const user = App.auth ? App.auth.getCurrentUser() : null;
    let email = (user && user.email ? user.email : '').toLowerCase().trim();
    let name = (user ? `${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}` : '').toLowerCase();

    if (window.firebase && firebase.auth && firebase.auth().currentUser) {
      const fbEmail = (firebase.auth().currentUser.email || '').toLowerCase().trim();
      if (fbEmail) email = email || fbEmail;
    }

    return email === 'spainconnection0@remax.es' || (name.includes('josé') && name.includes('martínez'));
  }

  async function requestChangeApproval(actionTitle, actionDetails) {
    const currentUser = App.auth.getCurrentUser();
    const requesterName = (currentUser ? (currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email) : 'The Spain Connection');
    
    // Notify Maia
    if (window.App && window.App.notifications && window.App.notifications.onAdminChangeRequested) {
      window.App.notifications.onAdminChangeRequested({
        requester: requesterName,
        action: actionTitle,
        details: actionDetails,
        date: new Date().toISOString()
      }).catch(console.warn);
    }

    App.utils.showModal({
      title: '🔒 Aprobación de Maia Requerida',
      body: `
        <div style="text-align: center; padding: 1.5rem 0.5rem;">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">🛡️</div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.5rem;">Solicitud enviada a Maia Honczaryk</h3>
          <p style="color: #4b5563; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.25rem;">
            El usuario <strong>${App.utils.escapeHtml(requesterName)}</strong> ha solicitado la siguiente acción:
            <br><span style="display:inline-block; margin-top: 6px; font-weight: 700; color: #1e40af; background: #eff6ff; padding: 4px 10px; border-radius: 6px;">${App.utils.escapeHtml(actionTitle)}</span>
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; text-align: left; font-size: 0.875rem; color: #475569; margin-bottom: 1.25rem;">
            <strong style="color: #1e293b;">Detalles del cambio:</strong><br>${App.utils.escapeHtml(actionDetails)}
          </div>
          <p style="color: #64748b; font-size: 0.82rem; margin: 0;">
            ✉️ Se ha enviado un aviso a <strong>maia.honczaryk@remax.es</strong> (y spainconnection0@gmail.com) para que Maia pueda revisar y validar este cambio en el portal.
          </p>
        </div>
      `,
      footer: `<button class="btn btn-primary btn-sm" onclick="App.utils.closeModal()">Entendido</button>`,
      onClose: () => {}
    });
  }

  /* ============================================
     initDashboard()
     Populates #view-admin-dashboard with stat
     cards, pending application list, and recent
     activity feed.
     ============================================ */
  async function initDashboard() {
    try {
      // 1. Load all users, clients, leads, and webinar registrations
      const [loadedUsers, loadedClients, loadedLeads, loadedWebinars] = await Promise.all([
        App.auth.getAllUsers(),
        App.auth.getClients(),
        App.auth.getDossierLeads().catch(() => []),
        App.auth.getWebinarRegistrations().catch(() => [])
      ]);
      allUsers = loadedUsers || [];
      allClients = loadedClients || [];
      allLeads = loadedLeads || [];
      dashWebinarsCache = loadedWebinars || [];

      // 2. Setup Compact Region & Country Filter Bar + Apply Metrics
      setupDashboardGeoFilters();
      applyDashboardGeoFilters();

      // 3. Setup Admin Referral Link
      const currentUser = App.auth.getCurrentUser();
      if (currentUser) {
        if (isMaiaOrSuperAdmin() && (!currentUser.referralCode || currentUser.referralCode.startsWith('BRK-') || currentUser.referralCode.startsWith('REA-'))) {
          currentUser.referralCode = 'ADM-INMOMAS';
        } else if (!currentUser.referralCode) {
          currentUser.referralCode = 'ADM-INMOMAS';
        }
        const referralLink = App.utils.generateReferralLink(currentUser.referralCode);
        const clientWebinarLink = App.utils.generateClientWebinarLink(currentUser.referralCode);
        const linkInput = document.getElementById('admin-dash-referral-link');
        if (linkInput) {
          linkInput.value = referralLink;
        }
        const copyBtn = document.getElementById('admin-dash-copy-link');
        if (copyBtn) {
          copyBtn.onclick = () => {
            App.utils.copyToClipboard(referralLink);
            App.utils.showToast('🔗 Enlace profesional de Administración copiado al portapapeles', 'success');
          };
        }
        const clientLinkInput = document.getElementById('admin-dash-client-webinar-link');
        if (clientLinkInput) {
          clientLinkInput.value = clientWebinarLink;
        }
        const copyClientBtn = document.getElementById('admin-dash-copy-client-link');
        if (copyClientBtn) {
          copyClientBtn.onclick = () => {
            App.utils.copyToClipboard(clientWebinarLink);
            App.utils.showToast('🎙️ Enlace exclusivo de Webinario para Clientes copiado al portapapeles', 'success');
          };
        }
        const copyEmbBtn = document.getElementById('admin-dash-copy-embajador-link');
        if (copyEmbBtn) {
          copyEmbBtn.onclick = () => {
            const embUrl = `${referralLink}&type=embajador`;
            App.utils.copyToClipboard(embUrl);
            App.utils.showToast('👑 Enlace exclusivo de postulación como Embajador copiado al portapapeles', 'success');
          };
        }
        const waEmbBtn = document.getElementById('admin-dash-wa-embajador-link');
        if (waEmbBtn) {
          waEmbBtn.onclick = () => {
            App.utils.shareEmbajadorWhatsApp(referralLink);
          };
        }
        const copyMasBtn = document.getElementById('admin-dash-copy-mas-agent-link');
        if (copyMasBtn) {
          copyMasBtn.onclick = () => {
            const masUrl = `${referralLink}&type=agent_inmomas`;
            App.utils.copyToClipboard(masUrl);
            App.utils.showToast('🇪🇸 Enlace de registro interno para Agente RE/MAX Inmomás copiado al portapapeles', 'success');
          };
        }

        // 3b. Personalized Buyer Guide on Admin Dashboard (Admin's own guide + quick switcher for any professional)
        const adminDashGuideWrap = document.getElementById('admin-dash-buyer-guide');
        if (adminDashGuideWrap && App.buyerGuide) {
          const freshAdmin = allUsers.find(u => u.id === currentUser.id) || currentUser;
          const eligibleUsers = allUsers
            .filter(u => u.id !== freshAdmin.id && ['agent_inmomas', 'embajador', 'broker', 'realtor', 'colaborador', 'admin'].includes(u.role))
            .sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));

          const roleShort = {
            admin: 'Admin',
            agent_inmomas: 'Agente Inmomás',
            embajador: 'Embajador',
            broker: 'Broker',
            realtor: 'Realtor',
            colaborador: 'Colaborador'
          };

          const selectorOpts = [
            `<option value="${App.utils.escapeHtml(freshAdmin.id)}">🛡️ Mi Guía de Administración (${App.utils.escapeHtml(`${freshAdmin.firstName || ''} ${freshAdmin.lastName || ''}`.trim() || freshAdmin.email)})</option>`,
            ...eligibleUsers.map(u => {
              const uName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id;
              const rLbl = roleShort[u.role] || u.role;
              return `<option value="${App.utils.escapeHtml(u.id)}">[${App.utils.escapeHtml(rLbl)}] ${App.utils.escapeHtml(uName)}${u.agencyName ? ' · ' + App.utils.escapeHtml(u.agencyName) : ''}</option>`;
            })
          ].join('');

          adminDashGuideWrap.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
              <div style="font-size:0.84rem; font-weight:700; color:#334155;">
                👤 <span class="lang-en">Generate / Edit Buyer's Guide for:</span><span class="lang-es">Generar / Editar Guía del Comprador para:</span>
              </div>
              <select id="admin-dash-guide-user-select" class="form-select" style="width:auto; min-width:280px; max-width:100%; padding:7px 32px 7px 12px; font-size:0.85rem; font-weight:600; border-radius:9px; margin-bottom:0;">
                ${selectorOpts}
              </select>
            </div>
            <div id="admin-dash-buyer-guide-editor"></div>
          `;

          const editorTarget = document.getElementById('admin-dash-buyer-guide-editor');
          const guideUserSel = document.getElementById('admin-dash-guide-user-select');
          const mountSelectedGuide = (selectedId) => {
            const chosen = selectedId === freshAdmin.id
              ? freshAdmin
              : (allUsers.find(u => u.id === selectedId) || freshAdmin);
            App.buyerGuide.renderEditor(editorTarget, chosen, {
              admin: chosen.id !== freshAdmin.id,
              uid: 'admin-dash-' + chosen.id
            });
          };

          mountSelectedGuide(freshAdmin.id);
          if (guideUserSel) {
            guideUserSel.onchange = (e) => mountSelectedGuide(e.target.value);
          }
        }
      }

      // 8. Check pending Contract / Fiscal Data notifications for Admin Dashboard alert & sidebar badge
      try {
        let pendingNotifs = [];
        if (!App.demoMode && App.db) {
          const snap = await App.db.collection('agreement_notifications')
            .where('status', '==', 'pending_admin')
            .get();
          snap.forEach(doc => pendingNotifs.push({ id: doc.id, ...doc.data() }));
        } else {
          pendingNotifs = (App.demoData.agreementNotifications || [])
            .filter(n => n.status === 'pending_admin');
        }
        // Also include any user who has agreementStatus === 'data_submitted' or 'uploaded' not yet in pendingNotifs
        allUsers.forEach(u => {
          if ((u.agreementStatus === 'data_submitted' || u.agreementStatus === 'uploaded') && !pendingNotifs.some(n => n.userId === u.id)) {
            pendingNotifs.push({
              id: 'user_notif_' + u.id,
              userId: u.id,
              userName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
              userRole: u.role,
              agencyName: u.agencyName || (u.contractCompanyData && u.contractCompanyData.companyLegalName) || '—',
              email: u.email,
              type: 'contract_data_submitted',
              contractCompanyData: u.contractCompanyData || null,
              uploadedAt: u.contractDataSubmittedAt || u.agreementUploadedAt || u.createdAt,
              status: 'pending_admin'
            });
          }
        });
        renderAgreementNotifications(pendingNotifs);
      } catch (notifErr) {
        console.warn('[Admin] Could not load agreement notifications on dashboard:', notifErr);
      }

      // 9. Role Notification Banner (ONLY for José Martínez, NEVER for Maia / Super Admin)
      const header = document.querySelector('#view-admin-dashboard .dashboard-header');
      if (header) {
        let banner = document.getElementById('admin-maia-approval-banner');
        if (isJoseMartinezSession()) {
          if (!banner) {
            banner = document.createElement('div');
            banner.id = 'admin-maia-approval-banner';
            banner.style.cssText = 'background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 12px 16px; margin-top: 14px; display: flex; align-items: center; gap: 12px; font-size: 0.875rem; color: #1e40af;';
            banner.innerHTML = `
              <span style="font-size: 1.4rem;">🛡️</span>
              <div>
                <strong>Sesión Administrador: José Martínez (The Spain Connection):</strong> Visualización completa activa con tu enlace de referido unificado. Cualquier cambio o aprobación de registros enviará una solicitud directa a <strong>Maia Honczaryk</strong> (<code style="background:white; padding:2px 6px; border-radius:4px; border:1px solid #dbeafe;">maia.honczaryk@remax.es</code>) para su validación.
              </div>
            `;
            header.appendChild(banner);
          }
        } else if (banner) {
          banner.remove();
        }
      }

    } catch (err) {
      console.error('[Admin] initDashboard error:', err);
      App.utils.showToast('Error loading admin dashboard.', 'error');
    }
  }

  /* ── Compact Region & Country Filter Bar on Admin Dashboard ── */
  function collectAllRawCountries() {
    const raw = [];
    (allUsers || []).forEach(u => {
      if (u.nationality) raw.push(u.nationality);
      if (u.country) raw.push(u.country);
    });
    (allClients || []).forEach(c => {
      if (c.country) raw.push(c.country);
      if (c.currentLocation) raw.push(c.currentLocation);
    });
    (dashWebinarsCache || []).forEach(w => {
      if (w.country) raw.push(w.country);
    });
    return raw;
  }

  function setupDashboardGeoFilters() {
    const regSel = document.getElementById('admin-dash-filter-region');
    const cntSel = document.getElementById('admin-dash-filter-country');
    const resetBtn = document.getElementById('admin-dash-filter-reset');
    const rawCountries = collectAllRawCountries();

    if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml) {
      regSel.innerHTML = App.utils.getRegionFilterOptionsHtml(dashRegionFilter, '🌍 Todas las Regiones', '🌍 All Regions');
      regSel.value = dashRegionFilter;
      regSel.onchange = () => {
        dashRegionFilter = regSel.value || '';
        if (dashRegionFilter && dashCountryFilter) {
          const cntReg = App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(dashCountryFilter) : '';
          if (cntReg && cntReg !== dashRegionFilter) {
            dashCountryFilter = '';
          }
        }
        if (cntSel && App.utils.getCountryFilterOptionsHtml) {
          cntSel.innerHTML = App.utils.getCountryFilterOptionsHtml(dashCountryFilter, dashRegionFilter, rawCountries);
          cntSel.value = dashCountryFilter;
        }
        applyDashboardGeoFilters();
      };
    }

    if (cntSel && App.utils && App.utils.getCountryFilterOptionsHtml) {
      cntSel.innerHTML = App.utils.getCountryFilterOptionsHtml(dashCountryFilter, dashRegionFilter, rawCountries);
      cntSel.value = dashCountryFilter;
      cntSel.onchange = () => {
        dashCountryFilter = cntSel.value || '';
        applyDashboardGeoFilters();
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        dashRegionFilter = '';
        dashCountryFilter = '';
        if (regSel) regSel.value = '';
        if (cntSel && App.utils && App.utils.getCountryFilterOptionsHtml) {
          cntSel.innerHTML = App.utils.getCountryFilterOptionsHtml('', '', rawCountries);
          cntSel.value = '';
        }
        applyDashboardGeoFilters();
      };
    }
  }

  function applyDashboardGeoFilters() {
    const reg = dashRegionFilter || '';
    const cnt = dashCountryFilter || '';
    const effectiveRegForMas = reg || (cnt && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(cnt) : '');

    const userMatches = (u) => {
      if (reg && App.utils && App.utils.getUserRegions) {
        if (!App.utils.getUserRegions(u).includes(reg)) return false;
      }
      if (cnt && App.utils && App.utils.matchesCountryFilter) {
        const nat = App.utils.getUserNationality ? App.utils.getUserNationality(u) : (u.nationality || '');
        const pool = [nat, u.country || ''].filter(Boolean).join(' / ');
        if (!App.utils.matchesCountryFilter(pool, cnt)) return false;
      }
      return true;
    };

    const recordMatches = (rec) => {
      if (reg && App.utils && App.utils.getRecordRegion) {
        if (App.utils.getRecordRegion(rec, allUsers) !== reg) return false;
      }
      if (cnt && App.utils && App.utils.matchesCountryFilter) {
        const pool = [rec.country || '', rec.currentLocation || '', rec.state || ''].filter(Boolean).join(' / ');
        if (!App.utils.matchesCountryFilter(pool, cnt)) return false;
      }
      return true;
    };

    const filteredUsers = (allUsers || []).filter(userMatches);
    const filteredClients = (allClients || []).filter(recordMatches);
    const filteredWebinars = (dashWebinarsCache || []).filter(recordMatches);
    const filteredLeads = (!reg && !cnt)
      ? (allLeads || [])
      : (allLeads || []).filter(l => {
          if (l.country || l.currentLocation || l.region) return recordMatches(l);
          return false;
        });

    const pendingUsers = filteredUsers.filter(u => u.status === 'pending');
    const activePartners = filteredUsers.filter(u =>
      ['embajador', 'broker', 'realtor', 'colaborador'].includes(u.role) &&
      (u.status === 'active' || u.status === 'approved')
    );
    const approvedBrokers = activePartners.filter(u => u.role === 'broker');
    const approvedRealtors = activePartners.filter(u => u.role === 'realtor');
    const extraRolesCount = activePartners.filter(u => u.role === 'embajador' || u.role === 'colaborador').length;

    setTextById('admin-stat-pending', pendingUsers.length);
    setTextById('admin-stat-partners', activePartners.length);
    setTextById('admin-stat-brokers', approvedBrokers.length);
    setTextById('admin-stat-realtors', approvedRealtors.length);
    setTextById('admin-stat-other-partners', extraRolesCount > 0 ? ` · +${extraRolesCount} Emb./Colab.` : '');
    setTextById('admin-stat-clients', filteredClients.length);
    setTextById('admin-stat-dash-webinar', filteredWebinars.length);
    setTextById('admin-stat-leads', filteredLeads.length);

    // Compact meta pill + reset button visibility
    const resetBtn = document.getElementById('admin-dash-filter-reset');
    if (resetBtn) {
      resetBtn.style.display = (reg || cnt) ? 'inline-flex' : 'none';
    }

    const metaEl = document.getElementById('admin-dash-geo-meta');
    if (metaEl) {
      const activeMas = (allUsers || []).filter(u => u.role === 'agent_inmomas' && (u.status === 'active' || u.status === 'approved'));
      if (!reg && !cnt) {
        metaEl.innerHTML = `🌐 <span class="lang-en">Global View</span><span class="lang-es">Vista Global</span> · 🇪🇸 ${activeMas.length} Inmomás`;
      } else {
        const regMas = effectiveRegForMas
          ? activeMas.filter(a => App.utils.getUserRegions && App.utils.getUserRegions(a).includes(effectiveRegForMas))
          : activeMas;
        const masPreview = regMas.length > 0
          ? regMas.slice(0, 3).map(a => `${App.utils.escapeHtml(a.firstName)} ${App.utils.escapeHtml((a.lastName || '').charAt(0))}.`).join(', ') + (regMas.length > 3 ? ` +${regMas.length - 3}` : '')
          : '0';
        const scopeLabel = cnt
          ? (App.utils.getCountryDisplayLabel ? App.utils.getCountryDisplayLabel(cnt, true) : cnt)
          : (App.utils.getRegionLabel ? App.utils.getRegionLabel(reg, true) : reg);
        metaEl.innerHTML = `📍 <strong>${App.utils.escapeHtml(scopeLabel)}</strong> · 🇪🇸 Inmomás: ${masPreview}`;
      }
    }

    // Update dashboard lists dynamically for the active scope
    renderPendingList(pendingUsers);
    renderDossierLeads(filteredLeads);
    const recentActivity = filteredUsers
      .filter(u => u.status === 'active' || u.status === 'approved' || u.status === 'rejected')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
    renderRecentActivity(recentActivity);
  }

  /* ── Agreement / Fiscal Data Notifications Banner on Main Admin Dashboard ── */
  function renderAgreementNotifications(notifications) {
    const badge = document.getElementById('admin-agreements-badge');
    if (badge) {
      if (notifications && notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    const bannerEl = document.getElementById('admin-contract-notifications-banner');
    if (!bannerEl) return;

    if (!notifications || notifications.length === 0) {
      bannerEl.style.display = 'none';
      bannerEl.innerHTML = '';
      return;
    }

    bannerEl.style.display = 'block';
    const itemsPreview = notifications.slice(0, 3).map(n => {
      const roleLabel = n.userRole === 'embajador' ? '👑 Embajador' : (n.userRole === 'broker' ? '🏢 Broker' : '👤 Realtor');
      const companyName = (n.contractCompanyData && n.contractCompanyData.companyLegalName) || n.agencyName || '—';
      return `<li style="margin-bottom:4px;"><strong>${App.utils.escapeHtml(n.userName)}</strong> (${roleLabel} — ${App.utils.escapeHtml(companyName)}) · <span style="color:#4b5563;">${App.utils.escapeHtml(n.email)}</span></li>`;
    }).join('');

    bannerEl.innerHTML = `
      <div class="glass-card" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; padding:1.25rem 1.5rem; background:linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%); border:1.5px solid #93c5fd; border-left:5px solid #003f99; border-radius:12px;">
        <div style="display:flex; align-items:flex-start; gap:1rem; flex:1; min-width:260px;">
          <span style="font-size:2rem; line-height:1;">🔔</span>
          <div>
            <div style="font-weight:800; color:#1e3a8a; font-size:1.02rem; margin-bottom:4px;">
              ${notifications.length} ${notifications.length === 1 ? 'Colaborador ha enviado Datos Fiscales y Bancarios para Contrato' : 'Colaboradores han enviado Datos Fiscales y Bancarios para Contrato'}
            </div>
            <p style="font-size:0.84rem; color:#374151; margin:0 0 8px;">
              Se han registrado nuevos datos fiscales de empresa y cuenta bancaria. Revisa los datos para armar el Contrato de Colaboración Conjunta de forma externa y presentárselo al Broker/Agente:
            </p>
            <ul style="margin:0; padding-left:1.2rem; font-size:0.83rem; color:#1f2937;">
              ${itemsPreview}
            </ul>
          </div>
        </div>
        <div>
          <a href="#admin/agreements" class="btn btn-primary" style="white-space:nowrap; font-weight:700; padding:0.65rem 1.25rem; border-radius:8px;">
            📋 Ver Datos y Preparar Contrato &rarr;
          </a>
        </div>
      </div>
    `;
  }

  /* ── Dossier Leads List ── */
  function renderDossierLeads(leads) {
    const container = document.getElementById('dossier-leads-table-body');
    if (!container) return;

    if (leads.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">No downloads yet.</td></tr>';
      return;
    }

    container.innerHTML = leads.map(lead => {
      const dateStr = App.utils.formatDate(lead.createdAt);
      const agentBadge = lead.localAgentId 
        ? `<span class="badge badge--approved">👤 ${App.utils.escapeHtml(lead.localAgentName)}</span>`
        : `<span class="badge badge--rejected"><span class="lang-en">Unassigned</span><span class="lang-es">Sin asignar</span></span>`;
      
      const actionBtnText = lead.localAgentId
        ? `<span class="lang-en">Reassign</span><span class="lang-es">Reasignar</span>`
        : `<span class="lang-en">Assign Agent</span><span class="lang-es">Asignar Agente</span>`;

      return `
        <tr>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${dateStr}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${App.utils.escapeHtml(lead.firstName)} ${App.utils.escapeHtml(lead.lastName)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${App.utils.escapeHtml(lead.email)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${App.utils.escapeHtml(lead.phone || '—')}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${agentBadge}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn btn-primary btn-sm" onclick="App.views.admin.showLeadAssignmentModal('${lead.id}')">
                ${actionBtnText}
              </button>
              <button class="btn btn-sm" onclick="App.views.admin.handleDeleteLead('${lead.id}')" title="Delete lead" style="background: rgba(220, 38, 38, 0.08); color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.2); padding: 6px 10px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ── Pending Applications List ── */
  function renderPendingList(pendingUsers) {
    const container = document.getElementById('admin-pending-list');
    if (!container) return;

    if (pendingUsers.length === 0) {
      App.utils.showEmptyState('admin-pending-list', 'No pending applications.', '✅');
      return;
    }

    container.innerHTML = pendingUsers.map(user => {
      const avatar = App.utils.generateAvatar(user.firstName, user.lastName);
      const roleBadge = App.utils.getRoleBadge(user.role);
      const dateStr = App.utils.formatDate(user.createdAt);

      const requestedRole = user.role;
      const defaultBorder = '#e5e7eb';
      const defaultBg = '#ffffff';

      const brokerBookmark = requestedRole === 'broker' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const realtorBookmark = requestedRole === 'realtor' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const agentInmomasBookmark = requestedRole === 'agent_inmomas' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const colaboradorBookmark = requestedRole === 'colaborador' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const embajadorBookmark = requestedRole === 'embajador' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #d97706; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      return `
        <div class="pipeline-card" style="margin-bottom: 1rem; padding: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
            ${avatar}
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; color: #111827;">
                ${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}
              </div>
              <div style="font-size: 0.8rem; color: #6b7280;">${App.utils.escapeHtml(user.email)}</div>
            </div>
            ${roleBadge}
          </div>
          <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: #6b7280; margin-bottom: 0.75rem; flex-wrap: wrap;">
            <span>🏢 ${App.utils.escapeHtml(user.agencyName || '—')}</span>
            <span>🌍 ${App.utils.escapeHtml(user.country || '—')}</span>
            <span>📅 ${dateStr}</span>
          </div>
          
          <div style="border-top: 1px solid #f3f4f6; padding-top: 1rem; margin-top: 1rem;">
            <div style="font-size: 0.8rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">Approve Application As:</div>
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <!-- Embajador Approval Card -->
              <div onclick="App.views.admin.approveWithRole('${user.id}', 'embajador')" 
                   style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${requestedRole === 'embajador' ? '#f59e0b' : defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${requestedRole === 'embajador' ? '#fffbeb' : defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                   onmouseover="this.style.borderColor='#d97706'; this.style.backgroundColor='#fffbeb'; this.style.boxShadow='0 4px 6px -1px rgba(217,119,6,0.15)';" 
                   onmouseout="this.style.borderColor='${requestedRole === 'embajador' ? '#f59e0b' : defaultBorder}'; this.style.backgroundColor='${requestedRole === 'embajador' ? '#fffbeb' : defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
                ${embajadorBookmark}
                <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">👑</div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #92400e; letter-spacing: 0.05em; text-transform: uppercase;">Embajador</div>
              </div>

              <!-- Broker Approval Card -->
              <div onclick="App.views.admin.approveWithRole('${user.id}', 'broker')" 
                   style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                   onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                   onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
                ${brokerBookmark}
                <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">🏢</div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Broker</div>
              </div>
              
              <!-- Realtor Approval Card -->
              <div onclick="App.views.admin.approveWithRole('${user.id}', 'realtor')" 
                   style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                   onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                   onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
                ${realtorBookmark}
                <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">👤</div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Realtor</div>
              </div>

              <!-- Agente Inmomás Approval Card -->
              <div onclick="App.views.admin.approveWithRole('${user.id}', 'agent_inmomas')" 
                   style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                   onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                   onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
                ${agentInmomasBookmark}
                <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">🏠</div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Agente Inmomás</div>
              </div>

              <!-- Colaborador Approval Card -->
              <div onclick="App.views.admin.approveWithRole('${user.id}', 'colaborador')" 
                   style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                   onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                   onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
                ${colaboradorBookmark}
                <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">🤝</div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Colaborador</div>
              </div>
            </div>
            
            <div style="margin-top: 0.75rem;">
              <button class="btn btn-outline btn-sm" onclick="App.views.admin.handleReject('${user.id}')" style="width: 100%; border-color: #d1d5db; color: #4b5563; background: #f3f4f6; font-weight: 500; padding: 0.5rem; border-radius: 0.375rem;">
                ✕ Reject Application
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Recent Activity Feed ── */
  function renderRecentActivity(users) {
    const container = document.getElementById('admin-recent-activity');
    if (!container) return;

    if (users.length === 0) {
      App.utils.showEmptyState('admin-recent-activity', 'No recent activity.', '📭');
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${users.map(user => {
          const statusBadge = App.utils.getUserStatusBadge(user.status);
          const dateStr = App.utils.formatDateRelative(user.updatedAt || user.createdAt);
          const icon = user.status === 'active' ? '✅' : '❌';

          return `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">
              <span style="font-size: 1.25rem;">${icon}</span>
              <div style="flex: 1; min-width: 0;">
                <span style="font-weight: 500;">${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</span>
                <span style="color: #6b7280; font-size: 0.8rem;"> — ${App.utils.escapeHtml(user.agencyName || '')}</span>
              </div>
              ${statusBadge}
              <span style="font-size: 0.75rem; color: #9ca3af; white-space: nowrap;">${dateStr}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ============================================
     initUsers()
     Populates #view-admin-users with a filterable
     and searchable user management table.
     ============================================ */
  async function initUsers() {
    try {
      // 1. Load all users, webinar registrations & clients in parallel
      const [loadedUsers, webinarRegs, loadedClients] = await Promise.all([
        App.auth.getAllUsers(),
        App.auth.getWebinarRegistrations(),
        App.auth.getClients()
      ]);
      allUsers = loadedUsers || [];
      allClients = loadedClients || [];

      // Attach webinar registration status
      allUsers.forEach(u => {
        u.isWebinarRegistered = (webinarRegs || []).some(r => (r.email || '').toLowerCase() === (u.email || '').toLowerCase());
      });

      // Populate RE/MAX Inmomás Agent Filter
      const inmomasFilterSel = document.getElementById('admin-filter-inmomas-agent');
      if (inmomasFilterSel) {
        const prevVal = inmomasFilterSel.value || '';
        const activeInmomas = allUsers
          .filter(u => u.role === 'agent_inmomas' && (u.status === 'active' || u.status === 'approved'))
          .sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));
        inmomasFilterSel.innerHTML = `
          <option value="">🇪🇸 Todos los Agentes Inmomás</option>
          <option value="__unassigned__" ${prevVal === '__unassigned__' ? 'selected' : ''}>⚠️ Sin Agente Inmomás asignado</option>
          ${activeInmomas.map(a => {
            const label = `${a.firstName || ''} ${a.lastName || ''}`.trim();
            return `<option value="${a.id}" ${prevVal === a.id ? 'selected' : ''}>🇪🇸 ${App.utils.escapeHtml(label)}</option>`;
          }).join('')}
        `;
        inmomasFilterSel.onchange = handleFilters;
      }

      // Populate Region & Country Filters
      const regionSelect = document.getElementById('admin-filter-region');
      const countrySelect = document.getElementById('admin-filter-country');
      const rawUserCountries = [];
      allUsers.forEach(u => {
        const nat = App.utils.getUserNationality ? App.utils.getUserNationality(u) : (u.nationality || '');
        if (nat && nat !== '—') rawUserCountries.push(nat.trim());
        if (u.country && u.country !== '—') rawUserCountries.push(u.country.trim());
      });

      const initRegVal = pendingAdminRegionFilter || (regionSelect ? regionSelect.value : '') || '';
      const initCountryVal = pendingAdminCountryFilter || (countrySelect ? countrySelect.value : '') || '';
      pendingAdminRegionFilter = '';
      pendingAdminCountryFilter = '';

      if (regionSelect && App.utils && App.utils.getRegionFilterOptionsHtml) {
        regionSelect.innerHTML = App.utils.getRegionFilterOptionsHtml(initRegVal);
        regionSelect.value = initRegVal;
        regionSelect.onchange = () => {
          const newReg = regionSelect.value || '';
          if (countrySelect && App.utils.getCountryFilterOptionsHtml) {
            let curCnt = countrySelect.value || '';
            if (newReg && curCnt && App.utils.resolveRegionFromCountry && App.utils.resolveRegionFromCountry(curCnt) !== newReg) {
              curCnt = '';
            }
            countrySelect.innerHTML = App.utils.getCountryFilterOptionsHtml(curCnt, newReg, rawUserCountries, '🏳️ Todos los Países / Nacionalidades', '🏳️ All Countries / Nationalities');
            countrySelect.value = curCnt;
          }
          handleFilters();
        };
      }

      if (countrySelect && App.utils && App.utils.getCountryFilterOptionsHtml) {
        countrySelect.innerHTML = App.utils.getCountryFilterOptionsHtml(initCountryVal, initRegVal, rawUserCountries, '🏳️ Todos los Países / Nacionalidades', '🏳️ All Countries / Nationalities');
        countrySelect.value = initCountryVal;
        countrySelect.onchange = handleFilters;
      }

      // 2. Bind filter and search handlers + render
      bindFilterRole();
      bindFilterStatus();
      bindSearchInput();
      setUsersViewMode(currentUsersViewMode, false);
      handleFilters();

      // 4. Role Notification Banner (ONLY for José Martínez, NEVER for Maia / Super Admin)
      const header = document.querySelector('#view-admin-users .dashboard-header');
      if (header) {
        let banner = document.getElementById('admin-users-maia-banner');
        if (isJoseMartinezSession()) {
          if (!banner) {
            banner = document.createElement('div');
            banner.id = 'admin-users-maia-banner';
            banner.style.cssText = 'background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 10px 14px; margin-top: 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #1e40af; width: 100%;';
            banner.innerHTML = `
              <span style="font-size: 1.2rem;">🛡️</span>
              <div>
                <strong>Modo Administrador: José Martínez (The Spain Connection):</strong> Visualización completa activa. Las aprobaciones, rechazos o cambios de rol requerirán validación directa de <strong>Maia Honczaryk</strong> (<code style="background:white; padding:2px 6px; border-radius:4px; border:1px solid #dbeafe;">maia.honczaryk@remax.es</code>).
              </div>
            `;
            header.parentNode.insertBefore(banner, header.nextSibling);
          }
        } else if (banner) {
          banner.remove();
        }
      }

    } catch (err) {
      console.error('[Admin] initUsers error:', err);
      const tbody = document.getElementById('admin-users-table-body');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 3rem; color: #dc2626;">
              <div class="empty-state">
                <div class="empty-state__icon" style="font-size: 2.5rem; margin-bottom: 8px;">⚠️</div>
                <p class="empty-state__text" style="font-weight: 700; font-size: 1.1rem; color: #111827; margin: 0;">Error Loading Users</p>
                <p style="font-size: 0.85rem; color: #ef4444; margin-top: 8px; font-family: monospace; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.4;">${err.message || err}</p>
                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 12px;">Please check your browser developer tools console and your Firebase database credentials.</p>
              </div>
            </td>
          </tr>
        `;
      }
      App.utils.showToast('Error loading user management.', 'error');
    }
  }

  /* ── Render Users Table ── */
  function renderUsersTable(users) {
    filteredUsersCache = users || [];
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    const countSpan = document.getElementById('admin-user-count');
    if (countSpan) {
      countSpan.textContent = users.length;
    }

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 2rem;">
            <div class="empty-state">
              <div class="empty-state__icon">🔍</div>
              <p class="empty-state__text">No users match your filters.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(user => {
      const avatar = App.utils.generateAvatar(user.firstName, user.lastName, 'sm');
      const roleBadge = App.utils.getRoleBadge(user.role);
      const statusBadge = App.utils.getUserStatusBadge(user.status);
      const dateStr = App.utils.formatDate(user.createdAt);

      // Build action buttons based on status
      let actions = `
        <button class="btn btn-outline btn-sm" onclick="App.views.admin.viewUser('${user.id}')" title="View">
          👁
        </button>
      `;

      if (user.status === 'pending') {
        actions += `
          <button class="btn btn-primary btn-sm" onclick="App.views.admin.handleApprove('${user.id}')" title="Approve" style="margin-left: 0.25rem;">
            ✓
          </button>
          <button class="btn btn-danger btn-sm" onclick="App.views.admin.handleReject('${user.id}')" title="Reject" style="margin-left: 0.25rem;">
            ✕
          </button>
        `;
      } else if (user.status === 'active' && user.role !== 'admin') {
        actions += `
          <button class="btn btn-danger btn-sm" onclick="App.views.admin.handleReject('${user.id}')" title="Reject" style="margin-left: 0.25rem;">
            ✕
          </button>
        `;
      } else if (user.status === 'rejected') {
        actions += `
          <button class="btn btn-primary btn-sm" onclick="App.views.admin.handleApprove('${user.id}')" title="Re-approve" style="margin-left: 0.25rem;">
            ✓
          </button>
        `;
      }

      // Add Delete Button for all users
      actions += `
        <button class="btn btn-danger btn-sm" onclick="App.views.admin.handleDeleteUser('${user.id}')" title="Delete User" style="margin-left: 0.25rem; background-color: #dc2626; border-color: #dc2626; color: white;">
          🗑️
        </button>
      `;

      const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
      const parents = App.utils.resolveUserUmbrellaParents ? App.utils.resolveUserUmbrellaParents(user, allUsers, lookupMaps) : { embajador: null, broker: null };
      const chainParts = [];
      if (parents.embajador && parents.embajador.id !== user.id) {
        chainParts.push(`<span class="umbrella-chain-pill umbrella-chain-pill--embajador">👑 ${App.utils.escapeHtml(parents.embajador.firstName || '')} ${App.utils.escapeHtml(parents.embajador.lastName || '')}</span>`);
      }
      if (parents.broker && parents.broker.id !== user.id) {
        const brkLabel = parents.broker.agencyName || `${parents.broker.firstName || ''} ${parents.broker.lastName || ''}`.trim();
        chainParts.push(`<span class="umbrella-chain-pill umbrella-chain-pill--broker">🏢 ${App.utils.escapeHtml(brkLabel)}</span>`);
      }

      let sourceStr = '';
      if (chainParts.length > 0) {
        sourceStr = `<div class="umbrella-chain-pills" style="margin-bottom:4px;">${chainParts.join('<span style="color:#94a3b8;font-size:0.72rem;">➔</span>')}</div>`;
      } else {
        const fallbackLabel = user.source ? App.utils.escapeHtml(user.source) : 'Directo';
        sourceStr = `<div style="font-size:0.76rem; color:#64748b; margin-bottom:4px;">${fallbackLabel}</div>`;
      }
      if (user.role !== 'admin' && user.role !== 'agent_inmomas' && App.utils.renderInmomasAgentBadge) {
        sourceStr += `<div>${App.utils.renderInmomasAgentBadge(user, allUsers, { showUnassigned: true, maps: lookupMaps })}</div>`;
      }

      const webinarStr = user.isWebinarRegistered 
        ? '<span style="color:#10b981; font-weight:bold;">Yes ✓</span>' 
        : '<span style="color:#9ca3af;">No</span>';

      const agencyLogoHtml = user.agencyLogo
        ? `<img src="${App.utils.escapeHtml(user.agencyLogo)}" alt="Logo" title="Logo de agencia configurado para el Referral Link" style="height: 22px; max-width: 64px; object-fit: contain; border-radius: 4px; border: 1px solid #e5e7eb; background: #fff; padding: 2px; vertical-align: middle; margin-right: 0.4rem;">`
        : '';

      const userNat = App.utils.getUserNationality ? App.utils.getUserNationality(user) : (user.nationality || user.country || '');
      const regionBadgesHtml = App.utils.getUserRegionBadgesHtml ? App.utils.getUserRegionBadgesHtml(user) : '';
      const natSubHtml = userNat
        ? `<div style="font-size:0.75rem; color:#475569; margin-top:3px; font-weight:600;">🏳️ ${App.utils.escapeHtml(userNat)}${user.country && user.country !== userNat ? ` <span style="color:#94a3b8;">(${App.utils.escapeHtml(user.country)})</span>` : ''}</div>`
        : '';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              ${avatar}
              <span style="font-weight: 500;">${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</span>
            </div>
          </td>
          <td>${App.utils.escapeHtml(user.email)}</td>
          <td><div style="display: flex; align-items: center;">${agencyLogoHtml}<span>${App.utils.escapeHtml(user.agencyName || '—')}</span></div></td>
          <td>${roleBadge}</td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">${regionBadgesHtml}</div>
            ${natSubHtml}
          </td>
          <td>${statusBadge}</td>
          <td>${webinarStr}</td>
          <td>${sourceStr}</td>
          <td>${dateStr}</td>
          <td>
            <div style="display: flex; align-items: center;">${actions}</div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ── Filter: Role ── */
  function bindFilterRole() {
    const select = document.getElementById('admin-filter-role');
    if (!select) return;

    select.removeEventListener('change', handleFilters);
    select.addEventListener('change', handleFilters);
  }

  /* ── Filter: Status ── */
  function bindFilterStatus() {
    const select = document.getElementById('admin-filter-status');
    if (!select) return;

    select.removeEventListener('change', handleFilters);
    select.addEventListener('change', handleFilters);
  }

  /* ── Search Input ── */
  function bindSearchInput() {
    const input = document.getElementById('admin-search-input');
    if (!input) return;

    const debouncedFilter = App.utils.debounce(handleFilters, 250);
    input.removeEventListener('input', debouncedFilter);
    input.addEventListener('input', debouncedFilter);
  }

  /* ── View Mode Switch & Accordion Controls ── */
  function setUsersViewMode(mode, reRender = true) {
    currentUsersViewMode = mode === 'table' ? 'table' : 'umbrella';
    const umbContainer = document.getElementById('admin-users-umbrella-container');
    const tblWrap = document.getElementById('admin-users-table-wrap');
    const expControls = document.getElementById('admin-umbrella-expand-controls');
    const btnUmb = document.getElementById('btn-admin-users-mode-umbrella');
    const btnTbl = document.getElementById('btn-admin-users-mode-table');

    if (umbContainer) umbContainer.style.display = currentUsersViewMode === 'umbrella' ? 'flex' : 'none';
    if (tblWrap) tblWrap.style.display = currentUsersViewMode === 'table' ? 'block' : 'none';
    if (expControls) expControls.style.display = currentUsersViewMode === 'umbrella' ? 'inline-flex' : 'none';
    if (btnUmb) btnUmb.classList.toggle('active', currentUsersViewMode === 'umbrella');
    if (btnTbl) btnTbl.classList.toggle('active', currentUsersViewMode === 'table');

    if (reRender) handleFilters();
  }

  function toggleUmbrellaNode(nodeId) {
    if (!nodeId) return;
    const domEl = document.getElementById(`adm-umb-node-${nodeId}`);
    if (expandedAdminNodes.has(nodeId)) {
      expandedAdminNodes.delete(nodeId);
      if (domEl) domEl.classList.remove('is-open');
    } else {
      expandedAdminNodes.add(nodeId);
      if (domEl) domEl.classList.add('is-open');
    }
  }

  function expandAllUmbrellas(expand) {
    const container = document.getElementById('admin-users-umbrella-container');
    if (!container) return;
    const nodes = container.querySelectorAll('[data-umb-node]');
    nodes.forEach(el => {
      const id = el.getAttribute('data-umb-node');
      if (expand) {
        expandedAdminNodes.add(id);
        el.classList.add('is-open');
      } else {
        expandedAdminNodes.delete(id);
        el.classList.remove('is-open');
      }
    });
  }

  function buildAdminQuickActions(user) {
    let html = `
      <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); App.views.admin.viewUser('${user.id}')" title="Ver / Asignar Paraguas o Agente Inmomás">
        👁
      </button>
    `;
    if (user.status === 'pending') {
      html += `
        <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); App.views.admin.handleApprove('${user.id}')" title="Aprobar">✓</button>
        <button type="button" class="btn btn-danger btn-sm" onclick="event.stopPropagation(); App.views.admin.handleReject('${user.id}')" title="Rechazar">✕</button>
      `;
    } else if (user.status === 'rejected') {
      html += `
        <button type="button" class="btn btn-primary btn-sm" onclick="event.stopPropagation(); App.views.admin.handleApprove('${user.id}')" title="Re-aprobar">✓</button>
      `;
    }
    return html;
  }

  function countDirectClientsForUser(user) {
    if (!user || !allClients || !allClients.length) return 0;
    const uCode = user.referralCode ? String(user.referralCode).toUpperCase().trim() : '';
    return allClients.filter(c => {
      if (!c) return false;
      const cRef = c.referredBy ? String(c.referredBy).toUpperCase().trim() : '';
      return c.realtorId === user.id ||
             c.brokerId === user.id ||
             c.embajadorId === user.id ||
             c.referredBy === user.id ||
             (uCode && cRef === uCode);
    }).length;
  }

  function renderAdminLeafCard(u, lookupMaps) {
    const isColab = u.role === 'colaborador';
    const roleIcon = isColab ? '🤝' : '🏠';
    const roleLabel = isColab ? 'Colaborador' : 'Realtor';
    const clientCnt = countDirectClientsForUser(u);
    const statusBadge = App.utils.getUserStatusBadge(u.status);
    const inmomasBadge = App.utils.renderInmomasAgentBadge
      ? App.utils.renderInmomasAgentBadge(u, allUsers, { showUnassigned: true, compact: true, maps: lookupMaps })
      : '';
    const subMeta = [u.agencyName, u.country].filter(Boolean).join(' · ');

    return `
      <div class="umbrella-leaf ${isColab ? 'umbrella-leaf--colaborador' : ''}">
        <div style="min-width:0; flex:1;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-weight:700; color:#0f172a;">${roleIcon} ${App.utils.escapeHtml(u.firstName || '')} ${App.utils.escapeHtml(u.lastName || '')}</span>
            <span style="font-size:0.7rem; font-weight:700; color:#475569; background:#f1f5f9; padding:1px 6px; border-radius:999px;">${roleLabel}</span>
            ${statusBadge}
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:2px; overflow:hidden; text-overflow:ellipsis;">
            ${App.utils.escapeHtml(u.email || '—')}${subMeta ? ` · ${App.utils.escapeHtml(subMeta)}` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:5px;">
            ${inmomasBadge}
            ${clientCnt > 0 ? `<span class="umbrella-kpi-pill umbrella-kpi-pill--clients" style="font-size:0.7rem; padding:1px 7px;">🏡 ${clientCnt} clientes</span>` : ''}
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
          ${buildAdminQuickActions(u)}
        </div>
      </div>
    `;
  }

  function renderUsersUmbrellaAccordion(filteredUsers, hasActiveFilter = false) {
    const container = document.getElementById('admin-users-umbrella-container');
    if (!container) return;

    if (!filteredUsers || filteredUsers.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem 1.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:12px;">
          <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
          <div style="font-weight:700; color:#0f172a;"><span class="lang-en">No users or umbrellas match your filters</span><span class="lang-es">Ningún usuario o paraguas coincide con los filtros</span></div>
        </div>
      `;
      return;
    }

    const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
    const filteredIds = new Set(filteredUsers.map(u => u.id));

    // Resolve parents for every user in the system so full hierarchy context is preserved
    const parentInfoById = new Map();
    allUsers.forEach(u => {
      const p = App.utils.resolveUserUmbrellaParents
        ? App.utils.resolveUserUmbrellaParents(u, allUsers, lookupMaps)
        : { embajador: null, broker: null, directParent: null };
      parentInfoById.set(u.id, p);
    });

    // 1. Embajadores section
    const allEmbajadores = allUsers.filter(u => u.role === 'embajador');
    const embajadorCards = [];

    allEmbajadores.forEach(emb => {
      // Find all members belonging to this Embajador
      const embMembers = allUsers.filter(u => {
        if (u.id === emb.id || !['broker', 'realtor', 'colaborador'].includes(u.role)) return false;
        const p = parentInfoById.get(u.id);
        return p && p.embajador && p.embajador.id === emb.id;
      });

      const matchingMembers = embMembers.filter(m => filteredIds.has(m.id));
      const embMatchesSelf = filteredIds.has(emb.id);

      if (!embMatchesSelf && matchingMembers.length === 0) return;

      // If Embajador itself matched (e.g. searching Embajador name or no filter), show all their members unless role/status filter narrows children
      const visibleMembers = hasActiveFilter && !embMatchesSelf ? matchingMembers : (hasActiveFilter ? matchingMembers : embMembers);
      const brokersUnderEmb = embMembers.filter(m => m.role === 'broker');
      const visibleBrokers = visibleMembers.filter(m => m.role === 'broker');

      // Include brokers that have matching realtors even if broker itself didn't match search
      const brokerIdsToRender = new Set(visibleBrokers.map(b => b.id));
      visibleMembers.forEach(m => {
        if (m.role !== 'broker') {
          const p = parentInfoById.get(m.id);
          if (p && p.broker && brokersUnderEmb.some(b => b.id === p.broker.id)) {
            brokerIdsToRender.add(p.broker.id);
          }
        }
      });

      const brokersToShow = brokersUnderEmb.filter(b => brokerIdsToRender.has(b.id));
      const directLeafs = visibleMembers.filter(m => {
        if (m.role === 'broker') return false;
        const p = parentInfoById.get(m.id);
        return !(p && p.broker && brokersUnderEmb.some(b => b.id === p.broker.id));
      });

      const totalRealtors = embMembers.filter(m => m.role === 'realtor').length;
      const totalColabs = embMembers.filter(m => m.role === 'colaborador').length;
      const memberIdSet = new Set([emb.id, ...embMembers.map(m => m.id)]);
      const memberCodeSet = new Set([emb.referralCode, ...embMembers.map(m => m.referralCode)].filter(Boolean).map(c => String(c).toUpperCase().trim()));
      const totalEmbClients = (allClients || []).filter(c => {
        if (!c) return false;
        const cRef = c.referredBy ? String(c.referredBy).toUpperCase().trim() : '';
        return (c.embajadorId && memberIdSet.has(c.embajadorId)) ||
               (c.brokerId && memberIdSet.has(c.brokerId)) ||
               (c.realtorId && memberIdSet.has(c.realtorId)) ||
               (c.referredBy && (memberIdSet.has(c.referredBy) || (cRef && memberCodeSet.has(cRef))));
      }).length;

      const nodeId = `emb-${emb.id}`;
      if (!adminUmbrellaInitialized && embMembers.length > 0 && embajadorCards.length < 2) {
        expandedAdminNodes.add(nodeId);
      }
      const isOpen = hasActiveFilter ? true : expandedAdminNodes.has(nodeId);

      const embAvatar = App.utils.generateAvatar(emb.firstName, emb.lastName, 'sm');
      const embInmomasBadge = App.utils.renderInmomasAgentBadge
        ? App.utils.renderInmomasAgentBadge(emb, allUsers, { showUnassigned: true, maps: lookupMaps })
        : '';
      const embRegBadges = App.utils.getUserRegionBadgesHtml ? App.utils.getUserRegionBadgesHtml(emb) : '';

      const subBrokersHtml = brokersToShow.map(brk => {
        const brkNodeId = `brk-${brk.id}`;
        const allBrkTeam = embMembers.filter(m => {
          if (m.role === 'broker') return false;
          const p = parentInfoById.get(m.id);
          return p && p.broker && p.broker.id === brk.id;
        });
        const shownBrkTeam = (hasActiveFilter && !filteredIds.has(brk.id))
          ? allBrkTeam.filter(m => filteredIds.has(m.id))
          : allBrkTeam;
        const brkClients = countDirectClientsForUser(brk) + allBrkTeam.reduce((acc, r) => acc + countDirectClientsForUser(r), 0);
        const brkInmomasBadge = App.utils.renderInmomasAgentBadge
          ? App.utils.renderInmomasAgentBadge(brk, allUsers, { showUnassigned: true, compact: true, maps: lookupMaps })
          : '';
        const brkOpen = hasActiveFilter ? true : expandedAdminNodes.has(brkNodeId);
        const logoHtml = brk.agencyLogo
          ? `<img src="${App.utils.escapeHtml(brk.agencyLogo)}" alt="" style="height:20px; max-width:56px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; background:#fff; padding:1px;">`
          : '';

        return `
          <div class="umbrella-subcard ${brkOpen ? 'is-open' : ''}" id="adm-umb-node-${brkNodeId}" data-umb-node="${brkNodeId}">
            <div class="umbrella-subcard__header" onclick="App.views.admin.toggleUmbrellaNode('${brkNodeId}')">
              <div style="display:flex; align-items:center; gap:8px; min-width:200px; flex:1; flex-wrap:wrap;">
                <span class="umbrella-chevron">▶</span>
                <span class="umbrella-chain-pill umbrella-chain-pill--broker">🏢 Broker</span>
                ${logoHtml}
                <strong style="font-size:0.88rem; color:#0f172a;">${App.utils.escapeHtml(brk.firstName || '')} ${App.utils.escapeHtml(brk.lastName || '')}</strong>
                ${brk.agencyName ? `<span style="font-size:0.8rem; color:#475569; font-weight:600;">· ${App.utils.escapeHtml(brk.agencyName)}</span>` : ''}
                ${brk.country ? `<span style="font-size:0.75rem; color:#64748b;">(${App.utils.escapeHtml(brk.country)})</span>` : ''}
                ${App.utils.getUserStatusBadge(brk.status)}
              </div>
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                ${brkInmomasBadge}
                <span class="umbrella-kpi-pill">🏠 ${allBrkTeam.length} Realtors</span>
                <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${brkClients} Clientes</span>
                ${buildAdminQuickActions(brk)}
              </div>
            </div>
            <div class="umbrella-subcard__body">
              ${shownBrkTeam.length > 0
                ? `<div class="umbrella-leaf-grid">${shownBrkTeam.map(r => renderAdminLeafCard(r, lookupMaps)).join('')}</div>`
                : `<div style="font-size:0.8rem; color:#64748b; padding:4px 2px;"><span class="lang-en">No realtors registered under this Broker yet.</span><span class="lang-es">Aún no hay realtors registrados bajo este Broker.</span></div>`
              }
            </div>
          </div>
        `;
      }).join('');

      const directLeafsHtml = directLeafs.length > 0 ? `
        <div style="margin-top:${brokersToShow.length > 0 ? '6px' : '0'};">
          <div style="font-size:0.76rem; font-weight:700; color:#92400e; margin-bottom:6px;">
            ↳ <span class="lang-en">Direct under Ambassador (No intermediate Broker) — ${directLeafs.length}</span><span class="lang-es">Directos del Embajador (Nivel 1, sin Broker intermedio) — ${directLeafs.length}</span>
          </div>
          <div class="umbrella-leaf-grid">
            ${directLeafs.map(d => renderAdminLeafCard(d, lookupMaps)).join('')}
          </div>
        </div>
      ` : '';

      const emptyEmbBody = (brokersToShow.length === 0 && directLeafs.length === 0)
        ? `<div style="font-size:0.82rem; color:#64748b; padding:4px 0;"><span class="lang-en">No Brokers or Realtors under this Ambassador umbrella yet.</span><span class="lang-es">Aún no hay Brokers ni Agentes registrados bajo el paraguas de este Embajador.</span></div>`
        : '';

      embajadorCards.push(`
        <div class="umbrella-card umbrella-card--embajador ${isOpen ? 'is-open' : ''}" id="adm-umb-node-${nodeId}" data-umb-node="${nodeId}">
          <div class="umbrella-card__header" onclick="App.views.admin.toggleUmbrellaNode('${nodeId}')">
            <div class="umbrella-card__left">
              <span class="umbrella-chevron">▶</span>
              ${embAvatar}
              <div class="umbrella-card__identity">
                <div class="umbrella-card__title-row">
                  <span class="umbrella-chain-pill umbrella-chain-pill--embajador">👑 Embajador</span>
                  <span class="umbrella-card__name">${App.utils.escapeHtml(emb.firstName || '')} ${App.utils.escapeHtml(emb.lastName || '')}</span>
                  ${App.utils.getUserStatusBadge(emb.status)}
                  ${embRegBadges}
                </div>
                <div class="umbrella-card__meta">
                  <span>✉️ ${App.utils.escapeHtml(emb.email || '—')}</span>
                  ${emb.agencyName ? `<span>· 🏢 ${App.utils.escapeHtml(emb.agencyName)}</span>` : ''}
                  ${emb.country ? `<span>· 🏳️ ${App.utils.escapeHtml(emb.country)}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="umbrella-card__right">
              ${embInmomasBadge}
              <span class="umbrella-kpi-pill">🏢 ${brokersUnderEmb.length} Brokers</span>
              <span class="umbrella-kpi-pill">🏠 ${totalRealtors} Agentes</span>
              ${totalColabs > 0 ? `<span class="umbrella-kpi-pill">🤝 ${totalColabs} Colab.</span>` : ''}
              <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${totalEmbClients} Clientes</span>
              ${buildAdminQuickActions(emb)}
            </div>
          </div>
          <div class="umbrella-card__body">
            <div class="umbrella-branch">
              ${subBrokersHtml}
              ${directLeafsHtml}
              ${emptyEmbBody}
            </div>
          </div>
        </div>
      `);
    });

    // 2. Direct / Independent Brokers (NOT under an Embajador)
    const directBrokers = allUsers.filter(u => {
      if (u.role !== 'broker') return false;
      const p = parentInfoById.get(u.id);
      return !(p && p.embajador);
    });

    const brokerCards = [];
    directBrokers.forEach(brk => {
      const teamMembers = allUsers.filter(u => {
        if (u.id === brk.id || !['realtor', 'colaborador'].includes(u.role)) return false;
        const p = parentInfoById.get(u.id);
        return p && p.broker && p.broker.id === brk.id && !p.embajador;
      });

      const matchingTeam = teamMembers.filter(m => filteredIds.has(m.id));
      const brkMatchesSelf = filteredIds.has(brk.id);
      if (!brkMatchesSelf && matchingTeam.length === 0) return;

      const shownTeam = (hasActiveFilter && !brkMatchesSelf) ? matchingTeam : (hasActiveFilter ? matchingTeam : teamMembers);
      const totalClients = countDirectClientsForUser(brk) + teamMembers.reduce((acc, m) => acc + countDirectClientsForUser(m), 0);

      const nodeId = `dirbrk-${brk.id}`;
      const isOpen = hasActiveFilter ? true : expandedAdminNodes.has(nodeId);
      const brkAvatar = App.utils.generateAvatar(brk.firstName, brk.lastName, 'sm');
      const brkInmomasBadge = App.utils.renderInmomasAgentBadge
        ? App.utils.renderInmomasAgentBadge(brk, allUsers, { showUnassigned: true, maps: lookupMaps })
        : '';
      const brkRegBadges = App.utils.getUserRegionBadgesHtml ? App.utils.getUserRegionBadgesHtml(brk) : '';
      const logoHtml = brk.agencyLogo
        ? `<img src="${App.utils.escapeHtml(brk.agencyLogo)}" alt="" style="height:22px; max-width:64px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; background:#fff; padding:2px;">`
        : '';

      brokerCards.push(`
        <div class="umbrella-card umbrella-card--broker ${isOpen ? 'is-open' : ''}" id="adm-umb-node-${nodeId}" data-umb-node="${nodeId}">
          <div class="umbrella-card__header" onclick="App.views.admin.toggleUmbrellaNode('${nodeId}')">
            <div class="umbrella-card__left">
              <span class="umbrella-chevron">▶</span>
              ${brkAvatar}
              <div class="umbrella-card__identity">
                <div class="umbrella-card__title-row">
                  <span class="umbrella-chain-pill umbrella-chain-pill--broker">🏢 Broker Directo</span>
                  ${logoHtml}
                  <span class="umbrella-card__name">${App.utils.escapeHtml(brk.firstName || '')} ${App.utils.escapeHtml(brk.lastName || '')}</span>
                  ${brk.agencyName ? `<span style="font-weight:700; color:#003da5; font-size:0.86rem;">— ${App.utils.escapeHtml(brk.agencyName)}</span>` : ''}
                  ${App.utils.getUserStatusBadge(brk.status)}
                  ${brkRegBadges}
                </div>
                <div class="umbrella-card__meta">
                  <span>✉️ ${App.utils.escapeHtml(brk.email || '—')}</span>
                  ${brk.country ? `<span>· 🏳️ ${App.utils.escapeHtml(brk.country)}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="umbrella-card__right">
              ${brkInmomasBadge}
              <span class="umbrella-kpi-pill">🏠 ${teamMembers.length} Realtors</span>
              <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${totalClients} Clientes</span>
              ${buildAdminQuickActions(brk)}
            </div>
          </div>
          <div class="umbrella-card__body">
            <div class="umbrella-branch">
              ${shownTeam.length > 0
                ? `<div class="umbrella-leaf-grid">${shownTeam.map(r => renderAdminLeafCard(r, lookupMaps)).join('')}</div>`
                : `<div style="font-size:0.82rem; color:#64748b;"><span class="lang-en">No realtors registered in this Broker office yet.</span><span class="lang-es">Aún no hay realtors registrados bajo esta oficina Broker.</span></div>`
              }
            </div>
          </div>
        </div>
      `);
    });

    // 3. Standalone Realtors & Colaboradores (no Embajador & no Broker) — grouped by Assigned RE/MAX Inmomás Agent!
    const standalonePartners = filteredUsers.filter(u => {
      if (!['realtor', 'colaborador'].includes(u.role)) return false;
      const p = parentInfoById.get(u.id);
      return !(p && (p.embajador || p.broker));
    });

    const standaloneGroupCards = [];
    if (standalonePartners.length > 0) {
      const byAgentMap = new Map();
      standalonePartners.forEach(u => {
        const res = App.utils.resolveAssignedInmomasAgent
          ? App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps)
          : { id: null, name: '' };
        const key = res.name ? (res.id || res.name) : '__unassigned__';
        if (!byAgentMap.has(key)) {
          byAgentMap.set(key, {
            key,
            label: res.name || '',
            isUnassigned: !res.name,
            members: []
          });
        }
        byAgentMap.get(key).members.push(u);
      });

      const sortedGroups = Array.from(byAgentMap.values()).sort((a, b) => {
        if (a.isUnassigned && !b.isUnassigned) return 1;
        if (!a.isUnassigned && b.isUnassigned) return -1;
        return a.label.localeCompare(b.label);
      });

      sortedGroups.forEach(grp => {
        const safeKey = String(grp.key).replace(/[^a-zA-Z0-9_-]/g, '_');
        const nodeId = `indgrp-${safeKey}`;
        const isOpen = hasActiveFilter ? true : expandedAdminNodes.has(nodeId);
        const totalClients = grp.members.reduce((sum, m) => sum + countDirectClientsForUser(m), 0);
        const headerBadge = grp.isUnassigned
          ? `<span class="inmomas-agent-pill inmomas-agent-pill--unassigned">⚠️ Sin Agente RE/MAX Inmomás asignado</span>`
          : `<span class="inmomas-agent-pill">🇪🇸 Paraguas Directo Inmomás: ${App.utils.escapeHtml(grp.label)}</span>`;

        standaloneGroupCards.push(`
          <div class="umbrella-card ${grp.isUnassigned ? 'umbrella-card--direct' : 'umbrella-card--inmomas'} ${isOpen ? 'is-open' : ''}" id="adm-umb-node-${nodeId}" data-umb-node="${nodeId}">
            <div class="umbrella-card__header" onclick="App.views.admin.toggleUmbrellaNode('${nodeId}')">
              <div class="umbrella-card__left">
                <span class="umbrella-chevron">▶</span>
                <div class="umbrella-card__identity">
                  <div class="umbrella-card__title-row">
                    ${headerBadge}
                    <span style="font-size:0.82rem; color:#475569; font-weight:600;">
                      <span class="lang-en">Independent Realtors &amp; Collaborators</span>
                      <span class="lang-es">Realtors y Colaboradores Independientes</span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="umbrella-card__right">
                <span class="umbrella-kpi-pill">👥 ${grp.members.length} Profesionales</span>
                <span class="umbrella-kpi-pill umbrella-kpi-pill--clients">🏡 ${totalClients} Clientes</span>
              </div>
            </div>
            <div class="umbrella-card__body">
              <div class="umbrella-leaf-grid">
                ${grp.members.map(m => renderAdminLeafCard(m, lookupMaps)).join('')}
              </div>
            </div>
          </div>
        `);
      });
    }

    // 4. Internal RE/MAX Inmomás Team & Admins (when visible in filter)
    const internalTeam = filteredUsers.filter(u => u.role === 'agent_inmomas' || u.role === 'admin');
    let internalHtml = '';
    if (internalTeam.length > 0) {
      const nodeId = 'internal-inmomas-team';
      const isOpen = hasActiveFilter && document.getElementById('admin-filter-role')?.value === 'agent_inmomas'
        ? true
        : expandedAdminNodes.has(nodeId);
      internalHtml = `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🇪🇸 <span class="lang-en">Internal RE/MAX Inmomás Team &amp; Administration</span><span class="lang-es">Equipo Interno RE/MAX Inmomás y Administración</span></span>
            <span class="umbrella-kpi-pill">${internalTeam.length}</span>
          </div>
          <div class="umbrella-card umbrella-card--inmomas ${isOpen ? 'is-open' : ''}" id="adm-umb-node-${nodeId}" data-umb-node="${nodeId}">
            <div class="umbrella-card__header" onclick="App.views.admin.toggleUmbrellaNode('${nodeId}')">
              <div class="umbrella-card__left">
                <span class="umbrella-chevron">▶</span>
                <div class="umbrella-card__identity">
                  <span class="umbrella-card__name">🇪🇸 Agentes Locales RE/MAX Inmomás (${internalTeam.filter(x => x.role === 'agent_inmomas').length})</span>
                  <div class="umbrella-card__meta"><span class="lang-en">Click to inspect assigned umbrellas, regions &amp; personalized guides</span><span class="lang-es">Haz clic para ver agentes internos, regiones y paraguas asignados</span></div>
                </div>
              </div>
              <div class="umbrella-card__right">
                <span class="umbrella-kpi-pill">🇪🇸 ${internalTeam.length} miembros</span>
              </div>
            </div>
            <div class="umbrella-card__body">
              <div class="umbrella-leaf-grid">
                ${internalTeam.map(a => {
                  const assignedPartnersCount = allUsers.filter(u => {
                    if (u.id === a.id || u.role === 'admin' || u.role === 'agent_inmomas') return false;
                    const res = App.utils.resolveAssignedInmomasAgent ? App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps) : null;
                    return res && (res.id === a.id || (res.name && res.name.toLowerCase() === `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase()));
                  }).length;
                  return `
                    <div class="umbrella-leaf" style="border-left-color:#003f99;">
                      <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                          <strong>${a.role === 'admin' ? '🛡️' : '🇪🇸'} ${App.utils.escapeHtml(a.firstName || '')} ${App.utils.escapeHtml(a.lastName || '')}</strong>
                          ${App.utils.getRoleBadge(a.role)}
                          ${App.utils.getUserStatusBadge(a.status)}
                        </div>
                        <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${App.utils.escapeHtml(a.email || '—')}</div>
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:4px;">
                          ${App.utils.getUserRegionBadgesHtml ? App.utils.getUserRegionBadgesHtml(a) : ''}
                          ${a.role === 'agent_inmomas' ? `<span class="umbrella-kpi-pill">🌐 ${assignedPartnersCount} en red asignada</span>` : ''}
                        </div>
                      </div>
                      <div style="display:flex; gap:4px; flex-shrink:0;">
                        ${buildAdminQuickActions(a)}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    adminUmbrellaInitialized = true;

    let sectionsHtml = '';
    if (embajadorCards.length > 0) {
      sectionsHtml += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>👑 <span class="lang-en">Ambassador Umbrellas</span><span class="lang-es">Paraguas de Embajadores</span></span>
            <span class="umbrella-kpi-pill">${embajadorCards.length} <span class="lang-en">Ambassadors</span><span class="lang-es">Embajadores</span></span>
          </div>
          ${embajadorCards.join('')}
        </div>
      `;
    }

    if (brokerCards.length > 0) {
      sectionsHtml += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🏢 <span class="lang-en">Direct Broker Umbrellas (No Ambassador)</span><span class="lang-es">Paraguas de Brokers Directos (Sin Embajador)</span></span>
            <span class="umbrella-kpi-pill">${brokerCards.length} Brokers</span>
          </div>
          ${brokerCards.join('')}
        </div>
      `;
    }

    if (standaloneGroupCards.length > 0) {
      sectionsHtml += `
        <div class="umbrella-group">
          <div class="umbrella-group__title">
            <span>🏠 <span class="lang-en">Independent Realtors &amp; Collaborators (By RE/MAX Inmomás Agent)</span><span class="lang-es">Realtors y Colaboradores Independientes (Por Agente RE/MAX Inmomás)</span></span>
            <span class="umbrella-kpi-pill">${standalonePartners.length}</span>
          </div>
          ${standaloneGroupCards.join('')}
        </div>
      `;
    }

    sectionsHtml += internalHtml;
    container.innerHTML = sectionsHtml;

    if (window.App && typeof window.App.updateLangDisplay === 'function') {
      window.App.updateLangDisplay();
    }
  }

  /* ── Apply All Filters ── */
  function handleFilters() {
    const roleSelect    = document.getElementById('admin-filter-role');
    const inmomasSelect = document.getElementById('admin-filter-inmomas-agent');
    const regionSelect  = document.getElementById('admin-filter-region');
    const countrySelect = document.getElementById('admin-filter-country');
    const statusSelect  = document.getElementById('admin-filter-status');
    const searchInput   = document.getElementById('admin-search-input');

    const role         = roleSelect    ? roleSelect.value    : '';
    const inmomasAgent = inmomasSelect ? inmomasSelect.value : '';
    const region       = regionSelect  ? regionSelect.value  : '';
    const country      = countrySelect ? countrySelect.value : '';
    const status       = statusSelect  ? statusSelect.value  : '';
    const search       = searchInput   ? searchInput.value.toLowerCase().trim() : '';

    const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
    let filtered = [...allUsers];

    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }

    if (inmomasAgent && App.utils && App.utils.resolveAssignedInmomasAgent) {
      if (inmomasAgent === '__unassigned__') {
        filtered = filtered.filter(u => {
          if (u.role === 'admin' || u.role === 'agent_inmomas') return false;
          const res = App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps);
          return !res.name;
        });
      } else {
        const targetAgent = allUsers.find(x => x.id === inmomasAgent);
        const targetNameLower = targetAgent ? `${targetAgent.firstName || ''} ${targetAgent.lastName || ''}`.trim().toLowerCase() : '';
        filtered = filtered.filter(u => {
          if (u.id === inmomasAgent) return true;
          if (u.role === 'admin' || u.role === 'agent_inmomas') return false;
          const res = App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps);
          return res.id === inmomasAgent || (targetNameLower && res.name.toLowerCase() === targetNameLower);
        });
      }
    }

    if (region && App.utils && App.utils.getUserRegions) {
      filtered = filtered.filter(u => App.utils.getUserRegions(u).includes(region));
    }

    if (country) {
      filtered = filtered.filter(u => {
        const nat = App.utils.getUserNationality ? App.utils.getUserNationality(u) : (u.nationality || '');
        const pool = [nat, u.country || ''].filter(Boolean).join(' / ');
        return App.utils.matchesCountryFilter
          ? App.utils.matchesCountryFilter(pool, country)
          : pool.toLowerCase().includes(country.toLowerCase());
      });
    }

    if (status) {
      if (status === 'active' || status === 'approved') {
        filtered = filtered.filter(u => u.status === 'active' || u.status === 'approved');
      } else {
        filtered = filtered.filter(u => u.status === status);
      }
    }

    if (search) {
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const nat = (App.utils.getUserNationality ? App.utils.getUserNationality(u) : (u.nationality || '')).toLowerCase();
        const inmomasRes = App.utils.resolveAssignedInmomasAgent ? App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps) : { name: '' };
        const parents = App.utils.resolveUserUmbrellaParents ? App.utils.resolveUserUmbrellaParents(u, allUsers, lookupMaps) : {};
        const embName = parents.embajador ? `${parents.embajador.firstName || ''} ${parents.embajador.lastName || ''}`.toLowerCase() : '';
        const brkName = parents.broker ? `${parents.broker.firstName || ''} ${parents.broker.lastName || ''} ${parents.broker.agencyName || ''}`.toLowerCase() : '';

        return fullName.includes(search) ||
               (u.email || '').toLowerCase().includes(search) ||
               (u.agencyName || '').toLowerCase().includes(search) ||
               (u.country || '').toLowerCase().includes(search) ||
               nat.includes(search) ||
               (inmomasRes.name || '').toLowerCase().includes(search) ||
               embName.includes(search) ||
               brkName.includes(search);
      });
    }

    const hasActiveFilter = Boolean(role || inmomasAgent || region || country || status || search);
    renderUsersUmbrellaAccordion(filtered, hasActiveFilter);
    renderUsersTable(filtered);
  }

  /* ============================================
     approveWithRole(userId, role)
     Approves a pending user with the specified
     role, then refreshes the active view.
     ============================================ */
  async function approveWithRole(userId, role) {
    try {
      // If modal is open, close it
      App.utils.closeModal();

      // Check if current user is Maia (Super Admin)
      if (!isMaiaOrSuperAdmin()) {
        const targetUser = allUsers.find(u => u.id === userId);
        const name = targetUser ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() : userId;
        const email = targetUser ? targetUser.email : '';
        await requestChangeApproval(
          'Aprobación de Usuario',
          `Aprobar y activar al usuario "${name}" (${email}) con el rol de "${role.toUpperCase()}".`
        );
        return;
      }
      
      // Update role
      await App.auth.updateUserRole(userId, role);
      // Approve status
      await App.auth.updateUserStatus(userId, 'active');
      App.utils.showToast(`User approved successfully as ${role}!`, 'success');

      // Refresh view
      const route = App.router.getCurrentRoute();
      if (route === 'admin/dashboard') {
        await initDashboard();
      } else if (route === 'admin/users') {
        await initUsers();
      }
    } catch (err) {
      console.error('[Admin] approveWithRole error:', err);
      App.utils.showToast('Error approving user: ' + err.message, 'error');
    }
  }

  /* ============================================
     handleApprove(userId)
     Approves a pending user and refreshes
     the current view.
     ============================================ */
  async function handleApprove(userId) {
    try {
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      const requestedRole = user.role;
      const defaultBorder = '#e5e7eb';
      const defaultBg = '#ffffff';

      const brokerBookmark = requestedRole === 'broker' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const realtorBookmark = requestedRole === 'realtor' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const agentInmomasBookmark = requestedRole === 'agent_inmomas' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const colaboradorBookmark = requestedRole === 'colaborador' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #3b82f6; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      const embajadorBookmark = requestedRole === 'embajador' ? `
        <div style="position: absolute; top: 0; right: 12px; background: #d97706; color: white; font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          Requested
        </div>
      ` : '';

      App.utils.showModal({
        title: 'Approve User',
        body: `
          <div style="margin-bottom: 1.5rem; text-align: center;">
            <p style="margin: 0 0 0.5rem; font-size: 1.1rem;">Approve <strong>${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</strong>?</p>
            <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Select the role to approve the user with:</p>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
            <!-- Embajador Approval Card -->
            <div onclick="App.views.admin.approveWithRole('${user.id}', 'embajador')" 
                 style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${requestedRole === 'embajador' ? '#f59e0b' : defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${requestedRole === 'embajador' ? '#fffbeb' : defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                 onmouseover="this.style.borderColor='#d97706'; this.style.backgroundColor='#fffbeb'; this.style.boxShadow='0 4px 6px -1px rgba(217,119,6,0.15)';" 
                 onmouseout="this.style.borderColor='${requestedRole === 'embajador' ? '#f59e0b' : defaultBorder}'; this.style.backgroundColor='${requestedRole === 'embajador' ? '#fffbeb' : defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
              ${embajadorBookmark}
              <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">👑</div>
              <div style="font-weight: 700; font-size: 0.9rem; color: #92400e; letter-spacing: 0.05em; text-transform: uppercase;">Embajador</div>
            </div>

            <!-- Broker Approval Card -->
            <div onclick="App.views.admin.approveWithRole('${user.id}', 'broker')" 
                 style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                 onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                 onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
              ${brokerBookmark}
              <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">🏢</div>
              <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Broker</div>
            </div>
            
            <!-- Realtor Approval Card -->
            <div onclick="App.views.admin.approveWithRole('${user.id}', 'realtor')" 
                 style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                 onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                 onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
              ${realtorBookmark}
              <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">👤</div>
              <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Realtor</div>
            </div>

            <!-- Agente Inmomás Approval Card -->
            <div onclick="App.views.admin.approveWithRole('${user.id}', 'agent_inmomas')" 
                 style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                 onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                 onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
              ${agentInmomasBookmark}
              <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">🏠</div>
              <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Agente Inmomás</div>
            </div>

            <!-- Colaborador Approval Card -->
            <div onclick="App.views.admin.approveWithRole('${user.id}', 'colaborador')" 
                 style="position: relative; flex: 1; min-width: 120px; border: 2px solid ${defaultBorder}; border-radius: 0.75rem; padding: 1.25rem 0.5rem; cursor: pointer; text-align: center; background: ${defaultBg}; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);"
                 onmouseover="this.style.borderColor='#3b82f6'; this.style.backgroundColor='#eff6ff'; this.style.boxShadow='0 4px 6px -1px rgba(37,99,235,0.1)';" 
                 onmouseout="this.style.borderColor='${defaultBorder}'; this.style.backgroundColor='${defaultBg}'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)';">
              ${colaboradorBookmark}
              <div style="font-size: 2.25rem; margin-bottom: 0.25rem;">🤝</div>
              <div style="font-weight: 700; font-size: 0.9rem; color: #111827; letter-spacing: 0.05em; text-transform: uppercase;">Colaborador</div>
            </div>
          </div>
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Cancel</button>`,
        onClose: () => {}
      });
    } catch (err) {
      console.error('[Admin] handleApprove error:', err);
      App.utils.showToast('Error loading approval window.', 'error');
    }
  }

  /* ============================================
     handleReject(userId)
     Shows a confirmation modal, then rejects
     the user and refreshes the view.
     ============================================ */
  async function handleReject(userId) {
    // Find user for name display
    const user = allUsers.find(u => u.id === userId);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'this user';

    // Check if current user is Maia (Super Admin)
    if (!isMaiaOrSuperAdmin()) {
      await requestChangeApproval(
        'Rechazo de Solicitud de Usuario',
        `Rechazar la solicitud de acceso del usuario "${userName}" (${user ? user.email : userId}).`
      );
      return;
    }

    App.utils.showModal({
      title: 'Confirm Rejection',
      body: `
        <p style="margin: 0 0 0.5rem;">Are you sure you want to reject <strong>${App.utils.escapeHtml(userName)}</strong>?</p>
        <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">They will not be able to access the platform unless re-approved.</p>
      `,
      footer: `
        <button class="btn btn-outline btn-sm" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-danger btn-sm" id="modal-confirm-reject-btn" style="margin-left: 0.5rem;">Reject User</button>
      `,
      onClose: () => {}
    });

    // Bind modal buttons
    const cancelBtn  = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-reject-btn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => App.utils.closeModal());
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        App.utils.closeModal();
        try {
          await App.auth.updateUserStatus(userId, 'rejected');
          App.utils.showToast('User rejected.', 'warning');

          const route = App.router.getCurrentRoute();
          if (route === 'admin/dashboard') {
            await initDashboard();
          } else if (route === 'admin/users') {
            await initUsers();
          }
        } catch (err) {
          console.error('[Admin] handleReject error:', err);
          App.utils.showToast('Error rejecting user: ' + err.message, 'error');
        }
      });
    }
  }

  async function handleDeleteUser(userId) {
    if (!isMaiaOrSuperAdmin()) {
      const targetUser = allUsers.find(u => u.id === userId);
      const name = targetUser ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() : userId;
      await requestChangeApproval(
        'Eliminación de Usuario',
        `Eliminar permanentemente la cuenta del usuario "${name}" (${targetUser ? targetUser.email : userId}).`
      );
      return;
    }

    if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        await App.auth.deleteUser(userId);
        App.utils.showToast('User deleted successfully.', 'success');
        await initUsers();
      } catch (err) {
        console.error('[Admin] handleDeleteUser error:', err);
        App.utils.showToast('Error deleting user: ' + err.message, 'error');
      }
    }
  }

  async function handleDeleteWebinarRegistration(regId) {
    if (confirm('Are you sure you want to delete this webinar registration?')) {
      try {
        await App.auth.deleteWebinarRegistration(regId);
        App.utils.showToast('Registration deleted successfully.', 'success');
        await initWebinar();
      } catch (err) {
        console.error('[Admin] handleDeleteWebinarReg error:', err);
        App.utils.showToast('Error deleting registration: ' + err.message, 'error');
      }
    }
  }

  /* ============================================
     viewUser(userId)
     Shows a detail modal with user information.
     ============================================ */
  async function viewUser(userId) {
    try {
      const user = await App.auth.getUser(userId);
      if (!user) {
        App.utils.showToast('User not found.', 'error');
        return;
      }

      const avatar = App.utils.generateAvatar(user.firstName, user.lastName, 'lg');
      const roleBadge = App.utils.getRoleBadge(user.role);
      const statusBadge = App.utils.getUserStatusBadge(user.status);

      const allSysUsers = await App.auth.getAllUsers();
      const embajadorUmbrellaInfo = user.role === 'embajador'
        ? await App.auth.getUmbrellaData(user.id)
        : null;
      const activeEmbajadores = allSysUsers.filter(u => u.role === 'embajador' && u.status === 'active');
      const modalLookup = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allSysUsers) : null;
      const userParents = App.utils.resolveUserUmbrellaParents
        ? App.utils.resolveUserUmbrellaParents(user, allSysUsers, modalLookup)
        : { embajador: null, broker: null };
      const currentEmbId = user.embajadorId || (userParents.embajador ? userParents.embajador.id : '');
      const currentBrkId = user.brokerId || (userParents.broker ? userParents.broker.id : '');

      const embajadorOptions = `
        <option value="">-- Sin Embajador (Directo) --</option>
        ${activeEmbajadores.map(e => `
          <option value="${e.id}" ${currentEmbId === e.id ? 'selected' : ''}>
            👑 ${App.utils.escapeHtml(e.firstName)} ${App.utils.escapeHtml(e.lastName)} (${App.utils.escapeHtml(e.referralCode || e.id)})
          </option>
        `).join('')}
      `;
      const availableBrokers = allSysUsers.filter(u => u.role === 'broker' && u.status !== 'rejected' && u.id !== user.id);
      const brokerOptions = `
        <option value="">-- Sin Broker (Agente Directo / Independiente) --</option>
        ${availableBrokers.map(b => `
          <option value="${b.id}" ${currentBrkId === b.id ? 'selected' : ''}>
            🏢 ${App.utils.escapeHtml(b.firstName)} ${App.utils.escapeHtml(b.lastName)}${b.agencyName ? ' — ' + App.utils.escapeHtml(b.agencyName) : ''}
          </option>
        `).join('')}
      `;
      const localAgents = allSysUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');
      const resolvedInmomas = App.utils.resolveAssignedInmomasAgent
        ? App.utils.resolveAssignedInmomasAgent(user, allSysUsers, modalLookup)
        : { id: null, name: '', inherited: false };
      const directAssignedAgentId = !resolvedInmomas.inherited ? resolvedInmomas.id : null;
      const agentOptions = `
        <option value="">-- Sin Agente RE/MAX Inmomás directo --</option>
        ${localAgents.map(a => {
          const code = a.referralCode || a.id;
          const fullLower = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
          const isSelected = directAssignedAgentId === a.id ||
            user.inmomasAgentId === a.id ||
            user.inmomasAgentCode === code ||
            user.referredBy === code ||
            user.referredBy === a.id ||
            (!directAssignedAgentId && user.inmomasAgentName && String(user.inmomasAgentName).trim().toLowerCase() === fullLower);
          return `
          <option value="${code}" ${isSelected ? 'selected' : ''}>
            🇪🇸 ${App.utils.escapeHtml(a.firstName)} ${App.utils.escapeHtml(a.lastName)} (${a.referralCode || 'ID: ' + a.id})
          </option>
        `}).join('')}
      `;

      App.utils.showModal({
        title: 'User Details',
        body: `
          <div style="text-align: center; margin-bottom: 1.5rem;">
            ${avatar}
            <h3 style="margin: 1rem 0 0.25rem;">${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</h3>
            <div>${roleBadge} ${statusBadge}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem;">
            <div>
              <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Email</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(user.email)}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Phone</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(user.phone || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Agency</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(user.agencyName || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Country</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(user.country || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Registered</div>
              <div style="color: #6b7280;">${App.utils.formatDate(user.createdAt)}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Agreement</div>
              <div style="color: #6b7280;">${(user.agreementSigned || user.agreementStatus === 'signed') ? '✅ Firmado / Signed' : (user.agreementStatus === 'data_submitted' || user.agreementStatus === 'uploaded') ? '📋 Datos Fiscales Recibidos' : '❌ Pendiente'}</div>
            </div>
          </div>

          ${user.contractCompanyData ? `
          <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:0.5rem; padding:0.9rem; margin-top:1rem; font-size:0.82rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <strong style="color:#1e3a8a;">🏢 Datos Fiscales y Bancarios (Para Contrato Externo)</strong>
              <button type="button" class="btn btn-outline btn-xs" style="padding:2px 8px; font-size:0.75rem;" onclick="App.views.admin.copyContractData('${user.id}')">📋 Copiar Datos</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; color:#334155;">
              <div><strong>Razón Social:</strong> ${App.utils.escapeHtml(user.contractCompanyData.companyLegalName || '—')}</div>
              <div><strong>NIF / Tax ID:</strong> ${App.utils.escapeHtml(user.contractCompanyData.taxId || '—')}</div>
              <div><strong>Licencia:</strong> ${App.utils.escapeHtml(user.contractCompanyData.licenseNumber || '—')}</div>
              <div><strong>País:</strong> ${App.utils.escapeHtml(user.contractCompanyData.fiscalCountry || '—')}</div>
              <div style="grid-column:span 2;"><strong>Domicilio Fiscal:</strong> ${App.utils.escapeHtml(user.contractCompanyData.fiscalAddress || '—')}</div>
              <div><strong>Broker Resp.:</strong> ${App.utils.escapeHtml(user.contractCompanyData.brokerSignerName || '—')}</div>
              <div><strong>Email Broker:</strong> ${App.utils.escapeHtml(user.contractCompanyData.brokerSignerEmail || '—')}</div>
              <div><strong>Banco / Titular:</strong> ${App.utils.escapeHtml(user.contractCompanyData.bankName || '—')} (${App.utils.escapeHtml(user.contractCompanyData.bankAccountHolder || '—')})</div>
              <div><strong>IBAN / Cuenta:</strong> <code style="background:#fff; padding:1px 4px; border-radius:3px;">${App.utils.escapeHtml(user.contractCompanyData.bankAccountNumber || '—')}</code></div>
              <div style="grid-column:span 2;"><strong>SWIFT / Routing:</strong> <code style="background:#fff; padding:1px 4px; border-radius:3px;">${App.utils.escapeHtml(user.contractCompanyData.bankSwiftRouting || '—')}</code></div>
            </div>
          </div>
          ` : ''}
          
          ${user.role !== 'admin' ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1.5rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #374151; display: block; margin-bottom: 0.5rem;">Modify User Role</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="user-role-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                <option value="embajador" ${user.role === 'embajador' ? 'selected' : ''}>👑 Embajador / Ambassador</option>
                <option value="broker" ${user.role === 'broker' ? 'selected' : ''}>Broker</option>
                <option value="realtor" ${user.role === 'realtor' ? 'selected' : ''}>Realtor</option>
                <option value="colaborador" ${user.role === 'colaborador' ? 'selected' : ''}>Colaborador</option>
                <option value="agent_inmomas" ${user.role === 'agent_inmomas' ? 'selected' : ''}>🇪🇸 Agente RE/MAX Inmomás</option>
              </select>
              <button class="btn btn-primary btn-sm" id="save-user-role-btn">Update Role</button>
            </div>
          </div>
          ` : ''}

          <!-- Nationality & Regional Assignment Section (RE/MAX Inmomás & International Segmentation) -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem; background: rgba(0, 63, 153, 0.03); border-radius: 0.5rem; padding: 0.9rem; border: 1px solid rgba(0, 63, 153, 0.16);">
            <label style="font-weight: 700; font-size: 0.88rem; color: #003f99; display: flex; align-items: center; gap: 6px; margin-bottom: 0.35rem;">
              🌍 Nacionalidad, País y Regiones Asignadas (RE/MAX Inmomás)
            </label>
            <p style="font-size: 0.76rem; color: #475569; margin: 0 0 0.75rem;">
              Etiqueta la nacionalidad/país y la(s) región(es) de trabajo para segmentar bases de datos, webinarios paralelos y asignación de clientes.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-bottom: 0.75rem;">
              <div>
                <label style="font-weight: 600; font-size: 0.78rem; color: #374151; display: block; margin-bottom: 0.25rem;">Nacionalidad / País Origen</label>
                <select id="admin-user-nationality-select" class="form-control" style="width: 100%; padding: 0.4rem 0.55rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.82rem; background: #fff;">
                  ${App.utils.getCountryOptionsHtml ? App.utils.getCountryOptionsHtml(App.utils.getUserNationality ? App.utils.getUserNationality(user) : (user.nationality || user.country || ''), true, '— Seleccionar Nacionalidad —') : ''}
                </select>
              </div>
              <div>
                <label style="font-weight: 600; font-size: 0.78rem; color: #374151; display: block; margin-bottom: 0.25rem;">País de Agencia / Residencia</label>
                <select id="admin-user-country-select" class="form-control" style="width: 100%; padding: 0.4rem 0.55rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.82rem; background: #fff;">
                  ${App.utils.getCountryOptionsHtml ? App.utils.getCountryOptionsHtml(user.country || '', true, '— Seleccionar País —') : ''}
                </select>
              </div>
            </div>
            <div style="margin-bottom: 0.75rem;">
              <label style="font-weight: 600; font-size: 0.78rem; color: #374151; display: block; margin-bottom: 0.25rem;">Región(es) Comercial(es) Activa(s)</label>
              <div id="admin-user-regions-wrap">
                ${App.utils.getRegionsCheckboxesHtml ? App.utils.getRegionsCheckboxesHtml('admin-user-region-chk', App.utils.getUserRegions ? App.utils.getUserRegions(user) : []) : ''}
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-sm" id="admin-save-user-regions-btn" style="width: 100%; justify-content: center; background: #003f99; border-color: #003f99;">
              💾 Guardar Nacionalidad y Regiones
            </button>
          </div>

          ${user.role === 'embajador' && embajadorUmbrellaInfo ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 700; font-size: 0.875rem; color: #92400e; display: block; margin-bottom: 0.5rem;">
              👑 Red Bajo su Paraguas (${embajadorUmbrellaInfo.users.length} profesionales · ${embajadorUmbrellaInfo.clients.length} clientes)
            </label>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:0.5rem; font-size:0.76rem;">
              <span style="background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:999px; font-weight:700;">🏢 ${embajadorUmbrellaInfo.brokers.length} Brokers</span>
              <span style="background:#ecfdf5; color:#047857; padding:2px 8px; border-radius:999px; font-weight:700;">🏠 ${embajadorUmbrellaInfo.realtors.length} Agentes</span>
              <span style="background:#fffbeb; color:#b45309; padding:2px 8px; border-radius:999px; font-weight:700;">🤝 ${embajadorUmbrellaInfo.colaboradores.length} Colaboradores</span>
              <span style="background:#f5f3ff; color:#6d28d9; padding:2px 8px; border-radius:999px; font-weight:700;">🏡 ${embajadorUmbrellaInfo.clients.length} Clientes</span>
            </div>
            <div style="max-height: 130px; overflow-y: auto; font-size: 0.82rem; border: 1px solid #fde68a; border-radius: 0.45rem; padding: 0.55rem; background: #fffbeb;">
              ${embajadorUmbrellaInfo.users.length === 0
                ? '<div style="color:#92400e; text-align:center;">Aún no hay contactos profesionales registrados bajo su paraguas.</div>'
                : '<ul style="margin:0; padding-left:1.1rem; color:#374151;">' + embajadorUmbrellaInfo.users.map(m => `<li><strong>${App.utils.escapeHtml(m.firstName)} ${App.utils.escapeHtml(m.lastName)}</strong> (${m.role}) — <span style="color:#6b7280;">${App.utils.escapeHtml(m._umbrellaParentName || 'Directo')}</span></li>`).join('') + '</ul>'
              }
            </div>
          </div>
          ` : ''}

          ${user.role === 'broker' ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            ${(() => {
              const brkTeam = allSysUsers.filter(u => {
                if (u.id === user.id || !['realtor', 'colaborador'].includes(u.role)) return false;
                const p = App.utils.resolveUserUmbrellaParents ? App.utils.resolveUserUmbrellaParents(u, allSysUsers, modalLookup) : {};
                return p.broker && p.broker.id === user.id;
              });
              const candidateRealtors = allSysUsers.filter(u => u.role === 'realtor' && u.status !== 'rejected' && u.brokerId !== user.id);
              return `
                <label style="font-weight: 700; font-size: 0.875rem; color: #003da5; display: block; margin-bottom: 0.5rem;">
                  🏢 Equipo bajo este Paraguas de Broker (${brkTeam.length} profesionales)
                </label>
                <div style="max-height: 130px; overflow-y: auto; font-size: 0.82rem; border: 1px solid #bfdbfe; border-radius: 0.45rem; padding: 0.55rem; background: #eff6ff; margin-bottom: 0.75rem;">
                  ${brkTeam.length === 0
                    ? '<div style="color:#1e40af; text-align:center;">Aún no hay realtors registrados bajo este Broker.</div>'
                    : '<ul style="margin:0; padding-left:1.1rem; color:#1e293b;">' + brkTeam.map(m => `<li><strong>${App.utils.escapeHtml(m.firstName)} ${App.utils.escapeHtml(m.lastName)}</strong> (${m.role}) — <span style="color:#64748b;">${App.utils.escapeHtml(m.email || '')}</span></li>`).join('') + '</ul>'
                  }
                </div>
                <label style="font-weight: 600; font-size: 0.82rem; color: #1e3a8a; display: block; margin-bottom: 0.4rem;">Añadir Agente / Realtor a este Broker</label>
                <div style="display: flex; gap: 0.5rem;">
                  <select id="broker-assign-realtor-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.84rem; background-color: white;">
                    <option value="">-- Seleccionar Agente / Realtor --</option>
                    ${candidateRealtors.map(r => `<option value="${r.id}">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}${r.agencyName ? ' · ' + App.utils.escapeHtml(r.agencyName) : ''} (${App.utils.escapeHtml(r.email)})</option>`).join('')}
                  </select>
                  <button type="button" class="btn btn-primary btn-sm" id="broker-save-realtor-btn">Vincular</button>
                </div>
                <p style="font-size: 0.74rem; color: #64748b; margin-top: 0.35rem;">Si el agente ya estaba en el paraguas de un Embajador, este Broker se adjuntará automáticamente a ese mismo paraguas.</p>
              `;
            })()}
          </div>
          ` : ''}

          ${user.role === 'realtor' ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #003da5; display: block; margin-bottom: 0.5rem;">🏢 Asignar Oficina / Paraguas de Broker</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="user-broker-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                ${brokerOptions}
              </select>
              <button type="button" class="btn btn-primary btn-sm" id="save-user-broker-btn">Vincular Broker</button>
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.4rem;">Si este agente entró con link de Embajador y luego se registra su Broker, al asignarlo aquí el Broker queda adjunto al paraguas del Embajador.</p>
          </div>
          ` : ''}

          ${['broker', 'realtor', 'colaborador'].includes(user.role) ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #92400e; display: block; margin-bottom: 0.5rem;">👑 Asignar Paraguas de Embajador</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="user-embajador-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                ${embajadorOptions}
              </select>
              <button class="btn btn-primary btn-sm" id="save-user-embajador-btn" style="background:#d97706; border-color:#d97706;">Vincular</button>
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.4rem;">Vincula este ${user.role} (y los contactos que genere) al paraguas del Embajador seleccionado.</p>
          </div>
          ` : ''}
          
          ${user.role === 'agent_inmomas' ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #374151; display: block; margin-bottom: 0.5rem;">🇪🇸 Profesionales y Paraguas Asignados</label>
            <div style="max-height: 130px; overflow-y: auto; font-size: 0.85rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.5rem; background: #f9fafb; margin-bottom: 0.75rem;">
              ${(() => {
                const agentFullLower = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
                const assigned = allSysUsers.filter(u => {
                  if (u.id === user.id || u.role === 'admin' || u.role === 'agent_inmomas') return false;
                  const res = App.utils.resolveAssignedInmomasAgent ? App.utils.resolveAssignedInmomasAgent(u, allSysUsers, modalLookup) : null;
                  return res && (res.id === user.id || (res.name && res.name.toLowerCase() === agentFullLower));
                });
                if (assigned.length === 0) return '<div style="color: #6b7280; text-align: center;">Ningún profesional o paraguas asignado aún.</div>';
                return '<ul style="margin: 0; padding-left: 1rem; color: #374151;">' + assigned.map(r => `<li><strong>${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</strong> <span style="color:#64748b; font-size:0.75rem;">(${r.role}${r.inmomasAgentId !== user.id && r.referredBy !== user.referralCode && r.referredBy !== user.id ? ' · heredado' : ''})</span></li>`).join('') + '</ul>';
              })()}
            </div>
            <label style="font-weight: 600; font-size: 0.875rem; color: #374151; display: block; margin-bottom: 0.5rem;">Vincular Embajador / Broker / Realtor a este Agente Inmomás</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="agent-assign-realtor-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                <option value="">-- Seleccionar Profesional --</option>
                ${allSysUsers.filter(u => ['embajador', 'broker', 'realtor', 'colaborador'].includes(u.role) && u.status === 'active' && u.inmomasAgentId !== user.id && u.referredBy !== user.referralCode && u.referredBy !== user.id).map(r => `<option value="${r.id}">[${r.role.toUpperCase()}] ${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)} (${r.email})</option>`).join('')}
              </select>
              <button class="btn btn-primary btn-sm" id="agent-save-realtor-btn">Añadir</button>
            </div>
          </div>
          ` : `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 700; font-size: 0.875rem; color: #003f99; display: block; margin-bottom: 0.4rem;">🇪🇸 Agente RE/MAX Inmomás Asignado</label>
            ${resolvedInmomas.inherited ? `<div style="font-size:0.76rem; color:#0369a1; background:#f0f9ff; border:1px dashed #7dd3fc; padding:6px 10px; border-radius:6px; margin-bottom:8px;">Actualmente hereda a <strong>${App.utils.escapeHtml(resolvedInmomas.name)}</strong> vía su ${resolvedInmomas.inheritedFrom}. Puedes asignarle uno específico abajo si lo deseas.</div>` : ''}
            <div style="display: flex; gap: 0.5rem;">
              <select id="user-referral-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                ${agentOptions}
              </select>
              <button class="btn btn-primary btn-sm" id="save-user-referral-btn">Asignar</button>
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.45rem;">Asigna el Agente RE/MAX Inmomás de referencia sin alterar su paraguas de Broker o Embajador.</p>
          </div>
          `}

          ${['embajador', 'broker', 'realtor', 'colaborador', 'agent_inmomas'].includes(user.role) ? `
          <div id="admin-buyer-guide-editor" style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;"></div>
          ` : ''}

          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 700; font-size: 0.9rem; color: #111827; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem;">
              🏢 Agencia Inmobiliaria y Logo (Referral Link Personalizado)
            </label>
            <p style="font-size: 0.78rem; color: #6b7280; margin-bottom: 0.75rem;">
              Configura el nombre de la agencia y sube el logo de la inmobiliaria que aparecerá en el Referral Link personalizado de este usuario (y su oficina).
            </p>
            <div style="margin-bottom: 0.75rem;">
              <label style="font-weight: 600; font-size: 0.8rem; color: #374151; display: block; margin-bottom: 0.25rem;">Nombre de la Agencia / Oficina</label>
              <input type="text" id="admin-user-agency-name" class="form-control" value="${App.utils.escapeHtml(user.agencyName || '')}" placeholder="Ej. RE/MAX Premier, Keller Williams, Century 21..." style="width: 100%; padding: 0.45rem 0.65rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem;">
            </div>
            <div style="margin-bottom: 0.75rem;">
              <label style="font-weight: 600; font-size: 0.8rem; color: #374151; display: block; margin-bottom: 0.35rem;">Logo de la Inmobiliaria</label>
              <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
                <div id="admin-user-agency-logo-preview-wrap" style="width: 150px; height: 64px; border: 1px dashed #cbd5e1; border-radius: 0.5rem; background: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 0.35rem; overflow: hidden;">
                  ${user.agencyLogo
                    ? `<img id="admin-user-agency-logo-preview" src="${App.utils.escapeHtml(user.agencyLogo)}" alt="Logo Agencia" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
                    : `<span id="admin-user-agency-logo-empty" style="font-size: 0.75rem; color: #94a3b8; text-align: center;">Sin logo</span>`
                  }
                </div>
                <div style="flex: 1; min-width: 190px; display: flex; flex-direction: column; gap: 0.4rem;">
                  <input type="file" id="admin-user-agency-logo-file" accept="image/*" style="font-size: 0.78rem; color: #374151;">
                  <div style="display: flex; gap: 0.4rem; align-items: center;">
                    <input type="url" id="admin-user-agency-logo-url" class="form-control" placeholder="O pega URL de imagen (https://...)" value="${user.agencyLogo && !user.agencyLogo.startsWith('data:') ? App.utils.escapeHtml(user.agencyLogo) : ''}" style="flex: 1; padding: 0.35rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.78rem;">
                    <button type="button" class="btn btn-outline btn-sm" id="admin-remove-agency-logo-btn" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; color: #dc2626; border-color: #fecaca; ${user.agencyLogo ? '' : 'display: none;'}">Quitar Logo</button>
                  </div>
                </div>
              </div>
            </div>
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #374151; margin-bottom: 0.75rem; cursor: pointer;">
              <input type="checkbox" id="admin-apply-agency-office-chk" checked style="width: 15px; height: 15px; accent-color: #003da5;">
              <span>Aplicar este logo y agencia al Broker y a todos los agentes de esta misma oficina/agencia</span>
            </label>
            <button type="button" class="btn btn-primary btn-sm" id="admin-save-agency-branding-btn" style="width: 100%; justify-content: center;">
              💾 Guardar Agencia y Logo en Referral Link
            </button>
          </div>
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`,
        onClose: () => {}
      });

      // Personalized Buyer Guide editor (RE/MAX Inmomás agents)
      const adminGuideEl = document.getElementById('admin-buyer-guide-editor');
      if (adminGuideEl && App.buyerGuide) {
        App.buyerGuide.renderEditor(adminGuideEl, user, { admin: true });
      }

      // Agency Logo upload & save handlers
      let currentAgencyLogoData = user.agencyLogo || null;
      const logoFileInput = document.getElementById('admin-user-agency-logo-file');
      const logoUrlInput = document.getElementById('admin-user-agency-logo-url');
      const logoPreviewWrap = document.getElementById('admin-user-agency-logo-preview-wrap');
      const removeLogoBtn = document.getElementById('admin-remove-agency-logo-btn');
      const saveAgencyBrandingBtn = document.getElementById('admin-save-agency-branding-btn');

      const updateLogoPreviewUI = (src) => {
        currentAgencyLogoData = src || null;
        if (logoPreviewWrap) {
          if (currentAgencyLogoData) {
            logoPreviewWrap.innerHTML = `<img id="admin-user-agency-logo-preview" src="${App.utils.escapeHtml(currentAgencyLogoData)}" alt="Logo Agencia" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
          } else {
            logoPreviewWrap.innerHTML = `<span id="admin-user-agency-logo-empty" style="font-size: 0.75rem; color: #94a3b8; text-align: center;">Sin logo</span>`;
          }
        }
        if (removeLogoBtn) {
          removeLogoBtn.style.display = currentAgencyLogoData ? 'inline-flex' : 'none';
        }
      };

      if (logoFileInput) {
        logoFileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_W = 360;
              const MAX_H = 140;
              let w = img.width;
              let h = img.height;
              if (w > MAX_W || h > MAX_H) {
                const ratio = Math.min(MAX_W / w, MAX_H / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              const compressedDataUrl = canvas.toDataURL('image/png');
              if (logoUrlInput) logoUrlInput.value = '';
              updateLogoPreviewUI(compressedDataUrl);
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      }

      if (logoUrlInput) {
        logoUrlInput.addEventListener('input', () => {
          const val = logoUrlInput.value.trim();
          if (val) {
            if (logoFileInput) logoFileInput.value = '';
            updateLogoPreviewUI(val);
          } else if (!logoFileInput || !logoFileInput.files.length) {
            updateLogoPreviewUI(null);
          }
        });
      }

      if (removeLogoBtn) {
        removeLogoBtn.addEventListener('click', () => {
          if (logoFileInput) logoFileInput.value = '';
          if (logoUrlInput) logoUrlInput.value = '';
          updateLogoPreviewUI(null);
        });
      }

      if (saveAgencyBrandingBtn) {
        saveAgencyBrandingBtn.addEventListener('click', async () => {
          const newAgencyName = (document.getElementById('admin-user-agency-name')?.value || '').trim();
          const applyToOffice = !!document.getElementById('admin-apply-agency-office-chk')?.checked;

          saveAgencyBrandingBtn.disabled = true;
          saveAgencyBrandingBtn.textContent = 'Guardando...';

          try {
            const res = await App.auth.updateUserAgencyBranding(userId, {
              agencyName: newAgencyName,
              agencyLogo: currentAgencyLogoData,
              applyToOffice
            });
            App.utils.closeModal();
            const countMsg = res && res.updatedCount > 1
              ? ` (${res.updatedCount} miembros de la oficina actualizados)`
              : '';
            App.utils.showToast(`Agencia y logo actualizados correctamente${countMsg}.`, 'success');
            const route = App.router.getCurrentRoute();
            if (route === 'admin/dashboard') {
              await initDashboard();
            } else if (route === 'admin/users') {
              await initUsers();
            }
          } catch (err) {
            console.error('[Admin] Error updating agency branding:', err);
            App.utils.showToast('Error al guardar agencia/logo: ' + err.message, 'error');
            saveAgencyBrandingBtn.disabled = false;
            saveAgencyBrandingBtn.textContent = '💾 Guardar Agencia y Logo en Referral Link';
          }
        });
      }

      const saveRegionsBtn = document.getElementById('admin-save-user-regions-btn');
      if (saveRegionsBtn) {
        saveRegionsBtn.addEventListener('click', async () => {
          const natVal = document.getElementById('admin-user-nationality-select')?.value || '';
          const cntVal = document.getElementById('admin-user-country-select')?.value || '';
          const checkedRegs = Array.from(document.querySelectorAll('input[name="admin-user-region-chk"]:checked')).map(cb => cb.value);

          if (!isMaiaOrSuperAdmin()) {
            App.utils.closeModal();
            await requestChangeApproval(
              'Actualizar Nacionalidad y Regiones de Usuario',
              `Etiquetar a "${user.firstName} ${user.lastName}" con Nacionalidad "${natVal}", País "${cntVal}" y Regiones [${checkedRegs.join(', ')}].`
            );
            return;
          }

          saveRegionsBtn.disabled = true;
          saveRegionsBtn.textContent = 'Guardando...';
          try {
            await App.auth.updateUserRegionalProfile(userId, {
              nationality: natVal,
              country: cntVal,
              regions: checkedRegs,
              region: checkedRegs[0] || ''
            });
            App.utils.closeModal();
            App.utils.showToast('🌍 Nacionalidad y regiones actualizadas correctamente.', 'success');
            const route = App.router.getCurrentRoute();
            if (route === 'admin/dashboard') await initDashboard();
            else if (route === 'admin/users') await initUsers();
          } catch (err) {
            console.error('[Admin] Error saving user regions:', err);
            App.utils.showToast('Error al guardar regiones: ' + err.message, 'error');
            saveRegionsBtn.disabled = false;
            saveRegionsBtn.textContent = '💾 Guardar Nacionalidad y Regiones';
          }
        });
      }

      const saveRoleBtn = document.getElementById('save-user-role-btn');
      if (saveRoleBtn) {
        saveRoleBtn.addEventListener('click', async () => {
          const selectedRole = document.getElementById('user-role-select').value;
          App.utils.closeModal();

          if (!isMaiaOrSuperAdmin()) {
            await requestChangeApproval(
              'Cambio de Rol de Usuario',
              `Cambiar el rol del usuario "${user.firstName} ${user.lastName}" (${user.email}) al rol "${selectedRole.toUpperCase()}".`
            );
            return;
          }

          try {
            await App.auth.updateUserRole(userId, selectedRole);
            App.utils.showToast('User role updated successfully!', 'success');
            
            // Refresh
            const route = App.router.getCurrentRoute();
            if (route === 'admin/dashboard') {
              await initDashboard();
            } else if (route === 'admin/users') {
              await initUsers();
            }
          } catch (err) {
            console.error('[Admin] Error updating user role:', err);
            App.utils.showToast('Error updating role: ' + err.message, 'error');
          }
        });
      }

      const saveReferralBtn = document.getElementById('save-user-referral-btn');
      if (saveReferralBtn) {
        saveReferralBtn.addEventListener('click', async () => {
          const selectedReferral = document.getElementById('user-referral-select').value;
          App.utils.closeModal();

          if (!isMaiaOrSuperAdmin()) {
            await requestChangeApproval(
              'Asignación de Referido / Agente',
              `Asignar referidor "${selectedReferral || 'Ninguno'}" al usuario "${user.firstName} ${user.lastName}" (${user.email}).`
            );
            return;
          }

          try {
            await App.auth.updateUserReferral(userId, selectedReferral || null);
            App.utils.showToast('User referral/agent assigned successfully!', 'success');
            
            // Refresh
            const route = App.router.getCurrentRoute();
            if (route === 'admin/users') {
              await initUsers();
            }
          } catch (err) {
            console.error('[Admin] Error updating user referral:', err);
            App.utils.showToast('Error assigning agent: ' + err.message, 'error');
          }
        });
      }

      const saveBrokerBtn = document.getElementById('save-user-broker-btn');
      if (saveBrokerBtn) {
        saveBrokerBtn.addEventListener('click', async () => {
          const selectedBrkId = document.getElementById('user-broker-select').value;
          App.utils.closeModal();

          if (!isMaiaOrSuperAdmin()) {
            await requestChangeApproval(
              'Asignación de Paraguas de Broker',
              `Asignar Broker "${selectedBrkId || 'Ninguno'}" al agente "${user.firstName} ${user.lastName}" (${user.email}).`
            );
            return;
          }

          try {
            const res = await App.auth.updateUserBroker(userId, selectedBrkId || null);
            const msg = res && res.attachedBrokerToEmbajador
              ? '🏢 Broker vinculado al agente y adjuntado automáticamente al Paraguas del Embajador.'
              : '🏢 Paraguas de Broker actualizado correctamente.';
            App.utils.showToast(msg, 'success');
            const route = App.router.getCurrentRoute();
            if (route === 'admin/users') await initUsers();
          } catch (err) {
            console.error('[Admin] Error updating user broker:', err);
            App.utils.showToast('Error actualizando Broker: ' + err.message, 'error');
          }
        });
      }

      const brokerSaveRealtorBtn = document.getElementById('broker-save-realtor-btn');
      if (brokerSaveRealtorBtn) {
        brokerSaveRealtorBtn.addEventListener('click', async () => {
          const selectedRealtorId = document.getElementById('broker-assign-realtor-select').value;
          if (!selectedRealtorId) {
            App.utils.showToast('Selecciona un Agente / Realtor para vincular.', 'error');
            return;
          }
          App.utils.closeModal();

          if (!isMaiaOrSuperAdmin()) {
            await requestChangeApproval(
              'Vincular Agente a Broker',
              `Vincular al Agente (${selectedRealtorId}) bajo el Broker "${user.firstName} ${user.lastName}" (${user.email}).`
            );
            return;
          }

          try {
            const res = await App.auth.updateUserBroker(selectedRealtorId, user.id);
            const msg = res && res.attachedBrokerToEmbajador
              ? '🏢 Agente vinculado y Broker adjuntado automáticamente al Paraguas del Embajador.'
              : '🏢 Agente vinculado al paraguas del Broker correctamente.';
            App.utils.showToast(msg, 'success');
            const route = App.router.getCurrentRoute();
            if (route === 'admin/users') await initUsers();
          } catch (err) {
            console.error('[Admin] Error linking realtor to broker:', err);
            App.utils.showToast('Error vinculando agente al Broker: ' + err.message, 'error');
          }
        });
      }

      const saveEmbajadorBtn = document.getElementById('save-user-embajador-btn');
      if (saveEmbajadorBtn) {
        saveEmbajadorBtn.addEventListener('click', async () => {
          const selectedEmbId = document.getElementById('user-embajador-select').value;
          App.utils.closeModal();

          if (!isMaiaOrSuperAdmin()) {
            await requestChangeApproval(
              'Asignación de Paraguas de Embajador',
              `Asignar Embajador "${selectedEmbId || 'Ninguno'}" al usuario "${user.firstName} ${user.lastName}" (${user.email}).`
            );
            return;
          }

          try {
            await App.auth.updateUserEmbajador(userId, selectedEmbId || null);
            App.utils.showToast('👑 Paraguas de Embajador actualizado correctamente.', 'success');
            const route = App.router.getCurrentRoute();
            if (route === 'admin/users') await initUsers();
          } catch (err) {
            console.error('[Admin] Error updating user embajador:', err);
            App.utils.showToast('Error actualizando Embajador: ' + err.message, 'error');
          }
        });
      }

      const agentSaveRealtorBtn = document.getElementById('agent-save-realtor-btn');
      if (agentSaveRealtorBtn) {
        agentSaveRealtorBtn.addEventListener('click', async () => {
          const selectedRealtorId = document.getElementById('agent-assign-realtor-select').value;
          if (!selectedRealtorId) {
            App.utils.showToast('Please select a Realtor', 'error');
            return;
          }
          App.utils.closeModal();

          if (!isMaiaOrSuperAdmin()) {
            const targetRealtor = allSysUsers.find(u => u.id === selectedRealtorId);
            const rName = targetRealtor ? `${targetRealtor.firstName} ${targetRealtor.lastName}` : selectedRealtorId;
            await requestChangeApproval(
              'Añadir Realtor al Paraguas del Agente',
              `Añadir al Realtor "${rName}" bajo el agente "${user.firstName} ${user.lastName}".`
            );
            return;
          }

          try {
            const assignmentCode = user.referralCode || user.id;
            await App.auth.updateUserReferral(selectedRealtorId, assignmentCode);
            App.utils.showToast('Realtor assigned to agent successfully!', 'success');
            const route = App.router.getCurrentRoute();
            if (route === 'admin/users') {
              await initUsers();
            }
          } catch (err) {
            console.error('[Admin] Error assigning realtor to agent:', err);
            App.utils.showToast('Error assigning realtor: ' + err.message, 'error');
          }
        });
      }

    } catch (err) {
      console.error('[Admin] viewUser error:', err);
      App.utils.showToast('Error loading user details.', 'error');
    }
  }

  /* ── Broker Inmomás Client Kanban Board & Assignment ── */
  async function initClients() {
    try {
      allUsers = await App.auth.getAllUsers();
      allClients = await App.auth.getClients();

      // Populate Region & Country Filters
      const regSel = document.getElementById('admin-client-filter-region');
      const countrySel = document.getElementById('admin-client-filter-country');
      const rawClientCountries = [];
      allClients.forEach(c => {
        if (c.country && c.country !== '—') rawClientCountries.push(c.country.trim());
        if (c.currentLocation && c.currentLocation !== '—') rawClientCountries.push(c.currentLocation.trim());
      });

      const initialReg = pendingAdminRegionFilter || clientRegionFilter || '';
      const initialCountry = pendingAdminCountryFilter || clientCountryFilter || '';
      clientRegionFilter = initialReg;
      clientCountryFilter = initialCountry;
      pendingAdminRegionFilter = '';
      pendingAdminCountryFilter = '';

      if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml) {
        regSel.innerHTML = App.utils.getRegionFilterOptionsHtml(initialReg);
        regSel.value = initialReg;
        regSel.onchange = (e) => {
          clientRegionFilter = e.target.value || '';
          if (clientRegionFilter && clientCountryFilter && App.utils.resolveRegionFromCountry && App.utils.resolveRegionFromCountry(clientCountryFilter) !== clientRegionFilter) {
            clientCountryFilter = '';
          }
          if (countrySel && App.utils.getCountryFilterOptionsHtml) {
            countrySel.innerHTML = App.utils.getCountryFilterOptionsHtml(clientCountryFilter, clientRegionFilter, rawClientCountries);
            countrySel.value = clientCountryFilter;
          }
          renderClientsView();
        };
      }

      if (countrySel && App.utils && App.utils.getCountryFilterOptionsHtml) {
        countrySel.innerHTML = App.utils.getCountryFilterOptionsHtml(initialCountry, initialReg, rawClientCountries);
        countrySel.value = initialCountry;
        countrySel.onchange = (e) => {
          clientCountryFilter = e.target.value || '';
          renderClientsView();
        };
      }

      // Populate RE/MAX Inmomás Agent Filter
      const agentSel = document.getElementById('admin-client-filter-agent');
      if (agentSel) {
        const localAgents = allUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');
        agentSel.innerHTML = '<option value="">🇪🇸 Todos los Agentes Inmomás</option>' +
          '<option value="__unassigned__" ' + (clientAgentFilter === '__unassigned__' ? 'selected' : '') + '>⚠️ Sin Agente Asignado</option>' +
          localAgents.map(a => {
            const nat = App.utils.getUserNationality ? App.utils.getUserNationality(a) : '';
            return `<option value="${a.id}" ${clientAgentFilter === a.id ? 'selected' : ''}>${App.utils.escapeHtml(a.firstName)} ${App.utils.escapeHtml(a.lastName)}${nat ? ' (' + App.utils.escapeHtml(nat) + ')' : ''}</option>`;
          }).join('');
        agentSel.onchange = (e) => {
          clientAgentFilter = e.target.value || '';
          renderClientsView();
        };
      }
      
      // Setup Search Input
      const searchInput = document.getElementById('admin-client-search-input');
      if (searchInput) {
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        newSearch.value = clientSearchQuery;
        newSearch.addEventListener('input', (e) => {
          clientSearchQuery = (e.target.value || '').trim().toLowerCase();
          renderClientsView();
        });
      }

      renderClientsView();
    } catch (err) {
      console.error('[Admin] initClients error:', err);
      const container = document.getElementById('admin-clients-board');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: #dc2626; background: rgba(220, 38, 38, 0.03); border: 1px dashed #fca5a5; border-radius: 12px; margin: 16px;">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: 700; font-size: 1.1rem; color: #111827; margin-bottom: 6px;">Error Loading Client Pipeline</div>
            <div style="font-size: 0.85rem; color: #ef4444; font-family: monospace; max-width: 500px; margin: 0 auto 12px; line-height: 1.4;">${err.message || err}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">Please verify your Firebase project permissions and configuration settings.</div>
          </div>
        `;
      }
      App.utils.showToast('Error loading clients.', 'error');
    }
  }

  function setClientTagFilter(tag) {
    activeClientTag = tag;
    renderClientsView();
  }

  function renderClientsView() {
    // 1. Filter clients by Region, Country, Agent & Search query
    let displayClients = [...allClients];

    if (clientRegionFilter && App.utils && App.utils.getRecordRegion) {
      displayClients = displayClients.filter(c => App.utils.getRecordRegion(c, allUsers) === clientRegionFilter);
    }

    if (clientCountryFilter) {
      displayClients = displayClients.filter(c => {
        const pool = [c.country || '', c.currentLocation || ''].filter(Boolean).join(' / ');
        return App.utils.matchesCountryFilter
          ? App.utils.matchesCountryFilter(pool, clientCountryFilter)
          : pool.toLowerCase().includes(clientCountryFilter.toLowerCase());
      });
    }

    if (clientAgentFilter) {
      if (clientAgentFilter === '__unassigned__') {
        displayClients = displayClients.filter(c => !c.localAgentId && !c.localAgentName);
      } else {
        const ag = allUsers.find(u => u.id === clientAgentFilter);
        const agFull = ag ? `${ag.firstName || ''} ${ag.lastName || ''}`.trim().toLowerCase() : '';
        displayClients = displayClients.filter(c =>
          c.localAgentId === clientAgentFilter ||
          (agFull && (c.localAgentName || '').toLowerCase().includes(agFull))
        );
      }
    }

    if (clientSearchQuery) {
      displayClients = displayClients.filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const area = (c.interestArea || '').toLowerCase();
        const country = `${c.country || ''} ${c.currentLocation || ''}`.toLowerCase();
        const agentName = (c.localAgentName || '').toLowerCase();
        const realtor = allUsers.find(u => u.id === (c.realtorId || c.referredBy));
        const realtorName = realtor ? `${realtor.firstName || ''} ${realtor.lastName || ''}`.toLowerCase() : '';
        return fullName.includes(clientSearchQuery) || email.includes(clientSearchQuery) || phone.includes(clientSearchQuery) || area.includes(clientSearchQuery) || country.includes(clientSearchQuery) || agentName.includes(clientSearchQuery) || realtorName.includes(clientSearchQuery);
      });
    }

    filteredClientsCache = displayClients;

    // 2. Update count badge
    const badgeEl = document.getElementById('admin-client-count-badge');
    if (badgeEl) {
      badgeEl.textContent = displayClients.length === allClients.length
        ? `${allClients.length} ${allClients.length === 1 ? 'cliente' : 'clientes'}`
        : `${displayClients.length} / ${allClients.length} clientes`;
    }

    const getRealtorName = (realtorId) => {
      const realtor = allUsers.find(u => u.id === realtorId);
      return realtor ? `${realtor.firstName} ${realtor.lastName}` : 'Directo / Sin asignar';
    };

    // 3. Render Kanban
    App.utils.renderKanbanBoard(
      'admin-clients-board',
      displayClients,
      'App.views.admin.showClientDetail',
      getRealtorName,
      'App.views.admin.handleClientDrop'
    );

    // 4. Render List View
    const tbody = document.getElementById('admin-clients-tbody');
    if (tbody) {
      tbody.innerHTML = '';
      if (displayClients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #6b7280; padding: 2rem;">No se encontraron clientes.</td></tr>`;
      } else {
        displayClients.forEach(client => {
          const dateStr = client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '';
          const tr = document.createElement('tr');
          tr.style.cursor = 'pointer';
          tr.onclick = () => App.views.admin.showClientDetail(client.id);
          
          const fullNameEscaped = App.utils.escapeHtml(`${client.firstName || ''} ${client.lastName || ''}`.trim());

          tr.innerHTML = `
            <td>${dateStr}</td>
            <td style="font-weight:600;">${App.utils.escapeHtml(client.firstName || '')} ${App.utils.escapeHtml(client.lastName || '')}</td>
            <td>${App.utils.escapeHtml(client.email || '')}</td>
            <td>${App.utils.escapeHtml(client.phone || '-')}</td>
            <td>${client.budget && !isNaN(Number(client.budget)) ? '€' + Number(client.budget).toLocaleString() : App.utils.escapeHtml(client.budget || '—')}</td>
            <td>${App.utils.escapeHtml(client.interestArea || '—')}</td>
            <td><span class="badge ${App.utils.getStatusBadgeClass(client.status)}">${App.utils.getStatusLabel(client.status)}</span></td>
            <td><span style="color:#b45309;font-weight:600;">🇪🇸 ${App.utils.escapeHtml(client.localAgentName || 'Sin asignar')}</span></td>
            <td>${App.utils.escapeHtml(getRealtorName(client.realtorId || client.referredBy))}</td>
            <td style="text-align: right; white-space: nowrap;" onclick="event.stopPropagation();">
              <button class="btn btn-outline btn-sm" onclick="App.views.admin.showClientDetail('${client.id}')" title="Ver Detalles" style="padding: 4px 8px; font-size: 0.8rem; margin-right: 4px;">👁️</button>
              <button class="btn btn-sm" onclick="App.views.admin.confirmConvertClient('${client.id}', '${fullNameEscaped}', 'realtor')" title="Convertir a Agente (Realtor)" style="background: #0043ff; color: white; border: none; padding: 4px 8px; font-size: 0.8rem; font-weight: 600; margin-right: 4px;">🔄 Realtor</button>
              <button class="btn btn-sm" onclick="App.utils.confirmDeleteClient('${client.id}', '${fullNameEscaped}', () => App.views.admin.initClients())" title="Eliminar Cliente" style="background: #ef4444; color: white; border: none; padding: 4px 8px; font-size: 0.8rem;">🗑️</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }
    }
  }

  async function handleUpdateClientTag(clientId) {
    try {
      const select = document.getElementById('client-tag-select');
      if (!select) return;
      const newTag = select.value;

      if (!isMaiaOrSuperAdmin()) {
        const client = allClients.find(c => c.id === clientId);
        const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : clientId;
        App.utils.closeModal();
        await requestChangeApproval(
          'Actualizar Etiqueta de Cliente',
          `Cambiar la etiqueta del cliente "${clientName}" a "${newTag}".`
        );
        return;
      }

      await App.auth.updateClientTag(clientId, newTag);
      
      const client = allClients.find(c => c.id === clientId);
      if (client) {
        client.tag = newTag;
        client._tag = newTag;
      }
      
      App.utils.showToast('Etiqueta actualizada correctamente.', 'success');
      App.utils.closeModal();
      renderClientsView();
    } catch (err) {
      console.error(err);
      App.utils.showToast(err.message || 'Error al actualizar etiqueta.', 'error');
    }
  }

  async function handleClientDrop(clientId, newStatus) {
    try {
      if (!isMaiaOrSuperAdmin()) {
        const client = allClients.find(c => c.id === clientId);
        const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : clientId;
        await requestChangeApproval(
          'Mover Estado de Cliente',
          `Mover al cliente "${clientName}" a la fase "${newStatus}".`
        );
        initClients();
        return;
      }

      await App.auth.updateClientStatus(clientId, newStatus, 'Moved by Broker Inmomás (Admin)');
      initClients();
    } catch (err) {
      console.error(err);
      App.utils.showToast(err.message, 'error');
    }
  }

  async function showClientDetail(clientId) {
    try {
      const client = allClients.find(c => c.id === clientId);
      if (!client) return;

      const clientTag = client.tag || App.utils.getClientTag(client);
      const realtor = allUsers.find(u => u.id === (client.realtorId || client.referredBy));
      const realtorName = realtor ? `${realtor.firstName} ${realtor.lastName}` : '—';
      
      const clientRegion = App.utils.getRecordRegion ? App.utils.getRecordRegion(client, allUsers) : '';
      const clientCountryDisplay = client.country && client.country !== '—' ? client.country : (client.currentLocation || '—');
      const clientRegionBadge = App.utils.getRegionBadge ? App.utils.getRegionBadge(clientRegion, true) : '';

      // Get all active local agents sorted/grouped by Client's Region
      const localAgents = allUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');
      const dropdownOptions = buildSmartMasAgentOptions(localAgents, client.localAgentId || '', clientRegion, '-- Seleccionar Agente RE/MAX Inmomás --');

      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(client.status)}">${App.utils.getStatusLabel(client.status)}</span>`;

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
        title: 'Client Details & Assignment',
        body: `
          <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="margin: 0 0 0.25rem;">${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}</h3>
              <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom: 0.5rem;">
                ${statusBadge}
                ${clientRegionBadge}
                <span style="font-size:0.76rem; color:#475569; font-weight:600;">🏳️ ${App.utils.escapeHtml(clientCountryDisplay)}</span>
              </div>
            </div>
            <div>
              ${App.utils.getClientTagBadge(clientTag)}
            </div>
          </div>

          <!-- Convert to Agent / Professional Box -->
          <div style="background: rgba(0, 67, 255, 0.05); border: 1px solid rgba(0, 67, 255, 0.2); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-weight: 700; font-size: 0.85rem; color: #0043ff; text-transform: uppercase;">🔄 Convertir Contacto a Agente / Profesional</label>
            </div>
            <p style="font-size: 0.8rem; color: #4b5563; margin-bottom: 12px; line-height: 1.4;">
              ¿Esta persona se registró como Agente / Profesional y no como cliente comprador? Conviértela para transferir su cuenta a <strong>Gestión de Usuarios</strong> con su código de referido y retirarla de este pipeline de clientes.
            </p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" onclick="App.views.admin.confirmConvertClient('${client.id}', '${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}', 'realtor')" style="background: #0043ff; border-color: #0043ff;">
                🏠 Convertir a Realtor (Agente)
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.views.admin.confirmConvertClient('${client.id}', '${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}', 'broker')" style="border-color: #0043ff; color: #0043ff;">
                🏢 Convertir a Broker
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.views.admin.confirmConvertClient('${client.id}', '${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}', 'colaborador')" style="border-color: #d97706; color: #b45309;">
                🤝 Convertir a Colaborador
              </button>
              <button class="btn btn-outline btn-sm" onclick="App.views.admin.confirmConvertClient('${client.id}', '${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}', 'embajador')" style="border-color: #b45309; color: #92400e; background: rgba(245,158,11,0.08);">
                👑 Convertir a Embajador
              </button>
            </div>
          </div>

          <!-- Tag / Classification Settings -->
          <div style="background: rgba(5, 150, 105, 0.05); border: 1px solid rgba(5, 150, 105, 0.2); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <label for="client-tag-select" style="font-weight: 600; font-size: 0.85rem; color: #059669; text-transform: uppercase;">🏷️ Tag / Clasificación del Contacto</label>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <select id="client-tag-select" class="form-select" style="flex: 1; margin-bottom: 0;">
                <option value="spain_buyer" ${clientTag === 'spain_buyer' ? 'selected' : ''}>🇪🇸 Comprador / Inversor España (Cliente Real)</option>
                <option value="realtor_network" ${clientTag === 'realtor_network' ? 'selected' : ''}>🏠 Red RE/MAX / Realtor o Broker</option>
                <option value="general_lead" ${clientTag === 'general_lead' ? 'selected' : ''}>📋 Lead General / Sin clasificar</option>
              </select>
              <button class="btn btn-primary" onclick="App.views.admin.handleUpdateClientTag('${client.id}')" style="background: #059669; border-color: #059669;">Guardar Tag</button>
            </div>
          </div>
          
          <div style="background: rgba(180, 83, 9, 0.05); border: 1px solid rgba(180, 83, 9, 0.15); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <label for="assign-agent-select" style="font-weight: 600; font-size: 0.85rem; color: #b45309; text-transform: uppercase;">Assign Local Agent (Agente Inmomás)</label>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <select id="assign-agent-select" class="form-select" style="flex: 1; margin-bottom: 0;">
                ${dropdownOptions}
              </select>
              <button class="btn btn-primary" onclick="App.views.admin.handleAssignAgent('${client.id}')" style="background: #b45309; border-color: #b45309;">Assign</button>
            </div>
          </div>

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
                <input type="number" id="financial-referral-pct" class="form-input" style="margin-bottom: 0; padding: 6px 8px; font-size: 0.85rem;" value="${client.referralSharePct || 25}">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.views.admin.handleSaveFinancials('${client.id}')" style="background: #059669; border-color: #059669; width: 100%;">
              Save Financials (Guardar Ajustes Financieros)
            </button>
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
              <div style="font-weight: 600; color: #374151;">Registered</div>
              <div style="color: #6b7280;">${App.utils.formatDate(client.createdAt)}</div>
            </div>
          </div>
          ${client.notes ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; color: #374151; margin-bottom: 1.5rem;">📝 ${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151;">Status Timeline</h4>
          ${timeline || '<p style="color: #6b7280;">No history available.</p>'}
        `,
        footer: `<button class="btn btn-sm" onclick="App.utils.confirmDeleteClient('${clientId}', '${client.firstName} ${client.lastName}', () => App.views.admin.initClients())" style="background: #ef4444; color: white; border: none;">🗑️ Delete</button>
          <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
      });
    } catch (err) {
      console.error(err);
      App.utils.showToast('Error loading details.', 'error');
    }
  }

  async function handleAssignAgent(clientId) {
    try {
      const select = document.getElementById('assign-agent-select');
      const agentId = select.value;
      let agentName = '';
      if (agentId) {
        const agent = allUsers.find(u => u.id === agentId);
        if (agent) agentName = `${agent.firstName} ${agent.lastName}`;
      }

      if (!isMaiaOrSuperAdmin()) {
        const client = allClients.find(c => c.id === clientId);
        const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : clientId;
        App.utils.closeModal();
        await requestChangeApproval(
          'Asignar Agente Local a Cliente',
          `Asignar el agente "${agentName || 'Sin agente'}" al cliente "${clientName}".`
        );
        return;
      }
      
      await App.auth.assignLocalAgent(clientId, agentId || null, agentName || null);
      App.utils.showToast('Local agent assigned successfully!', 'success');
      App.utils.closeModal();
      initClients(); // reload
    } catch (err) {
      console.error(err);
      App.utils.showToast(err.message, 'error');
    }
  }

  async function handleSaveFinancials(clientId) {
    try {
      const salePrice = document.getElementById('financial-sale-price').value;
      const agencyFeePct = document.getElementById('financial-fee-pct').value;
      const referralSharePct = document.getElementById('financial-referral-pct').value;

      if (!isMaiaOrSuperAdmin()) {
        const client = allClients.find(c => c.id === clientId);
        const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : clientId;
        App.utils.closeModal();
        await requestChangeApproval(
          'Guardar Ajustes Financieros',
          `Actualizar datos financieros para el cliente "${clientName}": Precio Venta: €${salePrice}, Fee Agencia: ${agencyFeePct}%, Comisión Referido: ${referralSharePct}%.`
        );
        return;
      }
      
      await App.auth.saveClientFinancials(clientId, salePrice, agencyFeePct, referralSharePct);
      App.utils.showToast('Financial settings saved successfully!', 'success');
      App.utils.closeModal();
      initClients(); // reload
    } catch (err) {
      console.error(err);
      App.utils.showToast(err.message, 'error');
    }
  }

  async function confirmConvertClient(clientId, clientName, targetRole = 'realtor') {
    const roleMap = {
      embajador: 'Embajador',
      broker: 'Broker',
      colaborador: 'Colaborador',
      realtor: 'Agente (Realtor)'
    };
    const roleLabel = roleMap[targetRole] || 'Agente (Realtor)';

    if (!isMaiaOrSuperAdmin()) {
      await requestChangeApproval(
        `Convertir Cliente a ${roleLabel}`,
        `Crear cuenta de ${roleLabel} para el contacto "${clientName}" y registrar su código de referido.`
      );
      return;
    }

    if (!confirm(`¿Deseas convertir a "${clientName}" en ${roleLabel}?\n\n• Se creará su cuenta en el panel de Gestión de Usuarios con su código de referido.\n• Se eliminará del pipeline de clientes.`)) {
      return;
    }
    await handleConvertClient(clientId, targetRole);
  }

  async function handleConvertClient(clientId, targetRole = 'realtor') {
    const roleMap = {
      embajador: 'Embajador',
      broker: 'Broker',
      colaborador: 'Colaborador',
      realtor: 'Realtor'
    };
    const roleLabel = roleMap[targetRole] || 'Realtor';
    try {
      if (!isMaiaOrSuperAdmin()) {
        const client = allClients.find(c => c.id === clientId);
        const clientName = client ? `${client.firstName || ''} ${client.lastName || ''}`.trim() : clientId;
        await requestChangeApproval(
          `Convertir Cliente a ${roleLabel}`,
          `Crear cuenta de ${targetRole} para "${clientName}".`
        );
        return;
      }

      const res = await App.auth.convertClientToUser(clientId, targetRole);
      App.utils.showToast(`¡Contacto convertido exitosamente a ${roleLabel}! Ahora aparece en Gestión de Usuarios. 🎉`, 'success');
      App.utils.closeModal();
      await initClients();
    } catch (err) {
      console.error('[Admin] handleConvertClient error:', err);
      App.utils.showToast(err.message || 'Error al convertir cliente a profesional.', 'error');
    }
  }

  /* ── Lead Assignment Modal and Handlers ── */
  function showLeadAssignmentModal(leadId) {
    try {
      const lead = allLeads.find(l => l.id === leadId);
      if (!lead) return;

      // Get all active local agents with regional grouping
      const localAgents = allUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');
      const leadRegion = App.utils.getRecordRegion ? App.utils.getRecordRegion(lead, allUsers) : '';
      const dropdownOptions = buildSmartMasAgentOptions(localAgents, lead.localAgentId || '', leadRegion, '-- Seleccionar Agente RE/MAX Inmomás --');

      App.utils.showModal({
        title: 'Lead Details & Assignment',
        body: `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.25rem;">${App.utils.escapeHtml(lead.firstName)} ${App.utils.escapeHtml(lead.lastName)}</h3>
            <div style="margin-bottom: 0.5rem;">
              <span class="badge badge--info"><span class="lang-en">Buyer Guide Lead</span><span class="lang-es">Lead de Guía</span></span>
            </div>
          </div>
          
          <div style="background: rgba(180, 83, 9, 0.05); border: 1px solid rgba(180, 83, 9, 0.15); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <label for="assign-lead-agent-select" style="font-weight: 600; font-size: 0.85rem; color: #b45309; text-transform: uppercase;">
              <span class="lang-en">Assign Local Agent (Agente Inmomás)</span>
              <span class="lang-es">Asignar Agente Local (Agente Inmomás)</span>
            </label>
            <div style="display: flex; gap: 8px; margin-top: 8px;">
              <select id="assign-lead-agent-select" class="form-select" style="flex: 1; margin-bottom: 0;">
                ${dropdownOptions}
              </select>
              <button class="btn btn-primary" onclick="App.views.admin.handleAssignLeadAgent('${lead.id}')" style="background: #b45309; border-color: #b45309;">
                <span class="lang-en">Assign</span>
                <span class="lang-es">Asignar</span>
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem; margin-bottom: 1.5rem;">
            <div>
              <div style="font-weight: 600; color: #374151;">Email</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(lead.email)}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;">Phone</div>
              <div style="color: #6b7280;">${App.utils.escapeHtml(lead.phone || '—')}</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;"><span class="lang-en">Lead Source</span><span class="lang-es">Origen del Lead</span></div>
              <div style="color: #6b7280;">Buyer Guide Download</div>
            </div>
            <div>
              <div style="font-weight: 600; color: #374151;"><span class="lang-en">Date Registered</span><span class="lang-es">Fecha de Registro</span></div>
              <div style="color: #6b7280;">${App.utils.formatDate(lead.createdAt)}</div>
            </div>
          </div>
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()"><span class="lang-en">Close</span><span class="lang-es">Cerrar</span></button>`
      });
    } catch (err) {
      console.error(err);
      App.utils.showToast('Error loading details.', 'error');
    }
  }

  /* ── Delete Dossier Lead ── */
  async function handleDeleteLead(leadId) {
    try {
      const lead = allLeads.find(l => l.id === leadId);
      if (!lead) return;

      const leadName = `${lead.firstName} ${lead.lastName}`;

      App.utils.showModal({
        title: `<span class="lang-en">Delete Lead</span><span class="lang-es">Eliminar Lead</span>`,
        body: `
          <div style="text-align: center; padding: 12px 0;">
            <div style="font-size: 2.5rem; margin-bottom: 12px;">⚠️</div>
            <p style="font-size: 0.95rem; color: #334155; margin: 0 0 8px;">
              <span class="lang-en">Are you sure you want to delete the lead</span>
              <span class="lang-es">¿Estás seguro de que deseas eliminar el lead</span>
              <strong>${App.utils.escapeHtml(leadName)}</strong>?
            </p>
            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">
              <span class="lang-en">This action cannot be undone.</span>
              <span class="lang-es">Esta acción no se puede deshacer.</span>
            </p>
          </div>
        `,
        footer: `
          <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">
            <span class="lang-en">Cancel</span>
            <span class="lang-es">Cancelar</span>
          </button>
          <button class="btn btn-sm" onclick="App.views.admin.confirmDeleteLead('${lead.id}')" style="background: #dc2626; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">
            <span class="lang-en">Delete</span>
            <span class="lang-es">Eliminar</span>
          </button>
        `
      });
    } catch (err) {
      console.error(err);
      App.utils.showToast('Error processing request.', 'error');
    }
  }

  async function confirmDeleteLead(leadId) {
    try {
      if (!isMaiaOrSuperAdmin()) {
        const lead = allLeads.find(l => l.id === leadId);
        const leadName = lead ? `${lead.firstName} ${lead.lastName}` : leadId;
        App.utils.closeModal();
        await requestChangeApproval(
          'Eliminar Lead de Guía',
          `Eliminar el registro de descarga/lead de "${leadName}".`
        );
        return;
      }

      await App.auth.deleteDossierLead(leadId);
      allLeads = allLeads.filter(l => l.id !== leadId);
      applyDashboardGeoFilters();
      App.utils.closeModal();
      App.utils.showToast('Lead deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      App.utils.showToast('Error deleting lead.', 'error');
    }
  }

  async function handleAssignLeadAgent(leadId) {
    try {
      const select = document.getElementById('assign-lead-agent-select');
      const agentId = select.value;
      let agentName = '';
      if (agentId) {
        const agent = allUsers.find(u => u.id === agentId);
        if (agent) agentName = `${agent.firstName} ${agent.lastName}`;
      }

      if (!isMaiaOrSuperAdmin()) {
        const lead = allLeads.find(l => l.id === leadId);
        const leadName = lead ? `${lead.firstName} ${lead.lastName}` : leadId;
        App.utils.closeModal();
        await requestChangeApproval(
          'Asignar Agente Local a Lead',
          `Asignar el agente "${agentName || 'Sin asignar'}" al lead "${leadName}".`
        );
        return;
      }
      
      await App.auth.assignLeadToAgent(leadId, agentId || null, agentName || null);
      App.utils.showToast('Local agent assigned to lead successfully!', 'success');
      App.utils.closeModal();
      initDashboard(); // reload dashboard stats and leads table
    } catch (err) {
      console.error(err);
      App.utils.showToast(err.message, 'error');
    }
  }

  /* ── Utility: safely set text content ── */
  /* ============================================
     initNewsletter()
     Loads subscriber stats, wires compose form,
     preview modal, send handler, and history.
     ============================================ */
  async function initNewsletter() {
    try {
      // 1. Load all subscriber groups
      const [allSubs, embajadorSubs, brokerSubs, realtorSubs, agentSubs, history] = await Promise.all([
        App.auth.getNewsletterSubscribers(null),
        App.auth.getNewsletterSubscribers('embajador'),
        App.auth.getNewsletterSubscribers('broker'),
        App.auth.getNewsletterSubscribers('realtor'),
        App.auth.getNewsletterSubscribers('agent_inmomas'),
        App.auth.getNewsletterHistory()
      ]);

      const subscriberMap = {
        all: allSubs,
        embajador: embajadorSubs,
        broker: brokerSubs,
        realtor: realtorSubs,
        agent_inmomas: agentSubs
      };

      // 2. Update stat cards
      setTextById('nl-stat-total',   allSubs.length);
      setTextById('nl-stat-brokers', brokerSubs.length);
      setTextById('nl-stat-realtors', realtorSubs.length);
      setTextById('nl-stat-sent',    history.length);

      // 3. Init recipient & region selectors + badge
      const recipientSelect = document.getElementById('nl-recipients');
      const regionSelect    = document.getElementById('nl-region');
      const recipientBadge  = document.getElementById('nl-recipient-badge');

      if (regionSelect && App.utils && App.utils.getRegionFilterOptionsHtml) {
        regionSelect.innerHTML = App.utils.getRegionFilterOptionsHtml('', '🌍 Todas las Regiones', '🌍 All Regions');
      }

      function getFilteredNewsletterRecipients() {
        const role = recipientSelect ? recipientSelect.value : 'all';
        const reg  = regionSelect    ? regionSelect.value    : '';
        const base = subscriberMap[role] || [];
        if (!reg || !App.utils || !App.utils.getUserRegions) return base;
        return base.filter(u => App.utils.getUserRegions(u).includes(reg));
      }

      function updateBadge() {
        const count = getFilteredNewsletterRecipients().length;
        if (recipientBadge) {
          recipientBadge.textContent = count + ' subscriber' + (count !== 1 ? 's' : '');
        }
      }
      updateBadge();
      if (recipientSelect) recipientSelect.addEventListener('change', updateBadge);
      if (regionSelect) regionSelect.addEventListener('change', updateBadge);

      // 4. Preview button
      const previewBtn   = document.getElementById('nl-preview-btn');
      const previewModal = document.getElementById('nl-preview-modal');
      const previewSubj  = document.getElementById('nl-preview-subject');
      const previewBody  = document.getElementById('nl-preview-body');

      if (previewBtn && previewModal) {
        previewBtn.addEventListener('click', () => {
          const subj = (document.getElementById('nl-subject') || {}).value || '';
          const body = (document.getElementById('nl-body') || {}).value || '';
          if (!subj && !body) {
            App.utils.showToast('Add a subject and body first.', 'error');
            return;
          }
          if (previewSubj) previewSubj.textContent = subj;
          if (previewBody) previewBody.textContent = body;
          previewModal.style.display = 'flex';
        });
      }

      // 5. Close preview modal on backdrop click
      if (previewModal) {
        previewModal.addEventListener('click', (e) => {
          if (e.target === previewModal) previewModal.style.display = 'none';
        });
      }

      // 6. Send form submit
      const form = document.getElementById('nl-compose-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const subject = (document.getElementById('nl-subject') || {}).value || '';
          const body    = (document.getElementById('nl-body') || {}).value || '';
          const recipientRole = recipientSelect ? recipientSelect.value : 'all';
          const recipientRegion = regionSelect ? regionSelect.value : '';
          const recipients    = getFilteredNewsletterRecipients();

          if (!subject || !body) {
            App.utils.showToast('Please fill in the subject and body.', 'error');
            return;
          }
          if (recipients.length === 0) {
            App.utils.showToast('No subscribers in this group.', 'error');
            return;
          }

          const sendBtn = document.getElementById('nl-send-btn');
          if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending...'; }

          try {
            const currentUser = App.auth.getCurrentUser();
            await App.auth.saveNewsletter({
              subject,
              body,
              recipientRole: recipientRegion ? `${recipientRole} (${recipientRegion})` : recipientRole,
              recipientCount: recipients.length,
              recipientEmails: recipients.map(u => u.email),
              sentBy: currentUser ? (currentUser.firstName + ' ' + currentUser.lastName).trim() : 'Admin'
            });

            App.utils.showToast(`🚀 Newsletter sent to ${recipients.length} subscriber${recipients.length !== 1 ? 's' : ''}!`, 'success');

            // Reset form
            form.reset();
            updateBadge();

            // Refresh history and stat
            const updatedHistory = await App.auth.getNewsletterHistory();
            renderNewsletterHistory(updatedHistory);
            setTextById('nl-stat-sent', updatedHistory.length);
          } catch (err) {
            App.utils.showToast('Error sending newsletter: ' + err.message, 'error');
          } finally {
            if (sendBtn) {
              sendBtn.disabled = false;
              sendBtn.innerHTML = '🚀 <span class="lang-en">Send Newsletter</span><span class="lang-es">Enviar Newsletter</span>';
            }
          }
        });
      }

      // 7. Render history
      renderNewsletterHistory(history);

    } catch (err) {
      console.error('[Newsletter] Error loading newsletter view:', err);
    }
  }

  /* ── Renders the campaign history table ── */
  function renderNewsletterHistory(history) {
    const container = document.getElementById('nl-history-container');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 32px;"><span class="lang-en">No campaigns sent yet.</span><span class="lang-es">No se han enviado campañas aún.</span></p>';
      return;
    }

    const roleLabel = { all: 'All', embajador: 'Embajadores', broker: 'Brokers', realtor: 'Realtors', agent_inmomas: 'Agents', colaborador: 'Colaboradores' };

    const rows = history.map(nl => {
      const date = new Date(nl.sentAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const role = roleLabel[nl.recipientRole] || nl.recipientRole || 'All';
      return `
        <tr>
          <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">${nl.subject || '(No subject)'}</td>
          <td style="padding: 14px 16px; color: var(--text-secondary);">${role}</td>
          <td style="padding: 14px 16px; text-align: center;">
            <span style="background: rgba(0,67,255,0.08); color: var(--primary); font-weight: 700; border-radius: 20px; padding: 4px 12px; font-size: 0.85rem;">${nl.recipientCount || 0}</span>
          </td>
          <td style="padding: 14px 16px; color: var(--text-muted); font-size: 0.85rem;">${date}</td>
          <td style="padding: 14px 16px;">
            <span style="background: rgba(16,185,129,0.12); color: #059669; border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; font-weight: 600;">✓ Sent</span>
          </td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border-light);">
              <th style="padding: 12px 16px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600;"><span class="lang-en">Subject</span><span class="lang-es">Asunto</span></th>
              <th style="padding: 12px 16px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600;"><span class="lang-en">Recipients</span><span class="lang-es">Destinatarios</span></th>
              <th style="padding: 12px 16px; text-align: center; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600;">#</th>
              <th style="padding: 12px 16px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600;"><span class="lang-en">Sent At</span><span class="lang-es">Enviado</span></th>
              <th style="padding: 12px 16px; text-align: left; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600;"><span class="lang-en">Status</span><span class="lang-es">Estado</span></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================
     WEBINAR MANAGEMENT & SETTINGS
     Parallel Regional Configurator (B2B / B2C per Region) & Segmented Registrations
     ============================================ */
  let currentWebinarSettings = null;
  let allWebinarRegistrations = [];
  let filteredWebinarCache = [];
  let selectedWebinarConfigRegion = 'north_america';
  let currentWebinarFilter = 'all';
  let currentWebinarRegionFilter = '';
  let currentWebinarCountryFilter = '';
  let currentWebinarAgentFilter = '';
  let currentWebinarSearch = '';

  async function initWebinar() {
    try {
      if (!allUsers || allUsers.length === 0) {
        allUsers = await App.auth.getAllUsers();
      }

      // Auto-sync any registered clients or realtors who aren't yet in webinar_registrations
      if (App.auth && App.auth.syncMissingWebinarRegistrations) {
        await App.auth.syncMissingWebinarRegistrations();
      }

      // 1. Fetch current webinar settings
      currentWebinarSettings = await App.auth.getWebinarSettings();
      if (!currentWebinarSettings) {
        currentWebinarSettings = App.auth.getDefaultWebinarSettings();
      }

      if (pendingAdminRegionFilter) {
        selectedWebinarConfigRegion = pendingAdminRegionFilter;
        currentWebinarRegionFilter = pendingAdminRegionFilter;
        pendingAdminRegionFilter = '';
      }
      if (pendingAdminCountryFilter) {
        currentWebinarCountryFilter = pendingAdminCountryFilter;
        if (!currentWebinarRegionFilter && App.utils && App.utils.resolveRegionFromCountry) {
          const inferredReg = App.utils.resolveRegionFromCountry(currentWebinarCountryFilter);
          if (inferredReg && App.utils.REGIONS[inferredReg]) {
            selectedWebinarConfigRegion = inferredReg;
          }
        }
        pendingAdminCountryFilter = '';
      }

      // 2. Populate Parallel Region Tabs & Config Form
      populateWebinarForm(currentWebinarSettings);

      // 3. Fetch Registrations
      allWebinarRegistrations = await App.auth.getWebinarRegistrations();

      // 4. Populate Table Filter Dropdowns (Region, Country, Agent)
      populateWebinarTableFilters();

      // 5. Render Table & Stats
      renderWebinarTable();

      // 6. Fetch & Render Feedback Surveys
      await loadWebinarFeedbacks();

    } catch (err) {
      console.error('[Admin] initWebinar error:', err);
      App.utils.showToast('Error loading webinar settings and registrations.', 'error');
    }
  }

  function selectWebinarConfigRegion(regionId) {
    if (!regionId || !App.utils || !App.utils.REGIONS[regionId]) return;
    selectedWebinarConfigRegion = regionId;
    if (!currentWebinarSettings) {
      currentWebinarSettings = App.auth.getDefaultWebinarSettings();
    }
    populateWebinarForm(currentWebinarSettings);
  }

  function populateWebinarTableFilters() {
    const regSel = document.getElementById('webinar-filter-region');
    if (regSel && App.utils && App.utils.getRegionFilterOptionsHtml) {
      regSel.innerHTML = App.utils.getRegionFilterOptionsHtml(currentWebinarRegionFilter);
      regSel.value = currentWebinarRegionFilter;
    }

    const countrySel = document.getElementById('webinar-filter-country');
    if (countrySel && App.utils && App.utils.getCountryFilterOptionsHtml) {
      const rawWebCountries = [];
      (allWebinarRegistrations || []).forEach(r => {
        if (r.country && r.country !== '—') rawWebCountries.push(r.country.trim());
      });
      countrySel.innerHTML = App.utils.getCountryFilterOptionsHtml(currentWebinarCountryFilter, currentWebinarRegionFilter, rawWebCountries);
      countrySel.value = currentWebinarCountryFilter;
    }

    const agentSel = document.getElementById('webinar-filter-agent');
    if (agentSel) {
      const aSet = new Set();
      (allWebinarRegistrations || []).forEach(r => {
        let name = r.agentReferrerName || '';
        if (!name && r.referralCode && allUsers) {
          const found = allUsers.find(u => u.referralCode && u.referralCode.toUpperCase() === r.referralCode.toUpperCase());
          if (found) name = `${found.firstName} ${found.lastName}`.trim();
        }
        if (!name && r.howHeard === 'agent' && r.referrerName) name = r.referrerName;
        if (name) aSet.add(name.trim());
      });
      const sortedA = Array.from(aSet).sort((a, b) => a.localeCompare(b));
      agentSel.innerHTML = '<option value="">👤 Todos los Agentes</option>' +
        sortedA.map(a => `<option value="${App.utils.escapeHtml(a)}" ${a === currentWebinarAgentFilter ? 'selected' : ''}>${App.utils.escapeHtml(a)}</option>`).join('');
    }
  }

  function setWebinarRegionFilter(val) {
    currentWebinarRegionFilter = val || '';
    if (currentWebinarRegionFilter && currentWebinarCountryFilter && App.utils && App.utils.resolveRegionFromCountry) {
      if (App.utils.resolveRegionFromCountry(currentWebinarCountryFilter) !== currentWebinarRegionFilter) {
        currentWebinarCountryFilter = '';
      }
    }
    const countrySel = document.getElementById('webinar-filter-country');
    if (countrySel && App.utils && App.utils.getCountryFilterOptionsHtml) {
      const rawWebCountries = (allWebinarRegistrations || []).map(r => r.country || '').filter(Boolean);
      countrySel.innerHTML = App.utils.getCountryFilterOptionsHtml(currentWebinarCountryFilter, currentWebinarRegionFilter, rawWebCountries);
      countrySel.value = currentWebinarCountryFilter;
    }
    if (val && App.utils && App.utils.REGIONS[val]) {
      selectedWebinarConfigRegion = val;
      if (currentWebinarSettings) populateWebinarForm(currentWebinarSettings);
    }
    renderWebinarTable();
  }

  function setWebinarCountryFilter(val) {
    currentWebinarCountryFilter = val || '';
    renderWebinarTable();
  }

  function setWebinarAgentFilter(val) {
    currentWebinarAgentFilter = val || '';
    renderWebinarTable();
  }

  function populateWebinarForm(settings) {
    const regObj = (App.utils && App.utils.REGIONS[selectedWebinarConfigRegion]) || { id: 'north_america', icon: '🌎', shortEs: 'Norteamérica', shortEn: 'North America', color: '#003f99', bg: 'rgba(0,63,153,0.1)', border: 'rgba(0,63,153,0.25)' };
    const regBlock = (settings.regionalConfigs && settings.regionalConfigs[selectedWebinarConfigRegion]) || {};
    const activeType = regBlock.activeType || settings.activeType || 'b2c';
    const typeConfig = regBlock[activeType] || settings[activeType] || {};
    const langVal = typeConfig.language || regBlock.language || regObj.defaultLang || 'en';

    // Render Region Tabs
    const tabsEl = document.getElementById('admin-webinar-region-tabs');
    if (tabsEl && App.utils && App.utils.REGION_LIST) {
      tabsEl.innerHTML = App.utils.REGION_LIST.map(r => {
        const isSel = r.id === selectedWebinarConfigRegion;
        return `
          <button type="button" onclick="App.views.admin.selectWebinarConfigRegion('${r.id}')" class="btn btn-sm" style="border-radius:999px; padding:6px 14px; font-size:0.8rem; font-weight:700; border:1px solid ${isSel ? r.color : '#e2e8f0'}; background:${isSel ? r.color : '#f8fafc'}; color:${isSel ? '#fff' : '#334155'}; cursor:pointer;">
            ${r.icon} <span class="lang-en">${r.shortEn}</span><span class="lang-es">${r.shortEs}</span>
          </button>
        `;
      }).join('');
    }

    // Render Parallel Summary Strip
    const stripEl = document.getElementById('admin-webinar-parallel-strip');
    if (stripEl && App.utils && App.utils.REGION_LIST) {
      const langIcons = { en: '🇬🇧 EN', es: '🇪🇸 ES', fr: '🇫🇷 FR', de: '🇩🇪 DE', nl: '🇳🇱 NL', sv: '🇸🇪 SV', it: '🇮🇹 IT', pl: '🇵🇱 PL', uk: '🇺🇦 UK/BG', ar: '🇦🇪 AR', bilingual: '🌐 ES/EN' };
      stripEl.innerHTML = App.utils.REGION_LIST.map(r => {
        const rb = (settings.regionalConfigs && settings.regionalConfigs[r.id]) || {};
        const rt = rb.activeType || 'b2c';
        const rc = rb[rt] || {};
        const resolvedCfg = (App.auth && App.auth.getRegionalWebinarConfig)
          ? App.auth.getRegionalWebinarConfig(settings, r.id)
          : { ...rc, activeType: rt, date: rc.date || '', time: rc.time || '18:00', scheduled: rc.scheduled !== false && Boolean(rc.date) };
        const isSched = App.utils.isWebinarScheduled ? App.utils.isWebinarScheduled(resolvedCfg) : Boolean(resolvedCfg.date);
        const rDate = resolvedCfg.date || '';
        const rTime = resolvedCfg.time || '18:00';
        const rLang = langIcons[rc.language || rb.language || r.defaultLang || 'en'] || '🌐';
        const isSel = r.id === selectedWebinarConfigRegion;
        const scheduleLine = isSched
          ? `<div style="color:#047857; margin-top:3px; font-weight:700;">📅 ${App.utils.escapeHtml(rDate)} · ${App.utils.escapeHtml(rTime)} · ${rLang}</div>`
          : `<div style="color:#94a3b8; margin-top:3px; font-weight:600;"><span class="lang-en">⏸️ No scheduled webinar</span><span class="lang-es">⏸️ Sin webinario programado</span></div>`;
        return `
          <div onclick="App.views.admin.selectWebinarConfigRegion('${r.id}')" style="cursor:pointer; padding:8px 10px; border-radius:10px; border:1.5px solid ${isSel ? r.color : '#e5e7eb'}; background:${isSel ? r.bg : '#fff'}; font-size:0.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; color:#0f172a;">
              <span>${r.icon} <span class="lang-en">${r.shortEn}</span><span class="lang-es">${r.shortEs}</span></span>
              <span style="padding:1px 6px; border-radius:999px; font-size:0.66rem; background:${isSched ? (rt === 'b2b' ? '#003f99' : '#059669') : '#94a3b8'}; color:#fff;">${isSched ? rt.toUpperCase() : 'OFF'}</span>
            </div>
            ${scheduleLine}
          </div>
        `;
      }).join('');
    }

    // Update Regional Direct Link
    const regLinkEl = document.getElementById('admin-webinar-regional-link');
    if (regLinkEl) {
      regLinkEl.textContent = `https://thespainconnection.com/index.html#webinar?region=${selectedWebinarConfigRegion}`;
    }

    // Update switch buttons UI
    const b2bBtn = document.getElementById('switch-btn-b2b');
    const b2cBtn = document.getElementById('switch-btn-b2c');

    if (b2bBtn && b2cBtn) {
      if (activeType === 'b2b') {
        b2bBtn.style.background = '#003f99';
        b2bBtn.style.color = '#fff';
        b2bBtn.style.boxShadow = '0 4px 12px rgba(0,63,153,0.25)';
        b2cBtn.style.background = 'transparent';
        b2cBtn.style.color = '#4b5563';
        b2cBtn.style.boxShadow = 'none';
      } else {
        b2cBtn.style.background = '#003f99';
        b2cBtn.style.color = '#fff';
        b2cBtn.style.boxShadow = '0 4px 12px rgba(0,63,153,0.25)';
        b2bBtn.style.background = 'transparent';
        b2bBtn.style.color = '#4b5563';
        b2bBtn.style.boxShadow = 'none';
      }
    }

    // Update Status Pill
    const statusText = document.getElementById('admin-status-text');
    const statusBadge = document.getElementById('admin-status-badge');
    const resolvedCurrentCfg = (App.auth && App.auth.getRegionalWebinarConfig)
      ? App.auth.getRegionalWebinarConfig(settings, selectedWebinarConfigRegion)
      : { ...typeConfig, activeType, date: typeConfig.date || '', time: typeConfig.time || '18:00', scheduled: typeConfig.scheduled !== false && Boolean(typeConfig.date) };
    const isCurrentlyScheduled = App.utils && App.utils.isWebinarScheduled
      ? App.utils.isWebinarScheduled(resolvedCurrentCfg)
      : Boolean(resolvedCurrentCfg.date);
    const dateVal = typeConfig.scheduled === false ? '' : (typeConfig.date || '');
    const timeVal = typeConfig.time || (selectedWebinarConfigRegion === 'north_america' ? settings.time : '') || '18:00';

    if (statusText) {
      const modeName = activeType === 'b2b'
        ? `B2B Realtors & Brokers — ${regObj.shortEs}`
        : `B2C Clientes e Inversores — ${regObj.shortEs}`;
      if (isCurrentlyScheduled && dateVal) {
        statusText.textContent = `${modeName} — ${dateVal} (${timeVal} España · Idioma: ${langVal.toUpperCase()})`;
      } else {
        statusText.innerHTML = `<span class="lang-en">No upcoming webinar scheduled for ${App.utils.escapeHtml(regObj.shortEn)} (hidden in Partner Dashboards)</span><span class="lang-es">Sin webinario próximo programado para ${App.utils.escapeHtml(regObj.shortEs)} (oculto en los paneles de Broker, Agente y Embajador)</span>`;
      }
    }

    if (statusBadge) {
      if (isCurrentlyScheduled && dateVal) {
        statusBadge.textContent = `${regObj.shortEs.toUpperCase()} · ${activeType.toUpperCase()}`;
        statusBadge.style.background = activeType === 'b2b' ? '#003f99' : '#059669';
      } else {
        statusBadge.innerHTML = `<span class="lang-en">UNSCHEDULED</span><span class="lang-es">SIN PROGRAMAR</span>`;
        statusBadge.style.background = '#64748b';
      }
    }

    // Populate Form Inputs
    const dateInput = document.getElementById('admin-webinar-date');
    const timeInput = document.getElementById('admin-webinar-time');
    const spotsInput = document.getElementById('admin-webinar-spots');
    const langInput = document.getElementById('admin-webinar-language');
    const titleInput = document.getElementById('admin-webinar-title');
    const targetInput = document.getElementById('admin-webinar-target');
    const subtitleInput = document.getElementById('admin-webinar-subtitle');

    if (dateInput) dateInput.value = dateVal;
    if (timeInput) timeInput.value = timeVal;
    if (spotsInput) spotsInput.value = typeConfig.spots || settings.spotsAvailable || 25;
    if (langInput) langInput.value = langVal;
    if (titleInput) titleInput.value = typeConfig.title || (activeType === 'b2b' ? `Beyond Borders — ${regObj.shortEn}` : `Spain Unlocked — ${regObj.shortEn}`);
    if (targetInput) targetInput.value = typeConfig.targetAudience || '';
    if (subtitleInput) subtitleInput.value = typeConfig.subtitle || '';
  }

  function setWebinarType(newType) {
    if (!currentWebinarSettings) {
      currentWebinarSettings = App.auth.getDefaultWebinarSettings();
    }
    if (!currentWebinarSettings.regionalConfigs) currentWebinarSettings.regionalConfigs = {};
    if (!currentWebinarSettings.regionalConfigs[selectedWebinarConfigRegion]) {
      currentWebinarSettings.regionalConfigs[selectedWebinarConfigRegion] = {};
    }
    currentWebinarSettings.regionalConfigs[selectedWebinarConfigRegion].activeType = newType;

    if (selectedWebinarConfigRegion === 'north_america') {
      currentWebinarSettings.activeType = newType;
      if (currentWebinarSettings[newType]?.date) currentWebinarSettings.date = currentWebinarSettings[newType].date;
      if (currentWebinarSettings[newType]?.time) currentWebinarSettings.time = currentWebinarSettings[newType].time;
    }

    populateWebinarForm(currentWebinarSettings);
    const rName = (App.utils && App.utils.REGIONS[selectedWebinarConfigRegion]) ? App.utils.REGIONS[selectedWebinarConfigRegion].shortEs : selectedWebinarConfigRegion;
    App.utils.showToast(`Modo cambiado a ${newType.toUpperCase()} para ${rName}. Haz clic en "Guardar y Publicar" para confirmar.`, 'info');
  }

  async function saveWebinarConfig(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!isMaiaOrSuperAdmin()) {
      await requestChangeApproval(
        'Actualizar Configuración Regional de Webinar',
        `Guardar nueva configuración de webinario para la región "${selectedWebinarConfigRegion}".`
      );
      return;
    }

    const saveBtn = document.getElementById('admin-save-webinar-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>⏳ Guardando...</span>';
    }

    try {
      if (!currentWebinarSettings) {
        currentWebinarSettings = App.auth.getDefaultWebinarSettings();
      }
      if (!currentWebinarSettings.regionalConfigs) currentWebinarSettings.regionalConfigs = {};
      if (!currentWebinarSettings.regionalConfigs[selectedWebinarConfigRegion]) {
        currentWebinarSettings.regionalConfigs[selectedWebinarConfigRegion] = { activeType: 'b2c', b2b: {}, b2c: {} };
      }

      const regBlock = currentWebinarSettings.regionalConfigs[selectedWebinarConfigRegion];
      const activeType = regBlock.activeType || currentWebinarSettings.activeType || 'b2c';
      const dateVal = (document.getElementById('admin-webinar-date')?.value || '').trim();
      const timeVal = document.getElementById('admin-webinar-time')?.value || currentWebinarSettings.time || '18:00';
      const spotsVal = parseInt(document.getElementById('admin-webinar-spots')?.value || '25', 10);
      const langVal = document.getElementById('admin-webinar-language')?.value || 'en';
      const titleVal = document.getElementById('admin-webinar-title')?.value || '';
      const targetVal = document.getElementById('admin-webinar-target')?.value || '';
      const subtitleVal = document.getElementById('admin-webinar-subtitle')?.value || '';
      const isScheduledNow = Boolean(dateVal);

      regBlock.activeType = activeType;
      regBlock.language = langVal;
      regBlock.scheduled = isScheduledNow;
      if (!regBlock[activeType]) regBlock[activeType] = {};
      regBlock[activeType].date = dateVal;
      regBlock[activeType].scheduled = isScheduledNow;
      regBlock[activeType].time = timeVal;
      regBlock[activeType].spots = spotsVal;
      regBlock[activeType].language = langVal;
      if (titleVal) regBlock[activeType].title = titleVal;
      if (targetVal) regBlock[activeType].targetAudience = targetVal;
      if (subtitleVal) regBlock[activeType].subtitle = subtitleVal;

      // Also sync global root settings when saving North America (default landing webinar)
      if (selectedWebinarConfigRegion === 'north_america') {
        currentWebinarSettings.activeType = activeType;
        currentWebinarSettings.date = dateVal;
        currentWebinarSettings.time = timeVal;
        currentWebinarSettings.spotsAvailable = spotsVal;
        if (!currentWebinarSettings[activeType]) currentWebinarSettings[activeType] = {};
        currentWebinarSettings[activeType].date = dateVal;
        currentWebinarSettings[activeType].scheduled = isScheduledNow;
        currentWebinarSettings[activeType].time = timeVal;
        currentWebinarSettings[activeType].spots = spotsVal;
        if (titleVal) currentWebinarSettings[activeType].title = titleVal;
        if (targetVal) currentWebinarSettings[activeType].targetAudience = targetVal;
        if (subtitleVal) currentWebinarSettings[activeType].subtitle = subtitleVal;
      }

      const saved = await App.auth.saveWebinarSettings(currentWebinarSettings);
      currentWebinarSettings = saved;

      populateWebinarForm(saved);
      const rLabel = (App.utils && App.utils.REGIONS[selectedWebinarConfigRegion]) ? App.utils.REGIONS[selectedWebinarConfigRegion].shortEs : selectedWebinarConfigRegion;
      if (isScheduledNow) {
        App.utils.showToast(`✅ ¡Webinario de ${rLabel} (${activeType.toUpperCase()}) programado para ${dateVal}!`, 'success');
      } else {
        App.utils.showToast(`⏸️ Webinario de ${rLabel} marcado como sin programar (oculto en los paneles de colaboradores).`, 'info');
      }

    } catch (err) {
      console.error('[Admin] Error saving webinar settings:', err);
      App.utils.showToast('Error al guardar la configuración: ' + err.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 <span class="lang-en">Save &amp; Publish on Website</span><span class="lang-es">Guardar y Publicar en la Web</span>';
      }
    }
  }

  async function clearRegionalWebinarSchedule() {
    const dateInput = document.getElementById('admin-webinar-date');
    if (dateInput) dateInput.value = '';
    await saveWebinarConfig(null);
  }

  function resetWebinarDefaults() {
    const defaults = App.auth.getDefaultWebinarSettings();
    currentWebinarSettings = defaults;
    populateWebinarForm(currentWebinarSettings);
    App.utils.showToast('Valores recomendados por región cargados. Selecciona una fecha futura y haz clic en "Guardar y Publicar" para activar.', 'info');
  }

  /* ---- Robust categorization helper for Webinar Registrations (B2B vs B2C) ---- */
  function isWebinarB2B(r) {
    if (!r) return false;
    const type = (r.webinarType || '').toLowerCase().trim();
    const role = (r.role || r.contactType || '').toLowerCase().trim();
    const title = (r.webinar || '').toLowerCase().trim();
    const agency = (r.agency || '').toLowerCase().trim();
    const interest = (r.clientInterest || '').toLowerCase().trim();

    // 1. Explicit webinarType
    if (type === 'b2c') return false;
    if (type === 'b2b') return true;

    // 2. Explicit role/contactType
    if (role === 'client' || role === 'cliente') return false;
    if (['embajador', 'realtor', 'broker', 'agent', 'agent_inmomas', 'colaborador'].includes(role)) return true;

    // 3. Client interest field present -> B2C
    if (interest && interest.length > 0) return false;

    // 4. Typical buyer/client objective text in agency field -> B2C
    if (
      agency.includes('client') ||
      agency.includes('interes') ||
      agency.includes('invers') ||
      agency.includes('comprador') ||
      agency.includes('buyer') ||
      agency.includes('investor') ||
      agency.includes('holiday') ||
      agency.includes('golden visa') ||
      agency.includes('relocat') ||
      agency.includes('mudanza') ||
      agency.includes('vivir') ||
      agency.includes('jubila') ||
      agency.includes('segunda residencia')
    ) {
      return false;
    }

    // 5. Title keywords
    if (title.includes('spain unlocked') || title.includes('living') || title.includes('investing') || title.includes('vivir') || title.includes('clientes')) {
      return false;
    }
    if (title.includes('beyond borders') || title.includes('partner') || title.includes('b2b') || title.includes('masterclass para realtors')) {
      return true;
    }

    // 6. Professional brokerage keywords in agency field -> B2B
    if (
      agency.includes('remax') ||
      agency.includes('re/max') ||
      agency.includes('realty') ||
      agency.includes('broker') ||
      agency.includes('real estate') ||
      agency.includes('inmobiliaria') ||
      agency.includes('century 21') ||
      agency.includes('c21') ||
      agency.includes('keller') ||
      agency.includes('coldwell') ||
      agency.includes('exp') ||
      agency.includes('compass') ||
      agency.includes('sothebys') ||
      agency.includes('sotheby') ||
      agency.includes('lifestyle') ||
      agency.includes('homes') ||
      agency.includes('properties') ||
      agency.includes('inmotools') ||
      agency.includes('independent') ||
      agency.includes('independiente')
    ) {
      return true;
    }

    // 7. Referral code prefixes (EMB, REA, BRO, BRK, LOC, COL)
    if (r.referralCode) {
      const code = String(r.referralCode).toUpperCase().trim();
      if (code.startsWith('EMB-') || code.startsWith('REA-') || code.startsWith('BRO-') || code.startsWith('BRK-') || code.startsWith('LOC-') || code.startsWith('COL-')) {
        return true;
      }
    }

    // Default to B2C (client/investor) if no B2B indicator found
    return false;
  }

  function updateWebinarStats(registrations) {
    const total = registrations.length;
    let b2bCount = 0;
    let b2cCount = 0;

    registrations.forEach(r => {
      if (isWebinarB2B(r)) {
        b2bCount++;
      } else {
        b2cCount++;
      }
    });

    setTextById('admin-stat-webinar', total);
    setTextById('admin-stat-webinar-b2b', b2bCount);
    setTextById('admin-stat-webinar-b2c', b2cCount);
  }

  function filterWebinarTable(filterType) {
    currentWebinarFilter = filterType;

    // Update filter buttons UI
    const allBtn = document.getElementById('webinar-filter-all');
    const b2bBtn = document.getElementById('webinar-filter-b2b');
    const b2cBtn = document.getElementById('webinar-filter-b2c');

    [allBtn, b2bBtn, b2cBtn].forEach(b => {
      if (b) {
        b.className = 'btn btn-sm btn-outline';
        b.style.background = 'transparent';
        b.style.color = '';
      }
    });

    const activeBtn = filterType === 'b2b' ? b2bBtn : (filterType === 'b2c' ? b2cBtn : allBtn);
    if (activeBtn) {
      activeBtn.className = 'btn btn-sm';
      activeBtn.style.background = '#003f99';
      activeBtn.style.color = '#fff';
    }

    renderWebinarTable();
  }

  function searchWebinarTable(query) {
    currentWebinarSearch = (query || '').toLowerCase().trim();
    renderWebinarTable();
  }

  function renderWebinarTable() {
    const tbody = document.getElementById('webinar-registrations-tbody');
    if (!tbody) return;

    if (!allWebinarRegistrations || allWebinarRegistrations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:#6b7280;">No hay inscripciones registradas todavía.</td></tr>`;
      return;
    }

    const HOW_LABELS = {
      social: 'Redes Sociales',
      remax: 'Red RE/MAX',
      agent: 'Referido de Agente',
      collaborator: 'Colaborador / Broker',
      email: 'Email / Newsletter',
      event: 'Evento / Conferencia',
      other: 'Otro'
    };

    let filtered = allWebinarRegistrations.filter(r => {
      const isB2B = isWebinarB2B(r);

      if (currentWebinarFilter === 'b2b' && !isB2B) return false;
      if (currentWebinarFilter === 'b2c' && isB2B) return false;

      const recRegion = App.utils.getRecordRegion ? App.utils.getRecordRegion(r, allUsers) : (r.webinarRegion || r.region || '');
      if (currentWebinarRegionFilter && recRegion !== currentWebinarRegionFilter) return false;

      if (currentWebinarCountryFilter) {
        const pool = [r.country || '', r.state || ''].filter(Boolean).join(' / ');
        const matched = App.utils.matchesCountryFilter
          ? App.utils.matchesCountryFilter(pool, currentWebinarCountryFilter)
          : pool.toLowerCase().includes(currentWebinarCountryFilter.toLowerCase());
        if (!matched) return false;
      }

      if (currentWebinarAgentFilter) {
        let aName = r.agentReferrerName || '';
        if (!aName && r.referralCode && allUsers) {
          const found = allUsers.find(u => u.referralCode && u.referralCode.toUpperCase() === r.referralCode.toUpperCase());
          if (found) aName = `${found.firstName} ${found.lastName}`.trim();
        }
        if (!aName && r.howHeard === 'agent' && r.referrerName) aName = r.referrerName;
        if (aName.trim() !== currentWebinarAgentFilter) return false;
      }

      if (currentWebinarSearch) {
        const searchPool = `${r.firstName || ''} ${r.lastName || ''} ${r.email || ''} ${r.phone || ''} ${r.agency || ''} ${r.clientInterest || ''} ${r.country || ''} ${r.state || ''} ${r.referrerName || ''} ${r.agentReferrerName || ''} ${recRegion}`.toLowerCase();
        if (!searchPool.includes(currentWebinarSearch)) return false;
      }

      return true;
    });

    filteredWebinarCache = filtered;
    updateWebinarStats(filtered);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:#6b7280;">No se encontraron registros con los filtros seleccionados.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const date = App.utils.formatDate(r.createdAt);
      const how  = HOW_LABELS[r.howHeard] || r.howHeard || '—';
      const ref  = r.referrerName ? App.utils.escapeHtml(r.referrerName) : '—';
      const isB2B = isWebinarB2B(r);

      const typeBadge = isB2B
        ? `<span style="background:rgba(0,63,153,0.1);color:#003f99;border:1px solid rgba(0,63,153,0.2);padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">🏢 B2B Realtor</span>`
        : `<span style="background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.2);padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">🏡 B2C Cliente</span>`;

      // Tagged agent column
      let agentTagCell = '—';
      let mappedAgentName = r.agentReferrerName || '';
      let mappedAgentRole = r.agentReferrerRole || '';

      if (r.referralCode && !mappedAgentName && allUsers) {
        const foundAgent = allUsers.find(u => u.referralCode && u.referralCode.toUpperCase() === r.referralCode.toUpperCase());
        if (foundAgent) {
          mappedAgentName = `${foundAgent.firstName} ${foundAgent.lastName}`.trim();
          mappedAgentRole = foundAgent.role;
        }
      }

      if (mappedAgentName || r.referralCode) {
        const agentName = mappedAgentName ? App.utils.escapeHtml(mappedAgentName) : '';
        const code = r.referralCode ? App.utils.escapeHtml(r.referralCode) : '';
        const roleBadge = mappedAgentRole
          ? `<span style="background:rgba(0,67,255,.08);color:var(--primary);border-radius:12px;padding:1px 7px;font-size:.72rem;margin-left:4px;">${mappedAgentRole}</span>`
          : '';
        agentTagCell = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#16a34a;font-size:1rem;" title="Via referral link">🔗</span>
            <div>
              <div style="font-weight:600;font-size:.83rem;color:var(--primary);">${agentName}${roleBadge}</div>
              ${code ? `<div style="font-size:.74rem;color:#6b7280;font-family:monospace;">${code}</div>` : ''}
            </div>
          </div>`;
      } else if (r.howHeard === 'agent' && r.referrerName) {
        agentTagCell = `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:#3b82f6;font-size:1rem;" title="Via dropdown selection">👤</span>
            <div style="font-weight:600;font-size:.83rem;color:#3b82f6;">${App.utils.escapeHtml(r.referrerName)}</div>
          </div>`;
      }

      const agencyGoal = isB2B ? (r.agency || '—') : (r.clientInterest || r.agency || 'Inversión / Mudanza');
      const recRegion = App.utils.getRecordRegion ? App.utils.getRecordRegion(r, allUsers) : (r.webinarRegion || r.region || '');
      const regBadgeHtml = App.utils.getRegionBadge ? App.utils.getRegionBadge(recRegion, true) : '';
      const langPill = r.webinarLanguage ? `<span style="font-size:0.7rem;background:#f1f5f9;color:#334155;padding:1px 6px;border-radius:6px;margin-left:4px;font-weight:700;">${App.utils.escapeHtml(r.webinarLanguage.toUpperCase())}</span>` : '';

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;color:var(--text-muted);">${date}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">${typeBadge}${langPill}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-weight:600;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.85rem;">${App.utils.escapeHtml(r.email)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.85rem;">${App.utils.escapeHtml(r.phone || '—')}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.85rem;">${App.utils.escapeHtml(agencyGoal)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">
            <div style="margin-bottom:3px;">${regBadgeHtml}</div>
            <span style="background:rgba(0,67,255,.07);color:var(--primary);border-radius:20px;padding:2px 9px;font-size:.78rem;font-weight:600;">${App.utils.escapeHtml(r.country || '—')}</span>
            ${r.state ? `<small style="display:block;color:#6b7280;font-size:0.73rem;margin-top:2px;">${App.utils.escapeHtml(r.state)}</small>` : ''}
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${how}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">${agentTagCell}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">
            <button class="btn btn-danger btn-sm" onclick="App.views.admin.handleDeleteWebinarRegistration('${r.id}')" title="Delete Registration" style="background-color: #dc2626; border-color: #dc2626; color: white;">
              🗑️
            </button>
          </td>
        </tr>`;
    }).join('');
  }

  function exportUsersToExcel() {
    const targetList = (filteredUsersCache && filteredUsersCache.length > 0) ? filteredUsersCache : allUsers;
    if (!targetList || targetList.length === 0) {
      App.utils.showToast('No users to export.', 'error');
      return;
    }

    const lookupMaps = App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers) : null;
    const headers = [
      'Date', 'First Name', 'Last Name', 'Email', 'Phone', 'Agency', 'Role', 'Status', 'Ambassador Umbrella', 'Broker Umbrella', 'RE/MAX Inmomás Agent', 'Nationality', 'Country', 'Regions', 'State', 'Webinar Registered'
    ];

    const rows = targetList.map(u => {
      const nat = App.utils.getUserNationality ? App.utils.getUserNationality(u) : (u.nationality || u.country || '');
      const regs = App.utils.getUserRegions ? App.utils.getUserRegions(u).map(r => (App.utils.REGIONS[r] ? App.utils.REGIONS[r].shortEs : r)).join(', ') : '';
      const parents = App.utils.resolveUserUmbrellaParents ? App.utils.resolveUserUmbrellaParents(u, allUsers, lookupMaps) : {};
      const embLabel = (parents.embajador && parents.embajador.id !== u.id) ? `${parents.embajador.firstName || ''} ${parents.embajador.lastName || ''}`.trim() : '';
      const brkLabel = (parents.broker && parents.broker.id !== u.id) ? (`${parents.broker.firstName || ''} ${parents.broker.lastName || ''}`.trim() + (parents.broker.agencyName ? ` (${parents.broker.agencyName})` : '')) : '';
      const inmomasRes = App.utils.resolveAssignedInmomasAgent ? App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps) : { name: '' };

      return [
        u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : '',
        u.firstName || '',
        u.lastName || '',
        u.email || '',
        u.phone || '',
        u.agencyName || u.agency || '',
        u.role || '',
        u.status || '',
        embLabel,
        brkLabel,
        inmomasRes.name ? (inmomasRes.inherited ? `${inmomasRes.name} (vía ${inmomasRes.inheritedFrom})` : inmomasRes.name) : '',
        nat,
        u.country || '',
        regs,
        u.state || '',
        u.isWebinarRegistered ? 'Yes' : 'No'
      ];
    });

    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = headers.map((h, i) => {
        let maxLen = h.length;
        rows.forEach(r => {
          const val = r[i] ? String(r[i]) : '';
          if (val.length > maxLen) maxLen = Math.min(val.length, 45);
        });
        return { wch: maxLen + 3 };
      });
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios Registrados');
      XLSX.writeFile(wb, `Users-Export-${new Date().toISOString().slice(0,10)}.xlsx`);
      App.utils.showToast(`✅ Exportados ${targetList.length} usuarios a Excel (.xlsx).`, 'success');
      return;
    }

    const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `Users-Export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.utils.showToast(`✅ Exportados ${targetList.length} usuarios a Excel.`, 'success');
  }
  function toggleClientView(viewType) {
    const board = document.getElementById('admin-clients-board');
    const list = document.getElementById('admin-clients-list');
    const btnBoard = document.getElementById('btn-admin-client-board');
    const btnList = document.getElementById('btn-admin-client-list');

    if (viewType === 'list') {
      if (board) board.style.display = 'none';
      if (list) list.style.display = 'block';
      if (btnBoard) {
        btnBoard.classList.remove('active');
        btnBoard.style.background = 'transparent';
        btnBoard.style.boxShadow = 'none';
      }
      if (btnList) {
        btnList.classList.add('active');
        btnList.style.background = 'white';
        btnList.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }
    } else {
      if (board) board.style.display = 'flex';
      if (list) list.style.display = 'none';
      if (btnList) {
        btnList.classList.remove('active');
        btnList.style.background = 'transparent';
        btnList.style.boxShadow = 'none';
      }
      if (btnBoard) {
        btnBoard.classList.add('active');
        btnBoard.style.background = 'white';
        btnBoard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }
    }
  }

  function exportClientsToExcel() {
    const hasFilter = !!(clientRegionFilter || clientCountryFilter || clientAgentFilter || clientSearchQuery);
    const targetClients = hasFilter ? filteredClientsCache : allClients;
    if (!targetClients || targetClients.length === 0) {
      App.utils.showToast('No clients to export.', 'error');
      return;
    }

    const headers = [
      'Date', 'First Name', 'Last Name', 'Email', 'Phone', 'Region', 'Country', 'Budget', 'Interest Area', 'Status', 'Assigned RE/MAX Inmomás Agent', 'Referring Realtor / Partner'
    ];

    const getRealtorName = (realtorId) => {
      const realtor = allUsers.find(u => u.id === realtorId);
      return realtor ? `${realtor.firstName || ''} ${realtor.lastName || ''}`.trim() : 'Directo / Sin asignar';
    };

    const rows = targetClients.map(c => {
      const regId = App.utils.getRecordRegion ? App.utils.getRecordRegion(c, allUsers) : '';
      const regName = (regId && App.utils.REGIONS && App.utils.REGIONS[regId]) ? App.utils.REGIONS[regId].shortEs : '';
      const cnt = (c.country && c.country !== '—') ? c.country : (c.currentLocation || '');
      return [
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : '',
        c.firstName || '',
        c.lastName || '',
        c.email || '',
        c.phone || '',
        regName,
        cnt,
        c.budget || '',
        c.interestArea || '',
        c.status || '',
        c.localAgentName || 'Sin asignar',
        getRealtorName(c.realtorId || c.referredBy)
      ];
    });

    const regSuffix = clientRegionFilter ? `-${clientRegionFilter}` : '';
    if (typeof XLSX !== 'undefined') {
      const wb = XLSX.utils.book_new();
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = headers.map((h, i) => {
        let maxLen = h.length;
        rows.forEach(r => {
          const val = r[i] ? String(r[i]) : '';
          if (val.length > maxLen) maxLen = Math.min(val.length, 45);
        });
        return { wch: maxLen + 3 };
      });
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      XLSX.writeFile(wb, `Clients-Export${regSuffix}-${new Date().toISOString().slice(0,10)}.xlsx`);
      App.utils.showToast(`✅ Exportados ${targetClients.length} clientes a Excel (.xlsx).`, 'success');
      return;
    }

    const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `Clients-Export${regSuffix}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    App.utils.showToast(`✅ Exportados ${targetClients.length} clientes a Excel.`, 'success');
  }

  async function exportWebinarToExcel() {
    try {
      if (!allUsers || allUsers.length === 0) {
        allUsers = await App.auth.getAllUsers();
      }
      const hasActiveWebinarFilter = !!(currentWebinarFilter !== 'all' || currentWebinarRegionFilter || currentWebinarCountryFilter || currentWebinarAgentFilter || currentWebinarSearch);
      const rawRegs = await App.auth.getWebinarRegistrations();
      const registrations = hasActiveWebinarFilter ? filteredWebinarCache : rawRegs;
      if (!registrations || registrations.length === 0) {
        App.utils.showToast('No registrations to export.', 'error');
        return;
      }

      // Ensure SheetJS is loaded
      if (typeof XLSX === 'undefined') {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'js/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = () => {
              const cdn = document.createElement('script');
              cdn.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
              cdn.onload = resolve;
              cdn.onerror = reject;
              document.head.appendChild(cdn);
            };
            document.head.appendChild(script);
          });
        } catch (loadErr) {
          console.warn('[Admin] Could not load SheetJS dynamically:', loadErr);
        }
      }

      const HOW_LABELS = {
        social: 'Social Media',
        remax: 'RE/MAX Network',
        agent: 'Agent Referral',
        collaborator: 'Realtor / Broker Collaborator',
        email: 'Email / Newsletter',
        event: 'Event / Conference',
        other: 'Other'
      };

      const headersB2C = [
        'Date', 'Region', 'Language', 'Event Type', 'Webinar Theme', 'Target Date', 'First Name', 'Last Name', 'Email', 'Phone',
        'Client Goal / Interest', 'Country', 'State / Province',
        'How They Heard', 'Referring Agent (self-reported)',
        'Agent Via Link', 'Referral Code', 'Agent Role',
        'Tagged Agent', 'Source', 'GDPR Consent'
      ];

      const headersB2B = [
        'Date', 'Region', 'Language', 'Event Type', 'Webinar Theme', 'Target Date', 'First Name', 'Last Name', 'Email', 'Phone',
        'Agency / Brokerage', 'Country', 'State / Province',
        'How They Heard', 'Referring Agent (self-reported)',
        'Agent Via Link', 'Referral Code', 'Agent Role',
        'Tagged Agent', 'Source', 'GDPR Consent'
      ];

      const headersAll = [
        'Date', 'Region', 'Language', 'Event Type', 'Webinar Theme', 'Target Date', 'First Name', 'Last Name', 'Email', 'Phone',
        'Agency / Goal', 'Country', 'State / Province',
        'How They Heard', 'Referring Agent (self-reported)',
        'Agent Via Link', 'Referral Code', 'Agent Role',
        'Tagged Agent', 'Source', 'GDPR Consent'
      ];

      const rowsB2C = [];
      const rowsB2B = [];
      const rowsAll = [];
      const rowsByRegion = {};

      registrations.forEach(r => {
        let mappedAgentName = r.agentReferrerName || '';
        let mappedAgentRole = r.agentReferrerRole || '';

        if (r.referralCode && !mappedAgentName && allUsers) {
          const foundAgent = allUsers.find(u => u.referralCode && u.referralCode.toUpperCase() === r.referralCode.toUpperCase());
          if (foundAgent) {
            mappedAgentName = `${foundAgent.firstName || ''} ${foundAgent.lastName || ''}`.trim();
            mappedAgentRole = foundAgent.role || '';
          }
        }

        const taggedAgent = mappedAgentName 
          ? mappedAgentName 
          : (r.howHeard === 'agent' && r.referrerName ? r.referrerName : '');

        const isB2B = isWebinarB2B(r);
        const eventType = isB2B ? 'B2B (Realtors & Brokers)' : 'B2C (Clientes Finales & Inversores)';
        const recRegId = App.utils.getRecordRegion ? App.utils.getRecordRegion(r, allUsers) : (r.webinarRegion || r.region || '');
        const recRegLabel = (recRegId && App.utils.REGIONS && App.utils.REGIONS[recRegId]) ? App.utils.REGIONS[recRegId].shortEs : (recRegId || 'Norteamérica');
        const recLang = (r.webinarLanguage || 'en').toUpperCase();

        const baseRowB2C = [
          r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
          recRegLabel,
          recLang,
          eventType,
          r.webinar || 'Spain Unlocked: Living & Investing',
          r.webinarDate || '',
          r.firstName || '',
          r.lastName || '',
          r.email || '',
          r.phone || '',
          r.clientInterest || r.agency || '',
          r.country || '',
          r.state || '',
          HOW_LABELS[r.howHeard] || r.howHeard || '',
          r.referrerName || '',
          mappedAgentName || '',
          r.referralCode || '',
          mappedAgentRole || '',
          taggedAgent,
          r.source || 'direct',
          r.gdprConsent ? 'Yes' : 'No'
        ];

        const baseRowB2B = [
          r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
          recRegLabel,
          recLang,
          eventType,
          r.webinar || 'Beyond Borders',
          r.webinarDate || '',
          r.firstName || '',
          r.lastName || '',
          r.email || '',
          r.phone || '',
          r.agency || '',
          r.country || '',
          r.state || '',
          HOW_LABELS[r.howHeard] || r.howHeard || '',
          r.referrerName || '',
          mappedAgentName || '',
          r.referralCode || '',
          mappedAgentRole || '',
          taggedAgent,
          r.source || 'direct',
          r.gdprConsent ? 'Yes' : 'No'
        ];

        const baseRowAll = [
          r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
          recRegLabel,
          recLang,
          eventType,
          r.webinar || '',
          r.webinarDate || '',
          r.firstName || '',
          r.lastName || '',
          r.email || '',
          r.phone || '',
          isB2B ? (r.agency || '') : (r.clientInterest || r.agency || ''),
          r.country || '',
          r.state || '',
          HOW_LABELS[r.howHeard] || r.howHeard || '',
          r.referrerName || '',
          mappedAgentName || '',
          r.referralCode || '',
          mappedAgentRole || '',
          taggedAgent,
          r.source || 'direct',
          r.gdprConsent ? 'Yes' : 'No'
        ];

        rowsAll.push(baseRowAll);
        if (!rowsByRegion[recRegLabel]) rowsByRegion[recRegLabel] = [];
        rowsByRegion[recRegLabel].push(baseRowAll);
        if (isB2B) {
          rowsB2B.push(baseRowB2B);
        } else {
          rowsB2C.push(baseRowB2C);
        }
      });

      // Export using SheetJS (.xlsx) with separated sheets (Hoja 1: B2C, Hoja 2: B2B, Hoja 3: Todos):
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();

        const autoFit = (aoa) => {
          const colWidths = [];
          aoa.forEach(row => {
            row.forEach((cell, i) => {
              const len = cell ? String(cell).length : 0;
              colWidths[i] = Math.max(colWidths[i] || 10, Math.min(len + 3, 50));
            });
          });
          return colWidths.map(wch => ({ wch }));
        };

        // Hoja 1: B2C Registrados (Clientes Finales & Inversores)
        const wsB2CData = [headersB2C, ...rowsB2C];
        const wsB2C = XLSX.utils.aoa_to_sheet(wsB2CData);
        wsB2C['!cols'] = autoFit(wsB2CData);
        XLSX.utils.book_append_sheet(wb, wsB2C, 'B2C Registrados');

        // Hoja 2: B2B Registrados (Realtors & Brokers)
        const wsB2BData = [headersB2B, ...rowsB2B];
        const wsB2B = XLSX.utils.aoa_to_sheet(wsB2BData);
        wsB2B['!cols'] = autoFit(wsB2BData);
        XLSX.utils.book_append_sheet(wb, wsB2B, 'B2B Registrados');

        // Hoja 3: Todos los Registrados (Consolidado)
        const wsAllData = [headersAll, ...rowsAll];
        const wsAll = XLSX.utils.aoa_to_sheet(wsAllData);
        wsAll['!cols'] = autoFit(wsAllData);
        XLSX.utils.book_append_sheet(wb, wsAll, 'Todos los Registrados');

        // Hojas adicionales por Región
        Object.keys(rowsByRegion).forEach(regLabel => {
          const safeSheetName = String(regLabel).replace(/[\\/?*\[\]:]/g, '').slice(0, 28) || 'Region';
          const regSheetData = [headersAll, ...rowsByRegion[regLabel]];
          const wsReg = XLSX.utils.aoa_to_sheet(regSheetData);
          wsReg['!cols'] = autoFit(regSheetData);
          if (!wb.SheetNames.includes(safeSheetName)) {
            XLSX.utils.book_append_sheet(wb, wsReg, safeSheetName);
          }
        });

        const regFileTag = currentWebinarRegionFilter ? `-${currentWebinarRegionFilter}` : '';
        const fileName = `Spain-Connection-Webinar-Registrados${regFileTag}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        try {
          XLSX.writeFile(wb, fileName);
        } catch (writeErr) {
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        App.utils.showToast(`✅ Exportados a Excel: ${rowsB2C.length} en hoja B2C y ${rowsB2B.length} en hoja B2B (${registrations.length} en total).`, 'success');
        return;
      }

      // Fallback: Multi-sheet XML Spreadsheet (.xls)
      const escapeXml = v => String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const makeXmlSheet = (name, headers, rows) => {
        let xml = `  <Worksheet ss:Name="${escapeXml(name)}">\n    <Table>\n`;
        xml += `      <Row>\n` + headers.map(h => `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`).join('') + `      </Row>\n`;
        rows.forEach(r => {
          xml += `      <Row>\n` + r.map(c => `        <Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>\n`).join('') + `      </Row>\n`;
        });
        xml += `    </Table>\n  </Worksheet>\n`;
        return xml;
      };

      const xmlSpreadsheet = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#003F99" ss:Pattern="Solid"/>
  </Style>
 </Styles>
` + makeXmlSheet('B2C Registrados', headersB2C, rowsB2C)
  + makeXmlSheet('B2B Registrados', headersB2B, rowsB2B)
  + makeXmlSheet('Todos los Registrados', headersAll, rowsAll)
  + `</Workbook>`;

      const blob = new Blob([xmlSpreadsheet], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Spain-Connection-Webinar-Registrados-${new Date().toISOString().slice(0, 10)}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      App.utils.showToast(`✅ Exportados a Excel: ${rowsB2C.length} en hoja B2C y ${rowsB2B.length} en hoja B2B.`, 'success');
    } catch (err) {
      console.error('[Admin] exportWebinar error:', err);
      App.utils.showToast('Error exporting registrations.', 'error');
    }
  }

  /* ============================================
     MASTERCLASS SURVEY RESPONSES & PROJECTIONS
     ============================================ */
  let allWebinarFeedbacks = [];

  async function loadWebinarFeedbacks() {
    try {
      allWebinarFeedbacks = await App.auth.getWebinarFeedbacks();
      updateWebinarFeedbackStats(allWebinarFeedbacks);
      renderWebinarFeedbackTable(allWebinarFeedbacks);
    } catch (err) {
      console.error('[Admin] loadWebinarFeedbacks error:', err);
    }
  }

  function updateWebinarFeedbackStats(feedbacks) {
    const totalEl = document.getElementById('admin-stat-feedback-total');
    const ratingEl = document.getElementById('admin-stat-feedback-avg-rating');
    const clientsEl = document.getElementById('admin-stat-feedback-clients-yes');
    const hotEl = document.getElementById('admin-stat-feedback-timeframe-hot');

    const total = feedbacks.length;
    if (totalEl) totalEl.textContent = total;

    if (total === 0) {
      if (ratingEl) ratingEl.textContent = '—';
      if (clientsEl) clientsEl.textContent = '0';
      if (hotEl) hotEl.textContent = '0';
      return;
    }

    const sumRatings = feedbacks.reduce((acc, f) => acc + (parseInt(f.rating, 10) || 0), 0);
    const avg = (sumRatings / total).toFixed(1);
    if (ratingEl) ratingEl.textContent = `⭐ ${avg} / 5`;

    const yesClients = feedbacks.filter(f => (f.has_clients || '').toLowerCase().includes('yes') || (f.has_clients || '').toLowerCase().includes('sí')).length;
    if (clientsEl) clientsEl.textContent = yesClients;

    const hotClients = feedbacks.filter(f => (f.client_timeframe || '').includes('0 to 3') || (f.client_timeframe || '').includes('0-3') || (f.client_timeframe || '').includes('0 a 3')).length;
    if (hotEl) hotEl.textContent = hotClients;
  }

  function renderWebinarFeedbackTable(feedbacks) {
    const tbody = document.getElementById('webinar-feedback-tbody');
    if (!tbody) return;

    if (!feedbacks || feedbacks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2.5rem;color:#6b7280;font-size:0.95rem;">No se han registrado respuestas a la encuesta de feedback todavía.</td></tr>`;
      return;
    }

    tbody.innerHTML = feedbacks.map(item => {
      const dateStr = item.submitted_at ? App.utils.formatDate(item.submitted_at) : '—';
      const ratingStars = '⭐'.repeat(item.rating || 5);
      
      let clientBadge = '<span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;background:rgba(107,114,128,0.1);color:#4b5563;">👤 No</span>';
      if ((item.has_clients || '').toLowerCase().includes('yes') || (item.has_clients || '').toLowerCase().includes('sí')) {
        clientBadge = '<span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;background:rgba(16,185,129,0.15);color:#059669;">🔥 SÍ, Clientes Activos</span>';
      } else if ((item.has_clients || '').toLowerCase().includes('expecting') || (item.has_clients || '').toLowerCase().includes('soon') || (item.has_clients || '').toLowerCase().includes('pronto')) {
        clientBadge = '<span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;background:rgba(245,158,11,0.15);color:#d97706;">⏳ Pronto / Esperando</span>';
      }

      let tfBadge = `<span style="font-size:0.8rem;color:#64748b;">${App.utils.escapeHtml(item.client_timeframe || 'N/A')}</span>`;
      if ((item.client_timeframe || '').includes('0 to 3') || (item.client_timeframe || '').includes('0-3') || (item.client_timeframe || '').includes('0 a 3')) {
        tfBadge = `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;">⚡ 0 a 3 Meses</span>`;
      } else if ((item.client_timeframe || '').includes('3 to 6') || (item.client_timeframe || '').includes('3-6') || (item.client_timeframe || '').includes('3 a 6')) {
        tfBadge = `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;">📅 3 a 6 Meses</span>`;
      } else if ((item.client_timeframe || '').includes('6 to 9') || (item.client_timeframe || '').includes('6-9') || (item.client_timeframe || '').includes('6 a 9')) {
        tfBadge = `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#fefce8;color:#a16207;border:1px solid #fef08a;">🏖️ 6 a 9 Meses</span>`;
      } else if ((item.client_timeframe || '').includes('9') || (item.client_timeframe || '').includes('More than')) {
        tfBadge = `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:0.78rem;font-weight:700;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;">🔍 +9 Meses</span>`;
      }

      const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
      const phoneLink = cleanPhone ? `<a href="https://wa.me/${cleanPhone}" target="_blank" style="color:#059669;font-weight:600;text-decoration:none;">💬 ${App.utils.escapeHtml(item.phone)}</a>` : (item.phone || '—');
      const notes = `${item.usefulness ? `<strong>${App.utils.escapeHtml(item.usefulness)}</strong><br>` : ''}${item.comments ? `<em>"${App.utils.escapeHtml(item.comments)}"</em>` : ''}` || '—';

      return `
        <tr>
          <td style="font-size:0.82rem;white-space:nowrap;color:#475569;">${dateStr}</td>
          <td style="white-space:nowrap;"><span title="${item.rating || 5}/5">${ratingStars}</span></td>
          <td style="font-weight:700;color:var(--text-primary);">${App.utils.escapeHtml(item.name || '—')}</td>
          <td><a href="mailto:${App.utils.escapeHtml(item.email || '')}" style="color:var(--blue);text-decoration:none;font-size:0.88rem;">${App.utils.escapeHtml(item.email || '—')}</a></td>
          <td style="font-size:0.85rem;white-space:nowrap;">${phoneLink}</td>
          <td style="font-size:0.85rem;color:#475569;">${App.utils.escapeHtml(item.location_or_agency || '—')}</td>
          <td>${clientBadge}</td>
          <td>${tfBadge}</td>
          <td style="font-size:0.82rem;max-width:220px;color:#334155;line-height:1.4;">${notes}</td>
          <td style="white-space:nowrap;">
            <button onclick="App.views.admin.deleteFeedbackSurvey('${item.id}')" class="btn btn-sm" style="background:#fee2e2;color:#991b1b;border:none;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:0.75rem;" title="Eliminar respuesta">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function deleteFeedbackSurvey(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta respuesta de la encuesta?')) return;
    try {
      await App.auth.deleteWebinarFeedback(id);
      App.utils.showToast('Respuesta eliminada con éxito.', 'success');
      await loadWebinarFeedbacks();
    } catch (err) {
      console.error('[Admin] deleteFeedbackSurvey error:', err);
      App.utils.showToast('Error al eliminar respuesta.', 'error');
    }
  }

  async function exportSurveyToExcel() {
    try {
      const list = await App.auth.getWebinarFeedbacks();
      if (!list || list.length === 0) {
        App.utils.showToast('No hay respuestas de encuesta para exportar.', 'error');
        return;
      }
      const headers = ['Fecha', 'Calificacion (1-5)', 'Nombre', 'Email', 'Telefono', 'Agencia_o_Ubicacion', 'Tiene_Clientes', 'Plazo_Estimado', 'Utilidad', 'Comentarios'];
      const rows = list.map(item => [
        item.submitted_at || '',
        item.rating || '',
        item.name || '',
        item.email || '',
        item.phone || '',
        item.location_or_agency || '',
        item.has_clients || '',
        item.client_timeframe || '',
        item.usefulness || '',
        item.comments || ''
      ]);

      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = headers.map((h, i) => {
          let maxLen = h.length;
          rows.forEach(r => {
            const val = r[i] ? String(r[i]) : '';
            if (val.length > maxLen) maxLen = Math.min(val.length, 45);
          });
          return { wch: maxLen + 3 };
        });
        XLSX.utils.book_append_sheet(wb, ws, 'Encuestas Feedback');
        XLSX.writeFile(wb, `Encuestas_Feedback_Webinar_${new Date().toISOString().slice(0,10)}.xlsx`);
        App.utils.showToast(`✅ Exportadas ${list.length} encuestas a Excel (.xlsx).`, 'success');
        return;
      }

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Encuestas_Feedback_Webinar_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      App.utils.showToast(`✅ Exportadas ${list.length} encuestas a CSV/Excel.`, 'success');
    } catch (err) {
      console.error('[Admin] exportSurveyToExcel error:', err);
      App.utils.showToast('Error exportando encuestas.', 'error');
    }
  }

  /* ── Dedicated Agreements View ── */
  async function initAgreementsView() {
    try {
      // Load all users so we can enrich notifications with contractCompanyData
      const usersList = await App.auth.getAllUsers();
      allUsers = usersList;

      // 1. Fetch pending agreement notifications
      let pendingNotifs = [];
      if (!App.demoMode && App.db) {
        const snap = await App.db.collection('agreement_notifications')
          .where('status', '==', 'pending_admin')
          .get();
        snap.forEach(doc => pendingNotifs.push({ id: doc.id, ...doc.data() }));
        pendingNotifs.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
      } else {
        pendingNotifs = (App.demoData.agreementNotifications || [])
          .filter(n => n.status === 'pending_admin');
      }

      // Enrich notifications with user's latest contractCompanyData & include any user with agreementStatus === 'data_submitted' / 'uploaded'
      pendingNotifs = pendingNotifs.map(n => {
        const u = usersList.find(usr => usr.id === n.userId);
        return {
          ...n,
          contractCompanyData: n.contractCompanyData || (u && u.contractCompanyData) || null
        };
      });

      usersList.forEach(u => {
        if ((u.agreementStatus === 'data_submitted' || u.agreementStatus === 'uploaded') && !pendingNotifs.some(n => n.userId === u.id)) {
          pendingNotifs.push({
            id: 'user_notif_' + u.id,
            userId: u.id,
            userName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            userRole: u.role,
            agencyName: u.agencyName || (u.contractCompanyData && u.contractCompanyData.companyLegalName) || '—',
            email: u.email,
            type: 'contract_data_submitted',
            contractCompanyData: u.contractCompanyData || null,
            uploadedAt: u.contractDataSubmittedAt || u.agreementUploadedAt || u.createdAt,
            status: 'pending_admin'
          });
        }
      });

      // Render pending agreements in tab
      renderPendingAgreementsTab(pendingNotifs);

      // 2. Fetch signed agreements
      const signedUsers = usersList.filter(u => u.agreementStatus === 'signed' || u.agreementSigned === true);

      // Render signed agreements list
      renderSignedAgreementsTab(signedUsers);

    } catch (err) {
      console.error('[Admin] initAgreementsView error:', err);
      App.utils.showToast('Error loading agreements.', 'error');
    }
  }

  function renderPendingAgreementsTab(notifications) {
    const list = document.getElementById('admin-agreements-list-tab');
    const badge = document.getElementById('admin-agreements-badge');
    const count = document.getElementById('admin-agreements-count-tab');

    // Update sidebar badge
    if (badge) {
      if (notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
    if (count) {
      count.textContent = notifications.length > 0 ? `(${notifications.length} pendientes)` : '';
    }

    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📋</div><p class="empty-state__text">No hay datos fiscales o acuerdos pendientes de revisión.</p></div>';
      return;
    }

    list.innerHTML = notifications.map(n => {
      const cd = n.contractCompanyData || {};
      const hasFiscalData = Boolean(cd.companyLegalName || cd.taxId || cd.bankAccountNumber);
      const isVirtualNotif = String(n.id || '').startsWith('user_notif_');
      const realNotifId = isVirtualNotif ? '' : n.id;

      return `
      <div class="pending-card glass-card" id="agreement-card-${n.id}" style="padding:1.35rem; margin-bottom:1rem; text-align:left; border-left:4px solid #003f99;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
          <div>
            <div style="font-weight:800; font-size:1.05rem; color:#111827;">${App.utils.escapeHtml(n.userName)}</div>
            <div style="font-size:0.84rem; color:#4b5563; margin-top:2px;">
              ${n.userRole === 'embajador' ? '👑 Embajador' : (n.userRole === 'broker' ? '🏢 Broker' : '👤 Realtor')} &nbsp;·&nbsp; <strong>${App.utils.escapeHtml(cd.companyLegalName || n.agencyName || '—')}</strong> &nbsp;·&nbsp; ${App.utils.escapeHtml(n.email)}
            </div>
            <div style="font-size:0.78rem; color:#6b7280; margin-top:4px;">
              🕒 Enviado el: ${App.utils.formatDate(n.uploadedAt)}
            </div>
          </div>
          <span class="badge badge--pending" style="background:#dbeafe; color:#1e40af; font-weight:700; white-space:nowrap;">
            🔔 Datos Recibidos — Preparar Contrato Externo
          </span>
        </div>

        ${hasFiscalData ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:1rem; margin-bottom:1rem; font-size:0.83rem;">
          <div>
            <div style="font-weight:700; color:#1e3a8a; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">🏢 Datos Fiscales de la Empresa</div>
            <div style="margin-bottom:3px;"><strong>Razón Social:</strong> ${App.utils.escapeHtml(cd.companyLegalName || '—')}</div>
            <div style="margin-bottom:3px;"><strong>Tax ID / EIN / CIF:</strong> ${App.utils.escapeHtml(cd.taxId || '—')}</div>
            <div style="margin-bottom:3px;"><strong>Nº Licencia:</strong> ${App.utils.escapeHtml(cd.licenseNumber || '—')}</div>
            <div style="margin-bottom:3px;"><strong>Domicilio Fiscal:</strong> ${App.utils.escapeHtml(cd.fiscalAddress || '—')} (${App.utils.escapeHtml(cd.country || cd.fiscalCountry || '—')})</div>
            <div style="margin-bottom:3px;"><strong>Broker Firmante:</strong> ${App.utils.escapeHtml(cd.brokerFullName || cd.brokerSignerName || '—')}</div>
            <div><strong>Contacto Broker:</strong> ${App.utils.escapeHtml(cd.brokerEmail || cd.brokerSignerEmail || '—')} · ${App.utils.escapeHtml(cd.brokerPhone || cd.brokerSignerPhone || '—')}</div>
          </div>
          <div>
            <div style="font-weight:700; color:#166534; margin-bottom:6px; border-bottom:1px solid #e2e8f0; padding-bottom:4px;">🏦 Datos Bancarios Corporativos</div>
            <div style="margin-bottom:3px;"><strong>Titular de la Cuenta:</strong> ${App.utils.escapeHtml(cd.bankAccountHolder || '—')}</div>
            <div style="margin-bottom:3px;"><strong>Banco:</strong> ${App.utils.escapeHtml(cd.bankName || '—')}</div>
            <div style="margin-bottom:3px;"><strong>IBAN / Nº Cuenta:</strong> <code style="background:#fff; padding:2px 6px; border:1px solid #cbd5e1; border-radius:4px; font-weight:700;">${App.utils.escapeHtml(cd.bankAccountNumber || '—')}</code></div>
            <div style="margin-bottom:3px;"><strong>SWIFT / BIC / Routing:</strong> <code style="background:#fff; padding:2px 6px; border:1px solid #cbd5e1; border-radius:4px; font-weight:700;">${App.utils.escapeHtml(cd.bankSwiftRouting || '—')}</code></div>
            <div style="margin-bottom:3px;"><strong>Dirección Banco:</strong> ${App.utils.escapeHtml(cd.bankAddress || '—')}</div>
            ${(cd.additionalNotes || cd.notes) ? `<div style="margin-top:4px; color:#475569;"><strong>Notas:</strong> ${App.utils.escapeHtml(cd.additionalNotes || cd.notes)}</div>` : ''}
          </div>
        </div>
        ` : ''}

        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
            <button type="button" class="btn btn-outline btn-sm" style="border-color:#003da5; color:#003da5; background:#eff6ff; font-weight:700;" onclick="App.views.admin.exportUserAgreementToWord('${n.userId}')">
              📄 Exportar Master Referral Agreement (Word .doc)
            </button>
            ${hasFiscalData ? `
              <button type="button" class="btn btn-outline btn-sm" onclick="App.views.admin.copyContractData('${n.userId}')">
                📋 Copiar Datos para Contrato
              </button>
            ` : ''}
            ${n.fileUrl && !n.fileUrl.startsWith('demo://') ? `
              <a href="${App.utils.escapeHtml(n.fileUrl)}" target="_blank" class="btn btn-outline btn-sm">
                📥 Descargar Documento Subido
              </a>
            ` : ''}
            <button type="button" class="btn btn-primary btn-sm" style="background:#16a34a; border-color:#16a34a;" onclick="App.views.admin.markAgreementSigned('${realNotifId}', '${n.userId}')">
              ✅ Marcar Contrato como Presentado y Firmado
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('admin-file-input-${n.id}').click()">
              📎 Subir PDF Firmado (Opcional)
            </button>
            <input type="file" id="admin-file-input-${n.id}" accept=".pdf,.doc,.docx" style="display:none;" onchange="App.views.admin.handleAdminAgreementUpload(this, '${realNotifId}', '${n.userId}')">
          </div>
          <div id="admin-upload-status-${n.id}" style="font-size:0.8rem; color:#4b5563;"></div>
        </div>
      </div>
      `;
    }).join('');
  }

  function renderSignedAgreementsTab(users) {
    const tbody = document.getElementById('admin-signed-agreements-tbody');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6b7280;">No hay contratos activos todavía.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const cd = u.contractCompanyData || {};
      const companySummary = cd.companyLegalName
        ? `<div><strong>${App.utils.escapeHtml(cd.companyLegalName)}</strong></div><div style="font-size:0.75rem;color:#6b7280;">ID: ${App.utils.escapeHtml(cd.taxId || '—')} · ${App.utils.escapeHtml(cd.country || cd.fiscalCountry || '')}</div>`
        : App.utils.escapeHtml(u.agencyName || u.brokerNameManual || '—');
      const bankSummary = cd.bankAccountNumber
        ? `<div><strong>${App.utils.escapeHtml(cd.bankName || '—')}</strong></div><div style="font-size:0.75rem;color:#6b7280;"><code>${App.utils.escapeHtml(cd.bankAccountNumber)}</code></div>`
        : '—';

      return `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.85rem;font-weight:600;">${App.utils.escapeHtml(u.firstName)} ${App.utils.escapeHtml(u.lastName)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${u.role === 'embajador' ? '👑 Embajador' : (u.role === 'broker' ? '🏢 Broker' : '👤 Realtor')}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${companySummary}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${bankSummary}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${App.utils.escapeHtml(u.email)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">
          <span class="badge badge--approved">✅ Firmado</span>
          ${u.agreementFinalUrl && !u.agreementFinalUrl.startsWith('demo://') ? `<div style="margin-top:4px;"><a href="${App.utils.escapeHtml(u.agreementFinalUrl)}" target="_blank" style="color:#16a34a;font-weight:600;text-decoration:underline;font-size:0.76rem;">📥 Ver PDF</a></div>` : ''}
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-outline btn-xs" onclick="App.views.admin.exportUserAgreementToWord('${u.id}')" style="padding:2px 8px;font-size:0.75rem;border-color:#003da5;color:#003da5;background:#eff6ff;font-weight:700;">📄 Word (.doc)</button>
            ${cd.companyLegalName ? `<button class="btn btn-outline btn-xs" onclick="App.views.admin.copyContractData('${u.id}')" style="padding:2px 8px;font-size:0.75rem;">📋 Copiar Datos</button>` : ''}
            <button class="btn btn-outline btn-xs" onclick="document.getElementById('admin-reupload-file-input-${u.id}').click()" style="padding:2px 8px;font-size:0.75rem;">
              📎 Adjuntar PDF
            </button>
          </div>
          <input type="file" id="admin-reupload-file-input-${u.id}" accept=".pdf,.doc,.docx" style="display:none;" onchange="App.views.admin.handleAdminAgreementUpload(this, '', '${u.id}')">
          <div id="admin-reupload-status-${u.id}" style="font-size:0.75rem;color:#4b5563;margin-top:2px;"></div>
        </td>
      </tr>
      `;
    }).join('');
  }

  function exportUserAgreementToWord(userId) {
    if (typeof App.generateReferralAgreementDoc !== 'function') {
      App.utils.showToast('El generador de documento Word no está disponible.', 'error');
      return;
    }
    if (!userId || userId === 'template') {
      App.generateReferralAgreementDoc({ isTemplate: true });
      return;
    }
    const user = (allUsers || []).find(u => u.id === userId) || (App.demoData && App.demoData.users ? App.demoData.users.find(u => u.id === userId) : null);
    if (!user) {
      App.generateReferralAgreementDoc({ isTemplate: true });
      return;
    }
    App.generateReferralAgreementDoc(user);
  }

  function copyContractData(userId) {
    const user = (allUsers || []).find(u => u.id === userId) || (App.demoData && App.demoData.users ? App.demoData.users.find(u => u.id === userId) : null);
    if (!user || !user.contractCompanyData) {
      App.utils.showToast('No hay datos fiscales registrados para este usuario.', 'error');
      return;
    }
    const cd = user.contractCompanyData;
    const text = [
      `=== DATOS PARA CONTRATO DE COLABORACIÓN ===`,
      `Colaborador: ${user.firstName || ''} ${user.lastName || ''} (${user.role === 'embajador' ? 'Embajador' : (user.role === 'broker' ? 'Broker' : 'Realtor')})`,
      `Email usuario: ${user.email || '—'}`,
      ``,
      `-- DATOS FISCALES DE LA EMPRESA --`,
      `Razón Social / Empresa: ${cd.companyLegalName || '—'}`,
      `NIF / Tax ID / EIN / CIF: ${cd.taxId || '—'}`,
      `Nº Licencia Inmobiliaria: ${cd.licenseNumber || '—'}`,
      `Domicilio Fiscal: ${cd.fiscalAddress || '—'}`,
      `País Fiscal: ${cd.country || cd.fiscalCountry || '—'}`,
      `Broker Responsable (Firmante): ${cd.brokerFullName || cd.brokerSignerName || '—'}`,
      `Email del Broker: ${cd.brokerEmail || cd.brokerSignerEmail || '—'}`,
      `Teléfono del Broker: ${cd.brokerPhone || cd.brokerSignerPhone || '—'}`,
      ``,
      `-- DATOS BANCARIOS CORPORATIVOS --`,
      `Titular de la Cuenta: ${cd.bankAccountHolder || '—'}`,
      `Nombre del Banco: ${cd.bankName || '—'}`,
      `IBAN / Número de Cuenta: ${cd.bankAccountNumber || '—'}`,
      `SWIFT / BIC / Routing ABA: ${cd.bankSwiftRouting || '—'}`,
      `Dirección del Banco: ${cd.bankAddress || '—'}`,
      `Notas Adicionales: ${cd.additionalNotes || cd.notes || '—'}`
    ].join('\n');

    App.utils.copyToClipboard(text);
    App.utils.showToast('📋 Datos fiscales y bancarios copiados al portapapeles.', 'success');
  }

  async function markAgreementSigned(notifId, userId) {
    if (!isMaiaOrSuperAdmin()) {
      await requestChangeApproval(
        'Confirmación de Contrato de Colaboración Firmado',
        `Marcar el Contrato de Colaboración como presentado y firmado para el usuario ${userId}.`
      );
      return;
    }

    try {
      const now = new Date().toISOString();
      if (!App.demoMode && App.db) {
        await App.db.collection('users').doc(userId).update({
          agreementStatus: 'signed',
          agreementSigned: true,
          agreementSignedAt: now
        });
        if (notifId) {
          await App.db.collection('agreement_notifications').doc(notifId).update({
            status: 'signed',
            adminSignedAt: now
          });
        } else {
          // Also close any pending_admin notifications for this userId
          const snap = await App.db.collection('agreement_notifications')
            .where('userId', '==', userId)
            .where('status', '==', 'pending_admin')
            .get();
          const batch = App.db.batch();
          snap.forEach(doc => batch.update(doc.ref, { status: 'signed', adminSignedAt: now }));
          await batch.commit();
        }
      } else {
        const user = App.demoData.users.find(u => u.id === userId);
        if (user) {
          user.agreementStatus = 'signed';
          user.agreementSigned = true;
          user.agreementSignedAt = now;
        }
        (App.demoData.agreementNotifications || []).forEach(n => {
          if (n.id === notifId || (n.userId === userId && n.status === 'pending_admin')) {
            n.status = 'signed';
            n.adminSignedAt = now;
          }
        });
        if (App.auth && typeof App.auth.saveDemoData === 'function') App.auth.saveDemoData();
      }

      App.utils.showToast('✅ Contrato marcado como presentado y firmado.', 'success');
      initAgreementsView();
    } catch (err) {
      console.error('[Admin] markAgreementSigned error:', err);
      App.utils.showToast('Error al actualizar el estado del contrato.', 'error');
    }
  }

  async function handleAdminAgreementUpload(input, notifId, userId) {
    const file = input.files[0];
    if (!file) return;

    if (!isMaiaOrSuperAdmin()) {
      input.value = '';
      await requestChangeApproval(
        'Firma y Carga de Acuerdo de Colaborador',
        `Subir documento de acuerdo firmado (${file.name}) para el usuario ${userId}.`
      );
      return;
    }

    const statusEl = notifId 
      ? document.getElementById(`admin-upload-status-${notifId}`) 
      : document.getElementById(`admin-reupload-status-${userId}`);
    if (statusEl) statusEl.innerHTML = '<span style="color:#6b7280;">⏳ Subiendo acuerdo firmado...</span>';

    try {
      let fileUrl = null;
      if (!App.demoMode && App.storage) {
        const ref = App.storage.ref(`agreements/${userId}/final_${Date.now()}_${file.name}`);
        await ref.put(file);
        fileUrl = await ref.getDownloadURL();
      } else {
        fileUrl = `demo://agreements/${userId}/final_${file.name}`;
      }

      const now = new Date().toISOString();
      if (!App.demoMode && App.db) {
        // Update user record
        await App.db.collection('users').doc(userId).update({
          agreementStatus: 'signed',
          agreementSigned: true,
          agreementSignedAt: now,
          agreementFinalUrl: fileUrl
        });

        // Update notification status if notifId exists
        if (notifId) {
          await App.db.collection('agreement_notifications').doc(notifId).update({
            status: 'signed',
            adminSignedAt: now,
            finalAgreementUrl: fileUrl
          });
        }
      } else {
        // Demo mode
        const user = App.demoData.users.find(u => u.id === userId);
        if (user) {
          user.agreementStatus = 'signed';
          user.agreementSigned = true;
          user.agreementSignedAt = now;
          user.agreementFinalUrl = fileUrl;
        }
        if (notifId) {
          const notif = (App.demoData.agreementNotifications || []).find(n => n.id === notifId);
          if (notif) {
            notif.status = 'signed';
            notif.adminSignedAt = now;
            notif.finalAgreementUrl = fileUrl;
          }
        }
        if (App.auth && typeof App.auth.saveDemoData === 'function') App.auth.saveDemoData();
      }

      App.utils.showToast('✅ Contrato final subido y colaborador activado.', 'success');
      
      // Reload the view
      initAgreementsView();
    } catch (err) {
      console.error('[Admin] Final agreement upload error:', err);
      if (statusEl) statusEl.innerHTML = '<span style="color:#e11b22;">❌ Error al subir archivo.</span>';
      App.utils.showToast('Error al subir el contrato.', 'error');
    }
  }

  /* ============================================
     initUnified()
     Shows a unified directory merging users,
     clients, and webinar registrations.
     Always sorted with newest records first.
     Includes real-time agent & status filters.
     ============================================ */
  let currentUnifiedData = [];

  const KNOWN_AGENT_MAP = {
    'HmfMyuSCbyOIQqi29DiP4v5CKop2': 'James Lavoie Montero',
    'LOC-LAVOIE MONTERO-HmfM': 'James Lavoie Montero',
    'James Lavoie Montero': 'James Lavoie Montero',
    'James Lavoie / Isabelle': 'James Lavoie Montero',
    'Jamisa Home Lifestyle': 'James Lavoie Montero',
    'LOC-LUÍS RODRIGUEZ-zHUD': 'Ángel Luís Rodriguez',
    'zHUDljXCeEaNgFxq45PTLw4SCq82': 'Ángel Luís Rodriguez',
    'LOC-MARTINEZ -GBPi': 'José Martínez',
    'GBPiUDjC5RVLru7Paw6T14iSD0k1': 'José Martínez',
    'jose martinez ': 'José Martínez',
    'José Martínez Sánchez': 'José Martínez',
    'LOC-SEYED HOSSEINI-o6tP': 'Sepehr Seyed Hosseini',
    'o6tPXBtmTnW3pP3QtTr3rP1Q6rG3': 'Sepehr Seyed Hosseini',
    'Sepehr seyed hosseini': 'Sepehr Seyed Hosseini',
    'Sepehr Hosseini': 'Sepehr Seyed Hosseini',
    'LOC-MCNEAL-opTD': 'Denise McNeal',
    'opTDoczG6ZVKwnNYp2sDVYbCOVz1': 'Denise McNeal',
    'Denise McNeal ': 'Denise McNeal',
    'Maia Honczaryk': 'Maia Honczaryk',
    'ADM-INMOMAS': 'Maia Honczaryk',
    'Giancarlo Agudelo': 'Giancarlo Agudelo',
    'Ana Martínez': 'Ana Martínez',
    'LOC-ESCARABAJAL-XAyK': 'Dionisio Escarabajal Asensio',
    'XAyKZzGVmdZB8KOWIPqGDHhyRHm1': 'Dionisio Escarabajal Asensio',
    'LOC-LLERAS-inTN': 'Ozzie Lleras',
    'inTN2iHJIrc3zouiDS4mJfkkaV02': 'Ozzie Lleras',
    'Ozzie Llleras': 'Ozzie Lleras',
    'admin-001': 'Maia Honczaryk'
  };

  async function initUnified() {
    try {
      // Always fetch freshest data from store
      allUsers = await App.auth.getAllUsers();
      allClients = await App.auth.getClients();
      const webinarRegs = await App.auth.getWebinarRegistrations();
      
      const unifiedMap = new Map();
      const userLookup = { ...KNOWN_AGENT_MAP };
      
      // Build omnidirectional lookup for referrer names
      allUsers.forEach(u => {
        const fullName = (u.name || (u.firstName ? (u.firstName + ' ' + (u.lastName || '')) : '')).trim();
        if (u.id && fullName && !userLookup[u.id]) userLookup[u.id] = fullName;
        if (u.referralCode && fullName) {
          userLookup[u.referralCode] = userLookup[u.referralCode] || fullName;
          userLookup[u.referralCode.toUpperCase()] = userLookup[u.referralCode.toUpperCase()] || fullName;
          userLookup[u.referralCode.trim()] = userLookup[u.referralCode.trim()] || fullName;
        }
        if (u.email && fullName) {
          userLookup[u.email.toLowerCase().trim()] = fullName;
        }
      });
      
      // 1. Process all platform users
      allUsers.forEach(u => {
        let email = (u.email || '').toLowerCase().trim();
        if (!email) return;
        
        let userName = (u.name || (u.firstName ? (u.firstName + ' ' + (u.lastName || '')) : 'Sin Nombre')).trim();
        let refKey = u.referredBy || u.inmomasAgentName || u.registeredBy || '';
        let referrerName = refKey ? (userLookup[refKey] || userLookup[refKey.toUpperCase()] || refKey) : 'N/A';
        if (referrerName === 'admin-001') referrerName = 'Admin Inmomás';
        if (referrerName === 'N/A' && u.partnerCode) referrerName = u.partnerCode;

        const uRegions = App.utils.getUserRegions ? App.utils.getUserRegions(u) : [];
        const uNat = App.utils.getUserNationality ? App.utils.getUserNationality(u) : (u.nationality || u.country || '');

        unifiedMap.set(email, {
          id: u.id,
          name: userName,
          email: u.email, // preserve original case
          phone: u.phone || 'N/A',
          status: 'Solo Plataforma',
          role: u.role || 'colaborador',
          referrer: referrerName,
          referralCode: u.referralCode || '',
          agency: u.agencyName || '',
          country: u.country || uNat || '',
          region: uRegions[0] || '',
          regions: uRegions,
          origin: u.source || 'Plataforma Directa',
          hasPlatform: true,
          hasWebinar: !!u.isWebinarRegistered,
          hasClient: false,
          createdAt: u.createdAt || '',
          _timestamp: new Date(u.createdAt || 0).getTime()
        });
      });

      // 2. Process all clients
      allClients.forEach(c => {
        let email = (c.email || '').toLowerCase().trim();
        if (!email) return;

        let userName = ((c.firstName || '') + ' ' + (c.lastName || '')).trim() || 'Sin Nombre';
        let refKey = c.realtorId || c.referredBy || c.localAgentId || c.inmomasAgentName || c.localAgentName || '';
        let referrerName = refKey ? (userLookup[refKey] || userLookup[refKey.toUpperCase()] || refKey) : 'N/A';

        let existing = unifiedMap.get(email);
        if (existing) {
          existing.hasClient = true;
          existing.status = existing.hasWebinar ? 'Ambos (Plataforma + Webinar + Cliente)' : 'Ambos (Plataforma + Cliente)';
          if (existing.referrer === 'N/A' && referrerName !== 'N/A') existing.referrer = referrerName;
          if (existing.phone === 'N/A' && c.phone) existing.phone = c.phone;
          if (!existing.createdAt && c.createdAt) {
            existing.createdAt = c.createdAt;
            existing._timestamp = new Date(c.createdAt).getTime();
          }
        } else {
          const cReg = App.utils.getRecordRegion ? App.utils.getRecordRegion(c, allUsers) : '';
          unifiedMap.set(email, {
            id: c.id,
            name: userName,
            email: c.email,
            phone: c.phone || 'N/A',
            status: 'Cliente Comprador',
            role: 'Cliente Comprador España',
            referrer: referrerName,
            referralCode: '',
            agency: '',
            country: (c.country && c.country !== '—') ? c.country : (c.currentLocation || ''),
            region: cReg,
            regions: cReg ? [cReg] : [],
            origin: c.source || 'Referido / Intake',
            hasPlatform: false,
            hasWebinar: false,
            hasClient: true,
            createdAt: c.createdAt || '',
            _timestamp: new Date(c.createdAt || 0).getTime()
          });
        }
      });

      // 3. Process webinar registrations
      webinarRegs.forEach(w => {
        let email = (w.email || '').toLowerCase().trim();
        if (!email) return;
        
        let existing = unifiedMap.get(email);
        
        let userName = (w.name || (w.firstName ? (w.firstName + ' ' + (w.lastName || '')) : 'Sin Nombre')).trim();
        let phone = w.phone || 'N/A';
        let origin = w.source || (w.isReferral ? 'referral' : (w.howDidYouHear || 'direct'));
        
        let rawRef = w.agentReferrerName || w.referrerName || w.referredByAgentName || w.referralCode || w.agentReferrerId || w.referrerId || '';
        let referrer = 'N/A';
        if (rawRef) {
          referrer = userLookup[rawRef] || userLookup[rawRef.toUpperCase()] || rawRef;
        }
        if (!referrer || referrer.toLowerCase() === 'n/a' || referrer === '') referrer = 'N/A';

        const isB2B = isWebinarB2B(w);
        const webinarRole = isB2B ? 'Realtor / Broker (B2B)' : 'Invitado Webinar';

        if (existing) {
          existing.hasWebinar = true;
          existing.status = existing.hasClient ? 'Ambos (Plataforma + Webinar + Cliente)' : 'Ambos (Plataforma + Webinar)';
          if (existing.referrer === 'N/A' && referrer !== 'N/A') {
            existing.referrer = referrer;
          }
          if (existing.phone === 'N/A' && phone !== 'N/A') {
            existing.phone = phone;
          }
          if (!existing.agency && w.agency) existing.agency = w.agency;
          if (!existing.country && w.country) existing.country = w.country;
          if (existing.origin === 'Plataforma Directa' && origin !== 'direct') existing.origin = origin;
        } else {
          const wReg = App.utils.getRecordRegion ? App.utils.getRecordRegion(w, allUsers) : (w.webinarRegion || w.region || '');
          unifiedMap.set(email, {
            id: w.id,
            name: userName,
            email: w.email,
            phone: phone,
            status: 'Solo Webinar',
            role: webinarRole,
            referrer: referrer,
            referralCode: w.referralCode || '',
            agency: w.agency || '',
            country: w.country || '',
            region: wReg,
            regions: wReg ? [wReg] : [],
            origin: origin,
            hasPlatform: false,
            hasWebinar: true,
            hasClient: false,
            createdAt: w.createdAt || '',
            _timestamp: new Date(w.createdAt || 0).getTime()
          });
        }
      });
      
      const unifiedArray = Array.from(unifiedMap.values());
      // Always sort by newest registration first so no contact is buried
      unifiedArray.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));
      
      currentUnifiedData = unifiedArray;
      filteredUnifiedCache = unifiedArray;

      // Populate Region & Country filter options dynamically
      const regionFilterSelect = document.getElementById('admin-unified-filter-region');
      const countryFilterSelect = document.getElementById('admin-unified-filter-country');
      const rawUnifiedCountries = [];
      unifiedArray.forEach(it => {
        if (it.country && it.country !== '—' && it.country !== 'N/A') rawUnifiedCountries.push(it.country.trim());
      });

      const initReg = pendingAdminRegionFilter || (regionFilterSelect ? regionFilterSelect.value : '') || '';
      const initCnt = pendingAdminCountryFilter || (countryFilterSelect ? countryFilterSelect.value : '') || '';
      pendingAdminRegionFilter = '';
      pendingAdminCountryFilter = '';

      if (regionFilterSelect && App.utils && App.utils.getRegionFilterOptionsHtml) {
        regionFilterSelect.innerHTML = App.utils.getRegionFilterOptionsHtml(initReg);
        regionFilterSelect.value = initReg;
      }

      if (countryFilterSelect && App.utils && App.utils.getCountryFilterOptionsHtml) {
        countryFilterSelect.innerHTML = App.utils.getCountryFilterOptionsHtml(initCnt, initReg, rawUnifiedCountries);
        countryFilterSelect.value = initCnt;
      }

      // Populate Agent filter options dynamically with counts
      const agentFilterSelect = document.getElementById('admin-unified-filter-agent');
      if (agentFilterSelect) {
        const agentCounts = {};
        unifiedArray.forEach(item => {
          const ref = item.referrer || 'N/A';
          agentCounts[ref] = (agentCounts[ref] || 0) + 1;
        });

        // Sort agents by count descending
        const sortedAgents = Object.keys(agentCounts).sort((a, b) => {
          if (a === 'N/A') return 1;
          if (b === 'N/A') return -1;
          return agentCounts[b] - agentCounts[a];
        });

        const currentAgentVal = agentFilterSelect.value || '';
        let optionsHtml = '<option value="">👤 Todos los Agentes / Referidos</option>';
        sortedAgents.forEach(agent => {
          const count = agentCounts[agent];
          const isSelected = agent === currentAgentVal ? 'selected' : '';
          optionsHtml += `<option value="${App.utils.escapeHtml(agent)}" ${isSelected}>${App.utils.escapeHtml(agent)} (${count})</option>`;
        });
        agentFilterSelect.innerHTML = optionsHtml;
      }
      
      const updateCountBadge = (filteredCount, totalCount) => {
        const countEl = document.getElementById('admin-unified-count');
        if (countEl) {
          countEl.textContent = filteredCount === totalCount ? `${totalCount}` : `${filteredCount} / ${totalCount}`;
        }
      };

      updateCountBadge(unifiedArray.length, unifiedArray.length);
      renderUnifiedTable(unifiedArray);
      
      // Search and Filter Events
      const searchInput = document.getElementById('admin-unified-search');
      const regionSelect = document.getElementById('admin-unified-filter-region');
      const countrySelect = document.getElementById('admin-unified-filter-country');
      const statusSelect = document.getElementById('admin-unified-filter-status');
      const agentSelect = document.getElementById('admin-unified-filter-agent');
      
      const filterData = () => {
        const curSearchEl = document.getElementById('admin-unified-search');
        const curRegEl = document.getElementById('admin-unified-filter-region');
        const curCntEl = document.getElementById('admin-unified-filter-country');
        const curStatEl = document.getElementById('admin-unified-filter-status');
        const curAgentEl = document.getElementById('admin-unified-filter-agent');

        const term = (curSearchEl?.value || '').toLowerCase().trim();
        const selectedRegion = curRegEl?.value || '';
        const selectedCountry = curCntEl?.value || '';
        const stat = curStatEl?.value || '';
        const selectedAgent = curAgentEl?.value || '';

        const filtered = unifiedArray.filter(item => {
          const matchTerm = !term || 
            (item.name || '').toLowerCase().includes(term) || 
            (item.email || '').toLowerCase().includes(term) || 
            (item.phone || '').toLowerCase().includes(term) || 
            (item.referrer || '').toLowerCase().includes(term) || 
            (item.referralCode || '').toLowerCase().includes(term) || 
            (item.agency || '').toLowerCase().includes(term) || 
            (item.country || '').toLowerCase().includes(term) || 
            (item.origin || '').toLowerCase().includes(term) || 
            (item.role || '').toLowerCase().includes(term);

          let matchRegion = true;
          if (selectedRegion) {
            const itemRegs = Array.isArray(item.regions) && item.regions.length > 0 ? item.regions : (item.region ? [item.region] : []);
            const fallbackReg = (!itemRegs.length && item.country && App.utils.resolveRegionFromCountry) ? App.utils.resolveRegionFromCountry(item.country) : '';
            matchRegion = itemRegs.includes(selectedRegion) || fallbackReg === selectedRegion;
          }

          const matchCountry = !selectedCountry || (
            App.utils.matchesCountryFilter
              ? App.utils.matchesCountryFilter(item.country || '', selectedCountry)
              : (item.country || '').toLowerCase().includes(selectedCountry.toLowerCase())
          );

          let matchStat = true;
          if (stat) {
            if (stat === 'Ambos') matchStat = (item.status || '').includes('Ambos');
            else if (stat === 'Solo Plataforma') matchStat = item.status === 'Solo Plataforma';
            else if (stat === 'Solo Webinar') matchStat = item.status === 'Solo Webinar';
            else if (stat === 'Cliente Comprador') matchStat = (item.status || '').includes('Cliente');
            else if (stat === 'all_webinar') matchStat = !!item.hasWebinar;
            else if (stat === 'all_platform') matchStat = !!item.hasPlatform;
            else matchStat = item.status === stat;
          }

          const matchAgent = !selectedAgent || item.referrer === selectedAgent;

          return matchTerm && matchRegion && matchCountry && matchStat && matchAgent;
        });

        filteredUnifiedCache = filtered;
        updateCountBadge(filtered.length, unifiedArray.length);
        renderUnifiedTable(filtered);
      };
      
      if (searchInput) {
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        newSearch.addEventListener('input', filterData);
      }
      if (regionSelect) {
        const newReg = regionSelect.cloneNode(true);
        newReg.value = initReg;
        regionSelect.parentNode.replaceChild(newReg, regionSelect);
        newReg.addEventListener('change', () => {
          const curCntEl = document.getElementById('admin-unified-filter-country');
          if (curCntEl && App.utils && App.utils.getCountryFilterOptionsHtml) {
            let curCntVal = curCntEl.value || '';
            if (newReg.value && curCntVal && App.utils.resolveRegionFromCountry && App.utils.resolveRegionFromCountry(curCntVal) !== newReg.value) {
              curCntVal = '';
            }
            curCntEl.innerHTML = App.utils.getCountryFilterOptionsHtml(curCntVal, newReg.value, rawUnifiedCountries);
            curCntEl.value = curCntVal;
          }
          filterData();
        });
      }
      if (countrySelect) {
        const newCnt = countrySelect.cloneNode(true);
        newCnt.value = initCnt;
        countrySelect.parentNode.replaceChild(newCnt, countrySelect);
        newCnt.addEventListener('change', filterData);
      }
      if (statusSelect) {
        const newSelect = statusSelect.cloneNode(true);
        statusSelect.parentNode.replaceChild(newSelect, statusSelect);
        newSelect.addEventListener('change', filterData);
      }
      if (agentSelect) {
        const newAgent = agentSelect.cloneNode(true);
        agentSelect.parentNode.replaceChild(newAgent, agentSelect);
        newAgent.addEventListener('change', filterData);
      }

      if (initReg || initCnt) {
        filterData();
      }

      // Run initial filter (in case a Region jump filter was applied)
      filterData();
      
    } catch (err) {
      console.error('[Admin] initUnified error:', err);
      App.utils.showToast('Error loading unified directory.', 'error');
    }
  }

  function renderUnifiedTable(data) {
    const tbody = document.getElementById('admin-unified-table-body');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:#6b7280;font-size:0.95rem;">No hay registros coincidentes con los filtros seleccionados.</td></tr>`;
      return;
    }

    let html = '';
    data.forEach(item => {
      try {
        let statusColor = '#6b7280';
        let statusBg = 'rgba(107,114,128,0.12)';
        if (item.status.includes('Ambos')) {
          statusColor = '#059669'; // Emerald
          statusBg = 'rgba(16,185,129,0.12)';
        } else if (item.status.includes('Webinar')) {
          statusColor = '#d97706'; // Amber
          statusBg = 'rgba(245,158,11,0.12)';
        } else if (item.status.includes('Plataforma')) {
          statusColor = '#2563eb'; // Blue
          statusBg = 'rgba(37,99,235,0.12)';
        } else if (item.status.includes('Cliente')) {
          statusColor = '#7c3aed'; // Purple
          statusBg = 'rgba(124,58,237,0.12)';
        }
        
        const dateStr = item.createdAt ? App.utils.formatDate(item.createdAt) : '—';
        const agencyPill = item.agency ? `<div style="font-size:0.75rem;color:#6b7280;margin-top:2px;">🏢 ${App.utils.escapeHtml(item.agency)}</div>` : '';
        const itemReg = item.region || (item.country && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(item.country) : '');
        const regPill = itemReg && App.utils.getRegionBadge ? App.utils.getRegionBadge(itemReg, true) : '';
        const countryPill = item.country ? `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:0.75rem;background:#f3f4f6;color:#4b5563;margin-left:2px;">🏳️ ${App.utils.escapeHtml(item.country)}</span>` : '';

        html += `
          <tr>
            <td>
              <div style="font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                ${App.utils.escapeHtml(item.name || '')}
              </div>
              <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center; margin-top:3px;">${regPill}${countryPill}</div>
              ${agencyPill}
            </td>
            <td>
              <a href="mailto:${App.utils.escapeHtml(item.email || '')}" style="color:var(--blue); text-decoration:none; font-size:0.88rem;">${App.utils.escapeHtml(item.email || '')}</a>
            </td>
            <td style="font-size:0.85rem; white-space:nowrap;">${App.utils.escapeHtml(item.phone || '')}</td>
            <td>
              <span style="display:inline-block; padding:4px 9px; border-radius:12px; font-size:0.75rem; font-weight:700; background-color:${statusBg}; color:${statusColor};">
                ${App.utils.escapeHtml(item.status)}
              </span>
            </td>
            <td style="text-transform:capitalize; font-size:0.85rem; font-weight:500;">${App.utils.escapeHtml(item.role || '')}</td>
            <td>
              <div style="font-weight:600; font-size:0.85rem; color:var(--primary);">${App.utils.escapeHtml(item.referrer || 'N/A')}</div>
              ${item.referralCode ? `<div style="font-size:0.72rem;color:#6b7280;font-family:monospace;">${App.utils.escapeHtml(item.referralCode)}</div>` : ''}
            </td>
            <td><span style="font-size:0.78rem; color:var(--text-secondary); background:#f3f4f6; padding:2px 7px; border-radius:4px;">${App.utils.escapeHtml(item.origin || 'N/A')}</span></td>
            <td style="font-size:0.82rem; color:#4b5563; white-space:nowrap;">${dateStr}</td>
          </tr>
        `;
      } catch (rowErr) {
        console.warn('[Admin] Error rendering directory row:', rowErr, item);
      }
    });
    tbody.innerHTML = html;
  }

  /* ── Export Unified Directory to Excel (Filtered by Region / Country / Agent / Status) ── */
  function exportUnifiedToExcel() {
    try {
      const targetData = (filteredUnifiedCache && filteredUnifiedCache.length > 0) ? filteredUnifiedCache : currentUnifiedData;
      if (!targetData || targetData.length === 0) {
        App.utils.showToast('No records to export.', 'error');
        return;
      }

      const activeReg = document.getElementById('admin-unified-filter-region')?.value || '';
      const headers = ['Nombre', 'Email', 'Telefono', 'Agencia', 'Region', 'Pais', 'Estado', 'Rol', 'Referido Por', 'Codigo Referido', 'Origen', 'Fecha Registro'];
      const rows = targetData.map(item => {
        const rId = item.region || (item.country && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(item.country) : '');
        const rLabel = (rId && App.utils.REGIONS && App.utils.REGIONS[rId]) ? App.utils.REGIONS[rId].shortEs : '';
        return [
          item.name || '',
          item.email || '',
          item.phone || '',
          item.agency || '',
          rLabel,
          item.country || '',
          item.status || '',
          item.role || '',
          item.referrer || '',
          item.referralCode || '',
          item.origin || '',
          item.createdAt || ''
        ];
      });

      const regTag = activeReg ? `-${activeReg}` : '';
      if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new();
        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = headers.map((h, i) => {
          let maxLen = h.length;
          rows.forEach(r => {
            const val = r[i] ? String(r[i]) : '';
            if (val.length > maxLen) maxLen = Math.min(val.length, 45);
          });
          return { wch: maxLen + 3 };
        });
        XLSX.utils.book_append_sheet(wb, ws, 'Directorio Unificado');
        XLSX.writeFile(wb, `Directorio-Unificado${regTag}-${new Date().toISOString().slice(0, 10)}.xlsx`);
        App.utils.showToast(`✅ Exportados ${targetData.length} contactos a Excel (.xlsx).`, 'success');
        return;
      }

      const csvContent = '\uFEFF' + [headers, ...rows]
        .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Directorio-Unificado${regTag}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      App.utils.showToast(`✅ Exportados ${targetData.length} contactos del Directorio Unificado.`, 'success');
    } catch (err) {
      console.error('[Admin] exportUnified error:', err);
      App.utils.showToast('Error exporting directory.', 'error');
    }
  }

  /* ============================================
     Public API — register on App.views.admin
     ============================================ */
  App.views.admin = {
    initDashboard,
    initUsers,
    setUsersViewMode,
    toggleUmbrellaNode,
    expandAllUmbrellas,
    initClients,
    initNewsletter,
    initWebinar,
    jumpToRegionView,
    jumpFromDashFilter,
    selectWebinarConfigRegion,
    setWebinarRegionFilter,
    setWebinarCountryFilter,
    setWebinarAgentFilter,
    exportUsersToExcel,
    exportClientsToExcel,
    toggleClientView,
    exportWebinarToExcel,
    exportUnifiedToExcel,
    handleApprove,
    approveWithRole,
    handleReject,
    viewUser,
    showClientDetail,
    handleClientDrop,
    handleAssignAgent,
    handleSaveFinancials,
    showLeadAssignmentModal,
    handleAssignLeadAgent,
    handleDeleteLead,
    confirmDeleteLead,
    initAgreementsView,
    handleAdminAgreementUpload,
    copyContractData,
    exportUserAgreementToWord,
    markAgreementSigned,
    handleDeleteUser,
    handleDeleteWebinarRegistration,
    setWebinarType,
    saveWebinarConfig,
    clearRegionalWebinarSchedule,
    resetWebinarDefaults,
    filterWebinarTable,
    searchWebinarTable,
    initUnified,
    setClientTagFilter,
    handleUpdateClientTag,
    confirmConvertClient,
    handleConvertClient,
    loadWebinarFeedbacks,
    deleteFeedbackSurvey,
    exportSurveyToExcel,
    isWebinarB2B
  };

})();
