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

async function getAgents() {
  try {
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} total users in Firestore.`);
    
    const remaxAgents = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.toLowerCase().endsWith('@remax.es')) {
        remaxAgents.push({
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          referralCode: data.referralCode
        });
      }
    });

    console.log('\n--- AGENTES @REMAX.ES ---');
    remaxAgents.forEach(agent => {
      console.log(`${agent.name} (${agent.email})`);
      console.log(`Referral Link: https://proyecto-internacional.vercel.app/?ref=${agent.referralCode}\n`);
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    process.exit(0);
  }
}

getAgents();
