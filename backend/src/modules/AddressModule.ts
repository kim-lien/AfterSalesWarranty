
import { Module } from '@nestjs/common';
import { AddressController } from '../controllers/AddressController';
import { DatabaseModule } from './DatabaseModule';


@Module({
  imports: [DatabaseModule],
  controllers: [AddressController],
})
export class AddressModule {}
