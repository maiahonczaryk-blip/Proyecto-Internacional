window.App = window.App || {};
App.views = App.views || {};

App.views.partner = (function() {

  /* ---- Initialize Dashboard ---- */
  async function initDashboard() {
    const user = App.auth.getCurrentUser();
    if (!user || user.role !== 'partner') {
      window.location.hash = 'login';
      return;
    }

    // Determine which clients this partner should see
    let partnerType = user.partnerType || '';
    if (!partnerType) {
      const identifier = (user.username || user.email || '').toLowerCase();
      if (identifier.includes('uci')) partnerType = 'needsUCI';
      else if (identifier.includes('fuster')) partnerType = 'needsFuster';
      else if (identifier.includes('holidays')) partnerType = 'needsHolidays';
    }

    try {
      const allClients = await App.auth.getClients();
      // Filter clients where the specific partner flag is true
      const partnerClients = allClients.filter(c => c[partnerType] === true);

      renderPartnerDashboard(partnerClients, partnerType);
    } catch (err) {
      console.error('[Partner] Error loading dashboard:', err);
      App.utils.showToast('Error loading partner dashboard: ' + err.message, 'error');
      const view = document.getElementById('view-partner-dashboard');
      if (view) {
        const content = view.querySelector('.dashboard-content');
        if (content) {
          content.innerHTML += `<div style="padding:2rem; background:#fee2e2; color:#ef4444; border-radius:8px; margin-top:2rem;">
            <h3>Error Loading Dashboard</h3>
            <p>${err.message}</p>
          </div>`;
        }
      }
    }
  }

  function renderPartnerDashboard(clients, partnerType) {
    const view = document.getElementById('view-partner-dashboard');
    if (!view) return;

    let totalReferrals = clients.length;
    let activeClients = clients.filter(c => c.status !== 'closed' && c.status !== 'lost').length;

    // We can replace the stat cards
    const grid = view.querySelector('.dashboard-grid');
    if (grid) {
      const values = grid.querySelectorAll('.stat-card__value');
      if (values.length >= 2) {
        values[0].textContent = totalReferrals;
        values[1].textContent = activeClients;
      }
    }

    // Check if table container exists, if not create it
    let tableContainer = document.getElementById('partner-clients-container');
    if (!tableContainer) {
      tableContainer = document.createElement('div');
      tableContainer.id = 'partner-clients-container';
      tableContainer.style.marginTop = '2rem';
      view.querySelector('.dashboard-content').appendChild(tableContainer);
    }

    let tbodyHtml = '';
    if (clients.length === 0) {
      tbodyHtml = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #6b7280;">No clients assigned to your services yet.</td></tr>`;
    } else {
      tbodyHtml = clients.map(c => `
        <tr>
          <td style="font-weight: 500;">${App.utils.escapeHtml(c.firstName)} ${App.utils.escapeHtml(c.lastName)}</td>
          <td><span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span></td>
          <td>${App.utils.escapeHtml(c.localAgentName || '—')}</td>
          <td>${App.utils.formatDate(c.createdAt)}</td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="App.views.partner.showClientDetails('${c.id}', '${partnerType}')">View Details & Add Note</button>
          </td>
        </tr>
      `).join('');
    }

    tableContainer.innerHTML = `
      <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="padding: 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.1rem; margin: 0; color: #111827;">Clients Requiring Service</h2>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Global Status</th>
                <th>Agent Assigned</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tbodyHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function showClientDetails(clientId, partnerType) {
    try {
      const allClients = await App.auth.getClients();
      const client = allClients.find(c => c.id === clientId);
      if (!client) throw new Error("Client not found.");

      const timeline = (client.statusHistory || []).map(entry => `
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem; position: relative;">
          <div style="width: 2px; background: #e5e7eb; position: absolute; left: 5px; top: 20px; bottom: -10px;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 4px; z-index: 1;"></div>
          <div>
            <div style="font-weight: 600; font-size: 0.85rem; color: #374151;">${App.utils.getStatusLabel(entry.status)}</div>
            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 2px;">${App.utils.formatDate(entry.date)}</div>
            <div style="font-size: 0.85rem; color: #4b5563;">${App.utils.escapeHtml(entry.note)}</div>
          </div>
        </div>
      `).join('');

      App.utils.showModal({
        title: `Client: ${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}`,
        body: `
          <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem;">
            <!-- Client Info -->
            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
              <h4 style="margin: 0 0 1rem; font-size: 0.9rem; color: #374151;">General Information</h4>
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; font-size: 0.85rem;">
                <strong style="color: #6b7280;">Email:</strong> <span><a href="mailto:${App.utils.escapeHtml(client.email)}" style="color: #3b82f6;">${App.utils.escapeHtml(client.email || '—')}</a></span>
                <strong style="color: #6b7280;">Phone:</strong> <span>${App.utils.escapeHtml(client.phone || '—')}</span>
                <strong style="color: #6b7280;">Objective:</strong> <span>${App.utils.escapeHtml(client.objective || '—')}</span>
                <strong style="color: #6b7280;">Timeline:</strong> <span>${App.utils.escapeHtml(client.timeline || '—')}</span>
                <strong style="color: #6b7280;">Interest Area:</strong> <span>${App.utils.escapeHtml(client.interestArea || '—')}</span>
                <strong style="color: #6b7280;">Budget:</strong> <span>${App.utils.escapeHtml(client.budget || '—')}</span>
              </div>
            </div>

            <!-- Follow up Note Form -->
            <div>
              <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem; color: #374151;">Add Follow-up Note</h4>
              <textarea id="partner-note-text" class="form-input" rows="3" placeholder="Write a status update... e.g., 'Documentación enviada para revisión'" style="margin-bottom: 0.5rem; resize: vertical;"></textarea>
              <button class="btn btn-primary btn-sm" onclick="App.views.partner.handleAddNote('${client.id}', '${client.status}')">
                Añadir Nota de Seguimiento
              </button>
            </div>

            <!-- Timeline -->
            <div>
              <h4 style="margin: 0 0 1rem; font-size: 0.9rem; color: #374151;">Status History</h4>
              <div style="padding-left: 0.25rem;">
                ${timeline || '<p style="color: #9ca3af; font-size: 0.85rem; margin: 0;">No history available.</p>'}
              </div>
            </div>
          </div>
        `,
        footer: `
          <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>
        `
      });
    } catch (err) {
      console.error(err);
      App.utils.showToast("Error loading client details.", "error");
    }
  }

  async function handleAddNote(clientId, currentStatus) {
    const text = document.getElementById('partner-note-text')?.value.trim();
    if (!text) {
      App.utils.showToast("Please enter a note.", "error");
      return;
    }
    
    const user = App.auth.getCurrentUser();
    const partnerName = user.firstName + (user.lastName ? ' ' + user.lastName : '');
    const fullNote = `${partnerName} (Partner): ${text}`;

    try {
      await App.auth.updateClientStatus(clientId, currentStatus, fullNote);
      App.utils.showToast("Note added successfully!", "success");
      showClientDetails(clientId); // Refresh modal
    } catch (err) {
      console.error(err);
      App.utils.showToast("Error adding note.", "error");
    }
  }

  return {
    initDashboard,
    showClientDetails,
    handleAddNote
  };

})();
