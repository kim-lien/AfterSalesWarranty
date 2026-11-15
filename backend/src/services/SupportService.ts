import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { DatabaseConfig } from '../config/DatabaseConfig';
import { CurrentUser } from '../guards/JwtGuard';

type CreateTicket = {
  maDH?: number;
  maDT?: number;
  maCTDH?: number;
  maCTDT?: number;
  maKenh: number;
  maChinhSach?: number;
  nhomYeuCau: string;
  loaiYeuCau: string;
  tieuDe: string;
  moTa?: string;
  mucDo?: string;
};

type WarrantyBody = {
  nguyenNhan: string;
  ketQuaKiemTra: string;
  huongXuLy: string;
  trangThai: string;
};

type InspectionBody = {
  nguyenNhan: string;
  ketQuaKiemTra: string;
  huongXuLy: string;
};

type AppointmentBody = {
  maNV: number;
  loaiCongViec: string;
  ngayHen: string;
  diaDiem?: string;
};

type AppointmentUpdateBody = {
  trangThai: string;
  ketQua?: string;
};

@Injectable()
export class SupportService {
  constructor(private readonly database: DatabaseConfig) {}

  private pool() {
    return this.database.getConnection();
  }

  private checkRole(user: CurrentUser, roles: string[]) {
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện');
    }
  }

  private validId(value: unknown): number {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException('Mã không hợp lệ');
    }

    return id;
  }

  private validateWarrantyFields(body: InspectionBody) {
    const nguyenNhan =
      typeof body?.nguyenNhan === 'string'
        ? body.nguyenNhan.trim()
        : '';

    const ketQua =
      typeof body?.ketQuaKiemTra === 'string'
        ? body.ketQuaKiemTra.trim()
        : '';

    const huongXuLy = body?.huongXuLy;

    const solutions = [
      'Sửa chữa',
      'Chăm sóc',
      'Thay cây',
      'Hoàn tiền',
      'Từ chối',
    ];

    if (!nguyenNhan || nguyenNhan.length > 500) {
      throw new BadRequestException(
        'Nguyên nhân phải có từ 1 đến 500 ký tự',
      );
    }

    if (!ketQua) {
      throw new BadRequestException(
        'Vui lòng nhập kết quả kiểm tra',
      );
    }

    if (!solutions.includes(huongXuLy)) {
      throw new BadRequestException(
        'Hướng xử lý không hợp lệ',
      );
    }

    return { nguyenNhan, ketQua, huongXuLy };
  }


async addImage(
  user: CurrentUser,
  maYC: number,
  dataUrl: string,
) {
  const id = this.validId(maYC);
  const current = await this.detail(user, id);

  if (
    ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
      current.ticket.TrangThai,
    )
  ) {
    throw new BadRequestException(
      'Yêu cầu đã kết thúc, không thể bổ sung ảnh',
    );
  }

  if (typeof dataUrl !== 'string') {
    throw new BadRequestException('Dữ liệu ảnh không hợp lệ');
  }

  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    dataUrl,
  );

  if (!match) {
    throw new BadRequestException(
      'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP',
    );
  }

  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0 || buffer.length > 1572864) {
    throw new BadRequestException(
      'Dung lượng ảnh không được vượt quá 1,5 MB',
    );
  }

  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng =
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );

  const isWebp =
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  const validFormat =
    (match[1] === 'jpeg' && isJpeg) ||
    (match[1] === 'png' && isPng) ||
    (match[1] === 'webp' && isWebp);

  if (!validFormat) {
    throw new BadRequestException(
      'Định dạng tệp ảnh không hợp lệ',
    );
  }

  const countResult = await this.pool()
    .request()
    .input('MaYC', sql.Int, id)
    .query(`
      SELECT COUNT(*) AS SoAnh
      FROM dbo.LichSuTuongTac
      WHERE MaYC = @MaYC
        AND LoaiTuongTac = N'Hình ảnh'
        AND TepDinhKem IS NOT NULL
    `);

  if (Number(countResult.recordset[0].SoAnh) >= 5) {
    throw new BadRequestException(
      'Mỗi yêu cầu được đính kèm tối đa 5 ảnh',
    );
  }

  const channelResult = await this.pool()
    .request()
    .query(`
      SELECT TOP 1 MaKenh
      FROM dbo.KenhHoTro
      WHERE TenKenh = N'Website'
        AND TrangThai = 1
    `);

  const maKenh = channelResult.recordset[0]?.MaKenh;

  if (!maKenh) {
    throw new BadRequestException(
      'Kênh Website chưa được cấu hình',
    );
  }

  const extension =
    match[1] === 'jpeg' ? 'jpg' : match[1];

  const filename = `${randomUUID()}.${extension}`;
  const folder = join(
    process.cwd(),
    'uploads',
    'support-private',
  );
  const filepath = join(folder, filename);

  await mkdir(folder, { recursive: true });
  await writeFile(filepath, buffer, { flag: 'wx' });

  try {
    const result = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .input('MaNguoiDung', sql.Int, user.sub)
      .input('MaKenh', sql.Int, maKenh)
      .input('Filename', sql.VarChar(1000), filename)
      .query(`
        INSERT INTO dbo.LichSuTuongTac (
          MaYC,
          MaNguoiDung,
          MaKenh,
          LoaiTuongTac,
          NoiDung,
          TepDinhKem
        )
        VALUES (
          @MaYC,
          @MaNguoiDung,
          @MaKenh,
          N'Hình ảnh',
          N'Ảnh đính kèm yêu cầu',
          @Filename
        );

        SELECT CAST(SCOPE_IDENTITY() AS BIGINT)
          AS MaTuongTac;
      `);

    return {
      success: true,
      maTuongTac: result.recordset[0].MaTuongTac,
    };
  } catch (error) {
    await unlink(filepath).catch(() => undefined);
    throw error;
  }
}

async ticketImages(
  user: CurrentUser,
  maYC: number,
) {
  const id = this.validId(maYC);
  await this.detail(user, id);

  const result = await this.pool()
    .request()
    .input('MaYC', sql.Int, id)
    .query(`
      SELECT
        MaTuongTac,
        MaNguoiDung,
        TepDinhKem,
        ThoiGian
      FROM dbo.LichSuTuongTac
      WHERE MaYC = @MaYC
        AND LoaiTuongTac = N'Hình ảnh'
        AND TepDinhKem IS NOT NULL
      ORDER BY ThoiGian, MaTuongTac
    `);

  const images = [];

  for (const item of result.recordset) {
    const filename = String(item.TepDinhKem);

    if (
      !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename)
    ) {
      continue;
    }

    const extension = filename.split('.').pop();
    const mime =
      extension === 'jpg'
        ? 'image/jpeg'
        : `image/${extension}`;

    const filepath = join(
      process.cwd(),
      'uploads',
      'support-private',
      filename,
    );

    let buffer: Buffer;

    try {
      buffer = await readFile(filepath);
    } catch {
      continue;
    }

    images.push({
      maTuongTac: Number(item.MaTuongTac),
      maNguoiDung: item.MaNguoiDung,
      thoiGian: item.ThoiGian,
      dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
    });
  }

  return {
    success: true,
    data: images,
  };
}

