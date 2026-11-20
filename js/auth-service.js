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

  const JOSE_MARTINEZ_PHONE = '+34 647 86 19 68';
  const JOSE_LEGACY_PHONES = new Set([
    '', '647861968', '+34647861968', '+34 647 861 968',
    '966665651', '+34966665651', '+34 966 665 651', '+34 966 66 56 51'
  ]);

  function isJoseMartinezAccountObj(u) {
    if (!u || typeof u !== 'object') return false;
    const emailLower = String(u.email || '').trim().toLowerCase();
    const refCode = String(u.referralCode || '').trim();
    return (
      emailLower === 'jose.martinez@remax.es' ||
      emailLower === 'spainconnection0@remax.es' ||
      refCode === 'LOC-MARTINEZ -GBPi' ||
      refCode === 'ADM-MARTINEZ' ||
      u.id === 'GBPiUDjC5RVLru7Paw6T14iSD0k1' ||
      u.id === 'zDEjaxADVwN8p7j7B6JUW9ZqKwj2' ||
      u.id === '4IoN50fO9HPIJrdc9IQI2867ka13' ||
      u.id === 'admin-002' ||
      u.id === 'admin-003'
    );
  }

  function isSuperAdminProfile(email, fullName = '') {
    const emailLower = String(email || '').trim().toLowerCase();
    const fullNameLower = String(fullName || '').toLowerCase();
    return (
      emailLower === 'maia.honczaryk@remax.es' ||
      emailLower === 'jose.martinez@remax.es' ||
      emailLower === 'spainconnection0@gmail.com' ||
      emailLower === 'inmomas@remax.es' ||
      emailLower === 'admin@remax-inmomas.com' ||
      (fullNameLower.includes('maia') && (fullNameLower.includes('honczaryk') || fullNameLower.includes('belen') || fullNameLower.includes('belón')))
    );
  }

  function getSuperAdminReferralCode(email) {
    const emailLower = String(email || '').trim().toLowerCase();
    return emailLower === 'jose.martinez@remax.es' ? 'ADM-MARTINEZ' : 'ADM-INMOMAS';
  }

  function normalizeUserRoleObj(u) {
    if (!u || typeof u !== 'object') return u;
    const emailLower = String(u.email || '').trim().toLowerCase();
    const rawRole = String(u.role || '').trim().toLowerCase();
    if (emailLower === 'jose.martinez@remax.es' || emailLower === 'maia.honczaryk@remax.es') {
      u.role = 'admin';
      if (u.status !== 'active') u.status = 'active';
    } else if (rawRole === 'ambassador' || rawRole === 'embajador') {
      u.role = 'embajador';
    } else if (rawRole !== 'admin' && u.referralCode && String(u.referralCode).trim().toUpperCase().startsWith('EMB-')) {
      u.role = 'embajador';
    } else if (rawRole) {
      u.role = rawRole;
    }

    if (isJoseMartinezAccountObj(u)) {
      const curPhone = String(u.phone || '').trim();
      if (JOSE_LEGACY_PHONES.has(curPhone)) {
        u.phone = JOSE_MARTINEZ_PHONE;
      }
      if (u.buyerGuide && typeof u.buyerGuide === 'object') {
        const curMobile = String(u.buyerGuide.mobile || '').trim();
        if (JOSE_LEGACY_PHONES.has(curMobile)) {
          u.buyerGuide = { ...u.buyerGuide, mobile: JOSE_MARTINEZ_PHONE };
        }
      }
    }
    return u;
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
            } else {
              currentUser = normalizeUserRoleObj({ ...exists });
              delete currentUser.password;
              localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
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
                const userData = doc.data() || {};
                currentUser = normalizeUserRoleObj({ id: firebaseUser.uid, email: firebaseUser.email, ...userData });
                if (!currentUser.email) currentUser.email = firebaseUser.email;

                // Super Admin auto-elevation and normalization
                const emailLower = (currentUser.email || '').toLowerCase().trim();
                const fullNameLower = `${currentUser.firstName || ''} ${currentUser.lastName || ''} ${currentUser.name || ''}`.toLowerCase();
                const isSuperAdmin = isSuperAdminProfile(emailLower, fullNameLower);

                if (isSuperAdmin) {
                  const defaultRefCode = getSuperAdminReferralCode(emailLower);
                  let needUpdate = false;
                  const updates = {};
                  if (currentUser.role !== 'admin') {
                    currentUser.role = 'admin';
                    updates.role = 'admin';
                    needUpdate = true;
                  }
                  if (currentUser.status !== 'active') {
                    currentUser.status = 'active';
                    updates.status = 'active';
                    needUpdate = true;
                  }
                  if (!currentUser.referralCode || currentUser.referralCode.startsWith('BRK-') || currentUser.referralCode.startsWith('REA-')) {
                    currentUser.referralCode = defaultRefCode;
                    updates.referralCode = defaultRefCode;
                    needUpdate = true;
                  }
                  if (needUpdate) {
                    try {
                      await App.db.collection('users').doc(firebaseUser.uid).update(updates);
                      console.info('[Auth] SuperAdmin profile normalized in Firestore.');
                    } catch(e) {
                      console.warn('[Auth] Firestore update for SuperAdmin sync:', e);
                    }
                  }
                }
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
    const nationality = (data.nationality || country || '').trim();
    const inferredRegion = (App.utils && App.utils.resolveRegionFromCountry)
      ? App.utils.resolveRegionFromCountry(data.region || nationality || country || '')
      : '';
    const regions = Array.isArray(data.regions) && data.regions.length > 0
      ? data.regions
      : (inferredRegion ? [inferredRegion] : []);
    const primaryRegion = data.region || regions[0] || inferredRegion || '';
    const languages = Array.isArray(data.languages) ? data.languages : [];

    if (!email || !password || !firstName || !lastName || !role) {
      throw new Error('Please fill in all required fields.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (!['embajador', 'broker', 'realtor', 'client', 'colaborador', 'agent_inmomas'].includes(role)) {
      throw new Error('Invalid role selected.');
    }

    // Security check: 'embajador' applications are restricted to Admin or RE/MAX Inmomás Agent referral links
    if (role === 'embajador' && !data.referredByAdmin && !data.referredByAgentInmomas) {
      const refStr = String(referredBy || '').toUpperCase().trim();
      const validPrefix = refStr.startsWith('ADM-') || refStr.startsWith('LOC-') || refStr === 'ADMIN-001';
      if (!validPrefix && !data.inmomasAgentId) {
        throw new Error('Ambassador applications are exclusively available via an Administrator or RE/MAX Inmomás Agent invitation link.');
      }
    }

    // Hierarchy rule: A Colaborador can be direct, under a Broker, or under an Embajador — NEVER under an Agent (Realtor)
    if (role === 'colaborador' && referredBy) {
      const refStr = String(referredBy || '').toUpperCase().trim();
      if (refStr.startsWith('REA-')) {
        throw new Error('Un Colaborador puede operar directamente o bajo un Broker o Embajador, pero no puede estar vinculado debajo de un Agente.');
      }
    }

    const getPrefixForRole = (r) => {
      if (r === 'admin') return 'ADM';
      if (r === 'embajador') return 'EMB';
      if (r === 'broker') return 'BRK';
      if (r === 'agent_inmomas') return 'LOC';
      if (r === 'colaborador') return 'COL';
      return 'REA';
    };

    if (App.demoMode) {
      // Check duplicate email
      const exists = App.demoData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('An account with this email already exists.');
      }

      // Resolve umbrella embajadorId from referrer or selected broker if applicable
      let resolvedEmbajadorId = data.embajadorId || null;
      const cleanReferredBy = referredBy || data.inmomasAgentName || null;
      if (!resolvedEmbajadorId && referredBy && role !== 'embajador') {
        const refUser = App.demoData.users.find(u =>
          u.id === referredBy || (u.referralCode && u.referralCode.toUpperCase() === String(referredBy).toUpperCase())
        );
        if (refUser) {
          if (role === 'colaborador' && refUser.role === 'realtor') {
            throw new Error('Un Colaborador puede operar directamente o bajo un Broker o Embajador, pero no puede estar vinculado debajo de un Agente.');
          }
          resolvedEmbajadorId = refUser.role === 'embajador' ? refUser.id : (refUser.embajadorId || null);
        }
      }
      if (brokerId && ['realtor', 'colaborador'].includes(role)) {
        const selBroker = App.demoData.users.find(u => u.id === brokerId);
        if (selBroker) {
          if (!resolvedEmbajadorId && selBroker.embajadorId) {
            resolvedEmbajadorId = selBroker.embajadorId;
          } else if (resolvedEmbajadorId && !selBroker.embajadorId) {
            selBroker.embajadorId = resolvedEmbajadorId;
          }
        }
      }

      const newUser = {
        id: role.substring(0, 3) + '-' + Date.now(),
        email: email.toLowerCase(),
        password,
        role,
        status: 'pending',
        brokerStatus: ['realtor', 'colaborador'].includes(role) && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || '',
        agencyLogo: data.agencyLogo || null,
        phone: phone || '',
        country: country || nationality || '',
        nationality: nationality || country || '',
        region: primaryRegion,
        regions: regions,
        languages: languages,
        brokerId: brokerId || null,
        embajadorId: role === 'embajador' ? null : resolvedEmbajadorId,
        referralCode: `${getPrefixForRole(role)}-${lastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        termsAccepted: data.termsAccepted !== undefined ? data.termsAccepted : true,
        termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        inmomasAgentId: data.inmomasAgentId || null,
        inmomasAgentName: data.inmomasAgentName || null,
        notes: data.notes || '',
        referredBy: cleanReferredBy,
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
        // 1. If referred, notify the referring agent/realtor FIRST
        if (newUser.referredBy) {
          try {
            const allUsers = App.demoData.users;
            const referrerAgent = allUsers.find(u => u.id === newUser.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (newUser.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              await window.App.notifications.onNewReferredCollaborator(newUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }

        // 2. Notify admins (The Spain Connection, then Maia)
        await window.App.notifications.onNewUserRegistration(newUser).catch(() => {});
      }

      // Auto-enroll user/client in upcoming webinar (silent since onNewUserRegistration already notified)
      if (newUser.role === 'client') {
        await autoEnrollClientWebinar(newUser, { silent: true });
      } else if (['realtor', 'broker', 'embajador', 'colaborador'].includes(newUser.role)) {
        await autoEnrollRealtorWebinar(newUser, { silent: true });
      }

      return { success: true, user: newUser };
    } else {
      // Firebase registration
      const credential = await App.firebaseAuth.createUserWithEmailAndPassword(email, password);
      const uid = credential.user.uid;

      const emailLower = email.toLowerCase().trim();
      const fullNameLower = `${firstName || ''} ${lastName || ''}`.toLowerCase();
      const isMaiaAccount = isSuperAdminProfile(emailLower, fullNameLower);

      const finalRole = isMaiaAccount ? 'admin' : role;
      const finalStatus = isMaiaAccount ? 'active' : 'pending';
      const finalReferralCode = isMaiaAccount ? getSuperAdminReferralCode(emailLower) : `${getPrefixForRole(role)}-${lastName.toUpperCase()}-${uid.substring(0, 4)}`;

      // Resolve umbrella embajadorId from referrer (ID or referralCode) or selected broker
      let resolvedEmbajadorId = data.embajadorId || null;
      let cleanReferredBy = referredBy || data.inmomasAgentName || null;
      if (!resolvedEmbajadorId && referredBy && finalRole !== 'embajador' && finalRole !== 'admin') {
        try {
          const refDoc = await App.db.collection('users').doc(referredBy).get();
          if (refDoc.exists) {
            const rData = refDoc.data();
            if (finalRole === 'colaborador' && rData.role === 'realtor') {
              cleanReferredBy = data.inmomasAgentName || null;
            } else {
              resolvedEmbajadorId = rData.role === 'embajador' ? refDoc.id : (rData.embajadorId || null);
            }
          } else {
            const byCodeSnap = await App.db.collection('users')
              .where('referralCode', '==', String(referredBy).trim().toUpperCase())
              .limit(1)
              .get();
            if (!byCodeSnap.empty) {
              const rDoc = byCodeSnap.docs[0];
              const rData = rDoc.data();
              if (finalRole === 'colaborador' && rData.role === 'realtor') {
                cleanReferredBy = data.inmomasAgentName || null;
              } else {
                resolvedEmbajadorId = rData.role === 'embajador' ? rDoc.id : (rData.embajadorId || null);
              }
            }
          }
        } catch (_) {}
      }
      if (brokerId && ['realtor', 'colaborador'].includes(finalRole)) {
        try {
          const bDoc = await App.db.collection('users').doc(brokerId).get();
          if (bDoc.exists) {
            const bData = bDoc.data();
            if (!resolvedEmbajadorId && bData.embajadorId) {
              resolvedEmbajadorId = bData.embajadorId;
            } else if (resolvedEmbajadorId && !bData.embajadorId) {
              await App.db.collection('users').doc(brokerId).update({ embajadorId: resolvedEmbajadorId });
            }
          }
        } catch (_) {}
      }

      const userData = {
        email: emailLower,
        role: finalRole,
        status: finalStatus,
        brokerStatus: ['realtor', 'colaborador'].includes(finalRole) && brokerId ? 'pending' : null,
        firstName,
        lastName,
        agencyName: agencyName || (isMaiaAccount ? 'RE/MAX Inmomás' : ''),
        agencyLogo: data.agencyLogo || null,
        phone: phone || '',
        country: country || nationality || '',
        nationality: nationality || country || '',
        region: primaryRegion,
        regions: regions,
        languages: languages,
        brokerId: brokerId || null,
        embajadorId: (finalRole === 'embajador' || finalRole === 'admin') ? null : resolvedEmbajadorId,
        referralCode: finalReferralCode,
        profileImage: null,
        agreementSigned: isMaiaAccount ? true : false,
        agreementSignedAt: isMaiaAccount ? new Date().toISOString() : null,
        termsAccepted: data.termsAccepted !== undefined ? data.termsAccepted : true,
        termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        inmomasAgentId: data.inmomasAgentId || null,
        inmomasAgentName: data.inmomasAgentName || null,
        notes: data.notes || '',
        referredBy: cleanReferredBy,
        source: source || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);

      // Notify referring agent and admins of new registration
      if (window.App && window.App.notifications) {
        const fullUser = { id: uid, ...userData };

        // 1. If referred, notify the referring agent/realtor FIRST
        if (userData.referredBy) {
          try {
            const allUsers = await getAllUsers();
            const referrerAgent = allUsers.find(u => u.id === userData.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (userData.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              await window.App.notifications.onNewReferredCollaborator(fullUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }

        // 2. Notify admins (The Spain Connection, then Maia)
        await window.App.notifications.onNewUserRegistration(fullUser).catch(() => {});
      }

      // Auto-enroll user/client in upcoming webinar (silent since onNewUserRegistration already notified)
      const fullUser = { id: uid, ...userData };
      if (finalRole === 'client') {
        await autoEnrollClientWebinar(fullUser, { silent: true });
      } else if (['realtor', 'broker'].includes(finalRole)) {
        await autoEnrollRealtorWebinar(fullUser, { silent: true });
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
          const prefix = userData.role === 'admin' ? 'ADM' : (userData.role === 'embajador' ? 'EMB' : (userData.role === 'broker' ? 'BRK' : (userData.role === 'agent_inmomas' ? 'LOC' : (userData.role === 'colaborador' ? 'COL' : 'REA'))));
          const uid = credential.user.uid;
          userData.referralCode = `${prefix}-${userData.lastName.toUpperCase()}-${uid.substring(0, 4)}`;
          // Save back to Firestore
          await App.db.collection('users').doc(uid).update({ referralCode: userData.referralCode });
          console.log('[Auth] Auto-generated referralCode:', userData.referralCode);
        }

        // Super Admin auto-elevation and normalization
        const emailLower = (userData.email || credential.user.email || '').toLowerCase().trim();
        const fullNameLower = `${userData.firstName || ''} ${userData.lastName || ''} ${userData.name || ''}`.toLowerCase();
        const isSuperAdmin = isSuperAdminProfile(emailLower, fullNameLower);

        if (isSuperAdmin) {
          const defaultRefCode = getSuperAdminReferralCode(emailLower);
          let needUpdate = false;
          const updates = {};
          if (userData.role !== 'admin') {
            userData.role = 'admin';
            updates.role = 'admin';
            needUpdate = true;
          }
          if (userData.status !== 'active') {
            userData.status = 'active';
            updates.status = 'active';
            needUpdate = true;
          }
          if (!userData.referralCode || userData.referralCode.startsWith('BRK-') || userData.referralCode.startsWith('REA-')) {
            userData.referralCode = defaultRefCode;
            updates.referralCode = defaultRefCode;
            needUpdate = true;
          }
          if (needUpdate) {
            try {
              await App.db.collection('users').doc(credential.user.uid).update(updates);
            } catch (_) {}
          }
        }

        currentUser = normalizeUserRoleObj({ id: credential.user.uid, email: credential.user.email, ...userData });
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
        const prefix = userData.role === 'admin' ? 'ADM' : (userData.role === 'embajador' ? 'EMB' : (userData.role === 'broker' ? 'BRK' : (userData.role === 'agent_inmomas' ? 'LOC' : (userData.role === 'colaborador' ? 'COL' : 'REA'))));
        userData.referralCode = `${prefix}-${userData.lastName.toUpperCase()}-${firebaseUser.uid.substring(0, 4)}`;
        await App.db.collection('users').doc(firebaseUser.uid).update({ referralCode: userData.referralCode });
      }

      currentUser = normalizeUserRoleObj({ id: firebaseUser.uid, ...userData });
      notifyAuthChange();
      return currentUser;
    }
  }

  /* ---- Google Registration ---- */
  async function registerWithGoogle(data) {
    const { role, firstName, lastName, agencyName, phone, country, brokerId, referredBy, source } = data;
    const nationality = (data.nationality || country || '').trim();
    const inferredRegion = (App.utils && App.utils.resolveRegionFromCountry)
      ? App.utils.resolveRegionFromCountry(data.region || nationality || country || '')
      : '';
    const regions = Array.isArray(data.regions) && data.regions.length > 0
      ? data.regions
      : (inferredRegion ? [inferredRegion] : []);
    const primaryRegion = data.region || regions[0] || inferredRegion || '';
    const languages = Array.isArray(data.languages) ? data.languages : [];

    if (!role) {
      throw new Error('Please select a role (Broker or Realtor).');
    }

    if (!['embajador', 'broker', 'realtor', 'client', 'colaborador', 'agent_inmomas'].includes(role)) {
      throw new Error('Invalid role selected.');
    }

    if (role === 'embajador' && !data.referredByAdmin && !data.referredByAgentInmomas) {
      const refStr = String(referredBy || '').toUpperCase().trim();
      const validPrefix = refStr.startsWith('ADM-') || refStr.startsWith('LOC-') || refStr === 'ADMIN-001';
      if (!validPrefix && !data.inmomasAgentId) {
        throw new Error('Ambassador applications are exclusively available via an Administrator or RE/MAX Inmomás Agent invitation link.');
      }
    }

    if (role === 'colaborador' && referredBy) {
      const refStr = String(referredBy || '').toUpperCase().trim();
      if (refStr.startsWith('REA-')) {
        throw new Error('Un Colaborador puede operar directamente o bajo un Broker o Embajador, pero no puede estar vinculado debajo de un Agente.');
      }
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
        brokerStatus: ['realtor', 'colaborador'].includes(role) && brokerId ? 'pending' : null,
        firstName: mockFirstName,
        lastName: mockLastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || nationality || '',
        nationality: nationality || country || '',
        region: primaryRegion,
        regions: regions,
        languages: languages,
        brokerId: brokerId || null,
        embajadorId: role === 'embajador' ? null : (data.embajadorId || null),
        referralCode: `${role === 'admin' ? 'ADM' : (role === 'embajador' ? 'EMB' : (role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : (role === 'colaborador' ? 'COL' : 'REA'))))}-${mockLastName.toUpperCase()}`,
        profileImage: null,
        agreementSigned: false,
        agreementSignedAt: null,
        termsAccepted: data.termsAccepted !== undefined ? data.termsAccepted : true,
        termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        inmomasAgentName: data.inmomasAgentName || null,
        referredBy: referredBy || data.inmomasAgentName || null,
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
        // 1. If referred, notify the referring agent/realtor FIRST
        if (newUser.referredBy) {
          try {
            const allUsers = App.demoData.users;
            const referrerAgent = allUsers.find(u => u.id === newUser.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (newUser.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              await window.App.notifications.onNewReferredCollaborator(newUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }

        // 2. Notify admins (The Spain Connection, then Maia)
        await window.App.notifications.onNewUserRegistration(newUser).catch(() => {});
      }

      // Auto-enroll in webinar
      if (newUser.role === 'client') {
        await autoEnrollClientWebinar(newUser, { silent: true });
      } else if (['realtor', 'broker'].includes(newUser.role)) {
        await autoEnrollRealtorWebinar(newUser, { silent: true });
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
        brokerStatus: ['realtor', 'colaborador'].includes(role) && brokerId ? 'pending' : null,
        firstName: finalFirstName,
        lastName: finalLastName,
        agencyName: agencyName || '',
        phone: phone || '',
        country: country || nationality || '',
        nationality: nationality || country || '',
        region: primaryRegion,
        regions: regions,
        languages: languages,
        brokerId: brokerId || null,
        embajadorId: role === 'embajador' ? null : (data.embajadorId || null),
        referralCode: `${role === 'admin' ? 'ADM' : (role === 'embajador' ? 'EMB' : (role === 'broker' ? 'BRK' : (role === 'agent_inmomas' ? 'LOC' : (role === 'colaborador' ? 'COL' : 'REA'))))}-${(finalLastName || 'USER').toUpperCase()}-${uid.substring(0, 4)}`,
        profileImage: firebaseUser.photoURL || null,
        agreementSigned: false,
        agreementSignedAt: null,
        termsAccepted: data.termsAccepted !== undefined ? data.termsAccepted : true,
        termsAcceptedAt: data.termsAcceptedAt || new Date().toISOString(),
        newsletterConsent: data.newsletterConsent || false,
        newsletterConsentAt: data.newsletterConsent ? new Date().toISOString() : null,
        inmomasAgentName: data.inmomasAgentName || null,
        referredBy: referredBy || data.inmomasAgentName || null,
        source: source || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await App.db.collection('users').doc(uid).set(userData);

      // Notify admin of new registration via Google
      if (window.App && window.App.notifications) {
        const fullUser = { id: uid, ...userData };
        await window.App.notifications.onNewUserRegistration(fullUser).catch(() => {});

        // If referred, notify the referring agent
        if (userData.referredBy) {
          try {
            const allUsers = await getAllUsers();
            const referrerAgent = allUsers.find(u => u.id === userData.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (userData.referredBy || "").toUpperCase()));
            if (referrerAgent) {
              await window.App.notifications.onNewReferredCollaborator(fullUser, referrerAgent).catch(() => {});
            }
          } catch(e) {
            console.warn('[Notifications] Error finding referrer agent:', e);
          }
        }
      }

      // Auto-enroll in webinar
      const fullUser = { id: uid, ...userData };
      if (role === 'client') {
        await autoEnrollClientWebinar(fullUser, { silent: true });
      } else if (['realtor', 'broker'].includes(role)) {
        await autoEnrollRealtorWebinar(fullUser, { silent: true });
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
      // Notify admin and user of status change
      if (window.App && window.App.notifications) {
        await window.App.notifications.onUserStatusChange(user, newStatus).catch(() => {});
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
          await window.App.notifications.onUserStatusChange({ id: userId, ...doc.data() }, newStatus).catch(() => {});
        }
      } catch (_) {}
      return true;
    }
  }

  async function updateUserRole(userId, newRole) {
    const cleanRole = String(newRole || '').trim().toLowerCase() === 'ambassador' ? 'embajador' : String(newRole || '').trim().toLowerCase();
    const rolePrefix = cleanRole === 'admin' ? 'ADM' : (cleanRole === 'embajador' ? 'EMB' : (cleanRole === 'broker' ? 'BRK' : (cleanRole === 'agent_inmomas' ? 'LOC' : (cleanRole === 'colaborador' ? 'COL' : 'REA'))));
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.id === userId);
      if (!user) throw new Error('User not found.');
      user.role = cleanRole;
      if (cleanRole === 'embajador' || cleanRole === 'admin') {
        user.embajadorId = null;
      }
      if (cleanRole === 'colaborador' && user.referredBy) {
        const refObj = App.demoData.users.find(u => u.id === user.referredBy || (u.referralCode && u.referralCode.toUpperCase() === String(user.referredBy).toUpperCase()));
        if (refObj && refObj.role === 'realtor') {
          user.referredBy = user.inmomasAgentName || null;
        } else if (String(user.referredBy).toUpperCase().startsWith('REA-')) {
          user.referredBy = user.inmomasAgentName || null;
        }
      }
      if (user.referralCode) {
        const parts = user.referralCode.split('-');
        if (parts.length > 1) {
          parts[0] = rolePrefix;
          user.referralCode = parts.join('-');
        } else {
          const lastName = user.lastName || 'USER';
          user.referralCode = `${rolePrefix}-${lastName.toUpperCase()}`;
        }
      } else {
        const lastName = user.lastName || 'USER';
        user.referralCode = `${rolePrefix}-${lastName.toUpperCase()}`;
      }
      user.updatedAt = new Date().toISOString();
      saveDemoData();
      if (currentUser && currentUser.id === userId) {
        currentUser.role = cleanRole;
        currentUser.referralCode = user.referralCode;
        notifyAuthChange();
      }
      return true;
    } else {
      const docRef = App.db.collection('users').doc(userId);
      const doc = await docRef.get();
      if (doc.exists) {
        const userData = doc.data() || {};
        let updatedRefCode = userData.referralCode || '';
        const cleanLast = String(userData.lastName || 'USER').trim().toUpperCase() || 'USER';
        if (updatedRefCode) {
          const parts = updatedRefCode.split('-');
          if (parts.length > 1) {
            parts[0] = rolePrefix;
            updatedRefCode = parts.join('-');
          } else {
            updatedRefCode = `${rolePrefix}-${cleanLast}-${userId.substring(0, 4)}`;
          }
        } else {
          updatedRefCode = `${rolePrefix}-${cleanLast}-${userId.substring(0, 4)}`;
        }
        const updatePayload = {
          role: cleanRole,
          referralCode: updatedRefCode,
          updatedAt: new Date().toISOString()
        };
        if (cleanRole === 'embajador' || cleanRole === 'admin') {
          updatePayload.embajadorId = null;
        }
        if (cleanRole === 'colaborador' && userData.referredBy) {
          if (String(userData.referredBy).toUpperCase().startsWith('REA-')) {
            updatePayload.referredBy = userData.inmomasAgentName || null;
          } else {
            try {
              const rDoc = await App.db.collection('users').doc(userData.referredBy).get();
              if (rDoc.exists && (rDoc.data() || {}).role === 'realtor') {
                updatePayload.referredBy = userData.inmomasAgentName || null;
              }
            } catch (_) {}
          }
        }
        await docRef.update(updatePayload);
        if (currentUser && currentUser.id === userId) {
          currentUser.role = cleanRole;
          currentUser.referralCode = updatedRefCode;
          if (cleanRole === 'embajador' || cleanRole === 'admin') {
            currentUser.embajadorId = null;
          }
          notifyAuthChange();
        }
      }
      return true;
    }
  }

  async function updateProfile(data) {
    const user = currentUser;
    if (!user) throw new Error('No user is currently logged in.');

    const { firstName, lastName, phone, agencyName, country, profileImage } = data;
    const nationality = data.nationality !== undefined ? (data.nationality || '').trim() : undefined;
    const regions = Array.isArray(data.regions) ? data.regions : undefined;
    const languages = Array.isArray(data.languages) ? data.languages : undefined;
    const inferredRegion = (App.utils && App.utils.resolveRegionFromCountry)
      ? App.utils.resolveRegionFromCountry(data.region || (regions && regions[0]) || nationality || country || '')
      : '';
    const primaryRegion = data.region || (regions && regions[0]) || inferredRegion || undefined;

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
      if (nationality !== undefined) demoUser.nationality = nationality;
      if (primaryRegion !== undefined) demoUser.region = primaryRegion;
      if (regions !== undefined) demoUser.regions = regions;
      if (languages !== undefined) demoUser.languages = languages;
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
      if (nationality !== undefined) updateData.nationality = nationality;
      if (primaryRegion !== undefined) updateData.region = primaryRegion;
      if (regions !== undefined) updateData.regions = regions;
      if (languages !== undefined) updateData.languages = languages;
      if (profileImage !== undefined) {
        updateData.profileImage = profileImage;
      }
      await App.db.collection('users').doc(user.id).update(updateData);

      Object.assign(currentUser, updateData);
      notifyAuthChange();
      return currentUser;
    }
  }

  /* ---- Update Personalized Buyer Guide data (self or Admin action) ---- */
  async function updateBuyerGuideProfile(userId, guideData = {}) {
    if (!userId) throw new Error('User ID is required.');
    const clean = (v) => (typeof v === 'string' ? v.trim() : '');
    const buyerGuide = {
      name: clean(guideData.name),
      title: clean(guideData.title),
      mobile: clean(guideData.mobile),
      email: clean(guideData.email),
      website: clean(guideData.website),
      photo: guideData.photo || null,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('remax_buyer_guide_' + userId, JSON.stringify(buyerGuide));
    } catch (e) { /* localStorage quota */ }

    if (App.demoMode) {
      const u = App.demoData.users.find(usr => usr.id === userId);
      if (u) {
        u.buyerGuide = buyerGuide;
        u.updatedAt = buyerGuide.updatedAt;
        saveDemoData();
      }
    } else if (App.db && App.firebaseAuth && App.firebaseAuth.currentUser) {
      try {
        await App.db.collection('users').doc(userId).set({
          buyerGuide,
          updatedAt: buyerGuide.updatedAt
        }, { merge: true });
      } catch (fbErr) {
        console.warn('[Auth] Cloud sync for buyerGuide skipped (using local cache):', fbErr && (fbErr.code || fbErr.message || fbErr));
      }
    } else {
      console.warn('[Auth] No active Firebase Auth session for buyerGuide sync; saved locally.');
    }

    if (currentUser && currentUser.id === userId) {
      currentUser.buyerGuide = buyerGuide;
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); } catch (e) { /* quota */ }
      notifyAuthChange();
    }
    return buyerGuide;
  }

  /* ---- Update User Nationality & Regions (Admin action) ---- */
  async function updateUserRegionalProfile(userId, regionalData = {}) {
    if (!userId) throw new Error('User ID is required.');
    const nationality = (regionalData.nationality || '').trim();
    const country = regionalData.country !== undefined ? (regionalData.country || '').trim() : undefined;
    const regions = Array.isArray(regionalData.regions) ? regionalData.regions : [];
    const languages = Array.isArray(regionalData.languages) ? regionalData.languages : [];
    const inferredRegion = (App.utils && App.utils.resolveRegionFromCountry)
      ? App.utils.resolveRegionFromCountry(regionalData.region || regions[0] || nationality || country || '')
      : '';
    const primaryRegion = regionalData.region || regions[0] || inferredRegion || '';
    const finalRegions = regions.length > 0 ? regions : (primaryRegion ? [primaryRegion] : []);

    if (App.demoMode) {
      const u = App.demoData.users.find(usr => usr.id === userId);
      if (!u) throw new Error('User not found.');
      u.nationality = nationality || u.nationality || '';
      if (country !== undefined) u.country = country;
      u.region = primaryRegion;
      u.regions = finalRegions;
      u.languages = languages;
      u.updatedAt = new Date().toISOString();
      saveDemoData();
      return true;
    } else {
      const payload = {
        nationality: nationality,
        region: primaryRegion,
        regions: finalRegions,
        languages: languages,
        updatedAt: new Date().toISOString()
      };
      if (country !== undefined) payload.country = country;
      await App.db.collection('users').doc(userId).update(payload);
      if (currentUser && currentUser.id === userId) {
        Object.assign(currentUser, payload);
        notifyAuthChange();
      }
      return true;
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


  /* ---- Update User Referral / Assigned RE/MAX Inmomás Agent (Admin action) ---- */
  async function updateUserReferral(userId, referrerCode) {
    const cleanCode = referrerCode ? String(referrerCode).trim() : null;
    const allSysUsers = await getAllUsers();
    const findByCodeOrId = (val) => {
      if (!val) return null;
      const raw = String(val).trim();
      const upper = raw.toUpperCase();
      return allSysUsers.find(x =>
        x.id === raw ||
        (x.referralCode && String(x.referralCode).toUpperCase().trim() === upper) ||
        (x.email && String(x.email).toLowerCase().trim() === raw.toLowerCase())
      ) || null;
    };

    const assignedAgent = cleanCode ? findByCodeOrId(cleanCode) : null;
    const isInmomasAgent = Boolean(assignedAgent && assignedAgent.role === 'agent_inmomas');
    const agentFullName = isInmomasAgent
      ? `${assignedAgent.firstName || ''} ${assignedAgent.lastName || ''}`.trim()
      : (cleanCode || null);

    const buildPatch = (existingUser) => {
      const prevRef = existingUser && existingUser.referredBy ? findByCodeOrId(existingUser.referredBy) : null;
      const patch = {
        inmomasAgentId: isInmomasAgent ? assignedAgent.id : null,
        inmomasAgentCode: cleanCode || null,
        inmomasAgentName: cleanCode ? agentFullName : null,
        updatedAt: new Date().toISOString()
      };

      // Preserve existing Broker / Embajador umbrella links if referredBy pointed to them
      if (prevRef && prevRef.role === 'broker' && !existingUser.brokerId && existingUser.role !== 'broker' && existingUser.role !== 'embajador') {
        patch.brokerId = prevRef.id;
      }
      if (prevRef && prevRef.role === 'embajador' && !existingUser.embajadorId && existingUser.role !== 'embajador') {
        patch.embajadorId = prevRef.id;
      }

      // Only overwrite referredBy if it was empty or pointed to an agent_inmomas
      const prevWasPartnerUmbrella = Boolean(prevRef && prevRef.role !== 'agent_inmomas');
      if (!prevWasPartnerUmbrella) {
        patch.referredBy = cleanCode;
        patch.source = cleanCode ? 'Admin Assigned Referral' : (existingUser.source || null);
      }

      return patch;
    };

    if (App.demoMode) {
      const u = App.demoData.users.find(usr => usr.id === userId);
      if (!u) throw new Error('User not found.');
      Object.assign(u, buildPatch(u));
      saveDemoData();
      return true;
    } else {
      const userRef = App.db.collection('users').doc(userId);
      const snap = await userRef.get();
      const existingData = snap.exists ? snap.data() : {};
      await userRef.update(buildPatch(existingData));
      return true;
    }
  }

  /* ---- Assign / Unassign User to an Embajador's Umbrella (Admin action) ---- */
  async function updateUserEmbajador(userId, embajadorId) {
    const cleanEmbId = embajadorId ? String(embajadorId).trim() : null;
    if (App.demoMode) {
      const u = App.demoData.users.find(usr => usr.id === userId);
      if (!u) throw new Error('User not found.');
      u.embajadorId = cleanEmbId;
      if (cleanEmbId && !u.referredBy) {
        u.referredBy = cleanEmbId;
      }
      u.updatedAt = new Date().toISOString();
      saveDemoData();
      return true;
    } else {
      const userRef = App.db.collection('users').doc(userId);
      const doc = await userRef.get();
      const payload = {
        embajadorId: cleanEmbId,
        updatedAt: new Date().toISOString()
      };
      if (cleanEmbId && doc.exists && !doc.data().referredBy) {
        payload.referredBy = cleanEmbId;
      }
      await userRef.update(payload);
      return true;
    }
  }

  /* ---- Assign / Unassign Realtor to a Broker Office & Sync Umbrella (Admin action) ---- */
  async function updateUserBroker(realtorId, brokerId) {
    const cleanBrokerId = brokerId ? String(brokerId).trim() : null;
    const now = new Date().toISOString();
    const allSysUsers = await getAllUsers();
    const lk = (App.utils && App.utils._buildUserLookupMaps)
      ? App.utils._buildUserLookupMaps(allSysUsers)
      : null;

    const targetRealtor = allSysUsers.find(u => u.id === realtorId);
    if (!targetRealtor) throw new Error('Realtor not found.');
    const targetBroker = cleanBrokerId ? allSysUsers.find(u => u.id === cleanBrokerId) : null;

    const realtorParents = (App.utils && App.utils.resolveUserUmbrellaParents)
      ? App.utils.resolveUserUmbrellaParents(targetRealtor, allSysUsers, lk)
      : { embajador: null };
    const brokerParents = (targetBroker && App.utils && App.utils.resolveUserUmbrellaParents)
      ? App.utils.resolveUserUmbrellaParents(targetBroker, allSysUsers, lk)
      : { embajador: null };

    const realtorEmbId = targetRealtor.embajadorId || (realtorParents.embajador ? realtorParents.embajador.id : null);
    const brokerEmbId = targetBroker ? (targetBroker.embajadorId || (brokerParents.embajador ? brokerParents.embajador.id : null)) : null;
    const syncedEmbajadorId = realtorEmbId || brokerEmbId || null;

    if (App.demoMode) {
      const r = App.demoData.users.find(u => u.id === realtorId);
      if (r) {
        r.brokerId = cleanBrokerId;
        r.brokerStatus = cleanBrokerId ? 'approved' : null;
        if (syncedEmbajadorId && !r.embajadorId) r.embajadorId = syncedEmbajadorId;
        if (targetBroker && targetBroker.agencyName) r.agencyName = targetBroker.agencyName;
        if (targetBroker) r.agencyLogo = targetBroker.agencyLogo || null;
        r.updatedAt = now;
      }
      // If Realtor belonged to an Embajador and Broker registered later without Embajador, attach Broker to the Embajador's umbrella!
      if (targetBroker && syncedEmbajadorId && !targetBroker.embajadorId) {
        const b = App.demoData.users.find(u => u.id === cleanBrokerId);
        if (b) {
          b.embajadorId = syncedEmbajadorId;
          b.updatedAt = now;
        }
      }
      // Sync existing clients of this Realtor to the Broker & Embajador
      const rCodeUpper = targetRealtor.referralCode ? String(targetRealtor.referralCode).toUpperCase().trim() : '';
      (App.demoData.clients || []).forEach(c => {
        const cRefUpper = c.referredBy ? String(c.referredBy).toUpperCase().trim() : '';
        if (c.realtorId === realtorId || c.referredBy === realtorId || (rCodeUpper && cRefUpper === rCodeUpper)) {
          c.brokerId = cleanBrokerId;
          if (syncedEmbajadorId && !c.embajadorId) c.embajadorId = syncedEmbajadorId;
        }
      });
      saveDemoData();
      return { attachedBrokerToEmbajador: Boolean(targetBroker && realtorEmbId && !brokerEmbId) };
    } else {
      const realtorPatch = {
        brokerId: cleanBrokerId,
        brokerStatus: cleanBrokerId ? 'approved' : null,
        updatedAt: now
      };
      if (syncedEmbajadorId && !targetRealtor.embajadorId) {
        realtorPatch.embajadorId = syncedEmbajadorId;
      }
      if (targetBroker && targetBroker.agencyName) {
        realtorPatch.agencyName = targetBroker.agencyName;
      }
      if (targetBroker) {
        realtorPatch.agencyLogo = targetBroker.agencyLogo || null;
      }
      await App.db.collection('users').doc(realtorId).update(realtorPatch);

      let attachedBrokerToEmbajador = false;
      if (targetBroker && syncedEmbajadorId && !targetBroker.embajadorId) {
        await App.db.collection('users').doc(cleanBrokerId).update({
          embajadorId: syncedEmbajadorId,
          updatedAt: now
        });
        attachedBrokerToEmbajador = Boolean(realtorEmbId && !brokerEmbId);
      }

      // Sync existing clients of this Realtor so Broker & Embajador pipelines stay aligned
      try {
        const allCli = await getClients();
        const rCodeUpper = targetRealtor.referralCode ? String(targetRealtor.referralCode).toUpperCase().trim() : '';
        const matchingClients = (allCli || []).filter(c => {
          const cRefUpper = c.referredBy ? String(c.referredBy).toUpperCase().trim() : '';
          return c.realtorId === realtorId || c.referredBy === realtorId || (rCodeUpper && cRefUpper === rCodeUpper);
        });
        for (const cl of matchingClients) {
          const cliPatch = { brokerId: cleanBrokerId };
          if (syncedEmbajadorId && !cl.embajadorId) cliPatch.embajadorId = syncedEmbajadorId;
          await App.db.collection('clients').doc(cl.id).update(cliPatch);
        }
      } catch (cliErr) {
        console.warn('[Auth] Client broker sync warning:', cliErr);
      }

      return { attachedBrokerToEmbajador };
    }
  }

  /* ---- Update User / Office Agency Branding & Logo (Self or Admin action) ---- */
  async function updateUserAgencyBranding(userId, { agencyName, agencyLogo, applyToOffice = true } = {}) {
    if (!userId) throw new Error('User ID is required.');
    const now = new Date().toISOString();
    const cleanAgencyName = typeof agencyName === 'string' ? agencyName.trim() : undefined;
    const isAdminCaller = !!(currentUser && currentUser.role === 'admin');
    const GENERIC_AGENCIES = new Set(['', 'independent', 'independiente', 'none', '—', '-']);
    const isSpecificAgency = (val) => val && !GENERIC_AGENCIES.has(val.trim().toLowerCase());

    if (App.demoMode) {
      const targetUser = App.demoData.users.find(u => u.id === userId);
      if (!targetUser) throw new Error('User not found.');

      if (!isAdminCaller && targetUser.role === 'realtor') {
        const parents = App.utils && App.utils.resolveUserUmbrellaParents
          ? App.utils.resolveUserUmbrellaParents(targetUser, App.demoData.users)
          : { broker: targetUser.brokerId ? App.demoData.users.find(u => u.id === targetUser.brokerId) : null };
        if (targetUser.brokerId || parents.broker) {
          throw new Error('Tu enlace está bajo el paraguas de un Broker: el logo es oficial de tu oficina y solo puede editarlo tu Broker.');
        }
      }

      const effectiveApplyToOffice = targetUser.role === 'broker' ? true : applyToOffice;
      const oldAgencyName = (targetUser.agencyName || '').trim().toLowerCase();
      const officeBrokerId = targetUser.role === 'broker' ? targetUser.id : (targetUser.brokerId || null);

      const usersToUpdate = [targetUser];
      if (effectiveApplyToOffice) {
        const lk = App.utils && App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(App.demoData.users) : null;
        App.demoData.users.forEach(u => {
          if (u.id === targetUser.id) return;
          let sameBrokerOffice = Boolean(officeBrokerId && (u.id === officeBrokerId || u.brokerId === officeBrokerId));
          if (!sameBrokerOffice && officeBrokerId && u.role === 'realtor' && App.utils && App.utils.resolveUserUmbrellaParents) {
            const p = App.utils.resolveUserUmbrellaParents(u, App.demoData.users, lk);
            if (p.broker && p.broker.id === officeBrokerId) sameBrokerOffice = true;
          }
          const uAgency = (u.agencyName || '').trim().toLowerCase();
          const sameAgencyName = isAdminCaller && (
            (isSpecificAgency(oldAgencyName) && uAgency === oldAgencyName) ||
            (isSpecificAgency(cleanAgencyName) && uAgency === cleanAgencyName.toLowerCase())
          );
          if (sameBrokerOffice || sameAgencyName) {
            usersToUpdate.push(u);
          }
        });
      }

      const updatedIds = new Set();
      usersToUpdate.forEach(u => {
        if (cleanAgencyName !== undefined) u.agencyName = cleanAgencyName;
        if (agencyLogo !== undefined) u.agencyLogo = agencyLogo || null;
        u.updatedAt = now;
        updatedIds.add(u.id);
      });

      saveDemoData();
      if (currentUser && updatedIds.has(currentUser.id)) {
        if (cleanAgencyName !== undefined) currentUser.agencyName = cleanAgencyName;
        if (agencyLogo !== undefined) currentUser.agencyLogo = agencyLogo || null;
        currentUser.updatedAt = now;
        try { localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser)); } catch (e) { /* quota */ }
        notifyAuthChange();
      }
      return { updatedCount: usersToUpdate.length };
    } else {
      const userRef = App.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) throw new Error('User not found.');
      const targetUser = { id: userDoc.id, ...userDoc.data() };

      let cachedAllUsers = null;
      const loadAllUsersOnce = async () => {
        if (cachedAllUsers) return cachedAllUsers;
        const snap = await App.db.collection('users').get();
        cachedAllUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return cachedAllUsers;
      };

      if (!isAdminCaller && targetUser.role === 'realtor') {
        let hasParentBroker = Boolean(targetUser.brokerId);
        if (!hasParentBroker && targetUser.referredBy && App.utils && App.utils.resolveUserUmbrellaParents) {
          const pool = await loadAllUsersOnce();
          const parents = App.utils.resolveUserUmbrellaParents(targetUser, pool);
          if (parents.broker) hasParentBroker = true;
        }
        if (hasParentBroker) {
          throw new Error('Tu enlace está bajo el paraguas de un Broker: el logo es oficial de tu oficina y solo puede editarlo tu Broker.');
        }
      }

      const effectiveApplyToOffice = targetUser.role === 'broker' ? true : applyToOffice;
      const updatePayload = { updatedAt: now };
      if (cleanAgencyName !== undefined) updatePayload.agencyName = cleanAgencyName;
      if (agencyLogo !== undefined) updatePayload.agencyLogo = agencyLogo || null;

      await userRef.update(updatePayload);
      let updatedCount = 1;
      const updatedIds = new Set([userId]);

      if (effectiveApplyToOffice) {
        const oldAgencyName = (targetUser.agencyName || '').trim().toLowerCase();
        const officeBrokerId = targetUser.role === 'broker' ? targetUser.id : (targetUser.brokerId || null);
        const pool = await loadAllUsersOnce();
        const lk = App.utils && App.utils._buildUserLookupMaps ? App.utils._buildUserLookupMaps(pool) : null;
        const batchPromises = [];

        pool.forEach(u => {
          if (u.id === userId) return;
          let sameBrokerOffice = Boolean(officeBrokerId && (u.id === officeBrokerId || u.brokerId === officeBrokerId));
          if (!sameBrokerOffice && officeBrokerId && u.role === 'realtor' && App.utils && App.utils.resolveUserUmbrellaParents) {
            const p = App.utils.resolveUserUmbrellaParents(u, pool, lk);
            if (p.broker && p.broker.id === officeBrokerId) sameBrokerOffice = true;
          }
          const uAgency = (u.agencyName || '').trim().toLowerCase();
          const sameAgencyName = isAdminCaller && (
            (isSpecificAgency(oldAgencyName) && uAgency === oldAgencyName) ||
            (isSpecificAgency(cleanAgencyName) && uAgency === cleanAgencyName.toLowerCase())
          );
          if (sameBrokerOffice || sameAgencyName) {
            batchPromises.push(App.db.collection('users').doc(u.id).update(updatePayload));
            updatedIds.add(u.id);
            updatedCount++;
          }
        });

        if (batchPromises.length > 0) {
          await Promise.all(batchPromises);
        }
      }

      if (currentUser && updatedIds.has(currentUser.id)) {
        Object.assign(currentUser, updatePayload);
        notifyAuthChange();
      }

      return { updatedCount };
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
        const copy = normalizeUserRoleObj({ ...u });
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
      return snapshot.docs.map(doc => {
        const raw = { ...doc.data(), id: doc.id };
        if (currentUser && currentUser.role === 'admin' && isJoseMartinezAccountObj(raw)) {
          const rawPhone = String(raw.phone || '').trim();
          const rawMobile = raw.buyerGuide && typeof raw.buyerGuide === 'object' ? String(raw.buyerGuide.mobile || '').trim() : null;
          const patch = {};
          if (JOSE_LEGACY_PHONES.has(rawPhone)) patch.phone = JOSE_MARTINEZ_PHONE;
          if (rawMobile !== null && JOSE_LEGACY_PHONES.has(rawMobile)) patch['buyerGuide.mobile'] = JOSE_MARTINEZ_PHONE;
          if (Object.keys(patch).length) {
            doc.ref.update(patch).catch(() => {});
          }
        }
        return normalizeUserRoleObj(raw);
      });
    }
  }

  async function getUser(userId) {
    if (App.demoMode) {
      const user = App.demoData.users.find(u => u.id === userId);
      if (!user) return null;
      const copy = normalizeUserRoleObj({ ...user });
      delete copy.password;
      return copy;
    } else {
      const doc = await App.db.collection('users').doc(userId).get();
      return doc.exists ? normalizeUserRoleObj({ ...doc.data(), id: doc.id }) : null;
    }
  }

  /* ---- End-Client Contact Redaction for Embajador Role (keeps Name, hides Email & Phone) ---- */
  function buildAnonClientCode(rawId, fallbackIdx = 0) {
    const clean = String(rawId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suffix = clean.length >= 4 ? clean.slice(-4) : String(fallbackIdx + 1).padStart(4, '0');
    return `CLI-${suffix}`;
  }

  function redactEndClientRecord(c, idx = 0) {
    if (!c || typeof c !== 'object') return c;
    const code = c._anonCode || buildAnonClientCode(c.id, idx);
    const firstName = String(c.firstName || '').trim();
    const lastName = String(c.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim() || String(c.name || '').trim() || `Cliente (${code})`;
    const safeHistory = Array.isArray(c.statusHistory)
      ? c.statusHistory.map(h => ({ status: h.status, date: h.date }))
      : [];
    return {
      id: c.id,
      _isRedactedClient: true,
      _contactProtected: true,
      _anonCode: code,
      _displayName: fullName,
      _labelEs: fullName,
      _labelEn: fullName,
      firstName: firstName || fullName,
      lastName: firstName ? lastName : '',
      name: fullName,
      email: '',
      phone: '',
      address: '',
      notes: '',
      country: c.country || '',
      region: c.region || '',
      interestArea: c.interestArea || '',
      budget: c.budget || '',
      timeline: c.timeline || '',
      objective: c.objective || '',
      status: c.status || 'contacted',
      tag: c.tag || 'spain_buyer',
      referredBy: c.referredBy || null,
      realtorId: c.realtorId || null,
      brokerId: c.brokerId || null,
      embajadorId: c.embajadorId || null,
      addedManuallyBy: c.addedManuallyBy || null,
      localAgentId: c.localAgentId || null,
      localAgentName: c.localAgentName || '',
      statusHistory: safeHistory,
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
      _isDirectFromEmbajador: Boolean(c._isDirectFromEmbajador),
      _originMemberId: c._originMemberId || null,
      _originMemberName: c._originMemberName || '',
      _originMemberRole: c._originMemberRole || '',
      _originBrokerName: c._originBrokerName || ''
    };
  }

  function isB2BWebinarRecord(w) {
    const wt = String(w?.webinarType || '').toLowerCase();
    const ct = String(w?.contactType || w?.role || '').toLowerCase();
    if (wt === 'b2b') return true;
    if (wt === 'b2c' || ct === 'client' || ct === 'cliente') return false;
    return ['realtor', 'broker', 'embajador', 'colaborador', 'agent_inmomas'].includes(ct);
  }

  function redactWebinarRecordForEmbajador(w, idx = 0) {
    if (!w || typeof w !== 'object') return w;
    if (isB2BWebinarRecord(w)) {
      return {
        ...w,
        email: '',
        phone: ''
      };
    }
    const clean = String(w.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const code = `B2C-${clean.length >= 4 ? clean.slice(-4) : String(idx + 1).padStart(4, '0')}`;
    const firstName = String(w.firstName || '').trim();
    const lastName = String(w.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim() || String(w.name || '').trim() || `Cliente (${code})`;
    return {
      id: w.id,
      _isRedactedB2C: true,
      _contactProtected: true,
      _anonCode: code,
      _displayName: fullName,
      _labelEs: fullName,
      _labelEn: fullName,
      firstName: firstName || fullName,
      lastName: firstName ? lastName : '',
      name: fullName,
      email: '',
      phone: '',
      agency: '',
      clientInterest: w.clientInterest || '',
      country: w.country || '',
      region: w.region || w.webinarRegion || '',
      webinarRegion: w.webinarRegion || '',
      webinarType: w.webinarType || 'b2c',
      contactType: 'client',
      referralCode: w.referralCode || '',
      referrerId: w.referrerId || null,
      referrerName: w.referrerName || '',
      agentReferrerId: w.agentReferrerId || null,
      agentReferrerName: w.agentReferrerName || '',
      createdAt: w.createdAt || null
    };
  }

  /* ---- Client Management ---- */
  async function getClients(filters = {}, _internalRaw = false) {
    let list = [];
    if (App.demoMode) {
      let clients = [...App.demoData.clients];
      if (filters.referredBy) clients = clients.filter(c => c.referredBy === filters.referredBy);
      if (filters.brokerId) clients = clients.filter(c => c.brokerId === filters.brokerId);
      if (filters.localAgentId) clients = clients.filter(c => c.localAgentId === filters.localAgentId);
      if (filters.status) clients = clients.filter(c => c.status === filters.status);
      list = clients;
    } else {
      let query = App.db.collection('clients');
      if (filters.referredBy) query = query.where('referredBy', '==', filters.referredBy);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      if (filters.localAgentId) query = query.where('localAgentId', '==', filters.localAgentId);
      if (filters.status) query = query.where('status', '==', filters.status);
      
      const snapshot = await query.get();
      list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
    if (!_internalRaw && currentUser && currentUser.role === 'embajador') {
      return list.map((c, idx) => redactEndClientRecord(c, idx));
    }
    return list;
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
        } else if (newStatus === 'negotiation' || newStatus === 'notary_pending' || newStatus === 'offer_made') {
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
        else if (newStatus === 'negotiation' || newStatus === 'notary_pending' || newStatus === 'offer_made') commStatus = 'pending_payment';
        
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

    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');
      
      const hasEmbajador = Boolean(client.embajadorId);
      const embajadorSharePct = hasEmbajador ? 15 : 0;
      const embajadorAmount = hasEmbajador ? (totalCommission * 0.15) : 0;
      const agentSharePct = Math.max(0, 100 - refPct - embajadorSharePct);
      const agentAmount = totalCommission * (agentSharePct / 100);
      const hasBroker = Boolean(client.brokerId);
      const brokerSharePct = hasBroker ? refPct : 0;
      const brokerAmount = hasBroker ? realtorAmount : 0;

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
          embajadorId: client.embajadorId || null,
          createdAt: new Date().toISOString()
        };
        App.demoData.commissions.push(comm);
      }

      comm.agentId = client.localAgentId;
      comm.embajadorId = client.embajadorId || null;
      comm.salePrice = sPrice;
      comm.totalCommission = totalCommission;
      comm.realtorSharePct = refPct;
      comm.realtorAmount = realtorAmount;
      comm.embajadorSharePct = embajadorSharePct;
      comm.embajadorAmount = embajadorAmount;
      comm.agentSharePct = agentSharePct;
      comm.agentAmount = agentAmount;
      comm.brokerSharePct = brokerSharePct;
      comm.brokerAmount = brokerAmount;
      comm.propertyAddress = client.interestArea || 'Spain Deal';

      if (client.status === 'closed') {
        comm.status = 'paid';
        comm.closingDate = new Date().toISOString();
      } else if (client.status === 'negotiation' || client.status === 'notary_pending' || client.status === 'offer_made') {
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

      const hasEmbajador = Boolean(client.embajadorId);
      const embajadorSharePct = hasEmbajador ? 15 : 0;
      const embajadorAmount = hasEmbajador ? (totalCommission * 0.15) : 0;
      const agentSharePct = Math.max(0, 100 - refPct - embajadorSharePct);
      const agentAmount = totalCommission * (agentSharePct / 100);
      const hasBroker = Boolean(client.brokerId);
      const brokerSharePct = hasBroker ? refPct : 0;
      const brokerAmount = hasBroker ? realtorAmount : 0;

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
      else if (client.status === 'negotiation' || client.status === 'notary_pending' || client.status === 'offer_made') commStatus = 'pending_payment';

      await commRef.set({
        clientId: clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        realtorId: client.referredBy,
        brokerId: client.brokerId,
        embajadorId: client.embajadorId || null,
        agentId: client.localAgentId,
        salePrice: sPrice,
        totalCommission,
        realtorSharePct: refPct,
        realtorAmount,
        embajadorSharePct,
        embajadorAmount,
        agentSharePct,
        agentAmount,
        brokerSharePct,
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

  async function updateClientTag(clientId, tag) {
    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');
      client.tag = tag;
      client.updatedAt = new Date().toISOString();
      saveDemoData();
      return true;
    } else {
      await App.db.collection('clients').doc(clientId).update({
        tag: tag,
        updatedAt: new Date().toISOString()
      });
      return true;
    }
  }

  /* ---- Commission Management ---- */
  async function getCommissions(filters = {}, _internalRaw = false) {
    let list = [];
    if (App.demoMode) {
      let comms = [...App.demoData.commissions];
      if (filters.realtorId) comms = comms.filter(c => c.realtorId === filters.realtorId);
      if (filters.brokerId) comms = comms.filter(c => c.brokerId === filters.brokerId);
      if (filters.agentId) comms = comms.filter(c => c.agentId === filters.agentId);
      list = comms;
    } else {
      let query = App.db.collection('commissions');
      if (filters.realtorId) query = query.where('realtorId', '==', filters.realtorId);
      if (filters.brokerId) query = query.where('brokerId', '==', filters.brokerId);
      if (filters.agentId) query = query.where('agentId', '==', filters.agentId);
      
      const snapshot = await query.get();
      list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
    if (!_internalRaw && currentUser && currentUser.role === 'embajador') {
      return list.map((cm, idx) => {
        const code = buildAnonClientCode(cm.clientId || cm.id, idx);
        return {
          ...cm,
          _anonCode: code,
          clientName: cm.clientName || `Cliente (${code})`,
          propertyAddress: cm.propertyAddress || 'España'
        };
      });
    }
    return list;
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
        await window.App.notifications.onNewDossierLead(newLead).catch(() => {});
      }
      return newLead;
    } else {
      const docRef = await App.db.collection('dossier_leads').add(newLead);
      const saved = { id: docRef.id, ...newLead };
      // Notify admin of new Buyer's Guide lead
      if (window.App && window.App.notifications) {
        await window.App.notifications.onNewDossierLead(saved).catch(() => {});
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
  async function saveWebinarRegistration(data, options = {}) {
    const resolvedRegion = data.webinarRegion || data.region || (
      App.utils && App.utils.resolveRegionFromCountry
        ? App.utils.resolveRegionFromCountry(data.country || '')
        : ''
    ) || 'north_america';

    const payload = {
      ...data,
      region: resolvedRegion,
      webinarRegion: resolvedRegion,
      createdAt: data.createdAt || new Date().toISOString()
    };

    const emailNorm = (payload.email || '').toLowerCase().trim();
    const typeNorm = (payload.webinarType || '').toUpperCase().trim();

    let agentEmail = null;
    let agentRole = null;
    if (payload.agentReferrerId || payload.referralCode) {
      try {
        const allUsers = await getAllUsers();
        const codeUpper = String(payload.referralCode || '').toUpperCase().trim();
        const agent = allUsers.find(u =>
          (payload.agentReferrerId && u.id === payload.agentReferrerId) ||
          (codeUpper && u.referralCode && String(u.referralCode).toUpperCase().trim() === codeUpper)
        );
        if (agent) {
          agentEmail = agent.email || null;
          agentRole = agent.role || null;
        }
      } catch (e) {
        console.warn('[Webinar] Could not fetch agent email for notification', e);
      }
    }

    if (App.demoMode) {
      if (!App.demoData.webinar_registrations) App.demoData.webinar_registrations = [];
      const existing = App.demoData.webinar_registrations.find(r => 
        (r.email || '').toLowerCase().trim() === emailNorm && 
        (!typeNorm || (r.webinarType || '').toUpperCase().trim() === typeNorm)
      );
      if (existing) {
        return existing.id;
      }

      payload.id = 'wreg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
      App.demoData.webinar_registrations.push(payload);
      saveDemoData();
      // Notify admin of new webinar registration
      if (!options.silent && window.App && window.App.notifications) {
        await window.App.notifications.onNewWebinarRegistration(payload, agentEmail, agentRole).catch(() => {});
      }
      return payload.id;
    } else {
      if (emailNorm) {
        try {
          const dupQuery = await App.db.collection('webinar_registrations')
            .where('email', '==', emailNorm)
            .get();
          const existingDoc = dupQuery.docs.find(d => {
            const dType = (d.data().webinarType || '').toUpperCase().trim();
            return !typeNorm || dType === typeNorm;
          });
          if (existingDoc) {
            return existingDoc.id;
          }
        } catch (e) {
          console.warn('[Webinar] Duplicate check error:', e);
        }
      }

      const docRef = await App.db.collection('webinar_registrations').add(payload);
      // Notify admin of new webinar registration
      if (!options.silent && window.App && window.App.notifications) {
        await window.App.notifications.onNewWebinarRegistration({ id: docRef.id, ...payload }, agentEmail, agentRole).catch(() => {});
      }
      return docRef.id;
    }
  }

  async function getWebinarRegistrations(_internalRaw = false) {
    let list = [];
    if (App.demoMode) {
      list = App.demoData.webinar_registrations || [];
    } else {
      const snapshot = await App.db.collection('webinar_registrations').orderBy('createdAt', 'desc').get();
      list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    }
    if (!_internalRaw && currentUser && currentUser.role === 'embajador') {
      return list.map((w, idx) => redactWebinarRecordForEmbajador(w, idx));
    }
    return list;
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

  /* ---- Auto-Enroll Client in B2C Webinar ---- */
  async function autoEnrollClientWebinar(client, extraOptions = {}) {
    try {
      if (!client || !client.email) return;
      const emailNorm = client.email.toLowerCase().trim();

      const clientCountry = client.currentLocation || client.country || 'United States';
      const clientRegion = client.region || (App.utils && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(clientCountry) : '') || 'north_america';

      const settings = (await getWebinarSettings()) || getDefaultWebinarSettings();
      const regCfg = getRegionalWebinarConfig(settings, clientRegion, 'b2c');
      const webinarTitle = regCfg.title || 'Spain Unlocked: Living & Investing';
      const webinarDate = regCfg.date || '2026-10-29';
      const webinarLanguage = regCfg.language || 'en';

      let agentReferrerId = client.localAgentId || client.realtorId || extraOptions.agentReferrerId || null;
      let agentReferrerName = client.localAgentName || client.realtorName || extraOptions.agentReferrerName || null;
      let agentReferrerRole = extraOptions.agentReferrerRole || null;
      let referrerName = extraOptions.referrerName || agentReferrerName || '';

      if (!agentReferrerName && client.referredBy) {
        try {
          const allUsers = await getAllUsers();
          const refUser = allUsers.find(u => u.id === client.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (client.referredBy || '').toUpperCase()));
          if (refUser) {
            agentReferrerId = refUser.id;
            agentReferrerName = `${refUser.firstName} ${refUser.lastName}`.trim();
            agentReferrerRole = refUser.role;
            referrerName = agentReferrerName;
          }
        } catch (_) {}
      }

      const clientInterestParts = [client.objective, client.interestArea].filter(x => x && x !== '—');
      const clientInterest = clientInterestParts.length > 0 ? clientInterestParts.join(' · ') : 'Inversión / Mudanza';

      const webinarPayload = {
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: emailNorm,
        phone: client.phone || '—',
        agency: client.objective || client.budget || 'Client (Interested in Spain)',
        clientInterest: clientInterest,
        country: client.currentLocation || client.country || 'Puerto Rico',
        state: client.state || 'N/A',
        howHeard: extraOptions.howHeard || (client.source === 'referral' ? 'Referral Link' : 'agent'),
        referrerName: referrerName,
        referrerId: client.referredBy || client.addedManuallyBy || extraOptions.referrerId || null,
        agentReferrerId: agentReferrerId,
        agentReferrerName: agentReferrerName,
        agentReferrerRole: agentReferrerRole,
        referralCode: extraOptions.referralCode || client.referralCode || null,
        webinar: webinarTitle,
        webinarType: 'B2C',
        webinarDate: webinarDate,
        webinarRegion: clientRegion,
        region: clientRegion,
        webinarLanguage: webinarLanguage,
        gdprConsent: true,
        role: 'client',
        contactType: 'client',
        source: client.source || 'client_registration',
        status: 'pending',
        createdAt: client.createdAt || new Date().toISOString()
      };

      await saveWebinarRegistration(webinarPayload, { silent: Boolean(extraOptions.silent) });
    } catch (err) {
      console.warn('[Auth] Error auto-enrolling client in webinar:', err);
    }
  }

  /* ---- Auto-Enroll Realtor / Partner in B2B Webinar ---- */
  async function autoEnrollRealtorWebinar(user, extraOptions = {}) {
    try {
      if (!user || !user.email) return;
      const emailNorm = user.email.toLowerCase().trim();

      const userCountry = user.country || user.nationality || 'United States';
      const userRegion = user.region || (Array.isArray(user.regions) && user.regions[0]) || (App.utils && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(userCountry) : '') || 'north_america';

      const settings = (await getWebinarSettings()) || getDefaultWebinarSettings();
      const regCfg = getRegionalWebinarConfig(settings, userRegion, 'b2b');
      const webinarTitle = regCfg.title || 'Beyond Borders';
      const webinarDate = regCfg.date || '2026-09-24';
      const webinarLanguage = regCfg.language || 'en';

      let agentReferrerId = extraOptions.agentReferrerId || null;
      let agentReferrerName = extraOptions.agentReferrerName || null;
      let agentReferrerRole = extraOptions.agentReferrerRole || null;
      let referrerName = extraOptions.referrerName || '';

      if (user.referredBy) {
        try {
          const allUsers = await getAllUsers();
          const refUser = allUsers.find(u => u.id === user.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (user.referredBy || '').toUpperCase()));
          if (refUser) {
            agentReferrerId = refUser.id;
            agentReferrerName = `${refUser.firstName} ${refUser.lastName}`.trim();
            agentReferrerRole = refUser.role;
            referrerName = agentReferrerName;
          }
        } catch (_) {}
      }

      const webinarPayload = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: emailNorm,
        phone: user.phone || '—',
        agency: user.agencyName || (user.role === 'broker' ? 'Brokerage' : 'Realtor Network'),
        country: user.country || 'United States',
        state: user.market || user.state || 'N/A',
        howHeard: user.referredBy ? 'Referral Link' : 'Website Registration',
        referrerName: referrerName,
        referrerId: user.referredBy || extraOptions.referrerId || null,
        agentReferrerId: agentReferrerId,
        agentReferrerName: agentReferrerName,
        agentReferrerRole: agentReferrerRole,
        referralCode: user.referredBy || extraOptions.referralCode || null,
        webinar: webinarTitle,
        webinarType: 'B2B',
        webinarDate: webinarDate,
        webinarRegion: userRegion,
        region: userRegion,
        webinarLanguage: webinarLanguage,
        gdprConsent: true,
        role: user.role || 'realtor',
        contactType: user.role || 'realtor',
        source: user.source || 'website_registration',
        status: 'pending',
        createdAt: user.createdAt || new Date().toISOString()
      };

      await saveWebinarRegistration(webinarPayload, { silent: Boolean(extraOptions.silent) });
    } catch (err) {
      console.warn('[Auth] Error auto-enrolling realtor in webinar:', err);
    }
  }

  /* ---- Sync Missing Webinar Registrations ---- */
  async function syncMissingWebinarRegistrations() {
    try {
      const existing = await getWebinarRegistrations();
      const existingMap = new Set();
      existing.forEach(r => {
        const em = (r.email || '').toLowerCase().trim();
        const ty = (r.webinarType || '').toUpperCase().trim();
        if (em) existingMap.add(`${em}::${ty}`);
      });

      // 1. Sync Clients to B2C Webinar
      const clients = await getClients();
      for (const c of clients) {
        const em = (c.email || '').toLowerCase().trim();
        if (em && !existingMap.has(`${em}::B2C`)) {
          await autoEnrollClientWebinar(c, { silent: true });
          existingMap.add(`${em}::B2C`);
        }
      }

      // 2. Sync Realtors / Brokers to B2B Webinar
      const users = await getAllUsers();
      for (const u of users) {
        if (!['realtor', 'broker'].includes(u.role)) continue;
        const em = (u.email || '').toLowerCase().trim();
        if (em && !existingMap.has(`${em}::B2B`)) {
          await autoEnrollRealtorWebinar(u, { silent: true });
          existingMap.add(`${em}::B2B`);
        }
      }
    } catch (err) {
      console.warn('[Webinar] Error syncing missing webinar registrations:', err);
    }
  }

  /* ---- Masterclass Feedback Surveys ---- */
  async function getWebinarFeedbacks() {
    let list = [];
    if (!App.demoMode && App.db) {
      try {
        const snapshot = await App.db.collection('webinar_feedback').orderBy('submitted_at', 'desc').get();
        list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      } catch (err) {
        console.warn('[Feedback] Could not fetch from Firestore, checking local:', err);
      }
    }
    // Also include local storage items if any are missing
    try {
      const local = JSON.parse(localStorage.getItem('webinar_feedback_list') || '[]');
      local.forEach(locItem => {
        if (!list.some(item => item.id === locItem.id || (item.email === locItem.email && item.submitted_at === locItem.submitted_at))) {
          list.push(locItem);
        }
      });
    } catch (_) {}
    return list;
  }

  async function deleteWebinarFeedback(feedbackId) {
    if (!App.demoMode && App.db) {
      try {
        await App.db.collection('webinar_feedback').doc(feedbackId).delete();
      } catch (err) {
        console.warn('[Feedback] Could not delete from Firestore:', err);
      }
    }
    try {
      const local = JSON.parse(localStorage.getItem('webinar_feedback_list') || '[]');
      const filtered = local.filter(item => item.id !== feedbackId);
      localStorage.setItem('webinar_feedback_list', JSON.stringify(filtered));
    } catch (_) {}
    return true;
  }

  /* ---- Webinar Settings (B2B vs B2C Switch & Date Config) ---- */
  const DEFAULT_WEBINAR_SETTINGS = {
    configVersion: 4, // Bump this whenever activeType or date changes to force-override stale Firestore/localStorage data
    activeType: 'b2c', // Default next upcoming webinar: B2C for Buyers & Investors (Oct 29, 2026 at 6:00 PM CET / 1:00 PM EDT / 10:00 AM PDT)
    date: '2026-10-29',
    time: '18:00', // 6:00 PM CET (18:00 h Spain / 1:00 PM EDT / 10:00 AM PDT)
    timeZone: 'CET',
    spotsAvailable: 25,
    updatedAt: new Date().toISOString(),
    b2b: {
      title: 'Beyond Borders',
      subtitle: 'Passive International Commissions for Realtors & Brokers',
      targetAudience: 'US, Canadian & Puerto Rico Realtors & Brokers',
      spots: 25,
      date: '2026-09-24',
      time: '19:00',
      badge: {
        en: '🔴 LIVE WEBINAR · 🇺🇸 Exclusively for US, Canadian & Puerto Rico Realtors · 🇵🇷 FREE Registration',
        es: '🔴 WEBINAR EN VIVO · 🇺🇸 Exclusivo para Realtors de EE.UU., Canadá y Puerto Rico · 🇵🇷 Registro GRATUITO',
        fr: '🔴 WEBINAIRE EN DIRECT · 🇺🇸 Réservé aux Agents US, Canadiens & Porto Rico · 🇵🇷 Inscription GRATUITE',
        'en-ca': '🔴 LIVE WEBINAR · 🇺🇸 Exclusively for US, Canadian & Puerto Rico Realtors · 🇵🇷 FREE Registration'
      },
      heroPill: {
        en: 'RE/MAX Inmomás International — Realtor Partner Masterclass',
        es: 'RE/MAX Inmomás International — Masterclass para Realtors Partners',
        fr: 'RE/MAX Inmomás International — Masterclass VIP Partenaires',
        'en-ca': 'RE/MAX Inmomás International — Realtor Partner Masterclass'
      },
      titlePrefix: {
        en: 'Beyond',
        es: 'Beyond',
        fr: 'Au-Delà des',
        'en-ca': 'Beyond'
      },
      titleHighlight: {
        en: 'Borders',
        es: 'Borders',
        fr: 'Frontières',
        'en-ca': 'Borders'
      },
      subtitleText: {
        en: 'The live masterclass where top US, Canadian & Puerto Rico Realtors discover how to earn 25% referral commissions in Spain\'s booming luxury market — with zero extra work.',
        es: 'La masterclass en vivo donde los mejores Realtors de EE.UU., Canadá y Puerto Rico descubren cómo ganar el 25% de comisión de referidos en España — sin listados ni trabajo adicional.',
        fr: 'La masterclass en direct où les meilleurs agents découvrent comment gagner 25% de commission de référence en Espagne — sans effort supplémentaire.',
        'en-ca': 'The live masterclass where top US, Canadian & Puerto Rico Realtors discover how to earn 25% referral commissions in Spain\'s booming luxury market — with zero extra work.'
      },
      sectionHeadline: {
        en: 'Why Every US, Canadian & Puerto Rico Realtor Should Attend',
        es: 'Por qué todo Realtor de EE.UU., Canadá y Puerto Rico debería asistir',
        fr: 'Pourquoi chaque agent US, canadien et porto-ricain devrait assister',
        'en-ca': 'Why Every US, Canadian & Puerto Rico Realtor Should Attend'
      },
      sectionSubheadline: {
        en: 'In just 60 minutes, learn the exact system our collaborators use to close international deals and earn 25% commissions from their home office.',
        es: 'En solo 60 minutos, aprende el sistema exacto que usan nuestros colaboradores para cerrar acuerdos internacionales y ganar el 25% de comisión desde su oficina.',
        fr: 'En 60 minutes, découvrez le système exact utilisé par nos partenaires pour conclure des transactions internationales.',
        'en-ca': 'In just 60 minutes, learn the exact system our collaborators use to close international deals and earn 25% commissions.'
      },
      bannerText: {
        en: 'Beyond Borders · September 24 · 7:00 PM CEST (1:00 PM EDT / 10:00 AM PDT) · Free for Realtors & Brokers',
        es: 'Beyond Borders · 24 de Septiembre · 19:00 h España (1:00 PM EDT / Miami · NY · PR) · Gratuito para Realtors y Brokers',
        fr: 'Beyond Borders · 24 Septembre · 19 h CEST (13 h EDT) · Gratuit pour les Agents & Courtiers',
        'en-ca': 'Beyond Borders · September 24 · 7:00 PM CEST (1:00 PM EDT / 10:00 AM PDT) · Free for Realtors & Brokers'
      },
      formCardTitle: {
        en: 'Beyond Borders · Realtor VIP Pass',
        es: 'Beyond Borders · Pase VIP Realtors',
        fr: 'Beyond Borders · Pass VIP Agents',
        'en-ca': 'Beyond Borders · Realtor VIP Pass'
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
      date: '2026-10-29',
      time: '18:00',
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
        en: 'Spain Unlocked · October 29 · 1:00 PM EDT / 6:00 PM Spain · Free Masterclass for Buyers & Investors',
        es: 'Descubre España · 29 de Octubre · 18:00 h España (1:00 PM EDT) · Masterclass Gratuita para Compradores e Inversores',
        fr: 'Découvrez l\'Espagne · 29 Octobre · 18 h CET (13 h EDT) · Masterclass Gratuite pour Acheteurs & Investisseurs',
        'en-ca': 'Spain Unlocked · October 29 · 1:00 PM EDT / 6:00 PM Spain · Free Masterclass for Buyers & Investors'
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
    const CURRENT_VERSION = DEFAULT_WEBINAR_SETTINGS.configVersion;

    // 1. Check localStorage first for instant cached response
    let currentSettings = null;
    try {
      const cached = localStorage.getItem('remax_webinar_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        // If cached version is outdated, discard it entirely and use fresh defaults
        if (!parsed.configVersion || parsed.configVersion < CURRENT_VERSION) {
          currentSettings = JSON.parse(JSON.stringify(DEFAULT_WEBINAR_SETTINGS));
          localStorage.setItem('remax_webinar_settings', JSON.stringify(currentSettings));
        } else {
          currentSettings = parsed;
        }
      }
    } catch (e) {}

    // 2. If online and not in demo mode, try fetching from Firestore
    if (!App.demoMode && App.db) {
      try {
        const doc = await App.db.collection('system_settings').doc('webinar_active').get();
        if (doc.exists) {
          const firestoreData = doc.data();
          // If Firestore version is outdated, ignore it and use fresh defaults
          if (!firestoreData.configVersion || firestoreData.configVersion < CURRENT_VERSION) {
            currentSettings = JSON.parse(JSON.stringify(DEFAULT_WEBINAR_SETTINGS));
          } else {
            // Firestore is up-to-date — let it take priority over code defaults
            currentSettings = { ...DEFAULT_WEBINAR_SETTINGS, ...firestoreData };
          }
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

    return ensureRegionalWebinarConfigs(currentSettings);
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

  const UNSCHEDULED_SEED_WEBINAR_DATES = new Set([
    '2026-09-24',
    '2026-10-15',
    '2026-10-22',
    '2026-10-29',
    '2026-11-05',
    '2026-11-12',
    '2026-11-19',
    '2026-11-26',
    '2026-12-03',
    '2026-12-10'
  ]);

  function sanitizeSeedWebinarTrack(track) {
    if (!track || typeof track !== 'object') return track;
    if (track.scheduled === false) {
      return { ...track, date: '' };
    }
    if (track.scheduled !== true && track.date && UNSCHEDULED_SEED_WEBINAR_DATES.has(String(track.date).trim())) {
      return { ...track, date: '', scheduled: false };
    }
    return track;
  }

  function ensureRegionalWebinarConfigs(settingsObj) {
    const s = settingsObj || JSON.parse(JSON.stringify(DEFAULT_WEBINAR_SETTINGS));
    if (!s.regionalConfigs || typeof s.regionalConfigs !== 'object') {
      s.regionalConfigs = {};
    }

    const buildRegionDefault = (labelEn, audienceB2B, audienceB2C, lang = 'en', timeB2B = '17:00', timeB2C = '18:00') => ({
      activeType: 'b2c',
      language: lang,
      scheduled: false,
      b2b: {
        title: `Beyond Borders — ${labelEn} Partner Network`,
        subtitle: '25% International Referral Commissions in Spain with RE/MAX Inmomás',
        targetAudience: audienceB2B,
        date: '',
        time: timeB2B,
        spots: 25,
        language: lang,
        scheduled: false
      },
      b2c: {
        title: `Spain Unlocked — ${labelEn} Buyers & Investors`,
        subtitle: 'Turnkey Real Estate, Legal, Tax & Mortgage Representation in Spain',
        targetAudience: audienceB2C,
        date: '',
        time: timeB2C,
        spots: 25,
        language: lang,
        scheduled: false
      }
    });

    const regionDefaults = {
      north_america: {
        activeType: s.activeType || 'b2c',
        language: 'en',
        scheduled: false,
        b2b: {
          title: s.b2b?.title || 'Beyond Borders — North America',
          subtitle: s.b2b?.subtitle || 'Passive International Commissions for US, Canadian & PR Realtors',
          targetAudience: s.b2b?.targetAudience || 'US, Canadian & Puerto Rico Realtors & Brokers',
          date: '',
          time: s.b2b?.time || '19:00',
          spots: s.b2b?.spots || 25,
          language: 'en',
          scheduled: false
        },
        b2c: {
          title: s.b2c?.title || 'Spain Unlocked: Living & Investing',
          subtitle: s.b2c?.subtitle || 'How North American Buyers Safely Purchase, Relocate & Invest in Spain',
          targetAudience: s.b2c?.targetAudience || 'US, Canadian & PR Buyers, Expats & Investors',
          date: '',
          time: s.b2c?.time || s.time || '18:00',
          spots: s.b2c?.spots || s.spotsAvailable || 25,
          language: 'en',
          scheduled: false
        }
      },
      latam: {
        activeType: 'b2c',
        language: 'es',
        scheduled: false,
        b2b: {
          title: 'Beyond Borders — Alianza Latinoamérica',
          subtitle: 'Comisiones Internacionales del 25% en España para Brokers e Inmobiliarias de Latam',
          targetAudience: 'Brokers y Agentes de Argentina, Colombia y Venezuela',
          date: '',
          time: '18:00',
          spots: 30,
          language: 'es',
          scheduled: false
        },
        b2c: {
          title: 'Invertir y Vivir en España — Edición Latinoamérica',
          subtitle: 'Guía legal, fiscal, hipotecaria e inmobiliaria para inversores y familias latinoamericanas',
          targetAudience: 'Inversores y Compradores de Argentina, Colombia y Venezuela',
          date: '',
          time: '18:00',
          spots: 30,
          language: 'es',
          scheduled: false
        }
      },
      sweden: buildRegionDefault('Sweden', 'Swedish Real Estate Brokers & Advisors', 'Swedish Buyers & Second-Home Investors', 'en', '17:00', '18:00'),
      netherlands: buildRegionDefault('Netherlands', 'Dutch Real Estate Agencies & Advisors', 'Dutch Buyers & Investors in Spain', 'nl', '17:00', '18:00'),
      switzerland: buildRegionDefault('Switzerland', 'Swiss Real Estate Brokers & Wealth Advisors', 'Swiss Buyers & Investors in Spain', 'fr', '17:00', '18:00'),
      francophonie_mena: {
        activeType: 'b2c',
        language: 'fr',
        scheduled: false,
        b2b: {
          title: 'Beyond Borders — France, Belgique, Algérie & Émirats',
          subtitle: 'Commissions Internationales de 25% en Espagne avec RE/MAX Inmomás',
          targetAudience: 'Agences et Conseillers Immobiliers (France, Belgique, Algérie & EAU)',
          date: '',
          time: '17:00',
          spots: 25,
          language: 'fr',
          scheduled: false
        },
        b2c: {
          title: 'Investir et Vivre en Espagne — France, Belgique, Algérie & EAU',
          subtitle: 'Accompagnement Immobilier, Juridique et Fiscal Clé en Main en Espagne',
          targetAudience: 'Acheteurs et Investisseurs (France, Belgique, Algérie & Émirats Arabes Unis)',
          date: '',
          time: '18:00',
          spots: 25,
          language: 'fr',
          scheduled: false
        }
      },
      germany: buildRegionDefault('Germany', 'German Real Estate Brokers & Advisors', 'German Buyers & Second-Home Investors', 'de', '17:00', '18:00'),
      ukraine_bulgaria: buildRegionDefault('Ukraine & Bulgaria', 'Ukrainian & Bulgarian Real Estate Brokers', 'Investors & Families from Ukraine & Bulgaria', 'uk', '17:00', '18:00'),
      italy: buildRegionDefault('Italy', 'Italian Real Estate Agencies & Advisors', 'Italian Buyers & Investors in Spain', 'it', '17:00', '18:00'),
      ireland: buildRegionDefault('Ireland', 'Irish Real Estate Brokers & Advisors', 'Irish Buyers & Second-Home Investors', 'en', '18:00', '19:00')
    };

    // Migrate legacy regionalConfigs keys if present in saved settings
    if (!s.regionalConfigs.francophonie_mena && (s.regionalConfigs.western_europe || s.regionalConfigs.mena)) {
      s.regionalConfigs.francophonie_mena = s.regionalConfigs.western_europe || s.regionalConfigs.mena;
    }
    if (!s.regionalConfigs.ukraine_bulgaria && s.regionalConfigs.eastern_europe) {
      s.regionalConfigs.ukraine_bulgaria = s.regionalConfigs.eastern_europe;
    }

    Object.keys(regionDefaults).forEach(regKey => {
      if (!s.regionalConfigs[regKey]) {
        s.regionalConfigs[regKey] = regionDefaults[regKey];
      } else {
        const mergedB2B = sanitizeSeedWebinarTrack({ ...regionDefaults[regKey].b2b, ...(s.regionalConfigs[regKey].b2b || {}) });
        const mergedB2C = sanitizeSeedWebinarTrack({ ...regionDefaults[regKey].b2c, ...(s.regionalConfigs[regKey].b2c || {}) });
        s.regionalConfigs[regKey] = {
          ...regionDefaults[regKey],
          ...s.regionalConfigs[regKey],
          b2b: mergedB2B,
          b2c: mergedB2C
        };
      }
    });
    return s;
  }

  function getRegionalWebinarConfig(settingsObj, regionId = 'north_america', forceType = null) {
    const s = ensureRegionalWebinarConfigs(settingsObj || DEFAULT_WEBINAR_SETTINGS);
    const mappedReg = (App.utils && App.utils.LEGACY_REGION_MAP && App.utils.LEGACY_REGION_MAP[regionId]) || regionId;
    const cleanReg = (mappedReg && s.regionalConfigs[mappedReg]) ? mappedReg : 'north_america';
    const regBlock = s.regionalConfigs[cleanReg];
    const activeType = forceType || regBlock.activeType || s.activeType || 'b2c';
    const typeCfg = regBlock[activeType] || {};
    const baseGlobalTypeCfg = s[activeType] || {};
    const candidateDate = typeCfg.scheduled === false
      ? ''
      : (typeCfg.date || '');
    const isExplicitlyScheduled = typeCfg.scheduled !== false && Boolean(candidateDate);
    return {
      ...baseGlobalTypeCfg,
      ...typeCfg,
      region: cleanReg,
      activeType,
      scheduled: isExplicitlyScheduled,
      language: typeCfg.language || regBlock.language || 'en',
      date: candidateDate,
      time: typeCfg.time || (cleanReg === 'north_america' ? s.time : '') || '18:00',
      spots: typeCfg.spots || (cleanReg === 'north_america' ? s.spotsAvailable : 25) || 25
    };
  }

  function getDefaultWebinarSettings() {
    return ensureRegionalWebinarConfigs(JSON.parse(JSON.stringify(DEFAULT_WEBINAR_SETTINGS)));
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
      region: clientData.region || (App.utils && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(clientData.country || '') : '') || '',
      budget: clientData.budget || '—',
      interestArea: clientData.interestArea || '—',
      notes: clientData.notes || '',
      timeline: clientData.timeline || '—',
      objective: clientData.objective || '—',
      needsUCI: clientData.needsUCI || false,
      needsFuster: clientData.needsFuster || false,
      needsHolidays: clientData.needsHolidays || false,
      status: 'contacted',
      referredBy: (user.role === 'realtor' || user.role === 'colaborador' || user.role === 'embajador') ? user.id : null,
      brokerId: (user.role === 'broker') ? user.id : (user.brokerId || null),
      embajadorId: (user.role === 'embajador') ? user.id : (user.embajadorId || null),
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

    // Auto-enroll client in B2C client webinar
    await autoEnrollClientWebinar(newClient, {
      referrerName: `${user.firstName} ${user.lastName}`.trim(),
      referrerId: user.id,
      agentReferrerId: user.id,
      agentReferrerName: `${user.firstName} ${user.lastName}`.trim(),
      agentReferrerRole: user.role,
      howHeard: 'agent'
    });

    return newClient;
  }

  /* ---- Add Client via Referral (public, no auth required) ---- */
  async function addReferralClient(clientData, options = {}) {
    const emailNorm = (clientData.email || '').toLowerCase().trim();

    // Prevent duplicate CRM client records for the same email
    if (emailNorm) {
      if (App.demoMode) {
        if (!App.demoData.clients) App.demoData.clients = [];
        const existingDemo = App.demoData.clients.find(c => (c.email || '').toLowerCase().trim() === emailNorm);
        if (existingDemo) return existingDemo;
      } else if (App.db) {
        try {
          const dupSnap = await App.db.collection('clients').where('email', '==', clientData.email.trim()).limit(1).get();
          if (!dupSnap.empty) {
            return { id: dupSnap.docs[0].id, ...dupSnap.docs[0].data() };
          }
          if (emailNorm !== clientData.email.trim()) {
            const dupSnapLower = await App.db.collection('clients').where('email', '==', emailNorm).limit(1).get();
            if (!dupSnapLower.empty) {
              return { id: dupSnapLower.docs[0].id, ...dupSnapLower.docs[0].data() };
            }
          }
        } catch (dupErr) {
          console.warn('[Auth] Duplicate client check warning:', dupErr);
        }
      }
    }

    const newClient = {
      id: 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      phone: clientData.phone || '—',
      country: clientData.country || clientData.currentLocation || '—',
      currentLocation: clientData.currentLocation || clientData.country || '—',
      region: clientData.region || (App.utils && App.utils.resolveRegionFromCountry ? App.utils.resolveRegionFromCountry(clientData.country || clientData.currentLocation || '') : '') || '',
      budget: clientData.budget || 'TBD',
      interestArea: clientData.interestArea || '—',
      timeline: clientData.timeline || '—',
      objective: clientData.objective || '—',
      notes: clientData.notes || '',
      needsUCI: clientData.needsUCI || false,
      needsFuster: clientData.needsFuster || false,
      needsHolidays: clientData.needsHolidays || false,
      tag: clientData.tag || 'spain_buyer',
      status: 'contacted',
      referredBy: clientData.referredBy || clientData.inmomasAgentName || null,
      realtorId: clientData.realtorId || null,
      realtorName: clientData.realtorName || null,
      brokerId: clientData.brokerId || null,
      embajadorId: clientData.embajadorId || null,
      localAgentId: clientData.localAgentId || null,
      localAgentName: clientData.localAgentName || clientData.inmomasAgentName || null,
      inmomasAgentName: clientData.inmomasAgentName || null,
      termsAccepted: clientData.termsAccepted !== undefined ? clientData.termsAccepted : true,
      termsAcceptedAt: clientData.termsAcceptedAt || new Date().toISOString(),
      source: clientData.source || 'referral',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{
        status: 'contacted',
        date: new Date().toISOString(),
        note: clientData.historyNote || 'Registered via referral link'
      }]
    };

    if (App.demoMode) {
      if (!App.demoData.clients) App.demoData.clients = [];
      App.demoData.clients.push(newClient);
      saveDemoData();
    } else {
      await App.db.collection('clients').doc(newClient.id).set(newClient);
    }

    // Notify referring agent and admins of new client registration
    if (!options.silentNotifications && window.App && window.App.notifications) {
      const clientForNotif = {
        ...newClient,
        role: 'client',
        country: newClient.currentLocation || '—',
        agencyName: newClient.objective || newClient.interestArea || 'Cliente / Comprador'
      };

      // 1. Notify referring realtor/agent/embajador FIRST
      if (newClient.referredBy || newClient.realtorId || newClient.localAgentId || newClient.brokerId || newClient.embajadorId) {
        try {
          const allUsers = await getAllUsers();
          const refKey = (newClient.referredBy || newClient.realtorId || newClient.localAgentId || newClient.brokerId || newClient.embajadorId || '').toString();
          const referrerAgent = allUsers.find(u =>
            u.id === refKey ||
            (u.referralCode && u.referralCode.toUpperCase() === refKey.toUpperCase())
          );
          if (referrerAgent) {
            await window.App.notifications.onNewReferredCollaborator(clientForNotif, referrerAgent).catch(() => {});
          }
        } catch (e) {
          console.warn('[Notifications] Error finding referrer agent for client:', e);
        }
      }

      // 2. Notify admins (The Spain Connection, then Maia)
      await window.App.notifications.onNewUserRegistration(clientForNotif).catch(() => {});
    }

    // Auto-enroll client in B2C client webinar (silent since onNewUserRegistration already notified)
    if (!options.skipWebinarAutoEnroll) {
      await autoEnrollClientWebinar(newClient, {
        howHeard: 'Referral Link',
        referrerId: clientData.referredBy || null,
        agentReferrerId: clientData.localAgentId || clientData.realtorId || null,
        agentReferrerName: clientData.localAgentName || clientData.realtorName || clientData.inmomasAgentName || null,
        silent: true
      });
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
      referralCode: `${userData.role === 'embajador' ? 'EMB' : (userData.role === 'broker' ? 'BRK' : (userData.role === 'colaborador' ? 'COL' : 'REA'))}-${(userData.lastName || 'USER').toUpperCase()}`,
      source: 'referral',
      referredBy: userData.referredBy || userData.inmomasAgentName || null,
      inmomasAgentName: userData.inmomasAgentName || null,
      termsAccepted: userData.termsAccepted !== undefined ? userData.termsAccepted : true,
      termsAcceptedAt: userData.termsAcceptedAt || new Date().toISOString(),
      brokerId: userData.brokerId || null,
      embajadorId: userData.embajadorId || null,
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
      // 1. Notify referring realtor/agent FIRST
      if (newUser.referredBy) {
        try {
          const allUsers = await getAllUsers();
          const referrerAgent = allUsers.find(u => u.id === newUser.referredBy || (u.referralCode && u.referralCode.toUpperCase() === (newUser.referredBy || "").toUpperCase()));
          if (referrerAgent) {
            await window.App.notifications.onNewReferredCollaborator(newUser, referrerAgent).catch(() => {});
          }
        } catch(e) {
          console.warn('[Notifications] Error finding referrer agent:', e);
        }
      }

      // 2. Notify admins (The Spain Connection, then Maia)
      await window.App.notifications.onNewUserRegistration(newUser).catch(() => {});
    }

    // Auto-enroll referred user in webinar
    if (newUser.role === 'client') {
      await autoEnrollClientWebinar(newUser, { silent: true });
    } else if (['realtor', 'broker'].includes(newUser.role)) {
      await autoEnrollRealtorWebinar(newUser, { silent: true });
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

  /* ---- Convert Client to User (Realtor / Broker) ---- */
  async function convertClientToUser(clientId, targetRole = 'realtor', options = {}) {
    if (!clientId) throw new Error('Client ID is required.');

    if (App.demoMode) {
      const client = App.demoData.clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found.');

      const email = (client.email || '').toLowerCase().trim();
      const lastName = client.lastName || 'User';
      const userId = client.id.startsWith('client_') || client.id.startsWith('cli-') 
        ? client.id.replace(/^client_|^cli-/, 'usr_') 
        : ('usr_' + Date.now());

      const referralCode = `${targetRole === 'embajador' ? 'EMB' : (targetRole === 'broker' ? 'BRK' : (targetRole === 'agent_inmomas' ? 'LOC' : (targetRole === 'colaborador' ? 'COL' : 'REA')))}-${lastName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

      let user = App.demoData.users.find(u => u.email.toLowerCase() === email);
      if (user) {
        user.role = targetRole;
        user.status = options.status || 'pending';
        user.firstName = client.firstName || user.firstName;
        user.lastName = client.lastName || user.lastName;
        user.phone = client.phone || user.phone;
        user.updatedAt = new Date().toISOString();
      } else {
        user = {
          id: userId,
          email: email,
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          phone: client.phone || '',
          country: client.currentLocation || client.country || 'United States',
          agencyName: client.agencyName || (targetRole === 'broker' ? 'Brokerage Agency' : 'Real Estate Agent'),
          role: targetRole,
          status: options.status || 'pending',
          brokerStatus: targetRole === 'realtor' ? 'pending' : null,
          brokerId: client.brokerId || null,
          referredBy: client.referredBy || client.realtorId || null,
          referralCode: referralCode,
          profileImage: null,
          agreementSigned: false,
          agreementSignedAt: null,
          source: client.source || 'converted_from_client',
          createdAt: client.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        App.demoData.users.push(user);
      }

      if (options.deleteClient !== false) {
        const cIdx = App.demoData.clients.findIndex(c => c.id === clientId);
        if (cIdx !== -1) App.demoData.clients.splice(cIdx, 1);
        const commIdx = App.demoData.commissions.findIndex(c => c.clientId === clientId);
        if (commIdx !== -1) App.demoData.commissions.splice(commIdx, 1);
      }

      saveDemoData();
      return { success: true, user };
    } else {
      const clientDoc = await App.db.collection('clients').doc(clientId).get();
      if (!clientDoc.exists) throw new Error('Client not found in database.');
      const client = clientDoc.data();

      const email = (client.email || '').toLowerCase().trim();
      const lastName = client.lastName || 'User';
      const userId = clientId.startsWith('client_') || clientId.startsWith('cli-')
        ? clientId.replace(/^client_|^cli-/, 'usr_')
        : ('usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

      const referralCode = `${targetRole === 'embajador' ? 'EMB' : (targetRole === 'broker' ? 'BRK' : (targetRole === 'agent_inmomas' ? 'LOC' : (targetRole === 'colaborador' ? 'COL' : 'REA')))}-${lastName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

      const userSnap = await App.db.collection('users').where('email', '==', email).get();
      let finalUser;

      if (!userSnap.empty) {
        const existingDoc = userSnap.docs[0];
        const updatePayload = {
          role: targetRole,
          status: options.status || 'pending',
          updatedAt: new Date().toISOString()
        };
        if (client.phone && (!existingDoc.data().phone || existingDoc.data().phone === '—')) {
          updatePayload.phone = client.phone;
        }
        await existingDoc.ref.update(updatePayload);
        finalUser = { id: existingDoc.id, ...existingDoc.data(), ...updatePayload };
      } else {
        const userPayload = {
          email: email,
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          phone: client.phone && client.phone !== '—' ? client.phone : '',
          country: client.currentLocation || client.country || 'United States',
          agencyName: client.agencyName || (targetRole === 'broker' ? 'Brokerage Agency' : 'Real Estate Agent'),
          role: targetRole,
          status: options.status || 'pending',
          brokerStatus: targetRole === 'realtor' ? 'pending' : null,
          brokerId: client.brokerId || null,
          referredBy: client.referredBy || client.realtorId || null,
          referralCode: referralCode,
          profileImage: null,
          agreementSigned: false,
          agreementSignedAt: null,
          source: client.source || 'converted_from_client',
          createdAt: client.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await App.db.collection('users').doc(userId).set(userPayload);
        finalUser = { id: userId, ...userPayload };
      }

      if (options.deleteClient !== false) {
        await App.db.collection('clients').doc(clientId).delete();
        const commQuery = await App.db.collection('commissions').where('clientId', '==', clientId).get();
        if (!commQuery.empty) {
          const batch = App.db.batch();
          commQuery.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }

      return { success: true, user: finalUser };
    }
  }

  async function batchConvertClientsToUsers(clientIds, targetRole = 'realtor') {
    if (!Array.isArray(clientIds) || clientIds.length === 0) return [];
    const results = [];
    for (const id of clientIds) {
      try {
        const res = await convertClientToUser(id, targetRole);
        results.push({ id, success: true, user: res.user });
      } catch (err) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  /* ============================================
     Newsletter Functions
     ============================================ */

  /**
   * Returns all users that have consented to newsletter, optionally filtered by role.
   * @param {string|null} roleFilter - 'broker', 'realtor', 'agent_inmomas', or null for all.
   */
  async function getNewsletterSubscribers(roleFilter, regionFilter = '') {
    const users = await getAllUsers();
    return users.filter(u => {
      const hasConsent = u.newsletterConsent === true;
      const isActive = u.status === 'active';
      const matchesRole = !roleFilter || roleFilter === 'all' || u.role === roleFilter;
      let matchesRegion = true;
      if (regionFilter && App.utils && App.utils.getUserRegions) {
        const uRegs = App.utils.getUserRegions(u);
        matchesRegion = uRegs.includes(regionFilter);
      }
      return hasConsent && isActive && matchesRole && matchesRegion;
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

  /* ============================================
     Umbrella Network Resolution (Embajador)
     Resolves all direct & indirect contacts under
     an Embajador's umbrella: Brokers, Realtors,
     Colaboradores, Clients, Commissions & Webinars.
     ============================================ */
  async function getUmbrellaData(embajadorId) {
    if (!embajadorId) {
      return {
        embajador: null,
        users: [],
        brokers: [],
        realtors: [],
        colaboradores: [],
        clients: [],
        commissions: [],
        webinarRegistrations: []
      };
    }

    const [allUsers, allClients, allCommissions, allWebinars] = await Promise.all([
      getAllUsers(),
      getClients({}, true),
      getCommissions({}, true),
      getWebinarRegistrations(true)
    ]);

    const userById = new Map();
    const userByRefCode = new Map();
    allUsers.forEach(u => {
      if (u.id) userById.set(u.id, u);
      if (u.referralCode) {
        userByRefCode.set(String(u.referralCode).toUpperCase().trim(), u);
      }
    });

    const embajadorUser = userById.get(embajadorId) || (currentUser && currentUser.id === embajadorId ? currentUser : null);
    const umbrellaUserIds = new Set([embajadorId]);
    const umbrellaRefCodes = new Set();
    if (embajadorUser && embajadorUser.referralCode) {
      umbrellaRefCodes.add(String(embajadorUser.referralCode).toUpperCase().trim());
    }

    const umbrellaMembersMap = new Map();
    const eligibleRoles = new Set(['broker', 'realtor', 'colaborador']);

    const resolveParentUser = (u) => {
      if (u.role !== 'broker' && u.brokerId && userById.has(u.brokerId)) {
        return userById.get(u.brokerId);
      }
      if (u.referredBy) {
        const byId = userById.get(u.referredBy);
        if (byId && byId.role !== 'agent_inmomas' && !(u.role === 'colaborador' && byId.role === 'realtor')) return byId;
        const byCode = userByRefCode.get(String(u.referredBy).toUpperCase().trim());
        if (byCode && byCode.role !== 'agent_inmomas' && !(u.role === 'colaborador' && byCode.role === 'realtor')) return byCode;
      }
      if (u.embajadorId && userById.has(u.embajadorId)) {
        return userById.get(u.embajadorId);
      }
      return null;
    };

    // Multi-level graph expansion (downward + upward Broker attachment when an Agent registered first and Broker was linked later)
    let changed = true;
    while (changed) {
      changed = false;
      for (const u of allUsers) {
        if (!u || !u.id || u.id === embajadorId || umbrellaMembersMap.has(u.id)) continue;
        if (!eligibleRoles.has(u.role)) continue;

        const refCodeUpper = u.referredBy ? String(u.referredBy).toUpperCase().trim() : '';
        const matchesEmbajadorId = Boolean(u.embajadorId && umbrellaUserIds.has(u.embajadorId));
        const matchesBrokerId = Boolean(u.brokerId && umbrellaUserIds.has(u.brokerId));
        const matchesReferredBy = Boolean(
          u.referredBy && (umbrellaUserIds.has(u.referredBy) || (refCodeUpper && umbrellaRefCodes.has(refCodeUpper)))
        );
        // Upward Broker attachment: if an Agent in this umbrella has brokerId === u.id, attach Broker u into the umbrella
        const matchesLinkedAgentBroker = Boolean(
          u.role === 'broker' &&
          (!u.embajadorId || u.embajadorId === embajadorId) &&
          Array.from(umbrellaMembersMap.values()).some(m => m.brokerId === u.id)
        );

        if (matchesEmbajadorId || matchesBrokerId || matchesReferredBy || matchesLinkedAgentBroker) {
          umbrellaMembersMap.set(u.id, { ...u });
          umbrellaUserIds.add(u.id);
          if (u.referralCode) {
            umbrellaRefCodes.add(String(u.referralCode).toUpperCase().trim());
          }
          changed = true;
        }
      }
    }

    // Recompute exact hierarchy levels now that all Brokers and Realtors in the umbrella are present
    umbrellaMembersMap.forEach((u, id) => {
      let parent = null;
      if (u.role !== 'broker' && u.brokerId && umbrellaMembersMap.has(u.brokerId)) {
        parent = umbrellaMembersMap.get(u.brokerId);
      } else {
        const candidate = resolveParentUser(u);
        if (candidate && (candidate.id === embajadorId || umbrellaMembersMap.has(candidate.id))) {
          parent = candidate;
        }
      }
      const isDirect = !parent || parent.id === embajadorId || u.role === 'broker';
      const effectiveParent = (u.role === 'broker') ? embajadorUser : parent;
      umbrellaMembersMap.set(id, {
        ...u,
        _umbrellaLevel: isDirect ? 1 : 2,
        _isDirectFromEmbajador: isDirect,
        _umbrellaParentId: (!isDirect && effectiveParent) ? effectiveParent.id : embajadorId,
        _umbrellaParentName: isDirect
          ? 'Directo (Embajador)'
          : (`${effectiveParent.firstName || ''} ${effectiveParent.lastName || ''}`.trim() || effectiveParent.agencyName || 'Broker'),
        _umbrellaParentRole: isDirect ? 'embajador' : (effectiveParent.role || 'broker')
      });
    });

    const lookupMaps = (App.utils && App.utils._buildUserLookupMaps)
      ? App.utils._buildUserLookupMaps(allUsers)
      : null;

    const enrichWithInmomas = (u) => {
      if (!u) return u;
      if (App.utils && App.utils.resolveAssignedInmomasAgent) {
        const res = App.utils.resolveAssignedInmomasAgent(u, allUsers, lookupMaps);
        return {
          ...u,
          _inmomasAgentId: res.id || null,
          _inmomasAgentName: res.name || '',
          _inmomasAgentInherited: Boolean(res.inherited),
          _inmomasAgentInheritedFrom: res.inheritedFrom || null
        };
      }
      return u;
    };

    const umbrellaUsers = Array.from(umbrellaMembersMap.values())
      .map(enrichWithInmomas)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const enrichedEmbajador = enrichWithInmomas(embajadorUser);

    // Resolve all clients generated anywhere under the Embajador's umbrella
    const umbrellaClients = [];
    for (const c of allClients) {
      if (!c) continue;
      const refCodeUpper = c.referredBy ? String(c.referredBy).toUpperCase().trim() : '';
      const inUmbrella = Boolean(
        (c.embajadorId && umbrellaUserIds.has(c.embajadorId)) ||
        (c.referredBy && (umbrellaUserIds.has(c.referredBy) || (refCodeUpper && umbrellaRefCodes.has(refCodeUpper)))) ||
        (c.realtorId && umbrellaUserIds.has(c.realtorId)) ||
        (c.brokerId && umbrellaUserIds.has(c.brokerId)) ||
        (c.addedManuallyBy && umbrellaUserIds.has(c.addedManuallyBy))
      );

      if (inUmbrella) {
        let subMember = null;
        if (c.realtorId && umbrellaMembersMap.has(c.realtorId)) {
          subMember = umbrellaMembersMap.get(c.realtorId);
        } else if (c.referredBy) {
          if (umbrellaMembersMap.has(c.referredBy)) {
            subMember = umbrellaMembersMap.get(c.referredBy);
          } else if (refCodeUpper) {
            for (const m of umbrellaMembersMap.values()) {
              if (m.referralCode && String(m.referralCode).toUpperCase().trim() === refCodeUpper) {
                subMember = m;
                break;
              }
            }
          }
        }
        if (!subMember && c.brokerId && umbrellaMembersMap.has(c.brokerId)) {
          subMember = umbrellaMembersMap.get(c.brokerId);
        }
        if (!subMember && c.addedManuallyBy && umbrellaMembersMap.has(c.addedManuallyBy)) {
          subMember = umbrellaMembersMap.get(c.addedManuallyBy);
        }

        const isDirect = !subMember;
        const originBrokerName = (!isDirect && subMember.role === 'realtor' && subMember._umbrellaParentRole === 'broker')
          ? (subMember._umbrellaParentName || '')
          : '';

        umbrellaClients.push({
          ...c,
          _isDirectFromEmbajador: isDirect,
          _originMemberId: isDirect ? embajadorId : subMember.id,
          _originMemberName: isDirect
            ? 'Directo (Embajador)'
            : (`${subMember.firstName || ''} ${subMember.lastName || ''}`.trim() || c.realtorName || 'Miembro Paraguas'),
          _originMemberRole: isDirect ? 'embajador' : (subMember.role || 'realtor'),
          _originBrokerName: originBrokerName
        });
      }
    }
    umbrellaClients.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Resolve umbrella commissions
    const umbrellaClientIds = new Set(umbrellaClients.map(c => c.id));
    const umbrellaCommissions = allCommissions.filter(comm => {
      if (!comm) return false;
      return Boolean(
        comm.embajadorId === embajadorId ||
        (comm.clientId && umbrellaClientIds.has(comm.clientId)) ||
        (comm.realtorId && umbrellaUserIds.has(comm.realtorId)) ||
        (comm.brokerId && umbrellaUserIds.has(comm.brokerId))
      );
    });

    // Resolve umbrella webinar registrations
    const umbrellaEmails = new Set();
    umbrellaUsers.forEach(u => { if (u.email) umbrellaEmails.add(String(u.email).toLowerCase().trim()); });
    umbrellaClients.forEach(c => { if (c.email) umbrellaEmails.add(String(c.email).toLowerCase().trim()); });

    const umbrellaWebinars = allWebinars.filter(w => {
      if (!w) return false;
      const wCode = w.referralCode ? String(w.referralCode).toUpperCase().trim() : '';
      const wEmail = w.email ? String(w.email).toLowerCase().trim() : '';
      return Boolean(
        (wCode && umbrellaRefCodes.has(wCode)) ||
        (w.referrerId && umbrellaUserIds.has(w.referrerId)) ||
        (w.agentReferrerId && umbrellaUserIds.has(w.agentReferrerId)) ||
        (wEmail && umbrellaEmails.has(wEmail))
      );
    });

    // Strictly strip end-client personal data whenever caller is not an Administrator
    const isAdminCaller = Boolean(currentUser && currentUser.role === 'admin');
    const safeClients = isAdminCaller
      ? umbrellaClients
      : umbrellaClients.map((c, idx) => redactEndClientRecord(c, idx));

    const safeClientById = new Map();
    safeClients.forEach(c => { if (c && c.id) safeClientById.set(c.id, c); });

    const safeCommissions = isAdminCaller
      ? umbrellaCommissions
      : umbrellaCommissions.map((comm, idx) => {
          const matchedCli = comm.clientId ? safeClientById.get(comm.clientId) : null;
          const code = matchedCli ? matchedCli._anonCode : buildAnonClientCode(comm.clientId || comm.id, idx);
          const displayName = (matchedCli && matchedCli._displayName) || comm.clientName || `Cliente (${code})`;
          return {
            ...comm,
            _anonCode: code,
            _displayName: displayName,
            _labelEs: displayName,
            _labelEn: displayName,
            clientName: displayName,
            propertyAddress: (matchedCli && matchedCli.interestArea) ? matchedCli.interestArea : (comm.propertyAddress || 'España')
          };
        });

    const safeWebinars = isAdminCaller
      ? umbrellaWebinars
      : umbrellaWebinars.map((w, idx) => redactWebinarRecordForEmbajador(w, idx));

    // Also strip email/phone from professional umbrella members when viewed by Embajador
    const safeUsers = isAdminCaller
      ? umbrellaUsers
      : umbrellaUsers.map(u => ({ ...u, email: '', phone: '' }));

    return {
      embajador: enrichedEmbajador,
      allUsers: isAdminCaller ? allUsers : allUsers.map(u => (u.role === 'agent_inmomas' ? u : { ...u, email: '', phone: '' })),
      users: safeUsers,
      brokers: safeUsers.filter(u => u.role === 'broker'),
      realtors: safeUsers.filter(u => u.role === 'realtor'),
      colaboradores: safeUsers.filter(u => u.role === 'colaborador'),
      clients: safeClients,
      commissions: safeCommissions,
      webinarRegistrations: safeWebinars
    };
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
    updateUserEmbajador,
    updateUserBroker,
    updateUserRegionalProfile,
    updateUserAgencyBranding,
    updateBuyerGuideProfile,
    getUmbrellaData,
    updateProfile,
    updateAuthEmail,
    getAllUsers,
    getUser,
    getClients,
    updateClientStatus,
    updateClientTag,
    deleteClient,
    convertClientToUser,
    batchConvertClientsToUsers,
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
    getDefaultWebinarSettings,
    getRegionalWebinarConfig,
    getWebinarFeedbacks,
    deleteWebinarFeedback,
    autoEnrollClientWebinar,
    autoEnrollRealtorWebinar,
    syncMissingWebinarRegistrations
  };
})();
