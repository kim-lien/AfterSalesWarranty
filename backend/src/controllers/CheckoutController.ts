
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../guards/JwtGuard';
import { CheckoutService } from '../services/CheckoutService';
import type { CheckoutRequest } from '../services/CheckoutService';

type AuthenticatedRequest = {
  user: {
    userId?: number;
    MaNguoiDung?: number;
    sub?: number;
    role?: string;
    TenVaiTro?: string;
  };
};

@Controller('checkout')
@UseGuards(JwtGuard)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
  ) {}

  @Post('place-order')
  placeOrder(
    @Req() request: AuthenticatedRequest,
    @Body() body: CheckoutRequest,
  ) {
    return this.checkoutService.placeOrder(
      request.user,
      body,
    );
  }

  @Get('my-orders')
  myOrders(@Req() request: AuthenticatedRequest) {
    return this.checkoutService.myOrders(request.user);
  }
  
}
