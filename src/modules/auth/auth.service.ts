import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../shared/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload, RoleCode } from '../shared/types';

@Injectable()
export class AuthService {
  constructor(
    @(InjectRepository(User) as ParameterDecorator)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      return user;
    }
    return null;
  }

  private getRoleCode(roleId: number): RoleCode {
    const map: Record<number, RoleCode> = {
      1: RoleCode.APPLICANT,
      2: RoleCode.MANAGER,
      3: RoleCode.APPROVER,
      4: RoleCode.ACCOUNTING,
      5: RoleCode.ADMIN,
    };
    return map[roleId] || RoleCode.APPLICANT;
  }

  async login(user: User) {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.userId,
      email: user.email,
      role: this.getRoleCode(user.roleId),
      roleId: user.roleId,
      branch: user.branch,
      employeeNumber: user.employeeNumber,
      fullName: user.fullName,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiration',
        ) as any,
      }),
      user: payload,
    };
  }
}
