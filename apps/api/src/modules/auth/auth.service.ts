import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateAdmin(password: string): Promise<any> {
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'admin';
    if (password === adminPassword) {
      return { role: 'admin' };
    }
    return null;
  }

  async login(user: any) {
    const payload = { role: user.role, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
