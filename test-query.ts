import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AccountingService } from './src/modules/accounting/accounting.service';

async function run() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(AccountingService);
    try {
      await service.findApprovedRequests();
      console.log('Query executed successfully!');
    } catch (e) {
      console.error('QUERY ERROR:', e);
    }
    await app.close();
  } catch (e) {
    console.error('BOOTSTRAP ERROR:', e);
  }
}
run();
