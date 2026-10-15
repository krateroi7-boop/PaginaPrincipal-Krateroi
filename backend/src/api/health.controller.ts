import { Controller, Get, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Redis } from 'ioredis';
import { REDIS } from '../queues/queues.module';

/* ─────────────────────────────────────────────────────────────
   Estado del backend.

   La usa la sonda de Docker para decidir si el contenedor está sano y
   si nginx puede empezar a enviarle tráfico; sirve igual para un
   monitor externo cuando el sitio esté publicado.

   Responde 200 mientras el proceso atienda, aunque Postgres o Redis
   estén caídos, y es a propósito: hoy ningún endpoint del sitio
   depende de Postgres, así que marcar el contenedor como enfermo por
   eso sacaría de circulación un backend que funciona. El estado de
   cada dependencia va en el cuerpo, que es donde un operador lo
   necesita. Si algún día el formulario guarda en base de datos, este
   es el lugar donde eso pasa a ser un 503.

   Va fuera del límite por IP: la sonda pregunta cada quince segundos y
   se comería el cupo del visitante.
   ───────────────────────────────────────────────────────────── */

interface Estado {
  status: 'ok';
  postgres: 'up' | 'down';
  redis: 'up' | 'down';
  uptime: number;
}

@Controller('api')
export class HealthController {
  constructor(
    private readonly db: DataSource,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get('health')
  @SkipThrottle()
  async estado(): Promise<Estado> {
    const redis = await this.redis
      .ping()
      .then(() => 'up' as const)
      .catch(() => 'down' as const);

    return {
      status: 'ok',
      postgres: this.db.isInitialized ? 'up' : 'down',
      redis,
      uptime: Math.round(process.uptime()),
    };
  }
}
