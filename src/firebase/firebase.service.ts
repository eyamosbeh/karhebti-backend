import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.app();
        console.log('✅ Firebase Admin SDK already initialized');
        return;
      }

      const keyPath = process.env.FIREBASE_KEY_PATH || 'firebase/karhebti-adminsdk.json';
      const absolutePath = path.join(process.cwd(), keyPath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Firebase service account key not found at ${absolutePath}`);
      }

      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'karhebti-android',
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      throw error;
    }
  }

  getAuth() {
    return admin.auth();
  }

  getFirestore() {
    return admin.firestore();
  }

  getStorage() {
    return admin.storage();
  }

  getDatabase() {
    return admin.database();
  }

  /**
   * Vérifier un token Firebase
   */
  async verifyToken(token: string) {
    try {
      const decodedToken = await this.getAuth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Créer un utilisateur Firebase
   */
  async createUser(email: string, password: string, displayName?: string) {
    try {
      const userRecord = await this.getAuth().createUser({
        email,
        password,
        displayName,
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create Firebase user: ${error.message}`);
    }
  }

  /**
   * Supprimer un utilisateur Firebase
   */
  async deleteUser(uid: string) {
    try {
      await this.getAuth().deleteUser(uid);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete Firebase user: ${error.message}`);
    }
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string) {
    try {
      const resetLink = await this.getAuth().generatePasswordResetLink(email);
      return resetLink;
    } catch (error) {
      throw new Error(`Failed to generate password reset link: ${error.message}`);
    }
  }

  /**
   * Obtenir les informations d'un utilisateur
   */
  async getUserByEmail(email: string) {
    try {
      const userRecord = await this.getAuth().getUserByEmail(email);
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
  }
}
