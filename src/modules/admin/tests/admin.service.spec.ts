import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { User } from '../../shared/entities/user.entity';
import { ApprovalLog } from '../../shared/entities/approval-log.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuditLogQueryDto } from '../dto/audit-log-query.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const mockRedisClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  keys: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('redis', () => ({
  createClient: jest.fn().mockReturnValue(mockRedisClient),
}));

function createMockQueryBuilder() {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndMapOne: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawOne: jest.fn().mockResolvedValue(null),
    execute: jest.fn().mockResolvedValue({ affected: 1, generatedMaps: [] }),
  };
}

describe('AdminService', () => {
  let service: AdminService;
  let mockUserRepo: ReturnType<typeof createMockUserRepo>;
  let mockApprovalLogRepo: ReturnType<typeof createMockApprovalLogRepo>;

  function createMockUserRepo() {
    return {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { connection: { query: jest.fn() } },
    };
  }

  function createMockApprovalLogRepo() {
    return {
      createQueryBuilder: jest.fn(),
    };
  }

  const baseUser = {
    userId: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    employeeNumber: 'EMP-001',
    department: 'Engineering',
    branch: 'Yangon',
    roleId: 1,
    isActive: true,
    passwordHash: 'hashed',
    createdDate: new Date('2026-01-01'),
    modifiedDate: new Date('2026-01-01'),
    lastLoginDate: null,
    paymentRequestsAsApplicant: [],
    paymentRequestsAsManager: [],
    paymentRequestsAsApprover: [],
    paymentRequestsAsAccounting: [],
    assignedPaymentRequests: [],
    approvalLogs: [],
    uploadedReceipts: [],
  };

  beforeEach(async () => {
    mockUserRepo = createMockUserRepo();
    mockApprovalLogRepo = createMockApprovalLogRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(ApprovalLog),
          useValue: mockApprovalLogRepo,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'securePass123',
      fullName: 'New User',
      employeeNumber: 'EMP-002',
      department: 'Sales',
      branch: 'Mandalay',
      roleId: 2,
      isActive: true,
    };

    it('should create a user and return user details with temporary password', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(baseUser);
      mockUserRepo.save.mockResolvedValue(baseUser);

      const result = await service.createUser(createDto);

      expect(mockUserRepo.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createDto.email,
          fullName: createDto.fullName,
          employeeNumber: createDto.employeeNumber,
        }),
      );
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result.userId).toBe(baseUser.userId);
      expect(result.temporaryPassword).toBeDefined();
      expect(result.temporaryPassword.length).toBeGreaterThan(0);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(baseUser);

      await expect(service.createUser(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepo.create).not.toHaveBeenCalled();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should default isActive to true when not provided', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const dtoNoActive = { ...createDto, isActive: undefined };
      mockUserRepo.create.mockImplementation(
        (data: Record<string, unknown>) => data,
      );
      mockUserRepo.save.mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve({ ...baseUser, ...data }),
      );

      await service.createUser(dtoNoActive);

      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
        }),
      );
    });

    it('should throw ConflictException when employeeNumber already exists', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(baseUser);

      await expect(service.createUser(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const updateDto: UpdateUserDto = {
      fullName: 'Updated Name',
    };

    it('should update user and return updated details', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...baseUser,
        fullName: 'Updated Name',
      });

      const result = await service.updateUser(1, updateDto);

      expect(result.fullName).toBe('Updated Name');
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.updateUser(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should preserve existing field values when update dto fields are undefined', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockUserRepo.findOne.mockResolvedValueOnce(baseUser);

      const partialDto = new UpdateUserDto();
      const result = await service.updateUser(1, partialDto);

      expect(mockUserRepo.update).toHaveBeenCalledWith(1, {
        fullName: baseUser.fullName,
        department: baseUser.department,
        branch: baseUser.branch,
        roleId: baseUser.roleId,
        isActive: baseUser.isActive,
      });
      expect(result).toBeDefined();
    });
  });

  describe('toggleUserActive', () => {
    it('should deactivate a user and return success', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleUserActive(2, false, 1);

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(mockUserRepo.update).toHaveBeenCalledWith(2, { isActive: false });
    });

    it('should throw BadRequestException when admin deactivates own account', async () => {
      await expect(service.toggleUserActive(1, false, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.toggleUserActive(2, true, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getCount.mockResolvedValue(1);
      mockQb.getMany.mockResolvedValue([baseUser]);
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getUsers('EMP-001', 'test', 1, true, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should normalize numeric employee numbers by adding EMP- prefix', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getCount.mockResolvedValue(1);
      mockQb.getMany.mockResolvedValue([baseUser]);
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.getUsers(
        '2024-001',
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'user.employee_number = :employeeNumber',
        { employeeNumber: 'EMP-2024-001' },
      );
    });

    it('should return paginated users without filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getCount.mockResolvedValue(2);
      mockQb.getMany.mockResolvedValue([baseUser, { ...baseUser, userId: 2 }]);
      mockUserRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getUsers();

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.pageSize).toBe(20);
    });
  });

  describe('getMasterData', () => {
    it('should return results for a valid category', async () => {
      const mockRows = [{ role_id: 1, role_code: 'ADMIN' }];
      mockUserRepo.manager.connection.query.mockResolvedValue(mockRows);

      const result = await service.getMasterData('roles');

      expect(result).toEqual(mockRows);
      expect(mockUserRepo.manager.connection.query).toHaveBeenCalledWith(
        expect.stringContaining('user_roles'),
      );
    });

    it('should throw NotFoundException for invalid category', async () => {
      await expect(service.getMasterData('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs with filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getCount.mockResolvedValue(1);
      mockQb.getMany.mockResolvedValue([
        {
          approvalLogId: '1',
          paymentRequestId: 101,
          actionTakenByUserId: 1,
          actionTypeId: 1,
          previousStatusId: null,
          newStatusId: 1,
          comment: null,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
          timestamp: new Date(),
          actionTakenByUser: { fullName: 'Admin' },
          paymentRequest: {},
        },
      ]);
      mockApprovalLogRepo.createQueryBuilder.mockReturnValue(mockQb);

      const query: AuditLogQueryDto = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        actionTypeId: 1,
        requestNumber: 'PR-2026-101',
        actorName: 'Admin',
        page: 1,
        pageSize: 50,
      };
      const result = await service.getAuditLogs(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(mockQb.andWhere).toHaveBeenCalled();
    });

    it('should return audit logs without filters', async () => {
      const mockQb = createMockQueryBuilder();
      mockQb.getCount.mockResolvedValue(0);
      mockQb.getMany.mockResolvedValue([]);
      mockApprovalLogRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getAuditLogs({});

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return temporary password', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.resetPassword(1);

      expect(result.temporaryPassword).toBeDefined();
      expect(result.temporaryPassword.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.resetPassword(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('evictUserSessions', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.disconnect.mockResolvedValue(undefined);
      mockRedisClient.del.mockResolvedValue(1);
    });

    it('should evict sessions matching userId when toggling user inactive', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockRedisClient.keys.mockResolvedValue(['session:abc', 'session:def']);
      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify({ userId: 2, sub: 2 }))
        .mockResolvedValueOnce(JSON.stringify({ userId: 99, sub: 99 }));

      const result = await service.toggleUserActive(2, false, 1);

      expect(result.success).toBe(true);
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.keys).toHaveBeenCalledWith('session:*');
      expect(mockRedisClient.get).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).toHaveBeenCalledWith('session:abc');
      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });

    it('should evict sessions matching sub field', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockRedisClient.keys.mockResolvedValue(['session:xyz']);
      mockRedisClient.get.mockResolvedValueOnce(
        JSON.stringify({ userId: 99, sub: 2 }),
      );

      await service.toggleUserActive(2, false, 1);

      expect(mockRedisClient.del).toHaveBeenCalledWith('session:xyz');
    });

    it('should not evict sessions when no keys match', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockRedisClient.keys.mockResolvedValue(['session:other']);
      mockRedisClient.get.mockResolvedValueOnce(
        JSON.stringify({ userId: 99, sub: 99 }),
      );

      await service.toggleUserActive(2, false, 1);

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockRedisClient.connect.mockRejectedValueOnce(
        new Error('Redis connection refused'),
      );

      const consoleSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      const result = await service.toggleUserActive(2, false, 1);

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to evict sessions'),
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in session data gracefully', async () => {
      mockUserRepo.findOne.mockResolvedValue(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockRedisClient.keys.mockResolvedValue(['session:bad']);
      mockRedisClient.get.mockResolvedValueOnce('invalid-json');

      const consoleSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      const result = await service.toggleUserActive(2, false, 1);

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should evict sessions when resetting password', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(baseUser);
      mockUserRepo.update.mockResolvedValue({ affected: 1 });
      mockRedisClient.keys.mockResolvedValue(['session:pw1']);
      mockRedisClient.get.mockResolvedValueOnce(
        JSON.stringify({ userId: 1, sub: 1 }),
      );

      const result = await service.resetPassword(1);

      expect(result.temporaryPassword).toBeDefined();
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalledWith('session:pw1');
    });
  });
});
