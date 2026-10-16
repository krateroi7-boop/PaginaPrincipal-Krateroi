# Sitio de consultoría en automatización, IA y software a la medida

Monorepo con dos proyectos independientes:

- **`frontend/`** — el sitio (Vanilla JS + Vite).
- **`backend/`** — API Gateway (NestJS) que valida lo que llega del sitio, envía
  el aviso de Telegram y consulta al modelo del asistente. Nunca hay tokens en
  el navegador.

Arquitectura orientada a eventos, pensada para poder crecer sin bloquear la
página ni el bot cuando el procesamiento de IA deje de resolverse en segundos:

1. **Recepción (`backend/src/api`)**: el gateway NestJS recibe la petición del
   frontend, la valida (DTOs con `class-validator` más el filtro de texto
   natural) y responde.
2. **Procesamiento (`backend/src/telegram`, `backend/src/ai`)**: el aviso de
   Telegram y la consulta al modelo salen desde acá. Cuando una consulta pase a
   costar minutos en vez de segundos, se encola con BullMQ/Redis
   (`backend/src/queues`) en vez de bloquear la respuesta.
3. **Entrega**: hoy la respuesta vuelve en la misma petición HTTP. A futuro, con
   trabajo encolado, se guarda en Postgres (`backend/src/database`) y se emite
   de vuelta por WebSocket (`backend/src/api/chat.gateway.ts`, reservado y sin
   usar todavía).

## Puesta en marcha local

```bash
cd backend
cp .env.example .env      # completar los tokens y la clave del asistente
docker compose up -d      # Redis + Postgres
npm install
npm run start:dev         # http://localhost:3000

# en otra terminal
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:5173
```

Detalle de cada proyecto en [`backend/README.md`](backend/README.md) y
[`frontend/README.md`](frontend/README.md).

---

## Qué es

Presenta la consultoría como un equipo que **entiende la operación del cliente,
detecta oportunidades de automatización e inteligencia artificial, recomienda qué
conviene hacer y, cuando corresponde, lo construye**.

El enfoque no es "tenemos estas automatizaciones para vender", sino "cuéntanos qué
te hace perder tiempo y lo analizamos". Por eso la página empieza por el problema
y no por la tecnología.

Dos piezas hacen esa conversación:

- **Solicitud por etapas.** El formulario se abre como panel sobre la misma
  página y pregunta de a poco: qué servicio, dónde está la empresa, cómo
  prefiere reunirse y qué le cuesta hoy. Preguntar de a poco baja el abandono
  frente a un formulario largo mostrado de una vez.
- **Asistente conversacional.** Widget flotante que hace un diagnóstico inicial:
  entiende el problema antes de sugerir una solución, y no promete nada que no
  se haya estudiado.

## Restricciones del prototipo

Están acordadas con el cliente. No revertirlas sin que las levante:

- **Sin logotipo ni nombre de marca visible.** Donde iría el logo hay casillas de
  reserva punteadas con un aspa, como en cualquier wireframe.
- **Sin precios, sin trabajos anteriores, sin testimonios ni clientes inventados.**
- **Sin inicio de sesión, registro ni cuentas.** El sitio no crea usuarios ni
  guarda sesiones.
- **Liviano.** Llega tráfico desde redes sociales: la portada no hace ninguna
  petición externa. Las únicas salidas son al backend propio, y sólo cuando
  alguien envía el formulario o escribe al asistente.
- **No se piden contraseñas ni credenciales** en ningún formulario.

## Estructura

Dos proyectos con su propio `package.json`, su propio ciclo de vida y su propia
guía técnica. No comparten dependencias ni build: lo único que los une es el
contrato HTTP de la tabla de endpoints.

