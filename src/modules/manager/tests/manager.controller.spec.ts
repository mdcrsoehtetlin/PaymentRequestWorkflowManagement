import { Test, TestingModule } from '@nestjs/testing';
import { ManagerController } from '../manager.controller';
import { ManagerService } from '../manager.service';
import { JwtPayload } from '../../shared/types';
import { QueryRequestsDto } from '../dto/query-requests.dto';
import { ApproveRequestDto } from '../dto/approve-request.dto';
import { RejectRequestDto } from '../dto/reject-request.dto';
import { StartReviewDto } from '../dto/start-review.dto';
import { Response } from 'express';
import {
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('ManagerController', () => {
  let controller: ManagerController;
  let service: jest.Mocked<ManagerService>;

  const mockJwtPayload: JwtPayload = {
    sub: 5,
    email: 'manager@test.com',
    role: 'MANAGER',
    roleId: 2,
    fullName: 'Test Manager',
  } as JwtPayload;

  const mockRequest = mockJwtPayload;

  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0';

  beforeEach(async () => {
    const mockService = {
      getPendingRequests: jest.fn(),
      getRequestDetails: jest.fn(),
      downloadReceipt: jest.fn(),
      startReview: jest.fn(),
      verifyRequest: jest.fn(),
      rejectRequest: jest.fn(),
    } as unknown as jest.Mocked<ManagerService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerController],
      providers: [{ provide: ManagerService, useValue: mockService }],
    }).compile();

    controller = module.get<ManagerController>(ManagerController);
    service = module.get(ManagerService);

    jest.clearAllMocks();
  });

  describe('GET /manager/requests', () => {
    it('should retrieve pending requests with query filters', async () => {
      const query: QueryRequestsDto = { statusId: 2 };
      const expected = [{ id: 1, paymentRequestId: 1 }];
      service.getPendingRequests.mockResolvedValue(
        expected as unknown as never,
      );

      const result = await controller.getPendingRequests(mockRequest, query);

      expect(service['getPendingRequests']).toHaveBeenCalledWith(5, query);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /manager/requests/:id', () => {
    it('should retrieve details of a request', async () => {
      const expected = { id: 10, paymentRequestId: 10, purpose: 'Test' };
      service.getRequestDetails.mockResolvedValue(expected as unknown as never);

      const result = await controller.getRequestDetails(mockRequest, 10);

      expect(service['getRequestDetails']).toHaveBeenCalledWith(10, 5);
      expect(result).toEqual(expected);
    });
  });

  describe('GET /manager/requests/:id/receipts/:receiptId/download', () => {
    let mockRes: jest.Mocked<Response>;

    beforeEach(() => {
      mockRes = {
        set: jest.fn(),
      } as unknown as jest.Mocked<Response>;
    });

    it('should stream receipt file on success', async () => {
      const receipt = {
        id: 20,
        paymentRequestId: 10,
        storage_key: '/path/to/receipt.pdf',
        mime_type: 'application/pdf',
        originalFileName: 'receipt.pdf',
      };
      service.downloadReceipt.mockResolvedValue(receipt as unknown as never);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = await controller.downloadReceipt(
        mockRequest,
        10,
        20,
        mockRes,
      );

      expect(service['downloadReceipt']).toHaveBeenCalledWith(5, 10, 20);
      expect(fs['existsSync']).toHaveBeenCalledWith('/path/to/receipt.pdf');
      expect(fs['createReadStream']).toHaveBeenCalledWith(
        '/path/to/receipt.pdf',
      );
      expect(mockRes['set']).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="receipt.pdf"',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should stream receipt file with default content-type and filename when they are missing', async () => {
      const receipt = {
        id: 20,
        paymentRequestId: 10,
        storage_key: '/path/to/receipt.pdf',
      };
      service.downloadReceipt.mockResolvedValue(receipt as unknown as never);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = await controller.downloadReceipt(
        mockRequest,
        10,
        20,
        mockRes,
      );

      expect(service['downloadReceipt']).toHaveBeenCalledWith(5, 10, 20);
      expect(fs['existsSync']).toHaveBeenCalledWith('/path/to/receipt.pdf');
      expect(fs['createReadStream']).toHaveBeenCalledWith(
        '/path/to/receipt.pdf',
      );
      expect(mockRes['set']).toHaveBeenCalledWith({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="receipt"',
      });
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('should throw NotFoundException if receipt has no storage key', async () => {
      const receipt = {
        id: 20,
        paymentRequestId: 10,
        mime_type: 'application/pdf',
        originalFileName: 'receipt.pdf',
      };
      service.downloadReceipt.mockResolvedValue(receipt as unknown as never);

      await expect(
        controller.downloadReceipt(mockRequest, 10, 20, mockRes),
      ).rejects.toThrow(
        new NotFoundException('領収書ファイルのパスが見つかりません'),
      );
    });

    it('should throw NotFoundException if file does not exist on disk', async () => {
      const receipt = {
        id: 20,
        paymentRequestId: 10,
        storage_key: '/path/to/missing.pdf',
        mime_type: 'application/pdf',
        originalFileName: 'receipt.pdf',
      };
      service.downloadReceipt.mockResolvedValue(receipt as unknown as never);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        controller.downloadReceipt(mockRequest, 10, 20, mockRes),
      ).rejects.toThrow(
        new NotFoundException('領収書ファイルがストレージに見つかりません'),
      );
    });
  });

  describe('PATCH /manager/requests/:id/review', () => {
    it('should start review and pass parameters', async () => {
      const dto: StartReviewDto = { modifiedDate: new Date().toISOString() };
      const expected = { success: true };
      service.startReview.mockResolvedValue(expected as unknown as never);

      const result = await controller.startReview(
        mockRequest,
        10,
        dto,
        mockIpAddress,
        mockUserAgent,
      );

      expect(service['startReview']).toHaveBeenCalledWith(
        10,
        5,
        dto,
        mockIpAddress,
        mockUserAgent,
      );
      expect(result).toEqual(expected);
    });

    it('should default userAgent to system when header is missing', async () => {
      const dto: StartReviewDto = { modifiedDate: new Date().toISOString() };
      await controller.startReview(
        mockRequest,
        10,
        dto,
        mockIpAddress,
        undefined as unknown as string,
      );

      expect(service['startReview']).toHaveBeenCalledWith(
        10,
        5,
        dto,
        mockIpAddress,
        'system',
      );
    });
  });

  describe('POST /manager/requests/:id/approve', () => {
    it('should verify payment request', async () => {
      const dto: ApproveRequestDto = {
        modifiedDate: new Date().toISOString(),
        comment: 'Approval comment',
      };
      const expected = { success: true };
      service.verifyRequest.mockResolvedValue(expected as unknown as never);

      const result = await controller.verifyRequest(
        mockRequest,
        10,
        dto,
        mockIpAddress,
        mockUserAgent,
      );

      expect(service['verifyRequest']).toHaveBeenCalledWith(
        10,
        5,
        dto,
        mockIpAddress,
        mockUserAgent,
      );
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException if id is invalid', async () => {
      const dto: ApproveRequestDto = { modifiedDate: new Date().toISOString() };

      await expect(
        controller.verifyRequest(
          mockRequest,
          0,
          dto,
          mockIpAddress,
          mockUserAgent,
        ),
      ).rejects.toThrow(
        new BadRequestException('有効な申請IDが指定されていません'),
      );
    });

    it('should default userAgent to system when header is missing', async () => {
      const dto: ApproveRequestDto = { modifiedDate: new Date().toISOString() };
      service.verifyRequest.mockResolvedValue({
        success: true,
      } as unknown as never);

      await controller.verifyRequest(
        mockRequest,
        10,
        dto,
        mockIpAddress,
        undefined as unknown as string,
      );

      expect(service['verifyRequest']).toHaveBeenCalledWith(
        10,
        5,
        dto,
        mockIpAddress,
        'system',
      );
    });
  });

  describe('POST /manager/requests/:id/reject', () => {
    it('should reject payment request', async () => {
      const dto: RejectRequestDto = {
        modifiedDate: new Date().toISOString(),
        comment: 'Rejection reason comment here',
      };
      const expected = { success: true };
      service.rejectRequest.mockResolvedValue(expected as unknown as never);

      const result = await controller.rejectRequest(
        mockRequest,
        10,
        dto,
        mockIpAddress,
        mockUserAgent,
      );

      expect(service['rejectRequest']).toHaveBeenCalledWith(
        10,
        5,
        dto,
        mockIpAddress,
        mockUserAgent,
        'Test Manager',
      );
      expect(result).toEqual(expected);
    });

    it('should throw BadRequestException if id is invalid', async () => {
      const dto: RejectRequestDto = {
        modifiedDate: new Date().toISOString(),
        comment: 'Rejection reason comment here',
      };

      await expect(
        controller.rejectRequest(
          mockRequest,
          0,
          dto,
          mockIpAddress,
          mockUserAgent,
        ),
      ).rejects.toThrow(
        new BadRequestException('有効な申請IDが指定されていません'),
      );
    });

    it('should default userAgent to system when header is missing', async () => {
      const dto: RejectRequestDto = {
        modifiedDate: new Date().toISOString(),
        comment: 'Rejection reason comment here',
      };
      service.rejectRequest.mockResolvedValue({
        success: true,
      } as unknown as never);

      await controller.rejectRequest(
        mockRequest,
        10,
        dto,
        mockIpAddress,
        undefined as unknown as string,
      );

      expect(service['rejectRequest']).toHaveBeenCalledWith(
        10,
        5,
        dto,
        mockIpAddress,
        'system',
        'Test Manager',
      );
    });
  });
});
