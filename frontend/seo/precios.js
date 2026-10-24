/* Precios publicados en la sección #precios.

   Es el único lugar donde viven: seo/plugin.js arma con esto la tabla
   del sitio y el catálogo de servicios que leen los buscadores, así que
   las dos cosas no pueden quedar distintas.

   `uf` es el valor mínimo ("desde") en Unidades de Fomento. `clp`, en
   pesos, se usa sólo para trabajos pequeños. `mensual` marca lo que se
   cobra por mes. Todos los valores son netos. */

export const GRUPOS = [
  {
    titulo: 'Auditorías',
    items: [
      {
        nombre: 'Auditoría digital de procesos y sistemas',
        alcance: 'Un proceso o área de la empresa, con los sistemas y bases de datos que usa.',
        plazo: '1 a 2 semanas',
        uf: 12,
      },
      {
        nombre: 'Auditoría legal digital',
        alcance: 'Un proceso, sistema o sitio, con informe de brechas y prioridades.',
        plazo: '2 a 3 semanas',
        uf: 18,
      },
      {
        nombre: 'Auditoría digital y legal',
        alcance: 'Las dos revisiones sobre el mismo proceso, con un solo informe.',
        plazo: '3 a 4 semanas',
        uf: 26,
      },
    ],
  },
  {
    titulo: 'Apoyo legal',
    items: [
      {
        nombre: 'Adecuación a la Ley 21.719',
        alcance: 'Empresa con pocos sistemas y proveedores: registro de tratamientos, política de privacidad y consentimientos.',
        plazo: '3 a 4 semanas',
        uf: 30,
      },
      {
        nombre: 'Ciberseguridad legal',
        alcance: 'Revisión de obligaciones bajo la Ley 21.663 y un protocolo ante incidentes listo para usar.',
        plazo: '2 a 3 semanas',
        uf: 15,
      },
      {
        nombre: 'Contrato tecnológico o de IA',
        alcance: 'Un contrato o una política de uso de IA, redactado o revisado.',
        plazo: '1 semana',
        uf: 6,
      },
    ],
  },
  {
    titulo: 'Desarrollo e implementación',
    items: [
      {
        nombre: 'Automatización acotada',
        alcance: 'Una tarea repetitiva concreta, con pocos sistemas involucrados.',
        plazo: '1 a 2 semanas',
        uf: 12,
      },
      {
        nombre: 'Sitio o portal corporativo',
        alcance: 'Contenido definido y sin integraciones complejas.',
        plazo: '2 a 4 semanas',
        uf: 15,
      },
      {
        nombre: 'Servidor local',
        alcance: 'Un servidor para aplicaciones o datos. El equipo físico se cotiza aparte.',
        plazo: '1 a 2 semanas',
        uf: 10,
      },
      {
        nombre: 'Proceso completo',
        alcance: 'Un flujo de punta a punta con varias etapas, validaciones y usuarios.',
        plazo: '3 a 4 semanas',
        uf: 35,
      },
      {
        nombre: 'Sistema a la medida, integración o agente con IA',
        alcance: 'Software propio, conexión entre sistemas o asistente probado sobre casos reales.',
        plazo: '3 a 4 semanas',
        uf: 45,
      },
      {
        nombre: 'Mantenimiento y soporte',
        alcance: 'Plan mensual para lo que construimos. Varía según cuántos flujos o sistemas cubre.',
        plazo: 'Continuo',
        uf: 3,
        mensual: true,
      },
    ],
  },
  {
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
  },
];
