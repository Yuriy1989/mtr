import { Test, TestingModule } from '@nestjs/testing';
import { Vl06Service } from './vl06.service';

describe('Vl06Service', () => {
  let service: Vl06Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Vl06Service],
    }).compile();

    service = module.get<Vl06Service>(Vl06Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
