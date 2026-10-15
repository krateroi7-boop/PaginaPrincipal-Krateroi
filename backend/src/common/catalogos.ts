/* ─────────────────────────────────────────────────────────────
   Catálogos cerrados del formulario.

   Son exactamente las opciones que ofrece la solicitud por etapas del
   frontend. Viven acá para que el DTO valide contra ellas y el
   resumen de Telegram las use sin repetirlas: si el formulario suma
   una opción, se agrega en un solo lugar.

   Lo que no calce con estas listas se descarta en silencio. No es un
   error del visitante: es un cliente manipulado, y no tiene sentido
   reenviarle el texto que inventó.
   ───────────────────────────────────────────────────────────── */

export const SERVICIOS = [
  'Diagnóstico inicial',
  'Apoyo digital y tecnológico',
  'Auditoría de flujos digitales y tecnológicos',
  'Desarrollo a la medida',
  'Automatización de procesos',
  'Desarrollo web corporativo',
  'Bases de datos e integraciones',
  'Servidores locales e infraestructura',
  'Asistente o agente con IA',
  'IA multiagente e integración',
  'Capacitación en IA y herramientas',
  'Documentos e información',
  'Datos, reportes y alertas',
  'Mantenimiento y acompañamiento',
  'Todavía no lo sé',
] as const;

export const UBICACIONES = [
  'Región Metropolitana',
  'Otra región de Chile',
  'Fuera de Chile',
] as const;

export const REUNIONES = [
  'Videollamada',
  'Presencial (RM)',
  'Mensajería',
] as const;

export const DOLORES = [
  'Copiar datos a mano entre sistemas',
  'Tareas que se repiten cada día o cada semana',
  'Seguimientos que dependen de que alguien se acuerde',
  'Reportes que se arman a mano cada mes',
  'Las mismas preguntas respondidas una y otra vez',
  'Documentos que hay que revisar uno por uno',
  'Sistemas que no se hablan entre sí',
  'Información que existe, pero cuesta reunirla',
  'Errores y reprocesos por trabajo manual',
  'Respuestas a clientes que demoran demasiado',
  'Un proceso que solo una persona sabe hacer',
  'Planillas que crecieron más de la cuenta',
] as const;

/** Deja sólo los valores de la lista, sin repetir. */
export function soloDeLista(
  valores: unknown,
  lista: readonly string[],
): string[] {
  if (!Array.isArray(valores)) return [];
  return [...new Set(valores.map((v) => String(v).trim()))].filter((v) =>
    lista.includes(v),
  );
}

/** Un valor suelto: devuelve el guion si no está en la lista. */
export function deLista(valor: unknown, lista: readonly string[]): string {
  const v = String(valor ?? '').trim();
  return lista.includes(v) ? v : '-';
}
