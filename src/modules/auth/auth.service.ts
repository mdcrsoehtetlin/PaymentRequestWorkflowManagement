import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../shared/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email: loginDto.email, isActive: true } });
    if (user && await bcrypt.compare(loginDto.password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { 
      sub: user.userId, 
      email: user.email, 
      roleId: user.roleId, 
      branch: user.branch,
      employeeNumber: user.employeeNumber,
      fullName: user.fullName
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: payload
    };
  }
}
