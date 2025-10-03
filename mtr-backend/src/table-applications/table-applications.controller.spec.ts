import { Test, TestingModule } from '@nestjs/testing';
import { TableApplicationsController } from './table-applications.controller';
import { TableApplicationsService } from './table-applications.service';

describe('TableApplicationsController', () => {
  let controller: TableApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TableApplicationsController],
      providers: [TableApplicationsService],
    }).compile();

    controller = module.get<TableApplicationsController>(
      TableApplicationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
