
import { Injectable, NotFoundException } from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { DatabaseConfig } from '../config/DatabaseConfig';

@Injectable()
export class CategoryService {
  constructor(private readonly databaseConfig: DatabaseConfig) {}

  async getAllCategories() {
    const pool = this.databaseConfig.getConnection();

    const result = await pool.request().query(`
      SELECT
        MaDM,
        MaDMCha,
        TenDM,
        MoTa,
        HinhAnh,
        TrangThai
      FROM dbo.DanhMuc
      WHERE TrangThai = 1
      ORDER BY MaDM ASC
    `);

    return {
      success: true,
      total: result.recordset.length,
      data: result.recordset,
    };
  }

  async getCategoryById(id: number) {
    const pool = this.databaseConfig.getConnection();

    const result = await pool
      .request()
      .input('MaDM', sql.Int, id)
      .query(`
        SELECT
          MaDM,
          MaDMCha,
          TenDM,
          MoTa,
          HinhAnh,
          TrangThai
        FROM dbo.DanhMuc
        WHERE MaDM = @MaDM AND TrangThai = 1
      `);

    if (result.recordset.length === 0) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return {
      success: true,
      data: result.recordset[0],
    };
  }
}
