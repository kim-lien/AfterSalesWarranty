
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { DatabaseConfig } from '../config/DatabaseConfig';
import { JwtGuard } from '../guards/JwtGuard';

type AddressInput = {
  tenNguoiNhan: string;
  soDienThoai: string;
  tinhThanh: string;
  quanHuyen?: string;
  phuongXa?: string;
  diaChiChiTiet: string;
  macDinh?: boolean;
};

type RequestUser = {
  userId?: number;
  MaNguoiDung?: number;
  sub?: number;
};

@Controller('addresses')
@UseGuards(JwtGuard)
export class AddressController {
  constructor(private readonly database: DatabaseConfig) {}

  private userId(req: { user: RequestUser }) {
    const id = Number(
      req.user?.userId ??
      req.user?.MaNguoiDung ??
      req.user?.sub,
    );

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    return id;
  }

  private validate(body: AddressInput) {
    if (
      !body?.tenNguoiNhan?.trim() ||
      !/^0\d{9}$/.test(body.soDienThoai?.trim() ?? '') ||
      !body.tinhThanh?.trim() ||
      !body.diaChiChiTiet?.trim()
    ) {
      throw new BadRequestException(
        'Thông tin địa chỉ chưa hợp lệ',
      );
    }
  }

  private bind(
    request: sql.Request,
    userId: number,
    body: AddressInput,
  ) {
    return request
      .input('UserId', sql.Int, userId)
      .input('Ten', sql.NVarChar(100), body.tenNguoiNhan.trim())
      .input('SDT', sql.VarChar(15), body.soDienThoai.trim())
      .input('Tinh', sql.NVarChar(100), body.tinhThanh.trim())
      .input(
        'Quan',
        sql.NVarChar(100),
        body.quanHuyen?.trim() || null,
      )
      .input(
        'Phuong',
        sql.NVarChar(100),
        body.phuongXa?.trim() || null,
      )
      .input(
        'ChiTiet',
        sql.NVarChar(255),
        body.diaChiChiTiet.trim(),
      );
  }

  @Get()
  async list(@Req() req: { user: RequestUser }) {
    const userId = this.userId(req);

    const result = await this.database
      .getConnection()
      .request()
      .input('UserId', sql.Int, userId)
      .query(`
        SELECT
          MaDiaChi,
          TenNguoiNhan,
          SDT,
          TinhThanh,
          QuanHuyen,
          PhuongXa,
          DiaChiChiTiet,
          MacDinh
        FROM dbo.DiaChi
        WHERE MaNguoiDung = @UserId
        ORDER BY MacDinh DESC, MaDiaChi DESC
      `);

    return {
      success: true,
      data: result.recordset,
    };
  }

  @Post()
  async create(
    @Req() req: { user: RequestUser },
    @Body() body: AddressInput,
  ) {
    this.validate(body);

    const userId = this.userId(req);
    const transaction = new sql.Transaction(
      this.database.getConnection(),
    );

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const existing = await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .query(`
          SELECT MaDiaChi
          FROM dbo.DiaChi WITH (UPDLOCK, HOLDLOCK)
          WHERE MaNguoiDung = @UserId
        `);

      const makeDefault =
        body.macDinh === true ||
        existing.recordset.length === 0;

      if (makeDefault) {
        await new sql.Request(transaction)
          .input('UserId', sql.Int, userId)
          .query(`
            UPDATE dbo.DiaChi
            SET MacDinh = 0
            WHERE MaNguoiDung = @UserId
          `);
      }

      const result = await this.bind(
        new sql.Request(transaction),
        userId,
        body,
      )
        .input('MacDinh', sql.Bit, makeDefault)
        .query(`
          INSERT INTO dbo.DiaChi (
            MaNguoiDung,
            TenNguoiNhan,
            SDT,
            TinhThanh,
            QuanHuyen,
            PhuongXa,
            DiaChiChiTiet,
            MacDinh
          )
          OUTPUT INSERTED.MaDiaChi
          VALUES (
            @UserId,
            @Ten,
            @SDT,
            @Tinh,
            @Quan,
            @Phuong,
            @ChiTiet,
            @MacDinh
          )
        `);

      await transaction.commit();

      return {
        success: true,
        maDiaChi: result.recordset[0].MaDiaChi,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Req() req: { user: RequestUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddressInput,
  ) {
    this.validate(body);

    const userId = this.userId(req);
    const transaction = new sql.Transaction(
      this.database.getConnection(),
    );

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const existing = await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .input('Id', sql.Int, id)
        .query(`
          SELECT MaDiaChi, MacDinh
          FROM dbo.DiaChi WITH (UPDLOCK, HOLDLOCK)
          WHERE MaNguoiDung = @UserId
            AND MaDiaChi = @Id
        `);

      if (!existing.recordset.length) {
        throw new BadRequestException(
          'Địa chỉ không tồn tại hoặc không thuộc tài khoản',
        );
      }

      const makeDefault =
        body.macDinh === true ||
        Boolean(existing.recordset[0].MacDinh);

      if (makeDefault) {
        await new sql.Request(transaction)
          .input('UserId', sql.Int, userId)
          .query(`
            UPDATE dbo.DiaChi
            SET MacDinh = 0
            WHERE MaNguoiDung = @UserId
          `);
      }

      await this.bind(
        new sql.Request(transaction),
        userId,
        body,
      )
        .input('Id', sql.Int, id)
        .input('MacDinh', sql.Bit, makeDefault)
        .query(`
          UPDATE dbo.DiaChi
          SET
            TenNguoiNhan = @Ten,
            SDT = @SDT,
            TinhThanh = @Tinh,
            QuanHuyen = @Quan,
            PhuongXa = @Phuong,
            DiaChiChiTiet = @ChiTiet,
            MacDinh = @MacDinh
          WHERE MaDiaChi = @Id
            AND MaNguoiDung = @UserId
        `);

      await transaction.commit();

      return {
        success: true,
        maDiaChi: id,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
