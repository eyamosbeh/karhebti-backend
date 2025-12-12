import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export const initializeFirebase = () => {
  // Vérifier si Firebase est déjà initialisé
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Récupérer le chemin de la clé Firebase depuis les variables d'environnement
  const firebaseKeyPath = process.env.FIREBASE_KEY_PATH;

  if (!firebaseKeyPath) {
    console.warn(
      '⚠️  FIREBASE_KEY_PATH non défini. Firebase Cloud Messaging ne sera pas disponible.',
    );
    return null;
  }

  // Charger la clé Firebase depuis le fichier
  let serviceAccount: any;

  try {
    const absolutePath = path.resolve(firebaseKeyPath);
    
    if (fs.existsSync(absolutePath)) {
      const rawData = fs.readFileSync(absolutePath, 'utf-8');
      serviceAccount = JSON.parse(rawData);
    } else if (fs.existsSync(firebaseKeyPath)) {
      const rawData = fs.readFileSync(firebaseKeyPath, 'utf-8');
      serviceAccount = JSON.parse(rawData);
    } else {
      // Essayer de parser directement depuis les variables d'environnement
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_KEY || '', 'base64').toString(),
      );
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Firebase:', error);
    return null;
  }
};

export const getFirebaseMessaging = () => {
  const app = admin.app();
  if (!app) {
    return null;
  }
  return admin.messaging(app);
};
