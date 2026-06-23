import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ManagerService } from './src/modules/manager/manager.service';
import { QueryRequestsDto } from './src/modules/manager/dto/query-requests.dto';

async function main() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('App context initialized. Getting ManagerService...');
  const managerService = app.get(ManagerService);

  try {
    console.log('Calling getPendingRequests(2, {})...');
    const query = new QueryRequestsDto();
    const result = await managerService.getPendingRequests(2, query);
    console.log('Success! Result size:', result.length);
    console.log(result);
  } catch (error) {
    console.error('Error occurred in getPendingRequests:');
    console.error(error);
  } finally {
    await app.close();
  }
}

main();
