import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantController } from '../applicant.controller';
import { ApplicantService } from '../applicant.service';

describe('ApplicantController', () => {
  let controller: ApplicantController;

  const mockApplicantService = {
    getPaymentRequests: jest.fn(),
    getPaymentRequestById: jest.fn(),
    createDraftRequest: jest.fn(),
    submitToManager: jest.fn(),
    uploadReceiptFile: jest.fn(),
    submitToApprover: jest.fn(),
    updateDraftRequest: jest.fn(),
    softDeleteDraft: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicantController],
      providers: [
        {
          provide: ApplicantService,
          useValue: mockApplicantService,
        },
      ],
    }).compile();

    controller = module.get<ApplicantController>(ApplicantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
