
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { randomUUID } from 'crypto';
import { DatabaseConfig } from '../config/DatabaseConfig';

type CheckoutItem = {
  maSP: number;
  loaiGiaoDich: 'Mua' | 'Thuê';
  soLuong: number;
  ngayBatDauThue?: string | null;
  ngayKetThucThue?: string | null;
  goiThue?: string | null;
};

type CheckoutDelivery = {
  tenNguoiNhan: string;
  soDienThoai: string;
  tinhThanh: string;
  quanHuyen?: string;
  phuongXa?: string;
  diaChiChiTiet: string;
  ghiChu?: string;
  hinhThucNhan?: string;
};


export type CheckoutRequest = {
  maDiaChi?: number;
  items: CheckoutItem[];
  delivery: CheckoutDelivery;
  paymentMethod: 'Chuyển khoản' | 'Thanh toán khi nhận hàng';
};


type AuthenticatedUser = {
  userId?: number;
  MaNguoiDung?: number;
  sub?: number;
  role?: string;
  TenVaiTro?: string;
};

@Injectable()
export class CheckoutService {
  constructor(private readonly database: DatabaseConfig) {}

  private validateDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('Ngày thuê không đúng định dạng');
    }

    const date = new Date(`${value}T00:00:00Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('Ngày thuê không hợp lệ');
    }

    return date;
  }

  async placeOrder(user: AuthenticatedUser, body: CheckoutRequest) {
    const userId = Number(
      user.userId ?? user.MaNguoiDung ?? user.sub,
    );

    const role = user.role ?? user.TenVaiTro;

    if (role !== 'Khách hàng') {
      throw new ForbiddenException(
        'Chỉ khách hàng mới được đặt mua hoặc thuê',
      );
    }

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new ForbiddenException('Phiên đăng nhập không hợp lệ');
    }

    if (
      !body ||
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 100
    ) {
      throw new BadRequestException('Giỏ hàng không hợp lệ');
    }

    const delivery = body.delivery;

    if (
      !delivery?.tenNguoiNhan?.trim() ||
      !/^0\d{9}$/.test(delivery.soDienThoai?.trim() ?? '') ||
      !delivery.tinhThanh?.trim() ||
      !delivery.diaChiChiTiet?.trim()
    ) {
      throw new BadRequestException(
        'Vui lòng nhập đầy đủ thông tin giao nhận',
      );
    }

    if (
      delivery.hinhThucNhan &&
      delivery.hinhThucNhan !== 'Giao tận nơi'
    ) {
      throw new BadRequestException(
        'Hiện chỉ hỗ trợ đặt giao tận nơi',
      );
    }

    if (
      !['Chuyển khoản', 'Thanh toán khi nhận hàng'].includes(
        body.paymentMethod,
      )
    ) {
      throw new BadRequestException(
        'Phương thức thanh toán không hợp lệ',
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const uniqueItems = new Set<string>();

    for (const item of body.items) {
      if (
        !Number.isSafeInteger(item.maSP) ||
        item.maSP <= 0 ||
        !Number.isSafeInteger(item.soLuong) ||
        item.soLuong < 1 ||
        item.soLuong > 99
      ) {
        throw new BadRequestException(
          'Sản phẩm hoặc số lượng không hợp lệ',
        );
      }

      if (!['Mua', 'Thuê'].includes(item.loaiGiaoDich)) {
        throw new BadRequestException('Loại giao dịch không hợp lệ');
      }

      let key = `Mua:${item.maSP}`;

      if (item.loaiGiaoDich === 'Thuê') {
        const start = item.ngayBatDauThue;
        const end = item.ngayKetThucThue;

        if (!start || !end) {
          throw new BadRequestException('Thiếu ngày thuê');
        }

        const startDate = this.validateDate(start);
        const endDate = this.validateDate(end);

        const days = Math.round(
          (endDate.getTime() - startDate.getTime()) / 86400000,
        );

        if (start < today || days < 1 || days > 365) {
          throw new BadRequestException(
            'Thời gian thuê không hợp lệ',
          );
        }

       
if (!['Cơ bản', 'Cao cấp'].includes(item.goiThue ?? '')) {
  throw new BadRequestException(
    'Gói thuê phải là Cơ bản hoặc Cao cấp',
  );
}

if (item.goiThue === 'Cao cấp' && days < 15) {
  throw new BadRequestException(
    'Gói Cao cấp yêu cầu thời gian thuê ít nhất 15 ngày',
  );
}


        key = `Thuê:${item.maSP}:${start}:${end}:${item.goiThue}`;
      }

      if (uniqueItems.has(key)) {
        throw new BadRequestException(
          'Giỏ hàng có sản phẩm bị lặp',
        );
      }

      uniqueItems.add(key);
    }

    const transaction = new sql.Transaction(
      this.database.getConnection(),
    );

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const customerResult = await new sql.Request(transaction)
        .input('UserId', sql.Int, userId)
        .query(`
          SELECT MaKH
          FROM dbo.KhachHang
          WHERE MaNguoiDung = @UserId
        `);

      const maKH = customerResult.recordset[0]?.MaKH;

      if (!maKH) {
        throw new ForbiddenException(
          'Không tìm thấy tài khoản khách hàng',
        );
      }

      
const maDiaChi = Number(body.maDiaChi);

if (!Number.isSafeInteger(maDiaChi) || maDiaChi <= 0) {
  throw new BadRequestException(
    'Vui lòng chọn hoặc lưu địa chỉ giao hàng hợp lệ',
  );
}

const addressResult = await new sql.Request(transaction)
  .input('MaDiaChi', sql.Int, maDiaChi)
  .input('UserId', sql.Int, userId)
  .query(`
    SELECT MaDiaChi
    FROM dbo.DiaChi
    WHERE MaDiaChi = @MaDiaChi
      AND MaNguoiDung = @UserId
  `);

if (addressResult.recordset.length !== 1) {
  throw new ForbiddenException(
    'Địa chỉ giao hàng không thuộc tài khoản của bạn',
  );
}


      const verifiedItems: Array<
        CheckoutItem & {
          giaBan: number;
          giaThue: number;
          giaTriCay: number;
        }
      > = [];

      const totalsByProduct = new Map<number, number>();

      for (const item of body.items) {
        totalsByProduct.set(
          item.maSP,
          (totalsByProduct.get(item.maSP) ?? 0) + item.soLuong,
        );

        const productResult = await new sql.Request(transaction)
          .input('MaSP', sql.Int, item.maSP)
          .query(`
            SELECT
              MaSP,
              GiaBan,
              GiaThueTheoNgay,
              GiaTriCay,
              LoaiSanPham,
              TrangThai
            FROM dbo.SanPham WITH (HOLDLOCK)
            WHERE MaSP = @MaSP
          `);

        const product = productResult.recordset[0];

        if (!product || !product.TrangThai) {
          throw new BadRequestException(
            `Sản phẩm #${item.maSP} không còn kinh doanh`,
          );
        }

        if (
          item.loaiGiaoDich === 'Mua' &&
          (
            !['Bán', 'Bán và thuê'].includes(product.LoaiSanPham) ||
            product.GiaBan === null
          )
        ) {
          throw new BadRequestException(
            `Sản phẩm #${item.maSP} không hỗ trợ mua`,
          );
        }

        if (
          item.loaiGiaoDich === 'Thuê' &&
          (
            !['Thuê', 'Bán và thuê'].includes(product.LoaiSanPham) ||
            product.GiaThueTheoNgay === null
          )
        ) {
          throw new BadRequestException(
            `Sản phẩm #${item.maSP} không hỗ trợ thuê`,
          );
        }

        verifiedItems.push({
          ...item,
          giaBan: Number(product.GiaBan ?? 0),
          giaThue: Number(product.GiaThueTheoNgay ?? 0),
          giaTriCay: Number(product.GiaTriCay),
        });
      }

      for (const [maSP, requested] of totalsByProduct) {
        const stockResult = await new sql.Request(transaction)
          .input('MaSP', sql.Int, maSP)
          .query(`
            SELECT COALESCE(
              SUM(TK.SoLuongKhaDung),
              0
            ) AS SoLuongKhaDung
            FROM dbo.TonKho TK WITH (UPDLOCK, HOLDLOCK)
            JOIN dbo.Kho K ON K.MaKho = TK.MaKho
            WHERE TK.MaSP = @MaSP
              AND K.TrangThai = 1
          `);

        const available = Number(
          stockResult.recordset[0]?.SoLuongKhaDung ?? 0,
        );

        if (requested > available) {
          throw new BadRequestException(
            `Sản phẩm #${maSP} chỉ còn ${available} cây khả dụng`,
          );
        }
      }

      const purchaseItems = verifiedItems.filter(
        (item) => item.loaiGiaoDich === 'Mua',
      );

      const rentalItems = verifiedItems.filter(
        (item) => item.loaiGiaoDich === 'Thuê',
      );

      let maDH: number | null = null;
      const rentalIds: number[] = [];
      let purchaseTotal = 0;

      if (purchaseItems.length > 0) {
        const orderResult = await new sql.Request(transaction)
          .input('MaKH', sql.Int, maKH)
          .input('MaDiaChi', sql.Int, maDiaChi)
          .input(
            'PaymentMethod',
            sql.NVarChar(40),
            body.paymentMethod,
          )
          .input(
            'GhiChu',
            sql.NVarChar(500),
            delivery.ghiChu?.trim() || null,
          )
          .query(`
            INSERT INTO dbo.DonHang (
              MaKH,
              MaDiaChiGiao,
              TrangThai,
              TrangThaiThanhToan,
              PhuongThucThanhToan,
              GhiChu
            )
            OUTPUT INSERTED.MaDH
            VALUES (
              @MaKH,
              @MaDiaChi,
              N'Chờ xác nhận',
              N'Chưa thanh toán',
              @PaymentMethod,
              @GhiChu
            )
          `);

        maDH = orderResult.recordset[0].MaDH;

        for (const item of purchaseItems) {
          const lineTotal = item.giaBan * item.soLuong;
          purchaseTotal += lineTotal;

          await new sql.Request(transaction)
            .input('MaDH', sql.Int, maDH)
            .input('MaSP', sql.Int, item.maSP)
            .input('SoLuong', sql.Int, item.soLuong)
            .input('DonGia', sql.Decimal(18, 2), item.giaBan)
            .query(`
              INSERT INTO dbo.ChiTietDonHang (
                MaDH,
                MaSP,
                SoLuong,
                DonGiaGoc,
                DonGia
              )
              VALUES (
                @MaDH,
                @MaSP,
                @SoLuong,
                @DonGia,
                @DonGia
              )
            `);
        }

        if (purchaseTotal > 0) {
          await new sql.Request(transaction)
            .input('MaDH', sql.Int, maDH)
            .input(
              'SoTien',
              sql.Decimal(18, 2),
              purchaseTotal,
            )
            .input(
              'PhuongThuc',
              sql.NVarChar(40),
              body.paymentMethod,
            )
            .query(`
              INSERT INTO dbo.ThanhToan (
                MaDH,
                LoaiThanhToan,
                SoTien,
                PhuongThuc,
                TrangThai
              )
              VALUES (
                @MaDH,
                N'Mua hàng',
                @SoTien,
                @PhuongThuc,
                N'Chờ thanh toán'
              )
            `);
        }
      }

      for (const item of rentalItems) {
        const start = item.ngayBatDauThue!;
        const end = item.ngayKetThucThue!;
        const days = Math.round(
          (
            this.validateDate(end).getTime() -
            this.validateDate(start).getTime()
          ) / 86400000,
        );


const isPremium = item.goiThue === 'Cao cấp';
let premiumFee = 0;

if (isPremium) {
  const policyResult = await new sql.Request(transaction)
    .query(`
      SELECT TOP 1 PhiMacDinh
      FROM dbo.ChinhSachDichVu
      WHERE TenDichVu = N'Chăm sóc cây tại nơi thuê'
        AND NhomDichVu = N'Hậu mãi'
        AND HinhThuc = N'Thuê'
        AND GoiApDung = N'Cao cấp'
        AND YeuCauGoiCoPhi = 1
        AND TrangThai = 1
        AND PhiMacDinh > 0
        AND HieuLucTu <= CONVERT(DATE, SYSDATETIME())
        AND (
          HieuLucDen IS NULL
          OR HieuLucDen >= CONVERT(DATE, SYSDATETIME())
        )
    `);

  premiumFee = Number(
    policyResult.recordset[0]?.PhiMacDinh ?? 0,
  );

  if (!Number.isFinite(premiumFee) || premiumFee <= 0) {
    throw new BadRequestException(
      'Gói Cao cấp chưa có mức phí hợp lệ trong chính sách dịch vụ',
    );
  }
}

        const contractCode = `NHAI-${randomUUID()}`;
        const depositPerPlant = Math.round(
          item.giaTriCay * 1.5,
        );
        const totalDeposit = depositPerPlant * item.soLuong;
        const rentalFee =
          item.giaThue * days * item.soLuong;

        
const rentalResult = await new sql.Request(transaction)
  .input('MaKH', sql.Int, maKH)
  .input('MaDiaChi', sql.Int, maDiaChi)
  .input('Start', sql.Date, start)
  .input('End', sql.Date, end)
  .input('GoiThue', sql.NVarChar(30), item.goiThue)
  .input('XacNhanGoiCaoCap', sql.Bit, isPremium)
  .input('PhiGoiGoc', sql.Decimal(18, 2), premiumFee)
  .input('Deposit', sql.Decimal(18, 2), totalDeposit)
  .input('Contract', sql.VarChar(60), contractCode)
  .input(
    'GhiChu',
    sql.NVarChar(500),
    delivery.ghiChu?.trim() || null,
  )
  .query(`
    INSERT INTO dbo.DonThue (
      MaKH,
      MaDiaChiGiao,
      NgayBatDau,
      NgayKetThuc,
      GoiThue,
      XacNhanGoiCaoCap,
      PhiGoiGoc,
      GiamGiaGoi,
      TienCocDuKien,
      MaHopDong,
      GhiChu
    )
    OUTPUT INSERTED.MaDT
    VALUES (
      @MaKH,
      @MaDiaChi,
      @Start,
      @End,
      @GoiThue,
      @XacNhanGoiCaoCap,
      @PhiGoiGoc,
      0,
      @Deposit,
      @Contract,
      @GhiChu
    )
  `);


        const maDT = Number(rentalResult.recordset[0].MaDT);
        rentalIds.push(maDT);

        for (let index = 0; index < item.soLuong; index++) {
          await new sql.Request(transaction)
            .input('MaDT', sql.Int, maDT)
            .input('MaSP', sql.Int, item.maSP)
            .input(
              'GiaTriCay',
              sql.Decimal(18, 2),
              item.giaTriCay,
            )
            .input(
              'GiaThue',
              sql.Decimal(18, 2),
              item.giaThue,
            )
            .input(
              'TienCoc',
              sql.Decimal(18, 2),
              depositPerPlant,
            )
            .query(`
              INSERT INTO dbo.ChiTietDonThue (
                MaDT,
                MaSP,
                SoLuong,
                GiaTriCayKhiGiao,
                GiaThueGocTheoNgay,
                GiaThueTheoNgay,
                TienCoc
              )
              VALUES (
                @MaDT,
                @MaSP,
                1,
                @GiaTriCay,
                @GiaThue,
                @GiaThue,
                @TienCoc
              )
            `);
        }

        if (totalDeposit > 0) {
          await new sql.Request(transaction)
            .input('MaDT', sql.Int, maDT)
            .input(
              'SoTien',
              sql.Decimal(18, 2),
              totalDeposit,
            )
            .input(
              'PhuongThuc',
              sql.NVarChar(40),
              body.paymentMethod,
            )
            .query(`
              INSERT INTO dbo.ThanhToan (
                MaDT,
                LoaiThanhToan,
                SoTien,
                PhuongThuc,
                TrangThai
              )
              VALUES (
                @MaDT,
                N'Đặt cọc',
                @SoTien,
                @PhuongThuc,
                N'Chờ thanh toán'
              )
            `);
        }

        if (rentalFee > 0) {
          await new sql.Request(transaction)
            .input('MaDT', sql.Int, maDT)
            .input(
              'SoTien',
              sql.Decimal(18, 2),
              rentalFee,
            )
            .input(
              'PhuongThuc',
              sql.NVarChar(40),
              body.paymentMethod,
            )
            .query(`
              INSERT INTO dbo.ThanhToan (
                MaDT,
                LoaiThanhToan,
                SoTien,
                PhuongThuc,
                TrangThai
              )
              VALUES (
                @MaDT,
                N'Tiền thuê',
                @SoTien,
                @PhuongThuc,
                N'Chờ thanh toán'
              )
            `);
        }


if (premiumFee > 0) {
  await new sql.Request(transaction)
    .input('MaDT', sql.Int, maDT)
    .input(
      'SoTien',
      sql.Decimal(18, 2),
      premiumFee,
    )
    .input(
      'PhuongThuc',
      sql.NVarChar(40),
      body.paymentMethod,
    )
    .query(`
      INSERT INTO dbo.ThanhToan (
        MaDT,
        LoaiThanhToan,
        SoTien,
        PhuongThuc,
        TrangThai
      )
      VALUES (
        @MaDT,
        N'Dịch vụ',
        @SoTien,
        @PhuongThuc,
        N'Chờ thanh toán'
      )
    `);
}

      }

      await transaction.commit();

      return {
        success: true,
        message: 'Đã tiếp nhận đơn đặt hàng',
        data: {
          maDH,
          maDTs: rentalIds,
          phuongThucThanhToan: body.paymentMethod,
          trangThai: 'Chờ xác nhận',
          trangThaiThanhToan: 'Chờ thanh toán',
          purchaseTotal,
        },
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


async myOrders(user: AuthenticatedUser) {
  const userId = Number(
    user.userId ?? user.MaNguoiDung ?? user.sub,
  );

  const role = user.role ?? user.TenVaiTro;

  if (role !== 'Khách hàng') {
    throw new ForbiddenException(
      'Chỉ khách hàng được xem đơn hàng của mình',
    );
  }

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new ForbiddenException(
      'Phiên đăng nhập không hợp lệ',
    );
  }

  const customer = await this.database
    .getConnection()
    .request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT MaKH
      FROM dbo.KhachHang
      WHERE MaNguoiDung = @UserId
    `);

  const maKH = customer.recordset[0]?.MaKH;

  if (!maKH) {
    throw new ForbiddenException(
      'Không tìm thấy tài khoản khách hàng',
    );
  }

  const purchases = await this.database
    .getConnection()
    .request()
    .input('MaKH', sql.Int, maKH)
    .query(`
      SELECT
        DH.MaDH AS MaDon,
        N'Mua' AS LoaiDon,
        DH.NgayDat AS NgayTao,
        DH.TrangThai,
        DH.TrangThaiThanhToan,
        DH.PhuongThucThanhToan,
        DH.NgayGiaoThucTe,
        DH.NgayGiaoDuKien,
        DH.GhiChu,
        DH.PhiVanChuyen,
        COALESCE(
          (
            SELECT SUM(CT.SoLuong * CT.DonGia)
            FROM dbo.ChiTietDonHang CT
            WHERE CT.MaDH = DH.MaDH
          ),
          0
        ) - DH.GiamGiaDon + DH.PhiVanChuyen
          AS TongTien,
        COALESCE(
          (
            SELECT SUM(
              CASE
                WHEN T.TrangThai = N'Đã thanh toán'
                  AND T.LoaiThanhToan = N'Mua hàng'
                THEN T.SoTien
                WHEN T.TrangThai = N'Đã thanh toán'
                  AND T.LoaiThanhToan = N'Hoàn tiền'
                THEN -T.SoTien
                ELSE 0
              END
            )
            FROM dbo.ThanhToan T
            WHERE T.MaDH = DH.MaDH
          ),
          0
        ) AS DaThanhToan,
        COALESCE(
          (
            SELECT SUM(CT.SoLuong)
            FROM dbo.ChiTietDonHang CT
            WHERE CT.MaDH = DH.MaDH
          ),
          0
        ) AS SoSanPham,
        CAST(N'' AS NVARCHAR(MAX)) AS SanPham,
        CAST(NULL AS NVARCHAR(30)) AS GoiThue,
        CAST(NULL AS DATE) AS NgayBatDauThue,
        CAST(NULL AS DATE) AS NgayKetThucThue,
        CAST(NULL AS NVARCHAR(40)) AS TrangThaiCoc,
        CAST(NULL AS NVARCHAR(40)) AS TrangThaiQuyetToan
      FROM dbo.DonHang DH
      WHERE DH.MaKH = @MaKH
      ORDER BY DH.NgayDat DESC
    `);

  const rentals = await this.database
    .getConnection()
    .request()
    .input('MaKH', sql.Int, maKH)
    .query(`
      SELECT
        DT.MaDT AS MaDon,
        N'Thuê' AS LoaiDon,
        DT.NgayTao,
        DT.TrangThai,
        CASE
          WHEN COALESCE(
            (
              SELECT SUM(T.SoTien)
              FROM dbo.ThanhToan T
              WHERE T.MaDT = DT.MaDT
                AND T.LoaiThanhToan IN (
                  N'Đặt cọc',
                  N'Tiền thuê',
                  N'Dịch vụ'
                )
            ),
            0
          ) <= COALESCE(
            (
              SELECT SUM(T.SoTien)
              FROM dbo.ThanhToan T
              WHERE T.MaDT = DT.MaDT
                AND T.TrangThai = N'Đã thanh toán'
                AND T.LoaiThanhToan IN (
                  N'Đặt cọc',
                  N'Tiền thuê',
                  N'Dịch vụ'
                )
            ),
            0
          )
          THEN N'Đã thanh toán'
          WHEN EXISTS (
            SELECT 1
            FROM dbo.ThanhToan T
            WHERE T.MaDT = DT.MaDT
              AND T.TrangThai = N'Đã thanh toán'
              AND T.LoaiThanhToan IN (
                N'Đặt cọc',
                N'Tiền thuê',
                N'Dịch vụ'
              )
          )
          THEN N'Thanh toán một phần'
          ELSE N'Chưa thanh toán'
        END AS TrangThaiThanhToan,
        (
          SELECT TOP 1 T.PhuongThuc
          FROM dbo.ThanhToan T
          WHERE T.MaDT = DT.MaDT
            AND T.LoaiThanhToan IN (
              N'Đặt cọc',
              N'Tiền thuê',
              N'Dịch vụ'
            )
          ORDER BY T.MaTT DESC
        ) AS PhuongThucThanhToan,
        DT.NgayGiaoThucTe,
        CAST(NULL AS DATETIME2) AS NgayGiaoDuKien,
        DT.GhiChu,
        DT.PhiVanChuyen,
        COALESCE(
          (
            SELECT 
SUM(
  CT.SoLuong * CT.GiaThueTheoNgay
) * DATEDIFF(
  DAY,
  DT.NgayBatDau,
  DT.NgayKetThuc
)

            FROM dbo.ChiTietDonThue CT
            WHERE CT.MaDT = DT.MaDT
          ),
          0
        )
          + DT.TienCocDuKien
          + DT.PhiGoiGoc
          - DT.GiamGiaGoi
          + DT.PhiVanChuyen
          + DT.PhiKhac AS TongTien,
        COALESCE(
          (
            SELECT SUM(T.SoTien)
            FROM dbo.ThanhToan T
            WHERE T.MaDT = DT.MaDT
              AND T.TrangThai = N'Đã thanh toán'
              AND T.LoaiThanhToan IN (
                N'Đặt cọc',
                N'Tiền thuê',
                N'Dịch vụ'
              )
          ),
          0
        ) AS DaThanhToan,
        COALESCE(
          (
            SELECT SUM(CT.SoLuong)
            FROM dbo.ChiTietDonThue CT
            WHERE CT.MaDT = DT.MaDT
          ),
          0
        ) AS SoSanPham,
        CAST(N'' AS NVARCHAR(MAX)) AS SanPham,
        DT.GoiThue,
        DT.NgayBatDau AS NgayBatDauThue,
        DT.NgayKetThuc AS NgayKetThucThue,
        DT.TrangThaiCoc,
        DT.TrangThaiQuyetToan
      FROM dbo.DonThue DT
      WHERE DT.MaKH = @MaKH
      ORDER BY DT.NgayTao DESC
    `);

  const data = [
    ...purchases.recordset,
    ...rentals.recordset,
  ];

  for (const order of data) {
    const isPurchase = order.LoaiDon === 'Mua';

    const details = await this.database
      .getConnection()
      .request()
      .input(
        'MaDon',
        sql.Int,
        order.MaDon,
      )
      .query(
        isPurchase
          ? `
            SELECT SP.TenSP, CT.SoLuong
            FROM dbo.ChiTietDonHang CT
            JOIN dbo.SanPham SP
              ON SP.MaSP = CT.MaSP
            WHERE CT.MaDH = @MaDon
          `
          : `
            SELECT SP.TenSP, CT.SoLuong
            FROM dbo.ChiTietDonThue CT
            JOIN dbo.SanPham SP
              ON SP.MaSP = CT.MaSP
            WHERE CT.MaDT = @MaDon
          `,
      );

    order.SanPham = details.recordset
      .map(
        (item) =>
          `${item.TenSP} × ${item.SoLuong}`,
      )
      .join(', ');
  }

  data.sort((a, b) => {
    const timeA = new Date(a.NgayTao).getTime();
    const timeB = new Date(b.NgayTao).getTime();

    return timeB - timeA;
  });

  return {
    success: true,
    data,
  };
}


}
