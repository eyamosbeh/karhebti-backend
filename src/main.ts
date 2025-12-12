import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files (uploaded images)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration CORS - Allow all origins for development
  app.enableCors();

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Karhebti API')
    .setDescription('Backend REST complet pour la gestion automobile avec NestJS, MongoDB et IA')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Endpoints d\'authentification (signup, login, forgot/reset password)')
    .addTag('Users', 'Gestion des utilisateurs (CRUD, rôles)')
    .addTag('Cars', 'Gestion des voitures')
    .addTag('Maintenances', 'Gestion des entretiens')
    .addTag('Parts', 'Gestion des pièces')
    .addTag('Replacement History', 'Historique de remplacement des pièces')
    .addTag('Documents', 'Gestion des documents (assurance, carte grise, contrôle technique)')
    .addTag('Deadlines', 'Gestion des échéances et rappels')
    .addTag('Garages', 'Gestion des garages (Admin)')
    .addTag('Services', 'Services proposés par les garages (Admin)')
    .addTag('AI Features', 'Fonctionnalités IA (détection route, recommandations)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  
  try {
    await app.listen(port, '0.0.0.0');

    console.log(`\n🚀 Application démarrée et accessible sur:`);
    console.log(`   - http://localhost:${port}`);
    console.log(`   - http://192.168.1.190:${port}`);
    console.log(`📚 Documentation Swagger:`);
    console.log(`   - http://localhost:${port}/api`);
    console.log(`   - http://192.168.1.190:${port}/api\n`);
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
