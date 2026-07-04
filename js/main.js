/* ============================================
   RE/MAX Inmomás — Landing Page JavaScript
   Corporate Edition — Bilingual + Empathy
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Language Toggle ──
  const langToggles = document.querySelectorAll('.lang-toggle');
  const body = document.body;
  let currentLang = 'en';

  langToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'es' : 'en';
      body.classList.remove('lang-en', 'lang-es');
      body.classList.add('lang-' + currentLang);
      
      langToggles.forEach(t => {
        const label = t.querySelector('.lang-label');
        if (label) label.textContent = currentLang === 'en' ? 'ES' : 'EN';
      });

      // Update html lang attribute
      document.documentElement.lang = currentLang;
      
      // Update form placeholders
      updateFormPlaceholders(currentLang);
    });
  });

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
  const navLinks = document.getElementById('nav-links');

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
        submitBtn.classList.add('success');
        submitBtn.innerHTML = currentLang === 'en' 
          ? '✓ Registered Successfully' 
          : '✓ Registrado con Éxito';

        const msg = document.createElement('p');
        msg.className = 'form-success-msg';
        msg.textContent = currentLang === 'en'
          ? '🎉 Check your email for webinar details and your free guide!'
          : '🎉 ¡Revisa tu email para los detalles del webinar y tu guía gratuita!';
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

});
