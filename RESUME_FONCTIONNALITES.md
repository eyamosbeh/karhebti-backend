# 📋 Résumé des Fonctionnalités Implémentées

## 🎯 Vue d'ensemble
Backend NestJS pour application mobile de gestion automobile avec système SOS d'assistance routière, notifications push Firebase, et OCR pour documents.

---

## 1️⃣ 🔍 OCR - Reconnaissance de Documents

### **Description**
Service d'extraction automatique de données à partir de photos de documents (permis de conduire, carte grise, etc.) utilisant Tesseract.js.

### **Fonctionnalités**
- ✅ Upload d'images de documents
- ✅ Extraction automatique de texte via OCR
- ✅ Détection des types de documents (PERMIS_CONDUIRE, CARTE_GRISE, ASSURANCE, etc.)
- ✅ Parsing intelligent des données extraites
- ✅ Stockage des documents avec métadonnées

### **Endpoints**
```
POST /documents/ocr
- Upload photo de document
- Retourne: texte extrait + données parsées
```

### **Technologies**
- Tesseract.js pour OCR
- Sharp pour traitement d'images
- Multer pour upload de fichiers

### **Exemple de réponse**
```json
{
  "extractedText": "PERMIS DE CONDUIRE\nNom: MOSBEH\nPrénom: Eya...",
  "parsedData": {
    "type": "PERMIS_CONDUIRE",
    "nom": "MOSBEH",
    "prenom": "Eya",
    "numeroPermis": "12345678"
  }
}
```

---

## 2️⃣ 🔔 Système de Notifications Push

### **Description**
Système complet de notifications push utilisant Firebase Cloud Messaging (FCM) avec historique et suivi en base de données.

### **Fonctionnalités**
- ✅ Envoi de notifications push via Firebase
- ✅ Stockage des notifications en base MongoDB
- ✅ Gestion des device tokens
- ✅ Historique des notifications par utilisateur
- ✅ Statuts: PENDING, SENT, FAILED, READ
- ✅ Types de notifications: SOS, EXPIRATION_DOCUMENT, MESSAGE, etc.

### **Endpoints**
```
POST /notifications/send
- Envoyer notification push + créer enregistrement

GET /notifications
- Liste des notifications de l'utilisateur

GET /notifications/unread
- Notifications non lues

POST /notifications/:id/mark-read
- Marquer comme lue

POST /notifications/update-device-token
- Mettre à jour le token FCM de l'appareil
```

### **Configuration Firebase**
```env
FIREBASE_KEY_PATH=src/firebase/karhebti-adminsdk.json
FIREBASE_PROJECT_ID=karhebti-android
```

### **Format de notification**
```json
{
  "userId": "690f5c287d1f7b7bead8b5f1",
  "type": "ALERT",
  "titre": "🚨 Nouvelle demande SOS",
  "message": "Panne PNEU signalée près de vous",
  "deviceToken": "cHlUORjwRU...",
  "data": {
    "breakdownId": "6756e8f8...",
    "latitude": "36.8065",
    "longitude": "10.1815"
  }
}
```

---

## 3️⃣ 🚨 Système SOS - Gestion des Pannes

### **Architecture**
```
USER (Client en panne)
    ↓
Backend crée breakdown (status: PENDING)
    ↓
Backend cherche propriétaires de garage (role: propGarage)
    ↓
Notifications push envoyées aux garages
    ↓
GARAGE OWNER accepte/refuse
    ↓
User reçoit notification + tracking
```

---

## 📱 Côté Utilisateur (Client)

### **Fonctionnalités**
- ✅ Créer une demande SOS (type de panne + localisation GPS)
- ✅ Recevoir confirmation de création
- ✅ Notification automatique quand un garage accepte
- ✅ Suivi en temps réel (tracking) du garage
- ✅ Historique de ses propres pannes

### **Endpoints - User**
```
POST /breakdowns
- Créer une demande SOS
- Body: { type, description, latitude, longitude, photo? }
- Auto-notification: "Demande enregistrée, recherche de garages..."

GET /breakdowns/:id
- Détails d'une panne
- Si ACCEPTED: inclut infos du garage (nom, téléphone, email)

GET /breakdowns/user/:userId
- Historique des pannes de l'utilisateur

DELETE /breakdowns/:id
- Annuler sa propre demande
```

### **Types de pannes disponibles**
- PNEU (crevaison)
- BATTERIE (démarrage impossible)
- MOTEUR (problème mécanique)
- CARBURANT (panne sèche)
- REMORQUAGE (besoin de remorquer)
- AUTRE (autre problème)

