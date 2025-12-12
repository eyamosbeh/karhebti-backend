# 🚗 Karhebti Backend

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-8.1-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Firebase-13.6-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase" />
</p>

Backend REST complet pour application automobile développé avec **NestJS**, **TypeScript**, **MongoDB** et **Firebase Cloud Messaging**. Système intelligent de gestion de véhicules avec SOS d'urgence, OCR de documents, notifications push et authentification sécurisée.

---

## 📋 Table des matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🔧 Utilisation](#-utilisation)
- [📡 API Endpoints](#-api-endpoints)
- [🧪 Tests](#-tests)

---

## ✨ Fonctionnalités

### 🆘 Système SOS Breakdown
- **Signalement de panne en temps réel** avec géolocalisation GPS
- **Notification automatique** aux propriétaires de garages à proximité via Firebase FCM
- **Acceptation/Refus de demande** par les garages
- **Tracking en temps réel** du garage assigné après acceptation
- **Statuts**: PENDING → ACCEPTED/REFUSED → IN_PROGRESS → COMPLETED

### 📄 OCR Intelligent de Documents
- **Scan automatique** de documents automobiles (carte grise, assurance, permis)
- **Extraction de texte** avec Tesseract.js (support Français/Arabe)
- **Validation automatique** des dates d'expiration
- **Notification préventive** 30 jours avant expiration
- **Types supportés**: ASSURANCE, CARTE_GRISE, PERMIS_CONDUIRE, VISITE_TECHNIQUE

### 🔔 Système de Notifications
- **Push notifications** via Firebase Cloud Messaging
- **Notifications persistantes** en base de données MongoDB
- **Statuts**: PENDING → SENT → READ/FAILED
- **Types**: sos_request, sos_accepted, document_expiry, general

### 🔐 Authentification & Sécurité
- **JWT tokens** avec expiration 24h
- **OTP via SMS** (Twilio) pour vérification téléphone
- **Email verification** pour inscription
- **Rôles utilisateur**: admin, utilisateur, propGarage
- **Guards NestJS** pour protection des routes

### 🚙 Gestion de Véhicules
- **CRUD complet** pour voitures
- **Validation AI des images** avec Google Gemini
- **Historique de maintenance** avec rappels automatiques
- **Historique de remplacement** de pièces

### 🔧 Autres Modules
- **Garages**: Géolocalisation via OpenStreetMap
- **Pièces détachées**: Catalogue avec prix
- **Réservations**: Système de prise de rendez-vous
- **Réclamations**: Gestion des plaintes utilisateurs
- **Conversations**: Chat entre utilisateurs et garages
- **Traduction**: Support multilingue avec Azure Translator

---

## 🏗️ Architecture

```
src/
├── ai/                    # Validation d'images avec Gemini AI
├── auth/                  # Authentification JWT + OTP
├── breakdowns/            # 🆘 Système SOS de pannes
├── cars/                  # Gestion des véhicules
├── chat/                  # WebSocket Gateway
├── common/                # Guards, Decorators, Config
├── conversations/         # Messagerie
├── documents/             # 📄 OCR + Gestion documents
├── firebase/              # FCM + Firebase Auth
├── garages/               # Garages + OSM
├── maintenances/          # Entretien véhicules
├── notifications/         # 🔔 Notifications push/DB
├── parts/                 # Pièces détachées
├── reclamations/          # Réclamations
├── repair-bays/           # Baies de réparation
├── reservation/           # Réservations
├── services/              # Services garages
├── swipes/                # Système de matching
├── translation/           # Traduction multilingue
├── user-location/         # Géolocalisation utilisateurs
└── users/                 # Gestion utilisateurs
```

**Stack Technique:**
- **Framework**: NestJS 11.0.1
- **Runtime**: Node.js 22.11
- **Database**: MongoDB 8.1.9 avec Mongoose ODM
- **Auth**: JWT + Passport.js
- **Notifications**: Firebase Admin SDK 13.6
- **OCR**: Tesseract.js 6.0.1
- **Image Processing**: Sharp 0.34.5
- **File Upload**: Multer 2.0.2
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI

---

## 🚀 Installation

### Prérequis

- **Node.js** 18.x ou supérieur
- **MongoDB** 6.x ou supérieur (local ou Atlas)
- **npm** ou **yarn**
- **Firebase project** avec FCM activé

### Étapes d'installation

**1. Cloner le repository**
```bash
git clone https://github.com/eyamosbeh/karhebti-backend.git
cd karhebti-backend
```

**2. Installer les dépendances**
```bash
npm install
```

**3. Configurer MongoDB**
```bash
# Option 1: MongoDB local
mongod --dbpath /path/to/your/data

# Option 2: MongoDB Atlas (cloud)
# Créez un cluster gratuit sur https://www.mongodb.com/cloud/atlas
```

**4. Configurer Firebase**
- Créez un projet sur [Firebase Console](https://console.firebase.google.com)
- Activez **Cloud Messaging**
- Téléchargez le fichier de clé privée (Service Account)
- Placez-le dans `src/firebase/karhebti-adminsdk.json`

**5. Configurer les variables d'environnement**
Créez un fichier `.env` à la racine du projet (voir section Configuration ci-dessous)

---

## ⚙️ Configuration

Créez un fichier `.env` avec les variables suivantes:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/karhebti

# JWT
JWT_SECRET=votre-secret-jwt-super-securise
JWT_EXPIRES_IN=24h

# Firebase
FIREBASE_KEY_PATH=src/firebase/karhebti-adminsdk.json

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM=noreply@karhebti.com

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Azure Translator (Optionnel)
AZURE_TRANSLATOR_KEY=votre-cle-azure
AZURE_TRANSLATOR_REGION=westeurope
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com

# Google Gemini AI (Validation images)
GEMINI_API_KEY=votre-cle-gemini

# Application
PORT=3000
NODE_ENV=development
```

### 🔒 Sécurité des clés

**⚠️ IMPORTANT**: Ne commitez JAMAIS vos clés API!

Le `.gitignore` exclut automatiquement:
- `.env`
- `src/firebase/*.json`
- `node_modules/`
- `uploads/`

---

## 🔧 Utilisation

### Démarrer le serveur

```bash
# Mode développement avec hot-reload
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

Le serveur démarre sur: **http://localhost:3000**

### Documentation API Swagger

Une fois le serveur lancé, accédez à la documentation interactive:
**http://localhost:3000/api**

### Seed initial de données

```bash
# Créer des garages de test
node scripts/seed-garages.js

# Vérifier les utilisateurs
npx ts-node check-users.ts
```

---

## 📡 API Endpoints

### 🔐 Authentification
```http
POST   /auth/signup              # Inscription utilisateur
POST   /auth/verify-otp          # Vérifier OTP SMS
POST   /auth/login               # Connexion
POST   /auth/verify-email        # Vérifier email
POST   /auth/forgot-password     # Mot de passe oublié
POST   /auth/reset-password      # Réinitialiser mot de passe
```

### 🆘 SOS Breakdowns
```http
POST   /breakdowns               # Créer demande SOS
GET    /breakdowns               # Lister pannes
GET    /breakdowns/:id           # Détails d'une panne
PUT    /breakdowns/:id/accept    # Accepter (garage)
PUT    /breakdowns/:id/refuse    # Refuser (garage)
PATCH  /breakdowns/:id/status    # Mettre à jour statut
DELETE /breakdowns/:id           # Supprimer
```

### 📄 Documents (OCR)
```http
POST   /documents/ocr            # Scanner document avec OCR
GET    /documents                # Lister documents
GET    /documents/:id            # Détails document
PATCH  /documents/:id            # Mettre à jour
DELETE /documents/:id            # Supprimer
```

### 🔔 Notifications
```http
GET    /notifications            # Lister notifications
POST   /notifications/update-device-token  # Enregistrer token FCM
PATCH  /notifications/:id/read   # Marquer comme lu
```

### 🚙 Véhicules
```http
POST   /cars                     # Ajouter voiture
GET    /cars                     # Lister voitures
GET    /cars/:id                 # Détails voiture
PATCH  /cars/:id                 # Modifier
DELETE /cars/:id                 # Supprimer
POST   /cars/:id/image           # Upload image (validation AI)
```

### 🔧 Maintenances
```http
POST   /maintenances             # Créer maintenance
GET    /maintenances             # Lister maintenances
GET    /maintenances/:id         # Détails
PATCH  /maintenances/:id         # Modifier
DELETE /maintenances/:id         # Supprimer
```

### 🏪 Garages
```http
GET    /garages                  # Lister garages
GET    /garages/:id              # Détails garage
POST   /garages                  # Créer garage (admin)
GET    /osm/search-garage        # Rechercher via OSM
```

### 💬 Conversations
```http
GET    /conversations            # Lister conversations
GET    /conversations/:id        # Messages d'une conversation
POST   /conversations/:id/messages  # Envoyer message
```

**Pour la liste complète des endpoints, consultez la documentation Swagger.**

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Couverture de code
npm run test:cov

# Tests spécifiques
npm run test -- breakdowns.service.spec.ts
```

---

## 📦 Déploiement

### Heroku

```bash
# Installer Heroku CLI
heroku create karhebti-backend

# Variables d'environnement
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=...

# Déployer
git push heroku main
```

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

```bash
docker build -t karhebti-backend .
docker run -p 3000:3000 --env-file .env karhebti-backend
```

---

## 📚 Documentation Complémentaire

- **[RESUME_FONCTIONNALITES.md](./RESUME_FONCTIONNALITES.md)** - Documentation détaillée des fonctionnalités
- **[BACKEND_QUICK_START.md](./BACKEND_QUICK_START.md)** - Guide de démarrage rapide
- **[DOCUMENT_EXPIRATION_NOTIFICATIONS.md](./DOCUMENT_EXPIRATION_NOTIFICATIONS.md)** - Système de notifications

---

## 🤝 Contribution

Les contributions sont les bienvenues! Pour contribuer:

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 License

Ce projet est sous licence MIT.

---

## 👨‍💻 Auteur

**Eya Mosbeh**

- GitHub: [@eyamosbeh](https://github.com/eyamosbeh)

---

## 🙏 Remerciements

- [NestJS](https://nestjs.com/) - Framework backend
- [MongoDB](https://www.mongodb.com/) - Base de données
- [Firebase](https://firebase.google.com/) - Notifications push
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR
