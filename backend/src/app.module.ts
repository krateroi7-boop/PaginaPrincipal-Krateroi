import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Redis } from 'ioredis';
import { validationSchema } from './common/config/validation.schema';
import { ApiModule } from './api/api.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from './ai/ai.module';
import { QueuesModule, REDIS } from './queues/queues.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    QueuesModule,

    /* El contador del límite por IP vive en Redis, no en la memoria del
       proceso. Con el almacenamiento en memoria, cada redespliegue —o
       cada reinicio del contenedor— devolvía el cupo a cero: quien
       estuviera abusando volvía a tener sus cinco envíos, y el corte
       dejaba de valer justo cuando más se necesitaba. Además, el día que
       corra más de una instancia del backend, cada una llevaría su
       propia cuenta y el límite real sería el doble o el triple del
       declarado. */
    ThrottlerModule.forRootAsync({
      imports: [QueuesModule],
      inject: [REDIS],
      useFactory: (redis: Redis) => ({
        throttlers: [{ ttl: 60_000, limit: 30 }],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    DatabaseModule,
    TelegramModule,
    AiModule,
    ApiModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
