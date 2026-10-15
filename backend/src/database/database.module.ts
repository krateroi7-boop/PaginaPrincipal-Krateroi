import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const logger = new Logger('DatabaseModule');

// Conexión a Postgres lista para cuando exista historial de chats/usuarios que
// persistir. Sin entities todavía: el sitio no guarda nada hoy.
//
// La conexión se dispara en segundo plano (sin await acá) para que la falta
// de Postgres no impida arrancar el resto del backend: hoy ningún endpoint
// depende de la base de datos.
//
// Dos orígenes posibles, según lo que traiga el entorno: DATABASE_URL, que es
// como se conecta un Postgres administrado, o el host/puerto que levanta
// docker-compose. La URL tiene prioridad y debe traer su propio sslmode.
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DataSource,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');

        const opciones: DataSourceOptions = url
          ? {
              type: 'postgres',
              url,
              entities: [],
              synchronize: false,
            }
          : {
              type: 'postgres',
              host: config.get<string>('POSTGRES_HOST'),
              port: config.get<number>('POSTGRES_PORT'),
              username: config.get<string>('POSTGRES_USER'),
              password: config.get<string>('POSTGRES_PASSWORD'),
              database: config.get<string>('POSTGRES_DB'),
              entities: [],
              synchronize: false,
            };

        const dataSource = new DataSource(opciones);

        dataSource
          .initialize()
          .then(() =>
            logger.log(
              url ? 'Conectado a Postgres externo.' : 'Conectado a Postgres.',
            ),
          )
          .catch((err: Error) =>
            logger.warn(`Postgres no disponible todavía (${err.message}).`),
          );

        return dataSource;
      },
    },
  ],
  exports: [DataSource],
})
export class DatabaseModule {}
