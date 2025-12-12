import { Test, TestingModule } from '@nestjs/testing';
import { BreakdownsController } from './breakdowns.controller';
import { BreakdownsService } from './breakdowns.service';

const mockBreakdownsService = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUser: jest.fn(),
  updateStatus: jest.fn(),
  assignAgent: jest.fn(),
};

describe('BreakdownsController', () => {
  let controller: BreakdownsController;
  let service: typeof mockBreakdownsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BreakdownsController],
      providers: [
        { provide: BreakdownsService, useValue: mockBreakdownsService },
      ],
    }).compile();

    controller = module.get<BreakdownsController>(BreakdownsController);
    service = module.get(BreakdownsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create on create', async () => {
    const dto = { userId: '1', type: 'PNEU', latitude: 0, longitude: 0 };
    const user = { userId: '1', role: 'utilisateur' };
    await controller.create(dto as any, user);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findById on findById', async () => {
    await controller.findById('1');
    expect(service.findById).toHaveBeenCalledWith('1');
  });

  it('should call service.findByUser on findByUser', async () => {
    await controller.findByUser('1');
    expect(service.findByUser).toHaveBeenCalledWith('1');
  });

  it('should call service.updateStatus on updateStatus', async () => {
    const dto = { status: 'RESOLVED' };
    await controller.updateStatus('1', dto as any);
    expect(service.updateStatus).toHaveBeenCalledWith('1', dto);
  });

  it('should call service.assignAgent on assignAgent', async () => {
    await controller.assignAgent('1', 'agentId');
    expect(service.assignAgent).toHaveBeenCalledWith('1', 'agentId');
  });
});
