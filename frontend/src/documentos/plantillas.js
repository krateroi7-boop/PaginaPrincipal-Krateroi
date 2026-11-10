/* -------------------------------------------------------------
   Documentos de demostración del generador.

   Son solo muestras de formato: textos genéricos, cifras de ejemplo
   y ningún valor real. {empresa}, {responsable} y {fecha} se
   reemplazan con lo que la persona escribe en el formulario.

   Los bloques (texto, tabla, rejilla, lista, kpis, tarjeta y firmas)
   los dibuja maquetar.js con la plantilla del informe del formulario.
   Están agrupados por página como referencia; el maquetador los
   reparte solo y lleva a la página siguiente lo que no cabe.
   ------------------------------------------------------------- */

export const CATEGORIAS = [
  {
    id: 'estrategico',
    nombre: 'Estratégicos',
    etiqueta: 'Documento estratégico',
    docs: [
      {
        id: 'plan-estrategico',
        nombre: 'Plan estratégico',
        titulo: 'Plan estratégico trienal',
        resumen: 'Propósito, objetivos, ejes e iniciativa prioritaria.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Propósito', cuerpo: '{empresa} busca ordenar sus prioridades de los próximos tres años en torno a objetivos medibles, responsables claros y una revisión periódica del avance. Este documento resume la dirección acordada y las iniciativas que la sostienen.' },
            {
              t: 'tabla', n: '02', titulo: 'Objetivos estratégicos',
              cols: [{ h: 'Objetivo', w: '28%' }, { h: 'Indicador' }, { h: 'Meta', w: '16%', der: true }],
              filas: [
                ['Eficiencia operativa', 'Tiempo promedio de los procesos clave', '-20 %'],
                ['Experiencia de clientes', 'Satisfacción medida al cierre de cada servicio', '90 %'],
                ['Gestión de la información', 'Procesos con datos centralizados y actualizados', '100 %'],
                ['Cumplimiento', 'Políticas internas revisadas y vigentes', '4 / 4'],
                ['Desarrollo del equipo', 'Horas de formación por persona al año', '24 h'],
              ],
            },
            {
              t: 'rejilla', n: '03', titulo: 'Ejes de trabajo',
              items: [
                ['Procesos', 'Documentar, medir y simplificar las tareas que más tiempo consumen.'],
                ['Tecnología', 'Herramientas conectadas entre sí y un solo origen para cada dato.'],
                ['Personas', 'Roles definidos, formación continua y responsables por objetivo.'],
                ['Gobierno', 'Indicadores compartidos y revisión trimestral del avance.'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '04', titulo: 'Iniciativa prioritaria',
              etiqueta: 'Iniciativa 01', nombre: 'Modernización de procesos internos',
              resultado: 'Procesos clave documentados, medidos y con responsables definidos.',
              cifra: ['Horizonte', '12 meses', 'Revisión trimestral'],
              desc: 'La iniciativa parte con un diagnóstico de los procesos actuales, prioriza los de mayor impacto y avanza por etapas cortas con resultados visibles. Cada etapa cierra con una medición antes de continuar.',
              flujo: ['Diagnóstico', 'Priorización', 'Diseño', 'Piloto', 'Despliegue', 'Medición'],
              cols: [{ h: 'Hito', w: '22%' }, { h: 'Descripción' }, { h: 'Plazo', w: '12%', der: true }],
              filas: [
                ['Levantamiento', 'Entrevistas, revisión de tareas y mapa de procesos actuales.', 'T1'],
                ['Priorización', 'Matriz de impacto y esfuerzo con el equipo directivo.', 'T1'],
                ['Piloto', 'Implementación acotada en un área y ajuste del modelo.', 'T2'],
                ['Despliegue', 'Extensión gradual al resto de las áreas.', 'T3'],
              ],
              total: ['Cierre', 'Evaluación de resultados y ajuste del plan', 'T4'],
            },
            {
              t: 'lista', n: '05', titulo: 'Gobierno del plan',
              items: [
                ['Comité de seguimiento', 'Sesión mensual con los responsables de cada objetivo para revisar indicadores.'],
                ['Revisión trimestral', 'Ajuste de metas e iniciativas según el avance y el contexto.'],
                ['Informe anual', 'Balance de resultados y definición de prioridades para el período siguiente.'],
              ],
            },
          ],
        ],
      },
      {
        id: 'hoja-de-ruta',
        nombre: 'Hoja de ruta digital',
        titulo: 'Hoja de ruta de transformación digital',
        resumen: 'Visión, etapas, indicadores y primera fase.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Visión', cuerpo: 'Contar con procesos digitales simples, conectados y medibles, donde cada área de {empresa} trabaje con información confiable y actualizada. La hoja de ruta ordena ese camino en cuatro etapas de tres meses.' },
            {
              t: 'tabla', n: '02', titulo: 'Etapas',
              cols: [{ h: 'Etapa', w: '24%' }, { h: 'Enfoque' }, { h: 'Plazo', w: '16%', der: true }],
              filas: [
                ['01 · Base', 'Orden de la información y herramientas comunes.', 'Meses 1–3'],
                ['02 · Conexión', 'Integración entre sistemas y fin de la doble digitación.', 'Meses 4–6'],
                ['03 · Automatización', 'Tareas repetitivas resueltas sin intervención manual.', 'Meses 7–9'],
                ['04 · Análisis', 'Tableros de indicadores para la toma de decisiones.', 'Meses 10–12'],
              ],
            },
            { t: 'kpis', n: '03', titulo: 'Indicadores de avance', items: [['4', 'Etapas'], ['12', 'Meses'], ['6', 'Procesos priorizados'], ['1', 'Tablero común']] },
            {
              t: 'lista', n: '04', titulo: 'Responsables',
              items: [
                ['Patrocinio', 'La gerencia general aprueba cada etapa y sus recursos.'],
                ['Coordinación', '{responsable} lidera la ejecución y reporta el avance mensual.'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '05', titulo: 'Primera fase',
              etiqueta: 'Etapa 01', nombre: 'Base de información común',
              resultado: 'Un solo registro por dato y herramientas compartidas por las áreas.',
              cifra: ['Plazo', '3 meses', 'Etapa inicial'],
              desc: 'Se identifican las fuentes de información existentes, se define un registro único para cada dato y se acuerdan las herramientas de trabajo comunes. Esta base permite conectar sistemas en la etapa siguiente.',
              flujo: ['Inventario', 'Limpieza', 'Registro único', 'Accesos', 'Capacitación', 'Validación'],
              cols: [{ h: 'Partida', w: '24%' }, { h: 'Alcance' }, { h: 'Estado', w: '16%', der: true, estado: true }],
              filas: [
                ['Inventario', 'Listado de planillas, sistemas y responsables.', 'Listo'],
                ['Limpieza', 'Corrección de duplicados y formatos.', 'En curso'],
                ['Registro único', 'Definición del origen oficial de cada dato.', 'En curso'],
                ['Accesos', 'Permisos por rol y por área.', 'Pendiente'],
              ],
            },
            {
              t: 'rejilla', n: '06', titulo: 'Principios',
              items: [
                ['Simple primero', 'Antes de automatizar, se simplifica el proceso.'],
                ['Un dato, un origen', 'Cada dato tiene un registro oficial y un responsable.'],
                ['Medir siempre', 'Cada cambio se evalúa con un indicador acordado.'],
                ['Avance gradual', 'Etapas cortas con resultados visibles.'],
              ],
            },
            {
              t: 'lista', n: '07', titulo: 'Próximos pasos',
              items: [
                ['Aprobación', 'Validación de la hoja de ruta por el equipo directivo.'],
                ['Arranque', 'Inicio de la etapa 01 con el inventario de información.'],
              ],
            },
          ],
        ],
      },
    ],
  },

  {
    id: 'operativo',
    nombre: 'Operativos',
    etiqueta: 'Documento operativo',
    docs: [
      {
        id: 'manual-procedimientos',
        nombre: 'Manual de procedimientos',
        titulo: 'Manual de procedimiento operativo',
        resumen: 'Roles, definiciones, pasos y controles.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Objetivo y alcance', cuerpo: 'Este manual describe cómo se ejecuta el proceso de atención de solicitudes internas en {empresa}: quién participa, en qué orden y qué registros se generan. Aplica a todas las áreas que reciben o derivan solicitudes.' },
            {
              t: 'tabla', n: '02', titulo: 'Roles y responsabilidades',
              cols: [{ h: 'Rol', w: '26%' }, { h: 'Responsabilidad' }, { h: 'Área', w: '20%' }],
              filas: [
                ['Solicitante', 'Ingresa la solicitud con la información completa.', 'Todas'],
                ['Coordinación', 'Revisa, prioriza y asigna cada solicitud.', 'Operaciones'],
                ['Ejecutor', 'Resuelve la solicitud dentro del plazo acordado.', 'Área asignada'],
                ['Supervisión', 'Controla plazos, calidad y cierre.', 'Jefatura'],
                ['Dueño del proceso', 'Mantiene este manual actualizado.', '{responsable}'],
              ],
            },
            {
              t: 'rejilla', n: '03', titulo: 'Definiciones',
              items: [
                ['Solicitud', 'Requerimiento formal ingresado por un canal oficial.'],
                ['Prioridad', 'Nivel de urgencia asignado según impacto y plazo.'],
                ['Registro', 'Evidencia de cada paso, con fecha y responsable.'],
                ['Cierre', 'Confirmación de que la solicitud fue resuelta.'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '04', titulo: 'Procedimiento',
              etiqueta: 'Procedimiento estándar', nombre: 'Atención de solicitudes internas',
              resultado: 'Cada solicitud queda registrada, asignada y cerrada con evidencia.',
              cifra: ['Plazo objetivo', '48 h', 'Desde el ingreso'],
              desc: 'El procedimiento ordena la recepción, asignación y cierre de solicitudes para que ninguna quede sin responsable. Los plazos se miden desde el ingreso hasta la confirmación del solicitante.',
              flujo: ['Ingreso', 'Revisión', 'Asignación', 'Ejecución', 'Validación', 'Cierre'],
              cols: [{ h: 'Paso', w: '22%' }, { h: 'Acción' }, { h: 'Registro', w: '18%', der: true }],
              filas: [
                ['1 · Ingreso', 'El solicitante completa el formulario oficial.', 'Formulario'],
                ['2 · Revisión', 'Coordinación verifica que la información esté completa.', 'Bitácora'],
                ['3 · Asignación', 'Se definen prioridad, ejecutor y plazo.', 'Bitácora'],
                ['4 · Ejecución', 'El ejecutor resuelve y documenta lo realizado.', 'Informe breve'],
              ],
              total: ['5 · Cierre', 'El solicitante confirma y se archiva la evidencia', 'Acta'],
            },
            {
              t: 'lista', n: '05', titulo: 'Controles',
              items: [
                ['Revisión semanal', 'Supervisión revisa las solicitudes abiertas y los plazos vencidos.'],
                ['Indicadores', 'Tiempo de respuesta, solicitudes cerradas y reaperturas.'],
                ['Actualización', 'El manual se revisa una vez al año o ante cambios del proceso.'],
              ],
            },
          ],
        ],
      },
      {
        id: 'informe-mensual',
        nombre: 'Informe operativo mensual',
        titulo: 'Informe operativo mensual',
        resumen: 'Resumen, cifras, indicadores e incidencias.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Resumen del período', cuerpo: 'Durante el período, la operación de {empresa} mantuvo sus niveles de servicio dentro de lo esperado. Mejoraron los tiempos de respuesta y se identificó un foco de atención que se aborda en el plan de acción.' },
            { t: 'kpis', n: '02', titulo: 'Cifras principales', items: [['96 %', 'Cumplimiento de plazos'], ['1.240', 'Solicitudes atendidas'], ['4,2 h', 'Tiempo medio de respuesta'], ['3', 'Incidencias del mes']] },
            {
              t: 'tabla', n: '03', titulo: 'Indicadores',
              cols: [{ h: 'Indicador', w: '36%' }, { h: 'Meta', der: true }, { h: 'Resultado', der: true }, { h: 'Estado', w: '18%', der: true, estado: true }],
              filas: [
                ['Cumplimiento de plazos', '95 %', '96 %', 'En meta'],
                ['Tiempo medio de respuesta', '5 h', '4,2 h', 'En meta'],
                ['Reaperturas', 'Máx. 3 %', '4 %', 'Atención'],
                ['Satisfacción interna', '90 %', '91 %', 'En meta'],
                ['Disponibilidad de sistemas', '99 %', '99,4 %', 'En meta'],
              ],
            },
            {
              t: 'lista', n: '04', titulo: 'Hitos del mes',
              items: [
                ['Nuevo formulario de ingreso', 'Todas las solicitudes entran ahora por un único canal.'],
                ['Tablero semanal', 'Las jefaturas revisan los indicadores cada lunes.'],
              ],
            },
          ],
          [
            {
              t: 'tabla', n: '05', titulo: 'Incidencias',
              cols: [{ h: 'Incidencia', w: '26%' }, { h: 'Descripción' }, { h: 'Impacto', w: '14%', estado: true }, { h: 'Estado', w: '14%', der: true }],
              filas: [
                ['Demora en despachos', 'Retraso puntual por cambio de proveedor logístico.', 'Medio', 'En curso'],
                ['Error de registro', 'Datos duplicados en la planilla de seguimiento.', 'Bajo', 'Resuelta'],
                ['Caída de sistema', 'Interrupción de 40 minutos en horario hábil.', 'Alto', 'Resuelta'],
              ],
            },
            {
              t: 'tarjeta', n: '06', titulo: 'Plan de acción',
              etiqueta: 'Próximo período', nombre: 'Reducción de reaperturas',
              resultado: 'Volver a la meta de reaperturas bajo el 3 %.',
              cifra: ['Plazo', '30 días', 'Seguimiento semanal'],
              desc: 'Se revisarán las solicitudes reabiertas del período para identificar causas comunes, ajustar el procedimiento de cierre y reforzar la validación con el solicitante.',
              flujo: ['Análisis', 'Causas', 'Ajuste', 'Capacitación', 'Medición', 'Informe'],
            },
            {
              t: 'lista', n: '07', titulo: 'Compromisos',
              items: [
                ['Responsable', '{responsable} coordina el seguimiento del plan de acción.'],
                ['Próxima revisión', 'Al cierre del siguiente período mensual.'],
              ],
            },
          ],
        ],
      },
    ],
  },

  {
    id: 'legal',
    nombre: 'Legales',
    etiqueta: 'Documento legal',
    docs: [
      {
        id: 'politica-datos',
        nombre: 'Política de datos personales',
        titulo: 'Política de tratamiento de datos personales',
        resumen: 'Objeto, datos tratados, principios y derechos.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Objeto', cuerpo: 'Esta política describe cómo {empresa} recoge, usa, conserva y protege los datos personales de clientes, colaboradores y proveedores, y cómo las personas titulares pueden ejercer sus derechos.' },
            {
              t: 'tabla', n: '02', titulo: 'Datos tratados',
              cols: [{ h: 'Categoría', w: '24%' }, { h: 'Finalidad' }, { h: 'Conservación', w: '22%', der: true }],
              filas: [
                ['Identificación', 'Gestión de la relación comercial o laboral.', 'Vigencia + 5 años'],
                ['Contacto', 'Comunicaciones sobre los servicios contratados.', 'Vigencia de la relación'],
                ['Facturación', 'Emisión de documentos tributarios.', '6 años'],
                ['Navegación', 'Estadísticas agregadas de uso del sitio.', '12 meses'],
              ],
            },
            {
              t: 'rejilla', n: '03', titulo: 'Principios',
              items: [
                ['Licitud', 'Los datos se tratan con una base legal definida.'],
                ['Finalidad', 'Se usan solo para los fines informados.'],
                ['Proporcionalidad', 'Se recogen únicamente los datos necesarios.'],
                ['Seguridad', 'Se aplican medidas técnicas y organizativas de protección.'],
              ],
            },
          ],
          [
            {
              t: 'lista', n: '04', titulo: 'Derechos de las personas titulares',
              items: [
                ['Acceso', 'Conocer qué datos se tratan y con qué finalidad.'],
                ['Rectificación', 'Corregir datos inexactos o incompletos.'],
                ['Supresión', 'Pedir la eliminación cuando ya no sean necesarios.'],
                ['Oposición', 'Oponerse a determinados tratamientos.'],
                ['Portabilidad', 'Recibir sus datos en un formato estructurado.'],
              ],
            },
            {
              t: 'tarjeta', n: '05', titulo: 'Solicitudes',
              etiqueta: 'Procedimiento', nombre: 'Atención de solicitudes de derechos',
              resultado: 'Cada solicitud se responde por escrito y queda registrada.',
              cifra: ['Respuesta', '30 días', 'Plazo de ejemplo'],
              desc: 'Las solicitudes se reciben por los canales oficiales, se verifica la identidad de quien la presenta y se responde dentro del plazo informado.',
              flujo: ['Recepción', 'Verificación', 'Análisis', 'Respuesta', 'Registro', 'Archivo'],
            },
            { t: 'texto', n: '06', titulo: 'Vigencia', cuerpo: 'Esta política rige desde el {fecha} y se revisa al menos una vez al año.' },
          ],
        ],
      },
      {
        id: 'contrato-servicios',
        nombre: 'Contrato de servicios',
        titulo: 'Contrato de prestación de servicios',
        resumen: 'Partes, objeto, cláusulas, anexo y firmas.',
        paginas: [
          [
            {
              t: 'tabla', n: '01', titulo: 'Partes',
              cols: [{ h: 'Parte', w: '22%' }, { h: 'Nombre' }, { h: 'Calidad', w: '26%', der: true }],
              filas: [
                ['Cliente', '{empresa}', 'Contratante'],
                ['Prestador', 'Proveedor Demo Ltda.', 'Prestador de servicios'],
              ],
            },
            { t: 'texto', n: '02', titulo: 'Objeto', cuerpo: 'El Prestador se obliga a ejecutar para el Cliente los servicios descritos en el Anexo 1, en los plazos y condiciones que se indican en este contrato.' },
            {
              t: 'lista', n: '03', titulo: 'Cláusulas principales',
              items: [
                ['Plazo', 'El contrato rige desde su firma y por el período indicado en el Anexo 1.'],
                ['Precio y pago', 'El valor y la forma de pago se detallan en el Anexo 2.'],
                ['Confidencialidad', 'Las partes mantendrán reserva de la información que intercambien.'],
                ['Propiedad intelectual', 'Los entregables se ceden al Cliente una vez pagados.'],
              ],
            },
          ],
          [
            {
              t: 'lista', n: '04', titulo: 'Otras cláusulas', inicio: 5,
              items: [
                ['Datos personales', 'El Prestador tratará los datos solo según las instrucciones del Cliente.'],
                ['Término anticipado', 'Cualquiera de las partes podrá ponerle término con aviso escrito.'],
              ],
            },
            {
              t: 'tarjeta', n: '05', titulo: 'Anexo 1',
              etiqueta: 'Anexo 1', nombre: 'Descripción de los servicios',
              resultado: 'Servicios, entregables y plazos acordados por las partes.',
              cifra: ['Duración', '6 meses', 'Renovable'],
              flujo: ['Inicio', 'Levantamiento', 'Ejecución', 'Revisión', 'Entrega', 'Cierre'],
              cols: [{ h: 'Entregable', w: '26%' }, { h: 'Descripción' }, { h: 'Plazo', w: '16%', der: true }],
              filas: [
                ['Informe inicial', 'Diagnóstico y plan de trabajo.', 'Mes 1'],
                ['Implementación', 'Ejecución de los servicios acordados.', 'Meses 2–5'],
                ['Informe final', 'Resultados y recomendaciones.', 'Mes 6'],
              ],
            },
            { t: 'firmas', n: '06', titulo: 'Firmas', lugar: 'Santiago, {fecha}', partes: [['{empresa}', 'Cliente'], ['Proveedor Demo Ltda.', 'Prestador']] },
          ],
        ],
      },
    ],
  },

  {
    id: 'tecnico',
    nombre: 'Técnicos',
    etiqueta: 'Documento técnico',
    docs: [
      {
        id: 'informe-tecnico',
        nombre: 'Informe técnico',
        titulo: 'Informe técnico de arquitectura',
        resumen: 'Componentes, requisitos, arquitectura y riesgos.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Alcance', cuerpo: 'Este informe describe la arquitectura propuesta para la plataforma interna de {empresa}: sus componentes, cómo se comunican y los requisitos que debe cumplir para operar de forma segura y estable.' },
            {
              t: 'tabla', n: '02', titulo: 'Componentes',
              cols: [{ h: 'Componente', w: '24%' }, { h: 'Función' }, { h: 'Tipo', w: '20%', der: true }],
              filas: [
                ['Interfaz web', 'Acceso de usuarios y paneles de gestión.', 'Aplicación'],
                ['API', 'Reglas de negocio y comunicación entre módulos.', 'Servicio'],
                ['Base de datos', 'Registro central de la información.', 'Almacenamiento'],
                ['Automatizaciones', 'Tareas programadas y notificaciones.', 'Procesos'],
                ['Respaldo', 'Copias periódicas y recuperación.', 'Infraestructura'],
              ],
            },
            {
              t: 'rejilla', n: '03', titulo: 'Requisitos',
              items: [
                ['Disponibilidad', 'Operación continua en horario hábil, con monitoreo.'],
                ['Seguridad', 'Accesos por rol, cifrado y registro de actividad.'],
                ['Escalabilidad', 'Crecimiento por módulos sin rehacer la base.'],
                ['Mantenibilidad', 'Código documentado y despliegues reproducibles.'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '04', titulo: 'Arquitectura propuesta',
              etiqueta: 'Diseño', nombre: 'Plataforma modular por servicios',
              resultado: 'Módulos independientes conectados por una API común.',
              cifra: ['Módulos', '4', 'Fase inicial'],
              desc: 'Cada módulo resuelve una función acotada y se comunica con el resto a través de la API. Así se puede mejorar o reemplazar una pieza sin detener la plataforma completa.',
              flujo: ['Usuario', 'Interfaz web', 'API', 'Base de datos', 'Automatización', 'Respaldo'],
              cols: [{ h: 'Módulo', w: '24%' }, { h: 'Descripción' }, { h: 'Esfuerzo', w: '14%', der: true }],
              filas: [
                ['Accesos', 'Autenticación y permisos por rol.', 'Medio'],
                ['Registros', 'Gestión de la información principal.', 'Alto'],
                ['Reportes', 'Paneles e indicadores.', 'Medio'],
                ['Notificaciones', 'Correos y alertas automáticas.', 'Bajo'],
              ],
            },
            {
              t: 'tabla', n: '05', titulo: 'Riesgos técnicos',
              cols: [{ h: 'Riesgo', w: '26%' }, { h: 'Mitigación' }, { h: 'Nivel', w: '14%', der: true, estado: true }],
              filas: [
                ['Pérdida de datos', 'Respaldos diarios y pruebas de recuperación.', 'Alto'],
                ['Accesos indebidos', 'Permisos mínimos y registro de actividad.', 'Medio'],
                ['Dependencia de proveedor', 'Componentes estándar y documentación.', 'Bajo'],
              ],
            },
            {
              t: 'lista', n: '06', titulo: 'Recomendaciones',
              items: [
                ['Implementación por etapas', 'Comenzar por los módulos de accesos y registros, que sostienen al resto.'],
                ['Monitoreo desde el inicio', 'Activar alertas de disponibilidad y respaldo antes de pasar a producción.'],
              ],
            },
          ],
        ],
      },
      {
        id: 'requerimientos',
        nombre: 'Especificación de requerimientos',
        titulo: 'Especificación de requerimientos',
        resumen: 'Contexto, requerimientos, flujo y criterios.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Contexto', cuerpo: 'El área de operaciones de {empresa} necesita una herramienta para registrar y dar seguimiento a sus solicitudes. Este documento define qué debe hacer la solución y cómo se validará.' },
            {
              t: 'tabla', n: '02', titulo: 'Requerimientos funcionales',
              cols: [{ h: 'ID', w: '12%' }, { h: 'Requerimiento' }, { h: 'Prioridad', w: '16%', der: true, estado: true }],
              filas: [
                ['RF-01', 'Registrar solicitudes con formulario y adjuntos.', 'Alta'],
                ['RF-02', 'Asignar responsables y plazos.', 'Alta'],
                ['RF-03', 'Notificar cambios de estado por correo.', 'Media'],
                ['RF-04', 'Consultar el historial de cada solicitud.', 'Media'],
                ['RF-05', 'Exportar reportes mensuales.', 'Baja'],
              ],
            },
            {
              t: 'rejilla', n: '03', titulo: 'Requerimientos no funcionales',
              items: [
                ['Rendimiento', 'Pantallas que responden en menos de dos segundos.'],
                ['Seguridad', 'Acceso con usuario y permisos por rol.'],
                ['Usabilidad', 'Uso desde computador y celular sin capacitación extensa.'],
                ['Disponibilidad', 'Servicio activo durante el horario hábil.'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '04', titulo: 'Flujo principal',
              etiqueta: 'Caso de uso', nombre: 'Registro y seguimiento de una solicitud',
              resultado: 'La persona registra, sigue y cierra su solicitud desde un solo lugar.',
              cifra: ['Pasos', '6', 'Flujo principal'],
              desc: 'El flujo cubre desde el ingreso de la solicitud hasta su cierre, con avisos automáticos en cada cambio de estado y un historial consultable en todo momento.',
              flujo: ['Ingreso', 'Formulario', 'Asignación', 'Seguimiento', 'Notificación', 'Cierre'],
            },
            {
              t: 'lista', n: '05', titulo: 'Criterios de aceptación',
              items: [
                ['Registro completo', 'Toda solicitud queda guardada con fecha, autor y estado.'],
                ['Notificaciones', 'Cada cambio de estado genera un aviso al solicitante.'],
                ['Reportes', 'El reporte mensual coincide con los registros del período.'],
                ['Validación', '{responsable} aprueba la entrega tras una prueba con usuarios.'],
              ],
            },
            {
              t: 'tabla', n: '06', titulo: 'Entregables',
              cols: [{ h: 'Entregable', w: '28%' }, { h: 'Contenido' }, { h: 'Semana', w: '14%', der: true }],
              filas: [
                ['Prototipo', 'Pantallas principales para validar el flujo.', '1'],
                ['Versión de prueba', 'Funcionalidades RF-01 a RF-04 operativas.', '3'],
                ['Versión final', 'Reportes, ajustes y manual de uso.', '4'],
              ],
            },
          ],
        ],
      },
    ],
  },

  {
    id: 'comercial',
    nombre: 'Comerciales',
    etiqueta: 'Documento comercial',
    docs: [
      {
        id: 'propuesta',
        nombre: 'Propuesta comercial',
        titulo: 'Propuesta comercial',
        resumen: 'Contexto, alternativas, beneficios y condiciones.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Contexto', cuerpo: 'A partir de la reunión inicial con {empresa}, proponemos tres alternativas para ordenar y automatizar sus procesos de atención. Cada una responde a un nivel distinto de alcance y plazo.' },
            {
              t: 'tabla', n: '02', titulo: 'Alternativas',
              cols: [{ h: 'Alternativa', w: '24%' }, { h: 'Enfoque' }, { h: 'Plazo', w: '14%', der: true }, { h: 'Valor', w: '12%', der: true }],
              filas: [
                ['A · Esencial', 'Orden del proceso y herramientas básicas.', '2 semanas', '00 UF'],
                ['B · Integrada', 'Conexión entre sistemas y reportes.', '3 semanas', '00 UF'],
                ['C · Avanzada', 'Automatización completa y tablero de control.', '4 semanas', '00 UF'],
              ],
              nota: 'Valores de ejemplo: este documento solo muestra el formato.',
            },
            {
              t: 'rejilla', n: '03', titulo: 'Beneficios esperados',
              items: [
                ['Menos trabajo manual', 'Tareas repetitivas resueltas de forma automática.'],
                ['Información al día', 'Datos centralizados y disponibles para todas las áreas.'],
                ['Mejor servicio', 'Respuestas más rápidas y consistentes a los clientes.'],
                ['Decisiones con datos', 'Indicadores claros para evaluar el avance.'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '04', titulo: 'Alternativa recomendada',
              etiqueta: 'Alternativa B', nombre: 'Integración de procesos',
              resultado: 'Sistemas conectados, datos centralizados y reportes automáticos.',
              cifra: ['Implementación', '00 UF', 'Valor de ejemplo'],
              desc: 'La alternativa conecta las herramientas que hoy se usan por separado y deja un registro común para toda la información de atención, con un reporte que se actualiza solo.',
              flujo: ['Reunión inicial', 'Diagnóstico', 'Diseño', 'Implementación', 'Pruebas', 'Entrega'],
              cols: [{ h: 'Partida', w: '24%' }, { h: 'Alcance' }, { h: 'Plazo', w: '14%', der: true }],
              filas: [
                ['Diagnóstico', 'Revisión del proceso actual y prioridades.', 'Semana 1'],
                ['Integración', 'Conexión de sistemas y registro común.', 'Semana 2'],
                ['Reportes', 'Tablero con los indicadores principales.', 'Semana 3'],
              ],
              total: ['Total', 'Implementación de la alternativa', '3 semanas'],
            },
            {
              t: 'lista', n: '05', titulo: 'Condiciones',
              items: [
                ['Validez', 'Esta propuesta es válida por 30 días desde el {fecha}.'],
                ['Forma de pago', '50 % al inicio y 50 % contra entrega.'],
                ['Acompañamiento', 'Soporte posterior a la entrega durante 30 días.'],
              ],
            },
          ],
        ],
      },
      {
        id: 'caso-de-negocio',
        nombre: 'Caso de negocio',
        titulo: 'Caso de negocio',
        resumen: 'Situación, beneficios, escenarios y supuestos.',
        paginas: [
          [
            { t: 'texto', n: '01', titulo: 'Situación actual', cuerpo: 'Hoy, parte importante del tiempo del equipo de {empresa} se destina a tareas manuales de registro y consolidación de información. Este caso de negocio evalúa la conveniencia de automatizar esas tareas.' },
            { t: 'kpis', n: '02', titulo: 'Beneficios estimados', items: [['-30 %', 'Tiempo en tareas manuales'], ['+25 %', 'Capacidad de atención'], ['6', 'Meses de retorno'], ['0', 'Planillas duplicadas']] },
            {
              t: 'rejilla', n: '03', titulo: 'Criterios de evaluación',
              items: [
                ['Impacto', 'Horas liberadas y errores evitados en el proceso.'],
                ['Esfuerzo', 'Tiempo y recursos necesarios para implementar.'],
                ['Riesgo', 'Dependencias y efectos en la operación diaria.'],
                ['Escalabilidad', 'Capacidad de crecer con el negocio.'],
              ],
            },
            {
              t: 'tabla', n: '04', titulo: 'Comparación de escenarios',
              cols: [{ h: 'Escenario', w: '24%' }, { h: 'Descripción' }, { h: 'Esfuerzo', w: '14%', estado: true }, { h: 'Beneficio', w: '14%', der: true, estado: true }],
              filas: [
                ['Mantener', 'Continuar con el proceso actual.', 'Bajo', 'Bajo'],
                ['Mejorar', 'Ordenar el proceso sin nuevas herramientas.', 'Medio', 'Medio'],
                ['Automatizar', 'Rediseñar el proceso con automatización.', 'Medio', 'Alto'],
              ],
            },
          ],
          [
            {
              t: 'tarjeta', n: '05', titulo: 'Escenario recomendado',
              etiqueta: 'Escenario 03', nombre: 'Automatización del proceso',
              resultado: 'Mayor capacidad del equipo con la misma dotación.',
              cifra: ['Retorno', '6 meses', 'Estimación de ejemplo'],
              desc: 'Automatizar el registro y la consolidación libera horas del equipo para tareas de mayor valor y reduce los errores por digitación. La inversión se recupera con el tiempo ahorrado.',
              flujo: ['Decisión', 'Diseño', 'Implementación', 'Adopción', 'Medición', 'Ajuste'],
            },
            {
              t: 'tabla', n: '06', titulo: 'Cronograma estimado',
              cols: [{ h: 'Fase', w: '26%' }, { h: 'Actividades' }, { h: 'Plazo', w: '16%', der: true }],
              filas: [
                ['Diseño', 'Definición del proceso futuro y de las reglas.', 'Mes 1'],
                ['Implementación', 'Configuración, integración y pruebas.', 'Meses 2–3'],
                ['Adopción', 'Capacitación y acompañamiento al equipo.', 'Meses 4–6'],
              ],
            },
            {
              t: 'lista', n: '07', titulo: 'Supuestos',
              items: [
                ['Volumen', 'Se mantiene el volumen actual de operaciones durante el período.'],
                ['Adopción', 'El equipo usa la nueva herramienta desde el primer mes.'],
                ['Cifras', 'Los valores de este documento son de ejemplo y no constituyen una estimación real.'],
              ],
            },
          ],
        ],
      },
    ],
  },
];
