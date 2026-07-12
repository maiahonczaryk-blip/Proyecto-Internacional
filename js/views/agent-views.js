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

      // Load data scoped to this local agent
      agentClients = await App.auth.getClients({ localAgentId: currentUser.id });
      agentCommissions = await App.auth.getCommissions({ agentId: currentUser.id });
      allUsers = await App.auth.getAllUsers();

      // Calculate metrics
      const activeCount = agentClients.filter(c => c.status !== 'closed').length;
      const closedCount = agentClients.filter(c => c.status === 'closed').length;
      const totalEarned = agentCommissions.reduce((sum, c) => sum + (c.agentAmount || 0), 0);

      // Update stat cards
      setTextById('agent-stat-clients', agentClients.length);
      setTextById('agent-stat-active', activeCount);
      setTextById('agent-stat-sales', closedCount);
      setTextById('agent-stat-commissions', App.utils.formatCurrency(totalEarned));

      // Funnel summary (mini pipeline)
      renderMiniPipeline(agentClients);

      // Recent activity (last 5 clients, sorted by updatedAt/createdAt)
      renderRecentClients(agentClients);

      // Referral link
      const isPending = currentUser.status === 'pending';
      const referralLink = isPending ? '' : App.utils.generateReferralLink(currentUser.referralCode || 'LOC-DEFAULT');
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

      // Copy button handler
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
          copyBtn.style.cursor = '';
          copyBtn.onclick = () => App.utils.copyToClipboard(referralLink);
        }
      }

      // Manual Add Client button
      const addBtnContainer = document.getElementById('agent-dash-add-client-btn');
      if (addBtnContainer) {
        addBtnContainer.innerHTML = `
          <button class="btn btn-primary" onclick="App.views.agentInmomas.showAddClientModal()" style="display: flex; align-items: center; gap: 8px; padding: 0.65rem 1.25rem; font-size: 0.9rem; border-radius: 8px; background: linear-gradient(135deg, #0043ff, #0066ff); border: none; box-shadow: 0 2px 8px rgba(0,67,255,0.2);">
            <span style="font-size: 1.1rem;">➕</span> Add Client Manually
          </button>
        `;
      }

    } catch (err) {
      console.error('[Agent] initDashboard error:', err);
      App.utils.showToast('Error loading dashboard.', 'error');
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

      agentClients = await App.auth.getClients({ localAgentId: currentUser.id });
      allUsers = await App.auth.getAllUsers();

      const getRealtorName = (realtorId) => {
        const realtor = allUsers.find(u => u.id === realtorId);
        return realtor ? `${realtor.firstName} ${realtor.lastName}` : 'Unknown';
      };

      App.utils.renderKanbanBoard(
        'agent-pipeline-board',
        agentClients,
        'App.views.agentInmomas.showClientDetail',
        getRealtorName,
        'App.views.agentInmomas.handleClientDrop'
      );

    } catch (err) {
      console.error('[Agent] initClients error:', err);
      App.utils.showToast('Error loading client pipeline.', 'error');
    }
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
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.25rem;">${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}</h3>
            <div style="margin-bottom: 0.5rem;">${statusBadge}</div>
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
            <button class="btn btn-primary btn-sm" onclick="App.views.agentInmomas.handleSaveFinancials('${client.id}')" style="background: #059669; border-color: #059669; width: 100%;">
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
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
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
      console.error(err);
      App.utils.showToast(err.message, 'error');
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

      agentCommissions = await App.auth.getCommissions({ agentId: currentUser.id });

      // Calculate summary metrics
      const totalEarned = agentCommissions.reduce((sum, c) => sum + (c.agentAmount || 0), 0);
      const paidEarned = agentCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.agentAmount || 0), 0);
      const pendingEarned = agentCommissions.filter(c => c.status === 'pending_payment' || c.status === 'projected')
                                            .reduce((sum, c) => sum + (c.agentAmount || 0), 0);

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

    tbody.innerHTML = commissions.map(c => {
      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>`;

      // Spain share is the remaining commission (usually 75%)
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
              <option value="">Select area</option>
              <option value="Alicante City">Alicante City</option>
              <option value="Elche">Elche</option>
              <option value="Santa Pola">Santa Pola</option>
              <option value="Gran Alacant">Gran Alacant</option>
              <option value="Benidorm">Benidorm</option>
              <option value="Jávea">Jávea</option>
              <option value="Torrevieja">Torrevieja</option>
              <option value="Costa Blanca (General)">Costa Blanca (General)</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 4px;">Timeline *</label>
              <select id="mc-timeline" class="form-input" required style="margin-bottom: 0;">
                <option value="">Select timeline</option>
                <option value="0-3 months">0 - 3 months</option>
                <option value="3-6 months">3 - 6 months</option>
                <option value="6-12 months">6 - 12 months</option>
                <option value="+1 year">+1 year</option>
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
        <button class="btn btn-primary btn-sm" onclick="App.views.agentInmomas.handleAddClient()" style="margin-left: 0.5rem;">Save Client</button>
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
      console.error('[Agent] handleAddClient error:', err);
      App.utils.showToast('Error adding client: ' + err.message, 'error');
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
    initFinances,
    showClientDetail,
    handleClientDrop,
    handleSaveFinancials,
    showAddClientModal,
    handleAddClient
  };

})();
