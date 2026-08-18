import { Controller, Get, Patch } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { ConfigService } from '@app/config';

@Controller()
export class ApiGatewayController {
  constructor(
    private readonly apiGatewayService: ApiGatewayService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  getHello(): any {
    return this.apiGatewayService.createEvent();
  }

  // @Get('config')
  // getConfig(): any {
  //   return this.configService.getConfig();
  // }

  // @Get('config')
  // updateConfig(): any {
  //   this.configService.updateConfig(
  //     'NOTIFICATION_SERVICE',
  //     'MICROSERVICE_PORT',
  //     3090
  //   );
  // }
}
