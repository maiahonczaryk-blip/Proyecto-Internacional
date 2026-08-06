/* ============================================
   RE/MAX Inmomás — Realtor View Module
   ============================================
   Handles all Realtor dashboard views: dashboard,
   client pipeline (Kanban), referral tools,
   documents, and finances.
   Registered on App.views.realtor.
   ============================================ */

;(function() {
  'use strict';

  window.App = window.App || {};
  App.views = App.views || {};

  /* ── Cached data ── */
  let currentUser = null;
  let realtorClients = [];
  let realtorCommissions = [];



  /* ============================================
     initDashboard()
     Populates #view-realtor-dashboard with stats,
     referral link, mini pipeline, and recent
     client activity.
     ============================================ */
  async function initDashboard() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      // Load data scoped to this realtor
      realtorClients     = await App.auth.getClients({ referredBy: currentUser.id });
      realtorCommissions = await App.auth.getCommissions({ realtorId: currentUser.id });

      // Calculate metrics
      const activeClients   = realtorClients.filter(c => c.status !== 'completed');
      const completedSales  = realtorClients.filter(c => c.status === 'completed');
      const totalRealtorComm = realtorCommissions.reduce((sum, c) => sum + (c.realtorAmount || 0), 0);

      // Update stat cards
      setTextById('realtor-stat-clients',     realtorClients.length);
      setTextById('realtor-stat-active',      activeClients.length);
      setTextById('realtor-stat-sales',       completedSales.length);
      setTextById('realtor-stat-commissions', App.utils.formatCurrency(totalRealtorComm));

      // Referral link
      const isPending = currentUser.status === 'pending';
      const referralLink = isPending ? '' : App.utils.generateReferralLink(currentUser.referralCode || 'REA-DEFAULT');
      const linkInput = document.getElementById('realtor-dash-referral-link');
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
      const copyBtn = document.getElementById('realtor-dash-copy-link');
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
      const addBtnContainer = document.getElementById('realtor-dash-add-client-btn');
      if (addBtnContainer) {
        addBtnContainer.innerHTML = `
          <button class="btn btn-primary" onclick="App.views.realtor.showAddClientModal()" style="display: flex; align-items: center; gap: 8px; padding: 0.65rem 1.25rem; font-size: 0.9rem; border-radius: 8px; background: linear-gradient(135deg, #0043ff, #0066ff); border: none; box-shadow: 0 2px 8px rgba(0,67,255,0.2);">
            <span style="font-size: 1.1rem;">➕</span> Add Client Manually
          </button>
        `;
      }

      // Mini pipeline summary
      renderMiniPipeline(realtorClients);

      // Recent clients (last 3)
      renderDashRecentClients(realtorClients);

    } catch (err) {
      console.error('[Realtor] initDashboard error:', err);
      App.utils.showToast('Error loading dashboard.', 'error');
    }
  }

  /* ── Mini Pipeline Summary ── */
  function renderMiniPipeline(clients) {
    const container = document.getElementById('realtor-dash-pipeline');
    if (!container) return;

    const total = clients.length || 1; // avoid division by zero

    const bars = App.utils.PIPELINE_COLUMNS.map(col => {
      const count = clients.filter(c => col.statuses.includes(c.status)).length;
      const pct = Math.round((count / total) * 100);
      const color = App.utils.columnColors[col.key];

      return `
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 0.25rem;">
            <span style="color: #374151; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${col.label}</span>
            <span style="font-weight: 600; color: ${color};">${count}</span>
          </div>
          <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 4px; transition: width 0.5s;"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div style="display: flex; gap: 0.5rem;">${bars}</div>`;
  }

  /* ── Dashboard Recent Clients ── */
  function renderDashRecentClients(clients) {
    const container = document.getElementById('realtor-dash-recent');
    if (!container) return;

    const recent = [...clients]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    if (recent.length === 0) {
      App.utils.showEmptyState('realtor-dash-recent', 'No clients yet. Share your referral link to get started!', '🔗');
      return;
    }

    container.innerHTML = recent.map(c => {
      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(c.status)}">${App.utils.getStatusLabel(c.status)}</span>`;
      return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid var(--border-subtle); transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--blue); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1rem; flex-shrink: 0;">
            ${c.firstName.charAt(0)}${c.lastName.charAt(0)}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px;">${App.utils.escapeHtml(c.firstName)} ${App.utils.escapeHtml(c.lastName)}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; gap: 8px; align-items: center;">
              <span>🗓 ${App.utils.formatDate(c.createdAt)}</span>
              <span>•</span>
              <span style="text-transform: capitalize;">${App.utils.escapeHtml(c.country || 'Unknown')}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            ${statusBadge}
            <button class="btn" style="padding: 4px 8px; font-size: 0.75rem; background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary);">View Details</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ============================================
     initClients()
     Populates #view-realtor-clients with a
     Kanban pipeline board.
     ============================================ */
  async function initClients() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      realtorClients = await App.auth.getClients({ referredBy: currentUser.id });
      renderPipelineBoard(realtorClients);

    } catch (err) {
      console.error('[Realtor] initClients error:', err);
      App.utils.showToast('Error loading client pipeline.', 'error');
    }
  }

  /* ── Kanban Pipeline Board ── */
  function renderPipelineBoard(clients) {
    App.utils.renderKanbanBoard('realtor-pipeline-board', clients, 'App.views.realtor.showClientDetail', null, null);
  }

  async function handleClientDrop(clientId, newStatus) {
    try {
      await App.auth.updateClientStatus(clientId, newStatus, 'Moved in Kanban Board');
      initClients(); // Refresh board
    } catch (err) {
      console.error('Drop error:', err);
      App.utils.showToast(err.message, 'error');
    }
  }

  /* ── Client Detail Modal (with timeline) ── */
  async function showClientDetail(clientId) {
    try {
      const client = realtorClients.find(c => c.id === clientId);
      if (!client) {
        App.utils.showToast('Client not found.', 'error');
        return;
      }

      const statusBadge = `<span class="badge ${App.utils.getStatusBadgeClass(client.status)}">${App.utils.getStatusLabel(client.status)}</span>`;

      // Build timeline
      const timeline = (client.statusHistory || []).map((entry, i) => {
        const isLast = i === client.statusHistory.length - 1;
        return `
          <div style="display: flex; gap: 0.75rem; position: relative; padding-bottom: ${isLast ? '0' : '1rem'};">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${isLast ? '#0043ff' : '#d1d5db'}; flex-shrink: 0; z-index: 1;"></div>
              ${!isLast ? '<div style="width: 2px; flex: 1; background: #e5e7eb;"></div>' : ''}
            </div>
            <div style="padding-bottom: 0.5rem;">
              <div style="font-weight: 500; font-size: 0.85rem;">
                <span class="badge ${App.utils.getStatusBadgeClass(entry.status)}">${App.utils.getStatusLabel(entry.status)}</span>
              </div>
              <div style="font-size: 0.8rem; color: #6b7280; margin-top: 0.25rem;">
                ${App.utils.formatDate(entry.date)}
              </div>
              ${entry.note ? `<div style="font-size: 0.8rem; color: #374151; margin-top: 0.25rem; font-style: italic;">"${App.utils.escapeHtml(entry.note)}"</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      App.utils.showModal({
        title: 'Client Details',
        body: `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.5rem;">${App.utils.escapeHtml(client.firstName)} ${App.utils.escapeHtml(client.lastName)}</h3>
            <div>${statusBadge}</div>
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
            <div style="grid-column: span 2;">
              <div style="font-weight: 600; color: #374151;">Agente Inmomás (España)</div>
              <div style="color: #b45309; font-weight: 600;">🇪🇸 ${App.utils.escapeHtml(client.localAgentName || 'Sin asignar / Unassigned')}</div>
            </div>
          </div>
          ${client.notes ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; color: #374151; margin-bottom: 1.5rem;">📝 ${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151;">Timeline</h4>
          ${timeline || '<p style="color: #6b7280;">No history available.</p>'}
        `,
        footer: `<button class="btn btn-sm" onclick="App.utils.confirmDeleteClient('${client.id}', '${client.firstName} ${client.lastName}', () => App.views.realtor.initDashboard())" style="background: #ef4444; color: white; border: none;">🗑️ Delete</button>
          <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
      });

    } catch (err) {
      console.error('[Realtor] showClientDetail error:', err);
      App.utils.showToast('Error loading client details.', 'error');
    }
  }

  /* ============================================
     initReferral()
     Populates #view-realtor-referral with the
     referral link, stats, QR placeholder, and
     marketing tips.
     ============================================ */
  async function initReferral() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      realtorClients = await App.auth.getClients({ referredBy: currentUser.id });

      const isPending = currentUser.status === 'pending';
      const referralLink = isPending ? '' : App.utils.generateReferralLink(currentUser.referralCode || 'REA-DEFAULT');

      // Display referral link
      const linkDisplay = document.getElementById('realtor-referral-link-display');
      if (linkDisplay) {
        if (isPending) {
          linkDisplay.value = 'Enlace pendiente de aprobación por el Administrador';
          linkDisplay.disabled = true;
          linkDisplay.style.color = '#9ca3af';
          linkDisplay.style.fontStyle = 'italic';
        } else {
          linkDisplay.value = referralLink;
          linkDisplay.disabled = false;
          linkDisplay.style.color = '';
          linkDisplay.style.fontStyle = '';
        }
      }

      // Copy button
      const copyBtn = document.getElementById('realtor-copy-referral-btn');
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

      // Referral stats
      const totalReferred = realtorClients.length;
      const activeInPipeline = realtorClients.filter(c => c.status !== 'completed').length;
      const converted = realtorClients.filter(c => c.status === 'completed').length;
      const conversionRate = totalReferred > 0 ? Math.round((converted / totalReferred) * 100) : 0;

      setTextById('referral-stat-total',      totalReferred);
      setTextById('referral-stat-active',     activeInPipeline);
      setTextById('referral-stat-converted',  converted);
      setTextById('referral-stat-conversion', conversionRate + '%');

      // QR Code placeholder
      const qrContainer = document.getElementById('referral-qr-code');
      if (qrContainer) {
        if (isPending) {
          qrContainer.innerHTML = `
            <div style="border: 2px dashed #e5e7eb; border-radius: 0.75rem; padding: 2rem; text-align: center; background: #f9fafb; opacity: 0.6;">
              <div style="font-size: 3rem; margin-bottom: 0.75rem; filter: grayscale(1);">📱</div>
              <div style="font-size: 0.85rem; font-weight: 600; color: #9ca3af; margin-bottom: 0.5rem;">Código QR no disponible</div>
              <p style="font-size: 0.75rem; color: #9ca3af; margin: 0;">
                Se generará automáticamente cuando tu cuenta sea aprobada por el Administrador.
              </p>
            </div>
          `;
        } else {
          qrContainer.innerHTML = `
            <div style="border: 2px dashed #d1d5db; border-radius: 0.75rem; padding: 2rem; text-align: center; background: #f9fafb;">
              <div style="font-size: 3rem; margin-bottom: 0.75rem;">📱</div>
              <div style="font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;">QR Code</div>
              <div style="font-size: 0.75rem; color: #6b7280; word-break: break-all; padding: 0.5rem; background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem;">
                ${App.utils.escapeHtml(referralLink)}
              </div>
              <p style="font-size: 0.75rem; color: #9ca3af; margin: 0.75rem 0 0;">
                QR code generation can be integrated with a library like <strong>qrcode.js</strong>
              </p>
            </div>
          `;
        }
      }

      // Marketing tips
      renderMarketingTips();

    } catch (err) {
      console.error('[Realtor] initReferral error:', err);
      App.utils.showToast('Error loading referral tools.', 'error');
    }
  }

  /* ── Marketing Tips Section ── */
  function renderMarketingTips() {
    const container = document.getElementById('referral-marketing-tips');
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; gap: 1rem;">
        <div class="pipeline-card" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem;">💬 Share on Social Media</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">Post your referral link on LinkedIn, Facebook, and Instagram. Mention the free webinar and VIP trip — they are powerful hooks for potential buyers.</p>
        </div>
        <div class="pipeline-card" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem;">📧 Email Your Database</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">Send a personalized email to clients who've expressed interest in international property, retirement abroad, or investment diversification.</p>
        </div>
        <div class="pipeline-card" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem;">🏠 Add to Listings</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">Include a mention of your Spain partnership in your listing presentations. "Interested in Spain? I can help with that too."</p>
        </div>
        <div class="pipeline-card" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem;">🎯 Target Retirement Communities</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">Americans aged 55+ are the #1 demographic buying in Costa Blanca. Reach out to local retirement groups and communities.</p>
        </div>
        <div class="pipeline-card" style="padding: 1rem;">
          <h4 style="margin: 0 0 0.5rem; font-size: 0.9rem;">🤝 Network at Events</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">Attend RE/MAX events, real estate conferences, and expat meetups. Bring printed materials with your QR code.</p>
        </div>
      </div>
    `;
  }

  /* ============================================
     initDocuments()
     Populates #view-realtor-documents with:
     - Collaboration agreement (sign flow)
     - Document upload section
     ============================================ */
  async function initDocuments() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      renderAgreementSection();
      renderUploadSection();

    } catch (err) {
      console.error('[Realtor] initDocuments error:', err);
      App.utils.showToast('Error loading documents.', 'error');
    }
  }

  /* ── Agreement Section — Download & Upload Flow ── */
  function renderAgreementSection() {
    const container = document.getElementById('agreement-section');
    const target = container || document.getElementById('realtor-documents-content');
    if (!target) return;

    const status = currentUser.agreementStatus || 'none'; // 'none' | 'uploaded' | 'signed'

    let statusHtml = '';
    if (status === 'signed') {
      statusHtml = `
        <div style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#d1fae5; border-radius:0.75rem; margin-bottom:1.5rem; border:1px solid #a7f3d0;">
          <span style="font-size:2rem;">✅</span>
          <div>
            <div style="font-weight:700; color:#065f46; font-size:1rem;">Referral Agreement — Signed by both parties</div>
            <div style="font-size:0.85rem; color:#047857; margin-bottom:8px;">Agreement active. Signed on ${App.utils.formatDate(currentUser.agreementSignedAt)}.</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
              ${currentUser.agreementFileUrl ? `<a href="${currentUser.agreementFileUrl}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 10px;font-size:0.78rem;">📥 Your Signed Copy</a>` : ''}
              ${currentUser.agreementFinalUrl ? `<a href="${currentUser.agreementFinalUrl}" target="_blank" class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:0.78rem;color:white;">📥 Final Countersigned Agreement</a>` : ''}
            </div>
          </div>
        </div>`;
    } else if (status === 'uploaded') {
      statusHtml = `
        <div style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#fef9c3; border-radius:0.75rem; margin-bottom:1.5rem; border:1px solid #fef08a;">
          <span style="font-size:2rem;">⏳</span>
          <div>
            <div style="font-weight:700; color:#854d0e; font-size:1rem;">Agreement uploaded — Pending RE/MAX Inmom&aacute;s signature</div>
            <div style="font-size:0.85rem; color:#a16207; margin-bottom:8px;">We have received your signed agreement. The RE/MAX Inmom&aacute;s broker will countersign shortly.</div>
            ${currentUser.agreementFileUrl ? `<a href="${currentUser.agreementFileUrl}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 10px;font-size:0.78rem;">📥 View Uploaded Agreement</a>` : ''}
          </div>
        </div>`;
    } else {
      statusHtml = `
        <div style="padding:1.25rem; background:#fef3c7; border-radius:0.75rem; margin-bottom:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
            <span style="font-size:1.5rem;">⚠️</span>
            <div style="font-weight:600; color:#92400e;">Referral Agreement Required</div>
          </div>
          <p style="font-size:0.85rem; color:#78350f; margin:0;">Please download the agreement, sign it, and upload the signed copy to activate your partnership.</p>
        </div>`;
    }

    target.innerHTML = `
      ${statusHtml}

      <!-- Step 1: Download -->
      <div style="background:#f8f9ff; border:1.5px solid #c7d2fe; border-radius:0.75rem; padding:1.25rem; margin-bottom:1rem;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
          <span style="font-size:1.4rem;">1️⃣</span>
          <div style="font-weight:600; color:#1e40af;">Download &amp; Sign the Agreement</div>
        </div>
        <p style="font-size:0.85rem; color:#374151; margin:0 0 0.875rem;">Download your personalized Master Referral Agreement (Word format). Sign it and return below.</p>
        <button class="btn btn-primary" id="download-agreement-btn" style="gap:0.5rem;">
          📄 Download Referral Agreement (.doc)
        </button>
      </div>

      <!-- Step 2: Upload signed copy -->
      <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:0.75rem; padding:1.25rem;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
          <span style="font-size:1.4rem;">2️⃣</span>
          <div style="font-weight:600; color:#166534;">Upload Signed Agreement</div>
        </div>
        <p style="font-size:0.85rem; color:#374151; margin:0 0 0.875rem;">Upload your signed copy (PDF or Word). We will countersign and confirm your partnership.</p>
        <div id="agreement-upload-zone" style="border:2px dashed #86efac; border-radius:0.625rem; padding:1.5rem; text-align:center; cursor:pointer; transition:border-color 0.2s;"
             onclick="document.getElementById('agreement-file-input').click()"
             onmouseover="this.style.borderColor='#22c55e'" onmouseout="this.style.borderColor='#86efac'">
          <div style="font-size:2rem; margin-bottom:0.4rem;">📤</div>
          <p style="font-weight:600; color:#374151; margin:0 0 0.2rem;">Drop signed file here or click to select</p>
          <p style="font-size:0.78rem; color:#9ca3af; margin:0;">PDF or DOC, max 10 MB</p>
        </div>
        <input type="file" id="agreement-file-input" accept=".pdf,.doc,.docx" style="display:none;">
        <div id="agreement-upload-status" style="margin-top:0.75rem; font-size:0.85rem;"></div>
      </div>
    `;

    // Bind download button
    const dlBtn = document.getElementById('download-agreement-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        if (typeof App.generateReferralAgreementDoc === 'function') {
          App.generateReferralAgreementDoc(currentUser);
          App.utils.showToast('Agreement downloading... Open in Word, sign it, then upload it below.', 'info');
        } else {
          App.utils.showToast('Generator not loaded. Please refresh.', 'error');
        }
      });
    }

    // Bind upload zone
    const uploadZone = document.getElementById('agreement-upload-zone');
    const fileInput  = document.getElementById('agreement-file-input');
    if (uploadZone) {
      uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = '#22c55e'; });
      uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = '#86efac'; });
      uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.style.borderColor = '#86efac';
        const file = e.dataTransfer.files[0];
        if (file) handleAgreementUpload(file);
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) handleAgreementUpload(file);
      });
    }
  }

  /* ── Handle signed agreement upload ── */
  async function handleAgreementUpload(file) {
    const statusEl = document.getElementById('agreement-upload-status');
    if (statusEl) statusEl.innerHTML = '<span style="color:#6b7280;">⏳ Uploading...</span>';

    try {
      let fileUrl = null;

      if (!App.demoMode && App.storage) {
        // Upload to Firebase Storage
        const ref = App.storage.ref(`agreements/${currentUser.id}/signed_${Date.now()}_${file.name}`);
        await ref.put(file);
        fileUrl = await ref.getDownloadURL();
      } else {
        // Demo mode: simulate upload
        fileUrl = `demo://agreements/${currentUser.id}/${file.name}`;
      }

      // Update user record
      if (!App.demoMode && App.db) {
        await App.db.collection('users').doc(currentUser.id).update({
          agreementStatus: 'uploaded',
          agreementUploadedAt: new Date().toISOString(),
          agreementFileUrl: fileUrl
        });
        // Create admin notification
        await App.db.collection('agreement_notifications').add({
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          userRole: currentUser.role,
          agencyName: currentUser.agencyName || currentUser.brokerNameManual || '—',
          email: currentUser.email,
          fileUrl: fileUrl,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'pending_admin'
        });
      } else {
        // Demo mode
        const demoUser = App.demoData.users.find(u => u.id === currentUser.id);
        if (demoUser) {
          demoUser.agreementStatus = 'uploaded';
          demoUser.agreementUploadedAt = new Date().toISOString();
          demoUser.agreementFileUrl = fileUrl;
        }
        currentUser.agreementStatus = 'uploaded';
        // Demo notification stored in memory
        App.demoData.agreementNotifications = App.demoData.agreementNotifications || [];
        App.demoData.agreementNotifications.push({
          id: 'notif_' + Date.now(),
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          userRole: currentUser.role,
          agencyName: currentUser.agencyName || '—',
          email: currentUser.email,
          fileUrl: fileUrl,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          status: 'pending_admin'
        });
        if (App.auth && typeof App.auth.saveDemoData === 'function') App.auth.saveDemoData();
      }

      App.utils.showToast('✅ Agreement uploaded! The RE/MAX Inmomás broker will countersign shortly.', 'success');
      renderAgreementSection();

    } catch (err) {
      console.error('[Realtor] Agreement upload error:', err);
      if (statusEl) statusEl.innerHTML = '<span style="color:#e11b22;">❌ Upload failed. Please try again.</span>';
      App.utils.showToast('Upload failed. Please try again.', 'error');
    }
  }

  /* ── Document Upload Section (for other docs) ── */
  function renderUploadSection() {
    const uploadZone = document.getElementById('doc-upload-zone');
    const fileInput  = document.getElementById('doc-file-input');
    const docsList   = document.getElementById('uploaded-docs-list');

    if (uploadZone) {
      uploadZone.innerHTML = `
        <div style="border:2px dashed #d1d5db; border-radius:0.75rem; padding:2rem; text-align:center; cursor:pointer; transition:border-color 0.2s;"
             onmouseover="this.style.borderColor='#0043ff'" onmouseout="this.style.borderColor='#d1d5db'"
             onclick="document.getElementById('doc-file-input') && document.getElementById('doc-file-input').click()">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">📤</div>
          <p style="font-weight:600; color:#374151; margin:0 0 0.25rem;">Drop files here or click to upload</p>
          <p style="font-size:0.8rem; color:#9ca3af; margin:0;">PDF, JPG, PNG up to 10MB</p>
        </div>
      `;
      uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.querySelector('div').style.borderColor = '#0043ff'; });
      uploadZone.addEventListener('dragleave', () => { uploadZone.querySelector('div').style.borderColor = '#d1d5db'; });
      uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.querySelector('div').style.borderColor = '#d1d5db';
        App.utils.showToast('File upload will be available when connected to Firebase Storage.', 'info');
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        App.utils.showToast('File upload will be available when connected to Firebase Storage.', 'info');
      });
    }

    if (docsList) {
      docsList.innerHTML = `
        <div class="empty-state" style="padding:1.5rem;">
          <div class="empty-state__icon">📄</div>
          <p class="empty-state__text">No documents uploaded yet. Upload your business license, ID, or other required documents here.</p>
        </div>
      `;
    }
  }


  /* ============================================
     initFinances()
     Populates #view-realtor-finances with
     commission stats, table, and projections.
     ============================================ */
  async function initFinances() {
    try {
      currentUser = App.auth.getCurrentUser();
      if (!currentUser) return;

      realtorClients     = await App.auth.getClients({ referredBy: currentUser.id });
      realtorCommissions = await App.auth.getCommissions({ realtorId: currentUser.id });

      // Calculate metrics
      const totalComm = realtorCommissions.reduce((s, c) => s + (c.realtorAmount || 0), 0);
      const paidComm  = realtorCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.realtorAmount || 0), 0);
      const projComm  = realtorCommissions.filter(c => c.status === 'projected' || c.status === 'pending_payment')
                                          .reduce((s, c) => s + (c.realtorAmount || 0), 0);
      const completedSales = realtorCommissions.filter(c => c.status === 'paid').length;
      const avgPerSale = completedSales > 0 ? totalComm / completedSales : 0;

      // Update stat cards
      setTextById('realtor-fin-total',     App.utils.formatCurrency(totalComm));
      setTextById('realtor-fin-paid',      App.utils.formatCurrency(paidComm));
      setTextById('realtor-fin-projected', App.utils.formatCurrency(projComm));
      setTextById('realtor-fin-avg',       App.utils.formatCurrency(avgPerSale));

      // Commission table
      renderRealtorCommissionTable(realtorCommissions);

      // Projection section
      renderProjection(realtorClients, realtorCommissions);

    } catch (err) {
      console.error('[Realtor] initFinances error:', err);
      App.utils.showToast('Error loading financial data.', 'error');
    }
  }

  /* ── Commission Table ── */
  function renderRealtorCommissionTable(commissions) {
    const tbody = document.getElementById('realtor-commission-table-body');
    if (!tbody) return;

    if (commissions.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="8" style="text-align: center; padding: 2rem;">
          <div class="empty-state">
            <div class="empty-state__icon">💰</div>
            <p class="empty-state__text">No commissions yet. Start by referring clients through your link!</p>
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
          <td style="text-align: center;">${c.realtorSharePct}%</td>
          <td style="font-weight: 600;">${App.utils.formatCurrency(c.realtorAmount)}</td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.85rem; color: #6b7280;">${App.utils.formatDate(c.closingDate || c.createdAt)}</td>
        </tr>
      `;
    }).join('');
  }

  /* ── Future Earnings Projection ── */
  function renderProjection(clients, commissions) {
    const container = document.getElementById('realtor-projection');
    if (!container) return;

    // Active clients (those not yet completed)
    const activeClients = clients.filter(c => c.status !== 'completed');

    // Average sale price from existing commissions (or use a sensible default)
    const completedComms = commissions.filter(c => c.status === 'paid' || c.status === 'pending_payment');
    const avgSalePrice = completedComms.length > 0
      ? completedComms.reduce((s, c) => s + c.salePrice, 0) / completedComms.length
      : 300000; // default €300k

    // Average buyer-side commission rate: 5%
    const commRate = 0.05;
    const realtorShareRate = 0.25;

    // Expected conversion rate based on historical data
    const totalClients = clients.length || 1;
    const completedCount = clients.filter(c => c.status === 'completed').length;
    const conversionRate = completedCount > 0 ? completedCount / totalClients : 0.20; // default 20%

    const projectedSales = Math.round(activeClients.length * conversionRate);
    const projectedEarnings = projectedSales * avgSalePrice * commRate * realtorShareRate;

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #0043ff08, #8b5cf608); border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem;">
        <h4 style="margin: 0 0 1rem; font-size: 1rem; color: #374151;">📈 Future Earnings Projection</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #0043ff;">${activeClients.length}</div>
            <div style="font-size: 0.8rem; color: #6b7280;">Active Clients</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6;">${Math.round(conversionRate * 100)}%</div>
            <div style="font-size: 0.8rem; color: #6b7280;">Est. Conversion</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${App.utils.formatCurrency(avgSalePrice)}</div>
            <div style="font-size: 0.8rem; color: #6b7280;">Avg. Sale Price</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${App.utils.formatCurrency(projectedEarnings)}</div>
            <div style="font-size: 0.8rem; color: #6b7280;">Projected Earnings</div>
          </div>
        </div>
        <p style="font-size: 0.75rem; color: #9ca3af; margin: 0; font-style: italic;">
          * Based on ${projectedSales} projected sale${projectedSales !== 1 ? 's' : ''} from ${activeClients.length} active client${activeClients.length !== 1 ? 's' : ''},
          with an average sale price of ${App.utils.formatCurrency(avgSalePrice)} and a ${realtorShareRate * 100}% referral commission rate on ${commRate * 100}% buyer-side commission.
        </p>
      </div>
    `;
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
        <button class="btn btn-primary btn-sm" onclick="App.views.realtor.handleAddClient()" style="margin-left: 0.5rem;">Save Client</button>
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
      console.error('[Realtor] handleAddClient error:', err);
      App.utils.showToast('Error adding client: ' + err.message, 'error');
    }
  }

  /* ── Utility ── */
  function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ============================================
     Public API — register on App.views.realtor
     ============================================ */
  App.views.realtor = {
    initDashboard,
    initClients,
    initReferral,
    initDocuments,
    initFinances,
    showClientDetail,
    handleClientDrop,
    showAddClientModal,
    handleAddClient
  };

})();
