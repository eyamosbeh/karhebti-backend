# 📋 Document Expiration Notifications - Guide Automatique

## 🎯 Vue d'ensemble

Le système de notifications d'expiration des documents est une fonctionnalité automatisée qui envoie des rappels Firebase Cloud Messaging (FCM) aux utilisateurs lorsque leurs documents sont sur le point d'expirer.

**Planification:** Chaque jour à **9:00 AM**, un job CRON vérifie les documents qui expirent dans les 7 prochains jours et envoie automatiquement des notifications.

## 🏗️ Architecture

### Components

1. **DocumentExpirationScheduler** (`src/documents/services/document-expiration.scheduler.ts`)
   - Service injectable qui gère les vérifications automatiques
   - Utilise `@nestjs/schedule` pour les jobs CRON
   - Envoie des notifications via `NotificationsService`

2. **ScheduleModule** (intégré dans `DocumentsModule`)
   - Enabled dans `src/documents/documents.module.ts`
   - Déclenche le job `checkDocumentExpiration()` quotidiennement

3. **Schema Updates**
   - **DocumentEntity**: Nouveau champ `notificationSent?: boolean` (default: false)
   - **User**: Nouveau champ `deviceToken?: string` (pour Firebase FCM)

## 🔄 Flux de Travail

```
Chaque jour à 9:00 AM
    ↓
checkDocumentExpiration() démarre
    ↓
Récupère tous les documents expiring dans 7 jours (non notifiés)
    ↓
Pour chaque document:
    ├─ Récupère la voiture associée
    ├─ Récupère le propriétaire (User)
    ├─ Vérifie que l'user a un deviceToken
    ├─ Envoie notification Firebase
    └─ Marque le document comme notifié
    ↓
Vérification terminée
```

## 📊 Modèles de Données

### DocumentEntity Schema
```typescript
{
  type: 'assurance' | 'carte grise' | 'contrôle technique',
  dateEmission: Date,
  dateExpiration: Date,  // Utilisé pour la vérification
  fichier: string,
  image?: string,
  voiture: ObjectId,     // Référence à la voiture
  notificationSent?: boolean,  // Nouveau: indique si la notification a été envoyée
}
```

### User Schema
```typescript
{
  nom: string,
  prenom: string,
  email: string,
  motDePasse: string,
  telephone?: string,
  role: 'admin' | 'utilisateur',
  deviceToken?: string,  // Nouveau: token Firebase pour les notifications
}
```

## 🚀 Installation & Configuration

### 1. Installation du Package
```bash
npm install @nestjs/schedule
```

### 2. Module Integration
Le module est déjà configuré dans `DocumentsModule`:

```typescript
@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([...]),
    CarsModule,
    NotificationsModule,
  ],
  providers: [DocumentsService, DocumentExpirationScheduler],
})
export class DocumentsModule {}
```

### 3. User Device Token
Les utilisateurs doivent envoyer leur device token via l'endpoint de notifications:

```bash
POST /notifications/update-device-token
Content-Type: application/json

{
  "deviceToken": "firebase_device_token_here"
}
```

## 🔔 Notifications Envoyées

### Format de la Notification
- **Titre**: `📋 [Type de Document] expire bientôt!`
- **Corps**: `Votre [Type] expire dans X jour(s). Veuillez le renouveler.`
- **Données additionnelles**:
  - `documentId`: ID du document
  - `carId`: ID de la voiture
  - `documentType`: Type du document
  - `daysRemaining`: Nombre de jours restants

### Types de Documents Supportés
- `assurance` → "Assurance automobile"
- `carte grise` → "Carte grise"
- `contrôle technique` → "Contrôle technique"
- `visite technique` → "Visite technique"
- `timbre` → "Timbre fiscal"

## ⏰ Programmation CRON

Le job s'exécute selon l'expression CRON suivante:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_9AM)
```

**Équivalent**: `0 9 * * *` (Chaque jour à 09:00)

### Personnaliser l'Heure

Pour changer l'heure d'exécution, modifiez `document-expiration.scheduler.ts`:

```typescript
// Options disponibles:
@Cron(CronExpression.EVERY_SUNDAY_AT_MIDNIGHT)    // Chaque dimanche à minuit
@Cron(CronExpression.EVERY_30_SECONDS)             // Chaque 30 secondes
@Cron('0 18 * * *')                                // Chaque jour à 18:00
@Cron('0 0 * * 0')                                 // Chaque dimanche à minuit
@Cron('*/5 * * * *')                               // Chaque 5 minutes
```

## 🛡️ Gestion des Erreurs

Le scheduler inclut une gestion complète des erreurs:

```
Si document sans voiture           → Log WARN et continue
Si propriétaire introuvable        → Log WARN et continue
Si utilisateur sans deviceToken    → Log WARN et continue
Si erreur Firebase                 → Log ERROR et continue
```

Chaque erreur est loggée pour faciliter le débogage.

## 📝 Logging

Tous les événements sont loggés avec emoji pour la clarté:

```
🔍 Vérification des documents qui expirent...
📄 X document(s) qui expire(nt) bientôt
📨 Notification envoyée à USER_ID pour Document Type
⚠️  Avertissement (user sans token, etc.)
❌ Erreur lors du traitement
✅ Vérification des expirations terminée
```

## 🧪 Testing

### Test Manuel: Simuler le Scheduler

Créez un endpoint temporaire pour tester:

```bash
curl -X POST http://localhost:3000/documents/test-expiration-check \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test avec MongoDB Compass

