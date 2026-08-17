import { NestFactory } from '@nestjs/core';
import { WorkerServiceModule } from './worker-service.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerServiceModule);
  await app.listen(process.env.WORKER_SERVICE_PORT ?? 3600);
}
bootstrap();
