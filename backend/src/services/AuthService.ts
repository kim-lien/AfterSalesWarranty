
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseConfig } from '../config/DatabaseConfig';
import * as sql from 'mssql/msnodesqlv8';
import * as bcrypt from 'bcryptjs';

type RegisterData = {
  hoTen: string;
  tenDangNhap: string;
  email: string;
  matKhau: string;
  sdt?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseConfig,
    private readonly jwt: JwtService,
  ) {}

  async login(tenDangNhap: string, matKhau: string) {
    if (!tenDangNhap?.trim() || !matKhau) {
      throw new UnauthorizedException(
        'Vui lòng nhập tên đăng nhập và mật khẩu',
      );
    }

    const result = await this.database
      .getConnection()
      .request()
      .input('TenDangNhap', sql.VarChar(50), tenDangNhap.trim())
      .query(`
        SELECT
          ND.MaNguoiDung,
          ND.TenDangNhap,
          ND.HoTen,
          ND.Email,
          ND.MatKhau,
          ND.TrangThai,
          VT.TenVaiTro,
          KH.MaKH,
          NV.MaNV
        FROM dbo.NguoiDung ND
        JOIN dbo.VaiTro VT ON VT.MaVaiTro = ND.MaVaiTro
        LEFT JOIN dbo.KhachHang KH ON KH.MaNguoiDung = ND.MaNguoiDung
        LEFT JOIN dbo.NhanVien NV ON NV.MaNguoiDung = ND.MaNguoiDung
        WHERE ND.TenDangNhap = @TenDangNhap
      `);

    const user = result.recordset[0];
    const hash = String(user?.MatKhau ?? '').replace(/^\$2y\$/, '$2b$');

    if (
      !user ||
      !user.TrangThai ||
      !(await bcrypt.compare(matKhau, hash))
    ) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không đúng',
      );
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.MaNguoiDung,
      role: user.TenVaiTro,
      maKH: user.MaKH,
      maNV: user.MaNV,
    });

    return {
      accessToken,
      user: {
        MaNguoiDung: user.MaNguoiDung,
        TenDangNhap: user.TenDangNhap,
        HoTen: user.HoTen,
        Email: user.Email,
        TenVaiTro: user.TenVaiTro,
        MaKH: user.MaKH,
        MaNV: user.MaNV,
      },
    };
  }

  async register(data: RegisterData) {
    const hoTen = data?.hoTen?.trim();
    const tenDangNhap = data?.tenDangNhap?.trim();
    const email = data?.email?.trim().toLowerCase();
    const matKhau = data?.matKhau;
    const sdt = data?.sdt?.trim() || null;

    if (
      !hoTen ||
      hoTen.length > 100 ||
      !tenDangNhap ||
      !/^[a-zA-Z0-9_]{3,50}$/.test(tenDangNhap) ||
      !email ||
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !matKhau ||
      matKhau.length < 1 ||
      matKhau.length > 72 ||
      (sdt !== null && !/^[0-9]{9,15}$/.test(sdt))
    ) {
      throw new BadRequestException(
        'Thông tin đăng ký không hợp lệ',
      );
    }

    const pool = this.database.getConnection();

    const existing = await pool
      .request()
      .input('TenDangNhap', sql.VarChar(50), tenDangNhap)
      .input('Email', sql.VarChar(150), email)
      .query(`
        SELECT TenDangNhap, Email
        FROM dbo.NguoiDung
        WHERE TenDangNhap = @TenDangNhap
           OR Email = @Email
      `);

    if (existing.recordset.length > 0) {
      throw new ConflictException(
        'Tên đăng nhập hoặc email đã được sử dụng',
      );
    }

    const matKhauMaHoa = await bcrypt.hash(matKhau, 12);
    const transaction = new sql.Transaction(pool);

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
      const result = await new sql.Request(transaction)
        .input('HoTen', sql.NVarChar(100), hoTen)
        .input('TenDangNhap', sql.VarChar(50), tenDangNhap)
        .input('Email', sql.VarChar(150), email)
        .input('MatKhau', sql.VarChar(255), matKhauMaHoa)
        .input('SDT', sql.VarChar(15), sdt)
        .query(`
          DECLARE @MaVaiTro INT;

          SELECT @MaVaiTro = MaVaiTro
          FROM dbo.VaiTro
          WHERE TenVaiTro = N'Khách hàng';

          IF @MaVaiTro IS NULL
            THROW 50001, N'Không tìm thấy vai trò khách hàng', 1;

          INSERT INTO dbo.NguoiDung (
            MaVaiTro,
            HoTen,
            TenDangNhap,
            Email,
            MatKhau,
            SDT
          )
          VALUES (
            @MaVaiTro,
            @HoTen,
            @TenDangNhap,
            @Email,
            @MatKhau,
            @SDT
          );

          DECLARE @MaNguoiDung INT = SCOPE_IDENTITY();

          INSERT INTO dbo.KhachHang (MaNguoiDung)
          VALUES (@MaNguoiDung);

          SELECT
            @MaNguoiDung AS MaNguoiDung,
            SCOPE_IDENTITY() AS MaKH;
        `);

      await transaction.commit();

      return {
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          MaNguoiDung: result.recordset[0].MaNguoiDung,
          MaKH: result.recordset[0].MaKH,
          TenDangNhap: tenDangNhap,
          HoTen: hoTen,
          Email: email,
        },
      };
    } catch (error) {
      await transaction.rollback();

      if (
        typeof error === 'object' &&
        error !== null &&
        'number' in error &&
        [2601, 2627].includes(Number(error.number))
      ) {
        throw new ConflictException(
          'Tên đăng nhập hoặc email đã tồn tại',
        );
      }

      throw error;
    }
  }
}
