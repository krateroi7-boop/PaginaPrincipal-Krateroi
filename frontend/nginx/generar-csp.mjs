/* Genera la Content-Security-Policy del sitio a partir del HTML ya
   compilado.

   El hash del script en línea (el que fija el tema antes de que cargue
   main.js, para que la página no parpadee) se calcula sobre el dist
   real y no sobre el fuente: si alguien toca ese script y el hash
   quedara escrito a mano, la política dejaría de calzar y el navegador
   bloquearía el script en silencio, devolviendo el parpadeo. Calcularlo
   en cada build es lo que impide que se desincronicen.

   Se usa hash y no 'unsafe-inline' porque 'unsafe-inline' autoriza
   cualquier script en línea, que es justo lo que una inyección
   necesita; el hash autoriza exactamente ese script y ninguno más. */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const salida = process.argv[3] ?? 'csp.conf';

const hashes = new Set();
for (const archivo of readdirSync(dist).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(dist, archivo), 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    hashes.add(
      "'sha256-" + createHash('sha256').update(m[1], 'utf8').digest('base64') + "'",
    );
  }
}

const politica = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')}`.trim(),
  // Los SVG en línea del marcado no llevan style=, y el JS no inyecta
  // <style>: el sitio se pinta sólo con las hojas empaquetadas.
  "style-src 'self'",
  // El favicon es un data: URI con el SVG dentro.
  "img-src 'self' data:",
  "font-src 'self'",
  // El backend va bajo el mismo origen a través de este mismo nginx.
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

writeFileSync(salida, `add_header Content-Security-Policy "${politica}" always;\n`, 'utf8');
console.log(`CSP generada con ${hashes.size} hash(es) de script en línea:`);
console.log(politica);