### **Flux utilisateur**
```
1. User crée SOS → Status: PENDING
2. User reçoit notif: "Demande enregistrée"
3. Système cherche garages à proximité
4. Garage accepte → Status: ACCEPTED
5. User reçoit notif: "✅ Demande acceptée! prop garage arrive"
6. User peut voir tracking avec:
   - Nom du garage
   - Téléphone cliquable
   - Email
   - Position GPS (à calculer côté app)
   - ETA estimé
```

---

## 🏢 Côté Propriétaire de Garage

### **Fonctionnalités**
- ✅ Recevoir notifications de toutes les demandes SOS
- ✅ Liste des demandes en attente (status: PENDING)
- ✅ Voir détails: type de panne, localisation, distance
- ✅ Accepter une demande (devient assigné)
- ✅ Refuser une demande

### **Endpoints - Garage Owner**
```
GET /breakdowns?status=PENDING
- Liste de toutes les demandes en attente
- Accessible à tous les propGarage

GET /breakdowns/:id
- Détails d'une demande SOS

PUT /breakdowns/:id/accept
- Accepter une demande
- Action: status → ACCEPTED, assignedTo → garageOwnerId
- User notifié automatiquement
- Response: détails breakdown + infos garage

PUT /breakdowns/:id/refuse
- Refuser une demande
- Action: status → REFUSED
- User notifié automatiquement
```

### **Flux garage owner**
```
1. Reçoit notif push: "🚨 Nouvelle demande SOS"
   - Type de panne
   - Localisation GPS
   - Distance estimée

2. Ouvre app → Liste des 18 demandes SOS

3. Click sur une demande → Détails:
   - Type: CARBURANT
   - Description
   - Position GPS (carte)
   - Distance calculée
   - Infos client (masqué si pas accepté)

4. Click "✓ Accepter"
   - Dialog de confirmation
   - Backend: status → ACCEPTED
   - Backend: assignedTo → garageOwnerId
   - Logs: "🟢 [ACCEPT] Breakdown: ... by prop.garage@example.com"
   - User notifié: "✅ Demande acceptée!"

5. Navigation automatique vers client

OU

4. Click "✗ Refuser"
   - Dialog de confirmation
   - Backend: status → REFUSED
   - Logs: "🔴 [REFUSE] Breakdown: ... by prop.garage@example.com"
   - User notifié: "Demande refusée"
```

---

## 🗄️ Base de Données - Schéma Breakdown

```typescript
{
  userId: string,           // ID de l'utilisateur en panne
  type: BreakdownType,      // PNEU, BATTERIE, MOTEUR, etc.
  description?: string,      // Description détaillée
  latitude: number,          // Position GPS
  longitude: number,         // Position GPS
  status: BreakdownStatus,   // PENDING, ACCEPTED, REFUSED, etc.
  assignedTo?: string,       // ID du garage qui a accepté
  photo?: string,            // URL/base64 de la photo
  createdAt: Date,
  updatedAt: Date
}
```

**Statuts disponibles:**
- `PENDING` - En attente d'acceptation
- `ACCEPTED` - Accepté par un garage
- `REFUSED` - Refusé
- `IN_PROGRESS` - En cours d'intervention
- `COMPLETED` - Intervention terminée
- `CANCELLED` - Annulé par l'utilisateur

---

## 👥 Gestion des Rôles

### **Rôles disponibles**
```typescript
enum UserRole {
  admin = "admin",           // Administrateur système
  utilisateur = "utilisateur", // Client (utilisateur normal)
  propGarage = "propGarage"   // Propriétaire de garage
}
```

### **Permissions**
- `utilisateur`: Peut créer/annuler ses propres SOS
- `propGarage`: Peut voir toutes les demandes SOS, accepter/refuser
- `admin`: Accès complet

---

## 🔐 Authentification

Toutes les routes sont protégées par JWT:
```
Authorization: Bearer <JWT_TOKEN>
```

Le JWT contient:
- `userId`: ID MongoDB de l'utilisateur
- `email`: Email de l'utilisateur
- `role`: Rôle (utilisateur/propGarage/admin)

---

## 📊 Logs Backend

### **Création SOS**
```
[BreakdownsService] 🔍 Looking for garages... Found 1 garage owners
[BreakdownsService] 📤 Processing garage owner: prop.garage@example.com, deviceToken: YES
[BreakdownsService] ✅ Notification sent to garage owner: prop.garage@example.com
[BreakdownsService] 📊 Summary: 1 sent, 0 failed
```

