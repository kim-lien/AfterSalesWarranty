
import { Module } from '@nestjs/common';
import { StockController } from '../controllers/StockController';
import { DatabaseModule } from './DatabaseModule';

@Module({
  imports: [DatabaseModule],
  controllers: [StockController],
})
export class StockModule {}
