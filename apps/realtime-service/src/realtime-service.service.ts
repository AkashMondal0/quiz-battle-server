import { Injectable } from '@nestjs/common';

@Injectable()
export class RealtimeServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
