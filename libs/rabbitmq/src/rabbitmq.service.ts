import {
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  ClientProxy,
} from '@nestjs/microservices';

import {
  firstValueFrom,
} from 'rxjs';

import {
  RABBITMQ_CLIENT,
} from './rabbitmq.constants';

@Injectable()
export class RabbitMQService
  implements OnModuleInit
{
  constructor(
    @Inject(RABBITMQ_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.client.connect();
  }

  emit<T = unknown>(
    pattern: string,
    data: T,
  ) {
    return this.client.emit(
      pattern,
      data,
    );
  }

  async send<TRequest, TResponse>(
    pattern: string,
    data: TRequest,
  ): Promise<TResponse> {
    return firstValueFrom(
      this.client.send<TResponse, TRequest>(
        pattern,
        data,
      ),
    );
  }
}