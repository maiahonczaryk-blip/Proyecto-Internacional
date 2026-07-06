import os
import re

files = [
    {'id': 'view-home', 'path': 'index.html'},
    {'id': 'view-professionals', 'path': 'professionals.html'},
    {'id': 'view-partner-login', 'path': 'partner-login.html'},
    {'id': 'view-admin-login', 'path': 'admin-login.html'},
    {'id': 'view-pending', 'path': 'pending.html'},
    {'id': 'view-partner-dashboard', 'path': 'dashboard.html'},
    {'id': 'view-admin-dashboard', 'path': 'admin.html'}
]

app_html = """<!DOCTYPE html>
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
    
    /* View-specific container resets */
    #view-partner-login { background: var(--bg-secondary); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    #view-admin-login { background-color: #111827; color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    #view-pending { background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    #view-partner-dashboard { background-color: #f3f4f6; min-height: 100vh; }
    #view-admin-dashboard { background: #f3f4f6; min-height: 100vh; }
  </style>
"""

scripts = []

for v in files:
    if not os.path.exists(v['path']): continue
    with open(v['path'], 'r', encoding='utf-8') as f:
        content = f.read()
    
    # extract style
    style_match = re.search(r'<style>([\s\S]*?)</style>', content)
    if style_match:
        styles = style_match.group(1)
        styles = re.sub(r'body\s*{', f"#{v['id']} {{", styles)
        app_html += f"  <style>\n    /* Styles from {v['path']} */\n{styles}\n  </style>\n"

app_html += "</head>\n<body class=\"lang-en\">\n"

for v in files:
    if not os.path.exists(v['path']): continue
    with open(v['path'], 'r', encoding='utf-8') as f:
        content = f.read()
    
    body_match = re.search(r'<body[^>]*>([\s\S]*?)</body>', content)
    if not body_match: continue
    body_html = body_match.group(1)
    
    # extract scripts
    for script_match in re.finditer(r'<script\b[^>]*>([\s\S]*?)</script>', body_html):
        if 'src="js/main.js"' not in script_match.group(0):
            scripts.append(f"// Script from {v['path']}\n{script_match.group(1)}")
        body_html = body_html.replace(script_match.group(0), '')
    
    active_class = ' active' if v['id'] == 'view-home' else ''
    app_html += f"\n  <div id=\"{v['id']}\" class=\"app-view{active_class}\">\n"
    app_html += body_html
    app_html += f"\n  </div>\n"

app_html += """
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
      let target = document.getElementById(viewId);
      if (target) {
          target.classList.add('active');
          window.scrollTo(0,0);
          window.location.hash = viewId.replace('view-', '');
      }
      
      if(viewId === 'view-admin-dashboard' && typeof loadApplications === 'function') {
        loadApplications();
      }
      if(viewId === 'view-partner-dashboard' && typeof initDashboard === 'function') {
        initDashboard();
      }
    }

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

    window.addEventListener('DOMContentLoaded', () => {
      let hash = window.location.hash.substring(1);
      if (hash) {
        const viewId = 'view-' + hash;
        if (document.getElementById(viewId)) {
          navigateTo(viewId);
        }
      }
      
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
"""

script_text = "\n".join(scripts)

import re
def repl_href(m):
    url = m.group(1)
    fileToViewMap = {
        'index.html': 'view-home',
        'professionals.html': 'view-professionals',
        'partner-login.html': 'view-partner-login',
        'admin-login.html': 'view-admin-login',
        'dashboard.html': 'view-partner-dashboard',
        'admin.html': 'view-admin-dashboard',
        'pending.html': 'view-pending'
    }
    if url in fileToViewMap:
        return f"navigateTo('{fileToViewMap[url]}')"
    return m.group(0)

script_text = re.sub(r"window\.location\.href\s*=\s*['\"](.*?)['\"]", repl_href, script_text)

def repl_init(m):
    content = m.group(1)
    if "Auth Check Simulation" in content:
        return f"""
    function initDashboard() {{
      {content}
    }}
    window.addEventListener('DOMContentLoaded', () => {{
      if(window.location.hash === '#partner-dashboard') {{
         initDashboard();
      }}
    }});
    """
    return m.group(0)

script_text = re.sub(r"document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{([\s\S]*?)\}\);", repl_init, script_text)

app_html += script_text
app_html += """  </script>
</body>
</html>"""

with open('app.html', 'w', encoding='utf-8') as f:
    f.write(app_html)

print("Successfully generated app.html")
