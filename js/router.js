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
    'for-realtors':   { view: 'view-for-realtors',   role: null,      sidebar: false, title: 'For Realtors' },
    'login':          { view: 'view-login',          role: null,      sidebar: false, title: 'Login' },
    'register':       { view: 'view-register',       role: null,      sidebar: false, title: 'Register' },
    'pending':        { view: 'view-pending',        role: null,      sidebar: false, title: 'Application Pending' },

    // Admin routes
    'admin/dashboard': { view: 'view-admin-dashboard', role: 'admin',  sidebar: 'admin', title: 'Admin Dashboard' },
    'admin/users':     { view: 'view-admin-users',     role: 'admin',  sidebar: 'admin', title: 'Manage Users' },

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
    'realtor/finances':  { view: 'view-realtor-finances',  role: 'realtor', sidebar: 'realtor', title: 'Finances' }
  };

  let currentRoute = null;
  let currentView = null;

  /* ---- Initialize Router ---- */
  function init() {
    window.addEventListener('hashchange', handleRouteChange);
    
    // Intercept link clicks for SPA navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        const hash = link.getAttribute('href').substring(1);
        if (routes[hash]) {
          e.preventDefault();
          navigateTo(hash);
        }
      }
    });

    // Handle initial route
    handleRouteChange();
  }

  /* ---- Navigate To Route ---- */
  function navigateTo(route, replace = false) {
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

    const route = routes[routeKey];

    if (!route) {
      navigateTo('home', true);
      return;
    }

    // Auth guard
    if (route.role) {
      const user = App.auth.getCurrentUser();
      if (!user) {
        navigateTo('login', true);
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
      navigateTo(user.role + '/dashboard', true);
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
      sidebar.classList.add('active');
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
        if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        if (avatarEl) avatarEl.innerHTML = App.utils.getInitials(user.firstName, user.lastName);
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

    if (publicNav) publicNav.style.display = sidebarType ? 'none' : '';
    if (dashNav) dashNav.style.display = sidebarType ? 'flex' : 'none';
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
      'admin/dashboard':   () => App.views.admin && App.views.admin.initDashboard(),
      'admin/users':       () => App.views.admin && App.views.admin.initUsers(),
      'broker/dashboard':  () => App.views.broker && App.views.broker.initDashboard(),
      'broker/team':       () => App.views.broker && App.views.broker.initTeam(),
      'broker/clients':    () => App.views.broker && App.views.broker.initClients(),
      'broker/documents':  () => App.views.broker && App.views.broker.initDocuments(),
      'broker/finances':   () => App.views.broker && App.views.broker.initFinances(),
      'realtor/dashboard': () => App.views.realtor && App.views.realtor.initDashboard(),
      'realtor/clients':   () => App.views.realtor && App.views.realtor.initClients(),
      'realtor/referral':  () => App.views.realtor && App.views.realtor.initReferral(),
      'realtor/documents': () => App.views.realtor && App.views.realtor.initDocuments(),
      'realtor/finances':  () => App.views.realtor && App.views.realtor.initFinances()
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
