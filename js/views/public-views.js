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
          status: 'contacted',
          createdAt: new Date().toISOString(),
          statusHistory: [{ status: 'contacted', date: new Date().toISOString(), note: 'Registered via referral link' }],
          notes: `Services requested: ${services.join(', ')}`,
          budget: 'TBD'
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
     Public referral registration form matching
     the "Add Client Manually" fields. Shows
     contact type options based on referrer role:
       - realtor  → only "Cliente"
       - broker   → "Cliente" or "Realtor"
       - agent_inmomas / admin → all three
     ============================================= */
  initReferralForm: async function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('referral-welcome-msg');
    const typeSelector = document.getElementById('referral-type-selector');
    const typeOptions = document.getElementById('referral-type-options');

    let referrer = null;
    let selectedType = 'client'; // default

    // Toggle which field sections are visible (always query DOM fresh to avoid stale refs after form clone)
    function updateFieldVisibility(type) {
      const cf = document.getElementById('referral-client-fields');
      const pf = document.getElementById('referral-professional-fields');
      if (cf) cf.style.display = type === 'client' ? '' : 'none';
      if (pf) pf.style.display = type !== 'client' ? '' : 'none';
    }

    // Find the referrer: first try Firestore, fallback to demoData
    if (refCode) {
      // Try Firestore query (works when Firebase is active)
      if (!App.demoMode && App.db) {
        try {
          const snapshot = await App.db.collection('users')
            .where('referralCode', '==', refCode)
            .limit(1)
            .get();
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            referrer = { id: doc.id, ...doc.data() };
          }
        } catch (err) {
          console.warn('[Referral] Firestore lookup failed, falling back to demoData:', err);
        }
      }
      // Fallback to demoData (demo mode or Firestore failed)
      if (!referrer && App.demoData && App.demoData.users) {
        referrer = App.demoData.users.find(u => u.referralCode === refCode);
      }

      if (referrer && welcomeMsg) {
        welcomeMsg.innerHTML = `<span class="lang-en">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Please fill out the form below to register.</span>
                                <span class="lang-es">Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>. Completa el formulario para registrarte.</span>`;
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

      // Handle selection styling + field toggling
      typeOptions.querySelectorAll('.referral-type-card').forEach(card => {
        card.addEventListener('click', function() {
          typeOptions.querySelectorAll('.referral-type-card').forEach(c => c.classList.remove('selected'));
          this.classList.add('selected');
          selectedType = this.querySelector('input').value;
          updateFieldVisibility(selectedType);
        });
      });
    } else if (typeSelector) {
      typeSelector.style.display = 'none';
    }

    // Ensure correct initial visibility
    updateFieldVisibility(selectedType);

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

        // Re-read the selected type from the radio (if present)
        const typeRadio = document.querySelector('input[name="referral-contact-type"]:checked');
        const contactType = typeRadio ? typeRadio.value : selectedType;

        if (!firstName || !lastName || !email || !phone) {
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Please fill in all required fields.', 'error');
          }
          return;
        }

        try {
          if (contactType === 'client') {
            // ---- Save as a new client via auth-service (Firestore or demo) ----
            const country = newForm.querySelector('#referral-country')?.value.trim() || '';
            const budget = newForm.querySelector('#referral-budget')?.value || '';
            const interestArea = newForm.querySelector('#referral-interestArea')?.value || '';
            const timeline = newForm.querySelector('#referral-timeline')?.value || '';
            const objective = newForm.querySelector('#referral-objective')?.value || '';
            const notes = newForm.querySelector('#referral-notes')?.value.trim() || '';

            const clientPayload = {
              firstName,
              lastName,
              email,
              phone,
              currentLocation: country,
              budget,
              interestArea,
              timeline,
              objective,
              notes: notes || `Objective: ${objective} | Timeline: ${timeline}`,
            };

            if (referrer) {
              clientPayload.referredBy = referrer.id;
              if (referrer.role === 'broker') {
                clientPayload.brokerId = referrer.id;
              } else if (referrer.role === 'agent_inmomas') {
                clientPayload.localAgentId = referrer.id;
                clientPayload.localAgentName = `${referrer.firstName} ${referrer.lastName}`;
              } else if (referrer.role === 'admin') {
                // Admin referral — no specific assignment
              } else {
                // realtor
                clientPayload.realtorId = referrer.id;
                clientPayload.realtorName = `${referrer.firstName} ${referrer.lastName}`;
                clientPayload.brokerId = referrer.brokerId || null;
              }
            }

            await App.auth.addReferralClient(clientPayload);

          } else {
            // ---- Save as a pending professional registration via auth-service ----
            const agencyName = newForm.querySelector('#referral-agencyName')?.value.trim() || '';
            const market = newForm.querySelector('#referral-market')?.value.trim() || '';
            const notes = newForm.querySelector('#referral-notes')?.value.trim() || '';

            const userPayload = {
              firstName,
              lastName,
              email,
              phone,
              role: contactType,
              agencyName,
              market,
              notes,
              referredBy: referrer ? referrer.id : null,
              brokerId: (referrer && referrer.role === 'broker') ? referrer.id : null,
            };

            await App.auth.addReferralUser(userPayload);
          }

          // Success feedback
          if (App.utils && App.utils.showToast) {
            App.utils.showToast(
              contactType === 'client'
                ? '¡Registro exitoso! Nos pondremos en contacto contigo pronto.'
                : '¡Solicitud enviada! Tu registro será revisado por el administrador.',
              'success'
            );
          }

          // Clear referral code and redirect
          sessionStorage.removeItem('referralCode');
          newForm.reset();
          setTimeout(() => App.router.navigateTo('home'), 1500);

        } catch (err) {
          console.error('[Referral] Error submitting form:', err);
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Error al enviar el formulario. Intenta de nuevo.', 'error');
          }
        }
      });
    }
  }
};
