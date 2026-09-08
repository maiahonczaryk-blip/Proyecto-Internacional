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
      
      // Hardcoded partner fallbacks
      if (refCode === 'UCI') return { firstName: 'UCI', lastName: '', role: 'partner' };
      if (refCode === 'Fuster & Associates') return { firstName: 'Fuster', lastName: '& Associates', role: 'partner' };
      if (refCode === 'Inmomás Holidays') return { firstName: 'Inmomás', lastName: 'Holidays', role: 'partner' };

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

      // Update welcome message and form texts based on referrer role
      const formTitle = document.getElementById('referral-form-title');
      const submitBtn = document.getElementById('referral-submit-btn');

      if (referrer.role === 'realtor' || referrer.role === 'broker') {
        if (formTitle) formTitle.innerHTML = `<span class="lang-en">Register for the Next Webinar</span><span class="lang-es">Regístrate para el Próximo Webinario</span><span class="lang-fr">S'inscrire au Prochain Webinaire</span><span class="lang-en-ca">Register for the Next Webinar</span>`;
        if (welcomeMsg) {
          welcomeMsg.innerHTML = `<span class="lang-en">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Register to receive notifications and info about our next webinar.</span>
                                  <span class="lang-es">Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>. Regístrate para recibir notificaciones e info sobre nuestro próximo webinario.</span>
                                  <span class="lang-fr">Vous avez été parrainé par <strong>${referrer.firstName} ${referrer.lastName}</strong>. Inscrivez-vous pour recevoir des notifications et des infos sur notre prochain webinaire.</span>
                                  <span class="lang-en-ca">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Register to receive notifications and info about our next webinar.</span>`;
        }
        if (submitBtn) submitBtn.innerHTML = `<span class="lang-en">Register</span><span class="lang-es">Registrarme</span><span class="lang-fr">S'inscrire</span><span class="lang-en-ca">Register</span>`;
      } else {
        if (formTitle) formTitle.innerHTML = `<span class="lang-en">Register</span><span class="lang-es">Regístrate</span><span class="lang-fr">S'inscrire</span><span class="lang-en-ca">Register</span>`;
        if (welcomeMsg) {
          welcomeMsg.innerHTML = `<span class="lang-en">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Please fill out the form below to register.</span>
                                  <span class="lang-es">Has sido referido por <strong>${referrer.firstName} ${referrer.lastName}</strong>. Completa el formulario para registrarte.</span>
                                  <span class="lang-fr">Vous avez été parrainé par <strong>${referrer.firstName} ${referrer.lastName}</strong>. Veuillez remplir le formulaire ci-dessous pour vous inscrire.</span>
                                  <span class="lang-en-ca">You've been referred by <strong>${referrer.firstName} ${referrer.lastName}</strong>. Please fill out the form below to register.</span>`;
        }
        if (submitBtn) submitBtn.innerHTML = `<span class="lang-en">Submit</span><span class="lang-es">Enviar</span><span class="lang-fr">Soumettre</span><span class="lang-en-ca">Submit</span>`;
      }

      // Build type options
      let availableTypes = ['client'];
      if (referrer.role === 'broker') {
        availableTypes = ['client', 'realtor'];
      } else if (referrer.role === 'agent_inmomas' || referrer.role === 'colaborador' || referrer.role === 'admin' || referrer.role === 'partner') {
        availableTypes = referrer.role === 'admin' 
          ? ['client', 'realtor', 'broker', 'agent_inmomas', 'colaborador']
          : ['client', 'realtor', 'broker'];
      }

      const typeConfig = {
        client: { icon: '👤', labelEn: 'Client', labelEs: 'Cliente', labelFr: 'Client', labelEnCa: 'Client' },
        realtor: { icon: '🏠', labelEn: 'Realtor', labelEs: 'Realtor', labelFr: 'Realtor', labelEnCa: 'Realtor' },
        broker: { icon: '🏢', labelEn: 'Broker', labelEs: 'Broker', labelFr: 'Courtier', labelEnCa: 'Broker' },
        agent_inmomas: { icon: '🇪🇸', labelEn: 'RE/MAX Inmomás Agent', labelEs: 'Agente RE/MAX Inmomás', labelFr: 'Agent RE/MAX Inmomás', labelEnCa: 'RE/MAX Inmomás Agent' },
        colaborador: { icon: '🤝', labelEn: 'Collaborator', labelEs: 'Colaborador', labelFr: 'Collaborateur', labelEnCa: 'Collaborator' }
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
              } else if (referrer.role === 'colaborador') {
                clientPayload.referredBy = referrer.id;
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
                webinarDate: 'August 28, 2026'
              };
            }
          }
          if (hasConsent && webinarPayload) {
            if (referrer) {
              webinarPayload.agentReferrerId = referrer.id;
              webinarPayload.referralCode = referrer.referralCode;
            }
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
     DYNAMIC WEBINAR CONTENT & REGISTRATION
     B2B (Realtors & Brokers) ⟷ B2C (Buyers & Investors)
     ============================================ */
  renderWebinarDynamicContent: async function() {
    try {
      const settings = (App.auth && App.auth.getWebinarSettings)
        ? await App.auth.getWebinarSettings()
        : (App.auth && App.auth.getDefaultWebinarSettings ? App.auth.getDefaultWebinarSettings() : null);

      if (!settings) return;

      const activeType = settings.activeType || 'b2c';
      const config = settings[activeType] || settings.b2c || {};
      const dateStr = settings.date || config.date || '2026-09-18';
      const timeStr = settings.time || config.time || '12:00';
      const spots = settings.spotsAvailable || config.spots || 25;

      // ── Date Formatting ──
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

      const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthsEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      const monthsFr = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

      const daysEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const daysEs = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const daysFr = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

      const dayOfWeek = dateObj.getUTCDay();
      const monthIndex = dateObj.getUTCMonth();
      const dayNum = dateObj.getUTCDate();
      const yearNum = dateObj.getUTCFullYear();

      const formattedDateEn = `${monthsEn[monthIndex]} ${dayNum}, ${yearNum}`;
      const formattedDateEs = `${dayNum} de ${monthsEs[monthIndex]}, ${yearNum}`;
      const formattedDateFr = `${dayNum} ${monthsFr[monthIndex]} ${yearNum}`;

      const dayDateEn = `${daysEn[dayOfWeek]}, ${monthsEn[monthIndex]} ${dayNum}, ${yearNum}`;
      const dayDateEs = `${daysEs[dayOfWeek]}, ${dayNum} de ${monthsEs[monthIndex]} de ${yearNum}`;
      const dayDateFr = `${daysFr[dayOfWeek]} ${dayNum} ${monthsFr[monthIndex]} ${yearNum}`;

      // ── Timezone Conversions ──
      const [hourRef, minRef] = timeStr.split(':').map(Number);
      function formatTime12(h, min) {
        const period = h >= 12 ? 'PM' : 'AM';
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        const displayM = min === 0 ? ':00' : `:${String(min).padStart(2, '0')}`;
        return `${displayH}${displayM} ${period}`;
      }

      const pdtTime = formatTime12((hourRef - 3 + 24) % 24, minRef);
      const mdtTime = formatTime12((hourRef - 2 + 24) % 24, minRef);
      const cdtTime = formatTime12((hourRef - 1 + 24) % 24, minRef);
      const edtTime = formatTime12(hourRef, minRef);
      const adtTime = formatTime12((hourRef + 1) % 24, minRef);
      const cestTime = formatTime12((hourRef + 6) % 24, minRef);
      const cestHour24 = (hourRef + 6) % 24;
      const cestTime24 = minRef === 0 ? `${cestHour24} h` : `${cestHour24}:${String(minRef).padStart(2, '0')} h`;

      const isB2C = activeType === 'b2c';

      // ── Apply Theme Classes on Containers ──
      const webinarViewEl = document.getElementById('view-webinar-register');
      if (webinarViewEl) {
        webinarViewEl.classList.remove('webinar-theme--b2b', 'webinar-theme--b2c');
        webinarViewEl.classList.add('webinar-theme--' + activeType);
      }

      const topBannerEl = document.getElementById('webinar-top-banner');
      if (topBannerEl) {
        topBannerEl.classList.remove('webinar-theme--b2b', 'webinar-theme--b2c');
        topBannerEl.classList.add('webinar-theme--' + activeType);
        topBannerEl.style.background = isB2C
          ? 'linear-gradient(90deg, #051329 0%, #0284c7 35%, #ea580c 70%, #051329 100%)'
          : 'linear-gradient(90deg, #04081a 0%, #003f99 35%, #880000 65%, #04081a 100%)';
      }

      const topBannerBtn = document.getElementById('webinar-top-banner-btn');
      if (topBannerBtn) {
        topBannerBtn.style.background = isB2C ? '#fef08a' : '#ffffff';
        topBannerBtn.style.color = isB2C ? '#7c2d12' : '#003f99';
        topBannerBtn.style.boxShadow = isB2C ? '0 2px 14px rgba(245,158,11,.4)' : 'none';
      }

      // ── Section & Ambient Glow Orbs Styling ──
      const sectionEl = document.getElementById('webinar-section');
      if (sectionEl) {
        sectionEl.style.background = isB2C
          ? 'linear-gradient(160deg, #040d1e 0%, #09203c 28%, #0d3b66 58%, #20132a 100%)'
          : 'linear-gradient(160deg, #030718 0%, #061530 35%, #0e051c 70%, #030718 100%)';
      }

      const orb1 = document.getElementById('webinar-orb-1');
      const orb2 = document.getElementById('webinar-orb-2');
      const orb3 = document.getElementById('webinar-orb-3');
      if (orb1) orb1.style.background = isB2C ? 'radial-gradient(circle, rgba(245,158,11,.32) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0,63,153,.28) 0%, transparent 70%)';
      if (orb2) orb2.style.background = isB2C ? 'radial-gradient(circle, rgba(234,88,12,.25) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(204,0,0,.16) 0%, transparent 70%)';
      if (orb3) orb3.style.background = isB2C ? 'radial-gradient(ellipse, rgba(14,165,233,.30) 0%, transparent 70%)' : 'radial-gradient(ellipse, rgba(0,63,153,.15) 0%, transparent 70%)';

      const topBandWrap = document.getElementById('webinar-top-announcement-band-wrap');
      if (topBandWrap) {
        topBandWrap.style.background = isB2C
          ? 'linear-gradient(90deg, #b45309 0%, #ea580c 25%, #0284c7 65%, #b45309 100%)'
          : 'linear-gradient(90deg, #cc0000 0%, #003f99 50%, #cc0000 100%)';
      }

      // ── 1. Top Fixed Announcement Banner (#webinar-top-banner) ──
      const bannerTextEl = document.getElementById('webinar-top-banner-text');
      if (bannerTextEl && config.titlePrefix && config.titleHighlight) {
        const targetDescEn = activeType === 'b2b' ? 'Free for Agents & Brokers' : 'Free for Buyers & Investors';
        const targetDescEs = activeType === 'b2b' ? 'Gratuito para Agentes y Brokers' : 'Gratuito para Compradores e Inversores';
        const targetDescFr = activeType === 'b2b' ? 'Gratuit pour Agents & Courtiers' : 'Gratuit pour Acheteurs & Investisseurs';

        bannerTextEl.innerHTML = `
          <span class="lang-en">🎙️ <strong>${config.titlePrefix.en} ${config.titleHighlight.en}</strong> &nbsp;&middot;&nbsp; ${monthsEn[monthIndex]} ${dayNum} &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime} Spain &nbsp;&middot;&nbsp; ${targetDescEn}</span>
          <span class="lang-es">🎙️ <strong>${config.titlePrefix.es} ${config.titleHighlight.es}</strong> &nbsp;&middot;&nbsp; ${dayNum} de ${monthsEs[monthIndex]} &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime24} España &nbsp;&middot;&nbsp; ${targetDescEs}</span>
          <span class="lang-fr">🎙️ <strong>${config.titlePrefix.fr} ${config.titleHighlight.fr}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsFr[monthIndex]} &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime24} Espagne &nbsp;&middot;&nbsp; ${targetDescFr}</span>
          <span class="lang-en-ca">🎙️ <strong>${config.titlePrefix['en-ca'] || config.titlePrefix.en} ${config.titleHighlight['en-ca'] || config.titleHighlight.en}</strong> &nbsp;&middot;&nbsp; ${monthsEn[monthIndex]} ${dayNum} &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime} Spain &nbsp;&middot;&nbsp; ${targetDescEn}</span>
        `;
      }

      const bannerSpotsEl = document.getElementById('webinar-top-banner-spots');
      if (bannerSpotsEl) {
        bannerSpotsEl.innerHTML = `
          🔥
          <span class="lang-en">${spots} spots only</span>
          <span class="lang-es">Solo ${spots} plazas</span>
          <span class="lang-fr">${spots} places seulement</span>
          <span class="lang-en-ca">${spots} spots only</span>
        `;
      }

      // ── 2. Top Hero Announcement Band ──
      const topBandEl = document.getElementById('webinar-top-announcement-band');
      if (topBandEl && config.badge) {
        topBandEl.innerHTML = `
          <span class="lang-en">🔴 LIVE WEBINAR &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Exclusive Masterclass for US, Canadian & PR Realtors' : 'Living, Moving & Investing in Spain'} &nbsp;&middot;&nbsp; ${formattedDateEn} &nbsp;&middot;&nbsp; FREE Registration</span>
          <span class="lang-es">🔴 WEBINAR EN VIVO &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Masterclass Exclusiva para Agentes y Brokers de EE.UU., Canadá y PR' : 'Vivir, Mudarse e Invertir en España'} &nbsp;&middot;&nbsp; ${formattedDateEs} &nbsp;&middot;&nbsp; Registro GRATUITO</span>
          <span class="lang-fr">🔴 WEBINAIRE EN DIRECT &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Masterclass Exclusive pour Courtiers et Agents' : 'Vivre et Investir en Espagne'} &nbsp;&middot;&nbsp; ${formattedDateFr} &nbsp;&middot;&nbsp; Inscription GRATUITE</span>
          <span class="lang-en-ca">🔴 LIVE WEBINAR &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Exclusive Masterclass for North American Realtors' : 'Living, Moving & Investing in Spain'} &nbsp;&middot;&nbsp; ${formattedDateEn} &nbsp;&middot;&nbsp; FREE Registration</span>
        `;
      }

      // ── 3. Hero Label Pill ──
      const heroPillWrap = document.getElementById('webinar-hero-pill-wrap');
      if (heroPillWrap) {
        heroPillWrap.style.background = isB2C ? 'rgba(245,158,11,.12)' : 'rgba(255,255,255,.07)';
        heroPillWrap.style.border = isB2C ? '1.5px solid rgba(245,158,11,.45)' : '1px solid rgba(255,255,255,.15)';
        heroPillWrap.style.boxShadow = isB2C ? '0 0 24px rgba(245,158,11,.22)' : 'none';
      }

      const heroPillEl = document.getElementById('webinar-hero-pill');
      if (heroPillEl && config.heroPill) {
        heroPillEl.style.color = isB2C ? '#fef08a' : 'rgba(255,255,255,.85)';
        heroPillEl.innerHTML = `
          <span class="lang-en">${config.heroPill.en}</span>
          <span class="lang-es">${config.heroPill.es}</span>
          <span class="lang-fr">${config.heroPill.fr}</span>
          <span class="lang-en-ca">${config.heroPill['en-ca'] || config.heroPill.en}</span>
        `;
      }

      // ── 4. Hero Main Titles & Highlight Gradients ──
      const setPrefixHighlight = (lang, prefix, highlight) => {
        const pEl = document.getElementById(`webinar-title-prefix-${lang}`);
        const hEl = document.getElementById(`webinar-title-highlight-${lang}`);
        if (pEl && prefix) pEl.textContent = prefix;
        if (hEl && highlight) {
          hEl.textContent = highlight;
          hEl.style.background = isB2C
            ? 'linear-gradient(90deg, #fbbf24 0%, #f97316 45%, #38bdf8 100%)'
            : 'linear-gradient(90deg, #5badff 0%, #cc0000 50%, #ff8c42 100%)';
          hEl.style.webkitBackgroundClip = 'text';
          hEl.style.webkitTextFillColor = 'transparent';
          hEl.style.backgroundClip = 'text';
        }
      };
      if (config.titlePrefix && config.titleHighlight) {
        setPrefixHighlight('en', config.titlePrefix.en, config.titleHighlight.en);
        setPrefixHighlight('es', config.titlePrefix.es, config.titleHighlight.es);
        setPrefixHighlight('fr', config.titlePrefix.fr, config.titleHighlight.fr);
        setPrefixHighlight('en-ca', config.titlePrefix['en-ca'] || config.titlePrefix.en, config.titleHighlight['en-ca'] || config.titleHighlight.en);
      }

      // ── 5. Hero Subtitle ──
      const heroSubEl = document.getElementById('webinar-hero-subtitle');
      if (heroSubEl && config.subtitleText) {
        heroSubEl.innerHTML = `
          <span class="lang-en">${config.subtitleText.en}</span>
          <span class="lang-es">${config.subtitleText.es}</span>
          <span class="lang-fr">${config.subtitleText.fr}</span>
          <span class="lang-en-ca">${config.subtitleText['en-ca'] || config.subtitleText.en}</span>
        `;
      }

      // ── 6. Hero Spots Urgency Pill ──
      const heroSpotsEl = document.getElementById('webinar-hero-spots-pill');
      if (heroSpotsEl) {
        heroSpotsEl.style.background = isB2C ? 'rgba(255,180,0,.18)' : 'rgba(255,180,0,.12)';
        heroSpotsEl.style.border = isB2C ? '1px solid rgba(255,180,0,.5)' : '1px solid rgba(255,180,0,.35)';
        heroSpotsEl.style.color = isB2C ? '#fef08a' : '#ffe066';
        heroSpotsEl.style.boxShadow = isB2C ? '0 0 16px rgba(245,158,11,.25)' : 'none';
        heroSpotsEl.innerHTML = `
          🔥
          <span class="lang-en">Only ${spots} spots available</span>
          <span class="lang-es">Solo ${spots} plazas disponibles</span>
          <span class="lang-fr">Seulement ${spots} places disponibles</span>
          <span class="lang-en-ca">Only ${spots} spots available</span>
        `;
      }

      // ── 7. Timezone Date & Hours ──
      const tzDateEl = document.getElementById('webinar-tz-date-label');
      if (tzDateEl) {
        tzDateEl.innerHTML = `
          📅
          <span class="lang-en">${dayDateEn} &mdash; Your Local Time</span>
          <span class="lang-es">${dayDateEs} &mdash; Tu hora local</span>
          <span class="lang-fr">${dayDateFr} &mdash; Votre heure locale</span>
          <span class="lang-en-ca">${dayDateEn} &mdash; Your Local Time</span>
        `;
      }

      const setTzText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setTzText('webinar-time-pdt', pdtTime);
      setTzText('webinar-time-mdt', mdtTime);
      setTzText('webinar-time-cdt', cdtTime);
      setTzText('webinar-time-edt', edtTime);
      setTzText('webinar-time-adt', adtTime);
      setTzText('webinar-time-cest', cestTime);

      const refCard = document.getElementById('webinar-reference-card');
      if (refCard) {
        refCard.style.background = isB2C
          ? 'linear-gradient(135deg, rgba(234,88,12,.35), rgba(245,158,11,.22))'
          : 'linear-gradient(135deg, rgba(0,63,153,.45), rgba(0,85,204,.28))';
        refCard.style.border = isB2C ? '2px solid rgba(251,191,36,.6)' : '2px solid rgba(91,173,255,.45)';
        refCard.style.boxShadow = isB2C ? '0 0 35px rgba(245,158,11,.3)' : '0 0 28px rgba(0,63,153,.35)';
      }

      const refBadge = document.getElementById('webinar-reference-badge');
      if (refBadge) {
        refBadge.style.background = isB2C ? 'linear-gradient(90deg, #d97706, #ea580c)' : 'linear-gradient(90deg, #003f99, #0055cc)';
        refBadge.style.boxShadow = isB2C ? '0 2px 10px rgba(234,88,12,.4)' : 'none';
      }

      // ── 8. What You'll Learn Section ──
      const headlineEl = document.getElementById('webinar-section-headline');
      if (headlineEl && config.sectionHeadline) {
        headlineEl.innerHTML = `
          <span class="lang-en">${config.sectionHeadline.en}</span>
          <span class="lang-es">${config.sectionHeadline.es}</span>
          <span class="lang-fr">${config.sectionHeadline.fr}</span>
          <span class="lang-en-ca">${config.sectionHeadline['en-ca'] || config.sectionHeadline.en}</span>
        `;
      }

      const subheadlineEl = document.getElementById('webinar-section-subheadline');
      if (subheadlineEl && config.sectionSubheadline) {
        subheadlineEl.innerHTML = `
          <span class="lang-en">${config.sectionSubheadline.en}</span>
          <span class="lang-es">${config.sectionSubheadline.es}</span>
          <span class="lang-fr">${config.sectionSubheadline.fr}</span>
          <span class="lang-en-ca">${config.sectionSubheadline['en-ca'] || config.sectionSubheadline.en}</span>
        `;
      }

      const hoverBorderColor = isB2C ? 'rgba(251,191,36,.35)' : 'rgba(91,173,255,.3)';
      const benefitsContainer = document.getElementById('webinar-benefits-container');
      if (benefitsContainer && Array.isArray(config.benefits)) {
        benefitsContainer.innerHTML = config.benefits.map(b => `
          <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px;display:flex;gap:14px;align-items:flex-start;transition:transform .2s,border-color .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.borderColor='${hoverBorderColor}';this.style.boxShadow='0 8px 24px rgba(0,0,0,.25)';" onmouseout="this.style.transform='';this.style.borderColor='rgba(255,255,255,.08)';this.style.boxShadow='none';">
            <div style="font-size:1.8rem;flex-shrink:0;">${b.icon || '✨'}</div>
            <div>
              <div style="font-weight:700;color:#fff;font-size:.92rem;margin-bottom:5px;">
                <span class="lang-en">${b.title?.en || ''}</span>
                <span class="lang-es">${b.title?.es || ''}</span>
                <span class="lang-fr">${b.title?.fr || ''}</span>
                <span class="lang-en-ca">${b.title?.['en-ca'] || b.title?.en || ''}</span>
              </div>
              <div style="color:rgba(255,255,255,.42);font-size:.8rem;line-height:1.55;">
                <span class="lang-en">${b.desc?.en || ''}</span>
                <span class="lang-es">${b.desc?.es || ''}</span>
                <span class="lang-fr">${b.desc?.fr || ''}</span>
                <span class="lang-en-ca">${b.desc?.['en-ca'] || b.desc?.en || ''}</span>
              </div>
            </div>
          </div>
        `).join('');
      }

      // ── Urgency CTA Bar & Button ──
      const urgencyBar = document.getElementById('webinar-urgency-bar');
      if (urgencyBar) {
        urgencyBar.style.background = isB2C
          ? 'linear-gradient(135deg, rgba(245,158,11,.18), rgba(2,132,199,.24))'
          : 'linear-gradient(135deg, rgba(204,0,0,.15), rgba(0,63,153,.25))';
        urgencyBar.style.border = isB2C ? '1px solid rgba(251,191,36,.35)' : '1px solid rgba(255,255,255,.12)';
        urgencyBar.style.boxShadow = isB2C ? '0 10px 35px rgba(245,158,11,.15)' : 'none';
      }

      const urgencyBtn = document.getElementById('webinar-urgency-btn');
      if (urgencyBtn) {
        urgencyBtn.style.background = isB2C
          ? 'linear-gradient(135deg, #ea580c 0%, #f97316 40%, #e11d48 100%)'
          : 'linear-gradient(135deg, #003f99 0%, #cc0000 100%)';
        urgencyBtn.style.boxShadow = isB2C ? '0 8px 32px rgba(234,88,12,.5)' : '0 6px 28px rgba(0,63,153,.35)';
      }

      // ── 9. Form Card Header, Inputs & Submit Button ──
      const cardHeader = document.getElementById('webinar-card-header');
      if (cardHeader) {
        cardHeader.style.background = isB2C
          ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 35%, #d97706 75%, #ea580c 115%)'
          : 'linear-gradient(135deg, #003f99 0%, #004ab5 40%, #880000 130%)';
      }

      const cardHeaderTitle = document.getElementById('webinar-card-header-title');
      if (cardHeaderTitle && config.titlePrefix && config.titleHighlight) {
        cardHeaderTitle.textContent = `${config.titlePrefix.en} ${config.titleHighlight.en} · ${formattedDateEn}`;
      }

      const cardHeaderSubtitle = document.getElementById('webinar-card-header-subtitle');
      if (cardHeaderSubtitle) {
        cardHeaderSubtitle.textContent = `${edtTime} EDT | ${cestTime} Spain`;
      }

      const submitBtn = document.getElementById('webinar-submit-btn');
      if (submitBtn) {
        submitBtn.style.background = isB2C
          ? 'linear-gradient(135deg, #ea580c 0%, #f97316 40%, #e11d48 100%)'
          : 'linear-gradient(135deg, #003f99 0%, #cc0000 100%)';
        submitBtn.style.boxShadow = isB2C ? '0 8px 30px rgba(234,88,12,.45)' : '0 6px 28px rgba(0,63,153,.35)';
      }

      const agencyLabel = document.getElementById('webinar-agency-label');
      if (agencyLabel && config.organizationLabel) {
        agencyLabel.innerHTML = `
          <span class="lang-en">${config.organizationLabel.en}</span>
          <span class="lang-es">${config.organizationLabel.es}</span>
          <span class="lang-fr">${config.organizationLabel.fr}</span>
          <span class="lang-en-ca">${config.organizationLabel['en-ca'] || config.organizationLabel.en}</span>
        `;
      }

      const agencyInput = document.getElementById('webinar-agency');
      if (agencyInput && config.organizationPlaceholder) {
        agencyInput.placeholder = config.organizationPlaceholder;
      }

      // ── 10. Referral View info checkbox texts ──
      const refWebinarDetails = document.getElementById('webinar-info-details');
      if (refWebinarDetails && config.titlePrefix && config.titleHighlight) {
        refWebinarDetails.innerHTML = `
          <span class="lang-en">Join the "${config.titlePrefix.en} ${config.titleHighlight.en}" live webinar on ${formattedDateEn}. ${config.subtitleText?.en || ''}</span>
          <span class="lang-es">Únete al webinar en vivo "${config.titlePrefix.es} ${config.titleHighlight.es}" el ${formattedDateEs}. ${config.subtitleText?.es || ''}</span>
          <span class="lang-fr">Rejoignez le webinaire en direct "${config.titlePrefix.fr} ${config.titleHighlight.fr}" le ${formattedDateFr}. ${config.subtitleText?.fr || ''}</span>
          <span class="lang-en-ca">Join the "${config.titlePrefix['en-ca'] || config.titlePrefix.en} ${config.titleHighlight['en-ca'] || config.titleHighlight.en}" live webinar on ${formattedDateEn}. ${config.subtitleText?.['en-ca'] || config.subtitleText?.en || ''}</span>
        `;
      }

      // ── 11. Live Countdown Timer ──
      if (window._webinarCountdownInterval) {
        clearInterval(window._webinarCountdownInterval);
        window._webinarCountdownInterval = null;
      }

      const countdownEl = document.getElementById('webinar-countdown');
      if (countdownEl) {
        const targetDate = new Date(`${dateStr}T${timeStr}:00-04:00`);
        function tick() {
          const now = new Date();
          const diff = targetDate - now;
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
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Days</span><span class="lang-es">Días</span><span class="lang-fr">Jours</span><span class="lang-en-ca">Days</span></div>
              </div>
              <div style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
              <div style="text-align:center;min-width:52px;">
                <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(h)}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Hours</span><span class="lang-es">Horas</span><span class="lang-fr">Heures</span><span class="lang-en-ca">Hours</span></div>
              </div>
              <div style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
              <div style="text-align:center;min-width:52px;">
                <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(m)}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Min</span><span class="lang-es">Min</span><span class="lang-fr">Min</span><span class="lang-en-ca">Min</span></div>
              </div>
              <div style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
              <div style="text-align:center;min-width:52px;">
                <div style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(s)}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Sec</span><span class="lang-es">Seg</span><span class="lang-fr">Sec</span><span class="lang-en-ca">Sec</span></div>
              </div>
            </div>`;
        }
        tick();
        window._webinarCountdownInterval = setInterval(tick, 1000);
      }

    } catch (err) {
      console.warn('[Webinar] Error rendering dynamic webinar content:', err);
    }
  },

  /* ============================================
     WEBINAR REGISTRATION FORM CONTROLLER
     ============================================ */
  initWebinarRegister: async function() {
    // Render dynamic content immediately
    await this.renderWebinarDynamicContent();

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
    // ---- Puerto Rico Areas ----
    const PR_AREAS = [
      'San Juan Metro', 'Bayamón / Guaynabo', 'Carolina / Isla Verde', 'Dorado / Vega Alta',
      'Ponce / South Coast', 'Mayagüez / West Coast', 'Rincón / Aguadilla', 'Caguas / Central',
      'Humacao / Palmas del Mar', 'Other Puerto Rico'
    ];

    // ---- Country → State/Province dynamic list ----
    const countrySelect = document.getElementById('webinar-country');
    const stateSelect   = document.getElementById('webinar-state');

    function populateStates(country) {
      if (!stateSelect) return;
      if (country === 'Canada') {
        stateSelect.innerHTML = `<option value="">— Select Province / Territory —</option>` +
          CA_PROVINCES.map(s => `<option value="${s}">${s}</option>`).join('');
      } else if (country === 'Puerto Rico') {
        stateSelect.innerHTML = `<option value="">— Select Region / Municipality —</option>` +
          PR_AREAS.map(s => `<option value="${s}">${s}</option>`).join('');
      } else if (country === 'Other') {
        stateSelect.innerHTML = `<option value="International">International</option>`;
      } else {
        stateSelect.innerHTML = `<option value="">— Select State —</option>` +
          US_STATES.map(s => `<option value="${s}">${s}</option>`).join('');
      }
    }

    if (countrySelect && stateSelect) {
      populateStates(countrySelect.value || 'United States');
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
          App.utils.showToast('Please enter or select the name of the referring agent.', 'error');
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
          if (App.demoMode && App.demoData && App.demoData.users) {
            const ref = App.demoData.users.find(u => u.referralCode === refCode);
            if (ref) {
              agentReferralCode = ref.referralCode;
              agentReferrerId   = ref.id;
              agentReferrerName = `${ref.firstName} ${ref.lastName}`;
              agentReferrerRole = ref.role;
            }
          } else if (!App.demoMode && App.db) {
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
        }

        // ---- Get Current Active Webinar Settings ----
        const settings = (App.auth && App.auth.getWebinarSettings)
          ? await App.auth.getWebinarSettings()
          : (App.auth && App.auth.getDefaultWebinarSettings ? App.auth.getDefaultWebinarSettings() : null);

        const activeType = settings?.activeType || 'b2c';
        const typeConfig = settings ? (settings[activeType] || settings.b2c) : null;
        const webinarTitle = typeConfig?.title || (activeType === 'b2b' ? 'Beyond Borders' : 'Spain Unlocked');
        const webinarDate = settings?.date || typeConfig?.date || '2026-09-18';

        await App.auth.saveWebinarRegistration({
          firstName, lastName, phone, email, agency, country, state,
          howHeard,
          referrerName: howHeard === 'agent' ? referrerName : '',
          webinar: webinarTitle,
          webinarType: activeType.toUpperCase(),
          webinarDate: webinarDate,
          gdprConsent: true,
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
          App.utils.showToast(`🎉 You are registered! See you on ${webinarDate}.`, 'success');
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

// Auto-render webinar dynamic content on page initialization
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (App.views && App.views.public && typeof App.views.public.renderWebinarDynamicContent === 'function') {
      App.views.public.renderWebinarDynamicContent();
    }
  });
}

