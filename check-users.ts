// 📋 VÉRIFIER LES UTILISATEURS EXISTANTS

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('✅ MongoDB connecté\n');

  const userSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', userSchema, 'users');

  // Récupérer tous les utilisateurs
  const users = await User.find({}).select('email role deviceToken');

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé!');
  } else {
    console.log(`📊 ${users.length} utilisateur(s) trouvé(s):\n`);
    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Device Token: ${user.deviceToken ? '✅ OUI' : '❌ NON'}`);
      if (user.deviceToken) {
        console.log(`   Token: ${user.deviceToken.substring(0, 50)}...`);
      }
      console.log('');
    });
  }

  mongoose.connection.close();
}).catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
