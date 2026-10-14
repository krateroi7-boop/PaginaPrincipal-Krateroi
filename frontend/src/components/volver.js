/* -------------------------------------------------------------
   Vuelta desde los documentos legales.

   Los términos y la política de datos se abren desde el formulario en
   esta misma ventana, no en una pestaña nueva: abrir pestañas por
   cuenta propia es justo lo que un visitante no pidió, y en el
   teléfono deja la solicitud enterrada bajo una ventana que hay que
   saber cerrar.

   El precio de eso es que hay que devolver a la persona al punto
   exacto donde estaba. Como el borrador de la solicitud vive en el
   navegador (state/borrador.js), acá sólo hay que decidir a dónde
   apunta el botón: si hay algo a medio llenar, se vuelve al formulario
   con el parámetro que lo reabre; si no, al inicio y punto.

   El botón existe en el marcado con el destino neutro ya puesto, así
   que la página sigue teniendo salida aunque este módulo no cargue.
   ------------------------------------------------------------- */

import { $ } from './ui-helpers.js';
import { borrador } from '../state/borrador.js';

export function iniciarVolver() {
  const boton = $('#volverBtn');
  const flecha = $('#volverFlecha');
  const texto = $('#volverTexto');

  /* index.html no tiene esta barra: el módulo se carga igual en ambas
     páginas y acá se retira sin hacer nada. */
  if (!boton) return;

  const guardado = borrador.leer();
  const paso = parseInt(guardado && guardado.paso, 10);
  if (!guardado || !(paso >= 1 && paso <= 4)) return;

  boton.href = 'index.html?solicitud=retomar#contacto';
  boton.textContent = 'Volver a la solicitud';
  if (flecha) {
    flecha.href = boton.href;
    flecha.setAttribute('aria-label', 'Volver a la solicitud');
  }

  if (texto) {
    texto.hidden = false;
    texto.textContent = `Solicitud: paso ${paso}/4`;
  }
}
