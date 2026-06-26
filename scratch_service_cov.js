const fs = require('fs');

const path = 'c:\\Projects\\ApplicantBranch\\PaymentRequestWorkflowManagement\\src\\modules\\applicant\\tests\\applicant.service.spec.ts';
let content = fs.readFileSync(path, 'utf8');

// Add test for submitToApprover not found (line 536)
content = content.replace(
  /it\('should submit to approver', async \(\) => \{/,
  `it('should throw NotFound if not found for approver', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.submitToApprover(1, 1)).rejects.toThrow(NotFoundException);
    });
    
    it('should submit to approver', async () => {`
);

// Add test for deleteDraft not found (line 674)
content = content.replace(
  /it\('should delete draft', async \(\) => \{/,
  `it('should throw NotFound if not found for deleteDraft', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      await expect(service.deleteDraft(1, 1)).rejects.toThrow(NotFoundException);
    });
    
    it('should delete draft', async () => {`
);

// Add test for clearDashboardCache branches (lines 721-723, 730-734)
// Inside 'clearDashboardCache branches' suite, add remaining tests
content = content.replace(
  /it\('should clear via store\.client\.keys', async \(\) => \{/,
  `it('should clear via store.keys with empty keys', async () => {
      const keysMock = jest.fn().mockResolvedValue([]);
      (service as any).cacheManager = { store: { keys: keysMock }, del: jest.fn() };
      await (service as any).clearDashboardCache(1);
    });

    it('should clear via store.client.keys with empty keys', async () => {
      const keysMock = jest.fn().mockResolvedValue([]);
      (service as any).cacheManager = { store: { client: { keys: keysMock } }, del: jest.fn() };
      await (service as any).clearDashboardCache(1);
    });

    it('should clear via store.client.keys', async () => {`
);

fs.writeFileSync(path, content, 'utf8');
