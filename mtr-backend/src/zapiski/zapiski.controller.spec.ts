import { Test, TestingModule } from '@nestjs/testing';
import { ZapiskiController } from './zapiski.controller';
import { ZapiskiService } from './zapiski.service';

describe('ZapiskiController', () => {
  let controller: ZapiskiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZapiskiController],
      providers: [ZapiskiService],
    }).compile();

    controller = module.get<ZapiskiController>(ZapiskiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
