
import { Injectable, NotFoundException } from '@nestjs/common';
import * as sql from 'mssql/msnodesqlv8';
import { DatabaseConfig } from '../config/DatabaseConfig';

@Injectable()
export class PlantService {
  constructor(private readonly databaseConfig: DatabaseConfig) {}

  async getAllPlants() {
    const pool = this.databaseConfig.getConnection();

    const result = await pool.request().query(`
      SELECT
        MaSP,
        MaDM,
        TenSP,
        MoTa,
        HinhAnh,
        LoaiSanPham,
        GiaBan,
        GiaThueTheoNgay,
        GiaTriCay,
        DuDieuKienBaoHanh,
        ChieuCao,
        NhuCauAnhSang,
        HuongDanChamSoc,
        DonViTinh,
        TrangThai
      FROM dbo.SanPham
      ORDER BY MaSP DESC
    `);

    return {
      success: true,
      total: result.recordset.length,
      data: result.recordset,
    };
  }

  async getPlantById(id: number) {
    const pool = this.databaseConfig.getConnection();

    const result = await pool
      .request()
      .input('MaSP', sql.Int, id)
      .query(`
        SELECT
          MaSP,
          MaDM,
          TenSP,
          MoTa,
          HinhAnh,
          LoaiSanPham,
          GiaBan,
          GiaThueTheoNgay,
          GiaTriCay,
          DuDieuKienBaoHanh,
          ChieuCao,
          NhuCauAnhSang,
          HuongDanChamSoc,
          DonViTinh,
          TrangThai
        FROM dbo.SanPham
        WHERE MaSP = @MaSP
      `);

    if (result.recordset.length === 0) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return {
      success: true,
      data: result.recordset[0],
    };
  }
}
