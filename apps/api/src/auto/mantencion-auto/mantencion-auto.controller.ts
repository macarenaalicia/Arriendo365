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
import { MantencionAutoService } from './mantencion-auto.service';
import { CreateMantencionAutoDto } from './dto/create-mantencion-auto.dto';
import { UpdateMantencionAutoDto } from './dto/update-mantencion-auto.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('autos/:autoId/mantenciones')
export class MantencionAutoController {
  constructor(private readonly mantencionAutoService: MantencionAutoService) {}

  @Post()
  create(@Param('autoId') autoId: string, @Body() dto: CreateMantencionAutoDto) {
    return this.mantencionAutoService.create(autoId, dto);
  }

  @Get()
  findAll(@Param('autoId') autoId: string) {
    return this.mantencionAutoService.findAll(autoId);
  }

  @Get(':id')
  findOne(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.mantencionAutoService.findOne(autoId, id);
  }

  @Patch(':id')
  update(
    @Param('autoId') autoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMantencionAutoDto,
  ) {
    return this.mantencionAutoService.update(autoId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.mantencionAutoService.remove(autoId, id);
  }
}
