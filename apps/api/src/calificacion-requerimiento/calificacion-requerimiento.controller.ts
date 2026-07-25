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
import { CalificacionRequerimientoService } from './calificacion-requerimiento.service';
import { CreateCalificacionRequerimientoDto } from './dto/create-calificacion-requerimiento.dto';
import { UpdateCalificacionRequerimientoDto } from './dto/update-calificacion-requerimiento.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('calificaciones-requerimiento')
export class CalificacionRequerimientoController {
  constructor(
    private readonly calificacionRequerimientoService: CalificacionRequerimientoService,
  ) {}

  @Post()
  create(@Body() dto: CreateCalificacionRequerimientoDto) {
    return this.calificacionRequerimientoService.create(dto);
  }

  // El arrendatario puede consultar (solo lectura) para poder elegir una
  // calificación al crear un requerimiento — el resto es solo staff.
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.PROPIETARIO,
    RolUsuario.TECNICO,
    RolUsuario.ARRENDATARIO,
  )
  @Get()
  findAll() {
    return this.calificacionRequerimientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calificacionRequerimientoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCalificacionRequerimientoDto) {
    return this.calificacionRequerimientoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.calificacionRequerimientoService.remove(id);
  }
}
