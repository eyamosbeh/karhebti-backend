import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti';

async function seedGarages() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connecté à MongoDB');

    const db = client.db();
    const garagesCollection = db.collection('garages');

    // Vérifier si des garages existent déjà
    const count = await garagesCollection.countDocuments();
    if (count > 0) {
      console.log(`Il existe déjà ${count} garage(s) dans la base de données.`);
      console.log('Voulez-vous continuer ? (les garages seront ajoutés)');
    }

    // Garages de test
    const testGarages = [
      {
        nom: 'Garage Central Paris',
        adresse: '123 Rue de Rivoli, 75001 Paris',
        typeService: ['vidange', 'réparation', 'contrôle technique', 'climatisation'],
        telephone: '0145678901',
        noteUtilisateur: 4.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Garage Express Tunisie',
        adresse: 'Avenue Habib Bourguiba, Tunis',
        typeService: ['vidange', 'réparation', 'peinture', 'carrosserie'],
        telephone: '+216 71 123 456',
        noteUtilisateur: 4.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Auto Service Pro',
        adresse: '45 Boulevard Mohammed V, Casablanca',
        typeService: ['révision complète', 'freinage', 'électricité auto'],
        telephone: '+212 522 123 456',
        noteUtilisateur: 4.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Garage Mécanique Plus',
        adresse: '78 Rue de la République, Lyon',
        typeService: ['vidange', 'changement pneus', 'diagnostic électronique'],
        telephone: '0478901234',
        noteUtilisateur: 4.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        nom: 'Centre Auto Rapide',
        adresse: '12 Avenue des Champs-Élysées, Paris',
        typeService: ['contrôle technique', 'vidange express', 'révision'],
        telephone: '0156789012',
        noteUtilisateur: 3.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insérer les garages
    const result = await garagesCollection.insertMany(testGarages);
    console.log(`\n✅ ${result.insertedCount} garages de test créés avec succès !`);
    
    // Afficher les garages créés
    console.log('\n📋 Garages créés :');
    testGarages.forEach((garage, index) => {
      console.log(`\n${index + 1}. ${garage.nom}`);
      console.log(`   📍 ${garage.adresse}`);
      console.log(`   📞 ${garage.telephone}`);
      console.log(`   ⭐ Note: ${garage.noteUtilisateur}/5`);
      console.log(`   🔧 Services: ${garage.typeService.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création des garages:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connexion à MongoDB fermée');
  }
}

seedGarages();
