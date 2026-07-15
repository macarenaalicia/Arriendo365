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
import { CobroAutoService } from './cobro-auto.service';
import { CreateCobroAutoDto } from './dto/create-cobro-auto.dto';
import { UpdateCobroAutoDto } from './dto/update-cobro-auto.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('autos/:autoId/cobros')
export class CobroAutoController {
  constructor(private readonly cobroAutoService: CobroAutoService) {}

  @Post()
  create(@Param('autoId') autoId: string, @Body() dto: CreateCobroAutoDto) {
    return this.cobroAutoService.create(autoId, dto);
  }

  @Get()
  findAll(@Param('autoId') autoId: string) {
    return this.cobroAutoService.findAll(autoId);
  }

  @Get(':id')
  findOne(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.cobroAutoService.findOne(autoId, id);
  }

  @Patch(':id')
  update(
    @Param('autoId') autoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCobroAutoDto,
  ) {
    return this.cobroAutoService.update(autoId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.cobroAutoService.remove(autoId, id);
  }
}
