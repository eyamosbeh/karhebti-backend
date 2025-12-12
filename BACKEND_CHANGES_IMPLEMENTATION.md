# 📋 GUIDE COMPLET - CHANGEMENTS BACKEND KARHEBTI
**Date:** 20 Novembre 2025  
**Status:** ✅ PRÊT À IMPLÉMENTER  
**Backend Framework:** NestJS  

---

## 📊 RÉCAPITULATIF DE L'ÉTAT ACTUEL

### ✅ DÉJÀ IMPLÉMENTÉ
- `@nestjs/schedule` - Installé et disponible
- `firebase-admin` - Installé en version 13.6.0
- `@nestjs/platform-express` - Installé
- `multer` - Installé et configuré
- **NotificationsController** - Existe avec endpoints
- **NotificationsService** - Existe avec Firebase
- **User Schema** - Possède `deviceToken` (optionnel)
- **Documents API** - CRUD complet disponible
- **DocumentsService** - `findExpiringDocuments()` méthode existe

### ⚠️ À VÉRIFIER / COMPLÉTER
1. `ScheduleModule` doit être importé dans `AppModule`
2. Scheduler pour documents expirants à créer
3. Firebase Admin SDK configuration à optimiser
4. Upload fichiers à tester et valider
5. Notifications push end-to-end à tester

---

## 🔧 CHANGEMENTS REQUIS

### 1️⃣ IMPORTER ScheduleModule dans AppModule

**File:** `src/app.module.ts`

**Statut:** ⚠️ À VÉRIFIER - Probablement déjà présent

```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),  // ← À AJOUTER si absent
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti',
    ),
    // ... reste des imports
  ],
  // ...
})
export class AppModule {}
```

**Vérification:** Cherchez `ScheduleModule.forRoot()` dans votre app.module.ts
- ✅ Si présent → Pas besoin de modifier
- ❌ Si absent → Ajouter l'import et la ligne

---

### 2️⃣ CRÉER DocumentsScheduler pour Notifications Automatiques

**File:** `src/documents/documents.scheduler.ts`

**Statut:** ❌ À CRÉER - NOUVEAU FICHIER

**Contenu complète:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DocumentsService } from './documents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

/**
 * Scheduler pour vérifier les documents expirants
 * et envoyer des notifications push
 */
