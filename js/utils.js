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
  // Always use the production URL so referral links are publicly accessible
  const prodUrl = 'https://thespainconnection.com';
  return `${prodUrl}/index.html#referral?ref=${encodeURIComponent(referralCode || '')}`;
};

/* ---- Share Webinar & Partner Helpers ---- */
App.utils.getClientWebinarShareMessage = function(referralLink) {
  const user = App.auth ? App.auth.getCurrentUser() : null;
  const link = referralLink || (user?.referralCode ? App.utils.generateReferralLink(user.referralCode) : 'https://thespainconnection.com/index.html#webinar');
  const lang = (document.documentElement.lang || 'en').toLowerCase();
  if (lang.startsWith('es')) {
    return `🇪🇸 ¡Hola! Te comparto mi enlace personalizado de The Spain Connection para recibir asesoría integral sobre cómo comprar, mudarse e invertir con total seguridad en España.\n\n📌 Respaldo legal, fiscal, hipotecario e inmobiliario completo en destino.\n\n🔗 Solicita información o regístrate aquí: ${link}`;
  }
  return `🇪🇸 Hello! Here is my personalized link with The Spain Connection for turnkey advisory on buying property, relocating, and investing safely in Spain.\n\n📌 Full legal, tax, mortgage, and real estate destination support.\n\n🔗 Request information or register here: ${link}`;
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
App.utils.clientStatusLabels = {
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
  return App.utils.clientStatusLabels[status] || status;
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
  const safeStatus = status || 'pending';
  return `<span class="badge ${App.utils.getStatusBadgeClass(safeStatus)}">${safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}</span>`;
};

App.utils.getRoleBadge = function(role) {
  const safeRole = role || 'user';
  const classes = { admin: 'badge--admin', broker: 'badge--broker', realtor: 'badge--realtor', agent_inmomas: 'badge--agent', colaborador: 'badge--agent' };
  let displayName = safeRole.charAt(0).toUpperCase() + safeRole.slice(1);
  if (safeRole === 'agent_inmomas') displayName = 'Agente Inmomás';
  if (safeRole === 'colaborador') displayName = 'Colaborador';
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
  { key: 'contacted',               label: 'Seguimiento',                                statuses: ['contacted', 'new', 'seguimiento'] },
  { key: 'service_presentation',    label: 'Reunión de Presentación de Servicios',       statuses: ['service_presentation'] },
  { key: 'mandate_signed',          label: 'Mandato de Representación Firmado',          statuses: ['mandate_signed'] },
  { key: 'first_property_meeting',  label: 'Primera Reunión para Presentar Propiedades', statuses: ['first_property_meeting', 'options_sent'] },
  { key: 'second_property_meeting', label: 'Segunda Reunión para Presentar Propiedades', statuses: ['second_property_meeting'] },
  { key: 'properties_visited',      label: 'Visitas a Propiedades',                      statuses: ['properties_visited'] },
  { key: 'negotiation',             label: 'Negociación',                                statuses: ['negotiation', 'offer_made', 'notary_pending'] },
  { key: 'closed',                  label: 'Cierre',                                     statuses: ['closed', 'completed'] }
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

App.utils.renderKanbanBoard = function(containerId, clients, onCardClickGlobalFnName, getRealtorNameFn = null, onDropCallbackGlobalFnName = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isInteractive = !!onDropCallbackGlobalFnName;

  const columns = App.utils.PIPELINE_COLUMNS.map(col => {
    const colClients = clients.filter(c => col.statuses.includes(c.status));

    const cards = colClients.map(c => {
      const lastUpdate = (c.statusHistory && c.statusHistory.length > 0)
        ? c.statusHistory[c.statusHistory.length - 1].date
        : c.createdAt;
        
      const realtorLabel = getRealtorNameFn ? `<div style="font-size: 0.75rem; color: #4f46e5; margin-bottom: 0.25rem; font-weight: 600;">👤 ${App.utils.escapeHtml(getRealtorNameFn(c.referredBy))}</div>` : '';
      
      const localAgentName = c.localAgentName || 'Sin asignar / Unassigned';
      const agentLabel = `<div style="font-size: 0.75rem; color: #b45309; margin-bottom: 0.25rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">🇪🇸 ${App.utils.escapeHtml(localAgentName)}</div>`;

      const clientTag = c.tag || App.utils.getClientTag(c);
      const tagBadge = App.utils.getClientTagBadge ? App.utils.getClientTagBadge(clientTag) : '';

      return `
        <div class="pipeline-card" style="cursor: ${isInteractive ? 'grab' : 'pointer'}; margin-bottom: 0.75rem; background: var(--bg-card); border-radius: var(--radius-sm); padding: 12px; box-shadow: var(--shadow-sm); border-top: 3px solid ${App.utils.columnColors[col.key]}; transition: transform 0.2s;"
             draggable="${isInteractive ? 'true' : 'false'}"
             ${isInteractive ? `ondragstart="App.utils.handleDragStart(event, '${c.id}')" ondragend="App.utils.handleDragEnd(event)"` : ''}
             onclick="${onCardClickGlobalFnName}('${c.id}')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; gap: 6px;">
            <div style="flex: 1;">${realtorLabel}</div>
            <div>${tagBadge}</div>
          </div>
          ${agentLabel}
          <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-primary);">
            ${App.utils.escapeHtml(c.firstName)} ${App.utils.escapeHtml(c.lastName)}
          </div>
          <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">
            📍 ${App.utils.escapeHtml(c.interestArea || '—')}
          </div>
          <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">
            💰 ${App.utils.escapeHtml(c.budget || '—')}
          </div>
          <div style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.5rem;">
            Updated: ${App.utils.formatDateRelative(lastUpdate)}
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
          ${cards || `<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 2rem 1rem; border: 2px dashed rgba(0,0,0,0.05); border-radius: 8px; margin: 12px 0;">Arrastra clientes aquí</div>`}
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

/* ---- Shared Contract Fiscal & Bank Data Section (Broker & Realtor) ---- */
App.utils.renderContractDataSection = function(containerEl, user, prefix = 'contract', onSuccessCallback = null) {
  if (!containerEl || !user) return;

  const status = user.agreementStatus || 'none'; // 'none' | 'data_submitted' | 'uploaded' | 'signed'
  const saved = user.contractCompanyData || {};
  const isBroker = user.role === 'broker';
  const defaultBrokerName = isBroker
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : (user.brokerNameManual || '');

  let statusBannerHtml = '';
  if (status === 'signed') {
    statusBannerHtml = `
      <div style="display:flex; align-items:center; gap:1rem; padding:1.25rem; background:#d1fae5; border-radius:0.75rem; margin-bottom:1.5rem; border:1px solid #a7f3d0; text-align:left;">
        <span style="font-size:2rem;">✅</span>
        <div>
          <div style="font-weight:700; color:#065f46; font-size:1rem;">
            <span class="lang-en">Collaboration Agreement — Signed &amp; Active</span>
            <span class="lang-es">Acuerdo de Colaboración — Firmado y Activo</span>
            <span class="lang-fr">Accord de Collaboration — Signé et Actif</span>
            <span class="lang-en-ca">Collaboration Agreement — Signed &amp; Active</span>
          </div>
          <div style="font-size:0.85rem; color:#047857; margin-top:4px;">
            <span class="lang-en">Your partnership agreement has been formalized. Signed on ${App.utils.formatDate(user.agreementSignedAt)}.</span>
            <span class="lang-es">Tu acuerdo de colaboración conjunta está formalizado y activo. Fecha: ${App.utils.formatDate(user.agreementSignedAt)}.</span>
            <span class="lang-fr">Votre accord de partenariat est actif. Signé le ${App.utils.formatDate(user.agreementSignedAt)}.</span>
            <span class="lang-en-ca">Your partnership agreement has been formalized. Signed on ${App.utils.formatDate(user.agreementSignedAt)}.</span>
          </div>
          ${user.agreementFinalUrl ? `
            <div style="margin-top:10px;">
              <a href="${App.utils.escapeHtml(user.agreementFinalUrl)}" target="_blank" class="btn btn-primary btn-sm" style="padding:5px 12px;font-size:0.8rem;color:white;">
                📥 <span class="lang-en">Download Signed Agreement</span><span class="lang-es">Descargar Acuerdo Firmado</span>
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
            <span class="lang-en">Company &amp; Bank Details Received — Preparing Your Contract</span>
            <span class="lang-es">Datos Fiscales y Bancarios Recibidos — Contrato en Preparación</span>
            <span class="lang-fr">Données Fiscales et Bancaires Reçues — Contrat en Préparation</span>
            <span class="lang-en-ca">Company &amp; Bank Details Received — Preparing Your Contract</span>
          </div>
          <div style="font-size:0.85rem; color:#047857; margin-top:4px; line-height:1.5;">
            <span class="lang-en">Our administration team has been notified and is preparing your custom Collaboration Agreement externally. We will present it directly to the Broker and Agent for signature. You may update your details below at any time.</span>
            <span class="lang-es">Nuestro equipo de administración ya ha recibido la notificación con tus datos y está preparando vuestro Acuerdo de Colaboración de forma externa. Os lo presentaremos directamente al Broker y al Agente para su firma. Si necesitas actualizar algún dato, puedes modificarlo y guardarlo abajo.</span>
            <span class="lang-fr">Notre équipe administrative a été notifiée et prépare votre accord de collaboration. Nous le présenterons au Broker et à l'Agent pour signature.</span>
            <span class="lang-en-ca">Our administration team has been notified and is preparing your custom Collaboration Agreement externally. We will present it directly to the Broker and Agent for signature.</span>
          </div>
        </div>
      </div>`;
  } else {
    statusBannerHtml = `
      <div style="padding:1.25rem; background:#fef3c7; border-radius:0.75rem; margin-bottom:1.25rem; border:1px solid #fde68a; text-align:left;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
          <span style="font-size:1.5rem;">📝</span>
          <div style="font-weight:700; color:#92400e; font-size:1rem;">
            <span class="lang-en">Step Required: Provide Company Tax &amp; Banking Information for Your Agreement</span>
            <span class="lang-es">Paso Requerido: Facilitar Datos Fiscales y Bancarios para el Acuerdo de Colaboración</span>
            <span class="lang-fr">Étape Requise : Fournir les Informations Fiscales et Bancaires pour l'Accord</span>
            <span class="lang-en-ca">Step Required: Provide Company Tax &amp; Banking Information for Your Agreement</span>
          </div>
        </div>
        <p style="font-size:0.85rem; color:#78350f; margin:0; line-height:1.5;">
          <span class="lang-en">To formalize the joint Collaboration Agreement between your Brokerage and RE/MAX Inmomás, please complete and save the form below with your company's tax and banking details. We prepare the contract externally and present it directly to the Broker and Agent.</span>
          <span class="lang-es">Para formalizar el documento de colaboración conjunta con los Brokers y Agentes, necesitamos que rellenes y guardes el siguiente formulario con los datos fiscales de la empresa y la cuenta bancaria. Con esta información nosotros armaremos el contrato de forma externa a la plataforma y os lo presentaremos al Broker y al Agente.</span>
          <span class="lang-fr">Pour formaliser l'accord de collaboration conjointe, veuillez remplir et enregistrer le formulaire ci-dessous avec les coordonnées fiscales et bancaires de l'entreprise.</span>
          <span class="lang-en-ca">To formalize the joint Collaboration Agreement between your Brokerage and RE/MAX Inmomás, please complete and save the form below with your company's tax and banking details.</span>
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
            <span class="lang-en">Fill Out Company &amp; Tax Data</span>
            <span class="lang-es">Rellenar Datos de Empresa y Fiscales</span>
            <span class="lang-fr">Remplir les Données Fiscales</span>
            <span class="lang-en-ca">Fill Out Company &amp; Tax Data</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:#374151; margin:0; line-height:1.45;">
          <span class="lang-en">The Broker (or the Agent with data provided by their Broker) completes the company's legal, tax (EIN/Tax ID), and corporate bank account details below and saves them.</span>
          <span class="lang-es">El Broker (o el Agente con los datos facilitados por su Broker) completa los datos legales, fiscales de la empresa y la cuenta bancaria para el cobro de comisiones, y los guarda en este formulario.</span>
          <span class="lang-fr">Le Broker (ou l'Agent avec les informations de son Broker) complète les données fiscales et bancaires de l'entreprise ci-dessous.</span>
          <span class="lang-en-ca">The Broker (or the Agent with data provided by their Broker) completes the company's legal, tax, and corporate bank account details below and saves them.</span>
        </p>
      </div>

      <div style="background:#eff6ff; border:1.5px solid #bfdbfe; border-radius:0.75rem; padding:1.15rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
          <span style="font-size:1.3rem;">2️⃣</span>
          <div style="font-weight:700; color:#1d4ed8; font-size:0.92rem;">
            <span class="lang-en">We Draft the Contract Externally</span>
            <span class="lang-es">Armamos el Contrato de Forma Externa</span>
            <span class="lang-fr">Préparation Externe du Contrat</span>
            <span class="lang-en-ca">We Draft the Contract Externally</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:#374151; margin:0; line-height:1.45;">
          <span class="lang-en">As soon as you save these details, our administration panel receives an automatic notification and our team prepares your tailored Collaboration Agreement outside the platform.</span>
          <span class="lang-es">Al guardar los datos, nuestro panel de administración recibe una notificación automática y nuestro equipo arma el contrato personalizado de forma externa a la plataforma.</span>
          <span class="lang-fr">Dès l'enregistrement, notre administration reçoit une notification et prépare votre contrat personnalisé en externe.</span>
          <span class="lang-en-ca">As soon as you save these details, our administration panel receives an automatic notification and our team prepares your tailored Collaboration Agreement outside the platform.</span>
        </p>
      </div>

      <div style="background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:0.75rem; padding:1.15rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
          <span style="font-size:1.3rem;">3️⃣</span>
          <div style="font-weight:700; color:#166534; font-size:0.92rem;">
            <span class="lang-en">Personal Presentation &amp; Signature</span>
            <span class="lang-es">Presentación y Firma con Broker y Agente</span>
            <span class="lang-fr">Présentation et Signature</span>
            <span class="lang-en-ca">Personal Presentation &amp; Signature</span>
          </div>
        </div>
        <p style="font-size:0.82rem; color:#374151; margin:0; line-height:1.45;">
          <span class="lang-en">Once drafted, we present the agreement directly to the Broker and the Agent to review it together, answer any questions, and complete the signature seamlessly.</span>
          <span class="lang-es">Una vez preparado el documento, os lo presentamos directamente al Broker y al Agente para revisarlo juntos con total claridad y proceder a la firma.</span>
          <span class="lang-fr">Une fois prêt, nous présentons le contrat directement au Broker et à l'Agent pour signature.</span>
          <span class="lang-en-ca">Once drafted, we present the agreement directly to the Broker and the Agent to review it together and complete the signature seamlessly.</span>
        </p>
      </div>
    </div>

    <!-- Form for Fiscal & Banking Details -->
    <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:0.875rem; padding:1.5rem; box-shadow:0 4px 12px rgba(15,23,42,0.04); text-align:left;">
      <h3 style="margin:0 0 0.35rem; font-size:1.05rem; color:#0f172a; display:flex; align-items:center; gap:0.5rem;">
        🏢 <span class="lang-en">Company Tax &amp; Banking Information Form</span>
        <span class="lang-es">Formulario de Datos Fiscales de la Empresa y Cuenta Bancaria</span>
        <span class="lang-fr">Formulaire de Données Fiscales et Bancaires de l'Entreprise</span>
        <span class="lang-en-ca">Company Tax &amp; Banking Information Form</span>
      </h3>
      <p style="font-size:0.82rem; color:#64748b; margin:0 0 1.25rem;">
        <span class="lang-en">Please complete these details accurately so our team can prepare your Collaboration Agreement.</span>
        <span class="lang-es">Completa estos datos para que podamos redactar y presentaros el Acuerdo de Colaboración Conjunta.</span>
        <span class="lang-fr">Veuillez remplir ces informations pour que nous puissions préparer votre accord de collaboration.</span>
        <span class="lang-en-ca">Please complete these details accurately so our team can prepare your Collaboration Agreement.</span>
      </p>

      <form id="${prefix}-company-data-form" style="display:grid; gap:1.25rem;">
        <!-- Block 1: Datos Fiscales de la Empresa -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.65rem; padding:1.15rem;">
          <h4 style="margin:0 0 0.85rem; font-size:0.9rem; color:#1e3a8a; text-transform:uppercase; letter-spacing:0.03em;">
            📑 <span class="lang-en">1. Company &amp; Tax Details (Brokerage)</span>
            <span class="lang-es">1. Datos de la Empresa y Datos Fiscales (Brokerage)</span>
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Legal Company Name (Razón Social) *</span>
                <span class="lang-es">Razón Social / Nombre Legal de la Empresa *</span>
              </label>
              <input type="text" id="${prefix}-legal-name" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. RE/MAX Premier Realty LLC" value="${App.utils.escapeHtml(saved.companyLegalName || user.agencyName || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Tax ID / EIN / CIF / Corporate ID *</span>
                <span class="lang-es">NIF / CIF / Tax ID / EIN Fiscal *</span>
              </label>
              <input type="text" id="${prefix}-tax-id" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. 12-3456789 / B-12345678" value="${App.utils.escapeHtml(saved.taxId || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Brokerage License Number</span>
                <span class="lang-es">Nº de Licencia Inmobiliaria (Brokerage License)</span>
              </label>
              <input type="text" id="${prefix}-license-number" class="form-input" style="margin-bottom:0; width:100%;" placeholder="Ej. CQ1056789" value="${App.utils.escapeHtml(saved.licenseNumber || '')}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Country *</span>
                <span class="lang-es">País *</span>
              </label>
              <input type="text" id="${prefix}-country" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="United States / Canada / España" value="${App.utils.escapeHtml(saved.country || user.country || '')}">
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
                <span class="lang-en">Managing Broker / Legal Representative Name *</span>
                <span class="lang-es">Nombre Completo del Broker / Representante Legal *</span>
              </label>
              <input type="text" id="${prefix}-broker-name" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Nombre y Apellidos del Broker" value="${App.utils.escapeHtml(saved.brokerFullName || defaultBrokerName)}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Broker Email *</span>
                <span class="lang-es">Email del Broker *</span>
              </label>
              <input type="email" id="${prefix}-broker-email" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="broker@agency.com" value="${App.utils.escapeHtml(saved.brokerEmail || (isBroker ? user.email : ''))}">
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Broker Phone *</span>
                <span class="lang-es">Teléfono del Broker *</span>
              </label>
              <input type="tel" id="${prefix}-broker-phone" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="+1 555 000 0000" value="${App.utils.escapeHtml(saved.brokerPhone || (isBroker ? user.phone : ''))}">
            </div>
          </div>
        </div>

        <!-- Block 2: Datos Bancarios -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:0.65rem; padding:1.15rem;">
          <h4 style="margin:0 0 0.85rem; font-size:0.9rem; color:#065f46; text-transform:uppercase; letter-spacing:0.03em;">
            🏦 <span class="lang-en">2. Corporate Bank Account Details (For Commission Payments)</span>
            <span class="lang-es">2. Datos de Cuenta Bancaria (Para Pago de Comisiones)</span>
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.85rem;">
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:#334155; display:block; margin-bottom:4px;">
                <span class="lang-en">Account Holder Name (Beneficiary Company) *</span>
                <span class="lang-es">Titular de la Cuenta Bancaria (Empresa) *</span>
              </label>
              <input type="text" id="${prefix}-bank-holder" class="form-input" required style="margin-bottom:0; width:100%;" placeholder="Ej. RE/MAX Premier Realty LLC" value="${App.utils.escapeHtml(saved.bankAccountHolder || saved.companyLegalName || user.agencyName || '')}">
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
                <span class="lang-en">Additional Notes / Referring Agent Details (Optional)</span>
                <span class="lang-es">Notas Adicionales o Datos del Agente Asociado (Opcional)</span>
              </label>
              <textarea id="${prefix}-notes" class="form-input" rows="2" style="margin-bottom:0; width:100%; resize:vertical;" placeholder="Cualquier observación adicional para la redacción del contrato...">${App.utils.escapeHtml(saved.additionalNotes || '')}</textarea>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div id="${prefix}-save-status" style="font-size:0.85rem; color:#047857; font-weight:600;">
            ${saved.submittedAt ? `✅ <span class="lang-en">Last saved:</span><span class="lang-es">Última actualización:</span> ${App.utils.formatDate(saved.submittedAt)}` : ''}
          </div>
          <button type="submit" class="btn btn-primary" id="${prefix}-submit-btn" style="padding:0.75rem 1.75rem; font-weight:700; border-radius:0.6rem;">
            💾 <span class="lang-en">Save Details &amp; Notify Administration</span>
            <span class="lang-es">Guardar Datos y Enviar a Administración</span>
            <span class="lang-fr">Enregistrer et Notifier l'Administration</span>
            <span class="lang-en-ca">Save Details &amp; Notify Administration</span>
          </button>
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
    const contractCompanyData = {
      companyLegalName: (document.getElementById(`${prefix}-legal-name`)?.value || '').trim(),
      taxId:            (document.getElementById(`${prefix}-tax-id`)?.value || '').trim(),
      licenseNumber:    (document.getElementById(`${prefix}-license-number`)?.value || '').trim(),
      country:          (document.getElementById(`${prefix}-country`)?.value || '').trim(),
      fiscalAddress:    (document.getElementById(`${prefix}-fiscal-address`)?.value || '').trim(),
      brokerFullName:   (document.getElementById(`${prefix}-broker-name`)?.value || '').trim(),
      brokerEmail:      (document.getElementById(`${prefix}-broker-email`)?.value || '').trim(),
      brokerPhone:      (document.getElementById(`${prefix}-broker-phone`)?.value || '').trim(),
      bankAccountHolder:(document.getElementById(`${prefix}-bank-holder`)?.value || '').trim(),
      bankName:         (document.getElementById(`${prefix}-bank-name`)?.value || '').trim(),
      bankAccountNumber:(document.getElementById(`${prefix}-bank-account`)?.value || '').trim(),
      bankSwiftRouting: (document.getElementById(`${prefix}-bank-swift`)?.value || '').trim(),
      bankAddress:      (document.getElementById(`${prefix}-bank-address`)?.value || '').trim(),
      additionalNotes:  (document.getElementById(`${prefix}-notes`)?.value || '').trim(),
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




