# Upload d'Images pour Documents

## Vue d'ensemble

Le système permet d'uploader des images de documents directement depuis l'application Android, soit depuis la galerie, soit en prenant une photo instantanée.

## Configuration Backend

### Formats acceptés
- Images: JPG, JPEG, PNG, GIF
- Documents: PDF
- Taille max: 5 MB

### Endpoint d'upload

```
POST /documents
PATCH /documents/:id
```

**Content-Type**: `multipart/form-data`

## Intégration Android

### 1. Dépendances (build.gradle)

```gradle
// Retrofit pour les requêtes HTTP
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'

// Pour l'upload de fichiers
implementation 'com.squareup.okhttp3:logging-interceptor:4.9.0'
```

### 2. Permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 3. Interface API Retrofit

```kotlin
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface DocumentApi {
    @Multipart
    @POST("documents")
    suspend fun createDocument(
        @Part("type") type: RequestBody,
        @Part("dateEmission") dateEmission: RequestBody,
        @Part("dateExpiration") dateExpiration: RequestBody,
        @Part("fichier") fichier: RequestBody,
        @Part("voiture") voiture: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<Document>
    
    @Multipart
    @PATCH("documents/{id}")
    suspend fun updateDocument(
        @Path("id") id: String,
        @Part("type") type: RequestBody?,
        @Part("dateEmission") dateEmission: RequestBody?,
        @Part("dateExpiration") dateExpiration: RequestBody?,
        @Part("fichier") fichier: RequestBody?,
        @Part image: MultipartBody.Part?
    ): Response<Document>
}
```

### 4. Activity pour choisir Photo/Galerie

```kotlin
import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class AddDocumentActivity : AppCompatActivity() {
    
    private var currentPhotoPath: String? = null
    private var selectedImageUri: Uri? = null
    
    // Launcher pour la galerie
    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            selectedImageUri = it
            // Afficher l'image dans ImageView
            imageView.setImageURI(it)
        }
    }
    
    // Launcher pour la caméra
    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success: Boolean ->
        if (success) {
            currentPhotoPath?.let { path ->
                selectedImageUri = Uri.fromFile(File(path))
                // Afficher l'image dans ImageView
                imageView.setImageURI(selectedImageUri)
            }
        }
    }
    
    // Launcher pour les permissions
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            openCamera()
        } else {
            // Afficher un message d'erreur
            Toast.makeText(this, "Permission caméra refusée", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_document)
        
        // Bouton pour choisir depuis la galerie
        btnGallery.setOnClickListener {
            pickImageLauncher.launch("image/*")
        }
        
        // Bouton pour prendre une photo
        btnCamera.setOnClickListener {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.CAMERA
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                openCamera()
            } else {
                requestPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
        
        // Bouton pour sauvegarder
        btnSave.setOnClickListener {
            uploadDocument()
        }
    }
    
    private fun openCamera() {
        val photoFile: File? = try {
            createImageFile()
        } catch (ex: IOException) {
            null
        }
        
        photoFile?.also {
            val photoURI: Uri = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.fileprovider",
                it
            )
            takePictureLauncher.launch(photoURI)
        }
    }
    
    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir: File = getExternalFilesDir(Environment.DIRECTORY_PICTURES)!!
        return File.createTempFile(
            "JPEG_${timeStamp}_",
            ".jpg",
            storageDir
        ).apply {
            currentPhotoPath = absolutePath
        }
    }
    
    private fun uploadDocument() {
        val type = spinnerType.selectedItem.toString()
        val dateEmission = editDateEmission.text.toString()
        val dateExpiration = editDateExpiration.text.toString()
        val fichier = editFichier.text.toString()
        val voitureId = getSelectedCarId()
        
        lifecycleScope.launch {
            try {
                val documentApi = RetrofitClient.getInstance().create(DocumentApi::class.java)
                
                // Préparer les parties du formulaire
                val typePart = RequestBody.create("text/plain".toMediaType(), type)
                val dateEmissionPart = RequestBody.create("text/plain".toMediaType(), dateEmission)
                val dateExpirationPart = RequestBody.create("text/plain".toMediaType(), dateExpiration)
                val fichierPart = RequestBody.create("text/plain".toMediaType(), fichier)
                val voiturePart = RequestBody.create("text/plain".toMediaType(), voitureId)
                
                // Préparer l'image si elle existe
                val imagePart = selectedImageUri?.let { uri ->
                    val inputStream = contentResolver.openInputStream(uri)
                    val file = File(cacheDir, "temp_image.jpg")
                    file.outputStream().use { outputStream ->
                        inputStream?.copyTo(outputStream)
                    }
                    
                    val requestFile = RequestBody.create(
                        "image/*".toMediaType(),
                        file
                    )
                    MultipartBody.Part.createFormData("image", file.name, requestFile)
                }
                
                // Envoyer la requête
                val response = documentApi.createDocument(
                    typePart,
                    dateEmissionPart,
                    dateExpirationPart,
                    fichierPart,
                    voiturePart,
                    imagePart
                )
                
                if (response.isSuccessful) {
                    Toast.makeText(this@AddDocumentActivity, "Document créé avec succès!", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@AddDocumentActivity, "Erreur: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@AddDocumentActivity, "Erreur: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
```

### 5. FileProvider Configuration (res/xml/file_paths.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="Android/data/${applicationId}/files/Pictures" />
    <cache-path name="cache" path="." />
</paths>
```

### 6. Ajouter FileProvider dans AndroidManifest.xml

```xml
<application>
    ...
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>
</application>
```

### 7. Layout Example (activity_add_document.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">
    
    <Spinner
        android:id="@+id/spinnerType"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:entries="@array/document_types" />
    
    <EditText
        android:id="@+id/editDateEmission"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Date d'émission (YYYY-MM-DD)" />
    
    <EditText
        android:id="@+id/editDateExpiration"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Date d'expiration (YYYY-MM-DD)" />
    
    <EditText
        android:id="@+id/editFichier"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="URL du fichier PDF" />
    
    <ImageView
        android:id="@+id/imageView"
        android:layout_width="match_parent"
        android:layout_height="200dp"
        android:scaleType="centerCrop"
        android:background="#E0E0E0" />
    
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal">
        
        <Button
            android:id="@+id/btnGallery"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Galerie" />
        
        <Button
            android:id="@+id/btnCamera"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Caméra" />
    </LinearLayout>
    
    <Button
        android:id="@+id/btnSave"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Enregistrer" />
</LinearLayout>
```

## Test avec Postman

### Créer un document avec image

1. Sélectionner POST `http://localhost:3000/documents`
2. Onglet **Authorization**: Bearer Token (votre JWT)
3. Onglet **Body**: 
   - Sélectionner `form-data`
   - Ajouter les champs:
     - `type`: `assurance` (text)
     - `dateEmission`: `2024-01-01` (text)
     - `dateExpiration`: `2025-01-01` (text)
     - `fichier`: `http://example.com/file.pdf` (text)
     - `voiture`: `[ID_VOITURE]` (text)
     - `image`: [Sélectionner File et choisir une image] (file)

## URLs des images

Une fois uploadées, les images sont accessibles via:
```
http://localhost:3000/uploads/documents/image-1699999999999-123456789.jpg
```

## Sécurité

- Les fichiers sont validés côté serveur (type et taille)
- Seuls les formats autorisés sont acceptés
- Taille maximale: 5 MB
- Les routes sont protégées par JWT
