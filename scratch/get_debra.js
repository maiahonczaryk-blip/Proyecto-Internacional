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

async function getDebra() {
  try {
    const usersSnapshot = await db.collection('users').where('email', '==', 'debraynadal@gmail.com').get();
    
    if (usersSnapshot.empty) {
      console.log('No user found with email debraynadal@gmail.com');
    } else {
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\n--- DEBRA ---`);
        console.log(`${data.firstName} ${data.lastName} (${data.email})`);
        console.log(`Referral Link: https://proyecto-internacional.vercel.app/?ref=${data.referralCode}\n`);
      });
    }
    
  } catch (error) {
    console.error('Error fetching user:', error);
  } finally {
    process.exit(0);
  }
}

getDebra();
