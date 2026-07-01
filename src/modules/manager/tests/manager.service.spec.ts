import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ManagerService } from '../manager.service';
import { PaymentRequest } from '../../shared/entities/payment-request.entity';
import { ReceiptFile } from '../../shared/entities/receipt-file.entity';
import { AuditLogService } from '../../shared/services/audit-log.service';
import { WebsocketGateway } from '../../shared/websocket.gateway';
import { PaymentStatus, RoleCode } from '../../shared/types';
import { QueryRequestsDto } from '../dto/query-requests.dto';
import { ApproveRequestDto } from '../dto/approve-request.dto';
import { RejectRequestDto } from '../dto/reject-request.dto';
import { StartReviewDto } from '../dto/start-review.dto';

interface MockQueryBuilder {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
}

interface SerializedLog {
  id?: number;
  actionTakenByUser?: unknown;
}

interface TransactionCallback {
  (entityManager: EntityManager): Promise<unknown>;
}

describe('ManagerService', () => {
  let service: ManagerService;
  let paymentRequestRepo: jest.Mocked<Repository<PaymentRequest>>;
  let receiptFileRepo: jest.Mocked<Repository<ReceiptFile>>;
  let dataSource: jest.Mocked<DataSource>;
  let auditLogService: jest.Mocked<AuditLogService>;
  let websocketGateway: jest.Mocked<WebsocketGateway>;

  const mockManagerId = 5;

  const mockApplicant = {
    userId: 1,
    fullName: 'John Doe',
    employeeNumber: 'EMP-001',
    branch: 'Tokyo',
  };

  const mockManager = {
    userId: 5,
    fullName: 'Test Manager',
    employeeNumber: 'EMP-005',
    branch: 'Tokyo',
  };

  const mockModifiedDate = new Date('2026-06-29T10:00:00Z');

  const buildMockPaymentRequest = (
    overrides: Partial<PaymentRequest> = {},
  ): PaymentRequest =>
    ({
      id: 100,
      requestNumber: 'PR-2026-001',
      applicantUserId: 1,
      applicant: mockApplicant,
      managerUserId: 5,
      manager: mockManager,
      statusId: PaymentStatus.SUBMITTED_MANAGER,
      isDeleted: false,
      modifiedDate: mockModifiedDate,
      breakdowns: [
        {
          id: 1,
          description: 'Breakdown 1',
          amount: 1000,
          paymentRequest: null,
        },
      ],
      receipts: [
        {
          id: 200,
          paymentRequestId: 100,
          originalFileName: 'receipt.png',
          storedFileName: 'stored_receipt.png',
          storage_key: '/path/receipt.png',
          file_size: 1024,
          mime_type: 'image/png',
          uploadedByUserId: 1,
          uploadedDate: new Date(),
          isDeleted: false,
        },
      ],
      approvalLogs: [
        {
          id: 1,
          timestamp: '2026-06-29T09:00:00Z',
          action_taken_by_user: {
            userId: 1,
            fullName: 'John Doe',
            employeeNumber: 'EMP-001',
            branch: 'Tokyo',
          },
        },
      ],
      ...overrides,
    }) as unknown as PaymentRequest;

  beforeEach(async () => {
    const mockQueryBuilder: MockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    paymentRequestRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<PaymentRequest>>;

    receiptFileRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<ReceiptFile>>;

    dataSource = {
      transaction: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    auditLogService = {
      createLog: jest.fn(),
    } as unknown as jest.Mocked<AuditLogService>;

    websocketGateway = {
      sendPersonalNotification: jest.fn(),
      sendStatusUpdate: jest.fn(),
    } as unknown as jest.Mocked<WebsocketGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagerService,
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: paymentRequestRepo,
        },
        {
          provide: getRepositoryToken(ReceiptFile),
          useValue: receiptFileRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: WebsocketGateway, useValue: websocketGateway },
      ],
    }).compile();

    service = module.get<ManagerService>(ManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingRequests', () => {
    it('should query pending requests without filters', async () => {
      const query: QueryRequestsDto = {};
      const mockRequest = buildMockPaymentRequest();
      const qb =
        paymentRequestRepo.createQueryBuilder() as unknown as MockQueryBuilder;
      qb.getMany.mockResolvedValueOnce([mockRequest]);

      const result = await service.getPendingRequests(mockManagerId, query);

      expect(paymentRequestRepo['createQueryBuilder']).toHaveBeenCalledWith(
        'request',
      );
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'request.applicant',
        'applicant',
      );
      expect(qb.where).toHaveBeenCalledWith(
        'request.managerUserId = :managerId',
        { managerId: mockManagerId },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('request.isDeleted = false');
      expect(qb.andWhere).toHaveBeenCalledWith(
        'request.statusId != :draftStatus',
        { draftStatus: PaymentStatus.DRAFT },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('request.modifiedDate', 'DESC');
      expect(result).toEqual([
        {
          ...mockRequest,
          paymentRequestId: mockRequest.id,
        },
      ]);
    });

    it('should query with statusId, dates and applicant filter', async () => {
      const query: QueryRequestsDto = {
        statusId: PaymentStatus.SUBMITTED_MANAGER,
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
        applicant: 'John',
      };
      const qb =
        paymentRequestRepo.createQueryBuilder() as unknown as MockQueryBuilder;
      qb.getMany.mockResolvedValueOnce([]);

      await service.getPendingRequests(mockManagerId, query);

      expect(qb.andWhere).toHaveBeenCalledWith('request.statusId = :statusId', {
        statusId: query.statusId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'request.applicationDate >= :dateFrom',
        { dateFrom: query.dateFrom },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'request.applicationDate <= :dateTo',
        { dateTo: query.dateTo },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'applicant.fullName ILIKE :applicantName',
        { applicantName: '%John%' },
      );
    });

    it('should query with search filter matching requestNumber OR applicant', async () => {
      const query: QueryRequestsDto = {
        search: 'PRF-2026',
      };
      const qb =
        paymentRequestRepo.createQueryBuilder() as unknown as MockQueryBuilder;
      qb.getMany.mockResolvedValueOnce([]);

      await service.getPendingRequests(mockManagerId, query);

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(request.requestNumber ILIKE :searchTerm OR applicant.fullName ILIKE :searchTerm)',
        { searchTerm: '%PRF-2026%' },
      );
    });

    it('should query with branch filter', async () => {
      const query: QueryRequestsDto = {
        branch: 'Tokyo',
      };
      const qb =
        paymentRequestRepo.createQueryBuilder() as unknown as MockQueryBuilder;
      qb.getMany.mockResolvedValueOnce([]);

      await service.getPendingRequests(mockManagerId, query);

      expect(qb.andWhere).toHaveBeenCalledWith('applicant.branch = :branch', {
        branch: 'Tokyo',
      });
    });
  });

  describe('downloadReceipt', () => {
    it('should return receipt if matching request and receipt exist', async () => {
      const mockRequest = buildMockPaymentRequest();
      const mockReceipt = mockRequest.receipts[0];

      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      receiptFileRepo.findOne.mockResolvedValueOnce(mockReceipt);

      const result = await service.downloadReceipt(
        mockManagerId,
        mockRequest.id,
        mockReceipt.id,
      );

      expect(paymentRequestRepo['findOne']).toHaveBeenCalledWith({
        where: {
          id: mockRequest.id,
          managerUserId: mockManagerId,
          isDeleted: false,
        },
      });
      expect(receiptFileRepo['findOne']).toHaveBeenCalledWith({
        where: {
          id: mockReceipt.id,
          paymentRequestId: mockRequest.id,
          isDeleted: false,
        },
      });
      expect(result).toEqual(mockReceipt);
    });

    it('should throw NotFoundException if payment request not found', async () => {
      paymentRequestRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.downloadReceipt(mockManagerId, 999, 200),
      ).rejects.toThrow(
        new NotFoundException('指定された申請が見つかりません'),
      );
    });

    it('should throw NotFoundException if receipt file not found', async () => {
      const mockRequest = buildMockPaymentRequest();
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      receiptFileRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.downloadReceipt(mockManagerId, mockRequest.id, 999),
      ).rejects.toThrow(new NotFoundException('領収書が見つかりません'));
    });
  });

  describe('getRequestDetails', () => {
    it('should return serialized request details sorted chronologically by log timestamp', async () => {
      const log1 = {
        id: 1,
        timestamp: '2026-06-29T10:00:00Z',
        action_taken_by_user: mockApplicant,
      };
      const log2 = {
        id: 2,
        timestamp: '2026-06-29T09:00:00Z',
        action_taken_by_user: null,
      };
      const mockRequest = buildMockPaymentRequest({
        approvalLogs: [log1, log2] as unknown as never,
      });

      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.getRequestDetails(
        mockRequest.id,
        mockManagerId,
      );

      expect(paymentRequestRepo['findOne']).toHaveBeenCalledWith({
        where: {
          id: mockRequest.id,
          managerUserId: mockManagerId,
          isDeleted: false,
        },
        relations: [
          'applicant',
          'breakdowns',
          'receipts',
          'approvalLogs',
          'approvalLogs.action_taken_by_user',
        ],
      });
      expect(result.paymentRequestId).toBe(mockRequest.id);
      const logs = result.approvalLogs as SerializedLog[];
      expect(logs[0].id).toBe(2);
      expect(logs[1].id).toBe(1);
      expect(logs[1].actionTakenByUser).toEqual({
        userId: 1,
        fullName: 'John Doe',
        employeeNumber: 'EMP-001',
        branch: 'Tokyo',
      });
      expect(logs[0].actionTakenByUser).toBeNull();
      expect(result.receiptFiles[0]).toEqual({
        receiptFileId: 200,
        paymentRequestId: 100,
        originalFileName: 'receipt.png',
        storedFileName: 'stored_receipt.png',
        fileStoragePath: '/path/receipt.png',
        fileSize: '1024',
        mimeType: 'image/png',
        uploadedByUserId: 1,
        uploadedDate: mockRequest.receipts[0].uploadedDate,
        isDeleted: false,
      });

      const reqNoSize = buildMockPaymentRequest();
      reqNoSize.receipts[0].file_size = null as unknown as number;
      paymentRequestRepo.findOne.mockResolvedValueOnce(reqNoSize);
      const resNoSize = await service.getRequestDetails(
        reqNoSize.id,
        mockManagerId,
      );
      expect(resNoSize.receiptFiles[0].fileSize).toBeNull();
    });

    it('should throw NotFoundException if payment request not found', async () => {
      paymentRequestRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.getRequestDetails(999, mockManagerId),
      ).rejects.toThrow(
        new NotFoundException('指定された申請が見つかりません'),
      );
    });

    it('should handle missing optional arrays in serialization', async () => {
      const mockRequest = buildMockPaymentRequest({
        breakdowns: null as unknown as never,
        receipts: null as unknown as never,
        approvalLogs: null as unknown as never,
      });

      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      const result = await service.getRequestDetails(
        mockRequest.id,
        mockManagerId,
      );

      expect(result.breakdownItems).toEqual([]);
      expect(result.receiptFiles).toEqual([]);
      expect(result.approvalLogs).toEqual([]);
    });
  });

  describe('startReview', () => {
    it('should start review and emit events successfully', async () => {
      const mockRequest = buildMockPaymentRequest();
      const updatedMockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
      });

      paymentRequestRepo.findOne
        .mockResolvedValueOnce(mockRequest)
        .mockResolvedValueOnce(updatedMockRequest);

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };
      const result = await service.startReview(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(dataSource['transaction']).toHaveBeenCalled();
      expect(
        websocketGateway['sendPersonalNotification'],
      ).toHaveBeenCalledTimes(2);
      expect(websocketGateway['sendStatusUpdate']).toHaveBeenCalledWith(
        RoleCode.MANAGER,
        expect.objectContaining({
          event: 'queueChange',
          action: 'REVIEW_START',
          paymentRequestId: mockRequest.id,
          requestNumber: mockRequest.requestNumber,
          newStatusId: PaymentStatus.MANAGER_REVIEWING,
        }),
      );
      expect(result.statusId).toBe(PaymentStatus.MANAGER_REVIEWING);
    });

    it('should handle WebSocket notification failures gracefully without crash', async () => {
      const mockRequest = buildMockPaymentRequest();
      const updatedMockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
      });

      paymentRequestRepo.findOne
        .mockResolvedValueOnce(mockRequest)
        .mockResolvedValueOnce(updatedMockRequest);

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      websocketGateway.sendStatusUpdate.mockImplementationOnce(() => {
        throw new Error('WebSocket connection lost');
      });

      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };
      const result = await service.startReview(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(result.statusId).toBe(PaymentStatus.MANAGER_REVIEWING);
    });

    it('should return serialized original request if final updated lookup fails', async () => {
      const mockRequest = buildMockPaymentRequest();

      paymentRequestRepo.findOne
        .mockResolvedValueOnce(mockRequest)
        .mockResolvedValueOnce(null);

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };
      const result = await service.startReview(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(result.statusId).toBe(PaymentStatus.SUBMITTED_MANAGER);
    });

    it('should throw NotFoundException if request not found', async () => {
      paymentRequestRepo.findOne.mockResolvedValueOnce(null);
      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.startReview(999, mockManagerId, dto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(
        new NotFoundException('指定された申請が見つかりません'),
      );
    });

    it('should throw BadRequestException if status is not SUBMITTED_MANAGER', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
      });
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.startReview(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if modifiedDate check fails', async () => {
      const mockRequest = buildMockPaymentRequest();
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      const dto: StartReviewDto = {
        modifiedDate: new Date('2026-06-29T11:00:00Z').toISOString(),
      };

      await expect(
        service.startReview(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if database transaction fails', async () => {
      const mockRequest = buildMockPaymentRequest();
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      dataSource.transaction.mockRejectedValueOnce(
        new Error('DB Lock failure'),
      );

      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.startReview(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException and stringify non-Error object on database transaction fail', async () => {
      const mockRequest = buildMockPaymentRequest();
      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);
      dataSource.transaction.mockRejectedValueOnce('Raw DB Error String');

      const dto: StartReviewDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.startReview(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(
        new BadRequestException({
          errorCode: 'ERR-MGR-REVIEW-FAIL',
          message: 'レビューの開始に失敗しました: "Raw DB Error String"',
        }),
      );
    });
  });

  describe('verifyRequest', () => {
    it('should throw BadRequestException if ID is invalid', async () => {
      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };
      await expect(
        service.verifyRequest(0, mockManagerId, dto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully verify the request inside a transaction', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
        currentAssignedToUserId: mockManagerId,
      });

      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Verified and approved.',
      };

      const result = await service.verifyRequest(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
      );

      expect(dataSource['transaction']).toHaveBeenCalled();
      expect(websocketGateway['sendStatusUpdate']).toHaveBeenCalledWith(
        RoleCode.MANAGER,
        expect.objectContaining({
          event: 'queueChange',
          action: 'VERIFIED',
          paymentRequestId: mockRequest.id,
          requestNumber: mockRequest.requestNumber,
          newStatusId: PaymentStatus.MANAGER_VERIFIED,
        }),
      );
      expect(result).toEqual({
        success: true,
        message: '申請を確認済みにしました。',
      });
    });

    it('should allow verification when in SUBMITTED_MANAGER status', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.SUBMITTED_MANAGER,
        currentAssignedToUserId: mockManagerId,
      });

      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      const result = await service.verifyRequest(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
      );
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if request not found in transaction', async () => {
      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.verifyRequest(999, mockManagerId, dto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if status is neither MANAGER_REVIEWING nor SUBMITTED_MANAGER', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.APPROVED,
        currentAssignedToUserId: mockManagerId,
      });

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.verifyRequest(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if modifiedDate check fails inside transaction', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
        currentAssignedToUserId: mockManagerId,
      });

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: ApproveRequestDto = {
        modifiedDate: new Date('2026-06-29T12:00:00Z').toISOString(),
      };

      await expect(
        service.verifyRequest(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow standard exceptions and wrap unknown database transaction failures as BadRequestException', async () => {
      dataSource.transaction.mockRejectedValueOnce(
        new Error('Unknown DB Error'),
      );
      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.verifyRequest(100, mockManagerId, dto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should wrap unknown database transaction string failures as BadRequestException', async () => {
      dataSource.transaction.mockRejectedValueOnce('Raw DB Error String');
      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      await expect(
        service.verifyRequest(100, mockManagerId, dto, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle WebSocket notification failures gracefully without crash during verification', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
        currentAssignedToUserId: mockManagerId,
      });

      paymentRequestRepo.findOne.mockResolvedValueOnce(mockRequest);

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      websocketGateway.sendStatusUpdate.mockImplementationOnce(() => {
        throw new Error('WebSocket connection lost');
      });

      const dto: ApproveRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
      };

      const result = await service.verifyRequest(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
      );
      expect(result.success).toBe(true);
    });
  });

  describe('rejectRequest', () => {
    it('should throw BadRequestException if ID is invalid', async () => {
      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };
      await expect(
        service.rejectRequest(
          0,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
          'Manager',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reject the request and reassign to applicant', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
        currentAssignedToUserId: mockManagerId,
      });

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };

      const result = await service.rejectRequest(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
        'Test Manager',
      );

      expect(dataSource['transaction']).toHaveBeenCalled();
      expect(websocketGateway['sendPersonalNotification']).toHaveBeenCalledWith(
        mockManagerId,
        'statusUpdate',
        expect.objectContaining({
          event: 'statusUpdate',
          paymentRequestId: mockRequest.id,
          requestNumber: mockRequest.requestNumber,
          previousStatusId: PaymentStatus.MANAGER_REVIEWING,
          newStatusId: PaymentStatus.REJECTED_MANAGER,
          actionByUserId: mockManagerId,
          actionByName: 'Test Manager',
          comment: dto.comment,
        }),
      );
      expect(websocketGateway['sendStatusUpdate']).toHaveBeenCalledWith(
        RoleCode.MANAGER,
        expect.objectContaining({
          event: 'queueChange',
          action: 'REJECTED',
          paymentRequestId: mockRequest.id,
          requestNumber: mockRequest.requestNumber,
          newStatusId: PaymentStatus.REJECTED_MANAGER,
        }),
      );
      expect(result).toEqual({
        success: true,
        message: '申請を差し戻しました。申請者に通知されます。',
      });
    });

    it('should throw NotFoundException if request not found in rejection transaction', async () => {
      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };

      await expect(
        service.rejectRequest(
          999,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
          'Manager',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if status is neither MANAGER_REVIEWING nor SUBMITTED_MANAGER', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.APPROVED,
        currentAssignedToUserId: mockManagerId,
      });

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };

      await expect(
        service.rejectRequest(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
          'Manager',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if modifiedDate check fails during rejection transaction', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
        currentAssignedToUserId: mockManagerId,
      });

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      const dto: RejectRequestDto = {
        modifiedDate: new Date('2026-06-29T12:00:00Z').toISOString(),
        comment: 'Rejection reason comment here',
      };

      await expect(
        service.rejectRequest(
          mockRequest.id,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
          'Manager',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow standard exceptions and wrap unknown database transaction failures as BadRequestException', async () => {
      dataSource.transaction.mockRejectedValueOnce(
        new Error('Unknown DB Error'),
      );
      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };

      await expect(
        service.rejectRequest(
          100,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
          'Manager',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should wrap unknown database transaction string failures as BadRequestException', async () => {
      dataSource.transaction.mockRejectedValueOnce('Raw DB Error String');
      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };

      await expect(
        service.rejectRequest(
          100,
          mockManagerId,
          dto,
          '127.0.0.1',
          'Mozilla',
          'Manager',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle WebSocket notification failures gracefully without crash during rejection', async () => {
      const mockRequest = buildMockPaymentRequest({
        statusId: PaymentStatus.MANAGER_REVIEWING,
        currentAssignedToUserId: mockManagerId,
      });

      dataSource.transaction.mockImplementation((cb: unknown) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockRequest),
          update: jest.fn().mockResolvedValue(undefined),
        } as unknown as EntityManager;
        return (cb as TransactionCallback)(mockManager);
      });

      websocketGateway.sendPersonalNotification.mockImplementationOnce(() => {
        throw new Error('WebSocket connection lost');
      });

      const dto: RejectRequestDto = {
        modifiedDate: mockModifiedDate.toISOString(),
        comment: 'Rejection reason comment here',
      };

      const result = await service.rejectRequest(
        mockRequest.id,
        mockManagerId,
        dto,
        '127.0.0.1',
        'Mozilla',
        'Test Manager',
      );
      expect(result.success).toBe(true);
    });
  });
});
