
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../guards/JwtGuard';
import { PaymentService } from '../services/PaymentService';

type AuthUser = {
  role?: string;
  TenVaiTro?: string;
};

@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Get()
  list(@Req() req: { user: AuthUser }) {
    return this.paymentService.list(req.user);
  }

  @Patch(':id/confirm')
  confirm(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      maGiaoDich?: string;
      ghiChu?: string;
    },
  ) {
    return this.paymentService.confirm(req.user, id, body);
  }
}
