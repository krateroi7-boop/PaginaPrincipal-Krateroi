import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateConsultaDto } from '../common/dto/create-consulta.dto';
import {
  DOLORES,
  REUNIONES,
  SERVICIOS,
  UBICACIONES,
  deLista,
  soloDeLista,
} from '../common/catalogos';

// Mismo envío que antes hacía el navegador de cada visitante (fetch
// directo a api.telegram.org con el token expuesto en el cliente). Se
// reubica acá para que el token nunca salga del backend.
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  async enviarAlertaConsulta(dto: CreateConsultaDto): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');

    // Sin parse_mode a propósito: el resumen lleva texto escrito por
    // la persona y un guion bajo suelto rompería el formateo de
    // Markdown, con lo que el mensaje no llegaría.
    const respuesta = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: this.armarResumen(dto) }),
      },
    );

    if (!respuesta.ok) {
      const error = await respuesta.json().catch(() => ({}));
      this.logger.error(`Error Telegram: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException(
        'No se pudo registrar la solicitud. Intenta de nuevo.',
      );
    }
  }

  private armarResumen(dto: CreateConsultaDto): string {
    /* Se vuelve a filtrar contra las listas aunque el DTO ya validó:
       es lo que decide qué se escribe en el mensaje, y así un valor
       que se colara nunca llegaría al grupo. */
    const servicios = soloDeLista(dto.servicios, SERVICIOS);
    const dolores = soloDeLista(dto.dolores, DOLORES);

    const lineas = [
      'NUEVA SOLICITUD DESDE EL SITIO',
      '',
      `Nombre: ${dto.nombre.trim()}`,
      `Correo: ${dto.correo.trim()}`,
      `Empresa: ${dto.empresa?.trim() || '-'}`,
      `Teléfono: ${dto.telefono?.trim() || '-'}`,
      '',
      `Servicios: ${servicios.length ? servicios.join(', ') : '-'}`,
    ];

    if (dto.servicioOtro?.trim()) {
      lineas.push(`Otro servicio: ${dto.servicioOtro.trim()}`);
    }

    lineas.push(
      `Ubicación: ${deLista(dto.ubicacion, UBICACIONES)}`,
      `Formato de reunión: ${deLista(dto.reunion, REUNIONES)}`,
    );

    if (dolores.length) {
      lineas.push('', 'Lo que más le cuesta hoy:');
      dolores.forEach((d) => lineas.push(`- ${d}`));
    }

    lineas.push('', 'Necesidad:', dto.mensaje?.trim() || '-');

    return lineas.join('\n');
  }
}
