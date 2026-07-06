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
      const pendingUsers  = allUsers.filter(u => u.status === 'pending');
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
      renderDossierLeads(leads);

    } catch (err) {
      console.error('[Admin] initDashboard error:', err);
      App.utils.showToast('Error loading admin dashboard.', 'error');
    }
  }

  /* ── Dossier Leads List ── */
  function renderDossierLeads(leads) {
    const container = document.getElementById('dossier-leads-table-body');
    if (!container) return;

    if (leads.length === 0) {
      container.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">No downloads yet.</td></tr>';
      return;
    }

    container.innerHTML = leads.map(lead => {
      const dateStr = App.utils.formatDate(lead.createdAt);
      return `
        <tr>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${dateStr}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${App.utils.escapeHtml(lead.firstName)} ${App.utils.escapeHtml(lead.lastName)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${App.utils.escapeHtml(lead.email)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">${App.utils.escapeHtml(lead.phone)}</td>
          <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;"><span class="status-badge status-new">Buyer Guide</span></td>
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
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-primary btn-sm" onclick="App.views.admin.handleApprove('${user.id}')">
              ✓ Approve
            </button>
            <button class="btn btn-danger btn-sm" onclick="App.views.admin.handleReject('${user.id}')">
              ✕ Reject
            </button>
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

      // 2. Render the full table
      renderUsersTable(allUsers);

      // 3. Bind filter and search handlers
      bindFilterRole();
      bindFilterStatus();
      bindSearchInput();

    } catch (err) {
      console.error('[Admin] initUsers error:', err);
      App.utils.showToast('Error loading user management.', 'error');
    }
  }

  /* ── Render Users Table ── */
  function renderUsersTable(users) {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem;">
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
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        return fullName.includes(search) ||
               u.email.toLowerCase().includes(search) ||
               (u.agencyName || '').toLowerCase().includes(search);
      });
    }

    renderUsersTable(filtered);
  }

  /* ============================================
     handleApprove(userId)
     Approves a pending user and refreshes
     the current view.
     ============================================ */
  async function handleApprove(userId) {
    try {
      // Find the user to approve
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      App.utils.showModal({
        title: 'Approve User',
        body: `
          <div style="margin-bottom: 1rem;">
            <p style="margin: 0 0 0.5rem;">Approve <strong>${App.utils.escapeHtml(user.firstName)} ${App.utils.escapeHtml(user.lastName)}</strong> (${App.utils.escapeHtml(user.email)})?</p>
            <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Select the user's role before approving.</p>
          </div>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="font-weight: 600; font-size: 0.875rem; color: #374151; display: block; margin-bottom: 0.25rem;">User Role</label>
            <select id="approve-role-select" class="form-control" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: white;">
              <option value="realtor" ${user.role === 'realtor' ? 'selected' : ''}>Realtor</option>
              <option value="broker" ${user.role === 'broker' ? 'selected' : ''}>Broker</option>
            </select>
          </div>
        `,
        footer: `
          <button class="btn btn-outline btn-sm" id="modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary btn-sm" id="modal-confirm-approve-btn" style="margin-left: 0.5rem;">Approve & Save</button>
        `,
        onClose: () => {}
      });

      // Bind modal buttons
      const cancelBtn = document.getElementById('modal-cancel-btn');
      const confirmBtn = document.getElementById('modal-confirm-approve-btn');

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => App.utils.closeModal());
      }

      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          const selectedRole = document.getElementById('approve-role-select').value;
          App.utils.closeModal();
          try {
            // Update role if changed
            if (selectedRole !== user.role) {
              await App.auth.updateUserRole(userId, selectedRole);
            }
            // Approve status
            await App.auth.updateUserStatus(userId, 'active');
            App.utils.showToast('User approved successfully!', 'success');

            // Refresh view
            const route = App.router.getCurrentRoute();
            if (route === 'admin/dashboard') {
              await initDashboard();
            } else if (route === 'admin/users') {
              await initUsers();
            }
          } catch (err) {
            console.error('[Admin] handleApprove error:', err);
            App.utils.showToast('Error approving user: ' + err.message, 'error');
          }
        });
      }
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
              </select>
              <button class="btn btn-primary btn-sm" id="save-user-role-btn">Update Role</button>
            </div>
          </div>
          ` : ''}
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
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
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

  /* ── Utility: safely set text content ── */
  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================
     Public API — register on App.views.admin
     ============================================ */
  App.views.admin = {
    initDashboard,
    initUsers,
    initClients,
    handleApprove,
    handleReject,
    viewUser,
    showClientDetail,
    handleClientDrop,
    handleAssignAgent,
    handleSaveFinancials
  };

})();
