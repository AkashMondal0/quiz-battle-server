import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { EventServiceController } from './event-service.controller';
import { EventsService } from './event-service.service';
import { DatabaseModule } from '@app/database';
import MICRO_SERVICES_CONFIGS from '@app/config/service/services-configs';

const MICROSERVICE_CLIENTS = Object.values(MICRO_SERVICES_CONFIGS)
  .filter((service) => service.APP_NAME !== 'EVENT_SERVICE')
  .map((service) => ({
    name: service.APP_NAME,
    transport: service.TRANSPORT,
    options: {
      host: service.MICROSERVICE_HOST,
      port: service.MICROSERVICE_PORT,
    },
  }));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule.forRoot(),
    ClientsModule.register(MICROSERVICE_CLIENTS),
  ],

  controllers: [EventServiceController],

  providers: [EventsService],
})
export class EventServiceModule {}