| Ruta | Contenido |
|---|---|
| `frontend/` | El sitio: dos páginas en Vanilla JS empaquetadas con Vite. Detalle en [`frontend/README.md`](frontend/README.md) |
| `backend/` | API Gateway NestJS: validación, Telegram y el modelo del asistente. Detalle en [`backend/README.md`](backend/README.md) |
| `instrucciones.md` | Plan de reestructuración que originó este layout. Es la referencia de qué va en cada carpeta y qué queda reservado |
| `.githooks/pre-commit` | Corta el commit si algo con forma de credencial entró al índice |
| `.gitattributes` | Finales de línea LF en el repositorio, para que editar desde Windows no genere diffs falsos |
| `.gitignore` | Deja fuera `node_modules`, los `dist/` y **todos** los archivos de entorno |

Las carpetas reservadas (`backend/src/queues`, `backend/src/database`,
`frontend/src/services/websocket.js`) existen con su módulo mínimo y un
comentario que explica qué irá ahí y cuándo. Es a propósito: su ausencia sería
la pregunta "¿dónde iría esto?" repetida en cada revisión.

## Credenciales

Ninguna vive en el repositorio ni llega al navegador. El único lugar es
`backend/.env`, que está en `.gitignore`; `backend/.env.example` documenta qué
variables hacen falta, con los valores vacíos.

Además hay un gancho de `git` que corta el commit si algo con forma de token o
de clave entra al índice. Se activa una vez por clon:

```
git config core.hooksPath .githooks
```

Cubre lo que `.gitignore` no puede: renombrar el archivo de entorno, pegar un
token dentro de otro archivo o forzar un `git add -f`. Reconoce el formato de
los tokens de Telegram y de las claves de Google AI Studio, y cualquier valor
largo entrecomillado asignado a algo llamado clave, token o secreto. Una
referencia como `config.get('TELEGRAM_BOT_TOKEN')` no lo dispara: lo que busca
es el valor, no el nombre.

## Sistema visual

Paleta OKLCH azul/navy con `--radius: 0.625rem` y escala derivada. Tema claro y
oscuro, con respeto por `prefers-color-scheme` y por `prefers-reduced-motion`.

Las tipografías son las del sistema (con Inter como primera opción si está
instalada): no se descarga ninguna fuente remota. Los iconos son SVG en línea
y no hay imágenes.

### Controles flotantes

- **Volver arriba**, en la esquina inferior izquierda. Aparece pasada una
  pantalla y su anillo exterior marca el avance de lectura.
- **Asistente**, en la esquina inferior derecha.
- **Columna de redes** en el lateral derecho, con etiqueta emergente y el color
  de cada marca al pasar el cursor. Se oculta bajo 1200 px, donde no queda
  margen libre y se montaría sobre el texto; ahí valen las de la sección de
  contacto.

### Animación

Todo es CSS, sin librerías: deriva de la retícula del hero, flotación y barrido
del documento de ejemplo, esqueletos que laten, crecimiento del gráfico, cinta
continua de tecnologías, líneas conectoras que se dibujan y halo del panel de
contacto.

Con `prefers-reduced-motion: reduce` **se apagan por completo**, no solo se
aceleran: en varias, el fotograma final no es el estado correcto.

## Solicitud por etapas

Se abre como un panel sobre la misma página —no navega a ninguna parte— y
pregunta de a un paso:

| Paso | Qué pide | Selección |
|---|---|---|
| 1 | Tipo de servicio | Múltiple, más un campo para escribirlo |
| 2 | Dónde está la empresa | Una sola |
| 3 | Formato de la reunión | Una sola, con el texto fijo de cómo funciona |
| 4 | La necesidad y los datos de contacto | Múltiple sobre la lista de dificultades, más texto libre |

Cada opción es una tarjeta con su título y una línea que explica qué es y qué
implica, para que nadie tenga que adivinar de qué se trata. Los controles van
centrados abajo: **Salir** o **Atrás** a la izquierda y **Siguiente** a la
derecha; en el último paso ese par se reemplaza por enviar, WhatsApp y copiar.

Al enviar se revisan los cuatro pasos, no sólo el visible: si algo quedó atrás,
el panel vuelve a ese paso y explica qué falta.

