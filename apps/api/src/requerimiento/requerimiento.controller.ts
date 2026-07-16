import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { RequerimientoService } from './requerimiento.service';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto';
import { FindRequerimientosDto } from './dto/find-requerimientos.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('requerimientos')
export class RequerimientoController {
  constructor(private readonly requerimientoService: RequerimientoService) {}

  @Post()
  create(@Body() dto: CreateRequerimientoDto) {
    return this.requerimientoService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindRequerimientosDto) {
    return this.requerimientoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requerimientoService.findOne(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequerimientoDto) {
    return this.requerimientoService.update(id, dto);
  }
}
