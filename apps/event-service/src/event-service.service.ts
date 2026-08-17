import {
  Injectable,
} from '@nestjs/common';

import {
  DatabaseService,
} from '@app/database';
import { EventsSchema } from '@app/database/db/schemas';
import { RABBITMQ_EVENTS, RabbitMQService } from '@app/rabbitmq';

@Injectable()
export class EventsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly rabbitmq: RabbitMQService,
  ) { }

  async findAll() {
    return this.database.db
      .select()
      .from(EventsSchema)
      .limit(10);
  }

  async createEvent(
    data: any,
  ) {

    const event = {
      title: "Text",
      description: "Text from server event service",
      categoryId: 1,
      createdBy: 1,
    }

    this.rabbitmq.emit(
      RABBITMQ_EVENTS.EVENT_CREATED,
      event,
    );

    return event;
  }
}