Las dificultades del paso 4 y las fichas de la sección *Problemas* son la misma
lista: marcar en una deja marcada la otra.

Las opciones de los cuatro pasos son listas cerradas y viven en
`backend/src/common/catalogos.ts`. El DTO valida contra ellas y el resumen de
Telegram las usa sin repetirlas: **si el formulario suma una opción, se agrega
ahí**. Lo que no calce se descarta en silencio, porque no es un error de quien
escribe sino un cliente manipulado.

Hay dos vías alternativas: **Enviar por WhatsApp**, que abre el chat con el
resumen ya redactado, y **Copiar resumen**. Si el envío falla, el resumen queda
a la vista para no perder lo escrito.

## Filtro de entrada

El formulario y el asistente aceptan texto natural y nada más. Se rechazan, con
un aviso que explica el motivo, cinco familias: enlaces, archivos de imagen o
video, emojis y símbolos de marcado, caracteres invisibles e instrucciones
dirigidas al agente.

Los patrones concretos no se detallan acá: enumerarlos equivale a publicar por
dónde intentar la vuelta. Un criterio que sí conviene conocer para mantenerlos:
los patrones de inyección piden verbo y objeto juntos, para no castigar frases
legítimas. *"Los usuarios olvidan su contraseña"* pasa; pedir la contraseña del
sistema, no.

Pegar y soltar están intervenidos: del portapapeles se toma sólo `text/plain`,
así una imagen o un HTML con `<img>` no entran ni siquiera como marcado, y
arrastrar un archivo sobre un campo no hace nada.

Las reglas viven dos veces a propósito:

| Dónde | Papel |
|---|---|
| `frontend/src/lib/texto.js` | Avisa antes de enviar, con el motivo escrito para quien lo lee |
| `backend/src/common/validation/texto-natural.validator.ts` | Decide, porque el navegador es del visitante y su validación se salta desde la consola |

**Si cambias una, cambia la otra.**

### Límite de uso

Ambos canales tienen cupo por sesión y por día en el navegador, con una espera
mínima entre envíos, más el límite por IP del backend. Los valores están en
`frontend/src/components/` (cada componente define el suyo) y en los
controladores de `backend/src/api/`; no se publican acá, porque saber dónde está
el corte es justo lo que hace falta para quedarse por debajo.

El cupo del navegador se ata a una huella derivada de señales del navegador. No
identifica a nadie: sólo distingue un equipo de otro. Se borra limpiando el
almacenamiento, y por eso el que de verdad contiene un abuso es el del backend,
que sí ve la dirección real.

## Asistente conversacional

Diagnóstico comercial inicial. Mantiene los últimos doce turnos, arranca con
tres ejemplos de caso y sigue las reglas del agente: entender el proceso antes
de proponer, no inventar precios ni plazos y no recomendar IA cuando basta una
automatización.

La instrucción de sistema vive en `backend/src/ai/gemini.service.ts` y nunca
viaja al navegador; el frontend manda el historial y recibe el texto. Ahí mismo
están comentadas las tres particularidades del proveedor que se encontraron
midiendo, y que explican por qué el servicio está escrito así (ver
[`backend/README.md`](backend/README.md)).

La conversación se guarda en `sessionStorage`, no en el servidor: dura lo que la
pestaña.

## Antes de publicar

Los datos de contacto no están escritos en el marcado: el HTML sólo trae
marcadores (`data-wa`, `data-wa-numero`, `data-correo`) y un texto de
reserva. Se reparten al cargar desde variables de entorno.

