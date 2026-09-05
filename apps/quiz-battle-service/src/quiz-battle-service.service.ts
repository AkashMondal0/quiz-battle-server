import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizBattleServiceService {
  getHello(): string {
    return 'Hello World! Events service is working!';
  }
}
