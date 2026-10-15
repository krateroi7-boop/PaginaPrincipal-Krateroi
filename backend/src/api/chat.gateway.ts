import { WebSocketGateway } from '@nestjs/websockets';

// Reservado para cuando exista una respuesta de IA en tiempo real que emitir
// de vuelta al cliente (ver ai/ y queues/). Sin eventos todavía: hoy ninguna
// función del sitio necesita push en tiempo real.
@WebSocketGateway({ cors: false })
export class ChatGateway {}
