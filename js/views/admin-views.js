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

    } catch (err) {
      console.error('[Admin] initDashboard error:', err);
      App.utils.showToast('Error loading admin dashboard.', 'error');
    }
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
      await App.auth.updateUserStatus(userId, 'active');
      App.utils.showToast('User approved successfully!', 'success');

      // Refresh whichever view is active
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
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
      });

    } catch (err) {
      console.error('[Admin] viewUser error:', err);
      App.utils.showToast('Error loading user details.', 'error');
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
    handleApprove,
    handleReject,
    viewUser
  };

})();
