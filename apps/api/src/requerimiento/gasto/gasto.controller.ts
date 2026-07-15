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
import { GastoService } from './gasto.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('requerimientos/:requerimientoId/gastos')
export class GastoController {
  constructor(private readonly gastoService: GastoService) {}

  @Post()
  create(@Param('requerimientoId') requerimientoId: string, @Body() dto: CreateGastoDto) {
    return this.gastoService.create(requerimientoId, dto);
  }

  @Get()
  findAll(@Param('requerimientoId') requerimientoId: string) {
    return this.gastoService.findAll(requerimientoId);
  }

  @Get(':id')
  findOne(@Param('requerimientoId') requerimientoId: string, @Param('id') id: string) {
    return this.gastoService.findOne(requerimientoId, id);
  }

  @Patch(':id')
  update(
    @Param('requerimientoId') requerimientoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGastoDto,
  ) {
    return this.gastoService.update(requerimientoId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('requerimientoId') requerimientoId: string, @Param('id') id: string) {
    return this.gastoService.remove(requerimientoId, id);
  }
}
