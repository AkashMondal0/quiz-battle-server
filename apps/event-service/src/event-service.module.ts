import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventServiceController } from './event-service.controller';
import { EventsService } from './event-service.service';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule.forRoot(),
  ],
  controllers: [EventServiceController],
  providers: [EventsService],
})
export class EventServiceModule {}
