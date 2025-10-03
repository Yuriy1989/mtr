import { Test, TestingModule } from '@nestjs/testing';
import { TableApplicationsService } from './table-applications.service';

describe('TableApplicationsService', () => {
  let service: TableApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TableApplicationsService],
    }).compile();

    service = module.get<TableApplicationsService>(TableApplicationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
