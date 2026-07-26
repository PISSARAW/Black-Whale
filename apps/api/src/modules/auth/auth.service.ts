import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { authSecret } from '../../configuration.js';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateAdmin(password: string): Promise<any> {
    const adminPassword = authSecret(this.configService.get<string>('ADMIN_PASSWORD'), 'ADMIN_PASSWORD');
    const supplied = Buffer.from(password);
    const expected = Buffer.from(adminPassword);
    if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) {
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
