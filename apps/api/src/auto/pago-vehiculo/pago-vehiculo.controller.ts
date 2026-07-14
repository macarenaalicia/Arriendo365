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
import { PagoVehiculoService } from './pago-vehiculo.service';
import { CreatePagoVehiculoDto } from './dto/create-pago-vehiculo.dto';
import { UpdatePagoVehiculoDto } from './dto/update-pago-vehiculo.dto';

@Controller('autos/:autoId/pagos-vehiculo')
export class PagoVehiculoController {
  constructor(private readonly pagoVehiculoService: PagoVehiculoService) {}

  @Post()
  create(@Param('autoId') autoId: string, @Body() dto: CreatePagoVehiculoDto) {
    return this.pagoVehiculoService.create(autoId, dto);
  }

  @Get()
  findAll(@Param('autoId') autoId: string) {
    return this.pagoVehiculoService.findAll(autoId);
  }

  @Get(':id')
  findOne(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.pagoVehiculoService.findOne(autoId, id);
  }

  @Patch(':id')
  update(
    @Param('autoId') autoId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePagoVehiculoDto,
  ) {
    return this.pagoVehiculoService.update(autoId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.pagoVehiculoService.remove(autoId, id);
  }
}
