import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { RABBITMQ_CLIENT } from './rabbitmq.constants';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: RABBITMQ_CLIENT,

        transport: Transport.RMQ,

        options: {
          urls: [
            process.env.RABBITMQ_URL ||
              'amqp://guest:guest@localhost:5672',
          ],

          queue: process.env.RABBITMQ_QUEUE || 'notification-service',

          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],

  providers: [RabbitMQService],

  exports: [
    ClientsModule,
    RabbitMQService,
  ],
})

export class RabbitMQModule {}