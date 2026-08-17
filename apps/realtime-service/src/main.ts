import { NestFactory } from '@nestjs/core';
import { RealtimeServiceModule } from './realtime-service.module';

async function bootstrap() {
  const app = await NestFactory.create(RealtimeServiceModule);
  await app.listen(process.env.REALTIME_SERVICE_PORT ?? 3500);
}
bootstrap();
