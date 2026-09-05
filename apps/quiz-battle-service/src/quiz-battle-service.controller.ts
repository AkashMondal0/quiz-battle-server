import { Controller, Get } from '@nestjs/common';
import { QuizBattleServiceService } from './quiz-battle-service.service';
import { EventsGateway } from './events/events.gateway';

@Controller()
export class QuizBattleServiceController {
  constructor(
    private readonly quizBattleServiceService: QuizBattleServiceService,
    private readonly eventsService: EventsGateway
  ) { }

  @Get()
  async getHello(): Promise<string> {
    this.eventsService.send();
    return this.quizBattleServiceService.getHello();
  }
}
