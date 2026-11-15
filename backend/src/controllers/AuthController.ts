
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/AuthService';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body()
    body: {
      tenDangNhap: string;
      matKhau: string;
    },
  ) {
    return this.authService.login(
      body?.tenDangNhap,
      body?.matKhau,
    );
  }

  @Post('register')
  register(
    @Body()
    body: {
      hoTen: string;
      tenDangNhap: string;
      email: string;
      matKhau: string;
      sdt?: string;
    },
  ) {
    return this.authService.register(body);
  }
}
