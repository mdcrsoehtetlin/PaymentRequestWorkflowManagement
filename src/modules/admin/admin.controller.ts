import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { RoleCode, JwtPayload, PaginatedResponse } from '../shared/types';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { AuditLogQueryDto } from './dto/audit-log-query.dto';

interface UserResponse {
  userId: number;
  employeeNumber: string;
  fullName: string;
  email: string;
  branch: string;
  roleId: number;
  isActive: boolean;
}

interface CreateUserResponse extends UserResponse {
  temporaryPassword: string;
}

interface ResetPasswordResponse {
  userId: number;
  temporaryPassword: string;
}

interface AuditLogResponse {
  approvalLogId: string;
  paymentRequestId: number;
  actionTakenByUserId: number;
  actorName: string;
  actionTypeId: number;
  previousStatusId: number | null;
  newStatusId: number | null;
  comment: string | null;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * @description Controller handling administrative operations: user management, master data, and audit logs.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * @description Fetches a paginated list of system users.
   * @param keyword Search filter for employee number or full name.
   * @param roleId Filter by role ID.
   * @param isActive Filter by active status.
   * @param page Page number (default 1).
   * @param pageSize Items per page (default 20).
   * @returns Paginated user list with metadata.
   */
  @Get('users')
  async getUsers(
    @Query('keyword') keyword?: string,
    @Query('roleId') roleId?: number,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<UserResponse>> {
    return this.adminService.getUsers(
      keyword,
      roleId,
      isActive !== undefined ? isActive === 'true' : undefined,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  /**
   * @description Creates a new user with auto-generated temporary password.
   * @param userData The payload containing the new user's details.
   * @returns The created user object with temporary password (displayed once).
   * @throws {ConflictException} If email or employee number already exists.
   */
  @Post('users')
  async createUser(
    @Body() userData: CreateUserDto,
  ): Promise<CreateUserResponse> {
    return this.adminService.createUser(userData);
  }

  /**
   * @description Updates user details.
   * @param id The ID of the user to update.
   * @param dto The update payload.
   * @returns The updated user object.
   * @throws {NotFoundException} If user not found.
   * @throws {ConflictException} If record concurrent edit conflict.
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.adminService.updateUser(id, dto);
  }

  /**
   * @description Toggles user active status and evicts sessions from Redis.
   * @param id The ID of the user to toggle.
   * @param isActive The new active status.
   * @param currentUser The JWT payload of the admin performing the action.
   * @returns Success status with new active state.
   * @throws {BadRequestException} If admin tries to deactivate themselves.
   * @throws {NotFoundException} If user not found.
   */
  @Patch('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<{ success: boolean; isActive: boolean }> {
    return this.adminService.toggleUserActive(id, isActive, currentUser.sub);
  }

  /**
   * @description Resets a user's password and evicts active sessions.
   * @param id The ID of the user to reset password for.
   * @returns New temporary password (displayed once).
   * @throws {NotFoundException} If user not found.
   * @throws {ConflictException} If record concurrent edit conflict.
   */
  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResetPasswordResponse> {
    return this.adminService.resetPassword(id);
  }

  /**
   * @description Fetches master data lookup tables.
   * @param category The master data category to fetch.
   * @returns Read-only list of configured categories.
   * @throws {NotFoundException} If category not found.
   */
  @Get('master-data/:category')
  async getMasterData(@Param('category') category: string): Promise<unknown[]> {
    return this.adminService.getMasterData(category);
  }

  /**
   * @description Fetches global audit logs with optional filters.
   * @param query Audit log query DTO with optional filters.
   * @returns Paginated audit log list.
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedResponse<AuditLogResponse>> {
    return this.adminService.getAuditLogs(query);
  }
}
