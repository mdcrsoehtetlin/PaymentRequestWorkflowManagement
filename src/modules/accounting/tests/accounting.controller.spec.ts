/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AccountingController } from '../accounting.controller';
import { AccountingService } from '../accounting.service';
import { JwtPayload } from '../../shared/types';

describe('AccountingController', () => {
  let controller: AccountingController;
  let service: jest.Mocked<AccountingService>;

  const mockJwtPayload: JwtPayload = {
    sub: 20,
    email: 'accounting@test.com',
    role: 'ACCOUNTING',
    roleId: 4,
  } as JwtPayload;

  const mockRequest = {
    user: mockJwtPayload,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Mozilla/5.0' },
  };

  beforeEach(async () => {
    const mockService: jest.Mocked<AccountingService> = {
      findApprovedRequests: jest.fn(),
      getSummaryCounts: jest.fn(),
      findOneForAccounting: jest.fn(),
      completePayment: jest.fn(),
    } as unknown as jest.Mocked<AccountingService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountingController],
      providers: [{ provide: AccountingService, useValue: mockService }],
    }).compile();

    controller = module.get<AccountingController>(AccountingController);
    service = module.get(AccountingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /accounting/payment-requests', () => {
    it('should call service.findApprovedRequests with default params', async () => {
      const expected = { data: [], meta: { total: 0, page: 1, lastPage: 0 } };
      service.findApprovedRequests.mockResolvedValue(expected);

      const result = await controller.getApprovedRequests(1, 10);

      expect(service.findApprovedRequests).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(expected);
    });

    it('should pass search, branch, desiredDate, and filter params to service', async () => {
      service.findApprovedRequests.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, lastPage: 0 },
      });

      await controller.getApprovedRequests(
        2,
        20,
        'PR-001',
        'Yangon',
        '2026-06-15',
        'total',
      );

      expect(service.findApprovedRequests).toHaveBeenCalledWith(
        2,
        20,
        'PR-001',
        'Yangon',
        '2026-06-15',
        'total',
        undefined,
      );
    });
  });

  describe('GET /accounting/payment-requests/summary', () => {
    it('should return summary counts', async () => {
      const expected = {
        total: 25,
        pending: 12,
        mandalayAlerts: 3,
        desiredDateAlerts: 5,
      };
      service.getSummaryCounts.mockResolvedValue(expected);

      const result = await controller.getSummary();

      expect(service.getSummaryCounts).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('GET /accounting/payment-requests/:id', () => {
    it('should call service.findOneForAccounting with the request ID', async () => {
      const expected = { paymentRequestId: 100, requestNumber: 'PR-2026-001' };
      service.findOneForAccounting.mockResolvedValue(expected as never);

      const result = await controller.getPaymentRequestDetails(100);

      expect(service.findOneForAccounting).toHaveBeenCalledWith(100);
      expect(result).toEqual(expected);
    });
  });

  describe('POST /accounting/payment-requests/:id/complete-payment', () => {
    it('should call service.completePayment with ID, userId, comment, and audit context', async () => {
      const expected = {
        success: true,
        message: 'Payment completed successfully',
      };
      service.completePayment.mockResolvedValue(expected);

      const result = await controller.completePayment(mockRequest, 100, {
        comment: 'Paid via bank',
      });

      expect(service.completePayment).toHaveBeenCalledWith(100, {
        accountingUserId: 20,
        comment: 'Paid via bank',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(result).toEqual(expected);
    });

    it('should default ipAddress and userAgent when missing', async () => {
      service.completePayment.mockResolvedValue({
        success: true,
        message: 'OK',
      });

      const reqWithoutIp = { user: mockJwtPayload, ip: undefined, headers: {} };
      await controller.completePayment(reqWithoutIp as never, 100, {});

      expect(service.completePayment).toHaveBeenCalledWith(100, {
        accountingUserId: 20,
        comment: undefined,
        ipAddress: 'unknown',
        userAgent: 'unknown',
      });
    });

    it('should pass undefined comment when body is empty', async () => {
      service.completePayment.mockResolvedValue({
        success: true,
        message: 'OK',
      });

      await controller.completePayment(mockRequest, 100, {});

      expect(service.completePayment).toHaveBeenCalledWith(100, {
        accountingUserId: 20,
        comment: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
    });
  });
});
