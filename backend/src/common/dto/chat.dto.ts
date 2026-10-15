import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { EsTextoNatural } from '../validation/texto-natural.validator';

/* ─────────────────────────────────────────────────────────────
   Conversación del asistente.

   Sólo se revisa con el filtro lo que escribió la persona: las
   respuestas del modelo llevan saltos, guiones y comillas que el
   filtro de entrada no tiene por qué aceptar.
   ───────────────────────────────────────────────────────────── */

export class MensajeChatDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @MaxLength(1200)
  content: string;
}

export class ChatDto {
  /* Doce turnos es la ventana que manda el frontend. Más no aporta
     al diagnóstico y encarece cada llamada. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MensajeChatDto)
  messages: MensajeChatDto[];
}

/** El último turno es siempre el nuevo, y es el que puede traer una
    inyección: el historial ya pasó por acá en su momento. */
export class UltimoMensajeDto {
  @IsString()
  @MaxLength(1200)
  @EsTextoNatural()
  content: string;
}
