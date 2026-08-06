/* ============================================
   RE/MAX Inmomás — Public Views (Referral + Intake + Webinar)
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
      const pwGroup = document.getElementById('referral-password-group');
      const pwInput = document.getElementById('referral-password');

      if (cf) cf.style.display = type === 'client' ? '' : 'none';
      if (pf) pf.style.display = type !== 'client' ? '' : 'none';
      if (pwGroup) pwGroup.style.display = type === 'client' ? 'none' : '';

      const profWebinar = document.querySelector('.professional-webinar-group');
      const clientWebinar = document.querySelector('.client-webinar-group');
      if (profWebinar) profWebinar.style.display = type === 'client' ? 'none' : '';
      if (clientWebinar) clientWebinar.style.display = type === 'client' ? '' : 'none';

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
      if (pwInput) {
        if (type === 'client') {
          pwInput.removeAttribute('required');
        } else {
          pwInput.setAttribute('required', '');
        }
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
                                <span class="lang-es">Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>. Completa el formulario para registrarte.</span>
                                <span class="lang-fr">Vous avez été parrainé par <strong>${referrer.firstName} ${referrer.lastName}</strong>. Veuillez remplir le formulaire ci-dessous pour vous inscrire.</span>
                                <span class="lang-en-ca">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Please fill out the form below to register.</span>`;
      }

      // Build type options
      let availableTypes = ['client'];
      if (referrer.role === 'broker') {
        availableTypes = ['client', 'realtor'];
      } else if (referrer.role === 'agent_inmomas' || referrer.role === 'admin') {
        availableTypes = referrer.role === 'admin' 
          ? ['client', 'realtor', 'broker', 'agent_inmomas']
          : ['client', 'realtor', 'broker'];
      }

      const typeConfig = {
        client: { icon: '👤', labelEn: 'Client', labelEs: 'Cliente', labelFr: 'Client', labelEnCa: 'Client' },
        realtor: { icon: '🏠', labelEn: 'Realtor', labelEs: 'Realtor', labelFr: 'Realtor', labelEnCa: 'Realtor' },
        broker: { icon: '🏢', labelEn: 'Broker', labelEs: 'Broker', labelFr: 'Courtier', labelEnCa: 'Broker' },
        agent_inmomas: { icon: '🇪🇸', labelEn: 'RE/MAX Inmomás Agent', labelEs: 'Agente RE/MAX Inmomás', labelFr: 'Agent RE/MAX Inmomás', labelEnCa: 'RE/MAX Inmomás Agent' }
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
                  <span class="lang-en">${cfg.labelEn}</span>
                  <span class="lang-es">${cfg.labelEs}</span>
                  <span class="lang-fr">${cfg.labelFr}</span>
                  <span class="lang-en-ca">${cfg.labelEnCa}</span>
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

          let agencyName = '';
          let market = '';

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
            agencyName = form.querySelector('#referral-agencyName')?.value.trim() || '';
            market = form.querySelector('#referral-market')?.value.trim() || '';
            const notes = form.querySelector('#referral-notes')?.value.trim() || '';
            const password = (form.querySelector('#referral-password')?.value || '').trim();

            if (!password || password.length < 6) {
              throw new Error('Password must be at least 6 characters.');
            }

            const userPayload = {
              email,
              password,
              firstName,
              lastName,
              agencyName,
              phone,
              country: market || 'United States',
              role: contactType,
              brokerId: (referrer && referrer.role === 'broker') ? referrer.id : null,
              referredBy: referrer ? referrer.id : null,
              source: 'referral'
            };

            await App.auth.register(userPayload);
          }

          // Handle webinar consent check (professional vs client events)
          let hasConsent = false;
          let webinarPayload = null;

          if (contactType === 'client') {
            const clientConsent = document.getElementById('referral-client-webinar-consent');
            if (clientConsent && clientConsent.checked) {
              hasConsent = true;
              webinarPayload = {
                firstName,
                lastName,
                email,
                phone,
                agency: 'Client (Interested in Spain)',
                country: form.querySelector('#referral-country')?.value || 'United States',
                state: 'N/A',
                howHeard: 'Referral Link',
                referrerName: referrer ? `${referrer.firstName} ${referrer.lastName}` : '',
                webinarTitle: 'Living & Investing in Spain: Relocation Guide',
                webinarDate: 'September 15, 2026'
              };
            }
          } else {
            const profConsent = document.getElementById('referral-webinar-consent');
            if (profConsent && profConsent.checked) {
              hasConsent = true;
              webinarPayload = {
                firstName,
                lastName,
                email,
                phone,
                agency: agencyName || 'Referred Partner',
                country: 'United States',
                state: market || 'N/A',
                howHeard: 'Referral Link',
                referrerName: referrer ? `${referrer.firstName} ${referrer.lastName}` : '',
                webinarTitle: 'Exclusive Webinar: Scale Your Business Globally',
                webinarDate: 'August 13, 2026'
              };
            }
          }

          if (hasConsent && webinarPayload) {
            try {
              await App.auth.saveWebinarRegistration(webinarPayload);
            } catch (webinarErr) {
              console.warn('[Referral] Webinar registration failed:', webinarErr);
            }
          }

          App.utils.showToast(
            contactType === 'client'
              ? '¡Registro exitoso! Nos pondremos en contacto contigo pronto.'
              : '¡Registro exitoso! Redirigiendo a tu solicitud en revisión.',
            'success'
          );

          sessionStorage.removeItem('referralCode');
          form.reset();
          setTimeout(() => {
            if (contactType === 'client') {
              App.router.navigateTo('home');
            } else {
              App.router.navigateTo('pending');
            }
          }, 1500);

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
  },

  /* ============================================
     WEBINAR REGISTRATION FORM — Beyond Borders
     August 28, 2026 | For US & Canadian Realtors
     ============================================ */
  initWebinarRegister: function() {
    // ---- US States ----
    const US_STATES = [
      'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
      'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
      'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
      'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
      'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
      'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
      'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
      'Wisconsin','Wyoming'
    ];
    // ---- Canadian Provinces & Territories ----
    const CA_PROVINCES = [
      'Alberta','British Columbia','Manitoba','New Brunswick',
      'Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut',
      'Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'
    ];

    // ---- Live Countdown ----
    function startCountdown() {
      const countdownEl = document.getElementById('webinar-countdown');
      if (!countdownEl) return;
      const TARGET = new Date('2026-08-28T12:00:00-04:00'); // 12pm EDT = 18:00 Spain CEST

      function tick() {
        const now = new Date();
        const diff = TARGET - now;
        if (diff <= 0) {
          countdownEl.innerHTML = '<span style="font-size:1.4rem;font-weight:700;color:#fff;">🎙️ The webinar is LIVE!</span>';
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const pad = n => String(n).padStart(2, '0');
        countdownEl.innerHTML = `
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;align-items:center;">
            <div style="text-align:center;min-width:52px;">
              <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${d}</div>
              <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;">Days</div>
            </div>
            <div style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
            <div style="text-align:center;min-width:52px;">
              <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(h)}</div>
              <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;">Hours</div>
            </div>
            <div style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
            <div style="text-align:center;min-width:52px;">
              <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(m)}</div>
              <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;">Min</div>
            </div>
            <div style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
            <div style="text-align:center;min-width:52px;">
              <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(s)}</div>
              <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;">Sec</div>
            </div>
          </div>`;
      }
      tick();
      setInterval(tick, 1000);
    }
    startCountdown();

    // ---- Country → State/Province dynamic list ----
    const countrySelect = document.getElementById('webinar-country');
    const stateSelect   = document.getElementById('webinar-state');

    function populateStates(country) {
      if (!stateSelect) return;
      const list = country === 'Canada' ? CA_PROVINCES : US_STATES;
      const label = country === 'Canada' ? 'Province / Territory' : 'State';
      stateSelect.innerHTML = `<option value="">— Select ${label} —</option>` +
        list.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    if (countrySelect && stateSelect) {
      populateStates('United States'); // default
      countrySelect.addEventListener('change', () => populateStates(countrySelect.value));
    }

    // ---- "How did you hear" → show/hide Referrer Name field ----
    const hearSelect   = document.getElementById('webinar-how-heard');
    const referrerWrap = document.getElementById('webinar-referrer-wrap');

    if (hearSelect && referrerWrap) {
      hearSelect.addEventListener('change', () => {
        const show = hearSelect.value === 'agent';
        referrerWrap.style.display = show ? '' : 'none';
        const inp = document.getElementById('webinar-referrer-name');
        if (inp) inp.required = show;
      });
    }

    // ---- Form submission ----
    const form = document.getElementById('webinar-register-form');
    if (!form || form.dataset.listenerAttached) return;
    form.dataset.listenerAttached = 'true';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('webinar-submit-btn');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span style="opacity:.7">Registering…</span>'; }

      try {
        const get = id => (document.getElementById(id)?.value || '').trim();
        const firstName    = get('webinar-firstName');
        const lastName     = get('webinar-lastName');
        const phone        = get('webinar-phone');
        const email        = get('webinar-email');
        const agency       = get('webinar-agency');
        const country      = get('webinar-country');
        const state        = get('webinar-state');
        const howHeard     = get('webinar-how-heard');
        const referrerName = get('webinar-referrer-name');
        const gdpr         = document.getElementById('webinar-gdpr')?.checked;

        if (!firstName || !lastName || !phone || !email || !agency || !country || !state || !howHeard) {
          App.utils.showToast('Please fill in all required fields.', 'error');
          if (btn) { btn.disabled = false; btn.textContent = 'Register Now'; }
          return;
        }
        if (!gdpr) {
          App.utils.showToast('Please accept the data protection policy to continue.', 'error');
          if (btn) { btn.disabled = false; btn.textContent = 'Register Now'; }
          return;
        }
        if (howHeard === 'agent' && !referrerName) {
          App.utils.showToast('Please enter the name of the agent who referred you.', 'error');
          if (btn) { btn.disabled = false; btn.textContent = 'Register Now'; }
          return;
        }

        // ---- Resolve referral link context (agent who shared the link) ----
        const refCode = sessionStorage.getItem('referralCode');
        let agentReferralCode = null;
        let agentReferrerId   = null;
        let agentReferrerName = null;
        let agentReferrerRole = null;

        if (refCode) {
          // Try demoData first (fast, sync)
          if (App.demoMode && App.demoData && App.demoData.users) {
            const ref = App.demoData.users.find(u => u.referralCode === refCode);
            if (ref) {
              agentReferralCode = ref.referralCode;
              agentReferrerId   = ref.id;
              agentReferrerName = `${ref.firstName} ${ref.lastName}`;
              agentReferrerRole = ref.role;
            }
          } else if (!App.demoMode && App.db) {
            // Live Firestore lookup
            try {
              const snap = await App.db.collection('users')
                .where('referralCode', '==', refCode)
                .limit(1)
                .get();
              if (!snap.empty) {
                const doc = snap.docs[0];
                agentReferralCode = doc.data().referralCode;
                agentReferrerId   = doc.id;
                agentReferrerName = `${doc.data().firstName} ${doc.data().lastName}`;
                agentReferrerRole = doc.data().role;
              }
            } catch (lookupErr) {
              console.warn('[Webinar] Agent referral lookup failed:', lookupErr);
            }
          }
          console.log('[Webinar] Referral context:', agentReferrerName || 'not found', '/', refCode);
        }
        // ---------------------------------------------------------------

        await App.auth.saveWebinarRegistration({
          firstName, lastName, phone, email, agency, country, state,
          howHeard,
          referrerName: howHeard === 'agent' ? referrerName : '',
          webinar: 'Beyond Borders',
          webinarDate: '2026-08-28',
          gdprConsent: true,
          // Referral link tracking — populated when visitor arrived via agent's link
          referralCode:     agentReferralCode || null,
          referrerId:       agentReferrerId   || null,
          agentReferrerName: agentReferrerName || null,
          agentReferrerRole: agentReferrerRole || null,
          source:           agentReferralCode ? 'referral' : 'direct'
        });

        // Show success panel
        const successPanel = document.getElementById('webinar-success-panel');
        const formPanel    = document.getElementById('webinar-form-panel');
        if (successPanel && formPanel) {
          formPanel.style.display = 'none';
          successPanel.style.display = 'flex';
        } else {
          App.utils.showToast('🎉 You are registered! See you on August 28th.', 'success');
          form.reset();
        }

      } catch (err) {
        console.error('[Webinar] Registration error:', err);
        App.utils.showToast('Error submitting registration: ' + err.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Register Now'; }
      }
    });
  }

};
