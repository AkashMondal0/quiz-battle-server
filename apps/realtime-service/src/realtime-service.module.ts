import { Module } from '@nestjs/common';
import { RealtimeServiceController } from './realtime-service.controller';
import { RealtimeServiceService } from './realtime-service.service';

@Module({
  imports: [],
  controllers: [RealtimeServiceController],
  providers: [RealtimeServiceService],
})
export class RealtimeServiceModule {}
