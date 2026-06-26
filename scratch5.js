const fs = require('fs');

const path = 'c:\\Projects\\ApplicantBranch\\PaymentRequestWorkflowManagement\\src\\modules\\applicant\\tests\\applicant.service.spec.ts';
let content = fs.readFileSync(path, 'utf8');

const validationTests = `
    const validationFields = [
      { field: 'currencyId', val: null },
      { field: 'applicationDate', val: null },
      { field: 'desiredPaymentDate', val: null },
      { field: 'paymentMethodId', val: null },
      { field: 'paymentTypeId', val: null },
      { field: 'purpose', val: '' },
      { field: 'requestContent', val: '' },
      { field: 'managerUserId', val: null },
      { field: 'breakdowns', val: [] },
    ];
    for (const v of validationFields) {
      it('should throw if ' + v.field + ' is missing', async () => {
        const req = createMockRequest();
        (req as any)[v.field] = v.val;
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToManager(1, 1)).rejects.toThrow(BadRequestException);
      });
    }
    
    it('should throw if total amount <= 0', async () => {
        const req = createMockRequest();
        req.breakdowns = [{ amount: 0, description: 'Test', id: 1 } as any];
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToManager(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw if hasReceipt but no receipts', async () => {
        const req = createMockRequest();
        req.hasReceipt = true;
        req.receipts = [];
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToManager(1, 1)).rejects.toThrow(BadRequestException);
    });
    
    it('should throw if rejected without logs', async () => {
        const req = createMockRequest({ statusId: 5 });
        req.approvalLogs = null as any;
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToManager(1, 1)).rejects.toThrow(BadRequestException);
    });
    
    it('should throw if rejected and not modified', async () => {
        const req = createMockRequest({ statusId: 5 });
        req.approvalLogs = [
          { actionTypeId: 6, timestamp: new Date('2026-01-02') }, // Rejected
          { actionTypeId: 2, timestamp: new Date('2026-01-01') }, // Edited earlier
        ] as any;
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToManager(1, 1)).rejects.toThrow(BadRequestException);
    });
`;

content = content.replace(
  /describe\('submitToManager', \(\) => \{/,
  `describe('submitToManager', () => {` + validationTests
);

const approverValidationTests = `
    const approverValidationFields = [
      { field: 'currencyId', val: null },
      { field: 'applicationDate', val: null },
      { field: 'desiredPaymentDate', val: null },
      { field: 'paymentMethodId', val: null },
      { field: 'paymentTypeId', val: null },
      { field: 'purpose', val: '' },
      { field: 'requestContent', val: '' },
      { field: 'breakdowns', val: [] },
    ];
    for (const v of approverValidationFields) {
      it('should throw if ' + v.field + ' is missing for approver', async () => {
        const req: any = { id: 1, statusId: 4, approverUserId: 2, requestNumber: 'req' };
        req[v.field] = v.val;
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToApprover(1, 1)).rejects.toThrow(BadRequestException);
      });
    }

    it('should throw if total amount <= 0 for approver', async () => {
        const req: any = { id: 1, statusId: 4, approverUserId: 2, requestNumber: 'req', breakdowns: [{amount: 0}], currencyId: 1, applicationDate: 'd', desiredPaymentDate: 'd', paymentMethodId: 1, paymentTypeId: 1, purpose: 'p', requestContent: 'c' };
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToApprover(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw if hasReceipt but no receipts for approver', async () => {
        const req: any = { id: 1, statusId: 4, approverUserId: 2, requestNumber: 'req', breakdowns: [{amount: 10}], currencyId: 1, applicationDate: 'd', desiredPaymentDate: 'd', paymentMethodId: 1, paymentTypeId: 1, purpose: 'p', requestContent: 'c', hasReceipt: true, receipts: [] };
        mockManager.findOne.mockResolvedValueOnce(req);
        await expect(service.submitToApprover(1, 1)).rejects.toThrow(BadRequestException);
    });
`;

content = content.replace(
  /it\('should submit to approver', async \(\) => \{/,
  approverValidationTests + `\n    it('should submit to approver', async () => {`
);

const updateValidationTests = `
    it('should throw if empty breakdowns', async () => {
      mockManager.findOne.mockResolvedValueOnce({ statusId: 1, breakdowns: [{ id: 1 }] });
      await expect(service.updatePaymentRequest(1, 1, { breakdowns: [] } as any)).rejects.toThrow(BadRequestException);
    });
    
    it('should throw if no receipts and has_receipt is true', async () => {
      mockManager.findOne.mockResolvedValueOnce({ statusId: 1, breakdowns: [{ id: 1 }] });
      await expect(service.updatePaymentRequest(1, 1, { has_receipt: true } as any)).rejects.toThrow(BadRequestException);
    });
`;

content = content.replace(
  /it\('should update request', async \(\) => \{/,
  updateValidationTests + `\n    it('should update request', async () => {`
);

// getDashboardData lines 103-104 coverage: testing statuses
content = content.replace(
  /const res2 = await service.getDashboardData\(1, 1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'approved'\);/,
  `const res2 = await service.getDashboardData(1, 1, 10, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'approved');
      (service as any).paymentRequestRepo.createQueryBuilder = jest.fn().mockReturnValue({
         ...mockQueryBuilder,
         getRawMany: jest.fn().mockResolvedValue([{ status_id: 8, count: '5' }]),
      });
      await service.getDashboardData(1);
      (service as any).paymentRequestRepo.createQueryBuilder = jest.fn().mockReturnValue({
         ...mockQueryBuilder,
         getRawMany: jest.fn().mockResolvedValue([{ status_id: 5, count: '5' }]),
      });
      await service.getDashboardData(1);
      (service as any).paymentRequestRepo.createQueryBuilder = jest.fn().mockReturnValue({
         ...mockQueryBuilder,
         getRawMany: jest.fn().mockResolvedValue([{ status_id: 99, count: '5' }]),
      });
      await service.getDashboardData(1);
  `
);

fs.writeFileSync(path, content, 'utf8');
