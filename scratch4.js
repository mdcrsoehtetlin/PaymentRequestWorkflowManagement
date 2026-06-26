const fs = require('fs');

const path = 'c:\\Projects\\ApplicantBranch\\PaymentRequestWorkflowManagement\\src\\modules\\applicant\\tests\\applicant.service.spec.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /\(service as any\).receiptFileRepo = \{ findOne: jest.fn\(\).mockResolvedValue\(receipt\), save: jest.fn\(\) \};/,
  `(service as any).receiptFileRepo = { findOne: jest.fn().mockResolvedValue(receipt), save: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(1) };`
);

content = content.replace(
  /expect\(res\.statusId\)\.toBe\(4\);/,
  `expect(res.statusId).toBe(6);`
);

fs.writeFileSync(path, content, 'utf8');
