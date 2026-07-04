/* ============================================
   RE/MAX Inmomás — Authentication Service
   ============================================
   Handles user registration, login, logout,
   and session management. Works in demo mode
   (localStorage) or with Firebase Auth + Firestore.
   ============================================ */

window.App = window.App || {};

App.auth = (function() {
  const SESSION_KEY = 'remax_session';
  let currentUser = null;
  let authChangeCallbacks = [];

  /* ---- Initialize ---- */
  function init() {
    if (App.demoMode) {
      // Restore session from localStorage
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
          // Verify user still exists in demo data
          const exists = App.demoData.users.find(u => u.id === currentUser.id);
          if (!exists || exists.status !== 'approved') {
            currentUser = null;
            localStorage.removeItem(SESSION_KEY);
          }
        } catch {
          currentUser = null;
          localStorage.removeItem(SESSION_KEY);
        }
      }
      notifyAuthChange();
    } else {
      // Firebase Auth listener
      App.firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          const doc = await App.db.collection('users').doc(firebaseUser.uid).get();
          if (doc.exists) {
            currentUser = { id: firebaseUser.uid, ...doc.data() };
          } else {
            currentUser = null;
          }
        } else {
          currentUser = null;
        }
        notifyAuthChange();
      });
    }
  }

  /* ---- Register ---- */
  async function register(data) {
    const { email, password, firstName, lastName, agencyName, phone, country, role, brokerId } = data;

    if (!email || !password || !firstName || !lastName || !role) {
      throw new Error('Please fill in all required fields.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (!['broker', 'realtor'].includes(role)) {
      throw new Error('Invalid role selected.');
    }

    if (App.demoMode) {
      // Check duplicate email
      const exists = App.demoData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('An account with this email already exists.');
      }

      const newUser = {
        id: role.substring(0, 3) + '-' + Date.now(),
        email: email.toLowerCase(),
        password,
        role,
        status: role === 'realtor' ? 'active' : 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'broker' ? 'BRK' : 'REA'}-${lastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        createdAt: new Date().toISOString()
      };

      App.demoData.users.push(newUser);
      
      if (newUser.status === 'active') {
        currentUser = { ...newUser };
        delete currentUser.password;
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        notifyAuthChange();
      }
      
      return { success: true, user: newUser };
    } else {
      // Firebase registration
      const credential = await App.firebaseAuth.createUserWithEmailAndPassword(email, password);
      const uid = credential.user.uid;

      const userData = {
        email: email.toLowerCase(),
        role,
        status: role === 'realtor' ? 'active' : 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'broker' ? 'BRK' : 'REA'}-${lastName.toUpperCase()}-${uid.substring(0, 4)}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);
      
      // Sign out immediately (pending approval)
      await App.firebaseAuth.signOut();
      return { success: true, user: { id: uid, ...userData } };
    }
  }

  /* ---- Login ---- */
  async function login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter email and password.');
    }

    if (App.demoMode) {
      const user = App.demoData.users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error('Invalid email or password.');
      }

      if (user.status === 'pending') {
        throw new Error('PENDING');
      }

      if (user.status === 'rejected') {
        throw new Error('Your application has been rejected. Please contact support.');
      }

      currentUser = { ...user };
      delete currentUser.password; // Don't store password in session
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      notifyAuthChange();
      return currentUser;
    } else {
      // Firebase login
      const credential = await App.firebaseAuth.signInWithEmailAndPassword(email, password);
      const doc = await App.db.collection('users').doc(credential.user.uid).get();
      
      if (!doc.exists) {
        await App.firebaseAuth.signOut();
        throw new Error('Account not found. Please register first.');
      }

      const userData = doc.data();

      if (userData.status === 'pending') {
        await App.firebaseAuth.signOut();
        throw new Error('PENDING');
      }

      if (userData.status === 'rejected') {
        await App.firebaseAuth.signOut();
        throw new Error('Your application has been rejected. Please contact support.');
      }

      currentUser = { id: credential.user.uid, ...userData };
      notifyAuthChange();
      return currentUser;
    }
  }

  /* ---- Logout ---- */
  async function logout() {
    if (App.demoMode) {
      currentUser = null;
      localStorage.removeItem(SESSION_KEY);
      notifyAuthChange();
    } else {
      await App.firebaseAuth.signOut();
      currentUser = null;
      notifyAuthChange();
    }
  }

  /* ---- Get Current User ---- */
  function getCurrentUser() {
    return currentUser;
  }

  function isAuthenticated() {
    return currentUser !== null;
  }

  function hasRole(role) {
    return currentUser && currentUser.role === role;
  }

  function requireAuth(allowedRoles = []) {
    if (!currentUser) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentUser.role);
  }

  /* ---- User Management (Admin functions) ---- */
  async function updateUserStatus(userId, newStatus) {
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found.');
      user.status = newStatus;
      user.updatedAt = new Date().toISOString();
      return true;
    } else {
      await App.db.collection('users').doc(userId).update({
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
  }

  async function getAllUsers(filters = {}) {
    if (App.demoMode) {
      let users = [...App.demoData.users].map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });

      if (filters.role) users = users.filter(u => u.role === filters.role);
      if (filters.status) users = users.filter(u => u.status === filters.status);
      if (filters.brokerId) users = users.filter(u => u.brokerId === filters.brokerId);
      
      return users;
    } else {
      let query = App.db.collection('users');
      if (filters.role) query = query.where('role', '==', filters.role);
      if (filters.status) query = query.where('status', '==', filters.status);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }

  async function getUser(userId) {
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.id === userId);
      if (!user) return null;
      const copy = { ...user };
      delete copy.password;
      return copy;
    } else {
      const doc = await App.db.collection('users').doc(userId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
  }

  /* ---- Client Management ---- */
  async function getClients(filters = {}) {
    if (App.demoMode) {
      let clients = [...App.demoData.clients];
      if (filters.referredBy) clients = clients.filter(c => c.referredBy === filters.referredBy);
      if (filters.brokerId) clients = clients.filter(c => c.brokerId === filters.brokerId);
      if (filters.status) clients = clients.filter(c => c.status === filters.status);
      return clients;
    } else {
      let query = App.db.collection('clients');
      if (filters.referredBy) query = query.where('referredBy', '==', filters.referredBy);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      if (filters.status) query = query.where('status', '==', filters.status);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }

  async function updateClientStatus(clientId, newStatus, note = '') {
    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');
      client.status = newStatus;
      client.statusHistory.push({
        status: newStatus,
        date: new Date().toISOString(),
        note
      });
      client.updatedAt = new Date().toISOString();
      return true;
    } else {
      const clientRef = App.db.collection('clients').doc(clientId);
      await clientRef.update({
        status: newStatus,
        statusHistory: firebase.firestore.FieldValue.arrayUnion({
          status: newStatus,
          date: new Date().toISOString(),
          note
        }),
        updatedAt: new Date().toISOString()
      });
      return true;
    }
  }

  /* ---- Commission Management ---- */
  async function getCommissions(filters = {}) {
    if (App.demoMode) {
      let comms = [...App.demoData.commissions];
      if (filters.realtorId) comms = comms.filter(c => c.realtorId === filters.realtorId);
      if (filters.brokerId) comms = comms.filter(c => c.brokerId === filters.brokerId);
      return comms;
    } else {
      let query = App.db.collection('commissions');
      if (filters.realtorId) query = query.where('realtorId', '==', filters.realtorId);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  }

  /* ---- Auth State Change Listener ---- */
  function onAuthChange(callback) {
    authChangeCallbacks.push(callback);
  }

  function notifyAuthChange() {
    authChangeCallbacks.forEach(cb => {
      try { cb(currentUser); } catch(e) { console.error('[Auth] Callback error:', e); }
    });
  }

  /* ---- Password Reset ---- */
  async function resetPassword(email) {
    if (App.demoMode) {
      App.utils.showToast('In demo mode, password reset is simulated.', 'info');
      return true;
    } else {
      await App.firebaseAuth.sendPasswordResetEmail(email);
      return true;
    }
  }

  /* ---- Public API ---- */
  return {
    init,
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    requireAuth,
    updateUserStatus,
    getAllUsers,
    getUser,
    getClients,
    updateClientStatus,
    getCommissions,
    onAuthChange,
    resetPassword
  };
})();
