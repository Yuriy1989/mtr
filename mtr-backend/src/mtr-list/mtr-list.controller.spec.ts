import { Test, TestingModule } from '@nestjs/testing';
import { MtrListController } from './mtr-list.controller';
import { MtrListService } from './mtr-list.service';

describe('MtrListController', () => {
  let controller: MtrListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MtrListController],
      providers: [MtrListService],
    }).compile();

    controller = module.get<MtrListController>(MtrListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
