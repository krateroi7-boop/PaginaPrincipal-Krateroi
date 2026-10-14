/* -------------------------------------------------------------
   Comunicación con el backend (API Gateway).

   Reemplaza los dos fetch que el sitio estático hacía desde el
   navegador con credenciales a la vista: el de Telegram para el
   formulario y el de Gemini para el asistente. Acá el navegador
   sólo habla con nuestro backend, que es quien conoce los tokens.

   Nada de este archivo debe conocer una credencial. Si algún día
   hace falta una, va en backend/.env.
   ------------------------------------------------------------- */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/* El formulario responde apenas Telegram acusa recibo. El asistente
   espera a que el modelo razone, y el backend además reintenta los
   500 del proveedor, así que necesita bastante más margen.

   Los 90 s del chat no son un número al voleo: una respuesta del modelo
   tarda entre 21 y 28 s medidos, el backend se da un techo de 75 s con
   sus reintentos dentro y el proxy corta a los 85 s. Este valor tiene
   que ser el mayor de los tres, o el navegador abandonaría una respuesta
   que venía en camino y el visitante vería un error donde no lo hubo.
   Con 45 s pasaba justamente eso en cuanto el backend reintentaba. */
const TIMEOUT_CONSULTA = 10000;
const TIMEOUT_CHAT = 90000;

/* El chat no reintenta desde el navegador: quien reintenta los 500 del
   proveedor es el backend, y hacerlo también acá multiplicaba la espera
   por dos -hasta tres minutos mirando el indicador de escritura- sobre
   un proveedor que ya venía lento. Repetir la consulta del formulario
   tampoco: podría dejar dos avisos iguales en Telegram si el primero
   llegó y se perdió la respuesta. */
const INTENTOS_CHAT = 1;
const ESPERA_MS = 800;

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

/** Nest devuelve `message` como texto o como lista (ValidationPipe). */
function mensajeDeError(datos, porDefecto) {
  if (!datos) return porDefecto;
  const m = datos.message ?? datos.error;
  if (Array.isArray(m)) return m.join(' ');
  return typeof m === 'string' && m.trim() ? m : porDefecto;
}

/* Un error con `status` para que quien llama distinga un 429 (cupo)
   de un 400 (lo que se escribió) o de una caída del servidor. */
function fallo(mensaje, status) {
  const err = new Error(mensaje);
  err.status = status;
  return err;
}

async function pedir(ruta, cuerpo, { timeout, intentos = 1, porDefecto }) {
  let ultimo;

  for (let intento = 1; intento <= intentos; intento++) {
    const controlador = new AbortController();
    const reloj = setTimeout(() => controlador.abort(), timeout);

    try {
      const respuesta = await fetch(BASE_URL + ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
        signal: controlador.signal,
      });

      const datos = await respuesta.json().catch(() => null);

      if (respuesta.ok) return datos ?? {};

      /* Un 5xx puede ser el proveedor de IA con un mal minuto; el
         resto son decisiones del backend y no cambian por insistir. */
      if (respuesta.status >= 500 && intento < intentos) {
        ultimo = fallo(mensajeDeError(datos, porDefecto), respuesta.status);
        await esperar(ESPERA_MS * intento);
        continue;
      }

      throw fallo(mensajeDeError(datos, porDefecto), respuesta.status);
    } catch (err) {
      if (err.status) throw err;

      ultimo =
        err.name === 'AbortError'
          ? fallo('El servidor tardó demasiado en responder. Intenta de nuevo.', 0)
          : fallo('No hubo conexión con el servidor.', 0);

      if (intento >= intentos) throw ultimo;
      await esperar(ESPERA_MS * intento);
    } finally {
      clearTimeout(reloj);
    }
  }

  throw ultimo;
}

/** Solicitud del formulario por etapas. El backend valida, arma el
    resumen y lo publica en Telegram. */
export function enviarConsulta(datos) {
  return pedir('/api/consulta', datos, {
    timeout: TIMEOUT_CONSULTA,
    porDefecto: 'No se pudo enviar la solicitud. Intenta de nuevo.',
  });
}

/** Turno del asistente. Devuelve el texto ya listo para mostrar. */
export async function enviarMensajeChat(messages) {
  const datos = await pedir(
    '/api/chat',
    { messages },
    {
      timeout: TIMEOUT_CHAT,
      intentos: INTENTOS_CHAT,
      porDefecto: 'El asistente no está disponible en este momento.',
    },
  );

  const texto = typeof datos.reply === 'string' ? datos.reply.trim() : '';
  if (!texto) throw fallo('El asistente respondió en un formato inesperado.', 0);

  return texto;
}
