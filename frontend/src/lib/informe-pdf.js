import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Plantilla visual inspirada en la cotizacion entregada. La usan el
// informe del formulario de contacto y el generador de documentos de
// demostracion (/documentos), para que ambos salgan con el mismo formato.
//
// La plantilla no dibuja directo en el PDF: anota cada trazo por pagina.
// Con esas anotaciones se arma el PDF (pdf()) y tambien la vista previa
// en SVG (svg()), asi lo que se ve en pantalla es lo que se descarga.
export const ANCHO = 595.28;
export const ALTO = 841.89;
export const MARGEN = 48;
export const COLOR = {
  azul: [0.055, 0.125, 0.21],
  acento: [0.22, 0.48, 0.61],
  texto: [0.16, 0.22, 0.29],
  suave: [0.87, 0.9, 0.92],
  blanco: [1, 1, 1],
};

// Caracteres que la fuente estandar del PDF no trae
const EQUIVALENCIAS = { '−': '-', '≥': '>=', '≤': '<=', '→': '->', ' ': ' ' };

function texto(valor) {
  return String(valor || '').trim() || ' ';
}

const hex = (c) => `#${c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
const escSvg = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

export async function crearPlantilla({ encabezado, pie, titulo, asunto }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(titulo);
  pdf.setAuthor('Krateroi');
  pdf.setSubject(asunto);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const admitidos = new Set(regular.getCharacterSet());
  const fuente = (bold) => (bold ? negrita : regular);
  const limpiar = (s) =>
    Array.from(String(s ?? ''), (c) => EQUIVALENCIAS[c] ?? (admitidos.has(c.codePointAt(0)) ? c : '')).join('');

  const paginas = [];
  let trazos = null;
  let terminada = false;

  const p = {
    y: 0,
    paginas,

    ancho: (valor, tamano, bold = false) => fuente(bold).widthOfTextAtSize(limpiar(valor), tamano),

    lineas(textoLibre, tamano, ancho, bold = false) {
      const resultado = [];
      for (const parrafo of limpiar(texto(textoLibre)).split(/\r?\n/)) {
        let linea = '';
        for (const palabra of (parrafo.trim() || ' ').split(/\s+/)) {
          const prueba = linea ? `${linea} ${palabra}` : palabra;
          if (fuente(bold).widthOfTextAtSize(prueba, tamano) <= ancho) {
            linea = prueba;
          } else {
            if (linea) resultado.push(linea);
            linea = palabra;
          }
        }
        resultado.push(linea || ' ');
      }
      return resultado;
    },

    texto(valor, x, y, { size, bold = false, color = COLOR.texto, derecha = false }) {
      const limpio = limpiar(valor);
      const xx = derecha ? x - fuente(bold).widthOfTextAtSize(limpio, size) : x;
      trazos.push({ tipo: 'texto', valor: limpio, x: xx, y, size, bold, color });
    },
    linea(x1, y1, x2, y2, grosor = 0.8, color = COLOR.suave) {
      trazos.push({ tipo: 'linea', x1, y1, x2, y2, grosor, color });
    },
    rect(x, y, w, h, color) {
      trazos.push({ tipo: 'rect', x, y, w, h, color });
    },
    circulo(x, y, r, color) {
      trazos.push({ tipo: 'circulo', x, y, r, color });
    },

    /* Para fondos que se conocen al final y para deshacer un bloque */
    marca: () => trazos.length,
    fondo(indice, x, y, w, h, color) {
      trazos.splice(indice, 0, { tipo: 'rect', x, y, w, h, color });
    },
    recortar(indice) {
      trazos.length = indice;
    },

    nuevaPagina() {
      trazos = [];
      paginas.push(trazos);
      p.rect(0, ALTO - 112, ANCHO, 112, COLOR.azul);
      p.texto('KRATEROI', MARGEN, ALTO - 43, { size: 14, bold: true, color: COLOR.blanco });
      const disponible = ANCHO - MARGEN * 2;
      const size = Math.min(22, (22 * disponible) / Math.max(1, p.ancho(encabezado, 22, true)));
      p.texto(encabezado, MARGEN, ALTO - 84, { size, bold: true, color: COLOR.blanco });
      p.y = ALTO - 146;
    },

    espacio(necesario) {
      if (p.y - necesario < 68) p.nuevaPagina();
    },

    encabezadoSeccion(numero, nombre) {
      p.texto(`${numero}  ${String(nombre).toUpperCase()}`, MARGEN, p.y, { size: 11, bold: true, color: COLOR.azul });
      p.y -= 10;
      p.linea(MARGEN, p.y, ANCHO - MARGEN, p.y);
      p.y -= 23;
    },

    titulo(numero, nombre) {
      p.espacio(52);
      p.encabezadoSeccion(numero, nombre);
    },

    campo(etiqueta, valor) {
      const contenido = p.lineas(valor, 10, ANCHO - MARGEN * 2);
      p.espacio(28 + contenido.length * 15);
      p.texto(etiqueta.toUpperCase(), MARGEN, p.y, { size: 8, bold: true, color: COLOR.acento });
      p.y -= 17;
      for (const linea of contenido) {
        p.espacio(16);
        p.texto(linea, MARGEN, p.y, { size: 10 });
        p.y -= 15;
      }
      p.y -= 11;
    },

    /* Pie con numeración, una sola vez y cuando ya se sabe el total */
    terminar() {
      if (terminada) return paginas;
      terminada = true;
      paginas.forEach((hoja, indice) => {
        trazos = hoja;
        p.linea(MARGEN, 51, ANCHO - MARGEN, 51);
        p.texto(pie, MARGEN, 35, { size: 8, bold: true, color: COLOR.acento });
        p.texto(`${indice + 1} / ${paginas.length}`, ANCHO - MARGEN - 35, 35, { size: 8 });
      });
      return paginas;
    },

    async pdf() {
      p.terminar();
      for (const hoja of paginas) {
        const pagina = pdf.addPage([ANCHO, ALTO]);
        for (const t of hoja) {
          if (t.tipo === 'texto') pagina.drawText(t.valor, { x: t.x, y: t.y, size: t.size, font: fuente(t.bold), color: rgb(...t.color) });
          else if (t.tipo === 'linea') pagina.drawLine({ start: { x: t.x1, y: t.y1 }, end: { x: t.x2, y: t.y2 }, thickness: t.grosor, color: rgb(...t.color) });
          else if (t.tipo === 'rect') pagina.drawRectangle({ x: t.x, y: t.y, width: t.w, height: t.h, color: rgb(...t.color) });
          else if (t.tipo === 'circulo') pagina.drawCircle({ x: t.x, y: t.y, size: t.r, color: rgb(...t.color) });
        }
      }
      return pdf.save();
    },

    svg(indice, etiqueta = '') {
      p.terminar();
      const cuerpo = paginas[indice]
        .map((t) => {
          if (t.tipo === 'texto') {
            return `<text x="${t.x.toFixed(2)}" y="${(ALTO - t.y).toFixed(2)}" font-size="${t.size}"${t.bold ? ' font-weight="700"' : ''} fill="${hex(t.color)}">${escSvg(t.valor)}</text>`;
          }
          if (t.tipo === 'linea') {
            return `<line x1="${t.x1.toFixed(2)}" y1="${(ALTO - t.y1).toFixed(2)}" x2="${t.x2.toFixed(2)}" y2="${(ALTO - t.y2).toFixed(2)}" stroke="${hex(t.color)}" stroke-width="${t.grosor}"/>`;
          }
          if (t.tipo === 'rect') {
            return `<rect x="${t.x.toFixed(2)}" y="${(ALTO - t.y - t.h).toFixed(2)}" width="${t.w.toFixed(2)}" height="${t.h.toFixed(2)}" fill="${hex(t.color)}"/>`;
          }
          return `<circle cx="${t.x.toFixed(2)}" cy="${(ALTO - t.y).toFixed(2)}" r="${t.r}" fill="${hex(t.color)}"/>`;
        })
        .join('');
      return `<svg class="kd-hoja" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" xml:space="preserve" role="img" aria-label="${escSvg(etiqueta)}" font-family="Helvetica, Arial, 'Liberation Sans', sans-serif"><rect width="${ANCHO}" height="${ALTO}" fill="#ffffff"/>${cuerpo}</svg>`;
    },
  };

  return p;
}

