
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql/msnodesqlv8';

@Injectable()
export class DatabaseConfig implements OnModuleInit, OnModuleDestroy {
  private pool: sql.ConnectionPool | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.getOrThrow<string>('DB_HOST');
    const database = this.configService.getOrThrow<string>('DB_NAME');
    const driver = this.configService.getOrThrow<string>('DB_DRIVER');

    const connectionString = [
      `Driver={${driver}}`,
      `Server=${host}`,
      `Database=${database}`,
      'Trusted_Connection=Yes',
      'Encrypt=Yes',
      'TrustServerCertificate=Yes',
    ].join(';') + ';';

    this.pool = new sql.ConnectionPool({
      server: host,
      database,
      driver,
      options: {
        trustedConnection: true,
        trustServerCertificate: true,
        encrypt: true,
      },
      beforeConnect: (connection: any) => {
        connection.conn_str = connectionString;
      },
    });

    await this.pool.connect();

    console.log(`Đã kết nối SQL Server: ${database}`);
  }

  getConnection(): sql.ConnectionPool {
    if (!this.pool?.connected) {
      throw new Error('SQL Server chưa được kết nối');
    }

    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
    }
  }
}
