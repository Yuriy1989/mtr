import { Test, TestingModule } from '@nestjs/testing';
import { BasicunitService } from './basicunit.service';

describe('BasicunitService', () => {
  let service: BasicunitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicunitService],
    }).compile();

    service = module.get<BasicunitService>(BasicunitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
