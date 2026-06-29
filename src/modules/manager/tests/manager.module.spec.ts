import { ManagerModule } from '../manager.module';

describe('ManagerModule', () => {
  it('should be defined', () => {
    expect(ManagerModule).toBeDefined();
  });

  it('should have NestJS module metadata', () => {
    const keys = Reflect.getMetadataKeys(ManagerModule);
    expect(keys).toBeDefined();
    expect(keys.length).toBeGreaterThan(0);
  });
});
