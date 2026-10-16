# Plan de Reestructuración y Escalabilidad
**Objetivo:** Transición de una arquitectura monolítica/básica a un sistema modular y asíncrono orientado a eventos, manteniendo la base actual (Frontend Vanilla JS y Bot de Telegram operativo).

**Regla de Oro:** Todo el stack es 100% Open Source. No se reescribe el código funcional; se refactoriza, se desacopla y se reubica dentro de la nueva estructura.

---

## 1. Stack Tecnológico (100% Open Source)

### Backend & Core
*   **Framework:** NestJS (Licencia MIT) - Orquestador principal, modular y estandarizado.
*   **Lenguaje:** Node.js + TypeScript (Licencia Apache 2.0 / Open Source).
*   **Message Broker (Colas):** Redis (Licencia BSD/RSALv2) + BullMQ (Licencia MIT) - Para manejar tareas asíncronas y peticiones pesadas de IA sin bloquear el servidor.
*   **Base de Datos:** PostgreSQL (Licencia PostgreSQL) - Robusta y relacional para historial de chats, usuarios y logs.

### Frontend
*   **Herramienta de Construcción:** Vite (Licencia MIT) - Para empaquetar, minificar y gestionar variables de entorno, manteniendo el código en Vanilla JS puro.
*   **Comunicación:** WebSockets nativos o Socket.io-client (Licencia MIT) para respuestas en tiempo real.

### Integraciones Existentes
*   **Bot de Telegram:** grammY o Telegraf (Licencias MIT) - Se mantienen pero se integran como un módulo dentro de NestJS.

---

## 2. Arquitectura Global (Orientada a Eventos)

El sistema se divide en dos grandes responsabilidades (Gateway y Workers) para garantizar que los procesos largos no congelen la página web ni el bot.

1.  **Recepción (API Gateway):** NestJS recibe el mensaje (de la Web o Telegram), lo valida y lo envía inmediatamente a una cola de Redis. Devuelve un estado de "procesando" al usuario.
2.  **Procesamiento (Workers):** Un proceso en segundo plano escucha la cola, toma el mensaje, ejecuta el prompt pesado en la IA y procesa la respuesta.
3.  **Entrega:** Una vez lista la respuesta, se guarda en PostgreSQL y se emite de vuelta al usuario correspondiente (vía WebSocket para la web, o vía API de Telegram para el bot).

---

## 3. Reestructuración del Backend (NestJS)

**Estrategia de migración:** Iniciar el proyecto NestJS en paralelo. Migrar primero los endpoints simples, luego encapsular la lógica actual del bot en el `TelegramModule`, y finalmente implementar las colas de Redis.

