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
            window.location.href = 'app.html#' + user.role + '/dashboard';
          }
        } catch (error) {
          err.textContent = error.message;
          err.style.display = 'block';
        } finally {
          submitBtn.innerHTML = oldText;
          submitBtn.disabled = false;
        }
      });
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

        const data = {
          role: newForm.querySelector('input[name="register-role"]:checked').value,
          firstName: newForm.querySelector('#register-firstName').value,
          lastName: newForm.querySelector('#register-lastName').value,
          email: newForm.querySelector('#register-email').value,
          phone: newForm.querySelector('#register-phone').value,
          password: newForm.querySelector('#register-password').value,
          country: newForm.querySelector('#register-country').value,
          agencyName: agencyNameInput ? agencyNameInput.value : '',
          brokerId: brokerSelect ? brokerSelect.value : '',
        };
        
        try {
          const res = await App.auth.register(data);
          if (res && res.success) {
            if (res.user.status === 'active') {
              window.location.href = 'app.html#' + res.user.role + '/dashboard';
            } else {
              alert("Registration successful! Please wait for admin approval before logging in.");
              App.router.navigateTo('login');
            }
          }
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }
};
