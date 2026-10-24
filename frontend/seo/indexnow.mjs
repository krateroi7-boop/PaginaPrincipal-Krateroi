/* Avisa a los buscadores que usan IndexNow (Bing, Yandex, Seznam, Naver
   y los que se alimentan del índice de Bing) que el sitio cambió, para
   que lo vuelvan a leer sin esperar a su próxima pasada. Google no
   participa en IndexNow: para Google está Search Console.

   Se corre después de cada despliegue:  npm run indexnow
   La clave que lo autoriza la publica seo/plugin.js en la raíz del sitio. */

import { INDEXNOW_KEY, PAGINAS, direccionSitio } from './plugin.js';

const sitio = direccionSitio();
const host = new URL(sitio).host;

const respuesta = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${sitio}/${INDEXNOW_KEY}.txt`,
    urlList: PAGINAS.map((p) => `${sitio}${p.ruta}`),
  }),
});

console.log(`IndexNow respondió ${respuesta.status} ${respuesta.statusText} para ${host}`);
if (!respuesta.ok) process.exitCode = 1;
