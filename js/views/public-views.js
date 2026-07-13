/* ============================================
   RE/MAX Inmomás — Public Views (Referral + Intake)
   ============================================ */
App.views = App.views || {};
App.views.public = {

  /* ============================================
     INTAKE FORM (Client Portal)
     ============================================ */
  initIntake: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('intake-welcome-msg');

    if (refCode && App.demoData && App.demoData.users) {
      const referrer = App.demoData.users.find(u => u.referralCode === refCode);
      if (referrer && welcomeMsg) {
        welcomeMsg.innerHTML = `<span class="lang-en">Welcome! You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>.</span>
                                <span class="lang-es">¡Bienvenido! Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>.</span>`;
      }
    }

    const form = document.getElementById('intake-form');
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const firstName = newForm.querySelector('#intake-firstName').value.trim();
        const lastName = newForm.querySelector('#intake-lastName').value.trim();
        const email = newForm.querySelector('#intake-email').value.trim();
        const phone = newForm.querySelector('#intake-phone').value.trim();
        const country = newForm.querySelector('#intake-country')?.value.trim() || '';

        if (!firstName || !lastName || !email || !phone) {
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Please fill in all required fields.', 'error');
          }
          return;
        }

        const newClient = {
          id: 'cli-' + Date.now(),
          firstName,
          lastName,
          email,
          phone,
          currentLocation: country,
          budget: '',
          interestArea: '',
          status: 'contacted',
          notes: '',
          referredBy: refCode || null,
          realtorId: null,
          realtorName: null,
          brokerId: null,
          localAgentId: null,
          localAgentName: null,
          statusHistory: [{ status: 'contacted', date: new Date().toISOString(), note: 'Client portal submission' }],
          timeline: '',
          objective: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (refCode && App.demoData && App.demoData.users) {
          const referrer = App.demoData.users.find(u => u.referralCode === refCode);
          if (referrer) {
            newClient.referredBy = referrer.id;
            if (referrer.role === 'broker') {
              newClient.brokerId = referrer.id;
            } else if (referrer.role === 'realtor') {
              newClient.realtorId = referrer.id;
              newClient.realtorName = `${referrer.firstName} ${referrer.lastName}`;
              newClient.brokerId = referrer.brokerId || null;
            }
          }
        }

        App.demoData.clients.push(newClient);
        App.auth.saveDemoData();

        if (App.utils && App.utils.showToast) {
          App.utils.showToast('Registration successful! We\'ll be in touch soon.', 'success');
        }

        sessionStorage.removeItem('referralCode');
        newForm.reset();
        setTimeout(() => App.router.navigateTo('home'), 1500);
      });
    }
  },

  /* ============================================
     REFERRAL FORM
     ============================================ */
  initReferralForm: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('referral-welcome-msg');
    const typeSelector = document.getElementById('referral-type-selector');
    const typeOptions = document.getElementById('referral-type-options');
    const form = document.getElementById('referral-form');

    let referrer = null;
    let selectedType = 'client';

    // Toggle which field sections are visible
    function updateFieldVisibility(type) {
      const cf = document.getElementById('referral-client-fields');
      const pf = document.getElementById('referral-professional-fields');
      if (cf) cf.style.display = type === 'client' ? '' : 'none';
      if (pf) pf.style.display = type !== 'client' ? '' : 'none';
      // Disable required on hidden client fields to prevent validation blocking
      if (cf) {
        cf.querySelectorAll('[required]').forEach(el => {
          if (type !== 'client') {
            el.dataset.wasRequired = 'true';
            el.removeAttribute('required');
          } else if (el.dataset.wasRequired) {
            el.setAttribute('required', '');
          }
        });
      }
    }

    // ---- Step 1: Look up referrer (sync from demoData first, then async Firestore) ----
    function lookupReferrerSync() {
      if (!refCode) return null;
      if (App.demoData && App.demoData.users) {
        return App.demoData.users.find(u => u.referralCode === refCode) || null;
      }
      return null;
    }

    async function lookupReferrerFirestore() {
      if (!refCode || App.demoMode || !App.db) return null;
      try {
        const snapshot = await App.db.collection('users')
          .where('referralCode', '==', refCode)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[Referral] Firestore lookup failed:', err);
      }
      return null;
    }

    function applyReferrer(ref) {
      referrer = ref;
      if (!referrer) {
        console.log('[Referral] No referrer found for code:', refCode);
        return;
      }
      console.log('[Referral] Referrer found:', referrer.firstName, referrer.lastName, '(' + referrer.role + ')');

      // Update welcome message
      if (welcomeMsg) {
        welcomeMsg.innerHTML = `<span class="lang-en">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Please fill out the form below to register.</span>
                                <span class="lang-es">Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>. Completa el formulario para registrarte.</span>`;
      }

      // Build type options
      let availableTypes = ['client'];
      if (referrer.role === 'broker') {
        availableTypes = ['client', 'realtor'];
      } else if (referrer.role === 'agent_inmomas' || referrer.role === 'admin') {
        availableTypes = ['client', 'realtor', 'broker'];
      }

      const typeConfig = {
        client: { icon: '👤', labelEn: 'Client', labelEs: 'Cliente' },
        realtor: { icon: '🏠', labelEn: 'Realtor', labelEs: 'Realtor' },
        broker: { icon: '🏢', labelEn: 'Broker', labelEs: 'Broker' }
      };

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

      updateFieldVisibility(selectedType);
    }

    // ---- Step 2: Try sync first, then async ----
    const syncResult = lookupReferrerSync();
    if (syncResult) {
      applyReferrer(syncResult);
    }

    // Always try Firestore in background (may override sync result)
    if (refCode && !App.demoMode && App.db) {
      lookupReferrerFirestore().then(firestoreResult => {
        if (firestoreResult) {
          applyReferrer(firestoreResult);
        } else if (!syncResult) {
          console.log('[Referral] No referrer in Firestore or demoData for code:', refCode);
        }
      });
    }

    // Initial visibility
    updateFieldVisibility(selectedType);

    // ---- Step 3: Form submission (ALWAYS attach, regardless of referrer lookup) ----
    if (form && !form.dataset.listenerAttached) {
      form.dataset.listenerAttached = 'true';

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const submitBtn = form.querySelector('#referral-submit-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
        }

        try {
          const firstName = (form.querySelector('#referral-firstName')?.value || '').trim();
          const lastName = (form.querySelector('#referral-lastName')?.value || '').trim();
          const email = (form.querySelector('#referral-email')?.value || '').trim();
          const phone = (form.querySelector('#referral-phone')?.value || '').trim();

          const typeRadio = document.querySelector('input[name="referral-contact-type"]:checked');
          const contactType = typeRadio ? typeRadio.value : selectedType;

          if (!firstName || !lastName || !email || !phone) {
            App.utils.showToast('Please fill in all required fields.', 'error');
            return;
          }

          if (contactType === 'client') {
            const country = form.querySelector('#referral-country')?.value.trim() || '';
            const budget = form.querySelector('#referral-budget')?.value || '';
            const interestArea = form.querySelector('#referral-interestArea')?.value || '';
            const timeline = form.querySelector('#referral-timeline')?.value || '';
            const objective = form.querySelector('#referral-objective')?.value || '';
            const notes = form.querySelector('#referral-notes')?.value.trim() || '';

            const clientPayload = {
              firstName, lastName, email, phone,
              currentLocation: country,
              budget, interestArea, timeline, objective,
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
                clientPayload.realtorId = referrer.id;
                clientPayload.realtorName = `${referrer.firstName} ${referrer.lastName}`;
                clientPayload.brokerId = referrer.brokerId || null;
              }
            }

            await App.auth.addReferralClient(clientPayload);
          } else {
            const agencyName = form.querySelector('#referral-agencyName')?.value.trim() || '';
            const market = form.querySelector('#referral-market')?.value.trim() || '';
            const notes = form.querySelector('#referral-notes')?.value.trim() || '';

            const userPayload = {
              firstName, lastName, email, phone,
              role: contactType,
              agencyName, market, notes,
              referredBy: referrer ? referrer.id : null,
              brokerId: (referrer && referrer.role === 'broker') ? referrer.id : null,
            };

            await App.auth.addReferralUser(userPayload);
          }

          App.utils.showToast(
            contactType === 'client'
              ? '¡Registro exitoso! Nos pondremos en contacto contigo pronto.'
              : '¡Solicitud enviada! Tu registro será revisado por el administrador.',
            'success'
          );

          sessionStorage.removeItem('referralCode');
          form.reset();
          setTimeout(() => App.router.navigateTo('home'), 1500);

        } catch (err) {
          console.error('[Referral] Error submitting form:', err);
          App.utils.showToast('Error al enviar el formulario: ' + err.message, 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="lang-en">Submit</span><span class="lang-es">Enviar</span>';
          }
        }
      });
    }
  }
};
