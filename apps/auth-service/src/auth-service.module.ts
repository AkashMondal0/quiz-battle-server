import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { AuthService } from './auth-service.service';
import { DatabaseService } from '@app/database';

@Module({
  imports: [],
  controllers: [AuthServiceController],
  providers: [AuthService, DatabaseService],
})
export class AuthServiceModule {}
