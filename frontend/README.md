# Frontend

Sitio en Vanilla JS empaquetado con Vite. Dos páginas (`index.html` y
`terminos.html`) que comparten hoja de estilos y punto de entrada.

El HTML es monolítico a propósito: se sirve completo en la primera respuesta y
se lee sin JavaScript. Lo modular es el JavaScript, repartido en componentes
que se montan sobre el marcado que ya está en la página.

## Puesta en marcha

```bash
cp .env.example .env.local   # VITE_API_BASE_URL y los datos de contacto
npm install
npm run dev                  # http://localhost:5173
```

- `npm run build` genera `dist/` (multi-página: `index.html` + `terminos.html`).
- `npm run preview` sirve el `dist/` generado.

El backend tiene que estar corriendo para que funcionen el formulario y el
asistente; el resto de la página no lo necesita.

## Despliegue en Vercel

1. Importa el repositorio de GitHub en Vercel y deja **Root Directory** en la
   raíz del repositorio. El `vercel.json` raíz instala las dependencias desde
   `frontend/`, ejecuta `npm --prefix frontend run build` y publica
   `frontend/dist/`.
2. En las variables de entorno del proyecto Vercel, configura
   `VITE_API_BASE_URL` con el origen HTTPS público del backend, sin `/` final
   (por ejemplo, `https://api.ejemplo.com`). Es una URL pública, no una clave.
   Las variables opcionales `VITE_WHATSAPP`, `VITE_WHATSAPP_VISIBLE` y
   `VITE_CORREO` sólo deben contener datos que quieras publicar en el sitio.
3. Despliega de nuevo después de cambiar variables: Vite las incorpora al
   paquete durante el build.

El backend de este repositorio usa PostgreSQL y Redis y debe desplegarse aparte
en un servicio que los soporte. Configura allí el origen de Vercel como origen
permitido de CORS y guarda cualquier credencial únicamente en las variables
privadas del proveedor del backend; no las añadas a este repositorio ni a las
variables `VITE_*`. `frontend/.vercelignore` excluye los archivos `.env` del
despliegue.

`vercel.json` en la raíz conserva las rutas limpias (incluida `/terminos`) y
aplica las cabeceras de seguridad del sitio.

## Estructura

Cuatro carpetas con una responsabilidad cada una: `components/` toca el DOM,
`services/` habla con el backend, `state/` recuerda, `lib/` no hace ninguna de
las tres (son funciones puras, sin DOM ni red, y por eso se pueden probar
sueltas).

### Páginas y marcado

| Archivo | Contenido |
|---|---|
| `index.html` | Portada completa: nosotros, problemas, soluciones, metodología, diagnóstico, condiciones, mantenimiento, equipo, contacto y preguntas frecuentes. Incluye el panel de la solicitud por etapas |
| `terminos.html` | Términos del servicio, 18 secciones con índice lateral |

Las dos son entradas de Vite (`vite.config.js`) y traen todo el marcado
escrito: la página se lee completa aunque el JavaScript no cargue.

### Código

| Archivo | Contenido |
|---|---|
| `src/main.js` | Arranque: monta los componentes, uno por uno, y nada más |
| `src/components/navegacion.js` | Tema, avance de lectura, volver arriba, menú móvil, revelado al desplazar, cifras que cuentan, pestañas y acordeón |
| `src/components/contacto.js` | Reparte WhatsApp, correo y equipo sobre los marcadores del marcado |
| `src/components/solicitud.js` | La solicitud por etapas: navegación entre pasos, validación, resumen, envío y vías alternativas |
| `src/components/chat-widget.js` | El asistente: marcado, conversación, cupo y errores |
| `src/components/ui-helpers.js` | Selectores, preferencia de movimiento y las rarezas del DOM con las que este sitio ya tropezó |
| `src/lib/texto.js` | El filtro de entrada: qué se acepta escribir, pegar y soltar |
| `src/services/api.js` | Las dos llamadas al backend, con sus tiempos de espera y reintentos |
| `src/services/websocket.js` | Reservado para el día que el chat pase por colas. Documentado, sin lógica |
| `src/state/store.js` | Cupo por sesión y por día con huella del dispositivo, e historial de la conversación |

