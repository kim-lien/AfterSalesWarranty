
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
import { JwtGuard, CurrentUser } from '../guards/JwtGuard';
import { OrderService } from '../services/OrderService';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getOrders(@Req() req: { user: CurrentUser }) {
    return this.orderService.list(req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trangThai: string },
  ) {
    return this.orderService.updateStatus(
      req.user,
      id,
      body?.trangThai,
    );
  }
}
