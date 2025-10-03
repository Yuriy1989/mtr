import { Test, TestingModule } from '@nestjs/testing';
import { Vl06Controller } from './vl06.controller';
import { Vl06Service } from './vl06.service';

describe('Vl06Controller', () => {
  let controller: Vl06Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Vl06Controller],
      providers: [Vl06Service],
    }).compile();

    controller = module.get<Vl06Controller>(Vl06Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