### Estilos

| Archivo | Cómo llega a la página |
|---|---|
| `src/styles/variables.css` | Tokens del sistema visual. Enlazado desde el HTML |
| `src/styles/styles.css` | Estructura y estilos base del sitio. Enlazado desde el HTML |
| `src/styles/remake.css` | Capa visual de KrateroiRemake: fondo azul, tarjetas translúcidas, portada y tipografía Inter local |
| `src/styles/editorial.css` | Composición de portada, servicios y metodología; cargada sólo en la página principal |
| `src/styles/chat.css` | Sólo el widget. Lo importa `chat-widget.js`, que es quien lo monta |

Las hojas de variables, estructura y diseño se cargan con `<link>`: así el sitio
se ve aunque el módulo falle. La hoja del chat viaja con su componente.

### Otros

| Ruta | Contenido |
|---|---|
| `vite.config.js` | Build multi-página (`index.html` + `terminos.html`) |
| `.env.example` | Plantilla de variables `VITE_`, con una nota de qué **no** va ahí |
| `public/assets/images/Krateroi.jpeg` | Logotipo anterior conservado como respaldo |
| `public/assets/images/krateroi-logo.png` | Logo horizontal de KrateroiRemake, usado en cabecera y pie |
| `public/assets/images/krateroi-icon.png` | Logo cuadrado de KrateroiRemake, usado como favicon y en el asistente |

Cada componente comprueba que sus elementos existan antes de engancharse, así
que el mismo `main.js` sirve para las dos páginas. `main.js` los arranca uno
por uno dentro de un `try`: un componente que falle no se lleva a los demás.

## Comunicación con el backend

Nada de este proyecto conoce una credencial. El navegador habla sólo con
nuestro backend:

| Qué | Ruta | Espera |
|---|---|---|
| Solicitud del formulario | `POST /api/consulta` | 10 s, sin reintentos |
| Turno del asistente | `POST /api/chat` | 45 s, dos intentos |

El formulario no se reintenta a propósito: repetir la petición podría dejar dos
avisos iguales si el primero llegó y se perdió la respuesta. El chat sí, porque
repetirlo no tiene más efecto que gastar cupo.

Vite escribe las variables `VITE_` literales dentro del paquete que descarga el
visitante: ahí sólo van los datos de contacto, que son públicos por definición.
Los tokens viven en `backend/.env`.

## Entrada del visitante

`src/lib/texto.js` acepta texto natural y nada más: sin enlaces, archivos,
marcado, emojis, caracteres invisibles ni instrucciones dirigidas al agente.
Cubre lo escrito, lo pegado y lo arrastrado sobre cada campo.

Es la primera barrera, no la única: el navegador es del visitante y todo esto
se salta desde la consola. Las mismas reglas están en
`backend/src/common/validation/texto-natural.validator.ts`, que es la que
decide. **Si cambias una, cambia la otra.**

`state/store.js` lleva además un cupo por sesión y por día atado a una huella
del dispositivo. No identifica a nadie: distingue un navegador de otro para que
un mismo equipo no dispare cientos de consultas. El límite que de verdad
contiene un abuso es el de IP, y ese está en el backend.

Los mensajes se pintan siempre con `textContent`. Ni lo que escribe el
visitante ni lo que responde el modelo pasan por `innerHTML`.

## Sistema visual

Paleta azul de KrateroiRemake (`#021B59` a `#04277A`), paneles translúcidos y
botones redondeados. Inter se empaqueta localmente con `@fontsource/inter`;
los iconos SVG y ambos logotipos también se sirven desde el sitio. Las
animaciones respetan `prefers-reduced-motion`.

Dos trampas que ya costaron caro y conviene no repetir:

- `[hidden]` lo pisa cualquier regla con `display`. Por eso existe la regla
  global `[hidden] { display: none !important; }`.
- `hidden` es una propiedad de `HTMLElement` y `SVGElement` no la hereda:
  para ocultar un `<svg>` hay que tocar el atributo (`ui-helpers.js`,
  `ocultarSvg`).
