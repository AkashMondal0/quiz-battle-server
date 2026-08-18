import { NOTIFICATION_PATTERNS } from '@app/config/patterns/notification-patterns';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller()
export class NotificationServiceController {

  @MessagePattern(NOTIFICATION_PATTERNS.EVENT_CREATED)
  async handleEventCreated(data: any) {
    console.log('Received:', data);

    return {
      success: true,
      data,
      message: 'Event processed successfully',
    };
  }
}