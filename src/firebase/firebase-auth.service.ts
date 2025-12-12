import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Firebase Authentication Service
 * Fournit des méthodes pour l'authentification avec Firebase
 */
@Injectable()
export class FirebaseAuthService {
  constructor(private firebaseService: FirebaseService) {}

  /**
   * Créer un utilisateur Firebase et synchroniser avec MongoDB
   */
  async registerWithFirebase(
    email: string,
    password: string,
    displayName: string,
  ) {
    try {
      const firebaseUser = await this.firebaseService.createUser(
        email,
        password,
        displayName,
      );
      return {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      };
    } catch (error) {
      throw new Error(`Firebase registration failed: ${error.message}`);
    }
  }

  /**
   * Vérifier un token Firebase
   */
  async verifyFirebaseToken(token: string) {
    return this.firebaseService.verifyToken(token);
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendResetEmail(email: string) {
    return this.firebaseService.sendPasswordResetEmail(email);
  }

  /**
   * Obtenir un utilisateur Firebase par email
   */
  async getFirebaseUser(email: string) {
    return this.firebaseService.getUserByEmail(email);
  }

  /**
   * Supprimer un utilisateur Firebase
   */
  async deleteFirebaseUser(uid: string) {
    return this.firebaseService.deleteUser(uid);
  }
}
