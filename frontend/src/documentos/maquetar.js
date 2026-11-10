/* -------------------------------------------------------------
   Arma un documento de demostración con la plantilla del informe
   del formulario (lib/informe-pdf.js): misma cabecera azul, títulos
   numerados, etiquetas en color acento y pie con numeración.

   Cada sección se dibuja entera en una página: si no cabe, se borra
   y se vuelve a dibujar al inicio de la siguiente.
   ------------------------------------------------------------- */

import { crearPlantilla, COLOR, ANCHO, MARGEN } from '../lib/informe-pdf.js';

const W = ANCHO - MARGEN * 2;
const PISO = 68;

/* Tonos para lo que va sobre el fondo azul de las tarjetas */
const CLARO = [0.56, 0.76, 0.86];
const GRIS_AZUL = [0.79, 0.83, 0.87];
const LINEA_AZUL = [0.22, 0.3, 0.4];
const PUNTO = [0.15, 0.24, 0.35];

const TEMA_CLARO = { cab: COLOR.acento, texto: COLOR.texto, fuerte: COLOR.azul, linea: COLOR.suave, lineaCab: COLOR.azul };
const TEMA_AZUL = { cab: CLARO, texto: GRIS_AZUL, fuerte: COLOR.blanco, linea: LINEA_AZUL, lineaCab: [0.45, 0.53, 0.62] };

const PILDORAS = {
  claro: { fuerte: [COLOR.azul, COLOR.blanco], medio: [[0.84, 0.9, 0.94], COLOR.azul], suave: [[0.93, 0.95, 0.97], COLOR.acento] },
  azul: { fuerte: [COLOR.blanco, COLOR.azul], medio: [[0.27, 0.37, 0.49], COLOR.blanco], suave: [[0.18, 0.27, 0.38], COLOR.blanco] },
};
const NIVEL = { alto: 'fuerte', alta: 'fuerte', 'atención': 'fuerte', pendiente: 'fuerte', medio: 'medio', media: 'medio', 'en curso': 'medio' };

const dos = (n) => String(n).padStart(2, '0');

function anchos(cols, total) {
  const fijos = cols.reduce((s, c) => s + (c.w ? parseFloat(c.w) / 100 : 0), 0);
  const libres = cols.filter((c) => !c.w).length || 1;
  return cols.map((c) => total * (c.w ? parseFloat(c.w) / 100 : (1 - fijos) / libres));
}

/* Tabla de líneas finas. Termina con p.y sobre la última línea dibujada. */
function tabla(p, b, t, { x = MARGEN, ancho = W, tema = TEMA_CLARO, pildoras = PILDORAS.claro } = {}) {
  const ws = anchos(b.cols, ancho);
  const xs = ws.map((_, i) => x + ws.slice(0, i).reduce((a, v) => a + v, 0));
  const ultima = b.cols.length - 1;
  const derecha = (i) => xs[i] + ws[i] - (i === ultima ? 0 : 10);

  b.cols.forEach((c, i) => {
    p.texto(t(c.h).toUpperCase(), c.der ? derecha(i) : xs[i], p.y, { size: 7, bold: true, color: tema.cab, derecha: c.der });
  });
  p.y -= 7;
  p.linea(x, p.y, x + ancho, p.y, 1, tema.lineaCab);
  p.y -= 15;

  const filas = [...b.filas.map((f) => ({ f, total: false })), ...(b.total ? [{ f: b.total, total: true }] : [])];
  filas.forEach(({ f, total }, r) => {
    const celdas = f.map((v, i) => {
      const c = b.cols[i];
      const fuerte = total || i === 0 || c.der;
      return { c, valor: t(v), fuerte, lineas: c.estado && !total ? [t(v)] : p.lineas(t(v), 9, ws[i] - 10, fuerte) };
    });
    const alto = (Math.max(...celdas.map((c) => c.lineas.length)) - 1) * 12.5;
    if (total) p.linea(x, p.y + 15, x + ancho, p.y + 15, 1, tema.lineaCab);

    celdas.forEach(({ c, valor, fuerte, lineas }, i) => {
      if (c.estado && !total) {
        const [fondo, tinta] = pildoras[NIVEL[valor.toLowerCase()] || 'suave'];
        const pw = p.ancho(valor, 7.5, true) + 10;
        const px = c.der ? derecha(i) - pw : xs[i];
        p.rect(px, p.y - 3.5, pw, 12, fondo);
        p.texto(valor, px + 5, p.y, { size: 7.5, bold: true, color: tinta });
        return;
      }
      lineas.forEach((l, j) => {
        p.texto(l, c.der ? derecha(i) : xs[i], p.y - j * 12.5, { size: 9, bold: fuerte, color: fuerte ? tema.fuerte : tema.texto, derecha: c.der });
      });
    });

    p.y -= alto + 7;
    if (!total) p.linea(x, p.y, x + ancho, p.y, 0.8, tema.linea);
    if (r < filas.length - 1) p.y -= 15;
  });
}

