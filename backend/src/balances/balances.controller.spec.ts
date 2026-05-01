import { Test, TestingModule } from '@nestjs/testing';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';

describe('BalancesController (unit)', () => {
  let controller: BalancesController;
  let service: BalancesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [BalancesController],
      providers: [
        {
          provide: BalancesService,
          useValue: {
            getBalancesByGroup: jest.fn().mockResolvedValue({ total: 0, balances: [] }),
          },
        },
      ],
    }).compile();

    controller = module.get(BalancesController);
    service = module.get(BalancesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});