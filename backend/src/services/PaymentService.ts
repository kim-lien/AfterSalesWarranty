
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { DatabaseConfig } from '../config/DatabaseConfig';

type AuthUser = {
  role?: string;
  TenVaiTro?: string;
};

type ConfirmPaymentInput = {
  maGiaoDich?: string;
  ghiChu?: string;
};

@Injectable()
export class PaymentService {
  constructor(private readonly database: DatabaseConfig) {}

  private checkAdmin(user: AuthUser) {
    if (
      (user.role ?? user.TenVaiTro) !== 'Quản trị viên'
    ) {
      throw new ForbiddenException(
        'Chỉ quản trị viên được xác nhận thanh toán',
      );
    }
  }

  async list(user: AuthUser) {
    this.checkAdmin(user);

    const result = await this.database
      .getConnection()
      .request()
      .query(`
        SELECT
          TT.MaTT,
          TT.MaDH,
          TT.MaDT,
          TT.LoaiThanhToan,
          TT.SoTien,
          TT.PhuongThuc,
          TT.MaGiaoDich,
          TT.TrangThai,
          TT.ThoiGian,
          TT.GhiChu,
          ND.HoTen AS TenKhachHang,
          ND.Email,
          COALESCE(DH.TrangThai, DT.TrangThai) AS TrangThaiDon
        FROM dbo.ThanhToan TT
        LEFT JOIN dbo.DonHang DH ON DH.MaDH = TT.MaDH
        LEFT JOIN dbo.DonThue DT ON DT.MaDT = TT.MaDT
        LEFT JOIN dbo.KhachHang KH
          ON KH.MaKH = COALESCE(DH.MaKH, DT.MaKH)
        LEFT JOIN dbo.NguoiDung ND
          ON ND.MaNguoiDung = KH.MaNguoiDung
        ORDER BY
          CASE WHEN TT.TrangThai = N'Chờ thanh toán'
            THEN 0 ELSE 1 END,
          TT.MaTT DESC
      `);

    return {
      success: true,
      data: result.recordset,
    };
  }

