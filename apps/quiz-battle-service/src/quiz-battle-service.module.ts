import { Module } from '@nestjs/common';
import { QuizBattleServiceController } from './quiz-battle-service.controller';
import { QuizBattleServiceService } from './quiz-battle-service.service';
import { ConfigModule } from '@app/config';
import { RedisService } from '@app/redis';
import { EventsGateway } from './events/events.gateway';
import { EventsService } from './events/events.service';

@Module({
  imports: [ConfigModule],
  controllers: [QuizBattleServiceController],
  providers: [QuizBattleServiceService, RedisService, EventsGateway, EventsService],
})
export class QuizBattleServiceModule {}
