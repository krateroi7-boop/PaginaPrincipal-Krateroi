import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  /* En producción el backend no recibe al visitante: recibe a nginx, que
     le pasa la dirección real en X-Forwarded-For. Sin esto, el límite por
     IP del ThrottlerGuard ve una sola dirección —la del proxy— y las
     cinco solicitudes por hora dejan de ser por visitante para pasar a
     ser del sitio entero: el sexto visitante del día recibe un 429 sin
     haber enviado nada, y basta una persona para dejar a todos fuera.

     El 1 es el número de saltos de confianza: sólo nginx, que es lo único
     que alcanza al backend en la red interna de Docker. Confiar en más
     saltos permitiría a cualquiera falsear su IP con una cabecera. */
  app.set('trust proxy', 1);

  /* HSTS sólo cuando el sitio se sirve por HTTPS. Sobre HTTP el
     navegador ignora la cabecera de todas formas, así que enviarla no
     protege nada y sí deja ruido; y si algún día el sitio se publicara
     mal por HTTPS, un HSTS de un año emitido por error deja el dominio
     inaccesible hasta que caduque. Al derivarlo de CORS_ORIGIN, la
     cabecera aparece sola el día que PUBLIC_ORIGIN pase a https. */
  const origen = config.get<string>('CORS_ORIGIN') ?? '';
  app.use(helmet({ strictTransportSecurity: origen.startsWith('https://') }));

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN'),
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(config.get<number>('PORT') ?? 3000);
}
bootstrap();
