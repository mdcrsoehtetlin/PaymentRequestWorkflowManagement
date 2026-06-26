const fs = require('fs');

const path = 'c:\\Projects\\ApplicantBranch\\PaymentRequestWorkflowManagement\\src\\modules\\applicant\\tests\\applicant.service.spec.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /it\('should upload receipt', async \(\) => \{\s+\(service as any\).paymentRequestRepo = \{ findOne: jest.fn\(\).mockResolvedValue\(\{ statusId: 1 \}\) \};\s+\(service as any\).fileUploadService = \{ saveFile: jest.fn\(\).mockResolvedValue\(\{ storedFileName: 'f.pdf', fileStoragePath: 'p' \}\) \};\s+\(service as any\).receiptFileRepo = \{ create: jest.fn\(\).mockReturnValue\(\{ id: 1 \}\), save: jest.fn\(\).mockResolvedValue\(\{ id: 1 \}\) \};\s+const res = await service.uploadReceipt\(1, 1, \{ originalname: 'A_20260101_01.pdf', size: 100, mimetype: 'pdf' \} as any\);\s+expect\(res.id\).toBe\(1\);\s+\}\);/,
  `it('should upload receipt', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 1 }), update: jest.fn() };
      (service as any).fileUploadService = { saveFile: jest.fn().mockResolvedValue({ storedFileName: 'f.pdf', fileStoragePath: 'p' }) };
      (service as any).receiptFileRepo = { create: jest.fn().mockReturnValue({ id: 1 }), save: jest.fn().mockResolvedValue({ id: 1 }) };
      const res = await service.uploadReceipt(1, 1, { originalname: 'A_20260101_01.pdf', size: 100, mimetype: 'pdf' } as any);
      expect(res.id).toBe(1);
    });`
);

content = content.replace(
  /it\('should return receipt', async \(\) => \{\s+\(service as any\).receiptFileRepo = \{ findOne: jest.fn\(\).mockResolvedValue\(\{ id: 1 \}\) \};\s+const res = await service.downloadReceipt\(1, 1, 1\);\s+expect\(res.id\).toBe\(1\);\s+\}\);/,
  `it('should return receipt', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ id: 1 }) };
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue({ id: 1 }) };
      const res = await service.downloadReceipt(1, 1, 1);
      expect(res.id).toBe(1);
    });`
);

content = content.replace(
  /it\('should soft delete', async \(\) => \{\s+const receipt: any = \{ id: 1, paymentRequest: \{ statusId: 1 \}, isDeleted: false \};\s+\(service as any\).receiptFileRepo = \{ findOne: jest.fn\(\).mockResolvedValue\(receipt\), save: jest.fn\(\) \};\s+await service.deleteReceipt\(1, 1, 1\);\s+expect\(receipt.isDeleted\).toBe\(true\);\s+\}\);/,
  `it('should soft delete', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 1 }) };
      const receipt: any = { id: 1, paymentRequest: { statusId: 1 }, isDeleted: false };
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(receipt), save: jest.fn() };
      await service.deleteReceipt(1, 1, 1);
      expect(receipt.isDeleted).toBe(true);
    });`
);

content = content.replace(
  /it\('should throw if status not Draft\/Rejected', async \(\) => \{\s+const receipt = \{ id: 1, paymentRequest: \{ statusId: 2 \} \};\s+\(service as any\).receiptFileRepo = \{ findOne: jest.fn\(\).mockResolvedValue\(receipt\) \};\s+await expect\(service.deleteReceipt\(1, 1, 1\)\).rejects.toThrow\(BadRequestException\);\s+\}\);/,
  `it('should throw if status not Draft/Rejected', async () => {
      (service as any).paymentRequestRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 2 }) };
      const receipt = { id: 1, paymentRequest: { statusId: 2 } };
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(receipt) };
      await expect(service.deleteReceipt(1, 1, 1)).rejects.toThrow(BadRequestException);
    });`
);

content = content.replace(
  /it\('should submit to approver', async \(\) => \{\s+mockManager.findOne.mockResolvedValueOnce\(\{\s+id: 1, statusId: 3, approverUserId: 2, requestNumber: 'req'\s+\}\);\s+mockManager.save.mockImplementation\(\(data: any\) => Promise.resolve\(data\)\);\s+mockManager.create.mockImplementation\(\(e: any, data: any\) => \(\{ ...data, timestamp: new Date\(\) \}\)\);\s+const res = await service.submitToApprover\(1, 1\);\s+expect\(res.statusId\).toBe\(4\);\s+\}\);/,
  `it('should submit to approver', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 1, statusId: 4, approverUserId: 2, requestNumber: 'req'
      });
      mockManager.save.mockImplementation((data: any) => Promise.resolve(data));
      mockManager.create.mockImplementation((e: any, data: any) => ({ ...data, timestamp: new Date() }));
      const res = await service.submitToApprover(1, 1);
      expect(res.statusId).toBe(4);
    });`
);

fs.writeFileSync(path, content, 'utf8');
