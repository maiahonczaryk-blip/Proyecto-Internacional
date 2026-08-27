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

  /* ============================================
     initDashboard()
     Populates #view-admin-dashboard with stat
     cards, pending application list, and recent
     activity feed.
     ============================================ */
  async function initDashboard() {
    try {
      // 1. Load all users and clients
      allUsers = await App.auth.getAllUsers();
      allClients = await App.auth.getClients();

      // 2. Count users by status and role
      const pendingUsers     = allUsers.filter(u => u.status === 'pending');
      const approvedBrokers  = allUsers.filter(u => u.status === 'active' && u.role === 'broker');
      const approvedRealtors = allUsers.filter(u => u.status === 'active' && u.role === 'realtor');

      // 3. Update stat cards
      setTextById('admin-stat-pending',  pendingUsers.length);
      setTextById('admin-stat-brokers',  approvedBrokers.length);
      setTextById('admin-stat-realtors', approvedRealtors.length);
      setTextById('admin-stat-clients',  allClients.length);

      // 4. Render pending applications
      renderPendingList(pendingUsers);

      // 5. Render recent activity (latest 5 non-pending users, sorted newest first)
      const recentActivity = allUsers
         .filter(u => u.status === 'active' || u.status === 'rejected')
         .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
         .slice(0, 5);
      renderRecentActivity(recentActivity);

      // 6. Render dossier downloads (leads)
      const leads = await App.auth.getDossierLeads();
      allLeads = leads;
      setTextById('admin-stat-leads', leads.length);
      renderDossierLeads(leads);

      // 7. Setup Admin Referral Link
      const currentUser = App.auth.getCurrentUser();
      if (currentUser) {
        if (!currentUser.referralCode) {
          currentUser.referralCode = 'ADM-INMOMAS';
        }
        const referralLink = App.utils.generateReferralLink(currentUser.referralCode);
        const linkInput = document.getElementById('admin-dash-referral-link');
        if (linkInput) {
          linkInput.value = referralLink;
        }
        const copyBtn = document.getElementById('admin-dash-copy-link');
        if (copyBtn) {
          copyBtn.onclick = () => {
            if (linkInput) {
              linkInput.select();
              document.execCommand('copy');
              App.utils.showToast('Admin referral link copied to clipboard!', 'success');
            }
          };
        }
      }

    } catch (err) {
      console.error('[Admin] initDashboard error:', err);
      App.utils.showToast('Error loading admin dashboard.', 'error');
    }
  }

  /* ── Agreement Notifications List (Obsolete on main dashboard, kept as fallback/stub) ── */
  function renderAgreementNotifications(notifications) {
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
      // 1. Load all users
      allUsers = await App.auth.getAllUsers();

      // Fetch webinar registrations to correlate
      const webinarRegs = await App.auth.getWebinarRegistrations();
      
      // Attach webinar registration status
      allUsers.forEach(u => {
        u.isWebinarRegistered = webinarRegs.some(r => r.email.toLowerCase() === u.email.toLowerCase());
      });

      // 2. Render the full table
      renderUsersTable(allUsers);

      // 3. Bind filter and search handlers
      bindFilterRole();
      bindFilterStatus();
      bindSearchInput();

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
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    const countSpan = document.getElementById('admin-user-count');
    if (countSpan) {
      countSpan.textContent = users.length;
    }

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2rem;">
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

      let sourceStr = user.source ? App.utils.escapeHtml(user.source) : (user.referredBy ? 'Referral' : 'Direct');
      if (user.referredBy) {
        sourceStr += ` <span style="font-size:0.8em; color:#6b7280;">(Ref: ${App.utils.escapeHtml(user.referredBy)})</span>`;
      }

      const webinarStr = user.isWebinarRegistered 
        ? '<span style="color:#10b981; font-weight:bold;">Yes ✓</span>' 
        : '<span style="color:#9ca3af;">No</span>';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              ${avatar}
              <span style="font-weight: 500;">${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</span>
            </div>
          </td>
          <td>${App.utils.escapeHtml(user.email)}</td>
          <td>${App.utils.escapeHtml(user.agencyName || '—')}</td>
          <td>${roleBadge}</td>
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

  /* ── Apply All Filters ── */
  function handleFilters() {
    const roleSelect   = document.getElementById('admin-filter-role');
    const statusSelect = document.getElementById('admin-filter-status');
    const searchInput  = document.getElementById('admin-search-input');

    const role   = roleSelect   ? roleSelect.value   : '';
    const status = statusSelect ? statusSelect.value : '';
    const search = searchInput  ? searchInput.value.toLowerCase().trim() : '';

    let filtered = [...allUsers];

    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }

    if (status) {
      filtered = filtered.filter(u => u.status === status);
    }

    if (search) {
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return fullName.includes(search) ||
               (u.email || '').toLowerCase().includes(search) ||
               (u.agencyName || '').toLowerCase().includes(search);
      });
    }

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

      App.utils.showModal({
        title: 'Approve User',
        body: `
          <div style="margin-bottom: 1.5rem; text-align: center;">
            <p style="margin: 0 0 0.5rem; font-size: 1.1rem;">Approve <strong>${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</strong>?</p>
            <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Select the role to approve the user with:</p>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
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
      const localAgents = allSysUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');
      const agentOptions = `
        <option value="">-- Direct / No Referral --</option>
        ${localAgents.map(a => `
          <option value="${a.referralCode}" ${user.referredBy === a.referralCode ? 'selected' : ''}>
            ${App.utils.escapeHtml(a.firstName)} ${App.utils.escapeHtml(a.lastName)} (${a.referralCode})
          </option>
        `).join('')}
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
              <div style="color: #6b7280;">${user.agreementSigned ? '✅ Signed' : '❌ Not signed'}</div>
            </div>
          </div>
          
          ${user.role !== 'admin' ? `
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1.5rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #374151; display: block; margin-bottom: 0.5rem;">Modify User Role</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="user-role-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                <option value="realtor" ${user.role === 'realtor' ? 'selected' : ''}>Realtor</option>
                <option value="broker" ${user.role === 'broker' ? 'selected' : ''}>Broker</option>
                <option value="agent_inmomas" ${user.role === 'agent_inmomas' ? 'selected' : ''}>Agent Inmomás</option>
                <option value="colaborador" ${user.role === 'colaborador' ? 'selected' : ''}>Colaborador</option>
              </select>
              <button class="btn btn-primary btn-sm" id="save-user-role-btn">Update Role</button>
            </div>
          </div>
          </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #374151; display: block; margin-bottom: 0.5rem;">Assign Local Agent / Referral</label>
            <div style="display: flex; gap: 0.5rem;">
              <select id="user-referral-select" class="form-control" style="flex: 1; padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; background-color: white;">
                ${agentOptions}
              </select>
              <button class="btn btn-primary btn-sm" id="save-user-referral-btn">Assign</button>
            </div>
          </div>
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`,
        onClose: () => {}
      });

      const saveRoleBtn = document.getElementById('save-user-role-btn');
      if (saveRoleBtn) {
        saveRoleBtn.addEventListener('click', async () => {
          const selectedRole = document.getElementById('user-role-select').value;
          App.utils.closeModal();
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
      
      const getRealtorName = (realtorId) => {
        const realtor = allUsers.find(u => u.id === realtorId);
        return realtor ? `${realtor.firstName} ${realtor.lastName}` : 'Unknown';
      };
      
      App.utils.renderKanbanBoard(
        'admin-clients-board',
        allClients,
        'App.views.admin.showClientDetail',
        getRealtorName,
        'App.views.admin.handleClientDrop'
      );
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

  async function handleClientDrop(clientId, newStatus) {
    try {
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

      const realtor = allUsers.find(u => u.id === client.referredBy);
      const realtorName = realtor ? `${realtor.firstName} ${realtor.lastName}` : '—';
      
      // Get all active local agents
      const localAgents = allUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');
      
      const dropdownOptions = `
        <option value="">-- Select Local Agent --</option>
        ${localAgents.map(a => `
          <option value="${a.id}" ${client.localAgentId === a.id ? 'selected' : ''}>
            ${a.firstName} ${a.lastName} (Inmomás)
          </option>
        `).join('')}
      `;

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
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.25rem;">${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}</h3>
            <div style="margin-bottom: 0.5rem;">${statusBadge}</div>
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
      
      await App.auth.saveClientFinancials(clientId, salePrice, agencyFeePct, referralSharePct);
      App.utils.showToast('Financial settings saved successfully!', 'success');
      App.utils.closeModal();
      initClients(); // reload
    } catch (err) {
      console.error(err);
      App.utils.showToast(err.message, 'error');
    }
  }

  /* ── Lead Assignment Modal and Handlers ── */
  function showLeadAssignmentModal(leadId) {
    try {
      const lead = allLeads.find(l => l.id === leadId);
      if (!lead) return;

      // Get all active local agents
      const localAgents = allUsers.filter(u => u.role === 'agent_inmomas' && u.status === 'active');

      const dropdownOptions = `
        <option value="">-- Select Local Agent --</option>
        ${localAgents.map(a => `
          <option value="${a.id}" ${lead.localAgentId === a.id ? 'selected' : ''}>
            ${a.firstName} ${a.lastName} (Inmomás)
          </option>
        `).join('')}
      `;

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
      await App.auth.deleteDossierLead(leadId);
      allLeads = allLeads.filter(l => l.id !== leadId);
      setTextById('admin-stat-leads', allLeads.length);
      renderDossierLeads(allLeads);
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
      const [allSubs, brokerSubs, realtorSubs, agentSubs, history] = await Promise.all([
        App.auth.getNewsletterSubscribers(null),
        App.auth.getNewsletterSubscribers('broker'),
        App.auth.getNewsletterSubscribers('realtor'),
        App.auth.getNewsletterSubscribers('agent_inmomas'),
        App.auth.getNewsletterHistory()
      ]);

      const subscriberMap = {
        all: allSubs,
        broker: brokerSubs,
        realtor: realtorSubs,
        agent_inmomas: agentSubs
      };

      // 2. Update stat cards
      setTextById('nl-stat-total',   allSubs.length);
      setTextById('nl-stat-brokers', brokerSubs.length);
      setTextById('nl-stat-realtors', realtorSubs.length);
      setTextById('nl-stat-sent',    history.length);

      // 3. Init recipient badge
      const recipientSelect = document.getElementById('nl-recipients');
      const recipientBadge  = document.getElementById('nl-recipient-badge');

      function updateBadge() {
        const role = recipientSelect ? recipientSelect.value : 'all';
        const count = (subscriberMap[role] || []).length;
        if (recipientBadge) {
          recipientBadge.textContent = count + ' subscriber' + (count !== 1 ? 's' : '');
        }
      }
      updateBadge();
      if (recipientSelect) recipientSelect.addEventListener('change', updateBadge);

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
          const recipients    = subscriberMap[recipientRole] || [];

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
              recipientRole,
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

    const roleLabel = { all: 'All', broker: 'Brokers', realtor: 'Realtors', agent_inmomas: 'Agents', colaborador: 'Colaboradores' };

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
     initWebinar()
     Shows all Beyond Borders webinar registrations
     in a table. Admin can export to Excel (CSV).
     ============================================ */
  async function initWebinar() {
    try {
      const registrations = await App.auth.getWebinarRegistrations();

      // Update stat
      setTextById('admin-stat-webinar', registrations.length);

      // Render table
      renderWebinarTable(registrations);

    } catch (err) {
      console.error('[Admin] initWebinar error:', err);
      App.utils.showToast('Error loading webinar registrations.', 'error');
    }
  }

  function renderWebinarTable(registrations) {
    const tbody = document.getElementById('webinar-registrations-tbody');
    if (!tbody) return;

    if (registrations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:#6b7280;">No registrations yet.</td></tr>`;
      return;
    }

    const HOW_LABELS = {
      social: 'Social Media',
      remax: 'RE/MAX Network',
      agent: 'Agent Referral',
      email: 'Email / Newsletter',
      event: 'Event / Conference',
      other: 'Other'
    };

    tbody.innerHTML = registrations.map(r => {
      const date = App.utils.formatDate(r.createdAt);
      const how  = HOW_LABELS[r.howHeard] || r.howHeard || '—';
      const ref  = r.referrerName ? App.utils.escapeHtml(r.referrerName) : '—';

      // Tagged agent column — auto-detected link or selected dropdown agent
      let agentTagCell = '—';
      if (r.agentReferrerName || r.referralCode) {
        const agentName = r.agentReferrerName ? App.utils.escapeHtml(r.agentReferrerName) : '';
        const code      = r.referralCode      ? App.utils.escapeHtml(r.referralCode)      : '';
        const roleBadge = r.agentReferrerRole
          ? `<span style="background:rgba(0,67,255,.08);color:var(--primary);border-radius:12px;padding:1px 7px;font-size:.72rem;margin-left:4px;">${r.agentReferrerRole}</span>`
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

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;color:var(--text-muted);">${date}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-weight:600;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">${App.utils.escapeHtml(r.email)}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">${App.utils.escapeHtml(r.phone || '—')}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">${App.utils.escapeHtml(r.agency || '—')}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">
            <span style="background:rgba(0,67,255,.07);color:var(--primary);border-radius:20px;padding:3px 10px;font-size:.8rem;font-weight:600;">${App.utils.escapeHtml(r.country || '—')}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.85rem;">${App.utils.escapeHtml(r.state || '—')}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${how}</td>
          <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${ref}</td>
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
    if (!allUsers || allUsers.length === 0) {
      App.utils.showToast('No users to export.', 'error');
      return;
    }

    const headers = [
      'Date', 'First Name', 'Last Name', 'Email', 'Phone', 'Agency', 'Role', 'Status', 'Country', 'State', 'Webinar Registered'
    ];

    const rows = allUsers.map(u => [
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US') : '',
      u.firstName || '',
      u.lastName || '',
      u.email || '',
      u.phone || '',
      u.agency || '',
      u.role || '',
      u.status || '',
      u.country || '',
      u.state || '',
      u.isWebinarRegistered ? 'Yes' : 'No'
    ]);

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

    App.utils.showToast(`✅ Exported ${allUsers.length} users to Excel.`, 'success');
  }

  function exportWebinarToExcel() {
    App.auth.getWebinarRegistrations().then(registrations => {
      if (registrations.length === 0) {
        App.utils.showToast('No registrations to export.', 'error');
        return;
      }

      const HOW_LABELS = {
        social: 'Social Media',
        remax: 'RE/MAX Network',
        agent: 'Agent Referral',
        email: 'Email / Newsletter',
        event: 'Event / Conference',
        other: 'Other'
      };

      const headers = [
        'Date','First Name','Last Name','Email','Phone',
        'Agency','Country','State / Province',
        'How They Heard','Referring Agent (self-reported)',
        'Agent Via Link','Referral Code','Agent Role',
        'Tagged Agent','Source','GDPR Consent'
      ];

      const rows = registrations.map(r => {
        const taggedAgent = r.agentReferrerName 
          ? r.agentReferrerName 
          : (r.howHeard === 'agent' && r.referrerName ? r.referrerName : '');

        return [
          r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
          r.firstName || '',
          r.lastName || '',
          r.email || '',
          r.phone || '',
          r.agency || '',
          r.country || '',
          r.state || '',
          HOW_LABELS[r.howHeard] || r.howHeard || '',
          r.referrerName || '',
          r.agentReferrerName || '',
          r.referralCode || '',
          r.agentReferrerRole || '',
          taggedAgent,
          r.source || 'direct',
          r.gdprConsent ? 'Yes' : 'No'
        ];
      });

      const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
      const csvContent = '\uFEFF' + // BOM for Excel UTF-8
        [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `Beyond-Borders-Webinar-Registrations-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      App.utils.showToast(`✅ Exported ${registrations.length} registrations to Excel.`, 'success');
    }).catch(err => {
      console.error('[Admin] Export error:', err);
      App.utils.showToast('Error exporting data.', 'error');
    });
  }

  /* ── Dedicated Agreements View ── */
  async function initAgreementsView() {
    try {
      // 1. Fetch pending agreement notifications
      let pendingNotifs = [];
      if (!App.demoMode && App.db) {
        const snap = await App.db.collection('agreement_notifications')
          .where('status', '==', 'pending_admin')
          .orderBy('uploadedAt', 'desc')
          .get();
        snap.forEach(doc => pendingNotifs.push({ id: doc.id, ...doc.data() }));
      } else {
        pendingNotifs = (App.demoData.agreementNotifications || [])
          .filter(n => n.status === 'pending_admin');
      }

      // Render pending agreements in tab
      renderPendingAgreementsTab(pendingNotifs);

      // 2. Fetch signed agreements
      let signedUsers = [];
      if (!App.demoMode && App.db) {
        const snap = await App.db.collection('users')
          .where('agreementStatus', '==', 'signed')
          .get();
        snap.forEach(doc => signedUsers.push({ id: doc.id, ...doc.data() }));
      } else {
        signedUsers = (App.demoData.users || [])
          .filter(u => u.agreementStatus === 'signed');
      }

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
      count.textContent = notifications.length > 0 ? `(${notifications.length} pending)` : '';
    }

    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📋</div><p class="empty-state__text">No agreements pending signature.</p></div>';
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="pending-card glass-card" id="agreement-card-${n.id}" style="padding:1.25rem; margin-bottom:0.75rem; text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem;">
          <div>
            <div style="font-weight:700; font-size:1rem;">${App.utils.escapeHtml(n.userName)}</div>
            <div style="font-size:0.82rem; color:#6b7280; margin-top:2px;">
              ${n.userRole === 'broker' ? '🏢 Broker' : '👤 Realtor'} &nbsp;·&nbsp; ${App.utils.escapeHtml(n.agencyName)} &nbsp;·&nbsp; ${App.utils.escapeHtml(n.email)}
            </div>
            <div style="font-size:0.8rem; color:#9ca3af; margin-top:3px;">
              📎 ${App.utils.escapeHtml(n.fileName || 'agreement')} &nbsp;·&nbsp; Uploaded: ${App.utils.formatDate(n.uploadedAt)}
            </div>
          </div>
          <span class="badge badge--pending" style="background:#fef9c3; color:#854d0e; white-space:nowrap;">⏳ Pending your signature</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:1rem;">
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            ${n.fileUrl && !n.fileUrl.startsWith('demo://') ? `
              <a href="${App.utils.escapeHtml(n.fileUrl)}" target="_blank" class="btn btn-outline btn-sm">
                📥 Download Realtor-Signed Copy
              </a>
            ` : `
              <span class="btn btn-outline btn-sm" style="opacity:0.5; cursor:not-allowed;" title="Demo mode — no real file">📥 Download Signed Copy (demo)</span>
            `}
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('admin-file-input-${n.id}').click()">
              ✍️ Upload Final Countersigned Copy
            </button>
            <input type="file" id="admin-file-input-${n.id}" accept=".pdf,.doc,.docx" style="display:none;" onchange="App.views.admin.handleAdminAgreementUpload(this, '${n.id}', '${n.userId}')">
          </div>
          <div id="admin-upload-status-${n.id}" style="font-size:0.8rem; color:#4b5563;"></div>
        </div>
      </div>
    `).join('');
  }

  function renderSignedAgreementsTab(users) {
    const tbody = document.getElementById('admin-signed-agreements-tbody');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6b7280;">No active agreements yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.85rem;font-weight:600;">${App.utils.escapeHtml(u.firstName)} ${App.utils.escapeHtml(u.lastName)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${u.role === 'broker' ? '🏢 Broker' : '👤 Realtor'}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${App.utils.escapeHtml(u.agencyName || u.brokerNameManual || '—')}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">${App.utils.escapeHtml(u.email)}</td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">
          ${u.agreementFileUrl ? `<a href="${App.utils.escapeHtml(u.agreementFileUrl)}" target="_blank" style="color:var(--primary);text-decoration:underline;">📥 Realtor Signed Copy</a>` : '—'}
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);font-size:.82rem;">
          ${u.agreementFinalUrl ? `<a href="${App.utils.escapeHtml(u.agreementFinalUrl)}" target="_blank" style="color:#16a34a;font-weight:600;text-decoration:underline;">📥 Final Agreement</a>` : '—'}
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid var(--border-light);">
          <button class="btn btn-outline btn-xs" onclick="document.getElementById('admin-reupload-file-input-${u.id}').click()" style="padding:2px 8px;font-size:0.75rem;">
            🔄 Re-upload Final
          </button>
          <input type="file" id="admin-reupload-file-input-${u.id}" accept=".pdf,.doc,.docx" style="display:none;" onchange="App.views.admin.handleAdminAgreementUpload(this, '', '${u.id}')">
          <div id="admin-reupload-status-${u.id}" style="font-size:0.75rem;color:#4b5563;margin-top:2px;"></div>
        </td>
      </tr>
    `).join('');
  }

  async function handleAdminAgreementUpload(input, notifId, userId) {
    const file = input.files[0];
    if (!file) return;

    const statusEl = notifId 
      ? document.getElementById(`admin-upload-status-${notifId}`) 
      : document.getElementById(`admin-reupload-status-${userId}`);
    if (statusEl) statusEl.innerHTML = '<span style="color:#6b7280;">⏳ Uploading final agreement...</span>';

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

      App.utils.showToast('✅ Final signed agreement uploaded. Partner active!', 'success');
      
      // Reload the view
      initAgreementsView();
    } catch (err) {
      console.error('[Admin] Final agreement upload error:', err);
      if (statusEl) statusEl.innerHTML = '<span style="color:#e11b22;">❌ Upload failed.</span>';
      App.utils.showToast('Upload failed.', 'error');
    }
  }

  /* ============================================
     Public API — register on App.views.admin
     ============================================ */
  App.views.admin = {
    initDashboard,
    initUsers,
    initClients,
    initNewsletter,
    initWebinar,
    exportUsersToExcel,
    exportWebinarToExcel,
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
    handleDeleteUser,
    handleDeleteWebinarRegistration
  };

})();
