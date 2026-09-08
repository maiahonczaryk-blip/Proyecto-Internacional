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

  /* ---- Helper functions for Demo Mode persistence ---- */
  function loadDemoData() {
    if (!App.demoMode) return;
    const savedUsers = localStorage.getItem('remax_demo_users');
    if (savedUsers) App.demoData.users = JSON.parse(savedUsers);
    const savedClients = localStorage.getItem('remax_demo_clients');
    if (savedClients) App.demoData.clients = JSON.parse(savedClients);
    const savedCommissions = localStorage.getItem('remax_demo_commissions');
    if (savedCommissions) App.demoData.commissions = JSON.parse(savedCommissions);
    const savedDossierLeads = localStorage.getItem('remax_demo_dossier_leads');
    if (savedDossierLeads) {
      App.demoData.dossier_leads = JSON.parse(savedDossierLeads);
    } else {
      App.demoData.dossier_leads = App.demoData.dossier_leads || [];
    }
    const savedWebinarRegs = localStorage.getItem('remax_demo_webinar_registrations');
    if (savedWebinarRegs) {
      App.demoData.webinar_registrations = JSON.parse(savedWebinarRegs);
    } else {
      App.demoData.webinar_registrations = App.demoData.webinar_registrations || [];
    }
    const savedWebinarSettings = localStorage.getItem('remax_webinar_settings');
    if (savedWebinarSettings) {
      try {
        App.demoData.webinar_settings = JSON.parse(savedWebinarSettings);
      } catch (e) {}
    }
  }

  function saveDemoData() {
    if (!App.demoMode) return;
    localStorage.setItem('remax_demo_users', JSON.stringify(App.demoData.users));
    localStorage.setItem('remax_demo_clients', JSON.stringify(App.demoData.clients));
    localStorage.setItem('remax_demo_commissions', JSON.stringify(App.demoData.commissions));
    localStorage.setItem('remax_demo_dossier_leads', JSON.stringify(App.demoData.dossier_leads || []));
    localStorage.setItem('remax_demo_webinar_registrations', JSON.stringify(App.demoData.webinar_registrations || []));
    if (App.demoData.webinar_settings) {
      localStorage.setItem('remax_webinar_settings', JSON.stringify(App.demoData.webinar_settings));
    }
    
    if (currentUser) {
      // Find the updated user in demoData to ensure the session gets the latest fields (e.g. agreementSigned, status)
      const updatedUser = App.demoData.users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        currentUser = { ...updatedUser };
        delete currentUser.password;
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    }
  }

  /* ---- Initialize ---- */
  function init() {
    return new Promise((resolve) => {
      if (App.demoMode) {
        loadDemoData();
        
        // Restore session from localStorage
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          try {
            currentUser = JSON.parse(saved);
            // Verify user still exists in demo data
            const exists = App.demoData.users.find(u => u.id === currentUser.id);
            if (!exists || exists.status === 'rejected') {
              currentUser = null;
              localStorage.removeItem(SESSION_KEY);
            }
          } catch {
            currentUser = null;
            localStorage.removeItem(SESSION_KEY);
          }
        }
        notifyAuthChange();
        resolve(currentUser);
      } else {
        if (!App.firebaseAuth) {
          console.error('[Auth] Firebase Auth is not initialized or failed to load. Resolving with null user.');
          resolve(null);
          return;
        }

        // Firebase Auth listener
        let firstResolve = true;
        App.firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const doc = await App.db.collection('users').doc(firebaseUser.uid).get();
              if (doc.exists) {
                currentUser = { id: firebaseUser.uid, ...doc.data() };
              } else {
                currentUser = null;
              }
            } catch (err) {
              console.error('[Auth] Error fetching user profile:', err);
              currentUser = null;
            }
          } else {
            currentUser = null;
          }
          notifyAuthChange();
          if (firstResolve) {
            firstResolve = false;
            resolve(currentUser);
          }
        });
      }
    });
  }

  /* ---- Register ---- */
  async function register(data) {
    const { email, password, firstName, lastName, agencyName, phone, country, role, brokerId, referredBy, source } = data;

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
        status: 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'admin' ? 'ADM' : (role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : (role === 'colaborador' ? 'COL' : 'REA')))}-${lastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        referredBy: referredBy || null,
        source: source || null,
        createdAt: new Date().toISOString()
      };

      App.demoData.users.push(newUser);
      saveDemoData();
      
      if (newUser.status === 'active' || newUser.status === 'pending') {
        currentUser = { ...newUser };
        delete currentUser.password;
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        notifyAuthChange();
      }

      // Notify admin of new registration
      if (window.App && window.App.notifications) {
        window.App.notifications.onNewUserRegistration(newUser).catch(() => {});

        // If referred, notify the referring agent
        if (newUser.referredBy) {
          try {
            const allUsers = App.demoData.users;
            const referrerAgent = allUsers.find(u => u.id === newUser.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (newUser.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              window.App.notifications.onNewReferredCollaborator(newUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }
      }

      return { success: true, user: newUser };
    } else {
      // Firebase registration
      const credential = await App.firebaseAuth.createUserWithEmailAndPassword(email, password);
      const uid = credential.user.uid;

      const userData = {
        email: email.toLowerCase(),
        role,
        status: 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'admin' ? 'ADM' : (role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : (role === 'colaborador' ? 'COL' : 'REA')))}-${lastName.toUpperCase()}-${uid.substring(0, 4)}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        referredBy: referredBy || null,
        source: source || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);

      // Notify admin of new registration
      if (window.App && window.App.notifications) {
        const fullUser = { id: uid, ...userData };
        window.App.notifications.onNewUserRegistration(fullUser).catch(() => {});

        // If referred, notify the referring agent
        if (userData.referredBy) {
          try {
            const allUsers = await getAllUsers();
            const referrerAgent = allUsers.find(u => u.id === userData.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (userData.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              window.App.notifications.onNewReferredCollaborator(fullUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }
      }

      currentUser = { id: uid, ...userData };
      notifyAuthChange();
      return { success: true, user: currentUser };
    }
  }  // end register()

  /* ---- Login ---- */
  async function login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter email and password.');
    }

    if (App.demoMode) {
      const user = App.demoData.users.find(
        u => (
          (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
          (u.username && u.username.toLowerCase() === email.toLowerCase())
        ) && u.password === password
      );

      if (!user) {
        throw new Error('Invalid email or password.');
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
      try {
        let loginIdentifier = email.trim();
        // If it's a partner username without @, map it to their default system email
        if (!loginIdentifier.includes('@')) {
          const lowerId = loginIdentifier.toLowerCase();
          if (lowerId === 'uci') loginIdentifier = 'uci@partner.com';
          else if (lowerId === 'fuster') loginIdentifier = 'fuster@partner.com';
          else if (lowerId === 'holidays') loginIdentifier = 'holidays@partner.com';
        }

        const credential = await App.firebaseAuth.signInWithEmailAndPassword(loginIdentifier, password);
        const doc = await App.db.collection('users').doc(credential.user.uid).get();

        if (!doc.exists) {
          await App.firebaseAuth.signOut();
          throw new Error('Account not found. Please register first.');
        }

        const userData = doc.data();

        if (userData.status === 'rejected') {
          await App.firebaseAuth.signOut();
          throw new Error('Your application has been rejected. Please contact support.');
        }

        // Auto-generate referralCode if missing (for users registered before this field existed)
        if (!userData.referralCode && userData.role && userData.lastName) {
          const prefix = userData.role === 'admin' ? 'ADM' : (userData.role === 'broker' ? 'BRK' : (userData.role === 'agent_inmomas' ? 'LOC' : (userData.role === 'colaborador' ? 'COL' : 'REA')));
          const uid = credential.user.uid;
          userData.referralCode = `${prefix}-${userData.lastName.toUpperCase()}-${uid.substring(0, 4)}`;
          // Save back to Firestore
          await App.db.collection('users').doc(uid).update({ referralCode: userData.referralCode });
          console.log('[Auth] Auto-generated referralCode:', userData.referralCode);
        }

        currentUser = { id: credential.user.uid, ...userData };
        notifyAuthChange();
        return currentUser;

      } catch (firebaseErr) {
        // Convert raw Firebase error codes to friendly messages
        const code = firebaseErr.code || '';
        if (
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/invalid-login-credentials' ||
          (firebaseErr.message && firebaseErr.message.includes('INVALID_LOGIN_CREDENTIALS'))
        ) {
          throw new Error('Incorrect email or password. Please try again.');
        }
        if (code === 'auth/too-many-requests') {
          throw new Error('Too many failed attempts. Please wait a few minutes and try again.');
        }
        if (code === 'auth/user-disabled') {
          throw new Error('This account has been disabled. Please contact support.');
        }
        if (code === 'auth/network-request-failed') {
          throw new Error('Network error. Please check your connection and try again.');
        }
        // Re-throw with cleaned message (strip raw JSON if present)
        const cleanMsg = (firebaseErr.message || 'Login failed.')
          .replace(/\{"error".*\}/, '')
          .trim() || 'Login failed. Please try again.';
        throw new Error(cleanMsg);
      }
    }
  }


  /* ---- Google Login ---- */
  async function loginWithGoogle() {
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.email === 'mike.agent@remaxusa.com');
      if (!user) throw new Error('Demo Google account not found.');
      currentUser = { ...user };
      delete currentUser.password;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      notifyAuthChange();
      return currentUser;
    } else {
      const provider = new firebase.auth.GoogleAuthProvider();
      const credential = await App.firebaseAuth.signInWithPopup(provider);
      const firebaseUser = credential.user;
      
      const doc = await App.db.collection('users').doc(firebaseUser.uid).get();
      if (!doc.exists) {
        const nameParts = (firebaseUser.displayName || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await App.firebaseAuth.signOut();
        
        const error = new Error('Google account not registered.');
        error.code = 'USER_NOT_REGISTERED';
        error.email = firebaseUser.email;
        error.firstName = firstName;
        error.lastName = lastName;
        throw error;
      }

      const userData = doc.data();

      if (userData.status === 'rejected') {
        await App.firebaseAuth.signOut();
        throw new Error('Your application has been rejected. Please contact support.');
      }

      // Auto-generate referralCode if missing
      if (!userData.referralCode && userData.role && userData.lastName) {
        const prefix = userData.role === 'admin' ? 'ADM' : (userData.role === 'broker' ? 'BRK' : (userData.role === 'agent_inmomas' ? 'LOC' : (userData.role === 'colaborador' ? 'COL' : 'REA')));
        userData.referralCode = `${prefix}-${userData.lastName.toUpperCase()}-${firebaseUser.uid.substring(0, 4)}`;
        await App.db.collection('users').doc(firebaseUser.uid).update({ referralCode: userData.referralCode });
      }

      currentUser = { id: firebaseUser.uid, ...userData };
      notifyAuthChange();
      return currentUser;
    }
  }

  /* ---- Google Registration ---- */
  async function registerWithGoogle(data) {
    const { role, firstName, lastName, agencyName, phone, country, brokerId, referredBy, source } = data;

    if (!role) {
      throw new Error('Please select a role (Broker or Realtor).');
    }

    if (!['broker', 'realtor'].includes(role)) {
      throw new Error('Invalid role selected.');
    }

    if (App.demoMode) {
      const mockFirstName = firstName || 'Google';
      const mockLastName = lastName || 'User';
      const mockEmail = (mockFirstName + '.' + mockLastName + '@gmail.com').toLowerCase();
      const newUser = {
        id: role.substring(0, 3) + '-' + Date.now(),
        email: mockEmail,
        role,
        status: 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName: mockFirstName,
        lastName: mockLastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'admin' ? 'ADM' : (role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : (role === 'colaborador' ? 'COL' : 'REA')))}-${mockLastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        referredBy: referredBy || null,
        source: source || null,
        createdAt: new Date().toISOString()
      };

      App.demoData.users.push(newUser);
      saveDemoData();

      currentUser = { ...newUser };
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      notifyAuthChange();

      // Notify admin of new registration via Google
      if (window.App && window.App.notifications) {
        window.App.notifications.onNewUserRegistration(newUser).catch(() => {});

        // If referred, notify the referring agent
        if (newUser.referredBy) {
          try {
            const allUsers = App.demoData.users;
            const referrerAgent = allUsers.find(u => u.id === newUser.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (newUser.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              window.App.notifications.onNewReferredCollaborator(newUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }
      }

      return { success: true, user: newUser };
    } else {
      const provider = new firebase.auth.GoogleAuthProvider();
      const credential = await App.firebaseAuth.signInWithPopup(provider);
      const firebaseUser = credential.user;
      const uid = firebaseUser.uid;

      const doc = await App.db.collection('users').doc(uid).get();
      if (doc.exists) {
        throw new Error('This Google account is already registered. Please login instead.');
      }

      // If first/last name were not provided in form, extract them from Google display name
      let finalFirstName = firstName;
      let finalLastName = lastName;
      if (!finalFirstName || !finalLastName) {
        const nameParts = (firebaseUser.displayName || '').split(' ');
        if (!finalFirstName) finalFirstName = nameParts[0] || '';
        if (!finalLastName) finalLastName = nameParts.slice(1).join(' ') || '';
      }

      const userData = {
        email: firebaseUser.email.toLowerCase(),
        role,
        status: 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName: finalFirstName,
        lastName: finalLastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'admin' ? 'ADM' : (role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : (role === 'colaborador' ? 'COL' : 'REA')))}-${(finalLastName || 'USER').toUpperCase()}-${uid.substring(0, 4)}`,
        profileImage: firebaseUser.photoURL || null,
        agreementSigned: false,
        agreementSignedAt: null,
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        referredBy: referredBy || null,
        source: source || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);

      // Notify admin of new registration via Google
      if (window.App && window.App.notifications) {
        const fullUser = { id: uid, ...userData };
        window.App.notifications.onNewUserRegistration(fullUser).catch(() => {});

        // If referred, notify the referring agent
        if (userData.referredBy) {
          try {
            const allUsers = await getAllUsers();
            const referrerAgent = allUsers.find(u => u.id === userData.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (userData.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              window.App.notifications.onNewReferredCollaborator(fullUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }
      }

      currentUser = { id: uid, ...userData };
      notifyAuthChange();

      return { success: true, user: currentUser };
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

  async function updateUserStatus(userId, newStatus) {
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found.');
      user.status = newStatus;
      user.updatedAt = new Date().toISOString();
      saveDemoData();
      // Notify admin of status change
      if (window.App && window.App.notifications) {
        window.App.notifications.onUserStatusChange(user, newStatus).catch(() => {});
      }
      return true;
    } else {
      await App.db.collection('users').doc(userId).update({
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      // Fetch user data to include in notification
      try {
        const doc = await App.db.collection('users').doc(userId).get();
        if (doc.exists && window.App && window.App.notifications) {
          window.App.notifications.onUserStatusChange({ id: userId, ...doc.data() }, newStatus).catch(() => {});
        }
      } catch (_) {}
      return true;
    }
  }

  async function updateUserRole(userId, newRole) {
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found.');
      user.role = newRole;
      if (user.referralCode) {
        const parts = user.referralCode.split('-');
        const prefix = newRole === 'admin' ? 'ADM' : (newRole === 'broker' ? 'BRK' : (newRole === 'agent_inmomas' ? 'LOC' : (newRole === 'colaborador' ? 'COL' : 'REA')));
        if (parts.length > 1) {
          parts[0] = prefix;
          user.referralCode = parts.join('-');
        } else {
          const lastName = user.lastName || 'USER';
          user.referralCode = `${prefix}-${lastName.toUpperCase()}`;
        }
      }
      user.updatedAt = new Date().toISOString();
      saveDemoData();
      return true;
    } else {
      const docRef = App.db.collection('users').doc(userId);
      const doc = await docRef.get();
      if (doc.exists) {
        const userData = doc.data();
        let updatedRefCode = userData.referralCode;
        if (updatedRefCode) {
          const parts = updatedRefCode.split('-');
          const prefix = newRole === 'admin' ? 'ADM' : (newRole === 'broker' ? 'BRK' : (newRole === 'agent_inmomas' ? 'LOC' : (newRole === 'colaborador' ? 'COL' : 'REA')));
          if (parts.length > 1) {
            parts[0] = prefix;
            updatedRefCode = parts.join('-');
          } else {
            const lastName = userData.lastName || 'USER';
            updatedRefCode = `${prefix}-${lastName.toUpperCase()}-${userId.substring(0, 4)}`;
          }
        }
        await docRef.update({
          role: newRole,
          referralCode: updatedRefCode,
          updatedAt: new Date().toISOString()
        });
      }
      return true;
    }
  }

  async function updateProfile(data) {
    const user = currentUser;
    if (!user) throw new Error('No user is currently logged in.');

    const { firstName, lastName, phone, agencyName, country, profileImage } = data;

    if (!firstName || !lastName) {
      throw new Error('First name and last name are required.');
    }

    if (App.demoMode) {
      const demoUser = App.demoData.users.find(u => u.id === user.id);
      if (!demoUser) throw new Error('User not found in demo database.');

      demoUser.firstName = firstName;
      demoUser.lastName = lastName;
      demoUser.phone = phone || '';
      demoUser.agencyName = agencyName || '';
      demoUser.country = country || '';
      if (profileImage !== undefined) {
        demoUser.profileImage = profileImage;
      }
      demoUser.updatedAt = new Date().toISOString();

      saveDemoData();
      notifyAuthChange();
      return currentUser;
    } else {
      const updateData = {
        firstName,
        lastName,
        phone: phone || '',
        agencyName: agencyName || '',
        country: country || '',
        updatedAt: new Date().toISOString()
      };
      if (profileImage !== undefined) {
        updateData.profileImage = profileImage;
      }
      await App.db.collection('users').doc(user.id).update(updateData);

      Object.assign(currentUser, updateData);
      notifyAuthChange();
      return currentUser;
    }
  }

  async function updateAuthEmail(newEmail) {
    const user = currentUser;
    if (!user) throw new Error('No user is currently logged in.');

    if (App.demoMode) {
      App.utils.showToast('In demo mode, email update is simulated.', 'info');
      const demoUser = App.demoData.users.find(u => u.id === user.id);
      if (demoUser) demoUser.email = newEmail;
      user.email = newEmail;
      saveDemoData();
      return true;
    } else {
      const fbUser = App.firebaseAuth.currentUser;
      if (!fbUser) throw new Error('No Firebase user found.');
      
      try {
        await fbUser.updateEmail(newEmail);
        await App.db.collection('users').doc(user.id).update({
          email: newEmail,
          updatedAt: new Date().toISOString()
        });
        user.email = newEmail;
        return true;
      } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
          throw new Error('Please log out and log back in before updating your email.');
        }
        throw err;
      }
    }
  }


  /* ---- Update User Referral (Admin action) ---- */
  async function updateUserReferral(userId, referrerCode) {
    if (App.demoMode) {
      const u = App.demoData.users.find(u => u.id === userId);
      if (!u) throw new Error('User not found.');
      u.referredBy = referrerCode;
      u.source = referrerCode ? 'Admin Assigned Referral' : null;
      u.updatedAt = new Date().toISOString();
      saveDemoData();
      return true;
    } else {
      const userRef = App.db.collection('users').doc(userId);
      await userRef.update({
        referredBy: referrerCode,
        source: referrerCode ? 'Admin Assigned Referral' : null,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
  }

  /* ---- Delete User (Admin action) ---- */
  async function deleteUser(userId) {
    if (App.demoMode) {
      const idx = App.demoData.users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error('User not found.');
      App.demoData.users.splice(idx, 1);
      saveDemoData();
      return true;
    } else {
      await App.db.collection('users').doc(userId).delete();
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
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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
      return doc.exists ? { ...doc.data(), id: doc.id } : null;
    }
  }

  /* ---- Client Management ---- */
  async function getClients(filters = {}) {
    if (App.demoMode) {
      let clients = [...App.demoData.clients];
      if (filters.referredBy) clients = clients.filter(c => c.referredBy === filters.referredBy);
      if (filters.brokerId) clients = clients.filter(c => c.brokerId === filters.brokerId);
      if (filters.localAgentId) clients = clients.filter(c => c.localAgentId === filters.localAgentId);
      if (filters.status) clients = clients.filter(c => c.status === filters.status);
      return clients;
    } else {
      let query = App.db.collection('clients');
      if (filters.referredBy) query = query.where('referredBy', '==', filters.referredBy);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      if (filters.localAgentId) query = query.where('localAgentId', '==', filters.localAgentId);
      if (filters.status) query = query.where('status', '==', filters.status);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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

      // Sync commission status
      const comm = App.demoData.commissions.find(c => c.clientId === clientId);
      if (comm) {
        if (newStatus === 'closed') {
          comm.status = 'paid';
          comm.closingDate = new Date().toISOString();
        } else if (newStatus === 'notary_pending' || newStatus === 'offer_made') {
          comm.status = 'pending_payment';
          comm.closingDate = null;
        } else {
          comm.status = 'projected';
          comm.closingDate = null;
        }
      }
      saveDemoData();
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

      // Sync commission status in Firestore
      const commQuery = await App.db.collection('commissions').where('clientId', '==', clientId).get();
      if (!commQuery.empty) {
        let commStatus = 'projected';
        if (newStatus === 'closed') commStatus = 'paid';
        else if (newStatus === 'notary_pending' || newStatus === 'offer_made') commStatus = 'pending_payment';
        
        await commQuery.docs[0].ref.update({
          status: commStatus,
          closingDate: newStatus === 'closed' ? new Date().toISOString() : null
        });
      }
      return true;
    }
  }

  async function saveClientFinancials(clientId, salePrice, agencyFeePct, referralSharePct) {
    const sPrice = parseFloat(salePrice) || 0;
    const feePct = parseFloat(agencyFeePct) || 0;
    const refPct = parseFloat(referralSharePct) || 0;
    
    const totalCommission = sPrice * (feePct / 100);
    const realtorAmount = totalCommission * (refPct / 100);
    const agentAmount = totalCommission * ((100 - refPct) / 100);
    const brokerAmount = totalCommission * 0.10; // referring broker standard share (10%)

    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');
      
      client.salePrice = sPrice;
      client.agencyFeePct = feePct;
      client.referralSharePct = refPct;

      let comm = App.demoData.commissions.find(c => c.clientId === clientId);
      if (!comm) {
        comm = {
          id: 'comm-' + Math.random().toString(36).substr(2, 9),
          clientId: clientId,
          clientName: `${client.firstName} ${client.lastName}`,
          realtorId: client.referredBy,
          brokerId: client.brokerId,
          createdAt: new Date().toISOString()
        };
        App.demoData.commissions.push(comm);
      }

      comm.agentId = client.localAgentId;
      comm.salePrice = sPrice;
      comm.totalCommission = totalCommission;
      comm.realtorSharePct = refPct;
      comm.realtorAmount = realtorAmount;
      comm.agentSharePct = 100 - refPct;
      comm.agentAmount = agentAmount;
      comm.brokerSharePct = 10;
      comm.brokerAmount = brokerAmount;
      comm.propertyAddress = client.interestArea || 'Spain Deal';

      if (client.status === 'closed') {
        comm.status = 'paid';
        comm.closingDate = new Date().toISOString();
      } else if (client.status === 'notary_pending' || client.status === 'offer_made') {
        comm.status = 'pending_payment';
        comm.closingDate = null;
      } else {
        comm.status = 'projected';
        comm.closingDate = null;
      }
      saveDemoData();
      return true;
    } else {
      const clientRef = App.db.collection('clients').doc(clientId);
      const doc = await clientRef.get();
      if (!doc.exists) throw new Error('Client not found.');
      const client = doc.data();

      await clientRef.update({
        salePrice: sPrice,
        agencyFeePct: feePct,
        referralSharePct: refPct
      });

      const commQuery = await App.db.collection('commissions').where('clientId', '==', clientId).get();
      let commRef;
      if (commQuery.empty) {
        commRef = App.db.collection('commissions').doc();
      } else {
        commRef = commQuery.docs[0].ref;
      }

      let commStatus = 'projected';
      if (client.status === 'closed') commStatus = 'paid';
      else if (client.status === 'notary_pending' || client.status === 'offer_made') commStatus = 'pending_payment';

      await commRef.set({
        clientId: clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        realtorId: client.referredBy,
        brokerId: client.brokerId,
        agentId: client.localAgentId,
        salePrice: sPrice,
        totalCommission,
        realtorSharePct: refPct,
        realtorAmount,
        agentSharePct: 100 - refPct,
        agentAmount,
        brokerSharePct: 10,
        brokerAmount,
        propertyAddress: client.interestArea || 'Spain Deal',
        status: commStatus,
        createdAt: new Date().toISOString()
      }, { merge: true });

      return true;
    }
  }

  async function updateClientPartnerFlags(clientId, flags) {
    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');

      if (flags.needsUCI !== undefined) client.needsUCI = flags.needsUCI;
      if (flags.needsFuster !== undefined) client.needsFuster = flags.needsFuster;
      if (flags.needsHolidays !== undefined) client.needsHolidays = flags.needsHolidays;
      
      client.updatedAt = new Date().toISOString();
      saveDemoData();
    } else {
      const updateData = { updatedAt: new Date().toISOString() };
      if (flags.needsUCI !== undefined) updateData.needsUCI = flags.needsUCI;
      if (flags.needsFuster !== undefined) updateData.needsFuster = flags.needsFuster;
      if (flags.needsHolidays !== undefined) updateData.needsHolidays = flags.needsHolidays;
      
      await App.db.collection('clients').doc(clientId).update(updateData);
    }
  }

  /* ---- Commission Management ---- */
  async function getCommissions(filters = {}) {
    if (App.demoMode) {
      let comms = [...App.demoData.commissions];
      if (filters.realtorId) comms = comms.filter(c => c.realtorId === filters.realtorId);
      if (filters.brokerId) comms = comms.filter(c => c.brokerId === filters.brokerId);
      if (filters.agentId) comms = comms.filter(c => c.agentId === filters.agentId);
      return comms;
    } else {
      let query = App.db.collection('commissions');
      if (filters.realtorId) query = query.where('realtorId', '==', filters.realtorId);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      if (filters.agentId) query = query.where('agentId', '==', filters.agentId);
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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

  /* ---- Assign Local Agent ---- */
  async function assignLocalAgent(clientId, agentId, agentName) {
    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');
      client.localAgentId = agentId;
      client.localAgentName = agentName;
      client.updatedAt = new Date().toISOString();
      saveDemoData();
      return true;
    } else {
      const clientRef = App.db.collection('clients').doc(clientId);
      await clientRef.update({
        localAgentId: agentId,
        localAgentName: agentName,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
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

  /* ---- Dossier Lead Management ---- */
  async function saveDossierLead(leadData) {
    const id = 'lead_' + Date.now();
    const createdAt = new Date().toISOString();
    const newLead = { id, ...leadData, createdAt };

    if (App.demoMode) {
      if (!App.demoData.dossier_leads) App.demoData.dossier_leads = [];
      App.demoData.dossier_leads.push(newLead);
      saveDemoData();
      // Notify admin of new Buyer's Guide lead
      if (window.App && window.App.notifications) {
        window.App.notifications.onNewDossierLead(newLead).catch(() => {});
      }
      return newLead;
    } else {
      const docRef = await App.db.collection('dossier_leads').add(newLead);
      const saved = { id: docRef.id, ...newLead };
      // Notify admin of new Buyer's Guide lead
      if (window.App && window.App.notifications) {
        window.App.notifications.onNewDossierLead(saved).catch(() => {});
      }
      return saved;
    }
  }

  async function getDossierLeads() {
    if (App.demoMode) {
      return App.demoData.dossier_leads || [];
    } else {
      const snapshot = await App.db.collection('dossier_leads').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
  }

  /* ---- Webinar Registrations ---- */
  async function saveWebinarRegistration(data) {
    const payload = {
      ...data,
      createdAt: new Date().toISOString()
    };

    let agentEmail = null;
    if (payload.agentReferrerId) {
      try {
        const allUsers = await getAllUsers();
        const agent = allUsers.find(u => u.id === payload.agentReferrerId);
        if (agent && agent.email) agentEmail = agent.email;
      } catch (e) {
        console.warn('[Webinar] Could not fetch agent email for notification', e);
      }
    }

    if (App.demoMode) {
      if (!App.demoData.webinar_registrations) App.demoData.webinar_registrations = [];
      payload.id = 'wreg-' + Date.now();
      App.demoData.webinar_registrations.push(payload);
      saveDemoData();
      // Notify admin of new webinar registration
      if (window.App && window.App.notifications) {
        window.App.notifications.onNewWebinarRegistration(payload, agentEmail).catch(() => {});
      }
      return payload.id;
    } else {
      const docRef = await App.db.collection('webinar_registrations').add(payload);
      // Notify admin of new webinar registration
      if (window.App && window.App.notifications) {
        window.App.notifications.onNewWebinarRegistration({ id: docRef.id, ...payload }, agentEmail).catch(() => {});
      }
      return docRef.id;
    }
  }

  async function getWebinarRegistrations() {
    if (App.demoMode) {
      return App.demoData.webinar_registrations || [];
    } else {
      const snapshot = await App.db.collection('webinar_registrations').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
  }

  /* ---- Delete Webinar Registration ---- */
  async function deleteWebinarRegistration(regId) {
    if (App.demoMode) {
      const idx = App.demoData.webinar_registrations.findIndex(r => r.id === regId);
      if (idx !== -1) {
        App.demoData.webinar_registrations.splice(idx, 1);
        saveDemoData();
      }
      return true;
    } else {
      await App.db.collection('webinar_registrations').doc(regId).delete();
      return true;
    }
  }

  /* ---- Webinar Settings (B2B vs B2C Switch & Date Config) ---- */
  const DEFAULT_WEBINAR_SETTINGS = {
    activeType: 'b2c', // Default next upcoming webinar: B2C (Sept 18, 2026)
    date: '2026-09-18',
    time: '12:00', // 12:00 PM EDT (18:00 Spain CEST)
    timeZone: 'EDT',
    spotsAvailable: 25,
    updatedAt: new Date().toISOString(),
    b2b: {
      title: 'Beyond the Borders',
      subtitle: 'Passive International Commissions for Realtors & Brokers',
      targetAudience: 'US, Canadian & Puerto Rico Realtors',
      spots: 25,
      date: '2026-08-28',
      time: '12:00',
      badge: {
        en: '🔴 LIVE WEBINAR · 🇺🇸 Exclusively for US, Canadian & Puerto Rico Realtors · 🇵🇷 FREE Registration',
        es: '🔴 WEBINAR EN VIVO · 🇺🇸 Exclusivo para Realtors de EE.UU., Canadá y Puerto Rico · 🇵🇷 Registro GRATUITO',
        fr: '🔴 WEBINAIRE EN DIRECT · 🇺🇸 Réservé aux Agents US, Canadiens & Porto Rico · 🇵🇷 Inscription GRATUITE',
        'en-ca': '🔴 LIVE WEBINAR · 🇺🇸 Exclusively for US, Canadian & Puerto Rico Realtors · 🇵🇷 FREE Registration'
      },
      heroPill: {
        en: 'RE/MAX Inmomás International — Realtor Partner Webinar',
        es: 'RE/MAX Inmomás International — Webinar para Realtors Partners',
        fr: 'RE/MAX Inmomás International — Webinaire Partenaires',
        'en-ca': 'RE/MAX Inmomás International — Realtor Partner Webinar'
      },
      titlePrefix: {
        en: 'Beyond the',
        es: 'Más Allá de',
        fr: 'Au-Delà des',
        'en-ca': 'Beyond the'
      },
      titleHighlight: {
        en: 'Borders',
        es: 'las Fronteras',
        fr: 'Frontières',
        'en-ca': 'Borders'
      },
      subtitleText: {
        en: 'The live webinar where top US, Canadian & Puerto Rico Realtors discover how to build a passive international income stream by referring clients to Spain\'s booming luxury market — with zero extra work.',
        es: 'El webinar en vivo donde los mejores Realtors de EE.UU., Canadá y Puerto Rico descubren cómo generar ingresos internacionales pasivos refiriendo clientes al mercado de lujo de España — sin trabajo adicional.',
        fr: 'Le webinaire en direct où les meilleurs agents US, canadiens & porto-ricains découvrent comment générer des revenus internationaux passifs en référant des clients au marché de luxe espagnol — sans travail supplémentaire.',
        'en-ca': 'The live webinar where top US, Canadian & Puerto Rico Realtors discover how to build a passive international income stream by referring clients to Spain\'s booming luxury market — with zero extra work.'
      },
      sectionHeadline: {
        en: 'Why Every US, Canadian & Puerto Rico Realtor Should Attend',
        es: 'Por qué todo Realtor de EE.UU., Canadá y Puerto Rico debería asistir',
        fr: 'Pourquoi chaque agent US, canadien et porto-ricain devrait assister',
        'en-ca': 'Why Every US, Canadian & Puerto Rico Realtor Should Attend'
      },
      sectionSubheadline: {
        en: 'In just 60 minutes, learn the exact system our collaborators use to close international deals from their home office.',
        es: 'En solo 60 minutos, aprende el sistema exacto que usan nuestros colaboradores para cerrar acuerdos internacionales desde su oficina.',
        fr: 'En 60 minutes, découvrez le système exact utilisé par nos partenaires pour conclure des transactions internationales depuis leur bureau.',
        'en-ca': 'In just 60 minutes, learn the exact system our collaborators use to close international deals from their home office.'
      },
      bannerText: {
        en: 'Beyond Borders · 12 PM EDT / 6 PM Spain · Free for Realtors & Brokers',
        es: 'Beyond Borders · 12 PM EDT / 18 h España · Gratuito para Realtors y Brokers',
        fr: 'Beyond Borders · 12 h EDT / 18 h Espagne · Gratuit pour les agents & courtiers',
        'en-ca': 'Beyond Borders · 12 PM EDT / 6 PM Spain · Free for Realtors & Brokers'
      },
      formCardTitle: {
        en: 'Beyond Borders · Realtor VIP Access',
        es: 'Beyond Borders · Acceso VIP Realtors',
        fr: 'Beyond Borders · Accès VIP Agents',
        'en-ca': 'Beyond Borders · Realtor VIP Access'
      },
      organizationLabel: {
        en: 'Real Estate Agency / Brokerage *',
        es: 'Agencia Inmobiliaria / Brokerage *',
        fr: 'Agence Immobilière / Brokerage *',
        'en-ca': 'Real Estate Agency / Brokerage *'
      },
      organizationPlaceholder: 'e.g. RE/MAX Premier — Miami',
      benefits: [
        {
          icon: '💰',
          title: { en: 'Commission Structure', es: 'Estructura de Comisiones', fr: 'Structure des Commissions', 'en-ca': 'Commission Structure' },
          desc: { en: 'Earn €3,000–€15,000+ per referred deal. No risk, no paperwork, no extra clients to manage.', es: 'Gana entre €3.000 y €15.000+ por referido. Sin riesgo, sin papeleo, sin clientes extra.', fr: 'Gagnez entre 3 000 € et 15 000 €+ par transaction référée.', 'en-ca': 'Earn €3,000–€15,000+ per referred deal.' }
        },
        {
          icon: '🏖️',
          title: { en: 'Spain Market Deep-Dive', es: 'Análisis del Mercado Español', fr: 'Analyse du Marché Espagnol', 'en-ca': 'Spain Market Deep-Dive' },
          desc: { en: 'Costa Blanca, Costa del Sol, Madrid & Valencia. 35,000+ North Americans bought in Spain last year.', es: 'Costa Blanca, Costa del Sol, Madrid y Valencia. Más de 35.000 norteamericanos compraron en España el año pasado.', fr: 'Costa Blanca, Costa del Sol, Madrid et Valence.', 'en-ca': 'Costa Blanca, Costa del Sol, Madrid & Valencia.' }
        },
        {
          icon: '📋',
          title: { en: 'Step-by-Step Referral Process', es: 'Proceso de Referido Paso a Paso', fr: 'Processus de Référence Étape par Étape', 'en-ca': 'Step-by-Step Referral Process' },
          desc: { en: 'From first conversation to closed deal. We handle everything in Spain — you just make the intro.', es: 'Desde la primera conversación hasta el cierre. Nosotros gestionamos todo en España — tú solo haces la presentación.', fr: 'De la première conversation à la signature. Nous gérons tout.', 'en-ca': 'From first conversation to closed deal.' }
        },
        {
          icon: '🤝',
          title: { en: 'Become a Certified Collaborator', es: 'Conviértete en Colaborador Certificado', fr: 'Devenez Collaborateur Certifié', 'en-ca': 'Become a Certified Collaborator' },
          desc: { en: 'Join our exclusive network. Get your referral link, dashboard access, and co-branded marketing materials.', es: 'Únete a nuestra red exclusiva. Obtén tu enlace de referido, acceso al panel y materiales de marca compartida.', fr: 'Rejoignez notre réseau exclusif.', 'en-ca': 'Join our exclusive network.' }
        },
        {
          icon: '📊',
          title: { en: 'Live Q&A with Our Directors', es: 'Preguntas y Respuestas en Vivo', fr: 'Questions/Réponses en Direct', 'en-ca': 'Live Q&A with Our Directors' },
          desc: { en: 'Ask our Spanish real estate specialists, legal experts and international director directly.', es: 'Pregunta directamente a nuestros especialistas inmobiliarios, expertos legales y director internacional.', fr: 'Posez vos questions à nos spécialistes.', 'en-ca': 'Ask our Spanish real estate specialists directly.' }
        }
      ]
    },
    b2c: {
      title: 'Spain Unlocked: Living & Investing',
      subtitle: 'The Ultimate Masterclass to Buying Property, Relocation & Visas in Spain',
      targetAudience: 'International Buyers, Expats & Investors',
      spots: 25,
      date: '2026-09-18',
      time: '12:00',
      badge: {
        en: '🔴 LIVE WEBINAR · 🇪🇸 Living, Moving & Investing in Spain · 🏡 FREE Masterclass',
        es: '🔴 WEBINAR EN VIVO · 🇪🇸 Vivir, Mudarse e Invertir en España · 🏡 Masterclass GRATUITA',
        fr: '🔴 WEBINAIRE EN DIRECT · 🇪🇸 Vivre et Investir en Espagne · 🏡 Masterclass GRATUITE',
        'en-ca': '🔴 LIVE WEBINAR · 🇪🇸 Living, Moving & Investing in Spain · 🏡 FREE Masterclass'
      },
      heroPill: {
        en: 'RE/MAX Inmomás International — Buyer & Investor Masterclass',
        es: 'RE/MAX Inmomás International — Masterclass para Compradores e Inversores',
        fr: 'RE/MAX Inmomás International — Masterclass Acheteurs & Investisseurs',
        'en-ca': 'RE/MAX Inmomás International — Buyer & Investor Masterclass'
      },
      titlePrefix: {
        en: 'Spain',
        es: 'Descubre',
        fr: 'Découvrez',
        'en-ca': 'Spain'
      },
      titleHighlight: {
        en: 'Unlocked',
        es: 'España',
        fr: 'l\'Espagne',
        'en-ca': 'Unlocked'
      },
      subtitleText: {
        en: 'The complete practical guide for buyers and investors from the US, Canada and Puerto Rico: how to safely buy property, obtain residence visas, and enjoy the Mediterranean lifestyle in Spain.',
        es: 'La guía práctica integral para compradores e inversores de EE.UU., Canadá y Puerto Rico: cómo comprar propiedades de forma 100% segura, gestionar visados de residencia y disfrutar del estilo de vida mediterráneo en España.',
        fr: 'Le guide pratique complet pour les acheteurs et investisseurs: comment acheter en toute sécurité, obtenir un visa de résidence et vivre en Espagne.',
        'en-ca': 'The complete practical guide for buyers and investors from North America: safely buy property, obtain visas, and enjoy life in Spain.'
      },
      sectionHeadline: {
        en: 'Everything You Need to Know Before Buying or Moving to Spain',
        es: 'Todo lo que necesitas saber antes de comprar o mudarte a España',
        fr: 'Tout ce que vous devez savoir avant d\'acheter ou vous installer en Espagne',
        'en-ca': 'Everything You Need to Know Before Buying or Moving to Spain'
      },
      sectionSubheadline: {
        en: 'Avoid costly mistakes. Learn the legal, tax, financial, and lifestyle secrets from Spain\'s leading international real estate specialists.',
        es: 'Evita errores costosos. Conoce las claves legales, fiscales, de financiación y estilo de vida con los especialistas de RE/MAX Inmomás.',
        fr: 'Évitez les erreurs coûteuses. Découvrez les aspects juridiques, fiscaux et financiers avec nos spécialistes RE/MAX Inmomás.',
        'en-ca': 'Avoid costly mistakes. Learn the legal, tax, financial, and lifestyle secrets from RE/MAX Inmomás.'
      },
      bannerText: {
        en: 'Spain Unlocked · 12 PM EDT / 6 PM Spain · Free Masterclass for Buyers & Investors',
        es: 'Descubre España · 12 PM EDT / 18 h España · Masterclass Gratuita para Compradores e Inversores',
        fr: 'Découvrez l\'Espagne · 12 h EDT / 18 h Espagne · Masterclass Gratuite pour Acheteurs & Investisseurs',
        'en-ca': 'Spain Unlocked · 12 PM EDT / 6 PM Spain · Free Masterclass for Buyers & Investors'
      },
      formCardTitle: {
        en: 'Spain Unlocked · Free Masterclass Registration',
        es: 'Descubre España · Registro Gratuito a la Masterclass',
        fr: 'Découvrez l\'Espagne · Inscription Gratuite',
        'en-ca': 'Spain Unlocked · Free Masterclass Registration'
      },
      organizationLabel: {
        en: 'Primary Goal / Interest in Spain *',
        es: 'Objetivo Principal / Interés en España *',
        fr: 'Objectif Principal / Intérêt en Espagne *',
        'en-ca': 'Primary Goal / Interest in Spain *'
      },
      organizationPlaceholder: 'e.g. Buying a Holiday Home / Golden Visa / Relocating',
      benefits: [
        {
          icon: '🛡️',
          title: { en: 'Safe Buying Process & Legal Security', es: 'Compra 100% Segura y Garantías', fr: 'Achat Sécurisé & Garanties', 'en-ca': 'Safe Buying Process & Legal Security' },
          desc: { en: 'NIE number, bank accounts, contracts (Arras), registry checks, and notary closing without surprises.', es: 'Obtención de NIE, apertura de cuenta bancaria, contratos de arras, verificación registral y firma notarial sin sorpresas.', fr: 'Numéro NIE, comptes bancaires, contrats et notaire sans surprises.', 'en-ca': 'NIE number, bank accounts, contracts and notary closing.' }
        },
        {
          icon: '🛂',
          title: { en: 'Visas & Residency Pathways', es: 'Visados y Vías de Residencia', fr: 'Visas & Chemins de Résidence', 'en-ca': 'Visas & Residency Pathways' },
          desc: { en: 'Digital Nomad Visa, Non-Lucrative Visa, and Real Estate Investment residency requirements explained simply.', es: 'Visado de Nómada Digital, Visado No Lucrativo y requisitos de residencia por inversión inmobiliaria explicados con claridad.', fr: 'Visa Nomade Digital, Visa Non Lucratif et options de résidence.', 'en-ca': 'Digital Nomad Visa, Non-Lucrative Visa, and residency requirements.' }
        },
        {
          icon: '🏖️',
          title: { en: 'Best Areas: Coast, Sun & Cities', es: 'Mejores Zonas: Costa, Sol y Ciudades', fr: 'Meilleures Régions: Côte & Villes', 'en-ca': 'Best Areas: Coast, Sun & Cities' },
          desc: { en: 'Compare Costa Blanca (Alicante/Jávea), Costa del Sol (Málaga/Marbella), Madrid and Valencia for lifestyle & ROI.', es: 'Compara Costa Blanca (Alicante/Jávea), Costa del Sol (Málaga/Marbella), Madrid y Valencia según estilo de vida y rentabilidad.', fr: 'Comparez Costa Blanca, Costa del Sol, Madrid et Valence.', 'en-ca': 'Compare Costa Blanca, Costa del Sol, Madrid and Valencia.' }
        },
        {
          icon: '💶',
          title: { en: 'Taxes, Mortgages & Financing', es: 'Impuestos, Hipotecas y Financiación', fr: 'Fiscalité, Prêts & Financement', 'en-ca': 'Taxes, Mortgages & Financing' },
          desc: { en: 'How non-resident mortgages work (up to 70%), transfer taxes (ITP/IVA), tax exemptions, and running costs.', es: 'Cómo funcionan las hipotecas para no residentes (hasta el 70%), ITP/IVA, exenciones fiscales y costes de mantenimiento.', fr: 'Prêts non-résidents jusqu\'à 70%, taxes de transfert et coûts d\'entretien.', 'en-ca': 'How non-resident mortgages work (up to 70%) and taxes.' }
        },
        {
          icon: '🎙️',
          title: { en: 'Live Q&A with Relocation Advisors', es: 'Preguntas y Respuestas con Expertos', fr: 'Q&R en Direct avec nos Conseillers', 'en-ca': 'Live Q&A with Relocation Advisors' },
          desc: { en: 'Direct access to our Spanish property consultants, bilingual lawyers, and relocation specialists.', es: 'Acceso directo y en tiempo real a nuestros consultores inmobiliarios, abogados bilingües y equipo de relocalización.', fr: 'Accès direct à nos consultants immobiliers et avocats bilingues.', 'en-ca': 'Direct access to our property consultants and lawyers.' }
        }
      ]
    }
  };

  async function getWebinarSettings() {
    // 1. Check localStorage first for instant synchronous/cached response
    let currentSettings = null;
    try {
      const cached = localStorage.getItem('remax_webinar_settings');
      if (cached) currentSettings = JSON.parse(cached);
    } catch (e) {}

    // 2. If online and not in demo mode, try fetching from Firestore
    if (!App.demoMode && App.db) {
      try {
        const doc = await App.db.collection('system_settings').doc('webinar_active').get();
        if (doc.exists) {
          currentSettings = { ...DEFAULT_WEBINAR_SETTINGS, ...doc.data() };
          localStorage.setItem('remax_webinar_settings', JSON.stringify(currentSettings));
        }
      } catch (err) {
        console.warn('[Webinar] Could not fetch settings from Firestore, using local/default:', err);
      }
    }

    if (!currentSettings) {
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_WEBINAR_SETTINGS));
      try { localStorage.setItem('remax_webinar_settings', JSON.stringify(currentSettings)); } catch(e) {}
    }

    return currentSettings;
  }

  async function saveWebinarSettings(newSettings) {
    const merged = {
      ...DEFAULT_WEBINAR_SETTINGS,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage
    try {
      localStorage.setItem('remax_webinar_settings', JSON.stringify(merged));
    } catch (e) {}

    if (App.demoMode) {
      App.demoData.webinar_settings = merged;
      saveDemoData();
    } else if (App.db) {
      try {
        await App.db.collection('system_settings').doc('webinar_active').set(merged, { merge: true });
      } catch (err) {
        console.warn('[Webinar] Failed to save settings to Firestore, saved locally:', err);
      }
    }

    return merged;
  }

  function getDefaultWebinarSettings() {
    return JSON.parse(JSON.stringify(DEFAULT_WEBINAR_SETTINGS));
  }

  async function deleteDossierLead(leadId) {
    if (!leadId) throw new Error('Lead ID is required.');

    if (App.demoMode) {
      if (!App.demoData.dossier_leads) App.demoData.dossier_leads = [];
      const idx = App.demoData.dossier_leads.findIndex(l => l.id === leadId);
      if (idx === -1) throw new Error('Lead not found.');
      App.demoData.dossier_leads.splice(idx, 1);
      saveDemoData();
    } else {
      await App.db.collection('dossier_leads').doc(leadId).delete();
    }
    return true;
  }

  /* ---- Assign Lead To Agent ---- */
  async function assignLeadToAgent(leadId, agentId, agentName) {
    if (App.demoMode) {
      if (!App.demoData.dossier_leads) App.demoData.dossier_leads = [];
      const lead = App.demoData.dossier_leads.find(l => l.id === leadId);
      if (!lead) throw new Error('Lead not found.');
      
      lead.localAgentId = agentId;
      lead.localAgentName = agentName;
      lead.assignedAt = new Date().toISOString();
      
      if (!App.demoData.clients) App.demoData.clients = [];
      let client = App.demoData.clients.find(c => c.email.toLowerCase() === lead.email.toLowerCase());
      if (!client) {
        client = {
          id: 'client_' + Date.now(),
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || '—',
          status: 'new',
          referredBy: null,
          localAgentId: agentId,
          localAgentName: agentName,
          needsUCI: false,
          needsFuster: false,
          needsHolidays: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          interestArea: 'Buyer Guide Lead',
          statusHistory: [{
            status: 'new',
            date: new Date().toISOString(),
            note: 'Created from Buyer Guide Lead and assigned to ' + agentName
          }]
        };
        App.demoData.clients.push(client);
      } else {
        client.localAgentId = agentId;
        client.localAgentName = agentName;
        client.updatedAt = new Date().toISOString();
        if (!client.statusHistory) client.statusHistory = [];
        client.statusHistory.push({
          status: client.status,
          date: new Date().toISOString(),
          note: 'Assigned local agent ' + agentName + ' via Buyer Guide Lead'
        });
      }
      
      saveDemoData();
      return true;
    } else {
      const leadRef = App.db.collection('dossier_leads').doc(leadId);
      await leadRef.update({
        localAgentId: agentId,
        localAgentName: agentName,
        assignedAt: new Date().toISOString()
      });
      
      const leadDoc = await leadRef.get();
      const lead = leadDoc.data();
      
      const clientQuery = await App.db.collection('clients').where('email', '==', lead.email).get();
      if (clientQuery.empty) {
        const newClientId = 'client_' + Date.now();
        await App.db.collection('clients').doc(newClientId).set({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone || '—',
          status: 'new',
          referredBy: null,
          localAgentId: agentId,
          localAgentName: agentName,
          needsUCI: false,
          needsFuster: false,
          needsHolidays: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          interestArea: 'Buyer Guide Lead',
          statusHistory: [{
            status: 'new',
            date: new Date().toISOString(),
            note: 'Created from Buyer Guide Lead and assigned to ' + agentName
          }]
        });
      } else {
        const clientDoc = clientQuery.docs[0];
        const clientData = clientDoc.data();
        const statusHistory = clientData.statusHistory || [];
        statusHistory.push({
          status: clientData.status || 'new',
          date: new Date().toISOString(),
          note: 'Assigned local agent ' + agentName + ' via Buyer Guide Lead'
        });
        await clientDoc.ref.update({
          localAgentId: agentId,
          localAgentName: agentName,
          updatedAt: new Date().toISOString(),
          statusHistory: statusHistory
        });
      }
      return true;
    }
  }

  /* ---- Add Client Manually ---- */
  async function addClientManually(clientData) {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated.');

    const newClient = {
      id: 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phone: clientData.phone || '—',
      country: clientData.country || '—',
      budget: clientData.budget || '—',
      interestArea: clientData.interestArea || '—',
      notes: clientData.notes || '',
      timeline: clientData.timeline || '—',
      objective: clientData.objective || '—',
      needsUCI: clientData.needsUCI || false,
      needsFuster: clientData.needsFuster || false,
      needsHolidays: clientData.needsHolidays || false,
      status: 'contacted',
      referredBy: (user.role === 'realtor' || user.role === 'colaborador') ? user.id : null,
      brokerId: (user.role === 'broker') ? user.id : (user.brokerId || null),
      localAgentId: (user.role === 'agent_inmomas') ? user.id : null,
      localAgentName: (user.role === 'agent_inmomas') ? (user.firstName + ' ' + user.lastName) : null,
      addedManuallyBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{
        status: 'contacted',
        date: new Date().toISOString(),
        note: 'Added manually by ' + user.firstName + ' ' + user.lastName
      }]
    };

    // If realtor, also set brokerId from realtor's broker
    if (user.role === 'realtor' && user.brokerId) {
      newClient.brokerId = user.brokerId;
    }

    if (App.demoMode) {
      if (!App.demoData.clients) App.demoData.clients = [];
      App.demoData.clients.push(newClient);
      saveDemoData();
    } else {
      await App.db.collection('clients').doc(newClient.id).set(newClient);
    }

    return newClient;
  }

  /* ---- Add Client via Referral (public, no auth required) ---- */
  async function addReferralClient(clientData) {
    const newClient = {
      id: 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phone: clientData.phone || '—',
      currentLocation: clientData.currentLocation || '—',
      budget: clientData.budget || 'TBD',
      interestArea: clientData.interestArea || '—',
      timeline: clientData.timeline || '—',
      objective: clientData.objective || '—',
      notes: clientData.notes || '',
      needsUCI: clientData.needsUCI || false,
      needsFuster: clientData.needsFuster || false,
      needsHolidays: clientData.needsHolidays || false,
      status: 'contacted',
      referredBy: clientData.referredBy || null,
      realtorId: clientData.realtorId || null,
      realtorName: clientData.realtorName || null,
      brokerId: clientData.brokerId || null,
      localAgentId: clientData.localAgentId || null,
      localAgentName: clientData.localAgentName || null,
      source: 'referral',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{
        status: 'contacted',
        date: new Date().toISOString(),
        note: 'Registered via referral link'
      }]
    };

    if (App.demoMode) {
      if (!App.demoData.clients) App.demoData.clients = [];
      App.demoData.clients.push(newClient);
      saveDemoData();
    } else {
      await App.db.collection('clients').doc(newClient.id).set(newClient);
    }

    return newClient;
  }

  /* ---- Add Professional via Referral (public, no auth required) ---- */
  async function addReferralUser(userData) {
    const newUser = {
      id: userData.role + '_ref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone || '—',
      role: userData.role, // 'realtor' or 'broker'
      status: 'pending',
      agencyName: userData.agencyName || '',
      market: userData.market || '',
      notes: userData.notes || '',
      referralCode: `${userData.role === 'broker' ? 'BRK' : 'REA'}-${(userData.lastName || 'USER').toUpperCase()}`,
      source: 'referral',
      referredBy: userData.referredBy || null,
      brokerId: userData.brokerId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (App.demoMode) {
      if (!App.demoData.users) App.demoData.users = [];
      App.demoData.users.push(newUser);
      saveDemoData();
    } else {
      await App.db.collection('users').doc(newUser.id).set(newUser);
    }

    if (window.App && window.App.notifications) {
      window.App.notifications.onNewUserRegistration(newUser).catch(() => {});
      
      if (newUser.referredBy) {
        try {
          const allUsers = await getAllUsers();
          const referrerAgent = allUsers.find(u => u.id === newUser.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (newUser.referredBy || "").toUpperCase()));
          if (referrerAgent) {
            window.App.notifications.onNewReferredCollaborator(newUser, referrerAgent).catch(() => {});
          }
        } catch(e) {
          console.warn('[Notifications] Error finding referrer agent:', e);
        }
      }
    }

    return newUser;
  }

  /* ---- Delete Client ---- */
  async function deleteClient(clientId) {
    if (!clientId) throw new Error('Client ID is required.');

    if (App.demoMode) {
      const idx = App.demoData.clients.findIndex(c => c.id === clientId);
      if (idx === -1) throw new Error('Client not found.');
      App.demoData.clients.splice(idx, 1);
      // Also remove related commission
      const commIdx = App.demoData.commissions.findIndex(c => c.clientId === clientId);
      if (commIdx !== -1) App.demoData.commissions.splice(commIdx, 1);
      saveDemoData();
    } else {
      await App.db.collection('clients').doc(clientId).delete();
      // Also delete related commissions
      const commQuery = await App.db.collection('commissions').where('clientId', '==', clientId).get();
      const batch = App.db.batch();
      commQuery.docs.forEach(doc => batch.delete(doc.ref));
      if (!commQuery.empty) await batch.commit();
    }
    return true;
  }

  /* ============================================
     Newsletter Functions
     ============================================ */

  /**
   * Returns all users that have consented to newsletter, optionally filtered by role.
   * @param {string|null} roleFilter - 'broker', 'realtor', 'agent_inmomas', or null for all.
   */
  async function getNewsletterSubscribers(roleFilter) {
    const users = await getAllUsers();
    return users.filter(u => {
      const hasConsent = u.newsletterConsent === true;
      const isActive = u.status === 'active';
      const matchesRole = !roleFilter || u.role === roleFilter;
      return hasConsent && isActive && matchesRole;
    });
  }

  /**
   * Saves a newsletter campaign record.
   * In demo mode: stored in App.demoData.newsletters (localStorage).
   * In Firebase mode: saved to Firestore 'newsletters' collection.
   * Also sends real emails via EmailJS if configured.
   *
   * @param {object} newsletterData - { subject, body, recipientRole, recipientCount, recipientEmails, sentBy }
   *
   * --- HOW TO ACTIVATE EMAILJS ---
   * 1. Create a free account at https://www.emailjs.com (200 emails/month free)
   * 2. Add your Email Service (Gmail, Outlook, etc.) → get SERVICE_ID
   * 3. Create an Email Template with variables: {{to_email}}, {{subject}}, {{message}}, {{sent_by}}
   *    → get TEMPLATE_ID
   * 4. Account → General → copy Public Key → paste in app.html where it says 'YOUR_PUBLIC_KEY'
   * 5. Fill in EMAILJS_SERVICE_ID and EMAILJS_TEMPLATE_ID below
   */
  async function saveNewsletter(newsletterData) {
    // ── EmailJS configuration ─────────────────────────────────────────────
    // TODO: Replace with your real IDs from https://www.emailjs.com
    const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // e.g. 'service_abc123'
    const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xyz456'
    const emailjsReady = (
      typeof emailjs !== 'undefined' &&
      EMAILJS_SERVICE_ID  !== 'YOUR_SERVICE_ID' &&
      EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
    );
    // ─────────────────────────────────────────────────────────────────────

    const record = {
      ...newsletterData,
      sentAt: new Date().toISOString(),
      status: emailjsReady ? 'sent' : 'simulated',
      id: 'nl-' + Date.now()
    };

    // Send real emails via EmailJS (one per recipient)
    if (emailjsReady && Array.isArray(newsletterData.recipientEmails)) {
      const sendPromises = newsletterData.recipientEmails.map(email =>
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: email,
          subject:  newsletterData.subject,
          message:  newsletterData.body,
          sent_by:  newsletterData.sentBy || 'RE/MAX Inmomás International'
        }).catch(err => {
          console.warn(`[EmailJS] Failed to send to ${email}:`, err);
        })
      );
      await Promise.allSettled(sendPromises);
    } else if (!emailjsReady) {
      console.info('[Newsletter] EmailJS not configured — campaign saved as simulated. See saveNewsletter() comments to activate real sending.');
    }

    // Always save the campaign record (Firestore or demo store)
    if (App.demoMode) {
      if (!App.demoData.newsletters) App.demoData.newsletters = [];
      App.demoData.newsletters.unshift(record);
      saveDemoData();
      return { success: true, record };
    } else {
      await App.db.collection('newsletters').doc(record.id).set(record);
      return { success: true, record };
    }
  }

  /**
   * Returns the history of sent newsletters, newest first.
   */
  async function getNewsletterHistory() {
    if (App.demoMode) {
      return (App.demoData.newsletters || []).sort(
        (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
      );
    } else {
      const snap = await App.db.collection('newsletters').orderBy('sentAt', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
    updateUserRole,
    updateUserReferral,
    updateProfile,
    updateAuthEmail,
    getAllUsers,
    getUser,
    getClients,
    updateClientStatus,
    deleteClient,
    assignLocalAgent,
    assignLeadToAgent,
    saveClientFinancials,
    updateClientPartnerFlags,
    getCommissions,
    onAuthChange,
    resetPassword,
    saveDemoData,
    saveDossierLead,
    getDossierLeads,
    deleteDossierLead,
    loginWithGoogle,
    registerWithGoogle,
    addClientManually,
    addReferralClient,
    addReferralUser,
    getNewsletterSubscribers,
    saveNewsletter,
    getNewsletterHistory,
    saveWebinarRegistration,
    getWebinarRegistrations,
    deleteUser,
    deleteWebinarRegistration,
    getWebinarSettings,
    saveWebinarSettings,
    getDefaultWebinarSettings
  };
})();
