import { NestFactory } from '@nestjs/core';
import { QuizBattleServiceModule } from './quiz-battle-service.module';
import { RedisIoAdapter } from './events/RedisIoAdapter';
import { Logger } from '@nestjs/common/services';

async function bootstrap() {
  const app = await NestFactory.create(QuizBattleServiceModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const redisIoAdapter = new RedisIoAdapter(app);

  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  const port = Number(process.env.PORT) || 5000;

  await app.listen(port, '0.0.0.0');

  Logger.log(`QuizBattle service running on port ${port}`);
}

bootstrap();
