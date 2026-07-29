/* ============================================
   RE/MAX Inmomás — Landing Page JavaScript
   Corporate Edition — Bilingual + Empathy
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Language Selector (4 idiomas: EN, ES, FR, EN-CA) ──
  const body = document.body;
  let currentLang = 'en';

  const langConfig = {
    en:      { flag: '🇺🇸', code: 'EN' },
    es:      { flag: '🇪🇸', code: 'ES' },
    fr:      { flag: '🇨🇦', code: 'FR' },
    'en-ca': { flag: '🇨🇦', code: 'EN-CA' }
  };

  const langSelectorWrapper = document.getElementById('lang-selector-wrapper');
  const langSelectorBtn = document.getElementById('lang-selector-btn');
  const langFlag = document.getElementById('lang-flag');
  const langCode = document.getElementById('lang-code');
  const langDropdown = document.getElementById('lang-dropdown');
  const langDropdownItems = document.querySelectorAll('.lang-dropdown-item');

  function setLang(lang) {
    if (!langConfig[lang]) return;
    currentLang = lang;

    // Update body class
    body.classList.remove('lang-en', 'lang-es', 'lang-fr', 'lang-en-ca');
    body.classList.add('lang-' + lang);

    // Update html lang attribute
    const htmlLangMap = { en: 'en', es: 'es', fr: 'fr', 'en-ca': 'en-CA' };
    document.documentElement.lang = htmlLangMap[lang];

    // Update button appearance
    if (langFlag) langFlag.textContent = langConfig[lang].flag;
    if (langCode) langCode.textContent = langConfig[lang].code;

    // Update active state on dropdown items
    langDropdownItems.forEach(item => {
      item.classList.toggle('active', item.dataset.lang === lang);
    });

    // Update form placeholders
    updateFormPlaceholders(lang);
  }

  // Toggle dropdown open/close
  if (langSelectorBtn) {
    langSelectorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langSelectorWrapper.classList.toggle('open');
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (langSelectorWrapper && !langSelectorWrapper.contains(e.target)) {
      langSelectorWrapper.classList.remove('open');
    }
  });

  // Language option click
  langDropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      setLang(item.dataset.lang);
      langSelectorWrapper.classList.remove('open');
    });
  });

  // Initialize with English
  setLang('en');

  function updateFormPlaceholders(lang) {
    const placeholders = {
      en: {
        'first-name': 'John',
        'last-name': 'Smith',
        'email': 'john@example.com',
        'phone': '+1 (555) 123-4567'
      },
      es: {
        'first-name': 'María',
        'last-name': 'García',
        'email': 'maria@ejemplo.com',
        'phone': '+34 600 123 456'
      },
      fr: {
        'first-name': 'Jean',
        'last-name': 'Dupont',
        'email': 'jean@exemple.fr',
        'phone': '+33 6 12 34 56 78'
      },
      'en-ca': {
        'first-name': 'James',
        'last-name': 'Thompson',
        'email': 'james@example.ca',
        'phone': '+1 (416) 555-1234'
      }
    };
    Object.entries(placeholders[lang] || {}).forEach(([id, placeholder]) => {
      const input = document.getElementById(id);
      if (input) input.placeholder = placeholder;
    });
  }

  // ── Navbar Scroll Effect ──
  const navbar = document.getElementById('navbar');
  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ── Mobile Menu Toggle ──
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('public-nav');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
      });
    });
  }

  // ── Smooth Scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const offset = navbar.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Counter Animation ──
  const counters = document.querySelectorAll('.counter');
  let countersTriggered = false;

  function animateCounters() {
    if (countersTriggered) return;
    countersTriggered = true;
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const start = performance.now();
      const duration = 2200;
      (function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
      })(start);
    });
  }

  // ── Scroll Reveal ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.closest('.hero') || entry.target.querySelector('.counter')) {
          animateCounters();
        }
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Counter trigger for hero
  const hero = document.getElementById('hero');
  if (hero) {
    const heroObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setTimeout(animateCounters, 500);
    }, { threshold: 0.2 });
    heroObs.observe(hero);
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const inner = item.querySelector('.faq-answer-inner');

    question.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      // Close all
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-answer').style.maxHeight = '0';
      });
      if (!wasActive) {
        item.classList.add('active');
        answer.style.maxHeight = inner.scrollHeight + 24 + 'px';
      }
    });
  });

  // ── Form Handling ──
  const form = document.getElementById('webinar-form');
  const submitBtn = document.getElementById('form-submit-btn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      if (!data.firstName || !data.lastName || !data.email) {
        submitBtn.classList.add('shake');
        setTimeout(() => submitBtn.classList.remove('shake'), 600);
        return;
      }

      submitBtn.disabled = true;
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner"></span>';
      submitBtn.classList.add('loading');

      setTimeout(() => {
        submitBtn.classList.remove('loading');
        const successMsgs = {
          en: '✓ Registered Successfully',
          es: '✓ Registrado con Éxito',
          fr: '✓ Inscription réussie',
          'en-ca': '✓ Registered Successfully'
        };
        const detailMsgs = {
          en: '🎉 Check your email for webinar details and your free guide!',
          es: '🎉 ¡Revisa tu email para los detalles del webinar y tu guía gratuita!',
          fr: '🎉 Consultez votre e-mail pour les détails du webinaire et votre guide gratuit !',
          'en-ca': '🎉 Check your email for webinar details and your free guide!'
        };
        submitBtn.innerHTML = successMsgs[currentLang] || successMsgs['en'];

        const msg = document.createElement('p');
        msg.className = 'form-success-msg';
        msg.textContent = detailMsgs[currentLang] || detailMsgs['en'];
        form.parentNode.appendChild(msg);

        console.log('Registration:', data);
      }, 1500);
    });
  }

  // ── Active Nav Highlight ──
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    sections.forEach(section => {
      const top = section.offsetTop - 140;
      const height = section.offsetHeight;
      const id = section.id;
      if (scrollY >= top && scrollY < top + height) {
        document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { passive: true });

  // ── Dynamic Styles ──
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 50%{transform:translateX(6px)} 75%{transform:translateX(-3px)} }
    .shake { animation: shake 0.5s ease; }
    .spinner { display:inline-block; width:18px; height:18px; border:2px solid rgba(10,22,40,0.2); border-top-color:#0A1628; border-radius:50%; animation:spin 0.6s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .form-success-msg { text-align:center; padding:16px 0 0; color:#4ADE80; font-weight:500; font-size:0.9rem; animation:fadeUp 0.5s ease; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(style);

  // ── Alicante Carousel ──
  const carouselContainer = document.querySelector('.carousel-container');
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  
  if (carouselContainer && slides.length > 0) {
    let currentIdx = 0;
    const totalSlides = slides.length;
    let autoPlayTimer = null;
    
    function updateCarousel() {
      carouselContainer.style.transform = `translateX(-${(currentIdx * 100) / totalSlides}%)`;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIdx);
      });
    }
    
    function nextSlide() {
      currentIdx = (currentIdx + 1) % totalSlides;
      updateCarousel();
    }
    
    function prevSlide() {
      currentIdx = (currentIdx - 1 + totalSlides) % totalSlides;
      updateCarousel();
    }
    
    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(nextSlide, 5000);
    }
    
    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }
    
    nextBtn?.addEventListener('click', () => {
      nextSlide();
      startAutoPlay();
    });
    
    prevBtn?.addEventListener('click', () => {
      prevSlide();
      startAutoPlay();
    });
    
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        currentIdx = idx;
        updateCarousel();
        startAutoPlay();
      });
    });
    
    // Adjust container width for dynamic sizing
    carouselContainer.style.width = `${totalSlides * 100}%`;
    
    startAutoPlay();
  }

  // ── Buying Process Pipeline Interactivity ──
  const pipelineNodes = document.querySelectorAll('.pipeline-node');
  const detailsTitle = document.getElementById('process-details-title');
  const detailsDesc = document.getElementById('process-details-desc');
  const detailsPanelIcon = document.getElementById('details-panel-icon');
  const detailsStepBadge = document.getElementById('details-step-badge');
  const detailsNavCounter = document.getElementById('details-nav-counter');
  const detailsHighlights = document.getElementById('details-panel-highlights');
  const pipelineFill = document.getElementById('pipeline-fill');
  const detailsPrevBtn = document.getElementById('details-prev-btn');
  const detailsNextBtn = document.getElementById('details-next-btn');
  
  if (pipelineNodes.length > 0 && detailsTitle && detailsDesc) {
    let currentStep = 1;
    const totalSteps = 8;
    
    // SVG icons for each step (matching the node circles)
    const stepIcons = {
      1: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
      2: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
      3: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
      4: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      5: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
      6: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
      7: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      8: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>'
    };
    const stepDetails = {
      1: {
        en: {
          title: "Get Your NIE",
          desc: "The NIE (Foreigner Identity Number) is essential for buying property, opening bank accounts, or contracting utility services in Spain. Our partner law firm handles the entire application process with the immigration office or consulate, saving you any travel.",
          highlights: [
            { icon: "⏱", text: "1–2 weeks" },
            { icon: "🏰", text: "Fuster & Associates" },
            { icon: "🌐", text: "100% remote" }
          ]
        },
        es: {
          title: "Obtener NIE",
          desc: "El NIE (Número de Identidad de Extranjero) es imprescindible para comprar cualquier propiedad, abrir cuentas bancarias o contratar servicios en España. Nuestro despacho asociado se encarga de toda la gestión ante la oficina de extranjería o consulado correspondiente, evitándote desplazamientos.",
          highlights: [
            { icon: "⏱", text: "1–2 semanas" },
            { icon: "🏰", text: "Fuster & Associates" },
            { icon: "🌐", text: "100% remoto" }
          ]
        },
        fr: {
          title: "Get Your NIE",
          desc: "Le NIE (Numéro d'identité des étrangers) est indispensable pour acheter un bien immobilier, ouvrir un compte bancaire ou souscrire à des services en Espagne. Notre cabinet juridique partenaire gère l'ensemble de la procédure auprès du bureau de l'immigration ou du consulat.",
          highlights: [
            { icon: "⏱", text: "1–2 weeks" },
            { icon: "🏰", text: "Fuster & Associates" },
            { icon: "🌐", text: "100% remote" }
          ]
        },
        'en-ca': {
          title: "Get Your NIE",
          desc: "The NIE (Foreigner Identity Number) is essential for buying property, opening bank accounts, or contracting utility services in Spain. Our partner law firm handles the entire application process with the immigration office or consulate — no travel required from Canada.",
          highlights: [
            { icon: "⏱", text: "1–2 weeks" },
            { icon: "🏰", text: "Fuster & Associates" },
            { icon: "🌐", text: "100% remote" }
          ]
        }
      },
      2: {
        en: {
          title: "Open Bank Account",
          desc: "You will need a Spanish bank account to transfer purchase funds and set up direct debits for future utility bills and taxes. We assist you in opening the account quickly and remotely through our mortgage and banking partners.",
          highlights: [
            { icon: "🏦", text: "Banco UCI partner" },
            { icon: "📱", text: "Remote setup" },
            { icon: "✅", text: "No travel needed" }
          ]
        },
        es: {
          title: "Abrir Cuenta Bancaria",
          desc: "Necesitarás una cuenta en un banco español para transferir los fondos de la compra y domiciliar los futuros recibos e impuestos. Te ayudamos a abrir la cuenta de forma rápida y remota a través de nuestro partner hipotecario o bancario.",
          highlights: [
            { icon: "🏦", text: "Partner Banco UCI" },
            { icon: "📱", text: "Apertura remota" },
            { icon: "✅", text: "Sin desplazamiento" }
          ]
        },
        fr: {
          title: "Open Bank Account",
          desc: "Vous aurez besoin d'un compte bancaire espagnol pour transférer les fonds d'achat et domicilier vos futures factures et impôts. Nous vous aidons à ouvrir un compte rapidement et à distance via nos partenaires bancaires et hypothécaires.",
          highlights: [
            { icon: "🏦", text: "Partenaire Banco UCI" },
            { icon: "📱", text: "Ouverture à distance" },
            { icon: "✅", text: "No travel needed" }
          ]
        },
        'en-ca': {
          title: "Open Bank Account",
          desc: "You will need a Spanish bank account to transfer purchase funds and set up direct debits for future utility bills and taxes. We assist you in opening the account quickly and remotely through our banking partners — easy to do from Canada.",
          highlights: [
            { icon: "🏦", text: "Banco UCI partner" },
            { icon: "📱", text: "Remote setup" },
            { icon: "✅", text: "No travel needed" }
          ]
        }
      },
      3: {
        en: {
          title: "Define Strategy",
          desc: "We analyze your goals: whether you want a high-yield investment or a holiday home. We design a plan tailored to your financial and personal profile to optimize tax efficiency and returns.",
          highlights: [
            { icon: "📊", text: "Personalized plan" },
            { icon: "💰", text: "Tax optimization" },
            { icon: "🏖", text: "Investment or holiday" }
          ]
        },
        es: {
          title: "Definir Estrategia",
          desc: "Analizamos tus objetivos: si buscas una inversión de alta rentabilidad o una residencia vacacional. Diseñamos un plan adaptado a tu perfil financiero y personal para optimizar el retorno y los impuestos.",
          highlights: [
            { icon: "📊", text: "Plan personalizado" },
            { icon: "💰", text: "Optimización fiscal" },
            { icon: "🏖", text: "Inversión o vacaciones" }
          ]
        },
        fr: {
          title: "Define Your Strategy",
          desc: "Nous analysons vos objectifs : investissement à haut rendement ou résidence de vacances. Nous élaborons un plan adapté à votre profil financier et personnel pour optimiser la fiscalité et le rendement.",
          highlights: [
            { icon: "📊", text: "Plan personnalisé" },
            { icon: "💰", text: "Optimisation fiscale" },
            { icon: "🏖", text: "Investissement ou vacances" }
          ]
        },
        'en-ca': {
          title: "Define Your Strategy",
          desc: "We analyse your goals: whether you want a high-yield investment property or a holiday home. We design a plan tailored to your financial and personal profile to optimise tax efficiency and returns.",
          highlights: [
            { icon: "📊", text: "Personalised plan" },
            { icon: "💰", text: "Tax optimisation" },
            { icon: "🏖", text: "Investment or vacation" }
          ]
        }
      },
      4: {
        en: {
          title: "Property Selection",
          desc: "We filter the best properties on the Costa Blanca based on your criteria. We access the complete RE/MAX database and off-market listings to ensure you only visit highly qualified options.",
          highlights: [
            { icon: "🏠", text: "RE/MAX database" },
            { icon: "🔒", text: "Off-market access" },
            { icon: "🎯", text: "Pre-qualified" }
          ]
        },
        es: {
          title: "Selección de Propiedades",
          desc: "Filtramos las mejores propiedades en la Costa Blanca según tus criterios. Accedemos a la base de datos completa de RE/MAX y a propiedades fuera del mercado (off-market) para garantizar que solo visites opciones altamente cualificadas.",
          highlights: [
            { icon: "🏠", text: "Base datos RE/MAX" },
            { icon: "🔒", text: "Acceso off-market" },
            { icon: "🎯", text: "Pre-cualificadas" }
          ]
        },
        fr: {
          title: "Sélection de Biens",
          desc: "Nous sélectionnons les meilleures propriétés sur la Costa Blanca selon vos critères. Nous accédons à la base de données complète RE/MAX et aux biens hors marché pour vous garantir des visites ciblées et qualifiées.",
          highlights: [
            { icon: "🏠", text: "Base RE/MAX" },
            { icon: "🔒", text: "Off-market access" },
            { icon: "🎯", text: "Pre-qualified" }
          ]
        },
        'en-ca': {
          title: "Property Selection",
          desc: "We select the best properties on the Costa Blanca based on your criteria. We access the full RE/MAX database and off-market listings to guarantee you targeted, pre-qualified viewings.",
          highlights: [
            { icon: "🏠", text: "RE/MAX Database" },
            { icon: "🔒", text: "Accès hors marché" },
            { icon: "🎯", text: "Pré-qualifiées" }
          ]
        }
      },
      5: {
        en: {
          title: "Due Diligence",
          desc: "A crucial step for a safe purchase. Fuster & Associates performs an exhaustive study of the property's registry status, liens, debts, urban legality, and licenses so you buy with total peace of mind and zero risks.",
          highlights: [
            { icon: "⚖️", text: "Legal verification" },
            { icon: "📋", text: "Registry check" },
            { icon: "🛡", text: "Zero risk" }
          ]
        },
        es: {
          title: "Due Diligence (Estudio Legal)",
          desc: "Paso crucial para una compra segura. Fuster & Associates realiza un estudio exhaustivo del estado registral de la propiedad, cargas, deudas, legalidad urbanística y licencias para que compres con total tranquilidad y cero riesgos.",
          highlights: [
            { icon: "⚖️", text: "Verificación legal" },
            { icon: "📋", text: "Check registral" },
            { icon: "🛡", text: "Cero riesgos" }
          ]
        },
        fr: {
          title: "Due Diligence",
          desc: "Une étape cruciale pour un achat sécurisé. Fuster & Associates réalise une étude exhaustive du statut cadastral du bien, des charges, dettes, légalité urbanistique et licences, pour que vous achetiez en toute sérénité et sans risque.",
          highlights: [
            { icon: "⚖️", text: "Vérification juridique" },
            { icon: "📋", text: "Contrôle cadastral" },
            { icon: "🛡", text: "Zero risk" }
          ]
        },
        'en-ca': {
          title: "Due Diligence",
          desc: "A crucial step for a safe purchase. Fuster & Associates performs an exhaustive study of the property's registry status, liens, debts, urban legality, and licences so you buy with total peace of mind and zero risk.",
          highlights: [
            { icon: "⚖️", text: "Vérification juridique" },
            { icon: "📋", text: "Registry check" },
            { icon: "🛡", text: "Zéro risque" }
          ]
        }
      },
      6: {
        en: {
          title: "Reservation",
          desc: "Reservation deposit to remove the property from the market and freeze the agreed price. This amount is safely held in escrow and will be deducted from the final purchase price upon signing the deeds.",
          highlights: [
            { icon: "💶", text: "3.000 € – 10.000 €" },
            { icon: "🔐", text: "Held in escrow" },
            { icon: "❄️", text: "Price frozen" }
          ]
        },
        es: {
          title: "Reserva",
          desc: "Depósito de reserva para retirar la propiedad del mercado y congelar el precio acordado. Este importe queda custodiado de forma segura y se descontará del precio final de compra en la firma de las escrituras.",
          highlights: [
            { icon: "💶", text: "3.000 € – 10.000 €" },
            { icon: "🔐", text: "Depósito custodiado" },
            { icon: "❄️", text: "Precio congelado" }
          ]
        },
        fr: {
          title: "Réservation",
          desc: "Acompte de réservation pour retirer le bien du marché et geler le prix convenu. Cette somme est conservée en séquestre et sera déduite du prix final lors de la signature de l'acte.",
          highlights: [
            { icon: "💶", text: "3.000 € – 10.000 €" },
            { icon: "🔐", text: "Fonds en séquestre" },
            { icon: "❄️", text: "Prix gelé" }
          ]
        },
        'en-ca': {
          title: "Reservation",
          desc: "A reservation deposit (between €3,000 and €10,000) formally takes the property off the market and locks in the agreed price. This amount is held in trust and will be deducted from the final purchase price at completion.",
          highlights: [
            { icon: "💶", text: "€3,000 – €10,000" },
            { icon: "🔐", text: "Funds in trust" },
            { icon: "❄️", text: "Price locked" }
          ]
        }
      },
      7: {
        en: {
          title: "Contract",
          desc: "Signing the Arras Contract (Purchase Agreement) which details all the conditions of the sale and requires a 10% deposit. This contract legally binds both parties and establishes guarantees and completion dates.",
          highlights: [
            { icon: "📝", text: "Arras Contract" },
            { icon: "💰", text: "10% deposit" },
            { icon: "⚖️", text: "Legally binding" }
          ]
        },
        es: {
          title: "Contrato de Arras",
          desc: "Firma del Contrato de Arras (Purchase Contract) donde se detallan todas las condiciones de la compraventa y se abona el 10% del precio total. Este contrato vincula legalmente a ambas partes y establece las garantías y plazos de entrega.",
          highlights: [
            { icon: "📝", text: "Contrato de Arras" },
            { icon: "💰", text: "10% del precio" },
            { icon: "⚖️", text: "Vinculante" }
          ]
        },
        fr: {
          title: "Promesse de Vente",
          desc: "Signature de la promesse de vente (Contrato de Arras) qui détaille toutes les conditions de la transaction et requiert un acompte de 10%. Ce contrat lie juridiquement les deux parties et fixe les garanties et les délais de réalisation.",
          highlights: [
            { icon: "📝", text: "Promesse de vente" },
            { icon: "💰", text: "10% deposit" },
            { icon: "⚖️", text: "Legally binding" }
          ]
        },
        'en-ca': {
          title: "Purchase Agreement",
          desc: "Signing the Purchase Agreement (Contrato de Arras) which details all the conditions of the sale and requires a 10% deposit. This contract legally binds both parties and establishes guarantees and completion dates.",
          highlights: [
            { icon: "📝", text: "Purchase Agreement" },
            { icon: "💰", text: "Acompte de 10%" },
            { icon: "⚖️", text: "Juridiquement contraignant" }
          ]
        }
      },
      8: {
        en: {
          title: "Completion",
          desc: "The final signing before a Public Notary where the title is transferred and the remaining payment is made. If you cannot travel to Spain, you can grant a Power of Attorney (POA) to our law firm to sign 100% remotely.",
          highlights: [
            { icon: "🔑", text: "Keys in hand" },
            { icon: "🏰", text: "Public Notary" },
            { icon: "🌐", text: "Remote via POA" }
          ]
        },
        es: {
          title: "Escritura Pública",
          desc: "La firma final ante Notario Público donde se transmite la propiedad y se entrega el resto del pago. Si no puedes viajar a España, puedes delegar un Poder Notarial (POA) a nuestro despacho jurídico para firmar 100% de forma remota.",
          highlights: [
            { icon: "🔑", text: "Llaves en mano" },
            { icon: "🏰", text: "Notario Público" },
            { icon: "🌐", text: "Remoto vía POA" }
          ]
        },
        fr: {
          title: "Acte de Vente",
          desc: "La signature finale devant un notaire public où le titre est transféré et le solde du prix est réglé. Si vous ne pouvez pas vous rendre en Espagne, vous pouvez accorder une procuration (POA) à notre cabinet juridique pour signer à 100% à distance.",
          highlights: [
            { icon: "🔑", text: "Clés en main" },
            { icon: "🏰", text: "Notaire public" },
            { icon: "🌐", text: "À distance via POA" }
          ]
        },
        'en-ca': {
          title: "Completion",
          desc: "The final signing before a Public Notary where the title is transferred and the remaining payment is made. If you cannot travel to Spain, you can grant a Power of Attorney (POA) to our law firm to sign 100% remotely from Canada.",
          highlights: [
            { icon: "🔑", text: "Clés en main" },
            { icon: "🏰", text: "Notaire public" },
            { icon: "🌐", text: "Remote from Canada" }
          ]
        }
      }
    };
    
    function updatePipeline(stepNum) {
      currentStep = stepNum;
      const body = document.body;
      const lang = body.classList.contains('lang-es') ? 'es' : body.classList.contains('lang-en-ca') ? 'en-ca' : body.classList.contains('lang-fr') ? 'fr' : 'en';
      const details = stepDetails[stepNum][lang] || stepDetails[stepNum]['en'];
      
      // Update node states
      pipelineNodes.forEach(node => {
        const nodeStep = parseInt(node.getAttribute('data-step'));
        node.classList.remove('active', 'completed');
        if (nodeStep === stepNum) {
          node.classList.add('active');
        } else if (nodeStep < stepNum) {
          node.classList.add('completed');
        }
      });
      
      // Update progress track fill
      if (pipelineFill) {
        const fillPercent = ((stepNum - 1) / (totalSteps - 1)) * 100;
        pipelineFill.style.width = fillPercent + '%';
      }
      
      // Update icon in detail panel
      if (detailsPanelIcon) {
        detailsPanelIcon.innerHTML = stepIcons[stepNum] || '';
      }
      
      // Update step badge
      if (detailsStepBadge) {
        const stepLabels = { en: 'Step', es: 'Paso', fr: 'Étape', 'en-ca': 'Step' };
        detailsStepBadge.textContent = `${stepLabels[lang] || 'Step'} ${stepNum}`;
      }
      
      // Update title & description
      detailsTitle.textContent = details.title;
      detailsDesc.textContent = details.desc;
      
      // Update highlights
      if (detailsHighlights) {
        detailsHighlights.innerHTML = details.highlights.map(h =>
          `<span class="details-highlight"><span class="hl-icon">${h.icon}</span>${h.text}</span>`
        ).join('');
      }
      
      // Update nav counter
      if (detailsNavCounter) {
        detailsNavCounter.textContent = `${stepNum} / ${totalSteps}`;
      }
      
      // Update nav button states
      if (detailsPrevBtn) detailsPrevBtn.disabled = stepNum <= 1;
      if (detailsNextBtn) detailsNextBtn.disabled = stepNum >= totalSteps;
    }
    
    // Click handlers on pipeline nodes
    pipelineNodes.forEach(node => {
      node.addEventListener('click', () => {
        const stepNum = parseInt(node.getAttribute('data-step'));
        updatePipeline(stepNum);
      });
    });
    
    // Navigation buttons
    if (detailsPrevBtn) {
      detailsPrevBtn.addEventListener('click', () => {
        if (currentStep > 1) updatePipeline(currentStep - 1);
      });
    }
    if (detailsNextBtn) {
      detailsNextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) updatePipeline(currentStep + 1);
      });
    }
    
    // Listen for language changes to refresh details text (via lang dropdown)
    document.querySelectorAll('.lang-dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        setTimeout(() => {
          updatePipeline(currentStep);
        }, 50);
      });
    });
    
    // Initialize step 1
    updatePipeline(1);
  }

  // ── Properties Carousel Interactivity ──
  const propTrack = document.querySelector('.properties-track');
  const propCards = document.querySelectorAll('.properties-track .property-card');
  const propPrevBtn = document.querySelector('.properties-prev');
  const propNextBtn = document.querySelector('.properties-next');
  const propDotsContainer = document.querySelector('.properties-dots');
  
  if (propTrack && propCards.length > 0) {
    let propIdx = 0;
    const cardGap = 24; // gap between cards in pixels (matches CSS gap: 24px)
    
    function getCardsPerView() {
      const w = window.innerWidth;
      if (w > 992) return 3;
      if (w > 768) return 2;
      return 1;
    }
    
    function getTotalSlides() {
      const cardsPerView = getCardsPerView();
      return Math.max(1, propCards.length - cardsPerView + 1);
    }
    
    function createDots() {
      if (!propDotsContainer) return;
      propDotsContainer.innerHTML = '';
      const totalSlides = getTotalSlides();
      
      if (totalSlides <= 1) {
        if (propPrevBtn) propPrevBtn.style.display = 'none';
        if (propNextBtn) propNextBtn.style.display = 'none';
        return;
      } else {
        if (propPrevBtn) propPrevBtn.style.display = 'flex';
        if (propNextBtn) propNextBtn.style.display = 'flex';
      }
      
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('span');
        dot.className = `prop-dot${i === propIdx ? ' active' : ''}`;
        dot.setAttribute('data-slide', i);
        dot.addEventListener('click', () => {
          propIdx = i;
          updatePropCarousel();
        });
        propDotsContainer.appendChild(dot);
      }
    }
    
    function updatePropCarousel() {
      if (propCards.length === 0) return;
      const cardsPerView = getCardsPerView();
      const cardWidth = propCards[0].getBoundingClientRect().width;
      
      const offset = propIdx * (cardWidth + cardGap);
      propTrack.style.transform = `translateX(-${offset}px)`;
      
      // Update dots active class
      const dots = propDotsContainer.querySelectorAll('.prop-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === propIdx);
      });
      
      // Enable/disable navigation buttons
      if (propPrevBtn) propPrevBtn.disabled = propIdx === 0;
      if (propNextBtn) propNextBtn.disabled = propIdx >= getTotalSlides() - 1;
    }
    
    propNextBtn?.addEventListener('click', () => {
      const total = getTotalSlides();
      if (propIdx < total - 1) {
        propIdx++;
        updatePropCarousel();
      }
    });
    
    propPrevBtn?.addEventListener('click', () => {
      if (propIdx > 0) {
        propIdx--;
        updatePropCarousel();
      }
    });
    
    window.addEventListener('resize', () => {
      const total = getTotalSlides();
      if (propIdx >= total) {
        propIdx = total - 1;
      }
      createDots();
      updatePropCarousel();
    });
    
    // Initial setup
    createDots();
    updatePropCarousel();
  }

  // ── Dossier PDF Form Capture ──
  const dossierLinks = document.querySelectorAll('a[href*="dossier.html"]');
  dossierLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const bodyEl = document.body;
      const lang = bodyEl.classList.contains('lang-es') ? 'es'
                 : bodyEl.classList.contains('lang-en-ca') ? 'en-ca'
                 : bodyEl.classList.contains('lang-fr') ? 'fr'
                 : 'en';
      
      const t = {
        en: {
          intro: 'Please enter your details to download the Complete Guide to Buying in Spain for free.',
          firstName: 'First Name', firstPlaceholder: 'e.g. John',
          lastName: 'Last Name', lastPlaceholder: 'e.g. Doe',
          email: 'Email Address', phone: 'Phone Number',
          phonePlaceholder: 'e.g. +1 (514) 555-0199',
          btn: 'Download Full Guide (PDF)',
          modalTitle: "Download Buyer's Guide",
          toast: 'Thank you! Redirecting to download...'
        },
        es: {
          intro: 'Por favor, déjanos tus datos para descargar la Guía Completa de Compra en España de forma gratuita.',
          firstName: 'Nombre', firstPlaceholder: 'Ej. Juan',
          lastName: 'Apellidos', lastPlaceholder: 'Ej. Pérez',
          email: 'Correo Electrónico', phone: 'Número de Teléfono',
          phonePlaceholder: '+34 600 123 456',
          btn: 'Descargar Guía Completa (PDF)',
          modalTitle: 'Descarga la Guía del Comprador',
          toast: '¡Gracias! Redirigiendo a la descarga...'
        },
        fr: {
          intro: "Veuillez saisir vos coordonnées pour télécharger gratuitement le Guide Complet d'Achat en Espagne.",
          firstName: 'First Name', firstPlaceholder: 'e.g. John',
          lastName: 'Nom', lastPlaceholder: 'ex. Dupont',
          email: 'Adresse e-mail', phone: 'Numéro de téléphone',
          phonePlaceholder: '+33 6 12 34 56 78',
          btn: 'Download Full Guide (PDF)',
          modalTitle: "Download Buyer's Guide (Canada)",
          toast: 'Thank you! Redirecting to download...'
        },
        'en-ca': {
          intro: 'Please enter your details to download the Complete Guide to Buying in Spain for free.',
          firstName: 'First Name', firstPlaceholder: 'e.g. John',
          lastName: 'Last Name', lastPlaceholder: 'e.g. MacDonald',
          email: 'Email Address', phone: 'Phone Number',
          phonePlaceholder: 'e.g. +1 (416) 555-0199',
          btn: 'Download Full Guide (PDF)',
          modalTitle: "Download Buyer's Guide (Canada)",
          toast: 'Thank you! Redirecting to download...'
        }
      };
      const s = t[lang] || t['en'];
      
      const modalBody = `
        <div class="dossier-lead-form" style="padding: 1.5rem 0.5rem 0;">
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 1.5rem; line-height: 1.5;">
            ${s.intro}
          </p>
          <form id="dossier-lead-form-el" style="display: flex; flex-direction: column; gap: 1.2rem;">
            <div style="display: flex; gap: 1rem;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: #0a1628;">${s.firstName}</label>
                <input type="text" id="lead-first-name" required placeholder="${s.firstPlaceholder}" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; font-family: inherit;">
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: #0a1628;">${s.lastName}</label>
                <input type="text" id="lead-last-name" required placeholder="${s.lastPlaceholder}" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; font-family: inherit;">
              </div>
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: #0a1628;">${s.email}</label>
              <input type="email" id="lead-email" required placeholder="name@example.com" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; font-family: inherit;">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: #0a1628;">${s.phone}</label>
              <input type="tel" id="lead-phone" required placeholder="e.g. +1 (305) 555-0199" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; font-family: inherit;">
            </div>
            <button type="submit" class="btn btn-primary" style="background: #e51937; color: white; width: 100%; padding: 0.85rem; font-size: 0.95rem; font-weight: 700; border-radius: 6px; margin-top: 0.8rem; border: none; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>${s.btn}</span>
            </button>
          </form>
        </div>
      `;

      if (App && App.utils && App.utils.showModal) {
        const modalInstance = App.utils.showModal({
          title: s.modalTitle,
          body: modalBody,
          className: 'modal--dossier-lead'
        });

        const form = document.getElementById('dossier-lead-form-el');
        if (form) {
          form.addEventListener('submit', async (formEvt) => {
            formEvt.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const leadData = {
              firstName: document.getElementById('lead-first-name').value,
              lastName: document.getElementById('lead-last-name').value,
              email: document.getElementById('lead-email').value,
              phone: document.getElementById('lead-phone').value,
              source: 'download_dossier'
            };

            try {
              if (App.auth && typeof App.auth.saveDossierLead === 'function') {
                await App.auth.saveDossierLead(leadData);
              }
              
              App.utils.showToast(
                s.toast,
                'success'
              );
              
              modalInstance.close();
              
              // Open dossier in new tab
              window.open('dossier.html', '_blank');
            } catch (err) {
              console.error('Error saving dossier lead:', err);
              App.utils.showToast('Error saving data. Please try again.', 'error');
              if (submitBtn) submitBtn.disabled = false;
            }
          });
        }
      }
    });
  });

});
