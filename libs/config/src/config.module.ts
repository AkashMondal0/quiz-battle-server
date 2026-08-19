import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigModule as CM } from '@nestjs/config';

@Module({
  imports: [
    CM.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})

export class ConfigModule { }
