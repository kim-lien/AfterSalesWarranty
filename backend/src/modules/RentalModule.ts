
import { Module } from '@nestjs/common';
import { RentalController } from '../controllers/RentalController';
import { DatabaseModule } from './DatabaseModule';

@Module({
  imports: [DatabaseModule],
  controllers: [RentalController],
})
export class RentalModule {}
