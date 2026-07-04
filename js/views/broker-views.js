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
  let teamRealtors = [];
  let brokerClients = [];
  let brokerCommissions = [];

  /* ============================================
     initDashboard()
     Populates #view-broker-dashboard with stats,
     team overview, and recent client activity.
     ============================================ */
  async function initDashboard() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      // Load data scoped to this broker
      teamRealtors     = await App.auth.getAllUsers({ brokerId: currentUser.id, role: 'realtor' });
      brokerClients    = await App.auth.getClients({ brokerId: currentUser.id });
      brokerCommissions = await App.auth.getCommissions({ brokerId: currentUser.id });

      // Count metrics
      const approvedRealtors = teamRealtors.filter(r => r.status === 'approved');
      const completedSales   = brokerCommissions.filter(c => c.status === 'paid' || c.status === 'pending_payment');
      const totalBrokerComm  = brokerCommissions.reduce((sum, c) => sum + (c.brokerAmount || 0), 0);

      // Update stat cards
      setTextById('broker-stat-realtors',    approvedRealtors.length);
      setTextById('broker-stat-clients',     brokerClients.length);
      setTextById('broker-stat-sales',       completedSales.length);
      setTextById('broker-stat-commissions', App.utils.formatCurrency(totalBrokerComm));

      // Team overview
      renderTeamOverview(approvedRealtors);

      // Recent clients (latest 5)
      renderRecentClients(brokerClients);

    } catch (err) {
      console.error('[Broker] initDashboard error:', err);
      App.utils.showToast('Error loading broker dashboard.', 'error');
    }
  }

  /* ── Team Overview (dashboard widget) ── */
  function renderTeamOverview(realtors) {
    const container = document.getElementById('broker-team-overview');
    if (!container) return;

    if (realtors.length === 0) {
      App.utils.showEmptyState('broker-team-overview', 'No team members yet.', '👥');
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
            <div style="font-size: 0.8rem; color: #6b7280;">${clientCount} client${clientCount !== 1 ? 's' : ''}</div>
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

      teamRealtors      = await App.auth.getAllUsers({ brokerId: currentUser.id, role: 'realtor' });
      brokerClients     = await App.auth.getClients({ brokerId: currentUser.id });
      brokerCommissions = await App.auth.getCommissions({ brokerId: currentUser.id });

      renderTeamGrid(teamRealtors);

    } catch (err) {
      console.error('[Broker] initTeam error:', err);
      App.utils.showToast('Error loading team data.', 'error');
    }
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
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; text-align: center;">
          ✉️ ${App.utils.escapeHtml(r.email)}
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
            <p style="font-size: 0.85rem; color: #6b7280; margin: 0;">${App.utils.escapeHtml(realtor.agencyName || '—')} · ${App.utils.escapeHtml(realtor.country || '—')}</p>
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

      teamRealtors  = await App.auth.getAllUsers({ brokerId: currentUser.id, role: 'realtor' });
      brokerClients = await App.auth.getClients({ brokerId: currentUser.id });

      const getRealtorName = (realtorId) => {
        const realtor = teamRealtors.find(r => r.id === realtorId);
        return realtor ? `${realtor.firstName} ${realtor.lastName}` : 'Unknown';
      };

      App.utils.renderKanbanBoard('broker-pipeline-board', brokerClients, 'App.views.broker.showClientDetail', getRealtorName);

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
              <div style="font-weight: 600; color: #374151;">Registered</div>
              <div style="color: #6b7280;">${App.utils.formatDate(client.createdAt)}</div>
            </div>
          </div>
          ${client.notes ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; color: #374151; margin-bottom: 1.5rem;">${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151;">Status Timeline</h4>
          ${timeline || '<p style="color: #6b7280;">No history available.</p>'}
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
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

      const container = document.getElementById('broker-documents-content');
      if (!container) {
        // If no specific container, just populate within the view
        return;
      }

      teamRealtors  = await App.auth.getAllUsers({ brokerId: currentUser.id, role: 'realtor' });

      const agreementStatus = currentUser.agreementSigned
        ? `<div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #d1fae5; border-radius: 0.5rem; margin-bottom: 1.5rem;">
             <span style="font-size: 1.5rem;">✅</span>
             <div>
               <div style="font-weight: 600; color: #065f46;">Broker Agreement Signed</div>
               <div style="font-size: 0.85rem; color: #047857;">Signed on ${App.utils.formatDate(currentUser.agreementSignedAt)}</div>
             </div>
           </div>`
        : `<div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #fef3c7; border-radius: 0.5rem; margin-bottom: 1.5rem;">
             <span style="font-size: 1.5rem;">⚠️</span>
             <div>
               <div style="font-weight: 600; color: #92400e;">Broker Agreement Pending</div>
               <div style="font-size: 0.85rem; color: #b45309;">Please sign the broker agreement.</div>
             </div>
           </div>`;

      const teamDocsHtml = teamRealtors.length === 0 
        ? `<div class="empty-state"><div class="empty-state__icon">👥</div><p class="empty-state__text">No team members yet.</p></div>`
        : `<div class="team-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
             ${teamRealtors.map(r => `
               <div class="glass-card" style="padding: 1.25rem;">
                 <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                   <div>
                     <div style="font-weight: 600; font-size: 1rem;">${App.utils.escapeHtml(r.firstName)} ${App.utils.escapeHtml(r.lastName)}</div>
                     <div style="font-size: 0.8rem; color: #6b7280;">Realtor</div>
                   </div>
                   ${r.agreementSigned 
                     ? '<span class="badge badge--approved">Signed</span>' 
                     : '<span class="badge badge--pending">Pending</span>'}
                 </div>
                 <div style="font-size: 0.85rem; color: #374151;">
                   <p style="margin: 0 0 0.5rem;"><strong>Agreement:</strong> Collaboration Agreement (Standard 25%)</p>
                   ${r.agreementSigned 
                     ? `<p style="margin: 0; color: #10b981;">Signed on: ${App.utils.formatDate(r.agreementSignedAt)}</p>` 
                     : `<p style="margin: 0; color: #f59e0b;">Waiting for signature</p>`}
                 </div>
               </div>
             `).join('')}
           </div>`;

      container.innerHTML = `
        ${agreementStatus}
        <div class="dashboard-section">
          <h2>Team Realtors Collaboration Agreements</h2>
          ${teamDocsHtml}
        </div>
      `;

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

      brokerCommissions = await App.auth.getCommissions({ brokerId: currentUser.id });

      // Calculate summary metrics
      const totalComm   = brokerCommissions.reduce((s, c) => s + (c.brokerAmount || 0), 0);
      const paidComm    = brokerCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.brokerAmount || 0), 0);
      const pendingComm = brokerCommissions.filter(c => c.status === 'pending_payment').reduce((s, c) => s + (c.brokerAmount || 0), 0);
      const projComm    = brokerCommissions.filter(c => c.status === 'projected').reduce((s, c) => s + (c.brokerAmount || 0), 0);

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
          <td style="text-align: center;">${c.brokerSharePct}%</td>
          <td style="font-weight: 600;">${App.utils.formatCurrency(c.brokerAmount)}</td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.85rem; color: #6b7280;">${App.utils.formatDate(c.closingDate || c.createdAt)}</td>
        </tr>
      `;
    }).join('');
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
    initClients,
    initDocuments,
    initFinances,
    showRealtorDetail,
    closeRealtorDetail,
    approveRealtor,
    rejectRealtor
  };

})();
