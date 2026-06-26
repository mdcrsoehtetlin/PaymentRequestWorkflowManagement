import { Test, TestingModule } from '@nestjs/testing';
import {
  ApplicantController,
  AuthenticatedRequest,
} from '../applicant.controller';
import { ApplicantService } from '../applicant.service';
import { BadRequestException, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';

jest.mock('fs');

describe('ApplicantController', () => {
  let controller: ApplicantController;

  const mockApplicantService = {
    getDashboardData: jest.fn(),
    getActiveManagers: jest.fn(),
    getPaymentRequestDetail: jest.fn(),
    addComment: jest.fn(),
    createDraft: jest.fn(),
    uploadReceipt: jest.fn(),
    downloadReceipt: jest.fn(),
    deleteReceipt: jest.fn(),
    submitToManager: jest.fn(),
    submitToApprover: jest.fn(),
    updatePaymentRequest: jest.fn(),
    deleteDraft: jest.fn(),
  };

  const mockReq = { user: { sub: '1' } } as AuthenticatedRequest;

  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [ApplicantController],
      providers: [
        {
          provide: ApplicantService,
          useValue: mockApplicantService,
        },
      ],
    }).compile();

    controller = module.get<ApplicantController>(ApplicantController);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('testError', () => {
    it('should return Success if no error', async () => {
      mockApplicantService.getDashboardData.mockResolvedValueOnce({});
      const result = await controller.testError();
      expect(result).toBe('Success');
    });

    it('should catch error and return error object', async () => {
      mockApplicantService.getDashboardData.mockRejectedValueOnce(
        new Error('test error'),
      );
      const result = await controller.testError();
      const res = result as { error: string; stack?: string };
      expect(res.error).toBe('test error');
      expect(typeof res.stack).toBe('string');
    });

    it('should catch non-Error object', async () => {
      mockApplicantService.getDashboardData.mockRejectedValueOnce(
        'string error',
      );
      const result = await controller.testError();
      expect(result).toEqual({ error: 'Unknown error', stack: undefined });
    });
  });

  describe('getPaymentRequests', () => {
    it('should call getDashboardData with parsed parameters', async () => {
      mockApplicantService.getDashboardData.mockResolvedValueOnce('data');
      const result = await controller.getPaymentRequests(
        mockReq,
        2,
        20,
        'search',
        1,
        'start',
        'end',
        100,
        200,
        'branch',
        'desired',
        'kpi',
        true,
      );
      expect(mockApplicantService.getDashboardData).toHaveBeenCalledWith(
        1,
        2,
        20,
        'search',
        1,
        'start',
        'end',
        100,
        200,
        'branch',
        'desired',
        'kpi',
        true,
      );
      expect(result).toBe('data');
    });

    it('should call getDashboardData with default parameters', async () => {
      mockApplicantService.getDashboardData.mockResolvedValueOnce('data');
      const result = await controller.getPaymentRequests(mockReq);
      expect(mockApplicantService.getDashboardData).toHaveBeenCalledWith(
        1,
        1,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toBe('data');
    });
  });

  describe('getActiveManagers', () => {
    it('should return active managers', async () => {
      mockApplicantService.getActiveManagers.mockResolvedValueOnce(['manager']);
      const result = await controller.getActiveManagers();
      expect(result).toEqual({
        message: 'Active managers retrieved successfully',
        data: ['manager'],
      });
    });
  });

  describe('getPaymentRequestDetail', () => {
    it('should return formatted request detail', async () => {
      mockApplicantService.getPaymentRequestDetail.mockResolvedValueOnce({
        id: 1,
        requestNumber: 'REQ-1',
        statusId: 1,
        currencyId: 1,
        applicationDate: 'date',
        desiredPaymentDate: 'date',
        paymentMethodId: 1,
        paymentTypeId: 1,
        purpose: 'purpose',
        requestContent: 'content',
        managerUserId: 2,
        bankAccountInfo: 'bank',
        totalAmount: 100,
        hasReceipt: true,
        createdDate: 'date',
        modifiedDate: 'date',
        breakdowns: [{ id: 1, description: 'desc', amount: 100 }],
        receipts: [{ id: 1, originalFileName: 'file.pdf', file_size: 1024 }],
        approvalLogs: [
          {
            approvalLogId: 1,
            comment: 'com',
            newStatusId: 2,
            actionTypeId: 1,
            timestamp: 'date',
          },
        ],
      });

      const result = await controller.getPaymentRequestDetail(mockReq, '1');
      expect(result.id).toBe(1);
      expect(result.breakdowns[0].description).toBe('desc');
      expect(result.receipts[0].file_name).toBe('file.pdf');
      expect(result.logs[0].comment).toBe('com');
    });

    it('should handle missing optional arrays', async () => {
      mockApplicantService.getPaymentRequestDetail.mockResolvedValueOnce({
        id: 1,
      });
      const result = await controller.getPaymentRequestDetail(mockReq, '1');
      expect(result.breakdowns).toBeUndefined();
      expect(result.receipts).toBeUndefined();
      expect(result.logs).toBeUndefined();
    });
  });

  describe('addComment', () => {
    it('should throw BadRequestException if comment is empty', async () => {
      await expect(controller.addComment(mockReq, '1', '   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call addComment and return success', async () => {
      const result = await controller.addComment(mockReq, '1', 'comment');
      expect(mockApplicantService.addComment).toHaveBeenCalledWith(
        1,
        1,
        'comment',
      );
      expect(result).toEqual({ message: 'Comment added successfully' });
    });
  });

  describe('createDraft', () => {
    it('should call createDraft and return data', async () => {
      mockApplicantService.createDraft.mockResolvedValueOnce({
        id: 1,
        requestNumber: 'REQ-1',
      });
      const result = await controller.createDraft(mockReq, {});
      expect(mockApplicantService.createDraft).toHaveBeenCalledWith(1, {});
      expect(result).toEqual({
        message: 'Draft created successfully',
        data: { id: 1, request_number: 'REQ-1' },
      });
    });
  });

  describe('uploadReceipt', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        controller.uploadReceipt(mockReq, '1', null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload receipt and return data', async () => {
      mockApplicantService.uploadReceipt.mockResolvedValueOnce({
        id: 1,
        originalFileName: 'f.pdf',
        file_size: 100,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await controller.uploadReceipt(mockReq, '1', {} as any);
      expect(result.data.file_name).toBe('f.pdf');
    });
  });

  describe('downloadReceipt', () => {
    it('should download receipt', async () => {
      mockApplicantService.downloadReceipt.mockResolvedValueOnce({
        storage_key: 'test',
        mime_type: 'application/pdf',
        originalFileName: 'f.pdf',
      });
      // Mock createReadStream
      (fs.createReadStream as jest.Mock).mockReturnValue({});
      const mockRes = { set: jest.fn() } as unknown as Response;
      const result = await controller.downloadReceipt(
        mockReq,
        '1',
        '2',
        mockRes,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockRes.set).toHaveBeenCalled();
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt', async () => {
      await controller.deleteReceipt(mockReq, '1', '2');
      expect(mockApplicantService.deleteReceipt).toHaveBeenCalledWith(1, 1, 2);
    });
  });

  describe('submitToManager', () => {
    it('should submit to manager', async () => {
      mockApplicantService.submitToManager.mockResolvedValueOnce({
        id: 1,
        statusId: 2,
      });
      const result = await controller.submitToManager(mockReq, '1');
      expect(mockApplicantService.submitToManager).toHaveBeenCalledWith(1, 1);
      expect(result.data.status_id).toBe(2);
    });
  });

  describe('submitToApprover', () => {
    it('should submit to approver', async () => {
      mockApplicantService.submitToApprover.mockResolvedValueOnce({
        id: 1,
        statusId: 3,
      });
      const result = await controller.submitToApprover(mockReq, '1');
      expect(mockApplicantService.submitToApprover).toHaveBeenCalledWith(1, 1);
      expect(result.data.statusId).toBe(3);
    });
  });

  describe('updatePaymentRequest', () => {
    it('should update payment request', async () => {
      mockApplicantService.updatePaymentRequest.mockResolvedValueOnce({
        id: 1,
        statusId: 2,
        totalAmount: 100,
      });
      const result = await controller.updatePaymentRequest(mockReq, '1', {});
      expect(mockApplicantService.updatePaymentRequest).toHaveBeenCalledWith(
        1,
        1,
        {},
      );
      expect(result.data.totalAmount).toBe(100);
    });
  });

  describe('deleteDraft', () => {
    it('should delete draft', async () => {
      await controller.deleteDraft(mockReq, '1');
      expect(mockApplicantService.deleteDraft).toHaveBeenCalledWith(1, 1);
    });
  });
});
