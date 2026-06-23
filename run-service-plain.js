const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { ManagerService } = require('./dist/src/modules/manager/manager.service');

async function main() {
  console.log('Bootstrapping context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Getting ManagerService...');
  const managerService = app.get(ManagerService);

  try {
    console.log('Calling getRequestDetails(2, 2)...');
    const res = await managerService.getRequestDetails(2, 2);
    console.log('Success:', res);
  } catch (err) {
    console.error('FAILED:');
    console.error(err);
  } finally {
    await app.close();
  }
}

main();
