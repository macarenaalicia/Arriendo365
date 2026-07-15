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
import { ConfiguracionMantencionService } from './configuracion-mantencion.service';
import { CreateConfiguracionMantencionDto } from './dto/create-configuracion-mantencion.dto';
import { UpdateConfiguracionMantencionDto } from './dto/update-configuracion-mantencion.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('configuraciones-mantencion')
export class ConfiguracionMantencionController {
  constructor(private readonly configuracionMantencionService: ConfiguracionMantencionService) {}

  @Post()
  create(@Body() dto: CreateConfiguracionMantencionDto) {
    return this.configuracionMantencionService.create(dto);
  }

  @Get()
  findAll() {
    return this.configuracionMantencionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.configuracionMantencionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConfiguracionMantencionDto) {
    return this.configuracionMantencionService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.configuracionMantencionService.remove(id);
  }
}
