// 🔧 AJOUTER UN DEVICE TOKEN DE TEST ET ENVOYER NOTIFICATION

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

console.log('✅ Firebase initialisé');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ CONNECTER À MONGODB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ MongoDB connecté\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3️⃣ CRÉER SCHÉMA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', userSchema, 'users');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4️⃣ AJOUTER UN DEVICE TOKEN DE TEST
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const testDeviceToken = process.argv[2] || 'test-device-token-' + Date.now();

  console.log('📱 Ajout du device token de test...\n');
  console.log(`   Email: eya.mosbeh@example.com`);
  console.log(`   Token: ${testDeviceToken}\n`);

  const updated = await User.findOneAndUpdate(
    { email: 'eya.mosbeh@example.com' },
    { deviceToken: testDeviceToken },
    { new: true }
  );

  if (!updated) {
    console.log('❌ Utilisateur non trouvé!');
    mongoose.connection.close();
    process.exit(1);
  }

  console.log('✅ Device token ajouté en base de données\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5️⃣ ENVOYER LA NOTIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  console.log('📤 Envoi de la notification...\n');

  try {
    const message = {
      notification: {
        title: '🧪 Test Notification - Karhebti',
        body: 'Voici une notification de test! Les notifications fonctionnent! 🎉',
      },
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        message: 'Test notification envoyée avec succès',
      },
      token: testDeviceToken as string,
    };

    const response = await admin.messaging().send(message);

    console.log('═'.repeat(60));
    console.log('✅ NOTIFICATION ENVOYÉE AVEC SUCCÈS!');
    console.log('═'.repeat(60));
    console.log(`\n📊 Détails:`);
    console.log(`   Message ID: ${response}`);
    console.log(`   À: eya.mosbeh@example.com`);
    console.log(`   Timestamp: ${new Date().toLocaleString()}`);
    console.log(`\n📱 Vérifiez votre téléphone/appareil!`);
    console.log(`   La notification devrait arriver en 1-2 secondes ⏱️\n`);
    console.log('═'.repeat(60));

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi:');
    console.error(`   ${error.message}`);
    console.log('\n💡 Conseil:');
    console.log('   Si le token est invalide, c\'est normal!');
    console.log('   Il faut utiliser un vrai token depuis votre app mobile.\n');
  }

  mongoose.connection.close();

}).catch((err) => {
  console.error('❌ Erreur MongoDB:', err);
  process.exit(1);
});
