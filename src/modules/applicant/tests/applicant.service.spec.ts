import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantService } from '../applicant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentRequest } from '../../shared/entities/payment-request.entity';
import { PaymentBreakdownItem } from '../../shared/entities/payment-breakdown-item.entity';
import { ReceiptFile } from '../../shared/entities/receipt-file.entity';
import { ApprovalLog } from '../../shared/entities/approval-log.entity';
import { User } from '../../shared/entities/user.entity';
import { ApplicantGateway } from '../applicant.gateway';

describe('ApplicantService', () => {
  let service: ApplicantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantService,
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PaymentBreakdownItem),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ReceiptFile),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ApprovalLog),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: ApplicantGateway,
          useValue: { notifyStatusUpdate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ApplicantService>(ApplicantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
