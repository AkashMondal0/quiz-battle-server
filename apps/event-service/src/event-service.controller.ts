import { Controller, Get } from '@nestjs/common';
import { EventsService } from './event-service.service';

@Controller()
export class EventServiceController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getHello(): any {
    return this.eventsService.findAll();
  }
}
