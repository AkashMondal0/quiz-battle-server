import { Controller, Get } from '@nestjs/common';
import { RealtimeServiceService } from './realtime-service.service';

@Controller()
export class RealtimeServiceController {
  constructor(private readonly realtimeServiceService: RealtimeServiceService) {}

  @Get()
  getHello(): string {
    return this.realtimeServiceService.getHello();
  }
}
