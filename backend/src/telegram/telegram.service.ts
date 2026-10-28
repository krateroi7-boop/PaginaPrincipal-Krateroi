import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateConsultaDto } from '../common/dto/create-consulta.dto';
import { crearInformePDF } from './informe-pdf';

// El informe se genera desde los datos validados y se entrega por
// Telegram. El token permanece solo en el backend.
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  async enviarAlertaConsulta(dto: CreateConsultaDto): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');

    const informe = await crearInformePDF(dto);
    const cuerpo = new FormData();
    cuerpo.append('chat_id', chatId ?? '');
    cuerpo.append('caption', `Nueva solicitud: ${dto.nombre.trim()} (${dto.correo.trim()})`);
    cuerpo.append(
      'document',
      new Blob([new Uint8Array(informe)], { type: 'application/pdf' }),
      'informe-solicitud-krateroi.pdf',
    );

    const respuesta = await fetch(
      `https://api.telegram.org/bot${token}/sendDocument`,
      {
        method: 'POST',
        body: cuerpo,
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
}