### **Acceptation**
```
[BreakdownsService] 🟢 [ACCEPT] Breakdown: 693421bb... by prop.garage@example.com
[BreakdownsService] ✅ Breakdown accepted: 693421bb... → Status: ACCEPTED
[BreakdownsService] 📱 User notified: SOS accepted by prop.garage@example.com
```

### **Refus**
```
[BreakdownsService] 🔴 [REFUSE] Breakdown: 693421bb... by prop.garage@example.com
[BreakdownsService] ℹ️ Breakdown refused: 693421bb... → Status: REFUSED
```

---

## 🧪 Tests

### **Tester la création SOS**
```bash
POST http://localhost:3000/breakdowns
Authorization: Bearer <USER_TOKEN>

{
  "type": "PNEU",
  "description": "Pneu crevé sur l'autoroute",
  "latitude": 36.8065,
  "longitude": 10.1815
}
```

### **Tester l'acceptation (garage)**
```bash
PUT http://localhost:3000/breakdowns/:id/accept
Authorization: Bearer <GARAGE_TOKEN>
```

### **Tester le refus (garage)**
```bash
PUT http://localhost:3000/breakdowns/:id/refuse
Authorization: Bearer <GARAGE_TOKEN>
```

---

## 📱 Intégration Mobile (Android/Flutter)

### **1. Setup Firebase**
- Configurer FCM dans l'app Android
- Récupérer device token
- Envoyer au backend via `/notifications/update-device-token`

### **2. Écouter les notifications**
```dart
FirebaseMessaging.onMessage.listen((message) {
  if (message.data['type'] == 'sos_accepted') {
    // Navigate to tracking screen
    Navigator.push(TrackingScreen(
      breakdownId: message.data['breakdownId']
    ));
  }
});
```

### **3. Polling pour updates**
```dart
// Poll breakdown status every 5 seconds
Timer.periodic(Duration(seconds: 5), (timer) async {
  final breakdown = await getBreakdown(breakdownId);
  if (breakdown.status == 'ACCEPTED') {
    // Show tracking screen
    setState(() {
      garageInfo = breakdown.garageOwner;
    });
  }
});
```

---

## 🌐 Variables d'Environnement

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/karhebti

# Firebase
FIREBASE_KEY_PATH=src/firebase/karhebti-adminsdk.json
FIREBASE_PROJECT_ID=karhebti-android

# JWT
JWT_SECRET=karhebti-jwt-super-secret-key-2024
JWT_EXPIRATION=24h

# Server
PORT=3000
NODE_ENV=development
```

---

## 📝 Points Clés pour l'Équipe

### **Ce qui fonctionne ✅**
1. ✅ OCR de documents avec Tesseract.js
2. ✅ Notifications push Firebase (création + envoi + historique)
3. ✅ Système SOS complet:
   - Création par utilisateur
   - Recherche automatique de garages
   - Notifications aux propriétaires
   - Acceptation/Refus par garage
   - Notification automatique au user
   - Tracking avec infos garage
4. ✅ Gestion des rôles (utilisateur/propGarage/admin)
5. ✅ Authentication JWT
6. ✅ Logs détaillés pour debugging

### **Architecture**
- Backend: NestJS + TypeScript
- Base de données: MongoDB + Mongoose
- Notifications: Firebase Cloud Messaging
- OCR: Tesseract.js
- Upload: Multer + Sharp

### **Prochaines étapes possibles**
- [ ] WebSocket pour tracking en temps réel
- [ ] Calcul automatique de distance (Haversine formula)
- [ ] Calcul d'ETA basé sur traffic
- [ ] Système de rating garage/utilisateur
- [ ] Historique complet des interventions
- [ ] Dashboard admin
- [ ] Statistiques et analytics

---

## 🎯 Résumé Ultra-Court

**En 3 phrases:**
1. **OCR**: Upload document → Extraction texte automatique → Parsing des données
2. **Notifications**: Firebase push + historique MongoDB + gestion device tokens
3. **SOS**: User crée panne → Garages notifiés → Garage accepte → User suit en temps réel

**Impact:**
- 🚗 Utilisateurs: Assistance rapide en cas de panne
- 🏢 Garages: Nouvelles opportunités business
- 📱 Temps réel: Notifications push instantanées
- 🗺️ Géolocalisation: Suivi précis garage ↔ client

---

📅 **Date de création**: 6 décembre 2025  
👨‍💻 **Équipe**: Karhebti Backend Team  
🚀 **Status**: Production Ready
