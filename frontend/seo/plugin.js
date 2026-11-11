/* Lo que necesitan los buscadores y que Vite no hace por sí solo.

   - Escribe la dirección pública del sitio donde el HTML dice
     %SITE_URL% (canonical, Open Graph). Sale de SITE_URL, o del dominio
     de producción que Vercel entrega en el build, así que al conectar
     un dominio propio todo se mueve solo con el siguiente despliegue.
   - Arma la tabla de precios y el catálogo en JSON-LD desde
     seo/precios.js, para que lo que lee una persona y lo que lee Google
     sean siempre lo mismo.
   - Agrega las metaetiquetas de verificación de Google Search Console
     y Bing Webmaster Tools si están en el entorno.
   - Publica robots.txt, sitemap.xml y la clave de IndexNow en la raíz. */

import { GRUPOS_UF, TRABAJOS_PEQUENOS } from './precios.js';

export const INDEXNOW_KEY = '455f056a97d3109ebe2d2590e7c07473';

export const PAGINAS = [
  { ruta: '/', prioridad: '1.0', frecuencia: 'weekly' },
  { ruta: '/documentos', prioridad: '0.5', frecuencia: 'monthly' },
  { ruta: '/terminos', prioridad: '0.3', frecuencia: 'yearly' },
];

const DESCRIPCION =
  'Krateroi audita procesos digitales y riesgos legales de empresas en Chile, y desarrolla el software, las automatizaciones y la inteligencia artificial que hagan falta.';

export function direccionSitio(env = process.env) {
  const propia = env.SITE_URL?.trim();
  if (propia) return propia.replace(/\/+$/, '');
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return 'https://paginaprincipal-krateroii.vercel.app';
}

const escapar = (texto) =>
  String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const uf = (n) => `${String(n).replace('.', ',')} UF`;

/* "12 a 26 UF", o "Desde 3 UF" cuando el grupo no tiene tope. Que el
   cobro es mensual lo dice la línea de plazo del mismo grupo. */
function rangoUF(grupo) {
  const [desde, hasta] = grupo.uf;
  return grupo.desde || hasta === undefined ? `Desde ${uf(desde)}` : `${desde} a ${uf(hasta)}`;
}

/* Grupos de servicios con un solo rango en UF, y los trabajos pequeños
   en pesos con su valor individual. */
function tablaPrecios() {
  const grupos = GRUPOS_UF.map(
    (g) => `
        <article class="precio-grupo reveal">
          <h3>${escapar(g.titulo)}</h3>
          <p class="precio-grupo-rango">${escapar(rangoUF(g))}</p>
          <p class="precio-grupo-plazo">${escapar(g.plazo)}</p>
          <ul>${g.acciones.map((a) => `<li>${escapar(a)}</li>`).join('')}</ul>
        </article>`,
  ).join('');

  const filas = TRABAJOS_PEQUENOS.items
    .map(
      (item) => `
          <tr>
            <th scope="row">${escapar(item.nombre)}</th>
            <td class="precio-alcance">${escapar(item.alcance)}</td>
            <td class="precio-plazo">${escapar(item.plazo)}</td>
            <td class="precio-monto"><small>Desde</small> $${miles(item.clp)}</td>
          </tr>`,
    )
    .join('');

  return `
      <div class="precios-grupos">${grupos}
      </div>
      <table class="precios-tabla reveal">
        <caption>${escapar(TRABAJOS_PEQUENOS.titulo)} <span>en pesos</span></caption>
        <thead>
          <tr><th scope="col">Servicio</th><th scope="col">Incluye</th><th scope="col">Plazo</th><th scope="col">Valor neto</th></tr>
        </thead>
        <tbody>${filas}
        </tbody>
      </table>`;
}

function servicio(nombre, descripcion, sitio) {
  return { '@type': 'Service', name: nombre, description: descripcion, provider: { '@id': `${sitio}/#organizacion` } };
}

function ofertaGrupo(g, sitio) {
  const [desde, hasta] = g.uf;
  const precio = g.mensual
    ? { '@type': 'UnitPriceSpecification', minPrice: desde, priceCurrency: 'CLF', unitCode: 'MON', unitText: 'mes' }
    : { '@type': 'PriceSpecification', minPrice: desde, ...(hasta !== undefined && { maxPrice: hasta }), priceCurrency: 'CLF' };
  return {
    '@type': 'Offer',
    url: `${sitio}/#precios`,
    itemOffered: servicio(g.titulo, g.acciones.join(', '), sitio),
    priceSpecification: { ...precio, valueAddedTaxIncluded: false },
  };
}

function ofertaPequena(item, sitio) {
  return {
    '@type': 'Offer',
    url: `${sitio}/#precios`,
    itemOffered: servicio(item.nombre, item.alcance, sitio),
    priceSpecification: { '@type': 'PriceSpecification', minPrice: item.clp, priceCurrency: 'CLP', valueAddedTaxIncluded: false },
  };
}

