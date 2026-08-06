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
    const joinedEl = document.getElementById('profile-joined');
    const brokerEl = document.getElementById('profile-broker');

    // Edit Mode elements
    const editForm = document.getElementById('profile-edit-form');
    const editFirstName = document.getElementById('edit-firstName');
    const editLastName = document.getElementById('edit-lastName');
    const editPhone = document.getElementById('edit-phone');
    const editAgencyName = document.getElementById('edit-agencyName');
    const editCountry = document.getElementById('edit-country');

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
    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
    if (emailEl) emailEl.textContent = user.email;
    if (roleBadgeEl) roleBadgeEl.textContent = user.role.replace('_', ' ');
    if (agencyEl) agencyEl.textContent = user.agencyName || '—';
    if (statusEl) statusEl.innerHTML = App.utils.getUserStatusBadge(user.status);
    if (phoneEl) phoneEl.textContent = user.phone || '—';
    if (countryEl) countryEl.textContent = user.country || '—';
    if (joinedEl) joinedEl.textContent = App.utils.formatDate(user.createdAt);

    // Populate Broker Name if applicable
    if (brokerEl) {
      if (user.brokerId) {
        try {
          const broker = await App.auth.getUser(user.brokerId);
          brokerEl.textContent = broker ? `${broker.firstName} ${broker.lastName}` : '—';
        } catch (e) {
          brokerEl.textContent = '—';
        }
      } else {
        brokerEl.textContent = 'None / Independent';
      }
    }

    // 3. Populate Edit Form Inputs
    if (editFirstName) editFirstName.value = user.firstName || '';
    if (editLastName) editLastName.value = user.lastName || '';
    if (editPhone) editPhone.value = user.phone || '';
    if (editAgencyName) editAgencyName.value = user.agencyName || '';
    if (editCountry) editCountry.value = user.country || '';

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
      };
    }

    // 5. Set up Edit Form Save Submission
    if (editForm) {
      editForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = {
          firstName: editFirstName.value,
          lastName: editLastName.value,
          phone: editPhone.value,
          agencyName: editAgencyName.value,
          country: editCountry.value
        };

        const saveBtn = document.getElementById('profile-btn-save');
        const oldText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span>';

        try {
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
                <div class="profile-stat-label">Total Referred</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeDeals}</div>
                <div class="profile-stat-label">Active Pipelines</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">${closedDeals}</div>
                <div class="profile-stat-label">Closed Sales</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${projectedComm.toLocaleString()}</div>
                <div class="profile-stat-label">Projected Comm.</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">💵</div>
              <div>
                <div class="profile-stat-value">€${paidComm.toLocaleString()}</div>
                <div class="profile-stat-label">Paid Commission</div>
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
                <div class="profile-stat-label">Team Members</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeClients}</div>
                <div class="profile-stat-label">Active Referrals</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">€${totalVolume.toLocaleString()}</div>
                <div class="profile-stat-label">Total Volume</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${brokerComm.toLocaleString()}</div>
                <div class="profile-stat-label">Broker Commission</div>
              </div>
            </div>
          `;
        } else if (user.role === 'agent_inmomas') {
          const clients = await App.auth.getClients({ localAgentId: user.id });
          const commissions = await App.auth.getCommissions({ agentId: user.id });

          const activeClients = clients.filter(c => c.status !== 'closed' && c.status !== 'rejected').length;
          const closedClients = clients.filter(c => c.status === 'closed').length;

          const totalProjected = commissions
            .filter(c => c.status === 'projected')
            .reduce((sum, c) => sum + (c.agentAmount || 0), 0);

          const totalPaid = commissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + (c.agentAmount || 0), 0);

          statsHTML = `
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(0, 67, 255, 0.08); color: var(--blue);">👥</div>
              <div>
                <div class="profile-stat-value">${clients.length}</div>
                <div class="profile-stat-label">Assigned Clients</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${activeClients}</div>
                <div class="profile-stat-label">Active Negotiations</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">${closedClients}</div>
                <div class="profile-stat-label">Closed Deals</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${totalProjected.toLocaleString()}</div>
                <div class="profile-stat-label">Projected Comm.</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">💵</div>
              <div>
                <div class="profile-stat-value">€${totalPaid.toLocaleString()}</div>
                <div class="profile-stat-label">Paid Comm.</div>
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
                <div class="profile-stat-label">Total Users</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(253, 224, 71, 0.15); color: #a16207;">⚡</div>
              <div>
                <div class="profile-stat-value">${clients.length}</div>
                <div class="profile-stat-label">Total Clients</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(34, 197, 94, 0.08); color: #15803d;">🏠</div>
              <div>
                <div class="profile-stat-value">${closedSales}</div>
                <div class="profile-stat-label">Closed Sales</div>
              </div>
            </div>
            <div class="profile-stat-card">
              <div class="profile-stat-icon" style="background: rgba(147, 51, 234, 0.08); color: #7e22ce;">💰</div>
              <div>
                <div class="profile-stat-value">€${totalVolume.toLocaleString()}</div>
                <div class="profile-stat-label">Platform Volume</div>
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
        brokerSelect.innerHTML = '<option value="">Independent / No broker</option>';
        const brokers = App.demoData.users.filter(u => u.role === 'broker' && u.status === 'active');
        brokers.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = `${b.firstName} ${b.lastName} - ${b.agencyName || 'Independent'}`;
          brokerSelect.appendChild(opt);
        });
        // Add 'Other' option at the end
        const otherOpt = document.createElement('option');
        otherOpt.value = 'other';
        otherOpt.textContent = 'Otro / Other (enter manually)';
        brokerSelect.appendChild(otherOpt);

        // Show/hide manual fields when 'other' is selected
        const brokerManualGroup = newForm.querySelector('#broker-manual-group');
        const agencyManualGroup = newForm.querySelector('#agency-manual-group');
        brokerSelect.addEventListener('change', () => {
          const isOther = brokerSelect.value === 'other';
          if (brokerManualGroup) brokerManualGroup.style.display = isOther ? 'block' : 'none';
          if (agencyManualGroup) agencyManualGroup.style.display = isOther ? 'block' : 'none';
        });
      }
      
      // Toggle fields based on role
      const roleRadios = newForm.querySelectorAll('input[name="register-role"]');
      const brokerSelectGroup = newForm.querySelector('#broker-select-group');
      const agencyNameInput = newForm.querySelector('#register-agencyName');
      const agencyNameGroup = agencyNameInput ? agencyNameInput.parentNode : null;
      
      // Initial state
      if (brokerSelectGroup) brokerSelectGroup.style.display = 'block';
      if (agencyNameGroup) agencyNameGroup.style.display = 'none';
      
      roleRadios.forEach(r => {
        r.addEventListener('change', (e) => {
          if (e.target.value === 'broker') {
            if (brokerSelectGroup) brokerSelectGroup.style.display = 'none';
            if (agencyNameGroup) agencyNameGroup.style.display = 'block';
          } else {
            if (brokerSelectGroup) brokerSelectGroup.style.display = 'block';
            if (agencyNameGroup) agencyNameGroup.style.display = 'none';
          }
        });
      });
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const termsChecked = newForm.querySelector('#register-terms').checked;
        if (!termsChecked) return alert('Please agree to the terms.');

        const brokerId = brokerSelect ? brokerSelect.value : '';
        const isManualBroker = brokerId === 'other';
        const data = {
          role: newForm.querySelector('input[name="register-role"]:checked').value,
          firstName: newForm.querySelector('#register-firstName').value,
          lastName: newForm.querySelector('#register-lastName').value,
          email: newForm.querySelector('#register-email').value,
          phone: newForm.querySelector('#register-phone').value,
          password: newForm.querySelector('#register-password').value,
          country: newForm.querySelector('#register-country').value,
          agencyName: isManualBroker
            ? (newForm.querySelector('#register-agency-manual')?.value || '')
            : (agencyNameInput ? agencyNameInput.value : ''),
          brokerId: isManualBroker ? '' : brokerId,
          brokerNameManual: isManualBroker ? (newForm.querySelector('#register-broker-manual')?.value || '') : '',
          newsletterConsent: newForm.querySelector('#register-newsletter')?.checked || false,
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
            App.utils.showToast('Please agree to the terms.', 'error');
            return;
          }

          const roleRadio = newForm.querySelector('input[name="register-role"]:checked');
          if (!roleRadio) {
            App.utils.showToast('Please select a role (Broker or Realtor).', 'error');
            return;
          }

          const firstName = newForm.querySelector('#register-firstName').value;
          const lastName = newForm.querySelector('#register-lastName').value;

          const data = {
            role: roleRadio.value,
            firstName,
            lastName,
            phone: newForm.querySelector('#register-phone').value,
            country: newForm.querySelector('#register-country').value,
            agencyName: agencyNameInput ? agencyNameInput.value : '',
            brokerId: brokerSelect ? brokerSelect.value : '',
            newsletterConsent: newForm.querySelector('#register-newsletter')?.checked || false,
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

    // Render the agreement section
    renderPendingAgreementSection(currentUser);

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

      const status = user.agreementStatus || 'none'; // 'none' | 'uploaded' | 'signed'

      let statusHtml = '';
      if (status === 'signed') {
        statusHtml = `
          <div style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#d1fae5; border-radius:0.75rem; margin-bottom:1.5rem; border:1px solid #a7f3d0; text-align:left;">
            <span style="font-size:2rem;">✅</span>
            <div>
              <div style="font-weight:700; color:#065f46; font-size:1rem;">
                <span class="lang-en">Referral Agreement — Signed by both parties</span>
                <span class="lang-es">Acuerdo de Referido — Firmado por ambas partes</span>
                <span class="lang-fr">Accord de Référencement — Signé par les deux parties</span>
                <span class="lang-en-ca">Referral Agreement — Signed by both parties</span>
              </div>
              <div style="font-size:0.85rem; color:#047857; margin-bottom:8px;">
                <span class="lang-en">Your agreement is active and signed by both parties.</span>
                <span class="lang-es">Tu acuerdo está activo y firmado por ambas partes.</span>
                <span class="lang-fr">Votre accord est actif et signé par les deux parties.</span>
                <span class="lang-en-ca">Your agreement is active and signed by both parties.</span>
              </div>
              <div style="display:flex; gap:10px;">
                ${user.agreementFileUrl ? `<a href="${user.agreementFileUrl}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 10px;font-size:0.78rem;">📥 <span class="lang-en">Your Copy</span><span class="lang-es">Tu Copia</span><span class="lang-fr">Votre Copie</span><span class="lang-en-ca">Your Copy</span></a>` : ''}
                ${user.agreementFinalUrl ? `<a href="${user.agreementFinalUrl}" target="_blank" class="btn btn-primary btn-sm" style="padding:4px 10px;font-size:0.78rem;color:white;">📥 <span class="lang-en">Final Agreement</span><span class="lang-es">Acuerdo Final</span><span class="lang-fr">Accord Final</span><span class="lang-en-ca">Final Agreement</span></a>` : ''}
              </div>
            </div>
          </div>`;
      } else if (status === 'uploaded') {
        statusHtml = `
          <div style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#fef9c3; border-radius:0.75rem; margin-bottom:1.5rem; border:1px solid #fef08a; text-align:left;">
            <span style="font-size:2rem;">⏳</span>
            <div>
              <div style="font-weight:700; color:#854d0e; font-size:1rem;">
                <span class="lang-en">Agreement uploaded — Pending Admin Signature</span>
                <span class="lang-es">Acuerdo subido — Pendiente de Firma del Administrador</span>
                <span class="lang-fr">Accord téléversé — En attente de la signature de l'admin</span>
                <span class="lang-en-ca">Agreement uploaded — Pending Admin Signature</span>
              </div>
              <div style="font-size:0.85rem; color:#a16207; margin-bottom:8px;">
                <span class="lang-en">We have received your signed agreement. The RE/MAX Inmomás broker will countersign shortly.</span>
                <span class="lang-es">Hemos recibido tu acuerdo firmado. El broker de RE/MAX Inmomás lo co-firmará en breve.</span>
                <span class="lang-fr">Nous avons reçu votre accord signé. Le courtier de RE/MAX Inmomás le co-signera sous peu.</span>
                <span class="lang-en-ca">We have received your signed agreement. The RE/MAX Inmomás broker will countersign shortly.</span>
              </div>
              ${user.agreementFileUrl ? `<a href="${user.agreementFileUrl}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 10px;font-size:0.78rem;">📥 <span class="lang-en">View Uploaded Copy</span><span class="lang-es">Ver Copia Subida</span><span class="lang-fr">Voir la Copie Téléversée</span><span class="lang-en-ca">View Uploaded Copy</span></a>` : ''}
            </div>
          </div>`;
      } else {
        statusHtml = `
          <div style="padding:1.25rem; background:#fef3c7; border-radius:0.75rem; margin-bottom:1rem; border:1px solid #fde68a; text-align:left;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <span style="font-size:1.5rem;">⚠️</span>
              <div style="font-weight:600; color:#92400e;">
                <span class="lang-en">Referral Agreement Required</span>
                <span class="lang-es">Acuerdo de Referido Requerido</span>
                <span class="lang-fr">Accord de Référencement Requis</span>
                <span class="lang-en-ca">Referral Agreement Required</span>
              </div>
            </div>
            <p style="font-size:0.85rem; color:#78350f; margin:0;">
              <span class="lang-en">Please download the agreement, sign it outside the system, and upload the signed copy here to activate your partnership.</span>
              <span class="lang-es">Por favor descarga el acuerdo, fírmalo fuera del sistema y sube la copia firmada aquí para activar tu colaboración.</span>
              <span class="lang-fr">Veuillez télécharger l'accord, le signer hors ligne, et téléverser la copie signée ici pour activer votre partenariat.</span>
              <span class="lang-en-ca">Please download the agreement, sign it outside the system, and upload the signed copy here to activate your partnership.</span>
            </p>
          </div>
          <!-- Download -->
          <div style="background:#f8f9ff; border:1.5px solid #c7d2fe; border-radius:0.75rem; padding:1.25rem; margin-bottom:1rem; text-align:left;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <span style="font-size:1.4rem;">1️⃣</span>
              <div style="font-weight:600; color:#1e40af;">
                <span class="lang-en">Download &amp; Sign the Agreement</span>
                <span class="lang-es">Descargar y Firmar el Acuerdo</span>
                <span class="lang-fr">Télécharger &amp; Signer l'Accord</span>
                <span class="lang-en-ca">Download &amp; Sign the Agreement</span>
              </div>
            </div>
            <p style="font-size:0.85rem; color:#374151; margin:0 0 0.875rem;">
              <span class="lang-en">Download your personalized Master Referral Agreement (Word format).</span>
              <span class="lang-es">Descarga tu Acuerdo Marco de Referidos personalizado (formato Word).</span>
              <span class="lang-fr">Téléchargez votre accord de référencement personnalisé (format Word).</span>
              <span class="lang-en-ca">Download your personalized Master Referral Agreement (Word format).</span>
            </p>
            <button class="btn btn-primary" id="pending-download-agreement-btn" style="gap:0.5rem;">
              📄 <span class="lang-en">Download Agreement (.doc)</span>
              <span class="lang-es">Descargar Acuerdo (.doc)</span>
              <span class="lang-fr">Télécharger l'Accord (.doc)</span>
              <span class="lang-en-ca">Download Agreement (.doc)</span>
            </button>
          </div>
          <!-- Upload -->
          <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:0.75rem; padding:1.25rem; text-align:left;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
              <span style="font-size:1.4rem;">2️⃣</span>
              <div style="font-weight:600; color:#166534;">
                <span class="lang-en">Upload Signed Agreement</span>
                <span class="lang-es">Subir Acuerdo Firmado</span>
                <span class="lang-fr">Téléverser l'Accord Signé</span>
                <span class="lang-en-ca">Upload Signed Agreement</span>
              </div>
            </div>
            <p style="font-size:0.85rem; color:#374151; margin:0 0 0.875rem;">
              <span class="lang-en">Upload your signed copy (PDF or Word). We will countersign and confirm your partnership.</span>
              <span class="lang-es">Sube tu copia firmada (PDF o Word). Lo co-firmaremos y confirmaremos tu colaboración.</span>
              <span class="lang-fr">Téléversez votre copie signée (PDF ou Word). Nous la co-signerons et confirmerons votre partenariat.</span>
              <span class="lang-en-ca">Upload your signed copy (PDF or Word). We will countersign and confirm your partnership.</span>
            </p>
            <div id="pending-agreement-upload-zone" style="border:2px dashed #86efac; border-radius:0.625rem; padding:1.5rem; text-align:center; cursor:pointer; transition:border-color 0.2s;"
                 onclick="document.getElementById('pending-agreement-file-input').click()"
                 onmouseover="this.style.borderColor='#22c55e'" onmouseout="this.style.borderColor='#86efac'">
              <div style="font-size:2rem; margin-bottom:0.4rem;">📤</div>
              <p style="font-size:0.85rem; color:#374151; margin:0.25rem 0 0;">
                <span class="lang-en">Click or drop signed file here</span>
                <span class="lang-es">Haz clic o arrastra el archivo firmado aquí</span>
                <span class="lang-fr">Cliquez ou déposez le fichier signé ici</span>
                <span class="lang-en-ca">Click or drop signed file here</span>
              </p>
            </div>
            <input type="file" id="pending-agreement-file-input" accept=".pdf,.doc,.docx" style="display:none;">
            <div id="pending-agreement-upload-status" style="margin-top:0.5rem; font-size:0.85rem;"></div>
          </div>`;
      }

      container.innerHTML = statusHtml;

      // Translate newly rendered container elements
      if (window.App && typeof window.App.updateLangDisplay === 'function') {
        window.App.updateLangDisplay();
      }

      // Bind events
      const dlBtn = document.getElementById('pending-download-agreement-btn');
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          if (typeof App.generateReferralAgreementDoc === 'function') {
            App.generateReferralAgreementDoc(user);
            App.utils.showToast('Agreement downloading... Sign it and upload below.', 'info');
          } else {
            App.utils.showToast('Generator not loaded. Please refresh.', 'error');
          }
        });
      }

      const uploadZone = document.getElementById('pending-agreement-upload-zone');
      const fileInput = document.getElementById('pending-agreement-file-input');
      if (uploadZone) {
        uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = '#22c55e'; });
        uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = '#86efac'; });
        uploadZone.addEventListener('drop', e => {
          e.preventDefault();
          uploadZone.style.borderColor = '#86efac';
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handlePendingAgreementUpload(e.dataTransfer.files[0], user);
          }
        });
      }
      if (fileInput) {
        fileInput.addEventListener('change', () => {
          if (fileInput.files && fileInput.files[0]) {
            handlePendingAgreementUpload(fileInput.files[0], user);
          }
        });
      }
    }

    async function handlePendingAgreementUpload(file, user) {
      const statusEl = document.getElementById('pending-agreement-upload-status');
      if (statusEl) statusEl.innerHTML = '<span style="color:#6b7280;">⏳ Uploading...</span>';
      try {
        let fileUrl = null;
        if (!App.demoMode && App.storage) {
          const ref = App.storage.ref(`agreements/${user.id}/signed_${Date.now()}_${file.name}`);
          await ref.put(file);
          fileUrl = await ref.getDownloadURL();
        } else {
          fileUrl = `demo://agreements/${user.id}/${file.name}`;
        }

        const now = new Date().toISOString();
        if (!App.demoMode && App.db) {
          await App.db.collection('users').doc(user.id).update({
            agreementStatus: 'uploaded',
            agreementUploadedAt: now,
            agreementFileUrl: fileUrl
          });
          await App.db.collection('agreement_notifications').add({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            userRole: user.role,
            agencyName: user.agencyName || user.brokerNameManual || '—',
            email: user.email,
            fileUrl: fileUrl,
            fileName: file.name,
            uploadedAt: now,
            status: 'pending_admin'
          });
        } else {
          const demoUser = App.demoData.users.find(u => u.id === user.id);
          if (demoUser) {
            demoUser.agreementStatus = 'uploaded';
            demoUser.agreementUploadedAt = now;
            demoUser.agreementFileUrl = fileUrl;
          }
          user.agreementStatus = 'uploaded';
          user.agreementUploadedAt = now;
          user.agreementFileUrl = fileUrl;
          App.demoData.agreementNotifications = App.demoData.agreementNotifications || [];
          App.demoData.agreementNotifications.push({
            id: 'notif_' + Date.now(),
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            userRole: user.role,
            agencyName: user.agencyName || '—',
            email: user.email,
            fileUrl: fileUrl,
            fileName: file.name,
            uploadedAt: now,
            status: 'pending_admin'
          });
          if (App.auth && typeof App.auth.saveDemoData === 'function') App.auth.saveDemoData();
        }

        App.utils.showToast('✅ Agreement uploaded! The RE/MAX Inmomás broker will countersign shortly.', 'success');
        // Re-initialize view
        App.views.auth.initPending();
      } catch (err) {
        console.error('[Pending] Agreement upload error:', err);
        if (statusEl) statusEl.innerHTML = '<span style="color:#e11b22;">❌ Upload failed. Please try again.</span>';
        App.utils.showToast('Upload failed. Please try again.', 'error');
      }
    }
  }
};
