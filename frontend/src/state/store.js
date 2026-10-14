/* -------------------------------------------------------------
   Estado en memoria y en el navegador.

   Dos cosas viven acá:

   1. El cupo de uso por sesión y por día, atado a una huella del
      dispositivo (pantalla, idioma, zona horaria, núcleos). No
      identifica a la persona: sólo distingue un navegador de otro
      para que un mismo equipo no dispare cientos de consultas.

      Es un freno de cortesía: se limpia borrando el almacenamiento.
      El límite que de verdad contiene un abuso es el de IP, y ese
      está en el backend (@nestjs/throttler), que sí ve la dirección
      real.

   2. El historial de la conversación. Va en sessionStorage a
      propósito: la conversación es de esta pestaña y no tiene por
      qué sobrevivirla.
   ------------------------------------------------------------- */

function hash(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) {
    h ^= txt.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h.toString(36);
}

export const huella = hash(
  [
    navigator.userAgent || '',
    navigator.language || '',
    navigator.platform || '',
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
  ].join('|'),
);

/* El almacenamiento puede estar bloqueado (modo privado, cookies de
   terceros): nada de esto puede tumbar la página. */
function leer(almacen, clave) {
  try {
    return JSON.parse(almacen.getItem(clave) || 'null');
  } catch {
    return null;
  }
}

function guardar(almacen, clave, valor) {
  try {
    almacen.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin espacio o sin permiso: se sigue sin persistir */
  }
}

const hoy = () => new Date().toISOString().slice(0, 10);

function diaDe(nombre) {
  const dia = leer(localStorage, `kr.${nombre}.${huella}`);
  return !dia || dia.fecha !== hoy() ? { fecha: hoy(), n: 0, ultimo: 0 } : dia;
}

export const limites = {
  huella,

  /** Devuelve { ok, motivo } sin consumir cupo. */
  consultar(nombre, tope) {
    const dia = diaDe(nombre);
    const sesion = leer(sessionStorage, `kr.s.${nombre}`) || { n: 0 };

    if (tope.espera && dia.ultimo && Date.now() - dia.ultimo < tope.espera) {
      const faltan = Math.ceil((tope.espera - (Date.now() - dia.ultimo)) / 1000);
      return {
        ok: false,
        motivo: `Espera ${faltan} segundo${faltan === 1 ? '' : 's'} antes de volver a enviar.`,
      };
    }
    if (tope.sesion && sesion.n >= tope.sesion) return { ok: false, motivo: tope.mensajeSesion };
    if (tope.dia && dia.n >= tope.dia) return { ok: false, motivo: tope.mensajeDia };

    return { ok: true, motivo: '' };
  },

  anotar(nombre) {
    const dia = diaDe(nombre);
    dia.n += 1;
    dia.ultimo = Date.now();
    guardar(localStorage, `kr.${nombre}.${huella}`, dia);

    const sesion = leer(sessionStorage, `kr.s.${nombre}`) || { n: 0 };
    sesion.n += 1;
    guardar(sessionStorage, 'kr.s.' + nombre, sesion);
  },
};

/* -- HISTORIAL DE LA CONVERSACIÓN ---------------------------- */

const CLAVE_CHAT = 'kr.chat';

/* Sólo los últimos turnos viajan en cada petición: la conversación
   completa encarecería la llamada sin mejorar la respuesta. El
   backend rechaza más de doce. */
export const VENTANA_CHAT = 12;

export const historial = {
  leer() {
    const guardado = leer(sessionStorage, CLAVE_CHAT);
    return Array.isArray(guardado) ? guardado : [];
  },

  agregar(role, content) {
    const mensajes = historial.leer();
    mensajes.push({ role, content });
    guardar(sessionStorage, CLAVE_CHAT, mensajes.slice(-40));
    return mensajes;
  },

  /** La ventana que se manda al backend. */
  recientes() {
    return historial.leer().slice(-VENTANA_CHAT);
  },

  limpiar() {
    try {
      sessionStorage.removeItem(CLAVE_CHAT);
    } catch {
      /* ver leer() */
    }
  },
};
