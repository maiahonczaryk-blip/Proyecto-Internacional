/* ============================================================
   RE/MAX Inmomás — Admin Notification Emails
   Sends alerts to maia.honczaryk@remax.es via EmailJS.

   --- HOW TO ACTIVATE ---
   1. Create a free account at https://www.emailjs.com
      (200 emails/month free — no backend needed)
   2. Click "Add New Service" → connect your Gmail or Outlook
      → note the SERVICE ID (e.g. "service_abc123")
   3. Click "Email Templates" → "Create New Template"
      → Crea TRES templates (ver abajo las variables a usar):
        • template_new_registration  → para nuevos registros (Llega al Admin)
        • template_status_update     → para cambios de estado (Llega al Admin)
        • template_user_approved     → para cuando se aprueba al usuario (Llega al Usuario)
      → anota cada TEMPLATE ID
   4. Go to Account → General → copy your PUBLIC KEY
   5. Reemplaza los cinco valores TODO abajo con tus IDs reales.
      El resto del código está listo y funcionará inmediatamente.

   --- TEMPLATE VARIABLES ---

   Template "template_new_registration": (Para el Admin)
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

   Template "template_status_update": (Para el Admin)
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

   Template "template_user_approved": (Para el Usuario)
     Subject: ¡Felicidades! Tu cuenta ha sido aprobada 🎉
     Body:
       Hola {{user_name}},
       ¡Nos complace informarte que tu cuenta en el portal de RE/MAX Inmomás ha sido aprobada!
       Ya puedes iniciar sesión y acceder a todos los recursos, guías y acuerdos de referidos.
       
       → Inicia sesión aquí:
         {{login_url}}
       
       ¡Bienvenido/a al equipo!
       — Sistema RE/MAX Inmomás International
   ============================================================ */

(function () {
  // ── EmailJS Credentials ────────────────────────────────────────────────────
  // TODO: Reemplaza estos valores con tus credenciales reales de EmailJS.
  const EMAILJS_PUBLIC_KEY        = 'JTCb2ReY646jaDW4r';     // Listo! (Sacado de tu captura)
  const EMAILJS_SERVICE_ID        = 'service_j1ney1s';       // Listo!
  const EMAILJS_TEMPLATE_NEW_REG  = 'template_dr41flj';      // Listo! (Plantilla A)
  const EMAILJS_TEMPLATE_STATUS   = 'YOUR_TEMPLATE_STATUS';  // e.g. 'template_xyz456'
  const EMAILJS_TEMPLATE_USER_APPROVED = 'template_giaoa5e'; // Listo! (Plantilla C)
  // ── Admin Destination ─────────────────────────────────────────────────────
  const ADMIN_EMAIL = 'spainconnection0@gmail.com';
  const ADMIN_URL   = 'https://remax-inmomas-international.vercel.app/app.html#admin/users';
  // ──────────────────────────────────────────────────────────────────────────

  function isReady() {
    return (
      typeof emailjs !== 'undefined' &&
      EMAILJS_PUBLIC_KEY       !== 'YOUR_PUBLIC_KEY' &&
      EMAILJS_SERVICE_ID       !== 'YOUR_SERVICE_ID'
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
      agent_inmomas: 'Agente Inmomás', admin: 'Administrador',
      colaborador: 'Colaborador'
    };
    return map[role] || role || '—';
  }

  function statusLabel(status) {
    const map = { active: 'Aprobado ✅', pending: 'Pendiente ⏳', rejected: 'Rechazado ❌' };
    return map[status] || status || '—';
  }

  async function sendEmail(templateId, params, toEmail = ADMIN_EMAIL) {
    initEmailJS();
    if (!isReady() || templateId.startsWith('YOUR_TEMPLATE')) {
      console.info(
        '[Notifications] EmailJS no configurado o no detectado para este template — notificación simulada.\n' +
        'Se hubiese enviado a:', toEmail, ' con template:', templateId, ' y params:', params
      );
      return;
    }
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, templateId, { to_email: toEmail, ...params });
      console.info('[Notifications] Email enviado a', toEmail, '— template:', templateId);
    } catch (err) {
      alert("⚠️ Error de EmailJS: No se pudo enviar el correo. Revisa la consola para más detalles.");
      console.warn('[Notifications] Error al enviar email:', err);
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

  async function onNewReferredCollaborator(newUser, referrerAgent) {
    const newUserName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.email;
    
    // Si el agente no tiene correo (improbable), no enviamos
    if (!referrerAgent.email) return;

    // Reutilizamos la plantilla de administrador para la alerta del agente
    await sendEmail(EMAILJS_TEMPLATE_NEW_REG, {
      user_type:     roleLabel(newUser.role),
      user_name:     newUserName,
      user_email:    newUser.email || '—',
      user_country:  newUser.country || '—',
      user_agency:   newUser.agencyName || '—',
      user_phone:    newUser.phone || '—',
      registered_at: fmtDate(newUser.createdAt),
      source:        newUser.source || '—',
      admin_url:     'https://remax-inmomas-international.vercel.app/app.html#agent/clients'
    }, referrerAgent.email);
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

  async function onNewWebinarRegistration(reg, agentEmail = null) {
    const name = `${reg.firstName || ''} ${reg.lastName || ''}`.trim() || reg.email;
    const emailData = {
      user_type:     'Registro Webinar',
      user_name:     name,
      user_email:    reg.email || '—',
      user_country:  reg.country || '—',
      user_agency:   reg.agencyName || reg.company || '—',
      user_phone:    reg.phone || '—',
      registered_at: fmtDate(reg.createdAt),
      source:        reg.howHeard || 'Webinar B2B',
      admin_url:     ADMIN_URL
    };

    // 1. Send to Admin
    await sendEmail(EMAILJS_TEMPLATE_NEW_REG, emailData);

    // 2. If referred, send a copy to the agent
    if (agentEmail) {
      await sendEmail(EMAILJS_TEMPLATE_NEW_REG, emailData, agentEmail);
    }
  }

  async function onUserStatusChange(user, newStatus) {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    
    // 1. Notificar al Admin del cambio de estado
    await sendEmail(EMAILJS_TEMPLATE_STATUS, {
      user_name:  name,
      user_email: user.email || '—',
      user_role:  roleLabel(user.role),
      new_status: statusLabel(newStatus),
      updated_at: fmtDate(new Date().toISOString()),
      admin_url:  ADMIN_URL
    }, ADMIN_EMAIL);

    // 2. Si el usuario ha sido aprobado ('active'), enviarle correo a él
    if (newStatus === 'active' && user.email) {
      await sendEmail(EMAILJS_TEMPLATE_USER_APPROVED, {
        user_name: name,
        user_email: user.email,
        login_url: 'https://remax-inmomas-international.vercel.app/#login'
      }, user.email);
    }
  }

  // ── Expose on App namespace ────────────────────────────────────────────────
  window.App = window.App || {};
  window.App.notifications = {
    onNewUserRegistration,
    onNewReferredCollaborator,
    onNewDossierLead,
    onNewWebinarRegistration,
    onUserStatusChange
  };
})();
