import * as Joi from 'joi';

/* Redis y Postgres admiten dos formas de llegar: una URL de conexión,
   que es lo que entregan los servicios administrados (Neon, Upstash,
   Valkey gestionado), o el par host/puerto de siempre, que es lo que
   levanta docker-compose. Si la URL viene, manda ella y las variables
   sueltas dejan de ser obligatorias; si no viene, se exigen como
   antes. Así el mismo backend sirve para el equipo de desarrollo y
   para producción sin ramas distintas del código. */
const exigidoSinUrl = (url: string) =>
  Joi.string().when(url, {
    /* Una URL declarada pero vacía (`REDIS_URL=` a secas en el .env)
       cuenta como ausente. Si no se distinguiera, el host dejaría de
       exigirse y el backend arrancaría apuntando a ninguna parte. */
    is: Joi.string().min(1).required(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  });

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  CORS_ORIGIN: Joi.string().required(),

  TELEGRAM_BOT_TOKEN: Joi.string().required(),
  TELEGRAM_CHAT_ID: Joi.string().required(),

  // El asistente del sitio. El backend no arranca sin ella: es
  // preferible fallar al inicio que descubrirlo con un visitante
  // esperando una respuesta.
  GEMINI_API_KEY: Joi.string().required(),

  // Producción: redis://... o rediss://... para la variante con TLS.
  // Se admite vacía para poder dejarla listada en el .env sin usarla.
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .allow('')
    .optional(),

  REDIS_HOST: exigidoSinUrl('REDIS_URL'),
  REDIS_PORT: Joi.number().default(6379),

  // Producción: postgres://... o postgresql://..., con el sslmode que
  // pida el proveedor incluido en la propia URL.
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .allow('')
    .optional(),

  POSTGRES_HOST: exigidoSinUrl('DATABASE_URL'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: exigidoSinUrl('DATABASE_URL'),
  POSTGRES_PASSWORD: exigidoSinUrl('DATABASE_URL'),
  POSTGRES_DB: exigidoSinUrl('DATABASE_URL'),
});