async policies(
  user: CurrentUser,
  loaiDon: string,
  maDon: number,
  maChiTiet: number,
  nhomYeuCau: string,
) {
  this.checkRole(user, ['Khách hàng']);

  const id = this.validId(maDon);
  const detailId = this.validId(maChiTiet);

  if (!['Mua', 'Thuê'].includes(loaiDon)) {
    throw new BadRequestException('Loại đơn không hợp lệ');
  }

  if (!['Bảo hành', 'Hậu mãi', 'Đổi trả'].includes(nhomYeuCau)) {
    throw new BadRequestException('Nhóm dịch vụ không hợp lệ');
  }

  const request = this.pool()
    .request()
    .input('MaKH', sql.Int, user.maKH)
    .input('MaDon', sql.Int, id)
    .input('MaChiTiet', sql.Int, detailId)
    .input('Nhom', sql.NVarChar(30), nhomYeuCau);

  const query = loaiDon === 'Mua'
    ? `
      SELECT
        CS.MaChinhSach,
        CS.TenDichVu,
        CS.NhomDichVu,
        CS.HinhThuc,
        CS.GoiApDung,
        CS.SoNgayToiDa,
        CS.PhiMacDinh,
        CS.MoTaDieuKien
      FROM dbo.DonHang DH
      JOIN dbo.ChiTietDonHang CT
        ON CT.MaDH = DH.MaDH
      JOIN dbo.SanPham SP
        ON SP.MaSP = CT.MaSP
      JOIN dbo.ChinhSachDichVu CS
        ON CS.HinhThuc = N'Mua'
        AND CS.NhomDichVu = @Nhom
      WHERE DH.MaKH = @MaKH
        AND DH.MaDH = @MaDon
        AND CT.MaCTDH = @MaChiTiet
        AND DH.TrangThai = N'Đã giao'
        AND DH.TrangThaiThanhToan = N'Đã thanh toán'
        AND DH.NgayGiaoThucTe IS NOT NULL
        AND CS.TrangThai = 1
        AND CS.HieuLucTu <= CAST(GETDATE() AS DATE)
        AND (
          CS.HieuLucDen IS NULL
          OR CS.HieuLucDen >= CAST(GETDATE() AS DATE)
        )
        AND (
          CS.YeuCauCayGiaTriCao = 0
          OR SP.DuDieuKienBaoHanh = 1
        )
        AND (
          CS.YeuCauGoiCoPhi = 0
          OR (
            CS.NhomDichVu = N'Bảo hành'
            AND CT.CoGoiBaoHanh = 1
          )
          OR (
            CS.NhomDichVu = N'Hậu mãi'
            AND CT.CoGoiChamSoc = 1
          )
        )
        AND SYSDATETIME() <
          CASE
            WHEN CS.SoGioToiDa IS NOT NULL
            THEN DATEADD(
              HOUR,
              CS.SoGioToiDa,
              DH.NgayGiaoThucTe
            )
            ELSE DATEADD(
              DAY,
              CS.SoNgayToiDa,
              DH.NgayGiaoThucTe
            )
          END
      ORDER BY CS.MaChinhSach
    `
    : `
      SELECT
        CS.MaChinhSach,
        CS.TenDichVu,
        CS.NhomDichVu,
        CS.HinhThuc,
        CS.GoiApDung,
        CS.SoNgayToiDa,
        CS.PhiMacDinh,
        CS.MoTaDieuKien
      FROM dbo.DonThue DT
      JOIN dbo.ChiTietDonThue CT
        ON CT.MaDT = DT.MaDT
      JOIN dbo.SanPham SP
        ON SP.MaSP = CT.MaSP
      JOIN dbo.ChinhSachDichVu CS
        ON CS.HinhThuc = N'Thuê'
        AND CS.NhomDichVu = @Nhom
      WHERE DT.MaKH = @MaKH
        AND DT.MaDT = @MaDon
        AND CT.MaCTDT = @MaChiTiet
        AND DT.TrangThai IN (
          N'Đang thuê',
          N'Chờ trả cây'
        )
        AND DT.NgayGiaoThucTe IS NOT NULL
        AND CS.TrangThai = 1
        AND CS.HieuLucTu <= CAST(GETDATE() AS DATE)
        AND (
          CS.HieuLucDen IS NULL
          OR CS.HieuLucDen >= CAST(GETDATE() AS DATE)
        )
        AND (
          CS.GoiApDung = N'Tất cả'
          OR CS.GoiApDung = DT.GoiThue
        )
        AND (
          CS.YeuCauCayGiaTriCao = 0
          OR SP.DuDieuKienBaoHanh = 1
        )
        AND (
          CS.YeuCauGoiCoPhi = 0
          OR (
            DT.GoiThue = N'Cao cấp'
            AND DT.XacNhanGoiCaoCap = 1
          )
        )
        AND SYSDATETIME() <
          CASE
            WHEN CS.SoGioToiDa IS NOT NULL
            THEN DATEADD(
              HOUR,
              CS.SoGioToiDa,
              DT.NgayGiaoThucTe
            )
            ELSE DATEADD(
              DAY,
              CS.SoNgayToiDa,
              DT.NgayGiaoThucTe
            )
          END
        AND SYSDATETIME() <
          CAST(DT.NgayKetThuc AS DATETIME2(0))
        AND EXISTS (
          SELECT 1
          FROM dbo.ThanhToan TT
          WHERE TT.MaDT = DT.MaDT
            AND TT.LoaiThanhToan = N'Đặt cọc'
            AND TT.TrangThai = N'Đã thanh toán'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM dbo.ThanhToan TT
          WHERE TT.MaDT = DT.MaDT
            AND TT.LoaiThanhToan IN (
              N'Đặt cọc',
              N'Tiền thuê',
              N'Dịch vụ'
            )
            AND TT.TrangThai <> N'Đã thanh toán'
        )
      ORDER BY CS.MaChinhSach
    `;

  const result = await request.query(query);

  return {
    success: true,
    data: result.recordset,
  };
}

  async channels() {
    const result = await this.pool().request().query(`
      SELECT MaKenh, TenKenh
      FROM dbo.KenhHoTro
      WHERE TrangThai = 1
      ORDER BY MaKenh
    `);

    return result.recordset;
  }

  async employees(user: CurrentUser) {
    this.checkRole(user, ['Quản trị viên']);

    const result = await this.pool().request().query(`
      SELECT NV.MaNV, ND.HoTen, ND.Email
      FROM dbo.NhanVien NV
      JOIN dbo.NguoiDung ND
        ON ND.MaNguoiDung = NV.MaNguoiDung
      WHERE NV.TrangThai = 1
        AND ND.TrangThai = 1
      ORDER BY ND.HoTen
    `);

    return result.recordset;
  }

  async orders(user: CurrentUser) {
    this.checkRole(user, ['Khách hàng']);

    const result = await this.pool()
      .request()
      .input('MaKH', sql.Int, user.maKH)
      .query(`
        SELECT
          N'Mua' AS LoaiDon,
          DH.MaDH AS MaDon,
          CT.MaCTDH AS MaChiTiet,
          SP.TenSP
        FROM dbo.DonHang DH
        JOIN dbo.ChiTietDonHang CT
          ON CT.MaDH = DH.MaDH
        JOIN dbo.SanPham SP
          ON SP.MaSP = CT.MaSP
        WHERE DH.MaKH = @MaKH

        UNION ALL

        SELECT
          N'Thuê' AS LoaiDon,
          DT.MaDT AS MaDon,
          CT.MaCTDT AS MaChiTiet,
          SP.TenSP
        FROM dbo.DonThue DT
        JOIN dbo.ChiTietDonThue CT
          ON CT.MaDT = DT.MaDT
        JOIN dbo.SanPham SP
          ON SP.MaSP = CT.MaSP
        WHERE DT.MaKH = @MaKH

        ORDER BY LoaiDon, MaDon DESC
      `);

    return result.recordset;
  }

  async list(user: CurrentUser, group?: string) {
    const groups = [
      'Hậu mãi',
      'Bảo hành',
      'Đổi trả',
      'Khiếu nại',
    ];

    if (group && !groups.includes(group)) {
      throw new BadRequestException('Nhóm yêu cầu không hợp lệ');
    }

    const request = this.pool().request();
    const conditions: string[] = [];

    if (user.role === 'Khách hàng') {
      conditions.push('YC.MaKH = @MaKH');
      request.input('MaKH', sql.Int, user.maKH);
    } else if (user.role === 'Nhân viên') {
      conditions.push('YC.MaNVXuLy = @MaNV');
      request.input('MaNV', sql.Int, user.maNV);
    } else {
      this.checkRole(user, ['Quản trị viên']);
    }

    if (group) {
      conditions.push('YC.NhomYeuCau = @Nhom');
      request.input('Nhom', sql.NVarChar(30), group);
    }

    const condition = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await request.query(`
      SELECT
        YC.MaYC,
        YC.MaKH,
        YC.MaDH,
        YC.MaDT,
        YC.NhomYeuCau,
        YC.LoaiYeuCau,
        YC.TieuDe,
        YC.MoTa,
        YC.MucDo,
        YC.TrangThai,
        YC.NgayTao,
        YC.MaNVXuLy,
        YC.MaKenhTiepNhan,
        YC.NgayPhanHoiDau,
        YC.NgayDong,
        ND.HoTen AS TenKhachHang,
        K.TenKenh,
        S.HanPhanHoi,
        S.HanXuLy,
        S.QuaHanPhanHoi,
        S.QuaHanXuLy
      FROM dbo.YeuCauHauMai YC
      JOIN dbo.KhachHang KH
        ON KH.MaKH = YC.MaKH
      JOIN dbo.NguoiDung ND
        ON ND.MaNguoiDung = KH.MaNguoiDung
      JOIN dbo.KenhHoTro K
        ON K.MaKenh = YC.MaKenhTiepNhan
      LEFT JOIN dbo.vwSLAYeuCau S
        ON S.MaYC = YC.MaYC
      ${condition}
      ORDER BY YC.NgayTao DESC, YC.MaYC DESC
    `);

    return result.recordset;
  }

  async detail(user: CurrentUser, maYC: number) {
    const id = this.validId(maYC);

    const result = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        SELECT
          YC.*,
          ND.HoTen AS TenKhachHang,
          K.TenKenh,
          S.QuaHanPhanHoi,
          S.QuaHanXuLy,
          Q.ConQuyenLoi,
          Q.MocBatDau,
          Q.MocHetHan,
          BH.MaBH,
          BH.NgayBatDau AS NgayBatDauBaoHanh,
          BH.NgayHetHan AS NgayHetHanBaoHanh,
          BH.TrangThai AS TrangThaiBaoHanh,
          BH.NguyenNhan,
          BH.KetQuaKiemTra,
          BH.HuongXuLy,
          BH.MaNVXacMinh,
          BH.NgayXacMinh
        FROM dbo.YeuCauHauMai YC
        JOIN dbo.KhachHang KH
          ON KH.MaKH = YC.MaKH
        JOIN dbo.NguoiDung ND
          ON ND.MaNguoiDung = KH.MaNguoiDung
        LEFT JOIN dbo.KenhHoTro K
          ON K.MaKenh = YC.MaKenhTiepNhan
        LEFT JOIN dbo.vwSLAYeuCau S
          ON S.MaYC = YC.MaYC
        LEFT JOIN dbo.vwQuyenLoiYeuCau Q
          ON Q.MaYC = YC.MaYC
        LEFT JOIN dbo.BaoHanh BH
          ON BH.MaYC = YC.MaYC
        WHERE YC.MaYC = @MaYC
      `);

    const ticket = result.recordset[0];

    if (!ticket) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }

    if (
      user.role === 'Khách hàng' &&
      ticket.MaKH !== user.maKH
    ) {
      throw new ForbiddenException('Bạn không có quyền xem');
    }

    if (
      user.role === 'Nhân viên' &&
      ticket.MaNVXuLy !== user.maNV
    ) {
      throw new ForbiddenException('Yêu cầu không được phân công');
    }

    this.checkRole(user, [
      'Khách hàng',
      'Nhân viên',
      'Quản trị viên',
    ]);

    const messages = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        SELECT LS.*, K.TenKenh, ND.HoTen
        FROM dbo.LichSuTuongTac LS
        JOIN dbo.KenhHoTro K
          ON K.MaKenh = LS.MaKenh
        LEFT JOIN dbo.NguoiDung ND
          ON ND.MaNguoiDung = LS.MaNguoiDung
        WHERE LS.MaYC = @MaYC
        ORDER BY LS.ThoiGian, LS.MaTuongTac
      `);

    const history = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        SELECT LS.*, ND.HoTen
        FROM dbo.LichSuTrangThai LS
        JOIN dbo.NguoiDung ND
          ON ND.MaNguoiDung = LS.MaNguoiThayDoi
        WHERE LS.MaYC = @MaYC
        ORDER BY LS.ThoiGian, LS.MaLSTS
      `);

    return {
      ticket,
      messages: messages.recordset,
      history: history.recordset,
    };
  }

  async create(user: CurrentUser, body: CreateTicket) {
    this.checkRole(user, ['Khách hàng']);

    const groups = [
      'Hậu mãi',
      'Bảo hành',
      'Đổi trả',
      'Khiếu nại',
    ];

    const priorities = [
      'Thấp',
      'Trung bình',
      'Cao',
      'Khẩn cấp',
    ];

    const priority = body.mucDo ?? 'Trung bình';

    if (
      !groups.includes(body.nhomYeuCau) ||
      !priorities.includes(priority) ||
      !body.tieuDe?.trim() ||
      !body.loaiYeuCau?.trim()
    ) {
      throw new BadRequestException('Thông tin yêu cầu không hợp lệ');
    }

    if (
      body.tieuDe.length > 200 ||
      body.loaiYeuCau.length > 100
    ) {
      throw new BadRequestException('Nội dung vượt giới hạn');
    }

    const purchase = body.maDH != null && body.maCTDH != null;
    const rental = body.maDT != null && body.maCTDT != null;

    if (purchase === rental) {
      throw new BadRequestException(
        'Phải chọn đúng một sản phẩm thuộc đơn mua hoặc đơn thuê',
      );
    }

    const maChinhSach = this.validId(body.maChinhSach);

    const policyResponse = await this.policies(
      user,
      purchase ? 'Mua' : 'Thuê',
      this.validId(purchase ? body.maDH : body.maDT),
      this.validId(purchase ? body.maCTDH : body.maCTDT),
      body.nhomYeuCau,
    );

    const selectedPolicy = policyResponse.data.find(
      (item: { MaChinhSach: number }) =>
        Number(item.MaChinhSach) === maChinhSach,
    );

    if (!selectedPolicy) {
      throw new BadRequestException(
        'Dịch vụ không phù hợp hoặc đã hết thời hạn áp dụng',
      );
    }

    const responseHours =
      priority === 'Khẩn cấp' ? 1 :
      priority === 'Cao' ? 2 : 4;

    const processingHours =
      priority === 'Khẩn cấp' ? 8 :
      priority === 'Cao' ? 24 : 72;

    const result = await this.pool()
      .request()
      .input('MaKH', sql.Int, user.maKH)
      .input(
        'MaDH',
        sql.Int,
        purchase ? this.validId(body.maDH) : null,
      )
      .input(
        'MaDT',
        sql.Int,
        rental ? this.validId(body.maDT) : null,
      )
      .input(
        'MaCTDH',
        sql.Int,
        purchase ? this.validId(body.maCTDH) : null,
      )
      .input(
        'MaCTDT',
        sql.Int,
        rental ? this.validId(body.maCTDT) : null,
      )
      .input('MaKenh', sql.Int, this.validId(body.maKenh))
      .input('MaChinhSach', sql.Int, maChinhSach)
      .input('Nhom', sql.NVarChar(30), body.nhomYeuCau)
      .input('Loai', sql.NVarChar(100), body.loaiYeuCau.trim())
      .input('TieuDe', sql.NVarChar(200), body.tieuDe.trim())
      .input('MoTa', sql.NVarChar(sql.MAX), body.moTa ?? '')
      .input('MucDo', sql.NVarChar(30), priority)
      .input('GioPhanHoi', sql.Int, responseHours)
      .input('GioXuLy', sql.Int, processingHours)
      
      .query(`
        DECLARE @YeuCauMoi TABLE (
          MaYC INT NOT NULL
        );

        INSERT INTO dbo.YeuCauHauMai (
          MaKH, MaDH, MaDT, MaCTDH, MaCTDT,
          MaChinhSach, MaKenhTiepNhan,
          NhomYeuCau, LoaiYeuCau, TieuDe, MoTa,
          MucDo, HanPhanHoi, HanXuLy
        )
        OUTPUT INSERTED.MaYC INTO @YeuCauMoi(MaYC)
        VALUES (
          @MaKH, @MaDH, @MaDT, @MaCTDH, @MaCTDT,
          @MaChinhSach, @MaKenh,
          @Nhom, @Loai, @TieuDe, @MoTa,
          @MucDo,
          DATEADD(HOUR, @GioPhanHoi, SYSDATETIME()),
          DATEADD(HOUR, @GioXuLy, SYSDATETIME())
        );

        SELECT MaYC FROM @YeuCauMoi;
      `);

    return {
      success: true,
      maYC: result.recordset[0].MaYC,
    };

  }

  async assign(
    user: CurrentUser,
    maYC: number,
    maNV: number,
  ) {
    this.checkRole(user, ['Quản trị viên']);

    const id = this.validId(maYC);
    const employeeId = this.validId(maNV);

    const employee = await this.pool()
      .request()
      .input('MaNV', sql.Int, employeeId)
      .query(`
        SELECT MaNV
        FROM dbo.NhanVien
        WHERE MaNV = @MaNV AND TrangThai = 1
      `);

    if (!employee.recordset.length) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    await this.detail(user, id);

    await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .input('MaNV', sql.Int, employeeId)
      .query(`
        UPDATE dbo.YeuCauHauMai
        SET MaNVXuLy = @MaNV
        WHERE MaYC = @MaYC
      `);

    return {
      success: true,
      maYC: id,
      maNV: employeeId,
    };
  }

  async updateStatus(
    user: CurrentUser,
    maYC: number,
    status: string,
    reason: string,
  ) {
    this.checkRole(user, ['Nhân viên', 'Quản trị viên']);

    const allowed = [
      'Đã tiếp nhận',
      'Đang xác minh',
      'Đang xử lý',
      'Chờ khách hàng',
      'Đã xử lý',
      'Đã đóng',
      'Từ chối',
      'Đã hủy',
    ];

    if (!allowed.includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const id = this.validId(maYC);
    const current = await this.detail(user, id);

    if (current.ticket.TrangThai === status) {
      return { success: true };
    }

    const terminal = ['Đã đóng', 'Từ chối', 'Đã hủy'];

    if (terminal.includes(current.ticket.TrangThai)) {
      throw new BadRequestException(
        'Yêu cầu đã kết thúc, không thể đổi trạng thái',
      );
    }

    if (terminal.includes(status)) {
      throw new BadRequestException(
        'Hãy hoàn tất hoặc từ chối bằng quy trình nghiệp vụ tương ứng',
      );
    }

    const transaction = new sql.Transaction(this.pool());
    await transaction.begin();

    try {
      await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input('TrangThai', sql.NVarChar(40), status)
        .query(`
          UPDATE dbo.YeuCauHauMai
          SET TrangThai = @TrangThai
          WHERE MaYC = @MaYC
        `);

      await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input(
          'Cu',
          sql.NVarChar(40),
          current.ticket.TrangThai,
        )
        .input('Moi', sql.NVarChar(40), status)
        .input('NguoiDung', sql.Int, user.sub)
        .input(
          'LyDo',
          sql.NVarChar(sql.MAX),
          reason ?? '',
        )
        .query(`
          INSERT INTO dbo.LichSuTrangThai (
            MaYC, TrangThaiCu, TrangThaiMoi,
            MaNguoiThayDoi, LyDo
          )
          VALUES (
            @MaYC, @Cu, @Moi, @NguoiDung, @LyDo
          )
        `);

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async message(
    user: CurrentUser,
    maYC: number,
    maKenh: number,
    noiDung: string,
  ) {
    const id = this.validId(maYC);
    await this.detail(user, id);

    if (typeof noiDung !== 'string' || !noiDung.trim()) {
      throw new BadRequestException('Nội dung không được để trống');
    }

    const transaction = new sql.Transaction(this.pool());
    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input('MaKenh', sql.Int, this.validId(maKenh))
        .input('MaNguoiDung', sql.Int, user.sub)
        .input('NoiDung', sql.NVarChar(sql.MAX), noiDung.trim())
        .query(`
          INSERT INTO dbo.LichSuTuongTac (
            MaYC, MaNguoiDung, MaKenh,
            LoaiTuongTac, NoiDung
          )
          OUTPUT INSERTED.MaTuongTac
          VALUES (
            @MaYC, @MaNguoiDung, @MaKenh,
            N'Tin nhắn', @NoiDung
          )
        `);

      if (user.role !== 'Khách hàng') {
        await new sql.Request(transaction)
          .input('MaYC', sql.Int, id)
          .query(`
            UPDATE dbo.YeuCauHauMai
            SET NgayPhanHoiDau = SYSDATETIME()
            WHERE MaYC = @MaYC
              AND NgayPhanHoiDau IS NULL
          `);
      }

      await transaction.commit();

      return {
        success: true,
        maTuongTac: result.recordset[0].MaTuongTac,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async dashboard(user: CurrentUser) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const request = this.pool().request();
    const condition =
      user.role === 'Nhân viên'
        ? 'WHERE YC.MaNVXuLy = @MaNV'
        : '';

    if (user.role === 'Nhân viên') {
      request.input('MaNV', sql.Int, user.maNV);
    }

    const result = await request.query(`
      SELECT
        COUNT(*) AS TongYeuCau,
        SUM(
          CASE WHEN YC.TrangThai = N'Mới tạo'
          THEN 1 ELSE 0 END
        ) AS MoiTao,
        SUM(
          CASE WHEN YC.TrangThai = N'Đang xử lý'
          THEN 1 ELSE 0 END
        ) AS DangXuLy,
        SUM(
          CASE WHEN YC.TrangThai = N'Đã đóng'
          THEN 1 ELSE 0 END
        ) AS DaDong,
        SUM(
          CASE WHEN S.QuaHanPhanHoi = 1
          THEN 1 ELSE 0 END
        ) AS QuaHanPhanHoi,
        SUM(
          CASE WHEN S.QuaHanXuLy = 1
          THEN 1 ELSE 0 END
        ) AS QuaHanXuLy
      FROM dbo.YeuCauHauMai YC
      LEFT JOIN dbo.vwSLAYeuCau S
        ON S.MaYC = YC.MaYC
      ${condition}
    `);

    return result.recordset[0];
  }

  async createWarranty(user: CurrentUser, maYC: number) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const id = this.validId(maYC);
    const current = await this.detail(user, id);

    if (current.ticket.NhomYeuCau !== 'Bảo hành') {
      throw new BadRequestException(
        'Yêu cầu không thuộc nhóm bảo hành',
      );
    }

    if (current.ticket.MaBH != null) {
      throw new BadRequestException(
        'Yêu cầu đã có phiếu bảo hành',
      );
    }

    if (!current.ticket.ConQuyenLoi) {
      throw new BadRequestException(
        'Yêu cầu chưa đủ quyền lợi bảo hành',
      );
    }

    const result = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        INSERT INTO dbo.BaoHanh (
          MaYC,
          NgayBatDau,
          NgayHetHan,
          TrangThai
        )
        SELECT
          Q.MaYC,
          Q.MocBatDau,
          Q.MocHetHan,
          N'Chờ xác minh'
        FROM dbo.vwQuyenLoiYeuCau Q
        WHERE Q.MaYC = @MaYC
          AND Q.ConQuyenLoi = 1
          AND Q.MocBatDau IS NOT NULL
          AND Q.MocHetHan IS NOT NULL
          AND Q.MocHetHan > Q.MocBatDau
          AND Q.MocHetHan <= DATEADD(DAY, 30, Q.MocBatDau)
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.BaoHanh BH
            WHERE BH.MaYC = Q.MaYC
          );

        SELECT @@ROWCOUNT AS SoDong;
      `);

    if (result.recordset[0]?.SoDong !== 1) {
      throw new BadRequestException(
        'Không thể tạo phiếu bảo hành theo chính sách hiện tại',
      );
    }

    const warranty = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        SELECT *
        FROM dbo.BaoHanh
        WHERE MaYC = @MaYC
      `);

    return {
      success: true,
      message: 'Đã tạo phiếu bảo hành',
      warranty: warranty.recordset[0],
    };
  }

  async warranty(
    user: CurrentUser,
    maYC: number,
    decision: 'Đủ điều kiện' | 'Từ chối',
    resultText: string,
  ) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const id = this.validId(maYC);
    const current = await this.detail(user, id);
    const ticket = current.ticket;

    if (ticket.NhomYeuCau !== 'Bảo hành') {
      throw new BadRequestException(
        'Đây không phải yêu cầu bảo hành',
      );
    }

    if (!ticket.MaBH) {
      throw new BadRequestException(
        'Yêu cầu chưa có phiếu bảo hành',
      );
    }

    if (!['Đủ điều kiện', 'Từ chối'].includes(decision)) {
      throw new BadRequestException(
        'Kết luận bảo hành không hợp lệ',
      );
    }

    if (
      ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(ticket.TrangThai) ||
      ['Hoàn tất', 'Từ chối'].includes(ticket.TrangThaiBaoHanh)
    ) {
      throw new BadRequestException(
        'Yêu cầu hoặc phiếu bảo hành đã kết thúc',
      );
    }

    if (
      decision === 'Đủ điều kiện' &&
      (!ticket.MocBatDau || !ticket.ConQuyenLoi)
    ) {
      throw new BadRequestException(
        'Đơn hàng chưa giao hoặc không đủ quyền lợi bảo hành',
      );
    }

    const reason =
      typeof resultText === 'string'
        ? resultText.trim()
        : '';

    if (!reason) {
      throw new BadRequestException(
        'Cần nhập kết luận xác minh bảo hành',
      );
    }

    const transaction = new sql.Transaction(this.pool());
    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input('MaNV', sql.Int, user.maNV ?? null)
        .input('KetQua', sql.NVarChar(sql.MAX), reason)
        .input('TrangThai', sql.NVarChar(40), decision)
        .query(`
          UPDATE dbo.BaoHanh
          SET TrangThai = @TrangThai,
              KetQuaKiemTra = @KetQua,
              MaNVXacMinh = COALESCE(
                @MaNV, MaNVXacMinh
              ),
              NgayXacMinh = SYSDATETIME()
          WHERE MaYC = @MaYC
            AND TrangThai IN (
              N'Chờ xác minh',
              N'Đang xử lý',
              N'Đủ điều kiện'
            );

          SELECT @@ROWCOUNT AS SoDong;
        `);

      if (result.recordset[0]?.SoDong !== 1) {
        throw new BadRequestException(
          'Không thể cập nhật xác minh bảo hành',
        );
      }

      if (decision === 'Từ chối') {
        await new sql.Request(transaction)
          .input('MaYC', sql.Int, id)
          .input('KetQua', sql.NVarChar(sql.MAX), reason)
          .query(`
            UPDATE dbo.YeuCauHauMai
            SET TrangThai = N'Từ chối',
                KetQua = @KetQua,
                NgayDong = SYSDATETIME()
            WHERE MaYC = @MaYC
          `);

        await new sql.Request(transaction)
          .input('MaYC', sql.Int, id)
          .input(
            'Cu',
            sql.NVarChar(40),
            ticket.TrangThai,
          )
          .input('NguoiDung', sql.Int, user.sub)
          .input('LyDo', sql.NVarChar(sql.MAX), reason)
          .query(`
            INSERT INTO dbo.LichSuTrangThai (
              MaYC,
              TrangThaiCu,
              TrangThaiMoi,
              MaNguoiThayDoi,
              LyDo
            )
            VALUES (
              @MaYC,
              @Cu,
              N'Từ chối',
              @NguoiDung,
              @LyDo
            )
          `);
      }

      await transaction.commit();

      return {
        success: true,
        message:
          decision === 'Từ chối'
            ? 'Đã từ chối bảo hành'
            : 'Đã xác minh đủ điều kiện bảo hành',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async inspectWarranty(
    user: CurrentUser,
    maYC: number,
    body: InspectionBody,
  ) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const id = this.validId(maYC);
    const current = await this.detail(user, id);
    const ticket = current.ticket;

    if (ticket.NhomYeuCau !== 'Bảo hành') {
      throw new BadRequestException(
        'Yêu cầu không thuộc nhóm bảo hành',
      );
    }

    if (!ticket.MaBH) {
      throw new BadRequestException(
        'Chưa có phiếu bảo hành',
      );
    }

    if (
      ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(ticket.TrangThai) ||
      ['Hoàn tất', 'Từ chối'].includes(ticket.TrangThaiBaoHanh)
    ) {
      throw new BadRequestException(
        'Phiếu đã kết thúc, không thể kiểm tra',
      );
    }

    const fields = this.validateWarrantyFields(body);

    const result = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .input(
        'NguyenNhan',
        sql.NVarChar(500),
        fields.nguyenNhan,
      )
      .input(
        'KetQua',
        sql.NVarChar(sql.MAX),
        fields.ketQua,
      )
      .input(
        'HuongXuLy',
        sql.NVarChar(40),
        fields.huongXuLy,
      )
      .query(`
        UPDATE dbo.BaoHanh
        SET NguyenNhan = @NguyenNhan,
            KetQuaKiemTra = @KetQua,
            HuongXuLy = @HuongXuLy
        WHERE MaYC = @MaYC
          AND TrangThai IN (
            N'Chờ xác minh',
            N'Đủ điều kiện',
            N'Đang xử lý'
          );

        SELECT @@ROWCOUNT AS SoDong;
      `);

    if (result.recordset[0]?.SoDong !== 1) {
      throw new BadRequestException(
        'Phiếu không ở trạng thái cho phép kiểm tra',
      );
    }

    const warranty = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        SELECT *
        FROM dbo.BaoHanh
        WHERE MaYC = @MaYC
      `);

    return {
      success: true,
      message: 'Đã lưu kết quả kiểm tra bảo hành',
      warranty: warranty.recordset[0],
    };
  }

  async processWarranty(
    user: CurrentUser,
    maYC: number,
    body: WarrantyBody,
  ) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const id = this.validId(maYC);
    const current = await this.detail(user, id);
    const ticket = current.ticket;

    if (ticket.NhomYeuCau !== 'Bảo hành') {
      throw new BadRequestException(
        'Không phải yêu cầu bảo hành',
      );
    }

    if (!ticket.MaBH) {
      throw new BadRequestException(
        'Chưa có phiếu bảo hành',
      );
    }

    if (!ticket.ConQuyenLoi || !ticket.MocBatDau) {
      throw new BadRequestException(
        'Yêu cầu chưa đủ quyền lợi bảo hành',
      );
    }

    if (
      ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(ticket.TrangThai) ||
      ['Hoàn tất', 'Từ chối'].includes(ticket.TrangThaiBaoHanh)
    ) {
      throw new BadRequestException(
        'Yêu cầu hoặc phiếu bảo hành đã kết thúc',
      );
    }

    const fields = this.validateWarrantyFields(body);

    if (fields.huongXuLy === 'Từ chối') {
      throw new BadRequestException(
        'Sử dụng chức năng từ chối bảo hành riêng',
      );
    }

    const trangThai = body.trangThai;

    if (!['Đang xử lý', 'Hoàn tất'].includes(trangThai)) {
      throw new BadRequestException(
        'Trạng thái bảo hành không hợp lệ',
      );
    }

    const transaction = new sql.Transaction(this.pool());
    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input(
          'NguyenNhan',
          sql.NVarChar(500),
          fields.nguyenNhan,
        )
        .input(
          'KetQua',
          sql.NVarChar(sql.MAX),
          fields.ketQua,
        )
        .input(
          'HuongXuLy',
          sql.NVarChar(40),
          fields.huongXuLy,
        )
        .input(
          'TrangThai',
          sql.NVarChar(40),
          trangThai,
        )
        .query(`
          UPDATE dbo.BaoHanh
          SET NguyenNhan = @NguyenNhan,
              KetQuaKiemTra = @KetQua,
              HuongXuLy = @HuongXuLy,
              TrangThai = @TrangThai
          WHERE MaYC = @MaYC
            AND TrangThai IN (
              N'Đủ điều kiện',
              N'Đang xử lý'
            );

          SELECT @@ROWCOUNT AS SoDong;
        `);

      if (result.recordset[0]?.SoDong !== 1) {
        throw new BadRequestException(
          'Phiếu không ở trạng thái được phép xử lý',
        );
      }

      if (trangThai === 'Hoàn tất') {
        const updated = await new sql.Request(transaction)
          .input('MaYC', sql.Int, id)
          .input(
            'KetQua',
            sql.NVarChar(sql.MAX),
            fields.ketQua,
          )
          .query(`
            UPDATE dbo.YeuCauHauMai
            SET TrangThai = N'Đã đóng',
                NgayDong = SYSDATETIME(),
                KetQua = @KetQua
            WHERE MaYC = @MaYC
              AND TrangThai NOT IN (
                N'Đã đóng',
                N'Từ chối',
                N'Đã hủy'
              );

            SELECT @@ROWCOUNT AS SoDong;
          `);

        if (updated.recordset[0]?.SoDong !== 1) {
          throw new BadRequestException(
            'Không thể đóng yêu cầu bảo hành',
          );
        }

        await new sql.Request(transaction)
          .input('MaYC', sql.Int, id)
          .input(
            'Cu',
            sql.NVarChar(40),
            ticket.TrangThai,
          )
          .input('NguoiDung', sql.Int, user.sub)
          .input(
            'LyDo',
            sql.NVarChar(sql.MAX),
            `Hoàn tất bảo hành - ${fields.huongXuLy}: ${fields.ketQua}`,
          )
          .query(`
            INSERT INTO dbo.LichSuTrangThai (
              MaYC,
              TrangThaiCu,
              TrangThaiMoi,
              MaNguoiThayDoi,
              LyDo
            )
            VALUES (
              @MaYC,
              @Cu,
              N'Đã đóng',
              @NguoiDung,
              @LyDo
            )
          `);
      }

      const warranty = await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .query(`
          SELECT *
          FROM dbo.BaoHanh
          WHERE MaYC = @MaYC
        `);

      await transaction.commit();

      return {
        success: true,
        message:
          trangThai === 'Hoàn tất'
            ? 'Đã hoàn tất bảo hành'
            : 'Đã cập nhật tiến độ bảo hành',
        warranty: warranty.recordset[0],
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async appointments(user: CurrentUser, maYC: number) {
    const id = this.validId(maYC);
    const current = await this.detail(user, id);

    if (
  !['Bảo hành', 'Hậu mãi'].includes(
    current.ticket.NhomYeuCau,
  )
) {
  throw new BadRequestException(
    'Yêu cầu không hỗ trợ lịch hẹn',
  );
}

    const result = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .query(`
        SELECT
          L.MaLich,
          L.MaYC,
          L.MaNV,
          L.LoaiCongViec,
          L.NgayHen,
          L.NgayHoanTat,
          L.DiaDiem,
          L.PhiDuKien,
          L.PhiThucTe,
          L.KhachDongYPhi,
          L.TrangThai,
          L.KetQua,
          ND.HoTen AS TenNhanVien
        FROM dbo.LichHenChamSoc L
        LEFT JOIN dbo.NhanVien NV
          ON NV.MaNV = L.MaNV
        LEFT JOIN dbo.NguoiDung ND
          ON ND.MaNguoiDung = NV.MaNguoiDung
        WHERE L.MaYC = @MaYC
        ORDER BY L.NgayHen DESC, L.MaLich DESC
      `);

    return result.recordset;
  }

async listAppointments(user: CurrentUser) {
  this.checkRole(user, [
    'Quản trị viên',
    'Nhân viên',
    'Khách hàng',
  ]);

  const request = this.pool().request();
  let condition = '';

  if (user.role === 'Nhân viên') {
    if (!user.maNV) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin nhân viên',
      );
    }

    request.input('MaNV', sql.Int, user.maNV);
    condition = 'AND L.MaNV = @MaNV';
  }

  if (user.role === 'Khách hàng') {
    if (!user.maKH) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin khách hàng',
      );
    }

    request.input('MaKH', sql.Int, user.maKH);
    condition = 'AND YC.MaKH = @MaKH';
  }

  const result = await request.query(`
    SELECT
      L.MaLich,
      L.MaYC,
      L.MaNV,
      L.LoaiCongViec,
      L.NgayHen,
      L.NgayHoanTat,
      L.DiaDiem,
      L.PhiDuKien,
      L.PhiThucTe,
      L.KhachDongYPhi,
      L.TrangThai,
      L.KetQua,
      YC.TieuDe,
      YC.NhomYeuCau,
      YC.TrangThai AS TrangThaiYeuCau,
      YC.MaKH,
      KHND.HoTen AS TenKhachHang,
      NVND.HoTen AS TenNhanVien
    FROM dbo.LichHenChamSoc L
    INNER JOIN dbo.YeuCauHauMai YC
      ON YC.MaYC = L.MaYC
    INNER JOIN dbo.KhachHang KH
      ON KH.MaKH = YC.MaKH
    INNER JOIN dbo.NguoiDung KHND
      ON KHND.MaNguoiDung = KH.MaNguoiDung
    LEFT JOIN dbo.NhanVien NV
      ON NV.MaNV = L.MaNV
    LEFT JOIN dbo.NguoiDung NVND
      ON NVND.MaNguoiDung = NV.MaNguoiDung
    WHERE 1 = 1
      ${condition}
    ORDER BY
      CASE
        WHEN L.TrangThai IN (
          N'Chờ xác nhận',
          N'Đã xác nhận',
          N'Đang thực hiện'
        )
        THEN 0
        ELSE 1
      END,
      L.NgayHen ASC,
      L.MaLich DESC
  `);

  return {
    success: true,
    total: result.recordset.length,
    data: result.recordset,
  };
}

  async createAppointment(
    user: CurrentUser,
    maYC: number,
    body: AppointmentBody,
  ) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const id = this.validId(maYC);
    const current = await this.detail(user, id);

    if (
  !['Bảo hành', 'Hậu mãi'].includes(
    current.ticket.NhomYeuCau,
  )
) {
  throw new BadRequestException(
    'Yêu cầu không hỗ trợ lịch hẹn',
  );
}

    if (
      ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
        current.ticket.TrangThai,
      )
    ) {
      throw new BadRequestException('Yêu cầu đã kết thúc');
    }

    const afterSalesJobs = [
  'Tư vấn',
  'Chăm sóc',
  'Kiểm tra',
  'Bón phân',
  'Tưới nước',
  'Cắt tỉa',
  'Trồng cây',
  'Thay đất',
];

