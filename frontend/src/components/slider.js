/* -------------------------------------------------------------
   Slides de "Apoyo digital y técnico" y "Apoyo legal".

   El carril es un contenedor con scroll-snap: sin JavaScript se
   desliza con el dedo o la rueda y se lee completo. Este módulo sólo
   agrega flechas, puntos y contador, y marca la diapositiva activa.
   ------------------------------------------------------------- */

import { $, $$, sinMovimiento } from './ui-helpers.js';

function armar(slider) {
  const carril = $('.slider-track', slider);
  const slides = $$('.slide', carril);
  if (!carril || slides.length < 2) return;

  const puntos = $('[data-puntos]', slider);
  const cuenta = $('[data-cuenta]', slider);
  const anterior = $('[data-anterior]', slider);
  const siguiente = $('[data-siguiente]', slider);
  const total = slides.length;
  let actual = 0;
  let pendiente = false;

  const botones = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slider-punto';
    b.setAttribute('aria-label', `Ir a la ${i + 1} de ${total}`);
    b.addEventListener('click', () => ir(i));
    puntos?.appendChild(b);
    return b;
  });

  function ir(i) {
    const destino = slides[(i + total) % total];
    const izquierda = destino.offsetLeft - (carril.clientWidth - destino.offsetWidth) / 2;
    carril.scrollTo({ left: izquierda, behavior: sinMovimiento ? 'auto' : 'smooth' });
  }

  function marcar() {
    pendiente = false;
    const centro = carril.scrollLeft + carril.clientWidth / 2;
    let mejor = 0;
    let distancia = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - centro);
      if (d < distancia) {
        distancia = d;
        mejor = i;
      }
    });
    actual = mejor;
    slides.forEach((s, i) => s.classList.toggle('activa', i === actual));
    botones.forEach((b, i) => b.setAttribute('aria-current', i === actual ? 'true' : 'false'));
    if (cuenta) cuenta.textContent = `${actual + 1} / ${total}`;
  }

  carril.addEventListener(
    'scroll',
    () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(marcar);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', () => ir(actual));

  anterior?.addEventListener('click', () => ir(actual - 1));
  siguiente?.addEventListener('click', () => ir(actual + 1));

  carril.addEventListener('keydown', (e) => {
    const salto = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!salto) return;
    e.preventDefault();
    ir(actual + salto);
  });

  // Una diapositiva vecina asomada al costado también lleva a ella
  slides.forEach((s, i) => {
    s.addEventListener('click', () => {
      if (i !== actual) ir(i);
    });
  });

  slider.classList.add('listo');
  marcar();
}

export function iniciarSliders() {
  $$('[data-slider]').forEach(armar);
}
