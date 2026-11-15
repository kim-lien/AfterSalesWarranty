
import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { JwtGuard } from '../guards/JwtGuard';
import { DatabaseConfig } from '../config/DatabaseConfig';


type AuthUser = {
  role?: string;
  TenVaiTro?: string;
  maNV?: number;
};

@Controller('rentals')
@UseGuards(JwtGuard)
export class RentalController {
  constructor(
    private readonly database: DatabaseConfig,
  ) {}

  private checkPermission(user: AuthUser) {
    const role = user.role ?? user.TenVaiTro;

    if (
      role !== 'Quản trị viên' &&
      role !== 'Nhân viên'
    ) {
      throw new ForbiddenException(
        'Không có quyền quản lý đơn thuê',
      );
    }

    if (
      role === 'Nhân viên' &&
      (!Number.isSafeInteger(user.maNV) || !user.maNV)
    ) {
      throw new ForbiddenException(
        'Tài khoản chưa có thông tin nhân viên',
      );
    }
  }

  @Get()
  async list(@Req() req: { user: AuthUser }) {
    this.checkPermission(req.user);

    const role = req.user.role ?? req.user.TenVaiTro;
    const request = this.database.getConnection().request();

    let condition = '';

    if (role === 'Nhân viên') {
      condition = 'WHERE DT.MaNV = @MaNV';
      request.input('MaNV', sql.Int, req.user.maNV);
    }

    const result = await request.query(`
      SELECT
        DT.MaDT,
        DT.MaKH,
        DT.MaNV,
        ND.HoTen AS TenKhachHang,
        DT.MaHopDong,
        DT.NgayBatDau,
        DT.NgayKetThuc,
        DT.NgayGiaoThucTe,
        DT.NgayTraThucTe,
        DT.NgayTao,
        DT.GoiThue,
        DT.TrangThai,
        DT.TrangThaiCoc,
        DT.TienCocDuKien,
        DT.TienCocDaThu,
        DT.PhiGoiGoc,
        DT.GiamGiaGoi,
        DT.PhiVanChuyen,
        DT.PhiKhac,
        DC.TenNguoiNhan,
        DC.SDT,
        DC.TinhThanh,
        DC.DiaChiChiTiet,
        COALESCE(CT.SoLuongCay, 0) AS SoLuongCay,
        COALESCE(CT.TienThue, 0) AS TienThue,
        COALESCE(TT.TongPhaiThu, 0) AS TongPhaiThu,
        COALESCE(TT.DaThanhToan, 0) AS DaThanhToan
      FROM dbo.DonThue DT
      JOIN dbo.KhachHang KH
        ON KH.MaKH = DT.MaKH
      JOIN dbo.NguoiDung ND
        ON ND.MaNguoiDung = KH.MaNguoiDung
      JOIN dbo.DiaChi DC
        ON DC.MaDiaChi = DT.MaDiaChiGiao
      OUTER APPLY (
        SELECT
          SUM(CTDT.SoLuong) AS SoLuongCay,
          SUM(
            CTDT.SoLuong * CTDT.GiaThueTheoNgay
          ) * DATEDIFF(
            DAY,
            DT.NgayBatDau,
            DT.NgayKetThuc
          ) AS TienThue
        FROM dbo.ChiTietDonThue CTDT
        WHERE CTDT.MaDT = DT.MaDT
      ) CT
      OUTER APPLY (
        SELECT
          SUM(
            CASE
              WHEN T.LoaiThanhToan IN (
                N'Đặt cọc',
                N'Tiền thuê',
                N'Dịch vụ'
              )
              AND T.TrangThai IN (
                N'Chờ thanh toán',
                N'Đã thanh toán'
              )
              THEN T.SoTien
              ELSE 0
            END
          ) AS TongPhaiThu,
          SUM(
            CASE
              WHEN T.TrangThai = N'Đã thanh toán'
              AND T.LoaiThanhToan IN (
                N'Đặt cọc',
                N'Tiền thuê',
                N'Dịch vụ'
              )
              THEN T.SoTien
              ELSE 0
            END
          ) AS DaThanhToan
        FROM dbo.ThanhToan T
        WHERE T.MaDT = DT.MaDT
      ) TT
      ${condition}
      ORDER BY DT.NgayTao DESC, DT.MaDT DESC
    `);

    return {
      success: true,
      total: result.recordset.length,
      data: result.recordset,
    };
  }

@Get('employees')
async employees(@Req() req: { user: AuthUser }) {
  const role = req.user.role ?? req.user.TenVaiTro;

  if (role !== 'Quản trị viên') {
    throw new ForbiddenException(
      'Chỉ quản trị viên được xem danh sách phân công',
    );
  }

  const result = await this.database
    .getConnection()
    .request()
    .query(`
      SELECT
        NV.MaNV,
        ND.HoTen,
        NV.ChucVu
      FROM dbo.NhanVien NV
      JOIN dbo.NguoiDung ND
        ON ND.MaNguoiDung = NV.MaNguoiDung
      WHERE NV.TrangThai = 1
      ORDER BY ND.HoTen, NV.MaNV
    `);

  return {
    success: true,
    data: result.recordset,
  };
}

@Patch(':id/assign')
async assign(
  @Req() req: { user: AuthUser },
  @Param('id', ParseIntPipe) id: number,
  @Body() body: { maNV: number },
) {
  const role = req.user.role ?? req.user.TenVaiTro;

  if (role !== 'Quản trị viên') {
    throw new ForbiddenException(
      'Chỉ quản trị viên được phân công đơn thuê',
    );
  }

  const maNV = Number(body?.maNV);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !Number.isSafeInteger(maNV) ||
    maNV <= 0
  ) {
    throw new BadRequestException(
      'Mã đơn thuê hoặc mã nhân viên không hợp lệ',
    );
  }

