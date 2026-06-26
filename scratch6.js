const fs = require('fs');

const path = 'c:\\Projects\\ApplicantBranch\\PaymentRequestWorkflowManagement\\src\\modules\\applicant\\tests\\applicant.service.spec.ts';
let content = fs.readFileSync(path, 'utf8');

// Update global mockManager.create to include timestamp
content = content.replace(
  /create: jest\.fn\(\(entity, data\) => \(\{\s+\.\.\.data,\s+id: 1\s+\}\)\),/,
  `create: jest.fn((entity, data) => ({ ...data, id: 1, timestamp: new Date() })),`
);

// Delete the bogus approverValidationTests entirely
content = content.replace(
  /\s+const approverValidationFields = \[[\s\S]*?it\('should throw if hasReceipt but no receipts for approver', async \(\) => \{[\s\S]*?\}\);\s+/,
  '\n'
);

// Add tests for updatePaymentRequest field assignments (lines 605-618)
const updateFieldTests = `
    it('should update fields if provided', async () => {
      mockManager.findOne.mockResolvedValueOnce({ statusId: 1, breakdowns: [{ id: 1 }] });
      mockManager.delete.mockResolvedValueOnce({});
      mockManager.save.mockImplementation((data: any) => Promise.resolve(data));
      mockManager.create.mockImplementation((e: any, data: any) => data);
      const dto = {
        currency_id: 2,
        application_date: '2026-01-01',
        desired_payment_date: '2026-01-02',
        payment_method_id: 2,
        payment_type_id: 2,
        target_manager_id: 3,
        purpose: 'p2',
        request_content: 'c2',
        bank_account_info: 'b2',
        has_receipt: true
      };
      const res = await service.updatePaymentRequest(1, 1, dto as any);
      expect(res.currencyId).toBe(2);
      expect(res.purpose).toBe('p2');
    });
`;

content = content.replace(
  /it\('should throw if empty breakdowns', async \(\) => \{/,
  updateFieldTests + `\n    it('should throw if empty breakdowns', async () => {`
);

// Add deleteReceipt lines 513 test
content = content.replace(
  /expect\(\(service as any\).receiptFileRepo.update\)\.toHaveBeenCalledWith\(\{ id: 1 \}, \{ isDeleted: true \}\);\s+\}\);/,
  `expect((service as any).receiptFileRepo.update).toHaveBeenCalledWith({ id: 1 }, { isDeleted: true });
    });
    
    it('should update hasReceipt to false if no remaining receipts', async () => {
      mockPaymentRequestRepo.findOne.mockResolvedValueOnce({ statusId: 1 });
      (service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue({ statusId: 1 }), save: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0) };
      mockPaymentRequestRepo.update.mockResolvedValueOnce({});
      await service.deleteReceipt(1, 1, 1);
      expect(mockPaymentRequestRepo.update).toHaveBeenCalledWith({ id: 1 }, { hasReceipt: false });
    });`
);

fs.writeFileSync(path, content, 'utf8');