@Injectable()
export class DocumentsScheduler {
  private readonly logger = new Logger(DocumentsScheduler.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Exécuter tous les jours à 9h00 AM
   * Vérifier les documents expirant dans 3 jours
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkExpiringDocuments() {
    this.logger.log('🔍 [SCHEDULER] Vérification des documents expirants...');

    try {
      // 1. Récupérer tous les utilisateurs
      const allUsers = await this.usersService.findAll();
      this.logger.debug(`Vérification pour ${allUsers.length} utilisateurs`);

      // 2. Pour chaque utilisateur, chercher les documents expirants
      for (const user of allUsers) {
        try {
          const expiringDocs = await this.documentsService.findExpiringDocuments(
            user._id.toString(),
            3, // Vérifier les documents expirant dans 3 jours
          );

          if (expiringDocs.length > 0 && user.deviceToken) {
            // 3. Envoyer une notification push pour chaque document expirant
            for (const doc of expiringDocs) {
              await this.sendDocumentExpirationNotification(user, doc);
            }

            this.logger.log(
              `✅ ${expiringDocs.length} notifications envoyées pour ${user.email}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `⚠️  Erreur pour utilisateur ${user.email}: ${error.message}`,
          );
        }
      }

      this.logger.log('✅ Vérification des documents terminée');
    } catch (error) {
      this.logger.error(
        `❌ Erreur lors de la vérification des documents: ${error.message}`,
      );
    }
  }

  /**
   * Alternative: Exécuter à 9h du matin, midi et 18h
   * Utile pour plus de reminders
   */
  @Cron('0 9,12,18 * * *') // 9h, 12h, 18h
  async checkExpiringDocumentsMultipleTimes() {
    // Même implémentation que checkExpiringDocuments()
  }

  /**
   * Envoyer une notification d'expiration pour un document
   */
  private async sendDocumentExpirationNotification(user: any, document: any) {
    const documentType = document.typeDocument || 'Document';
    const daysUntilExpiration = this.calculateDaysUntilExpiration(
      document.dateExpiration,
    );

    const notificationData = {
      userId: user._id.toString(),
      titre: `⚠️  ${documentType} expire bientôt`,
      message: `Votre ${documentType} expire dans ${daysUntilExpiration} jour(s)`,
      type: 'DOCUMENT_EXPIRATION' as const,
      deviceToken: user.deviceToken,
      documentId: document._id.toString(),
      data: {
        documentId: document._id.toString(),
        documentType: documentType,
        expirationDate: document.dateExpiration.toISOString(),
        daysUntilExpiration: daysUntilExpiration.toString(),
      },
    };

    try {
      await this.notificationsService.sendNotification(notificationData);
      this.logger.debug(
        `📤 Notification envoyée pour ${user.email} - ${documentType}`,
      );
    } catch (error) {
      this.logger.warn(
        `⚠️  Impossible d'envoyer notification: ${error.message}`,
      );
    }
  }

  /**
   * Calculer les jours restants jusqu'à l'expiration
   */
  private calculateDaysUntilExpiration(expirationDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }
}
```

---

### 3️⃣ IMPORTER DocumentsScheduler dans DocumentsModule

**File:** `src/documents/documents.module.ts`

**Statut:** ⚠️ À MODIFIER - Ajouter le Scheduler

**Changement requis:**

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsScheduler } from './documents.scheduler'; // ← AJOUTER
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import { CarsModule } from '../cars/cars.module';
import { UsersModule } from '../users/users.module'; // ← AJOUTER si absent
import { NotificationsModule } from '../notifications/notifications.module'; // ← AJOUTER

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
    ]),
    CarsModule,
    UsersModule,    // ← AJOUTER
    NotificationsModule, // ← AJOUTER
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsScheduler], // ← AJOUTER DocumentsScheduler
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

---

### 4️⃣ METTRE À JOUR User Schema (Ajouter Timestamps)

**File:** `src/users/schemas/user.schema.ts`

**Statut:** ✅ DÉJÀ FAIT - deviceToken existe

**À ajouter (optionnel mais recommandé):**

```typescript
@Prop({ type: Date })
deviceTokenUpdatedAt?: Date;
```

**Code complet (updated):**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nom: string;

  @Prop({ required: true })
  prenom: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  motDePasse: string;

  @Prop()
  telephone: string;

  @Prop({ required: true, enum: ['admin', 'utilisateur'], default: 'utilisateur' })
  role: string;

  @Prop()
  deviceToken?: string;

  @Prop({ type: Date })
  deviceTokenUpdatedAt?: Date; // ← AJOUTER (optionnel)
}

export const UserSchema = SchemaFactory.createForClass(User);
```

---

### 5️⃣ METTRE À JOUR UsersService (Ajouter updateDeviceToken)

**File:** `src/users/users.service.ts`

**Statut:** ⚠️ À MODIFIER - Ajouter la méthode

**Ajouter cette méthode au service:**

```typescript
  /**
   * Mettre à jour le device token d'un utilisateur
   */
  async updateDeviceToken(userId: string, deviceToken: string): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          deviceToken,
          deviceTokenUpdatedAt: new Date(),
        },
        { new: true }
      )
      .select('-motDePasse')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return updatedUser;
  }
```

---

### 6️⃣ VÉRIFIER NotificationsService (updateDeviceToken)

**File:** `src/notifications/notifications.service.ts`

**Statut:** ⚠️ À VÉRIFIER

**Cherchez cette méthode (doit exister):**

```typescript
async updateDeviceToken(
  userId: string,
  updateDeviceTokenDto: UpdateDeviceTokenDto,
): Promise<void> {
  await this.usersService.updateDeviceToken(
    userId,
    updateDeviceTokenDto.deviceToken,
  );
}
```

**Si absent, ajouter au NotificationsService:**

```typescript
// ← Importer UsersService en haut du fichier
constructor(
  @InjectModel(Notification.name)
  private notificationModel: Model<Notification>,
  private usersService: UsersService, // ← AJOUTER
) {
  this.initializeServices();
}

async updateDeviceToken(
  userId: string,
  updateDeviceTokenDto: UpdateDeviceTokenDto,
): Promise<void> {
  await this.usersService.updateDeviceToken(
    userId,
    updateDeviceTokenDto.deviceToken,
  );
}
```

---

### 7️⃣ VÉRIFIER NotificationsModule (Imports)

**File:** `src/notifications/notifications.module.ts`

**Statut:** ⚠️ À VÉRIFIER

**Doit contenir:**

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { UsersModule } from '../users/users.module'; // ← IMPORTANT

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    UsersModule, // ← DOIT ÊTRE PRÉSENT
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // ← Exporter le service
})
export class NotificationsModule {}
```

---

## 📝 VARIABLES D'ENVIRONNEMENT REQUISES

**File:** `.env`

**À ajouter/vérifier:**

```bash
# ===== MongoDB =====
MONGODB_URI=mongodb://localhost:27017/karhebti

# ===== Firebase Admin SDK =====
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXXXX\n-----END PRIVATE KEY-----\n"

# ===== Upload Fichiers =====
UPLOAD_DIR=uploads/documents
MAX_FILE_SIZE=10485760  # 10MB en bytes

# ===== JWT =====
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# ===== Port =====
PORT=3000
NODE_ENV=development
```

---

## 🧪 TESTS À EFFECTUER

### Test 1: Vérifier le Scheduler
```bash
# Démarrer le serveur
npm run start:dev

# Vérifier les logs
# Vous devriez voir: "🔍 [SCHEDULER] Vérification des documents expirants..."
# À 9h du matin chaque jour
```

### Test 2: Test Device Token Update
```bash
POST http://localhost:3000/notifications/update-device-token
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "deviceToken": "test-device-token-123"
}

# Réponse attendue:
{
  "success": true,
  "message": "Device token mis à jour avec succès"
}
```

### Test 3: Vérifier dans MongoDB
```javascript
// Vérifier que le token est sauvegardé
db.users.findOne({ email: "test@example.com" })

// Résultat: doit contenir deviceToken et deviceTokenUpdatedAt
```

### Test 4: Forcer l'exécution du Scheduler (Optionnel)
Créer un endpoint temporaire pour tester:

```typescript
@Post('test-scheduler')
@UseGuards(JwtAuthGuard)
async testScheduler() {
  const scheduler = new DocumentsScheduler(
    this.documentsService,
    this.notificationsService,
    this.usersService,
  );
  await scheduler.checkExpiringDocuments();
  return { success: true, message: 'Scheduler exécuté' };
}
```

---

## 📋 CHECKLIST IMPLÉMENTATION

### Phase 1: Setup Scheduler
- [ ] `ScheduleModule.forRoot()` importé dans AppModule
- [ ] `documents.scheduler.ts` créé et implémenté
- [ ] `DocumentsScheduler` ajouté au DocumentsModule
- [ ] `UsersModule` et `NotificationsModule` importés dans DocumentsModule

### Phase 2: Update Services
- [ ] `updateDeviceToken()` méthode ajoutée à UsersService
- [ ] `updateDeviceToken()` méthode vérifiée dans NotificationsService
- [ ] `deviceTokenUpdatedAt` optionnellement ajouté au User Schema

### Phase 3: Vérifications
- [ ] NotificationsModule exporte `NotificationsService`
- [ ] `sendNotification()` méthode fonctionne
- [ ] Firebase Admin SDK configuré avec variables d'environnement
- [ ] DocumentsService `findExpiringDocuments()` fonctionne

### Phase 4: Tests
- [ ] Test endpoint update-device-token
- [ ] Vérifier logs du scheduler
- [ ] Simuler expiration documents
- [ ] Vérifier notifications push envoyées

### Phase 5: Production
- [ ] Variables d'environnement configurées en production
- [ ] Timestamps du scheduler vérifiés
- [ ] Logs du scheduler monitorés
- [ ] Tests end-to-end avec vrai device

---

## 🚀 COMMANDES UTILES

```bash
# Installer les dépendances (si pas déjà fait)
npm install firebase-admin @nestjs/schedule @nestjs/platform-express multer

# Démarrer en mode développement (watch mode)
npm run start:dev

# Compiler TypeScript
npm run build

# Lancer les tests
npm test

# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Linter
npm run lint
```

---

## ⚠️ ERREURS COURANTES ET SOLUTIONS

### Erreur 1: "Cannot find module '@nestjs/schedule'"
**Solution:** 
```bash
npm install @nestjs/schedule
```

### Erreur 2: "ScheduleModule is not exported"
**Solution:** Ajouter `ScheduleModule.forRoot()` dans AppModule imports

### Erreur 3: "Cannot find DocumentsScheduler"
**Solution:** 
- Vérifier le chemin d'import
- Ajouter DocumentsScheduler au DocumentsModule providers

### Erreur 4: Firebase error "Invalid credential"
**Solution:**
- Vérifier les variables d'environnement FIREBASE_*
- Vérifier les sauts de ligne dans FIREBASE_PRIVATE_KEY
- Format: `"-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"`

### Erreur 5: "Cron job not running"
**Solution:**
- Vérifier que ScheduleModule.forRoot() est importé
- Regarder les logs du serveur
- Vérifier la timezone du serveur

---

## 📞 SUPPORT ET QUESTIONS

Pour plus d'informations:
1. Consulter la documentation NestJS: https://docs.nestjs.com/
2. Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
3. @nestjs/schedule: https://docs.nestjs.com/techniques/task-scheduling

---

**Status Actuel:** ✅ PRÊT À IMPLÉMENTER
**Dernière Mise à Jour:** 20 Novembre 2025
**Préparé pour:** Karhebti Backend (NestJS + Firebase)
