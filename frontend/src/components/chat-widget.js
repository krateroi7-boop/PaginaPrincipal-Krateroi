/* -------------------------------------------------------------
   Asistente conversacional.

   Widget flotante que hace un diagnóstico comercial inicial.

   El marcado se construye desde JavaScript a propósito: así no queda
   un botón muerto si el script no carga, y las dos páginas del sitio
   reciben el asistente sin duplicar HTML.

   Lo que cambió al pasar al framework: la llamada al modelo salía
   del navegador con la clave de Gemini a la vista. Ahora se manda a
   POST /api/chat y el backend es el único que conoce la clave, arma
   la instrucción de sistema y reintenta los 500 del proveedor. Acá
   quedó lo que le corresponde al cliente: filtrar la entrada, llevar
   el cupo, guardar el historial y pintar.
   ------------------------------------------------------------- */

import { $, ocultarSvg, enviarFormulario } from './ui-helpers.js';
import { revisar, protegerCampo } from '../lib/texto.js';
import { limites, historial } from '../state/store.js';
import { enviarMensajeChat } from '../services/api.js';
import '../styles/chat.css';

const MAX_CARACTERES = 1200;

/* Cupo del asistente. Una conversación de diagnóstico se resuelve en
   pocos turnos; el resto es la conversación con el equipo. El tope
   por IP lo pone el backend, que sí ve la dirección real. */
const CUPO = {
  sesion: 15,
  dia: 40,
  espera: 2000,
  mensajeSesion:
    'Llegaste al límite de mensajes de esta sesión. Cuéntanos el caso por el formulario y lo revisa una persona.',
  mensajeDia:
    'Ya usaste el asistente bastante por hoy. Escríbenos por el formulario o por WhatsApp y seguimos por ahí.',
};

const SALUDO =
  'Hola. Soy el asistente de Krateroi. Cuéntame qué proceso de tu empresa te gustaría mejorar o qué tarea te está quitando tiempo.';

/* Casos habituales: son los que mejor muestran que el agente
   diagnostica antes de proponer una solución. */
const EJEMPLOS = [
  'Perdemos reservas porque llegan por WhatsApp y a veces nadie responde.',
  'Llevamos el inventario en Excel y cada venta la descontamos a mano.',
  'Copiamos la misma información de un sistema a otro todos los días.',
];

const MARCADO = `
<section class="chat-panel" id="chatPanel" role="dialog" aria-label="Asistente de Krateroi" hidden>
  <header class="chat-head">
    <div class="chat-quien">
      <span class="chat-avatar" aria-hidden="true"><img src="/assets/images/krateroi-icon.png" alt="" width="1254" height="1254" /></span>
      <span class="chat-quien-txt">
        <b>Asistente Krateroi</b>
        <span>Diagnóstico inicial para PYMES</span>
      </span>
    </div>
    <div class="chat-acciones">
      <button class="chat-icon" type="button" id="chatReiniciar" aria-label="Reiniciar conversación">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
      </button>
      <button class="chat-icon" type="button" id="chatCerrar" aria-label="Cerrar chat">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </header>
  <div class="chat-log" id="chatLog" role="log" aria-live="polite" aria-atomic="false"></div>
  <form class="chat-form" id="chatForm">
    <div class="chat-row">
      <textarea id="chatTexto" rows="2" maxlength="1200" placeholder="Ej: Perdemos reservas por WhatsApp..." aria-label="Escribe tu mensaje" spellcheck="true"></textarea>
      <button class="chat-enviar" type="submit" aria-label="Enviar mensaje">
        <svg class="chat-i-enviar" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12 20 4l-4 16-4.5-6.5L4 12Z"/></svg>
        <svg class="chat-i-espera" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true" hidden><path d="M12 3a9 9 0 1 0 9 9"/></svg>
      </button>
    </div>
    <p class="chat-nota">Demo de diagnóstico: las soluciones las evalúa el equipo. No se guardan las conversaciones ni se piden datos sensibles. <a href="terminos.html#t7">Cómo funciona el asistente</a>.</p>
  </form>
</section>
<button class="chat-fab" id="chatFab" type="button" aria-expanded="false" aria-controls="chatPanel" aria-label="Abrir asistente Krateroi">
  <svg class="chat-i-abrir" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.6L3 21l1.7-4.4A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z"/></svg>
  <svg class="chat-i-cerrar" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" hidden><path d="M18 6 6 18M6 6l12 12"/></svg>
  <span class="chat-fab-txt">Hablar con Krateroi</span>
</button>`;

