
import { Module } from '@nestjs/common';
import { PlantController } from '../controllers/PlantController';
import { PlantService } from '../services/PlantService';

@Module({
  controllers: [PlantController],
  providers: [PlantService],
})
export class PlantModule {}
