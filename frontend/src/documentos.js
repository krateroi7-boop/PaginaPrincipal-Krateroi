/* -------------------------------------------------------------
   Generador de documentos de demostración (documentos.html).

   Usa la misma plantilla que el informe PDF del formulario de
   contacto (lib/informe-pdf.js). La vista previa se dibuja en SVG con
   los mismos trazos que el PDF, así que lo que se ve es lo que se
   descarga. Los contenidos son genéricos y solo muestran el formato.
   ------------------------------------------------------------- */

import { CATEGORIAS } from './documentos/plantillas.js';
import { maquetar } from './documentos/maquetar.js';
import { descargarInforme } from './lib/informe-pdf.js';

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
  const btnDescargar = $('[data-descargar]', raiz);
  const estado = $('[data-estado]', raiz);

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

  /* Cada cambio arma de nuevo; si llegan dos seguidos, gana el último */
  let turno = 0;
  async function pintar() {
    const mio = ++turno;
    try {
      const p = await maquetar(categoria, documento, datos());
      if (mio !== turno) return;
      const total = p.paginas.length;
      hojas.innerHTML = p.paginas.map((_, i) => p.svg(i, `${documento.titulo}, página ${i + 1} de ${total}`)).join('');
      titulo.textContent = `${documento.titulo} · ${total} ${total === 1 ? 'página' : 'páginas'}`;
    } catch (err) {
      console.error('[KRATEROI] No se pudo armar la vista previa:', err);
    }
  }

  let espera = 0;
  const pintarLuego = () => {
    window.clearTimeout(espera);
    espera = window.setTimeout(pintar, 120);
  };

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

  form.addEventListener('input', (e) => {
    if (e.target.type === 'text') pintarLuego();
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
  });

  btnDescargar.addEventListener('click', async () => {
    btnDescargar.disabled = true;
    estado.textContent = 'Preparando el PDF…';
    try {
      const p = await maquetar(categoria, documento, datos());
      descargarInforme(await p.pdf(), `krateroi-${documento.id}-demostracion.pdf`);
      estado.textContent = 'Listo: el PDF se descargó.';
    } catch (err) {
      console.error('[KRATEROI] No se pudo crear el PDF de demostración:', err);
      estado.textContent = 'No se pudo crear el PDF. Inténtalo de nuevo.';
    } finally {
      btnDescargar.disabled = false;
    }
  });
}

try {
  iniciar();
} catch (err) {
  console.error('[KRATEROI] Falló el generador de documentos:', err);
}
