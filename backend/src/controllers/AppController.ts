
import { Controller, Get } from '@nestjs/common';
import { AppService } from '../services/AppService';
import { DatabaseConfig } from '../config/DatabaseConfig';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseConfig: DatabaseConfig,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('db-check')
  async checkDatabase() {
    const pool = this.databaseConfig.getConnection();

    const result = await pool.request().query(
      'SELECT DB_NAME() AS DatabaseName, COUNT(*) AS TableCount FROM sys.tables',
    );

    return {
      success: true,
      database: result.recordset[0].DatabaseName,
      tables: result.recordset[0].TableCount,
    };
  }
}