function datosEstructurados(sitio, env) {
  const organizacion = {
    '@type': 'Organization',
    '@id': `${sitio}/#organizacion`,
    name: 'Krateroi',
    alternateName: 'KRATEROI',
    url: `${sitio}/`,
    logo: { '@type': 'ImageObject', url: `${sitio}/assets/images/krateroi-icon-512.png`, width: 512, height: 512 },
    image: `${sitio}/assets/images/og-krateroi.jpg`,
    description: DESCRIPCION,
    address: { '@type': 'PostalAddress', addressRegion: 'Región Metropolitana', addressCountry: 'CL' },
    areaServed: { '@type': 'Country', name: 'Chile' },
    knowsAbout: [
      'Auditoría legal digital',
      'Auditoría digital',
      'Protección de datos personales',
      'Ley 21.719',
      'Ciberseguridad',
      'Ley 21.663',
      'Contratos tecnológicos',
      'Desarrollo de software',
      'Automatización de procesos',
      'Inteligencia artificial',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de Krateroi',
      itemListElement: [
        {
          '@type': 'Offer',
          url: `${sitio}/#precios`,
          description: 'No se paga al pedirla; su valor se cobra junto con el proyecto si el trabajo se concreta.',
          itemOffered: servicio('Auditoría inicial', 'Primera lectura del caso y de sus prioridades.', sitio),
        },
        ...GRUPOS_UF.map((g) => ofertaGrupo(g, sitio)),
        ...TRABAJOS_PEQUENOS.items.map((item) => ofertaPequena(item, sitio)),
      ],
    },
  };

  const whatsapp = (env.VITE_WHATSAPP || '').replace(/\D/g, '');
  const correo = (env.VITE_CORREO || '').trim();
  if (whatsapp || correo) {
    organizacion.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      areaServed: 'CL',
      availableLanguage: 'es',
      ...(whatsapp && { telephone: `+${whatsapp}` }),
      ...(correo && { email: correo }),
    };
  }

  const grafo = {
    '@context': 'https://schema.org',
    '@graph': [
      organizacion,
      {
        '@type': 'WebSite',
        '@id': `${sitio}/#sitio`,
        url: `${sitio}/`,
        name: 'Krateroi',
        inLanguage: 'es-CL',
        publisher: { '@id': `${sitio}/#organizacion` },
      },
      {
        '@type': 'WebPage',
        '@id': `${sitio}/#portada`,
        url: `${sitio}/`,
        name: 'Krateroi | Auditoría legal y auditoría digital en Chile',
        description: DESCRIPCION,
        inLanguage: 'es-CL',
        isPartOf: { '@id': `${sitio}/#sitio` },
        about: { '@id': `${sitio}/#organizacion` },
        primaryImageOfPage: `${sitio}/assets/images/og-krateroi.jpg`,
      },
    ],
  };

  /* "</" dentro del JSON cerraría la etiqueta <script> antes de tiempo. */
  const json = JSON.stringify(grafo).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">${json}</script>`;
}

function verificaciones(env) {
  const metas = [
    ['google-site-verification', env.GOOGLE_SITE_VERIFICATION],
    ['msvalidate.01', env.BING_SITE_VERIFICATION],
  ];
  return metas
    .filter(([, valor]) => valor?.trim())
    .map(([nombre, valor]) => `<meta name="${nombre}" content="${escapar(valor.trim())}" />`)
    .join('\n');
}

const robots = (sitio) => `User-agent: *\nAllow: /\n\nSitemap: ${sitio}/sitemap.xml\n`;

function sitemap(sitio) {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = PAGINAS.map(
    (p) => `  <url>
    <loc>${sitio}${p.ruta}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${p.frecuencia}</changefreq>
    <priority>${p.prioridad}</priority>
  </url>`,
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function seo(env = process.env) {
  const sitio = direccionSitio(env);
  const archivos = {
    'robots.txt': () => robots(sitio),
    'sitemap.xml': () => sitemap(sitio),
    [`${INDEXNOW_KEY}.txt`]: () => INDEXNOW_KEY,
  };

  return {
    name: 'krateroi-seo',

    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replaceAll('%SITE_URL%', sitio)
          .replace('<!-- verificaciones -->', verificaciones(env))
          .replace('<!-- datos-estructurados -->', datosEstructurados(sitio, env))
          .replace('<!-- precios -->', tablaPrecios());
      },
    },

    /* En desarrollo los mismos archivos se sirven desde memoria. */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const nombre = req.url?.split('?')[0].replace(/^\//, '');
        if (!archivos[nombre]) return next();
        res.setHeader('Content-Type', nombre.endsWith('.xml') ? 'application/xml' : 'text/plain; charset=utf-8');
        res.end(archivos[nombre]());
      });
    },

    generateBundle() {
      for (const [fileName, contenido] of Object.entries(archivos)) {
        this.emitFile({ type: 'asset', fileName, source: contenido() });
      }
    },
  };
}
