
import { Module } from '@nestjs/common';
import { SupportController } from '../controllers/SupportController';
import { SupportService } from '../services/SupportService';

@Module({
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
