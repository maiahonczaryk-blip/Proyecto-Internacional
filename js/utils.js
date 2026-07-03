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
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#register?ref=${referralCode}`;
};

/* ---- Status Helpers ---- */
App.utils.clientStatusLabels = {
  'registered': 'Registered',
  'webinar_scheduled': 'Webinar Scheduled',
  'webinar_attended': 'Webinar Attended',
  'vip_trip_booked': 'VIP Trip Booked',
  'vip_trip_completed': 'VIP Trip Done',
  'property_search': 'Property Search',
  'offer_made': 'Offer Made',
  'closing': 'Closing',
  'completed': 'Completed'
};

App.utils.clientStatusOrder = [
  'registered', 'webinar_scheduled', 'webinar_attended',
  'vip_trip_booked', 'vip_trip_completed', 'property_search',
  'offer_made', 'closing', 'completed'
];

App.utils.getStatusLabel = function(status) {
  return App.utils.clientStatusLabels[status] || status;
};

App.utils.getStatusBadgeClass = function(status) {
  const map = {
    'registered': 'badge--pending',
    'webinar_scheduled': 'badge--info',
    'webinar_attended': 'badge--info',
    'vip_trip_booked': 'badge--active',
    'vip_trip_completed': 'badge--active',
    'property_search': 'badge--warning',
    'offer_made': 'badge--warning',
    'closing': 'badge--closing',
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
