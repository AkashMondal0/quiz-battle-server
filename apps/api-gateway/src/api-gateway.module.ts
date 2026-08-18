import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ConfigService } from '@app/config';
import MICRO_SERVICES_CONFIGS from '@app/config/service/services-configs';
import { ClientsModule } from '@nestjs/microservices';

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
    ClientsModule.register(MICROSERVICE_CLIENTS),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService, ConfigService],
})
export class ApiGatewayModule { }
