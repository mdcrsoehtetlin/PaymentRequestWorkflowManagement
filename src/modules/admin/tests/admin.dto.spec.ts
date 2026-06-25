import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

describe('Admin DTOs', () => {
  describe('CreateUserDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        password: 'securePass123',
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        department: 'Engineering',
        branch: 'Yangon',
        roleId: 1,
        isActive: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should trim whitespace from string fields', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: '  test@example.com  ',
        password: '  securePass123  ',
        fullName: '  Test User  ',
        employeeNumber: '  EMP-001  ',
        department: '  Engineering  ',
        branch: '  Yangon  ',
        roleId: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.email).toBe('test@example.com');
      expect(dto.fullName).toBe('Test User');
      expect(dto.employeeNumber).toBe('EMP-001');
      expect(dto.department).toBe('Engineering');
      expect(dto.branch).toBe('Yangon');
    });

    it('should fail when email is missing', async () => {
      const dto = plainToInstance(CreateUserDto, {
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        branch: 'Yangon',
        roleId: 1,
      });

      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should fail when email is invalid', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'not-an-email',
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        branch: 'Yangon',
        roleId: 1,
      });

      const errors = await validate(dto);
      const emailErrors = errors.filter((e) => e.property === 'email');
      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should fail when fullName is missing', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        employeeNumber: 'EMP-001',
        branch: 'Yangon',
        roleId: 1,
      });

      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'fullName');
      expect(nameErrors.length).toBeGreaterThan(0);
    });

    it('should fail when employeeNumber is missing', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        fullName: 'Test User',
        branch: 'Yangon',
        roleId: 1,
      });

      const errors = await validate(dto);
      const empErrors = errors.filter((e) => e.property === 'employeeNumber');
      expect(empErrors.length).toBeGreaterThan(0);
    });

    it('should fail when branch is missing', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        roleId: 1,
      });

      const errors = await validate(dto);
      const branchErrors = errors.filter((e) => e.property === 'branch');
      expect(branchErrors.length).toBeGreaterThan(0);
    });

    it('should fail when roleId is missing', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        branch: 'Yangon',
      });

      const errors = await validate(dto);
      const roleErrors = errors.filter((e) => e.property === 'roleId');
      expect(roleErrors.length).toBeGreaterThan(0);
    });

    it('should fail when roleId is not an integer', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        branch: 'Yangon',
        roleId: 'not-a-number',
      });

      const errors = await validate(dto);
      const roleErrors = errors.filter((e) => e.property === 'roleId');
      expect(roleErrors.length).toBeGreaterThan(0);
    });

    it('should pass with optional fields omitted', async () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 'test@example.com',
        fullName: 'Test User',
        employeeNumber: 'EMP-001',
        branch: 'Yangon',
        roleId: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.password).toBeUndefined();
      expect(dto.department).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
    });

    it('should handle non-string values in @Transform fields gracefully', () => {
      const dto = plainToInstance(CreateUserDto, {
        email: 12345,
        password: 67890,
        fullName: true,
        employeeNumber: null,
        department: undefined,
        branch: 0,
        roleId: 1,
      });

      expect(dto.email).toBe(12345);
      expect(dto.password).toBe(67890);
      expect(dto.fullName).toBe(true);
      expect(dto.employeeNumber).toBe(null);
      expect(dto.branch).toBe(0);
    });
  });

  describe('UpdateUserDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        fullName: 'Updated Name',
        department: 'Sales',
        branch: 'Mandalay',
        roleId: 2,
        isActive: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with all fields omitted', async () => {
      const dto = plainToInstance(UpdateUserDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should trim whitespace from string fields', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        fullName: '  Updated Name  ',
        department: '  Sales  ',
        branch: '  Mandalay  ',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.fullName).toBe('Updated Name');
      expect(dto.department).toBe('Sales');
      expect(dto.branch).toBe('Mandalay');
    });

    it('should fail when fullName exceeds max length', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        fullName: 'a'.repeat(201),
      });

      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'fullName');
      expect(nameErrors.length).toBeGreaterThan(0);
    });

    it('should fail when department exceeds max length', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        department: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      const deptErrors = errors.filter((e) => e.property === 'department');
      expect(deptErrors.length).toBeGreaterThan(0);
    });

    it('should fail when branch exceeds max length', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        branch: 'a'.repeat(101),
      });

      const errors = await validate(dto);
      const branchErrors = errors.filter((e) => e.property === 'branch');
      expect(branchErrors.length).toBeGreaterThan(0);
    });

    it('should fail when roleId is not an integer', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        roleId: 'invalid',
      });

      const errors = await validate(dto);
      const roleErrors = errors.filter((e) => e.property === 'roleId');
      expect(roleErrors.length).toBeGreaterThan(0);
    });

    it('should fail when isActive is not a boolean', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        isActive: 'not-a-boolean',
      });

      const errors = await validate(dto);
      const activeErrors = errors.filter((e) => e.property === 'isActive');
      expect(activeErrors.length).toBeGreaterThan(0);
    });

    it('should handle non-string values in @Transform fields gracefully', () => {
      const dto = plainToInstance(UpdateUserDto, {
        fullName: 12345,
        department: true,
        branch: null,
      });

      expect(dto.fullName).toBe(12345);
      expect(dto.department).toBe(true);
      expect(dto.branch).toBe(null);
    });
  });

  describe('AuditLogQueryDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        actionTypeId: 1,
        requestNumber: 'PR-2026-101',
        actorName: 'Admin',
        page: 1,
        pageSize: 50,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass with all fields omitted', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should use default values for page and pageSize', () => {
      const dto = plainToInstance(AuditLogQueryDto, {});

      expect(dto.page).toBe(1);
      expect(dto.pageSize).toBe(50);
    });

    it('should fail when startDate is not a valid date string', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        startDate: 'not-a-date',
      });

      const errors = await validate(dto);
      const startErrors = errors.filter((e) => e.property === 'startDate');
      expect(startErrors.length).toBeGreaterThan(0);
    });

    it('should fail when endDate is not a valid date string', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        endDate: 'not-a-date',
      });

      const errors = await validate(dto);
      const endErrors = errors.filter((e) => e.property === 'endDate');
      expect(endErrors.length).toBeGreaterThan(0);
    });

    it('should fail when actionTypeId is not an integer', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        actionTypeId: 'not-a-number',
      });

      const errors = await validate(dto);
      const actionErrors = errors.filter((e) => e.property === 'actionTypeId');
      expect(actionErrors.length).toBeGreaterThan(0);
    });

    it('should fail when requestNumber exceeds max length', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        requestNumber: 'a'.repeat(51),
      });

      const errors = await validate(dto);
      const reqErrors = errors.filter((e) => e.property === 'requestNumber');
      expect(reqErrors.length).toBeGreaterThan(0);
    });

    it('should fail when actorName exceeds max length', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        actorName: 'a'.repeat(201),
      });

      const errors = await validate(dto);
      const actorErrors = errors.filter((e) => e.property === 'actorName');
      expect(actorErrors.length).toBeGreaterThan(0);
    });

    it('should fail when page is less than 1', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        page: 0,
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');
      expect(pageErrors.length).toBeGreaterThan(0);
    });

    it('should fail when pageSize exceeds max of 100', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        pageSize: 101,
      });

      const errors = await validate(dto);
      const sizeErrors = errors.filter((e) => e.property === 'pageSize');
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    it('should fail when pageSize is less than 1', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        pageSize: 0,
      });

      const errors = await validate(dto);
      const sizeErrors = errors.filter((e) => e.property === 'pageSize');
      expect(sizeErrors.length).toBeGreaterThan(0);
    });

    it('should fail when page is not an integer', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        page: 'not-a-number',
      });

      const errors = await validate(dto);
      const pageErrors = errors.filter((e) => e.property === 'page');
      expect(pageErrors.length).toBeGreaterThan(0);
    });
  });
});
