
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard, CurrentUser } from '../guards/JwtGuard';
import { SupportService } from '../services/SupportService';

type UserRequest = {
  user: CurrentUser;
};

@Controller('support')
@UseGuards(JwtGuard)
export class SupportController {
  constructor(
    private readonly support: SupportService,
  ) {}

@Get('policies')
policies(
  @Req() req: UserRequest,
  @Query('loaiDon') loaiDon: string,
  @Query('maDon', ParseIntPipe) maDon: number,
  @Query('maChiTiet', ParseIntPipe) maChiTiet: number,
  @Query('nhomYeuCau') nhomYeuCau: string,
) {
  return this.support.policies(
    req.user,
    loaiDon,
    maDon,
    maChiTiet,
    nhomYeuCau,
  );
}

  @Get('channels')
  channels() {
    return this.support.channels();
  }

  @Get('employees')
  employees(@Req() req: UserRequest) {
    return this.support.employees(req.user);
  }

  @Get('orders')
  orders(@Req() req: UserRequest) {
    return this.support.orders(req.user);
  }

  @Get('dashboard')
  dashboard(@Req() req: UserRequest) {
    return this.support.dashboard(req.user);
  }

  @Get('sla')
  sla(@Req() req: UserRequest) {
    return this.support.sla(req.user);
  }

  @Get('tickets')
  list(
    @Req() req: UserRequest,
    @Query('group') group?: string,
  ) {
    return this.support.list(req.user, group);
  }

  @Get('tickets/:id')
  detail(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.support.detail(req.user, id);
  }

  @Post('tickets')
  create(
    @Req() req: UserRequest,
    @Body() body: any,
  ) {
    return this.support.create(req.user, body);
  }

  @Patch('tickets/:id/assign')
  assign(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { maNV: number },
  ) {
    return this.support.assign(
      req.user,
      id,
      body.maNV,
    );
  }

  @Patch('tickets/:id/status')
  status(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      trangThai: string;
      lyDo: string;
    },
  ) {
    return this.support.updateStatus(
      req.user,
      id,
      body.trangThai,
      body.lyDo,
    );
  }

  @Post('tickets/:id/messages')
  message(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      maKenh: number;
      noiDung: string;
    },
  ) {
    return this.support.message(
      req.user,
      id,
      body.maKenh,
      body.noiDung,
    );
  }

  @Post('tickets/:id/warranty')
  createWarranty(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.support.createWarranty(req.user, id);
  }

  @Patch('tickets/:id/warranty')
  warranty(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      ketLuan: 'Đủ điều kiện' | 'Từ chối';
      ketQua: string;
    },
  ) {
    return this.support.warranty(
      req.user,
      id,
      body.ketLuan,
      body.ketQua,
    );
  }

  @Patch('tickets/:id/warranty/inspect')
  inspectWarranty(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      nguyenNhan: string;
      ketQuaKiemTra: string;
      huongXuLy: string;
    },
  ) {
    return this.support.inspectWarranty(
      req.user,
      id,
      body,
    );
  }

  @Patch('tickets/:id/warranty/process')
  processWarranty(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      nguyenNhan: string;
      ketQuaKiemTra: string;
      huongXuLy: string;
      trangThai: string;
    },
  ) {
    return this.support.processWarranty(
      req.user,
      id,
      body,
    );
  }
  @Get('appointments')
listAppointments(@Req() req: UserRequest) {
  return this.support.listAppointments(req.user);
}
  @Get('tickets/:id/appointments')
  appointments(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.support.appointments(req.user, id);
  }

  @Post('tickets/:id/appointments')
createAppointment(
  @Req() req: UserRequest,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: {
    maNV: number;
    loaiCongViec: string;
    ngayHen: string;
    diaDiem?: string;
  },
) {
  return this.support.createAppointment(
    req.user,
    id,
    body,
  );
}

@Post('tickets/:id/images')
addImage(
  @Req() req: UserRequest,
  @Param('id', ParseIntPipe) id: number,
  @Body() body: { dataUrl: string },
) {
  return this.support.addImage(
    req.user,
    id,
    body.dataUrl,
  );
}

@Get('tickets/:id/images')
images(
  @Req() req: UserRequest,
  @Param('id', ParseIntPipe) id: number,
) {
  return this.support.ticketImages(req.user, id);
}

  @Patch('appointments/:id')
  updateAppointment(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      trangThai: string;
      ketQua?: string;
    },
  ) {
    return this.support.updateAppointment(
      req.user,
      id,
      body,
    );
  }

  @Patch('tickets/:id/aftersales/complete')
  completeAfterSales(
    @Req() req: UserRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ketQua: string },
  ) {
    return this.support.completeAfterSales(
      req.user,
      id,
      body.ketQua,
    );
  }
}
