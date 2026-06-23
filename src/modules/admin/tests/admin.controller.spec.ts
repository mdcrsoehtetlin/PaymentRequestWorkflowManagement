import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let mockService: {
    getUsers: jest.Mock;
    createUser: jest.Mock;
    updateUser: jest.Mock;
    toggleUserActive: jest.Mock;
    resetPassword: jest.Mock;
    getMasterData: jest.Mock;
    getAuditLogs: jest.Mock;
  };

  beforeEach(async () => {
    mockService = {
      getUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      toggleUserActive: jest.fn(),
      resetPassword: jest.fn(),
      getMasterData: jest.fn(),
      getAuditLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should call adminService.getUsers with parsed query params', async () => {
      const expectedResult = {
        data: [],
        meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      };
      mockService.getUsers.mockResolvedValue(expectedResult);

      const result = await controller.getUsers('test', 1, 'true', '1', '20');

      expect(mockService.getUsers).toHaveBeenCalledWith('test', 1, true, 1, 20);
      expect(result).toEqual(expectedResult);
    });

    it('should call adminService.getUsers with default pagination when not provided', async () => {
      mockService.getUsers.mockResolvedValue({
        data: [],
        meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      });

      await controller.getUsers(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );

      expect(mockService.getUsers).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        1,
        20,
      );
    });
  });

  describe('POST /users', () => {
    it('should call adminService.createUser with DTO', async () => {
      const dto: CreateUserDto = {
        email: 'new@example.com',
        fullName: 'New User',
        employeeNumber: 'EMP-002',
        branch: 'Yangon',
        roleId: 1,
      };
      const expectedResult = {
        userId: 1,
        employeeNumber: 'EMP-002',
        fullName: 'New User',
        email: 'new@example.com',
        branch: 'Yangon',
        roleId: 1,
        isActive: true,
        temporaryPassword: 'abc123',
      };
      mockService.createUser.mockResolvedValue(expectedResult);

      const result = await controller.createUser(dto);

      expect(mockService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should call adminService.updateUser with id and DTO', async () => {
      const dto: UpdateUserDto = { fullName: 'Updated' };
      const expectedResult = {
        userId: 1,
        employeeNumber: 'EMP-001',
        fullName: 'Updated',
        email: 'test@example.com',
        branch: 'Yangon',
        roleId: 1,
        isActive: true,
      };
      mockService.updateUser.mockResolvedValue(expectedResult);

      const result = await controller.updateUser(1, dto);

      expect(mockService.updateUser).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('PATCH /users/:id/toggle-active', () => {
    it('should call adminService.toggleUserActive with id, isActive, and currentUser', async () => {
      const currentUser = {
        sub: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
        roleId: 5,
        branch: 'Yangon',
        employeeNumber: 'ADM-001',
        fullName: 'Admin',
        iat: 0,
        exp: 9999999999,
      };
      mockService.toggleUserActive.mockResolvedValue({
        success: true,
        isActive: false,
      });

      const result = await controller.toggleUserActive(2, false, currentUser);

      expect(mockService.toggleUserActive).toHaveBeenCalledWith(2, false, 1);
      expect(result).toEqual({ success: true, isActive: false });
    });
  });

  describe('POST /users/:id/reset-password', () => {
    it('should call adminService.resetPassword with id', async () => {
      mockService.resetPassword.mockResolvedValue({
        userId: 1,
        temporaryPassword: 'newpass',
      });

      const result = await controller.resetPassword(1);

      expect(mockService.resetPassword).toHaveBeenCalledWith(1);
      expect(result.temporaryPassword).toBe('newpass');
    });
  });

  describe('GET /master-data/:category', () => {
    it('should call adminService.getMasterData with category', async () => {
      const mockData = [{ role_id: 1, role_code: 'ADMIN' }];
      mockService.getMasterData.mockResolvedValue(mockData);

      const result = await controller.getMasterData('roles');

      expect(mockService.getMasterData).toHaveBeenCalledWith('roles');
      expect(result).toEqual(mockData);
    });
  });

  describe('GET /audit-logs', () => {
    it('should call adminService.getAuditLogs with query DTO', async () => {
      const query: AuditLogQueryDto = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        page: 1,
        pageSize: 50,
      };
      const expectedResult = {
        data: [],
        meta: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 },
      };
      mockService.getAuditLogs.mockResolvedValue(expectedResult);

      const result = await controller.getAuditLogs(query);

      expect(mockService.getAuditLogs).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });
});
