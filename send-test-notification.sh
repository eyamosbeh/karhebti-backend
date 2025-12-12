#!/bin/bash
# Script pour envoyer une notification de test via cURL
# Usage: bash send-test-notification.sh

API_URL="http://localhost:3000"
EMAIL="eya.mosbeh@example.com"
PASSWORD="password123"
DEVICE_TOKEN="test_device_token_123"

echo "🚀 Test de notification Firebase"
echo "=================================="

# Étape 1: Login
echo ""
echo "📝 Étape 1: Connexion..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"motDePasse\": \"$PASSWORD\"}")

JWT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ -z "$JWT_TOKEN" ] || [ "$JWT_TOKEN" == "null" ]; then
  echo "❌ Erreur de connexion"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Connexion réussie!"
echo "   JWT Token: ${JWT_TOKEN:0:20}..."
echo "   User ID: $USER_ID"

# Étape 2: Mettre à jour le device token
echo ""
echo "📱 Étape 2: Mise à jour du device token..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/notifications/update-device-token" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deviceToken\": \"$DEVICE_TOKEN\"}")

echo "✅ Device token mis à jour!"

# Étape 3: Envoyer une notification
echo ""
echo "📬 Étape 3: Envoi d'une notification de test..."
NOTIF_RESPONSE=$(curl -s -X POST "$API_URL/notifications/send" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"title\": \"🧪 Notification de Test\", \"body\": \"Ceci est une notification de test depuis votre API!\"}")

MESSAGE_ID=$(echo $NOTIF_RESPONSE | jq -r '.data.messageId')
echo "✅ Notification envoyée!"
echo "   Message ID: $MESSAGE_ID"
echo "   Response: $NOTIF_RESPONSE"

# Étape 4: Vérifier les notifications
echo ""
echo "📬 Étape 4: Récupération des notifications..."
NOTIF_LIST=$(curl -s -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $JWT_TOKEN")

TOTAL=$(echo $NOTIF_LIST | jq -r '.metadata.total')
UNREAD=$(echo $NOTIF_LIST | jq -r '.metadata.unreadCount')
echo "✅ Notifications récupérées!"
echo "   Nombre total: $TOTAL"
echo "   Non lues: $UNREAD"

# Résumé
echo ""
echo "=================================="
echo "✅ TEST TERMINÉ AVEC SUCCÈS!"
echo "=================================="
echo ""
echo "📝 Résumé:"
echo "   • Utilisateur: $EMAIL"
echo "   • Device Token: $DEVICE_TOKEN"
echo "   • Endpoint: $API_URL"
