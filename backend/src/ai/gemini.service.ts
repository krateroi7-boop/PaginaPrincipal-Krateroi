import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MensajeChatDto } from '../common/dto/chat.dto';

/* ─────────────────────────────────────────────────────────────
   Asistente de diagnóstico sobre Gemini.

   Misma llamada que antes hacía el navegador con la clave a la
   vista. Se reubica acá para que la clave nunca salga del backend,
   que es la regla del proyecto.

   Tres cosas del proveedor que se aprendieron midiendo y que
   conviene no volver a descubrir:

   1. `generation_config.thinking_level` es un parámetro aceptado
      pero devuelve 500 con cualquier valor válido en este modelo.
      Va omitido a propósito.
   2. El razonamiento consume el presupuesto de salida: con un tope
      bajo la respuesta llega vacía. Por eso va holgado.
   3. El endpoint devuelve 500 intermitentes con frecuencia, de ahí
      los reintentos. El 429 no se reintenta: es cuota, e insistir
      sólo la empeora.
   ───────────────────────────────────────────────────────────── */

const ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/interactions';
const MODELO = 'gemini-3.6-flash';
const MAX_TOKENS = 1200;
const INTENTOS = 3;
const ESPERA_MS = 700;

/* Medido contra el proveedor: una respuesta normal tarda entre 21 y 28
   segundos, porque el razonamiento del modelo entra en ese tiempo. De
   ahí salen los dos números de abajo.

   `TIMEOUT_INTENTO_MS` es holgado respecto de esos 28 s para no cortar
   una respuesta que iba a llegar. `LIMITE_TOTAL_MS` es el techo de todo
   el intercambio, reintentos incluidos: sin él, tres intentos de 40 s
   sumaban dos minutos, más de lo que aguanta el proxy y más de lo que
   Cloudflare deja pasar antes de devolver su propio error 524.

   Antes no había ningún timeout en el fetch: una conexión colgada del
   proveedor bloqueaba la petición indefinidamente. */
const TIMEOUT_INTENTO_MS = 40_000;
const LIMITE_TOTAL_MS = 75_000;

const INSTRUCCION = `
Eres el asistente comercial de Krateroi.

Krateroi es una iniciativa de consultoría y desarrollo tecnológico
orientada principalmente a pequeñas y medianas empresas.

Su objetivo es ayudar a transformar procesos manuales y desconectados
en procesos digitales, integrados y automatizados.

FILOSOFÍA DE KRATEROI:

Diagnosticar el proceso
→ digitalizarlo
→ automatizarlo
→ incorporar inteligencia artificial solamente cuando aporte valor real.

Krateroi puede evaluar soluciones como:

- páginas y sistemas web;
- software a medida;
- CRM;
- ERP modular;
- automatización de procesos;
- integraciones entre sistemas;
- APIs;
- agentes de inteligencia artificial;
- bots conectados a información autorizada.

MinPyme es la propuesta modular de Krateroi orientada a PYMES.

TU FUNCIÓN:

Tu función es realizar un diagnóstico comercial inicial.

Debes entender primero el problema del cliente antes de recomendar una solución.

REGLAS:

1. Responde principalmente en español.

2. Mantén las respuestas relativamente breves.

3. Realiza como máximo una o dos preguntas por respuesta.

4. No asumas inmediatamente que el cliente necesita inteligencia artificial.

5. Si una automatización tradicional, integración o sistema convencional
puede resolver mejor el problema, indícalo.

6. No inventes servicios, capacidades, clientes, precios, plazos ni garantías.

7. No entregues cotizaciones.

8. No prometas que una solución funcionará antes de estudiar el caso.

9. Utiliza expresiones como:
"se podría evaluar",
"una posible alternativa sería",
"habría que revisar el proceso".

10. No solicites contraseñas, datos bancarios, información médica
ni otros datos sensibles.

11. Intenta comprender:

- qué proceso genera el problema;
- cómo se realiza actualmente;
- qué herramientas utiliza la empresa;
- quién realiza la tarea;
- con qué frecuencia ocurre;
- dónde se almacena la información;
- si existen tareas repetitivas;
- si existe duplicación de datos.

12. Cuando tengas información suficiente:

- resume brevemente el problema;
- explica qué tipo de solución podría evaluarse;
- recomienda continuar con una evaluación del equipo de Krateroi.

13. Si el usuario pregunta algo completamente ajeno a Krateroi,
responde brevemente y redirige la conversación hacia problemas
de digitalización, software, integración o automatización.

14. No vendas IA porque sí.
`.trim();

