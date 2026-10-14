/* -------------------------------------------------------------
   Solicitud por etapas.

   El formulario vive en un panel que se abre sobre la misma página y
   avanza de a un paso: servicio, ubicación, formato de reunión y
   necesidad. Preguntar de a poco baja el abandono frente a un
   formulario largo mostrado de una vez.

   Lo que cambió al pasar al framework: el envío ya no habla con la
   API de Telegram desde el navegador. Se manda al backend, que
   valida lo mismo de nuevo, arma el resumen y publica el aviso. El
   token dejó de existir en el cliente.

   Nada se pierde a medio camino: cada respuesta se anota en un
   borrador del navegador (state/borrador.js) y al volver se ofrece
   retomar en el mismo paso. Si la persona se va a otra pestaña con
   algo escrito, se le recuerda al volver.
   ------------------------------------------------------------- */

import { $, $$, sinMovimiento } from './ui-helpers.js';
import { revisar, correoValido, telefonoValido, protegerCampo } from '../lib/texto.js';
import { limites } from '../state/store.js';
import { borrador } from '../state/borrador.js';
import { enviarConsulta } from '../services/api.js';
import { enlaceWhatsapp } from './contacto.js';

/* Cupo del formulario. Una solicitud de diagnóstico se manda una
   vez; varias seguidas desde el mismo equipo son un error o un
   script. La espera corta frena el doble clic. */
const CUPO = {
  sesion: 3,
  dia: 5,
  espera: 30000,
  mensajeSesion:
    'Ya enviaste tu solicitud. Te respondemos a la brevedad; si es urgente, escríbenos por WhatsApp.',
  mensajeDia:
    'Recibimos varias solicitudes tuyas hoy. Te contactamos nosotros, o escríbenos por WhatsApp.',
};

const PASOS = 4;

/* Campos de texto del formulario, en el orden en que aparecen. La
   lista es explícita para no guardar nunca un campo que se agregue
   después sin haberlo pensado. */
const CAMPOS = [
  'f-servicio-otro',
  'f-mensaje',
  'f-nombre',
  'f-empresa',
  'f-correo',
  'f-telefono',
];

const GRUPOS = ['servicios', 'ubicacion', 'reunion', 'dolores'];

const NOMBRE_PASO = ['', 'Servicio', 'Ubicación', 'Reunión', 'Tu necesidad'];

/* El guardado espera a que la persona deje de escribir: una escritura
   por tecla llenaría localStorage de trabajo inútil. */
const ESPERA_GUARDADO = 500;

