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

import { GRUPOS } from './precios.js';

export const INDEXNOW_KEY = '455f056a97d3109ebe2d2590e7c07473';

export const PAGINAS = [
  { ruta: '/', prioridad: '1.0', frecuencia: 'weekly' },
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

function monto(item) {
  if (item.clp) return `$${miles(item.clp)}`;
  const uf = `${String(item.uf).replace('.', ',')} UF`;
  return item.mensual ? `${uf} al mes` : uf;
}

function tablaPrecios() {
  return GRUPOS.map((grupo) => {
    const filas = grupo.items
      .map(
        (item) => `
          <tr>
            <th scope="row">${escapar(item.nombre)}</th>
            <td class="precio-alcance">${escapar(item.alcance)}</td>
            <td class="precio-plazo">${escapar(item.plazo)}</td>
            <td class="precio-monto"><small>Desde</small> ${escapar(monto(item))}</td>
          </tr>`,
      )
      .join('');
    const enPesos = grupo.items.every((item) => item.clp);
    return `
      <table class="precios-tabla reveal">
        <caption>${escapar(grupo.titulo)}${enPesos ? ' <span>en pesos</span>' : ''}</caption>
        <thead>
          <tr><th scope="col">Servicio</th><th scope="col">Incluye</th><th scope="col">Plazo</th><th scope="col">Valor neto</th></tr>
        </thead>
        <tbody>${filas}
        </tbody>
      </table>`;
  }).join('');
}

function oferta(item, sitio) {
  const precio = item.clp
    ? { '@type': 'PriceSpecification', minPrice: item.clp, priceCurrency: 'CLP' }
    : item.mensual
      ? { '@type': 'UnitPriceSpecification', minPrice: item.uf, priceCurrency: 'CLF', unitCode: 'MON', unitText: 'mes' }
      : { '@type': 'PriceSpecification', minPrice: item.uf, priceCurrency: 'CLF' };
  return {
    '@type': 'Offer',
    url: `${sitio}/#precios`,
    itemOffered: { '@type': 'Service', name: item.nombre, description: item.alcance, provider: { '@id': `${sitio}/#organizacion` } },
    priceSpecification: { ...precio, valueAddedTaxIncluded: false },
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
          price: 0,
          priceCurrency: 'CLP',
          itemOffered: { '@type': 'Service', name: 'Auditoría inicial', description: 'Primera lectura del caso, por escrito y sin obligación de continuar.' },
        },
        ...GRUPOS.flatMap((grupo) =>
          grupo.items.map((item) => oferta(item, sitio)),
        ),
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
