import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateConsultaDto } from '../common/dto/create-consulta.dto';
import { CorreoService } from '../correo/correo.service';

// Recibe la solicitud del formulario y la entrega por correo con su
// informe PDF. class-validator ya validó campo por campo antes de
// llegar acá (ValidationPipe global); lo que queda son las reglas que
// cruzan varios campos a la vez.
@Controller('api')
export class ConsultaController {
  constructor(private readonly correo: CorreoService) {}

  // Cinco por hora y por IP: un cliente real manda una, el resto es
  // un script o un formulario reenviado.
  @Post('consulta')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  async crearConsulta(@Body() dto: CreateConsultaDto): Promise<{ ok: true }> {
    if (!dto.tieneServicio()) {
      throw new BadRequestException('Falta indicar qué tipo de servicio necesitas.');
    }
    if (!dto.tieneNecesidad()) {
      throw new BadRequestException('Falta describir la necesidad.');
    }

    await this.correo.enviarSolicitud(dto);
    return { ok: true };
  }
}
