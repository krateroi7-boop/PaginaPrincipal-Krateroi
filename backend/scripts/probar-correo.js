/* Envía una solicitud de prueba por el mismo camino que el formulario
   (CorreoService: resumen + informe PDF por Resend), sin levantar el
   backend completo: no hace falta Redis ni Postgres. Sirve para
   comprobar la clave de Resend antes de ponerla en Render.

   Uso, desde backend/:
     RESEND_API_KEY=re_... npm run probar:correo
   o con la clave escrita en backend/.env:
     npm run probar:correo

   Las variables se validan con el mismo esquema que usa el backend,
   así que los valores por defecto (destino y remitente) son los
   mismos que en producción. */

const { ConfigService } = require('@nestjs/config');
const { plainToInstance } = require('class-transformer');
const { validationSchema } = require('../dist/common/config/validation.schema');
const { CreateConsultaDto } = require('../dist/common/dto/create-consulta.dto');
const { CorreoService } = require('../dist/correo/correo.service');

const env = {};
for (const clave of ['RESEND_API_KEY', 'CORREO_DESTINO', 'CORREO_REMITENTE']) {
  const { value, error } = validationSchema.extract(clave).validate(process.env[clave] || undefined);
  if (error) {
    console.error(`${clave} falta o no es válida.`);
    console.error('Uso: RESEND_API_KEY=re_... npm run probar:correo');
    process.exit(1);
  }
  env[clave] = value;
}

/* La respuesta va al mismo destino: así no aparece ninguna dirección
   inventada en el correo. */
const solicitud = plainToInstance(CreateConsultaDto, {
  nombre: 'Prueba del formulario',
  correo: env.CORREO_DESTINO,
  empresa: 'Krateroi',
  servicios: ['Diagnóstico inicial'],
  ubicacion: 'Región Metropolitana',
  reunion: 'Videollamada',
  dolores: ['Sistemas que no se hablan entre sí'],
  mensaje: 'Correo de prueba enviado con npm run probar:correo para comprobar la clave de Resend.',
});

new CorreoService(new ConfigService(env)).enviarSolicitud(solicitud).then(
  () => console.log(`Listo: correo de prueba enviado a ${env.CORREO_DESTINO}. Revisa la bandeja de entrada y Spam.`),
  () => {
    console.error('No se pudo enviar. El detalle de Resend está en la línea de error de arriba.');
    process.exit(1);
  },
);