const warrantyJobs = [
  'Kiểm tra',
  'Sửa chữa',
  'Thay cây',
  'Chăm sóc',
];

const jobs =
  current.ticket.NhomYeuCau === 'Bảo hành'
    ? warrantyJobs
    : afterSalesJobs;
    if (!jobs.includes(body?.loaiCongViec)) {
      throw new BadRequestException(
        'Loại công việc không hợp lệ',
      );
    }

    const ngayHen = new Date(body?.ngayHen);

    if (
      !body?.ngayHen ||
      Number.isNaN(ngayHen.getTime()) ||
      ngayHen.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'Ngày hẹn phải ở trong tương lai',
      );
    }

    const diaDiem =
      typeof body?.diaDiem === 'string'
        ? body.diaDiem.trim()
        : '';

    if (diaDiem.length > 500) {
      throw new BadRequestException(
        'Địa điểm không được vượt quá 500 ký tự',
      );
    }

    
this.checkRole(user, ['Quản trị viên']);

const maNV = this.validId(body?.maNV);

const employee = await this.pool()
  .request()
  .input('MaNV', sql.Int, maNV)
  .query(`
    SELECT NV.MaNV
    FROM dbo.NhanVien NV
    INNER JOIN dbo.NguoiDung ND
      ON ND.MaNguoiDung = NV.MaNguoiDung
    WHERE NV.MaNV = @MaNV
      AND NV.TrangThai = 1
      AND ND.TrangThai = 1
  `);

