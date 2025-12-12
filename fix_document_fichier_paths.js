// Script Node.js pour corriger les chemins 'fichier' dans MongoDB
// et déplacer les fichiers dans uploads/documents/

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb://localhost:27017'; // adapte si besoin
const DB_NAME = 'karhebti';
const COLLECTION = 'documententities';
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'documents');

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  const docs = await col.find({ fichier: { $not: /^\/uploads\/documents\// } }).toArray();
  for (const doc of docs) {
    if (!doc.fichier) continue;
    const filename = path.basename(doc.fichier);
    const newPath = `/uploads/documents/${filename}`;
    // Update MongoDB
    await col.updateOne({ _id: doc._id }, { $set: { fichier: newPath } });
    // Move file if it exists
    try {
      if (fs.existsSync(doc.fichier)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        fs.copyFileSync(doc.fichier, path.join(UPLOADS_DIR, filename));
        console.log(`Déplacé: ${doc.fichier} -> ${UPLOADS_DIR}/${filename}`);
      } else {
        console.warn(`Fichier introuvable: ${doc.fichier}`);
      }
    } catch (err) {
      console.error(`Erreur déplacement ${doc.fichier}:`, err.message);
    }
  }
  await client.close();
  console.log('Correction terminée.');
}

main().catch(console.error);