export function iniciarChat() {
  const monta = document.createElement('div');
  monta.className = 'chat-monta';
  monta.innerHTML = MARCADO;
  document.body.appendChild(monta);

  const panel = $('#chatPanel', monta);
  const fab = $('#chatFab', monta);
  const log = $('#chatLog', monta);
  const form = $('#chatForm', monta);
  const campo = $('#chatTexto', monta);
  const btnEnviar = $('.chat-enviar', monta);
  const iconoEnviar = $('.chat-i-enviar', monta);
  const iconoEspera = $('.chat-i-espera', monta);
  const iconoAbrir = $('.chat-i-abrir', monta);
  const iconoCerrar = $('.chat-i-cerrar', monta);
  const btnCerrar = $('#chatCerrar', monta);
  const btnReiniciar = $('#chatReiniciar', monta);

  let abierto = false;
  let cargando = false;
  let burbujaEspera = null;

  const alFinal = () => {
    log.scrollTop = log.scrollHeight;
  };

  /* textContent y nunca innerHTML: lo que escribe el visitante y lo
     que responde el modelo se pintan como texto, no como marcado. */
  function pintar(rol, texto) {
    const fila = document.createElement('div');
    fila.className = `chat-fila ${rol === 'user' ? 'mio' : 'suyo'}`;

    const burbuja = document.createElement('div');
    burbuja.className = 'chat-burbuja';
    burbuja.textContent = texto;

    fila.appendChild(burbuja);
    log.appendChild(fila);
    alFinal();
    return fila;
  }

  function pintarEjemplos() {
    const caja = document.createElement('div');
    caja.className = 'chat-chips';

    EJEMPLOS.forEach((ejemplo) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chat-chip';
      chip.textContent = ejemplo;
      chip.addEventListener('click', () => {
        if (cargando) return;
        campo.value = ejemplo;
        enviarFormulario(form);
      });
      caja.appendChild(chip);
    });

    log.appendChild(caja);
    alFinal();
  }

  function quitarEjemplos() {
    const caja = $('.chat-chips', log);
    if (caja) caja.remove();
  }

  function quitarError() {
    const previo = $('.chat-error', log);
    if (previo) previo.remove();
  }

  function mostrarError(texto) {
    quitarError();
    const aviso = document.createElement('p');
    aviso.className = 'chat-error';
    aviso.setAttribute('role', 'alert');
    aviso.textContent = texto;
    log.appendChild(aviso);
    alFinal();
  }

  /* Repinta lo que quedó de la conversación en esta pestaña. */
  function restaurar() {
    const guardados = historial.leer();
    log.innerHTML = '';

    if (!guardados.length) {
      historial.agregar('assistant', SALUDO);
      pintar('assistant', SALUDO);
      pintarEjemplos();
      return;
    }

    guardados.forEach((m) => pintar(m.role, m.content));
    if (guardados.length === 1) pintarEjemplos();
  }

  function reiniciar() {
    if (cargando) return;
    historial.limpiar();
    campo.value = '';
    restaurar();
  }

  function ocupado(si) {
    cargando = si;
    campo.disabled = si;
    btnEnviar.disabled = si;
    btnReiniciar.disabled = si;
    ocultarSvg(iconoEnviar, si);
    ocultarSvg(iconoEspera, !si);

    if (si) {
      burbujaEspera = pintar('assistant', 'Analizando tu caso...');
      burbujaEspera.classList.add('esperando');
    } else if (burbujaEspera) {
      burbujaEspera.remove();
      burbujaEspera = null;
    }
  }

  function abrir(si) {
    abierto = si;
    panel.hidden = !si;
    fab.setAttribute('aria-expanded', si ? 'true' : 'false');
    fab.setAttribute('aria-label', si ? 'Cerrar asistente Krateroi' : 'Abrir asistente Krateroi');
    ocultarSvg(iconoAbrir, si);
    ocultarSvg(iconoCerrar, !si);
    document.body.classList.toggle('chat-abierto', si);

    if (si) {
      campo.focus();
      if (historial.leer().length <= 1) log.scrollTop = 0;
      else alFinal();
    } else {
      fab.focus();
    }
  }

  /* Pegar una imagen o soltar un archivo no debe dejar nada en el
     campo, ni siquiera su nombre. */
  protegerCampo(campo, mostrarError);

  fab.addEventListener('click', () => abrir(!abierto));
  btnCerrar.addEventListener('click', () => abrir(false));
  btnReiniciar.addEventListener('click', reiniciar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && abierto) abrir(false);
  });

  /* Enter envía, Shift+Enter salta de línea */
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarFormulario(form);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const texto = campo.value.trim();
    if (!texto || cargando) return;

    /* Sólo texto natural: sin enlaces, archivos, emojis, marcado ni
       instrucciones dirigidas al agente. El backend revisa lo mismo
       sobre el último turno, que es el único que puede traerlas. */
    const revision = revisar(texto, MAX_CARACTERES);
    if (!revision.ok) {
      mostrarError(`Tu mensaje ${revision.motivo}. Escríbelo como se lo contarías a una persona.`);
      return;
    }

    const cupo = limites.consultar('chat', CUPO);
    if (!cupo.ok) {
      mostrarError(cupo.motivo);
      return;
    }
    limites.anotar('chat');

    quitarError();
    quitarEjemplos();
    historial.agregar('user', texto);
    pintar('user', texto);
    campo.value = '';
    ocupado(true);

    try {
      const respuesta = await enviarMensajeChat(historial.recientes());
      ocupado(false);
      historial.agregar('assistant', respuesta);
      pintar('assistant', respuesta);
    } catch (err) {
      console.error('Error en el asistente:', err);
      ocupado(false);
      mostrarError(err.message || 'No fue posible conectar con el asistente.');
    }
  });

  restaurar();
}
