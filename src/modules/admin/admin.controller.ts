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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { RoleCode, JwtPayload } from '../shared/types';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

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
   * @returns Paginated user list with metadata.
   */
  @Get('users')
  async getUsers(
    @Query('keyword') keyword?: string,
    @Query('roleId') roleId?: number,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
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
   */
  @Post('users')
  async createUser(@Body() userData: CreateUserDto) {
    return this.adminService.createUser(userData);
  }

  /**
   * @description Updates user details with optimistic locking.
   * @param id The ID of the user to update.
   * @param dto The update payload including version.
   * @returns The updated user object.
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  /**
   * @description Toggles user active status and evicts sessions from Redis.
   * @param id The ID of the user to toggle.
   * @param isActive The new active status.
   * @param currentUserId The ID of the admin performing the action.
   * @returns Success status.
   */
  @Patch('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.adminService.toggleUserActive(id, isActive, currentUser.sub);
  }

  /**
   * @description Resets a user's password and evicts active sessions.
   * @param id The ID of the user to reset password for.
   * @param dto Contains version for optimistic locking.
   * @returns New temporary password (displayed once).
   */
  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.adminService.resetPassword(id, dto);
  }

  /**
   * @description Fetches master data lookup tables.
   * @param category The master data category.
   * @returns Read-only list of configured categories.
   */
  @Get('master-data/:category')
  async getMasterData(@Param('category') category: string) {
    return this.adminService.getMasterData(category);
  }

  /**
   * @description Fetches global audit logs with optional filters.
   * @param query Audit log query DTO with optional filters.
   * @returns Paginated audit log list.
   */
  @Get('audit-logs')
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }
}
