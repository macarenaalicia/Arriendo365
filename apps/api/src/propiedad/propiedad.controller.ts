import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { PropiedadService } from './propiedad.service';
import { CreatePropiedadDto } from './dto/create-propiedad.dto';
import { UpdatePropiedadDto } from './dto/update-propiedad.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('propiedades')
export class PropiedadController {
  constructor(private readonly propiedadService: PropiedadService) {}

  @Post()
  create(@Body() dto: CreatePropiedadDto) {
    return this.propiedadService.create(dto);
  }

  @Get()
  findAll() {
    return this.propiedadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propiedadService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropiedadDto) {
    return this.propiedadService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.propiedadService.remove(id);
  }
}