| Dato | Dónde configurarlo |
|---|---|
| WhatsApp y correo | `frontend/.env.local` (`VITE_WHATSAPP`, `VITE_WHATSAPP_VISIBLE`, `VITE_CORREO`) |
| Ruta del backend | `frontend/.env.local` (`VITE_API_BASE_URL`) |
| Redes sociales | Dos sitios: el bloque `.social` de la sección de contacto y la columna `.social-rail` al final del `<body>`, en ambas páginas. Los `href="#contacto"` son marcadores |
| Razón social y datos tributarios | `terminos.html`, secciones 01 y 18 |
| Credenciales de Telegram y del asistente | `backend/.env` — nunca en el frontend |
| Dominio permitido por CORS | `backend/.env` (`CORS_ORIGIN`) |

Las variables `VITE_` no son un escondite: Vite las escribe literales en el
paquete que descarga el visitante. Sirven para centralizar datos que de todas
formas son públicos, no para guardar secretos.

## Despliegue en VPS con Docker

Todo el sitio se levanta con un comando. `docker-compose.prod.yml` construye
las dos imágenes y las conecta con Redis y Postgres:

```bash
cp .env.prod.example .env.prod        # completar tokens, clave y PUBLIC_ORIGIN
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

### Cómo se hablan las dos piezas

```text
navegador --http :80--> nginx (web) --http--> backend:3000
                                    \-------> redis / postgres
```

nginx sirve el sitio compilado y además publica el backend bajo `/api` del
**mismo origen**. Para el navegador hay una sola dirección: pide
`http://<vps>/` y recibe la página, pide `http://<vps>/api/consulta` y la
atiende NestJS. Como no cruza origen, CORS no llega a intervenir; queda
configurado igual para que una llamada desde otro dominio sí se rechace.

**Sólo `web` publica un puerto.** El backend, Redis y Postgres viven en la red
interna de Docker y no son alcanzables desde fuera de la VPS.

### `PUBLIC_ORIGIN` se compila, no se configura

Vite escribe las variables `VITE_` literales dentro del paquete. `PUBLIC_ORIGIN`
alimenta a la vez el `CORS_ORIGIN` del backend y la dirección que queda escrita
en el JavaScript que descarga el visitante, así que **cambiar el dominio obliga
a reconstruir la imagen `web`**, no basta con reiniciarla:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build web
```

Sin barra final: el frontend la concatena con `/api/...` y `http://sitio//api`
no cruza el proxy. El `Dockerfile` la recorta por si acaso.

### Dos trampas que ya están resueltas, y por qué no hay que deshacerlas

1. **`main.ts` marca `trust proxy`.** En producción el backend no recibe al
   visitante sino a nginx. Sin esa línea, el límite por IP del `ThrottlerGuard`
   ve una sola dirección —la del proxy— y las cinco solicitudes por hora dejan
   de ser por visitante para pasar a ser del sitio entero: el sexto visitante
   recibe un 429 sin haber enviado nada, y basta una persona para dejar a todos
   fuera.

2. **nginx resuelve el backend por variable, no por bloque `upstream`.** Con
   `proxy_pass http://backend;` nginx resuelve el nombre una sola vez, al
   arrancar. El día que se redespliega el backend y Docker le asigna otra IP,
   nginx sigue apuntando a la vieja y el formulario y el asistente devuelven
   502 indefinidamente aunque el backend esté sano —el sitio carga igual, así
   que la falla pasa desapercibida—. Con la variable y el `resolver` de Docker,
   nginx vuelve a resolver el nombre en cada petición.

### Operación

| Qué | Comando |
|---|---|
| Ver estado | `docker compose --env-file .env.prod -f docker-compose.prod.yml ps` |
| Ver logs | `docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend` |
| Redesplegar backend | `... up -d --build backend` |
| Redesplegar sitio | `... up -d --build web` |
| Detener | `... stop` |

Los contenedores llevan `restart: unless-stopped`: tras un reinicio de la VPS
vuelven solos, y los datos de Postgres y Redis viven en volúmenes que
sobreviven al recambio de contenedores. El log de cada contenedor está topado
en 10 MB × 3 archivos para que no llene el disco.

### Sobre HTTP, y qué pasa el día que haya dominio

