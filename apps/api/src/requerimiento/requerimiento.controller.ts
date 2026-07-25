import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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
    return this.requerimientoService.obtenerParaMostrar(id);
  }

  @Get(':id/descarga.pdf')
  async descargar(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.requerimientoService.generarPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="requerimiento-${id}.pdf"`,
    });
    res.send(pdf);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequerimientoDto) {
    return this.requerimientoService.update(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requerimientoService.remove(id);
  }
}
