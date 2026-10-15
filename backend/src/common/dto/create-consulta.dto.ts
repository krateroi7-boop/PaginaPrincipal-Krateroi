import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DOLORES, REUNIONES, SERVICIOS, UBICACIONES } from '../catalogos';
import { EsTextoNatural } from '../validation/texto-natural.validator';

/* ─────────────────────────────────────────────────────────────
   Refleja la solicitud por etapas del frontend: servicio,
   ubicación, formato de reunión y necesidad.

   Dos cosas cambiaron respecto del formulario anterior y por eso el
   DTO se ve distinto:

   1. Servicio y dificultades admiten varias respuestas, no una.
   2. La necesidad puede venir marcada de la lista o escrita a mano.
      Con cualquiera de las dos hay contexto suficiente, así que
      `mensaje` dejó de ser obligatorio y la regla pasó a validarse
      en conjunto (ver `tieneNecesidad`).

   Las opciones se validan contra listas cerradas; el texto libre
   pasa por el filtro de entrada.
   ───────────────────────────────────────────────────────────── */

export class CreateConsultaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @EsTextoNatural()
  nombre: string;

  @IsEmail({}, { message: 'El correo no es válido.' })
  @MaxLength(120)
  correo: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @EsTextoNatural()
  empresa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  telefono?: string;

  @IsArray()
  @ArrayMaxSize(SERVICIOS.length)
  @IsIn(SERVICIOS as unknown as string[], { each: true })
  servicios: string[];

  /** Lo que la persona escribió cuando ninguna opción le calzaba. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @EsTextoNatural()
  servicioOtro?: string;

  @IsIn(UBICACIONES as unknown as string[])
  ubicacion: string;

  @IsIn(REUNIONES as unknown as string[])
  reunion: string;

  @IsArray()
  @ArrayMaxSize(DOLORES.length)
  @IsIn(DOLORES as unknown as string[], { each: true })
  dolores: string[];

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @EsTextoNatural()
  mensaje?: string;

  /** Hay servicio si marcó alguno o si lo escribió. */
  tieneServicio(): boolean {
    return this.servicios.length > 0 || !!this.servicioOtro?.trim();
  }

  /** Hay necesidad si marcó dificultades o si la describió. */
  tieneNecesidad(): boolean {
    return this.dolores.length > 0 || (this.mensaje?.trim().length ?? 0) >= 10;
  }
}
