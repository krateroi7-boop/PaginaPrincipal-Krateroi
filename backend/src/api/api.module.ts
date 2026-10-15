import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { ConsultaController } from './consulta.controller';
import { ChatController } from './chat.controller';
import { HealthController } from './health.controller';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [TelegramModule, AiModule, DatabaseModule],
  controllers: [ConsultaController, ChatController, HealthController],
  providers: [ChatGateway],
})
export class ApiModule {}