1. Créez un document avec `dateExpiration` dans 5 jours
2. Mettez `notificationSent: false`
3. Vérifiez que l'utilisateur a un `deviceToken`
4. Attendez 9:00 AM ou forcez l'exécution du test

### Vérifier les Notifications Envoyées

```bash
# Récupérer toutes les notifications
GET /notifications

# Récupérer les notifications non lues
GET /notifications/unread

# Compter les notifications non lues
GET /notifications/unread-count
```

## 🔌 Intégration Frontend

### Flutter/React Native
```dart
// Récupérer le FCM token
final token = await FirebaseMessaging.instance.getToken();

// Envoyer au backend
const response = await http.post(
  Uri.parse('http://localhost:3000/notifications/update-device-token'),
  headers: {'Authorization': 'Bearer $jwtToken'},
  body: jsonEncode({'deviceToken': token}),
);
```

### Web (FCM Web SDK)
```javascript
// Récupérer le token
const token = await messaging.getToken();

// Envoyer au backend
fetch('http://localhost:3000/notifications/update-device-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ deviceToken: token })
});
```

## 📊 Monitoring

### Logs Quotidiens à 9:00 AM

Vérifiez les logs pour:
- Nombre de documents trouvés
- Nombre de notifications envoyées
- Erreurs rencontrées

```bash
npm run start:dev | grep "DocumentExpirationScheduler"
```

## 🐛 Troubleshooting

### Problème: Les notifications ne sont pas envoyées

**Causes possibles:**

1. **Firebase non configuré**
   - Vérifie `FIREBASE_KEY_PATH` en variable d'environnement
   - Vérifiez le fichier de clé Firebase

2. **Device token absent**
   - L'utilisateur doit appeler `/notifications/update-device-token`
   - Vérifiez le champ `deviceToken` dans MongoDB pour l'utilisateur

3. **Job ne s'exécute pas à 9:00 AM**
   - Vérifiez le fuseau horaire du serveur
   - Vérifiez que `ScheduleModule.forRoot()` est importé

4. **Document marqué comme notifié**
   - Vérifiez `notificationSent: true` dans MongoDB
   - Réinitialisez à `false` pour retester

### Logs Utiles

```bash
# Voir tous les logs du scheduler
npm run start:dev | grep "Expiration"

# Voir les erreurs uniquement
npm run start:dev | grep "❌"

# Voir les notifications envoyées
npm run start:dev | grep "📨"
```

## 📚 Fichiers Affectés

```
✅ Créés:
  - src/documents/services/document-expiration.scheduler.ts

✏️ Modifiés:
  - src/documents/documents.module.ts (imports ScheduleModule)
  - src/documents/schemas/document.schema.ts (+notificationSent)
  - src/users/schemas/user.schema.ts (+deviceToken)
  
💾 Package.json:
  - @nestjs/schedule: ^x.x.x (nouvellement installé)
```

## 🔄 Prochaines Étapes Recommandées

1. **Configuration Timezone**
   - Configurez le fuseau horaire du serveur selon votre région
   - Option: Permettre aux utilisateurs de choisir l'heure de notification

2. **Notifications Récurrentes**
   - Implémenter des notifications supplémentaires (J-3, J-1)
   - Faire expirer automatiquement les documents après la date d'expiration

3. **Analytics & Dashboard**
   - Suivre les documents expirés
   - Statistiques des documents par type
   - Taux de renouvellement

4. **Email Notifications**
   - Ajouter des notifications email en complément
   - Digest emails pour plusieurs documents expirés

## 📞 Support

Pour des questions ou des modifications:
- Vérifiez les logs du scheduler
- Consultez la documentation Firebase FCM
- Testez avec MongoDB Compass

---

**Statut**: ✅ Production-Ready
**Dernière mise à jour**: 2025-11-18
**Version**: 1.0.0
