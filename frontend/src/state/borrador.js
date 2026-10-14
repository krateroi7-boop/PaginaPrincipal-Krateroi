/* -------------------------------------------------------------
   Borrador de la solicitud.

   El formulario tiene cuatro pasos y se abre sobre la página, así que
   es fácil cerrarlo sin querer, cambiar de pestaña o irse a buscar un
   dato y volver. Lo que se lleva escrito queda acá para poder
   retomarlo en el mismo paso en que se dejó.

   Va en localStorage y no en sessionStorage a propósito: la gracia es
   justamente sobrevivir al cierre de la pestaña. Caduca sola a los
   siete días para no dejar datos de contacto olvidados en el equipo,
   y se borra completa apenas la solicitud se envía.

   Nada de esto viaja a ninguna parte: el borrador vive sólo en el
   navegador de quien lo escribió.
   ------------------------------------------------------------- */

const CLAVE = 'kr.borrador';

/* Siete días: suficiente para "lo veo el lunes", poco para que un
   correo y un teléfono queden años en un equipo compartido. */
const VIGENCIA = 7 * 24 * 60 * 60 * 1000;

export const borrador = {
  /** El borrador vigente, o null si no hay, caducó o está ilegible. */
  leer() {
    let crudo = null;
    try {
      crudo = localStorage.getItem(CLAVE);
    } catch {
      /* almacenamiento bloqueado (modo privado): se sigue sin borrador */
      return null;
    }
    if (!crudo) return null;

    let guardado;
    try {
      guardado = JSON.parse(crudo);
    } catch {
      borrador.limpiar();
      return null;
    }

    if (!guardado || typeof guardado !== 'object') return null;
    if (!guardado.fecha || Date.now() - guardado.fecha > VIGENCIA) {
      borrador.limpiar();
      return null;
    }
    return guardado;
  },

  guardar(estado) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ ...estado, fecha: Date.now() }));
    } catch {
      /* sin espacio o sin permiso: el formulario funciona igual */
    }
  },

  limpiar() {
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      /* ver leer() */
    }
  },
};
