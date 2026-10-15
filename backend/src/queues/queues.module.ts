import { Global, Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/* ─────────────────────────────────────────────────────────────
   Redis.

   Sigue sin haber colas registradas: el único envío que hace hoy el
   backend (la alerta de Telegram) es liviano y se resuelve de forma
   síncrona en telegram/telegram.service.ts. BullModule queda
   configurado para el día que una consulta de IA pase a costar
   minutos en vez de segundos.

   Lo que sí usa Redis desde ya es el límite por IP: su contador vive
   acá y no en la memoria del proceso, así que sobrevive a un
   redespliegue y sería el mismo para varias instancias del backend.
   Esa es la razón por la que este módulo exporta un cliente además de
   configurar BullMQ: el contador del throttler y las colas futuras
   hablan con el mismo Redis, y no tiene sentido abrir dos conexiones
   a la misma base para lo mismo.
   ───────────────────────────────────────────────────────────── */

export const REDIS = Symbol('REDIS');

const logger = new Logger('QueuesModule');

/* Los datos de conexión, resueltos una sola vez para las dos bocas
   que abre este módulo.

   Local y Docker: REDIS_HOST + REDIS_PORT.
   Producción:     REDIS_URL=redis://... o rediss://... con TLS.

   La URL se desarma a mano en vez de pasarse entera a ioredis porque
   BullMQ espera un objeto de conexión, no una cadena: así ambos
   reciben exactamente la misma configuración. */
function obtenerConexionRedis(config: ConfigService) {
  const url = config.get<string>('REDIS_URL');
  if (!url) {
    return {
      host: config.get<string>('REDIS_HOST'),
      port: config.get<number>('REDIS_PORT') ?? 6379,
    };
  }

  const partes = new URL(url);

  return {
    host: partes.hostname,
    port: partes.port ? Number(partes.port) : 6379,
    username: partes.username ? decodeURIComponent(partes.username) : undefined,
    password: partes.password ? decodeURIComponent(partes.password) : undefined,
    ...(partes.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

@Global()
@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          ...obtenerConexionRedis(config),

          /* BullMQ reutiliza esta conexión para los workers y exige
             que no tenga tope de reintentos. */
          maxRetriesPerRequest: null,
        },
      }),
    }),
  ],
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');

        const redis = new Redis({
          ...obtenerConexionRedis(config),

          /* Sin tope de reintentos: si Redis se cae, ioredis sigue
             intentando y el backend se recupera solo cuando vuelve, en
             vez de quedar sin contador hasta el próximo despliegue. */
          maxRetriesPerRequest: null,
          retryStrategy: (veces) => Math.min(veces * 200, 5_000),
        });

        redis.on('error', (err: Error) =>
          logger.warn(`Redis no disponible (${err.message}).`),
        );
        redis.on('ready', () =>
          logger.log(url ? 'Conectado a Redis externo.' : 'Conectado a Redis.'),
        );

        return redis;
      },
    },
  ],
  exports: [REDIS],
})
export class QueuesModule {}
