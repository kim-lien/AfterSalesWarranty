
const sql = require('mssql/msnodesqlv8');

async function testDatabase() {
  try {
    const pool = await sql.connect({
      connectionString:
        'Driver={ODBC Driver 18 for SQL Server};Server=ADMIN;Database=QuanLyCayCanh;Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=Yes;',
    });

    const result = await pool.request().query('SELECT DB_NAME() AS DatabaseName');

    console.log('Kết nối SQL Server thành công!');
    console.log('Database:', result.recordset[0].DatabaseName);

    await pool.close();
  } catch (error) {
    console.error('Kết nối thất bại:', error.message);
    process.exitCode = 1;
  }
}

testDatabase();