export async function crearInformePDF(datos) {
  const p = await crearPlantilla({
    encabezado: 'INFORME DE SOLICITUD',
    pie: 'KRATEROI  /  INFORME DE SOLICITUD',
    titulo: 'Informe de solicitud - Krateroi',
    asunto: 'Datos enviados desde el formulario de contacto',
  });

  p.nuevaPagina();
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: 'America/Santiago' }).format(new Date());
  p.texto(`Fecha: ${fecha}`, MARGEN, p.y, { size: 9 });
  p.y -= 36;

  p.titulo('01', 'Contacto');
  p.campo('Nombre', datos.nombre);
  p.campo('Empresa', datos.empresa);
  p.campo('Correo', datos.correo);
  p.campo('Telefono', datos.telefono);

  p.titulo('02', 'Area de apoyo');
  if (datos.apoyo) p.campo('Tipo de apoyo', datos.apoyo);
  p.campo('Servicios seleccionados', [
    ...(datos.servicios || []),
    ...(datos.servicioOtro ? [datos.servicioOtro] : []),
  ].join(', '));
  p.campo('Ubicacion', datos.ubicacion);

  p.titulo('03', 'Necesidad');
  p.campo('Dificultades seleccionadas', (datos.dolores || []).join(', '));
  p.campo('Descripcion', datos.mensaje);

  p.titulo('04', 'Contacto solicitado');
  p.campo('Formato de reunion', datos.reunion);

  return p.pdf();
}

export function descargarInforme(bytes, nombre = 'informe-solicitud-krateroi.pdf') {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
