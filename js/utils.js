/* ============================================
   RE/MAX Inmomás — Utility Functions
   ============================================ */

window.App = window.App || {};
App.utils = {};

/* ---- Toast Notifications ---- */
App.utils.showToast = function(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  // Auto dismiss
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

/* ---- Modal System ---- */
App.utils.showModal = function(options = {}) {
  const { title, body, footer, onClose, className = '' } = options;
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  if (!overlay || !modal) return;

  modal.className = `modal ${className}`;
  modal.innerHTML = `
    <div class="modal__header">
      <h3 class="modal__title">${title || ''}</h3>
      <button class="modal__close" id="modal-close-btn">&times;</button>
    </div>
    <div class="modal__body">${body || ''}</div>
    ${footer ? `<div class="modal__footer">${footer}</div>` : ''}
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (onClose) onClose();
  };

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  return { close: closeModal, modal };
};

App.utils.closeModal = function() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
};

/* ---- Delete Client Confirmation ---- */
App.utils.confirmDeleteClient = function(clientId, clientName, onSuccess) {
  App.utils.showModal({
    title: '🗑️ Delete Client',
    body: `
      <p style="margin-bottom: 0.5rem; color: var(--text-primary);">
        <span class="lang-en">Are you sure you want to delete <strong>${clientName}</strong>?</span>
        <span class="lang-es">¿Estás seguro de que quieres eliminar a <strong>${clientName}</strong>?</span>
      </p>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">
        <span class="lang-en">This action cannot be undone. All data for this client will be permanently removed.</span>
        <span class="lang-es">Esta acción no se puede deshacer. Todos los datos de este cliente serán eliminados permanentemente.</span>
      </p>
    `,
    footer: `
      <button class="btn btn-outline btn-sm" onclick="App.utils.closeModal()">
        <span class="lang-en">Cancel</span><span class="lang-es">Cancelar</span>
      </button>
      <button class="btn btn-sm" id="confirm-delete-client-btn" style="margin-left: 0.5rem; background: #ef4444; color: white; border: none;">
        <span class="lang-en">Delete</span><span class="lang-es">Eliminar</span>
      </button>
    `
  });

  document.getElementById('confirm-delete-client-btn').addEventListener('click', async () => {
    try {
      await App.auth.deleteClient(clientId);
      App.utils.closeModal();
      App.utils.showToast('Client deleted successfully.', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('[Delete] Error:', err);
      App.utils.showToast('Error deleting client: ' + err.message, 'error');
    }
  });
};

/* ---- Formatting ---- */
App.utils.formatCurrency = function(amount, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

App.utils.formatDate = function(dateStr, options = {}) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', { ...defaults, ...options });
};

App.utils.formatDateRelative = function(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return App.utils.formatDate(dateStr);
};

/* ---- Clipboard ---- */
App.utils.copyToClipboard = async function(text) {
  try {
    await navigator.clipboard.writeText(text);
    App.utils.showToast('Copied to clipboard!', 'success');
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    App.utils.showToast('Copied to clipboard!', 'success');
    return true;
  }
};

/* ---- Referral Links ---- */
App.utils.generateReferralLink = function(referralCode) {
  // Strictly for Professional / Partner network invitations
  // Uses /referral?ref=... so WhatsApp & social crawlers resolve the person's name server-side
  const prodUrl = 'https://thespainconnection.com';
  const code = encodeURIComponent(referralCode || '');
  return code ? `${prodUrl}/referral?ref=${code}` : `${prodUrl}/referral`;
};

App.utils.generateClientWebinarLink = function(referralCode) {
  // Strictly for End Clients to sign up for the B2C Webinar & be protected in CRM
  const prodUrl = 'https://thespainconnection.com';
  const code = encodeURIComponent(referralCode || '');
  return code ? `${prodUrl}/webinar?ref=${code}` : `${prodUrl}/webinar`;
};

/* ---- Share Webinar & Partner Helpers ---- */
App.utils.getClientWebinarShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateClientWebinarLink(user.referralCode) : 'https://thespainconnection.com/webinar');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `🇪🇸 ¡Hola! Te comparto mi invitación exclusiva y gratuita al próximo webinario de The Spain Connection sobre cómo comprar propiedad, mudarse e invertir con total seguridad en España.\n\n📌 Respaldo legal, fiscal, hipotecario e inmobiliario completo en destino.\n\n🎙️ Reserva tu plaza gratuita en el webinario aquí: ${link}`;
  }
  return `🇪🇸 Hello! Here is my complimentary VIP invitation to our upcoming live webinar with The Spain Connection on how to safely buy property, relocate, and invest in Spain.\n\n📌 Full legal, tax, mortgage, and real estate destination support.\n\n🎙️ Reserve your free webinar spot here: ${link}`;
};

App.utils.getPartnerNetworkShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateReferralLink(user.referralCode) : 'https://thespainconnection.com/referral');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `🤝 ¡Hola! Te invito a unirte a nuestra red internacional de profesionales inmobiliarios (Brokers, Agentes/Realtors y Colaboradores) en España a través de The Spain Connection · RE/MAX Inmomás, con soporte legal, fiscal e inmobiliario integral para tus clientes.\n\n🔗 Regístrate como profesional colaborador aquí: ${link}`;
  }
  return `🤝 Hello! You're invited to join our international network of Brokers, Realtors, and Strategic Collaborators in Spain through The Spain Connection · RE/MAX Inmomás, with full turnkey legal, tax, and real estate backing for your clients.\n\n🔗 Register as a professional partner here: ${link}`;
};

App.utils.sharePartnerNetworkWhatsApp = function(customLink) {
  const message = App.utils.getPartnerNetworkShareMessage(customLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

App.utils.copyPartnerNetworkInviteText = function(customLink) {
  const message = App.utils.getPartnerNetworkShareMessage(customLink);
  App.utils.copyToClipboard(message);
  App.utils.showToast('¡Texto de invitación profesional copiado al portapapeles!', 'success');
};

App.utils.getRealtorPartnerShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateReferralLink(user.referralCode) : 'https://thespainconnection.com/index.html#register');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `🤝 ¡Hola! Te invito a unirte a nuestra red internacional de referidos en España a través de The Spain Connection, con soporte legal, fiscal e inmobiliario completo en destino para tus clientes.\n\n🔗 Activa tu cuenta de Agente / Realtor colaborador aquí: ${link}`;
  }
  return `🤝 Hello! You're invited to join our international referral network in Spain through The Spain Connection, with full turnkey legal, tax, and real estate destination support for your clients.\n\n🔗 Activate your Realtor Partner account here: ${link}`;
};

App.utils.getBrokerPartnerShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateReferralLink(user.referralCode) : 'https://thespainconnection.com/index.html#register');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `🏢 ¡Hola! Te invito a crear una alianza estratégica entre tu Brokerage/Agencia y The Spain Connection. Abre un nuevo canal de ingresos internacionales en España para tu equipo con respaldo institucional completo.\n\n🔗 Registra tu Brokerage aquí: ${link}`;
  }
  return `🏢 Hello! We invite you to create a strategic partnership between your Brokerage and The Spain Connection. Open an international revenue channel in Spain for your agents with full turnkey backing.\n\n🔗 Register your Brokerage here: ${link}`;
};

App.utils.getWebinarShareMessage = function(referralLink) {
  return App.utils.getClientWebinarShareMessage(referralLink);
};

