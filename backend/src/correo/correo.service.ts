import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateConsultaDto } from '../common/dto/create-consulta.dto';
import { crearInformePDF } from './informe-pdf';

/* ─────────────────────────────────────────────────────────────
   Entrega de cada solicitud del formulario: un correo a
   CORREO_DESTINO con el resumen y el informe PDF adjunto.

   Va por la API HTTP de Resend y no por SMTP, porque Render corta
   los puertos SMTP en sus planes gratuitos. La clave queda sólo en el
   backend.

   Sin dominio propio verificado en Resend, el remitente tiene que ser
   onboarding@resend.dev y el destino sólo puede ser el correo con el
   que se creó la cuenta de Resend. Por eso la cuenta va con la misma
   dirección que CORREO_DESTINO.
   ───────────────────────────────────────────────────────────── */

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

function filas(dto: CreateConsultaDto): [string, string][] {
  const servicios = [...dto.servicios, ...(dto.servicioOtro?.trim() ? [dto.servicioOtro.trim()] : [])];
  return [
    ['Nombre', dto.nombre],
    ['Empresa', dto.empresa],
    ['Correo', dto.correo],
    ['Teléfono', dto.telefono],
    ['Servicios', servicios.join(', ')],
    ['Ubicación', dto.ubicacion],
    ['Reunión', dto.reunion],
    ['Dificultades', dto.dolores.join(', ')],
    ['Necesidad', dto.mensaje],
  ]
    .map(([etiqueta, valor]) => [etiqueta, (valor ?? '').trim()] as [string, string])
    .filter(([, valor]) => valor);
}

@Injectable()
export class CorreoService {
  private readonly logger = new Logger(CorreoService.name);

  constructor(private readonly config: ConfigService) {}

  async enviarSolicitud(dto: CreateConsultaDto): Promise<void> {
    const informe = await crearInformePDF(dto);
    const datos = filas(dto);
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2a37;font-size:14px;line-height:1.5">
<h2 style="margin:0 0 16px;color:#0e2036">Nueva solicitud desde el sitio</h2>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
${datos
  .map(
    ([etiqueta, valor]) =>
      `<tr><td style="vertical-align:top;font-weight:bold;color:#386a9c;white-space:nowrap">${escapar(etiqueta)}</td><td style="white-space:pre-wrap">${escapar(valor)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="margin-top:16px;color:#6b7280">El informe completo va adjunto en PDF. Responder a este correo le escribe directo a ${escapar(dto.correo.trim())}.</p>
</div>`;
    const texto = `Nueva solicitud desde el sitio\n\n${datos.map(([e, v]) => `${e}: ${v}`).join('\n')}\n\nEl informe completo va adjunto en PDF.`;

    let detalle: string;
    try {
      const respuesta = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.get<string>('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
          // Resend rechaza con 403 las peticiones sin User-Agent.
          'User-Agent': 'krateroi-backend',
        },
        body: JSON.stringify({
          from: this.config.get<string>('CORREO_REMITENTE'),
          to: [this.config.get<string>('CORREO_DESTINO')],
          reply_to: dto.correo.trim(),
          subject: `Nueva solicitud: ${dto.nombre.trim()}${dto.empresa?.trim() ? ` (${dto.empresa.trim()})` : ''}`,
          html,
          text: texto,
          attachments: [{ filename: 'informe-solicitud-krateroi.pdf', content: Buffer.from(informe).toString('base64') }],
        }),
      });
      if (respuesta.ok) return;
      detalle = `${respuesta.status} ${(await respuesta.text().catch(() => '')).slice(0, 300)}`;
    } catch (error) {
      detalle = error instanceof Error ? error.message : String(error);
    }

    this.logger.error(`Error Resend: ${detalle}`);
    throw new InternalServerErrorException('No se pudo registrar la solicitud. Intenta de nuevo.');
  }
}
