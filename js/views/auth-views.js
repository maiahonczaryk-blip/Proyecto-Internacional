window.App = window.App || {};
App.views = App.views || {};

App.views.auth = {
  initLogin: function() {
    const form = document.getElementById('login-form');

    if (form) {
      // Remove old listeners to avoid duplicates
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const err = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-submit-btn');
        
        err.style.display = 'none';
        const oldText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner"></span>';
        submitBtn.disabled = true;

        try {
          const user = await App.auth.login(email, pass);
          if (user) {
            if (user.status === 'pending') {
              window.location.href = 'index.html#pending';
            } else {
              window.location.href = 'app.html#' + user.role + '/dashboard';
            }
          }
        } catch (error) {
          err.textContent = error.message;
          err.style.display = 'block';
        } finally {
          submitBtn.innerHTML = oldText;
          submitBtn.disabled = false;
        }
      });

      const googleBtn = newForm.querySelector('#login-google-btn') || document.getElementById('login-google-btn');
      if (googleBtn) {
        googleBtn.onclick = async () => {
          const err = document.getElementById('login-error');
          err.style.display = 'none';
          
          try {
            const user = await App.auth.loginWithGoogle();
            if (user) {
              if (user.status === 'pending') {
                window.location.href = 'index.html#pending';
              } else {
                window.location.href = 'app.html#' + user.role + '/dashboard';
              }
            }
          } catch (error) {
            if (error.code === 'USER_NOT_REGISTERED') {
              App.utils.showToast('Google account not registered. Please register first.', 'info');
              window.location.hash = 'register';
              
              setTimeout(() => {
                const regEmail = document.getElementById('register-email');
                const regFirst = document.getElementById('register-firstName');
                const regLast = document.getElementById('register-lastName');
                
                if (regEmail && error.email) regEmail.value = error.email;
                if (regFirst && error.firstName) regFirst.value = error.firstName;
                if (regLast && error.lastName) regLast.value = error.lastName;
              }, 150);
            } else {
              err.textContent = error.message;
              err.style.display = 'block';
            }
          }
        };
      }

      // --- Forgot Password ---
      const forgotToggle = document.getElementById('forgot-pw-toggle');
      const forgotPanel  = document.getElementById('forgot-pw-panel');
      const forgotSend   = document.getElementById('forgot-pw-send');
      const forgotEmail  = document.getElementById('forgot-pw-email');
      const forgotMsg    = document.getElementById('forgot-pw-msg');

      if (forgotToggle && forgotPanel) {
        forgotToggle.addEventListener('click', () => {
          const isOpen = forgotPanel.style.display !== 'none';
          forgotPanel.style.display = isOpen ? 'none' : 'block';
          // Pre-fill with the email already typed in the login field
          if (!isOpen && forgotEmail) {
            const loginEmailVal = document.getElementById('login-email');
            if (loginEmailVal && loginEmailVal.value) forgotEmail.value = loginEmailVal.value;
            forgotEmail.focus();
          }
          if (forgotMsg) { forgotMsg.style.display = 'none'; forgotMsg.textContent = ''; }
        });
      }

      if (forgotSend && forgotEmail && forgotMsg) {
        forgotSend.addEventListener('click', async () => {
          const email = forgotEmail.value.trim();
          if (!email) {
            forgotMsg.style.cssText = 'display:block;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;margin-top:10px;font-size:0.82rem;border-radius:6px;padding:9px 12px;';
            forgotMsg.textContent = 'Please enter your email address.';
            return;
          }

          const oldHTML = forgotSend.innerHTML;
          forgotSend.innerHTML = '<span class="spinner"></span>';
          forgotSend.disabled = true;
          forgotMsg.style.display = 'none';

          try {
            await App.auth.resetPassword(email);
            forgotMsg.style.cssText = 'display:block;background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;margin-top:10px;font-size:0.82rem;border-radius:6px;padding:9px 12px;';
            // Multilingual success message
            const lang = document.body.className.match(/lang-(\S+)/)?.[1] || 'en';
            const msgs = {
              en: '✅ Reset link sent! Check your inbox (and spam folder).',
              es: '✅ ¡Enlace enviado! Revisa tu bandeja de entrada (y la carpeta de spam).',
              fr: '✅ Lien envoyé&nbsp;! Vérifiez votre boîte de réception (et les spams).',
              'en-ca': '✅ Reset link sent! Check your inbox (and spam folder).'
            };
            forgotMsg.innerHTML = msgs[lang] || msgs.en;
            forgotSend.innerHTML = '✓';
          } catch (err) {
            forgotMsg.style.cssText = 'display:block;background:#fef2f2;color:#991b1b;border:1px solid #fecaca;margin-top:10px;font-size:0.82rem;border-radius:6px;padding:9px 12px;';
            // Firebase: user-not-found should not reveal if email exists (security)
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
              forgotMsg.textContent = 'If this email is registered, a reset link has been sent.';
            } else {
              forgotMsg.textContent = err.message || 'Something went wrong. Please try again.';
            }
            forgotSend.innerHTML = oldHTML;
            forgotSend.disabled = false;
          } finally {
            if (!forgotSend.disabled) return;
            // Keep button disabled after success to prevent resends
          }
        });

        // Also trigger on Enter key in the email input
        forgotEmail.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); forgotSend.click(); }
        });
      }
    }
  },

  initProfile: async function() {
    const user = await App.auth.getCurrentUser();
    if (!user) return;

    // View Mode elements
    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const roleBadgeEl = document.getElementById('profile-role-badge');
    const agencyEl = document.getElementById('profile-agency');
    const statusEl = document.getElementById('profile-status');
    const phoneEl = document.getElementById('profile-phone');
    const countryEl = document.getElementById('profile-country');
    const regionsEl = document.getElementById('profile-regions');
    const joinedEl = document.getElementById('profile-joined');
    const brokerEl = document.getElementById('profile-broker');

    // Edit Mode elements
    const editForm = document.getElementById('profile-edit-form');
    const editFirstName = document.getElementById('edit-firstName');
    const editLastName = document.getElementById('edit-lastName');
    const editPhone = document.getElementById('edit-phone');
    const editAgencyName = document.getElementById('edit-agencyName');
    const editCountry = document.getElementById('edit-country');
    const editNationality = document.getElementById('edit-nationality');
    const groupEditNationality = document.getElementById('group-edit-nationality');
    const groupEditMasRegions = document.getElementById('group-edit-mas-regions');
    const editMasRegionsCheckboxes = document.getElementById('edit-mas-regions-checkboxes');
    const editEmail = document.getElementById('edit-email');
    const groupEditEmail = document.getElementById('group-edit-email');

    // Buttons & Toggles
    const btnEdit = document.getElementById('profile-btn-edit');
    const btnCancel = document.getElementById('profile-btn-cancel');
    const btnResetPw = document.getElementById('profile-btn-reset-pw');
    const avatarTrigger = document.getElementById('profile-avatar-trigger');
    const avatarInput = document.getElementById('profile-avatar-input');
    const profileCard = document.querySelector('#view-profile .dashboard-section');

    // 1. Render Avatar
    if (avatarEl) {
      if (user.profileImage) {
        avatarEl.style.backgroundImage = `url(${user.profileImage})`;
        avatarEl.innerHTML = '';
      } else {
        avatarEl.style.backgroundImage = 'none';
        avatarEl.innerHTML = App.utils.getInitials(user.firstName, user.lastName);
      }
    }

    // 2. Populate View Details
    const userNationality = App.utils.getUserNationality ? App.utils.getUserNationality(user) : (user.nationality || user.country || '');
    const userRegions = App.utils.getUserRegions ? App.utils.getUserRegions(user) : [];

    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
    if (emailEl) emailEl.textContent = user.email;
    if (roleBadgeEl) {
      const roleMap = {
        admin:         { html: '🛡️ <span class="lang-en">Administrator</span><span class="lang-es">Administrador</span>', cls: 'badge badge--admin' },
        embajador:     { html: '👑 <span class="lang-en">Ambassador</span><span class="lang-es">Embajador</span>', cls: 'badge badge--embajador' },
        broker:        { html: '🏢 Broker', cls: 'badge badge--broker' },
        realtor:       { html: '🏠 Realtor', cls: 'badge badge--realtor' },
        agent_inmomas: { html: '🇪🇸 <span class="lang-en">RE/MAX Inmomás Agent</span><span class="lang-es">Agente RE/MAX Inmomás</span>', cls: 'badge badge--agent' },
        colaborador:   { html: '🤝 <span class="lang-en">Collaborator</span><span class="lang-es">Colaborador</span>', cls: 'badge badge--agent' },
        partner:       { html: '🤝 Partner', cls: 'badge badge--blue' }
      };
      const rCfg = roleMap[user.role] || { html: App.utils.escapeHtml((user.role || '').replace('_', ' ')), cls: 'badge badge--blue' };
      roleBadgeEl.className = rCfg.cls;
      roleBadgeEl.innerHTML = rCfg.html;
    }
    if (agencyEl) agencyEl.textContent = user.agencyName || (user.role === 'agent_inmomas' ? 'RE/MAX Inmomás' : '—');
    if (statusEl) statusEl.innerHTML = App.utils.getUserStatusBadge(user.status);
    if (phoneEl) phoneEl.textContent = user.phone || '—';
    if (countryEl) {
      if (user.role === 'agent_inmomas' && userNationality) {
        countryEl.textContent = `${userNationality}${user.country && user.country !== userNationality ? ' · ' + user.country : ''}`;
      } else {
        countryEl.textContent = user.country || userNationality || '—';
      }
    }
    if (regionsEl && App.utils.getUserRegionBadgesHtml) {
      regionsEl.innerHTML = App.utils.getUserRegionBadgesHtml(user);
    }
    if (joinedEl) joinedEl.textContent = App.utils.formatDate(user.createdAt);

    // Populate Broker Name only for roles that can report to a Broker (Realtors / Colaboradores)
    let resolvedParentBroker = null;
    const brokerGroupEl = document.getElementById('profile-broker-group') || (brokerEl ? brokerEl.parentElement : null);
    if (brokerGroupEl && ['embajador', 'broker', 'admin', 'agent_inmomas', 'partner'].includes(user.role)) {
      brokerGroupEl.style.display = 'none';
    } else if (brokerEl) {
      if (brokerGroupEl) brokerGroupEl.style.display = '';
      if (user.role === 'realtor' && App.referralBranding && typeof App.referralBranding.resolveParentBrokerForRealtor === 'function') {
        resolvedParentBroker = await App.referralBranding.resolveParentBrokerForRealtor(user);
      } else if (user.brokerId) {
        try {
          resolvedParentBroker = await App.auth.getUser(user.brokerId);
        } catch (_) {}
      }
      if (resolvedParentBroker && (resolvedParentBroker.firstName || resolvedParentBroker.lastName || resolvedParentBroker.agencyName)) {
        const bFullName = `${resolvedParentBroker.firstName || ''} ${resolvedParentBroker.lastName || ''}`.trim();
        brokerEl.textContent = bFullName || resolvedParentBroker.agencyName || '—';
        if (user.role === 'realtor' && resolvedParentBroker.agencyName && agencyEl) {
          agencyEl.textContent = resolvedParentBroker.agencyName;
        }
      } else {
        brokerEl.innerHTML = '<span class="lang-en">None / Independent</span><span class="lang-es">Independiente</span>';
      }
    }

    // 3. Populate Edit Form Inputs
    if (editFirstName) editFirstName.value = user.firstName || '';
    if (editLastName) editLastName.value = user.lastName || '';
    if (editPhone) editPhone.value = user.phone || '';
    if (editAgencyName) {
      const lockedToBroker = Boolean(user.role === 'realtor' && (user.brokerId || resolvedParentBroker));
      const brokerAgencyVal = resolvedParentBroker && resolvedParentBroker.agencyName ? resolvedParentBroker.agencyName : '';
      editAgencyName.value = lockedToBroker
        ? (brokerAgencyVal || user.agencyName || '')
        : (user.agencyName || (user.role === 'agent_inmomas' ? 'RE/MAX Inmomás' : ''));
      editAgencyName.readOnly = lockedToBroker;
      editAgencyName.style.backgroundColor = lockedToBroker ? '#f1f5f9' : '';
      editAgencyName.style.cursor = lockedToBroker ? 'not-allowed' : '';
      editAgencyName.title = lockedToBroker ? 'Gestionado por tu Broker / Managed by your Broker' : '';
    }
    if (editCountry) {
      if (editCountry.tagName === 'SELECT' && App.utils.getCountryOptionsHtml) {
        editCountry.innerHTML = App.utils.getCountryOptionsHtml(user.country || userNationality || 'United States', true, '— Seleccionar País —');
      } else {
        editCountry.value = user.country || '';
      }
    }
    if (groupEditNationality && editNationality) {
      const showNat = ['agent_inmomas', 'embajador', 'admin'].includes(user.role);
      groupEditNationality.style.display = showNat ? 'block' : 'none';
      if (editNationality.tagName === 'SELECT' && App.utils.getCountryOptionsHtml) {
        editNationality.innerHTML = App.utils.getCountryOptionsHtml(userNationality || user.country || '', true, '— Seleccionar Nacionalidad / País —');
      } else {
        editNationality.value = userNationality || '';
      }
    }
    if (groupEditMasRegions && editMasRegionsCheckboxes && App.utils.getRegionsCheckboxesHtml) {
      const canMultiRegion = ['agent_inmomas', 'embajador', 'admin'].includes(user.role);
      groupEditMasRegions.style.display = canMultiRegion ? 'block' : 'none';
      editMasRegionsCheckboxes.innerHTML = App.utils.getRegionsCheckboxesHtml('profile-edit-region', userRegions);
    }
    
    // Only show email edit for partners
    if (groupEditEmail) {
      if (user.role === 'partner') {
        groupEditEmail.style.display = 'block';
        if (editEmail) editEmail.value = user.email || '';
      } else {
        groupEditEmail.style.display = 'none';
      }
    }

    // 4. Set up View/Edit Mode Toggle Listeners
    if (btnEdit && profileCard) {
      btnEdit.onclick = () => profileCard.classList.add('editing');
    }
    if (btnCancel && profileCard) {
      btnCancel.onclick = () => {
        profileCard.classList.remove('editing');
        // Reset inputs to original user state
        if (editFirstName) editFirstName.value = user.firstName || '';
        if (editLastName) editLastName.value = user.lastName || '';
        if (editPhone) editPhone.value = user.phone || '';
        if (editAgencyName) editAgencyName.value = user.agencyName || '';
        if (editCountry) editCountry.value = user.country || '';
        if (editEmail && user.role === 'partner') editEmail.value = user.email || '';
      };
    }

    // 5. Set up Edit Form Save Submission
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const canMultiRegion = ['agent_inmomas', 'embajador', 'admin'].includes(user.role);
        let selectedRegions = [];
        if (canMultiRegion && editMasRegionsCheckboxes) {
          selectedRegions = Array.from(editMasRegionsCheckboxes.querySelectorAll('input[name="profile-edit-region"]:checked')).map(cb => cb.value);
        }
        const newNat = (canMultiRegion && editNationality) ? editNationality.value : editCountry.value;
        if (selectedRegions.length === 0 && App.utils.resolveRegionFromCountry) {
          const inferred = App.utils.resolveRegionFromCountry(newNat || editCountry.value || '');
          if (inferred) selectedRegions = [inferred];
        }

        const data = {
          firstName: editFirstName.value,
          lastName: editLastName.value,
          phone: editPhone.value,
          agencyName: editAgencyName.value,
          country: editCountry.value,
          nationality: newNat,
          region: selectedRegions[0] || '',
          regions: selectedRegions
        };

        const saveBtn = document.getElementById('profile-btn-save');
        const oldText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span>';

        try {
          // If partner changed email, update auth email first
          if (user.role === 'partner' && editEmail && editEmail.value && editEmail.value !== user.email) {
            await App.auth.updateAuthEmail(editEmail.value);
            // email El in view will be updated in next initProfile
          }

          await App.auth.updateProfile(data);
          App.utils.showToast('Profile updated successfully! 🎉', 'success');
          profileCard.classList.remove('editing');
          
          // Re-render sidebar/header names dynamically
          const sidebarName = document.getElementById('sidebar-user-name');
          const sidebarAvatar = document.getElementById('sidebar-user-avatar');
          if (sidebarName) sidebarName.textContent = `${data.firstName} ${data.lastName}`;
          if (sidebarAvatar) sidebarAvatar.innerHTML = App.utils.getInitials(data.firstName, data.lastName);
          
          // Reload profile view
          App.views.auth.initProfile();
        } catch (err) {
          App.utils.showToast(err.message, 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = oldText;
        }
      };
    }

    // 6. Set up Avatar Photo Upload Simulation
    if (avatarTrigger && avatarInput) {
      avatarTrigger.onclick = () => avatarInput.click();
      avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
          App.utils.showToast('Avatar image must be under 1MB.', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result;
            await App.auth.updateProfile({
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              agencyName: user.agencyName,
              country: user.country,
              profileImage: base64
            });
            App.utils.showToast('Avatar updated successfully! 🎉', 'success');
            
            // Re-render sidebar/header avatars dynamically
            const sidebarAvatar = document.getElementById('sidebar-user-avatar');
            if (sidebarAvatar) {
              sidebarAvatar.innerHTML = '';
              sidebarAvatar.style.backgroundImage = `url(${base64})`;
              sidebarAvatar.style.backgroundSize = 'cover';
              sidebarAvatar.style.backgroundPosition = 'center';
            }

            App.views.auth.initProfile();
          } catch (err) {
            App.utils.showToast(err.message, 'error');
          }
        };
        reader.readAsDataURL(file);
      };
    }

    // 7. Password Reset
    if (btnResetPw) {
      btnResetPw.onclick = async () => {
        try {
          await App.auth.resetPassword(user.email);
          App.utils.showToast('Password reset link sent to your email! ✉️', 'success');
        } catch (err) {
          App.utils.showToast(err.message, 'error');
        }
      };
    }

    // 7a. Personalized Referral Link Logo & Brand (Brokers, Realtors, Colaboradores, Embajadores, Partners)
    const brandingSection = document.getElementById('profile-referral-branding-section');
    if (brandingSection) {
      const canUseBranding = App.referralBranding && App.referralBranding.canUse(user);
      brandingSection.style.display = canUseBranding ? 'block' : 'none';
      if (canUseBranding) {
        App.referralBranding.renderEditor(brandingSection, user, { compact: false });
        if (brandingSection._profileAgencyCleanup) brandingSection._profileAgencyCleanup();
        const syncProfileAgencyText = (ev) => {
          const d = ev && ev.detail;
          if (!d || d.userId !== user.id) return;
          if (agencyEl) agencyEl.textContent = d.agencyName || '—';
          if (editAgencyName) editAgencyName.value = d.agencyName || '';
        };
        window.addEventListener('agencyBrandingUpdated', syncProfileAgencyText);
        brandingSection._profileAgencyCleanup = () => window.removeEventListener('agencyBrandingUpdated', syncProfileAgencyText);
      }
    }

    // 7b. Marketing Lab Quick Card on Profile (centralized in #<role>/marketing)
    const guideSection = document.getElementById('profile-buyer-guide-section');
    if (guideSection) {
      const canUseGuide = App.buyerGuide && App.buyerGuide.canUse(user);
      guideSection.style.display = canUseGuide ? 'block' : 'none';
      if (canUseGuide && App.marketingLab) {
        App.marketingLab.renderQuickCard(guideSection, user, { route: `${user.role}/marketing` });
      }
    }

    // 8. Calculate and Display Dynamic Statistics
    const statsSection = document.getElementById('profile-stats-section');
    const statsContainer = document.getElementById('profile-stats-container');

    if (statsSection && statsContainer) {
      statsContainer.innerHTML = '';
      let statsHTML = '';

      try {
        if (user.role === 'realtor') {
          const clients = await App.auth.getClients({ referredBy: user.id });
          const commissions = await App.auth.getCommissions({ realtorId: user.id });
          
          const activeDeals = clients.filter(c => c.status !== 'closed' && c.status !== 'rejected').length;
          const closedDeals = clients.filter(c => c.status === 'closed').length;
          
          const projectedComm = commissions
            .filter(c => c.status === 'projected')
            .reduce((sum, c) => sum + (c.realtorAmount || 0), 0);
          
          const paidComm = commissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + (c.realtorAmount || 0), 0);

          statsHTML = `
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(0, 67, 255, 0.08); color: var(--blue);">👥</div>
              <div>
                <div class="profile-stat-value">${clients.length}</div>
                <div class="profile-stat-label"><span class="lang-en">Total Referred</span><span class="lang-es">Total Referidos</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeDeals}</div>
                <div class="profile-stat-label"><span class="lang-en">Active Pipelines</span><span class="lang-es">Pipelines Activos</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">${closedDeals}</div>
                <div class="profile-stat-label"><span class="lang-en">Closed Sales</span><span class="lang-es">Ventas Cerradas</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${projectedComm.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Projected Comm.</span><span class="lang-es">Com. Proyectada</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">💵</div>
              <div>
                <div class="profile-stat-value">€${paidComm.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Paid Commission</span><span class="lang-es">Comisión Cobrada</span></div>
              </div>
            </div>
          `;
        } else if (user.role === 'embajador') {
          const umb = await App.auth.getUmbrellaData(user.id);
          const activeClients = (umb.clients || []).filter(c => c.status !== 'closed' && c.status !== 'rejected').length;
          const totalVolume = (umb.commissions || []).reduce((sum, c) => sum + (c.salePrice || 0), 0);

          statsHTML = `
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(245, 158, 11, 0.14); color: #b45309;">👑</div>
              <div>
                <div class="profile-stat-value">${(umb.users || []).length}</div>
                <div class="profile-stat-label"><span class="lang-en">Umbrella Network</span><span class="lang-es">Red Paraguas</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(0, 67, 255, 0.08); color: var(--blue);">🏢</div>
              <div>
                <div class="profile-stat-value">${(umb.brokers || []).length} / ${(umb.realtors || []).length}</div>
                <div class="profile-stat-label"><span class="lang-en">Brokers / Agents</span><span class="lang-es">Brokers / Agentes</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeClients}</div>
                <div class="profile-stat-label"><span class="lang-en">Active Clients</span><span class="lang-es">Clientes Activos</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">€${totalVolume.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Umbrella Volume</span><span class="lang-es">Volumen Paraguas</span></div>
              </div>
            </div>
          `;
        } else if (user.role === 'broker') {
          const team = await App.auth.getAllUsers({ brokerId: user.id });
          const clients = await App.auth.getClients({ brokerId: user.id });
          const commissions = await App.auth.getCommissions({ brokerId: user.id });

          const activeClients = clients.filter(c => c.status !== 'closed' && c.status !== 'rejected').length;
          
          const brokerComm = commissions
            .filter(c => c.status === 'paid' || c.status === 'pending_payment')
            .reduce((sum, c) => sum + (c.brokerAmount || 0), 0);

          const totalVolume = commissions
            .reduce((sum, c) => sum + (c.salePrice || 0), 0);

          statsHTML = `
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(0, 67, 255, 0.08); color: var(--blue);">👥</div>
              <div>
                <div class="profile-stat-value">${team.length}</div>
                <div class="profile-stat-label"><span class="lang-en">Team Members</span><span class="lang-es">Miembros Equipo</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeClients}</div>
                <div class="profile-stat-label"><span class="lang-en">Active Referrals</span><span class="lang-es">Referidos Activos</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">€${totalVolume.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Total Volume</span><span class="lang-es">Volumen Total</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${brokerComm.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Broker Commission</span><span class="lang-es">Comisión Broker</span></div>
              </div>
            </div>
          `;
        } else if (user.role === 'agent_inmomas' || user.role === 'colaborador') {
          const isColab = user.role === 'colaborador';
          const clientFilter = isColab ? { referredBy: user.id } : { localAgentId: user.id };
          const clients = await App.auth.getClients(clientFilter);
          const commissions = await App.auth.getCommissions(isColab ? { realtorId: user.id } : { agentId: user.id });

          const activeClients = clients.filter(c => c.status !== 'closed' && c.status !== 'rejected').length;
          const closedClients = clients.filter(c => c.status === 'closed').length;

          const getStatAmt = (c) => isColab ? (c.realtorAmount || 0) : (c.agentAmount || 0);
          const totalProjected = commissions
            .filter(c => c.status === 'projected' || c.status === 'pending_payment')
            .reduce((sum, c) => sum + getStatAmt(c), 0);

          const totalPaid = commissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + getStatAmt(c), 0);

          statsHTML = `
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(0, 67, 255, 0.08); color: var(--blue);">👥</div>
              <div>
                <div class="profile-stat-value">${clients.length}</div>
                <div class="profile-stat-label"><span class="lang-en">Assigned Clients</span><span class="lang-es">Clientes Asignados</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeClients}</div>
                <div class="profile-stat-label"><span class="lang-en">Active Negotiations</span><span class="lang-es">Negociaciones Activas</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">${closedClients}</div>
                <div class="profile-stat-label"><span class="lang-en">Closed Deals</span><span class="lang-es">Ventas Cerradas</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${totalProjected.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Projected Comm.</span><span class="lang-es">Com. Proyectada</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">💵</div>
              <div>
                <div class="profile-stat-value">€${totalPaid.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Paid Comm.</span><span class="lang-es">Comisión Cobrada</span></div>
              </div>
            </div>
          `;
        } else if (user.role === 'admin') {
          const users = await App.auth.getAllUsers();
          const clients = await App.auth.getClients();
          const commissions = await App.auth.getCommissions();

          const totalVolume = commissions.reduce((sum, c) => sum + (c.salePrice || 0), 0);
          const closedSales = clients.filter(c => c.status === 'closed').length;

          statsHTML = `
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(0, 67, 255, 0.08); color: var(--blue);">👥</div>
              <div>
                <div class="profile-stat-value">${users.length}</div>
                <div class="profile-stat-label"><span class="lang-en">Total Users</span><span class="lang-es">Usuarios Totales</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${clients.length}</div>
                <div class="profile-stat-label"><span class="lang-en">Total Clients</span><span class="lang-es">Clientes Totales</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">${closedSales}</div>
                <div class="profile-stat-label"><span class="lang-en">Closed Sales</span><span class="lang-es">Ventas Cerradas</span></div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${totalVolume.toLocaleString()}</div>
                <div class="profile-stat-label"><span class="lang-en">Platform Volume</span><span class="lang-es">Volumen Plataforma</span></div>
              </div>
            </div>
          `;
        }

        if (statsHTML) {
          statsContainer.innerHTML = statsHTML;
          statsSection.style.display = 'block';
        }
      } catch (err) {
        console.error('[Profile] Error calculating statistics:', err);
      }
    }
  },

  initRegister: function(params) {
    const form = document.getElementById('register-form');
    
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      // Populate brokers
      const brokerSelect = newForm.querySelector('#register-broker');
      if (brokerSelect) {
        const populateBrokerSelect = (brokersList) => {
          const currentVal = brokerSelect.value;
          brokerSelect.innerHTML = '<option value="">Acuerdo Directo con Agente (15%) / Sin Broker</option>';
          brokersList.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = `${b.firstName} ${b.lastName} - ${b.agencyName || 'Brokerage (25%)'}`;
            brokerSelect.appendChild(opt);
          });
          const otherOpt = document.createElement('option');
          otherOpt.value = 'other';
          otherOpt.textContent = 'Otro Broker / Agencia (introducir manualmente — 25%)';
          brokerSelect.appendChild(otherOpt);
          if (currentVal) brokerSelect.value = currentVal;
        };

        const initialBrokers = (App.demoData && App.demoData.users ? App.demoData.users : []).filter(u => u.role === 'broker' && u.status === 'active');
        populateBrokerSelect(initialBrokers);
        if (App.auth && typeof App.auth.getAllUsers === 'function') {
          App.auth.getAllUsers({ role: 'broker' }).then(list => {
            const activeBrokers = (list || []).filter(u => u.role === 'broker' && u.status === 'active');
            if (activeBrokers.length > 0) populateBrokerSelect(activeBrokers);
          }).catch(() => {});
        }

        // Show/hide manual fields when 'other' is selected
        const brokerManualGroup = newForm.querySelector('#broker-manual-group');
        const agencyManualGroup = newForm.querySelector('#agency-manual-group');
        brokerSelect.addEventListener('change', () => {
          const isOther = brokerSelect.value === 'other';
          if (brokerManualGroup) brokerManualGroup.style.display = isOther ? 'block' : 'none';
          if (agencyManualGroup) agencyManualGroup.style.display = isOther ? 'block' : 'none';
        });
      }
      
      // Toggle fields based on role (public registration only allows Broker or Realtor)
      const roleRadios = newForm.querySelectorAll('input[name="register-role"]');
      const brokerSelectGroup = newForm.querySelector('#broker-select-group');
      const agencyNameInput = newForm.querySelector('#register-agencyName');
      const agencyNameGroup = agencyNameInput ? agencyNameInput.parentNode : null;
      const inmomasAgentGroup = newForm.querySelector('#register-inmomas-agent-group');

      // Initial state
      if (brokerSelectGroup) brokerSelectGroup.style.display = 'block';
      if (agencyNameGroup) agencyNameGroup.style.display = 'none';
      
      roleRadios.forEach(r => {
        r.addEventListener('change', (e) => {
          const roleVal = e.target.value;
          if (roleVal === 'broker') {
            if (brokerSelectGroup) brokerSelectGroup.style.display = 'none';
            if (agencyNameGroup) agencyNameGroup.style.display = 'block';
            if (inmomasAgentGroup) inmomasAgentGroup.style.display = 'block';
          } else {
            if (brokerSelectGroup) brokerSelectGroup.style.display = 'block';
            if (agencyNameGroup) agencyNameGroup.style.display = 'none';
            if (inmomasAgentGroup) inmomasAgentGroup.style.display = 'block';
          }
        });
      });
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const termsChecked = newForm.querySelector('#register-terms').checked;
        if (!termsChecked) return alert('Debes aceptar los Términos y Condiciones para continuar. / Please agree to the Terms & Conditions.');

        const rawRole = newForm.querySelector('input[name="register-role"]:checked').value;
        const selectedRole = rawRole === 'broker' ? 'broker' : 'realtor';
        const countryVal = newForm.querySelector('#register-country').value;
        let selectedRegions = [];
        if (App.utils && App.utils.resolveRegionFromCountry) {
          const autoReg = App.utils.resolveRegionFromCountry(countryVal);
          if (autoReg) selectedRegions = [autoReg];
        }

        const brokerId = brokerSelect ? brokerSelect.value : '';
        const isManualBroker = brokerId === 'other';
        const refCode = sessionStorage.getItem('referralCode') || null;
        const inmomasAgent = (newForm.querySelector('#register-inmomas-agent')?.value || '').trim();
        const data = {
          role: selectedRole,
          firstName: newForm.querySelector('#register-firstName').value,
          lastName: newForm.querySelector('#register-lastName').value,
          email: newForm.querySelector('#register-email').value,
          phone: newForm.querySelector('#register-phone').value,
          password: newForm.querySelector('#register-password').value,
          country: countryVal,
          nationality: countryVal,
          region: selectedRegions[0] || '',
          regions: selectedRegions,
          agencyName: isManualBroker
            ? (newForm.querySelector('#register-agency-manual')?.value || '')
            : (agencyNameInput ? agencyNameInput.value : ''),
          brokerId: isManualBroker ? '' : brokerId,
          brokerNameManual: isManualBroker ? (newForm.querySelector('#register-broker-manual')?.value || '') : '',
          inmomasAgentName: inmomasAgent || null,
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
          newsletterConsent: newForm.querySelector('#register-newsletter')?.checked || false,
          referredBy: refCode || (inmomasAgent || null),
          source: (refCode || inmomasAgent) ? 'referral' : 'direct',
        };
        
        try {
          const res = await App.auth.register(data);
          if (res && res.success) {
            // New users are always 'pending' — show the waiting screen
            App.utils.showToast('¡Registro exitoso! Tu solicitud está siendo revisada. 🎉', 'success');
            window.location.href = 'index.html#pending';
          }
        } catch (err) {
          alert(err.message);
        }
      });

      const googleRegBtn = newForm.querySelector('#register-google-btn') || document.getElementById('register-google-btn');
      if (googleRegBtn) {
        googleRegBtn.onclick = async () => {
          const termsChecked = newForm.querySelector('#register-terms').checked;
          if (!termsChecked) {
            App.utils.showToast('Debes aceptar los Términos y Condiciones para continuar. / Please agree to the Terms & Conditions.', 'error');
            return;
          }

          const roleRadio = newForm.querySelector('input[name="register-role"]:checked');
          if (!roleRadio) {
            App.utils.showToast('Please select a role (Broker or Realtor).', 'error');
            return;
          }

          const safeGoogleRole = roleRadio.value === 'broker' ? 'broker' : 'realtor';
          const firstName = newForm.querySelector('#register-firstName').value;
          const lastName = newForm.querySelector('#register-lastName').value;
          const refCode = sessionStorage.getItem('referralCode') || null;
          const inmomasAgent = (newForm.querySelector('#register-inmomas-agent')?.value || '').trim();

          const countryVal = newForm.querySelector('#register-country').value;
          let selectedRegions = [];
          if (App.utils && App.utils.resolveRegionFromCountry) {
            const autoReg = App.utils.resolveRegionFromCountry(countryVal);
            if (autoReg) selectedRegions = [autoReg];
          }

          const data = {
            role: safeGoogleRole,
            firstName,
            lastName,
            phone: newForm.querySelector('#register-phone').value,
            country: countryVal,
            nationality: countryVal,
            region: selectedRegions[0] || '',
            regions: selectedRegions,
            agencyName: agencyNameInput ? agencyNameInput.value : '',
            brokerId: brokerSelect ? brokerSelect.value : '',
            inmomasAgentName: inmomasAgent || null,
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
            newsletterConsent: newForm.querySelector('#register-newsletter')?.checked || false,
            referredBy: refCode || (inmomasAgent || null),
            source: (refCode || inmomasAgent) ? 'referral' : 'direct',
          };

          try {
            const res = await App.auth.registerWithGoogle(data);
            if (res && res.success) {
              App.utils.showToast('¡Registro exitoso! Tu solicitud está siendo revisada. 🎉', 'success');
              window.location.href = 'index.html#pending';
            }
          } catch (err) {
            App.utils.showToast(err.message, 'error');
          }
        };
      }
    }
  },

  /* ---- Pending View ---- */
  initPending: async function() {
    const session = App.auth.getCurrentUser();
    if (!session) {
      window.location.href = 'index.html#login';
      return;
    }

    // Refresh user data from Firebase/demoData to get latest status/agreementStatus
    let currentUser = { ...session };
    try {
      if (!App.demoMode && App.db) {
        const doc = await App.db.collection('users').doc(session.id).get();
        if (doc.exists) {
          currentUser = { id: session.id, ...doc.data() };
        }
      } else {
        const demoUser = App.demoData.users.find(u => u.id === session.id);
        if (demoUser) {
          currentUser = { id: session.id, ...demoUser };
        }
      }
    } catch (e) {
      console.warn('[Pending] failed to fetch fresh user data:', e);
    }

    // Bind Check Status button
    const checkBtn = document.getElementById('pending-check-btn');
    const logoutBtn = document.getElementById('pending-logout-btn');

    if (checkBtn) {
      checkBtn.addEventListener('click', async () => {
        const oldHTML = checkBtn.innerHTML;
        checkBtn.innerHTML = '<span class="spinner"></span>';
        checkBtn.disabled = true;

        try {
          let freshStatus = 'pending';
          if (!App.demoMode && App.db) {
            const doc = await App.db.collection('users').doc(currentUser.id).get();
            if (doc.exists) freshStatus = doc.data().status;
          } else {
            const demoUser = App.demoData.users.find(u => u.id === currentUser.id);
            if (demoUser) freshStatus = demoUser.status;
          }

          if (freshStatus === 'active') {
            // Update localStorage session
            const updatedSession = { ...currentUser, status: 'active' };
            localStorage.setItem('remax_session', JSON.stringify(updatedSession));
            App.utils.showToast('¡Tu cuenta ha sido aprobada! Redirigiendo…', 'success');
            setTimeout(() => {
              window.location.href = 'app.html#' + currentUser.role + '/dashboard';
            }, 800);
          } else if (freshStatus === 'rejected') {
            App.utils.showToast('Tu solicitud fue rechazada. Contacta con soporte.', 'error');
          } else {
            App.utils.showToast('Tu solicitud sigue en revisión. Te notificaremos por email.', 'info');
            checkBtn.innerHTML = oldHTML;
            checkBtn.disabled = false;
          }
        } catch (err) {
          console.error('[Pending] checkStatus error:', err);
          App.utils.showToast('Error al verificar el estado. Intenta de nuevo.', 'error');
          checkBtn.innerHTML = oldHTML;
          checkBtn.disabled = false;
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await App.auth.logout();
        window.location.href = 'index.html#login';
      });
    }

    function renderPendingAgreementSection(user) {
      const container = document.getElementById('pending-agreement-container');
      if (!container) return;

      if (App.utils && typeof App.utils.renderContractDataSection === 'function') {
        App.utils.renderContractDataSection(container, user, 'pending-contract', () => {
          App.views.auth.initPending();
        });
      }
    }

    renderPendingAgreementSection(currentUser);
  }
};