export function iniciarSolicitud() {
  const panel = $('#panelSolicitud');
  const form = $('#formConsulta');

  /* terminos.html comparte este script y no tiene el formulario. */
  if (!panel || !form) return;

  const estado = $('#estadoForm');
  const resumen = $('#resumenForm');
  const listo = $('#formListo');
  const listaPasos = $('#solicitudPasos');
  const btnAbrir = $('#btnAbrirSolicitud');
  const btnAtras = $('#btnAtras');
  const btnSiguiente = $('#btnSiguiente');
  const botonesFinales = $('#botonesFinales');
  const btnWhatsapp = $('#btnWhatsapp');
  const btnCopiar = $('#btnCopiar');
  const btnOtra = $('#btnOtra');

  const cajaReanudar = $('#reanudarSolicitud');
  const detalleReanudar = $('#reanudarDetalle');
  const btnReanudar = $('#btnReanudar');
  const btnDescartar = $('#btnDescartarBorrador');

  const aviso = $('#avisoVolver');
  const avisoDetalle = $('#avisoDetalle');
  const btnAvisoVolver = $('#btnAvisoVolver');
  const btnAvisoCerrar = $('#btnAvisoCerrar');

  let pasoActual = 1;
  let focoPrevio = null;
  let enviado = false;
  let restaurando = false;
  let tempGuardado = 0;

  /* -- LECTURA DE RESPUESTAS ------------------------------- */

  const grupo = (nombre) => $(`.opciones[data-grupo="${nombre}"]`);

  function marcados(nombre) {
    const caja = grupo(nombre);
    if (!caja) return [];
    return $$('.opcion[aria-pressed="true"]', caja).map((b) => b.getAttribute('data-valor'));
  }

  function valor(id) {
    const el = $(`#${id}`);
    return el ? (el.value || '').trim() : '';
  }

  /* Un clic marca o desmarca. En los grupos de respuesta única
     además apaga el resto. */
  $$('.opciones').forEach((caja) => {
    const multiple = caja.getAttribute('data-multiple') === 'true';

    caja.addEventListener('click', (e) => {
      const opcion = e.target.closest('.opcion');
      if (!opcion) return;

      const activa = opcion.getAttribute('aria-pressed') === 'true';

      if (!multiple) {
        $$('.opcion', caja).forEach((o) => o.setAttribute('aria-pressed', 'false'));
      }
      opcion.setAttribute('aria-pressed', activa ? 'false' : 'true');

      caja.classList.remove('invalid');
      limpiarEstado();

      if (caja.getAttribute('data-grupo') === 'dolores') sincronizarChips();
    });
  });

  /* -- PROBLEMAS DE LA SECCIÓN "PROBLEMAS" --------------------
     Las fichas de más arriba y las tarjetas del paso 4 son la misma
     lista: marcar en una deja marcada la otra, para que nadie tenga
     que elegir dos veces lo mismo. */

  const contenedorChips = $('#chipsProblemas');
  const contador = $('#contadorChips');

  /* La ficha lleva su descripción dentro, así que el texto visible ya
     no sirve para emparejarla con la tarjeta del paso 4: manda
     `data-valor`, que es además lo que valida el backend. */
  const valorChip = (chip) => chip.getAttribute('data-valor') || '';

  function actualizarContador() {
    if (!contador) return;
    const n = marcados('dolores').length;
    contador.textContent = n === 1 ? '1 seleccionado' : `${n} seleccionados`;
  }

  /* De las tarjetas del paso 4 hacia las fichas de la sección */
  function sincronizarChips() {
    if (!contenedorChips) return;
    const activos = marcados('dolores');
    $$('.chip', contenedorChips).forEach((chip) => {
      chip.setAttribute('aria-pressed', activos.includes(valorChip(chip)) ? 'true' : 'false');
    });
    actualizarContador();
  }

  if (contenedorChips) {
    contenedorChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      const activo = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', activo ? 'false' : 'true');

      const caja = grupo('dolores');
      if (caja) {
        const valor = valorChip(chip);
        $$('.opcion', caja).forEach((o) => {
          if (o.getAttribute('data-valor') === valor) {
            o.setAttribute('aria-pressed', activo ? 'false' : 'true');
          }
        });
      }
      actualizarContador();
      anotarBorrador();
    });
  }

  /* -- BORRADOR: GUARDAR Y RETOMAR ---------------------------
     Cada respuesta se anota en el navegador. Al volver, el formulario
     ya viene con lo que había y se abre en el paso donde se dejó, en
     vez de obligar a rehacer los cuatro pasos. */

  let retomado = false;
  let seFueDelSitio = false;
  let saliendoAdentro = false;
  let tempAviso = 0;
  const tituloOriginal = document.title;

  function capturar() {
    const campos = {};
    CAMPOS.forEach((id) => {
      const v = valor(id);
      if (v) campos[id] = v;
    });

    const opciones = {};
    GRUPOS.forEach((nombre) => {
      const activos = marcados(nombre);
      if (activos.length) opciones[nombre] = activos;
    });

    const consent = $('#f-consent');

    return {
      paso: pasoActual,
      campos,
      opciones,
      consentimiento: !!(consent && consent.checked),
    };
  }

  /* El consentimiento solo no cuenta como avance: sin nada escrito ni
     marcado no hay solicitud que retomar. */
  function tieneContenido(datos) {
    if (!datos) return false;
    return (
      Object.keys(datos.campos || {}).length > 0 ||
      Object.keys(datos.opciones || {}).length > 0
    );
  }

  function guardarYa() {
    clearTimeout(tempGuardado);
    if (restaurando || enviado) return;

    const datos = capturar();
    if (tieneContenido(datos)) {
      borrador.guardar(datos);
      mostrarReanudar(datos);
    } else {
      borrador.limpiar();
      ocultarReanudar();
    }
  }

  /* Al escribir se espera un momento; al cambiar de paso o al salir de
     la pestaña se guarda de inmediato. */
  function anotarBorrador() {
    if (restaurando || enviado) return;
    clearTimeout(tempGuardado);
    tempGuardado = setTimeout(guardarYa, ESPERA_GUARDADO);
  }

  function pasoGuardado(datos) {
    const n = parseInt(datos && datos.paso, 10);
    return n >= 1 && n <= PASOS ? n : 1;
  }

  function detalleDe(datos) {
    const n = pasoGuardado(datos);
    return `Quedaste en el paso ${n} de ${PASOS}: ${NOMBRE_PASO[n]}.`;
  }

  /** Vuelca el borrador sobre el formulario y deja el paso alcanzado. */
  function aplicarBorrador(datos) {
    restaurando = true;
    try {
      CAMPOS.forEach((id) => {
        const el = $(`#${id}`);
        if (el) el.value = (datos.campos && datos.campos[id]) || '';
      });

      GRUPOS.forEach((nombre) => {
        const caja = grupo(nombre);
        if (!caja) return;
        const activos = (datos.opciones && datos.opciones[nombre]) || [];
        $$('.opcion', caja).forEach((o) => {
          const marcado = activos.includes(o.getAttribute('data-valor'));
          o.setAttribute('aria-pressed', marcado ? 'true' : 'false');
        });
      });

      const consent = $('#f-consent');
      if (consent) consent.checked = !!datos.consentimiento;

      sincronizarChips();
    } finally {
      restaurando = false;
    }

    pasoActual = pasoGuardado(datos);
  }

  function mostrarReanudar(datos) {
    if (!cajaReanudar) return;
    if (detalleReanudar) detalleReanudar.textContent = detalleDe(datos);
    cajaReanudar.hidden = false;
  }

  function ocultarReanudar() {
    if (cajaReanudar) cajaReanudar.hidden = true;
  }

  /* Deja el formulario como recién abierto y borra lo guardado. */
  function descartarBorrador() {
    restaurando = true;
    try {
      form.reset();
      $$('.opcion').forEach((o) => o.setAttribute('aria-pressed', 'false'));
      $$('.opciones').forEach((c) => c.classList.remove('invalid'));
      $$('.field.invalid').forEach((c) => c.classList.remove('invalid'));
      sincronizarChips();
    } finally {
      restaurando = false;
    }

    clearTimeout(tempGuardado);
    borrador.limpiar();
    retomado = false;
    pasoActual = 1;
    resumen.hidden = true;
    ocultarReanudar();
    ocultarAviso();
  }

  /* -- RECORDATORIO AL VOLVER AL SITIO -----------------------
     Si alguien se va a otra pestaña con la solicitud a medias, el
     título del navegador se lo recuerda mientras está fuera y un
     aviso le ofrece retomarla al volver. */

  function hayQueRetomar() {
    return !enviado && tieneContenido(capturar());
  }

  function mostrarAviso() {
    if (!aviso) return;
    const datos = borrador.leer() || capturar();
    if (avisoDetalle) avisoDetalle.textContent = detalleDe(datos);
    aviso.hidden = false;

    clearTimeout(tempAviso);
    tempAviso = setTimeout(ocultarAviso, 14000);
  }

  function ocultarAviso() {
    clearTimeout(tempAviso);
    if (aviso) aviso.hidden = true;
  }

  /* Aviso nativo del navegador al cerrar o navegar fuera. Sólo se
     engancha mientras el panel está abierto: registrarlo siempre
     costaría la caché de retroceso a todas las visitas.

     Los términos y la política son parte del mismo trámite, no una
     salida: se abren en esta misma ventana y vuelven con su propio
     botón, así que no corresponde preguntar nada. */
  function avisarAlSalir(e) {
    if (saliendoAdentro || !hayQueRetomar()) return;
    e.preventDefault();
    e.returnValue = '';
  }

  $$('[data-sale-del-formulario]').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      saliendoAdentro = true;
      guardarYa();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!hayQueRetomar()) return;
      guardarYa();
      seFueDelSitio = true;
      document.title = 'Tu solicitud quedó a medias - KRATEROI';
      return;
    }

    document.title = tituloOriginal;
    if (!seFueDelSitio) return;
    seFueDelSitio = false;
    if (panel.hidden && hayQueRetomar()) mostrarAviso();
  });

  /* pagehide cubre el cierre de pestaña y el paso a la caché de
     retroceso, donde beforeunload no siempre llega. */
  window.addEventListener('pagehide', () => {
    if (!restaurando && !enviado) {
      clearTimeout(tempGuardado);
      const datos = capturar();
      if (tieneContenido(datos)) borrador.guardar(datos);
    }
  });

  if (btnReanudar) {
    btnReanudar.addEventListener('click', () => {
      ocultarAviso();
      abrirSolicitud();
    });
  }

  if (btnDescartar) btnDescartar.addEventListener('click', descartarBorrador);

  if (btnAvisoVolver) {
    btnAvisoVolver.addEventListener('click', () => {
      ocultarAviso();
      const seccion = $('#contacto');
      if (seccion) seccion.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth' });
      abrirSolicitud();
    });
  }

  if (btnAvisoCerrar) btnAvisoCerrar.addEventListener('click', ocultarAviso);

  /* -- VALIDACIÓN ------------------------------------------ */

  function marcarError(id, hayError) {
    const campo = document.getElementById(id);
    const caja = campo && campo.closest('.field');
    if (caja) caja.classList.toggle('invalid', hayError);
  }

  function marcarGrupo(nombre, hayError) {
    const caja = grupo(nombre);
    if (caja) caja.classList.toggle('invalid', hayError);
  }

  /* Cada paso se valida por separado: así el aviso habla sólo de lo
     que la persona tiene delante. Las mismas reglas corren de nuevo
     en el backend, que es el que decide. */
  function validarPaso(n) {
    if (n === 1) {
      const otro = valor('f-servicio-otro');
      if (otro) {
        const rOtro = revisar(otro, 120);
        if (!rOtro.ok) {
          marcarError('f-servicio-otro', true);
          return { ok: false, motivo: `Lo que escribiste ${rOtro.motivo}.` };
        }
      }
      if (!marcados('servicios').length && !otro) {
        marcarGrupo('servicios', true);
        return {
          ok: false,
          motivo:
            'Marca al menos una opción, o escríbelo abajo. Si no lo tienes claro, "Todavía no lo sé" vale.',
        };
      }
      return { ok: true, motivo: '' };
    }

    if (n === 2) {
      if (!marcados('ubicacion').length) {
        marcarGrupo('ubicacion', true);
        return {
          ok: false,
          motivo: 'Dinos dónde está tu empresa para saber si podemos vernos en persona.',
        };
      }
      return { ok: true, motivo: '' };
    }

    if (n === 3) {
      if (!marcados('reunion').length) {
        marcarGrupo('reunion', true);
        return { ok: false, motivo: 'Elige cómo prefieres que conversemos.' };
      }
      return { ok: true, motivo: '' };
    }

    /* Paso 4: la necesidad, más los datos para poder responder */
    const problemas = [];
    const fallas = [];

    const dolores = marcados('dolores');
    const mensaje = valor('f-mensaje');
    const rMensaje = mensaje ? revisar(mensaje, 2000) : { ok: true, motivo: '' };

    marcarError('f-mensaje', !!mensaje && !rMensaje.ok);
    if (!rMensaje.ok) problemas.push(`La descripción ${rMensaje.motivo}.`);
    else if (!dolores.length && mensaje.length < 10) {
      marcarGrupo('dolores', true);
      return {
        ok: false,
        motivo: 'Marca lo que reconozcas de la lista o cuéntanoslo en el recuadro.',
      };
    }

    const nombre = valor('f-nombre');
    const rNombre = nombre ? revisar(nombre, 80) : { ok: false, motivo: '' };
    marcarError('f-nombre', !rNombre.ok);
    if (!nombre) fallas.push('nombre');
    else if (!rNombre.ok) problemas.push(`El nombre ${rNombre.motivo}.`);

    const empresa = valor('f-empresa');
    const rEmpresa = empresa ? revisar(empresa, 80) : { ok: true, motivo: '' };
    marcarError('f-empresa', !rEmpresa.ok);
    if (!rEmpresa.ok) problemas.push(`La empresa ${rEmpresa.motivo}.`);

    const correoOk = correoValido(valor('f-correo'));
    marcarError('f-correo', !correoOk);
    if (!correoOk) fallas.push('correo válido');

    const telOk = telefonoValido(valor('f-telefono'));
    marcarError('f-telefono', !telOk);
    if (!telOk) problemas.push('El teléfono debe ser sólo números.');

    if (!$('#f-consent').checked) fallas.push('autorización de contacto');

    if (problemas.length) return { ok: false, motivo: problemas.join(' ') };
    if (fallas.length) return { ok: false, motivo: `Falta completar: ${fallas.join(', ')}` };
    return { ok: true, motivo: '' };
  }

  /* Al enviar se revisan los cuatro pasos, no sólo el visible: si
     algo quedó atrás, el panel vuelve a ese paso y explica qué falta,
     en vez de mandar una solicitud incompleta. */
  function validarTodo() {
    for (let n = 1; n <= PASOS; n++) {
      const r = validarPaso(n);
      if (!r.ok) return { ok: false, motivo: r.motivo, paso: n };
    }
    return { ok: true, motivo: '', paso: PASOS };
  }

  function avisar(motivo) {
    estado.className = 'form-status err';
    estado.textContent = motivo;

    const primero = $(
      '.paso:not([hidden]) .field.invalid input, .paso:not([hidden]) .field.invalid textarea',
    );
    if (primero) primero.focus();
    else if (pasoActual === 4 && !$('#f-consent').checked) $('#f-consent').focus();
  }

  function limpiarEstado() {
    if (estado.classList.contains('err')) {
      estado.className = 'form-status';
      estado.textContent = textoGuia();
    }
  }

  function textoGuia() {
    return pasoActual === 4
      ? 'Revisa que todo esté bien y envíanos la solicitud.'
      : 'Elige al menos una opción para continuar.';
  }

  /* -- NAVEGACIÓN ------------------------------------------ */

  function irA(n) {
    pasoActual = n;

    $$('.paso', form).forEach((seccion) => {
      seccion.hidden = parseInt(seccion.getAttribute('data-paso'), 10) !== n;
    });

    $$('li', listaPasos).forEach((li) => {
      const i = parseInt(li.getAttribute('data-paso'), 10);
      li.classList.toggle('activo', i === n);
      li.classList.toggle('hecho', i < n);
    });

    btnAtras.textContent = n === 1 ? 'Salir' : 'Atrás';
    btnSiguiente.hidden = n === PASOS;
    botonesFinales.hidden = n !== PASOS;

    estado.className = 'form-status';
    estado.textContent = textoGuia();

    form.scrollTop = 0;

    /* El foco entra al encabezado del paso para que un lector de
       pantalla anuncie dónde quedó, no al primer botón. */
    const titulo = $('.paso:not([hidden]) .paso-titulo', form);
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
    }

    guardarYa();
  }

  function abrirSolicitud() {
    focoPrevio = document.activeElement;
    panel.hidden = false;
    document.body.classList.add('sin-scroll');
    ocultarAviso();
    sincronizarChips();

    /* Quien vuelve a un formulario a medio llenar necesita saber por
       qué no empieza en el paso 1. Se avisa una sola vez. */
    const retomando = retomado;
    retomado = false;

    irA(pasoActual);

    if (retomando) {
      estado.className = 'form-status ok';
      estado.textContent = `Retomamos donde quedaste: paso ${pasoActual} de ${PASOS}.`;
    }

    window.addEventListener('beforeunload', avisarAlSalir);
  }

  function cerrarSolicitud() {
    panel.hidden = true;
    document.body.classList.remove('sin-scroll');
    window.removeEventListener('beforeunload', avisarAlSalir);
    guardarYa();
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }

  if (btnAbrir) btnAbrir.addEventListener('click', abrirSolicitud);

  /* Sólo las llamadas a la acción abren el panel. El enlace
     "Contacto" de la navegación sigue llevando a la sección, que es
     lo que espera quien está recorriendo la página. */
  $$('[data-abre-solicitud]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const seccion = $('#contacto');
      if (seccion) seccion.scrollIntoView({ behavior: sinMovimiento ? 'auto' : 'smooth' });
      abrirSolicitud();
    });
  });

  $$('[data-cerrar]', panel).forEach((el) => el.addEventListener('click', cerrarSolicitud));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) cerrarSolicitud();
  });

  btnAtras.addEventListener('click', () => {
    if (pasoActual === 1) cerrarSolicitud();
    else irA(pasoActual - 1);
  });

  btnSiguiente.addEventListener('click', () => {
    const r = validarPaso(pasoActual);
    if (!r.ok) {
      avisar(r.motivo);
      return;
    }
    irA(Math.min(PASOS, pasoActual + 1));
  });

  /* -- DATOS Y RESUMEN ------------------------------------- */

  /* Los campos opcionales vacíos se omiten en vez de mandarse como
     cadena vacía: @IsOptional() del backend salta la validación
     cuando el campo no viene, pero una cadena vacía sí la corre y
     fallaría por longitud mínima. */
  function datosSolicitud() {
    const datos = {
      nombre: valor('f-nombre'),
      correo: valor('f-correo'),
      servicios: marcados('servicios'),
      ubicacion: marcados('ubicacion')[0] || '',
      reunion: marcados('reunion')[0] || '',
      dolores: marcados('dolores'),
    };

    const opcionales = {
      empresa: valor('f-empresa'),
      telefono: valor('f-telefono'),
      servicioOtro: valor('f-servicio-otro'),
      mensaje: valor('f-mensaje'),
    };

    Object.entries(opcionales).forEach(([clave, v]) => {
      if (v) datos[clave] = v;
    });

    return datos;
  }

  /* El mismo resumen que arma el backend para Telegram. Acá se usa
     para copiarlo o mandarlo por WhatsApp cuando el envío falla. */
  function armarResumen() {
    const d = datosSolicitud();

    const lineas = [
      'NUEVA SOLICITUD DESDE EL SITIO',
      '',
      `Nombre: ${d.nombre || '-'}`,
      `Correo: ${d.correo || '-'}`,
      `Empresa: ${d.empresa || '-'}`,
      `Teléfono: ${d.telefono || '-'}`,
      '',
      `Servicios: ${d.servicios.length ? d.servicios.join(', ') : '-'}`,
    ];

    if (d.servicioOtro) lineas.push(`Otro servicio: ${d.servicioOtro}`);

    lineas.push(`Ubicación: ${d.ubicacion || '-'}`, `Formato de reunión: ${d.reunion || '-'}`);

    if (d.dolores.length) {
      lineas.push('', 'Lo que más le cuesta hoy:');
      d.dolores.forEach((x) => lineas.push(`- ${x}`));
    }

    lineas.push('', 'Necesidad:', d.mensaje || '-');

    return lineas.join('\n');
  }

  /* -- ENVÍO ----------------------------------------------- */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const r = validarTodo();
    if (!r.ok) {
      resumen.hidden = true;
      if (r.paso !== pasoActual) irA(r.paso);
      avisar(r.motivo);
      return;
    }

    const cupo = limites.consultar('contacto', CUPO);
    if (!cupo.ok) {
      estado.className = 'form-status err';
      estado.textContent = cupo.motivo;
      return;
    }

    const btnSubmit = $('button[type="submit"]', botonesFinales);
    const textoOriginal = btnSubmit ? btnSubmit.textContent : 'Enviar';
    if (btnSubmit) {
      btnSubmit.textContent = 'Enviando...';
      btnSubmit.disabled = true;
    }

    estado.className = 'form-status';
    estado.textContent = 'Enviando tu solicitud...';

    try {
      await enviarConsulta(datosSolicitud());
      limites.anotar('contacto');
      mostrarListo();
    } catch (err) {
      console.error('Error al enviar la solicitud:', err);
      estado.className = 'form-status err';

      if (err.status === 429) {
        /* El backend ya no acepta más desde esta IP: anotarlo acá
           evita que el navegador siga insistiendo. */
        limites.anotar('contacto');
        estado.textContent = err.message;
      } else if (!err.status) {
        /* Sin red: el resumen queda a la vista para que la persona
           pueda copiarlo y enviarlo por otro medio. */
        estado.textContent = `${err.message} El resumen quedó abajo para que puedas copiarlo.`;
        resumen.textContent = armarResumen();
        resumen.hidden = false;
      } else {
        estado.textContent = err.message;
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.textContent = textoOriginal;
        btnSubmit.disabled = false;
      }
    }
  });

  function mostrarListo() {
    enviado = true;
    clearTimeout(tempGuardado);
    borrador.limpiar();
    ocultarReanudar();
    ocultarAviso();
    window.removeEventListener('beforeunload', avisarAlSalir);

    resumen.hidden = true;
    $$('.paso', form).forEach((s) => (s.hidden = true));
    listaPasos.hidden = true;
    $('.solicitud-botones').hidden = true;
    estado.textContent = '';
    listo.hidden = false;
    listo.setAttribute('tabindex', '-1');
    listo.focus();
  }

  form.addEventListener('input', (e) => {
    const campo = e.target.closest('.field');
    if (campo) campo.classList.remove('invalid');
    limpiarEstado();
    anotarBorrador();
  });

  /* Ningún campo del formulario acepta imágenes ni archivos */
  $$('input[type="text"], input[type="email"], input[type="tel"], textarea', form).forEach(
    (campo) => {
      protegerCampo(campo, (aviso) => {
        estado.className = 'form-status err';
        estado.textContent = aviso;
      });
    },
  );

  /* -- VÍAS ALTERNATIVAS ----------------------------------- */

  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', () => {
      const revision = validarTodo();
      if (!revision.ok) {
        if (revision.paso !== pasoActual) irA(revision.paso);
        avisar(revision.motivo);
        return;
      }

      const destino = enlaceWhatsapp(armarResumen());
      if (!destino) {
        estado.className = 'form-status err';
        estado.textContent = 'Falta el número de WhatsApp en la configuración del sitio.';
        return;
      }

      estado.className = 'form-status ok';
      estado.textContent = 'Abriendo WhatsApp con tu resumen. Revísalo antes de enviarlo.';
      window.open(destino, '_blank', 'noopener');
    });
  }

  if (btnCopiar) {
    btnCopiar.addEventListener('click', () => {
      const texto = armarResumen();
      resumen.textContent = texto;
      resumen.hidden = false;

      const contarResultado = (ok) => {
        estado.className = `form-status ${ok ? 'ok' : 'err'}`;
        estado.textContent = ok
          ? 'Resumen copiado. Pégalo donde prefieras.'
          : 'No se pudo copiar. El resumen quedó abajo para seleccionarlo.';
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
          () => contarResultado(true),
          () => contarResultado(false),
        );
      } else {
        contarResultado(false);
      }
    });
  }

  if (btnOtra) {
    btnOtra.addEventListener('click', () => {
      listo.hidden = true;
      listaPasos.hidden = false;
      $('.solicitud-botones').hidden = false;

      enviado = false;
      descartarBorrador();

      window.addEventListener('beforeunload', avisarAlSalir);
      irA(1);
    });
  }

  /* -- ARRANQUE ----------------------------------------------
     Si quedó un borrador vigente, el formulario nace con lo que había
     y apuntando al paso donde se dejó: al abrirlo no hay que rehacer
     los pasos anteriores. */

  const guardado = borrador.leer();
  if (guardado && tieneContenido(guardado)) {
    aplicarBorrador(guardado);
    retomado = true;
    mostrarReanudar(guardado);

    /* El botón de vuelta de terminos.html trae ?solicitud=retomar. Se
       abre el panel solo y se limpia el parámetro del historial, para
       que recargar la página no lo vuelva a abrir. */
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('solicitud') === 'retomar') {
      parametros.delete('solicitud');
      const cola = parametros.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname + (cola ? `?${cola}` : '') + window.location.hash,
      );
      abrirSolicitud();
    }
  }
}
