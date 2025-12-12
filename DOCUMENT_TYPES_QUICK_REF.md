# 📋 DOCUMENT TYPES - QUICK REFERENCE

## Résumé Visual

```
┌────────────────────────────────────────────────────────────┐
│           📋 TYPES DE DOCUMENTS KARHEBTI                    │
└────────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════════╗
║                    🔒 ASSURANCE                             ║
║  Couleur: Bleu (#3498DB)                                   ║
║  Catégorie: Véhicule                                       ║
║  Validité: 1 an (365 jours)                                ║
║  Usage: Assurance automobile obligatoire                   ║
╚═════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════╗
║              🎫 PERMIS DE CONDUIRE                          ║
║  Couleur: Rouge (#E74C3C)                                  ║
║  Catégorie: Véhicule                                       ║
║  Validité: 10 ans (3650 jours)                             ║
║  Usage: Autorisation légale de conduire                    ║
╚═════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════╗
║                📋 CARTE GRISE                               ║
║  Couleur: Vert (#2ECC71)                                   ║
║  Catégorie: Véhicule                                       ║
║  Validité: 1 an (365 jours)                                ║
║  Usage: Immatriculation du véhicule                        ║
╚═════════════════════════════════════════════════════════════╝

╔═════════════════════════════════════════════════════════════╗
║              🔧 VISITE TECHNIQUE                            ║
║  Couleur: Gris (#34495E)                                   ║
║  Catégorie: Véhicule                                       ║
║  Validité: 1 an (365 jours)                                ║
║  Usage: Contrôle technique / Inspection du véhicule        ║
╚═════════════════════════════════════════════════════════════╝
```

---

## 📊 Tableau Comparatif

| Type | Emoji | Couleur | Validité | Catégorie | Notification |
|------|-------|---------|----------|-----------|--------------|
| Assurance | 🔒 | Bleu | 1 an | Véhicule | ✅ J-7 |
| Permis | 🎫 | Rouge | 10 ans | Véhicule | ✅ J-7 |
| Carte Grise | 📋 | Vert | 1 an | Véhicule | ✅ J-7 |
| Visite Tech | 🔧 | Gris | 1 an | Véhicule | ✅ J-7 |

---

## 🎨 Palette de Couleurs

```kotlin
// Hexadécimal
ASSURANCE → #3498DB (Bleu)
PERMIS_CONDUIRE → #E74C3C (Rouge)
CARTE_GRISE → #2ECC71 (Vert)
VISITE_TECHNIQUE → #34495E (Gris)

// RGB
ASSURANCE → RGB(52, 152, 219)
PERMIS_CONDUIRE → RGB(231, 76, 60)
CARTE_GRISE → RGB(46, 204, 113)
VISITE_TECHNIQUE → RGB(52, 73, 94)
```

---

## 🔧 Code Quickstart

### Importer et Utiliser

```kotlin
import com.karhebti.app.data.models.DocumentType

// Récupérer un type
val type = DocumentType.ASSURANCE

// Accéder aux propriétés
println(type.emoji)           // 🔒
println(type.label)            // Assurance Automobile
println(type.color)            // 0xFF3498DB
println(type.isVehicleDocument) // true

// Convertir une string
val fromString = DocumentType.fromString("assurance")

// Obtenir tous les types
val allTypes = DocumentType.values()

// Filtrer par catégorie
val vehicleDocs = DocumentType.getVehicleDocuments()
val identityDocs = DocumentType.getIdentityDocuments()
val travelDocs = DocumentType.getTravelDocuments()
```

---

## 📱 Utilisation dans Compose

### Liste Simple

```kotlin
@Composable
fun DocumentTypeList() {
    LazyColumn {
        items(DocumentType.values()) { type ->
            Row(
                modifier = Modifier.padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(type.emoji, fontSize = 28.sp)
                Text(type.label, fontSize = 16.sp)
            }
        }
    }
}
```

### Card avec Couleur

```kotlin
@Composable
fun DocumentTypeCard(type: DocumentType) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(type.color).copy(alpha = 0.1f)
        ),
        border = BorderStroke(2.dp, Color(type.color))
    ) {
        Row(modifier = Modifier.padding(16.dp)) {
            Text(type.emoji, fontSize = 28.sp)
            Text(type.label, fontSize = 16.sp)
        }
    }
}
```

### Sélectionneur

```kotlin
@Composable
fun DocumentTypeSelector() {
    var selected by remember { mutableStateOf(DocumentType.ASSURANCE) }
    
    Column {
        DocumentTypeDropdown(
            selectedType = selected,
            onTypeSelected = { selected = it }
        )
        
        Text("Sélectionné: ${selected.label}")
    }
}
```

---

## 🚀 Fichiers à Utiliser

| Fichier | Description | Localisation |
|---------|-------------|--------------|
| `DocumentType.kt` | Enum complet | `data/models/` |
| `DOCUMENTTYPE_GUIDE.md` | Guide détaillé | Racine |
| `DocumentTypeComponents.kt` | Composables | `ui/components/` |
| `KOTLIN_FRONTEND_GUIDE.md` | Guide Kotlin intégral | Racine |

---

## ✅ Checklist d'Intégration

- [ ] Copier `DocumentType.kt` dans `data/models/`
- [ ] Utiliser l'enum dans tous les modèles
- [ ] Implémenter les composables
- [ ] Afficher les emojis dans l'UI
- [ ] Utiliser les couleurs appropriées
- [ ] Tester avec tous les types
- [ ] Ajouter les tests unitaires
- [ ] Documenter l'utilisation

---

## 🔗 Intégration Backend

Le backend NestJS envoie les types en **string**:

```json
{
  "type": "assurance",
  "dateExpiration": "2025-11-20",
  "daysUntilExpiration": 4
}
```

**À faire en Kotlin:**
```kotlin
val docType = DocumentType.fromString("assurance")  // ASSURANCE
println(docType?.emoji)  // 🔒
```

---

## 📚 Documentation Complète

Pour plus de détails:
- 📖 Consulter `DOCUMENTTYPE_GUIDE.md`
- 📖 Consulter `KOTLIN_FRONTEND_GUIDE.md`
- 🎨 Consulter `DocumentTypeComponents.kt`

---

**Last Updated:** November 19, 2025
**Status:** ✅ Production Ready
**Version:** 1.0
