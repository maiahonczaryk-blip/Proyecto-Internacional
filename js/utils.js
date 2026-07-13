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
  // (preview deployments on Vercel require authentication)
  const prodUrl = 'https://proyecto-internacional.vercel.app';
  return `${prodUrl}/index.html#referral?ref=${encodeURIComponent(referralCode)}`;
};

/* ---- Status Helpers ---- */
App.utils.clientStatusLabels = {
  'contacted': 'Contactado',
  'options_sent': 'Enviadas Opciones',
  'properties_visited': 'Visitado Propiedades',
  'offer_made': 'Oferta Hecha',
  'notary_pending': 'Notaría Pendiente',
  'closed': 'Cerrado'
};

App.utils.clientStatusOrder = [
  'contacted', 'options_sent', 'properties_visited',
  'offer_made', 'notary_pending', 'closed'
];

App.utils.getStatusLabel = function(status) {
  return App.utils.clientStatusLabels[status] || status;
};

App.utils.getStatusBadgeClass = function(status) {
  const map = {
    'contacted': 'badge--info',
    'options_sent': 'badge--info',
    'properties_visited': 'badge--active',
    'offer_made': 'badge--warning',
    'notary_pending': 'badge--closing',
    'closed': 'badge--completed',
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
  return `<span class="badge ${App.utils.getStatusBadgeClass(status)}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
};

App.utils.getRoleBadge = function(role) {
  const classes = { admin: 'badge--admin', broker: 'badge--broker', realtor: 'badge--realtor' };
  return `<span class="badge ${classes[role] || ''}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`;
};

/* ---- Avatar Generation ---- */
App.utils.getInitials = function(firstName, lastName) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
};

App.utils.generateAvatar = function(firstName, lastName, size = 'md') {
  const initials = App.utils.getInitials(firstName, lastName);
  const colors = ['#0043ff', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
  const hash = (firstName + lastName).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
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
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

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
  { key: 'contacted',           label: 'Contactado',           statuses: ['contacted'] },
  { key: 'options_sent',        label: 'Enviadas Opciones',    statuses: ['options_sent'] },
  { key: 'properties_visited',  label: 'Visitado Propiedades', statuses: ['properties_visited'] },
  { key: 'offer_made',          label: 'Oferta Hecha',         statuses: ['offer_made'] },
  { key: 'notary_pending',      label: 'Notaría Pendiente',    statuses: ['notary_pending'] },
  { key: 'closed',              label: 'Cerrado',              statuses: ['closed'] }
];

App.utils.columnColors = {
  contacted: '#6b7280', options_sent: '#3b82f6', properties_visited: '#f59e0b',
  offer_made: '#ef4444', notary_pending: '#ec4899', closed: '#10b981'
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

      return `
        <div class="pipeline-card" style="cursor: ${isInteractive ? 'grab' : 'pointer'}; margin-bottom: 0.75rem; background: var(--bg-card); border-radius: var(--radius-sm); padding: 12px; box-shadow: var(--shadow-sm); border-top: 3px solid ${App.utils.columnColors[col.key]}; transition: transform 0.2s;"
             draggable="${isInteractive ? 'true' : 'false'}"
             ${isInteractive ? `ondragstart="App.utils.handleDragStart(event, '${c.id}')" ondragend="App.utils.handleDragEnd(event)"` : ''}
             onclick="${onCardClickGlobalFnName}('${c.id}')">
          ${realtorLabel}
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
        <div class="pipeline-column__header" style="border-top: 4px solid ${color}; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-radius: var(--radius-md) var(--radius-md) 0 0; background: var(--bg-card); border-bottom: 1px solid var(--border-subtle);">
          <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${col.label}</span>
          <span class="badge" style="background: ${color}20; color: ${color}; font-size: 0.75rem; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">
            ${colClients.length}
          </span>
        </div>
        <div style="padding: 12px; flex: 1; min-height: 200px;">
          ${cards || `<div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 2rem 1rem; border: 2px dashed rgba(0,0,0,0.05); border-radius: 8px;">Arrastra clientes aquí</div>`}
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
