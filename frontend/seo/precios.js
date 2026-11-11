/* Precios publicados en la sección #precios.

   Es el único lugar donde viven: seo/plugin.js arma con esto la sección
   del sitio y el catálogo de servicios que leen los buscadores, así que
   las dos cosas no pueden quedar distintas.

   GRUPOS_UF: cada grupo de servicios se publica con un solo rango en
   Unidades de Fomento (`uf: [desde, hasta]`) y una lista de acciones
   generales. No se publica el valor de cada servicio por separado: el
   precio exacto se fija en la propuesta. `mensual` marca lo que se cobra
   por mes y `desde` lo que no tiene tope publicado.

   TRABAJOS_PEQUENOS: trabajos cortos, cobrados en pesos (`clp`).

   Todos los valores son netos. */

export const GRUPOS_UF = [
  {
    titulo: 'Auditorías',
    acciones: [
      'Diagnóstico de procesos y sistemas',
      'Revisión de riesgos legales digitales',
      'Auditoría integrada digital y legal',
    ],
    plazo: '1 a 4 semanas',
    uf: [12, 26],
  },
  {
    titulo: 'Apoyo legal',
    acciones: [
      'Protección de datos personales',
      'Ciberseguridad y respuesta ante incidentes',
      'Contratos tecnológicos y uso de IA',
    ],
    plazo: '1 a 4 semanas',
    uf: [6, 30],
  },
  {
    titulo: 'Implementación',
    acciones: [
      'Automatización de procesos',
      'Software a la medida e integraciones',
      'Sitios y portales corporativos',
      'Infraestructura propia',
      'Inteligencia artificial aplicada',
    ],
    plazo: '1 a 4 semanas',
    uf: [10, 45],
  },
  {
    titulo: 'Continuidad',
    acciones: [
      'Soporte de lo implementado',
      'Ajustes cuando cambia el proceso',
      'Seguimiento del funcionamiento',
    ],
    plazo: 'Cobro mensual',
    uf: [3],
    desde: true,
    mensual: true,
  },
];

export const TRABAJOS_PEQUENOS = {
  titulo: 'Trabajos pequeños',
  items: [
    {
      nombre: 'Ajuste menor',
      alcance: 'Un cambio acotado en un sitio, planilla o automatización existente: un campo, un texto o una regla.',
      plazo: '1 a 3 días',
      clp: 40000,
    },
    {
      nombre: 'Configuración de una herramienta',
      alcance: 'Correo corporativo, formulario, planilla compartida o conexión simple entre dos aplicaciones.',
      plazo: '1 a 3 días',
      clp: 60000,
    },
    {
      nombre: 'Revisión legal breve',
      alcance: 'Observaciones por escrito sobre una cláusula, aviso o formulario de hasta cinco páginas.',
      plazo: '1 a 3 días',
      clp: 60000,
    },
    {
      nombre: 'Documentos legales de un sitio web',
      alcance: 'Términos y condiciones, política de privacidad y aviso de cookies para un sitio o tienda simple.',
      plazo: '2 a 5 días',
      clp: 90000,
    },
    {
      nombre: 'Sesión de capacitación adicional',
      alcance: 'Hasta dos horas, remota, para sumar personas o profundizar en una herramienta ya entregada.',
      plazo: '1 sesión',
      clp: 120000,
    },
  ],
};
