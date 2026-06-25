import { Test, TestingModule } from '@nestjs/testing';
import { ApproverController } from '../approver.controller';
import { ApproverService } from '../approver.service';
import { QueryApproverRequestsDto } from '../dto/query-approver-requests.dto';
import { ApprovePaymentRequestDto } from '../dto/approve-payment-request.dto';
import { RejectPaymentRequestDto } from '../dto/reject-payment-request.dto';
import { JwtPayload } from '../../shared/types';

describe('ApproverController', () => {
  let controller: ApproverController;
  let service: jest.Mocked<ApproverService>;

  const mockJwtPayload: JwtPayload = {
    sub: 10,
    email: 'approver@test.com',
    role: 'APPROVER',
    roleId: 3,
  } as JwtPayload;

  const mockRequest = { user: mockJwtPayload };

  const mockIpAddress = '127.0.0.1';
  const mockUserAgent = 'Mozilla/5.0';

  beforeEach(async () => {
    const mockService: jest.Mocked<ApproverService> = {
      findAssignedRequests: jest.fn(),
      findOneForReview: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      getSummary: jest.fn(),
    } as unknown as jest.Mocked<ApproverService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApproverController],
      providers: [{ provide: ApproverService, useValue: mockService }],
    }).compile();

    controller = module.get<ApproverController>(ApproverController);
    service = module.get(ApproverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /approver/payment-requests/summary', () => {
    it('should call service.getSummary with approver userId', async () => {
      const expected = {
        pendingCount: 5,
        reviewingCount: 2,
        approvedCount: 3,
        rejectedCount: 1,
        paidCount: 4,
        totalQueue: 15,
        desiredDateAlertCount: 2,
      };
      service.getSummary.mockResolvedValue(expected);

      const result = await controller.getSummary(mockRequest);

      expect(service['getSummary']).toHaveBeenCalledWith(10);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /approver/payment-requests', () => {
    it('should call service.findAssignedRequests with approver userId and query params', async () => {
      const query: QueryApproverRequestsDto = { page: 1, pageSize: 10 };
      const expected = { data: [], meta: { totalItems: 0 } };
      service.findAssignedRequests.mockResolvedValue(expected as never);

      const result = await controller.getRequests(mockRequest, query);

      expect(service['findAssignedRequests']).toHaveBeenCalledWith(10, query);
      expect(result).toEqual(expected);
    });

    it('should pass filter parameters to service', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 20,
        search: 'office',
        branch: 'Tokyo',
        desiredDate: '2026-06-01',
      };
      service.findAssignedRequests.mockResolvedValue({
        data: [],
        meta: {},
      } as never);

      await controller.getRequests(mockRequest, query);

      expect(service['findAssignedRequests']).toHaveBeenCalledWith(10, query);
    });
  });

  describe('GET /approver/payment-requests/:id', () => {
    it('should call service.findOneForReview with request ID, approver userId, and audit context', async () => {
      const id = 100;
      const expected = { paymentRequestId: id, canApprove: true };
      service.findOneForReview.mockResolvedValue(expected as never);

      const result = await controller.getRequest(
        mockRequest,
        id,
        mockIpAddress,
        mockUserAgent,
      );

      expect(service['findOneForReview']).toHaveBeenCalledWith(id, 10, {
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      });
      expect(result).toEqual(expected);
    });

    it('should default userAgent to unknown when header is missing', async () => {
      const id = 100;
      service.findOneForReview.mockResolvedValue({} as never);

      await controller.getRequest(
        mockRequest,
        id,
        mockIpAddress,
        undefined as unknown as string,
      );

      expect(service['findOneForReview']).toHaveBeenCalledWith(id, 10, {
        ipAddress: mockIpAddress,
        userAgent: 'unknown',
      });
    });
  });

  describe('POST /approver/payment-requests/:id/approve', () => {
    it('should call service.approve with request ID, approver userId, DTO, and audit context', async () => {
      const id = 100;
      const dto: ApprovePaymentRequestDto = {
        comment: 'Looks good',
        accountingUserId: 20,
      };
      const expected = {
        success: true,
        message: 'Request successfully approved.',
      };
      service.approve.mockResolvedValue(expected);

      const result = await controller.approveRequest(
        mockRequest,
        id,
        dto,
        mockIpAddress,
        mockUserAgent,
      );

      expect(service['approve']).toHaveBeenCalledWith(id, 10, dto, {
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      });
      expect(result).toEqual(expected);
    });

    it('should default userAgent to unknown when header is missing', async () => {
      const id = 100;
      const dto: ApprovePaymentRequestDto = {};
      service.approve.mockResolvedValue({ success: true, message: 'OK' });

      await controller.approveRequest(
        mockRequest,
        id,
        dto,
        mockIpAddress,
        undefined as unknown as string,
      );

      expect(service['approve']).toHaveBeenCalledWith(id, 10, dto, {
        ipAddress: mockIpAddress,
        userAgent: 'unknown',
      });
    });
  });

  describe('POST /approver/payment-requests/:id/reject', () => {
    it('should call service.reject with request ID, approver userId, DTO, and audit context', async () => {
      const id = 100;
      const dto: RejectPaymentRequestDto = {
        comment: 'Missing documentation for this expense',
      };
      const expected = {
        success: true,
        message: 'Request successfully rejected.',
      };
      service.reject.mockResolvedValue(expected);

      const result = await controller.rejectRequest(
        mockRequest,
        id,
        dto,
        mockIpAddress,
        mockUserAgent,
      );

      expect(service['reject']).toHaveBeenCalledWith(id, 10, dto, {
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      });
      expect(result).toEqual(expected);
    });

    it('should default userAgent to unknown when header is missing', async () => {
      const id = 100;
      const dto: RejectPaymentRequestDto = {
        comment: 'Cannot approve this request at this time',
      };
      service.reject.mockResolvedValue({ success: true, message: 'OK' });

      await controller.rejectRequest(
        mockRequest,
        id,
        dto,
        mockIpAddress,
        undefined as unknown as string,
      );

      expect(service['reject']).toHaveBeenCalledWith(id, 10, dto, {
        ipAddress: mockIpAddress,
        userAgent: 'unknown',
      });
    });
  });
});
