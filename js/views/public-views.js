window.App = window.App || {};
App.views = App.views || {};

App.views.public = {
  initIntake: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('intake-welcome-msg');
    
    // Find the realtor to show a personalized message
    if (refCode && App.demoData && App.demoData.users) {
      const realtor = App.demoData.users.find(u => u.referralCode === refCode);
      if (realtor) {
        welcomeMsg.innerHTML = `<span class="lang-en">You've been invited by <strong>${realtor.firstName} ${realtor.lastName}</strong> to the VIP Client Program. Please detail your needs below.</span>
                                <span class="lang-es">Has sido invitado por <strong>${realtor.firstName} ${realtor.lastName}</strong> al Programa de Clientes VIP. Detalla tus necesidades a continuación.</span>`;
      }
    }

    const form = document.getElementById('intake-form');
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect checked services
        const services = Array.from(newForm.querySelectorAll('.intake-service:checked')).map(cb => cb.value);

        const clientData = {
          id: 'client_' + Date.now(),
          firstName: newForm.querySelector('#intake-firstName').value,
          lastName: newForm.querySelector('#intake-lastName').value,
          email: newForm.querySelector('#intake-email').value,
          phone: newForm.querySelector('#intake-phone').value,
          currentLocation: newForm.querySelector('#intake-currentLocation').value,
          targetLocation: newForm.querySelector('#intake-targetLocation').value,
          services: services,
          status: 'contactado', // Default kanban status
          createdAt: new Date().toISOString(),
          notes: `Services requested: ${services.join(', ')}`,
          budget: 'TBD', // Placeholder
        };

        // Find the referrer and assign
        if (refCode) {
          const referrer = App.demoData.users.find(u => u.referralCode === refCode);
          if (referrer) {
            if (referrer.role === 'broker') {
              clientData.brokerId = referrer.id;
            } else if (referrer.role === 'agent_inmomas') {
              clientData.localAgentId = referrer.id;
              clientData.localAgentName = `${referrer.firstName} ${referrer.lastName}`;
            } else {
              // realtor
              clientData.realtorId = referrer.id;
              clientData.realtorName = `${referrer.firstName} ${referrer.lastName}`;
              clientData.brokerId = referrer.brokerId || null;
            }
          }
        }

        // Save to demoData
        if (!App.demoData.clients) App.demoData.clients = [];
        App.demoData.clients.push(clientData);
        if (App.auth && typeof App.auth.saveDemoData === 'function') {
          App.auth.saveDemoData();
        }

        // Success message
        alert("Your profile has been submitted successfully! We will contact you shortly.");
        
        // Clear form & redirect
        newForm.reset();
        App.router.navigateTo('home');
      });
    }
  },

  /* =============================================
     initReferralForm()
     Public referral form. Shows contact type
     options based on the referrer's role:
       - realtor  → only "Cliente"
       - broker   → "Cliente" or "Realtor"
       - agent_inmomas / admin → "Cliente", "Realtor", or "Broker"
     ============================================= */
  initReferralForm: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('referral-welcome-msg');
    const typeSelector = document.getElementById('referral-type-selector');
    const typeOptions = document.getElementById('referral-type-options');

    let referrer = null;
    let selectedType = 'client'; // default

    // Find the referrer and personalize the welcome message
    if (refCode && App.demoData && App.demoData.users) {
      referrer = App.demoData.users.find(u => u.referralCode === refCode);
      if (referrer && welcomeMsg) {
        welcomeMsg.innerHTML = `<span class="lang-en">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Please fill out the form below.</span>
                                <span class="lang-es">Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>. Por favor completa el formulario.</span>`;
      }
    }

    // Build contact type options based on referrer role
    const typeConfig = {
      client: { icon: '👤', labelEn: 'Client', labelEs: 'Cliente' },
      realtor: { icon: '🏠', labelEn: 'Realtor', labelEs: 'Realtor' },
      broker: { icon: '🏢', labelEn: 'Broker', labelEs: 'Broker' }
    };

    let availableTypes = ['client']; // realtor referral → only client
    if (referrer) {
      if (referrer.role === 'broker') {
        availableTypes = ['client', 'realtor'];
      } else if (referrer.role === 'agent_inmomas' || referrer.role === 'admin') {
        availableTypes = ['client', 'realtor', 'broker'];
      }
    }

    // Only show type selector if there's more than one option
    if (availableTypes.length > 1 && typeSelector && typeOptions) {
      typeSelector.style.display = 'block';
      typeOptions.innerHTML = availableTypes.map((type, idx) => {
        const cfg = typeConfig[type];
        return `
          <label class="role-card referral-type-card ${idx === 0 ? 'selected' : ''}">
            <input type="radio" name="referral-contact-type" value="${type}" ${idx === 0 ? 'checked' : ''} style="display:none;">
            <div class="role-card__content" style="padding: 16px 12px; text-align: center;">
              <span class="role-card__icon" style="font-size: 1.8rem;">${cfg.icon}</span>
              <span class="role-card__title" style="font-size: 0.85rem;">
                <span class="lang-en">${cfg.labelEn}</span><span class="lang-es">${cfg.labelEs}</span>
              </span>
            </div>
          </label>`;
      }).join('');

      // Handle selection styling
      typeOptions.querySelectorAll('.referral-type-card').forEach(card => {
        card.addEventListener('click', function() {
          typeOptions.querySelectorAll('.referral-type-card').forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
          selectedType = this.querySelector('input').value;
        });
      });
    } else if (typeSelector) {
      typeSelector.style.display = 'none';
    }

    // Form submission
    const form = document.getElementById('referral-form');
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = newForm.querySelector('#referral-firstName').value.trim();
        const lastName = newForm.querySelector('#referral-lastName').value.trim();
        const email = newForm.querySelector('#referral-email').value.trim();
        const phone = newForm.querySelector('#referral-phone').value.trim();
        const timeline = newForm.querySelector('#referral-timeline').value;
        const reason = newForm.querySelector('#referral-reason').value.trim();

        // Re-read the selected type from the cloned form's radio (if present)
        const typeRadio = document.querySelector('input[name="referral-contact-type"]:checked');
        const contactType = typeRadio ? typeRadio.value : selectedType;

        if (!firstName || !lastName || !email || !phone) {
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Please fill in all required fields.', 'error');
          }
          return;
        }

        if (contactType === 'client') {
          // ---- Save as a new client ----
          const clientData = {
            id: 'client_' + Date.now(),
            firstName,
            lastName,
            email,
            phone,
            timeline,
            movingReason: reason,
            status: 'contactado',
            createdAt: new Date().toISOString(),
            notes: `Timeline: ${timeline} | Reason: ${reason}`,
            budget: 'TBD',
            source: 'referral',
          };

          if (referrer) {
            clientData.referredBy = referrer.id;
            if (referrer.role === 'broker') {
              clientData.brokerId = referrer.id;
            } else if (referrer.role === 'agent_inmomas') {
              clientData.localAgentId = referrer.id;
              clientData.localAgentName = `${referrer.firstName} ${referrer.lastName}`;
            } else if (referrer.role === 'admin') {
              clientData.brokerId = null;
              clientData.localAgentId = null;
            } else {
              // realtor
              clientData.realtorId = referrer.id;
              clientData.realtorName = `${referrer.firstName} ${referrer.lastName}`;
              clientData.brokerId = referrer.brokerId || null;
            }
          }

          if (!App.demoData.clients) App.demoData.clients = [];
          App.demoData.clients.push(clientData);

        } else {
          // ---- Save as a pending professional registration (realtor or broker) ----
          const newUser = {
            id: contactType + '_ref_' + Date.now(),
            firstName,
            lastName,
            email,
            phone,
            role: contactType, // 'realtor' or 'broker'
            status: 'pending',
            createdAt: new Date().toISOString(),
            referralCode: `${contactType === 'broker' ? 'BRK' : 'REA'}-${lastName.toUpperCase()}`,
            agencyName: '',
            timeline,
            movingReason: reason,
            source: 'referral',
            referredBy: referrer ? referrer.id : null,
          };

          if (referrer && referrer.role === 'broker') {
            newUser.brokerId = referrer.id;
          }

          if (!App.demoData.users) App.demoData.users = [];
          App.demoData.users.push(newUser);
        }

        // Persist
        if (App.auth && typeof App.auth.saveDemoData === 'function') {
          App.auth.saveDemoData();
        }

        // Success feedback
        if (App.utils && App.utils.showToast) {
          App.utils.showToast(
            contactType === 'client'
              ? '¡Perfil enviado con éxito! Nos pondremos en contacto contigo pronto.'
              : '¡Solicitud enviada! Tu registro será revisado por el administrador.',
            'success'
          );
        }

        // Clear referral code and redirect
        sessionStorage.removeItem('referralCode');
        newForm.reset();
        setTimeout(() => App.router.navigateTo('home'), 1500);
      });
    }
  }
};
