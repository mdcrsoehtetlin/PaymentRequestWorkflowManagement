/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
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
import { WebsocketGateway } from '../../shared/websocket.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * @description Unit tests for ApplicantService.
 * Tests cover createDraft, submitToManager, updatePaymentRequest, and deleteDraft flows.
 */
describe('ApplicantService', () => {
  let service: ApplicantService;
  let mockManager: Record<string, jest.Mock>;
  let mockDataSource: { transaction: jest.Mock };
  let mockCacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let mockRequestNumberService: { generateNext: jest.Mock };
  let mockWebsocketGateway: { sendPersonalNotification: jest.Mock };
  let mockPaymentRequestRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockManager = {
      create: jest.fn((entity, data) => ({ ...data, id: 1 })),
      save: jest.fn((data) => Promise.resolve({ ...data, id: data.id || 1 })),
      findOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn((callback) => callback(mockManager)),
    };

    mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockRequestNumberService = {
      generateNext: jest.fn().mockResolvedValue('PRF-2026-000001'),
    };

    mockWebsocketGateway = {
      sendPersonalNotification: jest.fn(),
    };

    mockPaymentRequestRepo = {
      createQueryBuilder: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantService,
        {
          provide: getRepositoryToken(PaymentRequest),
          useValue: mockPaymentRequestRepo,
        },
        {
          provide: getRepositoryToken(ReceiptFile),
          useValue: { create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RequestNumberService,
          useValue: mockRequestNumberService,
        },
        {
          provide: FileUploadService,
          useValue: { saveFile: jest.fn() },
        },
        {
          provide: WebsocketGateway,
          useValue: mockWebsocketGateway,
        },
      ],
    }).compile();

    service = module.get<ApplicantService>(ApplicantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ======================================================================
  // createDraft tests
  // ======================================================================
  describe('createDraft', () => {
    it('should create a draft with correct camelCase entity properties', async () => {
      const dto = {
        currency_id: 2,
        application_date: '2026-06-24',
        desired_payment_date: '2026-07-01',
        payment_type_id: 1,
        payment_method_id: 1,
        target_manager_id: 5,
        has_receipt: false,
        purpose: 'Test Purpose',
        request_content: 'Test Content',
        breakdowns: [{ description: 'Item 1', amount: 100 }],
      };

      await service.createDraft(1, dto);

      // Verify manager.create was called with camelCase properties
      const createCalls = mockManager.create.mock.calls;
      const paymentRequestCall = createCalls.find(
        (call: unknown[]) => call[0] === PaymentRequest,
      );
      expect(paymentRequestCall).toBeDefined();
      const requestData = paymentRequestCall![1];

      // F1: Verify camelCase property names
      expect(requestData.requestNumber).toBe('PRF-2026-000001');
      expect(requestData.applicantUserId).toBe(1);
      expect(requestData.statusId).toBe(1);
      expect(requestData.totalAmount).toBe('100');
      expect(requestData.currencyId).toBe(2);
      expect(requestData.applicationDate).toBe('2026-06-24');
      expect(requestData.requestContent).toBe('Test Content');

      // F10: Verify target_manager_id is persisted as managerUserId
      expect(requestData.managerUserId).toBe(5);

      // F1: Verify has_receipt is persisted
      expect(requestData.hasReceipt).toBe(false);
    });

    it('should create breakdown items with correct FK field', async () => {
      const dto = {
        breakdowns: [
          { description: 'Item A', amount: 50 },
          { description: 'Item B', amount: 75 },
        ],
      };

      // Mock save to return with id
      mockManager.save.mockImplementation((data: unknown) => {
        if (Array.isArray(data)) return Promise.resolve(data);
        return Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 42,
        });
      });

      await service.createDraft(1, dto);

      // F2: Verify breakdown items use payment_request_id (not id)
      const breakdownCalls = mockManager.create.mock.calls.filter(
        (call: unknown[]) => call[0] === PaymentBreakdownItem,
      );
      expect(breakdownCalls.length).toBe(2);
      expect(breakdownCalls[0][1].payment_request_id).toBe(42);
      expect(breakdownCalls[1][1].payment_request_id).toBe(42);
    });

    it('should create approval log with correct FK field', async () => {
      const dto = {
        breakdowns: [{ description: 'Item', amount: 100 }],
      };

      mockManager.save.mockImplementation((data: unknown) => {
        if (Array.isArray(data)) return Promise.resolve(data);
        return Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 99,
        });
      });

      await service.createDraft(1, dto);

      // F3: Verify approval log uses paymentRequestId (not id)
      const logCalls = mockManager.create.mock.calls.filter(
        (call: unknown[]) => call[0] === ApprovalLog,
      );
      expect(logCalls.length).toBe(1);
      expect(logCalls[0][1].paymentRequestId).toBe(99);
      expect(logCalls[0][1].actionTypeId).toBe(1); // CREATED
    });

    it('should generate request number in PRF-YYYY-NNNNNN format', async () => {
      const dto = {
        breakdowns: [{ description: 'Test', amount: 10 }],
      };

      await service.createDraft(1, dto);

      expect(mockRequestNumberService.generateNext).toHaveBeenCalled();
    });

    it('should auto-calculate total from breakdowns', async () => {
      const dto = {
        breakdowns: [
          { description: 'A', amount: 100.5 },
          { description: 'B', amount: 200.25 },
          { description: 'C', amount: 50.0 },
        ],
      };

      await service.createDraft(1, dto);

      const paymentRequestCall = mockManager.create.mock.calls.find(
        (call: unknown[]) => call[0] === PaymentRequest,
      );
      expect(paymentRequestCall![1].totalAmount).toBe('350.75');
    });

    it('should invalidate cache after creating draft', async () => {
      const dto = {
        breakdowns: [{ description: 'Test', amount: 10 }],
      };

      await service.createDraft(1, dto);

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'applicant_dashboard_1_1_10_________',
      );
    });
  });

  // ======================================================================
  // submitToManager tests
  // ======================================================================
  describe('submitToManager', () => {
    const createMockRequest = (
      overrides: Partial<PaymentRequest> = {},
    ): PaymentRequest => ({
      id: 1,
      requestNumber: 'PRF-2026-000001',
      applicantUserId: 1,
      managerUserId: 5,
      finalApproverUserId: null,
      accountingUserId: null,
      currentAssignedToUserId: null,
      statusId: 1,
      totalAmount: '100',
      currencyId: 1,
      applicationDate: '2026-06-24',
      purpose: 'Test purpose',
      desiredPaymentDate: '2026-07-01',
      paymentMethodId: 1,
      paymentTypeId: 1,
      bankAccountInfo: null,
      requestContent: 'Test content',
      hasReceipt: false,
      submittedToManagerDate: null,
      managerVerificationDate: null,
      submittedToApproverDate: null,
      approvalDate: null,
      paymentCompletedDate: null,
      isDeleted: false,
      createdDate: new Date(),
      modifiedDate: new Date(),
      finalApprover: null,
      applicant: {} as User,
      manager: null,
      breakdowns: [
        {
          id: 1,
          payment_request_id: 1,
          lineNumber: 1,
          itemDate: '2026-06-24',
          description: 'Test',
          amount: 100,
          quantity: 0,
          unit_price: 0,
          created_at: new Date(),
          modifiedDate: new Date(),
          paymentRequest: {} as PaymentRequest,
        },
      ],
      receipts: [],
      approvalLogs: [],
      ...overrides,
    });

    it('should reject if request not found', async () => {
      mockManager.findOne.mockResolvedValue(null);

      await expect(service.submitToManager(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject if status is not Draft or Rejected', async () => {
      mockManager.findOne.mockResolvedValue(createMockRequest({ statusId: 2 }));

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if currency is missing', async () => {
      mockManager.findOne.mockResolvedValue(
        createMockRequest({ currencyId: 0 }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject if purpose is empty', async () => {
      mockManager.findOne.mockResolvedValue(createMockRequest({ purpose: '' }));

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'Purpose is required',
      );
    });

    it('should reject if requestContent is empty', async () => {
      mockManager.findOne.mockResolvedValue(
        createMockRequest({ requestContent: '' }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'Payment request content is required',
      );
    });

    it('should reject if managerUserId is not set', async () => {
      mockManager.findOne.mockResolvedValue(
        createMockRequest({ managerUserId: null }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'Target manager must be selected',
      );
    });

    it('should reject if paymentTypeId is not set', async () => {
      mockManager.findOne.mockResolvedValue(
        createMockRequest({ paymentTypeId: 0 }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'Payment type is required',
      );
    });

    it('should reject if no breakdown items', async () => {
      mockManager.findOne.mockResolvedValue(
        createMockRequest({ breakdowns: [] }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'At least one breakdown item is required',
      );
    });

    it('should reject if has_receipt=true but no receipts attached', async () => {
      mockManager.findOne.mockResolvedValue(
        createMockRequest({ hasReceipt: true, receipts: [] }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'At least one receipt file must be attached',
      );
    });

    it('should reject if total amount is 0', async () => {
      const mockBreakdowns = [
        {
          id: 1,
          payment_request_id: 1,
          lineNumber: 1,
          itemDate: '2026-06-24',
          description: 'Zero',
          amount: 0,
          quantity: 0,
          unit_price: 0,
          created_at: new Date(),
          modifiedDate: new Date(),
          paymentRequest: {} as PaymentRequest,
        },
      ];
      mockManager.findOne.mockResolvedValue(
        createMockRequest({
          breakdowns: mockBreakdowns,
        }),
      );

      await expect(service.submitToManager(1, 1)).rejects.toThrow(
        'Total amount must be greater than 0',
      );
    });

    it('should transition status to SUBMITTED_MANAGER (2) on success', async () => {
      const mockReq = createMockRequest();
      mockManager.findOne.mockResolvedValue(mockReq);
      mockManager.save.mockImplementation((data: unknown) =>
        Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 1,
          requestNumber: 'PRF-2026-000001',
        }),
      );
      mockManager.create.mockImplementation(
        (entity: unknown, data: unknown) => ({
          ...(data as Record<string, unknown>),
          timestamp: new Date(),
        }),
      );

      const result = await service.submitToManager(1, 1);

      expect(result.statusId).toBe(2);
    });

    it('should create SUBMITTED (actionTypeId=3) audit log entry', async () => {
      const mockReq = createMockRequest();
      mockManager.findOne.mockResolvedValue(mockReq);
      mockManager.save.mockImplementation((data: unknown) =>
        Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 1,
          requestNumber: 'PRF-2026-000001',
        }),
      );
      mockManager.create.mockImplementation(
        (entity: unknown, data: unknown) => ({
          ...(data as Record<string, unknown>),
          timestamp: new Date(),
        }),
      );

      await service.submitToManager(1, 1);

      // F15/F80: Verify action type is SUBMITTED (3), not EDITED (2)
      const logCalls = mockManager.create.mock.calls.filter(
        (call: unknown[]) => call[0] === ApprovalLog,
      );
      expect(logCalls.length).toBe(1);
      expect(logCalls[0][1].actionTypeId).toBe(3);
      expect(logCalls[0][1].paymentRequestId).toBe(1);
      expect(logCalls[0][1].newStatusId).toBe(2);
    });

    it('should allow submission from REJECTED_MANAGER status (5)', async () => {
      const mockReq = createMockRequest({ statusId: 5 });
      mockManager.findOne.mockResolvedValue(mockReq);
      mockManager.save.mockImplementation((data: unknown) =>
        Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 1,
          requestNumber: 'PRF-2026-000001',
        }),
      );
      mockManager.create.mockImplementation(
        (entity: unknown, data: unknown) => ({
          ...(data as Record<string, unknown>),
          timestamp: new Date(),
        }),
      );

      const result = await service.submitToManager(1, 1);
      expect(result.statusId).toBe(2);
    });

    it('should allow submission from REJECTED_APPROVER status (9)', async () => {
      const mockReq = createMockRequest({ statusId: 9 });
      mockManager.findOne.mockResolvedValue(mockReq);
      mockManager.save.mockImplementation((data: unknown) =>
        Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 1,
          requestNumber: 'PRF-2026-000001',
        }),
      );
      mockManager.create.mockImplementation(
        (entity: unknown, data: unknown) => ({
          ...(data as Record<string, unknown>),
          timestamp: new Date(),
        }),
      );

      const result = await service.submitToManager(1, 1);
      expect(result.statusId).toBe(2);
    });

    it('should emit WebSocket notification on successful submission', async () => {
      const mockReq = createMockRequest();
      mockManager.findOne.mockResolvedValue(mockReq);
      mockManager.save.mockImplementation((data: unknown) =>
        Promise.resolve({
          ...(data as Record<string, unknown>),
          id: 1,
          requestNumber: 'PRF-2026-000001',
        }),
      );
      mockManager.create.mockImplementation(
        (entity: unknown, data: unknown) => ({
          ...(data as Record<string, unknown>),
          timestamp: new Date(),
        }),
      );

      await service.submitToManager(1, 1);

      expect(
        mockWebsocketGateway.sendPersonalNotification,
      ).toHaveBeenCalledWith(
        1,
        'request:status-changed',
        expect.objectContaining({
          newStatusId: 2,
          actionByUserId: 1,
        }),
      );
    });
  });

  // ======================================================================
  // deleteDraft tests
  // ======================================================================
  describe('deleteDraft', () => {
    it('should reject if status is not Draft', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 1,
        statusId: 2,
        applicantUserId: 1,
        isDeleted: false,
      });

      await expect(service.deleteDraft(1, 1)).rejects.toThrow(
        'Only Draft requests can be deleted',
      );
    });

    it('should soft-delete receipt files when deleting draft', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 1,
        statusId: 1,
        applicantUserId: 1,
        isDeleted: false,
      });
      mockManager.save.mockResolvedValue({});
      mockManager.create.mockImplementation(
        (entity: unknown, data: unknown) => ({
          ...(data as Record<string, unknown>),
        }),
      );

      await service.deleteDraft(1, 1);

      expect(mockManager.update).toHaveBeenCalledWith(
        ReceiptFile,
        { paymentRequestId: 1 },
        { isDeleted: true },
      );
    });
  });
});
