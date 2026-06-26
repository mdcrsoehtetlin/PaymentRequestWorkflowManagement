const fs = require('fs');

const path = 'c:\\Projects\\ApplicantBranch\\PaymentRequestWorkflowManagement\\src\\modules\\applicant\\tests\\applicant.service.spec.ts';
let content = fs.readFileSync(path, 'utf8');

const testsToAppend = `
  describe('getActiveManagers', () => {
    it('should return managers', async () => {
      const mockFind = jest.fn().mockResolvedValue([{ userId: 1 }]);
      (service as any).userRepo = { find: mockFind };
      const res = await service.getActiveManagers();
      expect(res).toEqual([{ userId: 1 }]);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ status_id: 2, count: '5' }]),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };
      (service as any).paymentRequestRepo = { createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder) };
      const res = await service.getDashboardData(1, 1, 10, 'search', 2, '2026-01-01', '2026-12-31', 10, 100, 'branch', '2026-06-01', 'pending_review');
      expect(res.requests.total).toBe(1);
      
      const res2 = await service.getDashboardData(1, 1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'approved');
      const res3 = await service.getDashboardData(1, 1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'rejected');
    });
  });

  describe('getPaymentRequestDetail', () => {
    it('should throw if not found', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue(null) };
      await expect(service.getPaymentRequestDetail(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should return request and sort relations', async () => {
      const req = {
        id: 1,
        breakdowns: [{ amount: 10 }, { amount: 20 }],
        approvalLogs: [{ timestamp: new Date('2026-01-01') }, { timestamp: new Date('2026-01-02') }]
      };
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue(req) };
      const res = await service.getPaymentRequestDetail(1, 1);
      expect(res.breakdowns![0].amount).toBe(20);
      expect(res.approvalLogs![0].timestamp.getTime()).toBeGreaterThan(res.approvalLogs![1].timestamp.getTime());
    });
  });

  describe('uploadReceipt', () => {
    it('should throw if request not found', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue(null) };
      await expect(service.uploadReceipt(1, 1, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw if status not Draft or Rejected', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 2 }) };
      await expect(service.uploadReceipt(1, 1, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw if file name format invalid', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 1 }) };
      await expect(service.uploadReceipt(1, 1, { originalname: 'invalid.pdf' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should upload receipt', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 1 }) };
      (service as any).fileUploadService = { saveFile: jest.fn().mockResolvedValue({ storedFileName: 'f.pdf', fileStoragePath: 'p' }) };
      (service as any).receiptFileRepo = { create: jest.fn().mockReturnValue({ id: 1 }), save: jest.fn().mockResolvedValue({ id: 1 }) };
      const res = await service.uploadReceipt(1, 1, { originalname: 'A_20260101_01.pdf', size: 100, mimetype: 'pdf' } as any);
      expect(res.id).toBe(1);
    });
  });

  describe('downloadReceipt', () => {
    it('should throw if not found', async () => {
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(null) };
      await expect(service.downloadReceipt(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should return receipt', async () => {
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue({ id: 1 }) };
      const res = await service.downloadReceipt(1, 1, 1);
      expect(res.id).toBe(1);
    });
  });

  describe('deleteReceipt', () => {
    it('should throw if not found', async () => {
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(null) };
      await expect(service.deleteReceipt(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should soft delete', async () => {
      const receipt = { id: 1, paymentRequest: { statusId: 1 } };
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(receipt), save: jest.fn() };
      await service.deleteReceipt(1, 1, 1);
      expect(receipt.isDeleted).toBe(true);
    });

    it('should throw if status not Draft/Rejected', async () => {
      const receipt = { id: 1, paymentRequest: { statusId: 2 } };
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(receipt) };
      await expect(service.deleteReceipt(1, 1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitToApprover', () => {
    it('should throw if not manager approved', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 1, statusId: 1 });
      await expect(service.submitToApprover(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should submit to approver', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 1, statusId: 3, approverUserId: 2, requestNumber: 'req'
      });
      mockManager.save.mockImplementation((data: any) => Promise.resolve(data));
      mockManager.create.mockImplementation((e: any, data: any) => ({ ...data, timestamp: new Date() }));
      const res = await service.submitToApprover(1, 1);
      expect(res.statusId).toBe(4);
    });
  });

  describe('updatePaymentRequest', () => {
    it('should throw if not Draft/Rejected', async () => {
      mockManager.findOne.mockResolvedValueOnce({ statusId: 2 });
      await expect(service.updatePaymentRequest(1, 1, {} as any)).rejects.toThrow(BadRequestException);
    });

    it('should update request', async () => {
      mockManager.findOne.mockResolvedValueOnce({ statusId: 1, breakdowns: [{ id: 1 }] });
      mockManager.delete.mockResolvedValueOnce({});
      mockManager.save.mockImplementation((data: any) => Promise.resolve(data));
      mockManager.create.mockImplementation((e: any, data: any) => data);
      const dto = { breakdowns: [{ amount: 10, description: 'd' }], total_amount: 10 };
      const res = await service.updatePaymentRequest(1, 1, dto as any);
      expect(res.totalAmount).toBe('10');
    });
  });

  describe('addComment', () => {
    it('should add comment', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 1 });
      mockManager.save.mockResolvedValueOnce({});
      mockManager.create.mockImplementation((e: any, data: any) => data);
      await service.addComment(1, 1, 'comment');
      expect(mockManager.create).toHaveBeenCalledWith(ApprovalLog, expect.any(Object));
    });

    it('should throw if not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.addComment(1, 1, 'c')).rejects.toThrow(NotFoundException);
    });
  });
`;

content = content.replace(/}\);\s*$/, testsToAppend + '\n});\n');
fs.writeFileSync(path, content, 'utf8');