  const transaction = new sql.Transaction(
    this.database.getConnection(),
  );

  await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

  try {
    const employeeResult = await new sql.Request(transaction)
      .input('MaNV', sql.Int, maNV)
      .query(`
        SELECT MaNV
        FROM dbo.NhanVien
        WHERE MaNV = @MaNV
          AND TrangThai = 1
      `);

    if (employeeResult.recordset.length === 0) {
      throw new BadRequestException(
        'Nhân viên không tồn tại hoặc đã ngừng hoạt động',
      );
    }

    const orderResult = await new sql.Request(transaction)
      .input('MaDT', sql.Int, id)
      .query(`
        SELECT
          MaDT,
          MaNV,
          TrangThai
        FROM dbo.DonThue WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDT = @MaDT
      `);

    const order = orderResult.recordset[0];

    if (!order) {
      throw new NotFoundException(
        'Không tìm thấy đơn thuê',
      );
    }

    if (['Đã trả', 'Đã hủy'].includes(order.TrangThai)) {
      throw new BadRequestException(
        'Không thể phân công đơn thuê đã kết thúc',
      );
    }

    await new sql.Request(transaction)
      .input('MaDT', sql.Int, id)
      .input('MaNV', sql.Int, maNV)
      .query(`
        UPDATE dbo.DonThue
        SET MaNV = @MaNV
        WHERE MaDT = @MaDT
      `);

    await transaction.commit();

    return {
      success: true,
      message: 'Đã phân công nhân viên xử lý đơn thuê',
      maDT: id,
      maNV,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

  @Get(':id')
  async detail(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.checkPermission(req.user);

    const request = this.database
      .getConnection()
      .request()
      .input('MaDT', sql.Int, id);

    const role = req.user.role ?? req.user.TenVaiTro;

    let condition = '';

    if (role === 'Nhân viên') {
      condition = 'AND DT.MaNV = @MaNV';
      request.input('MaNV', sql.Int, req.user.maNV);
    }

    const orderResult = await request.query(`
      SELECT
        DT.*,
        ND.HoTen AS TenKhachHang,
        DC.TenNguoiNhan,
        DC.SDT,
        DC.TinhThanh,
        DC.QuanHuyen,
        DC.PhuongXa,
        DC.DiaChiChiTiet
      FROM dbo.DonThue DT
      JOIN dbo.KhachHang KH
        ON KH.MaKH = DT.MaKH
      JOIN dbo.NguoiDung ND
        ON ND.MaNguoiDung = KH.MaNguoiDung
      JOIN dbo.DiaChi DC
        ON DC.MaDiaChi = DT.MaDiaChiGiao
      WHERE DT.MaDT = @MaDT
      ${condition}
    `);

    if (!orderResult.recordset.length) {
      throw new NotFoundException(
        'Không tìm thấy đơn thuê thuộc quyền quản lý',
      );
    }

    const itemsResult = await this.database
      .getConnection()
      .request()
      .input('MaDT', sql.Int, id)
      .query(`
        SELECT
          CT.MaCTDT,
          CT.MaSP,
          SP.TenSP,
          SP.HinhAnh,
          CT.SoLuong,
          CT.GiaThueTheoNgay,
          CT.GiaTriCayKhiGiao,
          CT.TienCoc,
          CT.TinhTrangKhiGiao,
          CT.TinhTrangKhiTra
        FROM dbo.ChiTietDonThue CT
        JOIN dbo.SanPham SP
          ON SP.MaSP = CT.MaSP
        WHERE CT.MaDT = @MaDT
        ORDER BY CT.MaCTDT
      `);

    const paymentsResult = await this.database
      .getConnection()
      .request()
      .input('MaDT', sql.Int, id)
      .query(`
        SELECT
          MaTT,
          LoaiThanhToan,
          SoTien,
          PhuongThuc,
          MaGiaoDich,
          TrangThai,
          ThoiGian
        FROM dbo.ThanhToan
        WHERE MaDT = @MaDT
        ORDER BY MaTT DESC
      `);

    return {
      success: true,
      data: {
        order: orderResult.recordset[0],
        items: itemsResult.recordset,
        payments: paymentsResult.recordset,
      },
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: { user: AuthUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { trangThai: string },
  ) {
    this.checkPermission(req.user);

    const transitions: Record<string, string> = {
      'Chờ xác nhận': 'Đã xác nhận',
      'Đã xác nhận': 'Đang thuê',
      'Đang thuê': 'Chờ trả cây',
      'Chờ trả cây': 'Đã trả',
    };

    const newStatus = body?.trangThai;

    if (
      typeof newStatus !== 'string' ||
      !Object.values(transitions).includes(newStatus)
    ) {
      throw new BadRequestException(
        'Trạng thái đơn thuê không hợp lệ',
      );
    }

    const role = req.user.role ?? req.user.TenVaiTro;

    const transaction = new sql.Transaction(
      this.database.getConnection(),
    );

    await transaction.begin(
      sql.ISOLATION_LEVEL.SERIALIZABLE,
    );

    try {
      const request = new sql.Request(transaction)
        .input('MaDT', sql.Int, id);

      let condition = '';

      if (role === 'Nhân viên') {
        condition = 'AND MaNV = @MaNV';
        request.input('MaNV', sql.Int, req.user.maNV);
      }

      const currentResult = await request.query(`
        SELECT
          MaDT,
          MaNV,
          TrangThai,
          TrangThaiCoc,
          TienCocDuKien,
          TienCocDaThu,
          NgayBatDau,
          NgayGiaoThucTe,
          NgayTraThucTe
        FROM dbo.DonThue WITH (UPDLOCK, HOLDLOCK)
        WHERE MaDT = @MaDT
        ${condition}
      `);

      const order = currentResult.recordset[0];

      if (!order) {
        throw new NotFoundException(
          'Không tìm thấy đơn thuê thuộc quyền xử lý',
        );
      }

      if (transitions[order.TrangThai] !== newStatus) {
        throw new BadRequestException(
          `Không thể chuyển từ "${order.TrangThai}" sang "${newStatus}"`,
        );
      }

      if (newStatus === 'Đang thuê') {
        if (
          order.TrangThaiCoc !== 'Đã thu' ||
          Number(order.TienCocDaThu) <
            Number(order.TienCocDuKien)
        ) {
          throw new BadRequestException(
            'Phải xác nhận đã thu đủ tiền cọc trước khi bàn giao cây',
          );
        }

        const paymentResult = await new sql.Request(transaction)
          .input('MaDT', sql.Int, id)
          .query(`
            SELECT
              COALESCE(SUM(
                CASE
                  WHEN LoaiThanhToan IN (
                    N'Đặt cọc',
                    N'Tiền thuê',
                    N'Dịch vụ'
                  )
                  AND TrangThai IN (
                    N'Chờ thanh toán',
                    N'Đã thanh toán'
                  )
                  THEN SoTien
                  ELSE 0
                END
              ), 0) AS TongPhaiThu,
              COALESCE(SUM(
                CASE
                  WHEN LoaiThanhToan IN (
                    N'Đặt cọc',
                    N'Tiền thuê',
                    N'Dịch vụ'
                  )
                  AND TrangThai = N'Đã thanh toán'
                  THEN SoTien
                  ELSE 0
                END
              ), 0) AS DaThanhToan
            FROM dbo.ThanhToan WITH (UPDLOCK, HOLDLOCK)
            WHERE MaDT = @MaDT
          `);

        const payment = paymentResult.recordset[0];

        if (
          Number(payment.TongPhaiThu) <= 0 ||
          Number(payment.DaThanhToan) <
            Number(payment.TongPhaiThu)
        ) {
          throw new BadRequestException(
            'Chưa xác nhận đủ tiền thuê, tiền cọc và phí dịch vụ',
          );
        }
      }

      const updated = await new sql.Request(transaction)
        .input('MaDT', sql.Int, id)
        .input(
          'TrangThaiCu',
          sql.NVarChar(40),
          order.TrangThai,
        )
        .input(
          'TrangThaiMoi',
          sql.NVarChar(40),
          newStatus,
        )
        .query(`
          UPDATE dbo.DonThue
          SET
            TrangThai = @TrangThaiMoi,
            NgayGiaoThucTe = CASE
              WHEN @TrangThaiMoi = N'Đang thuê'
              THEN SYSDATETIME()
              ELSE NgayGiaoThucTe
            END,
            NgayTraThucTe = CASE
              WHEN @TrangThaiMoi = N'Đã trả'
              THEN SYSDATETIME()
              ELSE NgayTraThucTe
            END,
            NgayXacNhanHopDong = CASE
              WHEN @TrangThaiMoi = N'Đã xác nhận'
              THEN COALESCE(
                NgayXacNhanHopDong,
                SYSDATETIME()
              )
              ELSE NgayXacNhanHopDong
            END
          WHERE MaDT = @MaDT
            AND TrangThai = @TrangThaiCu;

          SELECT @@ROWCOUNT AS SoDong;
        `);

      if (updated.recordset[0]?.SoDong !== 1) {
        throw new ConflictException(
          'Đơn thuê đã được cập nhật bởi người khác',
        );
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Đã cập nhật trạng thái đơn thuê',
        maDT: id,
        trangThai: newStatus,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
}
