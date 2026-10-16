# Backend — API Gateway (NestJS)

Recibe las peticiones del sitio, las valida y responde. Las dos integraciones
externas ocurren acá y nunca en el navegador: el aviso de Telegram cuando llega
una solicitud, y la consulta al modelo cuando alguien escribe al asistente.

## Requisitos

- Node.js 20+
- Docker (para Redis y Postgres locales)

## Puesta en marcha

```bash
cp .env.example .env   # completar TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GEMINI_API_KEY, POSTGRES_PASSWORD
docker compose up -d   # levanta redis y postgres
npm install
npm run start:dev
```

El proceso **falla al arrancar** si falta una variable de entorno requerida
(`src/common/config/validation.schema.ts`, validado con Joi) — es intencional,
para no correr con credenciales a medias.

## Variables de entorno

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP del backend (default `3000`) |
| `CORS_ORIGIN` | Único origen permitido (el dominio del frontend) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Credenciales del bot (BotFather) |
| `GEMINI_API_KEY` | Clave del asistente (Google AI Studio) |
| `REDIS_HOST` / `REDIS_PORT` | Conexión de BullMQ (`docker-compose.yml`) |
| `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Conexión de TypeORM (`docker-compose.yml`) |

Ninguna de estas puede existir en el frontend: Vite escribe sus variables
literales dentro del paquete que descarga el visitante.

## Endpoints

| Ruta | Qué hace | Cupo por IP |
|---|---|---|
| `POST /api/consulta` | Valida la solicitud del formulario, arma el resumen y lo publica en Telegram | 5 por hora |
| `POST /api/chat` | Valida el turno nuevo y pide la respuesta al modelo | 30 por hora |
| `GET /api/health` | Estado del proceso y de Postgres y Redis. La usa la sonda de Docker y sirve para un monitor externo | sin cupo |

Sobre los dos primeros corre además el límite global de 30 peticiones por
minuto. `/api/health` queda fuera a propósito: la sonda pregunta cada quince
segundos y se comería el cupo del visitante.

`/api/health` responde 200 aunque Postgres o Redis estén caídos, y el estado de
cada uno va en el cuerpo. Es deliberado: hoy ningún endpoint del sitio depende
de Postgres, así que marcar el contenedor como enfermo por eso sacaría de
circulación un backend que funciona.

## Estructura

Una carpeta por responsabilidad, con el módulo de Nest que la registra.

### Código

| Archivo | Contenido |
|---|---|
| `src/main.ts` | Arranque: helmet, CORS estricto, `ValidationPipe` global y puerto |
| `src/app.module.ts` | Módulo raíz: config con Joi, límite global de peticiones y los cinco módulos del sistema |
| `src/api/consulta.controller.ts` | `POST /api/consulta`. Valida las reglas que cruzan campos y publica el aviso |
| `src/api/chat.controller.ts` | `POST /api/chat`. Pasa el turno nuevo por el filtro y pide la respuesta al modelo |
| `src/api/chat.gateway.ts` | WebSocket reservado, sin eventos. Su día llega cuando el chat pase por colas |
| `src/api/api.module.ts` | Registra los dos controladores y el gateway |
| `src/telegram/telegram.service.ts` | Arma el resumen de la solicitud y lo publica con la API del bot |
| `src/telegram/telegram.module.ts` | Registra y exporta el servicio de Telegram |
| `src/ai/gemini.service.ts` | Instrucción de sistema del agente, llamada al proveedor, reintentos y lectura de la respuesta |
| `src/ai/ai.module.ts` | Registra y exporta el servicio del modelo |
| `src/queues/queues.module.ts` | Conexión BullMQ/Redis lista, sin colas registradas todavía |
| `src/database/database.module.ts` | Conexión TypeORM/Postgres en segundo plano, sin entities todavía |
| `src/common/catalogos.ts` | Las opciones cerradas del formulario y los helpers que filtran contra ellas |
| `src/common/config/validation.schema.ts` | Esquema Joi de las variables de entorno. Es lo que hace fallar el arranque |
| `src/common/dto/create-consulta.dto.ts` | La solicitud por etapas: campos, catálogos y las dos reglas que cruzan pasos |
| `src/common/dto/chat.dto.ts` | La conversación: roles, ventana de doce turnos y el turno nuevo que pasa por el filtro |
| `src/common/validation/texto-natural.validator.ts` | El filtro de entrada como decorador reutilizable (`@EsTextoNatural()`) |

### Configuración del proyecto

| Archivo | Contenido |
|---|---|
| `.env.example` | Plantilla de variables, con los valores vacíos. El `.env` real no se versiona |
| `docker-compose.yml` | Redis y Postgres locales |
| `nest-cli.json` | Configuración de la CLI de Nest (build y assets) |
| `tsconfig.json` / `tsconfig.build.json` | TypeScript: el segundo excluye tests y `dist` del build |
| `eslint.config.mjs` / `.prettierrc` | Estilo del código |

`catalogos.ts` tiene exactamente las opciones que ofrece la solicitud por
etapas del sitio. El DTO valida contra ellas y el resumen de Telegram las usa
sin repetirlas: si el formulario suma una opción, se agrega en un solo lugar.
Lo que no calce se descarta en silencio — no es un error del visitante, es un
cliente manipulado.

La conexión a Postgres (`database/database.module.ts`) se dispara en segundo
plano al arrancar: si Postgres no está corriendo, el backend igual levanta
(nada depende hoy de la base de datos) y solo se ve un `WARN` en el log.

`queues/` y `database/` siguen intencionalmente vacíos: hoy el asistente
responde en la misma petición HTTP porque una consulta tarda segundos, no
minutos. Cuando eso deje de ser cierto, `queues/` encola el procesamiento y
`database/` guarda el historial; recién ahí tiene sentido el WebSocket de
`api/chat.gateway.ts`.

## Tres cosas del proveedor de IA aprendidas midiendo

Están comentadas en `ai/gemini.service.ts` para no volver a descubrirlas:

1. `generation_config.thinking_level` es un parámetro aceptado, pero devuelve
   500 con cualquier valor válido en este modelo. Va omitido a propósito.
2. El razonamiento consume el presupuesto de salida: con un tope bajo la
   respuesta llega vacía. Por eso `max_output_tokens` va holgado.
3. El endpoint devuelve 500 intermitentes con frecuencia, de ahí los tres
   intentos con espera creciente. El 429 no se reintenta: es cuota, e insistir
   sólo la empeora.

## Seguridad implementada

- **Helmet** en `main.ts`: cabeceras HTTP seguras por defecto.
- **CORS estricto**: solo acepta `CORS_ORIGIN`, sin comodines.
- **`ValidationPipe` global** con `whitelist` y `forbidNonWhitelisted`: rechaza
  con 400 cualquier campo no declarado en el DTO o que no cumpla sus reglas.
- **Filtro de texto natural** (`common/validation/texto-natural.validator.ts`):
  sin enlaces, archivos, marcado, emojis, caracteres invisibles ni intentos de
  reescribir las instrucciones del agente. Es la copia autorizada del filtro
  del navegador — si cambia uno, cambia el otro.
- **`@nestjs/throttler`**: 30 req/min global, más los cupos por endpoint de la
  tabla de arriba. El contador vive en Redis y no en la memoria del proceso, así
  que sobrevive a un redespliegue —antes cada reinicio devolvía el cupo a cero,
  justo lo que le sirve a quien está abusando— y sería el mismo para varias
  instancias del backend.
- **`trust proxy`**: en producción el backend recibe a nginx, no al visitante.
  Sin esa línea el límite por IP agrupaba a todo el sitio en un solo contador.
  Ver la sección de despliegue del README raíz.
- **Config con Joi**: el proceso no arranca si falta una variable crítica.
- Sin webhook de Telegram implementado (el bot sólo envía, no recibe), así que
  no aplica todavía la validación de secret token. Si se agrega un webhook, hay
  que sumar esa verificación.

## Verificación

`npm run build` compila sin errores. Con las rutas montadas se comprobó, contra
el servidor corriendo, que:

- una solicitud completa llega a Telegram (con token de prueba responde 500,
  que es lo esperado: la petición salió y el proveedor la rechazó);
- un servicio, ubicación o dolor fuera de catálogo devuelve 400;
- un campo no declarado devuelve 400;
- un mensaje con enlaces, emojis o inyección devuelve 400 con el motivo;
- un historial de más de doce turnos devuelve 400;
- el sexto envío en una hora devuelve 429.
