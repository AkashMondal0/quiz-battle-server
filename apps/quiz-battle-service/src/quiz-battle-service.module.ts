import { Module } from '@nestjs/common';
import { QuizBattleServiceController } from './quiz-battle-service.controller';
import { QuizBattleService } from './quiz-battle-service.service';
import { ConfigModule } from '@app/config';
import { RedisService } from '@app/redis';
import { EventsGateway } from './events/events.gateway';
import { QuizBattleQuestionService } from './quiz-battle-question.service';
import { QuizBattleRankingService } from './quiz-battle-ranking.service';
import { EventsService } from './events/events.service';

@Module({
  imports: [ConfigModule],
  controllers: [QuizBattleServiceController],
  providers: [QuizBattleService, RedisService, EventsGateway, QuizBattleQuestionService, QuizBattleRankingService, EventsService],
})
export class QuizBattleServiceModule {}
