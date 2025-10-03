import { Test, TestingModule } from '@nestjs/testing';
import { MtrListService } from './mtr-list.service';

describe('MtrListService', () => {
  let service: MtrListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MtrListService],
    }).compile();

    service = module.get<MtrListService>(MtrListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
