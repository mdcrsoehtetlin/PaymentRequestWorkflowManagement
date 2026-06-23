import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../shared/decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../shared/entities/user.entity';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';

/**
 * @description Controller handling authentication operations.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @description Authenticates a user and returns a JWT access token.
   * @param req The HTTP request object containing the authenticated user.
   * @returns An authentication response containing the access token.
   * @throws {UnauthorizedException} If the credentials are invalid.
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: { user: User }): AuthResponseDto {
    // passport-local will validate user and attach to req.user
    return this.authService.login(req.user);
  }

  /**
   * @description Refreshes the user's JWT access token.
   * @param req The HTTP request object containing the authenticated user.
   * @returns A new access token.
   * @throws {UnauthorizedException} If the user is not authenticated or token is invalid.
   */
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Request() req: { user: User }): { accessToken: string } {
    // In a real app, you would validate the refresh token from cookies here.
    // For this design spec, we return a new access token for the authenticated user.
    const tokens = this.authService.login(req.user);
    return { accessToken: tokens.accessToken };
  }

  /**
   * @description Logs the user out of the application.
   * @returns A success status.
   * @throws {UnauthorizedException} If the user is not authenticated.
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): { success: boolean } {
    // Handled mostly by client removing tokens and Redis session invalidation
    return { success: true };
  }
}