El despliegue es HTTP plano, sin TLS. Nada de lo que hay que cambiar para
ponerle un dominio con Cloudflare está pendiente: ya está escrito y probado, y
se activa solo.

**Lo único que se toca es `PUBLIC_ORIGIN`.** De ahí salen el origen que acepta
CORS, la dirección que queda compilada en el paquete del frontend y si el
backend emite HSTS. Al pasarla a `https://tu-dominio.com` y reconstruir `web`:

- el paquete del sitio deja de apuntar a la IP y apunta al dominio —si no se
  reconstruye, el navegador bloquea las llamadas por contenido mixto y el
  formulario y el asistente dejan de funcionar aunque la página cargue;
- helmet empieza a emitir `Strict-Transport-Security`, que sobre HTTP omitía a
  propósito;
- nginx empieza a emitir `Cross-Origin-Opener-Policy`, que sobre HTTP el
  navegador ignoraba dejando un aviso en la consola de cada visita.

Lo que ya está resuelto sin tocar nada:

| Detrás de Cloudflare | Cómo queda cubierto |
|---|---|
| La IP real del visitante | `nginx/cloudflare-real-ip.conf` obedece `CF-Connecting-IP`, pero **sólo** si la conexión viene de un rango publicado por Cloudflare. Sin Cloudflare delante el archivo no hace nada, y con Cloudflare delante el límite por IP sigue siendo por visitante y no por nodo del borde |
| Falsificación de esa cabecera | Desde cualquier otra IP la cabecera se ignora. Verificado enviándola desde fuera: el corte se mantuvo |
| El esquema real | `X-Forwarded-Proto` manda sobre `$scheme`, así que el backend y las cabeceras saben que el visitante llegó por HTTPS aunque el tramo hasta nginx sea HTTP |
| El corte a los 100 s de Cloudflare | El presupuesto de tiempo del asistente termina en 75 s (backend) < 85 s (nginx) < 90 s (navegador), todo por debajo del 524 |
| Caché del CDN | El HTML va `no-cache` y los assets con hash `immutable`, que es lo que Cloudflare respeta |

**Un aviso que sí hay que atender al activar Cloudflare:** el cortafuegos de la
VPS tiene que dejar el puerto 80 abierto *sólo* a los rangos de Cloudflare. Si
el origen sigue siendo alcanzable por su IP, cualquiera puede saltarse
Cloudflare —y en ese caso sí podría falsificar `CF-Connecting-IP` conectándose
directo—. Los rangos están en el mismo archivo, y se publican en
<https://www.cloudflare.com/ips-v4>.

Si además se quiere cifrar el tramo Cloudflare↔VPS (modo *Full (strict)* en vez
de *Flexible*), falta añadir un certificado de origen y un `listen 443 ssl` en
`nginx/default.conf`. Es lo único de esta lista que no está hecho.

## Verificación

Con los dos proyectos corriendo a la vez y credenciales de prueba, se recorrió
el sitio en un navegador real (Edge sin interfaz) comprobando 37 puntos:

- el asistente y el panel de solicitud arrancan ocultos, y los datos de
  contacto se reparten sobre el marcado;
- la solicitud avanza por sus cuatro pasos, no deja pasar un paso incompleto y
  sincroniza las fichas de la sección "problemas" con las del último paso;
- lo que sale al backend son exactamente los valores del catálogo, sin campos
  opcionales vacíos;
- el error del backend se muestra y el botón vuelve a su estado;
- el filtro del navegador corta un enlace sin llegar a llamar al backend;
- el asistente manda el historial, muestra el error del proveedor, libera el
  campo y repinta la conversación al recargar;
- pestañas, acordeón y la segunda página funcionan, sin errores de consola
  fuera de los provocados a propósito.

Las respuestas del backend se probaron además directamente: catálogo inválido,
campo no declarado, mensaje con enlaces o emojis, historial demasiado largo y
exceso de envíos devuelven todos el código y el motivo correctos.
