import re

def process_landing():
    with open('landing.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove dashboard sidebar
    content = re.sub(r'<!-- ===================== DASHBOARD SIDEBAR ===================== -->.*?<!-- Sidebar backdrop for mobile -->\n\s*<div class="sidebar-backdrop" id="sidebar-backdrop"></div>', '', content, flags=re.DOTALL)
    
    # Remove admin views
    content = re.sub(r'<!-- ==================== VIEW: ADMIN .*?</div>\s*</div>\s*(?=<!-- ==================== VIEW:|\n\n)', '', content, flags=re.DOTALL)
    
    # Remove broker views
    content = re.sub(r'<!-- ==================== VIEW: BROKER .*?</div>\s*</div>\s*(?=<!-- ==================== VIEW:|\n\n)', '', content, flags=re.DOTALL)
    
    # Remove realtor views
    content = re.sub(r'<!-- ==================== VIEW: REALTOR .*?</div>\s*</div>\s*(?=<!-- ==================== VIEW:|\n\n|</main>)', '', content, flags=re.DOTALL)
    
    with open('landing.html', 'w', encoding='utf-8') as f:
        f.write(content)

def process_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Remove public nav links
    content = re.sub(r'<!-- Public Nav Links -->.*?</div>\s*<!-- Dashboard Nav', '<!-- Dashboard Nav', content, flags=re.DOTALL)
    
    # Remove HOME view
    content = re.sub(r'<!-- ==================== VIEW: HOME ==================== -->.*?<!-- ==================== VIEW: ABOUT SPAIN', '<!-- ==================== VIEW: ABOUT SPAIN', content, flags=re.DOTALL)
    
    # Remove ABOUT SPAIN view
    content = re.sub(r'<!-- ==================== VIEW: ABOUT SPAIN ==================== -->.*?<!-- ==================== VIEW: FOR REALTORS', '<!-- ==================== VIEW: FOR REALTORS', content, flags=re.DOTALL)
    
    # Remove FOR REALTORS view
    content = re.sub(r'<!-- ==================== VIEW: FOR REALTORS \(B2B\) ==================== -->.*?<!-- ==================== VIEW: LOGIN', '<!-- ==================== VIEW: LOGIN', content, flags=re.DOTALL)
    
    # Remove LOGIN view
    content = re.sub(r'<!-- ==================== VIEW: LOGIN ==================== -->.*?<!-- ==================== VIEW: ADMIN', '<!-- ==================== VIEW: ADMIN', content, flags=re.DOTALL)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)

process_landing()
process_index()
