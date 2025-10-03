import { Test, TestingModule } from '@nestjs/testing';
import { FilialsController } from './filials.controller';
import { FilialsService } from './filials.service';

describe('FilialsController', () => {
  let controller: FilialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilialsController],
      providers: [FilialsService],
    }).compile();

    controller = module.get<FilialsController>(FilialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
