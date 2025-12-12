# ✅ GUIDE D'IMPLÉMENTATION - Changements Backend Karhebti
**Date:** 20 Novembre 2025  
**Status:** 🚀 PRÊT À IMPLÉMENTER  

---

## 📋 RÉSUMÉ DES MODIFICATIONS

Vous avez reçu un fichier détaillé: **BACKEND_CHANGES_IMPLEMENTATION.md**

Voici les **3 fichiers à modifier/créer**:

### 1. ✅ CRÉÉ - `src/documents/documents.scheduler.ts` (NOUVEAU)
- 📂 Localisation: `src/documents/documents.scheduler.ts`
- 📄 Status: **✅ CRÉÉ ET COMPILABLE**
- ⚙️ Fonction: Vérifier les documents expirants chaque jour à 9h et envoyer des notifications push
- 🔍 Code: Déjà dans le fichier système

### 2. ⚠️ À MODIFIER - `src/app.module.ts`
**Modification simple à ajouter:**

Cherchez:
```typescript
@Module({
  imports: [
```

Et vérifiez que `ScheduleModule` est importé:
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),  // ← DOIT ÊTRE LÀ
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti',
    ),
    // ... reste des imports
  ],
})
```

### 3. ⚠️ À MODIFIER - `src/documents/documents.module.ts`
**Modifications nécessaires:**

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsScheduler } from './documents.scheduler'; // ← AJOUTER
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import { CarsModule } from '../cars/cars.module';
import { UsersModule } from '../users/users.module'; // ← VÉRIFIER
import { NotificationsModule } from '../notifications/notifications.module'; // ← VÉRIFIER

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
    ]),
    CarsModule,
    UsersModule,           // ← DOIT ÊTRE PRÉSENT
    NotificationsModule,   // ← DOIT ÊTRE PRÉSENT
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsScheduler], // ← AJOUTER DocumentsScheduler
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

---

## 🧪 VÉRIFICATIONS PRÉALABLES

Avant de modifier, **vérifiez que vous avez:**

### ✅ Dépendances NPM
```bash
npm list @nestjs/schedule
npm list firebase-admin
npm list @nestjs/platform-express
npm list multer
```

**Si absent, installer:**
```bash
npm install @nestjs/schedule firebase-admin @nestjs/platform-express multer @types/multer
```

### ✅ Variables d'environnement
Créez/mettez à jour votre `.env`:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/karhebti

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX...\n-----END PRIVATE KEY-----\n"

# Upload
UPLOAD_DIR=uploads/documents
MAX_FILE_SIZE=10485760

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Port
PORT=3000
```

---

## 🔄 ÉTAPES D'IMPLÉMENTATION

### Étape 1: Ajouter ScheduleModule à AppModule
**File:** `src/app.module.ts`

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),  // ← AJOUTER CETTE LIGNE
    MongooseModule.forRoot(...),
    // ...
  ],
})
export class AppModule {}
```

### Étape 2: Importer les modules dans DocumentsModule
**File:** `src/documents/documents.module.ts`

```typescript
import { DocumentsScheduler } from './documents.scheduler';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([...]),
    CarsModule,
    UsersModule,        // ← AJOUTER
    NotificationsModule, // ← AJOUTER
  ],
  providers: [DocumentsService, DocumentsScheduler], // ← AJOUTER SCHEDULER
})
export class DocumentsModule {}
```

### Étape 3: Vérifier NotificationsModule exporte le service
**File:** `src/notifications/notifications.module.ts`

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([...]),
    UsersModule, // ← DOIT ÊTRE LÀ
  ],
  providers: [NotificationsService],
  exports: [NotificationsService], // ← DOIT EXPORTER
})
export class NotificationsModule {}
```

---

## 🚀 COMPILATION ET TESTS

### Test 1: Compiler
```bash
npm run build
```

**Résultat attendu:**
```
✓ Compilation réussie
✓ Aucune erreur TypeScript
```

### Test 2: Démarrer le serveur
```bash
npm run start:dev
```

**Résultat attendu:**
```
[NestFactory] Starting Nest application...
✅ Firebase initialisé avec succès
🔍 [SCHEDULER] Vérification des documents expirants... (à 9h du matin)
```

### Test 3: Vérifier les logs
Attendez 9h du matin (heure du serveur) ou modifiez le CRON pour tester immédiatement:

```typescript
// Temporaire - Pour test MAINTENANT
@Cron('* * * * * *') // Chaque seconde
async checkExpiringDocuments() {
  // ...
}
```

### Test 4: Test endpoint device token
```bash
curl -X POST http://localhost:3000/notifications/update-device-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "test-device-token-12345"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "Device token mis à jour avec succès"
}
```

---

## ⚠️ ERREURS COURANTES ET SOLUTIONS

### Erreur 1: "Cannot find module @nestjs/schedule"
```bash
npm install @nestjs/schedule
```

