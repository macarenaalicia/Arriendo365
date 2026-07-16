import { Controller, Get, Param } from '@nestjs/common';
import { PublicPropiedadesService } from './public-propiedades.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('public/organizaciones/:organizacionId/propiedades')
export class PublicPropiedadesController {
  constructor(private readonly service: PublicPropiedadesService) {}

  @Get()
  findAll(@Param('organizacionId') organizacionId: string) {
    return this.service.findAll(organizacionId);
  }

  @Get(':id')
  findOne(@Param('organizacionId') organizacionId: string, @Param('id') id: string) {
    return this.service.findOne(organizacionId, id);
  }
}
