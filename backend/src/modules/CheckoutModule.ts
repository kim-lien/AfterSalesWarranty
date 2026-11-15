
import { Module } from '@nestjs/common';
import { CheckoutController } from '../controllers/CheckoutController';
import { CheckoutService } from '../services/CheckoutService';
import { DatabaseModule } from './DatabaseModule';

@Module({
  imports: [DatabaseModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
