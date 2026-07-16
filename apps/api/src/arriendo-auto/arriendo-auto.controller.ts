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
import { ArriendoAutoService } from './arriendo-auto.service';
import { CreateArriendoAutoDto } from './dto/create-arriendo-auto.dto';
import { UpdateArriendoAutoDto } from './dto/update-arriendo-auto.dto';
import { FindArriendosAutoDto } from './dto/find-arriendos-auto.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('arriendos-auto')
export class ArriendoAutoController {
  constructor(private readonly arriendoAutoService: ArriendoAutoService) {}

  @Post()
  create(@Body() dto: CreateArriendoAutoDto) {
    return this.arriendoAutoService.create(dto);
  }

  // El arrendatario puede consultar (solo lectura) sus propios arriendos de
  // auto — el resto de acciones sigue siendo solo staff.
  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.PROPIETARIO,
    RolUsuario.TECNICO,
    RolUsuario.ARRENDATARIO,
  )
  @Get()
  findAll(@Query() query: FindArriendosAutoDto) {
    return this.arriendoAutoService.findAll(query);
  }

  @Roles(
    RolUsuario.ADMINISTRADOR,
    RolUsuario.PROPIETARIO,
    RolUsuario.TECNICO,
    RolUsuario.ARRENDATARIO,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.arriendoAutoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArriendoAutoDto) {
    return this.arriendoAutoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.arriendoAutoService.remove(id);
  }
}