### Estructura de Directorios:
```text
backend/
├── src/
│   ├── api/                 # Endpoints REST y WebSockets (Conecta con la Web)
│   │   ├── chat.controller.ts
│   │   └── chat.gateway.ts
│   ├── telegram/            # El bot existente refactorizado como módulo
│   │   ├── telegram.module.ts
│   │   └── telegram.service.ts
│   ├── ai/                  # Lógica aislada de IA (Agnóstica al canal)
│   │   ├── ai.module.ts
│   │   └── gemini.service.ts
│   ├── queues/              # Gestión de asincronía y tareas pesadas
│   │   ├── ai.producer.ts   # Envía la tarea a Redis
│   │   └── ai.processor.ts  # El "Worker" que ejecuta la tarea
│   ├── database/            # Conexión a PostgreSQL (TypeORM o Prisma)
│   └── common/              # DTOs, Guards e Interceptores
├── docker-compose.yml       # Para levantar PostgreSQL y Redis localmente
├── .env                     # Variables de entorno (Tokens, BD, Puertos)
└── package.json


frontend/
├── index.html               # Punto de entrada
├── vite.config.js           # Configuración del empaquetador
├── src/
│   ├── components/          # Componentes visuales aislados
│   │   ├── chat-widget.js   # Lógica de la ventana de chat
│   │   └── ui-helpers.js    # Botones, modales, alertas
│   ├── services/            # Comunicación con el Backend
│   │   ├── api.js           # fetch() estándar (POST, GET)
│   │   └── websocket.js     # Conexión al socket para escuchar a la IA
│   ├── state/               # Manejo del estado en memoria
│   │   └── store.js         # Guarda el historial de mensajes localmente
│   ├── styles/              # CSS modularizado
│   │   └── chat.css
│   └── main.js              # Inicializa los componentes y sockets
└── package.json

Abstenerse de introducir lógica o implementaciones en directorios que excedan el alcance del código fuente actual. Se debe preservar exclusivamente el árbol de directorios vacío (habitualmente mediante archivos .gitkeep o esquemas equivalentes) para garantizar la escalabilidad arquitectónica y la futura extensibilidad del sistema.

5. Documentación Global y Estándar de Repositorios
El proyecto raíz contará con un README.md global que unificará la visión general del sistema, mientras que cada subdirectorio principal mantendrá su propia guía técnica aislada:
README.md (Global): Describirá a grandes rasgos la arquitectura de eventos, la interacción entre el frontend en Vite, el API Gateway en NestJS, los workers de Redis y el bot de Telegram, incluyendo instrucciones sobre el ciclo de vida del despliegue mediante Docker.
backend/README.md: Detallará la configuración de variables de entorno, la inicialización de módulos en NestJS, la gestión de colas con BullMQ/Redis y las directrices para conectar PostgreSQL.
frontend/README.md: Explicará los comandos de desarrollo y empaquetado con Vite, la estructura de componentes modulares en Vanilla JS y la integración de WebSockets.

1. Seguridad y Validación en el Backend (NestJS)
Para un sistema que maneja pasarelas de mensajería (Telegram) y procesamiento de IA, el backend debe blindarse contra inyecciones, abusos de recursos y accesos no autorizados.

Validación y Sanitización de Entradas (DTOs):

Utiliza class-validator y class-transformer en todos los DTOs (Data Transfer Objects) que ingresen por los endpoints REST o WebSockets.

Define reglas estrictas en los payloads (ej. @IsString(), @IsNotEmpty(), @MaxLength(1000)) para rechazar texto basura o malicioso antes de que llegue a la lógica de negocio o a las colas.

Protección contra ataques de denegación de servicio (Rate Limiting):

Implementa @nestjs/throttler para limitar el número de peticiones por IP hacia los endpoints de chat públicos. Esto evita que scripts maliciosos saturen tu cola de Redis o saturen la API de Gemini consumiendo tu cuota.

Seguridad de Cabeceras HTTP (Helmet):

Integra helmet en el archivo main.ts para configurar automáticamente cabeceras HTTP seguras contra ataques comunes como Cross-Site Scripting (XSS), Clickjacking y fugas de información del servidor.

Gestión Segura de Credenciales (Environment Variables):

Utiliza @nestjs/config con validación estricta (p. ej., usando Joi). Ninguna API Key de Gemini, token de Telegram o credencial de base de datos debe estar hardcodeada; el sistema debe fallar al arrancar si falta una variable de entorno crítica.

CORS Estricto:

Configura el middleware de CORS en NestJS para que solo acepte peticiones provenientes del dominio oficial de tu página web, bloqueando llamadas arbitrarias desde scripts externos:

TypeScript
app.enableCors({
  origin: 'https://tu-dominio.com',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type, Authorization',
});
Validación de Webhooks de Telegram:

Si utilizas Webhooks para el bot de Telegram, asegúrate de validar el token secreto o la IP de origen que envía Telegram para evitar que actores maliciosos inyecten mensajes falsos directamente a tu endpoint.

2. Seguridad y Buenas Prácticas en el Frontend (Vanilla JS + Vite)
Dado que el código de JavaScript en el navegador es completamente visible para el usuario final, la regla de oro es nunca almacenar secretos en el cliente.

Cero Secretos en el Frontend:
Las API Keys de Telegram o de Gemini jamás deben incluirse en el código del navegador o en los archivos empaquetados por Vite. Toda comunicación con servicios externos debe pasar obligatoriamente por tu API Gateway (NestJS).

Sanitización de Contenido (Prevención de XSS):
Como el chatbot renderizará respuestas generadas por texto (provenientes de la IA o de usuarios), nunca utilices innerHTML de forma directa con texto sin procesar, ya que un usuario malintencionado podría inyectar scripts maliciosos. Utiliza textContent para renderizar los mensajes de texto plano o implementa un sanitizador ligero (como DOMPurify) si necesitas permitir etiquetas HTML seguras.

Manejo Seguro de Sesiones y Estado:
Si manejas tokens de sesión temporal para los chats web, almacénalos preferiblemente en sessionStorage en lugar de localStorage para que expiren al cerrar la pestaña del navegador.
Manejo de Errores y Timeouts en las peticiones (fetch / WebSockets):
Implementa un sistema de timeout en las peticiones de red y manejo de reintentos (exponential backoff) para evitar que la interfaz de usuario se quede congelada indefinidamente si el backend o la cola de Redis experimentan alta carga.
