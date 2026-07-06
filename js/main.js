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

  // ── Buying Process Details Interactivity ──
  const processSteps = document.querySelectorAll('.process-step');
  const detailsTitle = document.getElementById('process-details-title');
  const detailsDesc = document.getElementById('process-details-desc');
  
  if (processSteps.length > 0 && detailsTitle && detailsDesc) {
    let currentStep = 1;
    
    const stepDetails = {
      1: {
        en: {
          title: "1. Get Your NIE",
          desc: "The NIE (Foreigner Identity Number) is essential for buying property, opening bank accounts, or contracting utility services in Spain. Our partner law firm handles the entire application process with the immigration office or consulate, saving you any travel."
        },
        es: {
          title: "1. Obtener NIE",
          desc: "El NIE (Número de Identidad de Extranjero) es imprescindible para comprar cualquier propiedad, abrir cuentas bancarias o contratar servicios en España. Nuestro despacho asociado se encarga de toda la gestión ante la oficina de extranjería o consulado correspondiente, evitándote desplazamientos."
        }
      },
      2: {
        en: {
          title: "2. Open Bank Account",
          desc: "You will need a Spanish bank account to transfer purchase funds and set up direct debits for future utility bills and taxes. We assist you in opening the account quickly and remotely through our mortgage and banking partners."
        },
        es: {
          title: "2. Abrir Cuenta Bancaria",
          desc: "Necesitarás una cuenta en un banco español para transferir los fondos de la compra y domiciliar los futuros recibos e impuestos. Te ayudamos a abrir la cuenta de forma rápida y remota a través de nuestro partner hipotecario o bancario."
        }
      },
      3: {
        en: {
          title: "3. Define Strategy",
          desc: "We analyze your goals: whether you want a high-yield investment or a holiday home. We design a plan tailored to your financial and personal profile to optimize tax efficiency and returns."
        },
        es: {
          title: "3. Definir Estrategia",
          desc: "Analizamos tus objetivos: si buscas una inversión de alta rentabilidad o una residencia vacacional. Diseñamos un plan adaptado a tu perfil financiero y personal para optimizar el retorno y los impuestos."
        }
      },
      4: {
        en: {
          title: "4. Property Selection",
          desc: "We filter the best properties on the Costa Blanca based on your criteria. We access the complete RE/MAX database and off-market listings to ensure you only visit highly qualified options."
        },
        es: {
          title: "4. Selección de Propiedades",
          desc: "Filtramos las mejores propiedades en la Costa Blanca según tus criterios. Accedemos a la base de datos completa de RE/MAX y a propiedades fuera del mercado (off-market) para garantizar que solo visites opciones altamente cualificadas."
        }
      },
      5: {
        en: {
          title: "5. Due Diligence",
          desc: "A crucial step for a safe purchase. Fuster & Associates performs an exhaustive study of the property's registry status, liens, debts, urban legality, and licenses so you buy with total peace of mind and zero risks."
        },
        es: {
          title: "5. Due Diligence (Estudio Legal)",
          desc: "Paso crucial para una compra segura. Fuster & Associates realiza un estudio exhaustivo del estado registral de la propiedad, cargas, deudas, legalidad urbanística y licencias para que compres con total tranquilidad y cero riesgos."
        }
      },
      6: {
        en: {
          title: "6. Reservation",
          desc: "Reservation deposit to remove the property from the market and freeze the agreed price. This amount is safely held in escrow and will be deducted from the final purchase price upon signing the deeds."
        },
        es: {
          title: "6. Reserva",
          desc: "Depósito de reserva para retirar la propiedad del mercado y congelar el precio acordado. Este importe queda custodiado de forma segura y se descontará del precio final de compra en la firma de las escrituras."
        }
      },
      7: {
        en: {
          title: "7. Contract",
          desc: "Signing the Arras Contract (Purchase Agreement) which details all the conditions of the sale and requires a 10% deposit. This contract legally binds both parties and establishes guarantees and completion dates."
        },
        es: {
          title: "7. Contrato de Arras",
          desc: "Firma del Contrato de Arras (Purchase Contract) donde se detallan todas las condiciones de la compraventa y se abona el 10% del precio total. Este contrato vincula legalmente a ambas partes y establece las garantías y plazos de entrega."
        }
      },
      8: {
        en: {
          title: "8. Completion",
          desc: "The final signing before a Public Notary where the title is transferred and the remaining payment is made. If you cannot travel to Spain, you can grant a Power of Attorney (POA) to our law firm to sign 100% remotely."
        },
        es: {
          title: "8. Escritura Pública",
          desc: "La firma final ante Notario Público donde se transmite la propiedad y se entrega el resto del pago. Si no puedes viajar a España, puedes delegar un Poder Notarial (POA) a nuestro despacho jurídico para firmar 100% de forma remota."
        }
      }
    };
    
    function showDetails(stepNum) {
      currentStep = stepNum;
      const lang = document.body.classList.contains('lang-es') ? 'es' : 'en';
      const details = stepDetails[stepNum][lang];
      
      // Update contents
      detailsTitle.textContent = details.title;
      detailsDesc.textContent = details.desc;
      
      // Add active styling to selected step
      processSteps.forEach(step => {
        const stepId = parseInt(step.getAttribute('data-step'));
        step.classList.toggle('active', stepId === stepNum);
      });
    }
    
    // Add event listeners to steps
    processSteps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.style.cursor = 'pointer';
      step.addEventListener('click', () => {
        showDetails(stepNum);
      });
    });
    
    // Listen for language changes to refresh details text
    const langToggles = document.querySelectorAll('.lang-toggle');
    langToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        // Use a short delay so body language class gets updated first
        setTimeout(() => {
          showDetails(currentStep);
        }, 50);
      });
    });
    
    // Initialize step 1 details
    showDetails(1);
  }

  // ── Featured Properties Modal Interactivity ──
  const propertyCards = document.querySelectorAll('.property-card[data-property]');
  
  const propertyDetails = {
    investment: {
      title: {
        en: "New Build Apartment · Sea Views & Pool",
        es: "Apartamento de Obra Nueva · Vistas al Mar y Piscina"
      },
      location: "📍 Arenales del Sol, Elche",
      price: "245.000 €",
      yield: "7.2%",
      income: {
        en: "Est. Rental Income: <strong>18.000 €/yr</strong>",
        es: "Renta de Alquiler Est.: <strong>18.000 €/año</strong>"
      },
      features: {
        en: ["2 Bed", "2 Bath", "75m²"],
        es: ["2 Dorm.", "2 Baños", "75m²"]
      },
      image: "images/investment.png",
      tag: { en: "New Build", es: "Obra Nueva" },
      tagClass: "investment",
      description: {
        en: "Modern and bright apartment located in the sought-after area of Arenales del Sol. Features spectacular panoramic views of the Mediterranean Sea, a large private balcony, access to a communal pool, landscaped gardens, and a private parking space. Ideal for high-yield vacation rental investment.",
        es: "Moderno y luminoso apartamento ubicado en la codiciada zona de Arenales del Sol. Cuenta con espectaculares vistas panorámicas al mar Mediterráneo, un gran balcón privado, acceso a piscina comunitaria, zonas ajardinadas y plaza de garaje privada. Ideal para inversión en alquiler vacacional de alta rentabilidad."
      },
      specs: {
        en: ["Sea Views", "Communal Pool", "Private Parking", "Air Conditioning", "Large Balcony", "Walk to Beach"],
        es: ["Vistas al Mar", "Piscina Comunitaria", "Garaje Privado", "Aire Acondicionado", "Gran Balcón", "A pie de playa"]
      },
      link: "https://www.remaxinmomas.es/propiedades/"
    },
    lifestyle: {
      title: {
        en: "Luxury Apartment · Large Terrace",
        es: "Piso Exclusivo · Gran Terraza"
      },
      location: "📍 Alicante Centro",
      price: "320.000 €",
      yield: "5.8%",
      income: {
        en: "Est. Rental Income: <strong>21.000 €/yr</strong>",
        es: "Renta de Alquiler Est.: <strong>21.000 €/año</strong>"
      },
      features: {
        en: ["3 Bed", "2 Bath", "110m²"],
        es: ["3 Dorm.", "2 Baños", "110m²"]
      },
      image: "images/lifestyle-mediterranean.png",
      tag: { en: "Lifestyle", es: "Estilo de Vida" },
      tagClass: "lifestyle",
      description: {
        en: "Elegant luxury apartment in the heart of Alicante. Completely renovated with premium finishes, featuring a spectacular 30m² terrace perfect for outdoor dining. Surrounded by high-end shopping, gourmet restaurants, and historic monuments, only a short walk from the marina and Postiguet Beach.",
        es: "Elegante piso de lujo en el pleno centro de Alicante. Totalmente reformado con acabados de primera calidad, destaca su espectacular terraza de 30m² ideal para cenas al aire libre. Rodeado de tiendas exclusivas, restaurantes gourmet y monumentos históricos, a pocos pasos del puerto deportivo y la playa del Postiguet."
      },
      specs: {
        en: ["30m² Terrace", "Premium Refurbishment", "Elevator", "Central Heating", "City Center Location", "Fully Furnished Kitchen"],
        es: ["Terraza de 30m²", "Reforma de Calidad", "Ascensor", "Calefacción Central", "Ubicación Premium", "Cocina Equipada"]
      },
      link: "https://www.remaxinmomas.es/propiedades/"
    },
    luxury: {
      title: {
        en: "New Build Villa · Infinity Pool",
        es: "Chalet Moderno de Obra Nueva · Piscina Infinity"
      },
      location: "📍 Jávea, Costa Blanca",
      price: "695.000 €",
      yield: "6.5%",
      income: {
        en: "Est. Premium Income: <strong>45.000 €/yr</strong>",
        es: "Renta Premium Est.: <strong>45.000 €/año</strong>"
      },
      features: {
        en: ["3 Bed", "3 Bath", "180m²"],
        es: ["3 Dorm.", "3 Baños", "180m²"]
      },
      image: "images/villa-luxury.png",
      tag: { en: "New Build", es: "Obra Nueva" },
      tagClass: "luxury",
      description: {
        en: "Stunning contemporary villa in one of Jávea's most exclusive residential areas. Designed with passive solar architecture and large floor-to-ceiling glass windows. Features a private infinity pool overlooking the bay, landscaped Mediterranean garden, state-of-the-art kitchen, and full home automation.",
        es: "Espectacular chalet contemporáneo en una de las zonas residenciales más exclusivas de Jávea. Diseñado con arquitectura solar pasiva y grandes ventanales de cristal. Cuenta con piscina infinity privada con vistas a la bahía, jardín mediterráneo, cocina de última generación y domótica completa."
      },
      specs: {
        en: ["Infinity Pool", "Sea & Mountain Views", "Home Automation", "Underfloor Heating", "Energy Efficiency A", "Barbecue Area"],
        es: ["Piscina Infinity", "Vistas al Mar y Montaña", "Domótica Completa", "Suelo Radiante", "Eficiencia Energética A", "Zona de Barbacoa"]
      },
      link: "https://www.remaxinmomas.es/propiedades/"
    }
  };

  propertyCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const propId = card.getAttribute('data-property');
      const details = propertyDetails[propId];
      if (!details) return;

      const lang = document.body.classList.contains('lang-es') ? 'es' : 'en';

      const featuresHTML = details.features[lang].map(f => `<span>${f}</span>`).join('');
      const specsHTML = details.specs[lang].map(s => `<li>${s}</li>`).join('');

      const bodyHTML = `
        <button class="modal-close" id="property-modal-close-btn" style="position: absolute; top: 16px; right: 16px; z-index: 100;">&times;</button>
        <div class="property-detail-grid">
          <div class="property-detail-img-col">
            <img src="${details.image}" alt="${details.title[lang]}">
          </div>
          <div class="property-detail-info-col">
            <div class="property-detail-tag ${details.tagClass}">${details.tag[lang]}</div>
            <h2 class="property-detail-title">${details.title[lang]}</h2>
            <div class="property-detail-location">${details.location}</div>
            
            <div class="property-detail-price-row">
              <div class="property-detail-price">${details.price}</div>
              <div class="property-detail-yield">Yield: ${details.yield}</div>
            </div>
            
            <div class="property-detail-features-row">
              ${featuresHTML}
            </div>

            <div class="property-detail-description">
              <h4>${lang === 'en' ? 'About this Property' : 'Sobre esta Propiedad'}</h4>
              <p>${details.description[lang]}</p>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 24px; padding: 12px; background: rgba(16, 185, 129, 0.08); border-radius: var(--radius-sm);">
              ${details.income[lang]}
            </div>

            <div class="property-detail-specs">
              <h4>${lang === 'en' ? 'Key Characteristics' : 'Características Clave'}</h4>
              <ul class="property-detail-specs-list">
                ${specsHTML}
              </ul>
            </div>

            <div class="property-detail-actions">
              <a href="${details.link}" target="_blank" class="btn btn-blue" style="width: 100%; text-align: center;">
                <span>${lang === 'en' ? 'View details on REMAX Inmomás' : 'Ver detalles en REMAX Inmomás'}</span>
              </a>
            </div>
          </div>
        </div>
      `;

      if (App && App.utils && App.utils.showModal) {
        const modalInstance = App.utils.showModal({
          title: '',
          body: bodyHTML,
          className: 'modal--property'
        });

        const customCloseBtn = document.getElementById('property-modal-close-btn');
        if (customCloseBtn) {
          customCloseBtn.addEventListener('click', () => {
            modalInstance.close();
          });
        }
      }
    });
  });

});