if (employee.recordset.length === 0) {
  throw new BadRequestException(
    'Nhân viên không tồn tại hoặc đã ngừng hoạt động',
  );
}


    const result = await this.pool()
      .request()
      .input('MaYC', sql.Int, id)
      .input('MaNV', sql.Int, maNV)
      .input(
        'LoaiCongViec',
        sql.NVarChar(50),
        body.loaiCongViec,
      )
      .input('NgayHen', sql.DateTime2, ngayHen)
      .input('DiaDiem', sql.NVarChar(500), diaDiem)
      .query(`
        INSERT INTO dbo.LichHenChamSoc (
          MaYC,
          MaNV,
          LoaiCongViec,
          NgayHen,
          DiaDiem,
          TrangThai
        )
        VALUES (
          @MaYC,
          @MaNV,
          @LoaiCongViec,
          @NgayHen,
          @DiaDiem,
          N'Chờ xác nhận'
        );

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS MaLich;
      `);

    return {
      success: true,
      message: 'Đã tạo lịch hẹn thành công',
      maLich: result.recordset[0].MaLich,
    };
  }

  async updateAppointment(
    user: CurrentUser,
    maLich: number,
    body: AppointmentUpdateBody,
  ) {
    this.checkRole(user, ['Quản trị viên']);

    const id = this.validId(maLich);

    const found = await this.pool()
      .request()
      .input('MaLich', sql.Int, id)
      .query(`
        SELECT MaLich, MaYC, NgayHen, TrangThai
        FROM dbo.LichHenChamSoc
        WHERE MaLich = @MaLich
      `);

    const appointment = found.recordset[0];

    if (!appointment) {
      throw new NotFoundException(
        'Không tìm thấy lịch chăm sóc',
      );
    }

    
const assignment = await this.pool()
  .request()
  .input('MaLich', sql.Int, id)
  .query(`
    SELECT
      L.MaNV,
      YC.NhomYeuCau,
      YC.TrangThai AS TrangThaiYeuCau
    FROM dbo.LichHenChamSoc L
    INNER JOIN dbo.YeuCauHauMai YC
      ON YC.MaYC = L.MaYC
    WHERE L.MaLich = @MaLich
  `);

const current = assignment.recordset[0];

if (!current) {
  throw new NotFoundException(
    'Không tìm thấy lịch hẹn',
  );
}

if (
  user.role === 'Nhân viên' &&
  Number(current.MaNV) !== Number(user.maNV)
) {
  throw new ForbiddenException(
    'Lịch hẹn không được phân công cho bạn',
  );
}

if (
  !['Bảo hành', 'Hậu mãi'].includes(current.NhomYeuCau)
) {
  throw new BadRequestException(
    'Lịch không thuộc yêu cầu hợp lệ',
  );
}

if (
  ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
    current.TrangThaiYeuCau,
  )
) {
  throw new BadRequestException(
    'Yêu cầu đã kết thúc',
  );
}


    const transitions: Record<string, string[]> = {
      'Chờ xác nhận': ['Đã xác nhận', 'Đã hủy'],
      'Đã xác nhận': ['Đang thực hiện', 'Đã hủy'],
      'Đang thực hiện': ['Hoàn tất', 'Đã hủy'],
    };

    const trangThai = body?.trangThai;

    if (
      !trangThai ||
      !transitions[appointment.TrangThai]?.includes(
        trangThai,
      )
    ) {
      throw new BadRequestException(
        'Chuyển trạng thái lịch không hợp lệ',
      );
    }

    const ketQua =
      typeof body?.ketQua === 'string'
        ? body.ketQua.trim()
        : '';

    if (trangThai === 'Hoàn tất' && !ketQua) {
      throw new BadRequestException(
        'Vui lòng nhập kết quả chăm sóc',
      );
    }

    if (
      trangThai === 'Hoàn tất' &&
      new Date(appointment.NgayHen).getTime() > Date.now()
    ) {
      throw new BadRequestException(
        'Chưa đến ngày hẹn, không thể hoàn tất',
      );
    }

    const result = await this.pool()
      .request()
      .input('MaLich', sql.Int, id)
      .input('TrangThai', sql.NVarChar(40), trangThai)
      .input(
        'TrangThaiCu',
        sql.NVarChar(40),
        appointment.TrangThai,
      )
      .input('KetQua', sql.NVarChar(sql.MAX), ketQua)
      .query(`
        UPDATE dbo.LichHenChamSoc
        SET TrangThai = @TrangThai,
            KetQua = CASE
              WHEN @KetQua <> N''
              THEN @KetQua
              ELSE KetQua
            END,
            NgayHoanTat = CASE
              WHEN @TrangThai = N'Hoàn tất'
              THEN SYSDATETIME()
              ELSE NgayHoanTat
            END
        WHERE MaLich = @MaLich
          AND TrangThai = @TrangThaiCu
          AND (
            @TrangThai <> N'Hoàn tất'
            OR NgayHen <= SYSDATETIME()
          );

        SELECT @@ROWCOUNT AS SoDong;
      `);

    if (result.recordset[0]?.SoDong !== 1) {
      throw new BadRequestException(
        'Không thể cập nhật lịch chăm sóc',
      );
    }

    return {
      success: true,
      message: 'Đã cập nhật lịch chăm sóc',
    };
  }

  async completeAfterSales(
    user: CurrentUser,
    maYC: number,
    resultText: string,
  ) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const id = this.validId(maYC);
    const current = await this.detail(user, id);

    if (current.ticket.NhomYeuCau !== 'Hậu mãi') {
      throw new BadRequestException(
        'Đây không phải yêu cầu hậu mãi',
      );
    }

    if (
      ['Đã đóng', 'Từ chối', 'Đã hủy'].includes(
        current.ticket.TrangThai,
      )
    ) {
      throw new BadRequestException('Yêu cầu đã kết thúc');
    }

    const ketQua =
      typeof resultText === 'string'
        ? resultText.trim()
        : '';

    if (!ketQua) {
      throw new BadRequestException(
        'Vui lòng nhập kết quả hậu mãi',
      );
    }

    const transaction = new sql.Transaction(this.pool());
    await transaction.begin();

    try {
      const appointments = await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .query(`
          SELECT
            COUNT(*) AS TongLich,
            SUM(
              CASE WHEN TrangThai = N'Hoàn tất'
              THEN 1 ELSE 0 END
            ) AS DaHoanTat,
            SUM(
              CASE WHEN TrangThai NOT IN (
                N'Hoàn tất',
                N'Đã hủy'
              )
              THEN 1 ELSE 0 END
            ) AS ChuaKetThuc
          FROM dbo.LichHenChamSoc WITH (
            UPDLOCK, HOLDLOCK
          )
          WHERE MaYC = @MaYC
        `);

      const info = appointments.recordset[0];

      if (
        info.TongLich === 0 ||
        info.DaHoanTat === 0 ||
        info.ChuaKetThuc > 0
      ) {
        throw new BadRequestException(
          'Cần có lịch hoàn tất và không còn lịch đang xử lý',
        );
      }

      const updated = await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input('KetQua', sql.NVarChar(sql.MAX), ketQua)
        .query(`
          UPDATE dbo.YeuCauHauMai
          SET TrangThai = N'Đã đóng',
              KetQua = @KetQua,
              NgayDong = SYSDATETIME()
          WHERE MaYC = @MaYC
            AND NhomYeuCau = N'Hậu mãi'
            AND TrangThai NOT IN (
              N'Đã đóng',
              N'Từ chối',
              N'Đã hủy'
            );

          SELECT @@ROWCOUNT AS SoDong;
        `);

      if (updated.recordset[0]?.SoDong !== 1) {
        throw new BadRequestException(
          'Không thể đóng yêu cầu hậu mãi',
        );
      }

      await new sql.Request(transaction)
        .input('MaYC', sql.Int, id)
        .input(
          'Cu',
          sql.NVarChar(40),
          current.ticket.TrangThai,
        )
        .input('NguoiDung', sql.Int, user.sub)
        .input('LyDo', sql.NVarChar(sql.MAX), ketQua)
        .query(`
          INSERT INTO dbo.LichSuTrangThai (
            MaYC,
            TrangThaiCu,
            TrangThaiMoi,
            MaNguoiThayDoi,
            LyDo
          )
          VALUES (
            @MaYC,
            @Cu,
            N'Đã đóng',
            @NguoiDung,
            @LyDo
          )
        `);

      await transaction.commit();

      return {
        success: true,
        message: 'Đã hoàn tất yêu cầu hậu mãi',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async sla(user: CurrentUser) {
    this.checkRole(user, ['Quản trị viên', 'Nhân viên']);

    const request = this.pool().request();

    const condition =
      user.role === 'Nhân viên'
        ? 'WHERE YC.MaNVXuLy = @MaNV'
        : '';

    if (user.role === 'Nhân viên') {
      request.input('MaNV', sql.Int, user.maNV);
    }

    const result = await request.query(`
      SELECT
        YC.MaYC,
        YC.TieuDe,
        YC.NhomYeuCau,
        YC.TrangThai,
        YC.MaNVXuLy,
        YC.NgayTao,
        YC.NgayPhanHoiDau,
        YC.NgayDong,
        S.HanPhanHoi,
        S.HanXuLy,
        S.QuaHanPhanHoi,
        S.QuaHanXuLy,
        CASE
          WHEN S.HanPhanHoi IS NULL
            THEN N'Chưa thiết lập'
          WHEN YC.NgayPhanHoiDau IS NOT NULL
            AND YC.NgayPhanHoiDau <= S.HanPhanHoi
            THEN N'Đã phản hồi đúng hạn'
          WHEN YC.NgayPhanHoiDau IS NOT NULL
            THEN N'Đã phản hồi trễ'
          WHEN SYSDATETIME() > S.HanPhanHoi
            THEN N'Chưa phản hồi - quá hạn'
          ELSE N'Đang trong hạn'
        END AS TrangThaiPhanHoi,
        CASE
          WHEN S.HanXuLy IS NULL
            THEN N'Chưa thiết lập'
          WHEN YC.NgayDong IS NOT NULL
            AND YC.NgayDong <= S.HanXuLy
            THEN N'Đã hoàn tất đúng hạn'
          WHEN YC.NgayDong IS NOT NULL
            THEN N'Đã hoàn tất trễ'
          WHEN YC.TrangThai IN (
            N'Đã đóng',
            N'Từ chối',
            N'Đã hủy'
          )
            THEN N'Đã kết thúc - thiếu ngày đóng'
          WHEN SYSDATETIME() > S.HanXuLy
            THEN N'Đang xử lý - quá hạn'
          ELSE N'Đang trong hạn'
        END AS TrangThaiXuLy
      FROM dbo.YeuCauHauMai YC
      JOIN dbo.vwSLAYeuCau S
        ON S.MaYC = YC.MaYC
      ${condition}
      ORDER BY
        S.QuaHanXuLy DESC,
        S.QuaHanPhanHoi DESC,
        YC.NgayTao DESC,
        YC.MaYC DESC
    `);

    return result.recordset;
  }
}
