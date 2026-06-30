import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { ApproverService, AuditContext } from '../approver.service';
import { PaymentRequest } from '../../shared/entities/payment-request.entity';
import { User } from '../../shared/entities/user.entity';
import { AuditLogService } from '../../shared/services/audit-log.service';
import { RedisService } from '../../shared/services/redis.service';
import { NotificationService } from '../../shared/services/notification.service';
import { WebsocketGateway } from '../../shared/websocket.gateway';
import { PaymentStatus } from '../../shared/types';
import {
  QueryApproverRequestsDto,
  ApproverRequestSortFields,
} from '../dto/query-approver-requests.dto';
import { ApprovePaymentRequestDto } from '../dto/approve-payment-request.dto';
import { RejectPaymentRequestDto } from '../dto/reject-payment-request.dto';

describe('ApproverService', () => {
  let service: ApproverService;
  let paymentRequestRepo: jest.Mocked<Repository<PaymentRequest>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let redisService: jest.Mocked<RedisService>;
  let notificationService: jest.Mocked<NotificationService>;
  let websocketGateway: jest.Mocked<WebsocketGateway>;

  const mockAuditContext: AuditContext = {
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  const mockApproverUserId = 10;

  const mockUser: Partial<User> = {
    userId: mockApproverUserId,
    fullName: 'Test Approver',
    employeeNumber: 'EMP-010',
    branch: 'Tokyo HQ',
  };

  const mockApplicantUser: Partial<User> = {
    userId: 1,
    fullName: 'Test Applicant',
    employeeNumber: 'EMP-001',
    branch: 'Osaka Branch',
  };

  const mockManagerUser: Partial<User> = {
    userId: 5,
    fullName: 'Test Manager',
    employeeNumber: 'EMP-005',
    branch: 'Tokyo HQ',
  };

  const buildMockRequest = (
    overrides: Partial<PaymentRequest> = {},
  ): PaymentRequest =>
    ({
      id: 100,
      request_number: 'PR-2026-001',
      applicant_user_id: 1,
      applicant: mockApplicantUser,
      manager_user_id: 5,
      manager: mockManagerUser,
      finalApproverUserId: undefined,
      final_approver: undefined,
      current_assigned_to_user_id: null,
      accounting_user_id: null,
      status_id: PaymentStatus.SUBMITTED_APPROVER,
      application_date: '2026-06-01',
      desired_payment_date: '2026-06-15',
      total_amount: '50000',
      currency_id: 1,
      payment_type_id: 1,
      payment_method_id: 1,
      purpose: 'Office supplies purchase',
      bank_account_info: null,
      request_content: null,
      has_receipt: false,
      manager_verification_date: new Date('2026-06-10'),
      submitted_to_approver_date: new Date('2026-06-11'),
      submitted_to_manager_date: null,
      approval_date: null,
      payment_completed_date: null,
      isDeleted: false,
      createdDate: new Date('2026-06-01'),
      modifiedDate: new Date('2026-06-01'),
      receipts: [],
      logs: [],
      ...overrides,
    }) as unknown as PaymentRequest;

  beforeEach(async () => {
    const mockQueryBuilder: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    paymentRequestRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<PaymentRequest>>;

    userRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    } as unknown as jest.Mocked<Repository<User>>;

    dataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<DataSource>;

    auditLogService = {
      createLog: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    redisService = {
      del: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    websocketGateway = {
      sendPersonalNotification: jest.fn(),
      sendStatusUpdate: jest.fn(),
    } as unknown as jest.Mocked<WebsocketGateway>;

    notificationService = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApproverService,
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: paymentRequestRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: RedisService, useValue: redisService },
        { provide: NotificationService, useValue: notificationService },
        { provide: WebsocketGateway, useValue: websocketGateway },
      ],
    }).compile();

    service = module.get<ApproverService>(ApproverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAssignedRequests', () => {
    it('should return paginated list of requests for approver', async () => {
      const query: QueryApproverRequestsDto = { page: 1, pageSize: 10 };
      const mockRequest = buildMockRequest();

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([
        [mockRequest],
        1,
      ]);

      const result = await service.findAssignedRequests(
        mockApproverUserId,
        query,
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.totalItems).toBe(1);
    });

    it('should throw BadRequestException for invalid status query', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        statusId: PaymentStatus.DRAFT,
      };

      await expect(
        service.findAssignedRequests(mockApproverUserId, query),
      ).rejects.toThrow(BadRequestException);
    });

    it('should filter by status when valid SUBMITTED_APPROVER status provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        statusId: PaymentStatus.SUBMITTED_APPROVER,
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.status_id = :statusId',
        { statusId: PaymentStatus.SUBMITTED_APPROVER },
      );
    });

    it('should filter by status when valid APPROVER_REVIEWING status provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        statusId: PaymentStatus.APPROVER_REVIEWING,
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.status_id = :statusId',
        { statusId: PaymentStatus.APPROVER_REVIEWING },
      );
    });

    it('should apply branch filter when provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        branch: 'Tokyo',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'LOWER(applicant.branch) LIKE LOWER(:branch)',
        { branch: '%Tokyo%' },
      );
    });

    it('should apply desired date filter when provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        desiredDate: '2026-06-01',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.desired_payment_date = :desiredDate',
        {
          desiredDate: '2026-06-01',
        },
      );
    });

    it('should apply search filter when provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        search: 'office',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalled();
    });

    it('should sort by totalAmount when sortBy is totalAmount', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        sortBy: ApproverRequestSortFields.TOTAL_AMOUNT,
        sortOrder: 'DESC',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith('request.totalAmount', 'DESC');
    });

    it('should sort by managerVerificationDate by default', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith(
        'request.modifiedDate',
        'DESC',
      );
    });
  });

  describe('findOneForReview', () => {
    it('should throw NotFoundException when request does not exist', async () => {
      paymentRequestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneForReview(999, mockApproverUserId, mockAuditContext),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when status is not accessible', async () => {
      const mockRequest = buildMockRequest({ statusId: PaymentStatus.DRAFT });
      paymentRequestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.findOneForReview(100, mockApproverUserId, mockAuditContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when APPROVER_REVIEWING request assigned to different approver', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: 99,
      });
      paymentRequestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.findOneForReview(100, mockApproverUserId, mockAuditContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when approver user not found in findOneForReview', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.SUBMITTED_APPROVER,
        finalApproverUserId: undefined,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.findOneForReview(100, mockApproverUserId, mockAuditContext),
      ).rejects.toThrow(NotFoundException);
    });

    it('should auto-transition SUBMITTED_APPROVER to APPROVER_REVIEWING', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.SUBMITTED_APPROVER,
        finalApproverUserId: undefined,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const freshRequest = {
        ...mockRequest,
        status_id: PaymentStatus.SUBMITTED_APPROVER,
      };
      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(freshRequest),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      dataSource.getRepository = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(dataSource['transaction']).toHaveBeenCalled();
      expect(result.statusId).toBe(PaymentStatus.APPROVER_REVIEWING);
      expect(result.canApprove).toBe(true);
      expect(result.canReject).toBe(true);
    });

    it('should throw ConflictException when request already being reviewed by another user during auto-transition', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.SUBMITTED_APPROVER,
        finalApproverUserId: undefined,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      await expect(
        service.findOneForReview(100, mockApproverUserId, mockAuditContext),
      ).rejects.toThrow(ConflictException);
    });

    it('should return detail view for APPROVER_REVIEWING request assigned to current approver', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.canApprove).toBe(true);
      expect(result.canReject).toBe(true);
      expect(dataSource['transaction']).not.toHaveBeenCalled();
    });

    it('should return detail view for APPROVED request (read-only)', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVED,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.canApprove).toBe(false);
      expect(result.canReject).toBe(false);
    });
  });

  describe('approve', () => {
    it('should throw NotFoundException when request does not exist', async () => {
      paymentRequestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.approve(999, mockApproverUserId, {}, mockAuditContext),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when request is not in APPROVER_REVIEWING status', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.SUBMITTED_APPROVER,
      });
      paymentRequestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.approve(100, mockApproverUserId, {}, mockAuditContext),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when approver is not assigned to the request', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: 99,
      });
      paymentRequestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.approve(100, mockApproverUserId, {}, mockAuditContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully approve a request and transition to APPROVED', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const freshRequest = {
        ...mockRequest,
        status_id: PaymentStatus.APPROVER_REVIEWING,
      };
      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(freshRequest),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      const dto: ApprovePaymentRequestDto = { comment: 'Looks good' };
      const result = await service.approve(
        100,
        mockApproverUserId,
        dto,
        mockAuditContext,
      );

      expect(result.success).toBe(true);
      expect(dataSource['transaction']).toHaveBeenCalled();
      expect(redisService['del']).toHaveBeenCalledWith(
        'payment_request:payload:100',
      );
      expect(websocketGateway['sendPersonalNotification']).toHaveBeenCalled();
      expect(websocketGateway['sendStatusUpdate']).toHaveBeenCalledWith(
        'ACCOUNTING',
        expect.any(Object),
      );
    });

    it('should evict Redis cache after approval', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ ...mockRequest }),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      await service.approve(100, mockApproverUserId, {}, mockAuditContext);

      expect(redisService['del']).toHaveBeenCalledWith(
        'payment_request:payload:100',
      );
    });

    it('should throw ConflictException when request modified during transaction', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      await expect(
        service.approve(100, mockApproverUserId, {}, mockAuditContext),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('should throw NotFoundException when request does not exist', async () => {
      paymentRequestRepo.findOne.mockResolvedValue(null);

      await expect(
        service.reject(
          999,
          mockApproverUserId,
          { comment: 'Test rejection reason' },
          mockAuditContext,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when request is not in APPROVER_REVIEWING status', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVED,
      });
      paymentRequestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.reject(
          100,
          mockApproverUserId,
          { comment: 'Test rejection reason' },
          mockAuditContext,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when approver is not assigned to the request', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: 99,
      });
      paymentRequestRepo.findOne.mockResolvedValue(mockRequest);

      await expect(
        service.reject(
          100,
          mockApproverUserId,
          { comment: 'Test rejection reason' },
          mockAuditContext,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully reject a request and transition to REJECTED_APPROVER', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const freshRequest = {
        ...mockRequest,
        status_id: PaymentStatus.APPROVER_REVIEWING,
      };
      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(freshRequest),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      const dto: RejectPaymentRequestDto = {
        comment: 'Missing required documentation for this expense',
      };
      const result = await service.reject(
        100,
        mockApproverUserId,
        dto,
        mockAuditContext,
      );

      expect(result.success).toBe(true);
      expect(dataSource['transaction']).toHaveBeenCalled();
      expect(redisService['del']).toHaveBeenCalledWith(
        'payment_request:payload:100',
      );
      expect(websocketGateway['sendPersonalNotification']).toHaveBeenCalled();
    });

    it('should reassign request to applicant after rejection', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        applicantUserId: 1,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      let savedRequest!: PaymentRequest;
      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ ...mockRequest }),
          save: jest
            .fn()
            .mockImplementation(
              (_target: unknown, entity: unknown): Promise<unknown> => {
                savedRequest = entity as PaymentRequest;
                return Promise.resolve(entity);
              },
            ),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      await service.reject(
        100,
        mockApproverUserId,
        { comment: 'Insufficient details provided' },
        mockAuditContext,
      );

      expect(savedRequest.currentAssignedToUserId).toBe(1);
      expect(savedRequest.statusId).toBe(PaymentStatus.REJECTED_APPROVER);
    });

    it('should throw ConflictException when request modified during rejection transaction', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
          save: jest.fn(),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      await expect(
        service.reject(
          100,
          mockApproverUserId,
          { comment: 'Cannot approve this request' },
          mockAuditContext,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getSummary', () => {
    it('should return summary counts for approver', async () => {
      const mockQb = {
        clone: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest
          .fn()
          .mockResolvedValueOnce(5) // pendingCount
          .mockResolvedValueOnce(2) // reviewingCount
          .mockResolvedValueOnce(3) // approvedCount
          .mockResolvedValueOnce(1) // rejectedCount
          .mockResolvedValueOnce(4) // paidCount
          .mockResolvedValueOnce(15) // totalQueue
          .mockResolvedValueOnce(2), // desiredDateAlertCount
      };

      paymentRequestRepo.createQueryBuilder = jest.fn().mockReturnValue(mockQb);

      const result = await service.getSummary(mockApproverUserId);

      expect(result).toEqual({
        pendingCount: 5,
        reviewingCount: 2,
        approvedCount: 3,
        rejectedCount: 1,
        paidCount: 4,
        totalQueue: 15,
        desiredDateAlertCount: 2,
      });
    });
  });

  describe('findOneForReview with relations', () => {
    it('should return detail view with breakdown items, receipt files, and approval logs', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
        receipts: [],
        finalApprover: {
          userId: mockApproverUserId,
          fullName: 'Test Approver',
          employeeNumber: 'EMP-010',
          branch: 'Tokyo HQ',
          email: 'approver@test.com',
          passwordHash: 'hash',
          department: 'Finance',
          roleId: 3,
        } as User,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.query.mockResolvedValueOnce([
        {
          payment_breakdown_item_id: 1,
          payment_request_id: 100,
          line_number: 1,
          item_date: '2026-06-01',
          description: 'Office supplies',
          amount: 50000,
          quantity: 1,
          unit_price: 50000,
          created_date: '2026-06-01',
          modified_date: '2026-06-01',
        },
      ]);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.breakdownItems).toHaveLength(1);
      expect(result.breakdownItems[0].description).toBe('Office supplies');
    });

    it('should sort approval logs by timestamp and extract comments', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [
          {
            approvalLogId: 1,
            paymentRequestId: 100,
            actionTakenByUserId: 5,
            actionTypeId: 5,
            previousStatusId: 4,
            newStatusId: 6,
            comment: 'Manager verified',
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            timestamp: new Date('2026-06-10T10:00:00Z'),
            action_taken_by_user: mockManagerUser,
          } as any,
          {
            approvalLogId: 2,
            paymentRequestId: 100,
            actionTakenByUserId: 1,
            actionTypeId: 3,
            previousStatusId: 4,
            newStatusId: 6,
            comment: 'Submitted to approver',
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            timestamp: new Date('2026-06-09T09:00:00Z'),
            action_taken_by_user: mockApplicantUser,
          } as any,
        ],
        receipts: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.query.mockResolvedValueOnce([]);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.approvalLogs).toHaveLength(2);
      expect(result.latestManagerComment).toBe('Manager verified');
      expect(result.latestApplicantSubmissionComment).toBe(
        'Submitted to approver',
      );
    });

    it('should map receipt files correctly', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
        receipts: [
          {
            id: 1,
            paymentRequestId: 100,
            originalFileName: 'receipt.pdf',
            storedFileName: 'stored-receipt.pdf',
            storage_key: '/uploads/receipt.pdf',
            file_size: 1024,
            mime_type: 'application/pdf',
            uploadedByUserId: 1,
            uploadedDate: new Date('2026-06-01'),
            isDeleted: false,
          } as any,
        ],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.query.mockResolvedValueOnce([]);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.receiptFiles).toHaveLength(1);
      expect(result.receiptFiles[0].originalFileName).toBe('receipt.pdf');
    });

    it('should handle WebSocket failure during auto-transition', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.SUBMITTED_APPROVER,
        finalApproverUserId: undefined,
        approvalLogs: [],
        receipts: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const freshRequest = {
        ...mockRequest,
        status_id: PaymentStatus.SUBMITTED_APPROVER,
      };
      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(freshRequest),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      dataSource.getRepository = jest.fn().mockReturnValue({
        find: jest.fn().mockResolvedValue([]),
      });

      websocketGateway.sendPersonalNotification.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.statusId).toBe(PaymentStatus.APPROVER_REVIEWING);
    });
  });

  describe('approve - approver user not found', () => {
    it('should throw NotFoundException when approver user not found', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.approve(100, mockApproverUserId, {}, mockAuditContext),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject - approver user not found', () => {
    it('should throw NotFoundException when approver user not found', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      userRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.reject(
          100,
          mockApproverUserId,
          { comment: 'Test rejection' },
          mockAuditContext,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve - WebSocket failure', () => {
    it('should still approve even if WebSocket notification fails', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ ...mockRequest }),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      websocketGateway.sendPersonalNotification.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const result = await service.approve(
        100,
        mockApproverUserId,
        {},
        mockAuditContext,
      );

      expect(result.success).toBe(true);
    });
  });

  describe('reject - WebSocket failure', () => {
    it('should still reject even if WebSocket notification fails', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({ ...mockRequest }),
          save: jest.fn(),
          query: jest.fn().mockResolvedValue([]),
        } as unknown as EntityManager;
        return (
          cb as unknown as (entityManager: EntityManager) => Promise<unknown>
        )(mockManager);
      });

      websocketGateway.sendPersonalNotification.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      const result = await service.reject(
        100,
        mockApproverUserId,
        { comment: 'Test rejection' },
        mockAuditContext,
      );

      expect(result.success).toBe(true);
    });
  });

  describe('findAssignedRequests - additional filters', () => {
    it('should apply showAll filter when provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        showAll: true,
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.status_id IN (:...statuses)',
        {
          statuses: [
            PaymentStatus.SUBMITTED_APPROVER,
            PaymentStatus.APPROVER_REVIEWING,
            PaymentStatus.APPROVED,
            PaymentStatus.REJECTED_APPROVER,
            PaymentStatus.PAID,
          ],
        },
      );
    });

    it('should apply desiredDateAlert filter when provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        desiredDateAlert: true,
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.status_id IN (:...alertStatuses)',
        {
          alertStatuses: [
            PaymentStatus.SUBMITTED_APPROVER,
            PaymentStatus.APPROVER_REVIEWING,
          ],
        },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        `request.desired_payment_date <= CURRENT_DATE + interval '3 days'`,
      );
    });

    it('should sort by statusId when sortBy is statusId', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        sortBy: ApproverRequestSortFields.STATUS,
        sortOrder: 'ASC',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith('request.statusId', 'ASC');
    });

    it('should sort by applicationDate when sortBy is applicationDate', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        sortBy: ApproverRequestSortFields.APPLICATION_DATE,
        sortOrder: 'ASC',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith(
        'request.applicationDate',
        'ASC',
      );
    });

    it('should sort by desiredPaymentDate when sortBy is desiredPaymentDate', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        sortBy: ApproverRequestSortFields.DESIRED_PAYMENT_DATE,
        sortOrder: 'ASC',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith(
        'request.desiredPaymentDate',
        'ASC',
      );
    });

    it('should sort by createdDate when sortBy is createdDate', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        sortBy: ApproverRequestSortFields.CREATED_DATE,
        sortOrder: 'ASC',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith('request.createdDate', 'ASC');
    });

    it('should sort by modifiedDate when sortBy is modifiedDate', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        sortBy: ApproverRequestSortFields.MODIFIED_DATE,
        sortOrder: 'DESC',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['orderBy']).toHaveBeenCalledWith(
        'request.modifiedDate',
        'DESC',
      );
    });
  });

  describe('private Brackets condition builders', () => {
    it('should build approver access condition with correct where clause', () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };

      const fn = service['buildApproverAccessCondition'](
        mockApproverUserId,
      ) as unknown as (qb: typeof mockQb) => void;
      fn(mockQb);
      expect(mockQb.where).toHaveBeenCalledWith(
        'request.status_id = :submittedStatus',
        { submittedStatus: PaymentStatus.SUBMITTED_APPROVER },
      );
      expect(mockQb.orWhere).toHaveBeenCalledWith(
        expect.stringContaining('final_approver_user_id = :approverUserId'),
        expect.objectContaining({
          approverUserId: mockApproverUserId,
        }),
      );
    });

    it('should build search condition with correct where clauses', () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };

      const fn = service['buildSearchCondition']('test query') as unknown as (
        qb: typeof mockQb,
      ) => void;
      fn(mockQb);
      expect(mockQb.where).toHaveBeenCalledWith(
        'LOWER(request.request_number) LIKE LOWER(:search)',
        { search: '%test query%' },
      );
      expect(mockQb.orWhere).toHaveBeenCalledWith(
        'LOWER(applicant.full_name) LIKE LOWER(:search)',
        { search: '%test query%' },
      );
      expect(mockQb.orWhere).toHaveBeenCalledWith(
        'LOWER(request.purpose) LIKE LOWER(:search)',
        { search: '%test query%' },
      );
    });
  });

  describe('branch coverage — findAssignedRequests fallback paths', () => {
    it('should use default page and pageSize when not provided', async () => {
      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAssignedRequests(mockApproverUserId, {});

      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(10);
    });

    it('should map request with null applicant using fallback values', async () => {
      const mockRequest = Object.assign(
        buildMockRequest({
          applicant: null as never,
        }),
        { applicantUserId: 1 },
      );
      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([
        [mockRequest],
        1,
      ]);

      const result = await service.findAssignedRequests(mockApproverUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(result.data[0].applicant.userId).toBe(1);
      expect(result.data[0].applicant.fullName).toBe('');
      expect(result.data[0].applicant.employeeNumber).toBe('');
      expect(result.data[0].applicant.branch).toBe('');
    });

    it('should return null manager when manager is not assigned', async () => {
      const mockRequest = buildMockRequest({ manager: null as never });
      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([
        [mockRequest],
        1,
      ]);

      const result = await service.findAssignedRequests(mockApproverUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(result.data[0].manager).toBeNull();
    });

    it('should return null dates when managerVerificationDate and submittedToApproverDate are null', async () => {
      const mockRequest = Object.assign(buildMockRequest({}), {
        managerVerificationDate: null,
        submittedToApproverDate: null,
      });
      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([
        [mockRequest],
        1,
      ]);

      const result = await service.findAssignedRequests(mockApproverUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(result.data[0].managerVerificationDate).toBeNull();
      expect(result.data[0].submittedToApproverDate).toBeNull();
    });

    it('should format dates when managerVerificationDate and submittedToApproverDate exist', async () => {
      const mockRequest = Object.assign(buildMockRequest({}), {
        managerVerificationDate: new Date('2026-06-10'),
        submittedToApproverDate: new Date('2026-06-11'),
      });
      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([
        [mockRequest],
        1,
      ]);

      const result = await service.findAssignedRequests(mockApproverUserId, {
        page: 1,
        pageSize: 10,
      });

      expect(result.data[0].managerVerificationDate).toBe(
        '2026-06-10T00:00:00.000Z',
      );
      expect(result.data[0].submittedToApproverDate).toBe(
        '2026-06-11T00:00:00.000Z',
      );
    });
  });

  describe('branch coverage — findOneForReview fallback paths', () => {
    it('should use fallback values when applicant is null', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        applicant: null as never,
        approvalLogs: [],
        receipts: [],
      });
      Object.assign(mockRequest, { applicantUserId: 1 });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.applicant.userId).toBe(1);
      expect(result.applicant.fullName).toBe('');
      expect(result.applicant.employeeNumber).toBe('');
      expect(result.applicant.branch).toBe('');
    });

    it('should return null manager when manager is not assigned', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        manager: null as never,
        approvalLogs: [],
        receipts: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.manager).toBeNull();
    });

    it('should use fallback for finalApprover department and email when null', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
        receipts: [],
      });
      Object.assign(mockRequest, {
        finalApprover: {
          userId: mockApproverUserId,
          fullName: 'Test Approver',
          employeeNumber: 'EMP-010',
          branch: 'Tokyo HQ',
          department: undefined,
          email: undefined,
        },
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.finalApprover?.department).toBe('');
      expect(result.finalApprover?.email).toBe('');
    });

    it('should map breakdown items with null quantity and unitPrice', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
        receipts: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.query.mockResolvedValueOnce([
        {
          payment_breakdown_item_id: 1,
          payment_request_id: 100,
          line_number: 1,
          item_date: '2026-06-01',
          description: 'Office supplies',
          amount: 50000,
          quantity: null,
          unit_price: null,
          created_date: '2026-06-01',
          modified_date: '2026-06-01',
        },
      ]);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.breakdownItems[0].quantity).toBeNull();
      expect(result.breakdownItems[0].unitPrice).toBeNull();
    });

    it('should map receipt files with null optional fields', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [],
        receipts: [
          {
            id: 1,
            paymentRequestId: 100,
            originalFileName: null,
            storedFileName: null,
            storage_key: '/files/receipt.pdf',
            file_size: 1024,
            mime_type: 'application/pdf',
            uploadedByUserId: null,
            uploadedDate: new Date('2026-06-10'),
            isDeleted: false,
          } as any,
        ],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.receiptFiles[0].originalFileName).toBe('');
      expect(result.receiptFiles[0].storedFileName).toBe('');
      expect(result.receiptFiles[0].uploadedByUserId).toBe(0);
    });

    it('should map approval logs with string timestamp and null user', async () => {
      const mockRequest = buildMockRequest({
        statusId: PaymentStatus.APPROVER_REVIEWING,
        finalApproverUserId: mockApproverUserId,
        approvalLogs: [
          {
            approvalLogId: 1,
            paymentRequestId: 100,
            actionTakenByUserId: 5,
            actionTypeId: 5,
            previousStatusId: 4,
            newStatusId: 6,
            comment: 'Verified',
            ipAddress: '127.0.0.1',
            userAgent: 'test',
            timestamp: '2026-06-10T10:00:00Z',
            action_taken_by_user: null,
          } as any,
        ],
        receipts: [],
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.findOneForReview(
        100,
        mockApproverUserId,
        mockAuditContext,
      );

      expect(result.approvalLogs[0].timestamp).toBe('2026-06-10T10:00:00Z');
      expect(result.approvalLogs[0].actionTakenByUser.userId).toBe(0);
      expect(result.approvalLogs[0].actionTakenByUser.fullName).toBe('Unknown');
    });
  });
});
