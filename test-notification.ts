// 🧪 TEST NOTIFICATION SCRIPT
// Envoie une notification de test immédiatement à tous les utilisateurs

import admin from 'firebase-admin';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ INITIALISER FIREBASE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const firebaseKeyPath = process.env.FIREBASE_KEY_PATH || 'firebase/karhebti-adminsdk.json';
const serviceAccount = require(path.resolve(firebaseKeyPath));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ CONNECTER À MONGODB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB connecté');
}).catch((err) => {
  console.error('❌ Erreur MongoDB:', err);
  process.exit(1);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ SCHÉMAS MONGOOSE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const userSchema = new mongoose.Schema({
  email: String,
  deviceToken: String,
  role: String,
});

const User = mongoose.model('User', userSchema, 'users');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ ENVOYER NOTIFICATION DE TEST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendTestNotification() {
  try {
    console.log('\n📱 ENVOI DE NOTIFICATION DE TEST...\n');

    // 1. Récupérer les utilisateurs avec device token
    const users = await User.find({ deviceToken: { $exists: true, $ne: null } });

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur avec device token trouvé!');
      console.log('   Les utilisateurs doivent d\'abord envoyer leur device token');
      process.exit(1);
    }

    console.log(`✅ Trouvé ${users.length} utilisateur(s) avec device token:\n`);

    // 2. Afficher les utilisateurs
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`);
      if (user.deviceToken) {
        console.log(`      Token: ${user.deviceToken.substring(0, 50)}...`);
      }
    });

    console.log('\n📤 Envoi des notifications...\n');

    // 3. Envoyer les notifications
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      try {
        if (!user.deviceToken) {
          console.log(`⚠️  ${user.email}: Pas de device token`);
          failureCount++;
          continue;
        }

        const message = {
          notification: {
            title: '🧪 Test Notification',
            body: 'Ceci est une notification de test de Karhebti!',
          },
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            message: 'Test notification from Karhebti backend',
          },
          token: user.deviceToken as string,
        };

        const response = await admin.messaging().send(message);
        console.log(`✅ ${user.email}: Envoyée (${response})`);
        successCount++;
      } catch (error: any) {
        console.log(`❌ ${user.email}: Erreur (${error.message})`);
        failureCount++;
      }
    }

    // 4. Résumé
    console.log('\n' + '═'.repeat(50));
    console.log('📊 RÉSUMÉ');
    console.log('═'.repeat(50));
    console.log(`✅ Succès: ${successCount}/${users.length}`);
    console.log(`❌ Échecs: ${failureCount}/${users.length}`);
    console.log('═'.repeat(50) + '\n');

    if (successCount > 0) {
      console.log('🎉 Les notifications ont été envoyées!');
      console.log('   Vérifiez votre téléphone dans 1-2 secondes 📱\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ LANCER LE SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║         🧪 KARHEBTI TEST NOTIFICATION 🧪          ║');
console.log('╚════════════════════════════════════════════════════╝\n');

sendTestNotification();
