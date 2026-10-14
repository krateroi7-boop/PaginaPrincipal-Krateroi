/* -------------------------------------------------------------
   Filtro de entrada.

   El formulario y el asistente aceptan texto natural y nada más: ni
   enlaces, ni archivos, ni marcado, ni emojis, ni instrucciones
   dirigidas al agente.

   Esta es la primera barrera, no la única. El navegador es del
   visitante y todo esto se salta desde la consola: las mismas reglas
   están en backend/src/common/validation/texto-natural.validator.ts,
   que es la que decide. Si cambias una, cambia la otra.
   ------------------------------------------------------------- */

/* Enlaces en cualquiera de sus formas */
const PROTOCOLO = /\b[a-z][a-z0-9+.-]*:\/\//i;
const ESQUEMA = /\b(javascript|data|vbscript|file|ftp|blob)\s*:/i;
const DOMINIO = /(^|[\s(¡¿"'])(www\.|[a-z0-9][a-z0-9-]*\.(com|net|org|cl|io|dev|ai|app|co|es|mx|ar|pe|br|us|uk|eu|info|biz|xyz|link|site|online|shop|store|me|tv|gg|ly|to|cc))\b/i;
const IP = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

/* Imágenes, video, audio y ejecutables nombrados como archivo */
const ARCHIVO = /\b[\w-]+\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|mp4|mov|avi|webm|mkv|m4v|mp3|wav|ogg|flac|exe|msi|bat|cmd|sh|apk|dmg)\b/i;

/* Caracteres de control e invisibles: sirven para esconder
   instrucciones dentro de un texto que parece normal. */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/;
const CONTROL_G = new RegExp(CONTROL.source, 'g');

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;

/* Lo único que se acepta: letras latinas con sus tildes, cifras,
   espacios y la puntuación de un texto corriente. Fuera quedan
   < > [ ] { } | \ ` ~ ^, que son justo los de marcado e inyección. */
const PERMITIDO = /^[\p{Script=Latin}\p{Mark}0-9\s.,;:()¿?¡!'"\u00AB\u00BB%$&@#/+\-\u2013\u2014_*=\u00B0\u00BA\u00AA]*$/u;

/* Intentos de reescribir el papel del agente. Los patrones piden
   verbo y objeto juntos: "contraseña" a secas es una palabra
   legítima en la descripción de un proceso. */
const INYECCION = [
  /\b(ignora|olvida|omite|descarta|desestima|salta|anula)\b[^.\n]{0,45}\b(instruccion|instrucciones|reglas|indicaciones|contexto|prompt|sistema|anterior|previo)/i,
  /\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,45}\b(instruction|instructions|rules|prompt|system|previous|above)/i,
  /\b(act(u|ú)a|comp(o|ó)rtate|finge|simula|responde)\b[^.\n]{0,25}\bcomo\b[^.\n]{0,35}\b(si|un|una|otro|otra|fueras)\b/i,
  /\b(act as|pretend to be|you are now|from now on|roleplay|new instructions|system prompt)\b/i,
  /\b(eres|ser(a|á)s)\b[^.\n]{0,20}\b(ahora|a partir de ahora|de ahora en adelante)\b/i,
  /\b(a partir de ahora|de ahora en adelante)\b[^.\n]{0,20}\b(eres|ser(a|á)s|responde|act(u|ú)a)\b/i,
  /\b(jailbreak|dan mode|modo dan|modo desarrollador|developer mode|sudo mode|modo dios|god mode)\b/i,
  /\b(dame|dime|entrega|muestra|mu(e|é)strame|revela|comparte|repite|imprime|cu(a|á)l es|cu(a|á)les son)\b[^.\n]{0,45}\b(api ?key|clave|token|credencial|contrase(n|ñ)a|password|secreto|prompt|instrucciones|system)\b/i,
  /^\s*(system|assistant|user|human|sistema|asistente|cliente)\s*:/im
];

export function revisar(valor, max) {
  const t = String(valor ?? '');

  if (!t.trim()) return { ok: false, motivo: 'quedó vacío' };
  if (max && t.length > max) return { ok: false, motivo: `supera los ${max} caracteres` };
  if (CONTROL.test(t)) return { ok: false, motivo: 'trae caracteres invisibles' };

  if (PROTOCOLO.test(t) || ESQUEMA.test(t) || DOMINIO.test(t) || IP.test(t)) {
    return { ok: false, motivo: 'incluye enlaces, y acá sólo recibimos texto: cuéntanoslo con palabras' };
  }
  if (ARCHIVO.test(t)) {
    return { ok: false, motivo: 'menciona archivos; no recibimos imágenes ni video por este medio' };
  }
  if (EMOJI.test(t)) return { ok: false, motivo: 'trae emojis' };
  if (!PERMITIDO.test(t)) return { ok: false, motivo: 'trae símbolos que no usamos' };

  for (const patron of INYECCION) {
    if (patron.test(t)) {
      return { ok: false, motivo: 'parece un intento de cambiar las instrucciones del asistente' };
    }
  }
  return { ok: true, motivo: '' };
}

export function correoValido(v) {
  const t = String(v || '').trim();
  if (!/^[^\s@<>()[\]\\,;:]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(t)) return false;
  return t.length <= 120 && !CONTROL.test(t) && !EMOJI.test(t);
}

export function telefonoValido(v) {
  const t = String(v || '').trim();
  if (t === '') return true;
  if (!/^[+(]?[\d][\d\s\-().+]{5,24}$/.test(t)) return false;

  /* El formato varía demasiado entre países como para exigir uno:
     importa que sean dígitos y que la cantidad tenga sentido. */
  const digitos = t.replace(/\D/g, '');
  return digitos.length >= 7 && digitos.length <= 15;
}

/* Pegar y soltar: se queda sólo con el texto plano. Así una imagen
   del portapapeles o un archivo arrastrado no entran al campo ni
   como marcado ni como nombre de archivo. */
export function protegerCampo(el, alRechazar) {
  if (!el) return;

  el.addEventListener('paste', (e) => {
    const dt = e.clipboardData;
    if (!dt) return;

    const plano = dt.getData('text/plain') || '';
    const traeArchivos = dt.files && dt.files.length;

    e.preventDefault();

    if (traeArchivos || !plano) {
      if (alRechazar) alRechazar('Sólo se puede pegar texto.');
      return;
    }

    let limpio = plano.replace(CONTROL_G, '').replace(/\r\n?/g, '\n');
    const inicio = el.selectionStart ?? el.value.length;
    const fin = el.selectionEnd ?? el.value.length;
    const maximo = parseInt(el.getAttribute('maxlength'), 10) || Infinity;

    limpio = limpio.slice(0, Math.max(0, maximo - (el.value.length - (fin - inicio))));
    el.value = el.value.slice(0, inicio) + limpio + el.value.slice(fin);
    el.selectionStart = el.selectionEnd = inicio + limpio.length;

    /* El pegado programático no dispara 'input' y el formulario lo
       escucha para limpiar el estado de error. */
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  el.addEventListener('dragover', (e) => e.preventDefault());
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    if (alRechazar) alRechazar('No se pueden soltar archivos acá.');
  });
}
