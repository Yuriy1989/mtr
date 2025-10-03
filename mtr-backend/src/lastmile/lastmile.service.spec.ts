import { Test, TestingModule } from '@nestjs/testing';
import { LastmileService } from './lastmile.service';

describe('LastmileService', () => {
  let service: LastmileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LastmileService],
    }).compile();

    service = module.get<LastmileService>(LastmileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
