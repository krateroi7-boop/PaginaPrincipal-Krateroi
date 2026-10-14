# PaginaPrincipal-Krateroi

## Despliegue en Vercel

Importa este repositorio en Vercel y deja **Root Directory** en `.` (la raíz
del repositorio). `vercel.json` instala las dependencias de `frontend/`,
compila el sitio Vite y publica `frontend/dist/`. No configures `frontend` como
Root Directory: los ajustes de compilación están en la raíz.

En Vercel configura `VITE_API_BASE_URL` con la URL HTTPS pública del backend.
Es un dato público, no una clave; no pongas credenciales en variables `VITE_*`.
Las claves privadas pertenecen únicamente al entorno del servicio backend.
Después, haz un nuevo deploy desde **Deployments**.