interface PasoGemini {
  type?: string;
  content?: { type?: string; text?: string }[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  constructor(private readonly config: ConfigService) {}

  async responder(messages: MensajeChatDto[]): Promise<string> {
    const conversacion = messages
      .map((m) => `${m.role === 'user' ? 'CLIENTE' : 'ASISTENTE'}: ${m.content.trim()}`)
      .join('\n\n');

    const cuerpo = JSON.stringify({
      model: MODELO,
      store: false,
      system_instruction: INSTRUCCION,
      generation_config: { max_output_tokens: MAX_TOKENS },
      input: [
        'Este es el historial reciente de la conversación:',
        '',
        conversacion,
        '',
        'Responde únicamente como el asistente comercial de Krateroi.',
      ].join('\n'),
    });

    const respuesta = await this.pedirConReintentos(cuerpo);
    const datos: unknown = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      this.logger.error(`Gemini ${respuesta.status}: ${JSON.stringify(datos)}`);

      if (respuesta.status === 429) {
        throw new HttpException(
          'El asistente alcanzó su límite de consultas por ahora. Escríbenos por el formulario y te respondemos igual.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new ServiceUnavailableException(
        'El asistente no está disponible en este momento. Intenta de nuevo en unos segundos.',
      );
    }

    const texto = this.extraerRespuesta(datos);
    if (!texto) {
      this.logger.error(`Gemini respondió sin texto utilizable: ${JSON.stringify(datos)}`);
      throw new ServiceUnavailableException(
        'El asistente respondió en un formato inesperado.',
      );
    }
    return texto;
  }

  private async pedirConReintentos(cuerpo: string): Promise<Response> {
    const clave = this.config.get<string>('GEMINI_API_KEY');
    const inicio = Date.now();
    let ultimoFallo: Error | null = null;

    for (let intento = 1; intento <= INTENTOS; intento++) {
      /* Lo que queda del presupuesto total. Un intento nuevo sólo sale
         si alcanza a completarse dentro de él; si no, se corta acá en
         vez de dejar al visitante esperando un reintento que el proxy
         va a cortar igual. */
      const restante = LIMITE_TOTAL_MS - (Date.now() - inicio);
      if (restante <= 1_000) break;

      try {
        const respuesta = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': clave ?? '',
          },
          body: cuerpo,
          signal: AbortSignal.timeout(Math.min(TIMEOUT_INTENTO_MS, restante)),
        });

        if (respuesta.status < 500) return respuesta;

        ultimoFallo = new Error(`HTTP ${respuesta.status}`);
        if (intento === INTENTOS) return respuesta;
      } catch (err) {
        /* Timeout del intento o caída de red. El 429 no llega acá: es
           un status, no una excepción, y no se reintenta. */
        ultimoFallo = err as Error;
        this.logger.warn(
          `Gemini, intento ${intento} de ${INTENTOS}: ${ultimoFallo.message}`,
        );
      }

      await new Promise((listo) => setTimeout(listo, ESPERA_MS * intento));
    }

    this.logger.error(
      `Gemini agotó el presupuesto de ${LIMITE_TOTAL_MS} ms: ${ultimoFallo?.message ?? 'sin detalle'}`,
    );
    throw new ServiceUnavailableException(
      'El asistente no está disponible en este momento. Intenta de nuevo en unos segundos.',
    );
  }

  /* La respuesta llega como una lista de pasos: interesa el último
     bloque de texto del modelo, no los pasos de razonamiento. */
  private extraerRespuesta(datos: unknown): string | null {
    if (!datos || typeof datos !== 'object') return null;
    const pasos = (datos as { steps?: PasoGemini[] }).steps;
    if (!Array.isArray(pasos)) return null;

    for (let i = pasos.length - 1; i >= 0; i--) {
      const paso = pasos[i];
      if (paso?.type !== 'model_output' || !Array.isArray(paso.content)) continue;

      const texto = paso.content
        .filter((c) => c?.type === 'text' && typeof c.text === 'string')
        .map((c) => c.text)
        .join('\n')
        .trim();

      if (texto) return texto;
    }
    return null;
  }
}