const BLOQUES = {
  texto(p, b, t) {
    [].concat(b.cuerpo).forEach((parrafo) => {
      p.lineas(t(parrafo), 10, W).forEach((l) => {
        p.texto(l, MARGEN, p.y, { size: 10 });
        p.y -= 15;
      });
    });
    p.y -= 11;
  },

  tabla(p, b, t) {
    tabla(p, b, t);
    if (b.nota) {
      p.y -= 16;
      p.texto(t(b.nota), MARGEN, p.y, { size: 8 });
    }
    p.y -= 26;
  },

  rejilla(p, b, t) {
    const cw = (W - 24) / 2;
    for (let r = 0; r < b.items.length; r += 2) {
      const par = b.items.slice(r, r + 2).map(([h, d]) => ({ h: t(h), d: p.lineas(t(d), 9, cw - 22) }));
      const alto = 29 + (Math.max(...par.map((c) => c.d.length)) - 1) * 12.5 + 14;
      /* La primera fila usa la línea del título de la sección */
      const primera = r === 0 && b.titulo;
      if (primera) p.y += 8;
      par.forEach((c, k) => {
        const x = MARGEN + k * (cw + 24);
        if (!primera) p.linea(x, p.y, x + cw, p.y);
        p.texto(dos(r + k + 1), x, p.y - 16, { size: 7.5, bold: true, color: COLOR.acento });
        p.texto(c.h, x + 22, p.y - 16, { size: 10, bold: true, color: COLOR.azul });
        c.d.forEach((l, j) => p.texto(l, x + 22, p.y - 29 - j * 12.5, { size: 9 }));
      });
      p.y -= alto;
    }
    p.y -= 12;
  },

  lista(p, b, t) {
    const inicio = b.inicio || 1;
    b.items.forEach(([h, d], i) => {
      const lineas = p.lineas(t(d), 9, W - 26);
      if (i === 0 && b.titulo) p.y += 12;
      else p.linea(MARGEN, p.y, MARGEN + W, p.y);
      p.circulo(MARGEN + 8, p.y - 15, 8, [0.9, 0.94, 0.96]);
      const n = String(inicio + i);
      p.texto(n, MARGEN + 8 - p.ancho(n, 8, true) / 2, p.y - 17.8, { size: 8, bold: true, color: COLOR.acento });
      p.texto(t(h), MARGEN + 26, p.y - 18, { size: 10, bold: true, color: COLOR.azul });
      lineas.forEach((l, j) => p.texto(l, MARGEN + 26, p.y - 31 - j * 12.5, { size: 9 }));
      p.y -= 31 + (lineas.length - 1) * 12.5 + 11;
    });
    p.linea(MARGEN, p.y, MARGEN + W, p.y);
    p.y -= 26;
  },

  kpis(p, b, t) {
    const cw = (W - 14 * 3) / 4;
    const etiquetas = b.items.map(([, l]) => p.lineas(t(l).toUpperCase(), 7, cw, true));
    b.items.forEach(([v], k) => {
      const x = MARGEN + k * (cw + 14);
      p.linea(x, p.y, x + cw, p.y, 1.2, COLOR.azul);
      p.texto(t(v), x, p.y - 25, { size: 20, bold: true, color: COLOR.azul });
      etiquetas[k].forEach((l, j) => p.texto(l, x, p.y - 39 - j * 9.5, { size: 7, bold: true, color: COLOR.acento }));
    });
    p.y -= 39 + (Math.max(...etiquetas.map((e) => e.length)) - 1) * 9.5 + 30;
  },

  firmas(p, b, t) {
    p.texto(t(b.lugar), MARGEN, p.y, { size: 10 });
    p.y -= 62;
    const cw = (W - 40) / 2;
    b.partes.forEach(([nombre, rol], k) => {
      const x = MARGEN + k * (cw + 40);
      p.linea(x, p.y, x + cw, p.y, 0.8, COLOR.azul);
      p.texto(t(nombre), x, p.y - 15, { size: 10, bold: true, color: COLOR.azul });
      p.texto(t(rol).toUpperCase(), x, p.y - 27, { size: 7, bold: true, color: COLOR.acento });
    });
    p.y -= 53;
  },

  /* Tarjeta azul: el fondo se agrega al final, cuando se conoce su alto */
  tarjeta(p, b, t) {
    const pad = 16;
    const x0 = MARGEN + pad;
    const iw = W - pad * 2;
    const arriba = p.y;
    const indice = p.marca();

    const cifra = b.cifra ? b.cifra.map((v) => t(v)) : null;
    const cifraW = cifra
      ? Math.max(p.ancho(cifra[0].toUpperCase(), 7, true), p.ancho(cifra[1], 18, true), cifra[2] ? p.ancho(cifra[2], 8) : 0)
      : 0;
    const izqW = iw - (cifra ? cifraW + 20 : 0);

    p.texto(t(b.etiqueta).toUpperCase(), x0, arriba - 24, { size: 7.5, bold: true, color: CLARO });
    let fin = arriba - 44;
    p.lineas(t(b.nombre), 15, izqW, true).forEach((l, j) => {
      fin = arriba - 44 - j * 17;
      p.texto(l, x0, fin, { size: 15, bold: true, color: COLOR.blanco });
    });
    if (cifra) {
      const xd = x0 + iw;
      p.texto(cifra[0].toUpperCase(), xd, arriba - 24, { size: 7, bold: true, color: CLARO, derecha: true });
      p.texto(cifra[1], xd, arriba - 45, { size: 18, bold: true, color: COLOR.blanco, derecha: true });
      if (cifra[2]) p.texto(cifra[2], xd, arriba - 58, { size: 8, color: GRIS_AZUL, derecha: true });
    }
    if (b.resultado) {
      const sangria = p.ancho('RESULTADO', 7, true) + 8;
      const base = fin - 16;
      p.texto('RESULTADO', x0, base, { size: 7, bold: true, color: CLARO });
      p.lineas(t(b.resultado), 9, izqW - sangria, true).forEach((l, j) => {
        fin = base - j * 12;
        p.texto(l, x0 + sangria, fin, { size: 9, bold: true, color: COLOR.blanco });
      });
    }
    if (cifra) fin = Math.min(fin, arriba - 58);

    if (b.desc) {
      let y = fin - 20;
      p.lineas(t(b.desc), 9, iw).forEach((l) => {
        p.texto(l, x0, y, { size: 9, color: GRIS_AZUL });
        fin = y;
        y -= 12.5;
      });
    }

    if (b.flujo) {
      let y = fin - 22;
      p.texto('FLUJO', x0, y, { size: 7, bold: true, color: CLARO });
      p.linea(x0 + p.ancho('FLUJO', 7, true) + 8, y + 2.5, x0 + iw, y + 2.5, 0.8, LINEA_AZUL);
      y -= 20;
      const paso = iw / b.flujo.length;
      const etiquetas = b.flujo.map((s) => p.lineas(t(s), 8, paso - 8, true));
      b.flujo.forEach((_, i) => {
        const cx = x0 + i * paso + 8;
        if (i < b.flujo.length - 1) p.linea(cx + 8, y, cx + paso - 8, y, 0.8, LINEA_AZUL);
        p.circulo(cx, y, 8, PUNTO);
        const n = dos(i + 1);
        p.texto(n, cx - p.ancho(n, 6.5, true) / 2, y - 2.3, { size: 6.5, bold: true, color: CLARO });
        etiquetas[i].forEach((l, j) => p.texto(l, cx - 8, y - 20 - j * 10, { size: 8, bold: true, color: COLOR.blanco }));
      });
      fin = y - 20 - (Math.max(...etiquetas.map((e) => e.length)) - 1) * 10;
    }

    let abajo = fin - 16;
    if (b.cols) {
      p.y = fin - 26;
      tabla(p, b, t, { x: x0, ancho: iw, tema: TEMA_AZUL, pildoras: PILDORAS.azul });
      abajo = p.y - 12;
    }

    p.fondo(indice, MARGEN, abajo, W, arriba - abajo, COLOR.azul);
    p.y = abajo - 26;
  },
};

