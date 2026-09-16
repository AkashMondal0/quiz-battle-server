import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  QuizBattleService,
} from './quiz-battle-service.service';


@Controller()
export class QuizBattleServiceController {
  constructor(
    private readonly quizBattleService:
      QuizBattleService,
  ) { }

  @Get('/room/:roomCode')
  async getRoomSession(
    @Param('roomCode') roomCode: string,
  ) {
    return await this.quizBattleService.getRoom(roomCode);
  }
}