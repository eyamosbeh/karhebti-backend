import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CarsModule } from './cars/cars.module';
import { MaintenancesModule } from './maintenances/maintenances.module';
import { PartsModule } from './parts/parts.module';
import { ReplacementHistoryModule } from './replacement-history/replacement-history.module';
import { DocumentsModule } from './documents/documents.module';
import { GaragesModule } from './garages/garages.module';
import { ServicesModule } from './services/services.module';
import { ReclamationsModule } from './reclamations/reclamations.module';
import { AiModule } from './ai/ai.module';
import { TranslationModule } from './translation/translation.module';
import { SwipesModule } from './swipes/swipes.module';
import { ConversationsModule } from './conversations/conversations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { BreakdownsModule } from './breakdowns/breakdowns.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ReservationsModule } from './reservation/reservations.module';
import { RepairBaysModule } from './repair-bays/repair-bays.module';

@Module({
  imports: [
    // Configuration des variables d'environnement
    ConfigModule.forRoot({
      isGlobal: true, // Rend les variables d'environnement accessibles partout
      envFilePath: '.env',
    }),
    // Configuration MongoDB
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/karhebti',
    ),
    
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Event Emitter for real-time notifications
    EventEmitterModule.forRoot(),

    // Firebase Configuration
    FirebaseModule,

    // Modules métier
    AuthModule,
    UsersModule,
    CarsModule,
    MaintenancesModule,
    PartsModule,
    ReplacementHistoryModule,
    DocumentsModule,
    GaragesModule,
    ServicesModule,
    ReclamationsModule,
    NotificationsModule,
    AiModule,
    TranslationModule,
    BreakdownsModule,
    
    // Marketplace modules
    SwipesModule,
    ConversationsModule,
    ChatModule,
    ReservationsModule,
    RepairBaysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
