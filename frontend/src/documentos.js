/* -------------------------------------------------------------
   Generador de documentos de demostración (documentos.html).

   La persona elige categoría y plantilla, completa los datos de
   portada y ve las páginas A4 al instante. "Guardar como PDF" usa
   la impresión del navegador: la hoja de estilos de impresión deja
   solo las páginas, a tamaño A4 y sin márgenes.
   ------------------------------------------------------------- */

import { CATEGORIAS } from './documentos/plantillas.js';
import { componer } from './documentos/render.js';

const A4_PX = (210 * 96) / 25.4;
const $ = (s, r = document) => r.querySelector(s);

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function fechaLarga(iso) {
  const [a, m, d] = String(iso || '').split('-').map(Number);
  const fecha = a && m && d ? new Date(a, m - 1, d) : new Date();
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha);
}

function opcion(nombre, valor, contenido, clase) {
  const label = document.createElement('label');
  label.className = clase;
  label.innerHTML = `<input type="radio" name="${nombre}" value="${valor}" />${contenido}`;
  return label;
}

function iniciar() {
  const raiz = $('[data-generador]');
  if (!raiz) return;

  const form = $('#genForm', raiz);
  const cajaCategorias = $('[data-categorias]', raiz);
  const cajaPlantillas = $('[data-plantillas]', raiz);
  const hojas = $('[data-hojas]', raiz);
  const titulo = $('[data-titulo]', raiz);
  const btnZoom = $('[data-zoom]', raiz);
  const btnImprimir = $('[data-imprimir]', raiz);

  const params = new URLSearchParams(window.location.search);
  let categoria = CATEGORIAS.find((c) => c.id === params.get('tipo')) || CATEGORIAS[0];
  let documento = categoria.docs.find((d) => d.id === params.get('doc')) || categoria.docs[0];

  CATEGORIAS.forEach((c) => {
    cajaCategorias.append(opcion('categoria', c.id, `<span>${c.nombre}</span>`, 'gen-chip'));
  });
  const campoFecha = form.elements.fecha;
  campoFecha.value = campoFecha.defaultValue = hoyISO();

  function pintarPlantillas() {
    cajaPlantillas.replaceChildren(
      ...categoria.docs.map((d) =>
        opcion('doc', d.id, `<span class="gen-opcion-texto"><b>${d.nombre}</b><small>${d.resumen}</small></span>`, 'gen-opcion'),
      ),
    );
    form.querySelector(`input[name="doc"][value="${documento.id}"]`).checked = true;
  }

  function datos() {
    const valor = (n, porDefecto) => form.elements[n].value.trim() || porDefecto;
    return {
      empresa: valor('empresa', 'Empresa Demo SpA'),
      responsable: valor('responsable', 'Equipo de proyectos'),
      fecha: fechaLarga(form.elements.fecha.value),
    };
  }

  function escalar() {
    const estilo = getComputedStyle(hojas);
    const ancho = hojas.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
    const real = btnZoom.getAttribute('aria-pressed') === 'true';
    hojas.style.setProperty('--escala', real ? 1 : Math.min(1, Math.max(0.2, ancho / A4_PX)).toFixed(4));
  }

  function pintar() {
    hojas.innerHTML = componer(categoria, documento, datos());
    titulo.textContent = `${documento.titulo} · ${documento.paginas.length} páginas`;
    escalar();
  }

  function recordar() {
    const url = new URL(window.location.href);
    url.searchParams.set('tipo', categoria.id);
    url.searchParams.set('doc', documento.id);
    window.history.replaceState(null, '', url);
  }

  form.querySelector(`input[name="categoria"][value="${categoria.id}"]`).checked = true;
  pintarPlantillas();
  pintar();

  form.addEventListener('change', (e) => {
    if (e.target.name === 'categoria') {
      categoria = CATEGORIAS.find((c) => c.id === e.target.value) || categoria;
      documento = categoria.docs[0];
      pintarPlantillas();
      recordar();
    } else if (e.target.name === 'doc') {
      documento = categoria.docs.find((d) => d.id === e.target.value) || documento;
      recordar();
    }
    pintar();
  });

  /* Los campos de texto actualizan la vista mientras se escribe */
  form.addEventListener('input', (e) => {
    if (e.target.type === 'text') pintar();
  });

  /* "Restablecer" vuelve a los datos de ejemplo, sin cambiar de documento */
  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      form.querySelector(`input[name="categoria"][value="${categoria.id}"]`).checked = true;
      form.querySelector(`input[name="doc"][value="${documento.id}"]`).checked = true;
      pintar();
    });
  });

  btnZoom.addEventListener('click', () => {
    const real = btnZoom.getAttribute('aria-pressed') !== 'true';
    btnZoom.setAttribute('aria-pressed', String(real));
    btnZoom.textContent = real ? 'Ajustar al ancho' : 'Ver a tamaño real';
    hojas.classList.toggle('gen-hojas--real', real);
    escalar();
  });

  /* El nombre del PDF sale del título de la pestaña al imprimir */
  const tituloOriginal = document.title;
  window.addEventListener('beforeprint', () => {
    document.title = `Krateroi - ${documento.titulo} - ${datos().empresa}`;
  });
  window.addEventListener('afterprint', () => {
    document.title = tituloOriginal;
  });
  btnImprimir.addEventListener('click', () => window.print());

  if ('ResizeObserver' in window) new ResizeObserver(escalar).observe(hojas);
  else window.addEventListener('resize', escalar);
}

try {
  iniciar();
} catch (err) {
  console.error('[KRATEROI] Falló el generador de documentos:', err);
}
