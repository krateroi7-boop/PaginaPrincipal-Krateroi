/* -------------------------------------------------------------
   Canal en tiempo real con el backend.

   Reservado, sin implementar a propósito. Hoy el asistente responde
   en la misma petición HTTP (services/api.js) porque el backend
   contesta directo: no hay cola de por medio y no hay nada que
   escuchar.

   Cuando el chat pase por BullMQ, el flujo será: el gateway acepta
   el mensaje, devuelve un identificador y el worker publica la
   respuesta acá. Ese día este archivo abre el socket contra
   `VITE_WS_URL`, reconecta con espera creciente y emite la respuesta
   al componente; chat-widget.js pasa a escuchar en vez de esperar
   el fetch.

   Se deja el archivo, y no sólo la carpeta, porque su ausencia sería
   la pregunta "¿dónde iría esto?" repetida en cada revisión.
   ------------------------------------------------------------- */

export const tiempoRealDisponible = false;
