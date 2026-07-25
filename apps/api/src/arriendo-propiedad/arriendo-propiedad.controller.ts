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
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RolUsuario } from '@prisma/client';
import { ArriendoPropiedadService } from './arriendo-propiedad.service';
import { CreateArriendoPropiedadDto } from './dto/create-arriendo-propiedad.dto';
import { UpdateArriendoPropiedadDto } from './dto/update-arriendo-propiedad.dto';
import { FindArriendosPropiedadDto } from './dto/find-arriendos-propiedad.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('arriendos-propiedad')
export class ArriendoPropiedadController {
  constructor(private readonly arriendoPropiedadService: ArriendoPropiedadService) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Post()
  create(@Body() dto: CreateArriendoPropiedadDto) {
    return this.arriendoPropiedadService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindArriendosPropiedadDto) {
    return this.arriendoPropiedadService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.arriendoPropiedadService.findOne(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArriendoPropiedadDto) {
    return this.arriendoPropiedadService.update(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.arriendoPropiedadService.remove(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Post(':id/aplicar-reajuste-ipc')
  aplicarReajusteIpc(@Param('id') id: string) {
    return this.arriendoPropiedadService.aplicarReajusteIpc(id);
  }

  @Get(':id/contrato.pdf')
  async descargarContrato(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.arriendoPropiedadService.generarContratoPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="contrato-${id}.pdf"`,
    });
    res.send(pdf);
  }
}
