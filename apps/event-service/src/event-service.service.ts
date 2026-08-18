import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EventsService {
  // constructor(
  //   @Inject('NOTIFICATION_SERVICE')
  //   private readonly notificationClient: ClientProxy,
  // ) {}

  // async createEvent() {
  //   const event = {
  //     eventId: 'event-123',
  //     title: 'JoySpot Test Event',
  //     createdBy: 'user-123',
  //   };

  //   console.log('🎯 Event created:', event);

  //   this.notificationClient.emit(
  //     'event.created',
  //     event,
  //   );

  //   return event;
  // }
}