### Erreur 2: "ScheduleModule is not exported"
**Solution:** Vérifier que `ScheduleModule.forRoot()` est dans AppModule imports

### Erreur 3: "Cannot find UsersModule or NotificationsModule"
**Solution:** Vérifier les imports dans DocumentsModule

### Erreur 4: Firebase error "Invalid credential"
**Solution:** 
- Vérifier `FIREBASE_PRIVATE_KEY` dans `.env`
- Format avec sauts de ligne: `"-----BEGIN...\nXXXX\n-----END..."`

### Erreur 5: "Scheduler not running"
**Solution:**
- Vérifier les logs pour "🔍 [SCHEDULER]"
- Tester avec CRON temporaire: `@Cron('* * * * * *')`

---

## 📊 FICHIERS MODIFIÉS - RÉCAPITULATIF

| Fichier | Action | Statut |
|---------|--------|--------|
| `src/documents/documents.scheduler.ts` | Créer | ✅ CRÉÉ |
| `src/app.module.ts` | Importer ScheduleModule | ⚠️ À FAIRE |
| `src/documents/documents.module.ts` | Ajouter imports + Scheduler | ⚠️ À FAIRE |
| `src/notifications/notifications.module.ts` | Vérifier exports | ⚠️ À VÉRIFIER |
| `.env` | Configurer variables | ⚠️ À CONFIGURER |

---

## 🔄 FLUX DE NOTIFICATION COMPLET

```
1. Chaque jour à 9h00 AM
   ↓
2. DocumentsScheduler.checkExpiringDocuments()
   ↓
3. Pour chaque utilisateur:
   a. Chercher documents expirant dans 3 jours
   b. Pour chaque document:
      - Créer notification
      - Envoyer via Firebase Cloud Messaging (si deviceToken présent)
   ↓
4. Logs affichent le résumé
   ↓
5. Notification push reçue sur le device Android/iOS
```

---

## 📱 CÔTÉ ANDROID (Kotlin)

### 1. Mettre à jour le device token au démarrage
```kotlin
// Dans MainActivity ou Application
val fcmToken = FirebaseMessaging.getInstance().token
val apiService = ApiClient.getApiService()
apiService.updateDeviceToken(UpdateTokenRequest(fcmToken))
```

### 2. Handler pour les notifications
```kotlin
class KarhebtiFirebaseMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    // Afficher la notification
    showNotification(
      remoteMessage.notification?.title ?: "Karhebti",
      remoteMessage.notification?.body ?: "Nouvelle notification"
    )
  }
}
```

---

## 📞 QUESTIONS FRÉQUENTES

**Q: À quelle heure exacte le scheduler s'exécute?**  
R: À 9h00 AM chaque jour (heure du serveur)

**Q: Comment vérifier que c'est fonctionnel?**  
R: Cherchez dans les logs: `🔍 [SCHEDULER] Vérification des documents expirants...`

**Q: Que se passe-t-il si un utilisateur n'a pas de device token?**  
R: La notification est ignorée pour cet utilisateur, pas d'erreur

**Q: Comment tester le scheduler sans attendre 9h?**  
R: Modifiez temporairement le CRON: `@Cron('* * * * * *')` (chaque seconde)

**Q: Mes variables Firebase ne sont pas reconnues?**  
R: Assurez-vous que `.env` est chargé. Utilisez `process.env.FIREBASE_PROJECT_ID`

---

## ✅ CHECKLIST FINALE

Avant de considérer l'implémentation complète:

- [ ] `ScheduleModule.forRoot()` ajouté à AppModule
- [ ] `DocumentsScheduler` créé dans `src/documents/`
- [ ] `DocumentsScheduler` ajouté au DocumentsModule providers
- [ ] `UsersModule` et `NotificationsModule` importés dans DocumentsModule
- [ ] `NotificationsModule` exporte `NotificationsService`
- [ ] Variables d'environnement Firebase configurées
- [ ] `npm run build` compile sans erreurs
- [ ] `npm run start:dev` démarre sans erreurs
- [ ] Logs affichent "✅ Firebase initialisé avec succès"
- [ ] À 9h du matin, logs affichent "🔍 [SCHEDULER]..."
- [ ] Endpoint `/notifications/update-device-token` fonctionne
- [ ] Device token sauvegardé dans la base de données

---

## 🎯 PROCHAINES ÉTAPES

Une fois l'implémentation backend complète:

1. ✅ **Frontend Android (Kotlin)** - Déjà créé (`ManualDocumentEntryScreen.kt`)
2. ✅ **DocumentType Enum** - Déjà créé (4 types véhicule)
3. ✅ **Compose Components** - Déjà créés (5 composables)
4. ⏳ **Testing end-to-end** - À faire avec vrai device Android

---

**Préparé par:** GitHub Copilot  
**Date:** 20 Novembre 2025  
**Version:** 1.0  
**Framework:** NestJS + Firebase + Kotlin Android
