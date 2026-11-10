/* -------------------------------------------------------------
   Arma las páginas A4 de un documento de demostración con el
   formato del informe técnico de Krateroi.

   Todo el texto pasa por esc(): lo que escribe la persona en el
   formulario nunca llega como HTML.
   ------------------------------------------------------------- */

const LOGO = '/assets/images/krateroi-logo-h.png';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const dos = (n) => String(n).padStart(2, '0');

/* Niveles de las etiquetas de estado, siempre dentro de la paleta azul */
const NIVEL = {
  alto: 'fuerte', alta: 'fuerte', 'atención': 'fuerte', pendiente: 'fuerte',
  medio: 'medio', media: 'medio', 'en curso': 'medio',
};
const nivel = (v) => NIVEL[String(v).toLowerCase()] || 'suave';

function cabeza(b, t) {
  if (!b.titulo) return '';
  return `<h3 class="kd-sec-head"><span class="kd-num">${esc(b.n)}</span>${t(b.titulo)}</h3>`;
}

function tabla({ cols, filas, total }, t) {
  const clase = (c) => (c?.der ? ' class="kd-der"' : '');
  const celda = (c, v) => (c?.estado ? `<span class="kd-estado" data-nivel="${nivel(v)}">${t(v)}</span>` : t(v));
  const th = cols.map((c) => `<th${clase(c)}${c.w ? ` style="width:${c.w}"` : ''}>${t(c.h)}</th>`).join('');
  const fila = (f, extra = '') =>
    `<tr${extra}>${f.map((v, i) => `<td${clase(cols[i])}>${extra ? t(v) : celda(cols[i], v)}</td>`).join('')}</tr>`;
  return `<table class="kd-tabla"><thead><tr>${th}</tr></thead><tbody>${filas.map((f) => fila(f)).join('')}${
    total ? fila(total, ' class="kd-total"') : ''
  }</tbody></table>`;
}

const BLOQUES = {
  texto: (b, t) => [].concat(b.cuerpo).map((p) => `<p class="kd-body">${t(p)}</p>`).join(''),

  tabla: (b, t) => `${tabla(b, t)}${b.nota ? `<p class="kd-note">${t(b.nota)}</p>` : ''}`,

  rejilla: (b, t) =>
    `<div class="kd-rejilla">${b.items
      .map(([h, p], i) => `<div class="kd-celda"><span class="kd-num">${dos(i + 1)}</span><h4>${t(h)}</h4><p>${t(p)}</p></div>`)
      .join('')}</div>`,

  lista: (b, t) =>
    `<ol class="kd-lista">${b.items
      .map(([h, p], i) => `<li><span class="kd-n">${(b.inicio || 1) + i}</span><div><h4>${t(h)}</h4><p>${t(p)}</p></div></li>`)
      .join('')}</ol>`,

  kpis: (b, t) =>
    `<div class="kd-kpis">${b.items.map(([v, l]) => `<div><b>${t(v)}</b><span>${t(l)}</span></div>`).join('')}</div>`,

  firmas: (b, t) =>
    `<p class="kd-body">${t(b.lugar)}</p><div class="kd-firmas">${b.partes
      .map(([nombre, rol]) => `<div><span class="kd-linea"></span><b>${t(nombre)}</b><span>${t(rol)}</span></div>`)
      .join('')}</div>`,

  tarjeta: (b, t) => {
    const cifra = b.cifra
      ? `<div class="kd-alt-cifra"><small>${t(b.cifra[0])}</small><b>${t(b.cifra[1])}</b>${b.cifra[2] ? `<span>${t(b.cifra[2])}</span>` : ''}</div>`
      : '';
    const flujo = b.flujo
      ? `<div class="kd-flow-label"><span class="kd-label">Flujo</span></div><ol class="kd-flow" style="--pasos:${b.flujo.length}">${b.flujo
          .map((p, i) => `<li><span class="kd-dot">${dos(i + 1)}</span><p>${t(p)}</p></li>`)
          .join('')}</ol>`
      : '';
    return `<article class="kd-alt">
      <div class="kd-alt-head">
        <div><div class="kd-label">${t(b.etiqueta)}</div><h4>${t(b.nombre)}</h4>${
          b.resultado ? `<p class="kd-alt-result"><span class="kd-label">Resultado</span>${t(b.resultado)}</p>` : ''
        }</div>${cifra}
      </div>
      ${b.desc ? `<p class="kd-alt-desc">${t(b.desc)}</p>` : ''}
      ${flujo}
      ${b.cols ? tabla(b, t) : ''}
    </article>`;
  },
};

function bloque(b, t) {
  const dibujar = BLOQUES[b.t];
  if (!dibujar) return '';
  return `<section class="kd-sec kd-sec--${b.t}">${cabeza(b, t)}${dibujar(b, t)}</section>`;
}

const marca = `<img class="kd-logo" src="${LOGO}" alt="Krateroi" width="1107" height="220" />`;

function portada(doc, cat, datos, t) {
  const meta = [
    ['Preparado para', datos.empresa],
    ['Responsable', datos.responsable],
    ['Fecha', datos.fecha],
    ['Versión', '1.0'],
  ];
  return `<div class="kd-masthead">
    <div class="kd-topbar kd-wrap">${marca}<span class="kd-topbar-meta">Documento de demostración</span></div>
    <div class="kd-title-block kd-wrap">
      <div class="kd-label">${t(cat.etiqueta)}</div>
      <h2 class="kd-h1">${t(doc.titulo)}</h2>
      <dl class="kd-meta">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    </div>
  </div>`;
}

/* Devuelve el HTML de todas las páginas del documento */
export function componer(cat, doc, datos) {
  const t = (s) => esc(s).replace(/\{(\w+)\}/g, (m, k) => (k in datos ? esc(datos[k]) : m));
  const total = doc.paginas.length;

  return doc.paginas
    .map((bloques, i) => {
      const cabecera =
        i === 0
          ? portada(doc, cat, datos, t)
          : `<div class="kd-topbar kd-wrap">${marca}<span class="kd-topbar-meta">${t(cat.etiqueta)}</span></div>`;
      return `<section class="kd-hoja" aria-label="Página ${i + 1} de ${total}">
        ${cabecera}
        <div class="kd-content kd-wrap">${bloques.map((b) => bloque(b, t)).join('')}</div>
        <div class="kd-runfoot"><b>KRATEROI</b><span>${t(doc.titulo)} · Documento de demostración</span><span class="kd-pg">${dos(i + 1)} / ${dos(total)}</span></div>
      </section>`;
    })
    .join('');
}
