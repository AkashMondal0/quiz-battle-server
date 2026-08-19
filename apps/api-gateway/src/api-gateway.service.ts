import { NOTIFICATION_PATTERNS } from '@app/config/patterns/notification-patterns';
import MICRO_SERVICES_CONFIGS from '@app/config/service/services-configs';
import { DatabaseService } from '@app/database';
import { UsersSchema } from '@app/database/db/schemas';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiGatewayService {
  constructor(
    @Inject(MICRO_SERVICES_CONFIGS.NOTIFICATION_SERVICE.APP_NAME)
    private readonly notificationClient: ClientProxy,
    private readonly databaseService: DatabaseService
  ) { }

  async getUsers(): Promise<any> {
    const data = await this.databaseService.db.select().from(UsersSchema).limit(10);
    return data;
  }
  
  getHello(): string {
    return 'Hello World!';
  }

  async createEvent() {
    const data = await firstValueFrom(
      this.notificationClient.send(
        NOTIFICATION_PATTERNS.EVENT_CREATED,
        {
          name: 'New Event',
          description: 'This is a new event',
        },
      ),
    );

    return {
      success: true,
      message: 'Event processed successfully',
      data,
    };
  }
}
