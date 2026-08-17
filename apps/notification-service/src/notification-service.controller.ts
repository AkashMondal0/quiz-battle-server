import { Controller, Get } from '@nestjs/common';
import { NotificationServiceService } from './notification-service.service';
import { EventPattern } from '@nestjs/microservices';
import { RABBITMQ_EVENTS } from '@app/rabbitmq';


@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationServiceService: NotificationServiceService) {}

  @EventPattern(
    RABBITMQ_EVENTS.EVENT_CREATED,
  )
  async handleEventCreated(
    data: {
      eventId: string;
      title: string;
      createdBy: string;
    },
  ) {

    console.log(
      'New event:',
      data,
    );

    await this.sendNotification(data);
  }

  private async sendNotification(
    data: any,
  ) {
    console.log(
      'Sending notification for event:',
      data,
    );
    // Push notification
    // FCM
    // Email
    // In-app notification
  }
}