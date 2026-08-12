const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const saPath = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(saPath)) {
  console.error('Service account file not found!');
  process.exit(1);
}

const serviceAccount = require(saPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getOzzie() {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    let found = false;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const name = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase();
      const email = (data.email || '').toLowerCase();
      if (name.includes('ozzie') || email.includes('ozzie')) {
        console.log(`\n--- OZZIE ---`);
        console.log(`${data.firstName} ${data.lastName} (${data.email})`);
        console.log(`Referral Link: https://proyecto-internacional.vercel.app/?ref=${data.referralCode}\n`);
        found = true;
      }
    });

    if (!found) {
      console.log('No user found containing "ozzie" in name or email.');
    }
    
  } catch (error) {
    console.error('Error fetching user:', error);
  } finally {
    process.exit(0);
  }
}

getOzzie();
