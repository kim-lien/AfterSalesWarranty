
const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcryptjs');
const readline = require('node:readline/promises');

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let pool;

  try {
    const username = (await rl.question('Tên đăng nhập cần đặt lại: ')).trim();
    const password = await rl.question('Mật khẩu mới: ');

    if (!username || password.length < 1) {
      throw new Error('Tên đăng nhập không được trống và mật khẩu phải có ít nhất 8 ký tự');
    }

    pool = await sql.connect({
      server: 'ADMIN',
      database: 'QuanLyCayCanh',
      driver: 'ODBC Driver 18 for SQL Server',
      options: {
        trustedConnection: true,
        trustServerCertificate: true,
        encrypt: true,
      },
      beforeConnect: (connection) => {
        connection.conn_str =
          'Driver={ODBC Driver 18 for SQL Server};Server=ADMIN;Database=QuanLyCayCanh;Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=Yes;';
      },
    });

    const account = await pool.request()
      .input('TenDangNhap', sql.VarChar(50), username)
      .query(`
        SELECT ND.MaNguoiDung, VT.TenVaiTro
        FROM dbo.NguoiDung ND
        JOIN dbo.VaiTro VT ON VT.MaVaiTro = ND.MaVaiTro
        WHERE ND.TenDangNhap = @TenDangNhap
      `);

    if (!account.recordset.length) {
      throw new Error('Không tìm thấy tài khoản');
    }

    const role = account.recordset[0].TenVaiTro;

    if (!['Quản trị viên', 'Nhân viên'].includes(role)) {
      throw new Error('Chỉ cho phép đặt lại tài khoản demo Admin và Nhân viên');
    }

    const hash = await bcrypt.hash(password, 12);

    await pool.request()
      .input('TenDangNhap', sql.VarChar(50), username)
      .input('MatKhau', sql.VarChar(255), hash)
      .query(`
        UPDATE dbo.NguoiDung
        SET MatKhau = @MatKhau
        WHERE TenDangNhap = @TenDangNhap
      `);

    console.log(`Đã cập nhật mật khẩu cho ${username} (${role})`);
  } catch (error) {
    console.error('Lỗi:', error.message);
    process.exitCode = 1;
  } finally {
    if (pool) await pool.close();
    rl.close();
  }
}

main();