  async confirm(
    user: AuthUser,
    maTT: number,
    body: ConfirmPaymentInput,
  ) {
    this.checkAdmin(user);

    if (!Number.isSafeInteger(maTT) || maTT <= 0) {
      throw new BadRequestException('Mã thanh toán không hợp lệ');
    }

    const maGiaoDich = body?.maGiaoDich?.trim() || '';
    const ghiChu = body?.ghiChu?.trim() || '';

    if (maGiaoDich.length > 150 || ghiChu.length > 500) {
      throw new BadRequestException(
        'Mã giao dịch hoặc ghi chú quá dài',
      );
    }

    const transaction = new sql.Transaction(
      this.database.getConnection(),
    );

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const paymentResult = await new sql.Request(transaction)
        .input('MaTT', sql.Int, maTT)
        .query(`
          SELECT
            MaTT,
            MaDH,
            MaDT,
            LoaiThanhToan,
            PhuongThuc,
            SoTien,
            TrangThai
          FROM dbo.ThanhToan WITH (UPDLOCK, HOLDLOCK)
          WHERE MaTT = @MaTT
        `);

      const payment = paymentResult.recordset[0];

      if (!payment) {
        throw new NotFoundException(
          'Không tìm thấy giao dịch thanh toán',
        );
      }

      if (payment.TrangThai !== 'Chờ thanh toán') {
        throw new ConflictException(
          'Giao dịch này không còn ở trạng thái chờ',
        );
      }

      if (
        ['Chuyển khoản', 'VNPay', 'MoMo'].includes(payment.PhuongThuc) &&
        !maGiaoDich
      ) {
        throw new BadRequestException(
          'Phải nhập mã giao dịch để đối soát',
        );
      }

      if (
        ['Hoàn tiền', 'Hoàn cọc'].includes(payment.LoaiThanhToan)
      ) {
        throw new BadRequestException(
          'Giao dịch hoàn tiền cần quy trình xác nhận hoàn riêng',
        );
      }

      if (maGiaoDich) {
        const duplicate = await new sql.Request(transaction)
          .input('MaTT', sql.Int, maTT)
          .input(
            'PhuongThuc',
            sql.NVarChar(40),
            payment.PhuongThuc,
          )
          .input('MaGiaoDich', sql.VarChar(150), maGiaoDich)
          .query(`
            SELECT MaTT
            FROM dbo.ThanhToan WITH (UPDLOCK, HOLDLOCK)
            WHERE PhuongThuc = @PhuongThuc
              AND MaGiaoDich = @MaGiaoDich
              AND MaTT <> @MaTT
          `);

        if (duplicate.recordset.length > 0) {
          throw new ConflictException(
            'Mã giao dịch đã được sử dụng',
          );
        }
      }

      const updateResult = await new sql.Request(transaction)
        .input('MaTT', sql.Int, maTT)
        .input(
          'MaGiaoDich',
          sql.VarChar(150),
          maGiaoDich || null,
        )
        .input('GhiChu', sql.NVarChar(500), ghiChu || null)
        .query(`
          UPDATE dbo.ThanhToan
          SET TrangThai = N'Đã thanh toán',
              MaGiaoDich = @MaGiaoDich,
              GhiChu = @GhiChu
          WHERE MaTT = @MaTT
            AND TrangThai = N'Chờ thanh toán';

          SELECT @@ROWCOUNT AS UpdatedCount;
        `);

      if (Number(updateResult.recordset[0]?.UpdatedCount) !== 1) {
        throw new ConflictException(
          'Giao dịch đã được xử lý',
        );
      }

      if (payment.MaDH !== null) {
        const orderResult = await new sql.Request(transaction)
          .input('MaDH', sql.Int, payment.MaDH)
          .query(`
            SELECT
              DH.MaDH,
              DH.TrangThai,
              DH.GiamGiaDon,
              DH.PhiVanChuyen,
              COALESCE(CT.TongTienHang, 0) AS TongTienHang,
              COALESCE(TT.DaThanhToan, 0) AS DaThanhToan
            FROM dbo.DonHang DH WITH (UPDLOCK, HOLDLOCK)
            OUTER APPLY (
              SELECT SUM(ThanhTien) AS TongTienHang
              FROM dbo.ChiTietDonHang
              WHERE MaDH = DH.MaDH
            ) CT
            OUTER APPLY (
              SELECT SUM(SoTien) AS DaThanhToan
              FROM dbo.ThanhToan
              WHERE MaDH = DH.MaDH
                AND LoaiThanhToan = N'Mua hàng'
                AND TrangThai = N'Đã thanh toán'
            ) TT
            WHERE DH.MaDH = @MaDH
          `);

        const order = orderResult.recordset[0];

        if (!order || order.TrangThai === 'Đã hủy') {
          throw new BadRequestException(
            'Không thể xác nhận thanh toán cho đơn đã hủy',
          );
        }

        const totalDue = Math.max(
          0,
          Number(order.TongTienHang) +
          Number(order.PhiVanChuyen) -
          Number(order.GiamGiaDon),
        );

        const paid = Number(order.DaThanhToan);

        const status =
          paid >= totalDue
            ? 'Đã thanh toán'
            : paid > 0
              ? 'Thanh toán một phần'
              : 'Chưa thanh toán';

        await new sql.Request(transaction)
          .input('MaDH', sql.Int, payment.MaDH)
          .input('TrangThai', sql.NVarChar(40), status)
          .query(`
            UPDATE dbo.DonHang
            SET TrangThaiThanhToan = @TrangThai,
                NgayCapNhat = SYSDATETIME()
            WHERE MaDH = @MaDH
          `);
      }

      if (payment.MaDT !== null) {
        const rentalResult = await new sql.Request(transaction)
          .input('MaDT', sql.Int, payment.MaDT)
          .query(`
            SELECT
              DT.MaDT,
              DT.TrangThai,
              DT.TienCocDuKien,
              COALESCE(SUM(
                CASE
                  WHEN TT.LoaiThanhToan = N'Đặt cọc'
                   AND TT.TrangThai = N'Đã thanh toán'
                  THEN TT.SoTien
                  ELSE 0
                END
              ), 0) AS CocDaThu
            FROM dbo.DonThue DT WITH (UPDLOCK, HOLDLOCK)
            LEFT JOIN dbo.ThanhToan TT ON TT.MaDT = DT.MaDT
            WHERE DT.MaDT = @MaDT
            GROUP BY
              DT.MaDT,
              DT.TrangThai,
              DT.TienCocDuKien
          `);

        const rental = rentalResult.recordset[0];

        if (!rental || rental.TrangThai === 'Đã hủy') {
          throw new BadRequestException(
            'Không thể xác nhận thanh toán đơn thuê đã hủy',
          );
        }

        const paidDeposit = Number(rental.CocDaThu);
        const expectedDeposit = Number(rental.TienCocDuKien);

        const depositStatus =
          paidDeposit >= expectedDeposit && expectedDeposit > 0
            ? 'Đã thu'
            : 'Chưa thu';

        if (payment.LoaiThanhToan === 'Đặt cọc') {
          await new sql.Request(transaction)
            .input('MaDT', sql.Int, payment.MaDT)
            .input(
              'CocDaThu',
              sql.Decimal(18, 2),
              paidDeposit,
            )
            .input(
              'TrangThaiCoc',
              sql.NVarChar(40),
              depositStatus,
            )
            .query(`
              UPDATE dbo.DonThue
              SET TienCocDaThu = @CocDaThu,
                  TrangThaiCoc = @TrangThaiCoc
              WHERE MaDT = @MaDT
            `);
        }
      }

      await transaction.commit();

      return {
        success: true,
        message: 'Đã xác nhận thanh toán',
        maTT,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
