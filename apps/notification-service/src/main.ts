import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';

import { NotificationServiceModule } from './notification-service.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
// HTTP application
  const app = await NestFactory.create(
    NotificationServiceModule,
  );

  // TCP microservice
  app.connectMicroservice({
    transport: Transport.TCP,

    options: {
      host: '0.0.0.0',
      port: Number(
        process.env.NOTIFICATION_SERVICE_MICROSERVICE_PORT ?? 3400,
      ),
    },
  });

  // Start TCP
  await app.startAllMicroservices();

  // Start HTTP
  await app.listen(
    Number(process.env.NOTIFICATION_SERVICE_APP_PORT ?? 3004),
  );

  Logger.log(
    `🌐 Notification Service HTTP running on port ${
      process.env.NOTIFICATION_SERVICE_APP_PORT ?? 3004
    }`,
  );

  Logger.log(
    `🔌 Notification Service TCP running on port ${
      process.env.NOTIFICATION_SERVICE_MICROSERVICE_PORT ?? 3400
    }`,
  );
}

bootstrap();