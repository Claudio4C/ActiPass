import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';

interface LocalUser {
  id: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  status: 'active' | 'suspended' | 'pending';
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<LocalUser> {
    try {
      const user = await this.authService.validateUser(email, password);
      return user as LocalUser;
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
