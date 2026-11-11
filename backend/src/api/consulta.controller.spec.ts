import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { CreateConsultaDto } from '../common/dto/create-consulta.dto';
import { CorreoService } from '../correo/correo.service';
import { ConsultaController } from './consulta.controller';

/* fetch simulado: nada sale a Resend. */
const llamadas: { url: string; init: RequestInit }[] = [];
let estado: number | 'sin red';

beforeAll(() => Logger.overrideLogger(false));

beforeEach(() => {
  llamadas.length = 0;
  estado = 200;
  global.fetch = jest.fn(async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    if (estado === 'sin red') throw new TypeError('fetch failed');
    return new Response(JSON.stringify({ id: 'x' }), { status: estado });
  }) as unknown as typeof fetch;
});

const controlador = () =>
  new ConsultaController(
    new CorreoService(
      new ConfigService({
        RESEND_API_KEY: 'k',
        CORREO_DESTINO: 'krateroi7@gmail.com',
        CORREO_REMITENTE: 'Krateroi <onboarding@resend.dev>',
      }),
    ),
  );

const solicitud = (extra: Partial<CreateConsultaDto> = {}) =>
  plainToInstance(CreateConsultaDto, {
    nombre: 'Ana Pérez',
    correo: 'ana@empresa.cl',
    empresa: 'Empresa <SpA>',
    servicios: ['Diagnóstico inicial'],
    ubicacion: 'Región Metropolitana',
    reunion: 'Videollamada',
    dolores: [],
    mensaje: 'Necesitamos ordenar los datos de clientes.',
    ...extra,
  });

describe('ConsultaController', () => {
  it('envía la solicitud a CORREO_DESTINO con el informe PDF', async () => {
    await expect(controlador().crearConsulta(solicitud())).resolves.toEqual({ ok: true });
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].url).toBe('https://api.resend.com/emails');
    const cabeceras = llamadas[0].init.headers as Record<string, string>;
    expect(cabeceras.Authorization).toBe('Bearer k');
    expect(cabeceras['User-Agent']).toBeTruthy();

    const correo = JSON.parse(llamadas[0].init.body as string);
    expect(correo.from).toBe('Krateroi <onboarding@resend.dev>');
    expect(correo.to).toEqual(['krateroi7@gmail.com']);
    expect(correo.reply_to).toBe('ana@empresa.cl');
    expect(correo.subject).toBe('Nueva solicitud: Ana Pérez (Empresa <SpA>)');
    expect(correo.html).toContain('Empresa &lt;SpA&gt;');
    expect(correo.html).not.toContain('<SpA>');
    expect(Buffer.from(correo.attachments[0].content, 'base64').subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('da error si Resend rechaza el envío', async () => {
    estado = 422;
    await expect(controlador().crearConsulta(solicitud())).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('da error si no hay conexión con Resend', async () => {
    estado = 'sin red';
    await expect(controlador().crearConsulta(solicitud())).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('no envía nada si falta la necesidad', async () => {
    await expect(controlador().crearConsulta(solicitud({ mensaje: undefined }))).rejects.toBeInstanceOf(BadRequestException);
    expect(llamadas).toHaveLength(0);
  });
});
