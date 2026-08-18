import {
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { EventsService } from './event-service.service';

@Controller()
export class EventServiceController {
  constructor(
    private readonly eventsService: EventsService,
  ) { }

  @Get()
  getEvents() {
    return {
      message: 'Event Service is working',
    };
  }
  
  // @Get('events')
  // async createEvent() {
  //   return this.eventsService.createEvent();
  // }
}