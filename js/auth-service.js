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
  }

  function saveDemoData() {
    if (!App.demoMode) return;
    localStorage.setItem('remax_demo_users', JSON.stringify(App.demoData.users));
    localStorage.setItem('remax_demo_clients', JSON.stringify(App.demoData.clients));
    localStorage.setItem('remax_demo_commissions', JSON.stringify(App.demoData.commissions));
    localStorage.setItem('remax_demo_dossier_leads', JSON.stringify(App.demoData.dossier_leads || []));
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
        status: 'pending',
        brokerStatus: role === 'realtor' && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || '',
        brokerId: brokerId || null,
        referralCode: `${role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : 'REA')}-${lastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
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
        referralCode: `${role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : 'REA')}-${lastName.toUpperCase()}-${uid.substring(0, 4)}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);
      
      currentUser = { id: uid, ...userData };
      notifyAuthChange();
      return { success: true, user: currentUser };
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

      if (userData.status === 'rejected') {
        await App.firebaseAuth.signOut();
        throw new Error('Your application has been rejected. Please contact support.');
      }

      // Auto-generate referralCode if missing (for users registered before this field existed)
      if (!userData.referralCode && userData.role && userData.lastName) {
        const prefix = userData.role === 'broker' ? 'BRK' : (userData.role === 'agent_inmomas' ? 'LOC' : 'REA');
        const uid = credential.user.uid;
        userData.referralCode = `${prefix}-${userData.lastName.toUpperCase()}-${uid.substring(0, 4)}`;
        // Save back to Firestore
        await App.db.collection('users').doc(uid).update({ referralCode: userData.referralCode });
        console.log('[Auth] Auto-generated referralCode:', userData.referralCode);
      }

      currentUser = { id: credential.user.uid, ...userData };
      notifyAuthChange();
      return currentUser;
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
        const prefix = userData.role === 'broker' ? 'BRK' : (userData.role === 'agent_inmomas' ? 'LOC' : 'REA');
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
    const { role, firstName, lastName, agencyName, phone, country, brokerId } = data;

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
        referralCode: `${role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : 'REA')}-${mockLastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        createdAt: new Date().toISOString()
      };

      App.demoData.users.push(newUser);
      saveDemoData();

      currentUser = { ...newUser };
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      notifyAuthChange();

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
        referralCode: `${role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : 'REA')}-${(finalLastName || 'USER').toUpperCase()}-${uid.substring(0, 4)}`,
        profileImage: firebaseUser.photoURL || null,
        agreementSigned: false,
        agreementSignedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);

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
      return true;
    } else {
      await App.db.collection('users').doc(userId).update({
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
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
        const prefix = newRole === 'broker' ? 'BRK' : (newRole === 'agent_inmomas' ? 'LOC' : 'REA');
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
          const prefix = newRole === 'broker' ? 'BRK' : (newRole === 'agent_inmomas' ? 'LOC' : 'REA');
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
      return newLead;
    } else {
      const docRef = await App.db.collection('dossier_leads').add(newLead);
      return { id: docRef.id, ...newLead };
    }
  }

  async function getDossierLeads() {
    if (App.demoMode) {
      return App.demoData.dossier_leads || [];
    } else {
      const snapshot = await App.db.collection('dossier_leads').orderBy('createdAt', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
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
      status: 'contacted',
      referredBy: (user.role === 'realtor') ? user.id : null,
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
    updateProfile,
    getAllUsers,
    getUser,
    getClients,
    updateClientStatus,
    deleteClient,
    assignLocalAgent,
    assignLeadToAgent,
    saveClientFinancials,
    getCommissions,
    onAuthChange,
    resetPassword,
    saveDemoData,
    saveDossierLead,
    getDossierLeads,
    loginWithGoogle,
    registerWithGoogle,
    addClientManually,
    addReferralClient,
    addReferralUser
  };
})();
