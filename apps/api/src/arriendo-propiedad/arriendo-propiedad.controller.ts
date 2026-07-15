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
} from '@nestjs/common';
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
}
