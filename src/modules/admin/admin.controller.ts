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
import { RoleCode } from '../shared/types';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * @description Controller handling administrative operations such as user management and audit logs.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * @description Creates a new user in the system.
   * @param userData The payload containing the new user's details.
   * @returns The created user object.
   * @throws {ConflictException} If a user with the same email already exists.
   */
  @Post('users')
  async createUser(@Body() userData: CreateUserDto) {
    return this.adminService.createUser(userData);
  }

  /**
   * @description Toggles the active status of a user account.
   * @param id The ID of the user to toggle.
   * @param isActive The new active status.
   * @returns An object indicating the success of the operation.
   * @throws {NotFoundException} If the user is not found.
   */
  @Patch('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive', ParseBoolPipe) isActive: boolean,
  ) {
    return this.adminService.toggleUserActive(id, isActive);
  }

  /**
   * @description Fetches system audit logs, optionally filtered by date or user ID.
   * @param startDate Optional start date for filtering.
   * @param endDate Optional end date for filtering.
   * @param userId Optional user ID for filtering.
   * @returns A list of audit logs matching the criteria.
   * @throws {UnauthorizedException} If the user lacks admin privileges.
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: number,
  ) {
    return this.adminService.getAuditLogs(startDate, endDate, userId);
  }
}
