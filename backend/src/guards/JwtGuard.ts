
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface CurrentUser {
  sub: number;
  role: string;
  maKH: number | null;
  maNV: number | null;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization ?? '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';

    if (!token) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    try {
      request.user = await this.jwt.verifyAsync<CurrentUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
  }
}
