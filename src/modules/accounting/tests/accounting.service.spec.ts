/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { AccountingService } from '../accounting.service';
import { PaymentRequest } from '../../shared/entities/payment-request.entity';
import { AuditLogService } from '../../shared/services/audit-log.service';
import { NotificationService } from '../../shared/services/notification.service';
import { WebsocketGateway } from '../../shared/websocket.gateway';
import { PaymentStatus } from '../../shared/types';

describe('AccountingService', () => {
  let service: AccountingService;
  let paymentRequestRepo: jest.Mocked<Repository<PaymentRequest>>;
  let dataSource: jest.Mocked<DataSource>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let notificationService: jest.Mocked<NotificationService>;
  let wsGateway: jest.Mocked<WebsocketGateway>;
  let redis: { del: jest.Mock };

  const createMockQueryBuilder = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getCount: jest.fn().mockResolvedValue(0),
      getOne: jest.fn().mockResolvedValue(null),
    };
    return qb;
  };

  beforeEach(async () => {
    const mockQueryBuilder = createMockQueryBuilder();

    paymentRequestRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<PaymentRequest>>;

    dataSource = {
      transaction: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    auditLogService = {
      createLog: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    wsGateway = {
      sendStatusUpdate: jest.fn(),
    } as unknown as jest.Mocked<WebsocketGateway>;

    notificationService = {
      create: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<NotificationService>;

    redis = { del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: paymentRequestRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: NotificationService, useValue: notificationService },
        { provide: WebsocketGateway, useValue: wsGateway },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findApprovedRequests', () => {
    it('should return paginated data with default filter (all statuses 8 + 10)', async () => {
      const qb = createMockQueryBuilder();
      const mockRequest = {
        id: 100,
        requestNumber: 'PR-2026-001',
        applicant: { fullName: 'John Doe', branch: 'Yangon' },
        totalAmount: '50000',
        currencyId: 1,
        statusId: 8,
        applicationDate: '2026-06-01',
        desiredPaymentDate: '2026-06-15',
      };
      qb.getManyAndCount.mockResolvedValue([[mockRequest], 1]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findApprovedRequests(1, 10);

      expect(qb.where).toHaveBeenCalledWith('pr.status_id IN (:...statusIds)', {
        statusIds: [8, 10],
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].paymentRequestId).toBe(100);
      expect(result.data[0].applicantName).toBe('John Doe');
      expect(result.meta.total).toBe(1);
    });

    it('should apply total filter (status 8 + 10)', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(
        1,
        10,
        undefined,
        undefined,
        undefined,
        'total',
      );

      expect(qb.where).toHaveBeenCalledWith('pr.status_id IN (:...statusIds)', {
        statusIds: [8, 10],
      });
    });

    it('should apply pending filter (status 8 only)', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(
        1,
        10,
        undefined,
        undefined,
        undefined,
        'pending',
      );

      expect(qb.where).toHaveBeenCalledWith('pr.status_id = :statusId', {
        statusId: 8,
      });
    });

    it('should apply mandalay filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(
        1,
        10,
        undefined,
        undefined,
        undefined,
        'mandalay',
      );

      expect(qb.where).toHaveBeenCalledWith('pr.status_id = :statusId', {
        statusId: 8,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('applicant.branch = :branch', {
        branch: 'Mandalay',
      });
    });

    it('should apply desiredDate filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(
        1,
        10,
        undefined,
        undefined,
        undefined,
        'desiredDate',
      );

      expect(qb.where).toHaveBeenCalledWith('pr.status_id = :statusId', {
        statusId: 8,
      });
    });

    it('should apply explicit statusId filter over KPI filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        10,
      );

      expect(qb.where).toHaveBeenCalledWith('pr.status_id = :statusId', {
        statusId: 10,
      });
    });

    it('should apply search filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(1, 10, 'PR-001');

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(pr.request_number ILIKE :search OR applicant.full_name ILIKE :search)',
        { search: '%PR-001%' },
      );
    });

    it('should apply branch filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(1, 10, undefined, 'Mandalay');

      expect(qb.andWhere).toHaveBeenCalledWith('applicant.branch = :branch', {
        branch: 'Mandalay',
      });
    });

    it('should apply desiredDate input filter', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findApprovedRequests(
        1,
        10,
        undefined,
        undefined,
        '2026-06-15',
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'pr.desired_payment_date = :desiredDate',
        { desiredDate: '2026-06-15' },
      );
    });
  });

  describe('getSummaryCounts', () => {
    it('should return summary counts for all KPI cards', async () => {
      const qb = createMockQueryBuilder();
      qb.getCount
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getSummaryCounts();

      expect(result).toEqual({
        total: 25,
        pending: 12,
        mandalayAlerts: 3,
        desiredDateAlerts: 5,
      });
      expect(paymentRequestRepo.createQueryBuilder).toHaveBeenCalledTimes(4);
    });
  });

  describe('findOneForAccounting', () => {
    it('should return payment request details for APPROVED status', async () => {
      const qb = createMockQueryBuilder();
      const mockRequest = {
        id: 100,
        requestNumber: 'PR-2026-001',
        statusId: 8,
        hasReceipt: true,
        applicantUserId: 1,
        applicant: {
          fullName: 'John Doe',
          employeeNumber: 'EMP-001',
          branch: 'Yangon',
          department: 'Finance',
          email: 'john@test.com',
        },
        manager: { fullName: 'Jane Manager', employeeNumber: 'EMP-005' },
        finalApprover: null,
        totalAmount: '50000',
        currencyId: 1,
        paymentTypeId: 1,
        paymentMethodId: 1,
        purpose: 'Office supplies',
        requestContent: 'Buy monitors',
        bankAccountInfo: null,
        applicationDate: '2026-06-01',
        desiredPaymentDate: '2026-06-15',
        breakdowns: [],
        receipts: [],
        approvalLogs: [],
      };
      qb.getOne.mockResolvedValue(mockRequest);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneForAccounting(100);

      expect(result.paymentRequestId).toBe(100);
      expect(result.requestNumber).toBe('PR-2026-001');
      expect(result.statusId).toBe(8);
      expect(result.applicant.fullName).toBe('John Doe');
      expect(result.paymentDetails.currencyCode).toBe('MMK');
      expect(result.paymentDetails.paymentTypeName).toBe(
        'Expense Reimbursement',
      );
      expect(result.paymentDetails.paymentMethodName).toBe('Bank Transfer');
    });

    it('should return details for PAID status (status 10)', async () => {
      const qb = createMockQueryBuilder();
      const mockRequest = {
        id: 101,
        requestNumber: 'PR-2026-002',
        statusId: 10,
        hasReceipt: false,
        applicantUserId: 2,
        applicant: {
          fullName: 'Jane Doe',
          employeeNumber: 'EMP-002',
          branch: 'Mandalay',
          department: null,
          email: 'jane@test.com',
        },
        manager: null,
        finalApprover: null,
        totalAmount: '30000',
        currencyId: 2,
        paymentTypeId: 2,
        paymentMethodId: 2,
        purpose: 'Travel expenses',
        requestContent: 'Client visit',
        bankAccountInfo: null,
        applicationDate: '2026-06-05',
        desiredPaymentDate: '2026-06-20',
        breakdowns: [],
        receipts: [],
        approvalLogs: [],
      };
      qb.getOne.mockResolvedValue(mockRequest);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneForAccounting(101);

      expect(result.statusId).toBe(10);
      expect(result.paymentDetails.currencyCode).toBe('USD');
      expect(result.paymentDetails.paymentMethodName).toBe('Cash');
    });

    it('should throw NotFoundException when request not found', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockResolvedValue(null);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOneForAccounting(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should map breakdown items sorted by lineNumber', async () => {
      const qb = createMockQueryBuilder();
      const mockRequest = {
        id: 100,
        requestNumber: 'PR-2026-001',
        statusId: 8,
        hasReceipt: false,
        applicantUserId: 1,
        applicant: {
          fullName: 'John',
          employeeNumber: 'E1',
          branch: 'Y',
          department: null,
          email: 't@t.com',
        },
        totalAmount: '1000',
        currencyId: 1,
        paymentTypeId: 1,
        paymentMethodId: 1,
        purpose: 'p',
        requestContent: 'r',
        applicationDate: '2026-06-01',
        desiredPaymentDate: '2026-06-10',
        breakdowns: [
          {
            id: 2,
            lineNumber: 2,
            itemDate: '2026-06-01',
            description: 'Item B',
            amount: '500',
            quantity: null,
            unit_price: null,
          },
          {
            id: 1,
            lineNumber: 1,
            itemDate: '2026-06-01',
            description: 'Item A',
            amount: '500',
            quantity: '2',
            unit_price: '250',
          },
        ],
        receipts: [],
        approvalLogs: [],
      };
      qb.getOne.mockResolvedValue(mockRequest);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneForAccounting(100);

      expect(result.breakdownItems).toHaveLength(2);
      expect(result.breakdownItems[0].lineNumber).toBe(1);
      expect(result.breakdownItems[0].description).toBe('Item A');
      expect(result.breakdownItems[1].lineNumber).toBe(2);
    });

    it('should filter out deleted receipt files', async () => {
      const qb = createMockQueryBuilder();
      const mockRequest = {
        id: 100,
        requestNumber: 'PR-2026-001',
        statusId: 8,
        hasReceipt: true,
        applicantUserId: 1,
        applicant: {
          fullName: 'John',
          employeeNumber: 'E1',
          branch: 'Y',
          department: null,
          email: 't@t.com',
        },
        totalAmount: '1000',
        currencyId: 1,
        paymentTypeId: 1,
        paymentMethodId: 1,
        purpose: 'p',
        requestContent: 'r',
        applicationDate: '2026-06-01',
        desiredPaymentDate: '2026-06-10',
        breakdowns: [],
        receipts: [
          {
            id: 1,
            originalFileName: 'receipt.pdf',
            storedFileName: 'abc.pdf',
            file_size: 1024,
            mime_type: 'application/pdf',
            uploadedDate: new Date(),
            isDeleted: false,
          },
          {
            id: 2,
            originalFileName: 'old.pdf',
            storedFileName: 'def.pdf',
            file_size: 512,
            mime_type: 'application/pdf',
            uploadedDate: new Date(),
            isDeleted: true,
          },
        ],
        approvalLogs: [],
      };
      qb.getOne.mockResolvedValue(mockRequest);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneForAccounting(100);

      expect(result.receiptFiles).toHaveLength(1);
      expect(result.receiptFiles[0].fileName).toBe('receipt.pdf');
    });

    it('should re-throw when queryBuilder throws an error', async () => {
      const qb = createMockQueryBuilder();
      qb.getOne.mockRejectedValue(new Error('DB connection lost'));
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOneForAccounting(100)).rejects.toThrow(
        'DB connection lost',
      );
    });

    it('should map approval logs to timeline', async () => {
      const qb = createMockQueryBuilder();
      const mockRequest = {
        id: 100,
        requestNumber: 'PR-2026-001',
        statusId: 8,
        hasReceipt: false,
        applicantUserId: 1,
        applicant: {
          fullName: 'John',
          employeeNumber: 'E1',
          branch: 'Y',
          department: null,
          email: 't@t.com',
        },
        totalAmount: '1000',
        currencyId: 1,
        paymentTypeId: 1,
        paymentMethodId: 1,
        purpose: 'p',
        requestContent: 'r',
        applicationDate: '2026-06-01',
        desiredPaymentDate: '2026-06-10',
        breakdowns: [],
        receipts: [],
        approvalLogs: [
          {
            approvalLogId: 'log-1',
            actionTypeId: 3,
            previousStatusId: null,
            newStatusId: 2,
            comment: 'Submitted by applicant',
            timestamp: new Date('2026-06-01T09:00:00Z'),
            action_taken_by_user: {
              userId: 1,
              fullName: 'John Doe',
              employeeNumber: 'E1',
            },
          },
          {
            approvalLogId: 'log-2',
            actionTypeId: 5,
            previousStatusId: 3,
            newStatusId: 4,
            comment: null,
            timestamp: new Date('2026-06-02T10:00:00Z'),
            action_taken_by_user: {
              userId: 5,
              fullName: 'Jane Manager',
              employeeNumber: 'E5',
            },
          },
        ],
      };
      qb.getOne.mockResolvedValue(mockRequest);
      paymentRequestRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOneForAccounting(100);

      expect(result.approvalTimeline).toHaveLength(2);
      expect(result.approvalTimeline[0].id).toBe('log-1');
      expect(result.approvalTimeline[0].actionTypeId).toBe(3);
      expect(result.approvalTimeline[0].comment).toBe('Submitted by applicant');
      expect(result.approvalTimeline[0].user.fullName).toBe('John Doe');
      expect(result.approvalTimeline[1].id).toBe('log-2');
      expect(result.approvalTimeline[1].comment).toBeNull();
      expect(result.approvalTimeline[1].user.fullName).toBe('Jane Manager');
    });
  });

  describe('completePayment', () => {
    const mockCtx = {
      accountingUserId: 20,
      comment: 'Payment done',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should complete payment successfully', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          id: 100,
          statusId: 8,
          applicantUserId: 5,
          requestNumber: 'PR-2026-001',
        }),
        update: jest.fn(),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn(),
      };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockManager),
      );
      redis.del.mockResolvedValue(undefined);

      const result = await service.completePayment(100, mockCtx);

      expect(result).toEqual({
        success: true,
        message: 'Payment completed successfully',
      });
      expect(mockManager.findOne).toHaveBeenCalledWith(PaymentRequest, {
        where: {
          id: 100,
          statusId: Number(PaymentStatus.APPROVED),
          isDeleted: false,
        },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.update).toHaveBeenCalledWith(PaymentRequest, 100, {
        statusId: PaymentStatus.PAID,
        accountingUserId: 20,
        paymentCompletedDate: expect.any(String),
      });
      expect(mockManager.save).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith('payment_request:payload:100');
      expect(notificationService.create).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          paymentRequestId: 100,
          link: '/applicant/request/100',
        }),
      );
      expect(wsGateway.sendStatusUpdate).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when request not found in transaction', async () => {
      const mockManager = { findOne: jest.fn().mockResolvedValue(null) };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockManager),
      );

      await expect(service.completePayment(999, mockCtx)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when payment already completed', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({ id: 100, statusId: 10 }),
      };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockManager),
      );

      await expect(service.completePayment(100, mockCtx)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should not throw when Redis eviction fails', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          id: 100,
          statusId: 8,
          applicantUserId: 5,
          requestNumber: 'PR-2026-001',
        }),
        update: jest.fn(),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn(),
      };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockManager),
      );
      redis.del.mockRejectedValue(new Error('Redis down'));

      const result = await service.completePayment(100, mockCtx);

      expect(result).toEqual({
        success: true,
        message: 'Payment completed successfully',
      });
    });

    it('should not throw when WebSocket broadcast fails', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue({
          id: 100,
          statusId: 8,
          applicantUserId: 5,
          requestNumber: 'PR-2026-001',
        }),
        update: jest.fn(),
        create: jest.fn().mockReturnValue({}),
        save: jest.fn(),
      };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb(mockManager),
      );
      redis.del.mockResolvedValue(undefined);
      wsGateway.sendStatusUpdate.mockImplementation(() => {
        throw new Error('WS down');
      });

      const result = await service.completePayment(100, mockCtx);

      expect(result).toEqual({
        success: true,
        message: 'Payment completed successfully',
      });
    });
  });
});
