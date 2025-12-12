// 📋 DocumentType Enum - Kotlin Android

package com.karhebti.app.data.models

/**
 * Énumération des types de documents supportés dans Karhebti
 */
enum class DocumentType {
    ASSURANCE,              // Assurance automobile
    PERMIS_CONDUIRE,        // Permis de conduire
    CARTE_GRISE,            // Carte grise / Immatriculation
    VISITE_TECHNIQUE;       // Contrôle technique / Visite technique

    /**
     * Obtenir le label français du type de document
     */
    val label: String
        get() = when (this) {
            ASSURANCE -> "Assurance Automobile"
            PERMIS_CONDUIRE -> "Permis de Conduire"
            CARTE_GRISE -> "Carte Grise"
            VISITE_TECHNIQUE -> "Visite Technique"
        }

    /**
     * Obtenir l'emoji correspondant
     */
    val emoji: String
        get() = when (this) {
            ASSURANCE -> "🔒"           // Sécurité
            PERMIS_CONDUIRE -> "🎫"     // Ticket/Permis
            CARTE_GRISE -> "📋"         // Papier/Document
            VISITE_TECHNIQUE -> "🔧"    // Outils/Mécanique
        }

    /**
     * Obtenir la couleur pour l'UI (format Hex)
     */
    val color: Long
        get() = when (this) {
            ASSURANCE -> 0xFF3498DB        // Bleu
            PERMIS_CONDUIRE -> 0xFFE74C3C  // Rouge
            CARTE_GRISE -> 0xFF2ECC71      // Vert
            VISITE_TECHNIQUE -> 0xFF34495E // Gris foncé
        }

    /**
     * Obtenir la durée de validité typique en jours
     */
    val typicalValidityDays: Int
        get() = when (this) {
            ASSURANCE -> 365               // 1 an
            PERMIS_CONDUIRE -> 3650        // 10 ans
            CARTE_GRISE -> 365             // 1 an (certificat d'immatriculation)
            VISITE_TECHNIQUE -> 365        // 1 an
        }

    /**
     * Vérifier si le document est relatif au véhicule
     */
    val isVehicleDocument: Boolean
        get() = this in listOf(ASSURANCE, CARTE_GRISE, VISITE_TECHNIQUE)

    companion object {
        /**
         * Convertir une string en DocumentType
         */
        fun fromString(value: String): DocumentType? {
            return try {
                valueOf(value.uppercase())
            } catch (e: IllegalArgumentException) {
                null
            }
        }

        /**
         * Obtenir tous les types de documents
         */
        fun getAllTypes(): List<DocumentType> {
            return values().toList()
        }

        /**
         * Obtenir les documents du véhicule
         */
        fun getVehicleDocuments(): List<DocumentType> {
            return values().filter { it.isVehicleDocument }
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 EXEMPLES D'UTILISATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*

// 1. Utiliser directement
val docType = DocumentType.ASSURANCE
println("${docType.emoji} ${docType.label}")
// Résultat: 🔒 Assurance Automobile

// 2. Convertir une string
val type = DocumentType.fromString("assurance")
println(type?.label) // Assurance Automobile

// 3. Vérifier les propriétés
if (DocumentType.CARTE_GRISE.isVehicleDocument) {
    println("C'est un document de véhicule")
}

// 4. Obtenir tous les types
DocumentType.getAllTypes().forEach { type ->
    println("${type.emoji} ${type.label} (${type.typicalValidityDays} jours)")
}

// 5. Filtrer par catégorie
val vehicleDocs = DocumentType.getVehicleDocuments()
val identityDocs = DocumentType.getIdentityDocuments()
val travelDocs = DocumentType.getTravelDocuments()

// 6. Utiliser dans une UI
@Composable
fun DocumentTypeSelector() {
    var selectedType by remember { mutableStateOf(DocumentType.ASSURANCE) }
    
    LazyColumn {
        items(DocumentType.getAllTypes()) { type ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { selectedType = type }
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(type.emoji, fontSize = 28.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(type.label)
            }
        }
    }
}

// 7. Utiliser dans l'API
data class CreateDocumentRequest(
    val type: DocumentType,  // Enum directement
    val dateExpiration: LocalDate,
    val carId: String? = null
)

// 8. Sérialiser/Désérialiser avec Gson
val gson = GsonBuilder()
    .registerTypeAdapter(DocumentType::class.java, DocumentTypeDeserializer())
    .create()

// 9. Utiliser dans les filtres
fun filterDocumentsByType(documents: List<Document>, type: DocumentType): List<Document> {
    return documents.filter { it.type == type }
}

// 10. Utiliser dans les statistiques
fun getDocumentCountByType(documents: List<Document>): Map<DocumentType, Int> {
    return documents.groupingBy { it.type }.eachCount()
}

*/

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 ADAPTER GSON POUR SÉRIALISATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import com.google.gson.*
import java.lang.reflect.Type

class DocumentTypeDeserializer : JsonDeserializer<DocumentType> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): DocumentType {
        val value = json?.asString ?: return DocumentType.ASSURANCE
        return DocumentType.fromString(value) ?: DocumentType.ASSURANCE
    }
}

class DocumentTypeSerializer : JsonSerializer<DocumentType> {
    override fun serialize(
        src: DocumentType?,
        typeOfSrc: Type?,
        context: JsonSerializationContext?
    ): JsonElement {
        return JsonPrimitive(src?.name)
    }
}

// Utilisation:
// val gson = GsonBuilder()
//     .registerTypeAdapter(DocumentType::class.java, DocumentTypeDeserializer())
//     .registerTypeAdapter(DocumentType::class.java, DocumentTypeSerializer())
//     .create()
