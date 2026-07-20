/* ============================================
   RE/MAX Inmomás — SPA Router
   ============================================
   Hash-based routing with role-based access
   control, sidebar management, and smooth
   view transitions.
   ============================================ */

window.App = window.App || {};

App.router = (function() {

  /* ---- Route Definitions ---- */
  const routes = {
    // Public routes (no auth required)
    'home':           { view: 'view-home',           role: null,      sidebar: false, title: 'Home' },
    'about-spain':    { view: 'view-about-spain',    role: null,      sidebar: false, title: 'About Spain' },
    'professionals':  { view: 'view-for-realtors',   role: null,      sidebar: false, title: 'For Professionals' },
    'login':          { view: 'view-login',          role: null,      sidebar: false, title: 'Login' },
    'register':       { view: 'view-register',       role: null,      sidebar: false, title: 'Register' },
    'pending':        { view: 'view-pending',        role: null,      sidebar: false, title: 'Application Pending' },
    'intake':         { view: 'view-intake',         role: null,      sidebar: false, title: 'VIP Client Intake' },
    'referral':       { view: 'view-referral-form',   role: null,      sidebar: false, title: 'Referral Form' },

    // Profile route
    'profile':        { view: 'view-profile',        role: null,      sidebar: null,  title: 'My Profile' },

    // Admin routes
    'admin/dashboard': { view: 'view-admin-dashboard', role: 'admin',  sidebar: 'admin', title: 'Admin Dashboard' },
    'admin/users':     { view: 'view-admin-users',     role: 'admin',  sidebar: 'admin', title: 'Manage Users' },
    'admin/clients':   { view: 'view-admin-clients',   role: 'admin',  sidebar: 'admin', title: 'Clients' },

    // Broker routes
    'broker/dashboard': { view: 'view-broker-dashboard', role: 'broker', sidebar: 'broker', title: 'Broker Dashboard' },
    'broker/team':      { view: 'view-broker-team',      role: 'broker', sidebar: 'broker', title: 'My Team' },
    'broker/clients':   { view: 'view-broker-clients',   role: 'broker', sidebar: 'broker', title: 'Clients' },
    'broker/documents': { view: 'view-broker-documents', role: 'broker', sidebar: 'broker', title: 'Documents' },
    'broker/finances':  { view: 'view-broker-finances',  role: 'broker', sidebar: 'broker', title: 'Finances' },

    // Realtor routes
    'realtor/dashboard': { view: 'view-realtor-dashboard', role: 'realtor', sidebar: 'realtor', title: 'My Dashboard' },
    'realtor/clients':   { view: 'view-realtor-clients',   role: 'realtor', sidebar: 'realtor', title: 'My Clients' },
    'realtor/referral':  { view: 'view-realtor-referral',  role: 'realtor', sidebar: 'realtor', title: 'Referral Tools' },
    'realtor/documents': { view: 'view-realtor-documents', role: 'realtor', sidebar: 'realtor', title: 'Documents' },
    'realtor/finances':  { view: 'view-realtor-finances',  role: 'realtor', sidebar: 'realtor', title: 'Finances' },

    // Agente Inmomás routes
    'agent_inmomas/dashboard': { view: 'view-agent-dashboard', role: 'agent_inmomas', sidebar: 'agent_inmomas', title: 'Dashboard' },
    'agent_inmomas/clients':   { view: 'view-agent-clients',   role: 'agent_inmomas', sidebar: 'agent_inmomas', title: 'Clients' },
    'agent_inmomas/finances':  { view: 'view-agent-finances',  role: 'agent_inmomas', sidebar: 'agent_inmomas', title: 'Finances' }
  };

  let currentRoute = null;
  let currentView = null;

  /* ---- Initialize Router ---- */
  function init() {
    // Intercept ?ref= code from URL (query string or hash params)
    const searchParams = new URLSearchParams(window.location.search);
    let refCode = searchParams.get('ref');
    // Also check hash-based ref params (e.g. #referral?ref=CODE)
    if (!refCode) {
      const hash = window.location.hash;
      const hashQueryIdx = hash.indexOf('?');
      if (hashQueryIdx >= 0) {
        const hashParams = new URLSearchParams(hash.substring(hashQueryIdx + 1));
        refCode = hashParams.get('ref');
      }
    }
    if (refCode) {
      sessionStorage.setItem('referralCode', refCode);
      window.history.replaceState({}, document.title, window.location.pathname + '#referral');
    }

    window.addEventListener('hashchange', handleRouteChange);
    
    // Intercept link clicks for SPA navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        const hash = link.getAttribute('href').substring(1);
        if (routes[hash]) {
          e.preventDefault();
          navigateTo(hash);
          
          // On mobile, close sidebar after navigation
          if (window.innerWidth < 992) {
            closeMobileSidebar();
          }
        }
      }
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('mobile-sidebar-toggle') || document.getElementById('sidebar-toggle-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const sidebar = document.getElementById('dashboard-sidebar');
        const isOpen = sidebar?.classList.contains('active');
        if (isOpen) {
          closeMobileSidebar();
        } else {
          sidebar?.classList.add('active');
          sidebarBackdrop?.classList.add('active');
        }
      });
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        closeMobileSidebar();
      });
    }

    // Handle initial route
    handleRouteChange();
  }

  /* ---- Navigate To Route ---- */
  function navigateTo(route, replace = false) {
    const isPublic = !routes[route].role;
    const isCurrentPublic = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
    
    // Cross-page navigation
    if (isPublic && !isCurrentPublic) {
      window.location.href = 'index.html#' + route;
      return;
    } else if (!isPublic && isCurrentPublic) {
      window.location.href = 'app.html#' + route;
      return;
    }

    if (replace) {
      window.location.replace('#' + route);
    } else {
      window.location.hash = route;
    }
  }

   /* ---- Handle Route Change ---- */
  function handleRouteChange() {
    let hash = window.location.hash.substring(1) || 'home';
    
    // Strip query parameters for route matching
    const queryIndex = hash.indexOf('?');
    const routeKey = queryIndex >= 0 ? hash.substring(0, queryIndex) : hash;
    const queryString = queryIndex >= 0 ? hash.substring(queryIndex + 1) : '';

    // Capture ref code from hash-based referral links (e.g. #referral?ref=CODE)
    if (routeKey === 'referral' && queryString) {
      const hashParams = new URLSearchParams(queryString);
      const refParam = hashParams.get('ref');
      if (refParam) {
        sessionStorage.setItem('referralCode', refParam);
        // Clean the URL to remove the ref param
        window.history.replaceState({}, document.title, window.location.pathname + '#referral');
      }
    }

    const route = routes[routeKey];

    if (!route) {
      navigateTo('home', true);
      return;
    }

    // Auth guard
    if (route.role) {
      const user = App.auth.getCurrentUser();
      if (!user) {
        window.location.href = 'index.html#login';
        return;
      }
      if (user.role !== route.role) {
        // Redirect to appropriate dashboard
        navigateTo(user.role + '/dashboard', true);
        return;
      }
    }

    // If user is logged in and trying to access login/register, redirect to dashboard
    if ((routeKey === 'login' || routeKey === 'register') && App.auth.isAuthenticated()) {
      const user = App.auth.getCurrentUser();
      window.location.href = 'app.html#' + user.role + '/dashboard';
      return;
    }

    currentRoute = routeKey;

    // Update document title
    document.title = `${route.title} | RE/MAX Inmomás`;

    // Hide all views
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));

    // Show target view
    const viewEl = document.getElementById(route.view);
    if (viewEl) {
      viewEl.classList.add('active');
    }

    // Manage sidebar visibility
    updateSidebar(route.sidebar);

    // Manage navbar visibility  
    updateNavbar(route.sidebar);

    // Update active sidebar link
    updateActiveSidebarLink(routeKey);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Initialize view logic
    initView(routeKey, queryString);

    currentView = routeKey;
  }

  /* ---- Update Sidebar ---- */
  function updateSidebar(sidebarType) {
    const sidebar = document.getElementById('dashboard-sidebar');
    const appMain = document.getElementById('app-main');
    
    if (!sidebar || !appMain) return;

    if (sidebarType) {
      // On desktop (>=992px): sidebar is permanently visible when a dashboard route is active.
      // On mobile (<992px): sidebar starts closed — user opens it via the hamburger button.
      if (window.innerWidth >= 992) {
        sidebar.classList.add('active');
      } else {
        // Ensure sidebar is closed when navigating on mobile
        closeMobileSidebar();
      }
      appMain.classList.add('has-sidebar');

      // Show correct sidebar nav for role
      document.querySelectorAll('.sidebar-nav-group').forEach(g => g.style.display = 'none');
      const roleNav = document.getElementById(`sidebar-${sidebarType}`);
      if (roleNav) roleNav.style.display = 'block';

      // Update sidebar user info
      const user = App.auth.getCurrentUser();
      if (user) {
        const nameEl = document.getElementById('sidebar-user-name');
        const roleEl = document.getElementById('sidebar-user-role');
        const avatarEl = document.getElementById('sidebar-user-avatar');
        
        if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
        if (roleEl) {
          roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
          roleEl.className = `sidebar-user__role sidebar-user__role--${user.role}`;
        }
        if (avatarEl) avatarEl.innerHTML = App.utils.getInitials(user.firstName, user.lastName);
        
        sidebar.classList.remove('sidebar--admin', 'sidebar--broker', 'sidebar--realtor', 'sidebar--agent_inmomas');
        sidebar.classList.add(`sidebar--${user.role}`);
      }
    } else {
      sidebar.classList.remove('active');
      appMain.classList.remove('has-sidebar');
    }
  }

  /* ---- Update Navbar ---- */
  function updateNavbar(sidebarType) {
    const publicNav = document.getElementById('public-nav');
    const dashNav = document.getElementById('dashboard-nav');
    // NOTE: sidebar toggle visibility is now handled by CSS media query only
    // We only need to toggle the data-has-sidebar attribute for context
    const appMain = document.getElementById('app-main');

    if (publicNav) publicNav.style.display = sidebarType ? 'none' : '';
    if (dashNav) dashNav.style.display = sidebarType ? 'flex' : 'none';

    // On mobile, always close the sidebar when switching routes
    if (window.innerWidth < 992) {
      closeMobileSidebar();
    }
  }

  /* ---- Close Mobile Sidebar ---- */
  function closeMobileSidebar() {
    document.getElementById('dashboard-sidebar')?.classList.remove('active');
    document.getElementById('sidebar-backdrop')?.classList.remove('active');
  }

  /* ---- Update Active Sidebar Link ---- */
  function updateActiveSidebarLink(routeKey) {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const linkRoute = href.substring(1);
        link.classList.toggle('active', linkRoute === routeKey);
      }
    });
  }

  /* ---- Initialize View Logic ---- */
  function initView(routeKey, queryString) {
    // Parse query string
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, val] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });
    }

    // Call view-specific init function
    const viewInits = {
      'home':              () => App.views.home && App.views.home.init(),
      'about-spain':       () => App.views.aboutSpain && App.views.aboutSpain.init(),
      'for-realtors':      () => App.views.forRealtors && App.views.forRealtors.init(),
      'login':             () => App.views.auth && App.views.auth.initLogin(),
      'register':          () => App.views.auth && App.views.auth.initRegister(params),
      'pending':           () => {},
      'intake':            () => App.views.public && App.views.public.initIntake(),
      'referral':          () => App.views.public && App.views.public.initReferralForm(),
      'admin/dashboard':   () => App.views.admin && App.views.admin.initDashboard(),
      'admin/users':       () => App.views.admin && App.views.admin.initUsers(),
      'admin/clients':     () => App.views.admin && App.views.admin.initClients(),
      'broker/dashboard':  () => App.views.broker && App.views.broker.initDashboard(),
      'broker/team':       () => App.views.broker && App.views.broker.initTeam(),
      'broker/clients':    () => App.views.broker && App.views.broker.initClients(),
      'broker/documents':  () => App.views.broker && App.views.broker.initDocuments(),
      'broker/finances':   () => App.views.broker && App.views.broker.initFinances(),
      'realtor/dashboard': () => App.views.realtor && App.views.realtor.initDashboard(),
      'realtor/clients':   () => App.views.realtor && App.views.realtor.initClients(),
      'realtor/referral':  () => App.views.realtor && App.views.realtor.initReferral(),
      'realtor/documents': () => App.views.realtor && App.views.realtor.initDocuments(),
      'realtor/finances':  () => App.views.realtor && App.views.realtor.initFinances(),
      'agent_inmomas/dashboard': () => App.views.agentInmomas && App.views.agentInmomas.initDashboard(),
      'agent_inmomas/clients':   () => App.views.agentInmomas && App.views.agentInmomas.initClients(),
      'agent_inmomas/finances':  () => App.views.agentInmomas && App.views.agentInmomas.initFinances(),
      'profile':           () => App.views.auth && App.views.auth.initProfile()
    };

    const initFn = viewInits[routeKey];
    if (initFn) {
      try { initFn(); } catch(e) { console.error(`[Router] Error initializing view "${routeKey}":`, e); }
    }
  }

  /* ---- Get Current Route ---- */
  function getCurrentRoute() {
    return currentRoute;
  }

  function getRouteForRole(role) {
    return role + '/dashboard';
  }

  /* ---- Public API ---- */
  return {
    init,
    navigateTo,
    getCurrentRoute,
    getRouteForRole,
    routes
  };
})();
