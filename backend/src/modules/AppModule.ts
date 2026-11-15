
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '../controllers/AppController';
import { AppService } from '../services/AppService';
import { DatabaseModule } from './DatabaseModule';
import { PlantModule } from './PlantModule';
import { CategoryModule } from './CategoryModule';
import { AuthModule } from './AuthModule';
import { SupportModule } from './SupportModule';
import { OrderModule } from './OrderModule';
import { StockModule } from './StockModule';
import { CheckoutModule } from './CheckoutModule';
import { AddressModule } from './AddressModule';
import { RentalModule } from './RentalModule';
import { PaymentModule } from './PaymentModule';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    PlantModule,
    CategoryModule,
    SupportModule,
    OrderModule,
    StockModule,
    CheckoutModule,
    AddressModule,
    RentalModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
