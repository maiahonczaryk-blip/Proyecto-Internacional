const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- 1. Load Service Account Key ---
const saPath = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(saPath)) {
  console.error('\n❌ ERROR: Service account key file not found!');
  console.error(`Expected file at: ${saPath}`);
  console.error('\nTo fix this:');
  console.error('1. Go to Firebase Console -> Project Settings -> Service Accounts');
  console.error('2. Click "Generate new private key" and download the JSON file.');
  console.error('3. Place it at the root of the project as "firebase-service-account.json" OR export the environment variable:');
  console.error('   export FIREBASE_SERVICE_ACCOUNT=/path/to/key.json\n');
  process.exit(1);
}

console.log(`\n⏳ Loading service account key from: ${saPath}`);
const serviceAccount = require(saPath);

// --- 2. Initialize Firebase Admin SDK ---
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
console.log('✅ Firebase Admin initialized successfully.');

// --- 3. Extract Mock Data from firebase-config.js via VM Context ---
const configFilePath = path.join(__dirname, '../js/firebase-config.js');
if (!fs.existsSync(configFilePath)) {
  console.error(`❌ ERROR: Config file not found at ${configFilePath}`);
  process.exit(1);
}

console.log('⏳ Extracting default mock data from js/firebase-config.js...');
try {
  const configCode = fs.readFileSync(configFilePath, 'utf8');
  // Create virtual context mocking browser environment objects
  const context = {};
  context.window = context;
  vm.createContext(context);
  vm.runInContext(configCode, context);
  
  if (!context.window.App || !context.window.App.demoData) {
    throw new Error('demoData not found in App context');
  }
  
  const demoData = context.window.App.demoData;
  console.log(`✅ Extracted data: ${demoData.users.length} users, ${demoData.clients.length} clients, ${demoData.commissions.length} commissions, ${demoData.dossier_leads.length} leads.`);
  
  // --- 4. Run Migration & Seeding ---
  runMigration(demoData);
} catch (e) {
  console.error('❌ ERROR extracting mock data:', e.message);
  process.exit(1);
}

async function runMigration(demoData) {
  try {
    console.log('\n🚀 Starting Firestore Seeding & Migration...');

    // A. Seed Users
    console.log('\n👥 Seeding Users & Synchronizing Authentication Accounts...');
    for (const user of demoData.users) {
      const uCopy = { ...user };
      const uid = uCopy.id;
      delete uCopy.id;
      const rawPassword = uCopy.password;
      delete uCopy.password; // Clean passwords out of Firestore
      uCopy.updatedAt = uCopy.updatedAt || new Date().toISOString();
      
      // 1. Write the profile to Cloud Firestore
      await db.collection('users').doc(uid).set(uCopy);
      console.log(`   - Seeded user profile in Firestore: ${uCopy.email} (${uCopy.role})`);

      // 2. Synchronize/Create user in Firebase Authentication using the exact same UID
      if (rawPassword) {
        try {
          await admin.auth().createUser({
            uid: uid,
            email: user.email,
            password: rawPassword,
            displayName: `${uCopy.firstName} ${uCopy.lastName}`
          });
          console.log(`   - Created Auth user: ${user.email} with UID: ${uid}`);
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-exists' || authErr.code === 'auth/uid-already-exists') {
            console.log(`   - Auth user already exists: ${user.email}. Updating password/details...`);
            try {
              await admin.auth().updateUser(uid, {
                password: rawPassword,
                displayName: `${uCopy.firstName} ${uCopy.lastName}`
              });
              console.log(`     (Successfully updated Auth details for UID: ${uid})`);
            } catch (updateErr) {
              console.warn(`     ⚠️ Warning updating Auth user: ${updateErr.message}`);
            }
          } else {
            console.error(`   ❌ Failed to sync Auth user for ${user.email}:`, authErr.message);
          }
        }
      }
    }

    // B. Seed Clients
    console.log('\n🤝 Seeding Clients...');
    for (const client of demoData.clients) {
      const cCopy = { ...client };
      const cid = cCopy.id;
      delete cCopy.id;
      cCopy.updatedAt = cCopy.updatedAt || new Date().toISOString();
      
      await db.collection('clients').doc(cid).set(cCopy);
      console.log(`   - Seeded client referral: ${cCopy.firstName} ${cCopy.lastName}`);
    }

    // C. Seed Commissions
    console.log('\n💰 Seeding Commissions...');
    for (const comm of demoData.commissions) {
      const coCopy = { ...comm };
      const coid = coCopy.id;
      delete coCopy.id;
      coCopy.updatedAt = coCopy.updatedAt || new Date().toISOString();
      
      await db.collection('commissions').doc(coid).set(coCopy);
      console.log(`   - Seeded commission split: ${coCopy.clientName} (Sale: €${coCopy.salePrice.toLocaleString()})`);
    }

    // D. Seed Dossier Leads
    console.log('\n📈 Seeding Dossier Leads...');
    const demoLeads = demoData.dossier_leads || [];
    for (const lead of demoLeads) {
      const lCopy = { ...lead };
      const lid = lCopy.id;
      delete lCopy.id;
      
      await db.collection('dossier_leads').doc(lid).set(lCopy);
      console.log(`   - Seeded lead: ${lCopy.firstName} ${lCopy.lastName} (${lCopy.email})`);
    }

    console.log('\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERROR during migration database seeding:', err.message);
    process.exit(1);
  }
}
