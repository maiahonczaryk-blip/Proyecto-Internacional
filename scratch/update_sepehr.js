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

async function updateSepehrEmail() {
  const oldEmail = 'seps.sh@gmail.com';
  const newEmail = 'sepehr.hosseini@remax.es';
  
  try {
    const usersSnapshot = await db.collection('users').where('email', '==', oldEmail).get();
    
    if (usersSnapshot.empty) {
      console.log(`No user found with email ${oldEmail} in Firestore.`);
    } else {
      let uidToUpdate = null;
      // Update in Firestore
      for (const doc of usersSnapshot.docs) {
        uidToUpdate = doc.id;
        await doc.ref.update({ email: newEmail });
        console.log(`Updated email in Firestore for document ${doc.id}`);
      }

      // Update in Firebase Auth
      if (uidToUpdate) {
        try {
          await admin.auth().updateUser(uidToUpdate, { email: newEmail });
          console.log(`Updated email in Firebase Auth for UID: ${uidToUpdate}`);
        } catch (authError) {
          console.error('Error updating Firebase Auth:', authError.message);
        }
      }
      
      console.log('\n✅ El correo de Sepehr ha sido actualizado exitosamente a: ' + newEmail);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateSepehrEmail();
