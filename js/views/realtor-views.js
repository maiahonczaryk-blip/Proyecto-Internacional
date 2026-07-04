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
      const referralLink = App.utils.generateReferralLink(currentUser.referralCode || 'REA-DEFAULT');
      const linkInput = document.getElementById('realtor-dash-referral-link');
      if (linkInput) {
        linkInput.value = referralLink;
      }

      // Copy button handler
      const copyBtn = document.getElementById('realtor-dash-copy-link');
      if (copyBtn) {
        copyBtn.onclick = () => App.utils.copyToClipboard(referralLink);
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
    App.utils.renderKanbanBoard('realtor-pipeline-board', clients, 'App.views.realtor.showClientDetail', null);
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
          </div>
          ${client.notes ? `<div style="background: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.85rem; color: #374151; margin-bottom: 1.5rem;">📝 ${App.utils.escapeHtml(client.notes)}</div>` : ''}
          <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: #374151;">Timeline</h4>
          ${timeline || '<p style="color: #6b7280;">No history available.</p>'}
        `,
        footer: `<button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">Close</button>`
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

      const referralLink = App.utils.generateReferralLink(currentUser.referralCode || 'REA-DEFAULT');

      // Display referral link
      const linkDisplay = document.getElementById('realtor-referral-link-display');
      if (linkDisplay) {
        linkDisplay.value = referralLink;
      }

      // Copy button
      const copyBtn = document.getElementById('realtor-copy-referral-btn');
      if (copyBtn) {
        copyBtn.onclick = () => App.utils.copyToClipboard(referralLink);
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

  /* ── Agreement Section ── */
  function renderAgreementSection() {
    const container = document.getElementById('agreement-section');
    // If there's no dedicated container, try the general content area
    const target = container || document.getElementById('realtor-documents-content');
    if (!target) return;

    if (currentUser.agreementSigned) {
      // Signed state
      if (container) {
        container.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #d1fae5; border-radius: 0.75rem; margin-bottom: 1.5rem;">
            <span style="font-size: 2rem;">✅</span>
            <div>
              <div style="font-weight: 700; color: #065f46; font-size: 1rem;">Collaboration Agreement — Signed</div>
              <div style="font-size: 0.85rem; color: #047857;">
                Signed on ${App.utils.formatDate(currentUser.agreementSignedAt)}. Your agreement is active and on file.
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // Unsigned: show agreement text + sign button
      if (container) {
        container.innerHTML = `
          <div style="padding: 1.25rem; background: #fef3c7; border-radius: 0.75rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
              <span style="font-size: 1.5rem;">⚠️</span>
              <div style="font-weight: 600; color: #92400e;">Agreement Required</div>
            </div>
            <p style="font-size: 0.85rem; color: #78350f; margin: 0;">Please read and sign the collaboration agreement below to activate your partnership.</p>
          </div>
          <div id="agreement-text-container" style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; font-size: 0.85rem; line-height: 1.7; color: #374151; background: #fafafa;">
            ${getAgreementText()}
          </div>
          <div style="text-align: center;">
            <button class="btn btn-primary" id="sign-agreement-btn" style="padding: 0.75rem 2rem;">
              ✍️ Sign Agreement
            </button>
          </div>
        `;

        // Bind sign button
        const signBtn = document.getElementById('sign-agreement-btn');
        if (signBtn) {
          signBtn.addEventListener('click', openSignatureModal);
        }
      }
    }
  }

  /* ── Signature Modal ── */
  function openSignatureModal() {
    App.utils.showModal({
      title: 'Sign Collaboration Agreement',
      body: `
        <div style="margin-bottom: 1.5rem;">
          <p style="font-size: 0.9rem; color: #374151; margin: 0 0 1rem;">
            By checking the box below, you confirm that you have read and agree to all terms of the
            Collaboration Agreement between yourself and RE/MAX Inmomás.
          </p>
          <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
            <input type="checkbox" id="agree-checkbox" style="margin-top: 0.2rem; flex-shrink: 0;">
            <span style="font-size: 0.85rem; color: #374151; line-height: 1.5;">
              I, <strong>${App.utils.escapeHtml(currentUser.firstName)} ${App.utils.escapeHtml(currentUser.lastName)}</strong>,
              have read and fully agree to the terms and conditions of the RE/MAX Inmomás International
              Referral Collaboration Agreement. I understand that my referral commission is 25% of the
              buyer-side commission on completed sales.
            </span>
          </label>
        </div>
        <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; background: #f9fafb; text-align: center;">
          <p style="font-size: 0.8rem; color: #9ca3af; margin: 0 0 0.5rem;">Digital Signature</p>
          <div style="font-family: 'Brush Script MT', cursive; font-size: 1.5rem; color: #374151; padding: 0.5rem;">
            ${App.utils.escapeHtml(currentUser.firstName)} ${App.utils.escapeHtml(currentUser.lastName)}
          </div>
          <p style="font-size: 0.75rem; color: #9ca3af; margin: 0;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      `,
      footer: `
        <button class="btn btn-outline btn-sm" id="sign-cancel-btn">Cancel</button>
        <button class="btn btn-primary btn-sm" id="sign-confirm-btn" style="margin-left: 0.5rem;" disabled>
          Confirm & Sign
        </button>
      `
    });

    // Bind checkbox to enable confirm button
    const checkbox   = document.getElementById('agree-checkbox');
    const confirmBtn = document.getElementById('sign-confirm-btn');
    const cancelBtn  = document.getElementById('sign-cancel-btn');

    if (checkbox && confirmBtn) {
      checkbox.addEventListener('change', () => {
        confirmBtn.disabled = !checkbox.checked;
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => App.utils.closeModal());
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        App.utils.closeModal();
        try {
          // Update user's agreement status
          if (App.demoMode) {
            const demoUser = App.demoData.users.find(u => u.id === currentUser.id);
            if (demoUser) {
              demoUser.agreementSigned = true;
              demoUser.agreementSignedAt = new Date().toISOString();
            }
            // Update the cached currentUser too
            currentUser.agreementSigned = true;
            currentUser.agreementSignedAt = new Date().toISOString();
          } else {
            await App.db.collection('users').doc(currentUser.id).update({
              agreementSigned: true,
              agreementSignedAt: new Date().toISOString()
            });
            currentUser.agreementSigned = true;
            currentUser.agreementSignedAt = new Date().toISOString();
          }

          App.utils.showToast('Agreement signed successfully! 🎉', 'success');
          renderAgreementSection();

        } catch (err) {
          console.error('[Realtor] Sign agreement error:', err);
          App.utils.showToast('Error signing agreement. Please try again.', 'error');
        }
      });
    }
  }

  /* ── Full Agreement Text ── */
  function getAgreementText() {
    return `
      <h3 style="text-align: center; margin-bottom: 1.5rem; font-size: 1rem;">
        INTERNATIONAL REFERRAL COLLABORATION AGREEMENT
      </h3>
      <p style="text-align: center; margin-bottom: 1.5rem; color: #6b7280; font-size: 0.8rem;">
        Between RE/MAX Inmomás (Spain) and the Referring Agent
      </p>

      <p><strong>CLAUSE 1 — PARTIES</strong></p>
      <p>This Collaboration Agreement ("Agreement") is entered into between:</p>
      <p><strong>a) RE/MAX Inmomás</strong>, a licensed real estate agency operating under the RE/MAX franchise in Spain,
      with offices in Alicante, Elche, Santa Pola, and Gran Alacant, Costa Blanca, represented by its
      management team (hereinafter "RE/MAX Inmomás").</p>
      <p><strong>b) The Referring Agent</strong>, the individual or agency signing this agreement, who operates as a licensed
      real estate professional in their country of origin (hereinafter "The Agent").</p>

      <p><strong>CLAUSE 2 — PURPOSE AND SCOPE</strong></p>
      <p>The purpose of this Agreement is to establish the terms under which The Agent may refer potential
      international buyers to RE/MAX Inmomás for the purchase of real estate property in Spain, specifically
      within the Costa Blanca and Alicante province regions.</p>
      <p>RE/MAX Inmomás shall manage the entire buying process in Spain, including but not limited to:
      property showings, legal coordination, mortgage facilitation, tax advisory, and after-sale support.</p>

      <p><strong>CLAUSE 3 — REFERRAL PROCESS</strong></p>
      <p>3.1. The Agent shall refer prospective buyers exclusively through the platform's referral link system,
      which automatically attributes each lead to the referring agent.</p>
      <p>3.2. A referral is considered valid when the referred client registers through The Agent's unique
      referral link and is subsequently identified in the RE/MAX Inmomás CRM system.</p>
      <p>3.3. The referral attribution is permanent — once a client is linked to The Agent, all future
      transactions with that client shall be credited to The Agent.</p>

      <p><strong>CLAUSE 4 — COMMISSION STRUCTURE</strong></p>
      <p>4.1. Upon the successful completion of a property sale involving a referred client, The Agent
      shall receive <strong>twenty-five percent (25%)</strong> of the buyer-side commission earned by RE/MAX Inmomás.</p>
      <p>4.2. Example: If the property sale price is €300,000 and the buyer-side commission is 5% (€15,000),
      The Agent's referral fee would be 25% × €15,000 = <strong>€3,750</strong>.</p>
      <p>4.3. Commission payments shall be processed within thirty (30) business days following the
      completion of the sale and receipt of all commissions by RE/MAX Inmomás.</p>
      <p>4.4. Payments shall be made via international bank transfer to the account designated by The Agent.</p>

      <p><strong>CLAUSE 5 — OBLIGATIONS OF THE AGENT</strong></p>
      <p>5.1. The Agent agrees to present RE/MAX Inmomás services honestly and accurately to potential clients.</p>
      <p>5.2. The Agent shall not make any representations, warranties, or commitments on behalf of RE/MAX Inmomás.</p>
      <p>5.3. The Agent shall maintain all required licenses and professional certifications in their jurisdiction.</p>
      <p>5.4. The Agent shall comply with all applicable laws and regulations in their country of operation.</p>

      <p><strong>CLAUSE 6 — OBLIGATIONS OF RE/MAX INMOMÁS</strong></p>
      <p>6.1. RE/MAX Inmomás shall provide professional, transparent, and high-quality service to all referred clients.</p>
      <p>6.2. RE/MAX Inmomás shall keep The Agent informed of the status of referred clients through the platform dashboard.</p>
      <p>6.3. RE/MAX Inmomás shall process commission payments in a timely manner as specified in Clause 4.</p>

      <p><strong>CLAUSE 7 — CONFIDENTIALITY</strong></p>
      <p>Both parties agree to maintain the confidentiality of all client information, transaction details,
      and business practices disclosed during the course of this collaboration. This obligation survives
      the termination of this Agreement.</p>

      <p><strong>CLAUSE 8 — DURATION AND TERMINATION</strong></p>
      <p>8.1. This Agreement shall remain in effect for an initial period of twelve (12) months from the
      date of signature, automatically renewing for successive twelve-month periods unless either party
      provides sixty (60) days' written notice of termination.</p>
      <p>8.2. Termination shall not affect commission rights on referrals made prior to the termination date.</p>
      <p>8.3. Either party may terminate this Agreement immediately in the event of a material breach by the other party.</p>

      <p><strong>CLAUSE 9 — GOVERNING LAW AND JURISDICTION</strong></p>
      <p>This Agreement shall be governed by and construed in accordance with the laws of Spain.
      Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of
      the courts of Alicante, Spain.</p>

      <p style="margin-top: 2rem; text-align: center; color: #6b7280; font-size: 0.8rem;">
        — End of Agreement —<br>
        RE/MAX Inmomás · Alicante, Costa Blanca, Spain
      </p>
    `;
  }

  /* ── Document Upload Section ── */
  function renderUploadSection() {
    const uploadZone = document.getElementById('doc-upload-zone');
    const fileInput  = document.getElementById('doc-file-input');
    const docsList   = document.getElementById('uploaded-docs-list');

    // Style the upload zone
    if (uploadZone) {
      uploadZone.innerHTML = `
        <div style="border: 2px dashed #d1d5db; border-radius: 0.75rem; padding: 2rem; text-align: center; cursor: pointer; transition: border-color 0.2s;"
             onmouseover="this.style.borderColor='#0043ff'" onmouseout="this.style.borderColor='#d1d5db'"
             onclick="document.getElementById('doc-file-input') && document.getElementById('doc-file-input').click()">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📤</div>
          <p style="font-weight: 600; color: #374151; margin: 0 0 0.25rem;">Drop files here or click to upload</p>
          <p style="font-size: 0.8rem; color: #9ca3af; margin: 0;">PDF, JPG, PNG up to 10MB</p>
        </div>
      `;

      // Drag & drop handlers
      uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.querySelector('div').style.borderColor = '#0043ff';
      });
      uploadZone.addEventListener('dragleave', () => {
        uploadZone.querySelector('div').style.borderColor = '#d1d5db';
      });
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.querySelector('div').style.borderColor = '#d1d5db';
        App.utils.showToast('File upload will be available when connected to Firebase Storage.', 'info');
      });
    }

    // File input handler
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        App.utils.showToast('File upload will be available when connected to Firebase Storage.', 'info');
      });
    }

    // Mock uploaded documents
    if (docsList) {
      docsList.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem;">
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
    showClientDetail
  };

})();
