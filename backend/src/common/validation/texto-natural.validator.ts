/* ─────────────────────────────────────────────────────────────
   Filtro de entrada.

   El formulario y el asistente aceptan texto natural y nada más. Se
   rechazan cinco familias: enlaces, archivos de imagen o video,
   emojis y símbolos de marcado, caracteres invisibles e
   instrucciones dirigidas al agente.

   Las mismas reglas están en frontend/src/lib/texto.js para avisar
   antes de enviar. Esa copia es cortesía; ésta es la que decide,
   porque el navegador es del visitante y su validación se salta
   desde la consola. Si cambias una, cambia la otra.
   ───────────────────────────────────────────────────────────── */

import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/** Enlaces en cualquiera de sus formas */
const PROTOCOLO = /\b[a-z][a-z0-9+.-]*:\/\//i;
const ESQUEMA = /\b(javascript|data|vbscript|file|ftp|blob)\s*:/i;
const DOMINIO =
  /(^|[\s(¡¿"'])(www\.|[a-z0-9][a-z0-9-]*\.(com|net|org|cl|io|dev|ai|app|co|es|mx|ar|pe|br|us|uk|eu|info|biz|xyz|link|site|online|shop|store|me|tv|gg|ly|to|cc))\b/i;
const IP = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

/** Imágenes, video, audio y ejecutables nombrados como archivo */
const ARCHIVO =
  /\b[\w-]+\.(jpe?g|png|gif|webp|svg|bmp|ico|avif|mp4|mov|avi|webm|mkv|m4v|mp3|wav|ogg|flac|exe|msi|bat|cmd|sh|apk|dmg)\b/i;

/** Caracteres de control e invisibles: sirven para esconder
    instrucciones dentro de un texto que parece normal. */
const CONTROL =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/;

const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{2BFF}\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}/u;

/** Lo único que se acepta: letras latinas con sus tildes, cifras,
    espacios y la puntuación de un texto corriente. Fuera quedan
    < > [ ] { } | \ ` ~ ^, que son justo los de marcado e inyección. */
const PERMITIDO =
  /^[\p{Script=Latin}\p{Mark}0-9\s.,;:()¿?¡!'"«»%$&@#/+\-–—_*=°ºª]*$/u;

/** Intentos de reescribir el papel del agente. Los patrones piden
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
  /^\s*(system|assistant|user|human|sistema|asistente|cliente)\s*:/im,
];

export interface Revision {
  ok: boolean;
  motivo: string;
}

export function revisarTexto(valor: unknown): Revision {
  const t = String(valor ?? '');

  if (!t.trim()) return { ok: false, motivo: 'quedó vacío' };
  if (CONTROL.test(t)) return { ok: false, motivo: 'trae caracteres invisibles' };

  if (PROTOCOLO.test(t) || ESQUEMA.test(t) || DOMINIO.test(t) || IP.test(t)) {
    return {
      ok: false,
      motivo: 'incluye enlaces, y acá sólo recibimos texto: cuéntanoslo con palabras',
    };
  }
  if (ARCHIVO.test(t)) {
    return {
      ok: false,
      motivo: 'menciona archivos; no recibimos imágenes ni video por este medio',
    };
  }
  if (EMOJI.test(t)) return { ok: false, motivo: 'trae emojis' };
  if (!PERMITIDO.test(t)) return { ok: false, motivo: 'trae símbolos que no usamos' };

  for (const patron of INYECCION) {
    if (patron.test(t)) {
      return {
        ok: false,
        motivo: 'parece un intento de cambiar las instrucciones del asistente',
      };
    }
  }
  return { ok: true, motivo: '' };
}

/**
 * Decorador para los DTO. El mensaje de error repite el motivo, así
 * que el visitante entiende qué corregir en vez de recibir un
 * "campo inválido" que no le dice nada.
 */
export function EsTextoNatural(opciones?: ValidationOptions) {
  return function (objeto: object, propiedad: string) {
    registerDecorator({
      name: 'esTextoNatural',
      target: objeto.constructor,
      propertyName: propiedad,
      options: opciones,
      validator: {
        validate(valor: unknown) {
          /* Los campos opcionales vacíos los deja pasar @IsOptional;
             acá sólo llega lo que hay que revisar. */
          return revisarTexto(valor).ok;
        },
        defaultMessage(args: ValidationArguments) {
          return `El campo ${args.property} ${revisarTexto(args.value).motivo}.`;
        },
      },
    });
  };
}
