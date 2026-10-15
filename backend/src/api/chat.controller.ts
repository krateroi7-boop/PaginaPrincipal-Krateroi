import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ChatDto, UltimoMensajeDto } from '../common/dto/chat.dto';
import { GeminiService } from '../ai/gemini.service';

// Reemplaza la llamada directa a Gemini que hacía el navegador con la
// clave a la vista. El frontend manda el historial y recibe el texto.
@Controller('api')
export class ChatController {
  constructor(private readonly gemini: GeminiService) {}

  // Treinta por hora y por IP: una conversación de diagnóstico se
  // resuelve en pocos turnos, el resto es abuso o un bucle.
  @Post('chat')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  async conversar(@Body() dto: ChatDto): Promise<{ reply: string }> {
    const ultimo = dto.messages[dto.messages.length - 1];

    // Sólo el turno nuevo pasa por el filtro: las respuestas del
    // modelo llevan puntuación que el filtro no acepta, y el
    // historial ya se revisó cuando llegó.
    if (ultimo.role === 'user') {
      const revisar = plainToInstance(UltimoMensajeDto, { content: ultimo.content });
      await validateOrReject(revisar).catch((errores) => {
        const motivo = Array.isArray(errores)
          ? Object.values(errores[0]?.constraints ?? {})[0]
          : null;
        throw new BadRequestException(
          typeof motivo === 'string' ? motivo.replace('El campo content', 'Tu mensaje') : 'Mensaje no aceptado.',
        );
      });
    }

    return { reply: await this.gemini.responder(dto.messages) };
  }
}
