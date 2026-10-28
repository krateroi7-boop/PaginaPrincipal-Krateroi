import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Plantilla visual inspirada en la cotizacion entregada. El contenido
// sale exclusivamente de las respuestas del formulario.
const AZUL = rgb(0.055, 0.125, 0.21);
const ACENTO = rgb(0.22, 0.48, 0.61);
const TEXTO = rgb(0.16, 0.22, 0.29);
const SUAVE = rgb(0.87, 0.9, 0.92);
const BLANCO = rgb(1, 1, 1);
const ANCHO = 595.28;
const ALTO = 841.89;
const MARGEN = 48;

function texto(valor) {
  return String(valor || '').trim() || ' ';
}

function lineas(textoLibre, fuente, tamano, ancho) {
  const resultado = [];
  for (const parrafo of texto(textoLibre).split(/\r?\n/)) {
    let linea = '';
    for (const palabra of (parrafo.trim() || ' ').split(/\s+/)) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tamano) <= ancho) {
        linea = prueba;
      } else {
        if (linea) resultado.push(linea);
        linea = palabra;
      }
    }
    resultado.push(linea || ' ');
  }
  return resultado;
}

export async function crearInformePDF(datos) {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Informe de solicitud - Krateroi');
  pdf.setAuthor('Krateroi');
  pdf.setSubject('Datos enviados desde el formulario de contacto');
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold);
  const paginas = [];
  let pagina;
  let y;

  function nuevaPagina() {
    pagina = pdf.addPage([ANCHO, ALTO]);
    paginas.push(pagina);
    pagina.drawRectangle({ x: 0, y: ALTO - 112, width: ANCHO, height: 112, color: AZUL });
    pagina.drawText('KRATEROI', { x: MARGEN, y: ALTO - 43, size: 14, font: negrita, color: BLANCO });
    pagina.drawText('INFORME DE SOLICITUD', { x: MARGEN, y: ALTO - 84, size: 22, font: negrita, color: BLANCO });
    y = ALTO - 146;
  }

  function espacio(necesario) {
    if (y - necesario < 68) nuevaPagina();
  }

  function titulo(numero, nombre) {
    espacio(52);
    pagina.drawText(`${numero}  ${nombre.toUpperCase()}`, { x: MARGEN, y, size: 11, font: negrita, color: AZUL });
    y -= 10;
    pagina.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: 0.8, color: SUAVE });
    y -= 23;
  }

  function campo(etiqueta, valor) {
    const contenido = lineas(valor, regular, 10, ANCHO - MARGEN * 2);
    espacio(28 + contenido.length * 15);
    pagina.drawText(etiqueta.toUpperCase(), { x: MARGEN, y, size: 8, font: negrita, color: ACENTO });
    y -= 17;
    for (const linea of contenido) {
      espacio(16);
      pagina.drawText(linea, { x: MARGEN, y, size: 10, font: regular, color: TEXTO });
      y -= 15;
    }
    y -= 11;
  }

  nuevaPagina();
  const fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: 'America/Santiago' }).format(new Date());
  pagina.drawText(`Fecha: ${fecha}`, { x: MARGEN, y, size: 9, font: regular, color: TEXTO });
  y -= 36;

  titulo('01', 'Contacto');
  campo('Nombre', datos.nombre);
  campo('Empresa', datos.empresa);
  campo('Correo', datos.correo);
  campo('Telefono', datos.telefono);

  titulo('02', 'Area de apoyo');
  campo('Servicios seleccionados', [
    ...(datos.servicios || []),
    ...(datos.servicioOtro ? [datos.servicioOtro] : []),
  ].join(', '));
  campo('Ubicacion', datos.ubicacion);

  titulo('03', 'Necesidad');
  campo('Dificultades seleccionadas', (datos.dolores || []).join(', '));
  campo('Descripcion', datos.mensaje);

  titulo('04', 'Contacto solicitado');
  campo('Formato de reunion', datos.reunion);

  paginas.forEach((hoja, indice) => {
    hoja.drawLine({ start: { x: MARGEN, y: 51 }, end: { x: ANCHO - MARGEN, y: 51 }, thickness: 0.8, color: SUAVE });
    hoja.drawText('KRATEROI  /  INFORME DE SOLICITUD', { x: MARGEN, y: 35, size: 8, font: negrita, color: ACENTO });
    hoja.drawText(`${indice + 1} / ${paginas.length}`, { x: ANCHO - MARGEN - 35, y: 35, size: 8, font: regular, color: TEXTO });
  });

  return pdf.save();
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
