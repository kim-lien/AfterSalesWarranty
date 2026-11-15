
import { Module } from '@nestjs/common';
import { CategoryController } from '../controllers/CategoryController';
import { CategoryService } from '../services/CategoryService';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
