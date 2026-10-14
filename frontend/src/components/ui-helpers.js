/* -------------------------------------------------------------
   Piezas sueltas que usan todos los componentes: selectores,
   preferencia de movimiento y el par de rarezas del DOM con las
   que este sitio ya tropezó.
   ------------------------------------------------------------- */

export const raiz = document.documentElement;

export const $ = (sel, ctx) => (ctx || document).querySelector(sel);
export const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

export const sinMovimiento =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* `hidden` es propiedad de HTMLElement y SVGElement no la hereda:
   asignarla a un <svg> no toca el atributo y el icono se queda a la
   vista. Va por setAttribute. */
export function ocultarSvg(el, oculto) {
  if (!el) return;
  if (oculto) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

/* requestSubmit no existe en todos los navegadores en uso; el evento
   despachado a mano corre los mismos manejadores. */
export function enviarFormulario(form) {
  if (!form) return;
  if (typeof form.requestSubmit === 'function') form.requestSubmit();
  else form.dispatchEvent(new Event('submit', { cancelable: true }));
}

/* Texto plano siempre: la respuesta del asistente y lo que escribe
   el visitante nunca se insertan como marcado. */
export function burbuja(clase, texto) {
  const el = document.createElement('div');
  el.className = clase;
  el.textContent = texto;
  return el;
}

/* Animación de conteo de las cifras de portada. */
export function contar(el, destino) {
  if (destino === 0) {
    el.textContent = '0';
    return;
  }
  const inicio = performance.now();
  const duracion = 900;

  (function paso(ahora) {
    const t = Math.min(1, (ahora - inicio) / duracion);
    const suave = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(destino * suave);
    if (t < 1) requestAnimationFrame(paso);
  })(inicio);
}
