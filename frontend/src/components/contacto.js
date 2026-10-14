/* -------------------------------------------------------------
   Datos de contacto.

   El número y el correo no están en el marcado: llegan por variables
   de entorno de Vite y se reparten al cargar. El HTML sólo trae
   marcadores (`data-wa`, `data-wa-numero`, `data-correo`) y un texto
   de reserva.

   Esto los saca del repositorio, no de la vista: son datos de
   contacto de un sitio público y quien abra la página los verá
   igual. Lo que se evita es que queden escritos en doce lugares del
   código y en el historial de Git.

   Ojo con la diferencia: esto es información pública que se
   centraliza. Un token no va acá ni en ninguna otra variable VITE_,
   porque Vite las escribe literales en el paquete que descarga el
   visitante.

   Sin configurar, se ocultan los enlaces y el botón de WhatsApp.
   ------------------------------------------------------------- */

const env = import.meta.env;

export const CONTACTO = {
  whatsapp: (env.VITE_WHATSAPP || '').replace(/\D/g, ''),
  whatsappVisible: env.VITE_WHATSAPP_VISIBLE || '',
  correo: env.VITE_CORREO || '',
  saludo: env.VITE_MENSAJE_WHATSAPP || 'Hola, quiero conversar un proyecto.',
};

/** Enlace a WhatsApp con un texto ya redactado. '' si no hay número. */
export function enlaceWhatsapp(texto) {
  if (!CONTACTO.whatsapp) return '';
  return `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(texto || CONTACTO.saludo)}`;
}

export function repartirContacto() {
  const destino = enlaceWhatsapp();

  if (destino) {
    document.querySelectorAll('[data-wa]').forEach((a) => {
      a.setAttribute('href', destino);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.setAttribute(
        'aria-label',
        'Escribir por WhatsApp' +
          (CONTACTO.whatsappVisible ? ` al ${CONTACTO.whatsappVisible}` : ''),
      );
    });
  } else {
    document.querySelectorAll('[data-wa]').forEach((a) => a.remove());
    document.querySelector('#btnWhatsapp')?.remove();
  }

  if (CONTACTO.whatsappVisible) {
    document.querySelectorAll('[data-wa-numero]').forEach((el) => {
      el.textContent = CONTACTO.whatsappVisible;
    });
  }

  if (CONTACTO.correo) {
    document.querySelectorAll('[data-correo]').forEach((el) => {
      el.textContent = CONTACTO.correo;
    });
  }
}
