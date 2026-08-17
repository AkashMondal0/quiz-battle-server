import { NestFactory } from '@nestjs/core';
import { EventServiceModule } from './event-service.module';

async function bootstrap() {
  const app = await NestFactory.create(EventServiceModule);
  await app.listen(process.env.EVENT_SERVICE_PORT ?? 3300);
}
bootstrap();
