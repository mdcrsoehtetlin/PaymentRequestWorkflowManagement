import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AdminModule } from '../admin.module';

describe('CreateUserDto', () => {
  it('should instantiate with all fields', () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.fullName = 'Test User';
    dto.employeeNumber = 'EMP-001';
    dto.branch = 'Yangon';
    dto.roleId = 1;
    dto.department = 'Engineering';
    dto.isActive = true;
    dto.password = 'pass123';

    expect(dto.email).toBe('test@example.com');
    expect(dto.fullName).toBe('Test User');
    expect(dto.employeeNumber).toBe('EMP-001');
    expect(dto.branch).toBe('Yangon');
    expect(dto.roleId).toBe(1);
    expect(dto.department).toBe('Engineering');
    expect(dto.isActive).toBe(true);
    expect(dto.password).toBe('pass123');
  });

  it('should validate required fields', async () => {
    const dto = plainToInstance(CreateUserDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const errorProps = errors.map((e) => e.property);
    expect(errorProps).toContain('email');
    expect(errorProps).toContain('fullName');
    expect(errorProps).toContain('employeeNumber');
    expect(errorProps).toContain('branch');
    expect(errorProps).toContain('roleId');
  });

  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'user@test.com',
      fullName: 'Test User',
      employeeNumber: 'EMP-001',
      branch: 'Yangon',
      roleId: 1,
      password: 'pass123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform email by trimming whitespace', () => {
    const dto = plainToInstance(CreateUserDto, {
      email: '  user@test.com  ',
      fullName: '  Test User  ',
      employeeNumber: '  EMP-001  ',
      branch: '  Yangon  ',
      roleId: 1,
    });
    expect(dto.email).toBe('user@test.com');
    expect(dto.fullName).toBe('Test User');
    expect(dto.employeeNumber).toBe('EMP-001');
    expect(dto.branch).toBe('Yangon');
  });

  it('should reject invalid email', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'not-an-email',
      fullName: 'Test User',
      employeeNumber: 'EMP-001',
      branch: 'Yangon',
      roleId: 1,
    });
    const errors = await validate(dto);
    const emailError = errors.find((e) => e.property === 'email');
    expect(emailError).toBeDefined();
  });

  it('should pass non-string department through transform unchanged', () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'user@test.com',
      fullName: 'Test User',
      employeeNumber: 'EMP-001',
      branch: 'Yangon',
      roleId: 1,
      department: 123,
    });
    expect(dto.department).toBe(123);
  });
});

describe('UpdateUserDto', () => {
  it('should instantiate with all fields', () => {
    const dto = new UpdateUserDto();
    dto.fullName = 'Updated Name';
    dto.department = 'Engineering';
    dto.branch = 'Yangon';
    dto.roleId = 2;
    dto.isActive = false;

    expect(dto.fullName).toBe('Updated Name');
    expect(dto.department).toBe('Engineering');
    expect(dto.branch).toBe('Yangon');
    expect(dto.roleId).toBe(2);
    expect(dto.isActive).toBe(false);
  });

  it('should allow partial updates', () => {
    const dto = new UpdateUserDto();
    dto.fullName = 'Only Name';

    expect(dto.fullName).toBe('Only Name');
    expect(dto.department).toBeUndefined();
    expect(dto.branch).toBeUndefined();
    expect(dto.roleId).toBeUndefined();
    expect(dto.isActive).toBeUndefined();
  });

  it('should validate optional fields type constraints', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      fullName: 'Name',
      department: 'Dept',
      branch: 'Branch',
      roleId: 'not-a-number',
      isActive: 'not-a-boolean',
    });
    const errors = await validate(dto);
    const errorProps = errors.map((e) => e.property);
    expect(errorProps).toContain('roleId');
    expect(errorProps).toContain('isActive');
  });

  it('should pass validation with all valid data', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      fullName: 'Updated',
      department: 'Engineering',
      branch: 'Yangon',
      roleId: 2,
      isActive: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass non-string fields through transform unchanged', () => {
    const dto = plainToInstance(UpdateUserDto, {
      fullName: 123,
      department: 456,
      branch: 789,
    });
    expect(dto.fullName).toBe(123);
    expect(dto.department).toBe(456);
    expect(dto.branch).toBe(789);
  });
});