App.utils.shareWebinarWhatsApp = function(customLink) {
  const message = App.utils.getClientWebinarShareMessage(customLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

App.utils.shareRealtorPartnerWhatsApp = function(customLink) {
  const message = App.utils.getRealtorPartnerShareMessage(customLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

App.utils.shareBrokerPartnerWhatsApp = function(customLink) {
  const message = App.utils.getBrokerPartnerShareMessage(customLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

App.utils.getColaboradorShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateReferralLink(user.referralCode) : 'https://thespainconnection.com/referral');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `🤝 ¡Hola! Te invito a registrarte como Colaborador Estratégico de The Spain Connection para referir clientes interesados en comprar o invertir en España con respaldo legal, fiscal e inmobiliario integral.\n\n🔗 Activa tu cuenta de Colaborador aquí: ${link}`;
  }
  return `🤝 Hello! You're invited to register as a Strategic Collaborator with The Spain Connection to refer clients interested in buying or investing in Spain with full legal, tax, and real estate backing.\n\n🔗 Activate your Collaborator account here: ${link}`;
};

App.utils.shareColaboradorWhatsApp = function(customLink) {
  const message = App.utils.getColaboradorShareMessage(customLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

App.utils.getEmbajadorShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateReferralLink(user.referralCode) : 'https://thespainconnection.com/referral');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `👑 ¡Hola! Te comparto la invitación ejecutiva exclusiva para postularte como Embajador de The Spain Connection · RE/MAX Inmomás y liderar tu propia red de Brokers, Agentes, Colaboradores y Clientes hacia España.\n\n🔗 Postúlate como Embajador aquí: ${link}`;
  }
  return `👑 Hello! Here is your exclusive executive invitation to apply as an Ambassador with The Spain Connection · RE/MAX Inmomás and lead your own umbrella network of Brokers, Realtors, Collaborators, and Clients in Spain.\n\n🔗 Apply as Ambassador here: ${link}`;
};

App.utils.shareEmbajadorWhatsApp = function(customLink) {
  const message = App.utils.getEmbajadorShareMessage(customLink);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

App.utils.copyWebinarInviteText = function(customLink) {
  const message = App.utils.getClientWebinarShareMessage(customLink);
  App.utils.copyToClipboard(message);
  App.utils.showToast('¡Texto de invitación para clientes copiado al portapapeles!', 'success');
};

App.utils.copyRealtorInviteText = function(customLink) {
  const message = App.utils.getRealtorPartnerShareMessage(customLink);
  App.utils.copyToClipboard(message);
  App.utils.showToast('¡Invitación para Realtors copiada al portapapeles!', 'success');
};

App.utils.copyBrokerInviteText = function(customLink) {
  const message = App.utils.getBrokerPartnerShareMessage(customLink);
  App.utils.copyToClipboard(message);
  App.utils.showToast('¡Invitación para Brokers copiada al portapapeles!', 'success');
};

/* ---- Status Helpers ---- */
App.utils.clientStatusLabelsEs = {
  'new': 'Seguimiento',
  'contacted': 'Seguimiento',
  'seguimiento': 'Seguimiento',
  'service_presentation': 'Reunión de Presentación de Servicios',
  'mandate_signed': 'Mandato de Representación Firmado',
  'first_property_meeting': 'Primera Reunión para Presentar Propiedades',
  'options_sent': 'Primera Reunión para Presentar Propiedades',
  'second_property_meeting': 'Segunda Reunión para Presentar Propiedades',
  'properties_visited': 'Visitas a Propiedades',
  'negotiation': 'Negociación',
  'offer_made': 'Negociación',
  'notary_pending': 'Negociación',
  'closed': 'Cierre',
  'completed': 'Cierre'
};

App.utils.clientStatusLabelsEn = {
  'new': 'Follow-Up',
  'contacted': 'Follow-Up',
  'seguimiento': 'Follow-Up',
  'service_presentation': 'Service Presentation Meeting',
  'mandate_signed': 'Signed Representation Mandate',
  'first_property_meeting': '1st Property Presentation Meeting',
  'options_sent': '1st Property Presentation Meeting',
  'second_property_meeting': '2nd Property Presentation Meeting',
  'properties_visited': 'Property Visits',
  'negotiation': 'Negotiation',
  'offer_made': 'Negotiation',
  'notary_pending': 'Negotiation',
  'closed': 'Closing',
  'completed': 'Closing'
};

App.utils.clientStatusLabels = {
  'new': '<span class="lang-en">Follow-Up</span><span class="lang-es">Seguimiento</span>',
  'contacted': '<span class="lang-en">Follow-Up</span><span class="lang-es">Seguimiento</span>',
  'seguimiento': '<span class="lang-en">Follow-Up</span><span class="lang-es">Seguimiento</span>',
  'service_presentation': '<span class="lang-en">Service Presentation Meeting</span><span class="lang-es">Reunión de Presentación de Servicios</span>',
  'mandate_signed': '<span class="lang-en">Signed Representation Mandate</span><span class="lang-es">Mandato de Representación Firmado</span>',
  'first_property_meeting': '<span class="lang-en">1st Property Presentation Meeting</span><span class="lang-es">Primera Reunión para Presentar Propiedades</span>',
  'options_sent': '<span class="lang-en">1st Property Presentation Meeting</span><span class="lang-es">Primera Reunión para Presentar Propiedades</span>',
  'second_property_meeting': '<span class="lang-en">2nd Property Presentation Meeting</span><span class="lang-es">Segunda Reunión para Presentar Propiedades</span>',
  'properties_visited': '<span class="lang-en">Property Visits</span><span class="lang-es">Visitas a Propiedades</span>',
  'negotiation': '<span class="lang-en">Negotiation</span><span class="lang-es">Negociación</span>',
  'offer_made': '<span class="lang-en">Negotiation</span><span class="lang-es">Negociación</span>',
  'notary_pending': '<span class="lang-en">Negotiation</span><span class="lang-es">Negociación</span>',
  'closed': '<span class="lang-en">Closing</span><span class="lang-es">Cierre</span>',
  'completed': '<span class="lang-en">Closing</span><span class="lang-es">Cierre</span>'
};

App.utils.clientStatusOrder = [
  'contacted',
  'service_presentation',
  'mandate_signed',
  'first_property_meeting',
  'second_property_meeting',
  'properties_visited',
  'negotiation',
  'closed'
];

App.utils.getStatusLabel = function(status) {
  return App.utils.clientStatusLabels[status] || App.utils.escapeHtml(status || '');
};

App.utils.getStatusLabelText = function(status) {
  const isEs = App.utils.getCurrentLanguage() === 'es';
  const map = isEs ? App.utils.clientStatusLabelsEs : App.utils.clientStatusLabelsEn;
  return map[status] || status;
};

App.utils.getStatusBadgeClass = function(status) {
  const map = {
    'new': 'badge--info',
    'contacted': 'badge--info',
    'seguimiento': 'badge--info',
    'service_presentation': 'badge--info',
    'mandate_signed': 'badge--info',
    'first_property_meeting': 'badge--info',
    'options_sent': 'badge--info',
    'second_property_meeting': 'badge--active',
    'properties_visited': 'badge--active',
    'negotiation': 'badge--warning',
    'offer_made': 'badge--warning',
    'notary_pending': 'badge--closing',
    'closed': 'badge--completed',
    'completed': 'badge--completed',
    'pending': 'badge--pending',
    'approved': 'badge--approved',
    'rejected': 'badge--rejected',
    'paid': 'badge--completed',
    'pending_payment': 'badge--warning',
    'projected': 'badge--info'
  };
  return map[status] || 'badge--pending';
};

/* ---- User Status Helpers ---- */
App.utils.getUserStatusBadge = function(status) {
  const safeStatus = (status || 'pending').toLowerCase();
  const labels = {
    active:   '<span class="lang-en">Active</span><span class="lang-es">Activo</span>',
    approved: '<span class="lang-en">Approved</span><span class="lang-es">Aprobado</span>',
    pending:  '<span class="lang-en">Pending</span><span class="lang-es">Pendiente</span>',
    rejected: '<span class="lang-en">Rejected</span><span class="lang-es">Rechazado</span>'
  };
  const labelHtml = labels[safeStatus] || App.utils.escapeHtml(safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1));
  return `<span class="badge ${App.utils.getStatusBadgeClass(safeStatus)}">${labelHtml}</span>`;
};

App.utils.getRoleBadge = function(role) {
  const safeRole = role || 'user';
  const classes = {
    admin: 'badge--admin',
    embajador: 'badge--embajador',
    broker: 'badge--broker',
    realtor: 'badge--realtor',
    agent_inmomas: 'badge--agent',
    colaborador: 'badge--agent'
  };
  let displayName = safeRole.charAt(0).toUpperCase() + safeRole.slice(1);
  if (safeRole === 'embajador') displayName = '👑 <span class="lang-en">Ambassador</span><span class="lang-es">Embajador</span>';
  if (safeRole === 'agent_inmomas') displayName = '🇪🇸 <span class="lang-en">RE/MAX Inmomás Agent</span><span class="lang-es">Agente RE/MAX Inmomás</span>';
  if (safeRole === 'colaborador') displayName = '<span class="lang-en">Collaborator</span><span class="lang-es">Colaborador</span>';
  return `<span class="badge ${classes[safeRole] || ''}">${displayName}</span>`;
};

/* ---- Avatar Generation ---- */
App.utils.getInitials = function(firstName, lastName) {
  const f = firstName || '';
  const l = lastName || '';
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || 'U';
};

App.utils.generateAvatar = function(firstName, lastName, size = 'md') {
  const initials = App.utils.getInitials(firstName, lastName);
  const colors = ['#0043ff', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
  const nameStr = (firstName || '') + (lastName || '');
  const hash = nameStr ? nameStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const color = colors[hash % colors.length];
  return `<div class="avatar avatar--${size}" style="background-color: ${color}">${initials}</div>`;
};

/* ---- Loading States ---- */
App.utils.showLoading = function(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="page-loader">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
};

App.utils.showEmptyState = function(containerId, message, icon = '📭') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">${icon}</div>
      <p class="empty-state__text">${message}</p>
    </div>
  `;
};

/* ---- DOM Helpers ---- */
App.utils.$ = function(selector) {
  return document.querySelector(selector);
};

App.utils.$$ = function(selector) {
  return document.querySelectorAll(selector);
};

App.utils.escapeHtml = function(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = typeof str === 'string' ? str : String(str);
  return div.innerHTML;
};
App.utils.escapeHTML = App.utils.escapeHtml;

/* ---- Debounce ---- */
App.utils.debounce = function(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/* ---- Language ---- */
App.utils.getCurrentLanguage = function() {
  return document.body.classList.contains('lang-es') ? 'es' : 'en';
};

App.utils.toggleLanguage = function() {
  const body = document.body;
  if (body.classList.contains('lang-en')) {
    body.classList.replace('lang-en', 'lang-es');
  } else {
    body.classList.replace('lang-es', 'lang-en');
  }
};

/* ---- Kanban Board Rendering ---- */
App.utils.PIPELINE_COLUMNS = [
  { key: 'contacted',               labelEn: 'Follow-Up',                         labelEs: 'Seguimiento',                                label: '<span class="lang-en">Follow-Up</span><span class="lang-es">Seguimiento</span>',                                                         statuses: ['contacted', 'new', 'seguimiento'] },
  { key: 'service_presentation',    labelEn: 'Service Presentation Meeting',      labelEs: 'Reunión de Presentación de Servicios',       label: '<span class="lang-en">Service Presentation Meeting</span><span class="lang-es">Reunión de Presentación de Servicios</span>',             statuses: ['service_presentation'] },
  { key: 'mandate_signed',          labelEn: 'Signed Representation Mandate',     labelEs: 'Mandato de Representación Firmado',          label: '<span class="lang-en">Signed Representation Mandate</span><span class="lang-es">Mandato de Representación Firmado</span>',               statuses: ['mandate_signed'] },
  { key: 'first_property_meeting',  labelEn: '1st Property Presentation Meeting', labelEs: 'Primera Reunión para Presentar Propiedades', label: '<span class="lang-en">1st Property Presentation Meeting</span><span class="lang-es">Primera Reunión para Presentar Propiedades</span>', statuses: ['first_property_meeting', 'options_sent'] },
  { key: 'second_property_meeting', labelEn: '2nd Property Presentation Meeting', labelEs: 'Segunda Reunión para Presentar Propiedades', label: '<span class="lang-en">2nd Property Presentation Meeting</span><span class="lang-es">Segunda Reunión para Presentar Propiedades</span>', statuses: ['second_property_meeting'] },
  { key: 'properties_visited',      labelEn: 'Property Visits',                   labelEs: 'Visitas a Propiedades',                      label: '<span class="lang-en">Property Visits</span><span class="lang-es">Visitas a Propiedades</span>',                                         statuses: ['properties_visited'] },
  { key: 'negotiation',             labelEn: 'Negotiation',                       labelEs: 'Negociación',                                label: '<span class="lang-en">Negotiation</span><span class="lang-es">Negociación</span>',                                                       statuses: ['negotiation', 'offer_made', 'notary_pending'] },
  { key: 'closed',                  labelEn: 'Closing',                           labelEs: 'Cierre',                                     label: '<span class="lang-en">Closing</span><span class="lang-es">Cierre</span>',                                                                 statuses: ['closed', 'completed'] }
];

App.utils.columnColors = {
  contacted: '#6b7280',
  service_presentation: '#06b6d4',
  mandate_signed: '#8b5cf6',
  first_property_meeting: '#3b82f6',
  second_property_meeting: '#6366f1',
  properties_visited: '#f59e0b',
  negotiation: '#ef4444',
  closed: '#10b981'
};

App.utils.handleDragStart = function(event, clientId) {
  event.dataTransfer.setData('text/plain', clientId);
  event.dataTransfer.effectAllowed = 'move';
  event.target.style.opacity = '0.5';
};

App.utils.handleDragEnd = function(event) {
  event.target.style.opacity = '1';
};

App.utils.handleDragOver = function(event) {
  event.preventDefault(); // Necessary to allow dropping
  event.dataTransfer.dropEffect = 'move';
};

App.utils.handleDrop = function(event, newStatus, callbackFnName) {
  event.preventDefault();
  const clientId = event.dataTransfer.getData('text/plain');
  if (clientId && callbackFnName) {
    // Dynamically call the global function
    const fn = eval(callbackFnName);
    if (typeof fn === 'function') {
      fn(clientId, newStatus);
    }
  }
};

App.utils.getClientTag = function(c) {
  if (c && c.tag) return c.tag;
  if (!c) return 'spain_buyer';
  
  // Intelligent tag detection
  const email = (c.email || '').toLowerCase();
  const hasRemaxEmail = email.includes('remax') || email.includes('broker') || email.includes('realty') || email.includes('realestate');
  const hasValidBudget = c.budget && c.budget !== '—' && c.budget !== 'TBD' && c.budget !== '' && c.budget !== '< €150,000' ? true : (c.budget && c.budget !== '—' && c.budget !== '');
  const hasArea = c.interestArea && c.interestArea !== '—' && c.interestArea !== '';
  const isVIP = c.source === 'intake' || c.source === 'vip_intake' || c.needsUCI || c.needsFuster || c.needsHolidays || c.objective || c.timeline;
  
  // If flagged as realtor/broker in agency/role or remax domain without buyer criteria:
  if (hasRemaxEmail || c.agency || c.agencyName || c.role === 'realtor' || c.role === 'broker') {
    if (!hasArea && (c.budget === '—' || !c.budget || c.budget === 'TBD')) {
      return 'realtor_network';
    }
  }

  if (isVIP || hasValidBudget || hasArea) {
    return 'spain_buyer';
  }
  
  if (hasRemaxEmail) {
    return 'realtor_network';
  }

  return 'spain_buyer';
};

App.utils.getClientTagBadge = function(tag) {
  if (tag === 'spain_buyer') {
    return `<span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;"><span>🇪🇸</span> <span class="lang-en">Spain Buyer</span><span class="lang-es">Comprador España</span></span>`;
  } else if (tag === 'realtor_network') {
    return `<span class="badge" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;"><span>🏠</span> <span class="lang-en">RE/MAX Network</span><span class="lang-es">Red RE/MAX</span></span>`;
  } else {
    return `<span class="badge" style="background: rgba(107, 114, 128, 0.12); color: #4b5563; border: 1px solid rgba(107, 114, 128, 0.3); font-weight: 700; font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;"><span>📋</span> <span class="lang-en">General Lead</span><span class="lang-es">Lead General</span></span>`;
  }
};

/* ---- Client Referral Origin & Commission Channel Resolution ---- */
App.utils.resolveClientOriginInfo = function(client, allUsers = [], maps = null) {
  const empty = {
    channel: 'direct_inmomas', // 'direct_embajador' | 'via_broker' | 'via_realtor' | 'via_colaborador' | 'via_partner' | 'direct_inmomas'
    hasEmbajadorUmbrella: false,
    embajadorId: null,
    embajadorName: '',
    brokerId: null,
    brokerName: '',
    referrerId: null,
    referrerName: '',
    referrerRole: ''
  };
  if (!client) return empty;

  const lk = maps || (App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(allUsers || []) : { byId: new Map(), byCode: new Map(), byEmail: new Map() });
  const findUser = (val) => {
    if (!val) return null;
    const raw = String(val).trim();
    return lk.byId.get(raw) || lk.byCode.get(raw.toUpperCase()) || lk.byEmail.get(raw.toLowerCase()) || null;
  };
  const fullNameOf = (u) => u ? (`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.agencyName || '') : '';

  // 1. Pre-enriched umbrella client records (from getUmbrellaData in Embajador portal)
  if (client._isDirectFromEmbajador === true || client._originMemberRole === 'embajador') {
    const embU = findUser(client.embajadorId || client._originMemberId);
    const embName = fullNameOf(embU) || (client._originMemberName && client._originMemberName !== 'Directo (Embajador)' ? client._originMemberName : '');
    return {
      ...empty,
      channel: 'direct_embajador',
      hasEmbajadorUmbrella: true,
      embajadorId: client.embajadorId || client._originMemberId || null,
      embajadorName: embName,
      referrerId: client._originMemberId || client.embajadorId || null,
      referrerName: embName || 'Directo Embajador',
      referrerRole: 'embajador'
    };
  }

  if (client._originMemberRole && ['broker', 'realtor', 'colaborador'].includes(client._originMemberRole)) {
    const embU = findUser(client.embajadorId);
    const brkU = findUser(client.brokerId);
    return {
      ...empty,
      channel: `via_${client._originMemberRole}`,
      hasEmbajadorUmbrella: true,
      embajadorId: client.embajadorId || (embU ? embU.id : null),
      embajadorName: fullNameOf(embU),
      brokerId: client.brokerId || (brkU ? brkU.id : null),
      brokerName: client._originBrokerName || fullNameOf(brkU),
      referrerId: client._originMemberId || null,
      referrerName: client._originMemberName || client.realtorName || '',
      referrerRole: client._originMemberRole
    };
  }

  // 2. General resolution from allUsers (Admin, Agente Inmomás, Broker, Realtor portals)
  const partnerLiterals = new Set(['UCI', 'FUSTER & ASSOCIATES', 'INMOMÁS HOLIDAYS', 'INMOMAS HOLIDAYS']);
  const rawRefStr = String(client.referredBy || '').trim();
  if (rawRefStr && partnerLiterals.has(rawRefStr.toUpperCase())) {
    return {
      ...empty,
      channel: 'via_partner',
      referrerName: rawRefStr,
      referrerRole: 'partner'
    };
  }

  const realtorUser = findUser(client.realtorId);
  const refUser = findUser(client.referredBy);
  const brokerUser = findUser(client.brokerId);
  const embUser = findUser(client.embajadorId);
  const manualUser = findUser(client.addedManuallyBy);

  const externalRoles = new Set(['realtor', 'broker', 'colaborador', 'embajador', 'partner']);
  let originUser = null;
  if (realtorUser && externalRoles.has(realtorUser.role)) {
    originUser = realtorUser;
  } else if (refUser && externalRoles.has(refUser.role)) {
    originUser = refUser;
  } else if (brokerUser && brokerUser.role === 'broker') {
    originUser = brokerUser;
  } else if (embUser && embUser.role === 'embajador') {
    originUser = embUser;
  } else if (manualUser && externalRoles.has(manualUser.role)) {
    originUser = manualUser;
  }

  const parents = (originUser && App.utils.resolveUserUmbrellaParents)
    ? App.utils.resolveUserUmbrellaParents(originUser, allUsers, lk)
    : { embajador: null, broker: null };

  const resolvedEmb = (embUser && embUser.role === 'embajador' ? embUser : null) ||
    parents.embajador ||
    (originUser && originUser.role === 'embajador' ? originUser : null);

  const resolvedBrk = (brokerUser && brokerUser.role === 'broker' ? brokerUser : null) ||
    parents.broker ||
    (originUser && originUser.role === 'broker' ? originUser : null);

  if (originUser) {
    const role = originUser.role;
    const channelMap = {
      embajador: 'direct_embajador',
      broker: 'via_broker',
      realtor: 'via_realtor',
      colaborador: 'via_colaborador',
      partner: 'via_partner'
    };
    return {
      channel: channelMap[role] || 'direct_inmomas',
      hasEmbajadorUmbrella: Boolean(resolvedEmb || client.embajadorId),
      embajadorId: (resolvedEmb && resolvedEmb.id) || client.embajadorId || null,
      embajadorName: fullNameOf(resolvedEmb),
      brokerId: (resolvedBrk && resolvedBrk.id) || client.brokerId || null,
      brokerName: fullNameOf(resolvedBrk),
      referrerId: originUser.id,
      referrerName: fullNameOf(originUser) || client.realtorName || '',
      referrerRole: role
    };
  }

  // Fallback when user doc is not loaded in memory (e.g. Realtor view with null allUsers)
  if (client.realtorId || client.realtorName) {
    return {
      ...empty,
      channel: 'via_realtor',
      hasEmbajadorUmbrella: Boolean(client.embajadorId),
      embajadorId: client.embajadorId || null,
      brokerId: client.brokerId || null,
      referrerId: client.realtorId || client.referredBy || null,
      referrerName: client.realtorName || '',
      referrerRole: 'realtor'
    };
  }
  if (client.brokerId) {
    return {
      ...empty,
      channel: 'via_broker',
      hasEmbajadorUmbrella: Boolean(client.embajadorId),
      embajadorId: client.embajadorId || null,
      brokerId: client.brokerId,
      referrerId: client.brokerId,
      referrerRole: 'broker'
    };
  }
  if (client.embajadorId) {
    return {
      ...empty,
      channel: 'direct_embajador',
      hasEmbajadorUmbrella: true,
      embajadorId: client.embajadorId,
      referrerId: client.embajadorId,
      referrerName: 'Directo Embajador',
      referrerRole: 'embajador'
    };
  }

  return empty;
};

App.utils.renderClientOriginTagBadge = function(client, allUsers = [], opts = {}) {
  const { maps = null, showUmbrellaSubBadge = true, compact = false } = opts;
  const info = App.utils.resolveClientOriginInfo(client, allUsers, maps);

  const pillBase = `font-weight:700; font-size:${compact ? '0.68rem' : '0.72rem'}; padding:${compact ? '2px 7px' : '3px 9px'}; border-radius:999px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; line-height:1.25;`;

  let primaryBadge = '';
  if (info.channel === 'direct_embajador') {
    primaryBadge = `<span class="client-origin-tag client-origin-tag--direct-embajador" title="Cliente directo del Embajador — Comisión directa de Embajador (sin intermediario)" style="${pillBase} background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color:#92400e; border:1.5px solid #f59e0b; box-shadow:0 1px 3px rgba(245,158,11,0.22);"><span>👑</span> <span class="lang-en">Ambassador Direct</span><span class="lang-es">Directo Embajador</span></span>`;
  } else if (info.channel === 'via_broker') {
    primaryBadge = `<span class="client-origin-tag client-origin-tag--broker" title="Cliente referido por Broker — Liquidación vía Broker" style="${pillBase} background:linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color:#1e3a8a; border:1.5px solid #3b82f6; box-shadow:0 1px 2px rgba(37,99,235,0.14);"><span>🏢</span> <span class="lang-en">Broker Referral</span><span class="lang-es">Referido Broker</span></span>`;
  } else if (info.channel === 'via_realtor') {
    primaryBadge = `<span class="client-origin-tag client-origin-tag--realtor" title="Cliente referido por Agente / Realtor" style="${pillBase} background:linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color:#065f46; border:1.5px solid #10b981; box-shadow:0 1px 2px rgba(16,185,129,0.14);"><span>🏠</span> <span class="lang-en">Agent Referral</span><span class="lang-es">Referido Agente</span></span>`;
  } else if (info.channel === 'via_colaborador') {
    primaryBadge = `<span class="client-origin-tag client-origin-tag--colaborador" title="Cliente referido por Colaborador" style="${pillBase} background:linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); color:#5b21b6; border:1.5px solid #8b5cf6; box-shadow:0 1px 2px rgba(139,92,246,0.14);"><span>🤝</span> <span class="lang-en">Collaborator Referral</span><span class="lang-es">Referido Colaborador</span></span>`;
  } else if (info.channel === 'via_partner') {
    primaryBadge = `<span class="client-origin-tag client-origin-tag--partner" title="Cliente referido por Partner Institucional" style="${pillBase} background:#e0f2fe; color:#0369a1; border:1.5px solid #38bdf8;"><span>🏛️</span> <span class="lang-en">Partner Referral</span><span class="lang-es">Referido Partner</span></span>`;
  } else {
    primaryBadge = `<span class="client-origin-tag client-origin-tag--direct-inmomas" title="Cliente directo RE/MAX Inmomás (sin comisión de referido externo)" style="${pillBase} background:#f1f5f9; color:#334155; border:1px solid #cbd5e1;"><span>🇪🇸</span> <span class="lang-en">Direct Inmomás</span><span class="lang-es">Directo Inmomás</span></span>`;
  }

  let umbrellaSub = '';
  if (showUmbrellaSubBadge && info.hasEmbajadorUmbrella && info.channel !== 'direct_embajador') {
    const embTip = info.embajadorName
      ? `Incluido además en el Paraguas del Embajador ${App.utils.escapeHtml(info.embajadorName)} (cobra referido + paraguas)`
      : 'Incluido además en Paraguas de Embajador (cobra referido + paraguas)';
    umbrellaSub = `<span title="${embTip}" style="font-weight:700; font-size:0.66rem; padding:2px 6px; border-radius:999px; background:#fffbeb; color:#b45309; border:1px solid #f59e0b; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">👑 <span class="lang-en">Umbrella</span><span class="lang-es">Paraguas</span></span>`;
  }

  let manualClassificationBadge = '';
  if (client && client.tag === 'realtor_network') {
    manualClassificationBadge = `<span style="font-weight:700; font-size:0.65rem; padding:2px 6px; border-radius:6px; background:rgba(239,68,68,0.1); color:#b91c1c; border:1px solid rgba(239,68,68,0.28); white-space:nowrap;">⚠️ <span class="lang-en">Pro Lead</span><span class="lang-es">Red Profesional</span></span>`;
  }

  return `<span style="display:inline-flex; align-items:center; gap:4px; flex-wrap:wrap;">${primaryBadge}${umbrellaSub}${manualClassificationBadge}</span>`;
};

App.utils.renderKanbanBoard = function(containerId, clients, onCardClickGlobalFnName, getRealtorNameFn = null, onDropCallbackGlobalFnName = null, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isInteractive = !!onDropCallbackGlobalFnName;
  const usersPool = Array.isArray(options.users) ? options.users : [];
  const showUmbrellaSubBadge = options.showUmbrellaSubBadge !== false;
  const lookupMaps = (usersPool.length > 0 && App.utils._buildUserLookupMaps)
    ? App.utils._buildUserLookupMaps(usersPool)
    : null;

  const originAccentMap = {
    direct_embajador: '#f59e0b',
    via_broker: '#2563eb',
    via_realtor: '#10b981',
    via_colaborador: '#7c3aed',
    via_partner: '#0284c7',
    direct_inmomas: '#94a3b8'
  };

  const columns = App.utils.PIPELINE_COLUMNS.map(col => {
    const colClients = clients.filter(c => col.statuses.includes(c.status));

    const cards = colClients.map(c => {
      const lastUpdate = (c.statusHistory && c.statusHistory.length > 0)
        ? c.statusHistory[c.statusHistory.length - 1].date
        : c.createdAt;

      const originInfo = App.utils.resolveClientOriginInfo(c, usersPool, lookupMaps);
      const originTagHtml = App.utils.renderClientOriginTagBadge(c, usersPool, {
        maps: lookupMaps,
        showUmbrellaSubBadge,
        compact: true
      });

      let referrerLineHtml = '';
      if (originInfo.channel === 'direct_embajador') {
        const embLabel = originInfo.embajadorName
          ? `${App.utils.escapeHtml(originInfo.embajadorName)}`
          : (getRealtorNameFn ? App.utils.escapeHtml(getRealtorNameFn(c.referredBy || c.embajadorId)) : 'Embajador');
        referrerLineHtml = `<div style="font-size: 0.75rem; color: #92400e; margin-bottom: 0.25rem; font-weight: 700; display:flex; align-items:center; gap:4px;">👑 ${embLabel}</div>`;
      } else if (originInfo.channel === 'via_broker') {
        const brkLabel = originInfo.referrerName || originInfo.brokerName || (getRealtorNameFn ? getRealtorNameFn(c.brokerId || c.referredBy) : 'Broker');
        referrerLineHtml = `<div style="font-size: 0.75rem; color: #1e40af; margin-bottom: 0.25rem; font-weight: 700; display:flex; align-items:center; gap:4px; flex-wrap:wrap;"><span>🏢 ${App.utils.escapeHtml(brkLabel)}</span>${showUmbrellaSubBadge && originInfo.embajadorName ? `<span style="color:#b45309; font-weight:600;">· 👑 ${App.utils.escapeHtml(originInfo.embajadorName)}</span>` : ''}</div>`;
      } else if (originInfo.channel === 'via_realtor') {
        const agLabel = originInfo.referrerName || (getRealtorNameFn ? getRealtorNameFn(c.realtorId || c.referredBy) : '');
        if (agLabel && agLabel !== 'Unknown') {
          referrerLineHtml = `<div style="font-size: 0.75rem; color: #047857; margin-bottom: 0.25rem; font-weight: 700; display:flex; align-items:center; gap:4px; flex-wrap:wrap;"><span>🏠 ${App.utils.escapeHtml(agLabel)}</span>${originInfo.brokerName ? `<span style="color:#1e40af; font-weight:600;">· 🏢 ${App.utils.escapeHtml(originInfo.brokerName)}</span>` : ''}${showUmbrellaSubBadge && originInfo.embajadorName ? `<span style="color:#b45309; font-weight:600;">· 👑 ${App.utils.escapeHtml(originInfo.embajadorName)}</span>` : ''}</div>`;
        }
      } else if (originInfo.channel === 'via_colaborador') {
        const colabLabel = originInfo.referrerName || (getRealtorNameFn ? getRealtorNameFn(c.referredBy) : 'Colaborador');
        referrerLineHtml = `<div style="font-size: 0.75rem; color: #5b21b6; margin-bottom: 0.25rem; font-weight: 700; display:flex; align-items:center; gap:4px; flex-wrap:wrap;"><span>🤝 ${App.utils.escapeHtml(colabLabel)}</span>${showUmbrellaSubBadge && originInfo.embajadorName ? `<span style="color:#b45309; font-weight:600;">· 👑 ${App.utils.escapeHtml(originInfo.embajadorName)}</span>` : ''}</div>`;
      } else if (getRealtorNameFn) {
        const fallbackLbl = getRealtorNameFn(c.referredBy);
        if (fallbackLbl && fallbackLbl !== 'Unknown' && fallbackLbl !== 'Directo / Sin asignar') {
          referrerLineHtml = `<div style="font-size: 0.75rem; color: #475569; margin-bottom: 0.25rem; font-weight: 600;">👤 ${App.utils.escapeHtml(fallbackLbl)}</div>`;
        }
      }

      const localAgentName = c.localAgentName
        ? App.utils.escapeHtml(c.localAgentName)
        : '<span class="lang-en">Unassigned</span><span class="lang-es">Sin asignar</span>';
      const agentLabel = `<div style="font-size: 0.75rem; color: #b45309; margin-bottom: 0.25rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">🇪🇸 ${localAgentName}</div>`;

      const leftAccent = originAccentMap[originInfo.channel] || '#94a3b8';
      const cardBg = originInfo.channel === 'direct_embajador'
        ? 'linear-gradient(180deg, rgba(254, 243, 199, 0.28) 0%, var(--bg-card) 48%)'
        : 'var(--bg-card)';

      return `
        <div class="pipeline-card" style="cursor: ${isInteractive ? 'grab' : 'pointer'}; margin-bottom: 0.75rem; background: ${cardBg}; border-radius: var(--radius-sm); padding: 12px; box-shadow: var(--shadow-sm); border-top: 3px solid ${App.utils.columnColors[col.key]}; border-left: 4px solid ${leftAccent}; transition: transform 0.2s;"
             draggable="${isInteractive ? 'true' : 'false'}"
             ${isInteractive ? `ondragstart="App.utils.handleDragStart(event, '${c.id}')" ondragend="App.utils.handleDragEnd(event)"` : ''}
             onclick="${onCardClickGlobalFnName}('${c.id}')">
          <div style="margin-bottom: 0.45rem;">
            ${originTagHtml}
          </div>
          ${referrerLineHtml}
          ${agentLabel}
          <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.35rem; color: var(--text-primary);">
            ${App.utils.escapeHtml(c._displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || c._anonCode || '—')}
          </div>
          ${c._isRedactedClient ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.3rem;">🔒 <span class="lang-en">Email &amp; phone protected</span><span class="lang-es">Email y tel. protegidos</span></div>` : ''}
          ${c._isRedactedClient && c.country ? `<div style="font-size: 0.76rem; color: #64748b; margin-bottom: 0.25rem;">🌍 ${App.utils.escapeHtml(c.country)}</div>` : ''}
          <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">
            📍 ${App.utils.escapeHtml(c.interestArea || '—')}
          </div>
          <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">
            💰 ${App.utils.escapeHtml(c.budget || '—')}
          </div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.5rem;">
            <span class="lang-en">Updated:</span><span class="lang-es">Actualizado:</span> ${App.utils.formatDateRelative(lastUpdate)}
          </div>
        </div>
      `;
    }).join('');

    const color = App.utils.columnColors[col.key];

    return `
      <div class="pipeline-column" style="min-width: 280px; max-width: 300px; flex: 1; background: var(--bg-secondary); border-radius: var(--radius-md); display: flex; flex-direction: column;"
           ondragover="App.utils.handleDragOver(event)"
           ondrop="App.utils.handleDrop(event, '${col.statuses[0]}', '${onDropCallbackGlobalFnName || ''}')">
        <div class="pipeline-column__header" style="border-top: 4px solid ${color}; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 8px; border-radius: var(--radius-md) var(--radius-md) 0 0; background: var(--bg-card); border-bottom: 1px solid var(--border-subtle);">
          <span style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary); line-height: 1.3;">${col.label}</span>
          <span class="badge" style="background: ${color}20; color: ${color}; font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; font-weight: 700; flex-shrink: 0;">
            ${colClients.length}
          </span>
        </div>
        <div class="pipeline-column__cards">
          ${cards || `<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 2rem 1rem; border: 2px dashed rgba(0,0,0,0.05); border-radius: 8px; margin: 12px 0;"><span class="lang-en">Drag clients here</span><span class="lang-es">Arrastra clientes aquí</span></div>`}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="pipeline-board" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 1rem; align-items: flex-start; min-height: 400px; padding: 8px;">
      ${columns}
    </div>
  `;
};

/* ---- Role-Based Agreement Variant Metadata (Embajador, Colaborador, Broker, Direct Agent vs Agency Agent) ---- */
App.utils.getPartnerSharePctForUser = function(user) {
  if (!user || !user.role) return 25;
  const r = String(user.role).toLowerCase().trim();
  if (r === 'colaborador') return 10;
  if (r === 'broker') return 25;
  if (r === 'embajador') return 15;
  if (r === 'realtor') {
    return (user.brokerId || user.brokerNameManual) ? 25 : 15;
  }
  return 0;
};

App.utils.getDefaultReferralSharePct = function(client, allUsers = []) {
  if (!client) return 25;
  if (typeof client.referralSharePct === 'number' && client.referralSharePct >= 0) {
    return client.referralSharePct;
  }
  const byId = new Map();
  const byCode = new Map();
  (allUsers || []).forEach(u => {
    if (!u) return;
    if (u.id) byId.set(u.id, u);
    if (u.referralCode) byCode.set(String(u.referralCode).toUpperCase().trim(), u);
  });
  const lookup = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    return byId.get(s) || byCode.get(s.toUpperCase()) || null;
  };
  const refUser = lookup(client.referredBy) || lookup(client.realtorId) || lookup(client.brokerId) || lookup(client.embajadorId);
  if (!refUser) {
    if (client.brokerId) return 25;
    if (client.realtorId) return 15;
    if (client.embajadorId) return 25;
    return 0;
  }
  if (refUser.role === 'colaborador') return 10;
  if (refUser.role === 'broker') return 25;
  if (refUser.role === 'realtor') {
    return (refUser.brokerId || refUser.brokerNameManual || client.brokerId) ? 25 : 15;
  }
  if (refUser.role === 'embajador') return 25;
  return 0;
};

App.utils.getAgreementVariantMeta = function(rawRole, userObj = null) {
  const role = String(rawRole || (userObj && userObj.role) || 'broker').trim().toLowerCase();
  const hasBroker = Boolean(userObj && (userObj.brokerId || userObj.brokerNameManual));
  const variants = {
    embajador: {
      role: 'embajador',
      isDirectSigner: true,
      pct: 15,
      icon: '👑',
      roleLabelEs: 'Embajador (+15 % Red)',
      roleLabelEn: 'Ambassador (+15% Umbrella)',
      docNameEs: 'Acuerdo Marco de Embajador (+15 % Red Paraguas)',
      docNameEn: 'Ambassador Umbrella & Referral Agreement (+15%)',
      shortDocEs: 'Acuerdo de Embajador (+15 %)',
      shortDocEn: 'Ambassador Agreement (+15%)',
      templateBtnEs: 'Descargar Plantilla de Embajador (Word .doc)',
      templateBtnEn: 'Download Ambassador Template (Word .doc)',
      exportBtnEs: 'Exportar Acuerdo de Embajador (Word .doc)',
      exportBtnEn: 'Export Ambassador Agreement (Word .doc)',
      partyDescEs: 'el Embajador (o representante legal de su sociedad)',
      partyDescEn: 'the Ambassador (or their legal entity representative)',
      presentationTargetEs: 'al Embajador',
      presentationTargetEn: 'to the Ambassador',
      block1TitleEs: '1. Datos de Empresa / Profesionales y Fiscales (Embajador · +15 %)',
      block1TitleEn: '1. Company / Professional & Tax Details (Ambassador · +15%)',
      legalNameLabelEs: 'Razón Social / Nombre Fiscal del Embajador o Sociedad *',
      legalNameLabelEn: 'Legal Entity / Ambassador Registered Name *',
      licenseLabelEs: 'Nº de Licencia / Asociación Representada (Opcional)',
      licenseLabelEn: 'Association / Professional Registration (Optional)',
      signerNameLabelEs: 'Nombre Completo del Embajador / Representante Legal *',
      signerNameLabelEn: 'Ambassador / Legal Representative Full Name *',
      signerEmailLabelEs: 'Email del Embajador *',
      signerEmailLabelEn: 'Ambassador Email *',
      signerPhoneLabelEs: 'Teléfono del Embajador *',
      signerPhoneLabelEn: 'Ambassador Phone *',
      accentColor: '#92400e',
      accentBg: '#fffbeb',
      accentBorder: '#f59e0b'
    },
    colaborador: {
      role: 'colaborador',
      isDirectSigner: true,
      pct: 10,
      icon: '🤝',
      roleLabelEs: 'Colaborador (10 % a éxito)',
      roleLabelEn: 'Collaborator (10% Success Fee)',
      docNameEs: 'Acuerdo Mercantil de Colaborador (10 % a Éxito)',
      docNameEn: 'Collaborator Commercial Introduction Agreement (10% Success Fee)',
      shortDocEs: 'Acuerdo de Colaborador (10 %)',
      shortDocEn: 'Collaborator Agreement (10%)',
      templateBtnEs: 'Descargar Plantilla de Colaborador 10 % (Word .doc)',
      templateBtnEn: 'Download Collaborator 10% Template (Word .doc)',
      exportBtnEs: 'Exportar Acuerdo de Colaborador 10 % (Word .doc)',
      exportBtnEn: 'Export Collaborator 10% Agreement (Word .doc)',
      partyDescEs: 'el Colaborador (persona física profesional o empresa, 10 % a éxito)',
      partyDescEn: 'the Collaborator (individual professional or firm, 10% success fee)',
      presentationTargetEs: 'al Colaborador',
      presentationTargetEn: 'to the Collaborator',
      block1TitleEs: '1. Datos Profesionales / de Empresa y Fiscales (Colaborador · 10 % a éxito)',
      block1TitleEn: '1. Professional / Company & Tax Details (Collaborator · 10% Success Fee)',
      legalNameLabelEs: 'Razón Social / Nombre Fiscal del Colaborador o Despacho *',
      legalNameLabelEn: 'Legal Firm / Collaborator Registered Name *',
      licenseLabelEs: 'Nº Colegiado / Actividad con Nexo Mudanza (Opcional)',
      licenseLabelEn: 'Professional Registration / Activity (Optional)',
      signerNameLabelEs: 'Nombre Completo del Colaborador / Representante Legal *',
      signerNameLabelEn: 'Collaborator / Legal Representative Full Name *',
      signerEmailLabelEs: 'Email del Colaborador *',
      signerEmailLabelEn: 'Collaborator Email *',
      signerPhoneLabelEs: 'Teléfono del Colaborador *',
      signerPhoneLabelEn: 'Collaborator Phone *',
      accentColor: '#5b21b6',
      accentBg: '#f5f3ff',
      accentBorder: '#8b5cf6'
    },
    broker: {
      role: 'broker',
      isDirectSigner: true,
      pct: 25,
      icon: '🏢',
      roleLabelEs: 'Broker (25 % Agencia)',
      roleLabelEn: 'Broker (25% Brokerage)',
      docNameEs: 'Acuerdo Marco de Broker (25 % Agencia)',
      docNameEn: 'Brokerage Master Referral Agreement (25%)',
      shortDocEs: 'Acuerdo de Broker (25 %)',
      shortDocEn: 'Broker Agreement (25%)',
      templateBtnEs: 'Descargar Plantilla de Broker 25 % (Word .doc)',
      templateBtnEn: 'Download Broker 25% Template (Word .doc)',
      exportBtnEs: 'Exportar Acuerdo de Broker 25 % (Word .doc)',
      exportBtnEn: 'Export Broker 25% Agreement (Word .doc)',
      partyDescEs: 'el Broker / representante de la agencia inmobiliaria (25 % agencia)',
      partyDescEn: 'the Managing Broker of the real estate brokerage (25% office)',
      presentationTargetEs: 'al Broker de la agencia',
      presentationTargetEn: 'to the Managing Broker',
      block1TitleEs: '1. Datos de la Agencia Inmobiliaria y Fiscales (Broker · 25 %)',
      block1TitleEn: '1. Brokerage Company & Tax Details (Broker · 25%)',
      legalNameLabelEs: 'Razón Social / Nombre Legal de la Agencia (Brokerage) *',
      legalNameLabelEn: 'Legal Brokerage Company Name (Razón Social) *',
      licenseLabelEs: 'Nº de Licencia Inmobiliaria (Brokerage License)',
      licenseLabelEn: 'Brokerage License Number',
      signerNameLabelEs: 'Nombre Completo del Broker / Representante Legal *',
      signerNameLabelEn: 'Managing Broker / Legal Representative Name *',
      signerEmailLabelEs: 'Email del Broker *',
      signerEmailLabelEn: 'Broker Email *',
      signerPhoneLabelEs: 'Teléfono del Broker *',
      signerPhoneLabelEn: 'Broker Phone *',
      accentColor: '#1e3a8a',
      accentBg: '#eff6ff',
      accentBorder: '#3b82f6'
    },
    realtor_direct: {
      role: 'realtor',
      isDirectSigner: true,
      pct: 15,
      icon: '🏠',
      roleLabelEs: 'Agente Directo (15 % Directo)',
      roleLabelEn: 'Direct Agent (15% Direct)',
      docNameEs: 'Acuerdo Directo de Agente / Realtor (15 % Pago Directo)',
      docNameEn: 'Direct Real Estate Agent Referral Agreement (15% Direct Payout)',
      shortDocEs: 'Acuerdo Directo de Agente (15 %)',
      shortDocEn: 'Direct Agent Agreement (15%)',
      templateBtnEs: 'Descargar Plantilla de Agente Directo 15 % (Word .doc)',
      templateBtnEn: 'Download Direct Agent 15% Template (Word .doc)',
      exportBtnEs: 'Exportar Acuerdo Directo de Agente 15 % (Word .doc)',
      exportBtnEn: 'Export Direct Agent 15% Agreement (Word .doc)',
      partyDescEs: 'el Agente / Realtor (acuerdo directo con pago del 15 % al Agente)',
      partyDescEn: 'the Real Estate Agent / Realtor (direct agreement with 15% paid directly to the Agent)',
      presentationTargetEs: 'al Agente / Realtor',
      presentationTargetEn: 'to the Agent / Realtor',
      block1TitleEs: '1. Datos Profesionales y Fiscales del Agente (Acuerdo Directo · 15 %)',
      block1TitleEn: '1. Agent Professional & Tax Details (Direct Agreement · 15%)',
      legalNameLabelEs: 'Nombre Fiscal Completo del Agente o Sociedad *',
      legalNameLabelEn: 'Agent Full Tax Name or Legal Entity *',
      licenseLabelEs: 'Nº de Licencia / Registro Inmobiliario (Si aplica)',
      licenseLabelEn: 'Real Estate License / Registration (If applicable)',
      signerNameLabelEs: 'Nombre Completo del Agente Firmante *',
      signerNameLabelEn: 'Signing Agent Full Name *',
      signerEmailLabelEs: 'Email Profesional del Agente *',
      signerEmailLabelEn: 'Agent Professional Email *',
      signerPhoneLabelEs: 'Teléfono del Agente *',
      signerPhoneLabelEn: 'Agent Phone *',
      accentColor: '#047857',
      accentBg: '#ecfdf5',
      accentBorder: '#10b981'
    },
    realtor_broker: {
      role: 'realtor',
      isDirectSigner: false,
      pct: 25,
      icon: '🏠',
      roleLabelEs: 'Agente bajo Broker (25 % Agencia)',
      roleLabelEn: 'Brokerage-Affiliated Agent (25% Office)',
      docNameEs: 'Acuerdo Marco vía Agencia / Broker (25 % Agencia)',
      docNameEn: 'Brokerage-Backed Agent Referral Agreement (25% Office)',
      shortDocEs: 'Acuerdo vía Broker (25 %)',
      shortDocEn: 'Brokerage Agreement (25%)',
      templateBtnEs: 'Descargar Plantilla Agencia-Agente (Word .doc)',
      templateBtnEn: 'Download Brokerage-Agent Template (Word .doc)',
      exportBtnEs: 'Exportar Acuerdo vía Broker (Word .doc)',
      exportBtnEn: 'Export Brokerage Agreement (Word .doc)',
      partyDescEs: 'la Agencia / Broker del Agente (25 % abonado al Broker según reparto interno)',
      partyDescEn: 'the Agent’s Brokerage (25% paid Broker-to-Broker per internal split)',
      presentationTargetEs: 'al Broker y al Agente / Realtor',
      presentationTargetEn: 'to the Broker and the Realtor / Agent',
      block1TitleEs: '1. Datos de la Agencia (Brokerage · 25 %) y Agente Asociado',
      block1TitleEn: '1. Brokerage (25%) & Associated Realtor Tax Details',
      legalNameLabelEs: 'Razón Social / Nombre Legal de la Agencia *',
      legalNameLabelEn: 'Legal Brokerage Company Name *',
      licenseLabelEs: 'Nº de Licencia Inmobiliaria de la Agencia',
      licenseLabelEn: 'Brokerage Real Estate License Number',
      signerNameLabelEs: 'Nombre Completo del Broker Responsable (Firmante) *',
      signerNameLabelEn: 'Managing Broker / Signer Full Name *',
      signerEmailLabelEs: 'Email del Broker *',
      signerEmailLabelEn: 'Broker Email *',
      signerPhoneLabelEs: 'Teléfono del Broker *',
      signerPhoneLabelEn: 'Broker Phone *',
      accentColor: '#047857',
      accentBg: '#ecfdf5',
      accentBorder: '#10b981'
    }
  };
  if (role === 'realtor') {
    return hasBroker ? variants.realtor_broker : variants.realtor_direct;
  }
  return variants[role] || variants.broker;
};

/* ---- Shared Contract Fiscal & Bank Data Section (Embajador, Colaborador, Broker & Realtor) ---- */
App.utils.renderContractDataSection = function(containerEl, user, prefix = 'contract', onSuccessCallback = null) {
  if (!containerEl || !user) return;

  const status = user.agreementStatus || 'none'; // 'none' | 'data_submitted' | 'uploaded' | 'signed'
  const saved = user.contractCompanyData || {};
  const variant = App.utils.getAgreementVariantMeta(user.role, user);
  const isDirectSigner = Boolean(variant.isDirectSigner);
  const defaultSignerName = isDirectSigner
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : (user.brokerNameManual || '');

  let statusBannerHtml = '';
  if (status === 'signed') {
    statusBannerHtml = `
      <div style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#d1fae5; border-radius:0.75rem; margin-bottom:1.5rem; border:1px solid #a7f3d0; text-align:left;">
        <span style="font-size:2rem;">✅</span>
        <div>
          <div style="font-weight:700; color:#065f46; font-size:1rem;">
            <span class="lang-en">${App.utils.escapeHtml(variant.docNameEn)} — Signed &amp; Active</span>
            <span class="lang-es">${App.utils.escapeHtml(variant.docNameEs)} — Firmado y Activo</span>
            <span class="lang-fr">${App.utils.escapeHtml(variant.docNameEn)} — Signé et Actif</span>
            <span class="lang-en-ca">${App.utils.escapeHtml(variant.docNameEn)} — Signed &amp; Active</span>
          </div>
          <div style="font-size:0.85rem; color:#047857; margin-top:4px;">
            <span class="lang-en">Your ${App.utils.escapeHtml(variant.shortDocEn)} has been formalized. Signed on ${App.utils.formatDate(user.agreementSignedAt)}.</span>
            <span class="lang-es">Tu ${App.utils.escapeHtml(variant.shortDocEs)} está formalizado y activo. Fecha: ${App.utils.formatDate(user.agreementSignedAt)}.</span>
            <span class="lang-fr">Votre accord est actif. Signé le ${App.utils.formatDate(user.agreementSignedAt)}.</span>
            <span class="lang-en-ca">Your ${App.utils.escapeHtml(variant.shortDocEn)} has been formalized. Signed on ${App.utils.formatDate(user.agreementSignedAt)}.</span>
          </div>
          ${user.agreementFinalUrl ? `
            <div style="margin-top:10px;">
              <a href="${App.utils.escapeHtml(user.agreementFinalUrl)}" target="_blank" class="btn btn-primary btn-sm" style="padding:5px 12px;font-size:0.8rem;color:white;">
                📥 <span class="lang-en">Download Signed ${App.utils.escapeHtml(variant.shortDocEn)}</span><span class="lang-es">Descargar ${App.utils.escapeHtml(variant.shortDocEs)} Firmado</span>
              </a>
            </div>
          ` : ''}
        </div>
      </div>`;
  } else if (status === 'data_submitted' || status === 'uploaded') {
    statusBannerHtml = `
      <div style="display:flex; align-items:flex-start; gap:1rem; padding:1.25rem; background:#ecfdf5; border-radius:0.75rem; margin-bottom:1.5rem; border:1.5px solid #6ee7b7; text-align:left;">
        <span style="font-size:2rem;">📋</span>
        <div>
          <div style="font-weight:700; color:#065f46; font-size:1rem;">
            <span class="lang-en">Fiscal &amp; Bank Details Received — Preparing Your ${App.utils.escapeHtml(variant.shortDocEn)}</span>
            <span class="lang-es">Datos Fiscales y Bancarios Recibidos — Preparando tu ${App.utils.escapeHtml(variant.shortDocEs)}</span>
            <span class="lang-fr">Données Fiscales et Bancaires Reçues — Contrat en Préparation</span>
            <span class="lang-en-ca">Fiscal &amp; Bank Details Received — Preparing Your ${App.utils.escapeHtml(variant.shortDocEn)}</span>
          </div>
          <div style="font-size:0.85rem; color:#047857; margin-top:4px; line-height:1.5;">
            <span class="lang-en">Our administration team has been notified and is preparing your custom ${App.utils.escapeHtml(variant.docNameEn)} externally. We will present it directly ${App.utils.escapeHtml(variant.presentationTargetEn)} for signature. You may update your details below at any time.</span>
            <span class="lang-es">Nuestro equipo de administración ya ha recibido la notificación con tus datos y está preparando tu ${App.utils.escapeHtml(variant.docNameEs)} de forma externa. Lo presentaremos directamente ${App.utils.escapeHtml(variant.presentationTargetEs)} para su firma. Si necesitas actualizar algún dato, puedes modificarlo y guardarlo abajo.</span>
            <span class="lang-fr">Notre équipe administrative a été notifiée et prépare votre accord de collaboration personnalisé.</span>
            <span class="lang-en-ca">Our administration team has been notified and is preparing your custom ${App.utils.escapeHtml(variant.docNameEn)} externally.</span>
          </div>
        </div>
      </div>`;
  } else {
    statusBannerHtml = `
      <div style="padding:1.25rem; background:#fef3c7; border-radius:0.75rem; margin-bottom:1.25rem; border:1px solid #fde68a; text-align:left;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
          <span style="font-size:1.5rem;">📝</span>
          <div style="font-weight:700; color:#92400e; font-size:1rem;">
            <span class="lang-en">Step Required: Provide Fiscal &amp; Banking Information for Your ${App.utils.escapeHtml(variant.shortDocEn)}</span>
            <span class="lang-es">Paso Requerido: Facilitar Datos Fiscales y Bancarios para tu ${App.utils.escapeHtml(variant.shortDocEs)}</span>
            <span class="lang-fr">Étape Requise : Fournir les Informations Fiscales et Bancaires pour l'Accord</span>
            <span class="lang-en-ca">Step Required: Provide Fiscal &amp; Banking Information for Your ${App.utils.escapeHtml(variant.shortDocEn)}</span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:#78350f; margin:0; line-height:1.5;">
          <span class="lang-en">To formalize your ${App.utils.escapeHtml(variant.docNameEn)} with RE/MAX Inmomás, please complete and save the form below with your fiscal and banking details. We prepare the contract externally and present it directly ${App.utils.escapeHtml(variant.presentationTargetEn)}.</span>
          <span class="lang-es">Para formalizar tu <strong>${App.utils.escapeHtml(variant.docNameEs)}</strong> con RE/MAX Inmomás, rellena y guarda el siguiente formulario con tus datos fiscales y cuenta bancaria. Con esta información armaremos el contrato correspondiente a tu rol de <strong>${App.utils.escapeHtml(variant.roleLabelEs)}</strong> y lo presentaremos directamente ${App.utils.escapeHtml(variant.presentationTargetEs)}.</span>
          <span class="lang-fr">Pour formaliser l'accord de collaboration, veuillez remplir et enregistrer le formulaire ci-dessous avec vos coordonnées fiscales et bancaires.</span>
          <span class="lang-en-ca">To formalize your ${App.utils.escapeHtml(variant.docNameEn)} with RE/MAX Inmomás, please complete and save the form below with your fiscal and banking details.</span>
        </p>
      </div>`;
  }

  containerEl.innerHTML = `
    ${statusBannerHtml}

    <!-- Step-by-step explanation -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:1rem; margin-bottom:1.5rem; text-align:left;">
      <div style="background:#f8f9ff; border:1.5px solid #c7d2fe; border-radius:0.75rem; padding:1.15rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
          <span style="font-size:1.3rem;">1️⃣</span>
          <div style="font-weight:700; color:#1e40af; font-size:0.92rem;">
            <span class="lang-en">Fill Out Tax &amp; Entity Data</span>
            <span class="lang-es">Rellenar Datos Fiscales (${App.utils.escapeHtml(variant.roleLabelEs)})</span>
            <span class="lang-fr">Remplir les Données Fiscales</span>
            <span class="lang-en-ca">Fill Out Tax &amp; Entity Data</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:#374151; margin:0; line-height:1.45;">
          <span class="lang-en">Here ${App.utils.escapeHtml(variant.partyDescEn)} completes the legal, tax (EIN/Tax ID/NIF), and bank account details below and saves them.</span>
          <span class="lang-es">Aquí ${App.utils.escapeHtml(variant.partyDescEs)} completa los datos legales, fiscales y la cuenta bancaria para el cobro de comisiones, y los guarda en este formulario.</span>
          <span class="lang-fr">Complétez les données fiscales et bancaires ci-dessous et enregistrez-les.</span>
          <span class="lang-en-ca">Here ${App.utils.escapeHtml(variant.partyDescEn)} completes the legal, tax, and bank account details below and saves them.</span>
        </p>
      </div>

      <div style="background:#eff6ff; border:1.5px solid #bfdbfe; border-radius:0.75rem; padding:1.15rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
          <span style="font-size:1.3rem;">2️⃣</span>
          <div style="font-weight:700; color:#1d4ed8; font-size:0.92rem;">
            <span class="lang-en">We Draft Your ${App.utils.escapeHtml(variant.shortDocEn)}</span>
            <span class="lang-es">Armamos tu ${App.utils.escapeHtml(variant.shortDocEs)}</span>
            <span class="lang-fr">Préparation Externe du Contrat</span>
            <span class="lang-en-ca">We Draft Your ${App.utils.escapeHtml(variant.shortDocEn)}</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:#374151; margin:0; line-height:1.45;">
          <span class="lang-en">As soon as you save these details, our administration panel receives an automatic notification and prepares your tailored ${App.utils.escapeHtml(variant.docNameEn)}.</span>
          <span class="lang-es">Al guardar los datos, administración recibe aviso automático y prepara tu <strong>${App.utils.escapeHtml(variant.docNameEs)}</strong> específico para tu perfil de ${App.utils.escapeHtml(variant.roleLabelEs)}.</span>
          <span class="lang-fr">Dès l'enregistrement, notre administration reçoit une notification et prépare votre contrat personnalisé.</span>
          <span class="lang-en-ca">As soon as you save these details, our administration panel prepares your tailored ${App.utils.escapeHtml(variant.docNameEn)}.</span>
        </p>
      </div>

      <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:0.75rem; padding:1.15rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
          <span style="font-size:1.3rem;">3️⃣</span>
          <div style="font-weight:700; color:#166534; font-size:0.92rem;">
            <span class="lang-en">Presentation &amp; Signature</span>
            <span class="lang-es">Presentación y Firma (${App.utils.escapeHtml(variant.roleLabelEs)})</span>
            <span class="lang-fr">Présentation et Signature</span>
            <span class="lang-en-ca">Presentation &amp; Signature</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:#374151; margin:0; line-height:1.45;">
          <span class="lang-en">Once drafted, we present the agreement directly ${App.utils.escapeHtml(variant.presentationTargetEn)} to review it together and complete the signature seamlessly.</span>
          <span class="lang-es">Una vez preparado el documento, lo presentamos directamente ${App.utils.escapeHtml(variant.presentationTargetEs)} para revisarlo juntos con total claridad y proceder a la firma.</span>
          <span class="lang-fr">Une fois prêt, nous présentons le contrat directement pour révision et signature.</span>
          <span class="lang-en-ca">Once drafted, we present the agreement directly ${App.utils.escapeHtml(variant.presentationTargetEn)} to complete the signature seamlessly.</span>
        </p>
      </div>
    </div>

    <!-- Form for Fiscal & Banking Details -->
    <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:0.875rem; padding:1.5rem; box-shadow:0 4px 12px rgba(15,23,42,0.04); text-align:left;">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem; padding-bottom:1rem; border-bottom:1px solid #f1f5f9;">
        <div>
          <div style="display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:999px; font-size:0.75rem; font-weight:800; background:${variant.accentBg}; color:${variant.accentColor}; border:1px solid ${variant.accentBorder}; margin-bottom:8px;">
            ${variant.icon} <span class="lang-en">Document Variant: ${App.utils.escapeHtml(variant.docNameEn)}</span><span class="lang-es">Variante de Documento: ${App.utils.escapeHtml(variant.docNameEs)}</span>
          </div>
          <h3 style="margin:0 0 0.35rem; font-size:1.05rem; color:#0f172a; display:flex; align-items:center; gap:0.5rem;">
            🏢 <span class="lang-en">Fiscal &amp; Banking Information Form (${App.utils.escapeHtml(variant.roleLabelEn)})</span>
            <span class="lang-es">Formulario de Datos Fiscales y Cuenta Bancaria (${App.utils.escapeHtml(variant.roleLabelEs)})</span>
            <span class="lang-fr">Formulaire de Données Fiscales et Bancaires</span>
            <span class="lang-en-ca">Fiscal &amp; Banking Information Form (${App.utils.escapeHtml(variant.roleLabelEn)})</span>
          </h3>
          <p style="font-size:0.82rem; color:#64748b; margin:0;">
            <span class="lang-en">Complete these details accurately so our team can prepare your ${App.utils.escapeHtml(variant.docNameEn)}, or export it directly in Word (.doc).</span>
            <span class="lang-es">Completa estos datos para redactar tu <strong>${App.utils.escapeHtml(variant.docNameEs)}</strong> o descárgalo directamente pre-rellenado en Word (.doc).</span>
            <span class="lang-fr">Veuillez remplir ces informations ou exporter votre accord au format Word (.doc).</span>
            <span class="lang-en-ca">Complete these details accurately or export your ${App.utils.escapeHtml(variant.docNameEn)} in Word (.doc).</span>
          </p>
        </div>
        <button type="button" class="btn btn-outline" onclick="App.utils.exportCurrentContractToWord('${prefix}')" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.65rem 1.15rem; font-weight:700; font-size:0.85rem; border-radius:0.6rem; border:1.5px solid ${variant.accentBorder}; color:${variant.accentColor}; background:${variant.accentBg}; white-space:nowrap; cursor:pointer;">
          ${variant.icon} <span class="lang-en">${App.utils.escapeHtml(variant.exportBtnEn)}</span>
          <span class="lang-es">${App.utils.escapeHtml(variant.exportBtnEs)}</span>
          <span class="lang-fr">Exporter l'Accord en Word (.doc)</span>
          <span class="lang-en-ca">${App.utils.escapeHtml(variant.exportBtnEn)}</span>
        </button>
      </div>

      <form id="${prefix}-company-data-form" style="display:grid; gap:1.25rem;">
        <!-- Block 1: Datos Fiscales -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.65rem; padding:1.15rem;">
          <h4 style="margin:0 0 0.85rem; font-size:0.9rem; color:#1e3a8a; text-transform:uppercase; letter-spacing:0.03em;">
            📑 <span class="lang-en">${App.utils.escapeHtml(variant.block1TitleEn)}</span>
            <span class="lang-es">${App.utils.escapeHtml(variant.block1TitleEs)}</span>
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">${App.utils.escapeHtml(variant.legalNameLabelEn)}</span>
                <span class="lang-es">${App.utils.escapeHtml(variant.legalNameLabelEs)}</span>
              </label>
              <input type="text" id="${prefix}-legal-name" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="${isDirectSigner && variant.role !== 'broker' ? 'Ej. Sociedad / Despacho o Nombre Fiscal Completo' : 'Ej. RE/MAX Premier Realty LLC'}" value="${App.utils.escapeHtml(saved.companyLegalName || user.agencyName || (isDirectSigner && variant.role !== 'broker' ? defaultSignerName : ''))}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Tax ID / EIN / CIF / NIF *</span>
                <span class="lang-es">NIF / CIF / Tax ID / EIN Fiscal *</span>
              </label>
              <input type="text" id="${prefix}-tax-id" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. 12-3456789 / B-12345678" value="${App.utils.escapeHtml(saved.taxId || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">${App.utils.escapeHtml(variant.licenseLabelEn)}</span>
                <span class="lang-es">${App.utils.escapeHtml(variant.licenseLabelEs)}</span>
              </label>
              <input type="text" id="${prefix}-license-number" class="form-input" style="margin-bottom:0; width:100%;" placeholder="Ej. CQ1056789" value="${App.utils.escapeHtml(saved.licenseNumber || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Country *</span>
                <span class="lang-es">País *</span>
              </label>
              <input type="text" id="${prefix}-country" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="United States / Canada / España" value="${App.utils.escapeHtml(saved.country || saved.fiscalCountry || user.country || '')}">
            </div>
            <div style="grid-column: 1 / -1;">
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Full Registered Tax Address (Street, City, State/Province, ZIP) *</span>
                <span class="lang-es">Dirección Fiscal Completa (Calle, Ciudad, Estado/Provincia, Código Postal) *</span>
              </label>
              <input type="text" id="${prefix}-fiscal-address" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. 1200 Brickell Ave, Suite 800, Miami, FL 33131" value="${App.utils.escapeHtml(saved.fiscalAddress || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">${App.utils.escapeHtml(variant.signerNameLabelEn)}</span>
                <span class="lang-es">${App.utils.escapeHtml(variant.signerNameLabelEs)}</span>
              </label>
              <input type="text" id="${prefix}-broker-name" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Nombre y Apellidos" value="${App.utils.escapeHtml(saved.brokerFullName || saved.brokerSignerName || defaultSignerName)}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">${App.utils.escapeHtml(variant.signerEmailLabelEn)}</span>
                <span class="lang-es">${App.utils.escapeHtml(variant.signerEmailLabelEs)}</span>
              </label>
              <input type="email" id="${prefix}-broker-email" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="contacto@empresa.com" value="${App.utils.escapeHtml(saved.brokerEmail || saved.brokerSignerEmail || (isDirectSigner ? user.email : ''))}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">${App.utils.escapeHtml(variant.signerPhoneLabelEn)}</span>
                <span class="lang-es">${App.utils.escapeHtml(variant.signerPhoneLabelEs)}</span>
              </label>
              <input type="tel" id="${prefix}-broker-phone" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="+1 555 000 0000" value="${App.utils.escapeHtml(saved.brokerPhone || saved.brokerSignerPhone || (isDirectSigner ? user.phone : ''))}">
            </div>
          </div>
        </div>

        <!-- Block 2: Datos Bancarios -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.65rem; padding:1.15rem;">
          <h4 style="margin:0 0 0.85rem; font-size:0.9rem; color:#065f46; text-transform:uppercase; letter-spacing:0.03em;">
            🏦 <span class="lang-en">2. Bank Account Details (For Commission Payments)</span>
            <span class="lang-es">2. Datos de Cuenta Bancaria (Para Pago de Comisiones)</span>
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Account Holder Name (Beneficiary) *</span>
                <span class="lang-es">Titular de la Cuenta Bancaria (Beneficiario) *</span>
              </label>
              <input type="text" id="${prefix}-bank-holder" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. RE/MAX Premier Realty LLC" value="${App.utils.escapeHtml(saved.bankAccountHolder || saved.companyLegalName || user.agencyName || (isDirectSigner && variant.role !== 'broker' ? defaultSignerName : ''))}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Bank Name *</span>
                <span class="lang-es">Nombre del Banco / Entidad Bancaria *</span>
              </label>
              <input type="text" id="${prefix}-bank-name" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. Bank of America / Chase / TD Bank" value="${App.utils.escapeHtml(saved.bankName || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Account Number / IBAN *</span>
                <span class="lang-es">Número de Cuenta / IBAN *</span>
              </label>
              <input type="text" id="${prefix}-bank-account" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Número de cuenta o IBAN" value="${App.utils.escapeHtml(saved.bankAccountNumber || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">SWIFT / BIC / Routing Number (ABA) *</span>
                <span class="lang-es">Código SWIFT / BIC / Routing Number (ABA) *</span>
              </label>
              <input type="text" id="${prefix}-bank-swift" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. BOFAUS3N / ABA 026009593" value="${App.utils.escapeHtml(saved.bankSwiftRouting || '')}">
            </div>
            <div style="grid-column: 1 / -1;">
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Bank Branch Address (Optional)</span>
                <span class="lang-es">Dirección de la Sucursal Bancaria (Opcional)</span>
              </label>
              <input type="text" id="${prefix}-bank-address" class="form-input" style="margin-bottom:0; width:100%;" placeholder="Ciudad, Estado, País del banco" value="${App.utils.escapeHtml(saved.bankAddress || '')}">
            </div>
            <div style="grid-column: 1 / -1;">
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Additional Notes (Optional)</span>
                <span class="lang-es">Notas Adicionales para el Contrato (Opcional)</span>
              </label>
              <textarea id="${prefix}-notes" class="form-input" rows="2" style="margin-bottom:0; width:100%; resize:vertical;" placeholder="Cualquier observación adicional para la redacción del contrato...">${App.utils.escapeHtml(saved.additionalNotes || saved.notes || '')}</textarea>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div id="${prefix}-save-status" style="font-size:0.85rem; color:#047857; font-weight:600;">
            ${saved.submittedAt ? `✅ <span class="lang-en">Last saved:</span><span class="lang-es">Última actualización:</span> ${App.utils.formatDate(saved.submittedAt)}` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-outline" onclick="App.utils.exportCurrentContractToWord('${prefix}')" style="padding:0.75rem 1.25rem; font-weight:700; border-radius:0.6rem; border:1.5px solid ${variant.accentBorder}; color:${variant.accentColor}; background:#fff; cursor:pointer;">
              ${variant.icon} <span class="lang-en">${App.utils.escapeHtml(variant.exportBtnEn)}</span><span class="lang-es">${App.utils.escapeHtml(variant.exportBtnEs)}</span><span class="lang-fr">Exporter en Word (.doc)</span><span class="lang-en-ca">${App.utils.escapeHtml(variant.exportBtnEn)}</span>
            </button>
            <button type="submit" class="btn btn-primary" id="${prefix}-submit-btn" style="padding:0.75rem 1.75rem; font-weight:700; border-radius:0.6rem;">
              💾 <span class="lang-en">Save Details &amp; Notify Administration</span>
              <span class="lang-es">Guardar Datos y Enviar a Administración</span>
              <span class="lang-fr">Enregistrer et Notifier l'Administration</span>
              <span class="lang-en-ca">Save Details &amp; Notify Administration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  if (window.App && typeof window.App.updateLangDisplay === 'function') {
    window.App.updateLangDisplay();
  }

  const formEl = document.getElementById(`${prefix}-company-data-form`);
  if (formEl) {
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      await App.utils.handleSaveContractData(user, prefix, () => {
        if (typeof onSuccessCallback === 'function') {
          onSuccessCallback();
        } else {
          App.utils.renderContractDataSection(containerEl, user, prefix, onSuccessCallback);
        }
      });
    });
  }
};

App.utils.exportCurrentContractToWord = function(prefix = 'contract') {
  if (typeof App.generateReferralAgreementDoc !== 'function') {
    App.utils.showToast('El generador de Word no está disponible.', 'error');
    return;
  }
  const currentUser = (App.auth && App.auth.getCurrentUser()) || {};
  const saved = currentUser.contractCompanyData || {};

  const getVal = (id, fallback) => {
    const el = document.getElementById(id);
    return (el && el.value.trim()) ? el.value.trim() : (fallback || '');
  };

  const liveContractData = {
    ...saved,
    companyLegalName: getVal(`${prefix}-legal-name`, saved.companyLegalName || currentUser.agencyName),
    taxId:            getVal(`${prefix}-tax-id`, saved.taxId),
    licenseNumber:    getVal(`${prefix}-license-number`, saved.licenseNumber),
    country:          getVal(`${prefix}-country`, saved.country || saved.fiscalCountry || currentUser.country),
    fiscalCountry:    getVal(`${prefix}-country`, saved.country || saved.fiscalCountry || currentUser.country),
    fiscalAddress:    getVal(`${prefix}-fiscal-address`, saved.fiscalAddress),
    brokerFullName:   getVal(`${prefix}-broker-name`, saved.brokerFullName || saved.brokerSignerName),
    brokerSignerName: getVal(`${prefix}-broker-name`, saved.brokerFullName || saved.brokerSignerName),
    brokerEmail:      getVal(`${prefix}-broker-email`, saved.brokerEmail || saved.brokerSignerEmail),
    brokerSignerEmail:getVal(`${prefix}-broker-email`, saved.brokerEmail || saved.brokerSignerEmail),
    brokerPhone:      getVal(`${prefix}-broker-phone`, saved.brokerPhone || saved.brokerSignerPhone),
    brokerSignerPhone:getVal(`${prefix}-broker-phone`, saved.brokerPhone || saved.brokerSignerPhone),
    bankAccountHolder:getVal(`${prefix}-bank-holder`, saved.bankAccountHolder),
    bankName:         getVal(`${prefix}-bank-name`, saved.bankName),
    bankAccountNumber:getVal(`${prefix}-bank-account`, saved.bankAccountNumber),
    bankSwiftRouting: getVal(`${prefix}-bank-swift`, saved.bankSwiftRouting),
    bankAddress:      getVal(`${prefix}-bank-address`, saved.bankAddress),
    additionalNotes:  getVal(`${prefix}-notes`, saved.additionalNotes || saved.notes),
    notes:            getVal(`${prefix}-notes`, saved.additionalNotes || saved.notes)
  };

  App.generateReferralAgreementDoc({
    ...currentUser,
    agencyName: liveContractData.companyLegalName || currentUser.agencyName,
    contractCompanyData: liveContractData
  });
};

App.utils.handleSaveContractData = async function(user, prefix, onDone) {
  const btn = document.getElementById(`${prefix}-submit-btn`);
  const statusEl = document.getElementById(`${prefix}-save-status`);
  const oldHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Guardando datos...';
  }

  try {
    const now = new Date().toISOString();
    const countryVal = (document.getElementById(`${prefix}-country`)?.value || '').trim();
    const brokerNameVal = (document.getElementById(`${prefix}-broker-name`)?.value || '').trim();
    const brokerEmailVal = (document.getElementById(`${prefix}-broker-email`)?.value || '').trim();
    const brokerPhoneVal = (document.getElementById(`${prefix}-broker-phone`)?.value || '').trim();
    const notesVal = (document.getElementById(`${prefix}-notes`)?.value || '').trim();

    const contractCompanyData = {
      companyLegalName: (document.getElementById(`${prefix}-legal-name`)?.value || '').trim(),
      taxId:            (document.getElementById(`${prefix}-tax-id`)?.value || '').trim(),
      licenseNumber:    (document.getElementById(`${prefix}-license-number`)?.value || '').trim(),
      country:          countryVal,
      fiscalCountry:    countryVal,
      fiscalAddress:    (document.getElementById(`${prefix}-fiscal-address`)?.value || '').trim(),
      brokerFullName:   brokerNameVal,
      brokerSignerName: brokerNameVal,
      brokerEmail:      brokerEmailVal,
      brokerSignerEmail:brokerEmailVal,
      brokerPhone:      brokerPhoneVal,
      brokerSignerPhone:brokerPhoneVal,
      bankAccountHolder:(document.getElementById(`${prefix}-bank-holder`)?.value || '').trim(),
      bankName:         (document.getElementById(`${prefix}-bank-name`)?.value || '').trim(),
      bankAccountNumber:(document.getElementById(`${prefix}-bank-account`)?.value || '').trim(),
      bankSwiftRouting: (document.getElementById(`${prefix}-bank-swift`)?.value || '').trim(),
      bankAddress:      (document.getElementById(`${prefix}-bank-address`)?.value || '').trim(),
      additionalNotes:  notesVal,
      notes:            notesVal,
      submittedAt:      now,
      submittedByRole:  user.role,
      submittedByName:  `${user.firstName || ''} ${user.lastName || ''}`.trim()
    };

    const newAgreementStatus = user.agreementStatus === 'signed' ? 'signed' : 'data_submitted';

    const notifPayload = {
      userId: user.id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      userRole: user.role,
      agencyName: contractCompanyData.companyLegalName || user.agencyName || user.brokerNameManual || '—',
      email: user.email,
      phone: user.phone || contractCompanyData.brokerPhone || '—',
      type: 'contract_data_submitted',
      contractCompanyData: contractCompanyData,
      uploadedAt: now,
      status: 'pending_admin'
    };

    if (!App.demoMode && App.db) {
      await App.db.collection('users').doc(user.id).update({
        contractCompanyData: contractCompanyData,
        agreementStatus: newAgreementStatus,
        contractDataSubmittedAt: now,
        agencyName: contractCompanyData.companyLegalName || user.agencyName || ''
      });
      await App.db.collection('agreement_notifications').add(notifPayload);
    } else {
      const demoUser = (App.demoData && App.demoData.users) ? App.demoData.users.find(u => u.id === user.id) : null;
      if (demoUser) {
        demoUser.contractCompanyData = contractCompanyData;
        demoUser.agreementStatus = newAgreementStatus;
        demoUser.contractDataSubmittedAt = now;
        if (contractCompanyData.companyLegalName) demoUser.agencyName = contractCompanyData.companyLegalName;
      }
      if (App.demoData) {
        App.demoData.agreementNotifications = App.demoData.agreementNotifications || [];
        // Replace existing pending_admin notification for same user or push new
        const existingIdx = App.demoData.agreementNotifications.findIndex(n => n.userId === user.id && n.status === 'pending_admin');
        const demoNotif = { id: 'notif_' + Date.now(), ...notifPayload };
        if (existingIdx >= 0) {
          App.demoData.agreementNotifications[existingIdx] = demoNotif;
        } else {
          App.demoData.agreementNotifications.unshift(demoNotif);
        }
      }
      if (App.auth && typeof App.auth.saveDemoData === 'function') App.auth.saveDemoData();
    }

    // Update current user in memory & localStorage session
    user.contractCompanyData = contractCompanyData;
    user.agreementStatus = newAgreementStatus;
    user.contractDataSubmittedAt = now;
    try {
      const sessionStr = localStorage.getItem('remax_session');
      if (sessionStr) {
        const sessionObj = JSON.parse(sessionStr);
        if (sessionObj && sessionObj.id === user.id) {
          sessionObj.contractCompanyData = contractCompanyData;
          sessionObj.agreementStatus = newAgreementStatus;
          sessionObj.contractDataSubmittedAt = now;
          localStorage.setItem('remax_session', JSON.stringify(sessionObj));
        }
      }
    } catch (_) {}

    // Send email notification to Admin via App.notifications
    if (window.App && window.App.notifications && typeof window.App.notifications.onContractDataSubmitted === 'function') {
      window.App.notifications.onContractDataSubmitted(user, contractCompanyData).catch(console.warn);
    }

    App.utils.showToast('✅ ¡Datos fiscales y bancarios guardados! Administración ha recibido la notificación para preparar vuestro contrato.', 'success');
    if (typeof onDone === 'function') onDone();
  } catch (err) {
    console.error('[ContractData] Error saving contract company data:', err);
    if (statusEl) statusEl.innerHTML = '<span style="color:#e11b22;">❌ Error al guardar los datos. Inténtalo de nuevo.</span>';
    App.utils.showToast('Error al guardar los datos: ' + (err.message || err), 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = oldHtml;
    }
  }
};

/* ============================================
   MULTI-REGION & NATIONALITY TAXONOMY (RE/MAX Inmomás)
   ============================================ */

App.utils.COUNTRIES = [
  // Norteamérica
  { value: 'United States', flag: '🇺🇸', labelEs: 'EE.UU.', labelEn: 'United States', region: 'north_america', aliases: ['united states', 'estados unidos', 'ee.uu.', 'ee.uu', 'eeuu', 'usa', 'u.s.a.', 'u.s.', 'us', 'miami', 'florida', 'orlando', 'tampa', 'new york', 'texas', 'dallas', 'houston', 'austin', 'california', 'los angeles', 'san francisco', 'chicago', 'illinois', 'phoenix', 'arizona', 'atlanta', 'georgia', 'new jersey', 'north carolina', 'virginia', 'massachusetts', 'boston', 'washington', 'seattle', 'colorado', 'denver', 'nevada', 'las vegas', 'pennsylvania', 'ohio', 'michigan', 'tennessee', 'knoxville'] },
  { value: 'Canada', flag: '🇨🇦', labelEs: 'Canadá', labelEn: 'Canada', region: 'north_america', aliases: ['canada', 'canadá', 'toronto', 'ontario', 'gta', 'quebec', 'québec', 'montreal', 'montréal', 'vancouver', 'british columbia', 'alberta', 'calgary', 'edmonton', 'ottawa', 'new brunswick', 'nova scotia', 'manitoba', 'saskatchewan'] },
  { value: 'Puerto Rico', flag: '🇵🇷', labelEs: 'Puerto Rico', labelEn: 'Puerto Rico', region: 'north_america', aliases: ['puerto rico', 'pr', 'san juan', 'dorado', 'bayamon', 'bayamón', 'guaynabo', 'carolina, pr', 'ponce', 'mayaguez', 'mayagüez', 'rincon', 'rincón', 'caguas', 'humacao'] },

  // Latinoamérica
  { value: 'Argentina', flag: '🇦🇷', labelEs: 'Argentina', labelEn: 'Argentina', region: 'latam', aliases: ['argentina', 'buenos aires', 'cordoba', 'córdoba', 'rosario', 'mendoza'] },
  { value: 'Colombia', flag: '🇨🇴', labelEs: 'Colombia', labelEn: 'Colombia', region: 'latam', aliases: ['colombia', 'bogota', 'bogotá', 'medellin', 'medellín', 'cali', 'barranquilla', 'cartagena'] },
  { value: 'Venezuela', flag: '🇻🇪', labelEs: 'Venezuela', labelEn: 'Venezuela', region: 'latam', aliases: ['venezuela', 'caracas', 'maracaibo', 'valencia, ve'] },

  // Suecia (solo)
  { value: 'Sweden', flag: '🇸🇪', labelEs: 'Suecia', labelEn: 'Sweden', region: 'sweden', aliases: ['sweden', 'suecia', 'sverige', 'stockholm', 'estocolmo', 'gothenburg', 'gotemburgo', 'malmo', 'malmö'] },

  // Holanda (solo)
  { value: 'Netherlands', flag: '🇳🇱', labelEs: 'Holanda', labelEn: 'Netherlands', region: 'netherlands', aliases: ['netherlands', 'the netherlands', 'holanda', 'holland', 'países bajos', 'paises bajos', 'nederland', 'amsterdam', 'ámsterdam', 'rotterdam', 'utrecht', 'eindhoven', 'the hague', 'la haya'] },

  // Suiza (solo)
  { value: 'Switzerland', flag: '🇨🇭', labelEs: 'Suiza', labelEn: 'Switzerland', region: 'switzerland', aliases: ['switzerland', 'suiza', 'suisse', 'schweiz', 'svizzera', 'zurich', 'zúrich', 'geneva', 'ginebra', 'genève', 'basel', 'lugano', 'lausanne'] },

  // Francia, Bélgica, Argelia y Emiratos Árabes (unidos)
  { value: 'France', flag: '🇫🇷', labelEs: 'Francia', labelEn: 'France', region: 'francophonie_mena', aliases: ['france', 'francia', 'paris', 'parís', 'lyon', 'marseille', 'marsella', 'nice', 'niza', 'bordeaux', 'burdeos', 'toulouse'] },
  { value: 'Algeria', flag: '🇩🇿', labelEs: 'Argelia', labelEn: 'Algeria', region: 'francophonie_mena', aliases: ['algeria', 'argelia', 'algérie', 'algerie', 'algiers', 'argel', 'oran', 'orán'] },
  { value: 'Belgium', flag: '🇧🇪', labelEs: 'Bélgica', labelEn: 'Belgium', region: 'francophonie_mena', aliases: ['belgium', 'bélgica', 'belgica', 'belgique', 'belgië', 'brussels', 'bruselas', 'bruxelles', 'antwerp', 'amberes', 'ghent'] },
  { value: 'United Arab Emirates', flag: '🇦🇪', labelEs: 'Emiratos Árabes', labelEn: 'United Arab Emirates', region: 'francophonie_mena', aliases: ['united arab emirates', 'emiratos árabes unidos', 'emiratos arabes unidos', 'emiratos árabes', 'emiratos arabes', 'emiratos', 'emirates', 'uae', 'u.a.e.', 'eau', 'dubai', 'dubái', 'abu dhabi', 'sharjah'] },

  // Alemania (solo)
  { value: 'Germany', flag: '🇩🇪', labelEs: 'Alemania', labelEn: 'Germany', region: 'germany', aliases: ['germany', 'alemania', 'deutschland', 'berlin', 'berlín', 'munich', 'múnich', 'münchen', 'frankfurt', 'hamburg', 'hamburgo', 'cologne', 'colonia', 'düsseldorf', 'dusseldorf', 'stuttgart'] },

  // Ucrania y Bulgaria (unidos)
  { value: 'Ukraine', flag: '🇺🇦', labelEs: 'Ucrania', labelEn: 'Ukraine', region: 'ukraine_bulgaria', aliases: ['ukraine', 'ucrania', 'kyiv', 'kiev', 'lviv', 'odesa', 'odessa', 'kharkiv'] },
  { value: 'Bulgaria', flag: '🇧🇬', labelEs: 'Bulgaria', labelEn: 'Bulgaria', region: 'ukraine_bulgaria', aliases: ['bulgaria', 'sofia', 'sofía', 'plovdiv', 'varna', 'burgas'] },

  // Italia (sola)
  { value: 'Italy', flag: '🇮🇹', labelEs: 'Italia', labelEn: 'Italy', region: 'italy', aliases: ['italy', 'italia', 'rome', 'roma', 'milan', 'milán', 'milano', 'naples', 'nápoles', 'turin', 'turín', 'florence', 'florencia', 'bologna'] },

  // Irlanda (sola)
  { value: 'Ireland', flag: '🇮🇪', labelEs: 'Irlanda', labelEn: 'Ireland', region: 'ireland', aliases: ['ireland', 'irlanda', 'republic of ireland', 'dublin', 'dublín', 'cork', 'galway', 'limerick'] }
];

App.utils.COUNTRY_BY_VALUE = {};
App.utils.COUNTRIES.forEach(c => {
  App.utils.COUNTRY_BY_VALUE[c.value.toLowerCase()] = c;
});

App.utils.REGIONS = {
  north_america: {
    id: 'north_america',
    icon: '🌎',
    flag: '🇺🇸🇨🇦🇵🇷',
    labelEs: 'Norteamérica (EE.UU., Canadá y PR)',
    labelEn: 'North America (US, Canada & PR)',
    shortEs: 'Norteamérica',
    shortEn: 'North America',
    color: '#003f99',
    bg: 'rgba(0, 63, 153, 0.10)',
    border: 'rgba(0, 63, 153, 0.25)',
    defaultLang: 'en',
    countries: ['United States', 'Canada', 'Puerto Rico']
  },
  latam: {
    id: 'latam',
    icon: '🌎',
    flag: '🇦🇷🇨🇴🇻🇪',
    labelEs: 'Latinoamérica (Argentina, Colombia y Venezuela)',
    labelEn: 'Latin America (Argentina, Colombia & Venezuela)',
    shortEs: 'Latinoamérica',
    shortEn: 'Latin America',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.10)',
    border: 'rgba(5, 150, 105, 0.25)',
    defaultLang: 'es',
    countries: ['Argentina', 'Colombia', 'Venezuela']
  },
  sweden: {
    id: 'sweden',
    icon: '🇸🇪',
    flag: '🇸🇪',
    labelEs: 'Suecia',
    labelEn: 'Sweden',
    shortEs: 'Suecia',
    shortEn: 'Sweden',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.10)',
    border: 'rgba(2, 132, 199, 0.25)',
    defaultLang: 'en',
    countries: ['Sweden']
  },
  netherlands: {
    id: 'netherlands',
    icon: '🇳🇱',
    flag: '🇳🇱',
    labelEs: 'Holanda (Países Bajos)',
    labelEn: 'Netherlands',
    shortEs: 'Holanda',
    shortEn: 'Netherlands',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.10)',
    border: 'rgba(234, 88, 12, 0.25)',
    defaultLang: 'nl',
    countries: ['Netherlands']
  },
  switzerland: {
    id: 'switzerland',
    icon: '🇨🇭',
    flag: '🇨🇭',
    labelEs: 'Suiza',
    labelEn: 'Switzerland',
    shortEs: 'Suiza',
    shortEn: 'Switzerland',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.10)',
    border: 'rgba(220, 38, 38, 0.25)',
    defaultLang: 'fr',
    countries: ['Switzerland']
  },
  francophonie_mena: {
    id: 'francophonie_mena',
    icon: '🌍',
    flag: '🇫🇷🇧🇪🇩🇿🇦🇪',
    labelEs: 'Francia, Bélgica, Argelia y Emiratos Árabes',
    labelEn: 'France, Belgium, Algeria & UAE',
    shortEs: 'Francia · Bélgica · Argelia · EAU',
    shortEn: 'FR · BE · Algeria · UAE',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.10)',
    border: 'rgba(124, 58, 237, 0.25)',
    defaultLang: 'fr',
    countries: ['France', 'Algeria', 'Belgium', 'United Arab Emirates']
  },
  germany: {
    id: 'germany',
    icon: '🇩🇪',
    flag: '🇩🇪',
    labelEs: 'Alemania',
    labelEn: 'Germany',
    shortEs: 'Alemania',
    shortEn: 'Germany',
    color: '#334155',
    bg: 'rgba(51, 65, 85, 0.10)',
    border: 'rgba(51, 65, 85, 0.25)',
    defaultLang: 'de',
    countries: ['Germany']
  },
  ukraine_bulgaria: {
    id: 'ukraine_bulgaria',
    icon: '🌍',
    flag: '🇺🇦🇧🇬',
    labelEs: 'Ucrania y Bulgaria',
    labelEn: 'Ukraine & Bulgaria',
    shortEs: 'Ucrania y Bulgaria',
    shortEn: 'Ukraine & Bulgaria',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.28)',
    defaultLang: 'uk',
    countries: ['Ukraine', 'Bulgaria']
  },
  italy: {
    id: 'italy',
    icon: '🇮🇹',
    flag: '🇮🇹',
    labelEs: 'Italia',
    labelEn: 'Italy',
    shortEs: 'Italia',
    shortEn: 'Italy',
    color: '#15803d',
    bg: 'rgba(21, 128, 61, 0.10)',
    border: 'rgba(21, 128, 61, 0.25)',
    defaultLang: 'en',
    countries: ['Italy']
  },
  ireland: {
    id: 'ireland',
    icon: '🇮🇪',
    flag: '🇮🇪',
    labelEs: 'Irlanda',
    labelEn: 'Ireland',
    shortEs: 'Irlanda',
    shortEn: 'Ireland',
    color: '#0d9488',
    bg: 'rgba(13, 148, 136, 0.10)',
    border: 'rgba(13, 148, 136, 0.25)',
    defaultLang: 'en',
    countries: ['Ireland']
  }
};

App.utils.REGION_LIST = Object.values(App.utils.REGIONS);

App.utils.LEGACY_REGION_MAP = {
  western_europe: 'francophonie_mena',
  eastern_europe: 'ukraine_bulgaria',
  mena: 'francophonie_mena'
};

App.utils.WEBINAR_LANGUAGES = [
  { code: 'en', labelEs: '🇬🇧 Inglés (English)', labelEn: '🇬🇧 English' },
  { code: 'es', labelEs: '🇪🇸 Español (Spanish)', labelEn: '🇪🇸 Spanish' },
  { code: 'fr', labelEs: '🇫🇷 Francés (Français)', labelEn: '🇫🇷 French' },
  { code: 'de', labelEs: '🇩🇪 Alemán (Deutsch)', labelEn: '🇩🇪 German' },
  { code: 'nl', labelEs: '🇳🇱 Neerlandés (Nederlands)', labelEn: '🇳🇱 Dutch' },
  { code: 'sv', labelEs: '🇸🇪 Sueco (Svenska)', labelEn: '🇸🇪 Swedish' },
  { code: 'it', labelEs: '🇮🇹 Italiano (Italiano)', labelEn: '🇮🇹 Italian' },
  { code: 'uk', labelEs: '🇺🇦 Ucraniano / Búlgaro / Ruso', labelEn: '🇺🇦 Ukrainian / Bulgarian / Russian' },
  { code: 'ar', labelEs: '🇦🇪 Árabe / Francófono (MENA)', labelEn: '🇦🇪 Arabic / Francophone (MENA)' },
  { code: 'bilingual', labelEs: '🌐 Bilingüe (ES / EN)', labelEn: '🌐 Bilingual (EN / ES)' }
];

// Known RE/MAX Inmomás Agent fallback profiles when Firestore doc hasn't been explicitly tagged yet
App.utils.KNOWN_MAS_AGENT_REGIONS = [
  { match: ['james', 'lavoie', 'jamisa'], nationality: 'Canada', regions: ['north_america', 'francophonie_mena'], languages: ['en', 'fr', 'es'] },
  { match: ['angel luis', 'ángel luis', 'ángel luís', 'debra nadal'], nationality: 'Puerto Rico', regions: ['north_america', 'latam'], languages: ['es', 'en'] },
  { match: ['sepehr', 'hosseini'], nationality: 'Canada', regions: ['north_america', 'francophonie_mena'], languages: ['en', 'ar', 'es'] },
  { match: ['denise', 'mcneal'], nationality: 'United States', regions: ['north_america'], languages: ['en', 'es'] },
  { match: ['giancarlo', 'agudelo'], nationality: 'Colombia', regions: ['latam', 'north_america'], languages: ['es', 'en'] },
  { match: ['ozzie', 'lleras'], nationality: 'United States', regions: ['north_america', 'latam'], languages: ['en', 'es'] },
  { match: ['maia', 'honczaryk'], nationality: 'Argentina / Ukraine', regions: ['north_america', 'latam', 'ukraine_bulgaria'], languages: ['es', 'en'] },
  { match: ['josé martínez', 'jose martinez', 'dionisio', 'ana martínez', 'ana martinez', 'carlos garcía', 'carlos garcia'], nationality: 'Spain', regions: ['north_america', 'latam', 'francophonie_mena'], languages: ['es', 'en'] }
];

App.utils._matchSingleCountryMeta = function(partRaw) {
  if (!partRaw) return null;
  const clean = String(partRaw).trim().toLowerCase();
  if (!clean || clean === '—' || clean === '-' || clean === 'n/a') return null;

  // 1. Exact alias or value match first (handles short codes like 'pr', 'us', 'uae')
  for (const c of App.utils.COUNTRIES) {
    if (clean === c.value.toLowerCase() || clean === c.labelEs.toLowerCase()) return c;
    if (c.aliases.some(a => clean === a)) return c;
  }

  // 2. Substring match for longer phrases like 'Toronto, Canada' or 'Miami, Florida'
  for (const c of App.utils.COUNTRIES) {
    if (c.aliases.some(a => a.length >= 4 && clean.includes(a))) return c;
  }
  return null;
};

App.utils.normalizeCountry = function(countryInput) {
  if (!countryInput) return '';
  const str = String(countryInput).trim();
  if (!str || str === '—' || str === '-' || str.toLowerCase() === 'n/a') return '';
  const direct = App.utils._matchSingleCountryMeta(str);
  if (direct) return direct.value;

  const parts = str.split(/[\/|,;]+/).map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = App.utils._matchSingleCountryMeta(p);
    if (m) return m.value;
  }
  return str;
};

App.utils.extractNormalizedCountries = function(countryInput) {
  if (!countryInput) return [];
  const str = String(countryInput).trim();
  if (!str || str === '—' || str === '-' || str.toLowerCase() === 'n/a') return [];
  const out = new Set();
  const parts = str.split(/[\/|;]+/).map(s => s.trim()).filter(Boolean);
  parts.forEach(p => {
    const m = App.utils._matchSingleCountryMeta(p);
    if (m) out.add(m.value);
    else if (p) out.add(p);
  });
  if (out.size === 0) {
    const m = App.utils._matchSingleCountryMeta(str);
    if (m) out.add(m.value);
  }
  return Array.from(out);
};

App.utils.matchesCountryFilter = function(rawCountryInput, targetCountry) {
  if (!targetCountry) return true;
  if (!rawCountryInput) return false;
  const targetClean = String(targetCountry).trim();
  const targetNorm = App.utils.normalizeCountry(targetClean).toLowerCase();
  const candidates = App.utils.extractNormalizedCountries(rawCountryInput).map(x => x.toLowerCase());
  if (candidates.includes(targetNorm) || candidates.includes(targetClean.toLowerCase())) return true;
  return String(rawCountryInput).toLowerCase().includes(targetClean.toLowerCase());
};

App.utils.getCountryDisplayLabel = function(countryVal, withFlag = true) {
  const norm = App.utils.normalizeCountry(countryVal);
  const meta = App.utils.COUNTRY_BY_VALUE[(norm || '').toLowerCase()];
  if (!meta) return countryVal || '';
  const isEs = App.utils.getCurrentLanguage ? (App.utils.getCurrentLanguage() === 'es') : true;
  const name = isEs ? meta.labelEs : meta.labelEn;
  return withFlag ? `${meta.flag} ${name}` : name;
};

App.utils.resolveRegionFromCountry = function(countryInput) {
  if (!countryInput) return '';
  const raw = String(countryInput).trim().toLowerCase();
  if (!raw || raw === '—' || raw === '-' || raw === 'n/a') return '';

  // Direct region id match (including legacy mapping)
  if (App.utils.REGIONS[raw]) return raw;
  if (App.utils.LEGACY_REGION_MAP[raw]) return App.utils.LEGACY_REGION_MAP[raw];

  // Official 18 countries + aliases
  const matchedMeta = App.utils._matchSingleCountryMeta(raw);
  if (matchedMeta) return matchedMeta.region;

  // Multi-part strings (e.g. 'Argentina / Ukraine')
  const parts = raw.split(/[\/|;]+/).map(s => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = App.utils._matchSingleCountryMeta(p);
    if (m) return m.region;
  }

  // Internal Spain records should not falsely inflate international region counts
  const spainKeywords = ['spain', 'españa', 'espana', 'alicante', 'costa blanca', 'madrid', 'valencia', 'barcelona', 'málaga', 'malaga'];
  if (spainKeywords.some(k => raw === k || raw.includes(k))) return '';

  // Extended Latam fallback for legacy records (Mexico, Chile, Peru, etc.)
  const extraLatamKeywords = ['mexico', 'méxico', 'chile', 'santiago', 'peru', 'perú', 'lima', 'panama', 'panamá', 'costa rica', 'dominican', 'dominicana', 'santo domingo', 'punta cana', 'uruguay', 'ecuador', 'brazil', 'brasil', 'guatemala', 'paraguay', 'bolivia', 'latam', 'latinoamerica', 'latinoamérica'];
  if (extraLatamKeywords.some(k => raw === k || raw.includes(k))) return 'latam';

  // Extended Eastern Europe fallback
  const extraEastKeywords = ['poland', 'polonia', 'romania', 'rumania', 'rumanía', 'czech', 'checa', 'hungary', 'hungría', 'slovakia', 'eslovaquia', 'estonia', 'latvia', 'letonia', 'lithuania', 'lituania', 'croatia', 'croacia', 'serbia'];
  if (extraEastKeywords.some(k => raw === k || raw.includes(k))) return 'ukraine_bulgaria';

  // Extended Francophonie / MENA fallback
  const extraMenaFrKeywords = ['luxembourg', 'luxemburgo', 'monaco', 'mónaco', 'morocco', 'marruecos', 'tunisia', 'túnez', 'saudi', 'qatar', 'catar', 'kuwait', 'bahrain', 'oman', 'lebanon', 'líbano', 'jordan', 'jordania', 'egypt', 'egipto'];
  if (extraMenaFrKeywords.some(k => raw === k || raw.includes(k))) return 'francophonie_mena';

  return '';
};

App.utils.normalizeRegionId = function(regId, countryFallback = '') {
  const fromCountry = countryFallback ? App.utils.resolveRegionFromCountry(countryFallback) : '';
  if (regId && App.utils.REGIONS[regId]) {
    return regId;
  }
  if (fromCountry && App.utils.REGIONS[fromCountry]) {
    return fromCountry;
  }
  if (regId && App.utils.LEGACY_REGION_MAP[regId]) {
    return App.utils.LEGACY_REGION_MAP[regId];
  }
  return '';
};

App.utils.getUserNationality = function(user) {
  if (!user) return '';
  if (user.nationality && String(user.nationality).trim()) return String(user.nationality).trim();
  if (user.role === 'agent_inmomas') {
    const fullName = `${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}`.toLowerCase();
    const known = App.utils.KNOWN_MAS_AGENT_REGIONS.find(k => k.match.some(m => fullName.includes(m)));
    if (known && known.nationality) return known.nationality;
  }
  return user.country || '';
};

App.utils.getUserRegions = function(user) {
  if (!user) return [];
  const countryHint = user.nationality || user.country || '';
  const out = new Set();

  if (Array.isArray(user.regions) && user.regions.length > 0) {
    user.regions.forEach(r => {
      const norm = App.utils.normalizeRegionId(r, countryHint);
      if (norm) out.add(norm);
    });
  }
  if (user.region) {
    const norm = App.utils.normalizeRegionId(user.region, countryHint);
    if (norm) out.add(norm);
  }
  if (out.size > 0) return Array.from(out);

  if (user.role === 'agent_inmomas') {
    const fullName = `${user.firstName || ''} ${user.lastName || ''} ${user.name || ''}`.toLowerCase();
    const known = App.utils.KNOWN_MAS_AGENT_REGIONS.find(k => k.match.some(m => fullName.includes(m)));
    if (known) return known.regions.filter(r => App.utils.REGIONS[r]);
  }
  const resolved = App.utils.resolveRegionFromCountry(countryHint);
  return resolved ? [resolved] : [];
};

App.utils.getRecordRegion = function(record, allUsers) {
  if (!record) return '';
  const countryCandidate = record.country || record.currentLocation || '';
  const fromCountry = App.utils.resolveRegionFromCountry(countryCandidate);

  if (record.region && App.utils.REGIONS[record.region]) return record.region;
  if (record.webinarRegion && App.utils.REGIONS[record.webinarRegion]) return record.webinarRegion;
  if (fromCountry) return fromCountry;

  if (record.region && App.utils.LEGACY_REGION_MAP[record.region]) return App.utils.LEGACY_REGION_MAP[record.region];
  if (record.webinarRegion && App.utils.LEGACY_REGION_MAP[record.webinarRegion]) return App.utils.LEGACY_REGION_MAP[record.webinarRegion];

  // Fallback to referring user or assigned agent primary region
  if (Array.isArray(allUsers) && allUsers.length > 0) {
    const refKey = record.realtorId || record.referredBy || record.agentReferrerId || record.referrerId || record.referralCode || '';
    if (refKey) {
      const refStr = String(refKey).trim().toUpperCase();
      const refUser = allUsers.find(u =>
        u.id === refKey ||
        (u.referralCode && u.referralCode.toUpperCase() === refStr) ||
        `${u.firstName || ''} ${u.lastName || ''}`.trim().toUpperCase() === refStr
      );
      if (refUser) {
        const uRegs = App.utils.getUserRegions(refUser);
        if (uRegs.length > 0) return uRegs[0];
      }
    }
  }
  return '';
};

App.utils.getRegionLabel = function(regionId, short = false) {
  const normId = (App.utils.REGIONS[regionId] ? regionId : App.utils.LEGACY_REGION_MAP[regionId]) || regionId;
  const reg = App.utils.REGIONS[normId];
  if (!reg) return regionId || 'Sin región';
  const isEs = App.utils.getCurrentLanguage ? (App.utils.getCurrentLanguage() === 'es') : true;
  if (short) return isEs ? reg.shortEs : reg.shortEn;
  return isEs ? reg.labelEs : reg.labelEn;
};

App.utils.getRegionBadge = function(regionId, compact = true) {
  const normId = (App.utils.REGIONS[regionId] ? regionId : App.utils.LEGACY_REGION_MAP[regionId]) || regionId;
  const reg = App.utils.REGIONS[normId];
  if (!reg) return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:0.73rem;font-weight:600;background:#f3f4f6;color:#6b7280;">🌍 —</span>`;
  const textEs = compact ? reg.shortEs : reg.labelEs;
  const textEn = compact ? reg.shortEn : reg.labelEn;
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:0.73rem;font-weight:700;background:${reg.bg};color:${reg.color};border:1px solid ${reg.border};white-space:nowrap;">${reg.icon} <span class="lang-en">${App.utils.escapeHtml(textEn)}</span><span class="lang-es">${App.utils.escapeHtml(textEs)}</span></span>`;
};

App.utils.getUserRegionBadgesHtml = function(user) {
  const regions = App.utils.getUserRegions(user);
  if (!regions.length) return App.utils.getRegionBadge('', true);
  return regions.map(r => App.utils.getRegionBadge(r, true)).join(' ');
};

App.utils.getRegionFilterOptionsHtml = function(selectedVal = '', allLabelEs = '🌍 Todas las Regiones', allLabelEn = '🌍 All Regions') {
  const isEs = App.utils.getCurrentLanguage ? (App.utils.getCurrentLanguage() === 'es') : true;
  let html = `<option value="" data-i18n-en="${App.utils.escapeHtml(allLabelEn)}" data-i18n-es="${App.utils.escapeHtml(allLabelEs)}">${App.utils.escapeHtml(isEs ? allLabelEs : allLabelEn)}</option>`;
  App.utils.REGION_LIST.forEach(r => {
    const sel = r.id === selectedVal ? 'selected' : '';
    const optEn = `${r.flag || r.icon} ${r.labelEn}`;
    const optEs = `${r.flag || r.icon} ${r.labelEs}`;
    html += `<option value="${r.id}" data-i18n-en="${App.utils.escapeHtml(optEn)}" data-i18n-es="${App.utils.escapeHtml(optEs)}" ${sel}>${App.utils.escapeHtml(isEs ? optEs : optEn)}</option>`;
  });
  return html;
};

App.utils.getCountryFilterOptionsHtml = function(selectedVal = '', regionFilter = '', extraRawCountries = [], allLabelEs = '🏳️ Todos los Países', allLabelEn = '🏳️ All Countries') {
  const isEs = App.utils.getCurrentLanguage ? (App.utils.getCurrentLanguage() === 'es') : true;
  const cleanSelected = String(selectedVal || '').trim();
  const normSelected = App.utils.normalizeCountry(cleanSelected).toLowerCase();
  let foundSelected = false;

  let html = `<option value="" data-i18n-en="${App.utils.escapeHtml(allLabelEn)}" data-i18n-es="${App.utils.escapeHtml(allLabelEs)}">${App.utils.escapeHtml(isEs ? allLabelEs : allLabelEn)}</option>`;

  const regionsToRender = regionFilter && App.utils.REGIONS[regionFilter]
    ? [App.utils.REGIONS[regionFilter]]
    : App.utils.REGION_LIST;

  regionsToRender.forEach(reg => {
    const groupLabel = isEs ? `${reg.icon} ${reg.shortEs}` : `${reg.icon} ${reg.shortEn}`;
    const regCountries = App.utils.COUNTRIES.filter(c => c.region === reg.id);
    if (!regCountries.length) return;
    if (regionsToRender.length > 1) {
      html += `<optgroup label="${App.utils.escapeHtml(groupLabel)}">`;
    }
    regCountries.forEach(c => {
      const isSel = cleanSelected && (c.value.toLowerCase() === normSelected || c.value.toLowerCase() === cleanSelected.toLowerCase());
      if (isSel) foundSelected = true;
      const optEn = `${c.flag} ${c.labelEn}`;
      const optEs = `${c.flag} ${c.labelEs}`;
      html += `<option value="${App.utils.escapeHtml(c.value)}" data-region="${reg.id}" data-i18n-en="${App.utils.escapeHtml(optEn)}" data-i18n-es="${App.utils.escapeHtml(optEs)}" ${isSel ? 'selected' : ''}>${App.utils.escapeHtml(isEs ? optEs : optEn)}</option>`;
    });
    if (regionsToRender.length > 1) {
      html += `</optgroup>`;
    }
  });

  // Include any additional non-official countries present in DB records (when no regionFilter or matching regionFilter)
  if (Array.isArray(extraRawCountries) && extraRawCountries.length > 0) {
    const extraSet = new Set();
    extraRawCountries.forEach(raw => {
      App.utils.extractNormalizedCountries(raw).forEach(norm => {
        if (!norm || norm === '—' || norm === '-' || norm.toLowerCase() === 'n/a') return;
        if (App.utils.COUNTRY_BY_VALUE[norm.toLowerCase()]) return;
        if (regionFilter && App.utils.resolveRegionFromCountry(norm) !== regionFilter) return;
        extraSet.add(norm);
      });
    });
    const extras = Array.from(extraSet).sort((a, b) => a.localeCompare(b));
    if (extras.length > 0) {
      html += `<optgroup label="${isEs ? '🌐 Otros países registrados' : '🌐 Other registered countries'}">`;
      extras.forEach(ex => {
        const isSel = cleanSelected && ex.toLowerCase() === cleanSelected.toLowerCase();
        if (isSel) foundSelected = true;
        html += `<option value="${App.utils.escapeHtml(ex)}" ${isSel ? 'selected' : ''}>🏳️ ${App.utils.escapeHtml(ex)}</option>`;
      });
      html += `</optgroup>`;
    }
  }

  if (cleanSelected && !foundSelected && !regionFilter) {
    html += `<option value="${App.utils.escapeHtml(cleanSelected)}" selected>${App.utils.escapeHtml(cleanSelected)}</option>`;
  }
  return html;
};

App.utils.getCountryOptionsHtml = function(selectedVal = '', includeEmpty = false, emptyLabel = '— Seleccionar País / Nacionalidad —') {
  const isEs = App.utils.getCurrentLanguage ? (App.utils.getCurrentLanguage() === 'es') : true;
  const cleanSelected = String(selectedVal || '').trim();
  const normSelected = App.utils.normalizeCountry(cleanSelected).toLowerCase();
  let foundSelected = false;
  let html = includeEmpty ? `<option value="">${App.utils.escapeHtml(emptyLabel)}</option>` : '';

  App.utils.REGION_LIST.forEach(reg => {
    html += `<optgroup label="${reg.icon} ${reg.shortEs} / ${reg.shortEn}">`;
    const regCountries = App.utils.COUNTRIES.filter(c => c.region === reg.id);
    regCountries.forEach(c => {
      const isSel = cleanSelected && (c.value.toLowerCase() === normSelected || c.value.toLowerCase() === cleanSelected.toLowerCase());
      if (isSel) foundSelected = true;
      const label = isEs ? `${c.flag} ${c.labelEs} (${c.labelEn})` : `${c.flag} ${c.labelEn}`;
      html += `<option value="${App.utils.escapeHtml(c.value)}" data-region="${reg.id}" ${isSel ? 'selected' : ''}>${App.utils.escapeHtml(label)}</option>`;
    });
    html += `</optgroup>`;
  });

  // Internal Spain & Other options for internal agents / other markets
  const isSpain = cleanSelected.toLowerCase() === 'spain' || cleanSelected.toLowerCase() === 'españa';
  if (isSpain) foundSelected = true;
  const isOther = cleanSelected.toLowerCase() === 'other' || cleanSelected.toLowerCase() === 'otro';
  if (isOther) foundSelected = true;
  html += `<optgroup label="🇪🇸 España / Otros">`;
  html += `<option value="Spain" ${isSpain ? 'selected' : ''}>🇪🇸 España (Spain)</option>`;
  html += `<option value="Other" ${isOther ? 'selected' : ''}>🌍 Otro / Other</option>`;
  html += `</optgroup>`;

  if (cleanSelected && !foundSelected) {
    html += `<option value="${App.utils.escapeHtml(cleanSelected)}" selected>${App.utils.escapeHtml(cleanSelected)}</option>`;
  }
  return html;
};

App.utils.getRegionsCheckboxesHtml = function(inputName, selectedRegions = []) {
  const rawArr = Array.isArray(selectedRegions) ? selectedRegions : (selectedRegions ? [selectedRegions] : []);
  const selectedSet = new Set(rawArr.map(r => App.utils.REGIONS[r] ? r : (App.utils.LEGACY_REGION_MAP[r] || r)));
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:8px;margin-top:6px;">
      ${App.utils.REGION_LIST.map(reg => {
        const checked = selectedSet.has(reg.id) ? 'checked' : '';
        return `
          <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;border:1px solid ${reg.border};background:${reg.bg};cursor:pointer;font-size:0.82rem;font-weight:600;color:#1e293b;">
            <input type="checkbox" name="${inputName}" value="${reg.id}" ${checked} style="width:16px;height:16px;accent-color:${reg.color};cursor:pointer;">
            <span>${reg.flag || reg.icon} <span class="lang-en">${reg.shortEn}</span><span class="lang-es">${reg.shortEs}</span></span>
          </label>
        `;
      }).join('')}
    </div>
  `;
};

App.utils.isWebinarScheduled = function(wCfg) {
  if (!wCfg || typeof wCfg !== 'object') return false;
  if (wCfg.scheduled === false || wCfg.enabled === false || wCfg.activeType === 'none') return false;
  const dateStr = String(wCfg.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return false;

  const timeStr = String(wCfg.time || '23:59').trim();
  const [hhRaw, mmRaw] = timeStr.split(':').map(Number);
  const hh = Number.isFinite(hhRaw) ? hhRaw : 23;
  const mm = Number.isFinite(mmRaw) ? mmRaw : 59;

  // Approximate CET/CEST (+01:00/+02:00) end time with a 2-hour live session buffer
  const isDst = (m > 3 && m < 10) || (m === 3 && d >= 25) || (m === 10 && d < 25);
  const offsetHours = isDst ? 2 : 1;
  const eventStartUtcMs = Date.UTC(y, m - 1, d, hh - offsetHours, mm, 0);
  const eventEndWithBufferMs = eventStartUtcMs + (2 * 60 * 60 * 1000);
  return eventEndWithBufferMs >= Date.now();
};

App.utils.renderUserRegionalBanner = async function(containerId, user) {
  const el = document.getElementById(containerId);
  if (!el || !user) return;

  try {
    const freshUser = user;
    const nat = App.utils.getUserNationality ? App.utils.getUserNationality(freshUser) : (freshUser.nationality || freshUser.country || '');
    const userRegions = App.utils.getUserRegions ? App.utils.getUserRegions(freshUser) : [];
    const displayRegions = userRegions.length > 0 ? userRegions : ['north_america'];

    const settings = (App.auth && App.auth.getWebinarSettings)
      ? await App.auth.getWebinarSettings()
      : (App.auth && App.auth.getDefaultWebinarSettings ? App.auth.getDefaultWebinarSettings() : null);

    const scheduledRegions = displayRegions
      .map(rId => {
        const regMeta = App.utils.REGIONS[rId] || App.utils.REGIONS.north_america;
        const wCfg = (App.auth && App.auth.getRegionalWebinarConfig && settings)
          ? App.auth.getRegionalWebinarConfig(settings, rId)
          : null;
        return { rId, regMeta, wCfg };
      })
      .filter(item => App.utils.isWebinarScheduled(item.wCfg));

    // If there is NO scheduled upcoming webinar for the user's region(s), hide the header banner completely
    if (scheduledRegions.length === 0) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }

    const langLabels = { en: '🇬🇧 EN', es: '🇪🇸 ES', fr: '🇫🇷 FR', de: '🇩🇪 DE', nl: '🇳🇱 NL', sv: '🇸🇪 SV', it: '🇮🇹 IT', pl: '🇵🇱 PL', uk: '🇺🇦 UK/BG', ar: '🇦🇪 AR', bilingual: '🌐 ES/EN' };

    const webinarCardsHtml = scheduledRegions.map(({ rId, regMeta, wCfg }) => {
      const refParam = freshUser.referralCode ? `&ref=${encodeURIComponent(freshUser.referralCode)}` : '';
      const regWebinarUrl = `https://thespainconnection.com/index.html#webinar?region=${encodeURIComponent(rId)}${refParam}`;
      const langBadge = langLabels[wCfg.language || 'en'] || '🌐';

      return `
        <div style="background:#fff; border:1px solid ${regMeta.border}; border-left:4px solid ${regMeta.color}; border-radius:10px; padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div style="min-width:180px; flex:1;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:0.78rem; font-weight:800; color:${regMeta.color};">
              <span>${regMeta.icon} <span class="lang-en">${App.utils.escapeHtml(regMeta.shortEn)}</span><span class="lang-es">${App.utils.escapeHtml(regMeta.shortEs)}</span></span>
              <span style="background:${wCfg.activeType === 'b2b' ? '#003f99' : '#059669'}; color:#fff; padding:1px 7px; border-radius:999px; font-size:0.68rem;">${(wCfg.activeType || 'b2c').toUpperCase()}</span>
              <span style="background:#f1f5f9; color:#334155; padding:1px 6px; border-radius:6px; font-size:0.68rem;">${langBadge}</span>
            </div>
            <div style="font-weight:700; font-size:0.86rem; color:#0f172a; margin-top:3px;">🎙️ ${App.utils.escapeHtml(wCfg.title || 'Webinar')}</div>
            <div style="font-size:0.76rem; color:#64748b; margin-top:1px;">📅 ${App.utils.escapeHtml(wCfg.date || '')} · ⏰ ${App.utils.escapeHtml(wCfg.time || '18:00')} CET (<span class="lang-en">Spain</span><span class="lang-es">España</span>)</div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:5px 10px; white-space:nowrap;" onclick="App.utils.copyToClipboard('${regWebinarUrl}')">
            📋 <span class="lang-en">Copy Region Webinar Link</span><span class="lang-es">Link Webinar Región</span>
          </button>
        </div>
      `;
    }).join('');

    const isMasAgent = freshUser.role === 'agent_inmomas';
    const titleEs = isMasAgent ? '🇪🇸 Tu Visión Regional RE/MAX Inmomás' : '🌍 Tu Mercado Regional y Webinario Activo';
    const titleEn = isMasAgent ? '🇪🇸 Your RE/MAX Inmomás Regional Hub' : '🌍 Your Regional Market & Active Webinar';

    el.style.display = 'block';
    el.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(0,63,153,0.05) 0%, rgba(16,185,129,0.05) 100%); border:1px solid rgba(0,63,153,0.18); border-radius:14px; padding:16px 18px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <strong style="font-size:0.95rem; color:#0f172a;"><span class="lang-en">${titleEn}</span><span class="lang-es">${titleEs}</span></strong>
            ${nat ? `<span style="background:#fff; border:1px solid #cbd5e1; color:#334155; padding:2px 9px; border-radius:999px; font-size:0.76rem; font-weight:700;">🏳️ ${App.utils.escapeHtml(nat)}</span>` : ''}
            ${App.utils.getUserRegionBadgesHtml(freshUser)}
          </div>
          <a href="#profile" class="btn btn-outline btn-sm" style="font-size:0.76rem; padding:4px 10px;">
            ⚙️ <span class="lang-en">Edit Country / Region</span><span class="lang-es">Editar País / Región</span>
          </a>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px;">
          ${webinarCardsHtml}
        </div>
      </div>
    `;
  } catch (err) {
    console.warn('[RegionalBanner] Render warning:', err);
    el.innerHTML = '';
    el.style.display = 'none';
  }
};

/* ============================================
   Umbrella Hierarchy & RE/MAX Inmomás Agent Resolvers
   ============================================ */
App.utils._buildUserLookupMaps = function(allUsers = []) {
  const byId = new Map();
  const byCode = new Map();
  const byEmail = new Map();
  const inmomasAgents = [];

  (allUsers || []).forEach(u => {
    if (!u) return;
    if (u.id) byId.set(u.id, u);
    if (u.referralCode) byCode.set(String(u.referralCode).toUpperCase().trim(), u);
    if (u.email) byEmail.set(String(u.email).toLowerCase().trim(), u);
    if (u.role === 'agent_inmomas') inmomasAgents.push(u);
  });

  return { byId, byCode, byEmail, inmomasAgents };
};

App.utils.resolveUserUmbrellaParents = function(user, allUsers = [], maps = null) {
  if (!user) return { embajador: null, broker: null, directParent: null };
  const lk = maps || App.utils._buildUserLookupMaps(allUsers);

  const findRefUser = (refVal) => {
    if (!refVal) return null;
    const raw = String(refVal).trim();
    return lk.byId.get(raw) || lk.byCode.get(raw.toUpperCase()) || lk.byEmail.get(raw.toLowerCase()) || null;
  };

  let broker = (user.brokerId && lk.byId.get(user.brokerId)) || null;
  let embajador = (user.embajadorId && lk.byId.get(user.embajadorId)) || null;
  let directParent = null;

  const visited = new Set([user.id]);
  let cursor = user;
  let depth = 0;

  while (cursor && depth < 6) {
    depth++;
    let parent = findRefUser(cursor.referredBy);
    if (parent && parent.role === 'agent_inmomas') {
      parent = null;
    }
    // Business rule: a Colaborador can be under a Broker or an Embajador, NEVER under a Realtor/Agent
    if (parent && user.role === 'colaborador' && parent.role === 'realtor') {
      parent = null;
    }
    if (!parent && cursor.brokerId && lk.byId.has(cursor.brokerId)) {
      parent = lk.byId.get(cursor.brokerId);
    }
    if (!parent && cursor.embajadorId && lk.byId.has(cursor.embajadorId)) {
      parent = lk.byId.get(cursor.embajadorId);
    }

    if (!parent || visited.has(parent.id)) break;
    visited.add(parent.id);

    if (!directParent) directParent = parent;
    if (parent.role === 'broker' && !broker && user.role !== 'broker' && user.role !== 'embajador') {
      broker = parent;
    }
    if (parent.role === 'embajador' && !embajador && user.role !== 'embajador') {
      embajador = parent;
    }
    if (!embajador && parent.embajadorId && lk.byId.has(parent.embajadorId) && user.role !== 'embajador') {
      embajador = lk.byId.get(parent.embajadorId);
    }

    cursor = parent;
  }

  if (broker && !embajador && user.role !== 'embajador') {
    if (broker.embajadorId && lk.byId.has(broker.embajadorId)) {
      embajador = lk.byId.get(broker.embajadorId);
    } else if (broker.referredBy) {
      const brkRef = findRefUser(broker.referredBy);
      if (brkRef && brkRef.role === 'embajador') embajador = brkRef;
      else if (brkRef && brkRef.embajadorId && lk.byId.has(brkRef.embajadorId)) embajador = lk.byId.get(brkRef.embajadorId);
    }
  }

  // Upward Broker attachment: if this Broker registered without an Embajador link,
  // but is assigned to a Realtor who already belongs to an Embajador's umbrella,
  // attach this Broker to that Embajador's umbrella automatically.
  if (user.role === 'broker' && !embajador && Array.isArray(allUsers)) {
    for (const member of allUsers) {
      if (!member || member.id === user.id || member.brokerId !== user.id) continue;
      if (member.embajadorId && lk.byId.has(member.embajadorId)) {
        embajador = lk.byId.get(member.embajadorId);
        break;
      }
      if (member.referredBy) {
        const mRef = findRefUser(member.referredBy);
        if (mRef && mRef.role === 'embajador') {
          embajador = mRef;
          break;
        }
        if (mRef && mRef.embajadorId && lk.byId.has(mRef.embajadorId)) {
          embajador = lk.byId.get(mRef.embajadorId);
          break;
        }
      }
    }
  }

  if (broker && user.role !== 'broker' && user.role !== 'embajador') {
    directParent = broker;
  }

  return { embajador, broker, directParent };
};

App.utils.resolveAssignedInmomasAgent = function(user, allUsers = [], maps = null) {
  if (!user) return { agent: null, name: '', id: null, inherited: false, inheritedFrom: null };
  if (user.role === 'agent_inmomas') {
    const selfName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return { agent: user, name: selfName, id: user.id, inherited: false, inheritedFrom: null };
  }

  const lk = maps || App.utils._buildUserLookupMaps(allUsers);

  const matchDirectAgent = (u) => {
    if (!u) return null;
    if (u.inmomasAgentId && lk.byId.has(u.inmomasAgentId)) {
      const a = lk.byId.get(u.inmomasAgentId);
      if (a && a.role === 'agent_inmomas') {
        return { agent: a, name: `${a.firstName || ''} ${a.lastName || ''}`.trim() };
      }
    }
    if (u.inmomasAgentCode) {
      const codeKey = String(u.inmomasAgentCode).toUpperCase().trim();
      const a = lk.byCode.get(codeKey) || lk.byId.get(String(u.inmomasAgentCode).trim());
      if (a && a.role === 'agent_inmomas') {
        return { agent: a, name: `${a.firstName || ''} ${a.lastName || ''}`.trim() };
      }
    }
    if (u.referredBy) {
      const raw = String(u.referredBy).trim();
      const refU = lk.byId.get(raw) || lk.byCode.get(raw.toUpperCase()) || lk.byEmail.get(raw.toLowerCase());
      if (refU && refU.role === 'agent_inmomas') {
        return { agent: refU, name: `${refU.firstName || ''} ${refU.lastName || ''}`.trim() };
      }
    }
    if (u.inmomasAgentName) {
      const rawName = String(u.inmomasAgentName).trim();
      if (rawName) {
        const lower = rawName.toLowerCase();
        const found = lk.inmomasAgents.find(a => {
          const full = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
          return full === lower || (a.referralCode && a.referralCode.toLowerCase() === lower) || (a.email && a.email.toLowerCase() === lower);
        });
        if (found) {
          return { agent: found, name: `${found.firstName || ''} ${found.lastName || ''}`.trim() };
        }
        return { agent: null, name: rawName };
      }
    }
    return null;
  };

  const direct = matchDirectAgent(user);
  if (direct) {
    return {
      agent: direct.agent,
      name: direct.name,
      id: direct.agent ? direct.agent.id : null,
      inherited: false,
      inheritedFrom: null
    };
  }

  // Check pre-enriched field if passed from getUmbrellaData
  if (user._inmomasAgentName) {
    return {
      agent: null,
      name: user._inmomasAgentName,
      id: user._inmomasAgentId || null,
      inherited: Boolean(user._inmomasAgentInherited),
      inheritedFrom: user._inmomasAgentInheritedFrom || null
    };
  }

  // Walk up Broker -> Embajador to inherit office/umbrella RE/MAX Inmomás agent
  const { broker, embajador } = App.utils.resolveUserUmbrellaParents(user, allUsers, lk);
  if (broker) {
    const fromBroker = matchDirectAgent(broker);
    if (fromBroker) {
      return {
        agent: fromBroker.agent,
        name: fromBroker.name,
        id: fromBroker.agent ? fromBroker.agent.id : null,
        inherited: true,
        inheritedFrom: 'Broker'
      };
    }
  }
  if (embajador) {
    const fromEmb = matchDirectAgent(embajador);
    if (fromEmb) {
      return {
        agent: fromEmb.agent,
        name: fromEmb.name,
        id: fromEmb.agent ? fromEmb.agent.id : null,
        inherited: true,
        inheritedFrom: 'Embajador'
      };
    }
  }

  return { agent: null, name: '', id: null, inherited: false, inheritedFrom: null };
};

App.utils.renderInmomasAgentBadge = function(user, allUsers = [], opts = {}) {
  const { showUnassigned = true, compact = false, maps = null } = opts;
  const res = App.utils.resolveAssignedInmomasAgent(user, allUsers, maps);

  if (!res.name) {
    if (!showUnassigned) return '';
    return `<span class="inmomas-agent-pill inmomas-agent-pill--unassigned" title="Sin Agente RE/MAX Inmomás asignado">🇪🇸 <span class="lang-en">No Inmomás Agent</span><span class="lang-es">Sin Agente Inmomás</span></span>`;
  }

  const escapedName = App.utils.escapeHtml(res.name);
  const viaSuffix = res.inherited && res.inheritedFrom
    ? ` <span style="opacity:0.78; font-weight:600; font-size:0.68rem;">(${res.inheritedFrom === 'Broker' ? 'vía Broker' : 'vía Embajador'})</span>`
    : '';
  const prefix = compact ? '🇪🇸' : '🇪🇸 Inmomás:';
  const cls = res.inherited ? 'inmomas-agent-pill inmomas-agent-pill--inherited' : 'inmomas-agent-pill';
  const titleText = res.inherited
    ? `Agente RE/MAX Inmomás asignado vía ${res.inheritedFrom}: ${escapedName}`
    : `Agente RE/MAX Inmomás asignado: ${escapedName}`;

  return `<span class="${cls}" title="${titleText}">${prefix} ${escapedName}${viaSuffix}</span>`;
};