function seccion(p, b, t) {
  const dibujar = () => {
    if (b.titulo) p.encabezadoSeccion(b.n, t(b.titulo));
    BLOQUES[b.t]?.(p, b, t);
  };
  const indice = p.marca();
  const cantidad = p.paginas.length;
  dibujar();
  /* No cupo: se borra y va completa a la página siguiente */
  if (p.y + 20 < PISO && p.paginas.length === cantidad) {
    p.recortar(indice);
    p.nuevaPagina();
    dibujar();
  }
}

/* Devuelve la plantilla con todas las páginas anotadas: sirve para la
   vista previa (p.svg) y para el archivo (p.pdf). */
export async function maquetar(cat, doc, datos) {
  const t = (s) => String(s ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in datos ? datos[k] : m));
  const nombre = doc.nombre.toUpperCase();
  const p = await crearPlantilla({
    encabezado: nombre,
    pie: `KRATEROI  /  ${nombre}  /  DEMOSTRACIÓN`,
    titulo: `${doc.titulo} - Krateroi (demostración)`,
    asunto: 'Documento de demostración con contenido genérico',
  });

  p.nuevaPagina();
  p.texto(`${cat.etiqueta}  ·  Documento de demostración`.toUpperCase(), MARGEN, p.y, { size: 7.5, bold: true, color: COLOR.acento });
  p.y -= 24;
  p.lineas(doc.titulo, 17, W, true).forEach((l) => {
    p.texto(l, MARGEN, p.y, { size: 17, bold: true, color: COLOR.azul });
    p.y -= 21;
  });
  p.y -= 1;
  p.lineas(`Fecha: ${datos.fecha}   ·   Preparado para: ${datos.empresa}   ·   Responsable: ${datos.responsable}`, 9, W).forEach((l) => {
    p.texto(l, MARGEN, p.y, { size: 9 });
    p.y -= 13;
  });
  p.y -= 23;

  doc.paginas.flat().forEach((b) => seccion(p, b, t));
  p.terminar();
  return p;
}
