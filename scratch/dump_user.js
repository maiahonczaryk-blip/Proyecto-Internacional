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
    const cred = await auth.signInWithEmailAndPassword('fuster@partner.com', 'fuster123');
    const doc = await db.collection('users').doc(cred.user.uid).get();
    console.log(JSON.stringify(doc.data(), null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}

runTest();
