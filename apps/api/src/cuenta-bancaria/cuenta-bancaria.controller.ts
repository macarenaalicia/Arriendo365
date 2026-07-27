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
import { CuentaBancariaService } from './cuenta-bancaria.service';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
@Controller('cuentas-bancarias')
export class CuentaBancariaController {
  constructor(private readonly cuentaBancariaService: CuentaBancariaService) {}

  @Post()
  create(@Body() dto: CreateCuentaBancariaDto) {
    return this.cuentaBancariaService.create(dto);
  }

  @Get()
  findAll() {
    return this.cuentaBancariaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cuentaBancariaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCuentaBancariaDto) {
    return this.cuentaBancariaService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.cuentaBancariaService.remove(id);
  }
}
