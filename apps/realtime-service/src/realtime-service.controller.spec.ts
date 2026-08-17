import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeServiceController } from './realtime-service.controller';
import { RealtimeServiceService } from './realtime-service.service';

describe('RealtimeServiceController', () => {
  let realtimeServiceController: RealtimeServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RealtimeServiceController],
      providers: [RealtimeServiceService],
    }).compile();

    realtimeServiceController = app.get<RealtimeServiceController>(RealtimeServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(realtimeServiceController.getHello()).toBe('Hello World!');
    });
  });
});
