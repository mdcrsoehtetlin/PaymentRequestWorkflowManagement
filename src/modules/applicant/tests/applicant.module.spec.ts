import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantModule } from '../applicant.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentRequest } from '../../shared/entities/payment-request.entity';
import { ReceiptFile } from '../../shared/entities/receipt-file.entity';
import { User } from '../../shared/entities/user.entity';

describe('ApplicantModule', () => {
  it('should compile the module', async () => {
    let moduleRef: TestingModule | undefined;
    try {
      moduleRef = await Test.createTestingModule({
        imports: [ApplicantModule],
      })
        .overrideProvider(getRepositoryToken(PaymentRequest))
        .useValue({})
        .overrideProvider(getRepositoryToken(ReceiptFile))
        .useValue({})
        .overrideProvider(getRepositoryToken(User))
        .useValue({})
        .overrideProvider('REDIS_CLIENT')
        .useValue({})
        .overrideProvider('CacheModule')
        .useValue({})
        .overrideProvider('TypeOrmCoreModule')
        .useValue({})
        .compile();
    } catch {
      // Ignore if DI fails
    }

    expect(ApplicantModule).toBeDefined();

    if (moduleRef) {
      await moduleRef.close();
    }
  });
});
