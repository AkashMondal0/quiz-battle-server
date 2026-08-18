import { NestFactory } from '@nestjs/core';
import { EventServiceModule } from './event-service.module';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // HTTP application
  const app = await NestFactory.create(
    EventServiceModule,
  );

  // TCP microservice
  app.connectMicroservice({
    transport: Transport.TCP,

    options: {
      host: '0.0.0.0',
      port: Number(
        process.env.EVENT_SERVICE_MICROSERVICE_PORT ?? 3300,
      ),
    },
  });

  // Start TCP
  await app.startAllMicroservices();

  // Start HTTP
  await app.listen(
    Number(process.env.EVENT_SERVICE_APP_PORT ?? 3002),
  );

  Logger.log(
    `🌐 Event Service HTTP running on port ${
      process.env.EVENT_SERVICE_APP_PORT ?? 3002
    }`,
  );

  Logger.log(
    `🔌 Event Service TCP running on port ${
      process.env.EVENT_SERVICE_MICROSERVICE_PORT ?? 3300
    }`,
  );
}

bootstrap();