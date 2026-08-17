const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
const fs = require('fs');

const configPath = './js/firebase-config.js';
const configContent = fs.readFileSync(configPath, 'utf8');
const configMatch = configContent.match(/const\s+firebaseConfig\s*=\s*(\{[\s\S]*?\});/);
const firebaseConfig = eval("(" + configMatch[1] + ")");
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

async function runTest() {
  try {
    await auth.signInWithEmailAndPassword('fuster@partner.com', 'fuster123');
    const snapshot = await db.collection('clients').get();
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    fs.writeFileSync('scratch/clients.json', JSON.stringify(clients, null, 2));
    console.log("Dumped " + clients.length + " clients");
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

runTest();
