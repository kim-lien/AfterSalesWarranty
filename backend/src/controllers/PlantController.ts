
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PlantService } from '../services/PlantService';

@Controller('plants')
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Get()
  getAllPlants() {
    return this.plantService.getAllPlants();
  }

  @Get(':id')
  getPlantById(@Param('id', ParseIntPipe) id: number) {
    return this.plantService.getPlantById(id);
  }
}
