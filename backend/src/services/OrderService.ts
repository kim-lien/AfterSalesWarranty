
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { DatabaseConfig } from '../config/DatabaseConfig';
import { CurrentUser } from '../guards/JwtGuard';

@Injectable()
export class OrderService {
  constructor(private readonly database: DatabaseConfig) {}

  private checkPermission(user: CurrentUser) {
    if (!['Quản trị viên', 'Nhân viên'].includes(user.role)) {
      throw new ForbiddenException('Không có quyền quản lý đơn hàng');
    }
  }

  async list(user: CurrentUser) {
    this.checkPermission(user);

    const result = await this.database.getConnection().request().query(`
      SELECT
        DH.MaDH,
        DH.MaKH,
        ND.HoTen AS TenKhachHang,
        DH.TrangThai,
        DH.TrangThaiThanhToan,
        DH.NgayDat,
        DH.NgayGiaoDuKien,
        DH.NgayGiaoThucTe,
        DH.MaNV
      FROM dbo.DonHang DH
      JOIN dbo.KhachHang KH ON KH.MaKH = DH.MaKH
      JOIN dbo.NguoiDung ND ON ND.MaNguoiDung = KH.MaNguoiDung
      ORDER BY DH.NgayDat DESC, DH.MaDH DESC
    `);

    return result.recordset;
  }

  async updateStatus(
    user: CurrentUser,
    maDH: number,
    newStatus: string,
  ) {
    this.checkPermission(user);

    if (!Number.isSafeInteger(maDH) || maDH <= 0) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ');
    }

    const nextStatus: Record<string, string> = {
      'Chờ xác nhận': 'Đã xác nhận',
      'Đã xác nhận': 'Đang chuẩn bị',
      'Đang chuẩn bị': 'Đang giao',
      'Đang giao': 'Đã giao',
    };

    const pool = this.database.getConnection();
    const transaction = new sql.Transaction(pool);

    await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

    try {
      const currentResult = await new sql.Request(transaction)
        .input('MaDH', sql.Int, maDH)
        .query(`
          SELECT MaDH, TrangThai, TrangThaiThanhToan
          FROM dbo.DonHang WITH (UPDLOCK, HOLDLOCK)
          WHERE MaDH = @MaDH
        `);

      const order = currentResult.recordset[0];

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      if (nextStatus[order.TrangThai] !== newStatus) {
        throw new BadRequestException(
          `Không thể chuyển từ "${order.TrangThai}" sang "${newStatus}"`,
        );
      }

      if (
        newStatus === 'Đã giao' &&
        order.TrangThaiThanhToan !== 'Đã thanh toán'
      ) {
        throw new BadRequestException(
          'Chưa thể hoàn tất giao hàng vì chưa xác nhận thanh toán. Cần kiểm tra giao dịch thực tế.',
        );
      }

      const result = await new sql.Request(transaction)
        .input('MaDH', sql.Int, maDH)
        .input('TrangThai', sql.NVarChar(40), newStatus)
        .query(`
          UPDATE dbo.DonHang
          SET TrangThai = @TrangThai,
              NgayGiaoThucTe = CASE
                WHEN @TrangThai = N'Đã giao'
                THEN SYSDATETIME()
                ELSE NgayGiaoThucTe
              END,
              NgayCapNhat = SYSDATETIME()
          WHERE MaDH = @MaDH;

          SELECT
            MaDH,
            TrangThai,
            TrangThaiThanhToan,
            NgayGiaoThucTe
          FROM dbo.DonHang
          WHERE MaDH = @MaDH;
        `);

      await transaction.commit();

      return {
        success: true,
        data: result.recordset[0],
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
