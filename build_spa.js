const fs = require('fs');

const files = [
  { id: 'view-home', path: 'index.html', title: 'Invest in Spain | REMAX Inmomás' },
  { id: 'view-professionals', path: 'professionals.html', title: 'Partner Program' },
  { id: 'view-pending', path: 'pending.html', title: 'Application Pending' },
  { id: 'view-partner-dashboard', path: 'dashboard.html', title: 'Partner Dashboard' },
  { id: 'view-admin-dashboard', path: 'admin.html', title: 'Admin Dashboard' }
];

let appHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REMAX Inmomás - International Platform</title>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="icon" type="image/png" href="Globo_CMYK.png">
  <style>
    .app-view { display: none; }
    .app-view.active { display: block; }
    
    /* View-specific container resets when active */
    #view-pending.active { background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    #view-partner-dashboard.active { background-color: #f3f4f6; min-height: 100vh; display: block; }
    #view-admin-dashboard.active { background: #f3f4f6; min-height: 100vh; display: block; }
  </style>
`;

let scripts = [];

for (const view of files) {
  const content = fs.readFileSync(view.path, 'utf8');
  
  // Extract specific styles
  const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
  if (styleMatch) {
    let styles = styleMatch[1];
    // Simple scoping: replace body with the view ID, except for dashboard which sets specific fonts etc.
    styles = styles.replace(/body\s*{/g, `#${view.id} {`);
    appHtml += `  <style>\n    /* Styles from ${view.path} */\n${styles}\n  </style>\n`;
  }
}

appHtml += `</head>\n<body class="lang-en">\n`;

for (const view of files) {
  let content = fs.readFileSync(view.path, 'utf8');
  
  // Extract body content
  let bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (!bodyMatch) continue;
  let bodyHtml = bodyMatch[1];
  
  // Extract scripts to put at the very end
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = scriptRegex.exec(bodyHtml)) !== null) {
    if (!match[0].includes('src="js/main.js"')) {
      scripts.push(`// Script from ${view.path}\n${match[1]}`);
    }
    bodyHtml = bodyHtml.replace(match[0], ''); // Remove script from body
  }
  
  appHtml += `\n  <div id="${view.id}" class="app-view${view.id === 'view-home' ? ' active' : ''}">\n`;
  appHtml += bodyHtml;
  appHtml += `\n  </div>\n`;
}

appHtml += `
  <!-- Core Scripts -->
  <script src="js/firebase-config.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/auth-service.js"></script>
  <script src="js/router.js"></script>
  <script src="js/views/public-views.js"></script>
  <script src="js/views/auth-views.js"></script>
  <script src="js/views/admin-views.js"></script>
  <script src="js/views/broker-views.js"></script>
  <script src="js/views/realtor-views.js"></script>
  <script src="js/views/agent-views.js"></script>
  <script src="js/main.js"></script>
  <script>
    // --- SPA Router Logic ---
    function navigateTo(viewId) {
      document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
      document.getElementById(viewId).classList.add('active');
      window.scrollTo(0,0);
      window.location.hash = viewId.replace('view-', '');
      
      // Re-trigger view specific logic if needed
      if(viewId === 'view-admin-dashboard' && typeof loadApplications === 'function') {
        loadApplications();
      }
      if(viewId === 'view-partner-dashboard' && typeof initDashboard === 'function') {
        initDashboard();
      }
    }

    // Handle hash changes for back/forward buttons
    window.addEventListener('hashchange', () => {
      let hash = window.location.hash.substring(1);
      if (!hash) hash = 'home';
      const viewId = 'view-' + hash;
      if (document.getElementById(viewId)) {
        document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        window.scrollTo(0,0);
      }
    });

    // Initial load based on hash
    window.addEventListener('DOMContentLoaded', () => {
      let hash = window.location.hash.substring(1);
      if (hash) {
        const viewId = 'view-' + hash;
        if (document.getElementById(viewId)) {
          navigateTo(viewId);
        }
      }
      
      // Intercept all links that point to the old HTML files
      document.addEventListener('click', (e) => {
        let target = e.target.closest('a');
        if (target && target.getAttribute('href')) {
          let href = target.getAttribute('href');
          
          const fileToViewMap = {
            'index.html': 'view-home',
            'professionals.html': 'view-professionals',
            'partner-login.html': 'view-partner-login',
            'admin-login.html': 'view-admin-login',
            'dashboard.html': 'view-partner-dashboard',
            'admin.html': 'view-admin-dashboard',
            'pending.html': 'view-pending'
          };
          
          if (fileToViewMap[href]) {
            e.preventDefault();
            navigateTo(fileToViewMap[href]);
          }
        }
      });
    });

    // --- Embedded Scripts from files ---
`;

for (const script of scripts) {
  appHtml += `\n${script}\n`;
}

// Intercept window.location.href assignments inside the extracted scripts
appHtml = appHtml.replace(/window\.location\.href\s*=\s*['"](.*?)['"]/g, (match, url) => {
  const fileToViewMap = {
    'index.html': 'view-home',
    'professionals.html': 'view-professionals',
    'partner-login.html': 'view-partner-login',
    'admin-login.html': 'view-admin-login',
    'dashboard.html': 'view-partner-dashboard',
    'admin.html': 'view-admin-dashboard',
    'pending.html': 'view-pending'
  };
  if (fileToViewMap[url]) {
    return `navigateTo('${fileToViewMap[url]}')`;
  }
  return match;
});

// We must also extract the initialization logic in dashboard.html from the DOMContentLoaded event 
// into a callable initDashboard function.
appHtml = appHtml.replace(/document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{([\s\S]*?)\}\);/g, function(match, content) {
  if (content.includes("Auth Check Simulation")) {
    return `
    function initDashboard() {
      ${content}
    }
    // Call init on first load if we are on the dashboard
    window.addEventListener('DOMContentLoaded', () => {
      if(window.location.hash === '#partner-dashboard') {
         initDashboard();
      }
    });
    `;
  }
  return match;
});


appHtml += `  </script>\n</body>\n</html>`;

fs.writeFileSync('app.html', appHtml);
console.log('Successfully generated app.html');
