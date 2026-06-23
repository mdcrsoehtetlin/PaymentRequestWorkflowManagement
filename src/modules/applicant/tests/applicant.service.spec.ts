import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantService } from '../applicant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import { PaymentRequest } from '../../shared/entities/payment-request.entity';
import { PaymentBreakdownItem } from '../../shared/entities/payment-breakdown-item.entity';
import { ReceiptFile } from '../../shared/entities/receipt-file.entity';
import { ApprovalLog } from '../../shared/entities/approval-log.entity';
import { User } from '../../shared/entities/user.entity';
import { RequestNumberService } from '../../shared/services/request-number.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
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
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: {},
        },
        {
          provide: RequestNumberService,
          useValue: { generateNext: jest.fn() },
        },
        {
          provide: FileUploadService,
          useValue: { saveFile: jest.fn() },
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
