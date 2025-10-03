import { Test, TestingModule } from '@nestjs/testing';
import { DimensionsController } from './dimensions.controller';
import { DimensionsService } from './dimensions.service';

describe('DimensionsController', () => {
  let controller: DimensionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DimensionsController],
      providers: [DimensionsService],
    }).compile();

    controller = module.get<DimensionsController>(DimensionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
