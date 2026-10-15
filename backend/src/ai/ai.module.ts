import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';

// Lógica de IA aislada del canal: hoy la consume el endpoint web,
// mañana podría consumirla el bot de Telegram sin cambiar nada acá.
@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
