import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BreakdownsService } from './breakdowns.service';
import { Breakdown } from './schemas/breakdown.schema';

const mockBreakdownModel = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
});

describe('BreakdownsService', () => {
  let service: BreakdownsService;
  let model: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreakdownsService,
        {
          provide: getModelToken(Breakdown.name),
          useFactory: mockBreakdownModel,
        },
      ],
    }).compile();

    service = module.get<BreakdownsService>(BreakdownsService);
    model = module.get(getModelToken(Breakdown.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a breakdown', async () => {
    const dto = { userId: '1', type: 'PNEU', latitude: 0, longitude: 0 };
    const saveMock = jest.fn().mockResolvedValue({ ...dto, status: 'OPEN' });
    // Simule l'appel à new this.breakdownModel()
    service['breakdownModel'] = function () {
      return { save: saveMock };
    } as any;
    const result = await service.create(dto as any);
    expect(result.status).toBe('OPEN');
  });

  it('should find by id', async () => {
    const findByIdMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });
    service['breakdownModel'].findById = findByIdMock;
    const result = await service.findById('1');
    expect(result).not.toBeNull();
    expect(result!._id).toBe('1');
  });

  it('should find by user', async () => {
    const findMock = jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ userId: '1' }]) }) });
    service['breakdownModel'].find = findMock;
    const result = await service.findByUser('1');
    expect(result[0].userId).toBe('1');
  });
});
