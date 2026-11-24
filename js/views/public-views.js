/* ============================================
   RE/MAX Inmomás — Public Views (Referral + Intake + Webinar)
   ============================================ */
App.views = App.views || {};
App.views.public = {

  /* ============================================
     PARTNER BRANDING HELPER (Name, Agency & Logo)
     ============================================ */
  renderPartnerBranding: function(ref, prefix) {
    const card = document.getElementById(`${prefix}-partner-branding`);
    const logoWrap = document.getElementById(`${prefix}-partner-logo-wrap`);
    const logoImg = document.getElementById(`${prefix}-partner-logo`);
    const attrEl = document.getElementById(`${prefix}-partner-attribution`);
    if (!card || !attrEl) return;

    if (!ref) {
      card.style.display = 'none';
      return;
    }

    const fullName = [ref.firstName, ref.lastName].filter(Boolean).join(' ').trim();
    const agency = (ref.agencyName || ref.brokerNameManual || '').trim();
    const logoUrl = ref.agencyLogo || '';

    if (logoWrap && logoImg) {
      if (logoUrl) {
        logoImg.src = logoUrl;
        logoImg.alt = agency || fullName || 'Agency Logo';
        logoWrap.style.display = 'flex';
      } else {
        logoImg.src = '';
        logoWrap.style.display = 'none';
      }
    }

    const showAgency = agency && agency.toLowerCase() !== fullName.toLowerCase();
    attrEl.innerHTML = `
      <div style="font-weight: 600; color: var(--text-primary); font-size: 0.96rem;">
        <span class="lang-en">Personalized link of <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-es">Enlace personalizado de <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-fr">Lien personnalisé de <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-en-ca">Personalized link of <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-fr-eu">Lien partenaire personnalisé de <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-nl">Persoonlijke verwijzingslink van <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-sv">Personlig partnerlänk från <strong>${App.utils.escapeHtml(fullName)}</strong></span>
        <span class="lang-bg">Персонален партньорски линк на <strong>${App.utils.escapeHtml(fullName)}</strong></span>
      </div>
      ${showAgency ? `
      <div style="margin-top: 4px; font-size: 0.88rem; color: var(--text-secondary);">
        <span class="lang-en">Belongs to agency: <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-es">Pertenece a la agencia: <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-fr">Appartient à l'agence : <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-en-ca">Belongs to agency: <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-fr-eu">Cabinet / Agence : <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-nl">Aangesloten kantoor: <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-sv">Tillhör byrå: <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
        <span class="lang-bg">Агенция / Компания: <strong style="color: var(--primary);">${App.utils.escapeHtml(agency)}</strong></span>
      </div>
      ` : ''}
    `;
    card.style.display = 'block';
  },

  /* ============================================
     INTAKE FORM (Client Portal)
     ============================================ */
  initIntake: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const welcomeMsg = document.getElementById('intake-welcome-msg');

    const applyIntakeReferrer = (referrer) => {
      if (!referrer) return;
      App.views.public.renderPartnerBranding(referrer, 'intake');
      const rName = `${App.utils.escapeHtml(referrer.firstName || '')} ${App.utils.escapeHtml(referrer.lastName || '')}`.trim();
      if (welcomeMsg && rName) {
        welcomeMsg.innerHTML = `<span class="lang-en">Welcome! You've been referred by <strong>${rName}</strong>.</span>
                                <span class="lang-es">¡Bienvenido! Has sido referido por <strong>${rName}</strong>.</span>
                                <span class="lang-fr">Bienvenue ! Vous êtes recommandé(e) par <strong>${rName}</strong>.</span>
                                <span class="lang-en-ca">Welcome! You've been referred by <strong>${rName}</strong>.</span>
                                <span class="lang-fr-eu">Bienvenue ! Votre dossier est recommandé par <strong>${rName}</strong>.</span>
                                <span class="lang-nl">Welkom! Je bent persoonlijk doorverwezen door <strong>${rName}</strong>.</span>
                                <span class="lang-sv">Välkommen! Du har hänvisats av <strong>${rName}</strong>.</span>
                                <span class="lang-bg">Добре дошли! Вие сте препоръчани от <strong>${rName}</strong>.</span>`;
      }
    };

    if (refCode) {
      if (App.demoData && App.demoData.users) {
        const demoRef = App.demoData.users.find(u => u.referralCode === refCode);
        if (demoRef) {
          const copy = { ...demoRef };
          if (copy.role === 'realtor' && App.utils && App.utils.resolveUserUmbrellaParents) {
            const pBrk = App.utils.resolveUserUmbrellaParents(copy, App.demoData.users).broker;
            if (pBrk) {
              if (pBrk.agencyName) copy.agencyName = pBrk.agencyName;
              copy.agencyLogo = pBrk.agencyLogo || null;
            }
          }
          applyIntakeReferrer(copy);
        }
      }
      if (!App.demoMode && App.db) {
        App.db.collection('users').where('referralCode', '==', refCode).limit(1).get()
          .then(async (snap) => {
            if (snap.empty) return;
            const refData = { id: snap.docs[0].id, ...snap.docs[0].data() };
            if (refData.role === 'realtor' && (refData.brokerId || refData.referredBy)) {
              try {
                let bData = null;
                if (refData.brokerId) {
                  const bDoc = await App.db.collection('users').doc(refData.brokerId).get();
                  if (bDoc.exists && bDoc.data().role === 'broker') bData = bDoc.data();
                }
                if (!bData && refData.referredBy) {
                  const bSnap = await App.db.collection('users').where('referralCode', '==', refData.referredBy).limit(1).get();
                  if (!bSnap.empty && bSnap.docs[0].data().role === 'broker') bData = bSnap.docs[0].data();
                }
                if (bData) {
                  if (bData.agencyName) refData.agencyName = bData.agencyName;
                  refData.agencyLogo = bData.agencyLogo || null;
                }
              } catch (_) {}
            }
            applyIntakeReferrer(refData);
          })
          .catch(() => {});
      }
    }

    const form = document.getElementById('intake-form');
    if (form) {
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const firstName = newForm.querySelector('#intake-firstName').value.trim();
        const lastName = newForm.querySelector('#intake-lastName').value.trim();
        const email = newForm.querySelector('#intake-email').value.trim();
        const phone = newForm.querySelector('#intake-phone').value.trim();
        const country = newForm.querySelector('#intake-currentLocation')?.value.trim() || newForm.querySelector('#intake-country')?.value.trim() || '';
        const targetLoc = newForm.querySelector('#intake-targetLocation')?.value || '';

        if (!firstName || !lastName || !email || !phone) {
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Please fill in all required fields.', 'error');
          }
          return;
        }

        const clientPayload = {
          firstName,
          lastName,
          email,
          phone,
          currentLocation: country,
          budget: '',
          interestArea: targetLoc,
          notes: 'Client portal submission',
          referredBy: refCode || null,
          realtorId: null,
          realtorName: null,
          brokerId: null,
          localAgentId: null,
          localAgentName: null,
          timeline: '',
          objective: ''
        };

        if (refCode && App.demoData && App.demoData.users) {
          const referrer = App.demoData.users.find(u => u.referralCode === refCode);
          if (referrer) {
            clientPayload.referredBy = referrer.id;
            if (referrer.role === 'broker') {
              clientPayload.brokerId = referrer.id;
            } else if (referrer.role === 'realtor') {
              clientPayload.realtorId = referrer.id;
              clientPayload.realtorName = `${referrer.firstName} ${referrer.lastName}`;
              clientPayload.brokerId = referrer.brokerId || null;
            }
          }
        }

        try {
          await App.auth.addReferralClient(clientPayload);
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Registration successful! We\'ll be in touch soon.', 'success');
          }
          sessionStorage.removeItem('referralCode');
          newForm.reset();
          setTimeout(() => App.router.navigateTo('home'), 1500);
        } catch (err) {
          console.error('[Intake] Error registering client:', err);
          if (App.utils && App.utils.showToast) {
            App.utils.showToast('Error submitting registration: ' + err.message, 'error');
          }
        }
      });
    }
  },

  /* ============================================
     REFERRAL FORM
     ============================================ */
  initReferralForm: function() {
    const refCode = sessionStorage.getItem('referralCode');
    const rawRequestedType = sessionStorage.getItem('referralType') || '';
    if (rawRequestedType === 'client') {
      if (refCode) sessionStorage.setItem('webinarReferralCode', refCode);
      sessionStorage.setItem('webinarClientInvite', '1');
      sessionStorage.removeItem('referralType');
      App.router.navigateTo('webinar', true);
      return;
    }

    const welcomeMsg = document.getElementById('referral-welcome-msg');
    const typeSelector = document.getElementById('referral-type-selector');
    const typeSelect = document.getElementById('referral-type-select');
    const form = document.getElementById('referral-form');

    let referrer = null;
    const requestedType = rawRequestedType || 'realtor';
    let selectedType = requestedType;

    // Populate international country options & RE/MAX Inmomás region checkboxes in #referral-professional-fields
    const profCountrySel = document.getElementById('referral-prof-country');
    const masRegionsWrap = document.getElementById('referral-agent-mas-regions-wrap');
    const masRegionsCheckboxes = document.getElementById('referral-agent-mas-regions-checkboxes');
    const inmomasAgentGroup = document.getElementById('referral-inmomas-agent-group');
    const referralInmomasSelect = document.getElementById('referral-inmomas-agent');

    if (referralInmomasSelect && App.utils && typeof App.utils.populateInmomasAgentSelect === 'function') {
      App.utils.populateInmomasAgentSelect(referralInmomasSelect).then(() => {
        if (referrer && !referralInmomasSelect.value) {
          App.utils.matchInmomasAgentOption(referralInmomasSelect, referrer);
        }
      }).catch(() => {});
    }

    if (profCountrySel && App.utils && App.utils.getCountryOptionsHtml) {
      profCountrySel.innerHTML = App.utils.getCountryOptionsHtml('United States', false);
    }
    if (masRegionsCheckboxes && App.utils && App.utils.getRegionsCheckboxesHtml) {
      masRegionsCheckboxes.innerHTML = App.utils.getRegionsCheckboxesHtml('referral-mas-region', ['north_america']);
    }
    if (profCountrySel && masRegionsCheckboxes && App.utils && App.utils.resolveRegionFromCountry) {
      profCountrySel.addEventListener('change', () => {
        const reg = App.utils.resolveRegionFromCountry(profCountrySel.value);
        if (reg) {
          const cb = masRegionsCheckboxes.querySelector(`input[value="${reg}"]`);
          if (cb) cb.checked = true;
        }
      });
    }

    // Toggle which field sections are visible and customize titles/banners
    function updateFieldVisibility(type) {
      const cf = document.getElementById('referral-client-fields');
      const pf = document.getElementById('referral-professional-fields');
      const pwGroup = document.getElementById('referral-password-group');
      const pwInput = document.getElementById('referral-password');
      const banner = document.getElementById('referral-webinar-spotlight-banner');
      const clientBanner = document.getElementById('referral-client-webinar-banner');
      const formTitle = document.getElementById('referral-form-title');
      const welcomeMsg = document.getElementById('referral-welcome-msg');
      const submitBtn = document.getElementById('referral-submit-btn');
      const agencyInp = document.getElementById('referral-agencyName');

      if (cf) cf.style.display = type === 'client' ? '' : 'none';
      if (pf) pf.style.display = type !== 'client' ? '' : 'none';
      if (pwGroup) pwGroup.style.display = type === 'client' ? 'none' : '';
      if (masRegionsWrap) masRegionsWrap.style.display = type === 'agent_inmomas' ? 'block' : 'none';
      if (inmomasAgentGroup) inmomasAgentGroup.style.display = type === 'agent_inmomas' ? 'none' : '';
      if (type === 'agent_inmomas' && agencyInp && !agencyInp.value) {
        agencyInp.value = 'RE/MAX Inmomás';
      }

      // Webinar Spotlight Banners:
      // Always hide past Realtor webinar banner. Only show Client webinar banner when type === 'client'.
      if (banner) banner.style.display = 'none';
      if (clientBanner) clientBanner.style.display = type === 'client' ? '' : 'none';

      const profWebinar = document.querySelector('.professional-webinar-group');
      const clientWebinar = document.querySelector('.client-webinar-group');
      if (profWebinar) profWebinar.style.display = 'none';
      if (clientWebinar) clientWebinar.style.display = type === 'client' ? '' : 'none';

      const refName = referrer ? `${App.utils.escapeHtml(referrer.firstName)} ${App.utils.escapeHtml(referrer.lastName)}`.trim() : '';

      if (type === 'client') {
        if (formTitle) {
          formTitle.innerHTML = `<span class="lang-en">Buy &amp; Invest in Spain</span><span class="lang-es">Comprar e Invertir en España</span><span class="lang-fr">Acheter et Investir en Espagne</span><span class="lang-en-ca">Buy &amp; Invest in Spain</span><span class="lang-fr-eu">Acheter &amp; Investir en Espagne</span><span class="lang-nl">Kopen &amp; Investeren in Spanje</span><span class="lang-sv">Köpa Bostad &amp; Investera i Spanien</span><span class="lang-bg">Покупка и инвестиция в Испания</span>`;
        }
        if (welcomeMsg) {
          welcomeMsg.innerHTML = refName
            ? `<span class="lang-en">Complimentary invitation from <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-es">Invitación de cortesía de <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-fr">Invitation offerte par <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-en-ca">Complimentary invitation from <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-fr-eu">Invitation personnelle offerte par <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-nl">Persoonlijke uitnodiging van <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-sv">Personlig inbjudan från <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-bg">Лична покана от <strong>${refName}</strong> · The Spain Connection</span>`
            : `<span class="lang-en">Personalized advisory with Spain's top real estate advisors</span>
               <span class="lang-es">Asesoría personalizada con los mejores agentes de España</span>
               <span class="lang-fr">Conseil personnalisé avec les meilleurs agents en Espagne</span>
               <span class="lang-en-ca">Personalized advisory with Spain's top real estate advisors</span>
               <span class="lang-fr-eu">Accompagnement sur mesure avec nos conseillers et juristes en Espagne</span>
               <span class="lang-nl">Persoonlijk aankoopadvies met onze specialisten in Spanje</span>
               <span class="lang-sv">Personlig rådgivning med våra fastighetsspecialister i Spanien</span>
               <span class="lang-bg">Индивидуална консултация с нашите експерти в Испания</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="lang-en">Send Request</span><span class="lang-es">Enviar Solicitud</span><span class="lang-fr">Envoyer la Demande</span><span class="lang-en-ca">Send Request</span><span class="lang-fr-eu">Envoyer ma demande</span><span class="lang-nl">Aanvraag versturen</span><span class="lang-sv">Skicka förfrågan</span><span class="lang-bg">Изпрати запитване</span>`;
        }
      } else if (type === 'realtor') {
        if (formTitle) {
          formTitle.innerHTML = `<span class="lang-en">Realtor Partner Registration</span><span class="lang-es">Registro de Agente / Realtor</span><span class="lang-fr">Inscription Agent Partenaire</span><span class="lang-en-ca">Realtor Partner Registration</span><span class="lang-fr-eu">Inscription Mandataire / Agent Partenaire</span><span class="lang-nl">Registratie Partnermakelaar / Adviseur</span><span class="lang-sv">Registrering av Partnermäklare</span><span class="lang-bg">Регистрация на брокер партньор</span>`;
        }
        if (welcomeMsg) {
          welcomeMsg.innerHTML = refName
            ? `<span class="lang-en">Invited by <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-es">Invitado/a por <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-fr">Invité(e) par <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-en-ca">Invited by <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-fr-eu">Sur invitation de <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-nl">Uitgenodigd door <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-sv">Inbjuden av <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-bg">По покана на <strong>${refName}</strong> · The Spain Connection</span>`
            : `<span class="lang-en">Join our international referral network in Spain</span>
               <span class="lang-es">Únete a nuestra red internacional de referidos en España</span>
               <span class="lang-fr">Rejoignez notre réseau international en Espagne</span>
               <span class="lang-en-ca">Join our international referral network in Spain</span>
               <span class="lang-fr-eu">Rejoignez notre réseau d'apporteurs d'affaires en Espagne</span>
               <span class="lang-nl">Sluit je aan bij ons internationale partnernetwerk in Spanje</span>
               <span class="lang-sv">Anslut dig till vårt internationella partnernätverk i Spanien</span>
               <span class="lang-bg">Присъединете се към нашата международна мрежа в Испания</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="lang-en">Register as Realtor</span><span class="lang-es">Registrarse como Agente</span><span class="lang-fr">S'inscrire comme Agent</span><span class="lang-en-ca">Register as Realtor</span><span class="lang-fr-eu">S'inscrire comme partenaire</span><span class="lang-nl">Registreren als partnermakelaar</span><span class="lang-sv">Registrera som partnermäklare</span><span class="lang-bg">Регистрация като брокер партньор</span>`;
        }
      } else if (type === 'broker') {
        if (formTitle) {
          formTitle.innerHTML = `<span class="lang-en">Brokerage Partner Registration</span><span class="lang-es">Registro de Brokerage / Agencia</span><span class="lang-fr">Inscription Agence Partenaire</span><span class="lang-en-ca">Brokerage Partner Registration</span><span class="lang-fr-eu">Inscription Agence / Cabinet Partenaire</span><span class="lang-nl">Registratie Makelaarskantoor</span><span class="lang-sv">Registrering av Mäklarbyrå</span><span class="lang-bg">Регистрация на агенция за имоти</span>`;
        }
        if (welcomeMsg) {
          welcomeMsg.innerHTML = refName
            ? `<span class="lang-en">Strategic Partnership with <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-es">Alianza Estratégica con <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-fr">Partenariat Stratégique avec <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-en-ca">Strategic Partnership with <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-fr-eu">Partenariat stratégique avec <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-nl">Strategisch partnerschap met <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-sv">Strategiskt partnerskap med <strong>${refName}</strong> · The Spain Connection</span>
               <span class="lang-bg">Стратегическо партньорство с <strong>${refName}</strong> · The Spain Connection</span>`
            : `<span class="lang-en">Register your Brokerage</span>
               <span class="lang-es">Registra tu Brokerage / Agencia</span>
               <span class="lang-fr">Inscrivez votre Agence</span>
               <span class="lang-en-ca">Register your Brokerage</span>
               <span class="lang-fr-eu">Référencez votre agence ou cabinet (25 % de rétrocession)</span>
               <span class="lang-nl">Registreer je makelaarskantoor (25% partnervergoeding)</span>
               <span class="lang-sv">Registrera din mäklarbyrå (25 % partnerprovision)</span>
               <span class="lang-bg">Регистрирайте Вашата агенция (25% партньорска комисиона)</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="lang-en">Register Brokerage</span><span class="lang-es">Registrar Brokerage</span><span class="lang-fr">Inscrire l'Agence</span><span class="lang-en-ca">Register Brokerage</span><span class="lang-fr-eu">Inscrire mon agence</span><span class="lang-nl">Makelaarskantoor registreren</span><span class="lang-sv">Registrera mäklarbyrå</span><span class="lang-bg">Регистрирай агенция</span>`;
        }
      } else if (type === 'embajador') {
        if (formTitle) {
          formTitle.innerHTML = `<span class="lang-en">Ambassador Application</span><span class="lang-es">Postulación como Embajador</span><span class="lang-fr">Candidature Ambassadeur</span><span class="lang-en-ca">Ambassador Application</span><span class="lang-fr-eu">Candidature Ambassadeur Régional</span><span class="lang-nl">Aanmelding als Regio-Ambassadeur</span><span class="lang-sv">Ansökan som Regionambassadör</span><span class="lang-bg">Кандидатура за регионален посланик</span>`;
        }
        if (welcomeMsg) {
          welcomeMsg.innerHTML = refName
            ? `<span class="lang-en">Executive invitation from <strong>${refName}</strong> · Lead your own umbrella of Brokers, Realtors, Collaborators &amp; Clients</span>
               <span class="lang-es">Invitación ejecutiva de <strong>${refName}</strong> · Lidera tu propio paraguas de Brokers, Agentes, Colaboradores y Clientes</span>
               <span class="lang-fr">Invitation exécutive de <strong>${refName}</strong> · Dirigez votre réseau de Courtiers, Agents, Partenaires et Clients</span>
               <span class="lang-en-ca">Executive invitation from <strong>${refName}</strong> · Lead your own umbrella of Brokers, Realtors, Collaborators &amp; Clients</span>
               <span class="lang-fr-eu">Invitation exécutive de <strong>${refName}</strong> · Développez votre propre réseau d'agences, mandataires et CGP</span>
               <span class="lang-nl">Directie-uitnodiging van <strong>${refName}</strong> · Bouw je eigen netwerk van kantoren, makelaars en adviseurs</span>
               <span class="lang-sv">Exekutiv inbjudan från <strong>${refName}</strong> · Led ditt eget nätverk av mäklarbyråer, rådgivare och kunder</span>
               <span class="lang-bg">Изпълнителна покана от <strong>${refName}</strong> · Изградете собствена мрежа от агенции, брокери и клиенти</span>`
            : `<span class="lang-en">Apply as Official Ambassador · The Spain Connection</span>
               <span class="lang-es">Postúlate como Embajador Oficial · The Spain Connection</span>
               <span class="lang-fr">Postuler comme Ambassadeur Officiel · The Spain Connection</span>
               <span class="lang-en-ca">Apply as Official Ambassador · The Spain Connection</span>
               <span class="lang-fr-eu">Postuler comme Ambassadeur Officiel · The Spain Connection</span>
               <span class="lang-nl">Meld je aan als Officieel Ambassadeur · The Spain Connection</span>
               <span class="lang-sv">Ansök som Officiell Ambassadör · The Spain Connection</span>
               <span class="lang-bg">Кандидатствайте като Официален Посланик · The Spain Connection</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="lang-en">Apply as Ambassador</span><span class="lang-es">Postularse como Embajador</span><span class="lang-fr">Postuler comme Ambassadeur</span><span class="lang-en-ca">Apply as Ambassador</span><span class="lang-fr-eu">Soumettre ma candidature</span><span class="lang-nl">Aanmelden als Ambassadeur</span><span class="lang-sv">Ansök som Ambassadör</span><span class="lang-bg">Кандидатствай като посланик</span>`;
        }
      } else if (type === 'agent_inmomas') {
        if (formTitle) {
          formTitle.innerHTML = `<span class="lang-en">RE/MAX Inmomás Agent Registration</span><span class="lang-es">Registro de Agente RE/MAX Inmomás</span><span class="lang-fr">Inscription Agent RE/MAX Inmomás</span><span class="lang-en-ca">RE/MAX Inmomás Agent Registration</span><span class="lang-fr-eu">Inscription Conseiller RE/MAX Inmomás</span><span class="lang-nl">Registratie RE/MAX Inmomás-adviseur</span><span class="lang-sv">Registrering RE/MAX Inmomás-rådgivare</span><span class="lang-bg">Регистрация на консултант RE/MAX Inmomás</span>`;
        }
        if (welcomeMsg) {
          welcomeMsg.innerHTML = `<span class="lang-en">Select your nationality and target region(s) to activate your regional RE/MAX Inmomás CRM</span><span class="lang-es">Indica tu nacionalidad y región(es) de mercado para activar tu panel regional de RE/MAX Inmomás</span><span class="lang-fr">Indiquez votre nationalité et vos régions pour activer votre CRM RE/MAX Inmomás</span><span class="lang-en-ca">Select your nationality and target region(s) to activate your RE/MAX Inmomás CRM</span><span class="lang-fr-eu">Indiquez votre pays et vos régions cibles pour activer votre espace CRM RE/MAX Inmomás</span><span class="lang-nl">Kies je land en marktregio's om je RE/MAX Inmomás CRM te activeren</span><span class="lang-sv">Välj land och marknadsregioner för att aktivera ditt RE/MAX Inmomás CRM</span><span class="lang-bg">Изберете държава и пазарни региони за активация на Вашия RE/MAX Inmomás CRM</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="lang-en">Register RE/MAX Inmomás Agent</span><span class="lang-es">Registrar Agente RE/MAX Inmomás</span><span class="lang-fr">Inscrire Agent RE/MAX Inmomás</span><span class="lang-en-ca">Register RE/MAX Inmomás Agent</span><span class="lang-fr-eu">Inscrire Conseiller RE/MAX Inmomás</span><span class="lang-nl">RE/MAX Inmomás-adviseur registreren</span><span class="lang-sv">Registrera RE/MAX Inmomás-rådgivare</span><span class="lang-bg">Регистрирай консултант RE/MAX Inmomás</span>`;
        }
      } else {
        if (formTitle) {
          formTitle.innerHTML = `<span class="lang-en">Partner Registration</span><span class="lang-es">Registro de Colaborador</span><span class="lang-fr">Inscription Partenaire</span><span class="lang-en-ca">Partner Registration</span><span class="lang-fr-eu">Inscription Apporteur d'Affaires / CGP</span><span class="lang-nl">Registratie Samenwerkingspartner</span><span class="lang-sv">Registrering av Samarbetspartner</span><span class="lang-bg">Регистрация на партньор</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = `<span class="lang-en">Submit Application</span><span class="lang-es">Enviar Solicitud</span><span class="lang-fr">Soumettre la Demande</span><span class="lang-en-ca">Submit Application</span><span class="lang-fr-eu">Envoyer ma demande</span><span class="lang-nl">Aanmelding versturen</span><span class="lang-sv">Skicka ansökan</span><span class="lang-bg">Изпрати заявка</span>`;
        }
      }

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

    // Helper to enrich a referrer with office/broker agencyName and agencyLogo if missing
    function enrichReferrerFromPool(ref, usersPool) {
      if (!ref || !Array.isArray(usersPool)) return ref;
      const enriched = { ...ref };
      let agency = (enriched.agencyName || enriched.brokerNameManual || '').trim();
      let logo = enriched.agencyLogo || '';

      // 1. If Realtor is under a Broker's umbrella, always enforce the Broker's logo & agency
      if (enriched.brokerId || enriched.referredBy) {
        const parentBroker = (App.utils && App.utils.resolveUserUmbrellaParents
          ? App.utils.resolveUserUmbrellaParents(enriched, usersPool).broker
          : null) || usersPool.find(u =>
          u.role === 'broker' && (
            (enriched.brokerId && u.id === enriched.brokerId) ||
            (enriched.referredBy && (u.id === enriched.referredBy || u.referralCode === enriched.referredBy))
          )
        );
        if (parentBroker) {
          if (enriched.role === 'realtor') {
            if (parentBroker.agencyName) agency = parentBroker.agencyName;
            logo = parentBroker.agencyLogo || '';
          } else {
            if (!agency && parentBroker.agencyName) agency = parentBroker.agencyName;
            if (!logo && parentBroker.agencyLogo) logo = parentBroker.agencyLogo;
          }
        }
      }

      // 2. Check any user in the same agency/office who has an agencyLogo
      if (!logo && agency) {
        const agencyLower = agency.toLowerCase();
        const coworkerWithLogo = usersPool.find(u =>
          u.agencyLogo && (u.agencyName || '').trim().toLowerCase() === agencyLower
        );
        if (coworkerWithLogo) {
          logo = coworkerWithLogo.agencyLogo;
        }
      }

      enriched.agencyName = agency;
      enriched.agencyLogo = logo || null;
      return enriched;
    }

    // ---- Step 1: Look up referrer (sync from demoData first, then async Firestore) ----
    const PARTNER_TYPE_BY_REF = {
      'UCI': 'needsUCI',
      'Fuster & Associates': 'needsFuster',
      'Inmomás Holidays': 'needsHolidays'
    };

    function lookupReferrerSync() {
      if (!refCode) return null;

      if (App.demoData && App.demoData.users) {
        const mappedPType = PARTNER_TYPE_BY_REF[refCode];
        const found = App.demoData.users.find(u =>
          u.referralCode === refCode || (mappedPType && u.partnerType === mappedPType)
        ) || null;
        if (found) return enrichReferrerFromPool(found, App.demoData.users);
      }

      // Hardcoded partner fallbacks
      if (refCode === 'UCI') return { firstName: 'UCI', lastName: '', agencyName: 'UCI', role: 'partner' };
      if (refCode === 'Fuster & Associates') return { firstName: 'Fuster', lastName: '& Associates', agencyName: 'Fuster & Associates', role: 'partner' };
      if (refCode === 'Inmomás Holidays') return { firstName: 'Inmomás', lastName: 'Holidays', agencyName: 'Inmomás Holidays', role: 'partner' };

      return null;
    }

    async function lookupReferrerFirestore() {
      if (!refCode || App.demoMode || !App.db) return null;
      try {
        let snapshot = await App.db.collection('users')
          .where('referralCode', '==', refCode)
          .limit(1)
          .get();
        if (snapshot.empty && PARTNER_TYPE_BY_REF[refCode]) {
          snapshot = await App.db.collection('users')
            .where('partnerType', '==', PARTNER_TYPE_BY_REF[refCode])
            .limit(1)
            .get();
        }
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          let refData = { id: doc.id, ...doc.data() };

          // Enforce Broker's official logo & agency when Realtor is under a Broker's umbrella
          if (refData.role === 'realtor' && (refData.brokerId || refData.referredBy)) {
            let bData = null;
            try {
              if (refData.brokerId) {
                const brokerDoc = await App.db.collection('users').doc(refData.brokerId).get();
                if (brokerDoc.exists && brokerDoc.data().role === 'broker') bData = brokerDoc.data();
              }
              if (!bData && refData.referredBy) {
                const bSnap = await App.db.collection('users').where('referralCode', '==', refData.referredBy).limit(1).get();
                if (!bSnap.empty && bSnap.docs[0].data().role === 'broker') bData = bSnap.docs[0].data();
              }
            } catch (_) {}
            if (bData) {
              if (bData.agencyName) refData.agencyName = bData.agencyName;
              refData.agencyLogo = bData.agencyLogo || null;
            }
          } else if (!refData.agencyLogo && refData.agencyName) {
            try {
              const agencySnap = await App.db.collection('users')
                .where('agencyName', '==', refData.agencyName)
                .get();
              agencySnap.forEach(d => {
                const dData = d.data();
                if (!refData.agencyLogo && dData.agencyLogo) {
                  refData.agencyLogo = dData.agencyLogo;
                }
              });
            } catch (_) {}
          }
          return refData;
        }
      } catch (err) {
        console.warn('[Referral] Firestore lookup failed:', err);
      }
      return null;
    }

    function applyReferrer(ref) {
      referrer = ref;
      App.views.public.renderPartnerBranding(referrer, 'referral');

      if (referrer) {
        console.log('[Referral] Referrer found:', referrer.firstName, referrer.lastName, '(' + referrer.role + ')');
        const referrerFullName = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() || referrer.agencyName || '';
        if (referrerFullName) {
          const dynamicTitle = `Referral Link — ${referrerFullName}`;
          document.title = `${dynamicTitle} | The Spain Connection`;
          const ogTitleMeta = document.querySelector('meta[property="og:title"]');
          if (ogTitleMeta) ogTitleMeta.setAttribute('content', dynamicTitle);
          const twTitleMeta = document.querySelector('meta[name="twitter:title"]');
          if (twTitleMeta) twTitleMeta.setAttribute('content', dynamicTitle);
        }

        const clientBannerInviteeEl = document.getElementById('referral-client-banner-invitee');
        if (clientBannerInviteeEl) {
          const rFull = `${App.utils.escapeHtml(referrer.firstName)} ${App.utils.escapeHtml(referrer.lastName)}`.trim();
          clientBannerInviteeEl.innerHTML = `
            <span>✨</span>
            <span class="lang-en">VIP invitation courtesy of <strong>${rFull}</strong></span>
            <span class="lang-es">Invitación VIP de cortesía de <strong>${rFull}</strong></span>
            <span class="lang-fr">Invitation VIP offerte par <strong>${rFull}</strong></span>
            <span class="lang-en-ca">VIP invitation courtesy of <strong>${rFull}</strong></span>
            <span class="lang-fr-eu">Invitation VIP personnelle de <strong>${rFull}</strong></span>
            <span class="lang-nl">Persoonlijke VIP-uitnodiging van <strong>${rFull}</strong></span>
            <span class="lang-sv">Personlig VIP-inbjudan från <strong>${rFull}</strong></span>
            <span class="lang-bg">Лична VIP покана от <strong>${rFull}</strong></span>
          `;
        }

        // Pre-select RE/MAX Inmomás Agent dropdown if the referrer is one of our approved Inmomás agents
        const inmomasSelect = document.getElementById('referral-inmomas-agent');
        if (inmomasSelect && !inmomasSelect.value && App.utils && typeof App.utils.matchInmomasAgentOption === 'function') {
          App.utils.matchInmomasAgentOption(inmomasSelect, referrer);
        }
      }

      // Pre-check webinar consents
      const clientConsentBox = document.getElementById('referral-client-webinar-consent');
      if (clientConsentBox) clientConsentBox.checked = true;
      const profConsentBox = document.getElementById('referral-webinar-consent');
      if (profConsentBox) profConsentBox.checked = true;

      // Build professional type options based on referrer's role
      // NOTE: End Clients now use the dedicated Client Webinar Link (#webinar?ref=CODE) exclusively.
      // 'embajador' appears on Administrator and RE/MAX Inmomás Agent referral links.
      let availableTypes = ['realtor'];
      const upperRefCode = refCode ? refCode.toUpperCase().trim() : '';
      if (!referrer) {
        if (upperRefCode.startsWith('BRK-')) {
          availableTypes = ['realtor', 'colaborador'];
        } else if (upperRefCode.startsWith('REA-')) {
          availableTypes = ['realtor'];
        } else if (upperRefCode.startsWith('LOC-') || upperRefCode.startsWith('ADM-') || upperRefCode === 'ADMIN-001') {
          availableTypes = ['embajador', 'broker', 'realtor', 'colaborador'];
        } else {
          availableTypes = ['realtor', 'broker', 'colaborador'];
        }
        if (availableTypes.includes(requestedType)) {
          selectedType = requestedType;
        } else {
          selectedType = 'realtor';
        }
      } else if (referrer.role === 'admin') {
        if (requestedType === 'agent_inmomas') {
          // Internal direct onboarding link from Admin Dashboard only
          availableTypes = ['agent_inmomas'];
          selectedType = 'agent_inmomas';
        } else {
          availableTypes = ['embajador', 'broker', 'realtor', 'colaborador'];
          if (availableTypes.includes(requestedType)) {
            selectedType = requestedType;
          } else if (!availableTypes.includes(selectedType)) {
            selectedType = 'realtor';
          }
        }
      } else if (referrer.role === 'agent_inmomas') {
        availableTypes = ['embajador', 'broker', 'realtor', 'colaborador'];
        if (availableTypes.includes(requestedType)) {
          selectedType = requestedType;
        } else if (!availableTypes.includes(selectedType)) {
          selectedType = 'realtor';
        }
      } else if (referrer.role === 'embajador') {
        availableTypes = ['broker', 'realtor', 'colaborador'];
        if (availableTypes.includes(requestedType)) {
          selectedType = requestedType;
        } else if (!availableTypes.includes(selectedType)) {
          selectedType = 'realtor';
        }
      } else if (referrer.role === 'realtor') {
        availableTypes = ['realtor'];
        selectedType = 'realtor';
      } else if (referrer.role === 'broker') {
        // A Broker can link both Realtors and Collaborators (10%) to their structure
        availableTypes = ['realtor', 'colaborador'];
        if (availableTypes.includes(requestedType)) {
          selectedType = requestedType;
        } else if (!availableTypes.includes(selectedType)) {
          selectedType = 'realtor';
        }
      } else if (referrer.role === 'colaborador' || referrer.role === 'partner') {
        availableTypes = ['realtor', 'broker', 'colaborador'];
        if (availableTypes.includes(requestedType)) {
          selectedType = requestedType;
        } else if (!availableTypes.includes(selectedType)) {
          selectedType = 'realtor';
        }
      } else {
        availableTypes = ['realtor', 'broker', 'colaborador'];
        if (availableTypes.includes(requestedType)) {
          selectedType = requestedType;
        } else {
          selectedType = 'realtor';
        }
      }

      const typeConfig = {
        embajador: {
          icon: '👑',
          labelEn: 'Ambassador',
          labelEs: 'Embajador',
          labelFr: 'Ambassadeur',
          labelEnCa: 'Ambassador',
          labelFrEu: 'Ambassadeur Régional',
          labelNl: 'Regio-Ambassadeur',
          labelSv: 'Regionambassadör',
          labelBg: 'Регионален Посланик'
        },
        client: {
          icon: '👤',
          labelEn: 'Client / Buyer',
          labelEs: 'Cliente / Comprador',
          labelFr: 'Client / Acheteur',
          labelEnCa: 'Client / Buyer',
          labelFrEu: 'Acquéreur / Investisseur',
          labelNl: 'Koper / Belegger',
          labelSv: 'Köpare / Investerare',
          labelBg: 'Купувач / Инвеститор'
        },
        realtor: {
          icon: '🏠',
          labelEn: 'Agent / Realtor',
          labelEs: 'Agente / Realtor',
          labelFr: 'Agent / Conseiller',
          labelEnCa: 'Agent / Realtor',
          labelFrEu: 'Mandataire / Agent Immobilier',
          labelNl: 'Makelaar / Aankoopadviseur',
          labelSv: 'Fastighetsmäklare / Rådgivare',
          labelBg: 'Брокер / Имотен консултант'
        },
        broker: {
          icon: '🏢',
          labelEn: 'Broker / Agency',
          labelEs: 'Broker / Agencia',
          labelFr: 'Courtier (Broker)',
          labelEnCa: 'Broker / Agency',
          labelFrEu: 'Agence Immobilière / Directeur',
          labelNl: 'Makelaarskantoor / Directie',
          labelSv: 'Fastighetsmäklarbyrå',
          labelBg: 'Агенция за имоти / Управител'
        },
        agent_inmomas: {
          icon: '🇪🇸',
          labelEn: 'RE/MAX Inmomás Agent',
          labelEs: 'Agente RE/MAX Inmomás',
          labelFr: 'Agent RE/MAX Inmomás',
          labelEnCa: 'RE/MAX Inmomás Agent',
          labelFrEu: 'Conseiller RE/MAX Inmomás',
          labelNl: 'RE/MAX Inmomás-adviseur',
          labelSv: 'RE/MAX Inmomás-rådgivare',
          labelBg: 'Консултант RE/MAX Inmomás'
        },
        colaborador: {
          icon: '🤝',
          labelEn: 'Collaborator / Partner',
          labelEs: 'Colaborador',
          labelFr: 'Collaborateur / Partenaire',
          labelEnCa: 'Collaborator / Partner',
          labelFrEu: 'Apporteur d\'Affaires / CGP',
          labelNl: 'Financieel Adviseur / Partner',
          labelSv: 'Samarbetspartner / Rådgivare',
          labelBg: 'Бизнес партньор / Консултант'
        }
      };

      if (typeSelect) {
        const activeLang = (window.App && typeof window.App.getLanguage === 'function') ? window.App.getLanguage() : 'en';
        typeSelect.innerHTML = availableTypes.map((type) => {
          const cfg = typeConfig[type] || typeConfig.realtor;
          const isSelected = type === selectedType;
          const txtMap = {
            en: `${cfg.icon} ${cfg.labelEn}`,
            es: `${cfg.icon} ${cfg.labelEs}`,
            fr: `${cfg.icon} ${cfg.labelFr}`,
            'en-ca': `${cfg.icon} ${cfg.labelEnCa}`,
            'fr-eu': `${cfg.icon} ${cfg.labelFrEu}`,
            nl: `${cfg.icon} ${cfg.labelNl}`,
            sv: `${cfg.icon} ${cfg.labelSv}`,
            bg: `${cfg.icon} ${cfg.labelBg}`
          };
          const initialTxt = txtMap[activeLang] || txtMap.en;
          return `<option value="${type}" data-i18n-en="${txtMap.en}" data-i18n-es="${txtMap.es}" data-i18n-fr="${txtMap.fr}" data-i18n-en-ca="${txtMap['en-ca']}" data-i18n-fr-eu="${txtMap['fr-eu']}" data-i18n-nl="${txtMap.nl}" data-i18n-sv="${txtMap.sv}" data-i18n-bg="${txtMap.bg}" ${isSelected ? 'selected' : ''}>${initialTxt}</option>`;
        }).join('');
        typeSelect.value = selectedType;

        typeSelect.onchange = function() {
          selectedType = this.value || 'realtor';
          updateFieldVisibility(selectedType);
          if (window.App && typeof window.App.updateLangDisplay === 'function') {
            window.App.updateLangDisplay();
          }
        };
      }

      if (typeSelector) {
        typeSelector.style.display = availableTypes.length > 1 ? '' : 'none';
      }

      updateFieldVisibility(selectedType);
      if (window.App && typeof window.App.updateLangDisplay === 'function') {
        window.App.updateLangDisplay();
      }
    }

    // ---- Step 2: Try sync first, then async ----
    const syncResult = lookupReferrerSync();
    if (syncResult) {
      applyReferrer(syncResult);
    } else {
      applyReferrer(null);
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

    // ---- Dynamic Webinar Dates for Banners ----
    async function loadDynamicWebinarDates() {
      try {
        const settings = (App.auth && App.auth.getWebinarSettings)
          ? await App.auth.getWebinarSettings()
          : (App.auth && App.auth.getDefaultWebinarSettings ? App.auth.getDefaultWebinarSettings() : null);

        if (!settings) return;

        // 1. Populate Client Banner from B2C webinar settings
        const b2cConfig = settings.b2c || {};
        const b2cDate = (settings.activeType === 'b2c' && settings.date) ? settings.date : (b2cConfig.date || '2026-09-18');
        const b2cTime = (settings.activeType === 'b2c' && settings.time) ? settings.time : (b2cConfig.time || '12:00');

        if (b2cDate) {
          const [cy, cm, cd] = b2cDate.split('-').map(Number);
          const cDateObj = new Date(Date.UTC(cy, cm - 1, cd, 12, 0, 0));
          const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const monthsFullEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
          const monthsShortFr = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
          const monthsShortNl = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
          const monthsShortSv = ['jan','feb','mars','apr','maj','juni','juli','aug','sep','okt','nov','dec'];
          const monthsShortBg = ['яну','фев','мар','апр','май','юни','юли','авг','сеп','окт','ное','дек'];

          const cmIdx = cDateObj.getUTCMonth();
          const cdNum = cDateObj.getUTCDate();
          const cyNum = cDateObj.getUTCFullYear();

          const [chRef, cminRef] = (b2cTime || '12:00').split(':').map(Number);
          function fmt12(h, mn) {
            const period = h >= 12 ? 'PM' : 'AM';
            let dh = h % 12;
            if (dh === 0) dh = 12;
            const dm = mn === 0 ? ':00' : `:${String(mn).padStart(2, '0')}`;
            return `${dh}${dm} ${period}`;
          }

          const cedtStr = fmt12(chRef, cminRef);
          const ccestHour = (chRef + 6) % 24;
          const ccestStr = fmt12(ccestHour, cminRef);
          const cpdtHour = (chRef - 3 + 24) % 24;
          const cpdtStr = fmt12(cpdtHour, cminRef);

          const cLivePill = document.getElementById('client-webinar-live-pill-text');
          if (cLivePill) {
            cLivePill.textContent = `${cdNum} ${monthsEn[cmIdx].toUpperCase()} ${cyNum} · ${ccestStr} CEST / ${cedtStr} EDT`;
          }

          const cDateVal = document.getElementById('client-webinar-date-val');
          if (cDateVal) {
            cDateVal.innerHTML = `<span class="lang-en">${cdNum} ${monthsEn[cmIdx]} ${cyNum}</span><span class="lang-es">${cdNum} de ${monthsFullEs[cmIdx]}, ${cyNum}</span><span class="lang-fr">${cdNum} ${monthsShortFr[cmIdx]} ${cyNum}</span><span class="lang-en-ca">${cdNum} ${monthsEn[cmIdx]} ${cyNum}</span><span class="lang-fr-eu">${cdNum} ${monthsShortFr[cmIdx]} ${cyNum}</span><span class="lang-nl">${cdNum} ${monthsShortNl[cmIdx]} ${cyNum}</span><span class="lang-sv">${cdNum} ${monthsShortSv[cmIdx]} ${cyNum}</span><span class="lang-bg">${cdNum} ${monthsShortBg[cmIdx]} ${cyNum}</span>`;
          }

          const cTimeVal = document.getElementById('client-webinar-time-val');
          if (cTimeVal) {
            cTimeVal.innerHTML = `${cedtStr} EDT (Miami/NY) &middot; ${ccestStr} CEST (Spain) &middot; ${cpdtStr} PDT`;
          }
        }

        // 2. Populate Realtor Banner from B2B webinar settings
        const b2bConfig = settings.b2b || {};
        const b2bDate = (settings.activeType === 'b2b' && settings.date) ? settings.date : (b2bConfig.date || '2026-09-24');
        const b2bTime = (settings.activeType === 'b2b' && settings.time) ? settings.time : (b2bConfig.time || '19:00');

        if (b2bDate) {
          const [by, bm, bd] = b2bDate.split('-').map(Number);
          const bDateObj = new Date(Date.UTC(by, bm - 1, bd, 12, 0, 0));
          const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const bmIdx = bDateObj.getUTCMonth();
          const bdNum = bDateObj.getUTCDate();
          const byNum = bDateObj.getUTCFullYear();

          const [bhRef, bminRef] = (b2bTime || '19:00').split(':').map(Number);
          function fmt12(h, mn) {
            const period = h >= 12 ? 'PM' : 'AM';
            let dh = h % 12;
            if (dh === 0) dh = 12;
            const dm = mn === 0 ? ':00' : `:${String(mn).padStart(2, '0')}`;
            return `${dh}${dm} ${period}`;
          }

          const bcestStr = fmt12(bhRef, bminRef);
          const bedtHour = (bhRef - 6 + 24) % 24;
          const bedtStr = fmt12(bedtHour, bminRef);
          const bpdtHour = (bhRef - 9 + 24) % 24;
          const bpdtStr = fmt12(bpdtHour, bminRef);

          const rLivePill = document.querySelector('#referral-webinar-spotlight-banner .live-pill');
          if (rLivePill) {
            rLivePill.innerHTML = `<span class="pulse-dot"></span> ${bdNum} ${monthsEn[bmIdx].toUpperCase()} ${byNum} · ${bcestStr} CEST / ${bedtStr} EDT`;
          }

          const rDateStr = document.querySelector('#referral-webinar-spotlight-banner .pass-meta-strip span:first-child strong');
          if (rDateStr) {
            rDateStr.textContent = `${bdNum} ${monthsEn[bmIdx]} ${byNum}`;
          }

          const rTimeStr = document.querySelector('#referral-webinar-spotlight-banner .pass-meta-strip span:nth-child(2) strong');
          if (rTimeStr) {
            rTimeStr.innerHTML = `${bcestStr} CEST (Spain) &middot; ${bedtStr} EDT (Miami/NY/PR) &middot; ${bpdtStr} PDT`;
          }
        }
      } catch (err) {
        console.warn('[Referral] Error dynamically populating webinar banner dates:', err);
      }
    }

    loadDynamicWebinarDates();



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
          const inmomasAgentEl = form.querySelector('#referral-inmomas-agent');
          const inmomasAgent = (inmomasAgentEl?.value || '').trim();
          const inmomasAgentIdSelected = inmomasAgentEl?.selectedOptions?.[0]?.dataset?.agentId || null;
          const termsChecked = form.querySelector('#referral-terms')?.checked;

          const typeSelEl = form.querySelector('#referral-type-select');
          const typeRadio = document.querySelector('input[name="referral-contact-type"]:checked');
          const contactType = (typeSelEl && typeSelEl.value) ? typeSelEl.value : (typeRadio ? typeRadio.value : selectedType);

          if (!firstName || !lastName || !email || !phone) {
            App.utils.showToast('Please fill in all required fields.', 'error');
            return;
          }

          if (!termsChecked) {
            App.utils.showToast('Debes aceptar los Términos y Condiciones para continuar. / Please accept the Terms & Conditions.', 'error');
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
              inmomasAgentName: inmomasAgent || null,
              termsAccepted: true,
              termsAcceptedAt: new Date().toISOString()
            };

            if (referrer) {
              clientPayload.referredBy = referrer.id;
              clientPayload.embajadorId = referrer.role === 'embajador' ? referrer.id : (referrer.embajadorId || null);
              if (referrer.role === 'embajador') {
                clientPayload.referredBy = referrer.id;
              } else if (referrer.role === 'broker') {
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

            if (inmomasAgent) {
              if (!clientPayload.localAgentId && inmomasAgentIdSelected) {
                clientPayload.localAgentId = inmomasAgentIdSelected;
              }
              if (!clientPayload.localAgentName) {
                clientPayload.localAgentName = inmomasAgent;
              }
              if (!clientPayload.referredBy) {
                clientPayload.referredBy = inmomasAgent;
              }
            }

            await App.auth.addReferralClient(clientPayload);
          } else {
            // Enforce that applying as 'embajador' is only permitted via an Administrator or RE/MAX Inmomás Agent referral link
            const upperCodeCheck = refCode ? refCode.toUpperCase().trim() : '';
            const allowedEmbajadorReferrer = (referrer && ['admin', 'agent_inmomas'].includes(referrer.role)) ||
              upperCodeCheck.startsWith('ADM-') || upperCodeCheck.startsWith('LOC-') || upperCodeCheck === 'ADMIN-001';
            if (contactType === 'embajador' && !allowedEmbajadorReferrer) {
              throw new Error('La postulación como Embajador solo está disponible a través del enlace de Administración o de un Agente RE/MAX Inmomás.');
            }
            if (contactType === 'agent_inmomas' && (!referrer || referrer.role !== 'admin')) {
              throw new Error('El registro de Agente RE/MAX Inmomás es de uso interno.');
            }
            if (contactType === 'broker' && ((referrer && referrer.role === 'broker') || (refCode && refCode.toUpperCase().startsWith('BRK-')))) {
              throw new Error('Un Broker no puede registrar a otro Broker debajo de su estructura.');
            }
            if (contactType === 'colaborador' && ((referrer && referrer.role === 'realtor') || (refCode && refCode.toUpperCase().startsWith('REA-')))) {
              throw new Error('Un Colaborador puede operar directamente o bajo un Broker o Embajador, pero no puede estar debajo de un Agente.');
            }

            agencyName = form.querySelector('#referral-agencyName')?.value.trim() || '';
            if (!agencyName && contactType === 'agent_inmomas') {
              agencyName = 'RE/MAX Inmomás';
            } else if (!agencyName && referrer && referrer.role === 'broker' && referrer.agencyName) {
              agencyName = referrer.agencyName;
            }
            market = form.querySelector('#referral-market')?.value.trim() || '';
            const profCountryVal = form.querySelector('#referral-prof-country')?.value.trim() || market || 'United States';
            const notes = form.querySelector('#referral-notes')?.value.trim() || '';
            const password = (form.querySelector('#referral-password')?.value || '').trim();

            let selectedRegions = [];
            if (contactType === 'agent_inmomas' && masRegionsCheckboxes) {
              selectedRegions = Array.from(masRegionsCheckboxes.querySelectorAll('input[name="referral-mas-region"]:checked')).map(cb => cb.value);
              if (selectedRegions.length === 0) {
                throw new Error('Por favor selecciona al menos una Región comercial para tu cuenta RE/MAX Inmomás.');
              }
            } else if (App.utils && App.utils.resolveRegionFromCountry) {
              const inferred = App.utils.resolveRegionFromCountry(profCountryVal || market || '');
              if (inferred) selectedRegions = [inferred];
            }

            if (!password || password.length < 6) {
              throw new Error('Password must be at least 6 characters.');
            }

            const sameOffice = referrer && (
              referrer.role === 'broker' ||
              (agencyName && referrer.agencyName && agencyName.toLowerCase() === referrer.agencyName.toLowerCase())
            );

            const resolvedEmbajadorId = (referrer && contactType !== 'embajador' && contactType !== 'agent_inmomas')
              ? (referrer.role === 'embajador' ? referrer.id : (referrer.embajadorId || null))
              : null;

            const resolvedInmomasName = contactType === 'agent_inmomas'
              ? null
              : (inmomasAgent || (referrer && referrer.role === 'agent_inmomas' ? `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() : null));

            const userPayload = {
              email,
              password,
              firstName,
              lastName,
              agencyName,
              agencyLogo: (sameOffice && referrer.agencyLogo) ? referrer.agencyLogo : null,
              phone,
              country: profCountryVal,
              nationality: profCountryVal,
              market: market || '',
              region: selectedRegions[0] || '',
              regions: selectedRegions,
              role: contactType,
              brokerId: (referrer && referrer.role === 'broker' && ['realtor', 'colaborador'].includes(contactType)) ? referrer.id : null,
              embajadorId: resolvedEmbajadorId,
              referredByAdmin: Boolean(referrer && referrer.role === 'admin'),
              referredByAgentInmomas: Boolean((referrer && referrer.role === 'agent_inmomas') || (refCode && refCode.toUpperCase().trim().startsWith('LOC-'))),
              referredBy: contactType === 'agent_inmomas' ? null : (referrer ? referrer.id : (refCode || inmomasAgent || null)),
              inmomasAgentId: contactType === 'agent_inmomas'
                ? null
                : (inmomasAgentIdSelected || ((referrer && referrer.role === 'agent_inmomas') ? referrer.id : null)),
              inmomasAgentName: resolvedInmomasName,
              notes: notes || (market ? `Zona: ${market}` : ''),
              termsAccepted: true,
              termsAcceptedAt: new Date().toISOString(),
              source: 'referral'
            };

            await App.auth.register(userPayload);
          }

          // ---- Webinar Date for Confirmation Toast (addReferralClient / register already auto-enrolled in webinar) ----
          const settings = (App.auth && App.auth.getWebinarSettings)
            ? await App.auth.getWebinarSettings()
            : (App.auth && App.auth.getDefaultWebinarSettings ? App.auth.getDefaultWebinarSettings() : null);

          const typeConfig = settings?.b2c || {};
          const webinarDate = typeConfig?.date || settings?.date || '2026-10-29';

          App.utils.showToast(
            contactType === 'client'
              ? `🎉 ¡Registro exitoso! Has quedado inscrito/a para el webinario del ${webinarDate}.`
              : '🎉 ¡Registro exitoso! Redirigiendo a tu solicitud en revisión.',
            'success'
          );

          sessionStorage.removeItem('referralCode');
          sessionStorage.removeItem('referralType');
          form.reset();
          setTimeout(() => {
            if (contactType === 'client') {
              App.router.navigateTo('home');
            } else {
              App.router.navigateTo('pending');
            }
          }, 1600);

        } catch (err) {
          console.error('[Referral] Error submitting form:', err);
          App.utils.showToast('Error al enviar el formulario: ' + err.message, 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="lang-en">Submit</span><span class="lang-es">Enviar</span><span class="lang-fr">Envoyer</span><span class="lang-en-ca">Submit</span><span class="lang-fr-eu">Envoyer</span><span class="lang-nl">Versturen</span><span class="lang-sv">Skicka</span><span class="lang-bg">Изпрати</span>';
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

      // Resolve optional ?region= query parameter on #webinar?region=...
      let requestedRegion = '';
      try {
        const hash = window.location.hash || '';
        const qIdx = hash.indexOf('?');
        if (qIdx >= 0) {
          const hp = new URLSearchParams(hash.substring(qIdx + 1));
          requestedRegion = hp.get('region') || '';
        }
        if (!requestedRegion) {
          const sp = new URLSearchParams(window.location.search || '');
          requestedRegion = sp.get('region') || '';
        }
      } catch (_) {}

      const isClientWebinarInvite = Boolean(
        sessionStorage.getItem('webinarClientInvite') === '1' ||
        sessionStorage.getItem('webinarReferralCode')
      );
      const forcedType = isClientWebinarInvite ? 'b2c' : null;

      const regionalCfg = ((requestedRegion || forcedType) && App.auth && App.auth.getRegionalWebinarConfig)
        ? App.auth.getRegionalWebinarConfig(settings, requestedRegion || 'north_america', forcedType)
        : null;

      const activeType = forcedType || (regionalCfg ? regionalCfg.activeType : (settings.activeType || 'b2c'));
      const config = regionalCfg ? { ...(settings[activeType] || settings.b2c || {}), ...regionalCfg } : (settings[activeType] || settings.b2c || {});
      const dateStr = regionalCfg ? regionalCfg.date : (settings[activeType]?.date || settings.date || config.date || '2026-09-18');
      const timeStr = regionalCfg ? regionalCfg.time : (settings[activeType]?.time || settings.time || config.time || '12:00');
      const spots = regionalCfg ? regionalCfg.spots : (settings[activeType]?.spots || settings.spotsAvailable || config.spots || 25);

      // ── Date Formatting ──
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

      const monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthsEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      const monthsFr = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
      const monthsNl = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
      const monthsSv = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
      const monthsBg = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];

      const daysEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const daysEs = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const daysFr = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
      const daysNl = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
      const daysSv = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'];
      const daysBg = ['Неделя','Понеделник','Вторник','Сряда','Четвъртък','Петък','Събота'];

      const dayOfWeek = dateObj.getUTCDay();
      const monthIndex = dateObj.getUTCMonth();
      const dayNum = dateObj.getUTCDate();
      const yearNum = dateObj.getUTCFullYear();

      const formattedDateEn = `${monthsEn[monthIndex]} ${dayNum}, ${yearNum}`;
      const formattedDateEs = `${dayNum} de ${monthsEs[monthIndex]}, ${yearNum}`;
      const formattedDateFr = `${dayNum} ${monthsFr[monthIndex]} ${yearNum}`;
      const formattedDateNl = `${dayNum} ${monthsNl[monthIndex]} ${yearNum}`;
      const formattedDateSv = `${dayNum} ${monthsSv[monthIndex]} ${yearNum}`;
      const formattedDateBg = `${dayNum} ${monthsBg[monthIndex]} ${yearNum} г.`;

      const dayDateEn = `${daysEn[dayOfWeek]}, ${monthsEn[monthIndex]} ${dayNum}, ${yearNum}`;
      const dayDateEs = `${daysEs[dayOfWeek]}, ${dayNum} de ${monthsEs[monthIndex]} de ${yearNum}`;
      const dayDateFr = `${daysFr[dayOfWeek]} ${dayNum} ${monthsFr[monthIndex]} ${yearNum}`;
      const dayDateNl = `${daysNl[dayOfWeek]} ${dayNum} ${monthsNl[monthIndex]} ${yearNum}`;
      const dayDateSv = `${daysSv[dayOfWeek]} ${dayNum} ${monthsSv[monthIndex]} ${yearNum}`;
      const dayDateBg = `${daysBg[dayOfWeek]}, ${dayNum} ${monthsBg[monthIndex]} ${yearNum} г.`;

      // ── Timezone Conversions (handles Spain CET/CEST vs North America DST) ──
      const [hourRef, minRef] = timeStr.split(':').map(Number);
      function formatTime12(h, min) {
        const period = h >= 12 ? 'PM' : 'AM';
        let displayH = h % 12;
        if (displayH === 0) displayH = 12;
        const displayM = min === 0 ? ':00' : `:${String(min).padStart(2, '0')}`;
        return `${displayH}${displayM} ${period}`;
      }

      // Check if Spain is in CET (UTC+1) while North America is still in EDT (UTC-4)
      // In Europe, DST ends on the last Sunday of October; in US/Canada, DST ends on the 1st Sunday of November.
      const lastDayOct = new Date(Date.UTC(y, 9, 31));
      const lastSunOct = 31 - lastDayOct.getUTCDay();
      const firstDayNov = new Date(Date.UTC(y, 10, 1));
      const firstSunNov = 1 + ((7 - firstDayNov.getUTCDay()) % 7);
      const isSpainWinterTime = (m > 10) || (m < 3) || (m === 10 && d >= lastSunOct);
      const isUSWinterTime = (m > 11) || (m < 3) || (m === 11 && d >= firstSunNov);
      const spainUtcOffset = isSpainWinterTime ? 1 : 2; // CET = +1, CEST = +2
      const nyUtcOffset = isUSWinterTime ? -5 : -4;    // EST = -5, EDT = -4
      const diffHours = spainUtcOffset - nyUtcOffset;  // 5 hours during Oct 25–31, 6 hours otherwise
      const spainTzLabel = isSpainWinterTime ? 'CET' : 'CEST';
      const bgTzLabel = isSpainWinterTime ? 'EET' : 'EEST';

      const cestTime = formatTime12(hourRef, minRef);
      const cestHour24 = hourRef;
      const minPad = String(minRef).padStart(2, '0');
      const cestTime24 = minRef === 0 ? `${cestHour24}:00 h` : `${cestHour24}:${minPad} h`;
      const euTimeFr = `${cestHour24}h${minPad}`;
      const euTime24 = `${String(cestHour24).padStart(2, '0')}:${minPad}`;
      const bgHour24 = (cestHour24 + 1) % 24;
      const bgTime24 = `${String(bgHour24).padStart(2, '0')}:${minPad} ч.`;
      const adtTime = formatTime12((hourRef - (diffHours - 1) + 24) % 24, minRef);
      const edtTime = formatTime12((hourRef - diffHours + 24) % 24, minRef);
      const cdtTime = formatTime12((hourRef - (diffHours + 1) + 24) % 24, minRef);
      const mdtTime = formatTime12((hourRef - (diffHours + 2) + 24) % 24, minRef);
      const pdtTime = formatTime12((hourRef - (diffHours + 3) + 24) % 24, minRef);

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
          ? 'linear-gradient(90deg, rgba(22, 52, 82, 0.94) 0%, rgba(6, 114, 197, 0.92) 55%, rgba(254, 137, 51, 0.92) 100%)'
          : 'linear-gradient(90deg, rgba(22, 52, 82, 0.94) 0%, rgba(6, 114, 197, 0.92) 58%, rgba(254, 137, 51, 0.90) 100%)';
        topBannerEl.style.backdropFilter = 'saturate(180%) blur(20px)';
        topBannerEl.style.webkitBackdropFilter = 'saturate(180%) blur(20px)';
      }

      const topBannerBtn = document.getElementById('webinar-top-banner-btn');
      if (topBannerBtn) {
        topBannerBtn.style.background = '#ffffff';
        topBannerBtn.style.color = '#0672C5';
        topBannerBtn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.16)';
      }

      // ── Section & Ambient Glow Orbs Styling ──
      const sectionEl = document.getElementById('webinar-section');
      if (sectionEl) {
        sectionEl.style.paddingTop = '130px';
        sectionEl.style.background = isB2C
          ? 'linear-gradient(160deg, #140508 0%, #290710 28%, #480c1b 58%, #19030a 100%)'
          : 'linear-gradient(160deg, #030718 0%, #061530 35%, #0e051c 70%, #030718 100%)';
      }

      const orb1 = document.getElementById('webinar-orb-1');
      const orb2 = document.getElementById('webinar-orb-2');
      const orb3 = document.getElementById('webinar-orb-3');
      if (orb1) orb1.style.background = isB2C ? 'radial-gradient(circle, rgba(239,68,68,.38) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0,63,153,.28) 0%, transparent 70%)';
      if (orb2) orb2.style.background = isB2C ? 'radial-gradient(circle, rgba(244,63,94,.32) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(204,0,0,.16) 0%, transparent 70%)';
      if (orb3) orb3.style.background = isB2C ? 'radial-gradient(ellipse, rgba(245,158,11,.28) 0%, transparent 70%)' : 'radial-gradient(ellipse, rgba(0,63,153,.15) 0%, transparent 70%)';

      const topBandWrap = document.getElementById('webinar-top-announcement-band-wrap');
      if (topBandWrap) {
        topBandWrap.style.background = isB2C
          ? 'linear-gradient(90deg, #881337 0%, #be123c 25%, #e11d48 50%, #f97316 75%, #881337 100%)'
          : 'linear-gradient(90deg, #cc0000 0%, #003f99 50%, #cc0000 100%)';
      }

      // ── 1. Top Fixed Announcement Banner (#webinar-top-banner) ──
      const bannerTextEl = document.getElementById('webinar-top-banner-text');
      if (bannerTextEl && config.titlePrefix && config.titleHighlight) {
        const targetDescEn = activeType === 'b2b' ? 'Free for Agents & Brokers' : 'Free for Buyers & Investors';
        const targetDescEs = activeType === 'b2b' ? 'Gratuito para Agentes y Brokers' : 'Gratuito para Compradores e Inversores';
        const targetDescFr = activeType === 'b2b' ? 'Gratuit pour Agents & Courtiers' : 'Gratuit pour Acheteurs & Investisseurs';
        const targetDescFrEu = activeType === 'b2b' ? 'Gratuit Agences & CGP' : 'Accès Gratuit Acquéreurs';
        const targetDescNl = activeType === 'b2b' ? 'Gratis voor Makelaars' : 'Gratis voor Kopers & Beleggers';
        const targetDescSv = activeType === 'b2b' ? 'Kostnadsfritt för Mäklare' : 'Kostnadsfritt för Bostadsköpare';
        const targetDescBg = activeType === 'b2b' ? 'Безплатно за агенции и брокери' : 'Безплатно за купувачи и инвеститори';

        const tpFrEu = config.titlePrefix['fr-eu'] || config.titlePrefix.fr || config.titlePrefix.en;
        const thFrEu = config.titleHighlight['fr-eu'] || config.titleHighlight.fr || config.titleHighlight.en;
        const tpNl = config.titlePrefix.nl || config.titlePrefix.en;
        const thNl = config.titleHighlight.nl || config.titleHighlight.en;
        const tpSv = config.titlePrefix.sv || config.titlePrefix.en;
        const thSv = config.titleHighlight.sv || config.titleHighlight.en;
        const tpBg = config.titlePrefix.bg || config.titlePrefix.en;
        const thBg = config.titleHighlight.bg || config.titleHighlight.en;

        bannerTextEl.innerHTML = `
          <span class="lang-en">🎙️ <strong>${config.titlePrefix.en} ${config.titleHighlight.en}</strong> &nbsp;&middot;&nbsp; ${monthsEn[monthIndex]} ${dayNum}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime} Spain &nbsp;&middot;&nbsp; ${targetDescEn}</span></span>
          <span class="lang-es">🎙️ <strong>${config.titlePrefix.es} ${config.titleHighlight.es}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsEs[monthIndex]}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime24} España &nbsp;&middot;&nbsp; ${targetDescEs}</span></span>
          <span class="lang-fr">🎙️ <strong>${config.titlePrefix.fr} ${config.titleHighlight.fr}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsFr[monthIndex]}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime24} Espagne &nbsp;&middot;&nbsp; ${targetDescFr}</span></span>
          <span class="lang-en-ca">🎙️ <strong>${config.titlePrefix['en-ca'] || config.titlePrefix.en} ${config.titleHighlight['en-ca'] || config.titleHighlight.en}</strong> &nbsp;&middot;&nbsp; ${monthsEn[monthIndex]} ${dayNum}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${edtTime} / ${cestTime} Spain &nbsp;&middot;&nbsp; ${targetDescEn}</span></span>
          <span class="lang-fr-eu">🎙️ <strong>${tpFrEu} ${thFrEu}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsFr[monthIndex]}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${euTimeFr} ${spainTzLabel} (Paris / Bruxelles) &nbsp;&middot;&nbsp; ${targetDescFrEu}</span></span>
          <span class="lang-nl">🎙️ <strong>${tpNl} ${thNl}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsNl[monthIndex]}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${euTime24} uur ${spainTzLabel} (NL / BE) &nbsp;&middot;&nbsp; ${targetDescNl}</span></span>
          <span class="lang-sv">🎙️ <strong>${tpSv} ${thSv}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsSv[monthIndex]}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; kl. ${euTime24} ${spainTzLabel} (Sverige) &nbsp;&middot;&nbsp; ${targetDescSv}</span></span>
          <span class="lang-bg">🎙️ <strong>${tpBg} ${thBg}</strong> &nbsp;&middot;&nbsp; ${dayNum} ${monthsBg[monthIndex]}<span class="webinar-banner-extra"> &nbsp;&middot;&nbsp; ${bgTime24} ${bgTzLabel} (България) &nbsp;&middot;&nbsp; ${targetDescBg}</span></span>
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
          <span class="lang-fr-eu">${spots} places max.</span>
          <span class="lang-nl">Slechts ${spots} plaatsen</span>
          <span class="lang-sv">Endast ${spots} platser</span>
          <span class="lang-bg">Само ${spots} места</span>
        `;
      }

      // ── 2. Top Hero Announcement Band ──
      const topBandEl = document.getElementById('webinar-top-announcement-band');
      if (topBandEl && config.badge) {
        topBandEl.innerHTML = `
          <span class="lang-en">🔴 LIVE WEBINAR<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Exclusive Masterclass for US, Canadian & PR Realtors' : 'Living, Moving & Investing in Spain'}</span> &nbsp;&middot;&nbsp; ${formattedDateEn} &nbsp;&middot;&nbsp; FREE Registration</span>
          <span class="lang-es">🔴 WEBINAR EN VIVO<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Masterclass Exclusiva para Agentes y Brokers de EE.UU., Canadá y PR' : 'Vivir, Mudarse e Invertir en España'}</span> &nbsp;&middot;&nbsp; ${formattedDateEs} &nbsp;&middot;&nbsp; Registro GRATUITO</span>
          <span class="lang-fr">🔴 WEBINAIRE EN DIRECT<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Masterclass Exclusive pour Courtiers et Agents' : 'Vivre et Investir en Espagne'}</span> &nbsp;&middot;&nbsp; ${formattedDateFr} &nbsp;&middot;&nbsp; Inscription GRATUITE</span>
          <span class="lang-en-ca">🔴 LIVE WEBINAR<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Exclusive Masterclass for North American Realtors' : 'Living, Moving & Investing in Spain'}</span> &nbsp;&middot;&nbsp; ${formattedDateEn} &nbsp;&middot;&nbsp; FREE Registration</span>
          <span class="lang-fr-eu">🔴 CONFÉRENCE EN DIRECT<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Réseau Partenaire Agences, Mandataires & CGP' : 'Acheter, S\'installer & Investir sur la Costa Blanca'}</span> &nbsp;&middot;&nbsp; ${formattedDateFr} &nbsp;&middot;&nbsp; Accès GRATUIT</span>
          <span class="lang-nl">🔴 LIVE WEBINAR<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Partnersessie voor Makelaars & Financieel Adviseurs' : 'Zorgeloos Kopen, Wonen & Verhuren in Spanje'}</span> &nbsp;&middot;&nbsp; ${formattedDateNl} &nbsp;&middot;&nbsp; GRATIS Aanmelding</span>
          <span class="lang-sv">🔴 LIVE WEBBINARIUM<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Partnerwebbinarium för Svenska Fastighetsmäklare' : 'Tryggt Bostadsköp, Juridik & Boende i Spanien'}</span> &nbsp;&middot;&nbsp; ${formattedDateSv} &nbsp;&middot;&nbsp; Kostnadsfritt</span>
          <span class="lang-bg">🔴 УЕБИНАР НА ЖИВО<span class="webinar-band-extra"> &nbsp;&middot;&nbsp; 🇪🇸 ${activeType === 'b2b' ? 'Партньорска среща за агенции и брокери от България' : 'Покупка на имот, правна сигурност и доходност в Испания'}</span> &nbsp;&middot;&nbsp; ${formattedDateBg} &nbsp;&middot;&nbsp; БЕЗПЛАТНА Регистрация</span>
        `;
      }

      // ── 3. Hero Label Pill ──
      const heroPillWrap = document.getElementById('webinar-hero-pill-wrap');
      if (heroPillWrap) {
        heroPillWrap.style.background = isB2C ? 'rgba(225,29,72,.16)' : 'rgba(255,255,255,.07)';
        heroPillWrap.style.border = isB2C ? '1.5px solid rgba(244,63,94,.6)' : '1px solid rgba(255,255,255,.15)';
        heroPillWrap.style.boxShadow = isB2C ? '0 0 24px rgba(225,29,72,.28)' : 'none';
      }

      const heroPillEl = document.getElementById('webinar-hero-pill');
      if (heroPillEl && config.heroPill) {
        heroPillEl.style.color = isB2C ? '#ffe4e6' : 'rgba(255,255,255,.85)';
        heroPillEl.innerHTML = `
          <span class="lang-en">${config.heroPill.en}</span>
          <span class="lang-es">${config.heroPill.es}</span>
          <span class="lang-fr">${config.heroPill.fr}</span>
          <span class="lang-en-ca">${config.heroPill['en-ca'] || config.heroPill.en}</span>
          <span class="lang-fr-eu">${config.heroPill['fr-eu'] || config.heroPill.fr || config.heroPill.en}</span>
          <span class="lang-nl">${config.heroPill.nl || config.heroPill.en}</span>
          <span class="lang-sv">${config.heroPill.sv || config.heroPill.en}</span>
          <span class="lang-bg">${config.heroPill.bg || config.heroPill.en}</span>
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
            ? 'linear-gradient(90deg, #ff4365 0%, #f43f5e 35%, #fb7185 70%, #fbbf24 100%)'
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
        setPrefixHighlight('fr-eu', config.titlePrefix['fr-eu'] || config.titlePrefix.fr || config.titlePrefix.en, config.titleHighlight['fr-eu'] || config.titleHighlight.fr || config.titleHighlight.en);
        setPrefixHighlight('nl', config.titlePrefix.nl || config.titlePrefix.en, config.titleHighlight.nl || config.titleHighlight.en);
        setPrefixHighlight('sv', config.titlePrefix.sv || config.titlePrefix.en, config.titleHighlight.sv || config.titleHighlight.en);
        setPrefixHighlight('bg', config.titlePrefix.bg || config.titlePrefix.en, config.titleHighlight.bg || config.titleHighlight.en);
      }

      // ── 5. Hero Subtitle ──
      const heroSubEl = document.getElementById('webinar-hero-subtitle');
      if (heroSubEl && config.subtitleText) {
        heroSubEl.innerHTML = `
          <span class="lang-en">${config.subtitleText.en}</span>
          <span class="lang-es">${config.subtitleText.es}</span>
          <span class="lang-fr">${config.subtitleText.fr}</span>
          <span class="lang-en-ca">${config.subtitleText['en-ca'] || config.subtitleText.en}</span>
          <span class="lang-fr-eu">${config.subtitleText['fr-eu'] || config.subtitleText.fr || config.subtitleText.en}</span>
          <span class="lang-nl">${config.subtitleText.nl || config.subtitleText.en}</span>
          <span class="lang-sv">${config.subtitleText.sv || config.subtitleText.en}</span>
          <span class="lang-bg">${config.subtitleText.bg || config.subtitleText.en}</span>
        `;
      }

      // ── 6. Hero Spots Urgency Pill ──
      const heroSpotsEl = document.getElementById('webinar-hero-spots-pill');
      if (heroSpotsEl) {
        heroSpotsEl.style.background = isB2C ? 'rgba(225,29,72,.22)' : 'rgba(255,180,0,.12)';
        heroSpotsEl.style.border = isB2C ? '1px solid rgba(244,63,94,.6)' : '1px solid rgba(255,180,0,.35)';
        heroSpotsEl.style.color = isB2C ? '#ffe4e6' : '#ffe066';
        heroSpotsEl.style.boxShadow = isB2C ? '0 0 18px rgba(225,29,72,.35)' : 'none';
        heroSpotsEl.innerHTML = `
          🔥
          <span class="lang-en">Only ${spots} spots available</span>
          <span class="lang-es">Solo ${spots} plazas disponibles</span>
          <span class="lang-fr">Seulement ${spots} places disponibles</span>
          <span class="lang-en-ca">Only ${spots} spots available</span>
          <span class="lang-fr-eu">${spots} places disponibles (Q&amp;R en direct)</span>
          <span class="lang-nl">Slechts ${spots} plaatsen beschikbaar</span>
          <span class="lang-sv">Endast ${spots} platser tillgängliga</span>
          <span class="lang-bg">Само ${spots} свободни места</span>
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
          <span class="lang-fr-eu">${dayDateFr} &mdash; Heure Europe (${euTimeFr} ${spainTzLabel} Paris / Bruxelles)</span>
          <span class="lang-nl">${dayDateNl} &mdash; Lokale tijd (${euTime24} uur ${spainTzLabel} NL / BE)</span>
          <span class="lang-sv">${dayDateSv} &mdash; Svensk tid (kl. ${euTime24} ${spainTzLabel})</span>
          <span class="lang-bg">${dayDateBg} &mdash; Българско време (${bgTime24} ${bgTzLabel})</span>
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
          ? 'linear-gradient(135deg, rgba(136,19,55,.55), rgba(225,29,72,.3))'
          : 'linear-gradient(135deg, rgba(0,63,153,.45), rgba(0,85,204,.28))';
        refCard.style.border = isB2C ? '2px solid rgba(244,63,94,.75)' : '2px solid rgba(91,173,255,.45)';
        refCard.style.boxShadow = isB2C ? '0 0 35px rgba(225,29,72,.38)' : '0 0 28px rgba(0,63,153,.35)';
      }

      const refBadge = document.getElementById('webinar-reference-badge');
      if (refBadge) {
        refBadge.style.background = isB2C ? 'linear-gradient(90deg, #be123c, #e11d48)' : 'linear-gradient(90deg, #003f99, #0055cc)';
        refBadge.style.boxShadow = isB2C ? '0 2px 12px rgba(225,29,72,.45)' : 'none';
      }

      // ── 8. What You'll Learn Section ──
      const headlineEl = document.getElementById('webinar-section-headline');
      if (headlineEl && config.sectionHeadline) {
        headlineEl.innerHTML = `
          <span class="lang-en">${config.sectionHeadline.en}</span>
          <span class="lang-es">${config.sectionHeadline.es}</span>
          <span class="lang-fr">${config.sectionHeadline.fr}</span>
          <span class="lang-en-ca">${config.sectionHeadline['en-ca'] || config.sectionHeadline.en}</span>
          <span class="lang-fr-eu">${config.sectionHeadline['fr-eu'] || config.sectionHeadline.fr || config.sectionHeadline.en}</span>
          <span class="lang-nl">${config.sectionHeadline.nl || config.sectionHeadline.en}</span>
          <span class="lang-sv">${config.sectionHeadline.sv || config.sectionHeadline.en}</span>
          <span class="lang-bg">${config.sectionHeadline.bg || config.sectionHeadline.en}</span>
        `;
      }

      const subheadlineEl = document.getElementById('webinar-section-subheadline');
      if (subheadlineEl && config.sectionSubheadline) {
        subheadlineEl.innerHTML = `
          <span class="lang-en">${config.sectionSubheadline.en}</span>
          <span class="lang-es">${config.sectionSubheadline.es}</span>
          <span class="lang-fr">${config.sectionSubheadline.fr}</span>
          <span class="lang-en-ca">${config.sectionSubheadline['en-ca'] || config.sectionSubheadline.en}</span>
          <span class="lang-fr-eu">${config.sectionSubheadline['fr-eu'] || config.sectionSubheadline.fr || config.sectionSubheadline.en}</span>
          <span class="lang-nl">${config.sectionSubheadline.nl || config.sectionSubheadline.en}</span>
          <span class="lang-sv">${config.sectionSubheadline.sv || config.sectionSubheadline.en}</span>
          <span class="lang-bg">${config.sectionSubheadline.bg || config.sectionSubheadline.en}</span>
        `;
      }

      const hoverBorderColor = isB2C ? 'rgba(244,63,94,.45)' : 'rgba(91,173,255,.3)';
      const benefitsContainer = document.getElementById('webinar-benefits-container');
      if (benefitsContainer && Array.isArray(config.benefits)) {
        benefitsContainer.innerHTML = config.benefits.map(b => `
          <div class="webinar-benefit-card" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:22px;display:flex;gap:14px;align-items:flex-start;transition:transform .2s,border-color .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.borderColor='${hoverBorderColor}';this.style.boxShadow='0 8px 24px rgba(0,0,0,.25)';" onmouseout="this.style.transform='';this.style.borderColor='rgba(255,255,255,.08)';this.style.boxShadow='none';">
            <div class="webinar-benefit-icon" style="font-size:1.8rem;flex-shrink:0;">${b.icon || '✨'}</div>
            <div>
              <div style="font-weight:700;color:#fff;font-size:.92rem;margin-bottom:5px;">
                <span class="lang-en">${b.title?.en || ''}</span>
                <span class="lang-es">${b.title?.es || ''}</span>
                <span class="lang-fr">${b.title?.fr || ''}</span>
                <span class="lang-en-ca">${b.title?.['en-ca'] || b.title?.en || ''}</span>
                <span class="lang-fr-eu">${b.title?.['fr-eu'] || b.title?.fr || b.title?.en || ''}</span>
                <span class="lang-nl">${b.title?.nl || b.title?.en || ''}</span>
                <span class="lang-sv">${b.title?.sv || b.title?.en || ''}</span>
                <span class="lang-bg">${b.title?.bg || b.title?.en || ''}</span>
              </div>
              <div style="color:rgba(255,255,255,.42);font-size:.8rem;line-height:1.55;">
                <span class="lang-en">${b.desc?.en || ''}</span>
                <span class="lang-es">${b.desc?.es || ''}</span>
                <span class="lang-fr">${b.desc?.fr || ''}</span>
                <span class="lang-en-ca">${b.desc?.['en-ca'] || b.desc?.en || ''}</span>
                <span class="lang-fr-eu">${b.desc?.['fr-eu'] || b.desc?.fr || b.desc?.en || ''}</span>
                <span class="lang-nl">${b.desc?.nl || b.desc?.en || ''}</span>
                <span class="lang-sv">${b.desc?.sv || b.desc?.en || ''}</span>
                <span class="lang-bg">${b.desc?.bg || b.desc?.en || ''}</span>
              </div>
            </div>
          </div>
        `).join('');
      }

      // ── Urgency CTA Bar & Button ──
      const urgencyBar = document.getElementById('webinar-urgency-bar');
      if (urgencyBar) {
        urgencyBar.style.background = isB2C
          ? 'linear-gradient(135deg, rgba(136,19,55,.35), rgba(225,29,72,.25))'
          : 'linear-gradient(135deg, rgba(204,0,0,.15), rgba(0,63,153,.25))';
        urgencyBar.style.border = isB2C ? '1px solid rgba(244,63,94,.45)' : '1px solid rgba(255,255,255,.12)';
        urgencyBar.style.boxShadow = isB2C ? '0 10px 35px rgba(225,29,72,.2)' : 'none';
      }

      const urgencyBtn = document.getElementById('webinar-urgency-btn');
      if (urgencyBtn) {
        urgencyBtn.style.background = isB2C
          ? 'linear-gradient(135deg, #e11d48 0%, #be123c 45%, #9f1239 100%)'
          : 'linear-gradient(135deg, #003f99 0%, #cc0000 100%)';
        urgencyBtn.style.boxShadow = isB2C ? '0 8px 32px rgba(225,29,72,.55)' : '0 6px 28px rgba(0,63,153,.35)';
      }

      // ── 9. Form Card Header, Inputs & Submit Button ──
      const cardHeader = document.getElementById('webinar-card-header');
      if (cardHeader) {
        cardHeader.style.background = isB2C
          ? 'linear-gradient(135deg, #881337 0%, #be123c 40%, #e11d48 75%, #f97316 110%)'
          : 'linear-gradient(135deg, #003f99 0%, #004ab5 40%, #880000 130%)';
      }

      const cardHeaderTitle = document.getElementById('webinar-card-header-title');
      if (cardHeaderTitle && config.titlePrefix && config.titleHighlight) {
        cardHeaderTitle.innerHTML = `
          <span class="lang-en">${config.titlePrefix.en} ${config.titleHighlight.en} · ${formattedDateEn}</span>
          <span class="lang-es">${config.titlePrefix.es} ${config.titleHighlight.es} · ${formattedDateEs}</span>
          <span class="lang-fr">${config.titlePrefix.fr} ${config.titleHighlight.fr} · ${formattedDateFr}</span>
          <span class="lang-en-ca">${config.titlePrefix['en-ca'] || config.titlePrefix.en} ${config.titleHighlight['en-ca'] || config.titleHighlight.en} · ${formattedDateEn}</span>
          <span class="lang-fr-eu">${config.titlePrefix['fr-eu'] || config.titlePrefix.fr || config.titlePrefix.en} ${config.titleHighlight['fr-eu'] || config.titleHighlight.fr || config.titleHighlight.en} · ${formattedDateFr}</span>
          <span class="lang-nl">${config.titlePrefix.nl || config.titlePrefix.en} ${config.titleHighlight.nl || config.titleHighlight.en} · ${formattedDateNl}</span>
          <span class="lang-sv">${config.titlePrefix.sv || config.titlePrefix.en} ${config.titleHighlight.sv || config.titleHighlight.en} · ${formattedDateSv}</span>
          <span class="lang-bg">${config.titlePrefix.bg || config.titlePrefix.en} ${config.titleHighlight.bg || config.titleHighlight.en} · ${formattedDateBg}</span>
        `;
      }

      const cardHeaderSubtitle = document.getElementById('webinar-card-header-subtitle');
      if (cardHeaderSubtitle) {
        cardHeaderSubtitle.innerHTML = `
          <span class="lang-en">${cestTime} ${spainTzLabel} (Spain) | ${edtTime} EDT (Miami/NY/Toronto) | ${edtTime} AST (PR) | ${pdtTime} PDT</span>
          <span class="lang-es">${cestTime24} ${spainTzLabel} (España) | ${edtTime} EDT (Miami/NY) | ${pdtTime} PDT</span>
          <span class="lang-fr">${cestTime24} ${spainTzLabel} (Espagne) | ${edtTime} EDT (Montréal/Toronto) | ${pdtTime} PDT</span>
          <span class="lang-en-ca">${edtTime} EDT (Toronto/Ottawa) | ${pdtTime} PDT (Vancouver) | ${cestTime} ${spainTzLabel} (Spain)</span>
          <span class="lang-fr-eu">${euTimeFr} ${spainTzLabel} (Paris · Bruxelles · Genève · Madrid)</span>
          <span class="lang-nl">${euTime24} uur ${spainTzLabel} (Amsterdam · Brussel · Alicante)</span>
          <span class="lang-sv">Kl. ${euTime24} ${spainTzLabel} (Stockholm · Göteborg · Madrid)</span>
          <span class="lang-bg">${bgTime24} ${bgTzLabel} (София · Пловдив · Варна) &nbsp;|&nbsp; ${euTime24} ${spainTzLabel} (Испания)</span>
        `;
      }

      const submitBtn = document.getElementById('webinar-submit-btn');
      if (submitBtn) {
        submitBtn.style.background = isB2C
          ? 'linear-gradient(135deg, #e11d48 0%, #be123c 45%, #9f1239 100%)'
          : 'linear-gradient(135deg, #003f99 0%, #cc0000 100%)';
        submitBtn.style.boxShadow = isB2C ? '0 8px 32px rgba(225,29,72,.55)' : '0 6px 28px rgba(0,63,153,.35)';
      }

      const agencyLabel = document.getElementById('webinar-agency-label');
      if (agencyLabel && config.organizationLabel) {
        agencyLabel.innerHTML = `
          <span class="lang-en">${config.organizationLabel.en}</span>
          <span class="lang-es">${config.organizationLabel.es}</span>
          <span class="lang-fr">${config.organizationLabel.fr}</span>
          <span class="lang-en-ca">${config.organizationLabel['en-ca'] || config.organizationLabel.en}</span>
          <span class="lang-fr-eu">${config.organizationLabel['fr-eu'] || config.organizationLabel.fr || config.organizationLabel.en}</span>
          <span class="lang-nl">${config.organizationLabel.nl || config.organizationLabel.en}</span>
          <span class="lang-sv">${config.organizationLabel.sv || config.organizationLabel.en}</span>
          <span class="lang-bg">${config.organizationLabel.bg || config.organizationLabel.en}</span>
        `;
      }

      const agencyInput = document.getElementById('webinar-agency');
      if (agencyInput && config.organizationPlaceholder && (!window.App || window.App.getLanguage() === 'en')) {
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
          <span class="lang-fr-eu">Participez à la conférence en direct "${config.titlePrefix['fr-eu'] || config.titlePrefix.fr} ${config.titleHighlight['fr-eu'] || config.titleHighlight.fr}" le ${formattedDateFr}.</span>
          <span class="lang-nl">Neem deel aan het live webinar "${config.titlePrefix.nl || config.titlePrefix.en} ${config.titleHighlight.nl || config.titleHighlight.en}" op ${formattedDateNl}.</span>
          <span class="lang-sv">Delta i live-webbinariet "${config.titlePrefix.sv || config.titlePrefix.en} ${config.titleHighlight.sv || config.titleHighlight.en}" den ${formattedDateSv}.</span>
          <span class="lang-bg">Включете се в уебинара на живо „${config.titlePrefix.bg || config.titlePrefix.en} ${config.titleHighlight.bg || config.titleHighlight.en}“ на ${formattedDateBg}.</span>
        `;
      }

      // ── 11. Live Countdown Timer ──
      if (window._webinarCountdownInterval) {
        clearInterval(window._webinarCountdownInterval);
        window._webinarCountdownInterval = null;
      }

      const countdownEl = document.getElementById('webinar-countdown');
      if (countdownEl) {
        const targetDate = new Date(`${dateStr}T${timeStr}:00+0${spainUtcOffset}:00`);
        function tick() {
          const now = new Date();
          const diff = targetDate - now;
          if (diff <= 0) {
            countdownEl.innerHTML = '<span style="font-size:1.4rem;font-weight:700;color:#fff;">🎙️ <span class="lang-en">The webinar is LIVE!</span><span class="lang-es">¡El webinar está EN VIVO!</span><span class="lang-fr">Le webinaire est EN DIRECT !</span><span class="lang-en-ca">The webinar is LIVE!</span><span class="lang-fr-eu">La conférence est EN DIRECT !</span><span class="lang-nl">Het webinar is NU LIVE!</span><span class="lang-sv">Webbinariet sänds NU LIVE!</span><span class="lang-bg">Уебинарът е НА ЖИВО!</span></span>';
            return;
          }
          const d = Math.floor(diff / 86400000);
          const h = Math.floor((diff % 86400000) / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          const pad = n => String(n).padStart(2, '0');
          countdownEl.innerHTML = `
            <div class="webinar-countdown-row" style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;align-items:center;">
              <div class="webinar-countdown-unit" style="text-align:center;min-width:52px;">
                <div class="webinar-countdown-num" style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${d}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Days</span><span class="lang-es">Días</span><span class="lang-fr">Jours</span><span class="lang-en-ca">Days</span><span class="lang-fr-eu">Jours</span><span class="lang-nl">Dagen</span><span class="lang-sv">Dagar</span><span class="lang-bg">Дни</span></div>
              </div>
              <div class="webinar-countdown-sep" style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
              <div class="webinar-countdown-unit" style="text-align:center;min-width:52px;">
                <div class="webinar-countdown-num" style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(h)}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Hours</span><span class="lang-es">Horas</span><span class="lang-fr">Heures</span><span class="lang-en-ca">Hours</span><span class="lang-fr-eu">Heures</span><span class="lang-nl">Uur</span><span class="lang-sv">Timmar</span><span class="lang-bg">Часа</span></div>
              </div>
              <div class="webinar-countdown-sep" style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
              <div class="webinar-countdown-unit" style="text-align:center;min-width:52px;">
                <div class="webinar-countdown-num" style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(m)}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Min</span><span class="lang-es">Min</span><span class="lang-fr">Min</span><span class="lang-en-ca">Min</span><span class="lang-fr-eu">Min</span><span class="lang-nl">Min</span><span class="lang-sv">Min</span><span class="lang-bg">Мин</span></div>
              </div>
              <div class="webinar-countdown-sep" style="font-size:2rem;color:rgba(255,255,255,.3);padding-bottom:18px;">:</div>
              <div class="webinar-countdown-unit" style="text-align:center;min-width:52px;">
                <div class="webinar-countdown-num" style="font-size:2.4rem;font-weight:800;color:#fff;line-height:1;font-variant-numeric:tabular-nums;">${pad(s)}</div>
                <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.55);margin-top:4px;"><span class="lang-en">Sec</span><span class="lang-es">Seg</span><span class="lang-fr">Sec</span><span class="lang-en-ca">Sec</span><span class="lang-fr-eu">Sec</span><span class="lang-nl">Sec</span><span class="lang-sv">Sek</span><span class="lang-bg">Сек</span></div>
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
      const curLang = (window.App && typeof window.App.getLanguage === 'function') ? window.App.getLanguage() : 'en';
      if (country === 'United States' || !country) {
        const map = {
          en: '— Select State —', es: '— Selecciona Estado —', fr: '— Sélectionner un État —', 'en-ca': '— Select State —',
          'fr-eu': '— Sélectionner un État —', nl: '— Kies een staat —', sv: '— Välj delstat —', bg: '— Изберете щат —'
        };
        stateSelect.innerHTML = `<option value="" data-i18n-en="${map.en}" data-i18n-es="${map.es}" data-i18n-fr="${map.fr}" data-i18n-en-ca="${map['en-ca']}" data-i18n-fr-eu="${map['fr-eu']}" data-i18n-nl="${map.nl}" data-i18n-sv="${map.sv}" data-i18n-bg="${map.bg}">${map[curLang] || map.en}</option>` +
          US_STATES.map(s => `<option value="${s}">${s}</option>`).join('');
      } else if (country === 'Canada') {
        const map = {
          en: '— Select Province / Territory —', es: '— Selecciona Provincia / Territorio —', fr: '— Sélectionner une Province —', 'en-ca': '— Select Province / Territory —',
          'fr-eu': '— Sélectionner une Province —', nl: '— Kies een provincie —', sv: '— Välj provins —', bg: '— Изберете провинция —'
        };
        stateSelect.innerHTML = `<option value="" data-i18n-en="${map.en}" data-i18n-es="${map.es}" data-i18n-fr="${map.fr}" data-i18n-en-ca="${map['en-ca']}" data-i18n-fr-eu="${map['fr-eu']}" data-i18n-nl="${map.nl}" data-i18n-sv="${map.sv}" data-i18n-bg="${map.bg}">${map[curLang] || map.en}</option>` +
          CA_PROVINCES.map(s => `<option value="${s}">${s}</option>`).join('');
      } else if (country === 'Puerto Rico') {
        const map = {
          en: '— Select Region / Municipality —', es: '— Selecciona Municipio / Región —', fr: '— Sélectionner une Municipalité —', 'en-ca': '— Select Region / Municipality —',
          'fr-eu': '— Sélectionner une région —', nl: '— Kies een regio —', sv: '— Välj kommun / region —', bg: '— Изберете регион —'
        };
        stateSelect.innerHTML = `<option value="" data-i18n-en="${map.en}" data-i18n-es="${map.es}" data-i18n-fr="${map.fr}" data-i18n-en-ca="${map['en-ca']}" data-i18n-fr-eu="${map['fr-eu']}" data-i18n-nl="${map.nl}" data-i18n-sv="${map.sv}" data-i18n-bg="${map.bg}">${map[curLang] || map.en}</option>` +
          PR_AREAS.map(s => `<option value="${s}">${s}</option>`).join('');
      } else if (country === 'Other') {
        const map = {
          en: '🌍 International', es: '🌍 Internacional', fr: '🌍 International', 'en-ca': '🌍 International',
          'fr-eu': '🌍 International', nl: '🌍 Internationaal', sv: '🌍 Internationellt', bg: '🌍 Международен'
        };
        stateSelect.innerHTML = `<option value="International" data-i18n-en="${map.en}" data-i18n-es="${map.es}" data-i18n-fr="${map.fr}" data-i18n-en-ca="${map['en-ca']}" data-i18n-fr-eu="${map['fr-eu']}" data-i18n-nl="${map.nl}" data-i18n-sv="${map.sv}" data-i18n-bg="${map.bg}" selected>${map[curLang] || map.en}</option>`;
      } else {
        const genMap = {
          en: `📍 ${country} (General)`, es: `📍 ${country} (Principal / General)`, fr: `📍 ${country} (Général)`, 'en-ca': `📍 ${country} (General)`,
          'fr-eu': `📍 ${country} (Ensemble du pays)`, nl: `📍 ${country} (Algemeen)`, sv: `📍 ${country} (Hela landet)`, bg: `📍 ${country} (Общо)`
        };
        const capMap = {
          en: `🏙️ ${country} — Capital / Metro`, es: `🏙️ ${country} — Capital / Área Metropolitana`, fr: `🏙️ ${country} — Capitale / Métropole`, 'en-ca': `🏙️ ${country} — Capital / Metro`,
          'fr-eu': `🏙️ ${country} — Capitale / Métropole`, nl: `🏙️ ${country} — Randstad / Hoofdstad`, sv: `🏙️ ${country} — Storstadsregion`, bg: `🏙️ ${country} — Столица / Голям град`
        };
        const othMap = {
          en: '🌍 Other / International', es: '🌍 Otro / Internacional', fr: '🌍 Autre / International', 'en-ca': '🌍 Other / International',
          'fr-eu': '🌍 Autre région', nl: '🌍 Andere regio', sv: '🌍 Annan region', bg: '🌍 Друг регион'
        };
        stateSelect.innerHTML =
          `<option value="${country} — General" data-i18n-en="${genMap.en}" data-i18n-es="${genMap.es}" data-i18n-fr="${genMap.fr}" data-i18n-en-ca="${genMap['en-ca']}" data-i18n-fr-eu="${genMap['fr-eu']}" data-i18n-nl="${genMap.nl}" data-i18n-sv="${genMap.sv}" data-i18n-bg="${genMap.bg}" selected>${genMap[curLang] || genMap.en}</option>` +
          `<option value="${country} — Capital / Metro" data-i18n-en="${capMap.en}" data-i18n-es="${capMap.es}" data-i18n-fr="${capMap.fr}" data-i18n-en-ca="${capMap['en-ca']}" data-i18n-fr-eu="${capMap['fr-eu']}" data-i18n-nl="${capMap.nl}" data-i18n-sv="${capMap.sv}" data-i18n-bg="${capMap.bg}">${capMap[curLang] || capMap.en}</option>` +
          `<option value="International" data-i18n-en="${othMap.en}" data-i18n-es="${othMap.es}" data-i18n-fr="${othMap.fr}" data-i18n-en-ca="${othMap['en-ca']}" data-i18n-fr-eu="${othMap['fr-eu']}" data-i18n-nl="${othMap.nl}" data-i18n-sv="${othMap.sv}" data-i18n-bg="${othMap.bg}">${othMap[curLang] || othMap.en}</option>`;
      }
    }

    if (countrySelect && stateSelect) {
      const curLangInit = (window.App && typeof window.App.getLanguage === 'function') ? window.App.getLanguage() : 'en';
      const defaultCountryByLang = { 'fr-eu': 'France', nl: 'Netherlands', sv: 'Sweden', bg: 'Bulgaria', 'en-ca': 'Canada', fr: 'Canada' };
      if (defaultCountryByLang[curLangInit] && countrySelect.value === 'United States') {
        countrySelect.value = defaultCountryByLang[curLangInit];
      }
      populateStates(countrySelect.value || 'United States');
      countrySelect.addEventListener('change', () => populateStates(countrySelect.value));
    }

    // ---- Personalized Client Webinar Link Referrer Resolution & Branding ----
    const hearSelect        = document.getElementById('webinar-how-heard');
    const hearGroup         = document.getElementById('webinar-how-heard-group');
    const referrerWrap      = document.getElementById('webinar-referrer-wrap');
    const collaboratorWrap  = document.getElementById('webinar-collaborator-wrap');

    const activeWebinarRefCode = (
      sessionStorage.getItem('webinarReferralCode') ||
      (sessionStorage.getItem('webinarClientInvite') === '1' ? sessionStorage.getItem('referralCode') : '') ||
      ''
    ).trim();

    async function resolveWebinarReferrer(code) {
      if (!code) return null;
      const partnerTypeByCode = {
        'UCI': 'needsUCI',
        'Fuster & Associates': 'needsFuster',
        'Inmomás Holidays': 'needsHolidays'
      };
      const mappedPType = partnerTypeByCode[code];

      if (App.demoData && Array.isArray(App.demoData.users)) {
        const demoRef = App.demoData.users.find(u =>
          u.referralCode === code || (mappedPType && u.partnerType === mappedPType)
        );
        if (demoRef && (App.demoMode || !App.db)) {
          const copy = { ...demoRef };
          if (copy.role === 'realtor' && App.utils && App.utils.resolveUserUmbrellaParents) {
            const pBrk = App.utils.resolveUserUmbrellaParents(copy, App.demoData.users).broker;
            if (pBrk) {
              if (pBrk.agencyName) copy.agencyName = pBrk.agencyName;
              copy.agencyLogo = pBrk.agencyLogo || null;
            }
          }
          return copy;
        }
      }

      if (!App.demoMode && App.db) {
        try {
          let snap = await App.db.collection('users').where('referralCode', '==', code).limit(1).get();
          if (snap.empty && mappedPType) {
            snap = await App.db.collection('users').where('partnerType', '==', mappedPType).limit(1).get();
          }
          if (!snap.empty) {
            const doc = snap.docs[0];
            const refData = { id: doc.id, ...doc.data() };
            if (refData.role === 'realtor' && (refData.brokerId || refData.referredBy)) {
              try {
                let bData = null;
                if (refData.brokerId) {
                  const bDoc = await App.db.collection('users').doc(refData.brokerId).get();
                  if (bDoc.exists && bDoc.data().role === 'broker') bData = bDoc.data();
                }
                if (!bData && refData.referredBy) {
                  const bSnap = await App.db.collection('users').where('referralCode', '==', refData.referredBy).limit(1).get();
                  if (!bSnap.empty && bSnap.docs[0].data().role === 'broker') bData = bSnap.docs[0].data();
                }
                if (bData) {
                  if (bData.agencyName) refData.agencyName = bData.agencyName;
                  refData.agencyLogo = bData.agencyLogo || null;
                }
              } catch (_) {}
            }
            return refData;
          }
        } catch (err) {
          console.warn('[Webinar] Referrer Firestore lookup warning:', err);
        }
      }

      if (App.demoData && Array.isArray(App.demoData.users)) {
        const fallbackRef = App.demoData.users.find(u =>
          u.referralCode === code || (mappedPType && u.partnerType === mappedPType)
        );
        if (fallbackRef) return { ...fallbackRef };
      }
      if (code === 'UCI') return { id: 'UCI', firstName: 'UCI', lastName: '', agencyName: 'UCI', role: 'partner', referralCode: 'UCI' };
      if (code === 'Fuster & Associates') return { id: 'Fuster & Associates', firstName: 'Fuster', lastName: '& Associates', agencyName: 'Fuster & Associates', role: 'partner', referralCode: 'Fuster & Associates' };
      if (code === 'Inmomás Holidays') return { id: 'Inmomás Holidays', firstName: 'Inmomás', lastName: 'Holidays', agencyName: 'Inmomás Holidays', role: 'partner', referralCode: 'Inmomás Holidays' };
      return null;
    }

    if (activeWebinarRefCode) {
      // Hide manual "How did you hear?" selector since invitation comes from a direct Client Webinar Link
      if (hearGroup) hearGroup.style.display = 'none';
      if (hearSelect) hearSelect.required = false;
      if (referrerWrap) referrerWrap.style.display = 'none';
      if (collaboratorWrap) collaboratorWrap.style.display = 'none';

      resolveWebinarReferrer(activeWebinarRefCode).then(refObj => {
        window._currentWebinarReferrer = refObj || null;
        if (refObj) {
          App.views.public.renderPartnerBranding(refObj, 'webinar');
        }
      });
    } else {
      window._currentWebinarReferrer = null;
      App.views.public.renderPartnerBranding(null, 'webinar');
      if (hearGroup) hearGroup.style.display = '';
      if (hearSelect) hearSelect.required = true;
    }

    // Reset form/success panels if revisiting view
    const resetSuccessPanel = document.getElementById('webinar-success-panel');
    const resetFormPanel = document.getElementById('webinar-form-panel') || document.getElementById('webinar-form-body');
    if (resetSuccessPanel && resetFormPanel) {
      resetSuccessPanel.style.display = 'none';
      resetFormPanel.style.display = '';
    }

    // ---- "How did you hear" → show/hide Referrer Name / Collaborator fields ----

    // Populate collaborator dropdown from active users with roles colaborador | realtor | broker
    async function populateCollaboratorDropdown() {
      const sel = document.getElementById('webinar-collaborator-name');
      if (!sel) return;

      // Preserve current blank placeholder options (lang-xx value="")
      const placeholders = Array.from(sel.querySelectorAll('option[value=""]'));
      sel.innerHTML = '';
      placeholders.forEach(p => sel.appendChild(p));

      try {
        let collaborators = [];

        const isApproved = (s) => App.utils && typeof App.utils.isApprovedUserStatus === 'function'
          ? App.utils.isApprovedUserStatus(s)
          : (s === 'active' || s === 'approved');

        if (App.demoMode && App.demoData && App.demoData.users) {
          collaborators = App.demoData.users.filter(u =>
            ['embajador', 'colaborador', 'realtor', 'broker'].includes(u.role) &&
            isApproved(u.status)
          );
        } else if (!App.demoMode && App.db) {
          // Firestore: query each role separately and filter approved/active in JS to avoid composite-index issues
          const roles = ['embajador', 'colaborador', 'realtor', 'broker'];
          const snaps = await Promise.all(
            roles.map(r => App.db.collection('users').where('role', '==', r).get())
          );
          const seenIds = new Set();
          snaps.forEach(snap => {
            snap.docs.forEach(doc => {
              const u = { id: doc.id, ...doc.data() };
              if (isApproved(u.status) && !seenIds.has(u.id)) {
                seenIds.add(u.id);
                collaborators.push(u);
              }
            });
          });
        }

        // Fallback: if empty, use hardcoded seed list from known platform users
        if (!collaborators.length) {
          collaborators = [
            { id: 'seed-1', firstName: 'Ana', lastName: 'Cerruti', role: 'realtor' },
            { id: 'seed-2', firstName: 'Mariela', lastName: 'Zapiola', role: 'realtor' },
            { id: 'seed-3', firstName: 'Melanie', lastName: 'Santana', role: 'broker' },
            { id: 'seed-4', firstName: 'Flor', lastName: 'Diaz', role: 'realtor' },
            { id: 'seed-5', firstName: 'Cesar', lastName: 'Arteaga', role: 'realtor' },
            { id: 'seed-6', firstName: 'Raul', lastName: 'Dominguez', role: 'colaborador' },
            { id: 'seed-7', firstName: 'Martha C', lastName: 'Nasser', role: 'realtor' },
            { id: 'seed-8', firstName: 'Natalie', lastName: 'Gutierrez', role: 'realtor' },
            { id: 'seed-9', firstName: 'Ayden', lastName: 'Banibashar', role: 'realtor' },
            { id: 'seed-10', firstName: 'Jacqueline', lastName: 'Caballero', role: 'realtor' },
            { id: 'seed-11', firstName: 'Pouria', lastName: 'Mirazimi', role: 'realtor' },
            { id: 'seed-12', firstName: "Santos Lou's", lastName: 'Rodriguez', role: 'realtor' },
            { id: 'seed-13', firstName: 'Marta', lastName: 'Lajas', role: 'realtor' },
            { id: 'seed-14', firstName: 'Gil A.', lastName: 'Medina', role: 'realtor' },
            { id: 'seed-15', firstName: 'May', lastName: 'Morejon', role: 'realtor' },
            { id: 'seed-16', firstName: 'Arvin', lastName: 'Kiami', role: 'realtor' },
            { id: 'seed-17', firstName: 'Debra', lastName: 'Nadal', role: 'realtor' },
            { id: 'seed-18', firstName: 'Debora', lastName: 'Clavell', role: 'realtor' }
          ];
        }

        // Sort alphabetically by last name (case-insensitive)
        // If lastName is missing, extract the last word of the full name field
        const getSortKey = u => {
          if (u.lastName) return u.lastName.trim().toLowerCase();
          const full = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).trim();
          const parts = full.split(/\s+/);
          return (parts[parts.length - 1] || full).toLowerCase();
        };
        collaborators.sort((a, b) => getSortKey(a).localeCompare(getSortKey(b), undefined, { sensitivity: 'base' }));

        const roleBadge = { embajador: '👑', colaborador: '🤝', realtor: '🏠', broker: '🏢' };

        collaborators.forEach(u => {
          const name = u.name ? u.name.trim() : `${u.firstName || ''} ${u.lastName || ''}`.trim();
          if (!name) return;
          const badge = roleBadge[u.role] || '👤';
          const opt = document.createElement('option');
          opt.value = name;
          opt.dataset.userId = u.id || '';
          opt.dataset.userRole = u.role || '';
          opt.dataset.referralCode = u.referralCode || '';
          opt.textContent = `${badge} ${name}`;
          sel.appendChild(opt);
        });

      } catch (err) {
        console.warn('[Webinar] populateCollaboratorDropdown error:', err);
      }
    }

    // Populate RE/MAX Inmomás referring agent dropdown dynamically from approved agent_inmomas users
    const populateWebinarInmomasAgents = async () => {
      const agentSel = document.getElementById('webinar-referrer-name');
      if (!agentSel || !App.utils || typeof App.utils.populateInmomasAgentSelect !== 'function') return;
      await App.utils.populateInmomasAgentSelect(agentSel, {
        placeholder: {
          en: '— Select an agent —',
          es: '— Selecciona un agente —',
          fr: '— Sélectionner un agent —',
          'en-ca': '— Select an agent —',
          'fr-eu': '— Sélectionner un conseiller —',
          nl: '— Kies een adviseur —',
          sv: '— Välj en rådgivare —',
          bg: '— Изберете консултант —'
        }
      });
    };
    populateWebinarInmomasAgents().catch(() => {});

    if (hearSelect) {
      hearSelect.addEventListener('change', async () => {
        const val = hearSelect.value;

        // Show/hide RE/MAX agent referrer wrap
        if (referrerWrap) {
          const showAgent = val === 'agent';
          referrerWrap.style.display = showAgent ? '' : 'none';
          const agentInp = document.getElementById('webinar-referrer-name');
          if (agentInp) agentInp.required = showAgent;
          if (showAgent && agentInp && agentInp.options.length <= 1) {
            await populateWebinarInmomasAgents();
          }
        }

        // Show/hide collaborator wrap
        if (collaboratorWrap) {
          const showCollab = val === 'collaborator';
          collaboratorWrap.style.display = showCollab ? '' : 'none';
          const collabSel = document.getElementById('webinar-collaborator-name');
          if (collabSel) collabSel.required = showCollab;

          // Populate dropdown on first open (lazy load)
          if (showCollab && collabSel && collabSel.options.length <= 4) {
            await populateCollaboratorDropdown();
          }
        }
      });
    }

    // ---- Form submission ----
    const form = document.getElementById('webinar-register-form');
    if (!form || form.dataset.listenerAttached) return;
    form.dataset.listenerAttached = 'true';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('webinar-submit-btn');
      const restoreBtn = () => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '🎙️ <span class="lang-en">Reserve My Free Spot Now</span><span class="lang-es">Reservar Mi Plaza Gratuita Ahora</span><span class="lang-fr">Réserver Ma Place Gratuite Maintenant</span><span class="lang-en-ca">Reserve My Free Spot Now</span><span class="lang-fr-eu">Confirmer mon inscription gratuite</span><span class="lang-nl">Meld mij nu gratis aan</span><span class="lang-sv">Registrera min kostnadsfria plats</span><span class="lang-bg">Запази безплатното ми място сега</span>';
        }
      };
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
        const rawHowHeard  = get('webinar-how-heard');
        const referrerName = get('webinar-referrer-name');
        const gdpr         = document.getElementById('webinar-gdpr')?.checked;

        const refCode = (
          sessionStorage.getItem('webinarReferralCode') ||
          sessionStorage.getItem('referralCode') ||
          ''
        ).trim();
        const isClientInvite = Boolean(
          refCode || sessionStorage.getItem('webinarClientInvite') === '1'
        );
        const howHeard = refCode ? 'Referral Link' : rawHowHeard;

        // Collaborator selection
        const collabSel    = document.getElementById('webinar-collaborator-name');
        const collaboratorName = (collabSel?.value || '').trim();
        const collaboratorId   = collabSel?.selectedOptions?.[0]?.dataset?.userId   || null;
        const collaboratorRole = collabSel?.selectedOptions?.[0]?.dataset?.userRole || null;
        const collaboratorCode = collabSel?.selectedOptions?.[0]?.dataset?.referralCode || null;

        if (!firstName || !lastName || !phone || !email || !agency || !country || !state || (!refCode && !howHeard)) {
          App.utils.showToast('Please fill in all required fields.', 'error');
          restoreBtn();
          return;
        }
        if (!gdpr) {
          App.utils.showToast('Please accept the data protection policy to continue.', 'error');
          restoreBtn();
          return;
        }
        if (!refCode && howHeard === 'agent' && !referrerName) {
          App.utils.showToast('Please enter or select the name of the referring agent.', 'error');
          restoreBtn();
          return;
        }
        if (!refCode && howHeard === 'collaborator' && !collaboratorName) {
          App.utils.showToast('Please select your Realtor / Broker from the list.', 'error');
          restoreBtn();
          return;
        }

        // ---- Resolve referral link context (user who shared the Client Webinar Link) ----
        let resolvedRefObj    = window._currentWebinarReferrer || null;
        let agentReferralCode = refCode || null;
        let agentReferrerId   = null;
        let agentReferrerName = null;
        let agentReferrerRole = null;

        if (refCode && !resolvedRefObj) {
          resolvedRefObj = await resolveWebinarReferrer(refCode);
        }

        if (resolvedRefObj) {
          agentReferralCode = resolvedRefObj.referralCode || refCode;
          agentReferrerId   = resolvedRefObj.id || null;
          agentReferrerName = `${resolvedRefObj.firstName || ''} ${resolvedRefObj.lastName || ''}`.trim() || resolvedRefObj.agencyName || refCode;
          agentReferrerRole = resolvedRefObj.role || null;
        } else if (!refCode && howHeard === 'collaborator' && collaboratorName) {
          agentReferralCode = collaboratorCode  || null;
          agentReferrerId   = collaboratorId    || null;
          agentReferrerName = collaboratorName;
          agentReferrerRole = collaboratorRole  || 'realtor';
        }

        // ---- Get Current Active Webinar Settings (forcing B2C when opened via Client Webinar Link) ----
        const settings = (App.auth && App.auth.getWebinarSettings)
          ? await App.auth.getWebinarSettings()
          : (App.auth && App.auth.getDefaultWebinarSettings ? App.auth.getDefaultWebinarSettings() : null);

        let urlRegion = '';
        try {
          const hash = window.location.hash || '';
          const qIdx = hash.indexOf('?');
          if (qIdx >= 0) urlRegion = new URLSearchParams(hash.substring(qIdx + 1)).get('region') || '';
        } catch (_) {}

        const resolvedCountryRegion = (App.utils && App.utils.resolveRegionFromCountry)
          ? App.utils.resolveRegionFromCountry(country)
          : '';
        const targetWebinarRegion = urlRegion || resolvedCountryRegion || 'north_america';
        const forcedType = isClientInvite ? 'b2c' : null;
        const regionalCfg = (App.auth && App.auth.getRegionalWebinarConfig && settings)
          ? App.auth.getRegionalWebinarConfig(settings, targetWebinarRegion, forcedType)
          : null;

        const activeType = forcedType || (regionalCfg ? regionalCfg.activeType : (settings?.activeType || 'b2c'));
        const typeConfig = regionalCfg || (settings ? (settings[activeType] || settings.b2c) : null);
        const webinarTitle = typeConfig?.title || (activeType === 'b2b' ? 'Beyond Borders' : 'Spain Unlocked');
        const webinarDate = typeConfig?.date || settings?.[activeType]?.date || settings?.date || '2026-10-29';
        const webinarLanguage = typeConfig?.language || 'en';

        // Determine referrerName for the record
        let finalReferrerName = agentReferrerName || '';
        if (!finalReferrerName) {
          if (howHeard === 'agent') finalReferrerName = referrerName;
          else if (howHeard === 'collaborator') finalReferrerName = collaboratorName;
        }

        // 1. Save Webinar Registration
        await App.auth.saveWebinarRegistration({
          firstName, lastName, phone, email, agency,
          clientInterest: activeType === 'b2c' ? agency : undefined,
          country, state,
          region: resolvedCountryRegion || targetWebinarRegion,
          webinarRegion: targetWebinarRegion,
          webinarLanguage: webinarLanguage,
          howHeard,
          referrerName: finalReferrerName,
          webinar: webinarTitle,
          webinarType: activeType.toUpperCase(),
          webinarDate: webinarDate,
          gdprConsent: true,
          role:             activeType === 'b2c' ? 'client' : 'realtor',
          contactType:      activeType === 'b2c' ? 'client' : 'realtor',
          referralCode:     agentReferralCode || null,
          referrerId:       agentReferrerId   || null,
          agentReferrerId:  agentReferrerId   || null,
          agentReferrerName: agentReferrerName || null,
          agentReferrerRole: agentReferrerRole || null,
          source:           agentReferralCode ? 'referral' : 'direct'
        });

        // 2. Protect & Register Client in Referrer's CRM / Pipeline automatically (when B2C / Client Webinar Link)
        if (activeType === 'b2c' && App.auth && typeof App.auth.addReferralClient === 'function') {
          const clientPayload = {
            firstName,
            lastName,
            email,
            phone,
            country,
            currentLocation: state && state !== 'International' ? `${state}, ${country}` : country,
            region: resolvedCountryRegion || targetWebinarRegion,
            budget: 'TBD',
            interestArea: '—',
            timeline: '—',
            objective: agency || 'Interés en España (Webinario)',
            notes: `Inscrito al Webinario (${webinarTitle} · ${webinarDate}). Objetivo: ${agency}`,
            needsUCI: refCode === 'UCI',
            needsFuster: refCode === 'Fuster & Associates',
            needsHolidays: refCode === 'Inmomás Holidays',
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
            source: agentReferralCode ? 'webinar_referral' : 'webinar',
            historyNote: agentReferralCode
              ? `Inscrito vía enlace exclusivo de Webinario de Clientes (${agentReferralCode})`
              : 'Inscrito directamente al Webinario B2C'
          };

          if (resolvedRefObj) {
            clientPayload.referredBy = resolvedRefObj.id;
            clientPayload.embajadorId = resolvedRefObj.role === 'embajador'
              ? resolvedRefObj.id
              : (resolvedRefObj.embajadorId || null);

            if (resolvedRefObj.role === 'broker') {
              clientPayload.brokerId = resolvedRefObj.id;
            } else if (resolvedRefObj.role === 'realtor') {
              clientPayload.realtorId = resolvedRefObj.id;
              clientPayload.realtorName = agentReferrerName;
              clientPayload.brokerId = resolvedRefObj.brokerId || null;
            } else if (resolvedRefObj.role === 'agent_inmomas') {
              clientPayload.localAgentId = resolvedRefObj.id;
              clientPayload.localAgentName = agentReferrerName;
              clientPayload.inmomasAgentName = agentReferrerName;
            } else if (resolvedRefObj.role === 'partner') {
              clientPayload.referredBy = resolvedRefObj.id || refCode;
            }
          } else if (howHeard === 'collaborator' && collaboratorId) {
            clientPayload.referredBy = collaboratorId;
            if (collaboratorRole === 'realtor') {
              clientPayload.realtorId = collaboratorId;
              clientPayload.realtorName = collaboratorName;
            } else if (collaboratorRole === 'broker') {
              clientPayload.brokerId = collaboratorId;
            } else if (collaboratorRole === 'embajador') {
              clientPayload.embajadorId = collaboratorId;
            }
          } else if (howHeard === 'agent' && referrerName) {
            clientPayload.referredBy = referrerName;
            clientPayload.localAgentName = referrerName;
            clientPayload.inmomasAgentName = referrerName;
          } else if (refCode) {
            clientPayload.referredBy = refCode;
          }

          await App.auth.addReferralClient(clientPayload, {
            skipWebinarAutoEnroll: true,
            silentNotifications: true
          });
        }

        sessionStorage.removeItem('webinarReferralCode');
        sessionStorage.removeItem('webinarClientInvite');
        sessionStorage.removeItem('referralCode');

        // Show success panel
        const successPanel = document.getElementById('webinar-success-panel');
        const formPanel    = document.getElementById('webinar-form-panel') || document.getElementById('webinar-form-body');
        if (successPanel && formPanel) {
          formPanel.style.display = 'none';
          successPanel.style.display = 'flex';
          form.reset();
        } else {
          App.utils.showToast(`🎉 You are registered! See you on ${webinarDate}.`, 'success');
          form.reset();
        }
        restoreBtn();

      } catch (err) {
        console.error('[Webinar] Registration error:', err);
        App.utils.showToast('Error submitting registration: ' + err.message, 'error');
        restoreBtn();
      }
    });
  },

  /* ============================================
     MASTERCLASS FEEDBACK SURVEY
     ============================================ */
  initSurvey: function() {
    try {
      const currentUser = App.auth && App.auth.getCurrentUser ? App.auth.getCurrentUser() : null;
      if (currentUser) {
        const nameInput = document.getElementById('spa-resp-name');
        const emailInput = document.getElementById('spa-resp-email');
        if (nameInput && !nameInput.value) {
          nameInput.value = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        }
        if (emailInput && !emailInput.value) {
          emailInput.value = currentUser.email || '';
        }
      }
    } catch(e) {
      console.warn('[Survey] Could not prefill user:', e);
    }
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