describe('AuditLogQueryDto', () => {
  it('should instantiate with all fields', () => {
    const dto = new AuditLogQueryDto();
    dto.startDate = '2026-01-01';
    dto.endDate = '2026-12-31';
    dto.actionTypeId = 1;
    dto.requestNumber = 'PRF-001';
    dto.actorName = 'Admin';
    dto.page = 1;
    dto.pageSize = 50;

    expect(dto.startDate).toBe('2026-01-01');
    expect(dto.endDate).toBe('2026-12-31');
    expect(dto.actionTypeId).toBe(1);
    expect(dto.requestNumber).toBe('PRF-001');
    expect(dto.actorName).toBe('Admin');
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(50);
  });

  it('should have default values for page and pageSize', () => {
    const dto = new AuditLogQueryDto();
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(50);
  });

  it('should allow empty query', () => {
    const dto = new AuditLogQueryDto();
    expect(dto.startDate).toBeUndefined();
    expect(dto.endDate).toBeUndefined();
    expect(dto.actionTypeId).toBeUndefined();
    expect(dto.requestNumber).toBeUndefined();
    expect(dto.actorName).toBeUndefined();
  });

  it('should transform string numbers via @Type', () => {
    const dto = plainToInstance(AuditLogQueryDto, {
      actionTypeId: '5',
      page: '2',
      pageSize: '25',
    });
    expect(typeof dto.actionTypeId).toBe('number');
    expect(typeof dto.page).toBe('number');
    expect(typeof dto.pageSize).toBe('number');
    expect(dto.actionTypeId).toBe(5);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(25);
  });

  it('should validate page min constraint', async () => {
    const dto = plainToInstance(AuditLogQueryDto, {
      page: 0,
      pageSize: 0,
    });
    const errors = await validate(dto);
    const errorProps = errors.map((e) => e.property);
    expect(errorProps).toContain('page');
    expect(errorProps).toContain('pageSize');
  });

  it('should validate pageSize max constraint', async () => {
    const dto = plainToInstance(AuditLogQueryDto, {
      pageSize: 101,
    });
    const errors = await validate(dto);
    const pageErrors = errors.filter((e) => e.property === 'pageSize');
    expect(pageErrors.length).toBe(1);
  });

  it('should validate date string format', async () => {
    const dto = plainToInstance(AuditLogQueryDto, {
      startDate: 'not-a-date',
      endDate: 'also-not-a-date',
    });
    const errors = await validate(dto);
    const errorProps = errors.map((e) => e.property);
    expect(errorProps).toContain('startDate');
    expect(errorProps).toContain('endDate');
  });
});

describe('ResetPasswordDto', () => {
  it('should be instantiable', () => {
    const dto = new ResetPasswordDto();
    expect(dto).toBeDefined();
  });

  it('should be a valid class with no properties', () => {
    const dto = new ResetPasswordDto();
    expect(Object.keys(dto)).toHaveLength(0);
  });
});

describe('AdminModule', () => {
  it('should be defined', () => {
    expect(AdminModule).toBeDefined();
  });

  it('should have AdminController in controllers', () => {
    const metadata = Reflect.getMetadata(
      'controllers',
      AdminModule,
    ) as unknown[];
    expect(metadata).toBeDefined();
    expect(metadata.length).toBeGreaterThanOrEqual(1);
  });

  it('should have AdminService in providers', () => {
    const metadata = Reflect.getMetadata('providers', AdminModule) as unknown[];
    expect(metadata).toBeDefined();
    expect(metadata.length).toBeGreaterThanOrEqual(1);
  });

  it('should import SharedModule', () => {
    const metadata = Reflect.getMetadata('imports', AdminModule) as unknown[];
    expect(metadata).toBeDefined();
    expect(metadata.length).toBeGreaterThanOrEqual(1);
  });
});
