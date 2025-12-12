# 🔧 MODIFICATIONS DÉTAILLÉES - CODE EXACT À AJOUTER

**Date:** 20 Novembre 2025  
**Note:** Copies exactes du code à utiliser - Copiez/collez directement

---

## 📄 MODIFICATION 1: `src/app.module.ts`

**Cherchez cette section:**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
```

**Avant (ACTUEL):**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// ... autres imports ...

@Module({
  imports: [
    // Configuration MongoDB
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti',
    ),
```

**Après (À MODIFIER):**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';  // ← AJOUTER CET IMPORT
import { AppController } from './app.controller';
import { AppService } from './app.service';
// ... autres imports ...

@Module({
  imports: [
    // Task Scheduling
    ScheduleModule.forRoot(),  // ← AJOUTER CETTE LIGNE
    
    // Configuration MongoDB
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti',
    ),
```

**Changement:** 
1. Ajouter l'import: `import { ScheduleModule } from '@nestjs/schedule';`
2. Ajouter au tableau imports: `ScheduleModule.forRoot(),` (avant MongooseModule)

---

## 📄 MODIFICATION 2: `src/documents/documents.module.ts`

**Avant (ACTUEL):**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import { CarsModule } from '../cars/cars.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
    ]),
    CarsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

**Après (MODIFIER COMME SUIT):**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsScheduler } from './documents.scheduler';  // ← AJOUTER CET IMPORT
import { DocumentEntity, DocumentSchema } from './schemas/document.schema';
import { CarsModule } from '../cars/cars.module';
import { UsersModule } from '../users/users.module';  // ← AJOUTER CET IMPORT
import { NotificationsModule } from '../notifications/notifications.module';  // ← AJOUTER CET IMPORT

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentEntity.name, schema: DocumentSchema },
    ]),
    CarsModule,
    UsersModule,  // ← AJOUTER
    NotificationsModule,  // ← AJOUTER
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsScheduler],  // ← AJOUTER DocumentsScheduler ICI
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

**Changements:**
1. Ajouter import: `import { DocumentsScheduler } from './documents.scheduler';`
2. Ajouter import: `import { UsersModule } from '../users/users.module';`
3. Ajouter import: `import { NotificationsModule } from '../notifications/notifications.module';`
4. Ajouter à imports: `UsersModule,` et `NotificationsModule,`
5. Modifier providers: `providers: [DocumentsService, DocumentsScheduler]`

---

## 📄 MODIFICATION 3: `src/notifications/notifications.module.ts`

**Vérifier (DOIT CONTENIR):**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { UsersModule } from '../users/users.module';  // ← DOIT ÊTRE LÀ

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    UsersModule,  // ← DOIT ÊTRE LÀ
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],  // ← DOIT EXPORTER LE SERVICE
})
export class NotificationsModule {}
```

**À vérifier:**
- ✅ `UsersModule` est importé
- ✅ `exports: [NotificationsService]` - Service est exporté

**Si absent, ajouter:**
```typescript
// Au début du fichier
import { UsersModule } from '../users/users.module';

// Dans @Module
imports: [
  MongooseModule.forFeature([...]),
  UsersModule,  // ← AJOUTER SI ABSENT
],

// À la fin du @Module
exports: [NotificationsService],  // ← AJOUTER SI ABSENT
```

---

## 📝 MODIFICATION 4 (OPTIONNEL): `src/users/schemas/user.schema.ts`

**Actuel:**
```typescript
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
}
```

**Optionnel - Ajouter le timestamp:**
```typescript
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

  @Prop({ type: Date })  // ← AJOUTER (OPTIONNEL)
  deviceTokenUpdatedAt?: Date;  // ← AJOUTER (OPTIONNEL)
}
```

---

## 🔍 VÉRIFICATIONS APRÈS MODIFICATIONS

### 1. Compiler
```bash
npm run build
```

**Résultat attendu - AUCUNE erreur:**
```
✓ src/app.module.ts
✓ src/documents/documents.module.ts
✓ src/documents/documents.scheduler.ts
✓ src/notifications/notifications.module.ts

Successfully compiled 0 error(s)
```

### 2. Test Lint
```bash
npm run lint
```

**Résultat attendu - AUCUNE erreur:**
```
✓ All files pass eslint
```

### 3. Démarrer le serveur
```bash
npm run start:dev
```

**Résultat attendu - LOGS:**
```
[NestFactory] Starting Nest application...
...
✅ Firebase initialisé avec succès
...
[Nest] 12345 - 11/20/2025 14:30:00   [NestFactory] Application successfully started
```

### 4. À 9h du matin (ou test CRON)
```
🔍 [SCHEDULER] Vérification des documents expirants...
📊 Vérification pour X utilisateurs
✅ [SCHEDULER] Vérification terminée | Y utilisateurs avec token | Z notifications envoyées
```

---

## 📋 RÉSUMÉ DES FICHIERS À MODIFIER

| Fichier | Nombre de changements | Complexité |
|---------|----------------------|-----------|
| `src/app.module.ts` | 2 (1 import + 1 ligne) | ⭐ Simple |
| `src/documents/documents.module.ts` | 5 (3 imports + 2 propriétés) | ⭐ Simple |
| `src/notifications/notifications.module.ts` | 1-2 (vérifier/ajouter) | ⭐ Simple |
| `src/users/schemas/user.schema.ts` | 1 (optionnel) | ⭐ Optionnel |

**Temps total d'implémentation:** ~5-10 minutes

---

## ✅ ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. **Étape 1:** Modifier `src/app.module.ts` (ajouter ScheduleModule)
2. **Étape 2:** Modifier `src/documents/documents.module.ts` (ajouter imports + scheduler)
3. **Étape 3:** Vérifier `src/notifications/notifications.module.ts`
4. **Étape 4:** Compiler et tester: `npm run build && npm run start:dev`
5. **Étape 5:** Vérifier les logs à 9h du matin

---

## 🆘 SOS - SI ERREUR

### Erreur 1: "Cannot find module @nestjs/schedule"
```bash
npm install @nestjs/schedule
npm run build
```

### Erreur 2: "Property 'ScheduleModule' is not exported"
**Solution:** Vérifier que `ScheduleModule.forRoot()` est dans AppModule

### Erreur 3: "Cannot find DocumentsScheduler"
**Solution:** Vérifier que le fichier `src/documents/documents.scheduler.ts` existe

### Erreur 4: "UsersModule or NotificationsModule is not exported"
**Solution:** Vérifier les imports dans DocumentsModule

### Erreur 5: Compilation OK mais scheduler ne s'exécute pas
**Solution:** 
- Vérifier l'heure du serveur: `date`
- Tester avec CRON tempo: `@Cron('* * * * * *')`

---

## 📱 POUR LE CÔTÉ ANDROID

Vous avez déjà:
- ✅ `ManualDocumentEntryScreen.kt` - Écran de saisie
- ✅ `DocumentType.kt` - Enum des types
- ✅ `DocumentTypeComponents.kt` - 5 composables

À faire côté Android:
1. Récupérer FCM token au démarrage
2. Appeler `/notifications/update-device-token` avec le token
3. Implémenter `FirebaseMessagingService` pour recevoir les notifications

---

**Créé:** 20 Novembre 2025  
**Framework:** NestJS + Firebase  
**Complexité:** Facile ⭐  
**Temps:** 5-10 minutes
