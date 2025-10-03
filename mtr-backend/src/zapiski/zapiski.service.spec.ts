import { Test, TestingModule } from '@nestjs/testing';
import { ZapiskiService } from './zapiski.service';

describe('ZapiskiService', () => {
  let service: ZapiskiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZapiskiService],
    }).compile();

    service = module.get<ZapiskiService>(ZapiskiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
