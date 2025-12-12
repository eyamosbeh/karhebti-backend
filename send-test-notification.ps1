# Script pour envoyer une notification de test via l'API
# Usage: .\send-test-notification.ps1

# Configuration
$API_URL = "http://localhost:3000"
$EMAIL = "eya.mosbeh@example.com"  # Changez avec un email valide
$PASSWORD = "eyamosbeh"          # Changez avec le mot de passe
$DEVICE_TOKEN = "test_device_token_123"  # Remplacez par le vrai token du device

Write-Host "🚀 Test de notification Firebase" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Étape 1: Login pour obtenir le token JWT
Write-Host "`n📝 Étape 1: Connexion..." -ForegroundColor Yellow

$loginBody = @{
    email = $EMAIL
    motDePasse = $PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $jwtToken = $loginData.access_token
    $userId = $loginData.user.id
    
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "   JWT Token: $($jwtToken.Substring(0, 20))..." -ForegroundColor Cyan
    Write-Host "   User ID: $userId" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 2: Mettre à jour le device token
Write-Host "`n📱 Étape 2: Mise à jour du device token..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

$tokenBody = @{
    deviceToken = $DEVICE_TOKEN
} | ConvertTo-Json

try {
    $tokenResponse = Invoke-WebRequest -Uri "$API_URL/notifications/update-device-token" `
        -Method POST `
        -Headers $headers `
        -Body $tokenBody -ErrorAction Stop
    
    Write-Host "✅ Device token mis à jour!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreur lors de la mise à jour du token (non bloquant): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Étape 3: Envoyer une notification
Write-Host "`n📬 Étape 3: Envoi d'une notification de test..." -ForegroundColor Yellow

$notificationBody = @{
    userId = $userId
    type = "alert"
    titre = "🧪 Notification de Test"
    message = "Ceci est une notification de test depuis votre API!"
    data = @{
        testRun = $true
        timestamp = (Get-Date).ToString("o")
    }
} | ConvertTo-Json

try {
    $notifResponse = Invoke-WebRequest -Uri "$API_URL/notifications/send" `
        -Method POST `
        -Headers $headers `
        -Body $notificationBody -ErrorAction Stop
    
    $notifData = $notifResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Notification envoyée avec succès!" -ForegroundColor Green
    Write-Host "   Message ID: $($notifData.data.messageId)" -ForegroundColor Cyan
    Write-Host "   Status: $($notifData.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erreur lors de l'envoi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

# Étape 4: Vérifier les notifications
Write-Host "`n📬 Étape 4: Récupération des notifications..." -ForegroundColor Yellow

try {
    $notifListResponse = Invoke-WebRequest -Uri "$API_URL/notifications" `
        -Method GET `
        -Headers $headers -ErrorAction Stop
    
    $notifList = $notifListResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Notifications récupérées!" -ForegroundColor Green
    Write-Host "   Nombre total: $($notifList.metadata.total)" -ForegroundColor Cyan
    Write-Host "   Non lues: $($notifList.metadata.unreadCount)" -ForegroundColor Cyan
    
    if ($notifList.data.Count -gt 0) {
        Write-Host "`n   Dernières notifications:" -ForegroundColor Cyan
        foreach ($notif in $notifList.data | Select-Object -First 3) {
            Write-Host "   - [$($notif.title)] $($notif.body)" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération: $($_.Exception.Message)" -ForegroundColor Red
}

# Résumé
Write-Host "`n================================" -ForegroundColor Green
Write-Host "✅ TEST TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`n📝 Résumé:" -ForegroundColor Cyan
Write-Host "   • Utilisateur: $EMAIL" -ForegroundColor Cyan
Write-Host "   • Device Token: $DEVICE_TOKEN" -ForegroundColor Cyan
Write-Host "   • Notification: 🧪 Notification de Test" -ForegroundColor Cyan
Write-Host "   • Endpoint: $API_URL" -ForegroundColor Cyan
Write-Host "`n💡 Conseils:" -ForegroundColor Yellow
Write-Host "   • Vérifiez que votre app mobile a le même device token" -ForegroundColor Yellow
Write-Host "   • Vérifiez les logs du backend pour les erreurs Firebase" -ForegroundColor Yellow
Write-Host "   • Assurez-vous que Firebase est bien configuré sur le mobile" -ForegroundColor Yellow
