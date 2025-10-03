import { Test, TestingModule } from '@nestjs/testing';
import { LastmileController } from './lastmile.controller';
import { LastmileService } from './lastmile.service';

describe('LastmileController', () => {
  let controller: LastmileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LastmileController],
      providers: [LastmileService],
    }).compile();

    controller = module.get<LastmileController>(LastmileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
