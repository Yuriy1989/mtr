import { Test, TestingModule } from '@nestjs/testing';
import { BasicunitController } from './basicunit.controller';
import { BasicunitService } from './basicunit.service';

describe('BasicunitController', () => {
  let controller: BasicunitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BasicunitController],
      providers: [BasicunitService],
    }).compile();

    controller = module.get<BasicunitController>(BasicunitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
