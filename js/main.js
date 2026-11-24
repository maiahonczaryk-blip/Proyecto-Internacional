/* ============================================
   RE/MAX Inmomás — Landing Page JavaScript
   Corporate Edition — Bilingual + Empathy
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Language Selector (8 idiomas: EN, ES, FR-CA, EN-CA, FR-EU, NL, SV, BG) ──
  const body = document.body;
  let currentLang = 'en';
  const LANG_STORAGE_KEY = 'remax_lang';

  const langConfig = {
    en:      { code: 'EN',    htmlLang: 'en' },
    es:      { code: 'ES',    htmlLang: 'es' },
    fr:      { code: 'FR-CA', htmlLang: 'fr-CA' },
    'en-ca': { code: 'EN-CA', htmlLang: 'en-CA' },
    'fr-eu': { code: 'FR',    htmlLang: 'fr' },
    nl:      { code: 'NL',    htmlLang: 'nl' },
    sv:      { code: 'SV',    htmlLang: 'sv' },
    bg:      { code: 'BG',    htmlLang: 'bg' }
  };
  const ALL_BODY_LANG_CLASSES = Object.keys(langConfig).map(k => 'lang-' + k);
  const NON_DASHBOARD_LANGS = ['fr', 'en-ca', 'fr-eu', 'nl', 'sv', 'bg'];

  const langSelectorWrapper = document.getElementById('lang-selector-wrapper');
  const langSelectorBtn = document.getElementById('lang-selector-btn');
  const langFlag = document.getElementById('lang-flag');
  const langCode = document.getElementById('lang-code');
  const langDropdown = document.getElementById('lang-dropdown');
  const langDropdownItems = document.querySelectorAll('.lang-dropdown-item');

  function toDatasetSuffix(lang) {
    return lang.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  }

  function syncDynamicI18nAttributes(lang) {
    const suffix = toDatasetSuffix(lang);
    const attrKey = 'i18n' + suffix;
    const fallbackKey = lang === 'es' ? 'i18nEs' : (lang === 'fr-eu' ? 'i18nFr' : 'i18nEn');

    // Sync <option> and text-only elements carrying data-i18n-* attributes
    document.querySelectorAll('[data-i18n-en], [data-i18n-es]').forEach(el => {
      const nextText = el.dataset[attrKey] || el.dataset[fallbackKey] || el.dataset.i18nEn || el.dataset.i18nEs;
      if (nextText !== undefined && el.textContent !== nextText) {
        el.textContent = nextText;
      }
    });

    // Sync input/textarea placeholders carrying data-placeholder-*
    const phKey = 'placeholder' + suffix;
    const phFallbackKey = lang === 'es' ? 'placeholderEs' : (lang === 'fr-eu' ? 'placeholderFr' : 'placeholderEn');
    document.querySelectorAll('[data-placeholder-en], [data-placeholder-es]').forEach(el => {
      const nextPh = el.dataset[phKey] || el.dataset[phFallbackKey] || el.dataset.placeholderEn || el.dataset.placeholderEs;
      if (nextPh !== undefined) {
        el.placeholder = nextPh;
      }
    });

    // Sync aria-pressed on segmented EN | ES switch buttons
    const effectiveDashLang = (lang === 'es') ? 'es' : 'en';
    document.querySelectorAll('.dashboard-lang-switch__opt[data-set-lang]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.setLang === effectiveDashLang ? 'true' : 'false');
    });
  }

  function setLang(lang, options = {}) {
    if (!langConfig[lang]) return;
    const isDashboard = body.classList.contains('dashboard-body');
    const effectiveLang = (isDashboard && NON_DASHBOARD_LANGS.includes(lang)) ? 'en' : lang;
    currentLang = effectiveLang;

    // Persist preference across sessions unless suppressed (e.g. dashboard fallback)
    if (options.persist !== false) {
      try { localStorage.setItem(LANG_STORAGE_KEY, effectiveLang); } catch(e) {}
    }

    // Update body class
    body.classList.remove(...ALL_BODY_LANG_CLASSES);
    body.classList.add('lang-' + effectiveLang);

    // Update html lang attribute & data-lang attribute
    document.documentElement.lang = langConfig[effectiveLang].htmlLang || 'en';
    document.documentElement.setAttribute('data-lang', effectiveLang);

    // Update button appearance on landing navbar (code only — flag handled by CSS span)
    if (langCode) langCode.textContent = langConfig[effectiveLang].code;

    // Update active state on dropdown items
    langDropdownItems.forEach(item => {
      item.classList.toggle('active', item.dataset.lang === effectiveLang);
    });

    // Legacy single-label fallback if present
    const nextLangText = (effectiveLang === 'es') ? 'EN' : 'ES';
    const sidebarLangLabel = document.querySelector('#sidebar-lang-toggle .lang-label');
    if (sidebarLangLabel) sidebarLangLabel.textContent = nextLangText;
    const mobileLangLabel = document.querySelector('#mobile-lang-toggle .lang-label');
    if (mobileLangLabel) mobileLangLabel.textContent = nextLangText;

    // Update form placeholders & dynamic <option> / placeholder attributes
    updateFormPlaceholders(effectiveLang);
    syncDynamicI18nAttributes(effectiveLang);

    try {
      window.dispatchEvent(new CustomEvent('remax:langchange', { detail: { lang: effectiveLang } }));
    } catch (_) {}
  }

  window.App = window.App || {};
  window.App.setLanguage = (lang) => setLang(lang, { persist: true });
  window.App.getLanguage = () => currentLang;
  window.App.updateLangDisplay = () => syncDynamicI18nAttributes(currentLang);

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
      setLang(item.dataset.lang, { persist: true });
      if (langSelectorWrapper) langSelectorWrapper.classList.remove('open');
    });
  });

  // Delegate clicks on segmented EN | ES buttons ([data-set-lang]) anywhere in the app
  document.addEventListener('click', (e) => {
    const optBtn = e.target.closest('[data-set-lang]');
    if (optBtn) {
      e.preventDefault();
      e.stopPropagation();
      const targetLang = optBtn.dataset.setLang;
      if (targetLang) setLang(targetLang, { persist: true });
      return;
    }
    const toggleContainer = e.target.closest('#sidebar-lang-toggle, #mobile-lang-toggle');
    if (toggleContainer) {
      e.preventDefault();
      const next = body.classList.contains('lang-es') ? 'en' : 'es';
      setLang(next, { persist: true });
    }
  });

  // Initialize: saved preference → browser language → 'en' fallback
  (function initLang() {
    let lang = 'en';
    let hadSaved = false;
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && langConfig[saved]) {
        lang = saved;
        hadSaved = true;
      } else {
        // Auto-detect from browser language
        const bl = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (bl.startsWith('es')) lang = 'es';
        else if (bl === 'fr-ca') lang = 'fr';
        else if (bl.startsWith('fr')) lang = 'fr-eu';
        else if (bl === 'en-ca') lang = 'en-ca';
        else if (bl.startsWith('nl')) lang = 'nl';
        else if (bl.startsWith('sv')) lang = 'sv';
        else if (bl.startsWith('bg')) lang = 'bg';
      }
    } catch(e) { lang = 'en'; }

    // Dashboard pages (app.html) only have EN and ES content.
    // If another public language was saved on the landing page, render EN on dashboards without overwriting saved preference.
    const isDashboard = body.classList.contains('dashboard-body');
    const isFallback = isDashboard && NON_DASHBOARD_LANGS.includes(lang);
    setLang(isFallback ? 'en' : lang, { persist: !isFallback || !hadSaved });
  })();

  function updateFormPlaceholders(lang) {
    const placeholders = {
      en: {
        'first-name': 'John',
        'last-name': 'Smith',
        'email': 'john@example.com',
        'phone': '+1 (555) 123-4567',
        'referral-firstName': 'John',
        'referral-lastName': 'Smith',
        'referral-email': 'john@example.com',
        'referral-phone': '+1 (555) 123-4567',
        'referral-country': 'United States',
        'webinar-firstName': 'John',
        'webinar-lastName': 'Smith',
        'webinar-email': 'john@example.com',
        'webinar-phone': '+1 (555) 123-4567'
      },
      es: {
        'first-name': 'María',
        'last-name': 'García',
        'email': 'maria@ejemplo.com',
        'phone': '+34 600 123 456',
        'referral-firstName': 'María',
        'referral-lastName': 'García',
        'referral-email': 'maria@ejemplo.com',
        'referral-phone': '+34 600 123 456',
        'referral-country': 'España / Puerto Rico',
        'webinar-firstName': 'María',
        'webinar-lastName': 'García',
        'webinar-email': 'maria@ejemplo.com',
        'webinar-phone': '+34 600 123 456'
      },
      fr: {
        'first-name': 'Jean',
        'last-name': 'Tremblay',
        'email': 'jean@exemple.ca',
        'phone': '+1 (514) 555-1234',
        'referral-firstName': 'Jean',
        'referral-lastName': 'Tremblay',
        'referral-email': 'jean@exemple.ca',
        'referral-phone': '+1 (514) 555-1234',
        'referral-country': 'Canada',
        'webinar-firstName': 'Jean',
        'webinar-lastName': 'Tremblay',
        'webinar-email': 'jean@exemple.ca',
        'webinar-phone': '+1 (514) 555-1234'
      },
      'en-ca': {
        'first-name': 'James',
        'last-name': 'Thompson',
        'email': 'james@example.ca',
        'phone': '+1 (416) 555-1234',
        'referral-firstName': 'James',
        'referral-lastName': 'Thompson',
        'referral-email': 'james@example.ca',
        'referral-phone': '+1 (416) 555-1234',
        'referral-country': 'Canada',
        'webinar-firstName': 'James',
        'webinar-lastName': 'Thompson',
        'webinar-email': 'james@example.ca',
        'webinar-phone': '+1 (416) 555-1234'
      },
      'fr-eu': {
        'first-name': 'Laurent',
        'last-name': 'Moreau',
        'email': 'laurent.moreau@exemple.fr',
        'phone': '+33 6 12 34 56 78',
        'referral-firstName': 'Laurent',
        'referral-lastName': 'Moreau',
        'referral-email': 'laurent.moreau@exemple.fr',
        'referral-phone': '+33 6 12 34 56 78',
        'referral-country': 'France',
        'webinar-firstName': 'Laurent',
        'webinar-lastName': 'Moreau',
        'webinar-email': 'laurent.moreau@exemple.fr',
        'webinar-phone': '+33 6 12 34 56 78'
      },
      nl: {
        'first-name': 'Jeroen',
        'last-name': 'van Dijk',
        'email': 'jeroen@voorbeeld.nl',
        'phone': '+31 6 1234 5678',
        'referral-firstName': 'Jeroen',
        'referral-lastName': 'van Dijk',
        'referral-email': 'jeroen@voorbeeld.nl',
        'referral-phone': '+31 6 1234 5678',
        'referral-country': 'Nederland',
        'webinar-firstName': 'Jeroen',
        'webinar-lastName': 'van Dijk',
        'webinar-email': 'jeroen@voorbeeld.nl',
        'webinar-phone': '+31 6 1234 5678'
      },
      sv: {
        'first-name': 'Erik',
        'last-name': 'Lindqvist',
        'email': 'erik.lindqvist@exempel.se',
        'phone': '+46 70 123 45 67',
        'referral-firstName': 'Erik',
        'referral-lastName': 'Lindqvist',
        'referral-email': 'erik.lindqvist@exempel.se',
        'referral-phone': '+46 70 123 45 67',
        'referral-country': 'Sverige',
        'webinar-firstName': 'Erik',
        'webinar-lastName': 'Lindqvist',
        'webinar-email': 'erik.lindqvist@exempel.se',
        'webinar-phone': '+46 70 123 45 67'
      },
      bg: {
        'first-name': 'Георги',
        'last-name': 'Димитров',
        'email': 'georgi@primer.bg',
        'phone': '+359 88 812 3456',
        'referral-firstName': 'Георги',
        'referral-lastName': 'Димитров',
        'referral-email': 'georgi@primer.bg',
        'referral-phone': '+359 88 812 3456',
        'referral-country': 'България',
        'webinar-firstName': 'Георги',
        'webinar-lastName': 'Димитров',
        'webinar-email': 'georgi@primer.bg',
        'webinar-phone': '+359 88 812 3456'
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
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ── Bottom Nav — active tab on scroll & hash change ──
  const bnavItems = document.querySelectorAll('.bnav-item[data-section]');

  function updateBottomNav() {
    if (!bnavItems.length) return;
    const rawHash = (window.location.hash || '#home').substring(1).split('?')[0] || 'home';
    let currentSection = rawHash === 'register' ? 'login' : rawHash;

    // Only check scroll offset when on home view
    if (currentSection === 'home') {
      const navH = navbar ? navbar.offsetHeight : 60;
      bnavItems.forEach(item => {
        const sectionId = item.dataset.section;
        const section = document.getElementById('view-' + sectionId) ||
                        document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.height > 0 && rect.top <= navH + 80) {
            currentSection = sectionId;
          }
        }
      });
    }

    bnavItems.forEach(item => {
      item.classList.toggle('active', item.dataset.section === currentSection);
    });
  }

  window.addEventListener('scroll', updateBottomNav, { passive: true });
  window.addEventListener('hashchange', () => setTimeout(updateBottomNav, 30));
  updateBottomNav();

  // ── Smooth Scroll (only for in-page section anchors, never SPA routes) ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#' || targetId.includes('/')) return;
      const hashKey = targetId.substring(1);
      if (window.App && App.router && App.router.routes && App.router.routes[hashKey]) return;
      const target = document.getElementById(hashKey);
      if (target) {
        e.preventDefault();
        const offset = (navbar ? navbar.offsetHeight : 60) + 20;
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
          'en-ca': '✓ Registered Successfully',
          'fr-eu': '✓ Inscription confirmée',
          nl: '✓ Aanmelding bevestigd',
          sv: '✓ Anmälan är bekräftad',
          bg: '✓ Регистрацията е успешна'
        };
        const detailMsgs = {
          en: '🎉 Check your email for webinar details and your free guide!',
          es: '🎉 ¡Revisa tu email para los detalles del webinar y tu guía gratuita!',
          fr: '🎉 Consultez votre courriel pour les détails du webinaire et votre guide gratuit !',
          'en-ca': '🎉 Check your email for webinar details and your free guide!',
          'fr-eu': '🎉 Consultez votre boîte mail pour recevoir votre lien d’accès et le guide patrimonial offert !',
          nl: '🎉 Bekijk je e-mail voor de deelnamelink en je gratis aankoopgids!',
          sv: '🎉 Håll utkik i din inkorg – där finns din länk till webbinariet och vår kostnadsfria köpguide!',
          bg: '🎉 Проверете имейла си за линка към уебинара и Вашето безплатно ръководство!'
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
    .form-success-msg { text-align:center; padding:16px 0 0; color:#059669; font-weight:600; font-size:0.9rem; animation:fadeUp 0.5s ease; }
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
          title: "Obtenir votre NIE",
          desc: "Le NIE (Numéro d'identité des étrangers) est indispensable pour acheter un bien immobilier, ouvrir un compte bancaire ou souscrire à des services en Espagne. Notre cabinet juridique partenaire gère l'ensemble de la procédure auprès du bureau de l'immigration ou du consulat.",
          highlights: [
            { icon: "⏱", text: "1–2 semaines" },
            { icon: "🏰", text: "Fuster & Associates" },
            { icon: "🌐", text: "100% à distance" }
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
        },
        'fr-eu': {
          title: "Obtention de votre NIE",
          desc: "En tant que citoyen européen, aucun visa n'est requis : seule votre carte d'identité ou passeport et le NIE (numéro d'identification fiscale espagnol) sont nécessaires pour acquérir un bien. Le cabinet Fuster & Associates l'obtient pour vous par simple procuration, sans quitter la France ou la Belgique.",
          highlights: [
            { icon: "🇪🇺", text: "Simple CNI / Passeport" },
            { icon: "⏱", text: "Sous 1 à 2 semaines" },
            { icon: "⚖️", text: "Géré par avocat" }
          ]
        },
        nl: {
          title: "NIE-nummer aanvragen",
          desc: "Als EU-burger heb je geen visum nodig — alleen een geldig paspoort of ID-kaart en een Spaans fiscaal nummer (NIE). Ons aangesloten advocatenkantoor Fuster & Associates regelt jouw NIE snel en volledig op volmacht, zonder gedoe bij het consulaat.",
          highlights: [
            { icon: "🇪🇺", text: "Geen visum nodig" },
            { icon: "⏱", text: "Binnen 1–2 weken" },
            { icon: "🌐", text: "100% op afstand" }
          ]
        },
        sv: {
          title: "Skaffa ditt NIE-nummer",
          desc: "Som EU-medborgare behöver du inget visum — endast pass eller nationellt ID-kort samt ett spanskt skatte-ID (NIE) för att köpa bostad. Vår partnerbyrå Fuster & Associates ordnar hela ansökan tryggt via fullmakt utan att du behöver resa ner i förväg.",
          highlights: [
            { icon: "🇪🇺", text: "Fri rörlighet inom EU" },
            { icon: "⏱", text: "1–2 veckor" },
            { icon: "🌐", text: "Via fullmakt hemifrån" }
          ]
        },
        bg: {
          title: "Издаване на NIE номер",
          desc: "Като граждани на ЕС не се нуждаете от виза — достатъчни са лична карта или паспорт и испански данъчен номер за чужденци (NIE). Адвокатска кантора Fuster & Associates поема цялата процедура чрез пълномощно, без излишни разкарвания.",
          highlights: [
            { icon: "🇪🇺", text: "Само с лична карта / паспорт" },
            { icon: "⏱", text: "1–2 седмици" },
            { icon: "🌐", text: "100% дистанционно" }
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
          title: "Ouvrir un compte bancaire",
          desc: "Vous aurez besoin d'un compte bancaire espagnol pour transférer les fonds d'achat et domicilier vos futures factures et impôts. Nous vous aidons à ouvrir un compte rapidement et à distance via nos partenaires bancaires et hypothécaires.",
          highlights: [
            { icon: "🏦", text: "Partenaire Banco UCI" },
            { icon: "📱", text: "Ouverture à distance" },
            { icon: "✅", text: "Sans déplacement" }
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
        },
        'fr-eu': {
          title: "Compte bancaire espagnol & SEPA",
          desc: "Zéro frais de change : vos virements s'effectuent directement en euros dans l'espace SEPA. Nous ouvrons votre compte espagnol à distance pour le règlement chez le notaire et les prélèvements (eau, électricité, copropriété, IBI), et étudions votre financement via Banco UCI.",
          highlights: [
            { icon: "💶", text: "Virement SEPA en euros" },
            { icon: "🏦", text: "Crédit via Banco UCI" },
            { icon: "📱", text: "Ouverture à distance" }
          ]
        },
        nl: {
          title: "Spaanse bankrekening & SEPA",
          desc: "Geen wisselkoerskosten: alles verloopt gewoon in euro's via SEPA. Wij openen op afstand je Spaanse bankrekening voor de notariële betaling en automatische incasso van vaste lasten (water, stroom, VvE en IBI), plus eventuele financiering tot 70–75% via Banco UCI.",
          highlights: [
            { icon: "💶", text: "Direct in euro's (SEPA)" },
            { icon: "🏦", text: "Hypotheek via Banco UCI" },
            { icon: "📱", text: "Volledig digitaal" }
          ]
        },
        sv: {
          title: "Spanskt bankkonto & finansiering",
          desc: "Vi hjälper dig att öppna ett spanskt eurokonto på distans för köpeskillingen samt autogiro för el, vatten, samfällighet (comunidad) och fastighetsskatt. Vill du låna i euro erbjuder vår partner Banco UCI förhandsbesked inom 48 timmar.",
          highlights: [
            { icon: "🏦", text: "Partner Banco UCI" },
            { icon: "💶", text: "Konto & lån i euro" },
            { icon: "📱", text: "Öppnas på distans" }
          ]
        },
        bg: {
          title: "Испанска банкова сметка в евро",
          desc: "Съдействаме за бързо и дистанционно откриване на испанска сметка за SEPA преводи в евро и автоматично плащане на комунални разходи и местни данъци. При желание за финансиране нашият партньор Banco UCI предлага ипотеки за граждани на ЕС с предварително одобрение до 48 часа.",
          highlights: [
            { icon: "💶", text: "SEPA преводи в евро" },
            { icon: "🏦", text: "Ипотека от Banco UCI" },
            { icon: "📱", text: "Дистанционно откриване" }
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
          title: "Définir votre stratégie",
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
        },
        'fr-eu': {
          title: "Stratégie patrimoniale & fiscale",
          desc: "Résidence secondaire au soleil, investissement locatif à fort rendement ou préparation de retraite : nous structurons votre projet (achat en nom propre ou société, convention fiscale franco-espagnole / belgo-espagnole, licence touristique) pour maximiser votre rendement net.",
          highlights: [
            { icon: "🏛️", text: "Structuration patrimoniale" },
            { icon: "💰", text: "Convention fiscale UE" },
            { icon: "🏖", text: "Usage mixte ou locatif" }
          ]
        },
        nl: {
          title: "Strategie, rendement & Box 3",
          desc: "Zoek je een zonnige tweede woning voor jezelf, puur verhuurrendement of een slimme combinatie? Samen met onze fiscalisten stemmen we aankoopstructuur, verhuurvergunning en het Nederlands-Spaans belastingverdrag (Box 3-vrijstelling ter voorkoming van dubbele belasting) helder af.",
          highlights: [
            { icon: "📊", text: "Helder rendementsplan" },
            { icon: "💶", text: "Slim buitenlands vastgoed" },
            { icon: "🏖", text: "Eigen gebruik + verhuur" }
          ]
        },
        sv: {
          title: "Lägg upp rätt strategi",
          desc: "Drömmer du om ett vinterboende i solen, en trygg europlacering med uthyrningsintäkter eller en kombination av båda? Vi skräddarsyr upplägget utifrån dina mål, uthyrningslicens och skatteavtalet mellan Sverige och Spanien.",
          highlights: [
            { icon: "📊", text: "Skräddarsydd plan" },
            { icon: "💶", text: "Kapitalplacering i euro" },
            { icon: "☀️", text: "Semesterhem & uthyrning" }
          ]
        },
        bg: {
          title: "Инвестиционна или семейна стратегия",
          desc: "Определяме точната цел: сигурна защита на капитала в Западна Европа с висока доходност от целогодишен туризъм, ваканционен дом за семейството или комбинация от двете — с пълна данъчна яснота по спогодбата между България и Испания.",
          highlights: [
            { icon: "📊", text: "Индивидуален план" },
            { icon: "💶", text: "Доходност в евро" },
            { icon: "🏖", text: "Инвестиция или втори дом" }
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
            { icon: "🔒", text: "Accès hors marché" },
            { icon: "🎯", text: "Pré-qualifiées" }
          ]
        },
        'en-ca': {
          title: "Property Selection",
          desc: "We select the best properties on the Costa Blanca based on your criteria. We access the full RE/MAX database and off-market listings to guarantee you targeted, pre-qualified viewings.",
          highlights: [
            { icon: "🏠", text: "RE/MAX Database" },
            { icon: "🔒", text: "Off-market access" },
            { icon: "🎯", text: "Pre-qualified" }
          ]
        },
        'fr-eu': {
          title: "Chasse immobilière sur mesure",
          desc: "Contrairement à une agence classique qui ne montre que sa vitrine, nous représentons vos intérêts d'acheteur avec accès à l'intégralité du marché Costa Blanca (Jávea, Altea, Alicante, Benidorm), aux programmes neufs garantis et aux biens confidentiels hors marché.",
          highlights: [
            { icon: "🏠", text: "Accès marché global + off-market" },
            { icon: "✈️", text: "À 2h de vol pour vos visites" },
            { icon: "🎯", text: "Sélection vérifiée" }
          ]
        },
        nl: {
          title: "Gerichte woningselectie (Aankoopbegeleiding)",
          desc: "In Spanje werkt een verkoopmakelaar voor de verkoper — wij staan 100% aan jouw kant als aankoopbegeleider. Je krijgt toegang tot het volledige aanbod aan de Costa Blanca (o.a. Jávea, Altea, Alicante, Santa Pola), inclusief nieuwbouw met bankgarantie en off-market parels.",
          highlights: [
            { icon: "🏠", text: "100% jouw aankoopbelang" },
            { icon: "🔒", text: "Inclusief off-market aanbod" },
            { icon: "✈️", text: "2,5u vliegen voor VIP-bezichtiging" }
          ]
        },
        sv: {
          title: "Handplockat urval & visningsresa",
          desc: "Vi representerar dig som köpare och filtrerar fram rätt bostäder längs hela Costa Blanca (Alicante, Santa Pola, Altea, Jávea, Torrevieja) — både kvalitetssäkrad nyproduktion med bankgaranti och exklusiva off-market-objekt.",
          highlights: [
            { icon: "🏠", text: "Hela RE/MAX-nätverket" },
            { icon: "🔒", text: "Off-market & nyproduktion" },
            { icon: "🎯", text: "Personliga visningar på plats" }
          ]
        },
        bg: {
          title: "Подбрана селекция от имоти до ключ",
          desc: "За разлика от стандартните оферти на шпакловка и замазка, ние филтрираме само проверени, напълно завършени имоти и ново строителство с банкова гаранция по цялата Коста Бланка — включително ексклузивни off-market предложения от мрежата на RE/MAX.",
          highlights: [
            { icon: "🏠", text: "Имоти до ключ + off-market" },
            { icon: "🔒", text: "Банкова гаранция при ново стр." },
            { icon: "🎯", text: "VIP огледи на място или видео" }
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
            { icon: "🛡", text: "Zéro risque" }
          ]
        },
        'en-ca': {
          title: "Due Diligence",
          desc: "A crucial step for a safe purchase. Fuster & Associates performs an exhaustive study of the property's registry status, liens, debts, urban legality, and licences so you buy with total peace of mind and zero risk.",
          highlights: [
            { icon: "⚖️", text: "Legal verification" },
            { icon: "📋", text: "Registry check" },
            { icon: "🛡", text: "Zero risk" }
          ]
        },
        'fr-eu': {
          title: "Audit juridique complet (Due Diligence)",
          desc: "Point essentiel à connaître pour un Français ou un Belge : en Espagne, le notaire ne vérifie pas l'urbanisme ni les dettes cachées comme en France. C'est pourquoi nos avocats Fuster & Associates auditent intégralement le Registre foncier, le cadastre, les permis de construire, la copropriété et la licence locative avant tout engagement.",
          highlights: [
            { icon: "⚖️", text: "Audit urbanistique & cadastral" },
            { icon: "📋", text: "Zéro dette ni vice caché" },
            { icon: "🛡", text: "Protection juridique totale" }
          ]
        },
        nl: {
          title: "Juridisch boekenonderzoek (Due Diligence)",
          desc: "Cruciaal verschil met Nederland: een Spaanse notaris controleert géén bestemmingsplannen, illegale aanbouwen of openstaande VvE-schulden. Daarom controleert Fuster & Associates vooraf het eigendomsregister, kadaster, bouwvergunningen, woonvergunning (licencia de primera ocupación) en verhuurmogelijkheden.",
          highlights: [
            { icon: "⚖️", text: "Volledige bouw- & eigendomscheck" },
            { icon: "📋", text: "Geen verborgen schulden" },
            { icon: "🛡", text: "100% juridische zekerheid" }
          ]
        },
        sv: {
          title: "Juridisk granskning (Due Diligence)",
          desc: "För din totala trygghet granskar advokatbyrån Fuster & Associates fastighetsregistret (Nota Simple), bygglov, inflyttningslicens, eventuella skulder i bostadsföreningen samt uthyrningsregler innan du binder dig — inga obehagliga överraskningar.",
          highlights: [
            { icon: "⚖️", text: "Oberoende juristkontroll" },
            { icon: "📋", text: "Skuld- & bygglovskontroll" },
            { icon: "🛡", text: "100 % trygg affär" }
          ]
        },
        bg: {
          title: "Пълен правен одит (Due Diligence)",
          desc: "Ключова стъпка за пълно спокойствие: адвокатите от Fuster & Associates извършват щателна проверка в Имотния регистър за вещни тежести, ипотеки, данъчни или етажна собственост задължения, градоустройствена законност, Акт за въвеждане в експлоатация и лиценз за отдаване под наем.",
          highlights: [
            { icon: "⚖️", text: "Пълна проверка за тежести" },
            { icon: "📋", text: "Градоустройство и лицензи" },
            { icon: "🛡", text: "Нулев правен риск" }
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
        },
        'fr-eu': {
          title: "Offre & Dépôt de réservation",
          desc: "Une fois le prix négocié, un dépôt de réservation (3 000 € à 10 000 €) bloque immédiatement le bien à votre profit et retire l'annonce du marché. Les fonds sont sécurisés sur compte séquestre et intégralement déduits du prix final.",
          highlights: [
            { icon: "💶", text: "3 000 € – 10 000 €" },
            { icon: "🔐", text: "Compte séquestre sécurisé" },
            { icon: "❄️", text: "Bien bloqué & prix figé" }
          ]
        },
        nl: {
          title: "Reservering & Derdengeldenrekening",
          desc: "Zodra we de beste prijs hebben uitonderhandeld, haalt een reserveringsborg (€ 3.000 – € 10.000) de woning direct van de markt. Dit bedrag staat veilig op een geblokkeerde klantenrekening en wordt volledig verrekend bij de overdracht.",
          highlights: [
            { icon: "💶", text: "€ 3.000 – € 10.000" },
            { icon: "🔐", text: "Veilig in depot (escrow)" },
            { icon: "❄️", text: "Prijs vastgezet" }
          ]
        },
        sv: {
          title: "Reservation & Klientmedelskonto",
          desc: "När vi har förhandlat fram rätt pris tas bostaden bort från marknaden genom en reservationsavgift (€3 000 – €10 000). Beloppet hålls tryggt på klientmedelskonto och dras av från slutpriset vid tillträdet.",
          highlights: [
            { icon: "💶", text: "€3 000 – €10 000" },
            { icon: "🔐", text: "Tryggt klientmedelskonto" },
            { icon: "❄️", text: "Låst pris" }
          ]
        },
        bg: {
          title: "Резервация и блокиране на имота",
          desc: "След договаряне на най-добрата цена, резервационен депозит (€3 000 – €10 000) сваля имота от пазара и фиксира цената. Сумата се съхранява сигурно по доверителна (ескроу) сметка и се приспада от крайната продажна цена.",
          highlights: [
            { icon: "💶", text: "€3 000 – €10 000" },
            { icon: "🔐", text: "Защитена ескроу сметка" },
            { icon: "❄️", text: "Фиксирана цена" }
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
            { icon: "💰", text: "Acompte de 10%" },
            { icon: "⚖️", text: "Juridiquement contraignant" }
          ]
        },
        'en-ca': {
          title: "Purchase Agreement",
          desc: "Signing the Purchase Agreement (Contrato de Arras) which details all the conditions of the sale and requires a 10% deposit. This contract legally binds both parties and establishes guarantees and completion dates.",
          highlights: [
            { icon: "📝", text: "Purchase Agreement" },
            { icon: "💰", text: "10% deposit" },
            { icon: "⚖️", text: "Legally binding" }
          ]
        },
        'fr-eu': {
          title: "Compromis de vente (Contrato de Arras)",
          desc: "Équivalent espagnol du compromis de vente : le Contrato de Arras fixe le prix, l'inventaire, la date butoir chez le notaire et s'accompagne d'un acompte de 10 % (et de garanties bancaires légales obligatoires pour tout achat sur plan / VEFA).",
          highlights: [
            { icon: "📝", text: "Compromis rédigé par avocat" },
            { icon: "💰", text: "Acompte de 10 %" },
            { icon: "⚖️", text: "Garantie légale bilatérale" }
          ]
        },
        nl: {
          title: "Koopovereenkomst (Contrato de Arras)",
          desc: "Het Spaanse voorlopig koopcontract (Contrato de Arras) legt alle voorwaarden, opleverdatum en inventaris juridisch vast, met een aanbetaling van 10% (bij nieuwbouw altijd gedekt door verplichte Spaanse bankgarantie).",
          highlights: [
            { icon: "📝", text: "Contrato de Arras" },
            { icon: "💰", text: "10% aanbetaling" },
            { icon: "⚖️", text: "Wettelijke bankgarantie" }
          ]
        },
        sv: {
          title: "Köpekontrakt (Contrato de Arras)",
          desc: "Nu tecknas det juridiskt bindande köpekontraktet (Contrato de Arras) med 10 % handpenning, tydliga villkor och tillträdesdatum. Vid nyproduktion omfattas varje delbetalning av lagstadgad spansk bankgaranti.",
          highlights: [
            { icon: "📝", text: "Arras-kontrakt" },
            { icon: "💰", text: "10 % handpenning" },
            { icon: "⚖️", text: "Bankgaranti vid nybyggt" }
          ]
        },
        bg: {
          title: "Предварителен договор (Contrato de Arras)",
          desc: "Подписване на обвързващия предварителен договор (Contrato de Arras) с 10% капаро, точни срокове и опис на обзавеждането. По испанския закон при отказ на продавача той дължи връщане на капарото в двоен размер, а при ново строителство плащанията са обезпечени с банкова гаранция.",
          highlights: [
            { icon: "📝", text: "Договор Arras" },
            { icon: "💰", text: "10% депозит" },
            { icon: "⚖️", text: "Двойна законова защита" }
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
            { icon: "🔑", text: "Keys in hand" },
            { icon: "🏰", text: "Public Notary" },
            { icon: "🌐", text: "Remote from Canada" }
          ]
        },
        'fr-eu': {
          title: "Acte authentique (Escritura) & Clés en main",
          desc: "Signature de l'Escritura devant notaire en Espagne (en personne ou 100 % à distance par procuration). Dans la foulée, nous transférons les contrats d'eau/électricité/fibre et, si vous le souhaitez, Inmomás Holidays prend le relais pour la gestion locative intégrale.",
          highlights: [
            { icon: "🔑", text: "Remise des clés" },
            { icon: "🏰", text: "Acte notarié inscrit" },
            { icon: "🏡", text: "Gestion locative clé en main" }
          ]
        },
        nl: {
          title: "Notariële overdracht (Escritura) & Sleutels",
          desc: "De officiële eigendomsoverdracht bij de Spaanse notaris — persoonlijk aan de Costa Blanca of 100% op afstand via volmacht. Wij zetten meteen nutsvoorzieningen en belastingen op jouw naam, en desgewenst neemt Inmomás Holidays direct het volledige verhuurbeheer over.",
          highlights: [
            { icon: "🔑", text: "Sleuteloverdracht" },
            { icon: "🏰", text: "Spaanse notaris" },
            { icon: "🏡", text: "Zorgeloos verhuurbeheer" }
          ]
        },
        sv: {
          title: "Tillträde (Escritura) & Nycklarna i handen",
          desc: "Slutlig signering av lagfarten (Escritura) inför spansk Notarius Publicus — på plats i solen eller helt på distans via fullmakt. Vi ordnar överflyttning av el, vatten och bredband, och Inmomás Holidays kan ta hand om all uthyrning och tillsyn när du är i Sverige.",
          highlights: [
            { icon: "🔑", text: "Nycklarna i handen" },
            { icon: "🏰", text: "Notarius Publicus" },
            { icon: "🏡", text: "Full tillsyn & uthyrning" }
          ]
        },
        bg: {
          title: "Нотариален акт (Escritura) и ключове в ръка",
          desc: "Окончателно изповядване на сделката пред испански нотариус — лично на място или 100% дистанционно чрез пълномощно. Прехвърляме партидите за ток, вода и интернет, а при желание Inmomás Holidays поема цялостното управление и отдаване под наем.",
          highlights: [
            { icon: "🔑", text: "Ключове в ръка" },
            { icon: "🏰", text: "Нотариално вписване" },
            { icon: "🏡", text: "Управление от разстояние" }
          ]
        }
      }
    };
    
    function updatePipeline(stepNum) {
      currentStep = stepNum;
      const body = document.body;
      const activeMatch = Object.keys(langConfig).find(k => body.classList.contains('lang-' + k)) || 'en';
      const lang = activeMatch;
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
        const stepLabels = { en: 'Step', es: 'Paso', fr: 'Étape', 'en-ca': 'Step', 'fr-eu': 'Étape', nl: 'Stap', sv: 'Steg', bg: 'Стъпка' };
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
    
    // Listen for language changes to refresh details text
    window.addEventListener('remax:langchange', () => {
      updatePipeline(currentStep);
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
      const lang = Object.keys(langConfig).find(k => bodyEl.classList.contains('lang-' + k)) || 'en';
      
      const t = {
        en: {
          intro: 'Please enter your details to download the Complete Guide to Buying in Spain for free.',
          firstName: 'First Name', firstPlaceholder: 'e.g. John',
          lastName: 'Last Name', lastPlaceholder: 'e.g. Doe',
          email: 'Email Address', emailPlaceholder: 'john@example.com',
          phone: 'Phone Number', phonePlaceholder: 'e.g. +1 (305) 555-0199',
          btn: 'Download Full Guide (PDF)',
          modalTitle: "Download Buyer's Guide",
          toast: 'Thank you! Redirecting to download...',
          dossierHash: 'en'
        },
        es: {
          intro: 'Por favor, déjanos tus datos para descargar la Guía Completa de Compra en España de forma gratuita.',
          firstName: 'Nombre', firstPlaceholder: 'Ej. Juan',
          lastName: 'Apellidos', lastPlaceholder: 'Ej. Pérez',
          email: 'Correo Electrónico', emailPlaceholder: 'juan@ejemplo.com',
          phone: 'Número de Teléfono', phonePlaceholder: '+34 600 123 456',
          btn: 'Descargar Guía Completa (PDF)',
          modalTitle: 'Descarga la Guía del Comprador',
          toast: '¡Gracias! Redirigiendo a la descarga...',
          dossierHash: 'es'
        },
        fr: {
          intro: "Veuillez saisir vos coordonnées pour télécharger gratuitement le Guide Complet d'Achat en Espagne.",
          firstName: 'Prénom', firstPlaceholder: 'ex. Jean',
          lastName: 'Nom', lastPlaceholder: 'ex. Tremblay',
          email: 'Adresse courriel', emailPlaceholder: 'jean@exemple.ca',
          phone: 'Numéro de téléphone', phonePlaceholder: '+1 (514) 555-0199',
          btn: 'Télécharger le Guide Complet (PDF)',
          modalTitle: "Guide d'Achat en Espagne (Canada)",
          toast: 'Merci ! Redirection vers le téléchargement...',
          dossierHash: 'fr'
        },
        'en-ca': {
          intro: 'Please enter your details to download the Complete Guide to Buying in Spain for free.',
          firstName: 'First Name', firstPlaceholder: 'e.g. John',
          lastName: 'Last Name', lastPlaceholder: 'e.g. MacDonald',
          email: 'Email Address', emailPlaceholder: 'john@example.ca',
          phone: 'Phone Number', phonePlaceholder: 'e.g. +1 (416) 555-0199',
          btn: 'Download Full Guide (PDF)',
          modalTitle: "Download Buyer's Guide (Canada)",
          toast: 'Thank you! Redirecting to download...',
          dossierHash: 'en-ca'
        },
        'fr-eu': {
          intro: "Indiquez vos coordonnées pour accéder gratuitement au Guide Complet d'Acquisition & Fiscalité en Espagne.",
          firstName: 'Prénom', firstPlaceholder: 'ex. Laurent',
          lastName: 'Nom', lastPlaceholder: 'ex. Moreau',
          email: 'Adresse e-mail', emailPlaceholder: 'laurent@exemple.fr',
          phone: 'Téléphone portable', phonePlaceholder: '+33 6 12 34 56 78',
          btn: "Télécharger le Guide d'Achat (PDF)",
          modalTitle: "Guide d'Acquisition en Espagne",
          toast: 'Merci ! Ouverture de votre guide en cours...',
          dossierHash: 'fr'
        },
        nl: {
          intro: 'Vul je gegevens in en ontvang direct en vrijblijvend onze uitgebreide Aankoopgids voor Spanje.',
          firstName: 'Voornaam', firstPlaceholder: 'bijv. Jeroen',
          lastName: 'Achternaam', lastPlaceholder: 'bijv. van Dijk',
          email: 'E-mailadres', emailPlaceholder: 'jeroen@voorbeeld.nl',
          phone: 'Telefoonnummer', phonePlaceholder: '+31 6 1234 5678',
          btn: 'Download Volledige Gids (PDF)',
          modalTitle: 'Gratis Aankoopgids Spanje',
          toast: 'Bedankt! Je wordt doorgestuurd naar de gids...',
          dossierHash: 'en'
        },
        sv: {
          intro: 'Fyll i dina uppgifter för kostnadsfri tillgång till vår kompletta köpguide för bostad i Spanien.',
          firstName: 'Förnamn', firstPlaceholder: 't.ex. Erik',
          lastName: 'Efternamn', lastPlaceholder: 't.ex. Lindqvist',
          email: 'E-postadress', emailPlaceholder: 'erik@exempel.se',
          phone: 'Mobilnummer', phonePlaceholder: '+46 70 123 45 67',
          btn: 'Ladda ner Köpguiden (PDF)',
          modalTitle: 'Köpguide för Bostad i Spanien',
          toast: 'Tack! Öppnar guiden...',
          dossierHash: 'en'
        },
        bg: {
          intro: 'Въведете Вашите данни за безплатен достъп до Пълното ръководство за покупка на имот в Испания.',
          firstName: 'Име', firstPlaceholder: 'напр. Георги',
          lastName: 'Фамилия', lastPlaceholder: 'напр. Димитров',
          email: 'Имейл адрес', emailPlaceholder: 'georgi@primer.bg',
          phone: 'Телефонен номер', phonePlaceholder: '+359 88 812 3456',
          btn: 'Изтегли Пълното Ръководство (PDF)',
          modalTitle: 'Ръководство на Купувача в Испания',
          toast: 'Благодарим Ви! Пренасочване към ръководството...',
          dossierHash: 'en'
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
              <input type="email" id="lead-email" required placeholder="${s.emailPlaceholder}" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; font-family: inherit;">
            </div>
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: #0a1628;">${s.phone}</label>
              <input type="tel" id="lead-phone" required placeholder="${s.phonePlaceholder}" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 6px; font-family: inherit;">
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
              language: lang,
              source: 'download_dossier'
            };

            const dossierUrl = `dossier.html#${s.dossierHash || 'en'}`;

            App.utils.showToast(
              s.toast,
              'success'
            );

            try {
              if (App.auth && typeof App.auth.saveDossierLead === 'function') {
                await Promise.race([
                  App.auth.saveDossierLead(leadData),
                  new Promise(resolve => setTimeout(resolve, 2500))
                ]);
              }
            } catch (err) {
              console.error('Error saving dossier lead:', err);
            }

            if (modalInstance && typeof modalInstance.close === 'function') {
              modalInstance.close();
            } else if (App.utils && typeof App.utils.closeModal === 'function') {
              App.utils.closeModal();
            }

            // Navigate directly in current tab so Safari/mobile popup blockers never block it
            window.location.href = dossierUrl;
          });
        }
      }
    });
  });

});
