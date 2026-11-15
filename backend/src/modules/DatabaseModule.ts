
import { Global, Module } from '@nestjs/common';
import { DatabaseConfig } from '../config/DatabaseConfig';

@Global()
@Module({
  providers: [DatabaseConfig],
  exports: [DatabaseConfig],
})
export class DatabaseModule {}
