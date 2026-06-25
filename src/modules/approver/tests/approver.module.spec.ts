import { ApproverModule } from '../approver.module';

describe('ApproverModule', () => {
  it('should be defined', () => {
    expect(ApproverModule).toBeDefined();
  });

  it('should have NestJS module metadata', () => {
    const keys = Reflect.getMetadataKeys(ApproverModule);
    expect(keys).toBeDefined();
    expect(keys.length).toBeGreaterThan(0);
  });
});
