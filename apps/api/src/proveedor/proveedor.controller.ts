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
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('propiedades/:propiedadId/proveedores')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  create(@Param('propiedadId') propiedadId: string, @Body() dto: CreateProveedorDto) {
    return this.proveedorService.create(propiedadId, dto);
  }

  @Get()
  findAll(@Param('propiedadId') propiedadId: string) {
    return this.proveedorService.findAll(propiedadId);
  }

  @Get(':id')
  findOne(@Param('propiedadId') propiedadId: string, @Param('id') id: string) {
    return this.proveedorService.findOne(propiedadId, id);
  }

  @Patch(':id')
  update(
    @Param('propiedadId') propiedadId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(propiedadId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('propiedadId') propiedadId: string, @Param('id') id: string) {
    return this.proveedorService.remove(propiedadId, id);
  }
}
