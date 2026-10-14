/* -------------------------------------------------------------
   Comportamiento de la página: avance de lectura, menú móvil,
   revelado al entrar en pantalla, cifras que cuentan, pestañas de
   condiciones y acordeón de preguntas.

   Todo es opcional y todo comprueba que su elemento exista: las dos
   páginas del sitio comparten este módulo y ninguna tiene todas las
   piezas. Si algo de acá falla, la página se sigue leyendo entera.
   ------------------------------------------------------------- */

import { $, $$, raiz, sinMovimiento, ocultarSvg, contar } from './ui-helpers.js';

function avanceDeLectura() {
  const progreso = $('#progreso');
  const btnArriba = $('#btnArriba');
  const enlaces = $$('.topbar-nav a');
  const secciones = enlaces.map((a) => $(a.getAttribute('href')));
  let pendiente = false;

  function alDesplazar() {
    const y = window.scrollY || window.pageYOffset;
    const alto = raiz.scrollHeight - window.innerHeight;
    const avance = alto > 0 ? Math.min(100, Math.max(0, (y / alto) * 100)) : 0;

    if (progreso) progreso.style.width = `${avance}%`;

    if (btnArriba) {
      // Aparece pasada una pantalla; el anillo replica el avance
      btnArriba.classList.toggle('visible', y > window.innerHeight * 0.8);
      btnArriba.style.setProperty('--avance', avance.toFixed(1));
    }

    let actual = -1;
    secciones.forEach((seccion, i) => {
      if (seccion && seccion.getBoundingClientRect().top <= window.innerHeight * 0.35) actual = i;
    });
    enlaces.forEach((a, i) => a.classList.toggle('active', i === actual));
    pendiente = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!pendiente) {
        pendiente = true;
        window.requestAnimationFrame(alDesplazar);
      }
    },
    { passive: true },
  );
  alDesplazar();

  if (btnArriba) {
    btnArriba.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
      // Devuelve el foco al encabezado para que el teclado no quede al pie
      const marca = $('.topbar .brand');
      if (marca) marca.focus({ preventScroll: true });
    });
  }
}

function menuMovil() {
  const btnMenu = $('#btnMenu');
  const menu = $('#menuMovil');
  if (!btnMenu || !menu) return;

  const iconoMenu = $('.i-menu', btnMenu);
  const iconoCerrar = $('.i-close', btnMenu);

  const abrir = (si) => {
    menu.classList.toggle('open', si);
    btnMenu.setAttribute('aria-expanded', si ? 'true' : 'false');
    btnMenu.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
    ocultarSvg(iconoMenu, si);
    ocultarSvg(iconoCerrar, !si);
  };

  btnMenu.addEventListener('click', () => abrir(!menu.classList.contains('open')));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) abrir(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      abrir(false);
      btnMenu.focus();
    }
  });
}

function revelado() {
  const revelables = $$('.reveal');

  if ('IntersectionObserver' in window && !sinMovimiento) {
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    revelables.forEach((el) => obs.observe(el));
  } else {
    revelables.forEach((el) => el.classList.add('in'));
  }
}

function cifras() {
  const tickers = $$('.ticker');
  if (!tickers.length || !('IntersectionObserver' in window) || sinMovimiento) return;

  const obs = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        contar(e.target, parseInt(e.target.getAttribute('data-cuenta'), 10) || 0);
      });
    },
    { threshold: 0.6 },
  );
  tickers.forEach((el) => obs.observe(el));
}

function pestanas() {
  const tabs = $$('.tab');
  if (!tabs.length) return;

  function elegir(idx, enfocar) {
    tabs.forEach((t, i) => {
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      const activa = i === idx;
      t.setAttribute('aria-selected', activa ? 'true' : 'false');
      t.setAttribute('tabindex', activa ? '0' : '-1');
      if (panel) panel.hidden = !activa;
    });
    if (enfocar) tabs[idx].focus();
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => elegir(i));
    t.addEventListener('keydown', (e) => {
      const salto = { ArrowRight: 1, ArrowLeft: -1, Home: 'inicio', End: 'fin' }[e.key];
      if (salto === undefined) return;
      e.preventDefault();

      const destino =
        salto === 'inicio'
          ? 0
          : salto === 'fin'
            ? tabs.length - 1
            : (i + salto + tabs.length) % tabs.length;
      elegir(destino, true);
    });
  });
}

function preguntas() {
  $$('.faq-item').forEach((item) => {
    const btn = $('.faq-q', item);
    const cuerpo = $('.faq-a', item);
    if (!btn || !cuerpo) return;

    btn.addEventListener('click', () => {
      const abierto = item.classList.contains('open');

      $$('.faq-item.open').forEach((otro) => {
        otro.classList.remove('open');
        $('.faq-q', otro).setAttribute('aria-expanded', 'false');
        $('.faq-a', otro).style.height = '0px';
      });

      if (!abierto) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        cuerpo.style.height = `${cuerpo.scrollHeight}px`;
      }
    });
  });

  /* Recalcula la altura del panel abierto si cambia el ancho */
  window.addEventListener('resize', () => {
    const abierto = $('.faq-item.open .faq-a');
    if (abierto) abierto.style.height = `${abierto.scrollHeight}px`;
  });
}

function anioDelPie() {
  const anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();
}

export function iniciarNavegacion() {
  avanceDeLectura();
  menuMovil();
  revelado();
  cifras();
  pestanas();
  preguntas();
  anioDelPie();
}
