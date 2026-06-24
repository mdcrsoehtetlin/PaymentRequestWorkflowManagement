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

    it('should apply date range filters when provided', async () => {
      const query: QueryApproverRequestsDto = {
        page: 1,
        pageSize: 10,
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
      };

      const qb = paymentRequestRepo.createQueryBuilder();
      (qb['getManyAndCount'] as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAssignedRequests(mockApproverUserId, query);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.submitted_to_approver_date >= :dateFrom',
        {
          dateFrom: '2026-06-01',
        },
      );
      expect(qb['andWhere']).toHaveBeenCalledWith(
        'request.submitted_to_approver_date < :dateToNext',
        {
          dateToNext: '2026-06-30T23:59:59.999Z',
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
        'request.managerVerificationDate',
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
});
