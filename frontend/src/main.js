/* -------------------------------------------------------------
   Punto de entrada del sitio.

   Sólo arma los componentes; la lógica vive en components/. Cada
   uno comprueba que sus elementos existan, así que este mismo
   archivo sirve para index.html y para terminos.html.

   Todo lo que hay acá es opcional: si el módulo no carga, la página
   se sigue leyendo completa. Por eso el CSS base y el marcado no
   dependen de JavaScript, y por eso el arranque va dentro de un
   try: un fallo en un componente no puede llevarse los demás.
   ------------------------------------------------------------- */

import { iniciarNavegacion } from './components/navegacion.js';
import { repartirContacto } from './components/contacto.js';
import { iniciarSolicitud } from './components/solicitud.js';
import { iniciarVolver } from './components/volver.js';
import { iniciarChat } from './components/chat-widget.js';

function arrancar(nombre, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[KRATEROI] Falló ${nombre}:`, err);
  }
}

function iniciar() {
  arrancar('los datos de contacto', repartirContacto);
  arrancar('la navegación', iniciarNavegacion);
  arrancar('la solicitud por etapas', iniciarSolicitud);
  arrancar('la vuelta desde los documentos', iniciarVolver);
  arrancar('el asistente', iniciarChat);
}

/* El script es un módulo, así que ya va diferido; el DOM está listo
   salvo que alguien lo cargue a mano antes de tiempo. */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
