# PaginaPrincipal-Krateroi

## Despliegue en Vercel

Importa este repositorio en Vercel y deja **Root Directory** en `.` (la raíz
del repositorio). `vercel.json` instala las dependencias de `frontend/`,
compila el sitio Vite y publica `frontend/dist/`. No configures `frontend` como
Root Directory: los ajustes de compilación están en la raíz.

En Vercel configura `VITE_API_BASE_URL` con la URL HTTPS pública del backend.
Es un dato público, no una clave; no pongas credenciales en variables `VITE_*`.
El frontend está en `frontend/`; la API NestJS está en `backend/` y se ejecuta
como un servicio aparte, no como una función de Vercel. Despliega `backend/`
como contenedor Docker en un host que permita procesos persistentes y configura
allí sus variables privadas. Usa la URL HTTPS pública de esa API para
`VITE_API_BASE_URL` en Vercel; en el backend, configura `CORS_ORIGIN` con el
dominio exacto del sitio publicado. Consulta `backend/README.md` para las
variables y pasos de despliegue.