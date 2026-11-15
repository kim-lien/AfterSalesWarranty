
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DatabaseConfig } from '../config/DatabaseConfig';

@Controller('stock')
export class StockController {
  constructor(private readonly database: DatabaseConfig) {}

  @Get('products/:id')
  async getProductStock(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.database
      .getConnection()
      .request()
      .input('MaSP', id)
      .query(`
        SELECT
          SP.MaSP,
          SP.TenSP,
          SP.TrangThai,
          COALESCE(SUM(
            CASE
              WHEN K.TrangThai = 1
              THEN TK.SoLuongTon
              ELSE 0
            END
          ), 0) AS SoLuongTon,
          COALESCE(SUM(
            CASE
              WHEN K.TrangThai = 1
              THEN TK.SoLuongDangThue
              ELSE 0
            END
          ), 0) AS SoLuongDangThue,
          COALESCE(SUM(
            CASE
              WHEN K.TrangThai = 1
              THEN TK.SoLuongKhaDung
              ELSE 0
            END
          ), 0) AS SoLuongKhaDung
        FROM dbo.SanPham SP
        LEFT JOIN dbo.TonKho TK ON TK.MaSP = SP.MaSP
        LEFT JOIN dbo.Kho K ON K.MaKho = TK.MaKho
        WHERE SP.MaSP = @MaSP
        GROUP BY
          SP.MaSP,
          SP.TenSP,
          SP.TrangThai
      `);

    const stock = result.recordset[0];

    if (!stock) {
      return {
        success: false,
        message: 'Không tìm thấy sản phẩm',
        data: null,
      };
    }

    const available = Number(stock.SoLuongKhaDung);

    let tinhTrang = 'Còn hàng';

    if (!stock.TrangThai) {
      tinhTrang = 'Ngừng kinh doanh';
    } else if (available <= 0) {
      tinhTrang = 'Hết hàng';
    } else if (available <= 5) {
      tinhTrang = `Chỉ còn ${available} cây`;
    }

    return {
      success: true,
      data: {
        MaSP: stock.MaSP,
        SoLuongTon: Number(stock.SoLuongTon),
        SoLuongDangThue: Number(stock.SoLuongDangThue),
        SoLuongKhaDung: available,
        TrangThai: Boolean(stock.TrangThai),
        TinhTrang: tinhTrang,
      },
    };
  }
}
