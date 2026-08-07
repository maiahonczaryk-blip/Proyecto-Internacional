/* ============================================================
   RE/MAX Inmomás — Admin Notification Emails
   Sends alerts to maia.honczaryk@remax.es via EmailJS.

   --- HOW TO ACTIVATE ---
   1. Create a free account at https://www.emailjs.com
      (200 emails/month free — no backend needed)
   2. Click "Add New Service" → connect your Gmail or Outlook
      → note the SERVICE ID (e.g. "service_abc123")
   3. Click "Email Templates" → "Create New Template"
      → Create TWO templates (see below for variable names):
        • template_new_registration  → for new signups
        • template_status_update     → for approvals/rejections
      → note each TEMPLATE ID
   4. Go to Account → General → copy your PUBLIC KEY
   5. Replace the four TODO values below with your real IDs.
      The rest of the code is ready and will work immediately.

   --- TEMPLATE VARIABLES ---

   Template "template_new_registration":
     Subject: 🔔 Nuevo registro: {{user_type}} — {{user_name}}
     Body:
       Hola Maia,
       Se ha registrado un nuevo {{user_type}} en el portal:
       • Nombre:   {{user_name}}
       • Email:    {{user_email}}
       • País:     {{user_country}}
       • Agencia:  {{user_agency}}
       • Teléfono: {{user_phone}}
       • Fecha:    {{registered_at}}
       • Fuente:   {{source}}
       → Accede al panel para aprobar:
         {{admin_url}}
       — Sistema RE/MAX Inmomás International

   Template "template_status_update":
     Subject: ✅ Usuario {{new_status}}: {{user_name}}
     Body:
       Hola Maia,
       El estado de un usuario ha sido actualizado:
       • Nombre:       {{user_name}}
       • Email:        {{user_email}}
       • Rol:          {{user_role}}
       • Nuevo estado: {{new_status}}
       • Fecha:        {{updated_at}}
       → Accede al panel de administración:
         {{admin_url}}
       — Sistema RE/MAX Inmomás International
   ============================================================ */

(function () {
  // ── EmailJS Credentials ────────────────────────────────────────────────────
  // TODO: Replace these four values with your real EmailJS credentials.
  const EMAILJS_PUBLIC_KEY        = 'YOUR_PUBLIC_KEY';       // Account → General
  const EMAILJS_SERVICE_ID        = 'YOUR_SERVICE_ID';       // e.g. 'service_abc123'
  const EMAILJS_TEMPLATE_NEW_REG  = 'YOUR_TEMPLATE_NEW_REG'; // e.g. 'template_abc123'
  const EMAILJS_TEMPLATE_STATUS   = 'YOUR_TEMPLATE_STATUS';  // e.g. 'template_xyz456'
  // ── Admin Destination ─────────────────────────────────────────────────────
  const ADMIN_EMAIL = 'maia.honczaryk@remax.es';
  const ADMIN_URL   = 'https://remax-inmomas-international.vercel.app/app.html#admin/users';
  // ──────────────────────────────────────────────────────────────────────────

  function isReady() {
    return (
      typeof emailjs !== 'undefined' &&
      EMAILJS_PUBLIC_KEY       !== 'YOUR_PUBLIC_KEY' &&
      EMAILJS_SERVICE_ID       !== 'YOUR_SERVICE_ID' &&
      EMAILJS_TEMPLATE_NEW_REG !== 'YOUR_TEMPLATE_NEW_REG' &&
      EMAILJS_TEMPLATE_STATUS  !== 'YOUR_TEMPLATE_STATUS'
    );
  }

  function initEmailJS() {
    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
      try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (_) {}
    }
  }

  function fmtDate(iso) {
    try {
      return new Date(iso || Date.now()).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid'
      });
    } catch (_) { return iso || new Date().toISOString(); }
  }

  function roleLabel(role) {
    const map = {
      broker: 'Broker', realtor: 'Realtor',
      agent_inmomas: 'Agente Inmomás', admin: 'Administrador'
    };
    return map[role] || role || '—';
  }

  function statusLabel(status) {
    const map = { active: 'Aprobado ✅', pending: 'Pendiente ⏳', rejected: 'Rechazado ❌' };
    return map[status] || status || '—';
  }

  async function sendEmail(templateId, params) {
    initEmailJS();
    if (!isReady()) {
      console.info(
        '[Notifications] EmailJS not configured — notification simulated.\n' +
        'Fill in the TODO credentials in js/notifications.js to activate real emails.\n' +
        'Would have sent:', { templateId, to: ADMIN_EMAIL, ...params }
      );
      return;
    }
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, templateId, { to_email: ADMIN_EMAIL, ...params });
      console.info('[Notifications] Email sent to', ADMIN_EMAIL, '— template:', templateId);
    } catch (err) {
      console.warn('[Notifications] Failed to send email:', err);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async function onNewUserRegistration(user) {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    await sendEmail(EMAILJS_TEMPLATE_NEW_REG, {
      user_type:     roleLabel(user.role),
      user_name:     name,
      user_email:    user.email || '—',
      user_country:  user.country || '—',
      user_agency:   user.agencyName || '—',
      user_phone:    user.phone || '—',
      registered_at: fmtDate(user.createdAt),
      source:        user.source || '—',
      admin_url:     ADMIN_URL
    });
  }

  async function onNewDossierLead(lead) {
    const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email;
    await sendEmail(EMAILJS_TEMPLATE_NEW_REG, {
      user_type:     "Lead — Buyer's Guide",
      user_name:     name,
      user_email:    lead.email || '—',
      user_country:  lead.country || '—',
      user_agency:   '—',
      user_phone:    lead.phone || '—',
      registered_at: fmtDate(lead.createdAt),
      source:        lead.source || 'Dossier Download',
      admin_url:     ADMIN_URL
    });
  }

  async function onNewWebinarRegistration(reg) {
    const name = `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || reg.email;
    await sendEmail(EMAILJS_TEMPLATE_NEW_REG, {
      user_type:     'Registro Webinar',
      user_name:     name,
      user_email:    reg.email || '—',
      user_country:  reg.country || '—',
      user_agency:   reg.agencyName || reg.company || '—',
      user_phone:    reg.phone || '—',
      registered_at: fmtDate(reg.createdAt),
      source:        reg.howHeard || 'Webinar B2B',
      admin_url:     ADMIN_URL
    });
  }

  async function onUserStatusChange(user, newStatus) {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    await sendEmail(EMAILJS_TEMPLATE_STATUS, {
      user_name:  name,
      user_email: user.email || '—',
      user_role:  roleLabel(user.role),
      new_status: statusLabel(newStatus),
      updated_at: fmtDate(new Date().toISOString()),
      admin_url:  ADMIN_URL
    });
  }

  // ── Expose on App namespace ────────────────────────────────────────────────
  window.App = window.App || {};
  window.App.notifications = {
    onNewUserRegistration,
    onNewDossierLead,
    onNewWebinarRegistration,
    onUserStatusChange
  };
})();
