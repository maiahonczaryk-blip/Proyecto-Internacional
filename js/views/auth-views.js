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

    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const roleBadgeEl = document.getElementById('profile-role-badge');
    const agencyEl = document.getElementById('profile-agency');
    const statusEl = document.getElementById('profile-status');
    const joinedEl = document.getElementById('profile-joined');

    if (avatarEl) avatarEl.innerHTML = user.firstName.charAt(0) + user.lastName.charAt(0);
    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
    if (emailEl) emailEl.textContent = user.email;
    if (roleBadgeEl) roleBadgeEl.textContent = user.role.toUpperCase();
    if (agencyEl) agencyEl.textContent = user.agencyName || '—';
    if (statusEl) statusEl.innerHTML = App.utils.getUserStatusBadge(user.status);
    if (joinedEl) joinedEl.textContent = App.utils.formatDate(user.createdAt);
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
